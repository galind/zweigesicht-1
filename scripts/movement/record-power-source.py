"""Record the local power-source evidence and explicitly incomplete animation.

Requires the private source audit, fresh primary-source downloads and completed
local runtime checks. Does not download, publish or regenerate runtime geometry.
"""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE = 'd29820e'
OUT = 'artifacts/power-source/'
def read(path): return json.loads((ROOT/path).read_text())
def sha(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
def old(path): return subprocess.check_output(['git', 'show', BASE+':'+path], cwd=ROOT)

audit = read(OUT+'source.json')
browser = read(OUT+'browser/browser-report.json')
source = next(f for f in read('assets/source-manifest/sources.json')['files'] if f['role']=='complete_assembly')
assert sha(source['path']) == source['sha256'] == audit['sourceSha256']
assert len(audit['interfaces']) == 24
assert all(p['commonValid'] for p in audit['interfaces'])
assert all(c['pass'] for c in browser['checks']) and not browser['errors']
assert len(browser['checks']) == 31
assert 'tests 27' in (ROOT/(OUT+'tests.txt')).read_text()
assert 'fail 0' in (ROOT/(OUT+'tests.txt')).read_text()
assert audit['standaloneSpring']['sourceMinusDownloadMm3'] == 0
assert audit['standaloneSpring']['downloadMinusSourceMm3'] == 0
settings = read('assets/authored/running-movement.json')
previous = json.loads(old('assets/authored/running-movement.json'))
policy_keys = {'powerSourcePolicy', 'displayTrainBoundary', 'statePolicy'}
assert {k:v for k,v in settings.items() if k not in policy_keys} == {
    k:v for k,v in previous.items() if k not in policy_keys}
controller = 'explorer/src/viewer/RunningMovement.ts'
before,after = old(controller).decode(), (ROOT/controller).read_text()
assert before.split('/** One controller')[0] == after.split('/** One controller')[0]
assert before[before.index('const rates ='):] == after[after.index('const rates ='):]
def transform_loop(text):
    start = text.index('for (const entry of this.entries)', text.index('  update(now: number, eligible: boolean'))
    return text[start:text.index('    this.spring.update',start)]
assert transform_loop(before) == transform_loop(after)

phases={p['leafId']:p for p in read('assets/authored/wheel-display-poses.json')['wheels']}
states={
    'drumII':'prescribed -E/3600', 'lidII':'prescribed -E/3600',
    'drumI':'held normal-running winding boundary', 'lidI':'held with drum I',
    'arborI':'unresolved q(t)', 'ratchetI':'unresolved; keyed to arbor I',
    'screwI':'unresolved; retained arbor I fastener',
    'arborII':'unresolved nominal -q(t)', 'ratchetII':'unresolved; keyed to arbor II',
    'screwII':'unresolved; retained arbor II fastener',
    'springI':'static supplied illustration; no assigned winding state',
    'springII':'static supplied illustration; no assigned winding state',
    'transfer':'unchanged E/1170',
}
for name,m in audit['members'].items():
    m['runtimePolicy'] = states.get(name,'held normal-running winding component')
    m['authoredLocalPhaseDegrees'] = phases.get(m['id'],{}).get('localZDegrees',0)
    m['localZWorld'] = [r[2] for r in m['sourceMatrix'][:3]]
    m['pivotWorldMm'] = [r[3] for r in m['sourceMatrix'][:3]]

unchanged={}
for path in subprocess.check_output(['git','ls-files','explorer/src','explorer/public/models','assets/authored'],cwd=ROOT,text=True).splitlines():
    if path in [controller,'explorer/src/viewer/MovementViewer.ts','explorer/src/experience/copy.ts','assets/authored/running-movement.json']: continue
    assert old(path)==(ROOT/path).read_bytes(),path
    unchanged[path]=sha(path)
implementation=['assets/authored/running-movement.json',controller,'explorer/src/viewer/MovementViewer.ts',
    'explorer/src/experience/copy.ts','explorer/app/page.tsx','tests/running-movement.test.mjs',
    'scripts/movement/browser-check.mjs','scripts/cad/escapement-clearance/power_source.py',
    'scripts/movement/record-power-source.py','docs/POWER_SOURCE_STUDY.md']
evidence=['source.json','cad.txt','maker-watches.html','movement-catalog.html','spring-page.html',
    'spring.stp','springI.wkt','springII.wkt','sections.png','tests.txt','typecheck.txt','lint.txt',
    'build.txt','browser/browser-report.json','local-barrel-view.png']
record={
    'schemaVersion':1,'date':'2026-10-31','baselineCommit':BASE,
    'branch':'codex/escapement-clearance-study',
    'status':'Power-source investigation completed; additional power-source animation remains incomplete. Separation-pose retention implemented.',
    'source':source,
    'primarySources':[
        {'url':'https://www.marcolangwatches.com/en/watches/','snapshotSha256':sha(OUT+'maker-watches.html'),
         'supports':'Series-connected barrels; nominal 3 Hz / 21600 beats per hour; actual-watch 70-hour reserve, not a runtime energy model.'},
        {'pageUrl':'https://www.marcolangwatches.com/cad/ml01-zugfeder_h16_s0145_l290/',
         'downloadUrl':'https://www.marcolangwatches.com/cad/ml01-zugfeder_h16_s0145_l290/?wpdmdl=2264&ind=1690897014720',
         'pageSha256':sha(OUT+'spring-page.html'),'downloadSha256':sha(OUT+'spring.stp'),
         'supports':'Same spring configuration as assembly; no additional operating configuration or attachment constraints.'}],
    'members':audit['members'],
    'motionLaws':{'outputDrumAndLid':'absolute world +Z degrees = -E/3600; mean period 24000 active seconds',
        'nominalSeriesConstraint':'B=(E(t)-E(0))/3600; drumI=0, drumII=-B, arborI=q(t), arborII=-q(t). Relative spring releases q and B-q. q is undetermined; eccentric source fit is not dynamically qualified.',
        'newMovingPackets':[], 'springState':'Unassigned. Static supplied geometry, no represented unwinding range or reset; train prescribed independently of stored energy.',
        'assumptions':'Engaged click holds winding train and drum I. No equal unwinding, fixed intermediate arbor, torque, energy-conservation or self-sustaining claim. Existing 93/137 and 214/217 assumptions retained.'},
    'springEvidence':{k:{field:value for field,value in v.items() if field not in ['outlines','localSurfaces']} for k,v in audit['springs'].items()},
    'standaloneSpring':{k:v for k,v in audit['standaloneSpring'].items() if k!='metadata'},
    'sourceSemanticEntityMatches':audit['stepMetadata']['semanticEntityTypeMatches'],
    'interfaces':audit['interfaces'],
    'clearancePolicy':{'newMovingOrDeformingAssembledInterfaces':[],
        'freshScope':'24 original-solid current-pose pairs; two sampled polygon sections; standalone spring Boolean equality.',
        'continuousBounds':'No new continuous operating-range bound claimed. Existing unchanged train bounds retain their original limits.',
        'sampledScope':'Previous barrel-II frozen-spring 36-pose evidence remains historical sampling, not transferred to spring deformation.',
        'exceptions':'Clutch 144 has zero solids. Prior invalid balance eccentrics and all prior source/hand overlap findings remain unqualified.',
        'separation':'Held presentation poses, not collision-qualified disassembly.'},
    'runtimeChange':'Separate applied pose from advancing active flag. Explorer separation holds last train/barrel/hairspring pose with no time catch-up or independent rendering loop; Inventory and Workshop Undo restore source endpoints.',
    'validation':{'focusedTests':27,'typecheck':'passed','lint':'passed','productionBuild':'passed',
        'browserChecks':len(browser['checks']),'browserErrors':browser['errors'],
        'observations':[c for c in browser['checks'] if c['name'].startswith(('Sustained','Every sampled','Focus runs','Hands freeze','Visibility lifecycle'))],
        'clockAndSpringImplementationUnchanged':True,'handImplementationUnchanged':True,
        'packetTransformLoopUnchanged':True,'frequencyRatiosPhasesMembershipUnchanged':True},
    'missingEvidence':['Actual inner/outer spring attachment frames and topology.',
        'Faithful spring strip geometry/configurations and agreed initial winding state.',
        'Supported intermediate-arbor trajectory or constitutive/contact model determining q(t).',
        'Review of wheel-I/arbor-I axis offset and moving key/gear interfaces.',
        'Attachment continuity, self-intersection and whole-solid neighbor validation over a specified finite operating range.'],
    'unchangedSha256':unchanged,'implementationSha256':{p:sha(p) for p in implementation},
    'localEvidenceSha256':{OUT+p:sha(OUT+p) for p in evidence},
    'publication':'Local commit only. No push, PR, merge, deployment or publication; release gates uncleared.'}
(ROOT/'assets/source-manifest/power-source.json').write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
print({'members':len(record['members']),'interfaces':len(audit['interfaces']),
       'unchangedFiles':len(unchanged),'browserChecks':len(browser['checks'])})
