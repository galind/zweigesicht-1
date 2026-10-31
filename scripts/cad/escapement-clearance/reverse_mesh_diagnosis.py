"""Offline source/phase diagnosis. Writes only ignored evidence, never app poses.
Reuses original-solid and section algorithms; candidate phases are experiments.
"""
from motion_works_sweep import *
from train_periods import frame
import argparse

OUT=ROOT/'artifacts/reverse-mesh-diagnosis'
OUT.mkdir(exist_ok=True)
PAIRS=PAIRS[-2:]

def save(name,data):
 (OUT/name).write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')

def inputs():
 manifest=json.loads((ROOT/'assets/source-manifest/motion-works-study.json').read_text())
 for name in ['source.json','sections.json','runtime-meshes.json']:
  assert digest(OUTPUT/name)==manifest['localEvidenceSha256'][name]
 assert digest(ROOT/'assets/source-originals/ml01-zweigesicht.stp')==SOURCE_SHA
 for name,h in manifest['unchangedRuntimeAndDisplaySha256'].items():assert digest(ROOT/name)==h
 source=json.loads((OUTPUT/'source.json').read_text())
 phases=json.loads((ROOT/'assets/authored/wheel-display-poses.json').read_text())
 overrides={x['leafId']:x['localZDegrees'] for x in phases['wheels']}
 polys=json.loads((OUTPUT/'sections.json').read_text())['polygons']
 results=[]
 for a,b,na,nb,z,oa,ob in PAIRS:
  leaves=[source['leaves'][str(n)] for n in [a,b]]
  piv=[np.array(x['worldTransform'])[:2,3] for x in leaves]
  offsets=[overrides.get(x['id'],0)*x['worldTransform'][2][2] for x in leaves]
  displayed=[shapely.from_wkt(polys[f'{n}@{z}']) for n in [a,b]]
  original=[rotate(p,-o,origin=tuple(c)) for p,o,c in zip(displayed,offsets,piv)]
  delta=piv[1]-piv[0];d=float(np.linalg.norm(delta));theta=np.arctan2(delta[1],delta[0])
  aa,bb=[frame(p,piv[0],theta) for p in original]
  radii=[float(np.linalg.norm(shapely.get_coordinates(p)-c,axis=1).max()) for p,c in zip([aa,bb],[(0,0),(d,0)])]
  ra,rb=radii;w=(d-rb-.05,-min(ra,rb)-.05,ra+.05,min(ra,rb)+.05)
  results.append(dict(pair=[a,b],teeth=[na,nb],z=z,pivots=piv,offsets=offsets,original=original,framed=[aa,bb],distance=d,radii=radii,window=w))
 return source,results

def sweep(r,offset,subdivisions):
 na,nb=r['teeth'];aa,bb=r['framed'];d=r['distance'];w=r['window']
 count=na*nb//math.gcd(na,nb)*subdivisions
 angles=np.arange(count+1)*360/(na*subdivisions)
 gaps=np.empty(count+1);areas=np.empty(count+1)
 for i,x in enumerate(angles):
  p=shapely.clip_by_rect(rotate(aa,float(x%360),origin=(0,0)),*w)
  q=shapely.clip_by_rect(rotate(bb,float((-x*na/nb+offset)%360),origin=(d,0)),*w)
  assert p.is_valid and q.is_valid and not p.is_empty and not q.is_empty
  gaps[i]=min(.05,p.distance(q));areas[i]=p.intersection(q).area
 halfstep=np.deg2rad(360/(na*subdivisions))/2;ra,rb=r['radii']
 bound=2*ra*np.sin(halfstep/2)+2*rb*np.sin(halfstep*na/nb/2)
 return {'offsetWorldDegrees':float(offset),'subdivisions':subdivisions,'configurations':count+1,'fastPeriodDegrees':float(angles[-1]),'followerPeriodDegrees':float(-angles[-1]*na/nb),'minimumSampledGapMm':float(gaps.min()),'maximumOverlapAreaMm2':float(areas.max()),'overlapConfigurations':int(np.count_nonzero(areas>1e-12)),'worstOverlapFastDegrees':float(angles[np.argmax(areas)]),'worstGapFastDegrees':float(angles[np.argmin(gaps)]),'betweenSampleMotionBoundMm':float(bound),'continuousPolygonGapLowerBoundMm':float(gaps.min()-bound)}

def scan():
 _,rows=inputs();results=[]
 for r in rows:
  a,b=r['pair'];nb=r['teeth'][1]
  coarse=[sweep(r,x,24) for x in np.linspace(-180/nb,180/nb,97)]
  best=min(coarse,key=lambda x:(x['maximumOverlapAreaMm2'],-x['minimumSampledGapMm']))
  halfwidth=360/nb/96
  refined=[sweep(r,x,192) for x in np.linspace(best['offsetWorldDegrees']-halfwidth,best['offsetWorldDegrees']+halfwidth,65)]
  best=min(refined,key=lambda x:(x['maximumOverlapAreaMm2'],-x['minimumSampledGapMm']))
  results.append({'pair':r['pair'],'coarse':coarse,'refined':refined,'bestSampled':best})
  save('scan.json',results);print('scan',r['pair'],best,flush=True)

def compare():
 source,rows=inputs();scans=json.loads((OUT/'scan.json').read_text())
 cache=ROOT/'artifacts/escapement-interfaces-20261026';cm=json.loads((cache/'source-cache.json').read_text())
 assert cm['sourceSha256']==SOURCE_SHA and cm['ocpVersion']==OCP.__version__
 result=[]
 for r,scan in zip(rows,scans):
  a,b=r['pair'];na,nb=r['teeth'];assert r['pair']==scan['pair']
  shapes=[];section_errors=[]
  for n,p in zip([a,b],r['original']):
   name=f'd_0_1_1_{n}.brep';assert digest(cache/'brep'/name)==cm['files'][name]
   sh=TopoDS_Shape();assert BRepTools.Read_s(sh,str(cache/'brep'/name),BRep_Builder())
   sh=moved(sh,np.array(source['leaves'][str(n)]['worldTransform']));assert BRepCheck_Analyzer(sh).IsValid();shapes.append(sh)
   fresh=section(sh,r['z'],tol=.00002);err=fresh.hausdorff_distance(p);assert err<.00004
   section_errors.append(err)
  symmetry=[]
  for p,n,c,other_radius in zip(r['framed'],r['teeth'],[(0,0),(r['distance'],0)],r['radii'][::-1]):
   symmetry.append({'exteriorOnePitchHausdorffMm':p.exterior.hausdorff_distance(rotate(p,360/n,origin=c).exterior),'maximumHoleRadiusMm':max([float(np.linalg.norm(np.array(h.coords)-c,axis=1).max()) for h in p.interiors],default=0),'otherBodyMinimumReachRadiusMm':r['distance']-other_radius})
  # Effective follower phase invariant: phase_b + (Na/Nb) * phase_a.
  authored=r['offsets'][1]+na/nb*r['offsets'][0]
  candidate=scan['bestSampled']['offsetWorldDegrees']
  if a==217:
   candidate=json.loads((OUT/'fine-search.json').read_text())['bestOffset']
  cases=[]
  for label,offset,subdiv in [('source',0,192),('display',authored,192),('isolated-phase',candidate,1536)]:
   sr=sweep(r,offset,subdiv)
   selected=sorted(set([0.,sr['worstOverlapFastDegrees'],sr['worstGapFastDegrees'],360/na/8,360/na/2,360/na*7/8]))
   solids=[]
   for angle in selected:
    am,bm=[matrix(np.r_[c,0],x%360) for c,x in zip(r['pivots'],[angle,-angle*na/nb+offset])]
    aa=moved(shapes[0],am);bb=moved(shapes[1],bm)
    sh=boolean(aa,bb,BRepAlgoAPI_Common).Shape();assert BRepCheck_Analyzer(sh).IsValid()
    solids.append({'fastDegrees':angle,'followerDegrees':-angle*na/nb+offset,'commonMm3':sum(vol(x) for x in items(sh,TopAbs_SOLID)),'gapMm':dist(aa,bb)})
   cases.append({'label':label,**sr,'selectedSolids':solids});print(r['pair'],label,sr,'solids',solids,flush=True)
  result.append({'pair':r['pair'],'teeth':r['teeth'],'sectionZMm':r['z'],'centerDistanceMm':r['distance'],'authoredWorldPhasesDegrees':r['offsets'],'freshSourceSectionHausdorffMm':section_errors,'toothSymmetryDiagnostic':symmetry,'cases':cases})
  save('comparison.json',{'sourceSha256':SOURCE_SHA,'phaseSha256':digest(ROOT/'assets/authored/wheel-display-poses.json'),'ocpVersion':OCP.__version__,'scope':'Source/display/isolated phase full-material-period planar sweeps and selected whole solids; no application edits or continuous whole-solid acceptance','pairs':result})

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('stage',choices=['scan','compare']);args=parser.parse_args()
 scan() if args.stage=='scan' else compare()
