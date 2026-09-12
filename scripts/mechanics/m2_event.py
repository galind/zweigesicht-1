#!/usr/bin/env python3
"""Refine an experimental escape/jewel4 threshold; no operating event assignment."""
import json, math
import numpy as np
from m2_audit import Source, ROOT, OUT, distance, pair
from m2_experiments import turn, interior

def main():
    source=Source();raw=json.loads((OUT/'source-rest.json').read_text())
    exp=json.loads((OUT/'experiments.json').read_text())
    r=raw['pairs'][1];w=r['witnesses'][0]
    n=np.array(w['bFaces'][0]['normalWorld']);a=np.array(w['aWorldMm']);b=np.array(w['bWorldMm'])
    pivot=json.loads((ROOT/'docs/running-movement/graph.json').read_text())['shafts']['escape']['pivotWorldMm']
    def signed(t):
        c,s=math.cos(t),math.sin(t);q=a.copy();x,y=a[:2]-pivot[:2]
        q[:2]=[pivot[0]+c*x-s*y,pivot[1]+s*x+c*y]
        return float((q-b)@n)
    extent=next(r['extentRad'] for r in exp['runs'] if r['shaft']=='escape')
    e=source.world(source.occurrences(233)[0]);j=source.world(source.occurrences(128)[1])
    def refine(fn,threshold,width):
        lo,hi=0,extent
        assert fn(lo)>threshold and fn(hi)<threshold
        while hi-lo>width:
            mid=(lo+hi)/2
            if fn(mid)>threshold:lo=mid
            else:hi=mid
        return [lo,hi]
    analytic=[refine(signed,0,w) for w in [1e-8,5e-9]]
    geometric=[refine(lambda t:distance(turn(e,pivot,t),j).Value(),1e-7,w) for w in [1e-8,5e-9]]
    center=sum(analytic[-1])/2
    neighbors=[]
    # 0.0001 mm signed surface-plane margin each side, derived via local derivative.
    derivative=(signed(center+1e-6)-signed(center-1e-6))/2e-6
    step=.0001/abs(derivative)
    for t in [center-step,center,center+step,extent]:
        shape=turn(e,pivot,t);pr=pair(shape,j)
        neighbors.append({'angleRad':t,'analyticVertexPlaneGapMm':signed(t),'measurement':pr})
    report={'kind':'source escape/jewel4 sensitivity threshold, not accepted unlocking/impulse/drop',
        'sourceVertexWorldMm':a.tolist(),'jewelFace':w['bFaces'][0],'sourceSignedGapMm':signed(0),
        'analyticZeroBracketsRad':analytic,'brepDistance1e7ThresholdBracketsRad':geometric,'neighbors':neighbors,
        'limitations':'Analytic point-plane oracle tracks one original tip against one original jewel plane; finite-face containment comes from separate BRep measurements. No global contact sequence, banking, balance timing or physical event time.'}
    (OUT/'event.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='neighbors'},indent=2))
if __name__=='__main__':main()
