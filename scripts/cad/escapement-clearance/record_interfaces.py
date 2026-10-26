"""Record scoped completed evidence, including the unresolved train boundary."""
from pathlib import Path
import ast,hashlib,json,subprocess
ROOT=next(p for p in Path(__file__).resolve().parents if (p/'AGENTS.md').is_file() and (p/'explorer').is_dir())
OUT=ROOT/'artifacts/escapement-interfaces-20261026'
def read(name):return json.loads((OUT/name).read_text())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
 interfaces=read('interfaces.json');spring=read('spring.json');checks=read('spring-interfaces.json')
 terminal=read('spring-terminal.json');attachments=read('spring-attachments.json');train=read('train-boundary.json');render=read('render-envelopes.json')
 preview=read('spring-preview-checks.json');assert preview['loopPositionResidualMm']<1e-6 and preview['forwardReversePositionResidualMm']<1e-6
 assert interfaces['complete'] and len(interfaces['sampleIndices'])==39
 overlaps=[v for v in interfaces['pairs'].values() if v['maximumCommonMm3']>1e-8]
 assert {(v['moving'],v['other']) for v in overlaps}=={(113,116),(115,116),(234,243)}
 assert all(r['ribbonValid'] and r['centerlineSimple'] and r['minimumNonlocalStripGapMm']>0 for r in spring['samples'])
 assert checks['curveSha256']==terminal['curvesSha256']==sha(OUT/'spring-curves.npz')
 assert all(p['maximumSectionOverlapMm2']<1e-10 for r in checks['samples'] for p in r['pairs'] if p['definition']!=115)
 assert all(p['freeStripMaximumSectionOverlapMm2']<1e-10 for r in checks['samples'] for p in r['pairs'])
 assert len(checks['coilAnnulusSolidChecks'])==5 and all(r['commonMm3']<1e-10 for r in checks['coilAnnulusSolidChecks'])
 assert all(not r['intersectingChunks'] and r['conservativeGapLowerBoundMm']>0 for r in terminal['samples'])
 assert all(r['fineRibbonValid'] and r['fineNonlocalStripGapMm']>0 for r in attachments['refinedSamples'])
 assert all(r['coupledOverlapMm2']<1e-12 for r in train['samples'])
 assert all(r['coupledCommonMm3']<1e-10 and r['coupledGap3dMm']>0 for r in train['solidSamples'])
 assert max(r['frozenThirdCommonMm3'] for r in train['solidSamples'])>1e-5
 assert all(r['commonMm3']<1e-8 for r in render['exactCommonChecks'])
 assert render['springEnvelopeRadialGapMm']>0 and all(r['fullRotationBoxGapMm']>0 for r in render['diamondAxialChecks'])
 assert not subprocess.check_output(['git','diff','8c0a36779dc1818bc9b3c9c5c5568fbcbf489ad1','--name-only','--','explorer','assets/authored'],cwd=ROOT).strip()
 old=json.loads((ROOT/'assets/source-manifest/escapement-clearance-study.json').read_text())
 assert sha(ROOT/old['source']['path'])==old['source']['sha256']
 scripts=['interfaces.py','spring.py','spring_interfaces.py','spring_terminal.py','spring_attachments.py','train_boundary.py','render_envelopes.py','spring_preview.py','record_interfaces.py']
 for name in scripts:ast.parse((Path(__file__).parent/name).read_text())
 names=['source-cache.json','interfaces.json','spring.json','spring-curves.npz','spring-interfaces.json','spring-terminal.json','spring-attachments.json','train-boundary.json','render-envelopes.json','spring-preview.gif','spring-preview.png','spring-preview-checks.json']
 result={'schemaVersion':1,'date':'2026-10-26','status':'Support and illustrative spring feasibility established within recorded scope; integration blocked by frozen train boundary',
  'branch':'codex/escapement-clearance-study','applicationBaselineCommit':old['applicationBaselineCommit'],
  'precedingStudyCommit':'2e7dbbe','source':old['source'],'historicalEvidenceCommit':old['historicalEvidenceCommit'],
  'runtimeInstalled':False,'sourceOriginalsModified':False,'mechanicalCycleAccepted':False,
  'report':'docs/ESCAPEMENT_INTERFACES_AND_HAIRSPRING.md',
  'inputSha256':{p:sha(ROOT/p) for p in ['assets/source-manifest/escapement-clearance-study.json','explorer/public/models/assembly-manifest.json','assets/authored/wheel-display-poses.json','artifacts/escapement-clearance-20261026/cycle.json','artifacts/escapement-clearance-20261026/candidate-fork.brep']},
  'supportAudit':{'sourceLeaves':interfaces['sourceLeafCount'],'validMovingLeaves':14,'cycleConfigurations':39,'uniqueSolidCommonChecks':interfaces['exactQueries'],
   'boundingExclusions':interfaces['boundingExclusions'],'overlappingPairTypes':[{'moving':r['moving'],'other':r['other'],'maximumCommonMm3':r['maximumCommonMm3']} for r in overlaps],
   'minimumBearingGapMm':min(r['minimumGapMm'] for r in interfaces['pairs'].values() if r['minimumGapMm'] is not None)},
  'hairspring':{'sourceSolidCount':2,'coilTurns':spring['coilTurns'],'stripWidthMm':.035,'stripHeightMm':.215,'coilLengthMm':spring['polygonalCenterlineLengthMm'],
   'configurations':len(spring['samples']),'minimumNonlocalStripGapMm':min(r['minimumNonlocalStripGapMm'] for r in spring['samples']),
   'maximumCoilCenterlineRadiusMm':max(r['maximumRadiusMm'] for r in spring['samples']),
   'maximumEndpointResidualMm':max(r['endpointResidualMm'] for r in spring['samples']),
   'terminalExactDistanceChecks':sum(r['exactDistanceQueries'] for r in terminal['samples']),
   'coilEnvelopeSolidChecks':len(checks['coilAnnulusSolidChecks']),
   'terminalConservativeGapLowerBoundMm':min(r['conservativeGapLowerBoundMm'] for r in terminal['samples']),
   'refinedCenterlineMaximumDifferenceMm':max(r['fineCenterlineMaximumDifferenceMm'] for r in attachments['refinedSamples']),
   'representation':'offline constrained planar centerline; original dimensions and both attachment neighborhoods preserved; original raised terminal fixed'},
  'trainBoundary':{'sectionConfigurations':train['sampleCount'],'solidConfigurations':len(train['solidSamples']),
   'coupling':train['ratio'],'minimumCoupledSolidGapMm':min(r['coupledGap3dMm'] for r in train['solidSamples']),
   'frozenThirdMaximumCommonMm3':max(r['frozenThirdCommonMm3'] for r in train['solidSamples']),'upstreamTrainQualified':False},
  'renderedRecovery':{'invalidOriginalEccentricLeaves':4,'eccentricEnvelopeSolidChecks':len(render['exactCommonChecks']),
   'springEnvelopeRadialGapMm':render['springEnvelopeRadialGapMm'],'diamondMinimumRotationBoxGapMm':min(r['fullRotationBoxGapMm'] for r in render['diamondAxialChecks'])},
  'limits':['No force, material, operating frequency or self-sustained dynamics claim','Sampling and selected sections are not continuous whole-solid clearance certification',
   'Rendered mesh envelopes do not qualify invalid original eccentric solids','Source case/hand placements only, not every product preset',
   'Coupled upstream train, runtime interpolation, product-state behavior and sustained rendering remain open'],
  'localEvidenceRoot':str(OUT.relative_to(ROOT)),'localEvidenceSha256':{n:sha(OUT/n) for n in names},
  'scriptSha256':{str((Path(__file__).parent/n).relative_to(ROOT)):sha(Path(__file__).parent/n) for n in scripts}}
 path=ROOT/'assets/source-manifest/escapement-interfaces-study.json';path.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n');print(path)

if __name__=='__main__':main()
