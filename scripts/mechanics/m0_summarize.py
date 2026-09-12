#!/usr/bin/env python3
"""Retain scalar M0 probe results and verify old cached geometric counts."""
import hashlib
import json
import math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
read=lambda p:json.loads((ROOT/p).read_text())
hashfile=lambda p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
probe=read('artifacts/mechanics/running-movement/m0/cad-probe.json')
d={r['definition']:r for r in probe['definitions']}
old=read('artifacts/mechanics/source-geometry.json'); evidence=read('assets/authored/motion-evidence.json')
rechecked={}
for key,want in evidence['toothCounts'].items():
    p=np.vstack([e['points'] for e in old[key]['edges']]); r=np.linalg.norm(p[:,:2],axis=1);counts=[]
    for frac in [.985,.97,.95]:
        a=np.sort(np.mod(np.arctan2(p[r>r.max()*frac,1],p[r>r.max()*frac,0]),2*np.pi));g=np.diff(np.r_[a,a[0]+2*np.pi]);counts.append(int(np.count_nonzero(g>g.max()*.5)))
    assert counts==[want['teeth']]*3,(key,counts)
    rechecked[key]=counts
pairs=[]
for a,b,z1,z2,m in [(85,96,80,26,.15),(90,96,80,26,.15),(96,93,26,12,.15),(137,210,12,36,.177),(211,141,10,40,.17),(210,213,36,36,.177),(137,213,12,36,.177),(216,183,24,8,.15),(217,187,8,32,.12)]:
    p=d[a]['occurrences'][0]['placementOriginWorldMm'];q=d[b]['occurrences'][0]['placementOriginWorldMm'];distance=math.dist(p[:2],q[:2]);nominal=m*(z1+z2)/2
    pairs.append({'definitionPair':[a,b],'teeth':[z1,z2],'moduleMmFromSourceName':m,'axisDistanceMm':distance,'nominalDistanceMm':nominal,'residualMm':distance-nominal,'screening':'candidate' if abs(distance-nominal)<=.005 else 'rejected direct external pair','method':'Local XY zero corroborated by axial cylinders, transformed by XCAF; XY Euclidean distance versus module*(z1+z2)/2. Z engagement and tooth phase unverified.','confidence':'geometric screening, not contact proof','reviewStatus':'external review open'})
scalar={'schemaVersion':1,'sourceSha256':probe['sourceSha256'],'reviewStatus':'Engineering geometry verified; mechanical acceptance open','definitions':[{'definition':r['definition'],'name':r['name'],'counts':r['counts'],'maxTopologyToleranceMm':r['maxTopologyToleranceMm'],'axisCandidates':[{'instanceId':o['id'],'pointWorldMm':o['placementOriginWorldMm'],'localZWorld':o['localZWorld']} for o in r['occurrences']],'axialCylindersAtLocalXYZero':sum(abs(c['axisLocal'][2])>.999 and abs(c['originLocalMm'][0])+abs(c['originLocalMm'][1])<1e-6 for c in r['cylindersLocal'])} for r in probe['definitions']], 'pairs':pairs,'historicalCountsRecomputedFromCache':rechecked,'derivation':'m0_probe.py samples unique BRep edges at approximately .008 mm spacing (cap 2500), uses 98.5/97/95% radial tip clusters; no source-name counts in algorithm. Geometry topology tolerances are maximum face/edge/vertex tolerance, not measured physical error or a local contact uncertainty bound. All lengths mm, directions unitless, counts teeth. Axis placement origins are candidates only; zero axial cylinders (118) does not establish an axis.','inputHashes':{p:hashfile(p) for p in ['scripts/mechanics/m0_probe.py','artifacts/mechanics/running-movement/m0/cad-probe.json','artifacts/mechanics/source-geometry.json','scripts/mechanics/probe.py','assets/authored/motion-evidence.json']}}
(ROOT/'docs/running-movement/probe-summary.json').write_text(json.dumps(scalar,indent=2,ensure_ascii=False)+'\n')
print('Recomputed 11 historical counts; summarized 24 definitions, 15 fresh count checks and 9 candidate pairs.')
