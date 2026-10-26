"""Probe the output barrel boundary; no spring operating law is inferred."""
from train_coupling import *

def run():
 rs,by,pivots=setup();p=pivots['barrel'];drum=by[85]['shape'];cover=by[86]['shape']
 core=next(r['shape'] for r in rs if r['n']==87 and r['matrix'][0,3]<0)
 spring=next(r['shape'] for r in rs if r['n']==88 and r['matrix'][0,3]<0)
 initial={name:{'gapMm':dist(a,b),'commonMm3':common(a,b)} for name,a,b in [
  ('springCore',spring,core),('springDrum',spring,drum),('springCover',spring,cover)]}
 rows=[]
 for angle in range(0,360,10):
  m=matrix(p,angle);d=moved(drum,m);s=moved(spring,m);c=moved(cover,m)
  row={'angleDegrees':angle}
  for name,a,b in [('rotatingDrumFixedSpring',d,spring),('rotatingCoverFixedSpring',c,spring),
   ('rotatingSpringFixedCore',s,core),('rotatingDrumFixedCore',d,core)]:
   sh=boolean(a,b,BRepAlgoAPI_Common).Shape();assert BRepCheck_Analyzer(sh).IsValid()
   row[name+'CommonMm3']=sum(vol(x) for x in items(sh,TopAbs_SOLID))
  rows.append(row)
 save_train('barrel.json',{'scope':'Output barrel II only; 36 rigid poses, two alternative spring conventions; geometry alone does not establish attachments or unwinding',
  'initial':initial,'samples':rows,'conclusion':'Neither a frozen spring nor a spring rigidly carried with the drum is a solved mainspring deformation or torque model. Arbor, ratchets and the second barrel are excluded from the rigid drive.'})
 print('barrel boundary',initial,'max common',max(v for r in rows for k,v in r.items() if k.endswith('CommonMm3')),flush=True)

if __name__=='__main__':run()
