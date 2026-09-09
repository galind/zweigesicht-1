/** Generate the complete review ledger; metadata only, never changes CAD. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'explorer/package.json')),ts=require('typescript');
const THREE=await import(path.join(root,'explorer/node_modules/three/build/three.module.js'));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const baseline='00ae9d3f3e441c1a7d2559e5b500b99ac4f5567b';
function classifier(source){const module={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:()=>THREE});return module.exports.finishFor;}
const current=classifier(fs.readFileSync(path.join(root,'explorer/src/viewer/materials.ts'),'utf8'));
const prior=classifier(execFileSync('git',['show',baseline+':explorer/src/viewer/materials.ts'],{cwd:root,encoding:'utf8'}));
const manifest=read('assets/generated/assembly-manifest.json'),audit=read('artifacts/finishing-cad/audit.json');
const surfaces=read('explorer/public/models/finish-surfaces.json');
const prefix='p_0_1_1_1__0_1_1_1_4__0_1_1_83_',movement='p_0_1_1_1__0_1_1_1_4';
const families={
 steel:['Neutral steel/pale metal; alloy unresolved unless source SS','Polished/satin metal. Exact polishing map, concealed walls and manufacturing grain unverified.'],
 brushedSteel:['Brushed keyless steel appearance','User reference correction: straight satin on both local-Z flat faces of the reviewed keyless levers/springs; existing inclined edges polished, walls satin. See FINISH_ADJUSTMENTS.md; pitch and response authored.'],
 bridge:['Steel bridge','Fine local-X straight-grained upper fields; matte/frosted lower feet; existing inclined bevels polished; vertical walls satin. Direction/pitch authored, not manufacturing measurements.'],
 warmPlate:['Warm rose-colored metal cap; exact alloy/coating unmeasured','Straight-grained top; polished existing chamfers/countersinks; underside and walls rougher.'],
 frosted:['Warm pink-gilt plate appearance','Fine isotropic frosting; existing inscription regions darkened; actual engraving geometry retained.'],
 brass:['Warm wheel/compound-part metal; no blanket alloy claim','Fine circular satin with sharper existing inclined edges; individual spoke-aligned brushing remains approximated.'],
 barrel:['Warm rose-colored barrel metal','User-corrected snailing: fine curved strokes sweeping around the axle with matching directional reflections; rougher cylindrical walls and bright existing inclined rims. Hidden lid/drum differences unverified.'],
 ratchet:['Neutral steel ratchet','Circular satin fields with sharper edges; exact wheel polishing unmeasured.'],
 gold:['Warm gold-colored setting/pin','Smooth polished warm metal; actual alloy/process not established for every hidden pin.'],
 balance:['Warm balance rim; alloy unresolved','Smooth metal with warm reflections; source/photo evidence cannot distinguish all reflected warmth from intrinsic color.'],
 brushedCrown:['Brushed steel crown wheel','User correction: visible circular brush grain on d249; the separately modeled cap d251 retains its blue cone and prior finish.'],
 crown:['Polished steel crown cap','Smooth reflective metal; cap d251 source face22 alone is the blue cone.'],
 blue:['Blued steel appearance','Reflective blue across each whole blued screw; neutral source-identified hand seats remain where annotated. Unobserved locations remain inferred.'],
 spring:['Blue hairspring','Smooth thin blued-metal appearance; retained Breguet overcoil geometry.'],
 ruby:['Ruby-bearing dielectric','Magenta/red dielectric with IOR1.76, transmission .55, authored .3mm thickness. Interior optics approximate; no measured transmission.'],
 shockMass:['Ruby shock mass','Dielectric ruby emulation; chiefly hidden, supported by named mass in macro-review prose and maker exploded identity.'],
 leather:['Named leather color variant','Rough dielectric; no pore/stitch material region or measured hide finish claimed.'],
 rubber:['Seal/gasket dielectric','Matte dark rubber-like emulation; composition and pale gasket variant unresolved.'],
 enamel:['Source-named red enamel variant','Red glossy dielectric appearance; optional red CAD variant is not silently recolored to the photographed blue production dial.'],
 sapphire:['Clear sapphire crystal','Clear dielectric IOR1.76, transmission .98, authored thickness; coating and multi-layer refraction unverified.'],
 diamond:['Clear diamond; actual maker STL recovered','Original eightfold simplified maker facets; IOR2.417, transmission .92, authored thickness1.26mm; no simulated multiple internal bounces/dispersion or photographic brilliant-cut accuracy.'],
};
const photo=new Set([85,86,90,91,94,99,100,101,102,105,106,110,111,116,133,134,147,155,156,159,165,187,195,208,213,216,219,222,224,225,228,230,231,238,240,243,249,251]);
const conflicts={
 114:'Double roller source is gray but current warm profile is historical; no unobstructed primary material view resolves steel versus warm alloy.',
 121:'Flitter source is warm but current steel profile differs; hidden underside washer composition/finish unresolved.',
 130:'Safety piece source is warm; current steel family retained pending component-specific evidence.',
 137:'Dial-I cannon pinion source is gray; warm current assignment lacks an exposed primary photo.',
 142:'Hour-wheel-I hub source is gray; warm current assignment unresolved.',
 183:'Dial-II cannon pinion source is gray; warm current assignment unresolved.',
 188:'Hour-wheel-II hub source is gray; warm current assignment unresolved.',
 203:'Incabloc hole-stone shell source gray versus current warm setting; mostly concealed, unresolved.',
 206:'Incabloc lyre spring source gray versus current warm treatment; precise variant unresolved.',
 233:'Escape-wheel source gray versus warm wheel treatment; current photographed-family interpretation cannot certify this concealed alloy.',
 235:'Escape-wheel hub source pale neutral versus warm profile; physical composition unresolved.',
 185:'Clamp body source gray and maker component render blue/violet top conflict; installed photo exposes too little of the lug. Keep steel body, resolve only its separately identified screws.',
 256:'Regulation support is optional source tooling, not a watch part; orange CAD color does not establish metal/plastic composition. Neutral retained.',
 66:'Pale source glass gasket rendered dark rubber; no exposed production reference resolves color/composition. Retained, not certified.',
};
const specific={
 117:['User explicit hairspring-holder steel correction; source ml01 Klötzchen identity and gray appearance','Both source occurrences of the hairspring stud use neutral steel. The separate clamping screw is corrected by exact instance; the hairspring itself retains blue metal.'],
 105:['REF-SJX-04; REF-SJX-05; maker DPL component render','Exactly one instance. All34 source faces warm: face13 top at Z0; face12 underside at -.35mm; 15-18,20,22-33 conical chamfers/countersinks; original normals/face identity separately recovered. Prior whole-steel assignment wrong.'],
 120:['STEP d120 face colors; d105 photographic analogy','Opposite escape cap:18 source faces warm, top face5 at Z0, underside face4 at -.25mm. Warm correction inferred; no exposed photograph of this dial-side cap.'],
 225:['Maker component STL+STEP; REF-SJX-05; REF-MAKER-01','Assembly STEP #509351 contains only placement #509383, no solid; standalone STEP also axis-only. Original STL off-origin coordinates cancel unchanged source matrix.1640 triangles recovered; original STEP triangles0/boundsnull preserved.'],
 67:['Source name Saphirglas; XCAF white alpha .30; maker watch specifications','Two instances. Opaque metallic fallback was incompatible with sapphire; both now clear dielectrics. Numerical optical settings authored.'],
 3:['Maker dial-II solid-silver/enamel description; source d3 regions','Carrier includes180 pale metal and96 dark source-marking faces; separately modeled enamel is d4. Source name alone previously painted whole carrier red enamel.'],
 14:['Maker dial-II material description; source d14 pale metal','Four-segment metal carrier; enamel insert is separate d21. Prior whole-blue enamel was unsupported.'],
 17:['Maker dial-II material description; source d17 face colors','144 pale carrier faces and96 dark marking faces; preserve regions. Exact customer variant unverified.'],
 26:['Maker dial-I photo; source d26 face colors','527 dark marking/background faces and300 pale metal faces. Both retain source boundaries; source-dark material inferred, not manufacturing certification.'],
 27:['Maker dial-I photo; source d27 face colors','9956 pale dial surfaces and134 dark source marking faces. Original guilloche geometry retained; invalid BRep/rare normal fallback unresolved.'],
};
function groups(faces){const out=new Map();for(const f of faces){const key=JSON.stringify(f.directColors);if(!out.has(key))out.set(key,{appearance:f.directColors,faces:[]});out.get(key).faces.push(f.index);}return [...out.values()];}
const definitions=audit.definitions.filter(d=>!d.isAssembly).map(d=>{
 const n=Number(d.id.split('_').at(-1)),f=current(d.name,d.id),m=manifest.definitions.find(x=>x.id===d.id),entry=surfaces.definitions[d.id];
 let status=photo.has(n)?'verified':'inferred',evidence=photo.has(n)?'REF-MAKER-01 and FINISHING_REFERENCES.md ID-mapped observations':'STEP/XCAF source identity/appearance; existing family review in FINISHING_REFERENCES.md (not individual physical confirmation)';
 let notes=families[f.family][1];if(specific[n]){evidence=specific[n][0];notes=specific[n][1]+' '+notes;}
 if(n===117)status='verified';
 if([97,172,174,176,178,190,193,244,246,248].includes(n)){
  evidence+='; USER-FINISH-2026-09-09-02 (user-supplied CAD render and explicit brushing request)';
  notes+=' Updated straight/circular keyless satin per user reference; family inferred from CAD identity, no manufacturing certification. See docs/FINISH_ADJUSTMENTS.md.';
 }
 if(['bridge','frosted','barrel','brass','ratchet'].includes(f.family))notes+=' User finishing adjustment, 9 September 2026: stronger multiscale frosting on plate/lower bridge fields and readable wheel grain and curved barrel snailing. See docs/FINISH_ADJUSTMENTS.md and assets/source-manifest/finish-adjustment-references.json; numerical grain is authored.';
 if([85,86,90,91].includes(n))evidence+='; USER-FINISH-2026-09-09-04 snailing reference and user confirmation';
 if([85,86,90,91].includes(n))notes+=' Follow-up user correction: both barrels match the accepted left winding. Local curvature is +1.15 for d85/86 and -1.15 for oppositely oriented d90/91; grain and reflection directions both compensate for the original source transforms.';
 if(n===105)evidence+='; USER-FINISH-2026-09-09-03 cap plate photograph and user confirmation';
 if(n===249)evidence+='; user explicit crown-wheel brushing correction';
 if(n===105)notes+=' User correction: parallel brushing follows local +Y, from midpoint of screw axes (+/-.75,-1.1) to jewel (0,0).';
 if(n===99)notes+=' User correction: source face54 at local Z=-.3mm is a smooth satin cap-plate seat, not frosted. Other lower faces retain frosting.';
 if(conflicts[n]){status='unresolved';notes=conflicts[n]+' '+notes;}
 if([4,21].includes(n)){status='unresolved';notes+=' Maker current target is blue enamel; red is retained as explicitly named CAD catalog alternative. Customer-variant selection unresolved.';}
 if([9,107,122,123,136,138,139,166,168,169,170,180,181,189,191,192,201,226,253,255].includes(n))notes+=' User correction, 9 September 2026: the entire blued screw (head, slot, underside, shaft and any modeled thread) uses blue metal. Source neutral shank/under-head annotations remain as provenance but are bypassed by the whole-screw material override. Explicit steel instances remain unblued. Top-origin variants d9/d107/d122/d180/d181 use their own face identities, not Z0. Region map: scripts/assets/prepare-finishes.mjs.';
 if(n<83&&[7,8,11,12,13,16,18,19,24,28,29,30,31,32,34,35,38,39,41,42].includes(n)){evidence='Maker watch page: blued-steel hands; source blue/neutral face assignments';notes='Blue metal hands/bushings replace dielectric enamel or brass fallback; neutral seats preserved where source mixed. Exact alternative hand variants inferred. '+notes;}
 const regionEvidence=entry?`artifacts/finishing-cad/sidecars/${d.id}.json`:undefined;
 return {id:d.id,name:m.name,status,confidence:status==='verified'?'high for identified visible family/region; authored numerical response':status==='inferred'?'medium/low; no per-surface photographic proof':'low/conflicting',intendedMaterial:families[f.family][0],surfaceReview:notes,evidence,assignment:f,source:{definitionColors:d.directColors,bodies:d.bodies,faceCount:d.faces.length,faceAppearanceGroups:groups(d.faces),faceTypes:Object.fromEntries([...new Set(d.faces.map(x=>x.surfaceType))].map(t=>[t,d.faces.filter(x=>x.surfaceType===t).length])),brepValid:m.brepValid,missingFaces:m.missingTriangulatedFaces,degenerateTriangles:m.degenerateTriangles},annotation:entry?{...entry,regionEvidence}:null};
});
const instances=manifest.instances.filter(i=>!i.isAssembly).map(i=>{
 const def=definitions.find(d=>d.id===i.definitionId),n=Number(i.definitionId.split('_').at(-1)),before=prior(i.name,i.definitionId,i.id),after=current(i.name,i.definitionId,i.id);
 let status=def.status,evidence=def.evidence,notes=def.surfaceReview;
 if([43,44,45].some(x=>i.id===prefix+x)){status='verified';evidence='REF-MAKER-01 perimeter; maker d189 screw render; exact clamp-hole/screw-axis probe';notes='Unblued steel screw secures d185 clamp '+({43:41,44:39,45:38}[i.id.slice(prefix.length)])+'. Neutral head/body. Override only this instance; unrelated d189 unchanged.';}
 if([33,77,78,81,82].some(x=>i.id===prefix+x)){status='verified';evidence='REF-SJX-02 and FIN-SCREW-STEEL-01';}
 if(['11','12'].some(x=>i.id===prefix+'54__0_1_1_194_'+x)){status='verified';evidence='User explicit correction; original radial axes at 16mm radius in main plate';notes='Two outer-rim dial retaining screws: neutral steel across the entire screw. Exact-instance override; default d201 remains blue elsewhere.';}
 if([11,25,48,49,50,51,52,67,68,71,72].some(x=>i.id===prefix+x)){status='verified';evidence='User explicit rear-fitted screw correction; original source local +Z screw axes face world +Z';notes='One of eleven screws fitted from the back: neutral steel across all modeled surfaces. Exact-instance override preserves other uses of shared screw definitions.';}
 if(i.id===prefix+'59__0_1_1_221_7'){status='verified';evidence='User explicit hairspring-stud screw correction; original d226 occurrence in balance-cock assembly';notes='Horizontal hairspring-stud clamping screw uses neutral steel throughout, together with the separate d117 stud. Other d226 screws and the nearby balance-cock mounting screws retain their own assignments.';}
 const changed=before.family!==after.family||before.metalness!==after.metalness;
 const scope=i.id.startsWith(movement)?'movement':'optional catalog';
 return {id:i.id,sourcePath:i.sourceInstanceId,definitionId:i.definitionId,name:i.name,parentId:i.parentId,scope,worldTransform:i.worldTransform,sourceGeometry:{triangles:i.triangles,boundsWorldMm:i.boundsWorldMm},status,confidence:status==='verified'?'high for identity and appearance family; numerical finish unmeasured':status==='inferred'?'medium/low':'low/conflicting',intendedMaterial:after.family==='steel'&&after.assignment==='source-instance'?'Unblued steel':def.intendedMaterial,evidence,surfaceReview:notes,before,after,mismatch:changed?`${before.family} → ${after.family}`:n===225?'Absent assembly geometry; recovered authentic maker STL':def.annotation?'Original source face regions require separate annotation; reviewed annotation now present':'No proven new mismatch; retained interpretation has stated limits',disposition:status==='unresolved'?'Retained pending listed evidence; no correctness claim':changed?'Targeted correction':n===225?'Recovered original maker geometry with original placement':def.annotation?'Retained/corrected with exact source-region annotations':'Retained with confidence stated',annotation:!!def.annotation};
});
if(instances.length!==365||definitions.length!==202||new Set(instances.map(i=>i.id)).size!==365)throw Error('Incomplete audit coverage');
const sourceOccurrences=audit.instances.filter(i=>!i.isAssembly);if(sourceOccurrences.length!==instances.length)throw Error('XCAF occurrence mismatch');
for(const i of instances)if(!sourceOccurrences.some(x=>x.path===i.sourcePath))throw Error('Untraced source '+i.id);
const counts=Object.fromEntries(['verified','inferred','unresolved'].map(s=>[s,instances.filter(i=>i.status===s).length]));
const result={schemaVersion:1,date:'2026-09-09',baseline,sourceSha256:audit.summary.sourceSha256,runtimeAnnotations:{file:surfaces.file,sha256:surfaces.sha256,roles:surfaces.roles,materialSourceSha256:sha(fs.readFileSync(path.join(root,'explorer/src/viewer/materials.ts'))),packagerSourceSha256:sha(fs.readFileSync(path.join(root,'scripts/assets/prepare-finishes.mjs')))},coverage:{leafDefinitions:202,leafInstances:365,movement:instances.filter(i=>i.scope==='movement').length,catalog:instances.filter(i=>i.scope==='optional catalog').length,byStatus:counts,changedFamilyInstances:instances.filter(i=>i.before.family!==i.after.family).length,annotatedDefinitions:definitions.filter(d=>d.annotation).length},meaning:'Verified concerns identified visible material family/region, not all surfaces or measured PBR values. Every retained unobserved assignment remains inferred/unresolved. Source RGB is display evidence, never calibrated material measurement.',definitions,instances};
fs.mkdirSync(path.join(root,'docs/appearance'),{recursive:true});fs.writeFileSync(path.join(root,'docs/appearance/ledger.json'),JSON.stringify(result,null,2)+'\n');
let md='# Complete source-instance appearance ledger\n\nGenerated by `scripts/cad/appearance_ledger.mjs`; detailed per-face identity, before/after assignment, original matrix, evidence and confidence are in [ledger.json](ledger.json).\n\n365 leaves / 202 definitions, including 223 movement and 142 catalog leaves. Verified means visible family/identity, not every physical finish. '+JSON.stringify(counts)+'.\n\nEach row corresponds to one original leaf occurrence. Shared definitions are never collapsed. Unobserved surfaces are explicitly described in the JSON; an assignment is not proof.\n\n| Source instance | Definition / name | Scope | Before → after | Status | Disposition |\n|---|---|---|---|---|---|\n';
for(const i of instances)md+=`| ${i.id} | ${i.definitionId}: ${i.name.replaceAll('|','/')} | ${i.scope} | ${i.before.family} → ${i.after.family} | ${i.status} | ${i.disposition} |\n`;
fs.writeFileSync(path.join(root,'docs/appearance/LEDGER.md'),md);console.log(JSON.stringify({...result.coverage,ledgerSha256:sha(fs.readFileSync(path.join(root,'docs/appearance/ledger.json')))},null,2));
