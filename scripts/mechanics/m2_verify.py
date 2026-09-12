#!/usr/bin/env python3
"""Fail-closed verification of recorded M2 source audit, bounds and input hashes."""
import hashlib,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
r=json.loads((ROOT/'docs/running-movement/M2_EVIDENCE.json').read_text())
for name,sha in r['inputHashes'].items(): assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==sha,name
assert r['tolerances']=={'ambiguityMm':.001,'distanceConvergenceMm':.0002,'surfaceTravelMm':.0005,'eventTimeSeconds':.00001}
assert all(v is None for v in r['operatingParameters'].values())
raw=json.loads((ROOT/'artifacts/mechanics/running-movement/m2/source-rest.json').read_text())
assert len(raw['pairs'])==26
for pair in r['sourceRestPairs']:
 assert pair['distanceSpreadMm']<=.0002
 assert len(pair['common'])==3 and all(c['valid'] for c in pair['common'])
 if pair['classification']=='separation':
  assert pair['distanceRefinementMm'][-1]>.001
  assert pair['localToleranceMm']<=.001
  assert all(c['solids']==0 for c in pair['common'])
  assert all(w[side] for w in pair['witnesses'] for side in ['aFaces','bFaces'])
penetration=next(p for p in r['sourceRestPairs'] if p['classification']=='penetration corroborated')
assert penetration['a'].endswith('_109_6') and penetration['b'].endswith('_125_1')
assert all(c['volumeMm3']>.004 for c in penetration['common'])
for check in penetration['interiorCheck']['insideChecks']:
 assert all(x.endswith('TopAbs_IN') for x in check['states'])
 assert check['boundaryDistanceMm']>check['wholeShapeToleranceMm']+.001
exp=json.loads((ROOT/'artifacts/mechanics/running-movement/m2/experiments.json').read_text())
for run in exp['runs']:
 assert len(run['samples'])==81
 assert run['maxSurfaceTravelPerFineIntervalMm']<=.0005/2
 assert run['maxCoarseRefinementDifferenceMm']<=.0002
 assert abs(run['radiusBoundMm']*run['extentRad']-.005)<1e-15
 for a,b in zip(run['samples'],run['samples'][1:]):
  travel=run['radiusBoundMm']*abs(a['angleRad']-b['angleRad'])
  for name in a['distancesMm']:
   assert abs(a['distancesMm'][name]-b['distancesMm'][name])<=travel+1e-7
# Separate point-plane oracle versus trimmed BRep gap in a strictly separated event neighborhood.
e=r['experimentalEvent'];n=e['neighbors'][0]
assert abs(n['analyticVertexPlaneGapMm']-n['distanceMm'])<1e-10
assert abs(e['sourceSignedGapMm']-raw['pairs'][1]['distanceRefinementMm'][-1])<1e-10
for brackets in [e['analyticZeroBracketsRad'],e['brepDistance1e7ThresholdBracketsRad']]:
 assert brackets[1][1]-brackets[1][0]<=5e-9
 assert brackets[0][0]<=brackets[1][0]<=brackets[1][1]<=brackets[0][1]
assert e['neighbors'][2]['analyticVertexPlaneGapMm']<0
assert all(c['volumeMm3']>0 for c in e['neighbors'][2]['common'])
print('M2 evidence checks pass: 26 source pairs, 243 sensitivity poses, refined geometric threshold; M2 remains incomplete.')
