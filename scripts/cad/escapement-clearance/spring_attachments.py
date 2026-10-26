"""Original attachment measurements and centerline discretization sensitivity."""
from spring import *

def run():
 d=Data();spring=d.world(116);solids=items(spring,TopAbs_SOLID);main=max(solids,key=vol);marker=min(solids,key=vol)
 rows=[]
 for n in [113,115,117,118,222]:
  for i,c in enumerate(d.occ(n)):
   sh=d.world(n,i);rows.append({'definition':n,'id':c['id'],'mainSpringGapMm':dist(main,sh),
    'mainSpringCommonMm3':common(main,sh),'markerCommonMm3':common(marker,sh)})
 src,_=coil_source(d);fine,_=coil_source(d,resolution=400);fine_source_error=float(np.max(np.linalg.norm(fine[::2]-src,axis=1)))
 collet=section(d.world(115),-3.25,tol=.00002);lengths=np.r_[0,np.cumsum(np.linalg.norm(np.diff(src,axis=0),axis=1))]
 contact=[i for i,p in enumerate(src) if collet.distance(shapely.Point(p[:2]))<.0175]
 refined=[]
 for a in [CENTER['balance']-180,0,CENTER['balance'],CENTER['balance']+180]:
  cp,_,cr=deform(src,a);fp,_,fr=deform(fine,a)
  refined.append({'angleDegrees':a,'fineCenterlineMaximumDifferenceMm':float(np.max(np.linalg.norm(fp[::2]-cp,axis=1))),
   'fineNonlocalStripGapMm':interturn_gap(fp),'fineRibbonValid':bool(ribbon(fp).is_valid),
   'endpointResidualMm':fr['endpointResidualMm'],'segmentLengthErrorMm':fr['maximumSegmentLengthErrorMm']})
 save('spring-attachments.json',{'sourceSpringDefinition':116,'mainSpringVolumeMm3':vol(main),'markerVolumeMm3':vol(marker),
  'originalAttachmentPairs':rows,'sourceColletEmbeddingArcLengthRangeMm':[float(lengths[min(contact)]),float(lengths[max(contact)])],
  'rigidInnerLengthMm':.60,'rigidOuterLengthMm':.50,'sourceSamplesPerArc':200,'refinedSamplesPerArc':400,
  'coincidentSourcePointErrorMm':fine_source_error,'refinedSamples':refined,
  'limits':'Attachment overlap is source geometry, not a validated fixing or material model; alternate stud occurrence retained. Sensitivity compares discretizations of one authored planar model, not physical equilibrium.'})
 print('attachment and refined spring checks complete',flush=True)

if __name__=='__main__':run()
