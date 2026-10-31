"""Read-only remaining-interface investigation; derived CAD stays ignored."""
from study import *
from itertools import product
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib

OUT = ROOT / 'artifacts/escapement-interfaces-20261026'
OUT.mkdir(exist_ok=True)

def save(name, data):
 (OUT/name).write_text(json.dumps(data, indent=2, allow_nan=False)+'\n')

def bounds(shape):
 b=Bnd_Box(); BRepBndLib.AddOptimal_s(shape,b,False,True)
 if b.IsVoid(): return None
 q=b.Get(); return np.array([q[:3],q[3:]])

def corners(bb):
 return np.array(list(product(*zip(bb[0],bb[1]))))

def source():
 """Cache all original leaf definitions, without repairing or changing originals."""
 Data()  # Verify originals, catalog and historical cache first.
 cache=OUT/'brep'; cache.mkdir(exist_ok=True)
 path=OUT/'source-cache.json'
 if not path.exists():
  sys.path.insert(0,str(ROOT/'scripts/cad'))
  from wheel_contact_probe import load_source
  doc,records,shapes,definitions=load_source(all_leaves=True)
  files={}
  for did,sh in definitions.items():
   target=cache/(did+'.brep'); BRepTools.Write_s(sh,str(target));files[target.name]=digest(target)
  save(path.name,{'sourceSha256':SOURCE_SHA,'catalogSha256':digest(ROOT/'explorer/public/models/assembly-manifest.json'),
                  'ocpVersion':OCP.__version__,'files':files})
 info=json.loads(path.read_text());assert info['sourceSha256']==SOURCE_SHA
 assert info['catalogSha256']==digest(ROOT/'explorer/public/models/assembly-manifest.json')
 assert info['ocpVersion']==OCP.__version__
 defs={}
 for name,h in info['files'].items():
  assert digest(cache/name)==h
  sh=TopoDS_Shape();assert BRepTools.Read_s(sh,str(cache/name),BRep_Builder());defs[name[:-5]]=sh
 return defs

def assembly():
 defs=source();inv=json.loads((ROOT/'explorer/public/models/assembly-manifest.json').read_text())['instances']
 cm=json.loads(subprocess.check_output(['git','show',HISTORICAL_REF+':docs/escapement/components.json'],cwd=ROOT))
 owners={c['id']:c['owner'] for c in cm['components'] if c['owner'] in PIV}
 phases={e['leafId']:e for e in json.loads((ROOT/'assets/authored/wheel-display-poses.json').read_text())['wheels']}
 candidate=TopoDS_Shape();assert BRepTools.Read_s(candidate,str(HERE/'candidate-fork.brep'),BRep_Builder())
 assert digest(HERE/'candidate-fork.brep')==json.loads((HERE/'candidate-solid.json').read_text())['candidateHash']
 records=[]
 validity={}
 for c in inv:
  if c['isAssembly']:continue
  n=int(c['definitionId'].split('_')[-1]);sh=defs[c['definitionId']];m=np.array(c['worldTransform'])
  if c['id'] in phases:
   entry=phases[c['id']];assert entry['pivotLocalMm']==[0,0,0];m=m@matrix(np.zeros(3),entry['localZDegrees'])
  if c['definitionId'] not in validity:validity[c['definitionId']]=BRepCheck_Analyzer(sh).IsValid()
  valid=validity[c['definitionId']]
  world=moved(candidate if n==126 else sh,m)
  try:bb=bounds(world);bound_method='BRep optimal with tolerance'
  except Exception:bb=None;bound_method='BRep bound failed'
  # Invalid BReps are never certified using the runtime mesh.
  records.append({'id':c['id'],'n':n,'name':c['name'],'owner':owners.get(c['id'],'fixed'),
    'valid':valid,'shape':world,'bounds':bb,'boundMethod':bound_method,'matrix':m,'definition':sh})
  if len(records)%50==0:print('assembly leaves',len(records),flush=True)
 return records

def audit():
 records=assembly();moving=[r for r in records if r['owner'] in PIV];fixed=[r for r in records if r['owner']=='fixed']
 samples=json.loads((HERE/'cycle.json').read_text())['samples']
 indices=sorted(set(range(0,len(samples),80))|{len(samples)-1,720,1440,2161})
 summary={};unqualified={};exclusions=0;queries=0;memo={}
 for k,idx in enumerate(indices):
  s=samples[idx]
  for r in moving:
   if not r['valid'] or r['bounds'] is None:
    unqualified[r['id']]={'name':r['name'],'definition':r['n'],'reason':'invalid or unbounded moving BRep'};continue
   m=matrix(PIV[r['owner']],s[r['owner']]+CENTER[r['owner']]);pts=corners(r['bounds'])@m[:3,:3].T+m[:3,3]
   bb=np.array([pts.min(axis=0),pts.max(axis=0)]);sh=None
   for f in fixed:
    fb=f['bounds']
    if fb is None:
     unqualified[f['id']]={'name':f['name'],'definition':f['n'],'reason':'no reliable BRep bounds'};continue
    if np.any(bb[1]+.0001<fb[0]) or np.any(fb[1]+.0001<bb[0]):exclusions+=1;continue
    key=r['id']+' / '+f['id']
    if not f['valid']:
     unqualified[key]={'reason':'invalid fixed BRep candidate'};continue
    if sh is None:sh=moved(r['shape'],m)
    angle=round(s[r['owner']]+CENTER[r['owner']],10);cachekey=(key,angle)
    if cachekey not in memo:
     # Large case/bridge surface-distance optimizations are unnecessary for
     # interference screening. Compute closed-solid intersection directly.
     op=boolean(sh,f['shape'],BRepAlgoAPI_Common);result=op.Shape()
     assert BRepCheck_Analyzer(result).IsValid(),key
     v=sum(vol(so) for so in items(result,TopAbs_SOLID))
     gap=dist(sh,f['shape']) if f['n'] in {102,106,134,204,205} else None
     memo[cachekey]=(gap,v);queries+=1
    gap,v=memo[cachekey]
    if key not in summary:summary[key]={'moving':r['n'],'other':f['n'],'otherName':f['name'],'minimumGapMm':gap,'maximumCommonMm3':v,'minimumSample':idx,'maximumSample':idx,'exactChecks':0,'overlapSamples':[]}
    z=summary[key];z['exactChecks']+=1
    if gap is not None and gap<z['minimumGapMm']:z['minimumGapMm']=gap;z['minimumSample']=idx
    if v>z['maximumCommonMm3']:z['maximumCommonMm3']=v;z['maximumSample']=idx
    if v>1e-8:z['overlapSamples'].append({'sample':idx,'volumeMm3':v})
  save('interfaces.partial.json',{'completedConfigurations':k+1,'pairs':summary,'unqualified':unqualified})
  print('interface configuration',k+1,'/',len(indices),'queries',queries,'overlapping pairs',sum(z['maximumCommonMm3']>1e-8 for z in summary.values()),flush=True)
 result={'sourceSha256':SOURCE_SHA,'cycleSha256':digest(HERE/'cycle.json'),'phaseOverridesSha256':digest(ROOT/'assets/authored/wheel-display-poses.json'),
  'scope':'14 valid moving rigid leaves versus all other source assembly leaves with current static wheel phases; spring held at source for diagnosis; source case/hand placements, not all product presets',
  'sampleIndices':indices,'sourceLeafCount':len(records),'movingLeafCount':len(moving),'fixedLeafCount':len(fixed),
  'exactQueries':queries,'queryMethod':'closed-solid common for every unique candidate pair/angle; distance only for bearing jewels; repeated bank poses memoized',
  'boundingExclusions':exclusions,'pairs':summary,'unqualified':unqualified,'complete':True}
 save('interfaces.json',result);(OUT/'interfaces.partial.json').unlink()

if __name__=='__main__':audit()
