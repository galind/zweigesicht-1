import assert from 'node:assert/strict';
import fs from 'node:fs';
/** Invoked by review-runtime: actual decoded catalog meshes + controller source. */
export async function reviewDials({v, Viewer, THREE, initialState, load, sourceModules, ROOT, parts, results}) {
 const {DIALS,fittedLeaves}=load('explorer/src/experience/dials.ts');
 const {ROOT:movement,belongs}=load('explorer/src/experience/catalog.ts');
 const {DISPLAY_LAYERS,displaySeparationOffsets}=load('explorer/src/experience/explosion.ts');
 const handRecords=JSON.parse(fs.readFileSync(ROOT+'/assets/authored/hand-display-poses.json')).hands;
 const handUp=p=>{
  const hand=handRecords.find(h=>h.leafId===p.source.id);
  if(!hand)return null;
  const delta=new THREE.Vector3().fromArray(hand.tipLandmarkLocalMm).sub(new THREE.Vector3().fromArray(hand.boreLocalMm)).transformDirection(p.mesh.matrix);
  return new THREE.Vector3(delta.x,delta.y,0).normalize();
 };
 const layerOffsets=displaySeparationOffsets(parts);
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
 const pose=()=>{controller.applyPose(1);controller.retargetVisibility();};
 const preferences=()=>[controller.state.centralVisible,controller.state.smallVisible,controller.state.centralStyle,controller.state.smallStyle];
 for(const centralVisible of [false,true]) for(const smallVisible of [false,true]) {
  controller.reset();
  await controller.configureDials({centralVisible,smallVisible,centralStyle:'lance',smallStyle:'pear'});pose();
  const expected=[...fittedLeaves(controller.state)];const prefs=preferences();
  for(const side of ['front','back']) {controller.setSide(side);pose();assert.deepEqual(preferences(),prefs);}
  for(const separation of [0,.2,.7,1,.35,0]) {
   controller.patch({separation});pose();assert.deepEqual(preferences(),prefs);
   for(const id of expected) {const p=controller.renderParts.get(id);assert.ok(p.mesh.visible);assert.equal(p.offset.x,0);assert.equal(p.offset.y,0);}
   for(const face of ['central','small']) {
    const packet=expected.filter(id=>belongs(id,DIALS.faces[face].rootId));
    if(packet.length && separation>0) assert.ok(new Set(packet.map(id=>controller.renderParts.get(id).offset.z)).size>3, 'Display separates into multiple layers');
   }
  }
  assert.equal(controller.assemblyError('presentation'),0);
  controller.allParts();pose();assert.equal(controller.spread.size,216+expected.length);
  assert.equal([...controller.renderParts.values()].filter(p=>p.mesh.visible).length,216+expected.length);
  // Actual transformed boxes must equal packing boxes, including off-axis Lance seconds.
  for(const id of expected) {
   const p=controller.renderParts.get(id),box=p.mesh.geometry.boundingBox.clone().applyMatrix4(p.mesh.matrix);
   assert.ok(box.min.distanceTo(controller.spread.get(id).bounds.min)<1e-8);
   assert.ok(box.max.distanceTo(controller.spread.get(id).bounds.max)<1e-8);
   const sign=belongs(id,DIALS.faces.central.rootId)?1:-1;
   if(p.source.name.startsWith('010-')) {
    assert.ok(new THREE.Vector3(0,0,1).transformDirection(p.mesh.matrix).distanceTo(new THREE.Vector3(0,-1,0))<1e-9,'Fitted screw head above threaded shaft');
    assert.ok(new THREE.Vector3(0,1,0).transformDirection(p.mesh.matrix).distanceTo(new THREE.Vector3(0,0,1))<1e-9,'Fitted screw side profile faces viewer');
   } else {
   assert.ok(new THREE.Vector3(0,0,sign).applyQuaternion(controller.spread.get(id).rotation).distanceTo(new THREE.Vector3(0,0,-1))<1e-9);
   assert.ok((handUp(p)??new THREE.Vector3(0,sign,0).applyQuaternion(controller.spread.get(id).rotation)).distanceTo(new THREE.Vector3(0,-1,0))<1e-9);
   }
   await controller.select(id);pose();assert.equal(controller.state.layout,'spread');
  }
  controller.group(null);pose();assert.equal(controller.assemblyError('presentation'),0);assert.deepEqual(preferences(),prefs);
 }
 results.push({check:'all four visibility combinations preserve styles and side; enabled individual display layers separate/reassemble; all selected leaves face forward/upright and are packed at exact rendered bounds and selectable without leaving All parts',status:'pass'});
 await controller.configureDials({centralVisible:true,smallVisible:true});pose();
 for(const group of ['display','winding','energy','regulation','transmission','shock']) {
  controller.group(group);pose();
  const before=preferences();
  for(const partSpread of [0,.5,1,.2,0]) {controller.patch({partSpread});pose();assert.deepEqual(preferences(),before);}
  if(group==='display') {
   for(const id of controller.fitted) {assert.ok(controller.renderParts.get(id).mesh.visible);assert.equal(controller.renderParts.get(id).offset.length(),0,'Uncover must not lift retained display with barrel bridge');}
   controller.patch({partSpread:1});pose();
   for(const id of controller.fitted) assert.equal(controller.renderParts.get(id).offset.z,(belongs(id,DIALS.faces.central.rootId)?5:-6)+(layerOffsets.get(id)??0));
  }
 }
 controller.group(null);pose();assert.equal(controller.assemblyError('presentation'),0);
 results.push({check:'all six scopes preserve display preferences; Time display Uncover leaves both packets assembled and section separation adds individual layers to +5/-6 mm hosts',status:'pass'});
 // Check actual rendered bounds for every supported pair, with partial/reversed travel.
 for(const central of DIALS.faces.central.styles) for(const small of DIALS.faces.small.styles) {
  controller.group(null);
  await controller.configureDials({centralVisible:true,smallVisible:true,centralStyle:central.id,smallStyle:small.id});
  for(const group of [null,'display']) {
   controller.group(group);
   for(const progress of [1,.25,.8,0,1]) {
    controller.patch(group?{partSpread:progress}:{separation:progress});pose();
    if(progress!==1) continue;
    for(const face of ['central','small']) {
     const sign=face==='central'?1:-1;let edge=-Infinity;
     for(const layer of DISPLAY_LAYERS[face]) {
      const boxes=layer.filter(id=>controller.fitted.has(id)).map(id=>{
       const p=controller.renderParts.get(id);
       return p.mesh.geometry.boundingBox.clone().applyMatrix4(p.mesh.matrix);
      });
      if(!boxes.length)continue;
      const min=Math.min(...boxes.map(b=>sign*(sign===1?b.min.z:b.max.z)));
      assert.ok(min-edge>=.999,'Individual display layers clear actual geometry');
      edge=Math.max(...boxes.map(b=>sign*(sign===1?b.max.z:b.min.z)));
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)
       assert.ok(!boxes[i].intersectsBox(boxes[j]),'Shared marker/screw layer has distinct seats');
     }
    }
   }
   controller.patch({partSpread:0,separation:0,reveal:0});pose();assert.equal(controller.assemblyError('presentation'),0);
  }
  for(const aspect of [1.6,390/680]) {
   controller.camera.aspect=aspect;controller.allParts();pose();
   for(const id of controller.fitted) {
    const p=controller.renderParts.get(id),placement=controller.spread.get(id),sign=belongs(id,DIALS.faces.central.rootId)?1:-1;
    if(!p.source.name.startsWith('010-')) assert.ok(new THREE.Vector3(0,0,sign).applyQuaternion(placement.rotation).distanceTo(new THREE.Vector3(0,0,-1))<1e-9);
    const upright=p.source.name.startsWith('010-')?new THREE.Vector3(0,0,1).transformDirection(p.mesh.matrix):(handUp(p)??new THREE.Vector3(0,sign,0).applyQuaternion(placement.rotation));
    assert.ok(upright.distanceTo(new THREE.Vector3(0,-1,0))<1e-9);
    const actual=p.mesh.geometry.boundingBox.clone().applyMatrix4(p.mesh.matrix);
    assert.ok(actual.min.distanceTo(placement.bounds.min)<1e-8&&actual.max.distanceTo(placement.bounds.max)<1e-8);
    assert.ok(Math.abs(p.mesh.matrix.determinant()-p.assembled.determinant())<1e-9);
   }
   controller.group(null);pose();assert.equal(controller.assemblyError('presentation'),0);
  }
 }
 results.push({check:'all nine style pairs: actual display layers clear by >=0.999 mm in whole/section separation; shared marker/screw seats disjoint; desktop/mobile inventory faces every dial/hand forward and upright with exact packing and rigid reassembly',status:'pass'});
 controller.reduced=false;
 controller.reset();pose();
 for(const layout of ['assembly','spread']) {
  if(layout==='spread')controller.allParts();
  for(const enabled of [true,false,true,false]) {
   await controller.configureDials({centralVisible:enabled,smallVisible:enabled});
   const visible=[...controller.renderParts.values()].filter(p=>p.mesh.visible&&!belongs(p.source.id,movement));
   assert.equal(visible.length,enabled?43:0,'Both complete displays switch in one update');
   assert.ok(visible.every(p=>p.material.opacity===1&&!p.material.transparent&&p.material.depthWrite&&!p.motion),'No leaf fade or stale hidden-pose arrival');
   controller.applyPose(.016);controller.retargetVisibility();
   assert.deepEqual(visible.map(p=>p.source.id).sort(),[...controller.fitted].sort());
  }
 }
 controller.group(null);pose();
 results.push({check:'normal-motion dial visibility toggles show/hide all 43 fitted leaves atomically at authored opacity, with no hidden-pose arrival animation in assembly or inventory',status:'pass'});
 controller.reduced=false;
 await controller.configureDials({centralVisible:false});controller.applyPose(.15);
 await controller.configureDials({centralVisible:true});controller.applyPose(.1);
 controller.patch({separation:1});controller.applyPose(.2);
 controller.allParts();controller.applyPose(.1);controller.group(null);pose();
 assert.equal(controller.assemblyError('presentation'),0);
 assert.ok([...controller.renderParts.values()].every(p=>p.material.opacity===1&&!p.material.transparent&&p.material.depthWrite));
 // Scope restoration owns opacity until it settles; dial style/toggle changes cannot capture temporary flags.
 for(const change of [{centralStyle:'fine'},{centralVisible:false},{smallStyle:'lance'}]) {
  controller.reduced=true;await controller.configureDials({centralVisible:true,smallVisible:true});controller.group('energy');pose();
  controller.reduced=false;controller.group(null);controller.applyPose(.1);
  await controller.configureDials(change);pose();
  assert.ok([...controller.renderParts.values()].every(p=>!p.cutaway&&p.material.opacity===1&&!p.material.transparent&&p.material.depthWrite),'Interrupted section fade must restore original material state');
 }
 const resetPrefs=preferences(),resetSide=controller.state.side;controller.reset();pose();assert.equal(controller.assemblyError('presentation'),0);assert.deepEqual(preferences(),resetPrefs);assert.equal(controller.state.side,resetSide);
 results.push({check:'rapid visibility reversals and interrupted assembly/spread/reassembly clear fades, restore exact fitted poses and material flags; Reset retains fitted preferences',status:'pass'});
 controller.reduced=true;await controller.configureDials({centralVisible:false,smallVisible:false,centralStyle:'fine',smallStyle:'lance'});controller.reset();pose();
 await controller.chooseDial('central',true);pose();assert.equal(controller.state.viewAngle,'face');
 assert.equal(controller.state.side,'front');assert.deepEqual(preferences(),[true,false,'fine','lance']);
 await controller.chooseDial('small',true,'pear');pose();
 assert.equal(controller.state.side,'back');assert.deepEqual(preferences(),[true,true,'fine','pear']);
 await controller.chooseDial('central',false);pose();assert.equal(controller.state.side,'back');
 await controller.chooseDial('central',true,'lance');pose();assert.equal(controller.state.side,'front');assert.equal(controller.state.smallVisible,true);
 controller.patch({separation:1});pose();assert.equal(controller.state.viewAngle,'overview');await controller.chooseDial('small',true);pose();assert.equal(controller.state.separation,1);
 controller.group('display');controller.patch({partSpread:1});pose();await controller.chooseDial('central',true);pose();assert.equal(controller.state.group,'display');assert.equal(controller.state.partSpread,1);
 controller.group('energy');pose();const history=controller.history.length;await controller.chooseDial('central',true);pose();
 assert.equal(controller.state.group,null);assert.equal(controller.state.side,'front');assert.equal(controller.state.smallVisible,true);assert.equal(controller.history.length,history+1);
 const inventoryAssemblySide=controller.state.side;controller.allParts();pose();await controller.select(DIALS.faces.small.structureLeafIds[0]);controller.patch({isolated:true});pose();await controller.chooseDial('central',true,'open-lance');pose();assert.equal(controller.state.isolated,false);assert.equal(controller.state.part,null);assert.equal(controller.state.layout,'spread');assert.equal(controller.state.side,inventoryAssemblySide);assert.equal(controller.state.smallVisible,true);
 const beforeReset=preferences();controller.reset();pose();assert.deepEqual(preferences(),beforeReset);assert.equal(controller.assemblyError('presentation'),0);
 results.push({check:'menu dial/style choices enable and face the selected display, preserve partner/style/separation, leave unrelated scopes, keep inventory and hide camera stable, and save one history entry',status:'pass'});
 let pending=[],loads=0,disposed=0;
 class Loader{setMeshoptDecoder(){return this}loadAsync(){loads++;return new Promise((resolve,reject)=>pending.push({resolve,reject}))}}
 const {MovementViewer:Race}=sourceModules({loader:Loader})('explorer/src/viewer/MovementViewer.ts');
 const makeRace=()=>Object.assign(make(Race),{catalogLoaded:false,ingest(){},disposeObject(){disposed++}});
 let r=makeRace();let a=r.configureDials({centralVisible:true});let b=r.configureDials({smallVisible:true,smallStyle:'pear'});
 assert.equal(loads,1);r.group('display');r.patch({partSpread:.5});r.setSide('front');pending.shift().resolve({scene:{}});await Promise.all([a,b]);
 assert.equal(r.state.centralVisible,true);assert.equal(r.state.smallVisible,true);assert.equal(r.state.side,'front');assert.equal(r.state.smallStyle,'pear');assert.equal(r.state.group,'display');assert.equal(r.state.partSpread,.5);
 r=makeRace();a=r.chooseDial('central',true);assert.equal(r.state.side,'front');b=r.chooseDial('small',true,'pear');assert.equal(r.state.side,'back');r.setSide('front');pending.shift().resolve({scene:{}});await Promise.all([a,b]);assert.equal(r.state.side,'front');assert.deepEqual([r.state.centralVisible,r.state.smallVisible,r.state.smallStyle],[true,true,'pear']);
 r=makeRace();a=r.chooseDial('central',true);r.reset();pending.shift().resolve({scene:{}});await a;assert.equal(r.state.side,'front');assert.equal(r.state.centralVisible,true);assert.equal(r.state.viewAngle,'overview');
 r=makeRace();a=r.showDial('central');r.reset();pending.shift().resolve({scene:{}});await a;assert.equal(r.state.presentation,'dials');assert.equal(r.state.side,'back');assert.equal(r.dialRequest,null);
 r=makeRace();a=r.configureDials({centralVisible:true});await r.configureDials({centralVisible:false});pending.shift().reject(Error('cancelled'));await a;assert.equal(r.dialError,'');assert.ok(!r.detailError);
 r=makeRace();a=r.configureDials({centralVisible:true,smallVisible:true});pending.shift().reject(Error('offline'));await a;assert.equal(r.state.centralVisible,true);assert.ok(r.dialError);assert.equal(r.dialRequest.smallVisible,true);
 r.setSide('front');r.allParts();a=r.retryDials();pending.shift().resolve({scene:{}});await a;assert.equal(r.state.layout,'spread');assert.equal(r.dialError,'');assert.equal(r.state.centralVisible,true);assert.equal(r.state.smallVisible,true);
 r=makeRace();a=r.configureDials({centralVisible:true});r.cameraGeneration++;pending.shift().resolve({scene:{}});await a;assert.equal(r.framings,undefined);
 r=makeRace();a=r.configureDials({centralVisible:true});r.dead=true;pending.shift().resolve({scene:{}});await a;assert.equal(disposed,1);
 // Reset during a genuinely incomplete load retains intent and reuses that load.
 r=makeRace();r.renderParts=new Map(v.renderParts);
 for(const id of DIALS.faces.central.structureLeafIds)r.renderParts.delete(id);
 r.ingest=()=>{r.renderParts=new Map(v.renderParts)};
 const loadsBefore=loads;a=r.chooseDial('central',true,'open-lance');r.patch({separation:1});r.reset();
 assert.equal(loads,loadsBefore+1);assert.equal(r.state.centralVisible,true);assert.equal(r.state.centralStyle,'open-lance');assert.equal(r.state.separation,0);assert.equal(r.state.side,'front');
 pending.shift().resolve({scene:{}});await a;await Promise.resolve();await Promise.resolve();
 assert.equal(r.dialRequest,null);assert.equal(r.dialError,'');assert.equal(r.renderableDials().size,22);
 r=makeRace();r.renderParts=new Map(v.renderParts);for(const id of DIALS.faces.central.structureLeafIds)r.renderParts.delete(id);
 a=r.chooseDial('central',true);r.reset();pending.shift().reject(Error('offline at reset'));await a;await Promise.resolve();await Promise.resolve();assert.equal(r.state.centralVisible,true);assert.ok(r.dialError);
 r.ingest=()=>{r.renderParts=new Map(v.renderParts)};a=r.retryDials();pending.shift().resolve({scene:{}});await a;assert.equal(r.state.centralVisible,true);assert.equal(r.dialError,'');
 results.push({check:'Reset preserves dial intent during incomplete loading; single shared load resolves into assembled current face; failure stays retryable without clearing preferences',status:'pass'});
 // A missing leaf cannot silently report a complete display; a retry can ingest it.
 r=makeRace();r.renderParts=new Map(v.renderParts);const missing=DIALS.faces.central.structureLeafIds[0];const saved=r.renderParts.get(missing);r.renderParts.delete(missing);
 a=r.configureDials({centralVisible:true});pending.shift().resolve({scene:{}});await a;assert.ok(r.dialError);
 a=r.retryDials();r.renderParts.set(missing,saved);pending.shift().resolve({scene:{}});await a;assert.equal(r.dialError,'');
 // Back after failure must reconcile restored preferences with missing geometry.
 r=makeRace();r.renderParts=new Map([...v.renderParts].filter(([id])=>belongs(id,movement)));
 a=r.configureDials({centralVisible:true});pending.shift().reject(Error('offline'));await a;
 await r.configureDials({centralVisible:false});r.back();assert.ok(r.dialRequest);assert.equal(r.state.centralVisible,true);
 const failedBack=r.catalogPending;pending.shift().reject(Error('still offline'));await failedBack.catch(()=>{});await Promise.resolve();assert.ok(r.dialError);
 // Final full-separation packet envelopes clear real rendered movement geometry.
 controller.reduced=true;controller.reset();await controller.configureDials({centralVisible:true,smallVisible:true});controller.patch({separation:1});pose();
 const packetBox=(predicate)=>{const box=new THREE.Box3();for(const p of controller.renderParts.values())if(predicate(p))box.union(p.mesh.geometry.boundingBox.clone().applyMatrix4(p.mesh.matrix));return box;};
 const movementBox=packetBox(p=>belongs(p.source.id,movement));
 const frontBox=packetBox(p=>controller.fitted.has(p.source.id)&&belongs(p.source.id,DIALS.faces.central.rootId));
 const rearBox=packetBox(p=>controller.fitted.has(p.source.id)&&belongs(p.source.id,DIALS.faces.small.rootId));
 assert.ok(frontBox.min.z-movementBox.max.z>=.999);assert.ok(movementBox.min.z-rearBox.max.z>=.999);
 controller.reset();pose();
 results.push({check:'fitted dial packet endpoints clear the actual transformed movement envelope by at least 0.999 mm; no collision-free service-path claim',status:'pass'});
 results.push({check:'actual async controller: single shared load, latest independent intent, navigation during load, reset/hide cancellation, failure/retry in spread, missing-leaf retry, manual camera ownership and disposal',status:'pass'});
 // Verify XCAF-derived checks came from the exact protected STEP.
 assert.equal(fit.sourceSha256,DIALS.source.sha256);
 assert.equal(Object.values(fit.checks).length,50);assert.ok(Object.values(fit.checks).every(Boolean));
}
