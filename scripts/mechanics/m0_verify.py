#!/usr/bin/env python3
"""M0 deliverable integrity and independently stated coverage/path invariants."""
import csv
import hashlib
import json
import math
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
D=ROOT/'docs/running-movement'
read=lambda p:json.loads(p.read_text())
rows=list(csv.DictReader((D/'coverage.csv').open())); graph=read(D/'graph.json'); summary=read(D/'coverage-summary.json'); probe=read(D/'probe-summary.json')
manifest=read(ROOT/'explorer/public/models/assembly-manifest.json'); fits=read(ROOT/'assets/authored/hand-display-poses.json'); dials=read(ROOT/'assets/authored/dial-configurations.json')
ids={i['id'] for i in manifest['instances'][1:]}; by_id={r['instance_id']:r for r in rows}
assert len(rows)==len(ids)==426 and set(by_id)==ids
assert sum(r['node_kind']=='leaf' for r in rows)==365
assert sum(r['motion_class']=='unresolved' and r['node_kind']=='leaf' for r in rows)==13
assert all(r['source_url'].startswith('https://www.marcolangwatches.com/') and r['source_sha256']==graph['sourceSha256'] for r in rows)
assert all(r['motion_class'] in {'fixed','continuously-driven','conditionally-driven','deforming','unresolved'} and r['rationale'] and r['condition'] for r in rows)
for p,sha in summary['inputSha256'].items(): assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==sha,p
for p,sha in probe['inputHashes'].items(): assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==sha,p
node={n['id']:n for n in graph['nodes']}; edges={(e['from'],e['to']):e for e in graph['edges']}
assert len(node)==35 and len(graph['edges'])==len(edges)==37
assert all(set(n['instanceIds'])<=ids for n in node.values())
assert all(e['from'] in node and e['to'] in node for e in edges.values())
assert all(e['unknown'] in (D/'UNKNOWNS.md').read_text() for e in edges.values())
# Independent expectations: no missing contacts and no mixed spring rigid ownership.
assert {int(by_id[i]['definition']) for i in node['balance']['instanceIds']}=={109,110,111,112,113,114,115}
assert sum(by_id[i]['definition']=='128' for i in node['pallet']['instanceIds'])==2
assert all(by_id[i]['motion_class']=='deforming' for n in ['hairspring','spring-I','spring-II'] for i in node[n]['instanceIds'])
assert set(node['arbor-I']['instanceIds']).isdisjoint(node['arbor-II']['instanceIds'])
assert node['ratchet-I']['instanceIds'][0].endswith('_83_14')
assert node['ratchet-II']['instanceIds'][0].endswith('_83_15')
assert 'rejected' in edges['barrel-I','upstream']['status']
# Derive reduction products independently from the enumerated path edges.
def product(path): return math.prod(edges[a,b]['signedDeltaRatio'] for a,b in zip(path,path[1:]))
assert math.isclose(product(['front-cannon','front-change','front-hour']),1/12)
assert math.isclose(product(['front-cannon','front-change','rear-transfer','rear-change','rear-cannon']),-1)
assert math.isclose(product(['front-cannon','front-change','rear-transfer','rear-change','rear-hour']),-1/12)
assert math.isclose(product(['minute','third','seconds','escape']),-540)
assert math.isclose(product(['barrel-II','upstream','minute']),80/12)
for f in dials['faces'].values():
    for style in f['styles']:
        assert set(style['leafIds'])<=ids
        assert all(by_id[x]['motion_class']=='continuously-driven' for x in style['leafIds'])
for h in fits['hands']:
    assert {h['leafId'],h['supportLeafId']}<=set(node[h['face']+'-'+h['role']]['instanceIds'])
assert len(fits['hands'])==15
assert all(len({c['tipClusters'] for c in r['counts']})==1 for r in probe['definitions'] if r['counts'])
assert sum(bool(r['counts']) for r in probe['definitions'])==15
pairs={tuple(p['definitionPair']):p for p in probe['pairs']}
assert pairs[90,96]['screening']=='rejected direct external pair'
assert pairs[137,213]['screening']=='rejected direct external pair'
assert abs(pairs[85,96]['residualMm'])<1e-10
assert next(r for r in probe['definitions'] if r['definition']==116)['maxTopologyToleranceMm']>.001
# Local file links must exist; anchors are documentation headings, not remote fetches.
for p in D.glob('*.md'):
    for link in re.findall(r'\]\(([^)]+)\)',p.read_text()):
        if '://' in link: continue
        assert (p.parent/link.split('#')[0]).exists(),(p,link)
print('PASS: 426 IDs; source/input hashes; 365 leaves; 35 graph nodes/37 edges; 15 fitted blades/all styles; contact membership; independent path ratios; 15 fresh counts; rejected pairs; precision caveat; local links.')
