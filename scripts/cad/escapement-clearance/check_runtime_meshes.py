"""Check actual loaded/sidecar mesh sections and interpolated spring/terminal gaps."""
from spring_terminal import *
import trimesh
TARGET=ROOT/'artifacts/running-movement'
def mesh_section(record,z):
 mesh=trimesh.Trimesh(vertices=np.array(record['position']).reshape(-1,3),faces=np.array(record['index']).reshape(-1,3),process=False)
 mesh.apply_transform(record['matrix'])
 segments=trimesh.intersections.mesh_plane(mesh,[0,0,1],[0,0,z])
 lines=[LineString(np.round(p[:,:2],7)) for p in segments]
 polys=list(polygonize(unary_union(lines)));assert polys
 # Polygonize retains hole rings; at these planes the largest connected region is the part section.
 return max(polys,key=lambda p:p.area)
def run():
 records=json.loads((TARGET/'runtime-meshes.json').read_text());sample=json.loads((TARGET/'runtime-samples.json').read_text())
 def parts(n):return [r for r in records if r['definition']==f'd_0_1_1_{n}']
 body=mesh_section(parts(126)[0],-1.85);impulse=mesh_section(parts(112)[0],-1.85);wheel=mesh_section(parts(233)[0],-1.82);jewels=unary_union([mesh_section(r,-1.82) for r in parts(128)])
 minimum={'fork':1e9,'wheel':1e9};bad=[]
 for i,p in enumerate(sample['poses']):
  for name,a,b in [('fork',rot(body,'pallet',p['pallet']),rot(impulse,'balance',p['balance'])),('wheel',rot(wheel,'escape',p['escape']),rot(jewels,'pallet',p['pallet']))]:
   gap=a.distance(b);minimum[name]=min(minimum[name],gap)
   if gap<1e-7:bad.append([i,name,a.intersection(b).area])
 assert not bad,bad[:10]
 print('actual mesh section gaps',minimum,flush=True)
 d=Data();faces=items(d.world(116),TopAbs_FACE,TopoDS.Face_s);facebounds=[(faces[i],bounds(faces[i])) for i in range(61,72)]
 points=np.fromfile(TARGET/'runtime-spring.bin',dtype='<f4').reshape(len(sample['angles']),sample['pointCount'],3).astype(float)
 src=np.load(OUT/'spring-curves.npz')['source'];arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(src[:,:2],axis=0),axis=1))];stop=np.where(arc<arc[-1]-.5)[0][-1]
 lower=1e9;queries=0
 # Every degree, including 10-degree atlas midpoints; original terminal faces.
 for k,pts in enumerate(points):
  for i in range(0,stop,20):
   j=min(i+20,stop);poly=ribbon(pts[i:j+1]);bb=np.array([[poly.bounds[0],poly.bounds[1],-3.355001],[poly.bounds[2],poly.bounds[3],-3.139999]]);sh=None
   for face,tb in facebounds:
    bound=float(np.linalg.norm(np.maximum(np.maximum(tb[0]-bb[1],bb[0]-tb[1]),0)))
    if bound>.05:lower=min(lower,bound);continue
    if sh is None:sh=prism(poly)
    gap=dist(sh,face);queries+=1;lower=min(lower,gap);assert gap>1e-7,(k,i)
  if k%60==0:print('runtime terminal',k,'gap bound',lower,'queries',queries,flush=True)
 report={'runtimeMeshConfigurations':len(sample['poses']),'minimumMeshSectionGapMm':minimum,'springTerminalConfigurations':len(points),'terminalDistanceQueries':queries,'terminalConservativeGapLowerBoundMm':lower,'scope':'Actual fork, jewel, escape wheel and pallet mesh planar sections; interpolated GPU coil ribbon prisms against original terminal faces, excluding the fixed attachment region; sampled, not continuous solid certification'}
 (TARGET/'mesh-check.json').write_text(json.dumps(report,indent=2)+'\n');print(report,flush=True)
if __name__=='__main__':run()
