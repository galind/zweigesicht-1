"""Offline train coupling investigation. Does not write application assets."""
from interfaces import *
from fractions import Fraction
from math import gcd
from shapely.geometry import box

TRAIN=ROOT/'artifacts/train-coupling-20261026'
TRAIN.mkdir(exist_ok=True)
RATIOS={'escape':Fraction(1),'seconds':Fraction(-1,9),'third':Fraction(8,675),
        'center':Fraction(-1,540),'transfer':Fraction(1,1170),'barrel':Fraction(-1,3600)}
MEMBERS={'escape':[233,234,235],'seconds':[242,243],'third':[237,238],
         'center':[93,94,95],'transfer':[96],'barrel':[85,86]}
# Fast member, slower member, tooth counts, section Z, packet names.
PAIRS=[(234,243,9,81,-3.73,'escape','seconds'),
       (242,238,8,75,-4.12,'seconds','third'),
       (237,94,10,64,-2.82,'third','center'),
       (93,96,12,26,-2.45,'center','transfer'),
       (96,85,26,80,-2.28,'transfer','barrel')]

def save_train(name,data):
 (TRAIN/name).write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')

def setup():
 rs=assembly();by={r['n']:r for r in rs if r['n'] in {n for ns in MEMBERS.values() for n in ns}}
 pivots={owner:by[ns[0]]['matrix'][:3,3] for owner,ns in MEMBERS.items()}
 for owner,ns in MEMBERS.items():
  for n in ns:assert np.linalg.norm(by[n]['matrix'][:2,3]-pivots[owner][:2])<1e-10
 return rs,by,pivots

def sections(by):
 path=TRAIN/'sections.json'
 if path.exists():
  cache=json.loads(path.read_text());assert cache['phaseSha256']==digest(ROOT/'assets/authored/wheel-display-poses.json')
  if set(cache['polygons'])=={f'{n}@{z}' for a,b,na,nb,z,oa,ob in PAIRS for n in [a,b]}:
   return {k:shapely.from_wkt(v) for k,v in cache['polygons'].items()}
 result={}
 for a,b,na,nb,z,oa,ob in PAIRS:
  for n in [a,b]:
   key=f'{n}@{z}';p=section(by[n]['shape'],z,tol=.00002)
   assert not p.is_empty,(n,z);result[key]=p
 save_train('sections.json',{'phaseSha256':digest(ROOT/'assets/authored/wheel-display-poses.json'),
  'chordSamplingToleranceMm':.00002,'polygons':{k:v.wkt for k,v in result.items()}})
 return result

def initial():
 rs,by,pivots=setup();polys=sections(by);results=[]
 for a,b,na,nb,z,oa,ob in PAIRS:
  pa,pb=[polys[f'{n}@{z}'] for n in [a,b]];rows=[]
  for angle in np.linspace(0,360/na,97):
   aa=rotate(pa,float(angle),origin=tuple(pivots[oa][:2]));bb=rotate(pb,float(-angle*na/nb),origin=tuple(pivots[ob][:2]))
   rows.append({'fastDegrees':float(angle),'slowDegrees':float(-angle*na/nb),'gapMm':aa.distance(bb),'areaMm2':aa.intersection(bb).area})
  result={'pair':[a,b],'teeth':[na,nb],'z':z,'samples':rows}
  results.append(result);print('initial',a,b,'min gap',min(r['gapMm'] for r in rows),'max area',max(r['areaMm2'] for r in rows),flush=True)
 save_train('initial-pitches.json',results)

if __name__=='__main__':initial()
