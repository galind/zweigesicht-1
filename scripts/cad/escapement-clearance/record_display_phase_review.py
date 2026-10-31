"""Record conditional phase/neighbor evidence without touching app assets."""
from pathlib import Path
from collections import Counter
import json,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/display-phase-review'
BASELINE='35c7835'
def read(path):return json.loads((ROOT/path).read_text())
def sha(path):return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
inv=read(OUT/'inventory.json');neighbors=read(OUT/'neighbors.json');runtime=read(OUT/'runtime.json')
runtime_neighbors=read(OUT/'neighbor-runtime.json');contacts=read(OUT/'contact-review.json')
prior=read('assets/source-manifest/reverse-mesh-diagnosis.json')
motion=read('assets/source-manifest/motion-works-study.json')
source=read('artifacts/motion-works/source.json')
assert len(neighbors['pairs'])==len(inv['pairs'])
assert {tuple(p['ids']) for p in neighbors['pairs']}=={tuple(p['ids']) for p in inv['pairs']}
assert len(runtime['pairs'])==5
assert len(runtime_neighbors['pairs'])==len(neighbors['pairs'])
assert all(not p['status'].startswith('unresolved') for p in neighbors['pairs'])
assert all('slice' not in p.get('enclosure',{}).get('method','').replace('Unsliced','') for p in neighbors['pairs'])
assert runtime['maxRigidError']<1e-9 and runtime['maxIndependentPointErrorMm']<1e-7
files=subprocess.check_output(['git','ls-files','explorer','assets/authored'],cwd=ROOT,text=True).splitlines()
for path in files:
 assert (ROOT/path).read_bytes()==subprocess.check_output(['git','show',BASELINE+':'+path],cwd=ROOT),path
assert sha(motion['source']['path'])==motion['source']['sha256']
for path,h in prior['localEvidenceSha256'].items():assert sha(path)==h,path
for path in ['explorer/public/models/assembly-manifest.json','assets/authored/wheel-display-poses.json']:
 assert sha(path)==read('assets/source-manifest/train-coupling-study.json')['inputSha256'][path]
summary=[]
for p in neighbors['pairs']:
 row={k:v for k,v in p.items() if k!='samples'}
 if p['constantRelativeTransform']:
  row['interpretation']='Invariant relative pose under conditional coupling; any recorded source overlap remains a fit limitation'
 summary.append(row)
scripts=['scripts/cad/escapement-clearance/display_phase_review.py','scripts/cad/escapement-clearance/record_display_phase_review.py','scripts/movement/review-display-phases.mjs']
evidence=['inventory.json','neighbors.json','runtime.json','fitted-hands.json','neighbor-runtime.json','contact-review.json']
record={
 'schemaVersion':1,'date':'2026-10-27','baselineCommit':subprocess.check_output(['git','rev-parse',BASELINE],cwd=ROOT,text=True).strip(),
 'source':motion['source'],'appChanged':False,'installedCandidatePhases':False,
 'scope':'Both display trains conditionally driven together; existing main-train motion included; all source occurrences and all authored fitted hand poses screened. Research, not physical-running acceptance.',
 'candidateWorldPhasesRelativeToSource':prior['equivalentSimultaneousDiagnosticPacketPhases'],
 'sourcePackets':source['packets'],
 'summary':{'sourceAndFittedOccurrences':inv['sourceAndFittedLeaves'],'boundedDisjointPairs':len(inv['fullTurnBoxExclusions']),'candidateNeighborPairs':len(summary),'statuses':dict(Counter(p['status'] for p in summary)),'sampledNeighborConfigurations':sum(len(p.get('samples',[])) for p in neighbors['pairs']),'sampledNeighborBRepQueries':sum(p.get('BRepQueries',0) for p in summary),'invalidOrNonSolidPairsUnqualified':len(inv['unqualified']),'minimumPriorCoilEnvelopeBoxGapMm':min(p['fullTurnBoxToPriorCoilEnvelopeGapMm'] for p in inv['springCoilEnvelope']),'unchangedAppAuthoredFiles':len(files),'runtimeMeshConfigurations':sum(p['intersectionConfigurations'] for p in runtime['pairs']),'runtimeNeighborWitnesses':sum(len(p.get('witnesses',[])) for p in runtime_neighbors['pairs'])},
 'neighborPairs':summary,'unqualifiedSourcePairs':inv['unqualified'],'springCoilEnvelope':inv['springCoilEnvelope'],
 'runtime':runtime,
 'runtimeNeighborContacts':[p for p in runtime_neighbors['pairs'] if any(w['triangleIntersection'] for w in p.get('witnesses',[]))],
 'runtimeNewContactPairs':[p for p in runtime_neighbors['pairs'] if any(w['triangleIntersection'] for w in p.get('witnesses',[])) and not p['baselineAuthoredTriangleIntersection']],
 'sourceContactReview':contacts,
 'rejectedIntermediateEvidence':{'path':'artifacts/display-phase-review/neighbors-slab-rejected.json','sha256':sha('artifacts/display-phase-review/neighbors-slab-rejected.json') if (OUT/'neighbors-slab-rejected.json').exists() else None,'accepted':False,'reason':'Preliminary Boolean slab clipping lost two direct whole-body shaft/bushing overlaps. All 154 affected enclosing/radial exclusions were discarded and recomputed without clipped source solids. This rejected intermediate is optional for reproduction.'},
 'increasedOverlapPairs':[p for p in summary if p['status']=='increased-overlap'],
 'retainedFitPairs':[p for p in summary if p['status']=='retained-fit-overlap'],
 'unresolvedPeriodPairs':[p for p in summary if p['status'].startswith('unresolved')],
 'inheritedMeshEvidence':{'frontMeshes':'Unchanged original geometry, display phases and ratios; prior full-material-period source polygons and selected solids retained','reverseMeshes':'Equivalent relative phase invariants transfer prior complete polygon covers to the simultaneous candidate packets; 45 nm rear-hour sampled original-solid margin remains unqualified','provenanceHashes':{p:sha(p) for p in ['assets/source-manifest/motion-works-study.json','assets/source-manifest/reverse-mesh-diagnosis.json','assets/source-manifest/friction-connections.json']}},
 'limitations':['All drive after center remains conditional on intended sticking at the two fitted interfaces','Continuous enclosing bounds apply only to the nominal qualified solids and recorded source precision; empty Boolean intersection is not a measured positive clearance','Neighbor sweeps with no positive bound are sampled, not swept-solid certification','Existing source overlaps and invalid/non-solid leaves are not mechanically accepted; not every overlap is a confirmed intended fit','Pre-existing runtime triangle contacts remain explicit; surface intersection alone does not establish positive-volume penetration','The rear hour mesh 45 nm source margin remains insufficient for a tolerance-qualified claim','Source and all authored fitted hand poses are checked separately as fixed obstacles; mutually exclusive hand variants are not asserted to coexist','No physical contact force, torque, setting, winding or self-sustaining model','No app test suite, build or browser automation rerun; unchanged lifecycle retains prior evidence'],
 'unchangedApplicationSha256':{p:sha(p) for p in files},'localEvidenceSha256':{str((OUT/p).relative_to(ROOT)):sha(OUT/p) for p in evidence},'toolSha256':{p:sha(p) for p in scripts},
}
(ROOT/'assets/source-manifest/display-phase-review.json').write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
print(json.dumps(record['summary'],indent=2))
print('increased overlaps',[(p['definitions'],p['variant'],p['maximumCommonMm3']) for p in record['increasedOverlapPairs']])
