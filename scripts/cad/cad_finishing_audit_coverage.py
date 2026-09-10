"""Read-only source/runtime and ongoing screenshot-review coverage reconciliation."""
import collections,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
E=ROOT/'artifacts/browser/cad-finishing-audit'
S=ROOT/'artifacts/cad-finishing-audit'
def read(p):return json.loads(p.read_text())
m=read(ROOT/'explorer/public/models/assembly-manifest.json')
leaves={p['id']:p for p in m['instances'] if not p['isAssembly']}
source=read(S/'source/source-audit.json');pipeline=read(S/'pipeline/pipeline.json')
assert len(leaves)==len(source['occurrences'])==len(pipeline['occurrences'])
assert set(leaves)=={x['id'] for x in source['occurrences']}=={x['id'] for x in pipeline['occurrences']}
expected_definitions={p['definitionId'] for p in leaves.values()}
assert expected_definitions=={d['id'] for d in source['definitions']}=={d['id'] for d in pipeline['definitions']}
indexes=[E/'index.json',E/'catalog/capture-index.json',E/'catalog-second/index.json',E/'movement-second/capture-index.json']
notes=[E/'visual-notes.json',E/'catalog/visual-notes.json',E/'catalog-second/pixel-notes.json',E/'movement-second/visual-notes.json']
captures=[];reviewed=[]
for p in indexes:
 if p.exists():
  for r in read(p):
   assert r['id'] in leaves,(p,r['id'])
   views=r.get('shots',r.get('views',[]))
   missing=[]
   for v in views:
    path=Path(v.get('path',v.get('file','')))
    candidates=[path,ROOT/path,p.parent/path]
    if not any(c.is_file() for c in candidates):missing.append(str(path))
   captures.append({'id':r['id'],'definitionId':leaves[r['id']]['definitionId'],'views':len(views),'missingFiles':missing,'index':str(p.relative_to(ROOT))})
for p in notes:
 if p.exists():
  a=read(p)
  if isinstance(a,dict):a=a.get('occurrences',a.get('notes',a.get('reviews',[])))
  for r in a:
   if isinstance(r,dict) and r.get('id') in leaves:reviewed.append(r['id'])
ids=[c['id'] for c in captures]
assert len(ids)==len(set(ids)), 'Overlapping browser assignments'
by_parent=collections.defaultdict(lambda:{'expected':0,'captured':0,'reviewed':0})
for id,p in leaves.items():
 row=by_parent[p['parentId']];row['expected']+=1;row['captured']+=id in ids;row['reviewed']+=id in reviewed
report={'status':'in-progress: captured is not reviewed','sourceDefinitions':len(expected_definitions),'sourceOccurrences':len(leaves),'bodies':source['summary']['bodies'],'faces':source['summary']['faces'],'capturedOccurrences':len(ids),'pixelReviewedOccurrences':len(set(reviewed)),'captures':captures,'byActualParent':dict(by_parent),'notCaptured':[id for id in leaves if id not in ids],'notPixelReviewed':[id for id in leaves if id not in reviewed]}
(S/'coverage.json').write_text(json.dumps(report,indent=2))
lines=['# Live CAD finishing audit coverage','', 'Captured screenshots are not accepted as reviewed rows until individual pixel notes exist.','',f"Source and runtime reconciled: **{len(expected_definitions)} definitions / {len(leaves)} occurrences**; {source['summary']['bodies']} bodies / {source['summary']['faces']} faces.",'',f'Captured: {len(ids)}; pixel notes: {len(set(reviewed))}.','', '| Actual parent source ID | Expected leaves | Captured | Pixel notes |','|---|---:|---:|---:|']
for parent,row in by_parent.items():lines.append(f"| {parent} | {row['expected']} | {row['captured']} | {row['reviewed']} |")
(S/'COVERAGE.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['captures','byActualParent','notCaptured','notPixelReviewed']},indent=2))
