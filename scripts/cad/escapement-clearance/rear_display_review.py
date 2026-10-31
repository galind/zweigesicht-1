"""Verify installed rear phases/membership against the complete reviewed train.

Reuse only identical source transforms and pair kinematics. Fresh original-solid
witnesses check the installed mesh-critical poses and retained overlap boundaries.
"""
import display_phase_review as review
from display_phase_review import *

OUT=ROOT/'artifacts/rear-display'
OUT.mkdir(exist_ok=True)
review.REVIEW=OUT
BASE='5fd50f0'

def prepare_installed():
 prior=json.loads((ROOT/'assets/source-manifest/display-phase-review.json').read_text())
 for path,h in prior['localEvidenceSha256'].items():assert digest(ROOT/path)==h,path
 phase_record=json.loads((ROOT/'assets/source-manifest/reverse-mesh-diagnosis.json').read_text())
 for path,h in phase_record['localEvidenceSha256'].items():assert digest(ROOT/path)==h,path
 settings=json.loads((ROOT/'assets/authored/running-movement.json').read_text())
 runtime=json.loads((ROOT/'explorer/public/models/movement-runtime.json').read_text())
 for path in ['assets/authored/hand-display-poses.json','explorer/public/models/assembly-manifest.json','explorer/public/models/movement-runtime.json']:
  assert (ROOT/path).read_bytes()==subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT),path
 source=json.loads((ROOT/'artifacts/motion-works/source.json').read_text())
 for p in settings['displayPackets']:
  assert p['members']==source['packets'][p['name']]['members']
  assert Fraction(*p['ratio'])==RATIOS[p['name']]
 moving={i:(p['name'],Fraction(*p['ratio']),np.array(p['pivot'])) for p in runtime['packets']+settings['displayPackets'] for i in p['members']}
 oldposes=json.loads(subprocess.check_output(['git','show',BASE+':assets/authored/wheel-display-poses.json'],cwd=ROOT))
 oldposes={p['leafId']:p for p in oldposes['wheels']}
 catalog={p['id']:p for p in json.loads((ROOT/'explorer/public/models/assembly-manifest.json').read_text())['instances']}
 phases=phase_record['equivalentSimultaneousDiagnosticPacketPhases']
 rs=assembly();maxerror=0.
 for r in rs:
  r['packet'],r['ratio'],r['pivot']=moving.get(r['id'],('fixed',Fraction(0),np.zeros(3)))
  # Reconstruct the earlier review's copied-source transform independently of
  # the installed phase file. Every source occurrence must match, not just gears.
  expected=np.array(catalog[r['id']]['worldTransform'])
  if r['id'] in oldposes:expected=expected@matrix(np.zeros(3),oldposes[r['id']]['localZDegrees'])
  if r['packet'] in ['cannon2','hour2']:
   change=phases[r['packet']+'WorldDegrees']-(.25 if r['packet']=='hour2' else 0)
   expected=matrix(r['pivot'],change)@expected
  err=float(np.max(np.abs(r['matrix']-expected)));maxerror=max(maxerror,err)
  assert err<1e-10,(r['id'],err)
  r['baselineShape']=r['shape'];r['variant']='source-display';r['sourceId']=r['id']
  r['oscillating']=r['packet'] in ['balance','pallet']
  r['radius']=float(np.linalg.norm(corners(r['bounds'])[:,:2]-r['pivot'][:2],axis=1).max()) if r['bounds'] is not None else None
 byid={r['id']:r for r in rs}
 fitted=json.loads((OUT/'fitted-hands.json').read_text())
 assert fitted==json.loads((ROOT/'artifacts/display-phase-review/fitted-hands.json').read_text())
 for f in fitted:
  r=byid[f['id']].copy();r['sourceId']=r['id'];r['id']+='@fitted';r['variant']='fitted-hand'
  r['matrix']=np.array(f['matrix']);r['shape']=moved(r['definition'],r['matrix']);r['baselineShape']=r['shape'];r['bounds']=bounds(r['shape']);rs.append(r)
 review.save_review('transform-equivalence.json',{'sourceOccurrences':len(catalog),'leafOccurrences':len(rs)-len(fitted),'fittedHandOccurrences':len(fitted),'maximumInstalledVsReviewedMatrixError':maxerror,'scope':'All source/display transforms match the jointly reviewed candidate; no tooth/axis changes, all fitted hands unchanged.'})
 return rs

def inventory_installed(rs):
 inv=review.inventory(rs);inv['scope']='All 13 installed display leaves versus source and fitted-hand obstacles; complete seven-packet kinematics, static hands.'
 review.save_review('inventory.json',inv)
 old={tuple(p['ids']):p for p in json.loads((ROOT/'artifacts/display-phase-review/neighbors.json').read_text())['pairs']}
 inherited=[]
 for p in inv['pairs']:
  previous=old[tuple(p['ids'])]
  assert all(previous.get(k)==v for k,v in p.items()),p
  inherited.append({**previous,'evidenceReuse':'Exact pair kinematics and installed-to-reviewed source transform equivalence; display-phase-review/neighbors.json'})
 assert len(inherited)==len(old)==231
 review.save_review('neighbors.json',{'scope':'Inherited nominal evidence for the same transforms and kinematics; sampled results remain sampled. Fresh selected solids are recorded separately.','pairs':inherited})
 print('Verified',len(inherited),'identical candidate pairs;',len(inv['fullTurnBoxExclusions']),'box exclusions',flush=True)

def witnesses(rs):
 by={r['id']:r for r in rs};bydef={r['n']:r for r in rs if r['variant']=='source-display'}
 runtime=json.loads((OUT/'runtime.json').read_text());rows=[]
 for p in runtime['pairs']:
  for w in p['sourceCriticalWitnesses']:
   a,b=[bydef[n] for n in p['pair']];e=w['escapeDegrees']
   sh=[moved(r['shape'],matrix(r['pivot'],float(e*r['ratio'])%360)) for r in [a,b]]
   common,_=review.query(*sh);gap=dist(*sh)
   rows.append({'pair':p['pair'],'escapeDegrees':e,'commonMm3':common,'gapMm':gap,'priorWitnessGapMm':w['sourceSolidGapMm']})
   assert common<1e-10 and gap>0,(p['pair'],common,gap)
   print('mesh',p['pair'],gap,flush=True)
 boundaries=[]
 for p in json.loads((OUT/'neighbors.json').read_text())['pairs']:
  if p['status']!='retained-fit-overlap':continue
  a,b=[by[i] for i in p['ids']]
  fast=Fraction(p['fastRatioToEscape'])
  for angle in sorted(set([0.,p['worstOverlap']['fastDegrees']])):
   e=angle/float(fast)
   sh=[moved(r['shape'],matrix(r['pivot'],float(e*r['ratio'])%360)) if r['ratio'] else r['shape'] for r in [a,b]]
   volume,_=review.query(*sh)
   assert volume<=p['maximumCommonMm3']+max(1e-9,p['maximumCommonMm3']*1e-5),(p['definitions'],volume)
   boundaries.append({'ids':p['ids'],'definitions':p['definitions'],'escapeDegrees':e,'commonMm3':volume,'priorMaximumCommonMm3':p['maximumCommonMm3']})
 review.save_review('solid-witnesses.json',{'scope':'Selected original whole-solid queries at installed runtime critical poses and retained overlap witnesses; not continuous swept-solid or manufacturing certification.','meshes':rows,'retainedFitWitnesses':boundaries})
 print('Fresh source witnesses:',len(rows),'mesh,',len(boundaries),'retained fit',flush=True)

if __name__=='__main__':
 rs=prepare_installed()
 if len(sys.argv)>1 and sys.argv[1]=='witnesses':witnesses(rs)
 else:inventory_installed(rs)
