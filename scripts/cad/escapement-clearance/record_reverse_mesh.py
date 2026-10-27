"""Validate recorded evidence and write the source-only diagnosis provenance."""
from pathlib import Path
import json,hashlib,math,subprocess,re
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/reverse-mesh-diagnosis'
def read(p):return json.loads((ROOT/p).read_text())
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
comparison=read('artifacts/reverse-mesh-diagnosis/comparison.json')
runtime=read('artifacts/reverse-mesh-diagnosis/runtime.json')
fine=read('artifacts/reverse-mesh-diagnosis/fine-bound.json')
prior=read('assets/source-manifest/motion-works-study.json')
source=read('artifacts/motion-works/source.json')
max_error=0;witnesses=0
for r in runtime['comparisons']:
 case=next(c for p in comparison['pairs'] if p['pair']==r['pair'] for c in p['cases'] if c['label']==r['label'])
 for row,solid in zip(r['rows'],case['selectedSolids'],strict=True):
  assert row['fastDegrees']==solid['fastDegrees']
  for n,flat,angle in zip(r['pair'],row['matrices'],[solid['fastDegrees'],solid['followerDegrees']],strict=True):
   s=source['leaves'][str(n)]['worldTransform'];cx,cy=s[0][3],s[1][3]
   a=math.radians(angle%360);c,ss=math.cos(a),math.sin(a)
   for p in [(0,0,0),(1,0,0),(0,1,0),(0,0,1)]:
    w=[sum(s[i][k]*p[k] for k in range(3))+s[i][3] for i in range(3)]
    expected=[cx+c*(w[0]-cx)-ss*(w[1]-cy),cy+ss*(w[0]-cx)+c*(w[1]-cy),w[2]]
    actual=[sum(flat[k*4+i]*p[k] for k in range(3))+flat[12+i] for i in range(3)]
    max_error=max(max_error,max(abs(a-b) for a,b in zip(actual,expected)))
  witnesses+=1
assert max_error<1e-8
baseline='ac6e37c';files=subprocess.check_output(['git','ls-files','explorer','assets/authored'],cwd=ROOT,text=True).splitlines()
for name in files:
 assert (ROOT/name).read_bytes()==subprocess.check_output(['git','show',baseline+':'+name],cwd=ROOT),name
for name,h in prior['unchangedRuntimeAndDisplaySha256'].items():assert sha(name)==h
for name in ['source.json','sections.json','runtime-meshes.json']:
 assert sha('artifacts/motion-works/'+name)==prior['localEvidenceSha256'][name]
cache=read('artifacts/escapement-interfaces-20261026/source-cache.json')
for n in [183,216,217,187]:
 name=f'd_0_1_1_{n}.brep';assert sha('artifacts/escapement-interfaces-20261026/brep/'+name)==cache['files'][name]
assert not fine['unresolved'] and fine['remainingIntervals']==0
assert fine['fullMaterialPeriodPolygonGapLowerBoundMm']>0
scripts=['scripts/cad/escapement-clearance/'+x for x in ['reverse_mesh_diagnosis.py','reverse_mesh_fine.py','reverse_mesh_fine_bound.py','record_reverse_mesh.py']]+['scripts/movement/review-reverse-mesh-transforms.mjs']
evidence=['scan.json','comparison.json','fine-sections.json','fine-search.json','fine-bound.json','runtime.json']
record={'schemaVersion':1,'date':'2026-10-27','baselineCommit':subprocess.check_output(['git','rev-parse',baseline],cwd=ROOT,text=True).strip(),'source':prior['source'],'decision':{'183/216':'Source phase incompatibility under prescribed 8:24 rotation; no authored phase offsets; isolated phase clears reviewed source polygons and selected solids','217/187':'Source phase incompatibility partly relieved by authored hour phase; isolated phase clears reviewed source polygons and selected solids with only about 45 nm nominal sampled clearance','runtime':'No transform fault detected: independent point and witness transforms agree with production controller','appChanged':False,'installedCandidatePhases':False},'comparisons':comparison,'fineHourPair':fine,'runtime':{k:v for k,v in runtime.items() if k!='comparisons'},'runtimeWitnessSummary':[{'label':r['label'],'pair':r['pair'],'samples':len(r['rows']),'intersections':sum(x['triangleIntersection'] for x in r['rows']),'minimumSampledTriangleGapMm':min(x['triangleGapMm'] for x in r['rows'])} for r in runtime['comparisons']],'independentWitnessAudit':{'comparedPoses':witnesses,'maxPointErrorMm':max_error,'method':'Recorded controller matrices versus source occurrence plus CAD witness world rotation, independently evaluated without importing controller'},'equivalentSimultaneousDiagnosticPacketPhases':{'motion3WorldDegrees':0,'cannon2WorldDegrees':3*comparison['pairs'][0]['cases'][-1]['offsetWorldDegrees'],'hour2WorldDegrees':comparison['pairs'][1]['cases'][-1]['offsetWorldDegrees'],'scope':'Complete packets only in isolated runtime diagnostic; not installed or neighbor-qualified'},'validation':{'appFilesByteCompared':len(files),'baseline':baseline,'appTestsBuildBrowserAutomationRun':False,'cadAndIsolatedRuntimeReason':'Necessary to isolate source, phase and actual controller transforms; explained before execution','selectedOriginalSolidQueries':sum(len(c['selectedSolids']) for p in comparison['pairs'] for c in p['cases'])+len(fine['fineWholeSolidWitnesses'])},'unchangedRuntimeAndDisplaySha256':prior['unchangedRuntimeAndDisplaySha256'],'localEvidenceSha256':{str((OUT/name).relative_to(ROOT)):sha((OUT/name).relative_to(ROOT)) for name in evidence},'toolSha256':{name:sha(name) for name in scripts},'limitations':['Continuous bounds apply only to planar polygons, not whole solids or manufactured teeth','Source section chord tolerance is a sampling parameter, not a certified analytic-curve error bound','Rear hour candidate has about 45 nm nominal sampled solid gap; imported edge/vertex tolerance is 10 nm and STEP length uncertainty is 5 micrometres; no tolerance-qualified running acceptance','No all-phase neighboring-part, hand-fit or full coupled-train acceptance','No new friction joint-state evidence; all candidate packets and hands remain static','No app change, push, PR, deployment or publication']}
record['sourceOccurrences']={n:{k:source['leaves'][n][k] for k in ['id','sourceInstanceId','definitionId','name','parentId','worldTransform']} for n in ['183','216','217','187']}
record['inputEvidenceSha256']={name:sha(name) for name in ['artifacts/motion-works/source.json','artifacts/motion-works/sections.json','artifacts/motion-works/runtime-meshes.json','artifacts/escapement-interfaces-20261026/source-cache.json']}
source_text=(ROOT/prior['source']['path']).read_text(errors='replace')
record['sourceExportLengthUncertaintyValues']=sorted(set(re.findall(r'UNCERTAINTY_MEASURE_WITH_UNIT\(LENGTH_MEASURE\(([^)]+)\)',source_text)))
(ROOT/'assets/source-manifest/reverse-mesh-diagnosis.json').write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
print(json.dumps({'runtimeWitnessPoses':witnesses,'maxWitnessPointErrorMm':max_error,'appFilesUnchanged':len(files),'selectedOriginalSolidQueries':record['validation']['selectedOriginalSolidQueries']},indent=2))
