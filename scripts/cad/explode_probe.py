#!/usr/bin/env python3
"""Read-only analytic mounting audit of all original STEP movement leaves.

Run with .venv-cad/bin/python scripts/cad/explode_probe.py. Evidence is generated
under ignored artifacts/explode-cad; it is not an authored service procedure.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

import numpy as np
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepAlgoAPI import BRepAlgoAPI_Common
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.gp import gp_Trsf
from OCP.GeomAbs import GeomAbs_Cylinder, GeomAbs_Cone
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.TopAbs import TopAbs_FACE
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_ShapeTool

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/preflight'))
from cad_probe import load_xcaf

SHA = 'f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
PREFIX = 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_'
OUT = ROOT / 'artifacts/explode-cad'


def screw_review(records):
    """Measure head/shank polarity; expose seat candidates, not automatic hosts."""
    screws, checks = {}, {}
    for oid, record in records.items():
        if not record['name'].startswith('010'):
            continue
        cylinders = [s for s in record['surfaces'] if s['type'] == 'cylinder']
        head = max(cylinders, key=lambda s: s['radiusMm'])
        shank = max([s for s in cylinders if s['radiusMm'] < head['radiusMm'] - .001],
                    key=lambda s: np.linalg.norm(np.diff(s['axisEndpointsWorldMm'], axis=0)))
        axis, origin = np.array(shank['axisWorld']), np.array(shank['originWorldMm'])
        head_delta = np.mean(head['axisEndpointsWorldMm'], axis=0) - np.mean(shank['axisEndpointsWorldMm'], axis=0)
        outward = axis * (1 if np.dot(axis, head_delta) > 0 else -1)
        local = np.array(record['worldTransform'])[:3, :3].T @ outward
        candidates = []
        for candidate_id, candidate in records.items():
            if candidate_id == oid or candidate['name'].startswith(('010', '020', '030')):
                continue
            for face in candidate['surfaces']:
                if face['type'] != 'cylinder' or abs(np.dot(outward, face['axisWorld'])) < 1 - 1e-8:
                    continue
                off = float(np.linalg.norm(np.cross(outward, np.array(face['originWorldMm']) - origin)))
                if off > 1e-5 or face['radiusMm'] > head['radiusMm'] * 1.5:
                    continue
                seat_range = np.array(face['axisEndpointsWorldMm']) @ outward
                shank_range = np.array(shank['axisEndpointsWorldMm']) @ outward
                overlap = float(min(max(seat_range), max(shank_range)) - max(min(seat_range), min(shank_range)))
                if overlap < -.01:
                    continue
                candidates.append({'occurrenceId': candidate_id, 'face': face['face'], 'radiusMm': face['radiusMm'],
                    'axisResidualMm': off, 'shankAxialOverlapMm': overlap,
                    'axisEndpointsWorldMm': face['axisEndpointsWorldMm']})
        screws[oid] = {'definitionId': record['definitionId'], 'name': record['name'],
            'localOutwardDirection': local.tolist(), 'worldOutwardDirection': outward.tolist(),
            'headFace': head, 'shankFace': shank, 'headBeyondShankMm': float(np.dot(outward, head_delta)),
            'coaxialSeatCandidates': candidates, 'confidence': 'high-axis-and-head-polarity; host-selection-requires-reviewed-rule'}
        checks['head-polarity:' + oid] = bool(np.dot(outward, head_delta) > .05
            and np.linalg.norm(local - [0, 0, 1]) < 1e-8
            and abs(np.dot(head['axisWorld'], shank['axisWorld'])) > 1 - 1e-8
            and np.linalg.norm(np.cross(outward, np.array(head['originWorldMm']) - origin)) < 1e-8)
        checks['coaxial-seat:' + oid] = bool(candidates)
    expected = {PREFIX + s for s in ['54__0_1_1_194_11', '54__0_1_1_194_12', '59__0_1_1_221_7']}
    actual = {oid for oid, screw in screws.items() if abs(screw['worldOutwardDirection'][2]) < 1 - 1e-8}
    checks['all-non-z-screws-exactly-three'] = actual == expected
    checks['all-source-movement-screws-exactly-49'] = len(screws) == 49
    for suffix, direction, seat_faces in [
            ('54__0_1_1_194_11', [.4067366430758, -.9135454576426, 0], [376, 377]),
            ('54__0_1_1_194_12', [-.1391731009601, .9902680687416, 0], [382, 384]),
            ('59__0_1_1_221_7', [0, -1, 0], [61])]:
        screw = screws[PREFIX + suffix]
        checks['reviewed-axis:' + suffix] = bool(np.linalg.norm(np.array(screw['worldOutwardDirection']) - direction) < 1e-8)
        checks['reviewed-seats:' + suffix] = all(any(s['face'] == face for s in screw['coaxialSeatCandidates']) for face in seat_faces)
    result = {'sourceSha256': SHA, 'units': 'mm', 'checks': checks, 'screws': screws,
              'limitations': ['Candidates include both receiving threads and carried clearance seats; these are deliberately not auto-assigned hosts.']}
    (OUT / 'screw-directions.json').write_text(json.dumps(result, indent=2) + '\n')
    assert all(checks.values()), [k for k, v in checks.items() if not v]
    return screws, checks


def shape_at(shape, matrix):
    transform = gp_Trsf()
    transform.SetValues(*np.array(matrix)[:3].ravel().tolist())
    return BRepBuilderAPI_Transform(shape, transform, True).Shape()


def extraction_overlap(records, shapes, screws):
    samples = {}
    for suffix, host_suffix in [('54__0_1_1_194_11', '54__0_1_1_194_1'),
                               ('54__0_1_1_194_12', '54__0_1_1_194_1'),
                               ('59__0_1_1_221_7', '59__0_1_1_221_1')]:
        oid, host_id = PREFIX + suffix, PREFIX + host_suffix
        record, host = records[oid], records[host_id]
        host_shape = shape_at(shapes[host['definitionId']], host['worldTransform'])
        direction = np.array(screws[oid]['worldOutwardDirection'])
        samples[oid] = {'hostOccurrenceId': host_id, 'samples': []}
        for label, displacement in [('assembled', np.zeros(3))] + [
                (f'outward-{distance}', direction * distance) for distance in [.25, .5, 1, 1.5, 2, 3]] + [
                ('wrong-inward-.5', direction * -.5), ('wrong-world-z-.5', np.array([0, 0, .5]))]:
            matrix = np.array(record['worldTransform'])
            matrix[:3, 3] += displacement
            screw_shape = shape_at(shapes[record['definitionId']], matrix)
            common = BRepAlgoAPI_Common(host_shape, screw_shape)
            common.Build()
            props = GProp_GProps()
            BRepGProp.VolumeProperties_s(common.Shape(), props)
            samples[oid]['samples'].append({'label': label, 'worldTranslationMm': displacement.tolist(),
                'commonVolumeMm3': props.Mass(), 'booleanDone': common.IsDone()})
    result = {'sourceSha256': SHA, 'pairs': samples, 'limitations': [
        'Original simplified screw solids intersect nominal threaded holes. Positive common volumes do not establish a defective threaded fit.',
        'Discrete Boolean samples check only the named screw/host pair, not every surrounding part or continuous swept motion.']}
    (OUT / 'extraction-overlap.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


def stem_overlap(records, shapes):
    plate_id = PREFIX + '54__0_1_1_194_1'
    plate = records[plate_id]
    plate_shape = shape_at(shapes[plate['definitionId']], plate['worldTransform'])
    samples = []
    for suffix in ['5', '27', '28']:
        oid = PREFIX + suffix
        record = records[oid]
        translations = [[distance, 0, 0] for distance in [0, 1, 3, 6]]
        if suffix != '27':
            translations += [[0, 0, -distance] for distance in [.25, .5, 1, 2, 4]]
        for displacement in translations:
            matrix = np.array(record['worldTransform'])
            matrix[:3, 3] += displacement
            shape = shape_at(shapes[record['definitionId']], matrix)
            common = BRepAlgoAPI_Common(plate_shape, shape)
            common.Build()
            props = GProp_GProps()
            BRepGProp.VolumeProperties_s(common.Shape(), props)
            samples.append({'occurrenceId': oid, 'hostOccurrenceId': plate_id,
                            'worldTranslationMm': displacement, 'commonVolumeMm3': props.Mass(),
                            'booleanDone': common.IsDone()})
    (OUT / 'stem-overlap.json').write_text(json.dumps({'sourceSha256': SHA, 'samples': samples,
        'limitations': ['Discrete source BRep versus fixed main plate only; no continuous or all-part collision claim.']}, indent=2) + '\n')


def validate_manifest(records, screws):
    manifest = json.loads((ROOT / 'assets/authored/explosion.json').read_text())
    parts = {part['id']: part for part in manifest['parts']}
    checks = {'exact-source-leaf-coverage': set(parts) == set(records),
              'no-duplicate-leaf-rules': len(parts) == len(manifest['parts']),
              'same-source-hash': manifest['sourceSha256'] == SHA}
    for oid, screw in screws.items():
        checks['authored-source-axis:' + oid] = bool(oid in parts and parts[oid]['rule'] == 'release' and
            np.linalg.norm(np.array(parts[oid]['directionLocal']) - screw['localOutwardDirection']) < 1e-8)
    pins = {oid for oid, record in records.items() if record['name'].startswith('020') and any(
        abs(s['axisWorld'][2]) < 1 - 1e-8 for s in record['surfaces'])}
    checks['non-z-pin-inventory'] = (pins == {PREFIX + '7__0_1_1_108_5', PREFIX + '32__0_1_1_175_4'}
        and sum(record['name'].startswith('020') for record in records.values()) == 42)
    for oid in pins:
        host_suffix = '7__0_1_1_108_4' if oid.endswith('108_5') else '32__0_1_1_175_2'
        checks['taper-pin-remains-attached:' + oid] = (parts[oid]['rule'] == 'attached'
            and parts[oid]['distanceMm'] == 0 and parts[oid]['host'] == parts[PREFIX + host_suffix]['host'])
    (OUT / 'authored-validation.json').write_text(json.dumps({'checks': checks,
        'passed': sum(checks.values()), 'total': len(checks)}, indent=2) + '\n')
    assert all(checks.values()), [k for k, v in checks.items() if not v]
    return checks


def winding_stage_overlap(records, shapes):
    manifest_path = ROOT / 'assets/authored/explosion.json'
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    hosts = {host['id']: host for host in manifest['hosts']}
    parts = {part['id']: part for part in manifest['parts']}
    samples = []
    stage_values = [0, .2, .275, .35, .425, .5, .6, .72, .8, 1]
    pairs = [('27', '31'), ('27', '70__0_1_1_247_1'), ('27', '64__0_1_1_239_1'),
             ('5', '31'), ('28', '31'), ('5', '70__0_1_1_247_1'), ('28', '70__0_1_1_247_1'),
             ('5', '64__0_1_1_239_1'), ('28', '64__0_1_1_239_1')]

    def offset(oid, progress):
        rule = parts[oid]
        host = hosts[rule['host']]
        start, end = host['stage']
        t = np.clip((progress - start) / (end - start), 0, 1)
        frame = np.array(records[host['frameId']]['worldTransform'])
        return frame[:3, :3] @ host['directionLocal'] * host['distanceMm'] * t * t * (3 - 2 * t)

    for progress in stage_values:
        moved = {}
        for a, b in pairs:
            oid, other_id = PREFIX + a, PREFIX + b
            for part_id in [oid, other_id]:
                if part_id in moved:
                    continue
                record = records[part_id]
                shift = offset(part_id, progress)
                matrix = np.array(record['worldTransform'])
                matrix[:3, 3] += shift
                moved[part_id] = (shape_at(shapes[record['definitionId']], matrix),
                                  np.array(record['boundsWorldMm']) + shift, shift)
            shape_a, bounds_a, shift_a = moved[oid]
            shape_b, bounds_b, shift_b = moved[other_id]
            disjoint = bool(np.any(bounds_a[1] < bounds_b[0]) or np.any(bounds_b[1] < bounds_a[0]))
            volume, done = 0., True
            if not disjoint:
                common = BRepAlgoAPI_Common(shape_a, shape_b)
                common.Build()
                props = GProp_GProps()
                BRepGProp.VolumeProperties_s(common.Shape(), props)
                volume, done = props.Mass(), common.IsDone()
            samples.append({'progress': progress, 'occurrenceId': oid, 'otherOccurrenceId': other_id,
                            'worldTranslationMm': shift_a.tolist(), 'otherWorldTranslationMm': shift_b.tolist(),
                            'commonVolumeMm3': volume, 'booleanDone': done, 'boundsDisjoint': disjoint})
    result = {'sourceSha256': SHA, 'authoredSha256': hashlib.sha256(manifest_bytes).hexdigest(),
              'hostRules': [hosts[key] for key in ['stem', 'stem-gears', 'keyless', 'winding-bridge']],
              'samples': samples, 'limitations': ['Named pairs and discrete stage values only; no continuously swept or all-part certification.']}
    baselines = {(s['occurrenceId'], s['otherOccurrenceId']): max(0, s['commonVolumeMm3'])
                 for s in samples if s['progress'] == 0}
    result['checks'] = {'all-pair-booleans-completed': all(s['booleanDone'] for s in samples),
        'no-sampled-increase-above-source': all(s['commonVolumeMm3'] <=
            baselines[(s['occurrenceId'], s['otherOccurrenceId'])] + 1e-7 for s in samples)}
    (OUT / 'winding-stage-overlap.json').write_text(json.dumps(result, indent=2) + '\n')
    assert all(result['checks'].values()), result['checks']


def source_views(records, screws):
    """Orthographic source-mesh views beside analytic axes; no geometry changes."""
    os.environ.setdefault('MPLCONFIGDIR', str(OUT / 'matplotlib-cache'))
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.collections import PolyCollection
    cache = ROOT / 'artifacts/cad/definition-cache/f34148903818-0.015-0.25'
    panels = [('54__0_1_1_194_11', ['54__0_1_1_194_1'], 'Radial dial screw A', 2.4),
              ('54__0_1_1_194_12', ['54__0_1_1_194_1'], 'Radial dial screw B', 2.4),
              ('59__0_1_1_221_7', ['59__0_1_1_221_1'], 'Balance-stud clamp', 1.6),
              ('7__0_1_1_108_5', ['7__0_1_1_108_4'], 'Hairspring taper pin — retained', 1.1),
              ('32__0_1_1_175_4', ['32__0_1_1_175_2'], 'Stop-spring taper pin — retained', 1.2),
              ('27', ['5', '28', '54__0_1_1_194_1', '64__0_1_1_239_1'], 'Stem packet — source mounting', 8)]
    fig, axes = plt.subplots(3, 2, figsize=(12, 12))
    for ax, (suffix, host_suffixes, title, extent) in zip(axes.flat, panels):
        oid = PREFIX + suffix
        record = records[oid]
        if oid in screws:
            surface = screws[oid]['shankFace']
            direction = np.array(screws[oid]['worldOutwardDirection'])
        else:
            surface = record['surfaces'][0]
            direction = np.array(surface['axisWorld'])
        center = np.mean(surface['axisEndpointsWorldMm'], axis=0)
        vertical = np.array([0, 0, 1.])
        depth = np.cross(direction, vertical)
        for target, color, alpha in [(PREFIX + h, '#c9a98e', .035) for h in host_suffixes] + [(oid, '#344c68', .75)]:
            part = records[target]
            mesh = np.load(cache / f"{part['definitionId']}.npz")
            matrix = np.array(part['worldTransform'])
            vertices = mesh['vertices'] @ matrix[:3, :3].T + matrix[:3, 3] - center
            points = np.stack([vertices @ direction, vertices @ vertical], axis=1)
            faces = mesh['faces']
            triangles = points[faces]
            mask = (np.max(triangles[:, :, 0], axis=1) > -extent) & (np.min(triangles[:, :, 0], axis=1) < extent)
            mask &= (np.max(triangles[:, :, 1], axis=1) > -extent / 2) & (np.min(triangles[:, :, 1], axis=1) < extent / 2)
            faces, triangles = faces[mask], triangles[mask]
            order = np.argsort(np.mean(vertices[faces] @ depth, axis=1))
            ax.add_collection(PolyCollection(triangles[order], facecolors=color, edgecolors='none', alpha=alpha))
        ax.axhline(0, color='#418bb3', linestyle=':', linewidth=.7)
        ax.annotate('local +Z', xy=(extent * .83, -extent * .32), xytext=(extent * .12, -extent * .32),
                    arrowprops={'arrowstyle': '->', 'color': '#bd533e'}, color='#bd533e', fontsize=8)
        ax.set(xlim=(-extent, extent), ylim=(-extent / 2, extent / 2), aspect='equal', title=title,
               xlabel='Along original mounted axis (mm)', ylabel='World Z relative to axis (mm)')
        ax.text(.01, 1.02, suffix, transform=ax.transAxes, fontsize=7, color='#555555')
    fig.suptitle('Unchanged STEP meshes + transformed analytic axes\nHost translucency exposes seated geometry; arrows are not service instructions', fontsize=12)
    fig.tight_layout(rect=(0, 0, 1, .95))
    fig.savefig(OUT / 'source-mounting-contact.png', dpi=160)
    plt.close(fig)


def probe():
    source = ROOT / 'assets/source-originals/ml01-zweigesicht.stp'
    assert hashlib.sha256(source.read_bytes()).hexdigest() == SHA
    manifest = json.loads((ROOT / 'assets/generated/assembly-manifest.json').read_text())
    selected = [i for i in manifest['instances'] if i['id'].startswith(PREFIX) and not i['isAssembly']]
    doc, _tool = load_xcaf(source)
    definitions, records, shapes = {}, {}, {}
    for instance in selected:
        did = instance['definitionId']
        if did not in definitions:
            label = TDF_Label()
            TDF_Tool.Label_s(doc.GetData(), did.removeprefix('d_').replace('_', ':'), label, False)
            shape = XCAFDoc_ShapeTool.GetShape_s(label)
            shapes[did] = shape
            surfaces = []
            exp = TopExp_Explorer(shape, TopAbs_FACE)
            face_index = 0
            while exp.More():
                face_index += 1
                face = TopoDS.Face_s(exp.Current())
                exp.Next()
                a = BRepAdaptor_Surface(face)
                if a.GetType() not in [GeomAbs_Cylinder, GeomAbs_Cone]:
                    continue
                cylinder = a.GetType() == GeomAbs_Cylinder
                c = a.Cylinder() if cylinder else a.Cone()
                p, d = c.Location(), c.Axis().Direction()
                origin, axis = np.array([p.X(), p.Y(), p.Z()]), np.array([d.X(), d.Y(), d.Z()])
                endpoints = []
                radii = []
                for v in [a.FirstVParameter(), a.LastVParameter()]:
                    q = a.Value(a.FirstUParameter(), v)
                    point = np.array([q.X(), q.Y(), q.Z()])
                    axial = float(np.dot(point - origin, axis))
                    endpoints.append(axial)
                    radii.append(float(np.linalg.norm(point - origin - axial * axis)))
                surfaces.append({'face': face_index, 'type': 'cylinder' if cylinder else 'cone',
                    'originLocalMm': origin.tolist(), 'axisLocal': axis.tolist(),
                    'radiusMm': c.Radius() if cylinder else None,
                    'endRadiiMm': radii, 'axialRangeLocalMm': sorted(endpoints)})
            definitions[did] = {'faceCount': face_index, 'surfaces': surfaces}
        matrix = np.array(instance['worldTransform'])
        surfaces = []
        for s in definitions[did]['surfaces']:
            axis = matrix[:3, :3] @ s['axisLocal']
            origin = (matrix @ [*s['originLocalMm'], 1])[:3]
            surfaces.append({**s, 'originWorldMm': origin.tolist(), 'axisWorld': axis.tolist(),
                'axisEndpointsWorldMm': [(origin + axis * v).tolist() for v in s['axialRangeLocalMm']]})
        records[instance['id']] = {'definitionId': did, 'name': instance['name'],
            'worldTransform': instance['worldTransform'], 'boundsWorldMm': instance['boundsWorldMm'],
            'surfaces': surfaces}
    OUT.mkdir(parents=True, exist_ok=True)
    result = {'sourceSha256': SHA, 'units': 'mm', 'coordinateSystem': 'unchanged STEP world',
        'movementLeafCount': len(records), 'occurrences': records,
        'limitations': ['Analytic cylinders include bores and non-mounting surfaces; axis existence alone does not establish extraction direction.',
                         'No mechanical or collision-free certification.']}
    (OUT / 'source-mounts.json').write_text(json.dumps(result, indent=2) + '\n')
    screws, checks = screw_review(records)
    extraction_overlap(records, shapes, screws)
    stem_overlap(records, shapes)
    authored_checks = validate_manifest(records, screws)
    winding_stage_overlap(records, shapes)
    source_views(records, screws)
    print(json.dumps({'movementLeaves': len(records), 'definitions': len(definitions),
        'analyticFaces': sum(len(r['surfaces']) for r in records.values()), 'passed': sum(checks.values()), 'total': len(checks),
        'authoredPassed': sum(authored_checks.values()), 'authoredTotal': len(authored_checks)}))


if __name__ == '__main__':
    probe()
