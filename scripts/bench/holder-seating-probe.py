"""Read-only nominal seating audit of original STEP solids, in station-local Y-up mm."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'cad'))
import hashlib
import json
import numpy as np
from OCP.STEPControl import STEPControl_Reader
from OCP.BRepClass3d import BRepClass3d_SolidClassifier
from OCP.TopAbs import TopAbs_IN
from OCP.gp import gp_Pnt
from wheel_contact_probe import load_source, shape_at, contact, witnesses, BRepCheck_Analyzer, SHA, ROOT

out = ROOT / 'artifacts/holder-fit'
out.mkdir(parents=True, exist_ok=True)
doc, records, shapes, definitions = load_source()
plate = next(oid for oid, r in records.items() if r['definitionId'] == 'd_0_1_1_195')
layout = json.loads((ROOT / 'assets/authored/atelier-layout.json').read_text())
manifest = json.loads((ROOT / 'assets/source-manifest/holder.json').read_text())
report = {'sourceSha256': SHA, 'plateId': plate, 'coordinateFrame': 'station-local Y-up mm',
          'stations': [], 'limitations': ['Static original-solid evidence, not tolerance or holding certification.',
          'This probe measures the mainplate; crown solids and all rendered underside surfaces have separate audits.']}
for st, name, shoulder in zip(layout['stations'], ['movement', 'dial'], [12.8, 13.7]):
    path = ROOT / 'assets/source-originals/holder' / (name + '.stp')
    sha = hashlib.sha256(path.read_bytes()).hexdigest()
    assert sha == next(f['sha256'] for f in manifest['files'] if f['path'].endswith('/' + name + '.stp'))
    reader = STEPControl_Reader(); reader.ReadFile(str(path)); reader.TransferRoots()
    z_up = np.array([[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]])
    a = np.deg2rad(st['holderRotationY']); c, s = np.cos(a), np.sin(a)
    yaw = np.array([[c,0,s,0],[0,1,0,0],[-s,0,c,0],[0,0,0,1]])
    holder = shape_at(reader.OneShape(), yaw @ z_up)
    sign = 1 if st['id'] == 'bridge' else -1
    pose = np.array([[1,0,0,0],[0,0,-sign,st['seat']],[0,sign,0,0],[0,0,0,1]])
    posed = shape_at(shapes[plate], pose)
    measure, common = contact(posed, holder)
    supports = []
    # A support witness has holder immediately below and mainplate immediately above
    # the documented seating plane. Grid samples are evidence, not full contact area.
    for x in np.arange(-16, 17, 1):
        for z in np.arange(-16, 17, 1):
            if all(BRepClass3d_SolidClassifier(sh, gp_Pnt(float(x), y, float(z)), 1e-7).State() == TopAbs_IN
                   for sh, y in [(holder, shoulder - .0001), (posed, shoulder + .0001)]):
                supports.append([float(x), shoulder, float(z)])
    row = {'station': st['id'], 'holderSha256': sha, 'holderRotationY': st['holderRotationY'],
           'seat': st['seat'], 'shoulderY': shoulder,
           'plateValid': BRepCheck_Analyzer(posed).IsValid(),
           'holderValid': BRepCheck_Analyzer(holder).IsValid(), 'supportWitnesses': supports,
           **measure, 'interiorWitnesses': witnesses(common, posed, holder)}
    assert len(supports) >= 3, 'No distributed plate seating evidence'
    assert row['plateValid'] and row['holderValid'] and row['commonValid']
    assert measure['commonVolumeMm3'] < 1e-8
    assert measure['distanceMm'] < 1e-7
    report['stations'].append(row)
    print(st['id'], 'supports', len(supports), 'common mm3', measure['commonVolumeMm3'], flush=True)
    (out / 'seating-solids.json').write_text(json.dumps(report, indent=2) + '\n')
report['complete'] = True
(out / 'seating-solids.json').write_text(json.dumps(report, indent=2) + '\n')
