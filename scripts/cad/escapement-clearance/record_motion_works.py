"""Record a rejected runtime extension, source observations and local verification."""
from pathlib import Path
import json,hashlib,subprocess
from fractions import Fraction
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/motion-works'
def read(path):return json.loads(path.read_text())
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def run():
 source=read(OUT/'source.json');periods=read(OUT/'periods.json');solids=read(OUT/'solids.json')
 ratios={'cannon1':'-1/540','motion1':'1/1620','hour1':'-1/6480','motion2':'-1/1620','motion3':'-1/1620','cannon2':'1/540','hour2':'1/6480'}
 packets=[]
 for name,p in source['packets'].items():
  r=Fraction(ratios[name]);members=[]
  for n in p['definitions']:
   leaf=source['leaves'][str(n)]
   members.append({k:leaf[k] for k in ['id','sourceInstanceId','definitionId','name','worldTransform','freshSourceMatrixMaxError']})
  packets.append({'name':name,'runtimeEnabled':False,'sourceParent':p['sourceParent'],'sourceChildDefinitionTags':p['childDefinitionTags'],'members':members,'conditionalRatioToEscape':str(r),'conditionalRatioToCenter':str(r/Fraction(-1,540)),'conditionalMeanPeriodSeconds':float(360/abs(54*r)), 'blocker':'No source-confirmed sticking center/cannon interface; both reverse meshes fail prescribed rotation. A disconnected front train or slipping motion2/motion3 interface is not established.'})
 preserved=['assets/authored/wheel-display-poses.json','assets/authored/hand-display-poses.json','assets/authored/running-movement.json','explorer/src/viewer/RunningMovement.ts','explorer/public/models/movement-runtime.json','explorer/public/models/movement-11e388509c0a.bin']
 for p in preserved:
  assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show','073a870:'+p],cwd=ROOT),p
 evidence=['source.json','interfaces.json','interfaces.png','sections.json','periods.json','solids.json','boundaries.json','runtime-meshes.json','runtime-transforms.json','runtime.json','runtime-sections.json','browser/browser-report.json','focused-tests.txt']
 evidence=[p for p in evidence if (OUT/p).exists()]
 scripts=[str(p.relative_to(ROOT)) for p in (ROOT/'scripts/cad/escapement-clearance').glob('*motion_works*.py')]+['scripts/cad/escapement-clearance/train_periods.py','scripts/cad/escapement-clearance/train_solids.py','scripts/movement/review-motion-works.mjs','tests/running-movement.test.mjs']
 browser=read(OUT/'browser/browser-report.json') if (OUT/'browser/browser-report.json').exists() else None
 record={'schemaVersion':1,'date':'2026-10-27','baselineCommit':'073a870','decision':'No candidate packets enabled. Retain the existing prescribed movement and static motion works; no verified independently driven portion is established.','source':next(f for f in read(ROOT/'assets/source-manifest/sources.json')['files'] if f['role']=='complete_assembly'),'packets':packets,
 'interfaces':{'centerToCannon1':{'definitions':[93,137],'classification':'nominal cylindrical contact, inferred friction interface; no key or source torque/sticking constraint established','radiusMm':.375,'sourceGapMm':source['interfaces'][0]['sourceGapMm'],'sourceCommonMm3':0,'conditionalWorldRatio':1},'motion2ToMotion3':{'definitions':[214,217],'classification':'tapered shaft overlaps round bore; inferred interference/friction fit between distinct source assemblies, not a source-declared rigid assembly or key','boreRadiusMm':.13,'sampledShaftRadiiMm':[.141474277,.144358891],'sourceCommonMm3':source['interfaces'][4]['sourceCommonMm3'],'conditionalWorldRatio':1}},
 'meshPeriodReview':periods,'selectedWholeSolidReview':solids,'teethAndBoundaryReview':read(OUT/'boundaries.json'),
 'runtimeReview':read(OUT/'runtime.json'), 'runtimeSectionReview':read(OUT/'runtime-sections.json') if (OUT/'runtime-sections.json').exists() else None,
 'validation':{'focusedTests':9,'focusedTestsPassed':(OUT/'focused-tests.txt').exists() and 'pass 9' in (OUT/'focused-tests.txt').read_text(),'browserChecks':len(browser['checks']) if browser else None,'browserPassed':all(c['pass'] for c in browser['checks']) and not browser['errors'] if browser else None,'browserTarget':'http://127.0.0.1:4173 (existing current-source development server)','build':'Not run; application runtime and asset inputs unchanged','referenceOnly':{'url':'https://www.joray-wyss.ch/en/assemblage','accessed':'2026-10-27','role':'General manufacturer description of cannon friction; not ML-01 constraint evidence'}},
 'localEvidenceRoot':'artifacts/motion-works','localEvidenceSha256':{p:digest(OUT/p) for p in evidence},'toolSha256':{p:digest(ROOT/p) for p in scripts},'unchangedRuntimeAndDisplaySha256':{p:digest(ROOT/p) for p in preserved},
 'limitations':['Conditional ratios are diagnostic, not installed or source-confirmed constraints.','Section distance bounds apply only to chord-sampled planar polygons; selected whole-solid and runtime-triangle checks are sampled.','Neighbor inventory provides full-turn box exclusions against frozen displayed neighbors; remaining candidates are not qualified after mesh failure.','Source-fit overlaps, invalid d27/d111, open d144, missing source diamond and all existing limits remain; no geometry, phase, tolerance or mechanical acceptance changes.','No new packet, clock, control, force, torque, setting interaction or self-sustaining simulation. Hands and the existing barrel-II boundary remain unchanged.','No push, PR, merge, deployment, publication or source redistribution.']}
 # Keep the tracked report compact; the full neighbor inventory is hashed local evidence.
 record['teethAndBoundaryReview']['neighborInventorySummary']=[{'definition':r['definition'],'boundedDisjointNeighbors':r['boundedDisjointNeighbors'],'unqualifiedSourceNeighbors':len(r['unqualifiedSourceNeighbors']),'candidateNeighborsNotQualified':len(r['candidateNeighborsNotQualified'])} for r in record['teethAndBoundaryReview'].pop('neighborInventory')]
 (ROOT/'assets/source-manifest/motion-works-study.json').write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
 print('Recorded',len(packets),'static candidate packets;',len(evidence),'local evidence files')
if __name__=='__main__':run()
