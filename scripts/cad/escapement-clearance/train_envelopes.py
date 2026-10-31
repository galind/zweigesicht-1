"""Conservative full-rotation boxes linking new train motion to prior spring work."""
from train_coupling import *
from OCP.BRepPrimAPI import BRepPrimAPI_MakeCylinder
from OCP.gp import gp_Ax2

def cylinder_bound(r,pivot):
 bb=r['bounds'];lo=float(np.max(np.abs(bb[:,:2]-pivot[:2])));hi=float(np.linalg.norm(corners(bb)[:,:2]-pivot[:2],axis=1).max())+.001
 axis=gp_Ax2(gp_Pnt(float(pivot[0]),float(pivot[1]),float(bb[0,2]-.001)),gp_Dir(0,0,1))
 def contained(radius):
  cylinder=BRepPrimAPI_MakeCylinder(axis,radius,float(bb[1,2]-bb[0,2]+.002)).Shape()
  remainder=boolean(r['shape'],cylinder,BRepAlgoAPI_Cut).Shape()
  assert BRepCheck_Analyzer(remainder).IsValid()
  return not items(remainder,TopAbs_VERTEX)
 assert contained(hi)
 # Keep a verified containing radius; empty subtraction, not sampled vertices.
 for _ in range(10):
  mid=(lo+hi)/2
  if contained(mid):hi=mid
  else:lo=mid
 return hi

def swept_box(r,pivot):
 bb=r['bounds'].copy()
 radius=np.linalg.norm(corners(bb)[:,:2]-pivot[:2],axis=1).max()
 bb[:,:2]=[pivot[:2]-radius,pivot[:2]+radius]
 return bb

def gap(a,b):
 return float(np.linalg.norm(np.maximum(0,np.maximum(a[0]-b[1],b[0]-a[1]))))

def run():
 rs,by,pivots=setup();new=[by[n] for k,ns in MEMBERS.items() if k!='escape' for n in ns]
 spring=json.loads((OUT/'spring-interfaces.json').read_text());bb=np.array(spring['conservativeEnvelopeMm'])
 # The raised terminal stays fixed and was included in the ordinary neighbor screen.
 springrows=[{'definition':r['n'],'fullRotationBoxGapMm':gap(swept_box(r,pivots[next(k for k,ns in MEMBERS.items() if r['n'] in ns)]),bb)} for r in new]
 pairs=[]
 for r in new:
  rb=swept_box(r,pivots[next(k for k,ns in MEMBERS.items() if r['n'] in ns)])
  for f in rs:
   if f['owner'] not in ['balance','pallet']:continue
   if not f['valid'] or f['bounds'] is None:continue
   pairs.append({'moving':r['n'],'other':f['n'],'otherId':f['id'],
    'fullRotationBoxGapMm':gap(rb,swept_box(f,PIV[f['owner']]))})
 radii={};cylinderrows=[];lookup={r['id']:r for r in rs}
 for row in pairs:
  if row['fullRotationBoxGapMm']>0:continue
  r=by[row['moving']];f=lookup[row['otherId']];rp=pivots[next(k for k,ns in MEMBERS.items() if r['n'] in ns)];fp=PIV[f['owner']]
  for part,p in [(r,rp),(f,fp)]:
   if part['id'] not in radii:radii[part['id']]=cylinder_bound(part,p)
  lower=float(np.linalg.norm(rp[:2]-fp[:2])-radii[r['id']]-radii[f['id']])
  cylinderrows.append({**row,'radialGapLowerBoundMm':lower})
  print('cylinder bound',r['n'],f['n'],lower,flush=True)
 save_train('envelopes.json',{'scope':'Full-turn boxes then verified containing cylinders for new train leaves vs sampled spring coil envelope and valid balance/pallet leaves; cylinder bounds verified by empty original-solid subtraction',
  'springInputSha256':digest(OUT/'spring-interfaces.json'),'spring':springrows,'balancePallet':pairs,
  'containingCylinderRadiiMm':radii,'cylinderRefinements':cylinderrows})
 print('spring unresolved',[r for r in springrows if r['fullRotationBoxGapMm']==0],flush=True)
 print('balance/pallet unresolved after cylinder refinement',[r for r in cylinderrows if r['radialGapLowerBoundMm']<=0],flush=True)

if __name__=='__main__':run()
