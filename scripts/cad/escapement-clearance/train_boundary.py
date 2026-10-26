"""Investigate the escapement's first train boundary, without enabling the train."""
from interfaces import *

def run():
 records=assembly();parts={n:next(r for r in records if r['n']==n) for n in [234,242,243,238]}
 pin,wheel,second,third=[parts[n]['shape'] for n in [234,243,242,238]]
 ps=section(pin,-3.73,tol=.00002);ws=section(wheel,-3.73,tol=.00002)
 ss=section(second,-4.12,tol=.00002);ts=section(third,-4.12,tol=.00002)
 cycle=json.loads((HERE/'cycle.json').read_text())['samples'];es=[s['escape'] for s in cycle]
 angles=sorted(set(np.arange(0,360.0001,.5))|set(es[::20]))
 rows=[]
 for e in angles:
  s=-float(e)/9;pp=rot(ps,'escape',float(e));ww=rotate(ws,s,origin=(0.,0.));sp=rotate(ss,s,origin=(0.,0.))
  rows.append({'escapeDegrees':float(e),'secondsDegrees':s,
   'frozenSecondsOverlapMm2':float(pp.intersection(ws).area),
   'coupledOverlapMm2':float(pp.intersection(ww).area),'coupledGapMm':float(pp.distance(ww)),
   'frozenThirdOverlapMm2':float(sp.intersection(ts).area)})
 selected=sorted(set([0,len(rows)-1]+[min(range(len(rows)),key=lambda i:rows[i]['coupledGapMm'])]+[max(range(len(rows)),key=lambda i:rows[i][key]) for key in ['coupledOverlapMm2','frozenSecondsOverlapMm2','frozenThirdOverlapMm2']]+list(range(0,len(rows),80))))
 exact=[]
 for i in selected:
  r=rows[i];p=turn(pin,'escape',r['escapeDegrees']);w=moved(wheel,matrix(np.zeros(3),r['secondsDegrees']));sp=moved(second,matrix(np.zeros(3),r['secondsDegrees']))
  result={**r,'coupledCommonMm3':common(p,w),'coupledGap3dMm':dist(p,w),
   'frozenSecondsCommonMm3':common(p,wheel),'frozenThirdCommonMm3':common(sp,third)}
  exact.append(result);print('train boundary',r['escapeDegrees'],'coupled common',result['coupledCommonMm3'],'third held',result['frozenThirdCommonMm3'],flush=True)
 save('train-boundary.json',{'sourceSha256':SOURCE_SHA,'scope':'Source pinion 234 (9 teeth) and seconds wheel 243 (81 teeth), plus seconds pinion 242 against stationary third wheel 238; current authored phases applied; one escape revolution plus cycle-derived samples, not full train qualification',
  'ratio':'world +Z seconds delta = -escape delta / 9, referenced to current displayed E=0 and seconds phase',
  'sampleCount':len(rows),'sectionHeightsMm':[-3.73,-4.12],'cycleEscapeRangeDegrees':[min(es),max(es)],'samples':rows,'solidSamples':exact})

if __name__=='__main__':run()
