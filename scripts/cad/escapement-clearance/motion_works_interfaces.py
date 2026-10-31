"""Measure the two non-meshing interfaces without inferring constraints from axes."""
from motion_works import *

def run():
 rs=assembly();by={r['n']:r for r in rs if r['n'] in [93,137,214,217]}
 profiles={};report=[]
 for a,b,zs in [(93,137,[-1.3,-.5,-.275,-.15,.1]),(214,217,[-5.5,-5.2,-5.05])]:
  rows=[];p=by[a]['matrix'][:2,3]
  for z in zs:
   aa,bb=[section(by[n]['shape'],z,.00002) for n in [a,b]]
   profiles[f'{a}-{b}@{z}']=[aa.wkt,bb.wkt]
   rows.append({'zMm':z,'areasMm2':[aa.area,bb.area],'gapMm':aa.distance(bb),'commonAreaMm2':aa.intersection(bb).area,'shaftBoundsMm':list(aa.bounds), 'shaftRotated90SymmetricDifferenceAreaMm2':aa.symmetric_difference(rotate(aa,90,origin=tuple(p))).area,'shaftRotated45SymmetricDifferenceAreaMm2':aa.symmetric_difference(rotate(aa,45,origin=tuple(p))).area})
  report.append({'pair':[a,b],'sections':rows})
 save_motion('interfaces.json',{'profiles':profiles,'measurements':report})
 print(json.dumps(report,indent=2),flush=True)
 import matplotlib;matplotlib.use('Agg')
 import matplotlib.pyplot as plt
 fig,axes=plt.subplots(2,4,figsize=(13,7))
 for ax,(key,polys) in zip(axes.flat,profiles.items()):
  for poly,color in zip(polys,['#287da8','#e6a43c']):
   poly=shapely.from_wkt(poly)
   for g in getattr(poly,'geoms',[poly]):
    x,y=g.exterior.xy;ax.plot(x,y,color=color)
    for ring in g.interiors:x,y=ring.xy;ax.plot(x,y,color=color)
  ax.set_title(key);ax.set_aspect('equal');ax.grid(alpha=.2)
 fig.tight_layout();fig.savefig(OUTPUT/'interfaces.png',dpi=150)
if __name__=='__main__':run()
