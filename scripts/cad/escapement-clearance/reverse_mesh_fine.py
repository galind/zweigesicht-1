"""Refine the narrow hour-wheel phase window using original 0.2 nm sections.
Exploration only; continuous polygon bounds are in reverse_mesh_fine_bound.py.
"""
import sys
sys.path.insert(0,'scripts/cad/escapement-clearance')
from reverse_mesh_diagnosis import *
from scipy.optimize import minimize_scalar
source,rr=inputs();r=rr[1];cache=ROOT/'artifacts/escapement-interfaces-20261026';polys=[];shapes=[]
cachemeta=json.loads((cache/'source-cache.json').read_text())
for n in r['pair']:
 assert digest(cache/'brep'/f'd_0_1_1_{n}.brep')==cachemeta['files'][f'd_0_1_1_{n}.brep']
 sh=TopoDS_Shape();assert BRepTools.Read_s(sh,str(cache/'brep'/f'd_0_1_1_{n}.brep'),BRep_Builder())
 sh=moved(sh,np.array(source['leaves'][str(n)]['worldTransform']));shapes.append(sh)
 p=section(sh,r['z'],tol=.0000002);polys.append(p)
 print('fine section',n,len(p.exterior.coords),flush=True)
save('fine-sections.json',{'tolMm':.0000002,'polygons':{str(n):p.wkt for n,p in zip(r['pair'],polys)}})
delta=r['pivots'][1]-r['pivots'][0];theta=np.arctan2(delta[1],delta[0]);aa,bb=[frame(Polygon(p.exterior),r['pivots'][0],theta) for p in polys]
w=r['window'];d=r['distance'];angles=np.linspace(0,45,769)
pa=[shapely.clip_by_rect(rotate(aa,float(x),origin=(0,0)),*w) for x in angles]
def evaluate(offset):
 values=[]
 for x,p in zip(angles,pa):
  q=shapely.clip_by_rect(rotate(bb,float(-x/4+offset),origin=(d,0)),*w)
  area=p.intersection(q).area
  values.append(-math.sqrt(area) if area>0 else p.distance(q))
 i=int(np.argmin(values));return min(values),float(angles[i])
rows=[]
for offset in np.linspace(.268,.274,25):
 score,angle=evaluate(offset);rows.append({'offset':float(offset),'score':score,'angle':angle})
print('best grid',sorted(rows,key=lambda x:-x['score'])[:5],flush=True)
opt=minimize_scalar(lambda x:-evaluate(x)[0],bounds=(.268,.274),method='bounded',options={'xatol':1e-9})
print('opt',opt.x,evaluate(opt.x),flush=True)
save('fine-search.json',{'scope':'Exploratory one-tooth period; source exterior rings only. Full-material validation separate. Negative score is sqrt area, positive is clearance, not signed penetration depth.','grid':rows,'bestOffset':float(opt.x),'bestResult':evaluate(opt.x)})
