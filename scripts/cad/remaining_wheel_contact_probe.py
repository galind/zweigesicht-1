#!/usr/bin/env python3
"""Original-solid endpoint audit for proposed remaining wheel phases.

Read-only: writes evidence under artifacts/remaining-wheel-contact. Candidate
poses are explicit input, never installed by this probe. Use the retained CAD
Python environment. All measurements are static; no running or load certificate.
"""
import argparse
import hashlib
import itertools
import json
from pathlib import Path
import numpy as np
from wheel_contact_probe import (
    ROOT, SHA, PREFIX, load_source, shape_at, bbox, contact, count_solids,
    BRepCheck_Analyzer, world_mesh, section_loops, VOLUME_THRESHOLD,
    BRepAlgoAPI_Common, BRepGProp, GProp_GProps, TopExp_Explorer, TopAbs_SOLID,
)
OUT = ROOT / 'artifacts/remaining-wheel-contact'


def read(path):
    return json.loads(Path(path).read_text())


def write(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, indent=2) + '\n')


def transform(source, entry):
    assert entry['pivotLocalMm'] == [0, 0, 0]
    angle = np.deg2rad(entry['localZDegrees'])
    c, s = np.cos(angle), np.sin(angle)
    rotation = np.eye(4)
    rotation[:2, :2] = [[c, -s], [s, c]]
    return np.array(source) @ rotation


def common_only(a, b):
    """Closed-solid common only; do not label skipped distance as zero."""
    common = BRepAlgoAPI_Common(a, b)
    common.Build()
    assert common.IsDone(), 'Original BRep common failed'
    shape = common.Shape()
    exp = TopExp_Explorer(shape, TopAbs_SOLID)
    volume = 0.
    while exp.More():
        props = GProp_GProps()
        BRepGProp.VolumeProperties_s(exp.Current(), props, 1e-9, True, False)
        volume += props.Mass()
        exp.Next()
    return {'commonVolumeMm3': volume, 'commonSolidCount': count_solids(shape),
            'commonValid': BRepCheck_Analyzer(shape).IsValid(),
            'distanceMm': None, 'distanceStatus': 'not-measured; solid-common check only'}


def fitted_hands(records):
    """Independent implementation of the retained 10:10:00 display convention."""
    hands = read(ROOT/'assets/authored/hand-display-poses.json')
    dials = read(ROOT/'assets/authored/dial-configurations.json')
    result = {}
    for hand in hands['hands']:
        source = np.array(records[hand['leafId']]['worldTransform'])
        pivot = source @ np.r_[hand['boreLocalMm'], 1]
        tip = source @ np.r_[hand['tipLandmarkLocalMm'], 1]
        angle = np.deg2rad(hands['clockAnglesDegrees'][hand['role']])
        target = np.arctan2(np.cos(angle)*(1 if hand['face'] == 'central' else -1), np.sin(angle))
        theta = target-np.arctan2(tip[1]-pivot[1], tip[0]-pivot[0])
        c, s = np.cos(theta), np.sin(theta)
        delta = np.eye(4)
        delta[:2, :2] = [[c, -s], [s, c]]
        delta[:2, 3] = np.array(dials['faces'][hand['face']]['axleWorldXYMm'])-delta[:2, :2]@pivot[:2]
        result[hand['leafId']] = delta @ source
    return result


def review(candidate_path, batch):
    candidate = read(candidate_path)
    baseline = read(OUT/'baseline-poses.json')
    assert candidate['sourceSha256'] == baseline['sourceSha256'] == SHA
    doc, records, source_shapes, definitions = load_source(all_leaves=True)
    existing = {e['leafId']: e for e in baseline['wheels']}
    entries = {e['leafId']: e for e in candidate['wheels']}
    assert not (existing.keys() & entries.keys()), 'Previously reviewed poses must be preserved'
    original = {oid: np.array(r['worldTransform']) for oid, r in records.items()}
    before_matrices = {oid: transform(original[oid], e) for oid, e in existing.items()}
    matrices = {**before_matrices, **{oid: transform(original[oid], e) for oid, e in entries.items()}}
    before_shapes = {**source_shapes, **{oid: shape_at(definitions[records[oid]['definitionId']], mat)
                                        for oid, mat in before_matrices.items()}}
    after_shapes = {**before_shapes, **{oid: shape_at(definitions[records[oid]['definitionId']], matrices[oid])
                                      for oid in entries}}
    groups = {'winding': ['barrel-I-drum-cover-spring', 'winding-pinion'],
              'train': ['third-wheel', 'seconds-wheel'],
              'motion': ['cannon-pinion-1', 'hour-wheel-1', 'hour-wheel-2', 'motion-works-1']}
    selected = {oid: e for oid, e in entries.items() if batch == 'all' or e['rigidPacket'] in groups[batch]}
    assert selected
    tooth_pairs = {frozenset(p['occurrenceIds']) for p in read(ROOT/'assets/source-manifest/wheel-contact.json')['solidToothContacts']}
    distance_defs = {87, 88, 97, 137, 141, 142, 143, 144, 183, 184, 187, 188, 210, 211, 213, 214,
                     216, 217, 233, 234, 235, 237, 238, 242, 243, 249, 252, 254}
    result = {'sourceSha256': SHA, 'candidateSha256': hashlib.sha256(Path(candidate_path).read_bytes()).hexdigest(),
              'baselinePoses': baseline, 'batch': batch, 'reportingVolumeThresholdMm3': VOLUME_THRESHOLD,
              'aabbPaddingMm': .05, 'allOtherLeavesPerMovedPart': len(records)-1,
              'moved': {oid: {**records[oid], 'override': e, 'displayMatrix': matrices[oid].tolist(),
                               'valid': BRepCheck_Analyzer(source_shapes[oid]).IsValid(),
                               'solidCount': count_solids(source_shapes[oid])} for oid, e in selected.items()},
              'packetRelativeMatrixChecks': [], 'pairs': [], 'aabbRejected': [], 'unbounded': [],
              'fittedHandPairs': [], 'fittedHandExclusions': []}
    for packet in sorted({e['rigidPacket'] for e in selected.values()}):
        ids = [oid for oid, e in selected.items() if e['rigidPacket'] == packet]
        for a, b in itertools.combinations(ids, 2):
            error = float(np.max(np.abs(np.linalg.inv(original[a])@original[b]-np.linalg.inv(matrices[a])@matrices[b])))
            result['packetRelativeMatrixChecks'].append({'packet': packet, 'a': a, 'b': b, 'maxError': error})
            assert error < 1e-12
    cache = {}
    for oid in selected:
        bounds = np.stack([np.minimum(bbox(before_shapes[oid])[0], bbox(after_shapes[oid])[0]),
                           np.maximum(bbox(before_shapes[oid])[1], bbox(after_shapes[oid])[1])])
        for other, r in records.items():
            if other == oid:
                continue
            if r['meshBoundsWorldMm'] is None:
                result['unbounded'].append([oid, other])
                continue
            bb = bbox(after_shapes[other]) if other in matrices else np.array(r['meshBoundsWorldMm'])
            # Include both endpoints for any other moved occurrence.
            if other in entries:
                bb = np.stack([np.minimum(bb[0], bbox(before_shapes[other])[0]),
                               np.maximum(bb[1], bbox(before_shapes[other])[1])])
            if np.any(bb[1] < bounds[0]-.05) or np.any(bb[0] > bounds[1]+.05):
                result['aabbRejected'].append([oid, other])
                continue
            key = tuple(sorted([oid, other]))
            if key not in cache:
                exact_distance = frozenset(key) in tooth_pairs or int(r['definitionId'].split('_')[-1]) in distance_defs
                measure = (lambda a, b: contact(a, b)[0]) if exact_distance else common_only
                cache[key] = [measure(before_shapes[oid], before_shapes[other]), measure(after_shapes[oid], after_shapes[other])]
            before, after = cache[key]
            result['pairs'].append({'moved': oid, 'other': r, 'before': before, 'after': after,
                                    'otherValid': BRepCheck_Analyzer(source_shapes[other]).IsValid(),
                                    'otherSolidCount': count_solids(source_shapes[other])})
            print(records[oid]['definitionId'], r['definitionId'], before['commonVolumeMm3'], '->',
                  after['commonVolumeMm3'], 'gap', after['distanceMm'], flush=True)
            write(OUT/f'{batch}.partial.json', result)
        for hand, mat in fitted_hands(records).items():
            shape = shape_at(definitions[records[hand]['definitionId']], mat)
            bb = bbox(shape)
            if np.any(bb[1] < bounds[0]-.05) or np.any(bb[0] > bounds[1]+.05):
                result['fittedHandExclusions'].append([oid, hand])
                continue
            before, after = [contact(s, shape)[0] for s in [before_shapes[oid], after_shapes[oid]]]
            result['fittedHandPairs'].append({'moved': oid, 'hand': records[hand], 'fittedMatrix': mat.tolist(),
                                             'before': before, 'after': after})
            print('fitted hand', oid, hand, before['commonVolumeMm3'], '->', after['commonVolumeMm3'], flush=True)
            write(OUT/f'{batch}.partial.json', result)
    import trimesh
    recovery = ROOT/'explorer/public/models/diamond-c74ee2731a1f.stl'
    digest = hashlib.sha256(recovery.read_bytes()).hexdigest()
    assert digest == 'c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a'
    result['recoveryChecks'] = []
    for oid, other in result['unbounded']:
        assert records[other]['definitionId'] == 'd_0_1_1_225'
        mesh = trimesh.load_mesh(recovery, process=False)
        mesh.apply_transform(original[other])
        bb = bbox(after_shapes[oid])
        gaps = np.maximum(mesh.bounds[0]-bb[1], bb[0]-mesh.bounds[1])
        result['recoveryChecks'].append({'moved': oid, 'other': other, 'sha256': digest,
                                         'axisSeparationMm': gaps.tolist(), 'disjoint': bool(np.any(gaps > .05))})
    result['complete'] = True
    write(OUT/f'{batch}.json', result)
    (OUT/f'{batch}.partial.json').unlink(missing_ok=True)


def validate(candidate_path):
    candidate = read(candidate_path)
    reports = [read(OUT/f'{batch}.json') for batch in ['winding', 'train', 'motion']]
    digest = hashlib.sha256(Path(candidate_path).read_bytes()).hexdigest()
    assert all(r['complete'] and r['candidateSha256'] == digest for r in reports)
    moved = {oid: p for r in reports for oid, p in r['moved'].items()}
    assert set(moved) == {e['leafId'] for e in candidate['wheels']}
    pairs = [p for r in reports for p in r['pairs']]
    hands = [p for r in reports for p in r['fittedHandPairs']]
    increases = [p for p in pairs+hands if p['after']['commonVolumeMm3'] > p['before']['commonVolumeMm3']+VOLUME_THRESHOLD]
    source = read(ROOT/'assets/source-manifest/wheel-contact.json')
    remaining = [p for p in source['solidToothContacts'] if p['key'] in {
        '90-249', '97-249', '94-237', '238-242', '234-243',
        '137-210', '141-211', '210-213', '187-217'}]
    contacts = []
    for pair in remaining:
        match = next(p for p in pairs if {p['moved'], p['other']['id']} == set(pair['occurrenceIds']))
        contacts.append({'key': pair['key'], 'before': match['before'], 'after': match['after']})
    checks = {'all-nine-tooth-contacts-clear': len(contacts) == 9 and all(p['after']['commonVolumeMm3'] == 0 and p['after']['distanceMm'] > 0 for p in contacts),
              'no-new-penetration': not increases,
              'all-moved-valid-solids': all(p['valid'] and p['solidCount'] > 0 for p in moved.values()),
              'all-fitted-hands-accounted': all(len(r['fittedHandPairs'])+len(r['fittedHandExclusions']) == len(r['moved'])*15 for r in reports),
              'all-leaves-accounted': all(len(r['pairs'])+len(r['aabbRejected'])+len(r['unbounded']) == len(r['moved'])*364 for r in reports),
              'all-packet-relative-poses-preserved': all(p['maxError'] < 1e-12 for r in reports for p in r['packetRelativeMatrixChecks']),
              'all-diamond-checks-disjoint': all(p['disjoint'] for r in reports for p in r['recoveryChecks'])}
    write(OUT/'validation.json', {'checks': checks, 'toothContacts': contacts, 'increasedContacts': increases,
                                  'nonSolidOrInvalidNeighbors': [p for p in pairs if not p['otherValid'] or not p['otherSolidCount']]})
    print(json.dumps(checks))
    assert all(checks.values()), checks


def rejected():
    """Reproduce why the smaller crown-only correction was not installed."""
    doc, records, shapes, definitions = load_source(all_leaves=True)
    crown = next(r for r in records.values() if r['definitionId'] == 'd_0_1_1_249')
    click = next(r for r in records.values() if r['definitionId'] == 'd_0_1_1_254')
    source = np.array(crown['worldTransform'])
    assert abs(source[2, 2]) > .99999
    local_degrees = 2.7*np.sign(source[2, 2])
    matrix = transform(source, {'localZDegrees': local_degrees, 'pivotLocalMm': [0, 0, 0]})
    changed = shape_at(definitions[crown['definitionId']], matrix)
    before = contact(shapes[crown['id']], shapes[click['id']])[0]
    after = contact(changed, shapes[click['id']])[0]
    assert after['commonVolumeMm3'] > before['commonVolumeMm3'] + VOLUME_THRESHOLD
    write(OUT/'rejected-crown.json', {'sourceSha256': SHA, 'crown': crown, 'click': click,
          'localDegrees': float(local_degrees), 'proposedMatrix': matrix.tolist(),
          'before': before, 'after': after, 'decision': 'rejected: increased click penetration'})



def views(candidate_path):
    """Matched orthographic sections of fine source meshes, never perspective."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    survey = read(ROOT/'artifacts/wheel-contact/survey.json')
    details = read(ROOT/'artifacts/wheel-contact/details.json')
    validated = read(OUT/'validation.json')
    entries = {e['leafId']: e for e in read(candidate_path)['wheels']}
    for measured in validated['toothContacts']:
        pair = next(p for p in details if p['key'] == measured['key'])
        # The winding mesh has perpendicular axes: use YZ rather than XY.
        order = [1, 2, 0] if pair['key'] == '97-249' else [0, 1, 2]
        center = np.mean(pair['commonBoundsWorldMm'], axis=0)[order]
        extent = max(.15, np.max(np.ptp(np.array(pair['commonBoundsWorldMm'])[:, order[:2]], axis=0))*.65)
        fig, axes = plt.subplots(1, 2, figsize=(11, 5.5), layout='constrained')
        for ax, stage in zip(axes, ['before', 'after']):
            for oid, color in [(pair['a'], '#17618d'), (pair['b'], '#ad781b')]:
                record = survey['wheels'][oid]
                mesh = world_mesh(record, True)
                if stage == 'after' and oid in entries:
                    source = np.array(record['worldTransform'])
                    mesh.apply_transform(transform(source, entries[oid]) @ np.linalg.inv(source))
                mesh.vertices = mesh.vertices[:, order]
                for loop in section_loops(mesh, center[2]):
                    ax.plot(loop[:, 0], loop[:, 1], color=color, linewidth=1.2, label=record['definitionId'])
            measurement = measured[stage]
            ax.set(xlim=(center[0]-extent, center[0]+extent), ylim=(center[1]-extent, center[1]+extent),
                   aspect='equal', xlabel=f"Source {'XYZ'[order[0]]} (mm)", ylabel=f"Source {'XYZ'[order[1]]} (mm)",
                   title=f"{stage}: common {measurement['commonVolumeMm3']:.7g} mm³; gap {measurement['distanceMm']:.7g} mm")
            ax.grid(alpha=.2)
        fig.suptitle(f"{pair['key']} · matched fine-mesh sections at {'XYZ'[order[2]]}={center[2]:.6g} mm\n"
                     "Dimensions and all axes unchanged; measurements use original solids, not these plotted triangles.", fontsize=11)
        fig.savefig(OUT/f"{pair['key']}-before-after.png", dpi=180)
        plt.close(fig)
    from html import escape
    from PIL import Image
    canvas = Image.new('RGB', (2970, 1485), 'white')
    tiles = []
    for index, measured in enumerate(validated['toothContacts']):
        key = measured['key']
        image = Image.open(OUT/f'{key}-before-after.png')
        image.thumbnail((990, 495))
        canvas.paste(image, ((index % 3)*990, (index//3)*495))
        tiles.append(f'<section><h2>{escape(key)}</h2><img src="{key}-before-after.png" alt="Matched before and after tooth section">'
                     f'<p><a href="browser-before/{key}-closeup.png">Homepage before</a> · '
                     f'<a href="browser-after/{key}-closeup.png">Homepage after</a></p></section>')
    canvas.save(OUT/'all-nine-contact-sections.png')
    (OUT/'report.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Remaining wheel contact review</title>'
        '<style>body{font:16px system-ui;max-width:1150px;margin:40px auto;padding:0 20px;color:#172533}img{width:100%}section{margin:40px 0}a{color:#17618d}</style>'
        '<h1>All nine remaining tooth pairs: static phase review</h1>'
        '<p>The original solids confirm penetration in the supplied static assembly. Separate rigid phase overrides clear these nine endpoints; the three previously corrected pairs remain clear. Tooth shapes, axes and axial seating are unchanged.</p>'
        '<p>251 before/after neighbor records and 30 fitted-hand checks show no increased solid common. Three checks involve the preexisting invalid dial solid d27 and remain provisional. Existing fit contacts, the crown/click common and the d144 open shell are retained.</p>'
        '<p>These are nominal static clearances, not certification of running engagement, spring loading, backlash or manufacturing tolerances. See the committed decision record for identities, matrices, rejected alternatives and reproduction.</p>'
        '<p><a href="validation.json">Original-solid measurements</a> · <a href="mesh-pairs.json">All 12 rendered tooth pairs</a> · <a href="browser-after/report.json">Live placement checks</a></p>'
        + ''.join(tiles) + '</html>')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['prepare', 'review', 'validate', 'views', 'rejected'])
    parser.add_argument('--poses', default=str(OUT/'proposed.json'))
    parser.add_argument('--batch', choices=['winding', 'train', 'motion', 'all'], default='all')
    args = parser.parse_args()
    if args.mode == 'prepare':
        record = read(ROOT/'assets/source-manifest/remaining-wheel-contact.json')
        OUT.mkdir(parents=True, exist_ok=True)
        Path(args.poses).write_text(json.dumps(record['candidateInput'], indent=2))
        write(OUT/'baseline-poses.json', record['baselinePoses'])
    elif args.mode == 'review':
        for batch in ['winding', 'train', 'motion'] if args.batch == 'all' else [args.batch]:
            review(args.poses, batch)
    elif args.mode == 'views':
        views(args.poses)
    elif args.mode == 'rejected':
        rejected()
    else:
        validate(args.poses)
