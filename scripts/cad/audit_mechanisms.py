#!/usr/bin/env python3
"""Extract source-named mechanism membership and cylindrical-axis evidence.
Never infers tooth engagement, phase, amplitude, or a working mechanical constraint.
"""
import json,re
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
p=ROOT/'assets/generated/assembly-manifest.json'
m=json.loads(p.read_text());items=m['instances'];defs={d['id']:d for d in m['definitions']}
byname={i['name']:i for i in items}

def subtree(name):
    item=byname.get(name)
    return [] if item is None else [i['id'] for i in items if not i['isAssembly'] and (i['id']==item['id'] or i['id'].startswith(item['id']+'__'))]

specs={
'balance': ['ml01 Unruh montiert vorreguliert'],
'escapement':['ml01 Anker montiert','ml01 Gangrad Niv20.5 vernietet'],
'energy-storage':['ml01 Federhaus1 montiert','ml01 Federhaus2 montiert'],
'going-train':['ml01 Minutenrad vernietet','ml01 Kleinbodenrad vernietet','ml01 Sekundenrad vernietet','ml01 Gangrad Niv20.5 vernietet'],
'shock-indicator':['shock indication montiert'],
'bridge-context':['ml01 Unruhbrücke verstiftet versteint','ml01 Ankerbrücke verstiftet versteint','ml01 Räderbrücke montiert','ml01 Federhausbrücke verstiftet versteint'],
'front-display':['ml01 Zifferblatt Front DM33,4 montiert'],
'reverse-display':['Gruppe Zifferblatt dezentrisch 18'],
'case-and-straps':['ml01 Gehäuse SS montiert'],
}
groups=[{'id':key,'sourceAssemblyNames':names,'memberIds':sorted(set(i for n in names for i in subtree(n))),'evidence':'Exact named source subtree membership; functional interpretation unreviewed. Alternate source designs may overlap.','reviewStatus':'geometry-evidence-only'} for key,names in specs.items()]
pivots=[]
for name in ['ml01 Unruhwelle','ml01 Ankerwelle','ml01 Gangtrieb z9 m0,102','ml01 Gangrad Niv20.5 vernietet','ml01 Minutenrad vernietet','ml01 Kleinbodenrad vernietet','ml01 Sekundenrad vernietet']:
    i=byname.get(name)
    if i is None:continue
    w=np.asarray(i['worldTransform']);d=defs[i['definitionId']]
    cylinders=[]
    # Analytic cylinders only support a shaft-axis candidate when collinear with local Z.
    for c in d.get('cylinders',[]):
        p=np.asarray(c['originLocalMm']);axis=np.asarray(c['axisLocal'])
        if abs(axis[2])>0.999999 and np.linalg.norm(p[:2])<1e-4:
            cylinders.append({'originWorldMm':(w@np.r_[p,1])[:3].tolist(),'axisWorld':(w[:3,:3]@axis).tolist(),'radiusMm':c['radiusMm']})
    pivots.append({'partId':i['id'],'sourceName':name,'originWorldMm':w[:3,3].tolist(),'axisWorld':w[:3,2].tolist(),'coaxialCylinderEvidence':cylinders,'confidence':'analytic-cylinder-supported' if cylinders else 'named-assembly-origin-only','reviewStatus':'requires-mechanical-review','limits':'Axis line candidate only. No engagement, ratios, phase or oscillation amplitude verified.'})
name_teeth=[]
for i in items:
    match=re.search(r'\bz(\d+)\b',i['name'])
    if match:name_teeth.append({'partId':i['id'],'name':i['name'],'sourceNamedTeeth':int(match.group(1)),'evidence':'z-number in source CAD label; not an independent tooth count','reviewStatus':'unverified'})
result={'schemaVersion':1,'sourceSha256':m['source']['sha256'],'units':'mm','groups':groups,'pivotCandidates':pivots,'toothCountNameHints':name_teeth,'mechanicalRelationships':[], 'variantConflicts':[{'memberIds':[byname[n]['id'] for n in ['ml01 Winkelhebelfeder','ml01 Winkelhebelfeder 2 Positionen']],'evidence':'Distinct source definitions with identical world AABB and placement; overlapping surfaces visibly z-fight in +Z diagnostic render.','resolution':'Author an explicit local display variant choice; preserve both source nodes and record exclusion.','reviewStatus':'unreviewed-variant'}], 'explicitUnknowns':['No native motion constraints recovered.','Source named tooth counts are not verified by counting mesh geometry.','Balance amplitude, release events, train phase and spring deformation remain unverified.','Spring geometry is present; no faithful animated deformation authored.','Overlapping source alternatives require an authored variant choice.']}
(ROOT/'assets/generated/mechanism-candidates.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'groups':len(groups),'pivots':pivots},indent=2))
