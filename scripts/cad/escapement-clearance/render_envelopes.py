"""Conservative rendered-geometry envelopes for invalid eccentric source solids."""
from interfaces import *
from OCP.BRepPrimAPI import BRepPrimAPI_MakeCylinder
from shapely.geometry import MultiPoint,Point
from OCP.gp import gp_Ax2

def run():
 records=assembly();ecc=[r for r in records if r['n']==111];path=ROOT/'artifacts/cad/definition-cache/f34148903818-0.015-0.25/d_0_1_1_111.npz'
 assert digest(path)=='653a60fda965474e62ba6d401ee6bccc613338aeb9d67c8217a6c186ac7f6eb6'
 mesh=np.load(path);v=mesh['vertices'];box=corners(np.array([v.min(axis=0),v.max(axis=0)]));cloud=[];mins=[]
 for r in ecc:
  m=r['matrix'];pts=box@m[:3,:3].T+m[:3,3];cloud.extend(pts)
  mins.append(MultiPoint(pts[:,:2]).convex_hull.distance(Point(PIV['balance'][:2])))
 cloud=np.array(cloud);rmin=min(mins)-.0001;rmax=np.linalg.norm(cloud[:,:2]-PIV['balance'][:2],axis=1).max()+.0001
 zmin,zmax=cloud[:,2].min()-.0001,cloud[:,2].max()+.0001
 ax=gp_Ax2(gp_Pnt(0,-10,zmin),gp_Dir(0,0,1))
 ring=boolean(BRepPrimAPI_MakeCylinder(ax,rmax,zmax-zmin).Shape(),BRepPrimAPI_MakeCylinder(ax,rmin,zmax-zmin).Shape(),BRepAlgoAPI_Cut).Shape()
 rb=bounds(ring);rows=[];excluded=[];unqualified=[]
 samples=json.loads((HERE/'cycle.json').read_text())['samples'];indices=sorted(set(range(0,len(samples),80))|{len(samples)-1})
 for r in records:
  if r['owner']=='balance' or r['n']==116:continue
  if not r['valid'] or r['bounds'] is None:unqualified.append(r['id']);continue
  poses=[(None,r['shape'],r['bounds'])]
  if r['owner'] in PIV:
   poses=[]
   for idx in indices:
    m=matrix(PIV[r['owner']],samples[idx][r['owner']]+CENTER[r['owner']]);sh=moved(r['shape'],m);poses.append((idx,sh,bounds(sh)))
  for idx,sh,bb in poses:
   if np.any(rb[1]<bb[0]) or np.any(bb[1]<rb[0]):excluded.append([r['id'],idx]);continue
   op=boolean(ring,sh,BRepAlgoAPI_Common);v=sum(vol(s) for s in items(op.Shape(),TopAbs_SOLID))
   rows.append({'otherId':r['id'],'definition':r['n'],'sample':idx,'commonMm3':v})
 # The recovery diamond has no bounded valid original BRep. Its rendered
 # triangle bounds can still establish axial separation from moving parts.
 import trimesh
 diamond=next(r for r in records if r['n']==225);dp=ROOT/'explorer/public/models/diamond-c74ee2731a1f.stl'
 assert digest(dp)=='c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a'
 dm=trimesh.load_mesh(dp,process=False);dm.apply_transform(diamond['matrix']);db=dm.bounds
 checks=[]
 for r in records:
  if r['owner'] not in PIV:continue
  mb=rb.copy() if r['n']==111 else r['bounds'].copy()
  radius=np.linalg.norm(corners(mb)[:,:2]-PIV[r['owner']][:2],axis=1).max()
  mb[:,:2]=np.array([PIV[r['owner']][:2]-radius,PIV[r['owner']][:2]+radius])
  gap=max(db[0,2]-mb[1,2],mb[0,2]-db[1,2])
  boxgap=np.linalg.norm(np.maximum(np.maximum(db[0]-mb[1],mb[0]-db[1]),0))
  checks.append({'id':r['id'],'axialGapMm':float(gap),'fullRotationBoxGapMm':float(boxgap)})
 curves=np.load(OUT/'spring-curves.npz')['curves'];springmax=np.linalg.norm(curves[:,:,:2]-PIV['balance'][:2],axis=2).max()+.0175
 save('render-envelopes.json',{'scope':'Full-rotation annular superset of all four cached rendered eccentric meshes, not qualification of invalid original CAD; valid static solids and sampled moving pallet/escape solids screened against the envelope',
  'meshSha256':digest(path),'radiiMm':[rmin,rmax],'zRangeMm':[zmin,zmax],
  'springEnvelopeRadialGapMm':float(rmin-springmax),'exactCommonChecks':rows,'boundingExclusions':len(excluded),'unqualifiedSourceIds':unqualified,
  'diamondRecoverySha256':digest(dp),'diamondRenderedBoundsMm':db.tolist(),'diamondAxialChecks':checks})
 print('envelope',rmin,rmax,'exact checks',len(rows),'overlap',sum(x['commonMm3']>1e-8 for x in rows),'spring gap',rmin-springmax,flush=True)

if __name__=='__main__':run()
