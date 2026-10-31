"""Verify and record the scoped train investigation; no app files are written."""
from pathlib import Path
import ast,hashlib,json,subprocess
ROOT=next(p for p in Path(__file__).resolve().parents if (p/'AGENTS.md').is_file() and (p/'explorer').is_dir())
OUT=ROOT/'artifacts/train-coupling-20261026'
def read(name):return json.loads((OUT/name).read_text())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
 old=json.loads((ROOT/'assets/source-manifest/escapement-interfaces-study.json').read_text())
 periods=read('periods.json');solids=read('solids.json');neighbors=read('neighbors.json')
 kinematics=read('kinematics.json');barrel=read('barrel.json');envelopes=read('envelopes.json')
 assert periods['sectionSha256']==sha(OUT/'sections.json')
 assert solids['periodsSha256']==sha(OUT/'periods.json')
 assert kinematics['phaseSha256']==sha(ROOT/'assets/authored/wheel-display-poses.json')
 assert kinematics['cycleSha256']==sha(ROOT/'artifacts/escapement-clearance-20261026/cycle.json')
 assert envelopes['springInputSha256']==sha(ROOT/'artifacts/escapement-interfaces-20261026/spring-interfaces.json')
 assert len(periods['pairs'])==len(solids['pairs'])==5
 assert sum(p['configurations'] for p in periods['pairs'])==105461
 assert sum(len(p['samples']) for p in solids['pairs'])==75
 for p in periods['pairs']:
  assert p['overlapConfigurations']==0 and p['maximumOverlapAreaMm2']==0
  assert p['continuousPolygonGapLowerBoundMm']>0
 for p in solids['pairs']:
  assert all(r['commonVolumeMm3']<1e-10 and r['gapMm']>0 for r in p['samples'])
 assert len(neighbors['movingDefinitions'])==10 and neighbors['booleanQueries']==6052
 assert all(p['maximumCommonMm3']<=p['baselineCommonMm3']+1e-8 for p in neighbors['pairs'])
 fits=[p for p in neighbors['pairs'] if p['maximumCommonMm3']>1e-8]
 assert {(p['moving'],p['other']) for p in fits}=={(242,41),(96,139)}
 assert all(abs(p['seamResidualDegrees'])<1e-9 for p in kinematics['packets'])
 assert len(barrel['samples'])==36
 assert all(v<1e-10 for r in barrel['samples'] for k,v in r.items() if k.endswith('CommonMm3'))
 assert all(r['fullRotationBoxGapMm']>0 for r in envelopes['spring'])
 unresolved=[r for r in envelopes['balancePallet'] if r['fullRotationBoxGapMm']==0]
 assert len(unresolved)==len(envelopes['cylinderRefinements'])==4
 assert all(r['radialGapLowerBoundMm']>0 for r in envelopes['cylinderRefinements'])
 assert not subprocess.check_output(['git','diff',old['applicationBaselineCommit'],'--name-only','--','explorer','assets/authored'],cwd=ROOT).strip()
 assert sha(ROOT/old['source']['path'])==old['source']['sha256']
 scripts=['train_coupling.py','train_periods.py','train_solids.py','train_neighbors.py','train_kinematics.py','train_barrel.py','train_envelopes.py','record_train.py']
 for name in scripts:ast.parse((Path(__file__).parent/name).read_text())
 names=['sections.json','initial-pitches.json','periods.json','solids.json','neighbors.json','kinematics.json','barrel.json','envelopes.json']
 names += [f"period-{p['pair'][0]}-{p['pair'][1]}.npz" for p in periods['pairs']]
 result={'schemaVersion':1,'date':'2026-10-26','status':'Prescribed continuous visual train coupling feasible within recorded scope; mainspring power-source model unresolved',
  'branch':'codex/escapement-clearance-study','applicationBaselineCommit':old['applicationBaselineCommit'],'precedingStudyCommit':'1f2a36f',
  'source':old['source'],'historicalEvidenceCommit':old['historicalEvidenceCommit'],
  'runtimeInstalled':False,'sourceOriginalsModified':False,'mechanicalCycleAccepted':False,'additionalGearOrPhaseChangesRequired':False,
  'report':'docs/TRAIN_COUPLING_STUDY.md',
  'inputSha256':{p:sha(ROOT/p) for p in ['assets/source-manifest/escapement-clearance-study.json','assets/source-manifest/escapement-interfaces-study.json',
   'explorer/public/models/assembly-manifest.json','assets/authored/wheel-display-poses.json',
   'artifacts/escapement-clearance-20261026/cycle.json','artifacts/escapement-clearance-20261026/candidate-fork.brep',
   'artifacts/escapement-interfaces-20261026/source-cache.json','artifacts/escapement-interfaces-20261026/spring-interfaces.json']},
  'kinematics':kinematics,
  'gearMeshes':{'sectionConfigurations':105461,'selectedWholeSolidConfigurations':75,
   'pairs':[{'definitions':p['pair'],'teeth':p['teeth'],'configurations':p['configurations'],
    'minimumSectionGapMm':p['minimumClippedGapBoundMm'],'continuousPolygonGapLowerBoundMm':p['continuousPolygonGapLowerBoundMm'],
    'minimumSelectedSolidGapMm':min(r['gapMm'] for r in s['samples'])} for p,s in zip(periods['pairs'],solids['pairs'])]},
  'neighbors':{'newMovingLeaves':10,'angularSamplesPerLeaf':36,'poseBooleanQueries':neighbors['booleanQueries'],
   'boundingExclusions':neighbors['boundingExclusions'],'increasedOverlapPairs':0,'unqualifiedLeaves':len(neighbors['unqualified']),
   'retainedSourceFits':[{'moving':p['moving'],'other':p['other'],'baselineCommonMm3':p['baselineCommonMm3'],'maximumCommonMm3':p['maximumCommonMm3']} for p in fits]},
  'springAndEscapement':{'minimumNewTrainToSampledCoilBoxGapMm':min(r['fullRotationBoxGapMm'] for r in envelopes['spring']),
   'validBalancePalletBoxPairs':len(envelopes['balancePallet']),
   'cylinderRefinementPairs':4,'minimumRefinedRadialGapMm':min(r['radialGapLowerBoundMm'] for r in envelopes['cylinderRefinements'])},
  'barrelBoundary':{'rigidPoses':36,'booleanQueries':144,'sourceDistances':barrel['initial'],'unwindingSolved':False},
  'limits':['Prescribed kinematics, no force or torque acceptance','Continuous polygon separation is not continuous whole-solid clearance',
   'Neighbor screen freezes other leaves; it does not certify every simultaneous nonmeshing phase',
   'Invalid source BReps remain unqualified','Mainspring, arbors, ratchets, second barrel and motion works are outside rigid coupling',
   'Spring and timing interpolation, fitted product states and sustained rendering remain untested'],
  'localEvidenceRoot':str(OUT.relative_to(ROOT)),'localEvidenceSha256':{n:sha(OUT/n) for n in names},
  'scriptSha256':{str((Path(__file__).parent/n).relative_to(ROOT)):sha(Path(__file__).parent/n) for n in scripts}}
 path=ROOT/'assets/source-manifest/train-coupling-study.json';path.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n');print(path)

if __name__=='__main__':main()
