#!/usr/bin/env python3
"""Audit original hand axes/10:10 assembly using STEP analytic evidence + mesh cache.
Run: .venv-cad/bin/python scripts/cad/hand_pose_probe.py
No source, cached mesh, or occurrence matrices are modified.
"""
from pathlib import Path
import hashlib
import json
import math
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SHA = 'f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
C = 'p_0_1_1_1__0_1_1_1_2__0_1_1_22_'
S = 'p_0_1_1_1__0_1_1_1_1__0_1_1_2_'
CACHE = ROOT / 'artifacts/cad/definition-cache/f34148903818-0.015-0.25'


def probe():
    assert hashlib.sha256((ROOT/'assets/source-originals/ml01-zweigesicht.stp').read_bytes()).hexdigest() == SHA
    cfg = json.loads((ROOT/'assets/authored/dial-configurations.json').read_text())
    source_fit = json.loads((ROOT/'artifacts/dial-cad/source-fit.json').read_text())
    assert source_fit['sourceSha256'] == SHA
    fit = source_fit['occurrences']
    manifest = json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text())
    instances = {i['id']: i for i in manifest['instances']}
    rows = [(face, style['id'], role, leaf) for face in ['central', 'small']
            for style in cfg['faces'][face]['styles'] for role, leaf in style['handLeafIds'].items()]
    # Robust before or after the reviewed Lance configuration is exposed by the UI.
    for role, suffix in [('hour','14'), ('minute','18'), ('seconds','9')]:
        if not any(row[3] == C+suffix for row in rows):
            rows.append(('central', 'lance', role, C+suffix))
    assert len(rows) == 15 and len({r[3] for r in rows}) == 15
    records = []
    for face, style, role, leaf in rows:
        rec = fit[leaf]
        radius = ({'hour':.9,'minute':.7,'seconds':.5} if face == 'central'
                  else {'hour':.495,'minute':.345})[role]
        bores = [c for c in rec['cylinders'] if abs(c['radiusMm']-radius)<1e-7 and abs(c['axisWorld'][2])>.99999999]
        assert bores, leaf
        center = np.array(bores[0]['originWorldMm'])
        matrix = np.array(instances[leaf]['worldTransform'])
        local_bore = (np.linalg.inv(matrix) @ np.r_[center, 1])[:3]
        mesh = np.load(CACHE/(instances[leaf]['definitionId']+'.npz'))
        vertices = mesh['vertices']
        radii = np.linalg.norm(vertices[:,:2]-local_bore[:2], axis=1)
        far = np.unique(vertices[radii > radii.max()-1e-6], axis=0)
        tip = far.mean(0)
        local_direction = np.array([0.,1.,0.] if role == 'seconds' else [1.,0.,0.])
        actual_local_direction = tip-local_bore
        actual_local_direction[2] = 0
        actual_local_direction /= np.linalg.norm(actual_local_direction)
        assert np.linalg.norm(actual_local_direction-local_direction)<1e-8, leaf
        direction = matrix[:3,:3] @ local_direction
        assert abs(direction[2])<1e-8
        angle = {'hour':305, 'minute':60, 'seconds':0}[role]
        radians = math.radians(angle)
        target = np.array([math.sin(radians), math.cos(radians)*(1 if face=='central' else -1), 0])
        delta = math.atan2(target[1],target[0])-math.atan2(direction[1],direction[0])
        delta = (delta+math.pi)%(2*math.pi)-math.pi
        if face == 'central':
            support = C+{'hour':'22__0_1_1_33_1', 'minute':'24__0_1_1_37_1', 'seconds':'25__0_1_1_40_1'}[role]
        else:
            support = S+({'hour':'26__0_1_1_20_2','minute':'20__0_1_1_15_2'} if style=='broad-lance'
                         else {'hour':'16__0_1_1_10_2','minute':'5__0_1_1_6_2'})[role]
        seat_radius = radius+.005
        seats = [c for c in fit[support]['cylinders'] if abs(c['radiusMm']-seat_radius)<1e-7 and abs(c['axisWorld'][2])>.99999999]
        assert seats and fit[support]['brepValid'], support
        axle = np.array(cfg['faces'][face]['axleWorldXYMm'])
        assert all(np.linalg.norm(np.array(seat['originWorldMm'][:2])-axle)<1e-8 for seat in seats)
        overlap = max(min(b['faceZRangeMm'][1], s['faceZRangeMm'][1])-max(b['faceZRangeMm'][0],s['faceZRangeMm'][0]) for b in bores for s in seats)
        shift = np.r_[axle-center[:2],0]
        rotation = np.array([[math.cos(delta),-math.sin(delta),0,0],[math.sin(delta),math.cos(delta),0,0],[0,0,1,0],[0,0,0,1]])
        to_center = np.eye(4);to_center[:2,3] = -center[:2]
        to_axle = np.eye(4);to_axle[:2,3] = axle
        fitted = to_axle @ rotation @ to_center @ matrix
        assert np.linalg.norm((fitted @ np.r_[local_bore,1])[:3]-np.r_[axle,center[2]])<1e-8
        assert np.linalg.norm(fitted[:3,:3] @ local_direction-target)<1e-8
        assert np.max(np.abs((np.c_[vertices,np.ones(len(vertices))] @ fitted.T)[:,2]-(np.c_[vertices,np.ones(len(vertices))] @ matrix.T)[:,2]))<1e-8
        assert rec['brepValid'] and overlap>.1, leaf
        records.append(dict(face=face,style=style,role=role,leafId=leaf,definitionId=rec['definitionId'],brepValid=rec['brepValid'],boreRadiusMm=radius,boreLocalMm=local_bore.tolist(),boreAxisWorldOriginMm=center.tolist(),boreFaceZRangesMm=[b['faceZRangeMm'] for b in bores],localPointingDirection=local_direction.tolist(),tipLandmarkLocalMm=tip.tolist(),tipLandmarkWorldMm=(matrix@np.r_[tip,1])[:3].tolist(),tipLandmarkVertexCount=len(far),maxTipRadiusMm=float(radii.max()),sourceWorldPointingDirection=direction.tolist(),targetClockAngleDeg=angle,targetWorldPointingDirection=target.tolist(),worldZRotationDeltaDeg=math.degrees(delta),assemblyWorldTranslationMm=shift.tolist(),supportLeafId=support,supportSeatRadiusMm=seat_radius,supportSeatZRangesMm=[s['faceZRangeMm'] for s in seats],maximumAxialSeatOverlapMm=overlap,fittedWorldTransform=fitted.tolist()))
    assert all(np.linalg.norm(r['assemblyWorldTranslationMm'])<1e-8 or (r['face'],r['style'],r['role'])==('central','lance','seconds') for r in records)
    report = dict(sourceSha256=SHA,method='Original STEP analytic bore axes and axial seat ranges from source-fit.json; inverse source occurrence matrix gives local bore. Tip landmark averages original cached-mesh vertices within 1e-6 mm of greatest planar distance from that bore. All 15 actual tips independently agree within 1e-8 with +X hours/minutes or +Y seconds; no bounding-box center is used.',displayTime='10:10:00; hour=305 degrees clockwise from 12, minute=60, seconds=0',cameraBasis='central up +Y and normal +Z; small up -Y and normal -Z; screen right +X for both',records=records,checks={'validAnalyticBores':15,'validSupportFits':15,'verifiedOriginalTipAxes':15,'fittedBoresAtArbors':15,'fittedDirectionsAt101000':15,'unchangedVertexWorldZ':15,'onlyCentralLanceSecondsNeedsTranslation':True},limits='Original radii and axial overlaps support this visual assembly, not manufacturing or collision certification. C9 translation is a fitted-only assembly correction; source occurrences remain unchanged.')
    out = ROOT/'artifacts/dial-time';out.mkdir(parents=True,exist_ok=True)
    (out/'hand-pose-source-review.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report['checks'],indent=2))
    return report


if __name__ == '__main__':
    probe()
