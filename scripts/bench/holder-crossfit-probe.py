"""Read-only original-solid cross-fit audit; no runtime or CAD modifications.

Run with .venv-cad/bin/python scripts/bench/holder-crossfit-probe.py.
Checks the corrected stem-aligned poses at existing and shoulder-adjusted heights.
This is not an exhaustive search for alternative support arrangements.
"""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'cad'))
import numpy as np
from OCP.BRepClass3d import BRepClass3d_SolidClassifier
from OCP.STEPControl import STEPControl_Reader
from OCP.TopAbs import TopAbs_IN
from OCP.gp import gp_Pnt
from wheel_contact_probe import (
    BRepCheck_Analyzer, ROOT, SHA, contact, load_source, shape_at,
)


def main():
    out = ROOT / 'artifacts/bench-flip'
    out.mkdir(parents=True, exist_ok=True)
    doc, records, shapes, definitions = load_source()
    plate = next(oid for oid, r in records.items()
                 if r['definitionId'] == 'd_0_1_1_195')
    manifest = json.loads((ROOT / 'assets/source-manifest/holder.json').read_text())
    report = {
        'sourceSha256': SHA,
        'plateId': plate,
        'coordinateFrame': 'station-local Y-up mm',
        'limitations': [
            'Mainplate-only nominal solid check, not full assembly certification.',
            'Fixed corrected stem alignment; existing and shoulder-adjusted heights only.',
            'Support witnesses do not establish a valid seat when overlap is positive.',
        ],
        'rows': [],
        'complete': False,
    }
    # Source X -90 degrees followed by world Y +90 degrees, exactly.
    holder_matrix = np.array([
        [0, -1, 0, 0], [0, 0, 1, 0], [-1, 0, 0, 0], [0, 0, 0, 1],
    ])
    for name, shoulder in [('movement', 12.8), ('dial', 13.7)]:
        path = ROOT / 'assets/source-originals/holder' / f'{name}.stp'
        sha = hashlib.sha256(path.read_bytes()).hexdigest()
        assert sha == next(f['sha256'] for f in manifest['files']
                           if f['path'].endswith(f'/{name}.stp'))
        reader = STEPControl_Reader()
        reader.ReadFile(str(path))
        reader.TransferRoots()
        holder = shape_at(reader.OneShape(), holder_matrix)
        for side, sign, original_seat, offset in [
            ('bridge', 1, 12.2, -.6), ('dial', -1, 16.3, 2.6),
        ]:
            for seat in sorted({original_seat, round(shoulder + offset, 6)}):
                pose = np.array([
                    [1, 0, 0, 0], [0, 0, -sign, seat],
                    [0, sign, 0, 0], [0, 0, 0, 1],
                ])
                posed = shape_at(shapes[plate], pose)
                measure, _ = contact(posed, holder)
                supports = 0
                for x in range(-16, 17):
                    for z in range(-16, 17):
                        if all(BRepClass3d_SolidClassifier(
                            shape, gp_Pnt(x, y, z), 1e-7,
                        ).State() == TopAbs_IN for shape, y in [
                            (holder, shoulder - .0001),
                            (posed, shoulder + .0001),
                        ]):
                            supports += 1
                row = {
                    'holder': name, 'holderSha256': sha, 'side': side,
                    'seat': seat, 'shoulder': shoulder,
                    'supportWitnessCount': supports,
                    'plateValid': BRepCheck_Analyzer(posed).IsValid(),
                    'holderValid': BRepCheck_Analyzer(holder).IsValid(),
                    **measure,
                }
                assert row['plateValid'] and row['holderValid'] and row['commonValid']
                if (name, side) in [('movement', 'bridge'), ('dial', 'dial')]:
                    assert measure['commonVolumeMm3'] < 1e-8
                    assert measure['distanceMm'] < 1e-7 and supports >= 3
                report['rows'].append(row)
                print(name, side, seat, 'overlap mm3', measure['commonVolumeMm3'], flush=True)
                (out / 'crossfit.json').write_text(json.dumps(report, indent=2) + '\n')
    report['complete'] = True
    (out / 'crossfit.json').write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()
