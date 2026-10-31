"""Independent source-section checks of samples exported by actual TypeScript runtime."""
from spring import *
from search_cycle import af
TARGET=ROOT/'artifacts/running-movement'
def run():
 d=Data();sample=json.loads((TARGET/'runtime-samples.json').read_text())
 fork=TopoDS_Shape();assert BRepTools.Read_s(fork,str(HERE/'candidate-fork.brep'),BRep_Builder())
 body=section(moved(fork,d.occ(126)[0]['worldTransform']),-1.85,tol=.00002)
 jewel=section(d.world(112),-1.85,tol=.00002)
 wheel=section(d.world(233),-1.82,tol=.00002)
 jewels=unary_union([section(d.world(128,i),-1.82,tol=.00002) for i in [0,1]])
 minimum={'fork':1e9,'wheel':1e9};bad=[]
 for i,p in enumerate(sample['poses']):
  a=rot(body,'pallet',p['pallet']);b=rot(jewel,'balance',p['balance'])
  g=a.distance(b);minimum['fork']=min(minimum['fork'],g)
  if g<1e-7:bad.append([i,'fork',a.intersection(b).area])
  a=rot(wheel,'escape',p['escape']);b=rot(jewels,'pallet',p['pallet']);g=a.distance(b);minimum['wheel']=min(minimum['wheel'],g)
  if g<1e-7:bad.append([i,'wheel',a.intersection(b).area])
  if i%2000==0:print('runtime sections',i,minimum,flush=True)
 assert not bad,bad[:10]
 points=np.fromfile(TARGET/'runtime-spring.bin',dtype='<f4').reshape(len(sample['angles']),sample['pointCount'],3).astype(float)
 original=np.load(OUT/'spring-curves.npz')['source'];arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(original[:,:2],axis=0),axis=1))]
 inner=arc<=.59;outer=arc>=arc[-1]-.49
 collet=section(d.world(115),-3.25,tol=.00002)
 envelope=json.loads((OUT/'spring-interfaces.json').read_text())['coilAnnulusRadiiMm']
 rows=[];maxerror=0;lengtherror=0;min_gap=1e9;radial=[1e9,0]
 for angle,pts in zip(sample['angles'],points):
  poly=ribbon(pts);assert poly.is_valid and LineString(pts[:,:2]).is_simple
  gap=interturn_gap(pts);min_gap=min(min_gap,gap);assert gap>0
  radius=np.linalg.norm(pts[:,:2]-PIV['balance'][:2],axis=1);radial[0]=min(radial[0],float(radius.min()-.0175));radial[1]=max(radial[1],float(radius.max()+.0175))
  expected=original@matrix(PIV['balance'],angle)[:3,:3].T+matrix(PIV['balance'],angle)[:3,3]
  error=max(np.linalg.norm(pts[inner]-expected[inner],axis=1).max(),np.linalg.norm(pts[outer]-original[outer],axis=1).max());maxerror=max(maxerror,float(error))
  free=ribbon(pts[arc>=.60]);assert free.intersection(rot(collet,'balance',angle)).area<1e-10
  # Record interpolation stretching explicitly; it is geometric, not elastic.
  lengtherror=max(lengtherror,float(abs(np.linalg.norm(np.diff(pts[:,:2],axis=0),axis=1).sum()-arc[-1])))
  rows.append({'angle':angle,'interturnGapMm':gap,'attachmentErrorMm':float(error)})
 assert radial[0]>envelope[0] and radial[1]<envelope[1],(radial,envelope)
 assert maxerror<.000003
 # Compare intermediate poses with fresh constrained solves (not atlas samples).
 errors=[]
 for angle in [-172.614193213151,-122.614193213151,7.385806786849,82.385806786849,177.385806786849]:
  i=min(range(len(sample['angles'])),key=lambda i:abs(sample['angles'][i]-angle));ref,_,_=deform(original,sample['angles'][i]);errors.append(float(np.linalg.norm(points[i]-ref,axis=1).max()))
 report={'scope':'Actual runtime timed angles and GPU ribbon centerlines; source sections, 361 spring poses and five fresh solves; not continuous whole-solid certification','timedConfigurations':len(sample['poses']),'minimumSectionGapsMm':minimum,'overlaps':bad,'springConfigurations':len(rows),'minimumInterturnGapMm':min_gap,'coilRadialBoundsMm':radial,'enclosedByPreviouslyQualifiedAnnulusMm':envelope,'maximumAttachmentErrorMm':maxerror,'maximumTotalCenterlineLengthChangeMm':lengtherror,'maximumFreshSolveDifferenceMm':max(errors),'springSamples':rows}
 (TARGET/'geometry-check.json').write_text(json.dumps(report,indent=2)+'\n');print({k:v for k,v in report.items() if k!='springSamples'},flush=True)
if __name__=='__main__':run()
