"""Sample original-solid sections against the independent deforming spring strip."""
from spring import *
from OCP.BRepPrimAPI import BRepPrimAPI_MakeCylinder
from OCP.gp import gp_Ax2

def run():
 records=assembly();data=np.load(OUT/'spring-curves.npz');curves=data['curves'];angles=data['angles'];src=data['source']
 cloud=curves.reshape(-1,3);bb=np.array([cloud.min(axis=0),cloud.max(axis=0)])
 bb[0,:2]-=.0175;bb[1,:2]+=.0175;bb[0,2]-=.1075;bb[1,2]+=.1075
 zs=np.linspace(bb[0,2]+.00001,bb[1,2]-.00001,5)
 selected=[];excluded=[];unqualified=[]
 for r in records:
  if r['n']==116:continue
  if not r['valid'] or r['bounds'] is None:
   unqualified.append(r['id']);continue
  rb=r['bounds'].copy()
  if r['owner'] in PIV:
   # Full rotation bound; deliberately conservative for the small pallet throw.
   radius=np.linalg.norm(corners(rb)[:,:2]-PIV[r['owner']][:2],axis=1).max()
   rb[:,:2]=np.array([PIV[r['owner']][:2]-radius,PIV[r['owner']][:2]+radius])
  if np.any(bb[1]+.001<rb[0]) or np.any(rb[1]+.001<bb[0]):excluded.append(r['id']);continue
  ps=[]
  for z in zs:
   try:ps.append(section(r['shape'],float(z),tol=.00002))
   except ValueError:ps.append(Polygon())
  selected.append((r,ps))
  print('spring section candidate',r['n'],r['name'],flush=True)
 # A complete cylindrical envelope strengthens the section checks for rigid
 # surroundings. Since it is axisymmetric, balance-part rotation cannot change
 # its intersection result. Collet/terminal attachments require local checks.
 radialmax=float(np.linalg.norm(cloud[:,:2]-PIV['balance'][:2],axis=1).max()+.0175+.0001)
 radialmin=min(LineString(p[:,:2]).distance(shapely.Point(PIV['balance'][:2])) for p in curves)-.0175-.0001
 axis=gp_Ax2(gp_Pnt(0,-10,float(bb[0,2]-.0001)),gp_Dir(0,0,1))
 height=float(bb[1,2]-bb[0,2]+.0002)
 envelope=boolean(BRepPrimAPI_MakeCylinder(axis,radialmax,height).Shape(),BRepPrimAPI_MakeCylinder(axis,radialmin,height).Shape(),BRepAlgoAPI_Cut).Shape()
 envelopechecks=[]
 for r,ps in selected:
  if r['n']==115:continue
  op=boolean(envelope,r['shape'],BRepAlgoAPI_Common)
  v=sum(vol(so) for so in items(op.Shape(),TopAbs_SOLID))
  envelopechecks.append({'id':r['id'],'definition':r['n'],'commonMm3':v})
 results=[]
 for angle,points in zip(angles,curves):
  poly=ribbon(points);row={'angleDegrees':float(angle),'pairs':[]}
  # Material adjacent to the collet is rigid with it; qualify the embedding
  # separately and require the rest of the spring to remain clear.
  lengths=np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))]
  free=ribbon(points[lengths>=.60])
  for r,ps in selected:
   owner=r['owner'];sections=ps
   if owner=='balance':sections=[rot(p,'balance',float(angle)) for p in ps]
   elif owner in PIV:raise ValueError('Unexpected pallet/escape at spring slab; needs cycle-specific pose')
   areas=[poly.intersection(p).area for p in sections];freeareas=[free.intersection(p).area for p in sections]
   gaps=[poly.distance(p) for p in sections if not p.is_empty]
   row['pairs'].append({'id':r['id'],'definition':r['n'],'maximumSectionOverlapMm2':max(areas),
    'freeStripMaximumSectionOverlapMm2':max(freeareas),'minimumSectionGapMm':min(gaps) if gaps else None})
  results.append(row)
 save('spring-interfaces.json',{'scope':'Deformed planar coil shapes against five original BRep sections through its 0.215 mm height; original raised outer terminal held fixed; not a full 3D swept proof',
  'curveSha256':digest(OUT/'spring-curves.npz'),'sectionHeightsMm':zs.tolist(),'sectionChordToleranceMm':.00002,
  'conservativeEnvelopeMm':bb.tolist(),'selectedLeafIds':[r['id'] for r,p in selected],
  'coilAnnulusRadiiMm':[radialmin,radialmax],'coilAnnulusSolidChecks':envelopechecks,
  'boundingExcludedLeafIds':excluded,'invalidOrUnboundedLeafIds':unqualified,'samples':results})

if __name__=='__main__':run()
