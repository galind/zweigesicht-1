"""Actual-tooth relative periods, with a conservative clipping-distance bound."""
from train_coupling import *
from shapely.affinity import affine_transform
import time

def frame(p,origin,theta):
 c,s=np.cos(theta),np.sin(theta);x,y=origin
 return affine_transform(p,[c,s,-s,c,-c*x-s*y,s*x-c*y])

def run():
 _,by,pivots=setup();polys=sections(by);summary=[]
 for a,b,na,nb,z,oa,ob in PAIRS:
  start=time.monotonic();aa,bb=[polys[f'{n}@{z}'] for n in [a,b]]
  delta=pivots[ob][:2]-pivots[oa][:2];d=float(np.linalg.norm(delta));theta=np.arctan2(delta[1],delta[0])
  aa,bb=[frame(p,pivots[oa][:2],theta) for p in [aa,bb]]
  ra=float(np.linalg.norm(shapely.get_coordinates(aa),axis=1).max())
  rb=float(np.linalg.norm(shapely.get_coordinates(bb)-[d,0],axis=1).max())
  # Any cross-body pair closer than 0.05 mm is inside the overlap of the
  # two radial bounding squares padded by 0.05 mm. Outside is bounded clear.
  margin=.05;window=(d-rb-margin,-min(ra,rb)-margin,ra+margin,min(ra,rb)+margin)
  events=na*nb//gcd(na,nb);subdivisions=48;count=events*subdivisions
  angles=np.arange(count+1)*360/(na*subdivisions);gaps=np.empty(count+1);areas=np.empty(count+1)
  for i,angle in enumerate(angles):
   p=shapely.clip_by_rect(rotate(aa,float(angle%360),origin=(0,0)),*window)
   q=shapely.clip_by_rect(rotate(bb,float((-angle*na/nb)%360),origin=(d,0)),*window)
   assert p.is_valid and q.is_valid and not p.is_empty and not q.is_empty
   gaps[i]=min(margin,p.distance(q));areas[i]=p.intersection(q).area
   if i%5000==0:print('period',a,b,i,'/',count,'min',gaps[:i+1].min(),'overlaps',int(np.count_nonzero(areas[:i+1]>1e-12)),flush=True)
  halfstep=np.deg2rad(360/(na*subdivisions))/2
  # Nearest endpoint distance can fall by at most these rigid point motions.
  motionbound=2*ra*np.sin(halfstep/2)+2*rb*np.sin(halfstep*na/nb/2)
  result={'pair':[a,b],'teeth':[na,nb],'sectionZMm':z,'fastPacket':oa,'slowPacket':ob,
   'toothEngagementEvents':events,'subdivisionsPerEvent':subdivisions,'configurations':len(angles),
   'fastPeriodDegrees':float(angles[-1]),'slowPeriodDegrees':float(-angles[-1]*na/nb),
   'minimumClippedGapBoundMm':float(gaps.min()),'maximumOverlapAreaMm2':float(areas.max()),
   'overlapConfigurations':int(np.count_nonzero(areas>1e-12)),
   'worstGapFastDegrees':float(angles[np.argmin(gaps)]),'worstOverlapFastDegrees':float(angles[np.argmax(areas)]),
   'betweenSampleMotionBoundMm':float(motionbound),'continuousPolygonGapLowerBoundMm':float(gaps.min()-motionbound),
   'radialBoundsMm':[ra,rb],'windowMm':window,'clippingMarginMm':margin,
   'elapsedSeconds':time.monotonic()-start}
  np.savez_compressed(TRAIN/f'period-{a}-{b}.npz',fastDegrees=angles,gapBoundsMm=gaps,overlapAreasMm2=areas)
  summary.append(result);save_train('periods.partial.json',summary);print(json.dumps(result),flush=True)
 save_train('periods.json',{'sectionSha256':digest(TRAIN/'sections.json'),
  'scope':'Complete material orientation period of each actual source section pair; 48 phase subdivisions per tooth event; conservative clipping and rigid-motion distance bounds apply to polygon sections only, not a whole-solid/contact certificate',
  'pairs':summary});(TRAIN/'periods.partial.json').unlink()

if __name__=='__main__':run()
