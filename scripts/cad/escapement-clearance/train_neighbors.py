"""Full-turn neighbor screens for the newly driven packets."""
from train_coupling import *

def run():
 rs,by,pivots=setup();owner={n:k for k,ns in MEMBERS.items() for n in ns};new=[by[n] for k,ns in MEMBERS.items() if k!='escape' for n in ns]
 meshed={frozenset((a,b)) for a,b,*_ in PAIRS};pairs=[];exclusions=0;queries=0;unqualified={}
 for r in new:
  own=owner[r['n']];corn=corners(r['bounds']);pivot=pivots[own]
  # Existing neighbors stay at the reviewed display poses for this screen.
  for f in rs:
   if f['id']==r['id'] or owner.get(f['n'])==own or frozenset((r['n'],f['n'])) in meshed:continue
   if f['bounds'] is None or not f['valid'] or not len(items(f['shape'],TopAbs_SOLID)):
    unqualified[f['id']]={'definition':f['n'],'reason':'invalid, unbounded or no solid'};continue
   fb=f['bounds'];rows=[];baseline=None
   for angle in range(0,360,10):
    m=matrix(pivot,angle);c=corn@m[:3,:3].T+m[:3,3];bb=np.array([c.min(axis=0),c.max(axis=0)])
    if np.any(bb[1]+.0001<fb[0]) or np.any(fb[1]+.0001<bb[0]):exclusions+=1;continue
    sh=moved(r['shape'],m);op=boolean(sh,f['shape'],BRepAlgoAPI_Common);result=op.Shape()
    assert BRepCheck_Analyzer(result).IsValid(),(r['n'],f['n'],angle)
    v=sum(vol(s) for s in items(result,TopAbs_SOLID));queries+=1
    if baseline is None:
     baseline=common(r['shape'],f['shape'])
    rows.append({'angleDegrees':angle,'commonVolumeMm3':v})
   if rows:pairs.append({'movingId':r['id'],'moving':r['n'],'otherId':f['id'],'other':f['n'],'otherName':f['name'],
     'otherOwner':owner.get(f['n'],f['owner']),'baselineCommonMm3':baseline,'maximumCommonMm3':max(x['commonVolumeMm3'] for x in rows),'samples':rows})
  save_train('neighbors.partial.json',{'completedMovingDefinitions':[x['n'] for x in new[:new.index(r)+1]],'pairs':pairs,'queries':queries,'exclusions':exclusions,'unqualified':unqualified})
  print('neighbor moving',r['n'],'queries',queries,'increased pairs',[(p['moving'],p['other']) for p in pairs if p['maximumCommonMm3']>p['baselineCommonMm3']+1e-8],flush=True)
 save_train('neighbors.json',{'scope':'10 newly driven leaves sampled every 10 degrees through one complete turn against other valid source leaves held at current display poses; same packet and five meshing pairs excluded; frozen-neighbor screen, not simultaneous all-phase certificate',
  'movingDefinitions':[r['n'] for r in new],'angularSamplesPerLeaf':36,'booleanQueries':queries,'boundingExclusions':exclusions,'unqualified':unqualified,'pairs':pairs})
 (TRAIN/'neighbors.partial.json').unlink()

if __name__=='__main__':run()
