"""Actual decoded mesh sections through exported production runtime transforms."""
from motion_works import *
import trimesh
from shapely.affinity import affine_transform

def mesh_section(r,z):
 mesh=trimesh.Trimesh(vertices=np.array(r['position']).reshape(-1,3),faces=np.array(r['index']).reshape(-1,3),process=False)
 mesh.apply_transform(np.array(r['matrix']).reshape(4,4).T)
 seg=trimesh.intersections.mesh_plane(mesh,[0,0,1],[0,0,z])
 polys=list(polygonize(unary_union([LineString(np.round(p[:,:2],7)) for p in seg])))
 assert polys
 return max(polys,key=lambda p:p.area)

def run():
 records={r['n']:r for r in json.loads((OUTPUT/'runtime-meshes.json').read_text())}
 transforms=json.loads((OUTPUT/'runtime-transforms.json').read_text());results=[]
 source=json.loads((OUTPUT/'source.json').read_text());exact=json.loads((OUTPUT/'sections.json').read_text())
 for pair in transforms:
  a,b=pair['pair'];z=pair['z'];polys=[mesh_section(records[n],z) for n in [a,b]]
  centers=[np.array(source['leaves'][str(n)]['worldTransform'])[:2,3] for n in [a,b]]
  radii=[float(np.linalg.norm(shapely.get_coordinates(p)-c,axis=1).max()) for p,c in zip(polys,centers)]
  low=np.maximum(centers[0]-radii[0],centers[1]-radii[1])-.05
  high=np.minimum(centers[0]+radii[0],centers[1]+radii[1])+.05
  window=[*low,*high];gaps=[];areas=[]
  for row in pair['rows']:
   p,q=[shapely.clip_by_rect(affine_transform(p,row[key]),*window) for p,key in zip(polys,['a','b'])]
   assert p.is_valid and q.is_valid and not p.is_empty and not q.is_empty
   gaps.append(min(.05,p.distance(q)));areas.append(p.intersection(q).area)
  result={'pair':[a,b],'configurations':len(gaps),'minimumSampledGapMm':min(gaps),'maximumOverlapMm2':max(areas),'overlapConfigurations':sum(x>1e-12 for x in areas),'worstOverlapTimeSeconds':pair['rows'][int(np.argmax(areas))]['t'],'sourceVersusRuntimeSectionAreasMm2':[[shapely.from_wkt(exact['polygons'][f'{n}@{z}']).area,p.area] for n,p in zip([a,b],polys)]}
  results.append(result);print(result,flush=True)
 save_motion('runtime-sections.json',{'scope':'Complete relative orientation periods, actual runtime mesh sections and production shaft/time transforms; sampled evidence only, no continuous solid bound','transformSha256':digest(OUTPUT/'runtime-transforms.json'),'pairs':results})
if __name__=='__main__':run()
