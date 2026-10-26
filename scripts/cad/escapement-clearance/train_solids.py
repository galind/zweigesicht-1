"""Whole-solid corroboration at representative actual-tooth phases."""
from train_coupling import *

def run():
 _,by,pivots=setup();periods=json.loads((TRAIN/'periods.json').read_text());results=[]
 for pair,period in zip(PAIRS,periods['pairs']):
  a,b,na,nb,z,oa,ob=pair
  angles=sorted(set([0.,period['worstGapFastDegrees'],period['fastPeriodDegrees']]+
   [float(i*360/na/8) for i in range(1,9)]+[float(period['fastPeriodDegrees']*f) for f in [.125,.333,.5,.777]]))
  rows=[]
  for angle in angles:
   follower=-angle*na/nb
   aa=moved(by[a]['shape'],matrix(pivots[oa],angle%360));bb=moved(by[b]['shape'],matrix(pivots[ob],follower%360))
   op=boolean(aa,bb,BRepAlgoAPI_Common);sh=op.Shape();assert BRepCheck_Analyzer(sh).IsValid()
   v=sum(vol(s) for s in items(sh,TopAbs_SOLID));gap=dist(aa,bb)
   rows.append({'fastDegrees':angle,'slowDegrees':follower,'commonVolumeMm3':v,'gapMm':gap})
  results.append({'pair':[a,b],'samples':rows});save_train('solids.partial.json',results)
  print('solid pair',a,b,'count',len(rows),'min gap',min(x['gapMm'] for x in rows),'max common',max(x['commonVolumeMm3'] for x in rows),flush=True)
 save_train('solids.json',{'periodsSha256':digest(TRAIN/'periods.json'),'scope':'Original whole-solid common and distance at first-pitch fractions, worst sampled section phase, fractional pair periods and loop closure; selected poses, not dense whole-solid sweep','pairs':results})
 (TRAIN/'solids.partial.json').unlink()

if __name__=='__main__':run()
