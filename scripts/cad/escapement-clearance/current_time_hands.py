"""Fresh rotating fitted-hand/neighbor audit. No source or runtime geometry edits.
All-angle enclosures first; remaining relative angles are sampled, never certified.
"""
from display_phase_review import *
OUT=ROOT/'artifacts/current-time'
OUT.mkdir(exist_ok=True)
rs=assembly();by={r['id']:r for r in rs}
cfg=json.loads((ROOT/'assets/authored/dial-configurations.json').read_text())
pose=json.loads((ROOT/'artifacts/dial-time/hand-pose-source-review.json').read_text())
assert pose['sourceSha256']==SOURCE_SHA
hands={h['leafId']:h for h in pose['records']}
member={}
for h in pose['records']:
 for id in [h['leafId'],h['supportLeafId']]:member[id]=h
packets=json.loads((ROOT/'explorer/public/models/movement-runtime.json').read_text())['packets']+json.loads((ROOT/'assets/authored/running-movement.json').read_text())['displayPackets']
gear={id:p for p in packets for id in p['members']}
dialroots=tuple(f['rootId']+'__' for f in cfg['faces'].values())
configs=[set(sum([f['structureLeafIds']+style['leafIds'] for f,style in [(cfg['faces']['central'],a),(cfg['faces']['small'],b)]],[])) for a in cfg['faces']['central']['styles'] for b in cfg['faces']['small']['styles']]
allowed=set.union(*configs)
rs=[r for r in rs if not r['id'].startswith(dialroots) or r['id'] in allowed]
for r in rs:
 h=member.get(r['id']);p=gear.get(r['id'])
 r['ratio']=bool(h or p);r['pivot']=np.array([*cfg['faces'][h['face']]['axleWorldXYMm'],0]) if h else np.array(p['pivot']) if p else np.zeros(3)
 if r['id'] in hands:
  r['matrix']=np.array(hands[r['id']]['fittedWorldTransform']);r['shape']=moved(r['definition'],r['matrix']);r['bounds']=bounds(r['shape'])
 r['radius']=float(np.linalg.norm(corners(r['bounds'])[:,:2]-r['pivot'][:2],axis=1).max()) if r['bounds'] is not None else 0
result={'sourceSha256':SOURCE_SHA,'members':[], 'pairs':[], 'boxExclusions':0,'incompatibleExclusions':0,'queries':0,'limits':'Continuous full-turn boxes/enclosures/annuli only where recorded. Remaining <=10 degree relative-angle samples do not bound intersample interference. Independent hand/gear phases allow illustrative setting adjustments. Invalid originals are not qualified. Whole assembly separation paths not checked.'}
for id,h in member.items():
 r=by[id];result['members'].append({'id':id,'definition':r['n'],'face':h['face'],'role':h['role'],'support':id not in hands,'fittedReferenceMatrix':r['matrix'].tolist(),'pivot':r['pivot'].tolist(),'sourceLocalZWorld':r['matrix'][:3,2].tolist()})
seen=set()
for r in [r for r in rs if r['id'] in member]:
 for f in rs:
  key=tuple(sorted([r['id'],f['id']]))
  if r is f or key in seen:continue
  seen.add(key)
  if f['id'] in allowed and not any(r['id'] in c and f['id'] in c for c in configs):result['incompatibleExclusions']+=1;continue
  if r['bounds'] is not None and f['bounds'] is not None and boxgap(fullbox(r),fullbox(f))>1e-7:result['boxExclusions']+=1;continue
  row={'ids':[r['id'],f['id']],'definitions':[r['n'],f['n']]}
  if not r['valid'] or not f['valid'] or f['bounds'] is None or not items(f['shape'],TopAbs_SOLID):
   result['pairs'].append({**row,'status':'invalid/non-solid exception'});continue
  if not f['ratio']:
   enc=fixed_envelope(r,f)
   if enc['clear']:
    result['pairs'].append({**row,'status':'continuous enclosing cylinder','evidence':enc});continue
  radial=radial_bound(r,f)
  if radial['gapLowerBoundMm']>1e-7:
   result['pairs'].append({**row,'status':'continuous annular bound','evidence':radial});continue
  coaxial=np.linalg.norm(r['pivot'][:2]-f['pivot'][:2])<1e-8
  same_hand=f['id'] in member and member[f['id']]['face']==member[r['id']]['face'] and member[f['id']]['role']==member[r['id']]['role']
  angles=[(0,0)] if same_hand else [(a,0) for a in range(0,360,10)] if coaxial or not f['ratio'] else [(a,b) for a in range(0,360,30) for b in range(0,360,30)]
  worst={'volumeMm3':0};count=0
  baseline=query(r['shape'],f['shape'])[0]
  for a,b in angles:
   volume=query(moved(r['shape'],matrix(r['pivot'],a)),moved(f['shape'],matrix(f['pivot'],b)))[0]
   count+=1
   if volume>worst['volumeMm3']:worst={'volumeMm3':volume,'anglesDegrees':[a,b]}
  result['queries']+=count
  result['pairs'].append({**row,'status':'overlap' if worst['volumeMm3']>1e-9 else 'invariant nonpenetration' if same_hand else 'sampled nonpenetration','samples':count,'baselineVolumeMm3':baseline,'worst':worst,'coaxial':bool(coaxial),'rigidHandPacket':same_hand})
  print(row['definitions'],result['pairs'][-1]['status'],worst,flush=True)
  (OUT/'clearance.json').write_text(json.dumps(result,indent=2)+'\n')
(OUT/'clearance.json').write_text(json.dumps(result,indent=2)+'\n')
print('DONE',result['boxExclusions'],len(result['pairs']),result['queries'],flush=True)
