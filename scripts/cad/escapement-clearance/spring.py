"""Offline, constrained geometric hairspring deformation. No dynamics claim."""
from interfaces import *
from OCP.BRepAdaptor import BRepAdaptor_Surface
from scipy.optimize import minimize
from shapely import STRtree

def coil_source(d, resolution=200):
 faces=items(d.world(116),TopAbs_FACE,TopoDS.Face_s)
 # Paired original cylindrical strip walls, ordered inner to outer.
 pairs=[(30,32)]+[(i,62-i) for i in range(29,3,-1)]+[(3,0),(2,1)]
 points=[];joins=[];meta=[]
 for i,j in pairs:
  a,b=[BRepAdaptor_Surface(faces[k]) for k in (i,j)]
  assert abs(abs(a.Cylinder().Radius()-b.Cylinder().Radius())-.035)<1e-9
  assert np.linalg.norm(xyz(a.Cylinder().Location())-xyz(b.Cylinder().Location()))<1e-8
  lo=max(a.FirstUParameter(),b.FirstUParameter());hi=min(a.LastUParameter(),b.LastUParameter())
  us=np.linspace(lo,hi,resolution+1)
  ps=np.array([(xyz(a.Value(u,.1075))+xyz(b.Value(u,.1075)))/2 for u in us])
  if points:joins.append(float(np.linalg.norm(points[-1]-ps[0])))
  points.extend(ps if not points else ps[1:]);meta.append({'faces':[i,j],'radiusMm':(a.Cylinder().Radius()+b.Cylinder().Radius())/2,'sweepRadians':hi-lo})
 assert max(joins)<1e-8
 return np.array(points),meta

def deform(source, degrees, initial=None, modes=32):
 xy=source[:,:2];ds=np.diff(xy,axis=0);lengths=np.linalg.norm(ds,axis=1)
 s=np.r_[0,np.cumsum(lengths)];mid=(s[:-1]+s[1:])/2
 # Keep short attachment neighborhoods rigid with their respective ends.
 u=np.clip((mid-.60)/(s[-1]-1.10),0,1);active=(u>0)&(u<1)
 theta=np.unwrap(np.arctan2(ds[:,1],ds[:,0]));delta=np.deg2rad(degrees)
 kk=np.arange(1,modes+1);basis=np.sin(np.pi*u[:,None]*kk);basis[~active]=0
 # Rescale coefficients by frequency to condition the quadratic bending proxy.
 basis=basis/(np.pi*kk);base=theta+delta*(1-u)
 m=matrix(PIV['balance'],degrees);start=(m@np.r_[source[0],1])[:2];target=xy[-1]-start
 def integration(a):
  t=base+basis@a;v=np.column_stack((np.cos(t),np.sin(t)))*lengths[:,None]
  return v
 def residual(a):return integration(a).sum(axis=0)-target
 def jac(a):
  t=base+basis@a
  return np.array([(-np.sin(t)*lengths)@basis,(np.cos(t)*lengths)@basis])
 opt=minimize(lambda a:.5*np.dot(a,a), np.zeros(modes) if initial is None else initial,
  jac=lambda a:a, constraints={'type':'eq','fun':residual,'jac':jac},method='SLSQP',
  options={'ftol':1e-12,'maxiter':300})
 if not opt.success:
  # SLSQP can stall at machine precision despite a converged endpoint. Retry
  # with a less stringent objective tolerance; retain the endpoint criterion.
  opt=minimize(lambda a:.5*np.dot(a,a),opt.x,jac=lambda a:a,
   constraints={'type':'eq','fun':residual,'jac':jac},method='SLSQP',
   options={'ftol':1e-9,'maxiter':150})
 assert opt.success and np.linalg.norm(residual(opt.x))<1e-8,(degrees,opt.message,residual(opt.x))
 points=np.column_stack((np.vstack((start,start+np.cumsum(integration(opt.x),axis=0))),source[:,2]))
 return points,opt.x,{'angleDegrees':float(degrees),'endpointResidualMm':float(np.linalg.norm(points[-1]-source[-1])),
  'maximumSegmentLengthErrorMm':float(np.max(np.abs(np.linalg.norm(np.diff(points,axis=0),axis=1)-lengths))),
  'maximumDisplacementMm':float(np.max(np.linalg.norm(points-source,axis=1))),
  'innerTangentRotationDegrees':float(np.rad2deg(np.arctan2(np.linalg.det(np.array([ds[0],np.diff(points[:2,:2],axis=0)[0]])),np.dot(ds[0],np.diff(points[:2,:2],axis=0)[0])))),
  'outerTangentErrorDegrees':float(np.rad2deg(np.arctan2(np.linalg.det(np.array([ds[-1],np.diff(points[-2:,:2],axis=0)[0]])),np.dot(ds[-1],np.diff(points[-2:,:2],axis=0)[0])))),
  'solverIterations':int(opt.nit)}

def ribbon(points,width=.035):
 tangent=np.gradient(points[:,:2],axis=0);tangent/=np.linalg.norm(tangent,axis=1)[:,None]
 normal=np.column_stack((-tangent[:,1],tangent[:,0]))
 return Polygon(np.vstack((points[:,:2]+normal*width/2,(points[:,:2]-normal*width/2)[::-1])))

def interturn_gap(points):
 # Nonlocal centerline chunks; exclude arclength neighbors within 0.5 mm.
 s=np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))]
 splits=np.unique(np.r_[np.searchsorted(s,np.arange(0,s[-1],.25)),len(s)-1])
 chunks=[LineString(points[a:b+1,:2]) for a,b in zip(splits[:-1],splits[1:])]
 tree=STRtree(chunks);ii,jj=tree.query(chunks,predicate='dwithin',distance=.3)
 keep=(jj>ii+3);ii,jj=ii[keep],jj[keep]
 return float(np.min(shapely.distance(np.array(chunks,dtype=object)[ii],np.array(chunks,dtype=object)[jj]))-.035)

def run():
 d=Data();src,arcs=coil_source(d);rows=[];curves=[]
 angles=sorted(set(np.arange(-180,181,10)+CENTER['balance'])|{0.,CENTER['balance']})
 prev=None
 for deg in angles:
  p,prev,row=deform(src,deg,prev)
  poly=ribbon(p);row.update(ribbonValid=bool(poly.is_valid),centerlineSimple=bool(LineString(p[:,:2]).is_simple),
   minimumNonlocalStripGapMm=interturn_gap(p),maximumRadiusMm=float(np.linalg.norm(p[:,:2]-PIV['balance'][:2],axis=1).max()))
  curves.append(p);rows.append(row);print('spring',round(deg,4),'end',row['endpointResidualMm'],'turn gap',row['minimumNonlocalStripGapMm'],'valid',row['ribbonValid'],flush=True)
 np.savez_compressed(OUT/'spring-curves.npz',source=src,angles=angles,curves=curves)
 solids=items(d.world(116),TopAbs_SOLID)
 save('spring.json',{'sourceDefinition':116,'sourceSolidVolumesMm3':[vol(s) for s in solids],
  'stripWidthMm':.035,'stripHeightMm':.215,'coilPlaneCenterZMm':float(src[0,2]),
  'arcs':arcs,'coilTurns':sum(x['sweepRadians'] for x in arcs)/(2*np.pi),
  'polygonalCenterlineLengthMm':float(np.linalg.norm(np.diff(src,axis=0),axis=1).sum()),
  'innerEndpointWorldMm':src[0].tolist(),'outerCoilEndpointWorldMm':src[-1].tolist(),
  'method':'32 sine modes minimizing a quadratic change-of-bending proxy with exact discrete endpoint and segment-length constraints; inner 0.60 mm (including source collet embedding at arclength 0.231–0.500 mm) rotates, outer 0.5 mm and original raised terminal stay fixed. Geometric feasibility, not stress, frequency, energy, or 3D elastic equilibrium.',
  'samples':rows})

if __name__=='__main__':run()
