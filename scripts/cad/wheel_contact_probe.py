#!/usr/bin/env python3
"""Read-only original-solid wheel audit; all derived evidence stays local.

Run with .venv-cad/bin/python scripts/cad/wheel_contact_probe.py.
Names select a survey, not a certified kinematic graph. No source is repaired.
"""
from __future__ import annotations

import hashlib
import argparse
import itertools
import json
import re

import numpy as np
from OCP.BRepAlgoAPI import BRepAlgoAPI_Common
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepClass3d import BRepClass3d_SolidClassifier
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeVertex
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.TopAbs import TopAbs_SOLID, TopAbs_SHELL, TopAbs_IN
from OCP.TopExp import TopExp_Explorer
from OCP.gp import gp_Pnt
from OCP.XCAFDoc import XCAFDoc_ShapeTool

from explode_probe import ROOT, SHA, PREFIX, shape_at
from export_assembly import bbox, tessellate
from cad_probe import load_xcaf, matrix

OUT = ROOT / 'artifacts/wheel-contact'
VOLUME_THRESHOLD = 1e-8  # Reporting threshold, not a physical tolerance.


def label_at(doc, entry):
    label = TDF_Label()
    TDF_Tool.Label_s(doc.GetData(), entry, label, False)
    if label.IsNull():
        raise ValueError(f'Missing original label: {entry}')
    return label


def count_solids(shape):
    exp = TopExp_Explorer(shape, TopAbs_SOLID)
    n = 0
    while exp.More():
        n += 1
        exp.Next()
    return n


def contact(a, b):
    common = BRepAlgoAPI_Common(a, b)
    common.Build()
    if not common.IsDone():
        raise RuntimeError('Original BRep Boolean failed')
    result = common.Shape()
    props = GProp_GProps()
    BRepGProp.VolumeProperties_s(result, props)
    distance = BRepExtrema_DistShapeShape(a, b)
    distance.Perform()
    if not distance.IsDone():
        raise RuntimeError('Original BRep distance failed')
    bounds = bbox(result)
    integral = props.Mass()
    solid_volume = 0.
    integration_errors = []
    exp = TopExp_Explorer(result, TopAbs_SOLID)
    while exp.More():
        props = GProp_GProps()
        integration_errors.append(BRepGProp.VolumeProperties_s(exp.Current(), props, 1e-9, True, False))
        solid_volume += props.Mass()
        exp.Next()
    return {'commonVolumeMm3': solid_volume, 'rawVolumeIntegralMm3': integral,
            'commonSolidCount': count_solids(result),
            'adaptiveIntegrationRelativeErrorEstimates': integration_errors,
            'commonValid': BRepCheck_Analyzer(result).IsValid(),
            'distanceMm': distance.Value(),
            'commonBoundsWorldMm': None if bounds is None else bounds.tolist()}, result


def load_source(all_leaves=False):
    source = ROOT / 'assets/source-originals/ml01-zweigesicht.stp'
    assert hashlib.sha256(source.read_bytes()).hexdigest() == SHA
    manifest = json.loads((ROOT / 'explorer/public/models/assembly-manifest.json').read_text())
    assert manifest['source']['sha256'] == SHA
    doc, tool = load_xcaf(source)
    records, shapes, definitions = {}, {}, {}
    for instance in manifest['instances']:
        if instance['isAssembly'] or (not all_leaves and not instance['id'].startswith(PREFIX)):
            continue
        did = instance['definitionId']
        if did not in definitions:
            definitions[did] = XCAFDoc_ShapeTool.GetShape_s(label_at(doc, did[2:].replace('_', ':')))
        world = np.eye(4)
        for entry in instance['sourceInstanceId'].split('/'):
            world = world @ np.array(matrix(XCAFDoc_ShapeTool.GetLocation_s(label_at(doc, entry))))
        error = float(np.max(np.abs(world - instance['worldTransform'])))
        assert error < 1e-10, (instance['id'], error)
        records[instance['id']] = {k: instance[k] for k in [
            'id', 'sourceInstanceId', 'definitionId', 'name', 'parentId', 'localTransform', 'worldTransform']}
        records[instance['id']]['freshSourceMatrixMaxError'] = error
        records[instance['id']]['meshBoundsWorldMm'] = instance['boundsWorldMm']
        shapes[instance['id']] = shape_at(definitions[did], world)
    return doc, records, shapes, definitions


def survey():
    OUT.mkdir(parents=True, exist_ok=True)
    doc, records, shapes, definitions = load_source()
    wheels = [oid for oid, r in records.items() if re.search(r'\bz\s*\d', r['name'])
              or r['definitionId'] in ['d_0_1_1_144', 'd_0_1_1_233']]
    for oid in wheels:
        shape = shapes[oid]
        records[oid].update(boundsWorldMm=bbox(shape).tolist(),
                            valid=BRepCheck_Analyzer(shape).IsValid(), solidCount=count_solids(shape))
    report = {'sourceSha256': SHA, 'units': 'mm', 'coordinateSystem': 'original STEP world',
              'reportingVolumeThresholdMm3': VOLUME_THRESHOLD,
              'sourceMatrixChecks': {'count': len(records), 'maxError': max(
                  r['freshSourceMatrixMaxError'] for r in records.values())},
              'wheels': {oid: records[oid] for oid in wheels}, 'pairs': [],
              'limitations': ['A positive solid common is a static pose finding, not proof of a defective design.',
                              'Zero common does not certify moving engagement, tolerances or loaded contact.',
                              'AABB rejection is conservative; coaxial press fits are not tooth engagement.']}
    for a, b in itertools.combinations(wheels, 2):
        ba, bb = np.array(records[a]['boundsWorldMm']), np.array(records[b]['boundsWorldMm'])
        if np.any(ba[1] < bb[0] - 1e-7) or np.any(bb[1] < ba[0] - 1e-7):
            continue
        result, common = contact(shapes[a], shapes[b])
        result.update(a=a, b=b)
        report['pairs'].append(result)
        print(records[a]['definitionId'], records[b]['definitionId'],
              f"V={result['commonVolumeMm3']:.10g} d={result['distanceMm']:.8g}", flush=True)
        # Checkpoint each pair so an interrupted survey is explicitly incomplete.
        (OUT / 'survey.partial.json').write_text(json.dumps(report, indent=2) + '\n')
    report['complete'] = True
    report['allWheelPairCount'] = len(wheels) * (len(wheels) - 1) // 2
    report['aabbRejectedPairCount'] = report['allWheelPairCount'] - len(report['pairs'])
    (OUT / 'survey.json').write_text(json.dumps(report, indent=2) + '\n')
    (OUT / 'survey.partial.json').unlink(missing_ok=True)
    print(f"Completed {len(wheels)} wheels, {len(report['pairs'])} Boolean candidates", flush=True)


def world_mesh(record, refined=False, definitions=None):
    import trimesh
    did = record['definitionId']
    if refined:
        path = OUT / 'fine-meshes' / (did + '.npz')
        path.parent.mkdir(exist_ok=True)
        if not path.exists():
            mesh, face_count, missing, _ = tessellate(definitions[did], .002, .08)
            assert missing == 0, (did, missing)
            np.savez_compressed(path, vertices=mesh.vertices, faces=mesh.faces)
    else:
        path = ROOT / 'artifacts/cad/definition-cache/f34148903818-0.015-0.25' / (did + '.npz')
    with np.load(path, allow_pickle=False) as data:
        mesh = trimesh.Trimesh(vertices=data['vertices'], faces=data['faces'], process=False)
    mesh.apply_transform(record['worldTransform'])
    return mesh


def witnesses(common, a, b):
    """Interior-point boundary distances are lower bounds, not maximum penetration."""
    found = []
    exp = TopExp_Explorer(common, TopAbs_SOLID)
    while exp.More():
        props = GProp_GProps()
        BRepGProp.VolumeProperties_s(exp.Current(), props, 1e-9, True, False)
        point = props.CentreOfMass()
        inside = [BRepClass3d_SolidClassifier(shape, point, 1e-7).State() == TopAbs_IN
                  for shape in [a, b]]
        clearance = []
        if all(inside):
            for shape in [a, b]:
                shell_exp = TopExp_Explorer(shape, TopAbs_SHELL)
                distances = []
                while shell_exp.More():
                    distance = BRepExtrema_DistShapeShape(
                        BRepBuilderAPI_MakeVertex(point).Vertex(), shell_exp.Current())
                    distance.Perform()
                    assert distance.IsDone()
                    distances.append(distance.Value())
                    shell_exp.Next()
                clearance.append(min(distances))
        found.append({'pointWorldMm': [point.X(), point.Y(), point.Z()],
                      'insideBoth': all(inside), 'boundaryDistancesMm': clearance,
                      'commonSolidVolumeMm3': props.Mass()})
        exp.Next()
    return found


def closeup(pair, records, meshes, common):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.collections import PolyCollection
    a, b = [records[pair[key]] for key in ['a', 'b']]
    key = pair['key']
    center = np.mean(pair['commonBoundsWorldMm'], axis=0)
    extent = max(.35, np.max(np.ptp(pair['commonBoundsWorldMm'], axis=0)) * .65)
    cm, _, missing, _ = tessellate(common, .001, .06)
    assert missing == 0
    fig, axs = plt.subplots(2, 3, figsize=(12, 7), layout='constrained')
    for row, level in enumerate(['runtime', 'fine']):
        for col, axes in enumerate([[0, 1], [0, 2], [1, 2]]):
            ax = axs[row, col]
            for oid, color in [(pair['a'], '#467c9b'), (pair['b'], '#d5a54a')]:
                mesh = meshes[(oid, level)]
                points = mesh.vertices[:, axes]
                triangles = points[mesh.faces]
                mask = np.all(triangles.max(axis=1) >= center[axes] - extent, axis=1)
                mask &= np.all(triangles.min(axis=1) <= center[axes] + extent, axis=1)
                ax.add_collection(PolyCollection(triangles[mask], facecolors=color,
                                                edgecolors='none', alpha=.3))
            ax.add_collection(PolyCollection(cm.vertices[:, axes][cm.faces],
                                            facecolors='#c52839', edgecolors='none'))
            ax.set(xlim=(center[axes[0]] - extent, center[axes[0]] + extent),
                   ylim=(center[axes[1]] - extent, center[axes[1]] + extent), aspect='equal',
                   xlabel='XYZ'[axes[0]] + ' (mm)', ylabel='XYZ'[axes[1]] + ' (mm)',
                   title=f"{level}: {''.join('XYZ'[i] for i in axes)} orthographic")
            ax.grid(alpha=.15)
    fig.suptitle(f"{key}: blue {a['name']} / gold {b['name']}\n"
                 f"Red = original-solid common {pair['commonVolumeMm3']:.9g} mm³; "
                 "isolated diagnostic projections, not a clearance certificate", fontsize=11)
    fig.savefig(OUT / (key + '.png'), dpi=160)
    plt.close(fig)


def details():
    report = json.loads((OUT / 'survey.json').read_text())
    doc, records, shapes, definitions = load_source()
    meshes = {}
    findings = []
    for pair in report['pairs']:
        if pair['commonVolumeMm3'] <= VOLUME_THRESHOLD:
            continue
        a, b = [records[pair[key]] for key in ['a', 'b']]
        # d144 is an open shell; volume integrals over it are not solid evidence.
        if not all(count_solids(shapes[r['id']]) for r in [a, b]):
            continue
        key = '-'.join(r['definitionId'].split('_')[-1] for r in [a, b])
        measured, common = contact(shapes[a['id']], shapes[b['id']])
        assert abs(measured['rawVolumeIntegralMm3'] - pair['rawVolumeIntegralMm3' if
                   'rawVolumeIntegralMm3' in pair else 'commonVolumeMm3']) < 1e-8, (key, measured, pair)
        delta = np.array(a['worldTransform'])[:2, 3] - np.array(b['worldTransform'])[:2, 3]
        finding = {**pair, **measured, 'key': key,
                   'classification': 'coaxial-joint-not-tooth-contact' if np.linalg.norm(delta) < 1e-7
                   else 'source-pose-solid-penetration',
                   'witnesses': witnesses(common, shapes[a['id']], shapes[b['id']])}
        for r in [a, b]:
            for level in ['runtime', 'fine']:
                if (r['id'], level) not in meshes:
                    meshes[(r['id'], level)] = world_mesh(r, level == 'fine', definitions)
        from matplotlib.path import Path as PolygonPath
        finding['meshWitnessChecks'] = []
        for witness in finding['witnesses']:
            if not witness['insideBoth']:
                continue
            point = np.array(witness['pointWorldMm'])
            check = {'pointWorldMm': point.tolist()}
            for level in ['runtime', 'fine']:
                check[level] = []
                for r in [a, b]:
                    inside = False
                    for loop in section_loops(meshes[(r['id'], level)], point[2]):
                        inside ^= bool(PolygonPath(loop[:, :2]).contains_point(point[:2]))
                    check[level].append(inside)
            finding['meshWitnessChecks'].append(check)
        closeup(finding, records, meshes, common)
        findings.append(finding)
        (OUT / 'details.partial.json').write_text(json.dumps(findings, indent=2) + '\n')
        print(key, finding['classification'], 'interior witnesses',
              sum(w['insideBoth'] for w in finding['witnesses']), flush=True)
    (OUT / 'details.json').write_text(json.dumps(findings, indent=2) + '\n')
    (OUT / 'details.partial.json').unlink(missing_ok=True)


def phase_study(keys):
    """Propose isolated-pair phases using fine section samples; verify in BRep.

    These are diagnostic candidates ONLY. They never enter runtime placements.
    """
    from matplotlib.path import Path as PolygonPath
    doc, records, shapes, definitions = load_source()
    findings = json.loads((OUT / 'details.json').read_text())
    results = []

    def inside(points, loops):
        mask = np.zeros(len(points), dtype=bool)
        for loop in loops:
            mask ^= PolygonPath(loop[:, :2]).contains_points(points)
        return mask

    for finding in findings:
        if finding['key'] not in keys:
            continue
        if finding['classification'] != 'source-pose-solid-penetration':
            continue
        a, b = [records[finding[key]] for key in ['a', 'b']]
        if any(abs(np.array(r['worldTransform'])[2, 2]) < .99 for r in [a, b]):
            results.append({'key': finding['key'], 'status': 'nonparallel-axes-not-section-swept'})
            continue
        # Change only the smaller tooth-count member in an isolated diagnostic.
        counts = [int(re.search(r'\bz\s*(\d+)', r['name']).group(1)) for r in [a, b]]
        fixed, moved = (a, b) if counts[1] <= counts[0] else (b, a)
        teeth = min(counts)
        z = np.mean(finding['commonBoundsWorldMm'], axis=0)[2]
        loops = []
        for r in [fixed, moved]:
            mesh = world_mesh(r, True, definitions)
            loops.append(section_loops(mesh, z))
        origin = np.array(moved['worldTransform'])[:2, 3]
        fixed_points, moved_points = [np.vstack(p)[:, :2] for p in loops]
        radius = np.linalg.norm(moved_points - origin, axis=1).max()
        lo = np.maximum(fixed_points.min(axis=0), origin - radius) - .01
        hi = np.minimum(fixed_points.max(axis=0), origin + radius) + .01
        step = .004
        grid = np.stack(np.meshgrid(np.arange(lo[0], hi[0], step),
                                   np.arange(lo[1], hi[1], step)), axis=-1).reshape(-1, 2)
        grid = grid[inside(grid, loops[0])]
        angles = np.linspace(-180 / teeth, 180 / teeth, 145)
        samples = []
        for angle in angles:
            c, s = np.cos(np.deg2rad(angle)), np.sin(np.deg2rad(angle))
            inverse_points = (grid - origin) @ np.array([[c, -s], [s, c]]) + origin
            samples.append(int(inside(inverse_points, loops[1]).sum()))
        # Prefer middle of the widest zero run; otherwise the sampled minimum.
        zero_runs = []
        for _, group in itertools.groupby(enumerate(samples), key=lambda x: x[1] == 0):
            run = list(group)
            if run[0][1] == 0:
                zero_runs.append(run)
        if zero_runs:
            run = max(zero_runs, key=len)
            index = run[len(run) // 2][0]
        else:
            index = int(np.argmin(samples))
        angle = float(angles[index])
        c, s = np.cos(np.deg2rad(angle)), np.sin(np.deg2rad(angle))
        rotation = np.eye(4)
        rotation[:2, :2] = [[c, -s], [s, c]]
        rotation[:2, 3] = origin - rotation[:2, :2] @ origin
        candidate = shape_at(shapes[moved['id']], rotation)
        measured, _ = contact(shapes[fixed['id']], candidate)
        result = {'key': finding['key'], 'status': 'diagnostic-only',
                  'fixed': fixed['id'], 'moved': moved['id'], 'worldZAngleDegrees': angle,
                  'worldPivotXYMm': origin.tolist(), 'worldPremultiplyMatrix': rotation.tolist(),
                  'sectionZMm': float(z), 'sampleGridStepMm': step,
                  'sampleAnglesDegrees': angles.tolist(),
                  'sampleCommonAreasMm2': (np.array(samples) * step * step).tolist(),
                  'beforeCommonVolumeMm3': finding['commonVolumeMm3'], 'candidate': measured,
                  'limitations': 'Single pair only; packets, other contacts, clicks and loaded motion not approved.'}
        # The transfer wheel engages both the barrel and center pinion. This
        # concrete countercheck prevents approving a phase from one pretty pair.
        if moved['definitionId'] == 'd_0_1_1_96':
            result['otherToothNeighbors'] = []
            for neighbor in findings:
                if moved['id'] not in [neighbor['a'], neighbor['b']] or neighbor['key'] == finding['key']:
                    continue
                other = neighbor['b'] if neighbor['a'] == moved['id'] else neighbor['a']
                after, _ = contact(candidate, shapes[other])
                result['otherToothNeighbors'].append({'key': neighbor['key'],
                    'beforeCommonVolumeMm3': neighbor['commonVolumeMm3'], 'candidate': after})
        results.append(result)
        (OUT / 'phase-study.partial.json').write_text(json.dumps(results, indent=2) + '\n')
        print(finding['key'], 'angle', angle, 'before', finding['commonVolumeMm3'],
              'candidate', measured['commonVolumeMm3'], flush=True)
    (OUT / 'phase-study.json').write_text(json.dumps(results, indent=2) + '\n')
    (OUT / 'phase-study.partial.json').unlink(missing_ok=True)


def section_loops(mesh, z):
    """Join planar triangle intersections without optional trimesh dependencies."""
    import trimesh
    lines = trimesh.intersections.mesh_plane(mesh, [0, 0, 1], [0, 0, z])
    points, inverse = np.unique(np.round(lines.reshape(-1, 3), 7), axis=0, return_inverse=True)
    edges = {tuple(sorted(e)) for e in inverse.reshape(-1, 2) if e[0] != e[1]}
    adjacency = {}
    for a, b in edges:
        adjacency.setdefault(a, set()).add(b)
        adjacency.setdefault(b, set()).add(a)
    assert all(len(v) == 2 for v in adjacency.values()), 'Open or branching mesh section'
    loops = []
    while edges:
        a, b = next(iter(edges))
        path = [a, b]
        edges.remove(tuple(sorted((a, b))))
        while b != path[0]:
            c = next(v for v in adjacency[b] if v != a)
            edges.remove(tuple(sorted((b, c))))
            path.append(c)
            a, b = b, c
        loops.append(points[path])
    return loops


def candidate_review():
    doc, records, shapes, definitions = load_source(all_leaves=True)
    oid = PREFIX + '4'
    rotation = np.eye(4)
    angle = np.deg2rad(6.25)
    rotation[:2, :2] = [[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]]
    source = np.array(records[oid]['worldTransform'])
    corrected = source @ rotation
    candidate = shape_at(definitions[records[oid]['definitionId']], corrected)
    bounds = np.stack([np.minimum(bbox(candidate)[0], bbox(shapes[oid])[0]),
                       np.maximum(bbox(candidate)[1], bbox(shapes[oid])[1])])
    result = {'sourceSha256': SHA, 'id': oid, 'definitionId': records[oid]['definitionId'],
              'sourceMatrix': source.tolist(), 'candidateMatrix': corrected.tolist(),
              'localZAngleDegrees': 6.25, 'localPivotMm': [0, 0, 0],
              'aabbPaddingMm': .05, 'allOtherSourceLeaves': len(records) - 1,
              'pairs': [], 'aabbRejected': [], 'unbounded': []}
    for other, record in records.items():
        if other == oid:
            continue
        cached_bounds = record['meshBoundsWorldMm']
        if cached_bounds is None:
            result['unbounded'].append(other)
            continue
        cached_bounds = np.array(cached_bounds)
        if np.any(cached_bounds[1] < bounds[0] - .05) or np.any(cached_bounds[0] > bounds[1] + .05):
            result['aabbRejected'].append(other)
            continue
        before, common = contact(shapes[oid], shapes[other])
        after, _ = contact(candidate, shapes[other])
        pair = {'other': record, 'before': before, 'after': after,
                'otherValid': BRepCheck_Analyzer(shapes[other]).IsValid(),
                'otherSolidCount': count_solids(shapes[other])}
        result['pairs'].append(pair)
        print(record['definitionId'], 'before', before['commonVolumeMm3'],
              'after', after['commonVolumeMm3'], 'distance', after['distanceMm'], flush=True)
        (OUT / 'candidate-neighbors.partial.json').write_text(json.dumps(result, indent=2) + '\n')
    (OUT / 'candidate-neighbors.json').write_text(json.dumps(result, indent=2) + '\n')
    (OUT / 'candidate-neighbors.partial.json').unlink(missing_ok=True)


def comparison_views():
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    review = json.loads((OUT / 'candidate-neighbors.json').read_text())
    survey = json.loads((OUT / 'survey.json').read_text())
    details = json.loads((OUT / 'details.json').read_text())
    delta = np.array(review['candidateMatrix']) @ np.linalg.inv(review['sourceMatrix'])
    fig, axes = plt.subplots(2, 2, figsize=(11, 8), layout='constrained')
    for row, key in enumerate(['85-96', '93-96']):
        pair = next(p for p in details if p['key'] == key)
        center = np.mean(pair['commonBoundsWorldMm'], axis=0)
        extent = max(.45, np.max(np.ptp(pair['commonBoundsWorldMm'], axis=0)[:2]) * .7)
        neighbor = next(p for p in review['pairs'] if p['other']['id'] in [pair['a'], pair['b']])
        for col, after in enumerate([False, True]):
            ax = axes[row, col]
            for oid, color in [(pair['a'], '#17618d'), (pair['b'], '#ad781b')]:
                mesh = world_mesh(survey['wheels'][oid], True)
                if after and oid == review['id']:
                    mesh.apply_transform(delta)
                for loop in section_loops(mesh, center[2]):
                    ax.plot(loop[:, 0], loop[:, 1], color=color, linewidth=1.5)
            if not after:
                points = np.array([w['pointWorldMm'] for w in pair['witnesses'] if w['insideBoth']])
                ax.scatter(points[:, 0], points[:, 1], c='#c52839', s=20, zorder=5)
            measurement = neighbor['after' if after else 'before']
            ax.set(xlim=(center[0]-extent, center[0]+extent), ylim=(center[1]-extent, center[1]+extent),
                   aspect='equal', xlabel='Source X (mm)', ylabel='Source Y (mm)',
                   title=f"{key}: {'after +6.25°' if after else 'before (original phase)'}\n"
                         f"common {measurement['commonVolumeMm3']:.7g} mm³; gap {measurement['distanceMm']:.6g} mm")
            ax.grid(alpha=.2)
    fig.suptitle('Transfer-wheel phase only · same axes, teeth and axial seating\n'
                 'Fine mesh planar sections; red points verified inside both original solids. '
                 'Measurements use original BReps.', fontsize=11)
    fig.savefig(OUT / 'transfer-wheel-before-after.png', dpi=180)
    plt.close(fig)


def validate_candidate():
    import trimesh
    review = json.loads((OUT / 'candidate-neighbors.json').read_text())
    override = json.loads((ROOT / 'assets/authored/wheel-display-poses.json').read_text())
    assert override['sourceSha256'] == review['sourceSha256'] == SHA
    assert len(override['wheels']) == 1
    wheel = override['wheels'][0]
    assert (wheel['leafId'], wheel['localZDegrees'], wheel['pivotLocalMm']) == (
        review['id'], review['localZAngleDegrees'], review['localPivotMm'])
    checks = {
        'all-tested-neighbors-valid-solids': all(p['otherValid'] and p['otherSolidCount'] > 0 for p in review['pairs']),
        'no-increased-solid-intersection': all(p['after']['commonVolumeMm3'] <= p['before']['commonVolumeMm3'] + VOLUME_THRESHOLD
                                             for p in review['pairs']),
        'both-tooth-pairs-clear': all(p['after']['commonVolumeMm3'] == 0 and p['after']['distanceMm'] > .02
                                    for p in review['pairs'] if p['other']['definitionId'] in ['d_0_1_1_85', 'd_0_1_1_93']),
        'two-tooth-neighbors-tested': sum(p['other']['definitionId'] in ['d_0_1_1_85', 'd_0_1_1_93'] for p in review['pairs']) == 2,
        'complete-broad-phase-accounting': len(review['pairs']) + len(review['aabbRejected']) + len(review['unbounded']) == 364,
    }
    # The assembly's empty diamond has no BRep bounds. Check its separate,
    # hash-verified maker STL rather than silently treating it as a clear solid.
    diamond_id = PREFIX + '59__0_1_1_221_3__0_1_1_223_2'
    assert review['unbounded'] == [diamond_id]
    path = ROOT / 'explorer/public/models/diamond-c74ee2731a1f.stl'
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest == 'c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a'
    source = json.loads((ROOT / 'explorer/public/models/assembly-manifest.json').read_text())
    record = next(p for p in source['instances'] if p['id'] == diamond_id)
    mesh = trimesh.load_mesh(path, process=False)
    mesh.apply_transform(record['worldTransform'])
    wheel_record = next(p for p in source['instances'] if p['id'] == review['id'])
    wheel_mesh = world_mesh(wheel_record)
    wheel_mesh.apply_transform(np.array(review['candidateMatrix']) @ np.linalg.inv(review['sourceMatrix']))
    gaps = np.maximum(mesh.bounds[0] - wheel_mesh.bounds[1], wheel_mesh.bounds[0] - mesh.bounds[1])
    checks['recovered-diamond-disjoint'] = bool(np.any(gaps > .05))
    result = {'checks': checks, 'recoverySha256': digest, 'recoveryBoundsWorldMm': mesh.bounds.tolist(),
              'axisAlignedSeparationMm': gaps.tolist(), 'limitations': [
                  'Static endpoints only. No continuous-motion, loaded mesh, tolerance or servicing certification.',
                  'Existing d139 screw-fit penetration and d196 zero-distance contact are preserved, not certified.']}
    (OUT / 'candidate-validation.json').write_text(json.dumps(result, indent=2) + '\n')
    assert all(checks.values()), checks
    print(json.dumps(checks))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', nargs='?', default='survey', choices=['survey', 'details', 'phase', 'candidate', 'views', 'validate'])
    parser.add_argument('--pairs', nargs='+', default=['85-96'], help='Pairs to phase-sample (diagnostic only)')
    args = parser.parse_args()
    {'survey': survey, 'details': details, 'phase': lambda: phase_study(args.pairs),
     'candidate': candidate_review, 'views': comparison_views, 'validate': validate_candidate}[args.mode]()
