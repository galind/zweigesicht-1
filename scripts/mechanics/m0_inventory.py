#!/usr/bin/env python3
"""Generate/check M0 coverage and graph from explicit source-specific decisions.
No evaluator or application imports. Output is evidence, never runtime configuration.
"""
import argparse
import csv
import hashlib
import io
import json
from collections import Counter
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'docs/running-movement'
check = argparse.ArgumentParser(); check.add_argument('--check', action='store_true'); args = check.parse_args()
def read(path): return json.loads((ROOT/path).read_text())
def digest(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
def emit(name, content):
    p = OUT/name
    if args.check: assert p.read_text() == content, f'Stale {p}'
    else: p.write_text(content)
def emit_json(name, value): emit(name, json.dumps(value,indent=2,ensure_ascii=False)+'\n')
manifest = read('explorer/public/models/assembly-manifest.json')
preflight = read('artifacts/preflight/assembly-inventory.json')
source = read('assets/source-manifest/sources.json')['files'][0]
assert digest(source['path']) == source['sha256']
instances = manifest['instances'][1:]
assert len(instances)==426 and len({i['id'] for i in instances})==426
assert {i['sourceInstanceId'] for i in instances} == {i['instance_id'] for i in preflight['instances']}
pre_by_id = {i['instance_id']:i for i in preflight['instances']}
for i in instances:
    assert max(abs(a-b) for ra,rb in zip(i['worldTransform'],pre_by_id[i['sourceInstanceId']]['world_transform']) for a,b in zip(ra,rb)) < 1e-10
motion = read('assets/authored/motion-evidence.json')
fits = read('assets/authored/hand-display-poses.json')
dials = read('assets/authored/dial-configurations.json')
ids = {i['id'] for i in instances}; by_id = {i['id']:i for i in instances}
number = lambda i:int(i['definitionId'].split('_')[-1])
by_def = lambda defs:[i['id'] for i in instances if number(i) in defs]
hands = {h['leafId']:h for h in fits['hands']}
supports = {h['supportLeafId']:h for h in fits['hands']}
assert len(hands)==15 and set(hands)|set(supports) <= ids
fitted_structure = {x for f in dials['faces'].values() for x in f['structureLeafIds']}
# Explicit motion ownership based on recorded rigid membership, not blanket CAD parenting.
shaft_defs = {'balance':[109,110,111,112,113,114,115], 'pallet':[125,126,127,128,129,130], 'escape':[232,233,234,235], 'seconds':[241,242,243], 'third':[236,237,238], 'minute':[92,93,94,95]}
shaft_for = {d:k for k,ds in shaft_defs.items() for d in ds}
rows=[]
for i in instances:
    d=number(i); name=i['name']; iid=i['id']
    cls='unresolved'; condition='normal running'; owner='unassigned'; evidence='U-COVERAGE'; confidence='unresolved'; reason='Mechanical role or ownership not established; do not default to driven.'
    if d in shaft_for:
        cls='continuously-driven'; owner=shaft_for[d]; evidence='E-MECH'; confidence='geometry-supported'; reason='Recorded rigid shaft member; cycle/sign/contact still open (U-ESC/U-TRAIN).'
    elif iid in hands or iid in supports:
        h=(hands.get(iid) or supports[iid]);cls='continuously-driven';owner=h['face']+'-'+h['role'];evidence='E-HANDS';confidence='fit-verified, drive-assumed';condition='normal running, when fitted';reason='Reviewed blade/support pairing; upstream motion works unresolved (U-DISPLAY).'
    elif d in [88,116]:
        cls='deforming';owner='hairspring' if d==116 else ('barrel-II-spring' if '__0_1_1_83_1__' in iid else 'barrel-I-spring');evidence='E-MECH' if d==116 else 'E-CAD';confidence='geometry-supported, law-unresolved';reason='Elastic geometry requires constrained deformation and attachment frames (U-SPRING/U-BARREL).'
    elif d in [85,86,87,90,91,131]:
        evidence='U-BARREL';reason='Drum/cover/arbor/ratchet roles must be separated for series operation; normal-running driver not established.'
    elif d in [96,137,140,141,142,182,183,184,186,187,188,209,210,211,212,213,214,215,216,217]:
        cls='continuously-driven';owner='upstream' if d==96 else 'display-works';evidence='E-ANIMATION';confidence='functional-assumption';reason='Expected running wheel/rigid member; specific graph edges and phases remain candidates (U-UPSTREAM/U-DISPLAY).'
    elif d in [97,143,144,171,172,173,174,190,247,248,249,254,45,46,47,48,74,76,77]:
        cls='conditionally-driven';condition='winding / setting / explicit correction; normal-running coupling unresolved for 97/172';evidence='E-CAD';confidence='name/assembly assumption';reason='Conditional input mechanism; determine mode and any back-drive before X1 (U-MODES).'
    elif d in [159,161,178,193,244,246,252,206]:
        cls='deforming';condition='shock/reset' if d in [159,161,206] else 'winding/setting';evidence='E-CAD';confidence='name/assembly assumption';reason='Conditional spring, nominally stationary in normal run; attachment/compliance unverified (U-MODES/U-SHOCK).'
    elif d in [151,152,153,154,155,160]:
        cls='conditionally-driven';condition='shock/reset only';evidence='E-CAD';confidence='name/assembly assumption';reason='Indicator moving-member candidate; pivots and response unresolved (U-SHOCK).'
    elif i['isAssembly']:
        condition='aggregate; classify descendants individually';reason='Source hierarchy contains mixed or unproven motion; never rotate this assembly wholesale.'
    elif iid in fitted_structure or d in [117,118,256] or name.startswith(('010-','020-','030-')) or any(t in name.lower() for t in ['brücke','platine','chaton','deckplätt','dpl ','werkhalte','grundplatte','kloben','anschlagrahmen','kronradplatte','stoppfederplatte','stoppfedersäule','incabloc','zifferblatt','zb ','index','applik','logo']):
        cls='fixed';owner='frame';evidence='E-CAD';confidence='assembly-role assumption';reason='Support/fastener/dial structure at rest in normal running; fitting and conditional compliance need review where relevant.'
    elif '__0_1_1_1_3' in iid:
        cls='fixed';owner='case-context';condition='normal-running reference; wearing/opening excluded';evidence='E-CAD';confidence='scope assumption';reason='Case/strap accessory outside running chain; actual articulation or leather deformation is outside normal-running scope.'
    if cls=='unresolved' and not i['isAssembly'] and ('Zeiger' in name or 'Zeigerbuchse' in name):
        reason='Loose/unselected hand variant: raw pose only; no fitted driver approved (U-VARIANTS).'
    rows.append({'instance_id':iid,'source_instance_id':i['sourceInstanceId'],'definition':d,'name':name,'node_kind':'assembly' if i['isAssembly'] else 'leaf','motion_class':cls,'condition':condition,'motion_owner':owner,'evidence':evidence,'confidence':confidence,'review_status':'external review open','rationale':reason,'source_url':source['page_url'],'source_sha256':source['sha256']})
buf=io.StringIO();w=csv.DictWriter(buf,fieldnames=list(rows[0]),lineterminator='\n');w.writeheader();w.writerows(rows);emit('coverage.csv',buf.getvalue())
# Graph nodes are mechanical candidates; instance references resolve all repetitions.
nodes=[];edges=[]
def node(key,defs,role,select=None):
    members=by_def(defs)
    if select: members=[x for x in members if select in x]
    assert members,key
    nodes.append({'id':key,'instanceIds':members,'role':role})
def edge(a,b,kind,status,evidence,unknown,ratio=None,condition='normal running'):
    edges.append({'id':f'R{len(edges)+1:02}','from':a,'to':b,'kind':kind,'status':status,'evidence':evidence,'unknown':unknown,'signedDeltaRatio':ratio,'condition':condition,'phase':'unresolved unless static attachment','reviewStatus':'external review open'})
for k,ds in shaft_defs.items():node(k,ds,'rigid shaft; geometry-supported membership')
for barrel,ds,fragment in [('II',[85,86],'__0_1_1_83_1__'),('I',[90,91],'__0_1_1_83_2__')]:
    node('barrel-'+barrel,ds,'drum + candidate rigid cover, coupling unverified')
    node('arbor-'+barrel,[87],'independent arbor',fragment)
    node('spring-'+barrel,[88],'deforming mainspring',fragment)
    node('ratchet-'+barrel,[131],'ratchet candidate',f'__0_1_1_83_{15 if barrel=="II" else 14}')
    edge('arbor-'+barrel,'spring-'+barrel,'inner spring attachment','unresolved','E-CAD','U-BARREL')
    edge('spring-'+barrel,'barrel-'+barrel,'outer spring attachment / torque','unresolved','E-CAD','U-BARREL')
    edge('ratchet-'+barrel,'arbor-'+barrel,'coaxial candidate coupling','assumption','E-CAD','U-BARREL')
node('upstream',[96],'barrel-to-center intermediate')
node('coupling',[97],'coupling wheel; series/mode role unresolved')
edge('barrel-I','barrel-II','series energy relation only; intervening drum/arbor/ratchet connections unknown','unresolved','E-MECH','U-BARREL')
edge('barrel-I','upstream','direct external mesh rejected: center-distance mismatch 3.436086 mm','rejected candidate','E-PROBE','U-UPSTREAM')
edge('barrel-II','upstream','external mesh candidate 85/96, spacing 7.95 mm','geometry-supported candidate','E-PROBE','U-UPSTREAM',-80/26)
edge('upstream','minute','external mesh candidate 96/93','geometry-supported candidate','E-ANIMATION','U-UPSTREAM',-26/12)
for m in motion['meshes']:edge(m['driver'],m['follower'],'external mesh','geometry-supported ratio','E-MECH','U-TRAIN',-m['driverTeeth']/m['followerTeeth'])
edge('escape','pallet','alternating lock/unlock/impulse/drop','unresolved','E-MECH','U-ESC')
edge('pallet','balance','fork/impulse jewel and roller/safety contacts','unresolved','E-MECH','U-ESC')
node('hairspring',[116],'nonplanar deforming ribbon')
node('stud-pin',[117,118],'fixed terminal candidates; duplicate stud instances retained')
node('frame',[195,222,133],'fixed supporting frame')
edge('balance','hairspring','rotating inner terminal at collet 115','geometry-supported terminal center','E-MECH','U-SPRING')
edge('hairspring','stud-pin','fixed outer terminal; exact host occurrence unresolved','geometry-supported terminal center','E-MECH','U-SPRING')
edge('stud-pin','frame','fixed anchorage','assumption','E-CAD','U-SPRING')
for k,ds in [('front-cannon',[137]),('front-change',[209,210,211]),('front-hour',[140,141,142]),('rear-transfer',[212,213,214]),('rear-cannon',[182,183,184]),('rear-change',[215,216,217]),('rear-hour',[186,187,188])]:node(k,ds,'motion works shaft candidate; do not merge concentric shafts')
for a,b,kind,ratio in [('minute','front-cannon','friction/cannon coupling',None),('front-cannon','front-change','external 12/36',-12/36),('front-change','front-hour','external 10/40',-10/40),('front-change','rear-transfer','external 36/36',-1),('rear-transfer','rear-change','coaxial shaft connection 214 to 215; attachment unverified',1),('rear-change','rear-cannon','external 24/8',-24/8),('rear-change','rear-hour','external 8/32',-8/32)]:edge(a,b,kind,'geometry-supported candidate' if kind.startswith('external') else 'assumption','E-PROBE','U-DISPLAY',ratio)
for face,f in dials['faces'].items():
    for role in ['hour','minute']+(['seconds'] if face=='central' else []):
        key=face+'-'+role
        member=sorted({x for h in fits['hands'] if h['face']==face and h['role']==role for x in [h['leafId'],h['supportLeafId']]})
        nodes.append({'id':key,'instanceIds':member,'role':'all fitted style alternatives; activate selected style only'})
        driver=('seconds' if role=='seconds' else ('front-' if face=='central' else 'rear-')+('hour' if role=='hour' else 'cannon'))
        edge(driver,key,'coaxial fitted support/blade; upstream coupling not certified','fit-supported, drive-assumed','E-HANDS','U-DISPLAY',1)
node('keyless',[143,144,171,172,173,174,190,193,244,245,246,247,248,249,252,254],'conditional winding/setting and click')
node('conditional-springs',[178,193,244,246,252],'stop/setting/click spring attachment candidates')
node('shock',[145,151,152,153,154,155,159,160,161],'shock/reset candidate subgraph')
node('shock-bearings',[202,203,204,205,206,207],'balance shock protection; compliance unresolved')
edge('keyless','ratchet-I','winding transmission endpoint candidate','unresolved','E-CAD','U-MODES',condition='winding')
edge('keyless','coupling','sliding/engagement mode','unresolved','E-CAD','U-MODES',condition='winding/setting')
edge('keyless','front-cannon','setting drive and friction release','unresolved','E-CAD','U-MODES',condition='setting')
edge('conditional-springs','keyless','spring terminals, detents and stop contact','unresolved','E-CAD','U-MODES',condition='winding/setting')
edge('conditional-springs','balance','possible stop action 178; verify actual contact','unresolved','E-CAD','U-MODES',condition='setting')
edge('shock','frame','flexures 159/161, moving forks, reset and stops','unresolved','E-CAD','U-SHOCK',condition='shock/reset')
edge('shock-bearings','balance','bearing support / conditional elastic response','assumption','E-CAD','U-SHOCK',condition='normal support / shock')
node_ids={n['id'] for n in nodes}
assert all(e['from'] in node_ids and e['to'] in node_ids for e in edges)
assert all(set(n['instanceIds'])<=ids for n in nodes)
graph={'schemaVersion':1,'sourceSha256':source['sha256'],'units':{'length':'mm','angle':'rad','time':'s','signedDeltaRatio':'rad/rad'},'angleFrame':'right-handed STEP WORLD +Z; do not infer sign from local axis or viewing side','status':'M0 evidence graph; not executable motion parameters','warning':'Unresolved edges enumerate hypotheses or missing paths, not certified topology. CAD parent edges are not mechanical edges. Ratchet I/II names are association candidates. All absolute directions and phases remain open.','nodes':nodes,'edges':edges,'shafts':motion['shafts'],'toothCounts':motion['toothCounts'],'springGeometry':{k:v for k,v in motion['spring'].items() if k in ['definitionLabel','instanceId','boundsLocalMm','terminalCenters','ribbonThicknessMm','ribbonHeightMm','lowerCoilZLocalMm','raisedOvercoilZLocalMm']},'fittedHands':fits['hands'],'parameterProvenance':{'shafts':'E-MECH: analytic cylinders/XCAF, mm; geometry-supported, no external review','toothCounts':'E-MECH: radial BRep clusters, count unit teeth; geometric corroboration','springGeometry':'E-MECH: source edges and terminals, mm; terminal orientation/constraint still open','fittedHands':'E-HANDS: analytic bores and cached tip landmarks, mm; fit reviewed, drive unverified','signedDeltaRatio':'Dimensionless follower/driver angle ratio derived from stated tooth counts for candidate external meshes, or assumed rigid hand coupling. No phase/absolute sign acceptance.'}}
emit_json('graph.json',graph)
inputs=['assets/source-manifest/sources.json','explorer/public/models/assembly-manifest.json','artifacts/preflight/assembly-inventory.json','assets/authored/motion-evidence.json','assets/authored/hand-display-poses.json','assets/authored/dial-configurations.json']
emit_json('coverage-summary.json',{'schemaVersion':1,'sourceSha256':source['sha256'],'instances':len(rows),'leaves':sum(r['node_kind']=='leaf' for r in rows),'assemblies':sum(r['node_kind']=='assembly' for r in rows),'classes':dict(Counter(r['motion_class'] for r in rows)),'leafClasses':dict(Counter(r['motion_class'] for r in rows if r['node_kind']=='leaf')),'graphNodes':len(nodes),'graphEdges':len(edges),'fittedHandBlades':len(hands),'fittedSupports':len(supports),'inputSha256':{p:digest(p) for p in inputs}})
print(json.dumps({'coverage':len(rows),'classes':dict(Counter(r['motion_class'] for r in rows)),'nodes':len(nodes),'edges':len(edges),'check':args.check}))
