"""Record installed rear display scope, inherited evidence and fresh validation."""
from pathlib import Path
from fractions import Fraction
from collections import Counter
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/rear-display'
BASE='5fd50f0'
def read(p):return json.loads((ROOT/p).read_text())
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def evidence(p):return read(OUT/p)
def baseline(p):return json.loads(subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT))

settings=read('assets/authored/running-movement.json')
study=read('assets/source-manifest/motion-works-study.json')
assembly=read('explorer/public/models/assembly-manifest.json')
assert sha(study['source']['path'])==study['source']['sha256']==assembly['source']['sha256']
assert settings['displayPackets'][:4]==baseline('assets/authored/running-movement.json')['displayPackets']
expected={'cannon1':(-1,540,3600),'motion1':(1,1620,10800),'hour1':(-1,6480,43200),'motion2':(-1,1620,10800),'motion3':(-1,1620,10800),'cannon2':(1,540,3600),'hour2':(1,6480,43200)}
assert [p['name'] for p in settings['displayPackets']]==list(expected)
byid={p['id']:p for p in assembly['instances']}
teeth={p['definition']:p['measuredLobesBeyondPitchCircle'] for p in study['teethAndBoundaryReview']['teeth']}
packets=[]
for p in settings['displayPackets']:
 s=next(s for s in study['packets'] if s['name']==p['name'])
 num,den,period=expected[p['name']]
 assert p['ratio']==[num,den] and Fraction(s['conditionalRatioToEscape'])==Fraction(num,den)
 assert 360/(54*abs(Fraction(num,den)))==period
 assert p['members']==[m['id'] for m in s['members']]
 for m in s['members']:
  r=byid[m['id']]
  assert r['definitionId']==m['definitionId']
  assert max(abs(a-b) for row,row2 in zip(r['worldTransform'],m['worldTransform']) for a,b in zip(row,row2))<1e-10
  assert max(abs(p['pivot'][i]-m['worldTransform'][i][3]) for i in [0,1])<1e-10
 packets.append({**p,'members':[{**m,'teeth':teeth.get(int(m['definitionId'].split('_')[-1])),'localZInWorld':[row[2] for row in m['worldTransform'][:3]]} for m in s['members']],'meanPeriodSeconds':period})
old={p['leafId']:p['localZDegrees'] for p in baseline('assets/authored/wheel-display-poses.json')['wheels']}
new={p['leafId']:p['localZDegrees'] for p in read('assets/authored/wheel-display-poses.json')['wheels']}
changes={id:dict(definitionId=byid[id]['definitionId'],previousLocalDegrees=old.get(id,0),installedLocalDegrees=new[id]) for id in new if new[id]!=old.get(id,0)}
assert {r['definitionId'] for r in changes.values()}=={'d_0_1_1_'+str(n) for n in [183,184,187,188]}
changed=set(subprocess.check_output(['git','diff',BASE,'--name-only','--','explorer','assets/authored'],cwd=ROOT,text=True).splitlines())
assert changed=={'assets/authored/running-movement.json','assets/authored/wheel-display-poses.json'},changed
unchanged={}
for p in subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'explorer','assets/authored'],cwd=ROOT,text=True).splitlines():
 if p not in changed:
  assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT),p
  unchanged[p]=sha(p)
inv=evidence('inventory.json');neighbors=evidence('neighbors.json');runtime=evidence('runtime.json');nr=evidence('neighbor-runtime.json');equiv=evidence('transform-equivalence.json');solids=evidence('solid-witnesses.json');browser=evidence('browser/browser-report.json')
assert len(neighbors['pairs'])==len(inv['pairs'])==len(nr['pairs'])==231
assert equiv['maximumInstalledVsReviewedMatrixError']<1e-10
assert all(p['status'] not in ['increased-overlap','unresolved excessive relative period'] for p in neighbors['pairs'])
assert sum(p['intersectionConfigurations'] for p in runtime['pairs'])==32261
assert not any(p['intersections'] for p in runtime['pairs'])
assert len(solids['meshes'])==12 and all(p['commonMm3']<1e-10 and p['gapMm']>0 for p in solids['meshes'])
assert len(browser['checks'])==22 and all(c['pass'] for c in browser['checks']) and not browser['errors']
assert 'pass 11' in (OUT/'focused-tests.txt').read_text() and 'pass 3' in (OUT/'phase-tests.txt').read_text()
assert 'Build complete.' in (OUT/'build.txt').read_text()
contacts=[p for p in nr['pairs'] if any(w['triangleIntersection'] for w in p.get('witnesses',[]))]
assert len(contacts)==11 and all(p['baselineSourceTriangleIntersection'] and p['baselineAuthoredTriangleIntersection'] for p in contacts)
inputs=['assets/source-manifest/motion-works-study.json','assets/source-manifest/friction-connections.json','assets/source-manifest/reverse-mesh-diagnosis.json','assets/source-manifest/display-phase-review.json','assets/source-manifest/rear-hour-phase-limit.json','assets/source-manifest/front-display-animation.json']
tools=['scripts/cad/escapement-clearance/rear_display_review.py','scripts/cad/escapement-clearance/record_rear_display.py','scripts/movement/review-display-phases.mjs','scripts/movement/browser-check.mjs','tests/running-movement.test.mjs','tests/wheel-display-pose.test.mjs']
record={'schemaVersion':1,'date':'2026-10-28','baselineCommit':BASE,'source':study['source'],
 'decision':'Enable three rear packets, extending the existing four front/transfer packets. Prescribed kinematics only; no physical or manufacturing acceptance.',
 'centerConnectionAssumption':settings['displayTrainAssumption'],'rearConnectionAssumption':settings['displayTrainConnection'],'remainingBoundary':settings['displayTrainBoundary'],
 'packets':packets,'installedPhaseChanges':changes,'frequencyHz':3,'beatsPerHour':21600,'meanEscapeDegreesPerSecond':54,
 'allHandsStatic':True,'windingAndSettingExcluded':True,'validation':{'movementTests':11,'phaseTests':3,'typecheck':'pass','lint':'pass','productionBuild':'pass; existing build notices','browser':browser},
 'clearance':{'transformEquivalence':equiv,'fullTurnBoxExclusions':len(inv['fullTurnBoxExclusions']),'inheritedIdenticalNeighborPairs':231,'statusCounts':dict(Counter(p['status'] for p in neighbors['pairs'])),'unqualifiedSourcePairs':len(inv['unqualified']),'springCoilEnvelope':inv['springCoilEnvelope'],'runtime':runtime,'runtimeNeighborConfigurations':sum(len(p.get('witnesses',[])) for p in nr['pairs']),'retainedRuntimeContacts':contacts,'freshOriginalSolidWitnesses':solids},
 'limitations':['214/217 sticking is a supported modeling interpretation for the requested animation, not maker-confirmed evidence','Rear-hour nominal source witness gap remains approximately 45 nm, not tolerance-qualified','101 neighbor pairs remain sampled-only; planar bounds are not continuous whole-solid certification','Source overlap/contact fits and invalid/non-solid occurrences remain unqualified; 214/217 interference is retained','Hands remain fixed at rotating shafts/hubs; no physical slip is claimed','No force, torque, winding, setting, mainspring unwinding or self-sustaining simulation','One desktop Chrome run with synthetic visibility/completion fixtures, not full OS/device qualification','Publication and redistribution gates remain uncleared'],
 'inputSha256':{p:sha(p) for p in inputs},'implementationSha256':{p:sha(p) for p in sorted(changed)},'unchangedApplicationSha256':unchanged,'toolSha256':{p:sha(p) for p in tools},'localEvidenceRoot':'artifacts/rear-display','localEvidenceSha256':{str(p.relative_to(ROOT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file()}}
(ROOT/'assets/source-manifest/rear-display-animation.json').write_text(json.dumps(record,indent=2)+'\n')
print('Recorded 7 packets, 13 display leaves, 231 neighbors, 32261 mesh configurations, 23 fresh solid configurations, 14 tests and 22 browser checks;',len(unchanged),'unchanged app/authored files')
