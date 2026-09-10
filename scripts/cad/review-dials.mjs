import assert from 'node:assert/strict';
import fs from 'node:fs';
/** Invoked by review-runtime: actual decoded catalog meshes + controller source. */
export async function reviewDials({v, Viewer, THREE, initialState, load, sourceModules, ROOT, parts, results}) {
 const {DIALS,fittedLeaves}=load('explorer/src/experience/dials.ts');
 const {ROOT:movement,belongs}=load('explorer/src/experience/catalog.ts');
 const fit=JSON.parse(fs.readFileSync(ROOT+'/artifacts/dial-cad/source-fit.json'));
 const poseAudit=JSON.parse(fs.readFileSync(ROOT+'/artifacts/dial-time/hand-pose-source-review.json'));
 const geometry = new Map([...v.renderParts].map(([id,p])=>[id,{geometry:p.mesh.geometry,matrix:p.assembled.clone()}]));
 const make=(Class=Viewer)=>Object.assign(Object.create(Class.prototype),{
   state:{...initialState,phase:'whole'},ready:true,dead:false,parts,renderParts:v.renderParts,
   spread:v.spread,history:[],selectionBox:new THREE.Box3Helper(new THREE.Box3()),reduced:true,camera:new THREE.PerspectiveCamera(33,1.6,.05,2000),
   controls:{target:new THREE.Vector3(),update(){},maxDistance:200,mouseButtons:{},touches:{}},
   selectionGeneration:0,dialGeneration:0,cameraGeneration:0,catalogLoaded:true,catalogPending:null,
   fitted:new Set(),emit(){},frameDials(){this.framings=(this.framings??0)+1},homeCamera(){},
   frameTo(){},ensureFramingRange(){},paths:{catalog:'fixture-catalog.glb'},
 });
 const controller=make();
 for(const central of DIALS.faces.central.styles) for(const small of DIALS.faces.small.styles){
   await controller.showDial('central','central',central.id);
   await controller.showDial('small','small',small.id);
   for(const face of ['central','small']) {
     await controller.showDial(face);
     controller.applyPose(0);controller.retargetVisibility();
     const external=[...controller.renderParts.values()].filter(p=>p.mesh.visible&&!belongs(p.source.id,movement));
     const count=face==='central'?22:21;
     assert.equal(external.length,count);assert.equal(new Set(external.map(p=>p.source.id)).size,count);
     assert.deepEqual(external.map(p=>p.source.id).sort(),[...fittedLeaves(controller.state)].sort());
     assert.ok(external.every(p=>belongs(p.source.id,DIALS.faces[face].rootId)), 'No opposite-face leaves');
     assert.equal(external.filter(p=>/Sek_Zeiger/.test(p.source.name)).length,face==='central'?1:0);
     const selected=face==='central'?central:small;
     for(const id of selected.supportLeafIds)assert.ok(external.some(p=>p.source.id===id));
     assert.equal(Object.keys(selected.handLeafIds).length,face==='central'?3:2);
     for(const p of controller.renderParts.values()){
       assert.equal(p.mesh.geometry,geometry.get(p.source.id).geometry);
       assert.ok(p.assembled.equals(geometry.get(p.source.id).matrix));
       if (!p.displayMatrix) assert.ok(p.mesh.matrix.equals(p.assembled));
       else {
         const record=poseAudit.records.find(r=>r.leafId===p.source.id);
         assert.ok(record && record.brepValid && record.maximumAxialSeatOverlapMm > .1);
         const bore=fit.occurrences[p.source.id].cylinders.find(c=>Math.abs(c.radiusMm-record.boreRadiusMm)<1e-7);
         const localBore=new THREE.Vector3().fromArray(bore.originWorldMm).applyMatrix4(p.assembled.clone().invert());
         const presentedBore=localBore.clone().applyMatrix4(p.mesh.matrix);
         const [x,y]=DIALS.faces[face].axleWorldXYMm;
         assert.ok(Math.hypot(presentedBore.x-x,presentedBore.y-y)<1e-8, 'Rendered bore on correct arbor');
         const vertices=p.mesh.geometry.getAttribute('position');let farthest=new THREE.Vector3(),radius=-1;
         for(let i=0;i<vertices.count;i++){
           const point=new THREE.Vector3().fromBufferAttribute(vertices,i);
           const r=Math.hypot(point.x-localBore.x,point.y-localBore.y);
           if(r>radius){radius=r;farthest=point;}
         }
         const tip=farthest.applyMatrix4(p.mesh.matrix).sub(presentedBore);
         const angle=Math.atan2(tip.x,tip.y*(face==='central'?1:-1));
         const target=THREE.MathUtils.degToRad({hour:305,minute:60,seconds:0}[record.role]);
         assert.ok(Math.abs(Math.atan2(Math.sin(angle-target),Math.cos(angle-target)))<1e-4,'Actual decoded blade points to 10:10:00');
         for(const i of [2,6,10,14])assert.equal(p.mesh.matrix.elements[i],p.assembled.elements[i],'No source Z change');
         assert.ok(Math.abs(p.mesh.matrix.determinant()-p.assembled.determinant())<1e-12,'Rigid transform without scale');
       }
     }
   }
 }
 results.push({check:'all nine remembered style pairs on each face: exactly 22 central or 21 small leaves, no opposite dial, complete supports, source geometry and matrices unchanged',status:'pass'});
 const prior={...controller.state};const camera=controller.camera.position.clone();const frames=controller.framings;
 await controller.showDial('small','small','lance');assert.equal(controller.framings,frames);assert.ok(camera.equals(controller.camera.position));
 controller.back();assert.equal(controller.state.smallStyle,prior.smallStyle);assert.equal(controller.state.centralStyle,prior.centralStyle);
 const historyCount=controller.history.length;controller.group('energy');assert.equal(controller.history.length,historyCount+1);assert.equal(controller.state.presentation,'movement');controller.back();assert.equal(controller.state.presentation,'dials');
 controller.scrub({separation:.4});assert.equal(controller.state.presentation,'movement');controller.back();assert.equal(controller.state.presentation,'dials');
 controller.allParts();assert.equal(controller.state.presentation,'movement');assert.equal(controller.spread.size,216);controller.back();assert.equal(controller.state.presentation,'dials');
 const raw=DIALS.presentationOverrides[0].leafId;
 await controller.select(raw);assert.equal([...controller.renderParts.values()].filter(p=>p.mesh.visible&&!belongs(p.source.id,movement)).length,1);
 assert.equal(controller.renderParts.get(raw).material.color.getHex(),0x6c2031);assert.equal(controller.renderParts.get(raw).material.transmission,0);
 controller.patch({isolated:true});assert.equal([...controller.renderParts.values()].filter(p=>p.mesh.visible).length,1);
 controller.back();assert.equal([...controller.renderParts.values()].filter(p=>p.mesh.visible&&!belongs(p.source.id,movement)).length,21);
 assert.equal(controller.renderParts.get(raw).material.color.getHex(),0x062e78);assert.equal(controller.renderParts.get(raw).material.transmission,.58);
 await controller.showDial('central','central','lance');controller.applyPose(0);
 const lanceSeconds=DIALS.faces.central.styles.find(s=>s.id==='lance').handLeafIds.seconds;
 const sourceMatrix=controller.renderParts.get(lanceSeconds).assembled.clone();
 assert.ok(!controller.renderParts.get(lanceSeconds).mesh.matrix.equals(sourceMatrix));
 await controller.select(lanceSeconds);controller.applyPose(0);
 assert.ok(controller.renderParts.get(lanceSeconds).mesh.matrix.equals(sourceMatrix),'Raw catalog restores original off-axis seconds');
 controller.back();controller.applyPose(0);
 assert.ok(!controller.renderParts.get(lanceSeconds).mesh.matrix.equals(sourceMatrix));
 assert.equal(controller.assemblyError('presentation'),0);
 results.push({check:'all 15 actual decoded hand tips indicate 10:10:00 around analytic bores; rigid XY correction only, original Z/supports intact; raw Lance seconds and Back restore exact respective poses',status:'pass'});
 controller.reset();controller.applyPose(0);assert.equal(controller.assemblyError(),0);assert.equal(controller.state.presentation,'movement');assert.equal(controller.state.centralStyle,'fine');assert.equal(controller.state.smallStyle,'lance');
 controller.controls._quat=new THREE.Quaternion();controller.controls._quatInverse=new THREE.Quaternion();
 for(const up of [new THREE.Vector3(0,1,0),new THREE.Vector3(1,0,0),new THREE.Vector3(0,-1,0)]){
   controller.camera.up.copy(up);controller.syncOrbitUp();
   assert.ok(up.clone().applyQuaternion(controller.controls._quat).distanceTo(new THREE.Vector3(0,1,0))<1e-12);
   assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(controller.controls._quatInverse).distanceTo(up)<1e-12);
 }
 results.push({check:'style changes retain camera; Back restores dials after section/separation/spread/raw isolation; exact blue override reverts to raw red; Reset defaults',status:'pass'});
 controller.reduced=false;
 await controller.showDial('central');controller.applyPose(1);controller.retargetVisibility();
 const outgoing=[...controller.fitted];
 const fittedMatrices=new Map(outgoing.map(id=>[id,controller.renderParts.get(id).mesh.matrix.clone()]));
 await controller.showDial('small');controller.applyPose(0);controller.retargetVisibility();
 for(const id of outgoing){const p=controller.renderParts.get(id);assert.ok(p.mesh.visible);assert.equal(p.material.opacity,1);assert.ok(p.mesh.matrix.equals(fittedMatrices.get(id)),'Outgoing hands keep their 10:10 pose');}
 controller.applyPose(.21);controller.retargetVisibility();
 for(const id of outgoing)assert.ok(Math.abs(controller.renderParts.get(id).material.opacity-.5)<1e-12);
 const halfOpacity=controller.renderParts.get(outgoing[0]).material.opacity;
 await controller.showDial('central');controller.applyPose(0);
 assert.equal(controller.renderParts.get(outgoing[0]).material.opacity,halfOpacity,'Rapid reversal continues from displayed opacity');
 controller.travel=null;
 controller.applyPose(1);controller.retargetVisibility();
 assert.ok([...controller.renderParts.values()].every(p=>!p.dialFade&&p.material.opacity===1&&!p.material.transparent&&p.material.depthWrite));
 await controller.showDial('small');controller.applyPose(.1);controller.allParts();controller.applyPose(1);controller.retargetVisibility();
 assert.ok([...controller.renderParts.values()].every(p=>!p.dialFade&&!p.mesh.userData.dialFading&&p.material.opacity===1&&!p.material.transparent&&p.material.depthWrite));
 assert.equal([...controller.renderParts.values()].filter(p=>p.mesh.visible).length,216);
 controller.reduced=true;await controller.showDial('central');controller.applyPose(0);controller.retargetVisibility();
 assert.ok([...controller.renderParts.values()].every(p=>!p.dialFade));
 controller.reset();controller.applyPose(0);controller.retargetVisibility();
 results.push({check:'dial fade keeps outgoing 10:10 matrices, interpolates opacity, reverses continuously, completes without camera travel and clears for inventory/reduced motion',status:'pass'});
 let pending=[],loads=0,disposed=0;
 class Loader{setMeshoptDecoder(){return this}loadAsync(){loads++;return new Promise((resolve,reject)=>pending.push({resolve,reject}))}}
 const {MovementViewer:Race}=sourceModules({loader:Loader})('explorer/src/viewer/MovementViewer.ts');
 const makeRace=()=>Object.assign(make(Race),{catalogLoaded:false,ingest(){},disposeObject(){disposed++}});
 let r=makeRace();let a=r.showDial('central');let b=r.showDial('small','small','pear');
 assert.equal(r.state.presentation,'movement');assert.equal(loads,1);pending.shift().resolve({scene:{}});await Promise.all([a,b]);
 assert.equal(r.state.presentation,'dials');assert.equal(r.state.side,'back');assert.equal(r.state.smallStyle,'pear');
 r=makeRace();a=r.showDial('central');r.reset();pending.shift().resolve({scene:{}});await a;assert.equal(r.state.presentation,'movement');assert.equal(r.dialRequest,null);
 r=makeRace();a=r.showDial('central');await r.showDial('movement');pending.shift().reject(Error('cancelled'));await a;assert.equal(r.dialError,'');assert.ok(!r.detailError);
 r=makeRace();a=r.showDial('central');pending.shift().reject(Error('offline'));await a;assert.equal(r.state.presentation,'movement');assert.ok(r.dialError);assert.equal(r.dialRequest.view,'central');
 a=r.showDial('small','small','broad-lance');pending.shift().resolve({scene:{}});await a;assert.equal(r.state.side,'back');assert.equal(r.state.smallStyle,'broad-lance');assert.equal(r.dialError,'');
 r=makeRace();a=r.showDial('central');pending.shift().reject(Error('offline'));await a;b=r.retryDials();pending.shift().resolve({scene:{}});await b;assert.equal(r.state.side,'front');assert.equal(r.dialError,'');
 r=makeRace();a=r.showDial('central');r.patch({quality:'low',treatment:'function'});pending.shift().resolve({scene:{}});await a;assert.equal(r.state.presentation,'dials');assert.equal(r.state.quality,'low');assert.equal('treatment' in r.state,false);
 r=makeRace();a=r.showDial('central');r.cameraGeneration++;pending.shift().resolve({scene:{}});await a;assert.equal(r.framings,undefined,'Manual camera input during load owns camera');
 r=makeRace();a=r.showDial('central');r.dead=true;pending.shift().resolve({scene:{}});await a;assert.equal(disposed,1);assert.equal(r.state.presentation,'movement');
 r=makeRace();a=r.showDial('central');b=r.select(raw);pending.shift().resolve({scene:{}});await Promise.all([a,b]);assert.equal(r.state.part,raw);assert.equal(r.state.presentation,'movement');
 r=makeRace();a=r.select(raw);b=r.showDial('small');pending.shift().resolve({scene:{}});await Promise.all([a,b]);assert.equal(r.state.part,null);assert.equal(r.state.presentation,'dials');
 results.push({check:'actual async controller: shared single catalog request, latest face/style wins, reset/movement cancellation, failure/retry/new intent, manual takeover, disposal, competing raw selection',status:'pass'});
 // Verify XCAF-derived checks came from the exact protected STEP.
 assert.equal(fit.sourceSha256,DIALS.source.sha256);
 assert.equal(Object.values(fit.checks).length,50);assert.ok(Object.values(fit.checks).every(Boolean));
}
