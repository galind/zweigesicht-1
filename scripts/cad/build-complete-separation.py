#!/usr/bin/env python3
"""Pack a complete rigid axial illustration from measured source body depths.

Run separation-depth-probe.py first. Geometry is never scaled, rotated or rewritten.
Generated layout is separate from authored mounting rules and depth overrides.
"""
import hashlib
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[2]
read = lambda p: json.loads((ROOT / p).read_text())
manifest = read('explorer/public/models/assembly-manifest.json')
authored = read('assets/authored/explosion.json')
anchors = read('artifacts/explode-depth-audit/anchors.json')
by_id = {p['id']: p for p in manifest['instances']}
source_rules = {p['id']: p for p in authored['parts']}
assert set(anchors['occurrences']) == set(source_rules)
GAP = 1.0
# Horizontal fasteners keep their reviewed local withdrawal and receiving seat layer.
radial = {}
for oid, rule in source_rules.items():
    m = by_id[oid]['worldTransform']
    axis = [sum(m[i][j] * rule['directionLocal'][j] for j in range(3)) for i in range(3)]
    if rule['rule'] == 'release' and abs(axis[2]) < 0.01:
        radial[oid] = {'seat': rule['sourceEvidence']['seatIds'][0].split(':face')[0], 'axis': axis}
assert len(radial) == 3
bounds = {}
for oid in source_rules:
    p = by_id[oid]
    b = p['boundsWorldMm']
    if b is None:
        # Exact already-accepted original maker STL, transformed by its original occurrence.
        data = (ROOT / 'explorer/public/models/diamond-c74ee2731a1f.stl').read_bytes()
        assert hashlib.sha256(data).hexdigest() == 'c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a'
        points = []
        for t in range(struct.unpack_from('<I', data, 80)[0]):
            for v in range(3):
                xyz = struct.unpack_from('<3f', data, 84 + t * 50 + 12 + v * 12)
                m = p['worldTransform']
                points.append([sum(m[i][j] * xyz[j] for j in range(3)) + m[i][3] for i in range(3)])
        b = [[min(v[i] for v in points) for i in range(3)], [max(v[i] for v in points) for i in range(3)]]
    bounds[oid] = b

def overlaps_xy(a, b):
    return all(min(a[1][i], b[1][i]) > max(a[0][i], b[0][i]) for i in [0, 1])

# Hard precedence: already-disjoint source intervals and reviewed screw/seat polarity.
# Major body depth breaks remaining ties, including shafts with long protruding ends.
axial_ids = [oid for oid in source_rules if oid not in radial]
predecessors = {oid: set() for oid in axial_ids}
for a in axial_ids:
    for b in axial_ids:
        if a != b and overlaps_xy(bounds[a], bounds[b]) and bounds[a][1][2] < bounds[b][0][2] - 1e-6:
            predecessors[b].add(a)
screw_precedence = []
for oid in axial_ids:
    rule = source_rules[oid]
    if rule['rule'] != 'release': continue
    axis_z = sum(by_id[oid]['worldTransform'][2][j] * rule['directionLocal'][j] for j in range(3))
    seats = {s.split(':face')[0] for s in rule['sourceEvidence']['seatIds']}
    if not seats:
        seats = {next(h['frameId'] for h in authored['hosts'] if h['id'] == rule['host'])}
    for seat in sorted(seats):
        if seat not in predecessors or not overlaps_xy(bounds[oid], bounds[seat]): continue
        lower, upper = (oid, seat) if axis_z < 0 else (seat, oid)
        predecessors[upper].add(lower)
        screw_precedence.append([lower, upper])
order, remaining = [], set(axial_ids)
while remaining:
    ready = [oid for oid in remaining if not predecessors[oid] & remaining]
    assert ready, 'Contradictory source precedence: ' + str(sorted(remaining))
    oid = min(ready, key=lambda oid: (anchors['occurrences'][oid]['anchorZMm'], oid))
    order.append(oid)
    remaining.remove(oid)
offsets, constraints = {}, []
for i, oid in enumerate(order):
    offset = 0
    for lower in order[:i]:
        if not overlaps_xy(bounds[lower], bounds[oid]):
            continue
        # Nonnegative relative displacement prevents a lower part overtaking an upper one.
        delta = max(0, bounds[lower][1][2] - bounds[oid][0][2] + GAP)
        offset = max(offset, offsets[lower] + delta)
        constraints.append([lower, oid, delta])
    offsets[oid] = offset
plate = next(h['frameId'] for h in authored['hosts'] if h['id'] == 'plate')
origin = offsets[plate]
translations = {oid: [0, 0, dz - origin] for oid, dz in offsets.items()}
for oid, rule in radial.items():
    translations[oid] = [n * 4 for n in rule['axis']]
    translations[oid][2] += translations[rule['seat']][2]
output = {
    'schemaVersion': 1,
    'sourceSha256': anchors['sourceSha256'],
    'generatedBy': 'scripts/cad/build-complete-separation.py',
    'anchorEvidenceSha256': hashlib.sha256((ROOT / 'artifacts/explode-depth-audit/anchors.json').read_bytes()).hexdigest(),
    'units': 'mm', 'gapMm': GAP, 'fixedPlate': plate,
    'method': 'Simultaneous rigid translations. Source body-depth order; full Z extents with projected XY overlap impose monotone clearance constraints. Three horizontal screws withdraw relative to their reviewed seat.',
    'parts': [{'id': oid, 'bodyZMm': anchors['occurrences'][oid]['anchorZMm'], 'bodyEvidence': anchors['occurrences'][oid]['method'], 'boundsWorldMm': bounds[oid], 'offsetMm': translations[oid], **({'radialSeat': radial[oid]['seat']} if oid in radial else {})} for oid in source_rules],
    'constraintCount': len(constraints), 'screwPrecedence': screw_precedence,
    'limitations': ['Conservative bounding-box clearance, not a swept-solid service-path certification. Initially interlocking parts are shown as rigid display elements.', 'The unselected alternate setting lever remains hidden by the existing visibility rule; its layout is covered.'],
}
for lower, upper, delta in constraints:
    assert translations[upper][2] - translations[lower][2] >= delta - 1e-9
    assert bounds[upper][0][2] + translations[upper][2] - bounds[lower][1][2] - translations[lower][2] >= GAP - 1e-9
(ROOT / 'assets/derived').mkdir(exist_ok=True)
(ROOT / 'assets/derived/complete-separation.json').write_text(json.dumps(output, indent=2) + '\n')
print(json.dumps({'parts': len(translations), 'constraints': len(constraints), 'radial': len(radial), 'zRangeMm': [min(v[2] for v in translations.values()), max(v[2] for v in translations.values())]}))
