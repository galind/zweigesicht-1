"""Adaptive planar bound for the isolated rear-hour phase, not a solid certificate."""
from reverse_mesh_diagnosis import *

source,rs=inputs();r=rs[1]
fine=json.loads((OUT/'fine-sections.json').read_text());offset=json.loads((OUT/'fine-search.json').read_text())['bestOffset']
delta=r['pivots'][1]-r['pivots'][0];theta=np.arctan2(delta[1],delta[0])
original=[shapely.from_wkt(fine['polygons'][str(n)]) for n in r['pair']]
polys=[frame(Polygon(p.exterior),r['pivots'][0],theta) for p in original]
r['radii']=[float(np.linalg.norm(np.array(p.exterior.coords)-c,axis=1).max())+1e-10 for p,c in zip(polys,[(0,0),(r['distance'],0)])]
symmetry=[]
# Equal ordered vertices under a cyclic shift bound both vertices and straight
# edges. Check every tooth-pitch copy, not just a sampled point-cloud Hausdorff.
for p,n,c,other_radius,original_poly in zip(polys,r['teeth'],[(0,0),(r['distance'],0)],r['radii'][::-1],original):
 coords=np.array(p.exterior.coords[:-1]);center=np.array(c);max_error=0
 for k in range(1,n):
  a=2*np.pi*k/n;rot=np.array([[np.cos(a),-np.sin(a)],[np.sin(a),np.cos(a)]])
  turned=(coords-center)@rot.T+center
  j=int(np.argmin(np.linalg.norm(coords-turned[0],axis=1)))
  error=float(np.linalg.norm(np.roll(coords,-j,axis=0)-turned,axis=1).max());max_error=max(max_error,error)
 assert max_error<1e-8
 max_hole=max([float(np.linalg.norm(np.array(h.coords)-pivot,axis=1).max()) for h in original_poly.interiors for pivot in [r['pivots'][len(symmetry)]]],default=0)
 assert max_hole<r['distance']-other_radius
 symmetry.append({'teeth':n,'vertices':len(coords),'allPitchCopiesEdgeDisplacementBoundMm':max_error,'maximumHoleRadiusMm':max_hole,'otherBodyMinimumReachRadiusMm':r['distance']-other_radius})
ra,rb=r['radii'];aa,bb=polys;d=r['distance'];w=r['window'];memo={};certified=[];unresolved=[]
def evaluate(x):
 if x not in memo:
  p=shapely.clip_by_rect(rotate(aa,x,origin=(0,0)),*w)
  q=shapely.clip_by_rect(rotate(bb,-x/4+offset,origin=(d,0)),*w)
  assert p.is_valid and q.is_valid
  memo[x]=min(.05,p.distance(q))
 return memo[x]
stack=[(0.,45.,0)]
while stack:
 lo,hi,depth=stack.pop();g=min(evaluate(lo),evaluate(hi));halfstep=np.deg2rad(hi-lo)/2
 motion=2*ra*np.sin(halfstep/2)+2*rb*np.sin(halfstep/8)
 if g-motion>1e-6:certified.append((lo,hi,g-motion));continue
 if depth>=24 or len(memo)>100000 or g==0:
  unresolved.append({'lo':lo,'hi':hi,'gap':g,'depth':depth});break
 mid=(lo+hi)/2;stack.extend([(mid,hi,depth+1),(lo,mid,depth+1)])
result={'scope':'Continuous bound for planar polygons only; adaptive one-pitch cover plus explicit edge-displacement bounds for every material-period tooth copy. No continuous BRep or manufacturing claim.','sectionChordSamplingToleranceMm':fine['tolMm'],'offsetWorldDegrees':offset,'evaluations':len(memo),'certifiedIntervals':len(certified),'unresolved':unresolved,'remainingIntervals':len(stack),'minimumSampledGapMm':min(memo.values()),'worstSampleFastDegrees':min(memo,key=memo.get),'minimumCertifiedOnePitchPolygonBoundMm':min((x[2] for x in certified),default=None),'symmetry':symmetry}
if not unresolved and not stack:
 result['fullMaterialPeriodPolygonGapLowerBoundMm']=min(x[2] for x in certified)-sum(x['allPitchCopiesEdgeDisplacementBoundMm'] for x in symmetry)
# Corroborate the finely located pinch points with the original whole solids.
cache=ROOT/'artifacts/escapement-interfaces-20261026';cm=json.loads((cache/'source-cache.json').read_text());solids=[];tolerances=[]
for n in r['pair']:
 name=f'd_0_1_1_{n}.brep';assert digest(cache/'brep'/name)==cm['files'][name]
 sh=TopoDS_Shape();assert BRepTools.Read_s(sh,str(cache/'brep'/name),BRep_Builder())
 solids.append(moved(sh,np.array(source['leaves'][str(n)]['worldTransform'])))
 tolerances.append({'definition':n,'maxFaceToleranceMm':max(BRep_Tool.Tolerance_s(f) for f in items(sh,TopAbs_FACE,TopoDS.Face_s)),'maxEdgeToleranceMm':max(BRep_Tool.Tolerance_s(e) for e in items(sh,TopAbs_EDGE,TopoDS.Edge_s)),'maxVertexToleranceMm':max(BRep_Tool.Tolerance_s(v) for v in items(sh,TopAbs_VERTEX,TopoDS.Vertex_s))})
result['importedTolerances']=tolerances;result['fineWholeSolidWitnesses']=[]
for angle in [result['worstSampleFastDegrees'],11.19140625]:
 aa,bb=[moved(sh,matrix(np.r_[pivot,0],phase)) for sh,pivot,phase in zip(solids,r['pivots'],[angle,-angle/4+offset])]
 common_shape=boolean(aa,bb,BRepAlgoAPI_Common).Shape();assert BRepCheck_Analyzer(common_shape).IsValid()
 result['fineWholeSolidWitnesses'].append({'fastDegrees':angle,'followerDegrees':-angle/4+offset,'commonMm3':sum(vol(x) for x in items(common_shape,TopAbs_SOLID)),'gapMm':dist(aa,bb)})
save('fine-bound.json',result);print(json.dumps(result,indent=2),flush=True)
