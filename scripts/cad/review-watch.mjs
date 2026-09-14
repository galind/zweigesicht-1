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
  for(const [id,p]of c.renderParts){assert.equal(p.mesh.geometry,base.get(id).geometry);assert.equal(p.material,base.get(id).material);if(belongs(id,movement)||DIALS.faces.central.structureLeafIds.includes(id))assert.equal(p.material.color.getHex(),base.get(id).color);}
 }
 results.push({check:'case and hand presets retain geometry/material identity and never recolor movement, dial markers, structure or logo; unsupported combinations normalize',status:'pass'});
 const state=JSON.stringify(c.state),history=c.history.length;
 for(const invalid of [{caseVisible:1},{caseMaterial:'brass'},{centralFinish:'gold'},{extra:true},{dialsVisible:false,smallVisible:true},null]){assert.throws(()=>validateWatchPatch(invalid));await assert.rejects(c.configureWatch(invalid));assert.equal(JSON.stringify(c.state),state);assert.equal(c.history.length,history);}
 results.push({check:'configuration APIs reject malformed/unknown/conflicting input before state or history mutation',status:'pass'});
 await c.configureWatch({caseVisible:true,dialsVisible:true});pose();
 const missing=[...CASE_CRYSTALS][0],saved=c.renderParts.get(missing);c.renderParts.delete(missing);pose();assert.equal(c.fittedCase.size,0);assert.equal(c.fitted.size,43);assert.equal(c.caseEffective(),false);c.renderParts.set(missing,saved);pose();assert.equal(c.fittedCase.size,41);
 results.push({check:'incomplete case suppresses every case piece while preserving complete dials; restored geometry reveals one complete case',status:'pass'});
 const {caseDisplayMatrix,CASE_LUGS}=load('explorer/src/viewer/CasePose.ts');
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
