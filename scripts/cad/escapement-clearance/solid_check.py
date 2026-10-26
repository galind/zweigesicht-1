from passage import *
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakePolygon,BRepBuilderAPI_MakeFace
from OCP.BRepPrimAPI import BRepPrimAPI_MakePrism
from OCP.gp import gp_Vec
def cutter_solid(poly):
 def wire(coords):
  b=BRepBuilderAPI_MakePolygon()
  for x,y in list(coords)[:-1]:b.Add(gp_Pnt(x,y,-.19))
  b.Close();return b.Wire()
 face=BRepBuilderAPI_MakeFace(wire(poly.exterior.coords))
 for ring in poly.interiors:face.Add(wire(ring.coords))
 return BRepPrimAPI_MakePrism(face.Face(),gp_Vec(0,0,.22)).Shape()
def candidate(d):
 p=json.loads((HERE/'passage.json').read_text())
 cutter=shapely.from_wkt(p['cutterWkt']).intersection(box(2.2,-.45,2.9,.45)).simplify(.00002,preserve_topology=True).buffer(.0001,quad_segs=8)
 print('cutter polygon vertices',len(cutter.exterior.coords),flush=True)
 tool=cutter_solid(cutter);op=boolean(d.shapes[126],tool,BRepAlgoAPI_Cut);shape=op.Shape();assert BRepCheck_Analyzer(shape).IsValid()
 assert len(items(shape,TopAbs_SOLID))==1
 BRepTools.Write_s(shape,str(HERE/'candidate-fork.brep'))
 body=shapely.from_wkt(p['sourceBodyWkt']);cut=body.intersection(cutter);candidate2=body.difference(cutter)
 # Maximum sampled depth of the removed region from the original section boundary.
 bound=candidate2.boundary;pts=[bound.interpolate(float(t)) for t in np.linspace(0,bound.length,40001)]
 depths=np.array([x.distance(body.boundary) if body.covers(x) else 0 for x in pts])
 info={'valid':True,'solids':1,'sourceVolumeMm3':vol(d.shapes[126]),'candidateVolumeMm3':vol(shape),'removedVolumeMm3':vol(d.shapes[126])-vol(shape),'cutterPolylineSimplificationMm':.00002,'additionalBufferMm':.0001,'maximumSampledSectionRemovalDepthMm':float(depths.max()),'sourceBodyHash':digest(ROOT/'artifacts/escapement/brep-cache/126.brep'),'candidateHash':digest(HERE/'candidate-fork.brep'),'cutterWkt':cutter.wkt}
 write('candidate-solid.json',info);print(json.dumps({k:v for k,v in info.items() if k!='cutterWkt'},indent=2),flush=True)
 return moved(shape,d.occ(126)[0]['worldTransform'])
def check():
 d=Data();body=candidate(d);sourcebody=d.world(126);imp=d.world(112);roller=d.world(114);safety=d.world(130);horn=d.world(129);wheel=d.world(233);jewels=[d.world(128,i) for i in [0,1]];pins=[d.world(200,i) for i in [0,1]]
 cy=json.loads((HERE/'cycle.json').read_text());allrows=cy['samples']
 # Refined around engagement; coarse free arcs additionally checked through full 180° amplitude.
 chosen=[(i,s) for i,s in enumerate(allrows) if (abs(s['balance'])<=65 and i%4==0) or i%40==0]
 rows=[]
 for k,(idx,s) in enumerate(chosen):
  b,p,e=CENTER['balance']+s['balance'],CENTER['pallet']+s['pallet'],s['escape']
  a=turn(imp,'balance',b);r=turn(roller,'balance',b);f=turn(body,'pallet',p);sa=turn(safety,'pallet',p);h=turn(horn,'pallet',p);w=turn(wheel,'escape',e);js=[turn(j,'pallet',p) for j in jewels]
  pairs={'impulse-corrected-fork':(a,f),'roller-fork':(r,f),'roller-safety':(r,sa),'impulse-safety':(a,sa),'roller-horn':(r,h),'impulse-horn':(a,h),'wheel-jewel3':(w,js[0]),'wheel-jewel4':(w,js[1]),'fork-pin8':(f,pins[0]),'fork-pin9':(f,pins[1])}
  result={}
  for name,(aa,bb) in pairs.items():
   gap=dist(aa,bb);commonvol=common(aa,bb) if gap<1e-6 else 0.
   result[name]={'gapMm':gap,'commonVolumeMm3':commonvol,'commonMethod':'computed' if gap<1e-6 else 'not computed; positive separation'}
  rows.append({'sample':idx,**s,'pairs':result})
  if k%10==0:
   write('solid-samples.partial.json',rows);print('solid sample',k,'/',len(chosen),'minimum',min(v['gapMm'] for v in result.values()),'overlaps',[name for name,v in result.items() if v['commonVolumeMm3']>1e-10],flush=True)
 write('solid-samples.json',rows)
 summary={name:{'minimumGapMm':min(r['pairs'][name]['gapMm'] for r in rows),'maximumCommonMm3':max(r['pairs'][name]['commonVolumeMm3'] for r in rows),'minimumSample':min(rows,key=lambda r:r['pairs'][name]['gapMm'])['sample']} for name in rows[0]['pairs']}
 write('solid-summary.json',{'sampleCount':len(rows),'scope':'10 core pairs; sampled, not whole-movement or continuous certification','pairs':summary});print(json.dumps(summary,indent=2),flush=True)
if __name__=='__main__':check()
