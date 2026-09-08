#!/usr/bin/env python3
"""Reduce sampled source geometry to reviewable scalar evidence and parameters."""
import json,math
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'artifacts/mechanics';out.mkdir(parents=True,exist_ok=True)
x=json.load(open(out/'source-geometry.json'))
inv=json.load(open(ROOT/'artifacts/preflight/assembly-inventory.json'))['instances']
def instance(n):return next(i for i in inv if i['definition_label']==f'0:1:1:{n}')
def stable(i):return 'p_'+i['instance_id'].replace(':','_').replace('/','__')
counts={}
for k in ['85','90','93','94','96','233','234','237','238','242','243']:
 p=np.vstack([e['points'] for e in x[k]['edges']]);r=np.linalg.norm(p[:,:2],axis=1);rr=r.max();runs=[]
 for frac in [.985,.97,.95]:
  a=np.sort(np.mod(np.arctan2(p[r>rr*frac,1],p[r>rr*frac,0]),2*np.pi));g=np.diff(np.r_[a,a[0]+2*np.pi]);cuts=np.flatnonzero(g>g.max()*.5)
  centers=np.mod(a[cuts]+g[cuts]/2,2*np.pi);sp=np.diff(np.r_[np.sort(centers),min(centers)+2*np.pi])
  runs.append({'thresholdRadiusFraction':frac,'separatedTipClusters':len(cuts),'gapCutoffRadians':float(g.max()*.5),'pitchDegreesMean':float(np.degrees(sp.mean())),'pitchDegreesMaxDeviation':float(np.max(abs(np.degrees(sp)-360/len(cuts))))})
 counts[k]={'definitionLabel':f'0:1:1:{k}','name':x[k]['name'],'outerRadiusMm':rr,'runs':runs}
 print(k,[r['separatedTipClusters'] for r in runs])
# These edge indices are source-hash-specific terminal-face evidence, not a general spring detector.
s=x['116'];inner=np.array(s['edges'][97]['points'])[[0,-1]].mean(axis=0);inner[2]=-.1075
outer=np.array(s['edges'][198]['points'])[[0,-1]].mean(axis=0);outer[2]=.3575
w=np.array(instance(116)['world_transform'])
terminals={name:{'localMm':p.tolist(),'worldMm':(w@np.r_[p,1])[:3].tolist()} for name,p in [('inner',inner),('outer',outer)]}
sha='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
params={'schemaVersion':1,'reviewStatus':'AI engineering evidence; NOT expert mechanical review; illustrative cycle only','sourceSha256':sha,'coordinateSystem':{'units':'mm','frame':'unchanged STEP world','positiveAngles':'right-handed about WORLD +Z; reverse sign when using local -Z','transform':'worldAnimated = T(pivot) Rz(delta) T(-pivot) worldAssembled; presentation offset outside this transform'},'frequency':{'fullCyclesHz':3,'halfSwingsPerSecond':6,'sourceUrl':'https://www.marcolangwatches.com/en/watches/','confidence':'manufacturer specification'},'shafts':{},'meshes':[]}
for name,group,shaft,pivot in [('balance',109,113,[0,-10,-2.65]),('pallet',125,127,[-.999949089450934,-7.0657025,-1.56]),('escape',232,234,[-1.99989817890187,-4.131405,-4.14]),('seconds',241,242,[0,0,-4.31]),('third',236,237,[3.17046045103862,-3.61722,-3.21]),('minute',92,93,[0,0,-2.98])]:
 params['shafts'][name]={'assemblyInstanceId':stable(instance(group)),'sourceAssemblyDefinition':f'0:1:1:{group}','shaftDefinition':f'0:1:1:{shaft}','pivotWorldMm':pivot,'axisWorld':[0,0,1],'axisEvidence':'coaxial shaft geometry and XCAF world placement','rigidMembershipEvidence':'named source subassembly; source mechanical constraints not imported'}
params['shafts']['balance'].update(additionalRigidInstanceIds=[stable(instance(115))],excludeRigidDefinitionIds=['0:1:1:116','0:1:1:117','0:1:1:118'],amplitudeDegrees=None)
for driver,follower,zd,zf,m in [('minute','third',64,10,.13),('third','seconds',75,8,.1159),('seconds','escape',81,9,.102)]:
 a=np.array(params['shafts'][driver]['pivotWorldMm'])[:2];b=np.array(params['shafts'][follower]['pivotWorldMm'])[:2];d=float(np.linalg.norm(a-b));expect=m*(zd+zf)/2
 params['meshes'].append({'driver':driver,'follower':follower,'driverTeeth':zd,'followerTeeth':zf,'moduleMm':m,'relation':f'delta_{follower} = -delta_{driver} * {zd}/{zf}','measuredCenterDistanceMm':d,'nominalCenterDistanceMm':expect,'differenceMm':d-expect,'phaseStatus':'source assembly orientation retained; contact and backlash not verified'})
params['toothCounts']={k:{'teeth':v['runs'][0]['separatedTipClusters'],'evidence':'BRep edge-tip angular clusters at three radial thresholds; see tooth-count-evidence.json','confidence':'geometric corroboration; not manual tooth-by-tooth expert review'} for k,v in counts.items()}
params['illustrativeCycle']={'enabledAsMechanicalValidation':False,'escapeTeeth':20,'escapeStepPerHalfSwingRadians':math.pi/20,'beatPeriodSeconds':1/6,'escapePositiveWorldZSign':1,'escapeSignEvidence':'authored demonstration direction; actual running direction unverified','balanceAmplitudeDegrees':180,'balanceAmplitudeEvidence':'authored for readability; manufacturer running amplitude unknown','palletEndpointsDeltaWorldDegrees':[0,-12],'palletEndpointsEvidence':'authored; sparse distance probe places opposite jewel within .006124 mm at -12 degrees / escape +9 degrees; not validated lock endpoints','releaseBeatFraction':[.42,.58],'releaseEvidence':'authored illustrative window centered on balance zero crossing; true unlocking/impulse/drop phase unknown','smoothing':'smoothstep(u)=u*u*(3-2*u), clamped u=(fract(6*t)-.42)/.16','escapeEvaluator':'E=(floor(6*t)+smoothstep(u))*PI/20','balanceEvaluator':'B=180deg*cos(6*PI*t); source angular phase arbitrary','palletEvaluator':'n=floor(6*t); s=smoothstep(u); P=-12deg*((n%2===0)?s:1-s)','shaftRelationsToEscape':{'seconds':-1/9,'third':8/(9*75),'minute':-8*10/(9*75*64)},'meanRpm':{'escape':9,'seconds':-1,'third':.10666666666666667,'minute':-1/60},'mustExplain':['Illustrative timing; contact not validated.','Spring omitted from illustrative motion; Source inspection restores the original assembled pose.'],'notModelled':['geometric or dynamic recoil','exact tooth/pallet contact','roller/fork impulse contact','banking and safety contact','elasticity/inertia/damping','real balance amplitude','full running chain outside these shafts']}
params['spring']={'definitionLabel':'0:1:1:116','instanceId':stable(instance(116)),'boundsLocalMm':s['bounds'],'terminalCenters':terminals,'ribbonThicknessMm':.035,'ribbonHeightMm':.215,'lowerCoilZLocalMm':[-.215,0],'raisedOvercoilZLocalMm':[.25,.465],'staticGeometryPolicy':'retain source mesh and anchors for inspect mode','motionRecommendation':'Hide source spring during illustrative connected cycle until a visually and mechanically reviewed constrained deformation exists. Never rigidly rotate it with balance.','candidateDeformation':{'status':'analytical prototype only; NOT recommended for current full-amplitude connected cycle','formula':'local cylindrical map (r,phi,z)->(r,phi+angleLocal*w(r,z),z); w=(1-smoothstep((r-.53)/(3.25-.53)))*(1-smoothstep(z/.25)); clamp smoothstep input','anchorProperties':'inner terminal r<.53 -> w=1; raised outer terminal z>.25 -> w=0; outer lower coil r>=3.25 -> w=0; local spring Z points world -Z so angleLocal=-balanceWorldAngle','limitations':'This is an angular shear, not elastic breathing; it changes arc length and ribbon shape. Continuous map is injective for fixed r,z, but triangulated mesh and hardware clearance still need QA. Prefer small standalone teaching angle only; no evidence for 220-degree deformation.'}}
params['timingStudyPresentation']={'recommended':True,'label':'Timing study — source gear counts, illustrative cadence','hideDefinitionIds':['0:1:1:116','0:1:1:112','0:1:1:114'],'hideAssemblyDefinitionIds':['0:1:1:125'],'visibleBalanceDefinitionIds':['0:1:1:110','0:1:1:111','0:1:1:113','0:1:1:115'],'fixedContextDefinitionIds':['0:1:1:117','0:1:1:118'],'sourceInspection':'Reset every mechanical delta to zero before revealing hidden spring/pallet/roller parts; merely pausing at an arbitrary phase is insufficient.','palletEvaluatorStatus':'Candidate for future contact investigation only; do not apply or show in recommended timing study.','explanation':'Pallet, roller contact parts and hairspring are omitted. This studies the source-count-linked timing and shaft ratios, not impulse transfer or a complete running watch.'}
(out/'motion-parameters.json').write_text(json.dumps(params,indent=2)+'\n')
(out/'tooth-count-evidence.json').write_text(json.dumps({'method':'Samples unique BRep edges at <=approximately .008 mm spacing (cap 2500 points/edge); threshold outer radius; find angular clusters with inter-cluster gap > half largest gap; compare three thresholds. No name-derived count used by algorithm.','definitions':counts},indent=2)+'\n')
# Local-only visual geometry evidence.
fig,axes=plt.subplots(1,3,figsize=(15,5),layout='constrained')
for e in x['233']['edges']:
 p=np.array(e['points']);axes[0].plot(p[:,0],p[:,1],color='#334155',lw=.4)
axes[0].set(title='Source escape wheel: 20 tip clusters',xlabel='local X / mm',ylabel='local Y / mm',aspect='equal')
for e in s['edges']:
 p=np.array(e['points']);c='#c2410c' if p[:,2].max()>.01 else '#1d4ed8';axes[1].plot(p[:,0],p[:,1],c=c,lw=.35);axes[2].plot(p[:,0],p[:,2],c=c,lw=.35)
for name,p in [('inner',inner),('outer',outer)]:axes[1].scatter(*p[:2],s=35,c='black');axes[1].annotate(name,p[:2])
axes[1].set(title='Source hairspring: blue coils, orange overcoil',xlabel='local X / mm',ylabel='local Y / mm',aspect='equal')
axes[2].set(title='Raised outer terminal; not a planar spring',xlabel='local X / mm',ylabel='local Z / mm');axes[2].set_ylim(-.3,.55)
fig.savefig(out/'source-mechanics-evidence.png',dpi=160);plt.close(fig)
