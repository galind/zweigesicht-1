#!/usr/bin/env python3
"""Read original STEP dial fits, without changing source or generated assets.

Run with .venv-cad/bin/python scripts/cad/dial_fit_probe.py.
Writes analytic evidence to ignored artifacts/dial-cad/source-fit.json.
"""
from __future__ import annotations
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.BRepAlgoAPI import BRepAlgoAPI_Common
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.gp import gp_Trsf
from OCP.GeomAbs import GeomAbs_Cylinder
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.TopAbs import TopAbs_FACE
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_ShapeTool

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/preflight'))
from cad_probe import load_xcaf

# Exact complete-assembly source hash; explicit to avoid accidental alternate input.
SHA = 'f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
C = 'p_0_1_1_1__0_1_1_1_2__0_1_1_22_'
S = 'p_0_1_1_1__0_1_1_1_1__0_1_1_2_'


def probe():
    source = ROOT / 'assets/source-originals/ml01-zweigesicht.stp'
    assert hashlib.sha256(source.read_bytes()).hexdigest() == SHA
    manifest = json.loads((ROOT / 'assets/generated/assembly-manifest.json').read_text())
    instances = {i['id']: i for i in manifest['instances']}
    selected = [i for i in instances.values() if not i['isAssembly'] and (
        i['id'].startswith((C, S)) or i['definitionId'] in
        {'d_0_1_1_137', 'd_0_1_1_142', 'd_0_1_1_184', 'd_0_1_1_188'})]
    doc, _tool = load_xcaf(source)
    definitions = {}
    records = {}
    ring_shapes = {}
    for instance in selected:
        did = instance['definitionId']
        if did not in definitions:
            label = TDF_Label()
            TDF_Tool.Label_s(doc.GetData(), did.removeprefix('d_').replace('_', ':'), label, False)
            shape = XCAFDoc_ShapeTool.GetShape_s(label)
            cylinders = []
            exp = TopExp_Explorer(shape, TopAbs_FACE)
            face_index = 0
            while exp.More():
                face_index += 1
                face = TopoDS.Face_s(exp.Current())
                exp.Next()
                a = BRepAdaptor_Surface(face)
                if a.GetType() != GeomAbs_Cylinder:
                    continue
                c = a.Cylinder()
                p, d = c.Location(), c.Axis().Direction()
                samples = []
                for u in np.linspace(a.FirstUParameter(), a.LastUParameter(), 25):
                    for v in [a.FirstVParameter(), a.LastVParameter()]:
                        q = a.Value(float(u), float(v))
                        samples.append([q.X(), q.Y(), q.Z(), 1])
                cylinders.append({'face': face_index, 'originLocalMm': [p.X(), p.Y(), p.Z()],
                                  'axisLocal': [d.X(), d.Y(), d.Z()], 'radiusMm': c.Radius(),
                                  'surfaceBoundarySamplesLocalMm': samples})
            definitions[did] = {'brepValid': BRepCheck_Analyzer(shape).IsValid(), 'faceCount': face_index,
                                'cylinders': cylinders}
        matrix = np.array(instance['worldTransform'])
        if instance['id'] in {S+'19', S+'28'}:
            trsf = gp_Trsf()
            trsf.SetValues(*matrix[:3].ravel().tolist())
            ring_shapes[instance['id']] = BRepBuilderAPI_Transform(shape, trsf, True).Shape()
        cylinders = []
        for c in definitions[did]['cylinders']:
            samples = np.array(c['surfaceBoundarySamplesLocalMm']) @ matrix.T
            cylinders.append({'face': c['face'], 'radiusMm': c['radiusMm'],
                'originWorldMm': (matrix @ [*c['originLocalMm'], 1])[:3].tolist(),
                'axisWorld': (matrix[:3, :3] @ c['axisLocal']).tolist(),
                'faceZRangeMm': [float(samples[:, 2].min()), float(samples[:, 2].max())]})
        records[instance['id']] = {'definitionId': did, 'name': instance['name'],
            'worldTransform': instance['worldTransform'], 'boundsWorldMm': instance['boundsWorldMm'],
            'brepValid': definitions[did]['brepValid'], 'faceCount': definitions[did]['faceCount'],
            'cylinders': cylinders}

    def coaxial(part, radius, xy):
        return [c for c in records[part]['cylinders'] if abs(c['radiusMm'] - radius) < 1e-7
                and np.linalg.norm(np.array(c['originWorldMm'][:2]) - xy) < 1e-8
                and abs(c['axisWorld'][2]) > 1 - 1e-8]

    checks = {}
    hands = [(C+'2', .7, [0, 0]), (C+'6', .9, [0, 0]), (C+'10', .5, [0, 0]),
             (C+'22__0_1_1_33_2', .9, [0, 0]), (C+'24__0_1_1_37_2', .7, [0, 0]),
             (C+'25__0_1_1_40_2', .5, [0, 0]), (S+'23', .495, [0, 7.4]),
             (S+'24', .345, [0, 7.4]),
             (S+'5__0_1_1_6_1', .345, [0, 7.4]),
             (S+'16__0_1_1_10_1', .495, [0, 7.4]),
             (S+'20__0_1_1_15_1', .345, [0, 7.4]),
             (S+'26__0_1_1_20_1', .495, [0, 7.4])]
    for part, radius, xy in hands:
        checks['bore:' + part] = bool(coaxial(part, radius, xy))
    checks['lanceSecondsActuallyOffAxis'] = not coaxial(C+'9', .5, [0, 0]) and bool(
        coaxial(C+'9', .5, [12.4254391598701, 7.08174217766239]))
    # The positive bushing-seat allowances below are source-modeled press-fit dimensions,
    # not a newly authored fit or a manufacturing tolerance certification.
    for blade, support, bore, seat, xy in [
        (C+'6', C+'22__0_1_1_33_1', .9, .905, [0, 0]),
        (C+'2', C+'24__0_1_1_37_1', .7, .705, [0, 0]),
        (C+'10', C+'25__0_1_1_40_1', .5, .505, [0, 0]),
        (S+'23', S+'16__0_1_1_10_2', .495, .5, [0, 7.4]),
        (S+'24', S+'5__0_1_1_6_2', .345, .35, [0, 7.4]),
    ]:
        blade_faces, support_faces = coaxial(blade, bore, xy), coaxial(support, seat, xy)
        checks['support:' + blade] = bool(blade_faces and support_faces and any(
            min(a['faceZRangeMm'][1], b['faceZRangeMm'][1]) -
            max(a['faceZRangeMm'][0], b['faceZRangeMm'][0]) > .1
            for a in blade_faces for b in support_faces))
    for screw in [S+'11', S+'17', S+'22']:
        axes = [c for c in records[screw]['cylinders'] if abs(c['radiusMm']-.3)<1e-7]
        checks['segmentedFixing:' + screw] = bool(axes and coaxial(S+'19', .3, axes[0]['originWorldMm'][:2]))
        checks['oldRingFixingMismatch:' + screw] = bool(axes and not coaxial(S+'1', .3, axes[0]['originWorldMm'][:2]))
    for part in [S+str(v) for v in [3,4,6,7,8,9,10,12,13,14,15,27]]:
        # Marker's pin is analytically centered at its local origin.
        pins = [c for c in records[part]['cylinders'] if abs(c['radiusMm']-.105)<1e-7]
        checks['segmentedMarker:' + part] = bool(pins and coaxial(S+'19', .1, pins[0]['originWorldMm'][:2]))
    for suffix in [3,7,8,11,12,13,15,16,17,19,20,21]:
        part = C+str(suffix)
        pins = [c for c in records[part]['cylinders'] if abs(c['radiusMm']-.1)<1e-7]
        checks['centralMarker:' + part] = len(pins) == 2 and all(
            coaxial(C+'4', .115, c['originWorldMm'][:2]) for c in pins)
    common = BRepAlgoAPI_Common(ring_shapes[S+'19'], ring_shapes[S+'28'])
    common.Build()
    props = GProp_GProps()
    BRepGProp.VolumeProperties_s(common.Shape(), props)
    enamel_overlap = props.Mass()
    checks['recordedCarrierEnamelSourceOverlap'] = common.IsDone() and 3.47 < enamel_overlap < 3.49
    d27 = next(d for d in manifest['definitions'] if d['id'] == 'd_0_1_1_27')
    checks['d27InvalidButFullyTessellated'] = (not records[C+'5']['brepValid'] and
        records[C+'5']['faceCount'] == d27['cadFaces'] and d27['missingTriangulatedFaces'] == 0
        and d27['triangles'] == 33194 and d27['degenerateTriangles'] == 0)
    result = {'sourceSha256': SHA, 'units': 'mm', 'coordinateSystem': 'unchanged STEP world',
              'checks': checks, 'occurrences': records,
              'carrierEnamelCommonVolumeMm3': enamel_overlap,
              'carrierEnamelPresentation': 'The source solids overlap and share outward Z=-5.7 mm; exact fitted-enamel depth bias is required. This is an authored coating presentation, not a manufacturing repair.'}
    out = ROOT / 'artifacts/dial-cad'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'source-fit.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'passed': sum(checks.values()), 'total': len(checks),
                      'failures': [k for k, v in checks.items() if not v]}, indent=2))
    assert all(checks.values())


if __name__ == '__main__':
    probe()
