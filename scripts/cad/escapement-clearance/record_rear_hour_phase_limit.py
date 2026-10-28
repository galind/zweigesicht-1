"""Validate and record the phase-ceiling research; no application writes."""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'artifacts/rear-hour-phase-limit'
BASELINE = '09f5469'


def read(path):
    return json.loads((ROOT / path).read_text())


def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


cover = read(OUT / 'phase-cover.json')
precision = read(OUT / 'precision.json')
analytic = read(OUT / 'analytic-witnesses.json')
prior = read('assets/source-manifest/reverse-mesh-diagnosis.json')
motion = read('assets/source-manifest/motion-works-study.json')
assert sha(prior['source']['path']) == prior['source']['sha256']
for path, h in prior['localEvidenceSha256'].items():
    assert sha(path) == h, path
assert sha('artifacts/motion-works/source.json') == motion['localEvidenceSha256']['source.json']
for record in (cover, precision, analytic):
    assert record['sourceSha256'] == prior['source']['sha256']
assert len(cover['criticalWitnesses']) == 2
cells = cover['cells']
assert cells[0]['lo'] == -5.625 and cells[-1]['hi'] == 5.625
assert all(a['hi'] == b['lo'] for a,b in zip(cells,cells[1:]))
assert all(c['hi'] > c['lo'] and 0 <= c['upperMm'] < 4.6e-5 for c in cells)
for cell in cells:
    w = cell['witness']
    allowance = w['maximumFollowerDisplacementMm'] + cover['allHourPitchCopiesEdgeErrorMm'] + cover['numericGuardMm']
    assert w['midpointPhaseDegrees'] == (cell['lo']+cell['hi'])/2
    if cell['kind'] == 'persistent-intersection':
        assert w['interiorRadiusMm'] > allowance and cell['upperMm'] == 0
    else:
        assert abs(w['midpointGapMm'] + allowance - cell['upperMm']) < 1e-15
assert max(c['upperMm'] for c in cells) == cover['globalPolygonRunningGapUpperBoundMm']
assert cover['allHourPitchCopiesEdgeErrorMm'] < 1e-8
assert cover['hourHoleRadiusMm'] < cover['pinionMinimumReachMm']
assert len(precision['sections']) == 3 and len(precision['wholeSolids']) == 8
for row in precision['sections']:
    assert len(row['witnesses']) == 2 and all(w['overlapAreaMm2'] == 0 for w in row['witnesses'])
for row in precision['wholeSolids']:
    assert row['commonMm3'] == 0 and len(row['distances']) == 3
    values = [d['gapMm'] for d in row['distances']]
    assert min(values) > 0 and max(values)-min(values) < 1e-10
assert len(analytic['witnesses']) == 2
assert all(w['distanceAgreementMm'] < 1e-10 for w in analytic['witnesses'])
assert cover['candidatePhaseDegrees'] == precision['candidatePhaseDegrees'] == analytic['candidatePhaseDegrees']
app_files = subprocess.check_output(['git','ls-files','explorer','assets/authored'],cwd=ROOT,text=True).splitlines()
for path in app_files:
    assert (ROOT/path).read_bytes() == subprocess.check_output(['git','show',BASELINE+':'+path],cwd=ROOT), path
dependencies = ['rear_hour_phase_limit.py','record_rear_hour_phase_limit.py','reverse_mesh_diagnosis.py',
                'motion_works_sweep.py','motion_works.py','train_periods.py','train_coupling.py','study.py']
input_paths = ['assets/source-manifest/reverse-mesh-diagnosis.json',
               'assets/source-manifest/display-phase-review.json','assets/source-manifest/motion-works-study.json',
               'artifacts/motion-works/source.json','artifacts/escapement-interfaces-20261026/source-cache.json',
               'artifacts/escapement-interfaces-20261026/brep/d_0_1_1_217.brep',
               'artifacts/escapement-interfaces-20261026/brep/d_0_1_1_187.brep']
record = {
    'schemaVersion':1,'date':'2026-10-28',
    'baselineCommit':subprocess.check_output(['git','rev-parse',BASELINE],cwd=ROOT,text=True).strip(),
    'source':prior['source'],'appChanged':False,'installedCandidatePhases':False,
    'decision':'Phase tuning cannot produce a materially larger running gap in the reviewed nominal rear-hour section geometry. Original-solid witnesses and analytic circular supports corroborate about 45.145 nm; this does not qualify manufacturing clearance.',
    'sourceOccurrences':{str(n):{k:v for k,v in read('artifacts/motion-works/source.json')['leaves'][str(n)].items() if k in
        ['id','sourceInstanceId','definitionId','name','parentId','localTransform','worldTransform','freshSourceMatrixMaxError']} for n in (217,187)},
    'phaseCover':cover,'precision':precision,'analyticWitnesses':analytic,
    'limitations':[
        'Continuous phase ceiling applies to retained planar polygons. It is not a continuous analytic-solid or manufactured-gear certificate.',
        'Section quarter-point subdivision parameters and convergence do not certify analytic-curve Hausdorff error. Coordinates round to 1e-9 mm.',
        'Floating-point queries include a numerical guard, not interval-arithmetic certification.',
        'Fixed critical orientations suffice for an upper bound; the refined candidate has no new continuous full-running lower bound. Prior lower-bound evidence belongs to the prior candidate.',
        '10 nm imported edge/vertex tolerances and 5 micrometre STEP length uncertainty are not manufacturing clearances or a statistical error distribution.',
        'Existing conditional friction/fit states, 101 sampled-only neighbor pairs, original contacts/overlaps and invalid source solids remain unresolved.',
        'No new runtime or lifecycle tests needed or claimed; application and authored poses unchanged.'
    ],
    'inputSha256':{p:sha(p) for p in input_paths},
    'inheritedLocalEvidenceSha256':prior['localEvidenceSha256'],
    'localEvidenceSha256':{str((OUT/p).relative_to(ROOT)):sha(OUT/p) for p in ['phase-cover.json','precision.json','analytic-witnesses.json']},
    'toolSha256':{'scripts/cad/escapement-clearance/'+p:sha('scripts/cad/escapement-clearance/'+p) for p in dependencies},
    'unchangedApplicationSha256':{p:sha(p) for p in app_files},
}
(ROOT/'assets/source-manifest/rear-hour-phase-limit.json').write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
print(json.dumps({'phaseCells':len(cells),'phaseQueries':cover['phaseQueryCount'],
                  'globalPolygonCeilingNm':cover['globalPolygonRunningGapUpperBoundMm']*1e6,
                  'wholeSolidWitnesses':len(precision['wholeSolids']),
                  'unchangedAppAuthoredFiles':len(app_files)},indent=2))
