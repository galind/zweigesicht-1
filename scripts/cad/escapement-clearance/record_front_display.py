"""Record the verified four-packet implementation without modifying CAD/assets."""
from pathlib import Path
from fractions import Fraction
from collections import Counter
import hashlib
import json
import subprocess

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/front-display'
BASE='58c7e27'
def read(p):return json.loads((ROOT/p).read_text())
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def evidence(p):return read('artifacts/front-display/'+p)

study=read('assets/source-manifest/motion-works-study.json')
settings=read('assets/authored/running-movement.json')
manifest=read('explorer/public/models/assembly-manifest.json')
byid={p['id']:p for p in manifest['instances']}
assert sha(study['source']['path'])==study['source']['sha256']==manifest['source']['sha256']
expected={'cannon1':(-1,540,3600),'motion1':(1,1620,10800),'hour1':(-1,6480,43200),'motion2':(-1,1620,10800)}
assert [p['name'] for p in settings['displayPackets']]==list(expected)
teeth={p['definition']:p['measuredLobesBeyondPitchCircle'] for p in study['teethAndBoundaryReview']['teeth']}
packets=[]
for p in settings['displayPackets']:
 s=next(s for s in study['packets'] if s['name']==p['name'])
 num,den,period=expected[p['name']]
 assert p['ratio']==[num,den]
 assert Fraction(s['conditionalRatioToEscape'])==Fraction(num,den)
 assert 360/(54*abs(Fraction(num,den)))==period
 assert p['members']==[m['id'] for m in s['members']]
 members=[]
 for m in s['members']:
  r=byid[m['id']]
  assert r['definitionId']==m['definitionId']
  assert max(abs(a-b) for row,row2 in zip(r['worldTransform'],m['worldTransform']) for a,b in zip(row,row2))<1e-10
  assert max(abs(p['pivot'][i]-m['worldTransform'][i][3]) for i in [0,1])<1e-10
  members.append({**m,'teeth':teeth.get(int(m['definitionId'].split('_')[-1])), 'localZInWorld':[row[2] for row in m['worldTransform'][:3]]})
 packets.append({**p,'members':members,'meanPeriodSeconds':period})
changed=set(subprocess.check_output(['git','diff',BASE,'--name-only','--','explorer','assets/authored'],cwd=ROOT,text=True).splitlines())
assert changed=={'explorer/src/viewer/RunningMovement.ts','assets/authored/running-movement.json'},changed
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'explorer','assets/authored'],cwd=ROOT,text=True).splitlines()
unchanged={}
for p in paths:
 if p in changed:continue
 assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT),p
 unchanged[p]=sha(p)
inv=evidence('inventory.json');neighbors=evidence('neighbors.json');runtime=evidence('runtime.json');nr=evidence('neighbor-runtime.json');reuse=evidence('reuse.json');browser=evidence('browser/browser-report.json')
assert len(neighbors['pairs'])==len(inv['pairs'])==len(nr['pairs'])==136
assert len(reuse['recomputedPairs'])==3 and reuse['inheritedPairs']==133
assert all(p['status'] not in ['increased-overlap','unresolved excessive relative period'] for p in neighbors['pairs'])
assert sum(p['intersectionConfigurations'] for p in runtime['pairs'])==21507
assert not any(p['intersections'] for p in runtime['pairs'])
assert len(browser['checks'])==22 and all(c['pass'] for c in browser['checks']) and not browser['errors']
assert 'pass 10' in (OUT/'focused-tests.txt').read_text()
assert 'Build complete.' in (OUT/'build.txt').read_text()
contacts=[p for p in nr['pairs'] if any(w['triangleIntersection'] for w in p.get('witnesses',[]))]
assert all(p['baselineSourceTriangleIntersection'] and p['baselineAuthoredTriangleIntersection'] for p in contacts)
freshids={tuple(p['ids']) for p in reuse['recomputedPairs']}
fresh=[{k:v for k,v in p.items() if k!='samples'} for p in neighbors['pairs'] if tuple(p['ids']) in freshids]
inputs=['assets/source-manifest/motion-works-study.json','assets/source-manifest/friction-connections.json','assets/source-manifest/display-phase-review.json','assets/source-manifest/rear-hour-phase-limit.json']
tools=['scripts/cad/escapement-clearance/front_display_review.py','scripts/cad/escapement-clearance/record_front_display.py','scripts/movement/review-display-phases.mjs','scripts/movement/browser-check.mjs','tests/running-movement.test.mjs']
record={
 'schemaVersion':1,'date':'2026-10-28','baselineCommit':BASE,'source':study['source'],
 'decision':'Enable exactly four front/transfer packets as prescribed kinematics; not physically self-sustaining motion.',
 'authorizedModelingAssumption':settings['displayTrainAssumption'],
 'partialBoundary':settings['displayTrainBoundary'],
 'packets':packets,'meanEscapeDegreesPerSecond':54,'frequencyHz':3,'beatsPerHour':21600,
 'staticDisplayDefinitions':[183,184,216,217,187,188],'allHandsStatic':True,
 'validation':{'focusedTests':10,'typecheck':'pass','lint':'pass','productionBuild':'pass; existing route-classification notice','browser':browser},
 'clearance':{'fullTurnBoxExclusions':len(inv['fullTurnBoxExclusions']),'candidatePairs':136,'unqualifiedSourcePairs':inv['unqualified'],'springCoilEnvelope':inv['springCoilEnvelope'],'statusCounts':dict(Counter(p['status'] for p in neighbors['pairs'])),'inheritedIdenticalPairs':133,'freshPairs':fresh,'runtime':runtime,'runtimeNeighborConfigurations':sum(len(p.get('witnesses',[])) for p in nr['pairs']),'retainedRuntimeContacts':contacts},
 'limitations':['93/137 sticking is user-authorized, not maker-confirmed','214/217 moving/static boundary is incomplete; no physical slip claim','70 neighbor pairs are sampled-only; three changed boundaries use 37 original-solid poses each','Planar continuous bounds are not continuous whole-solid certificates','Original overlap/contact fits, invalid/non-solid sources, source tolerances and spring-envelope limits remain','Rear phases unchanged; no rear running-clearance acceptance','One desktop Chrome run with synthetic visibility and Workshop completion fixtures; not device/OS qualification','Publication and redistribution release gates remain uncleared'],
 'inputSha256':{p:sha(p) for p in inputs},'implementationSha256':{p:sha(p) for p in sorted(changed)},'unchangedApplicationSha256':unchanged,'toolSha256':{p:sha(p) for p in tools},
 'localEvidenceRoot':'artifacts/front-display','localEvidenceSha256':{str(p.relative_to(ROOT)):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file()}
}
(ROOT/'assets/source-manifest/front-display-animation.json').write_text(json.dumps(record,indent=2)+'\n')
print('Recorded four packets, 7 leaves, 136 neighbors, 21507 mesh configurations and 22 browser checks;',len(unchanged),'app/authored files unchanged')
