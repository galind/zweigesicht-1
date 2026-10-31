"""Record the local-only hand milestone and its explicit clearance failures."""
from pathlib import Path
from collections import Counter
import hashlib,json,math,subprocess
ROOT=Path(__file__).resolve().parents[2]
BASE='79c234f'
def read(p):return json.loads((ROOT/p).read_text())
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def old(p):return subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT)
source=next(f for f in read('assets/source-manifest/sources.json')['files'] if f['role']=='complete_assembly')
assert sha(source['path'])==source['sha256']
manifest=read('explorer/public/models/assembly-manifest.json')
by={p['id']:p for p in manifest['instances']}
poses=read('assets/authored/hand-display-poses.json')
dials=read('assets/authored/dial-configurations.json')
audit=read('artifacts/dial-time/hand-pose-source-review.json')
assert audit['sourceSha256']==source['sha256']
records=[]
for h in audit['records']:
 a=next(a for a in poses['hands'] if a['leafId']==h['leafId']);p=by[h['leafId']]
 assert a['face']==h['face'] and a['role']==h['role'] and a['supportLeafId']==h['supportLeafId']
 for field in ['boreLocalMm','tipLandmarkLocalMm']:assert max(abs(x-y) for x,y in zip(a[field],h[field]))<1e-8
 assert dials['faces'][h['face']]['styles'][next(i for i,s in enumerate(dials['faces'][h['face']]['styles']) if s['id']==h['style'])]['handLeafIds'][h['role']]==h['leafId']
 m=p['worldTransform'];clock=poses['clockAnglesDegrees'][h['role']];sign=-1 if h['face']=='central' else 1
 records.append({k:h[k] for k in ['leafId','definitionId','face','style','role','boreLocalMm','tipLandmarkLocalMm','boreAxisWorldOriginMm','sourceWorldPointingDirection','worldZRotationDeltaDeg','assemblyWorldTranslationMm','supportLeafId','boreRadiusMm','supportSeatRadiusMm','maximumAxialSeatOverlapMm']} | {
  'sourceOccurrencePath':p.get('sourceInstanceId'),'sourceMatrix':m,'localZWorld':[row[2] for row in m[:3]],
  'fittedPivotMm':[*dials['faces'][h['face']]['axleWorldXYMm'],h['boreAxisWorldOriginMm'][2]],
  'readerReferenceDegrees':clock,'worldClockwiseSign':sign,'worldIncrementAtZeroTimeDegrees':-sign*clock})
assert len(records)==15
supports=[]
for id in sorted({h['supportLeafId'] for h in records}):
 p=by[id];h=next(h for h in records if h['supportLeafId']==id)
 supports.append({'id':id,'definitionId':p['definitionId'],'sourceOccurrencePath':p.get('sourceInstanceId'),'sourceMatrix':p['worldTransform'],'localZWorld':[row[2] for row in p['worldTransform'][:3]],'face':h['face'],'role':h['role'],'pivotXYMm':h['fittedPivotMm'][:2],'worldClockwiseSign':h['worldClockwiseSign']})
assert len(supports)==7
markers={}
for face,suffixes,coords in [('central',['3','21','13','19'],[[0,15.65],[15.65,0],[0,-15.65],[-15.65,0]]),('small',['27','13','3','6'],[[0,-.75],[8.15,7.4],[0,15.55],[-8.15,7.4]])]:
 prefix=dials['faces'][face]['rootId']+('__0_1_1_22_' if face=='central' else '__0_1_1_2_')
 markers[face]=[]
 for number,suffix,xy in zip([12,3,6,9],suffixes,coords):
  p=by[prefix+suffix];actual=[r[3] for r in p['worldTransform'][:2]]
  assert max(abs(a-b) for a,b in zip(actual,xy))<1e-8
  markers[face].append({'readerHour':number,'id':p['id'],'worldXYMm':actual})
# Exact preservation of prior train implementation outside the six hand hooks.
p='explorer/src/viewer/RunningMovement.ts';before=old(p).decode();after=(ROOT/p).read_text().split('\nconst rates =')[0]
for line in ["import poses from '../../../assets/authored/hand-display-poses.json' with { type: 'json' };\n","import dials from '../../../assets/authored/dial-configurations.json' with { type: 'json' };\n",'  readonly hands = new RunningHands();\n','    this.hands.restore();\n','    this.hands.update(eligible, this.clock.seconds, this.pose.escape);\n','    this.hands.presentationMatrix(id, out);\n','    this.hands.dispose();\n']:after=after.replace(line,'')
assert before.strip()==after.strip()
unchanged={}
for p in subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'assets/authored','explorer/public/models','explorer/src/bench'],cwd=ROOT,text=True).splitlines():
 assert (ROOT/p).read_bytes()==old(p),p
 unchanged[p]=sha(p)
clear=read('artifacts/current-time/clearance.json');runtime=read('artifacts/current-time/runtime-witnesses.json');browser=read('artifacts/current-time/browser/browser-report.json')
assert len(browser['checks'])==31 and all(c['pass'] for c in browser['checks']) and not browser['errors']
assert runtime['maxMatrixError']<1e-9 and not any('status' in r for r in runtime['rows'])
assert 'pass 19' in (ROOT/'artifacts/current-time/tests.txt').read_text()
overlaps=[p for p in clear['pairs'] if p['status']=='overlap'];assert len(overlaps)==58
paths=['explorer/src/viewer/RunningMovement.ts','explorer/src/viewer/MovementViewer.ts','explorer/src/play/PlayViewer.ts','tests/current-time-hands.test.mjs','tests/running-movement.test.mjs','scripts/movement/browser-check.mjs','scripts/movement/review-current-hands.mjs','scripts/cad/escapement-clearance/current_time_hands.py']
evidence=['artifacts/dial-cad/source-fit.json','artifacts/dial-time/hand-pose-source-review.json','artifacts/current-time/clearance.json','artifacts/current-time/runtime-witnesses.json','artifacts/current-time/beat-residual.json','artifacts/current-time/browser/browser-report.json','artifacts/current-time/tests.txt','artifacts/current-time/typecheck.txt','artifacts/current-time/lint.txt','artifacts/current-time/build.txt']
record={'schemaVersion':1,'date':'2026-10-28','baselineCommit':BASE,'source':source,
 'frequencyEvidence':'assets/source-manifest/nominal-operating-speed.json','priorFitEvidence':'assets/source-manifest/watch-configuration.json',
 'scope':'15 source blades and seven distinct fitted bushings; five blades/five bushings per selected fitted configuration, all nine style pairs. No small-face seconds hand. No raw catalog animation or Bench hand change.',
 'hands':records,'supports':supports,'dialMarkerEvidence':markers,
 'dialFrames':{'central':{'pivotXYMm':[0,0],'outward':[0,0,1],'up':[0,1,0],'right':[1,0,0]},'small':{'pivotXYMm':[0,7.4],'outward':[0,0,-1],'up':[0,-1,0],'right':[1,0,0]}},
 'timeMapping':{'formula':'T=C+(E(a)-54*a)/54; reader degrees=T*{hour:1/120,minute:1/10,seconds:6}; world delta=faceSign*(reader-reference). C is fresh local civil seconds modulo 12h, a is existing active seconds, E is unchanged accumulated escape degrees.','clockwiseSigns':{'central':-1,'small':1},'referenceClockDegrees':poses['clockAnglesDegrees'],'secondsBehavior':'Existing six-beat-per-second prescribed advance, dwell and recoil, not uniform sweep or 1 Hz ticking.','phaseOffsetToGears':'faceSign*rate*(C-a)-faceSign*referenceAngle. Load/resume/system-clock/timezone adjustments are illustrative time setting; no physical slip or setting mechanism is asserted.','sampledResidual':read('artifacts/current-time/beat-residual.json')},
 'lifecycle':'Same scheduler and gear clock. Explorer assembled focus/reveal/selection/isolation/flip run. Separation holds last hand angles in presentation coordinates until displayed separation zero, then current-time resync. Hidden return also resyncs. Inventory restores static reference; Workshop runs only at completion and Undo restores endpoints; Bench unchanged; dispose restores matrices and clears registrations.',
 'clearance':{'method':clear['limits'],'boxExclusions':clear['boxExclusions'],'incompatibleDialPairsExcluded':clear['incompatibleExclusions'],'statuses':dict(Counter(p['status'] for p in clear['pairs'])),'sampleConfigurations':clear['queries'],'overlaps':overlaps,'runtimeWitnesses':sum(len(p['witnesses']) for p in runtime['rows']),'runtimePairs':len(runtime['rows']),'maxRuntimeMatrixError':runtime['maxMatrixError'],'broadLanceWitnessCivilSeconds':next(p['equivalentCivilSeconds'] for p in runtime['rows'] if p['definitions']==[16,13]),'exceptions':[{k:p[k] for k in ['ids','definitions','status']} for p in clear['pairs'] if p['status']=='invalid/non-solid exception']},
 'validation':{'focusedTests':19,'typecheck':'passed','lint':'passed','productionBuild':'passed; existing route-classification notice','browserChecks':len(browser['checks']),'browserErrors':browser['errors'],'observations':[{k:c[k] for k in ['name','details']} for c in browser['checks'] if c['name'].startswith(('Sustained','All nine','Live hands','Live browser','Delayed frames','Every sampled','Completed Workshop shows'))]},
 'limitations':['Marker overlaps at all 12 small-dial positions for all three minute styles; authored 10:10 already overlaps the 2 oclock marker.','New relative-angle broad-lance hour/minute interference near effective civil 10:53:38.182.','Central Lance minute/outer-ring overlap already present at reference, plus retained blade/bushing and bushing/shaft fits.','54 remaining nonpenetrating pairs sampled only; invalid originals and full separation paths unqualified.','Unchanged rear-hour margin about 45 nm; 93/137 and 214/217 assumptions and barrel-II boundary unchanged.','Synthetic visibility/Workshop completion; desktop performance only. Device-clock accuracy, not external time calibration.','No push, PR, merge, deployment or publication; release gates remain.'],
 'priorGearImplementationPreservedExceptHandHooks':True,'unchangedSha256':unchanged,'implementationSha256':{p:sha(p) for p in paths},'localEvidenceSha256':{p:sha(p) for p in evidence}}
(ROOT/'assets/source-manifest/current-time-hands.json').write_text(json.dumps(record,indent=2)+'\n')
print({'hands':len(records),'supports':len(supports),'unchangedFiles':len(unchanged),'browserChecks':len(browser['checks']),'overlaps':len(overlaps)})
