#!/usr/bin/env python3
"""Read-only ratchet packet phase audit. Never edits source CAD or runtime poses.

Run with .venv-cad/bin/python; evidence stays in artifacts/ratchet-contact.
The existing wheel audit supplies the independently checked XCAF source loader,
closed-solid measurements and source/fine meshes. Static endpoints only.
"""
import argparse
import json
import hashlib
import numpy as np
from wheel_contact_probe import (
    ROOT, SHA, PREFIX, load_source, shape_at, bbox, contact, count_solids,
    BRepCheck_Analyzer, world_mesh, section_loops, VOLUME_THRESHOLD,
)

OUT = ROOT / 'artifacts/ratchet-contact'
WHEEL = PREFIX + '15'
OTHER_WHEEL = PREFIX + '14'
CORE = PREFIX + '1__0_1_1_84_3'
# Opposite local Z directions; these yield one rigid +1.8° world-Z packet turn.
PHASES = {WHEEL: -1.8, CORE: 1.8}


def rotation(degrees):
    angle = np.deg2rad(degrees)
    c, s = np.cos(angle), np.sin(angle)
    result = np.eye(4)
    result[:2, :2] = [[c, -s], [s, c]]
    return result


def write(name, value):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(value, indent=2) + '\n')


def phase():
    """Fine-section sampling proposes a phase; BReps qualify its endpoint."""
    from matplotlib.path import Path as PolygonPath
    manifest = json.loads((ROOT/'explorer/public/models/assembly-manifest.json').read_text())
    records = {r['id']: r for r in manifest['instances']}
    details = json.loads((ROOT/'artifacts/wheel-contact/details.json').read_text())
    pair = next(p for p in details if p['key'] == '131-131')
    z = float(np.mean(pair['commonBoundsWorldMm'], axis=0)[2])
    loops = [section_loops(world_mesh(records[oid], True), z) for oid in [OTHER_WHEEL, WHEEL]]

    def inside(points, contours):
        mask = np.zeros(len(points), dtype=bool)
        for loop in contours:
            mask ^= PolygonPath(loop[:, :2]).contains_points(points)
        return mask

    lo = np.min(pair['commonBoundsWorldMm'], axis=0)[:2]-.15
    hi = np.max(pair['commonBoundsWorldMm'], axis=0)[:2]+.15
    step = .003
    grid = np.stack(np.meshgrid(np.arange(lo[0], hi[0], step), np.arange(lo[1], hi[1], step)), axis=-1).reshape(-1, 2)
    grid = grid[inside(grid, loops[0])]
    origin = np.array(records[WHEEL]['worldTransform'])[:2, 3]
    angles = np.linspace(-180/62, 180/62, 145)
    samples = []
    for angle in angles:
        inverse = (grid-origin) @ rotation(angle)[:2, :2]+origin
        samples.append(int(inside(inverse, loops[1]).sum()))
    write('phase.json', {'moved': WHEEL, 'sectionZMm': z, 'gridStepMm': step,
                         'worldAnglesDegrees': angles.tolist(), 'overlapSampleCounts': samples,
                         'zeroSamples': [float(a) for a, n in zip(angles, samples) if n == 0]})


def review():
    doc, records, shapes, definitions = load_source(all_leaves=True)
    matrices = {oid: np.array(records[oid]['worldTransform']) @ rotation(angle)
                for oid, angle in PHASES.items()}
    posed = {oid: shape_at(definitions[records[oid]['definitionId']], mat)
             for oid, mat in matrices.items()}
    relative_before = np.linalg.inv(records[WHEEL]['worldTransform']) @ records[CORE]['worldTransform']
    relative_after = np.linalg.inv(matrices[WHEEL]) @ matrices[CORE]
    result = {'sourceSha256': SHA, 'localPhasesDegrees': PHASES,
              'records': {oid: records[oid] for oid in [WHEEL, OTHER_WHEEL, CORE]},
              'displayMatrices': {oid: mat.tolist() for oid, mat in matrices.items()},
              'packetRelativeMatrixMaxError': float(np.max(np.abs(relative_after-relative_before))),
              'movedValidSolids': {oid: BRepCheck_Analyzer(shapes[oid]).IsValid() and count_solids(shapes[oid]) == 1
                                   for oid in PHASES},
              'allOtherLeavesPerMovedPart': len(records)-1, 'aabbPaddingMm': .05,
              'pairs': [], 'aabbRejected': [], 'unbounded': []}
    # Explicitly include the click, click spring and crown wheel, even though
    # their separation normally excludes them in the conservative broad phase.
    force = {PREFIX + s for s in ['74', '76', '80']}
    for oid in PHASES:
        bounds = np.stack([np.minimum(bbox(posed[oid])[0], bbox(shapes[oid])[0]),
                           np.maximum(bbox(posed[oid])[1], bbox(shapes[oid])[1])])
        for other, r in records.items():
            if other == oid:
                continue
            bb = r['meshBoundsWorldMm']
            if bb is None:
                result['unbounded'].append([oid, other])
                continue
            bb = np.array(bb)
            if other not in force and (np.any(bb[1] < bounds[0]-.05) or np.any(bb[0] > bounds[1]+.05)):
                result['aabbRejected'].append([oid, other])
                continue
            before, _ = contact(shapes[oid], shapes[other])
            after, _ = contact(posed[oid], posed.get(other, shapes[other]))
            result['pairs'].append({'moved': oid, 'other': r, 'before': before, 'after': after,
                                    'otherValid': BRepCheck_Analyzer(shapes[other]).IsValid(),
                                    'otherSolidCount': count_solids(shapes[other])})
            print(oid.split('_')[-1], r['definitionId'], 'volume', before['commonVolumeMm3'],
                  '->', after['commonVolumeMm3'], 'gap', after['distanceMm'], flush=True)
            write('review.partial.json', result)
    # The only unbounded assembly leaf is the previously recovered diamond.
    # Its immutable, hash-checked STL supplies the missing conservative bounds.
    import trimesh
    diamond = ROOT / 'explorer/public/models/diamond-c74ee2731a1f.stl'
    digest = hashlib.sha256(diamond.read_bytes()).hexdigest()
    assert digest == 'c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a'
    result['recoveryChecks'] = []
    for oid, other in result['unbounded']:
        assert records[other]['definitionId'] == 'd_0_1_1_225'
        mesh = trimesh.load_mesh(diamond, process=False)
        mesh.apply_transform(records[other]['worldTransform'])
        bounds = bbox(posed[oid])
        gaps = np.maximum(mesh.bounds[0]-bounds[1], bounds[0]-mesh.bounds[1])
        result['recoveryChecks'].append({'moved': oid, 'other': other, 'sha256': digest,
                                         'axisSeparationMm': gaps.tolist(), 'disjoint': bool(np.any(gaps > .05))})
    result['complete'] = True
    write('review.json', result)
    (OUT / 'review.partial.json').unlink(missing_ok=True)


def rejected():
    """Record why isolated-wheel / quarter-turn solutions are insufficient."""
    doc, records, shapes, definitions = load_source(all_leaves=True)
    results = []
    for angles in [(0, -1.8), (-.8, -.8), (0, 90), (0, 90.8), (0, 90.82), (91.1, 0)]:
        posed = {oid: shape_at(definitions[records[oid]['definitionId']],
                               np.array(records[oid]['worldTransform']) @ rotation(angle))
                 for oid, angle in zip([OTHER_WHEEL, WHEEL], angles)}
        item = {'localWheelAnglesDegrees': list(angles), 'pairs': []}
        for a, b in [(OTHER_WHEEL, WHEEL), (OTHER_WHEEL, PREFIX+'2__0_1_1_89_3'), (WHEEL, CORE)]:
            measured, _ = contact(posed[a], posed.get(b, shapes[b]))
            item['pairs'].append({'a': a, 'b': b, **measured})
        results.append(item)
        print(angles, [p['commonVolumeMm3'] for p in item['pairs']], flush=True)
    write('rejected-options.json', results)


def views():
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    report = json.loads((OUT/'review.json').read_text())
    manifest = json.loads((ROOT/'explorer/public/models/assembly-manifest.json').read_text())
    records = {r['id']: r for r in manifest['instances']}
    # Fine ratchet meshes already saved by wheel_contact_probe.py details.
    # Core mesh uses the source tessellation; exact BRep metrics are in the report.
    meshes = {oid: world_mesh(records[oid], oid != CORE) for oid in [OTHER_WHEEL, WHEEL, CORE]}
    delta = {oid: np.array(report['displayMatrices'][oid]) @ np.linalg.inv(records[oid]['worldTransform'])
             for oid in PHASES}
    fig, axes = plt.subplots(2, 2, figsize=(11, 9), layout='constrained')
    teeth = next(p for p in report['pairs'] if p['moved'] == WHEEL and p['other']['id'] == OTHER_WHEEL)
    for col, after in enumerate([False, True]):
        for row, (z, center, extent, ids) in enumerate([
            (-.835, [0, 8.1], 1.6, [OTHER_WHEEL, WHEEL]),
            (-1.12, [-6.2, 8.1], .83, [WHEEL, CORE]),
        ]):
            ax = axes[row, col]
            for oid, color in zip(ids, ['#17618d', '#ad781b']):
                mesh = meshes[oid].copy()
                if after and oid in delta:
                    mesh.apply_transform(delta[oid])
                for loop in section_loops(mesh, z):
                    ax.plot(loop[:, 0], loop[:, 1], color=color, linewidth=1.3)
            measured = teeth['after' if after else 'before']
            label = (f"Teeth: common {measured['commonVolumeMm3']:.8g} mm³; gap {measured['distanceMm']:.6g} mm"
                     if row == 0 else 'Four-lobed mounting: wheel and core retain their relative pose')
            ax.set(xlim=(center[0]-extent, center[0]+extent), ylim=(center[1]-extent, center[1]+extent),
                   aspect='equal', xlabel='Source X (mm)', ylabel='Source Y (mm)',
                   title=('After: rigid packet +1.8° world Z' if after else 'Before: original source pose')+'\n'+label)
            ax.grid(alpha=.2)
    fig.suptitle('Ratchet instance 15 + barrel II core; instance 14 remains unchanged\n'
                 'Orthographic sections at Z −0.835 / −1.12 mm. Measurements use original solids; static pose only.', fontsize=11)
    fig.savefig(OUT/'ratchet-before-after.png', dpi=180)
    plt.close(fig)


def validate():
    report = json.loads((OUT/'review.json').read_text())
    override = json.loads((ROOT/'assets/authored/wheel-display-poses.json').read_text())
    assert report['complete'] and report['sourceSha256'] == override['sourceSha256'] == SHA
    for oid, angle in PHASES.items():
        entry = next(w for w in override['wheels'] if w['leafId'] == oid)
        assert entry['localZDegrees'] == angle and entry['pivotLocalMm'] == [0, 0, 0]
    tooth = next(p for p in report['pairs'] if p['moved'] == WHEEL and p['other']['id'] == OTHER_WHEEL)
    checks = {
        'same-rigid-packet': report['packetRelativeMatrixMaxError'] < 1e-12,
        'moved-source-shapes-valid-solids': all(report['movedValidSolids'].values()),
        'teeth-clear': tooth['before']['commonVolumeMm3'] > .06 and tooth['after']['commonVolumeMm3'] == 0 and tooth['after']['distanceMm'] > .02,
        'no-increased-solid-penetration': all(p['after']['commonVolumeMm3'] <= p['before']['commonVolumeMm3']+VOLUME_THRESHOLD for p in report['pairs']),
        'all-tested-neighbors-valid-solids': all(p['otherValid'] and p['otherSolidCount'] > 0 for p in report['pairs']),
        'all-leaves-accounted-for': len(report['pairs'])+len(report['aabbRejected'])+len(report['unbounded']) == 2*364,
        'recovered-diamond-disjoint': len(report['recoveryChecks']) == 2 and all(r['disjoint'] for r in report['recoveryChecks']),
        'click-spring-crown-explicitly-tested': all(any(p['moved'] == oid and p['other']['id'] == PREFIX+s for p in report['pairs'])
                                                  for oid in PHASES for s in ['74', '76', '80']),
    }
    write('validation.json', {'checks': checks, 'limitations': [
        'Static original-solid endpoints; no spring deformation, running, torque or tolerance certification.',
        'Original source geometry, including existing contact/gaps, remains unchanged.']})
    assert all(checks.values()), checks
    print(json.dumps(checks))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['phase', 'review', 'rejected', 'views', 'validate'])
    args = parser.parse_args()
    {'phase': phase, 'review': review, 'rejected': rejected, 'views': views, 'validate': validate}[args.mode]()
