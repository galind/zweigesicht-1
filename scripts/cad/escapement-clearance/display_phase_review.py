"""Complete conditional display-packet neighbor inventory and period screens.

Research only: phases are changed on copied BReps in memory. Output is ignored.
Continuous enclosing-box/point-displacement bounds are separate from samples.
"""
from motion_works_sweep import *
from fractions import Fraction
from math import lcm, ceil
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeEdge
from train_envelopes import cylinder_bound
from OCP.BRepPrimAPI import BRepPrimAPI_MakeCylinder
from OCP.gp import gp_Ax2
import argparse

REVIEW=ROOT/'artifacts/display-phase-review'
REVIEW.mkdir(exist_ok=True)

def save_review(name,data):
 (REVIEW/name).write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')

def summarize():
 data=json.loads((REVIEW/'neighbors.json').read_text())
 data['scope']='All candidate pairs screened across their complete relative periods. BRep common-volume queries test penetration, not positive clearance. Zero separation lower bounds are not measured zero gaps. Positive enclosing/radial/between-sample bounds are continuous nominal bounds; other clear results remain sampled. Source fits remain unqualified mechanically.'
 for p in data['pairs']:
  if 'minimumSampledGapMm' in p:p['minimumSampledSeparationLowerBoundMm']=p.pop('minimumSampledGapMm')
  if 'worstGap' in p:p['worstBoundSample']=p.pop('worstGap')
  for row in p.get('samples',[])+[p.get('worstOverlap',{}),p.get('worstBoundSample',{})]:
   if 'gapMm' in row:row['separationLowerBoundMm']=row.pop('gapMm')
  if p['constantRelativeTransform'] and p['status']=='sampled-clear':p['status']='invariant-relative-nonpenetration'
 save_review('neighbors.json',data)
 return data

def boxgap(a,b):
 return float(np.linalg.norm(np.maximum(0,np.maximum(a[0]-b[1],b[0]-a[1]))))

def fullbox(r):
 b=r['bounds'].copy()
 if r['ratio'] or r.get('oscillating'):
  b[:,:2]=[r['pivot'][:2]-r['radius'],r['pivot'][:2]+r['radius']]
 return b

def prepare():
 prior=json.loads((ROOT/'assets/source-manifest/reverse-mesh-diagnosis.json').read_text())
 for name,h in prior['localEvidenceSha256'].items():assert digest(ROOT/name)==h,name
 rs=assembly();runtime=json.loads((ROOT/'explorer/public/models/movement-runtime.json').read_text())
 src=json.loads((OUTPUT/'source.json').read_text())
 phases=prior['equivalentSimultaneousDiagnosticPacketPhases']
 moving={i:(p['name'],Fraction(*p['ratio']),np.array(p['pivot'])) for p in runtime['packets'] for i in p['members']}
 for name,ids in MEMBERS.items():
  pivot=np.array(src['leaves'][str(ids[0])]['worldTransform'])[:3,3]
  for i in src['packets'][name]['members']:moving[i]=(name,RATIOS[name],pivot)
 for r in rs:
  r['baselineShape']=r['shape'];r['variant']='source-display';r['sourceId']=r['id']
  r['packet'],r['ratio'],r['pivot']=moving.get(r['id'],('fixed',Fraction(0),np.zeros(3)))
  r['oscillating']=r['packet'] in ['balance','pallet']
  if r['packet'] in ['cannon2','hour2']:
   change=phases[r['packet']+'WorldDegrees']-(.25 if r['packet']=='hour2' else 0)
   r['shape']=moved(r['shape'],matrix(r['pivot'],change));r['matrix']=matrix(r['pivot'],change)@r['matrix'];r['bounds']=bounds(r['shape'])
  r['radius']=float(np.linalg.norm(corners(r['bounds'])[:,:2]-r['pivot'][:2],axis=1).max()) if r['bounds'] is not None else None
 byid={r['id']:r for r in rs}
 for fitted in json.loads((REVIEW/'fitted-hands.json').read_text()):
  r=byid[fitted['id']].copy();r['sourceId']=r['id'];r['id']+='@fitted';r['variant']='fitted-hand'
  r['matrix']=np.array(fitted['matrix']);r['shape']=moved(r['definition'],r['matrix']);r['baselineShape']=r['shape'];r['bounds']=bounds(r['shape']);rs.append(r)
 return rs,prior

def inventory(rs):
 new=[r for r in rs if r['packet'] in MEMBERS];pairs=[];seen=set();excluded=[];unqualified=[];same=[];meshes=[]
 meshkeys={frozenset((a,b)) for a,b,*_ in PAIRS}
 for r in new:
  for f in rs:
   if r['id']==f['id']:continue
   key=tuple(sorted([r['id'],f['id']]))
   if key in seen:continue
   seen.add(key)
   row={'ids':[r['id'],f['id']],'definitions':[r['n'],f['n']],'packets':[r['packet'],f['packet']],'otherName':f['name'],'variant':f['variant']}
   if r['packet']==f['packet']:same.append(row);continue
   if frozenset((r['n'],f['n'])) in meshkeys:meshes.append(row);continue
   if any(x['bounds'] is None or not x['valid'] or not items(x['shape'],TopAbs_SOLID) for x in [r,f]):
    unqualified.append({**row,'reason':'Invalid, unbounded or non-solid source; not qualified using meshes'});continue
   rb,fb=fullbox(r),fullbox(f);gap=boxgap(rb,fb)
   if gap>1e-7:excluded.append({**row,'fullTurnBoxGapMm':gap});continue
   if f['oscillating']:
    unqualified.append({**row,'reason':'Oscillating neighbor not excluded by full-turn boxes; requires escapement phase study'});continue
   fast=max(abs(r['ratio']),abs(f['ratio']))
   ar,br=r['ratio']/fast,f['ratio']/fast
   period=360*lcm(ar.denominator,br.denominator)
   rigid=r['ratio']==f['ratio'] and np.linalg.norm(r['pivot'][:2]-f['pivot'][:2])<1e-9
   pairs.append({**row,'fastRatioToEscape':str(fast),'angularMultipliers':[str(ar),str(br)],'fastAnglePeriodDegrees':period,'activePeriodSeconds':float(Fraction(period,54)/fast),'constantRelativeTransform':bool(rigid),'intervals':0 if rigid else ceil(period/10)})
 # Prior deformed free-coil envelope; raised terminal is also present in source neighbors.
 spring=json.loads((ROOT/'artifacts/escapement-interfaces-20261026/spring-interfaces.json').read_text())
 coil=np.array(spring['conservativeEnvelopeMm'])
 coilrows=[{'definition':r['n'],'id':r['id'],'fullTurnBoxToPriorCoilEnvelopeGapMm':boxgap(fullbox(r),coil)} for r in new]
 return {'scope':'All 13 candidate leaves vs every source occurrence plus all 15 authored fitted-hand poses. Existing rotating neighbors use full-turn bounds or exact relative periods; no frozen-train approximation.', 'sourceAndFittedLeaves':len(rs),'pairs':pairs,'fullTurnBoxExclusions':excluded,'sameRigidPacket':same,'separatelyReviewedMeshes':meshes,'unqualified':unqualified,'springCoilEnvelope':coilrows}

def query(a,b):
 result=boolean(a,b,BRepAlgoAPI_Common).Shape()
 assert BRepCheck_Analyzer(result).IsValid()
 volume=sum(vol(s) for s in items(result,TopAbs_SOLID))
 # A zero common volume is not a positive distance bound. Avoid expensive
 # surface-distance minimization on large non-meshing neighbors.
 return float(volume),0.

def fixed_envelope(r,f):
 # Never infer emptiness from clipped source solids. Two valid-looking slab
 # Booleans lost existing shaft/bushing intersections during this review.
 bb=r['bounds'];p=r['pivot'];lo=bb[0,2]-.001;hi=bb[1,2]+.001
 radius=float(np.linalg.norm(corners(bb)[:,:2]-p[:2],axis=1).max())+.001
 axis=gp_Ax2(gp_Pnt(float(p[0]),float(p[1]),float(lo)),gp_Dir(0,0,1))
 enclosure=BRepPrimAPI_MakeCylinder(axis,radius,float(hi-lo)).Shape()
 result=boolean(enclosure,f['shape'],BRepAlgoAPI_Common).Shape();assert BRepCheck_Analyzer(result).IsValid()
 clear=not items(result,TopAbs_VERTEX)
 if clear:
  # Independent original-body check protects against a false empty Boolean.
  original=boolean(r['shape'],f['shape'],BRepAlgoAPI_Common).Shape();assert BRepCheck_Analyzer(original).IsValid()
  clear=not items(original,TopAbs_SOLID)
 return {'clear':clear,'radiusMm':radius,'fullBodyZBandMm':[float(lo),float(hi)],'method':'Unsliced full-body enclosing cylinder from tolerance-expanded BRep box plus 1 micrometre guard; empty enclosure intersection corroborated by original-body common'}

def radial_bound(r,f):
 # Bound original faces reaching common Z, without Boolean clipping. Face
 # bounds may include extra material and are deliberately conservative.
 lo=max(r['bounds'][0,2],f['bounds'][0,2])-1e-6
 hi=min(r['bounds'][1,2],f['bounds'][1,2])+1e-6
 rings=[]
 for x in [r,f]:
  p=x['pivot'];b=x['bounds']
  faces=[(face,bounds(face)) for face in items(x['shape'],TopAbs_FACE,TopoDS.Face_s)]
  faces=[(face,bb) for face,bb in faces if bb[1,2]>=lo and bb[0,2]<=hi]
  assert faces
  if 'verifiedOuterRadius' not in x:x['verifiedOuterRadius']=cylinder_bound(x,p)
  outer=min(x['verifiedOuterRadius'],max(float(np.linalg.norm(corners(bb)[:,:2]-p[:2],axis=1).max()) for face,bb in faces))+1e-6
  axis=BRepBuilderAPI_MakeEdge(gp_Pnt(float(p[0]),float(p[1]),float(b[0,2]-1)),gp_Pnt(float(p[0]),float(p[1]),float(b[1,2]+1))).Shape()
  wholeinner=dist(x['shape'],axis)
  inner=max(0.,min(dist(face,axis) for face,bb in faces)-1e-6) if wholeinner>1e-7 else 0.
  rings.append([inner,outer])
 d=float(np.linalg.norm(r['pivot'][:2]-f['pivot'][:2]))
 gap=max(d-rings[0][1]-rings[1][1],rings[0][0]-d-rings[1][1],rings[1][0]-d-rings[0][1])
 return {'gapLowerBoundMm':gap,'commonZBandMm':[float(lo),float(hi)],'annularRadiiMm':rings,'axisDistanceMm':d,'method':'Original faces reaching common Z: outer face boxes capped by verified unsliced containing cylinders; inner face-axis distances only after whole solid-axis separation, with 1 nm guards. No clipped source solids.'}

def screen(rs,inv):
 by={r['id']:r for r in rs};path=REVIEW/'neighbors.json'
 data=json.loads(path.read_text()) if path.exists() else {'scope':'Complete material-period samples at <=10 degrees on fastest member. Positive between-sample bounds certify nominal BRep separation only within CAD kernel accuracy; remaining zero-overlap samples are not continuous certificates. Baseline source fits are retained, not accepted mechanically.','pairs':[]}
 done={tuple(x['ids']) for x in data['pairs']}
 for pair in inv['pairs']:
  if tuple(pair['ids']) in done:continue
  r,f=[by[i] for i in pair['ids']];ar,br=[float(Fraction(x)) for x in pair['angularMultipliers']];count=pair['intervals']
  if not f['ratio']:
   enclosing=fixed_envelope(r,f)
   if enclosing['clear']:
    data['pairs'].append({**pair,'status':'continuous-swept-envelope','enclosure':enclosing});save_review('neighbors.json',data)
    print('enclosure',len(data['pairs']),pair['definitions'],flush=True);continue
  if count>1000:
   radial=radial_bound(r,f)
   print('radial',pair['definitions'],radial,flush=True)
   if radial['gapLowerBoundMm']>1e-7:
    data['pairs'].append({**pair,'status':'continuous-radial-bound','radialBound':radial});save_review('neighbors.json',data);continue
  if count>20000:
   data['pairs'].append({**pair,'status':'unresolved excessive relative period','requestedIntervals':count});save_review('neighbors.json',data);continue
  baselineVolume,_=query(r['baselineShape'],f['baselineShape'])
  angles=np.linspace(0,pair['fastAnglePeriodDegrees'],count+1) if count else [0.]
  delta=pair['fastAnglePeriodDegrees']/count/2 if count else 0
  # Distance decreases by no more than either body's maximum point displacement.
  displacement=sum(2*x['radius']*np.sin(np.deg2rad(delta*abs(mult))/2) if mult else 0 for x,mult in [(r,ar),(f,br)])
  rows=[];queries=0
  for angle in angles:
   mats=[matrix(x['pivot'],float(angle*mult)%360) for x,mult in [(r,ar),(f,br)]]
   boxes=[]
   for x,m in zip([r,f],mats):
    c=corners(x['bounds'])@m[:3,:3].T+m[:3,3];boxes.append(np.array([c.min(axis=0),c.max(axis=0)]))
   gap=boxgap(*boxes)
   if gap>displacement+1e-7:v=0.;kind='box-bound'
   else:
    sh=[moved(x['shape'],m) if mult else x['shape'] for x,m,mult in zip([r,f],mats,[ar,br])]
    v,gap=query(*sh);kind='BRep';queries+=1
   rows.append({'fastDegrees':float(angle),'commonMm3':v,'gapMm':gap,'method':kind})
  worst=max(rows,key=lambda r:r['commonMm3']);minimum=min(rows,key=lambda r:r['gapMm'])
  positive=minimum['gapMm']-displacement
  maxvol=worst['commonMm3']
  status='continuous-distance-bound' if positive>1e-7 else 'sampled-clear' if maxvol<1e-10 else 'retained-fit-overlap' if maxvol<=baselineVolume+max(1e-9,baselineVolume*1e-5) else 'increased-overlap'
  data['pairs'].append({**pair,'status':status,'baselineAuthoredCommonMm3':baselineVolume,'maximumCommonMm3':maxvol,'minimumSampledGapMm':minimum['gapMm'],'betweenSamplePointDisplacementMm':float(displacement),'continuousGapLowerBoundMm':float(positive),'worstOverlap':worst,'worstGap':minimum,'BRepQueries':queries,'samples':rows})
  save_review('neighbors.json',data)
  print('pair',len(data['pairs']),'/',len(inv['pairs']),pair['definitions'],pair['variant'],status,'max',maxvol,'baseline',baselineVolume,'queries',queries,flush=True)
 return data

def contact_review(rs):
 by={r['id']:r for r in rs};runtime=json.loads((REVIEW/'neighbor-runtime.json').read_text());rows=[]
 for p in runtime['pairs']:
  if p.get('maximumSourceCommonMm3',0)>1e-10 or not any(w['triangleIntersection'] for w in p.get('witnesses',[])):continue
  a,b=[by[i] for i in p['ids']]
  # Source and candidate phases have already been tested for common volume.
  # Resolve the surface-contact versus positive-clearance evidence explicitly.
  gap=dist(a['shape'],b['shape'])
  rows.append({'ids':p['ids'],'definitions':p['definitions'],'candidateStaticOriginalSolidGapMm':gap,'baselineSourceTriangleIntersection':p['baselineSourceTriangleIntersection'],'baselineAuthoredTriangleIntersection':p['baselineAuthoredTriangleIntersection'],'sourceCommonMm3':query(a['shape'],b['shape'])[0]})
  save_review('contact-review.json',{'scope':'Source-solid distances at candidate static phase for pre-existing triangle-contact witnesses. Near-zero distance is not positive running clearance; triangle surface intersection does not establish positive solid penetration.', 'pairs':rows})
  print('source/contact',p['definitions'],gap,flush=True)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('stage',choices=['inventory','neighbors','summarize','contacts']);args=p.parse_args()
 if args.stage=='summarize':summarize();sys.exit(0)
 rs,prior=prepare();inv=inventory(rs);save_review('inventory.json',inv)
 print('inventory',len(inv['pairs']),'candidate pairs',len(inv['fullTurnBoxExclusions']),'bounded exclusions',len(inv['unqualified']),'unqualified',flush=True)
 print('period intervals',sum(x['intervals']+1 for x in inv['pairs']),'max',max(x['intervals'] for x in inv['pairs']),flush=True)
 if args.stage=='neighbors':screen(rs,inv);summarize()
 if args.stage=='contacts':contact_review(rs)
