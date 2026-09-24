import assert from 'node:assert/strict';
import fs from 'node:fs';
export async function reviewWatch({v,Viewer,THREE,initialState,load,sourceModules,ROOT,parts,results,modelFetch,caseFixtureScene,parse}) {
 const {WATCH,CASE_LEAVES,CASE_CRYSTALS,validateWatchPatch}=load('explorer/src/experience/watch.ts');
 const {DIALS}=load('explorer/src/experience/dials.ts');
 const {ROOT:movement,belongs}=load('explorer/src/experience/catalog.ts');
 assert.equal(CASE_LEAVES.size,41);assert.equal(CASE_CRYSTALS.size,2);
 for(const record of WATCH.leaves){const source=parts.find(p=>p.id===record.id);assert.ok(source&&!source.isAssembly);assert.deepEqual(JSON.parse(JSON.stringify(record.worldTransform)),source.worldTransform);assert.ok(!/Leder|Schliesse/.test(source.name));}
 results.push({check:'41 fitted case leaves retain exact occurrence matrices; two opposite crystal occurrences; leather/buckles/reversed alternatives excluded',status:'pass'});
 const c=Object.assign(Object.create(Viewer.prototype),{state:{...initialState,phase:'whole'},ready:true,dead:false,parts,renderParts:v.renderParts,spread:v.spread,history:[],selectionBox:new THREE.Box3Helper(new THREE.Box3()),reduced:true,camera:new THREE.PerspectiveCamera(33,1.6,.05,2000),controls:{target:new THREE.Vector3(),update(){},mouseButtons:{},touches:{}},selectionGeneration:0,dialGeneration:0,cameraGeneration:0,catalogLoaded:true,catalogPending:null,fitted:new Set(),emit(){},homeCamera(){},ensureFramingRange(){}});
 const pose=()=>{c.retarget();c.applyPose(10);c.retargetVisibility();};
 c.state={...initialState};pose();
 const base=new Map([...c.renderParts].map(([id,p])=>[id,{color:p.material.color.getHex(),geometry:p.mesh.geometry,material:p.material}]));
 for(const material of WATCH.caseMaterials) for(const caseVisible of [false,true]) for(const dialsVisible of [false,true]) for(const shape of DIALS.faces.central.styles){
  await c.configureWatch({caseVisible,caseMaterial:material.id,dialsVisible,centralStyle:shape.id,centralFinish:'rose-gold'});pose();
  assert.equal(c.fittedCase.size,caseVisible?41:0);assert.equal(c.state.centralFinish,shape.id==='fine'&&material.id!=='steel'?'rose-gold':'blued-steel');
  const bushings=DIALS.faces.central.styles[0].supportLeafIds;
  for(const id of bushings){const p=c.renderParts.get(id);assert.match(p.source.name,/Zeigerbuchse/);assert.equal(p.material.color.getHex(),dialsVisible&&shape.id==='fine'&&material.id!=='steel'?0xd9ab94:base.get(id).color);}
  const gold=dialsVisible&&shape.id==='fine'&&material.id!=='steel';
  for(const id of DIALS.faces.central.styles[0].leafIds){const p=c.renderParts.get(id);if(gold){assert.equal(p.material.roughness,.075);assert.equal(p.material.metalness,1);assert.equal(p.material.userData.configurationOverride.value,1);}}
  for(const r of WATCH.leaves.filter(p=>['d_0_1_1_53','d_0_1_1_55'].includes(p.definitionId))){assert.equal(c.renderParts.get(r.id).material.color.getHex(),caseVisible?new THREE.Color(material.color).getHex():base.get(r.id).color);}
  for(const [id,p]of c.renderParts){assert.equal(p.mesh.geometry,base.get(id).geometry);assert.equal(p.material,base.get(id).material);if(belongs(id,movement)||DIALS.faces.central.structureLeafIds.includes(id))assert.equal(p.material.color.getHex(),base.get(id).color);}
 }
 results.push({check:'case and hand presets retain geometry/material identity and never recolor movement, dial markers, structure or logo; unsupported combinations normalize',status:'pass'});
 const state=JSON.stringify(c.state),history=c.history.length;
 for(const invalid of [{caseVisible:1},{caseMaterial:'brass'},{centralFinish:'gold'},{extra:true},{dialsVisible:false,smallVisible:true},null]){assert.throws(()=>validateWatchPatch(invalid));await assert.rejects(c.configureWatch(invalid));assert.equal(JSON.stringify(c.state),state);assert.equal(c.history.length,history);}
 results.push({check:'configuration APIs reject malformed/unknown/conflicting input before state or history mutation',status:'pass'});
 await c.configureWatch({caseVisible:true,dialsVisible:true});pose();
 const missing=[...CASE_CRYSTALS][0],saved=c.renderParts.get(missing);c.renderParts.delete(missing);pose();assert.equal(c.fittedCase.size,0);assert.equal(c.fitted.size,43);assert.equal(c.caseEffective(),false);c.renderParts.set(missing,saved);pose();assert.equal(c.fittedCase.size,41);
 results.push({check:'incomplete case suppresses every case piece while preserving complete dials; restored geometry reveals one complete case',status:'pass'});
 const {caseDisplayMatrix,caseFlipPhase,CASE_PIVOT,CASE_LUGS,CASE_LOCKING_PINS}=load('explorer/src/viewer/CasePose.ts');
 for(const record of WATCH.leaves.filter(p=>p.oppositeWorldTransform)) {
  const alternate=parts.find(p=>p.id===record.oppositeSourceId);
  assert.equal(alternate.definitionId,record.definitionId);
  assert.deepEqual(JSON.parse(JSON.stringify(record.oppositeWorldTransform)),alternate.worldTransform);
 }
 for(const side of ['front','back']){
  c.state={...c.state,side};pose();
  for(const id of CASE_LUGS){const p=c.renderParts.get(id);assert.ok(p.mesh.matrix.equals(caseDisplayMatrix(id,p.assembled,side==='back'?1:0)));}
 }
 c.reduced=false;c.state={...c.state,side:'front'};c.retarget();c.applyPose(.2);
 const id=[...CASE_LUGS][0],p=c.renderParts.get(id),intermediate=p.mesh.matrix.clone();assert.ok(c.caseTurn>0&&c.caseTurn<1);
 c.state={...c.state,side:'back'};c.retarget();c.applyPose(0);assert.ok(p.mesh.matrix.equals(intermediate));c.applyPose(2);assert.equal(c.caseTravel,undefined);assert.equal(c.caseTurn,1);
 c.reduced=true;
 c.state={...c.state,part:id};pose();assert.equal(c.caseEffective(),true);assert.equal(c.fittedCase.size,41);assert.ok([...CASE_LEAVES].every(id=>c.renderParts.get(id).mesh.visible));
 c.state={...c.state,part:null};pose();
 results.push({check:'opposite lug matrices match all 18 alternate source occurrences; reduced-motion endpoints and interrupted flip stay continuous; fitted selection retains complete case',status:'pass'});
 assert.equal(CASE_LOCKING_PINS.size,4);
 for(const id of CASE_LOCKING_PINS){const p=c.renderParts.get(id);assert.equal(p.source.definitionId,'d_0_1_1_72');
  const original=p.assembled.clone();
  for(const endpoint of [0,1])assert.ok(caseDisplayMatrix(id,p.assembled,endpoint).equals(original));
  const middle=caseDisplayMatrix(id,p.assembled,.5);assert.ok(middle.equals(original));assert.ok(p.assembled.equals(original));
 }
 c.reduced=false;c.state={...c.state,side:'front'};c.retarget();c.applyPose(.2);
 const movingPins=new Map([...CASE_LOCKING_PINS].map(id=>[id,c.renderParts.get(id).mesh.matrix.clone()]));
 for(const [id,matrix]of movingPins)assert.ok(matrix.equals(c.renderParts.get(id).assembled));
 c.state={...c.state,side:'back'};c.retarget();c.applyPose(0);
 for(const [id,matrix]of movingPins)assert.ok(matrix.equals(c.renderParts.get(id).mesh.matrix));
 c.applyPose(2);for(const id of CASE_LOCKING_PINS)assert.ok(c.renderParts.get(id).mesh.matrix.equals(c.renderParts.get(id).assembled));
 c.reduced=true;

 // Independently verify the physical viewing frame: lugs translate without
 // rotating, while a case point rotates about the crown/X axis.
 for(const q of [0,.1,.22,.35,.5,.65,.78,.9,1]) {
  const phase=caseFlipPhase(q);
  const view=new THREE.Matrix4().makeTranslation(0,0,CASE_PIVOT.z)
   .multiply(new THREE.Matrix4().makeRotationX(phase.angle))
   .multiply(new THREE.Matrix4().makeTranslation(0,0,-CASE_PIVOT.z));
  for(const record of WATCH.leaves.filter(p=>p.oppositeWorldTransform)) {
   const assembled=c.renderParts.get(record.id).assembled;
   const displayed=view.clone().multiply(caseDisplayMatrix(record.id,assembled,q));
   const expected=assembled.clone();expected.elements[13]+=(record.packet==='upper-lugs'?1:-1)*caseFlipPhase(q,record.packet==='upper-lugs'?1:-1).clearance;
   assert.ok(displayed.elements.every((n,i)=>Math.abs(n-expected.elements[i])<1e-8));
  }
 }
 assert.equal(caseFlipPhase(.24).angle,0);assert.equal(caseFlipPhase(.76).angle,Math.PI);
 assert.equal(caseFlipPhase(.5).clearance,WATCH.lugPresentation.clearanceMm);
 for(const caseVisible of [false,true]) for(const interruptedAt of [.2,.65,.95,1.4]) {
  c.reduced=true;c.state={...initialState,caseVisible};pose();
  c.camera.position.set(0,0,-90);c.camera.up.set(0,-1,0);c.controls.target.set(0,0,CASE_PIVOT.z);
  c.reduced=false;c.setSide('front');c.applyPose(interruptedAt);
  const camera=c.camera.position.clone(),up=c.camera.up.clone(),matrices=new Map([...CASE_LUGS].map(id=>[id,c.renderParts.get(id).mesh.matrix.clone()]));
  c.setSide('back');c.applyPose(0);assert.ok(c.camera.position.distanceTo(camera)<1e-10);assert.ok(c.camera.up.distanceTo(up)<1e-10);
  for(const[id,m]of matrices)assert.ok(c.renderParts.get(id).mesh.matrix.equals(m));
  c.applyPose(2);assert.equal(c.caseTurn,1);assert.ok(c.camera.position.distanceTo(new THREE.Vector3(0,0,-90))<1e-8);
  c.setSide('front');c.applyPose(.7);c.reduced=true;c.retarget();c.applyPose(0);
  assert.equal(c.caseTurn,0);assert.equal(c.caseTravel,undefined);assert.equal(c.faceCamera,undefined);
  assert.ok(Math.abs(c.camera.position.x)<1e-9);assert.ok(c.camera.up.distanceTo(new THREE.Vector3(0,1,0))<1e-8);
 }
 results.push({check:'CAD X flip leaves all 18 lug orientations fixed in observer frame; withdrawal precedes turn and reseating follows; both case visibility states reverse continuously in all three phases and reduced motion snaps camera and parts together',status:'pass'});

 // Hidden-case turns spend the full clock rotating, with no attachment hold.
 for(const hz of [30,60,120]) for(const side of ['front','back']) {
  c.reduced=true;c.state={...initialState,caseVisible:false,side:side==='front'?'back':'front'};pose();
  c.camera.position.set(0,0,side==='front'?-90:90);c.camera.up.set(0,side==='front'?-1:1,0);c.controls.target.copy(CASE_PIVOT);
  const before=c.camera.up.clone();c.reduced=false;c.setSide(side);
  assert.equal(c.caseTravel.rotationOnly,true);c.applyPose(1/hz);
  assert.ok(c.camera.up.distanceTo(before)>1e-6,'Hidden case must rotate on its first frame');
  let previous=caseFlipPhase(c.caseTurn).angle;
  for(let n=1;n<Math.ceil(.85*hz);n++) {
   c.applyPose(1/hz);const angle=caseFlipPhase(c.caseTurn).angle;
   assert.ok(side==='front'?angle<=previous+1e-12:angle>=previous-1e-12,'Bare flip stays monotonic');previous=angle;
  }
  c.applyPose(1e-9);assert.equal(c.caseTravel,undefined);assert.equal(c.faceCamera,undefined);
  assert.equal(c.caseTurn,side==='front'?0:1);
  assert.ok(c.camera.up.distanceTo(new THREE.Vector3(0,side==='front'?1:-1,0))<1e-8);
 }
 results.push({check:'hidden case rotates on the first frame, monotonically settles in 850 ms and reaches exact endpoints on both faces at 30/60/120 Hz',status:'pass'});
 for(const caseVisible of [false,true]) {
  c.reduced=true;c.state={...initialState,caseVisible};pose();
  c.camera.position.set(0,0,-90);c.camera.up.set(0,-1,0);c.controls.target.copy(CASE_PIVOT);
  c.reduced=false;c.setSide('front');c.applyPose(.2);
  assert.equal(c.caseTravel.rotationOnly,!caseVisible);
  if(caseVisible)assert.ok(c.camera.up.equals(new THREE.Vector3(0,-1,0)),'Visible case retains withdrawal hold');
  const before=c.camera.up.clone();await c.configureWatch({caseVisible:!caseVisible});c.applyPose(0);
  assert.ok(c.camera.up.distanceTo(before)<1e-10,'Visibility change cannot jump the camera');
  assert.equal(c.caseTravel.rotationOnly,!caseVisible,'An active turn retains its timing');
  c.setSide('back');c.applyPose(0);assert.ok(c.camera.up.distanceTo(before)<1e-10,'Reversing after a visibility change cannot jump');
  assert.equal(c.caseTravel.rotationOnly,caseVisible,'The next turn uses current effective visibility');
  c.applyPose(2);assert.equal(c.caseTurn,1);assert.ok(c.camera.up.distanceTo(new THREE.Vector3(0,-1,0))<1e-8);
 }
 c.reduced=true;c.state={...initialState,caseVisible:true,group:'energy',phase:'mechanism'};pose();
 assert.equal(c.caseEffective(),false);c.reduced=false;c.setSide('front');assert.equal(c.caseTravel.rotationOnly,true);c.applyPose(2);
 results.push({check:'visible case retains attachment timing; mid-turn visibility changes and reversals preserve camera continuity; Focus-hidden case skips attachment phases',status:'pass'});

 c.reduced=true;c.state={...initialState,caseVisible:true};pose();
 c.reduced=false;c.setSide('front');c.applyPose(.8);assert.ok(c.faceCamera);
 c.back();assert.equal(c.faceCamera,undefined);assert.equal(c.faceFitPending,false);
 assert.equal(c.state.side,'back');c.applyPose(2);c.travel=null;c.reduced=true;
 results.push({check:'History during turnover restores saved intent and cancels the superseded observer frame',status:'pass'});
 const seconds=c.renderParts.get(DIALS.faces.central.styles[0].handLeafIds.seconds);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};seconds.material.onBeforeCompile(shader,{});
 assert.ok(shader.fragmentShader.indexOf('diffuseColor.rgb=diffuse;')>shader.fragmentShader.indexOf('diffuseColor.rgb=vec3(.546,.584,.631)'));
 assert.ok(shader.fragmentShader.includes('configurationOverride>.5) roughnessFactor=roughness'));
 results.push({check:'gold packet overrides source-white surfaces and polish; fitted lug bars match case; four unresolved locking pins remain seated in the case throughout the turn',status:'pass'});
 const geometries=new Set([...c.renderParts.values()].map(p=>p.mesh.geometry));
 const recovery=sourceModules({fetchImpl:modelFetch})('explorer/src/viewer/CaseRecovery.ts');const patch=await recovery.loadCaseRecovery();
 const scene=(await parse('catalog.glb')).scene;const original=[];scene.traverse(n=>{if(n.isMesh&&n.material.name==='d_0_1_1_54')original.push(n)});
 assert.equal(original.length,4);const old=original[0].geometry;const positions=Array.from(old.attributes.position.array);let disposals=0;old.addEventListener('dispose',()=>disposals++);
 recovery.recoverCaseSurfaces(scene,patch);assert.equal(disposals,1);assert.equal(new Set(original.map(n=>n.geometry)).size,1);assert.equal(original[0].geometry.index.count,11540*3);assert.deepEqual(Array.from(original[0].geometry.attributes.position.array).slice(0,positions.length),positions);assert.ok(!geometries.has(original[0].geometry));
 for(const n of original){assert.ok(n.geometry.attributes.normal.array.every(Number.isFinite));}
 c.disposeObject(scene);
 const corrupt=sourceModules({fetchImpl:async()=>({ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer})})('explorer/src/viewer/CaseRecovery.ts');await assert.rejects(corrupt.loadCaseRecovery(),/hash mismatch/);
 results.push({check:'d54 recovery hash validates; 34 triangles append without altering original vertices; four occurrences share one replacement; original freed once; corrupt recovery rejected',status:'pass'});
 let pending=[],loads=0,disposed=0;
 class Deferred{setMeshoptDecoder(){return this}loadAsync(){loads++;return new Promise((resolve,reject)=>pending.push({resolve,reject}));}}
 const {MovementViewer:Race}=sourceModules({loader:Deferred,fetchImpl:modelFetch})('explorer/src/viewer/MovementViewer.ts');
 const race=()=>Object.assign(Object.create(Race.prototype),c,{state:{...initialState,phase:'whole'},history:[],catalogLoaded:false,catalogPending:null,paths:{catalog:'fixture-catalog.glb'},renderParts:new Map(v.renderParts),ingest(){},disposeObject(){disposed++},retarget(){},fitPresentation(){},emit(){}});
 let r=race();let a=r.configureWatch({caseVisible:true});let b=r.configureWatch({caseMaterial:'rose-gold',centralFinish:'rose-gold'});assert.equal(loads,1);await r.configureWatch({caseVisible:false,caseMaterial:'platinum'});pending.shift().resolve({scene:caseFixtureScene()});await Promise.all([a,b]);assert.equal(r.state.caseVisible,false);assert.equal(r.state.caseMaterial,'platinum');assert.equal(r.caseError,'');
 r=race();a=r.configureWatch({caseVisible:true});pending.shift().reject(new Error('offline'));await a;assert.ok(r.caseError);assert.ok(r.state.caseVisible);assert.equal(r.state.dialsVisible,false);a=r.retryDials();pending.shift().resolve({scene:caseFixtureScene()});await a;assert.equal(r.caseError,'');
 r=race();a=r.configureWatch({caseVisible:true});r.dead=true;pending.shift().resolve({scene:caseFixtureScene()});await a;assert.equal(disposed,1);
 results.push({check:'case/dial catalog requests coalesce; late completion retains latest visibility/material; failure/retry retains intent; unmount frees late geometry',status:'pass'});
 c.state={...initialState};pose();
}
