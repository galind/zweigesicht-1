"""Review the installed partial display scope using original solids and prior evidence.

Only identical pair kinematics/poses inherit the connected review. Changed pairs
are screened anew. No rear diagnostic phases or physical slipping are installed.
"""
import display_phase_review as review
from display_phase_review import *

OUT = ROOT/'artifacts/front-display'
OUT.mkdir(exist_ok=True)
review.REVIEW = OUT
settings = json.loads((ROOT/'assets/authored/running-movement.json').read_text())
scope = settings['displayPackets']
review.MEMBERS = {p['name'] for p in scope}


def run():
 prior = json.loads((ROOT/'assets/source-manifest/display-phase-review.json').read_text())
 for path, h in prior['localEvidenceSha256'].items():
  assert digest(ROOT/path) == h, path
 # Source and static authored placements must still match the reviewed baseline.
 for path in ['assets/authored/wheel-display-poses.json', 'assets/authored/hand-display-poses.json', 'explorer/public/models/movement-runtime.json']:
  assert (ROOT/path).read_bytes() == subprocess.check_output(['git','show','58c7e27:'+path],cwd=ROOT), path
 rs = assembly()
 runtime = json.loads((ROOT/'explorer/public/models/movement-runtime.json').read_text())
 moving = {i:(p['name'],Fraction(*p['ratio']),np.array(p['pivot'])) for p in runtime['packets']+scope for i in p['members']}
 for r in rs:
  r['baselineShape']=r['shape'];r['variant']='source-display';r['sourceId']=r['id']
  r['packet'],r['ratio'],r['pivot']=moving.get(r['id'],('fixed',Fraction(0),np.zeros(3)))
  r['oscillating']=r['packet'] in ['balance','pallet']
  r['radius']=float(np.linalg.norm(corners(r['bounds'])[:,:2]-r['pivot'][:2],axis=1).max()) if r['bounds'] is not None else None
 byid={r['id']:r for r in rs}
 for fitted in json.loads((OUT/'fitted-hands.json').read_text()):
  r=byid[fitted['id']].copy();r['sourceId']=r['id'];r['id']+='@fitted';r['variant']='fitted-hand'
  r['matrix']=np.array(fitted['matrix']);r['shape']=moved(r['definition'],r['matrix']);r['baselineShape']=r['shape'];r['bounds']=bounds(r['shape']);rs.append(r)
 inv=review.inventory(rs)
 inv['scope']='Seven installed display leaves vs all source occurrences and 15 fitted-hand poses; rear display packets static at unchanged authored phases.'
 review.save_review('inventory.json',inv)
 old={tuple(p['ids']):p for p in json.loads((ROOT/'artifacts/display-phase-review/neighbors.json').read_text())['pairs']}
 inherited=[];fresh=[]
 for p in inv['pairs']:
  previous=old.get(tuple(p['ids']))
  # Exact pair metadata includes both packet identities, rational multipliers,
  # period, and invariant-pose classification. Rear packets now say fixed.
  if previous and all(previous.get(k)==v for k,v in p.items()):
   inherited.append({**previous,'evidenceReuse':'Identical kinematics and authored transforms; artifacts/display-phase-review/neighbors.json'})
  else: fresh.append(p)
 review.save_review('reuse.json',{'inheritedPairs':len(inherited),'recomputedPairs':fresh})
 if not (OUT/'neighbors.json').exists():review.save_review('neighbors.json',{'pairs':inherited})
 print('inventory',len(inv['pairs']),'inherited',len(inherited),'fresh',len(fresh),'boxes',len(inv['fullTurnBoxExclusions']),'unqualified',len(inv['unqualified']),flush=True)
 for p in fresh:print('fresh',p['definitions'],p['packets'],p['angularMultipliers'],p['intervals'],flush=True)
 review.screen(rs,inv)
 result=review.summarize()
 assert len(result['pairs'])==len(inv['pairs'])
 from collections import Counter
 print(Counter(p['status'] for p in result['pairs']),flush=True)
 if any(p['status']=='increased-overlap' for p in result['pairs']):print('NEW OR INCREASED INTERFERENCE: inspect witnesses',flush=True)

if __name__=='__main__':run()
