#!/usr/bin/env python3
"""Reduce local M2 geometry output to source-linked scalar evidence only."""
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/mechanics/running-movement/m2'
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    raw=json.loads((OUT/'source-rest.json').read_text());exp=json.loads((OUT/'experiments.json').read_text())
    assert raw['sourceSha256']==exp['sourceSha256']
    event=json.loads((OUT/'event.json').read_text())
    pairs=[]
    for p in raw['pairs']:
        q={k:v for k,v in p.items() if k!='witnesses'}
        q['witnesses']=p['witnesses'][:2]
        if p['a'].endswith('_109_6') and p['b'].endswith('_125_1'):
            q['interiorCheck']=exp['penetration']['impulse-body'];q['classification']=q['interiorCheck']['classification']
        if p['a'].endswith('_125_1') and p['b'].endswith('_194_9'):
            q['interiorCheck']=exp['penetration']['body-pin9']
        pairs.append(q)
    report={'schemaVersion':1,'sourceSha256':raw['sourceSha256'],'status':'M2 incomplete — source-rest penetration and banking precision unresolved',
        'units':'STEP world mm, mm³; right-handed +Z radians; row-major matrices on column vectors',
        'tolerances':{'ambiguityMm':.001,'distanceConvergenceMm':.0002,'surfaceTravelMm':.0005,'eventTimeSeconds':.00001},
        'method':'BRep face/boundary tolerances, validity, refined trimmed-shape distance, non-destructive common at three fuzz values, oriented incident face normals and independent inside/boundary-distance witness. Face indices are 1-based unique TopExp order for the hash-locked cached importer result.',
        'definitions':[{k:v for k,v in d.items() if k!='faces'}|{'faceCount':len(d['faces']),'facesOverBudget':[f['face'] for f in d['faces'] if f['boundaryMaxToleranceMm']>.001]} for d in raw['definitions']],
        'experimentalEvent':{k:v for k,v in event.items() if k!='neighbors'}|{'neighbors':[{'angleRad':n['angleRad'],'analyticVertexPlaneGapMm':n['analyticVertexPlaneGapMm'],'distanceMm':n['measurement']['distanceRefinementMm'][-1],'common':n['measurement']['common'],'classification':n['measurement']['classification']} for n in event['neighbors']]},
        'occurrences':raw['occurrences'],'sourceRestPairs':pairs,'experiments':[],
        'operatingParameters':{'amplitude':None,'direction':None,'phase':None,'bankingLimits':None,'sourceToOperatingAlignment':None},
        'reviewStatus':'Numerical engineering evidence; no external mechanical acceptance',
        'inputHashes':{str(p.relative_to(ROOT)):digest(p) for p in [OUT/'source-rest.json',OUT/'experiments.json',OUT/'event.json',OUT/'brep-cache/manifest.json',ROOT/'docs/running-movement/TOLERANCES.md',ROOT/'scripts/mechanics/m2_audit.py',ROOT/'scripts/mechanics/m2_experiments.py',ROOT/'scripts/mechanics/m2_event.py']}}
    for run in exp['runs']:
        names=run['samples'][0]['distancesMm']
        report['experiments'].append({k:v for k,v in run.items() if k!='samples'}|{'sampleCount':len(run['samples']),
            'ranges':{n:[min(s['distancesMm'][n] for s in run['samples']),max(s['distancesMm'][n] for s in run['samples'])] for n in names},
            'interpretation':'Symmetric 5 µm monitored travel sensitivity only; not either operating half-cycle. No event times or acceptance implied.'})
    (ROOT/'docs/running-movement/M2_EVIDENCE.json').write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__': main()
