import assert from 'node:assert/strict';
import fs from 'node:fs';

/** Actual decoded source geometry; no renderer or fabricated shape fixtures. */
export async function reviewInventory({v: source, Viewer, THREE, initialState, load, parts, results}) {
  const {makeSpreadSlots, forwardRotation}=load('explorer/src/experience/spread.ts');
  const {DIALS}=load('explorer/src/experience/dials.ts');
  const handRecords=JSON.parse(fs.readFileSync(new URL('../../assets/authored/hand-display-poses.json',import.meta.url))).hands;
  const {handDisplayMatrix}=load('explorer/src/viewer/HandDisplayPose.ts');
  const v=Object.assign(Object.create(Viewer.prototype),{
    state:{...initialState,phase:'whole'}, ready:true, parts, renderParts:source.renderParts,
    scene:source.root, spread:new Map(), history:[], fitted:new Set(), inventoryAngle:0,
    reduced:true, camera:new THREE.PerspectiveCamera(33,1.6,.05,2000),
    controls:source.controls, selectionBox:source.selectionBox, catalogLoaded:true,
    emit(){}, invalidate(){}, renderer:{setSize(){}}, host:{clientWidth:1440,clientHeight:736},
  });
  v.controls.object=v.camera;
  v.frameTo=function(target,distance,direction){
    const scale=1/Math.min(1,this.camera.aspect);
    this.camera.up.copy(this.defaultUp());this.camera.position.copy(target).add(direction.clone().normalize().multiplyScalar(distance*scale));
    this.controls.target.copy(target);this.camera.lookAt(target);this.camera.updateMatrixWorld(true);this.travel=null;
  };
  const pose=(dt=1)=>{v.applyPose(dt);v.retargetVisibility();v.scene.updateMatrixWorld(true);};
  const matrices=()=>new Map([...v.spread.keys()].map(id=>[id,v.renderParts.get(id).mesh.matrix.clone()]));
  const center=p=>p.mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(p.mesh.matrix);
  const close=(a,b,label)=>assert.ok(Math.max(...a.elements.map((x,i)=>Math.abs(x-b.elements[i])))<1e-9,label);
  const audit=()=>{const a=v.auditSpread();assert.equal(a.overlaps.length,0,JSON.stringify(a.overlaps));assert.equal(a.clipped.length,0,JSON.stringify(a.clipped));assert.ok(a.maxScaleError<1e-9);};
  const auditHands=()=>{
    for(const hand of handRecords)if(v.fitted.has(hand.leafId)){
      const matrix=v.renderParts.get(hand.leafId).mesh.matrix;
      const direction=new THREE.Vector3().fromArray(hand.tipLandmarkLocalMm).sub(new THREE.Vector3().fromArray(hand.boreLocalMm)).transformDirection(matrix);
      assert.ok(direction.y<-.98,'Every blade stays upright through the full flip: '+hand.leafId);
      if(v.inventoryAngle===0||v.inventoryAngle===Math.PI)assert.ok(Math.abs(direction.x)<1e-8,'Blade points exactly up at each endpoint: '+hand.leafId);
    }
  };
  const configuration=()=>JSON.stringify([v.state.side,v.state.centralVisible,v.state.smallVisible,v.state.centralStyle,v.state.smallStyle,v.state.part]);
  for(const aspect of [1440/788,390/680]) for(const central of DIALS.faces.central.styles) for(const small of DIALS.faces.small.styles){
    v.reset();await v.configureDials({centralVisible:true,smallVisible:true,centralStyle:central.id,smallStyle:small.id});pose();
    v.camera.aspect=aspect;v.camera.updateProjectionMatrix();v.allParts();pose();
    const inputs=[...v.renderParts.values()].map(p=>({...p,assembled:v.fitted.has(p.source.id)?handDisplayMatrix(p.source.id,p.assembled)??p.assembled:p.assembled}));
    const slots=makeSpreadSlots(inputs,aspect,v.fitted), forward=matrices();
    const centers=new Map([...v.spread].map(([id])=>[id,center(v.renderParts.get(id))]));
    for(const p of inputs)if(slots.has(p.source.id)){
      assert.ok(centers.get(p.source.id).distanceTo(slots.get(p.source.id).bounds.getCenter(new THREE.Vector3()))<1e-8,'Packed slot center preserved');
      const swept=v.spread.get(p.source.id).sweptBounds.getSize(new THREE.Vector3());
      const old=slots.get(p.source.id).bounds.getSize(new THREE.Vector3());
      assert.ok(swept.x<=old.x*1.16+1.6+1e-8&&swept.y<=old.y*1.16+1.6+1e-8,'Both endpoints and full turn fit padded slot: '+p.source.id);
      assert.ok(v.spread.get(p.source.id).rotation.equals(forwardRotation(p,v.fitted)));
    }
    audit();auditHands();
    const sample=[...v.spread.keys()][0];await v.select(sample);v.frameSpread();pose();
    const camera=v.camera.matrixWorld.clone(),target=v.controls.target.clone(),prefs=configuration();
    v.reduced=false;v.flipMovement();pose(0);
    for(const [id,m]of forward)close(v.renderParts.get(id).mesh.matrix,m,'No flip-start jump');
    for(let i=0;i<17;i++){
      pose(.05);audit();auditHands();
      for(const [id,c]of centers)assert.ok(center(v.renderParts.get(id)).distanceTo(c)<1e-8,'Fixed presentation center throughout turn');
    }
    pose(.1);
    for(const [id,m]of forward){
      const c=centers.get(id),expected=m.clone().premultiply(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z)).premultiply(new THREE.Matrix4().makeRotationY(Math.PI)).premultiply(new THREE.Matrix4().makeTranslation(c.x,c.y,c.z));
      close(v.renderParts.get(id).mesh.matrix,expected,'Exact half-turn about own center');
    }
    assert.equal(configuration(),prefs);close(v.camera.matrixWorld,camera,'Camera stable');assert.ok(v.controls.target.equals(target));
    v.flipMovement();pose(1);
    for(const [id,m]of forward)assert.ok(v.renderParts.get(id).mesh.matrix.equals(m),'Bit-exact double flip');
    v.flipMovement();pose(.22);const mid=matrices(),angle=v.inventoryAngle;v.flipMovement();pose(0);
    assert.equal(v.inventoryAngle,angle);for(const [id,m]of mid)close(v.renderParts.get(id).mesh.matrix,m,'Reversal starts continuously');
    pose(.14);v.flipMovement();pose(0);pose(.09);v.flipMovement();pose(1);
    for(const [id,m]of forward)assert.ok(v.renderParts.get(id).mesh.matrix.equals(m),'Rapid reversals restore exact baseline');
    v.flipMovement();pose(.25);const departure=matrices();v.group(null);pose(0);
    for(const [id,m]of departure)close(v.renderParts.get(id).mesh.matrix,m,'Exit begins at displayed turned pose');
    pose(1);assert.equal(v.assemblyError('presentation'),0);
    v.reduced=true;
  }
  results.push({check:'all nine style pairs at desktop/mobile aspects: exact packed slot centers, upright hand blades, face poses, 17 swept frames without overlap/clipping, rigid 180-degree endpoints, bit-exact double flip, rapid reversal continuity, stable selection/camera and continuous exact reassembly',status:'pass'});
  for(const side of ['front','back']){
    v.reset();v.setSide(side);pose();v.allParts();pose();assert.equal(v.state.side,side);assert.equal(v.state.inventoryBack,false);
    v.reduced=false;v.flipMovement();pose(.25);const angle=v.inventoryAngle;
    await v.configureDials({centralVisible:false,smallVisible:false});pose(0);assert.equal(v.inventoryAngle,angle);
    await v.configureDials({centralVisible:true,smallVisible:true,centralStyle:'open-lance',smallStyle:'pear'});pose(0);
    assert.equal(v.inventoryAngle,angle);
    for(const id of v.fitted)assert.equal(v.renderParts.get(id).motion,undefined,'New leaves appear in current pose without stale travel');
    // Ready-packet gate and failed/retried catalog geometry while the back is selected.
    pose(1);const id=[...v.fitted][0],leaf=v.renderParts.get(id);v.renderParts.delete(id);
    v.catalogLoaded=false;const loadCatalog=v.loadCatalog;
    v.loadCatalog=async()=>{throw Error('offline fixture');};await v.configureDials();pose();assert.ok(v.dialError);assert.equal(v.state.inventoryBack,true);
    v.loadCatalog=async()=>{v.renderParts.set(id,leaf);v.catalogLoaded=true;};await v.configureDials();pose();assert.equal(v.dialError,'');assert.ok(v.fitted.has(id));audit();
    v.loadCatalog=loadCatalog;
    v.reduced=true;v.host={clientWidth:390,clientHeight:680};v.resize();pose();assert.equal(v.state.inventoryBack,true);assert.equal(v.inventoryAngle,Math.PI);audit();
    v.reset();pose();assert.equal(v.state.side,side);assert.equal(v.state.inventoryBack,false);assert.equal(v.assemblyError('presentation'),0);
    assert.equal(v.state.centralStyle,'open-lance');assert.equal(v.state.smallStyle,'pear');
    v.allParts();pose();assert.equal(v.inventoryAngle,0);v.flipMovement();pose();v.back();pose();assert.equal(v.state.inventoryBack,false);assert.equal(v.inventoryAngle,0);
  }
  results.push({check:'inventory side is independent of assembly side; entry/Back/Reset, immediate visibility/styles, packet readiness, failed catalog/retry and responsive resize retain current orientation with exact reassembly',status:'pass'});
  for(const exit of ['group','reset','back']){
    v.reset();pose();v.reduced=false;
    v.allParts();v.flipMovement();
    if(exit==='group')v.group(null);else if(exit==='reset')v.reset();else {v.back();v.back();}
    pose(1);assert.equal(v.inventoryAngle,0);assert.equal(v.inventoryTravel,undefined);assert.equal(v.assemblyError('presentation'),0);
    v.allParts();pose(1);assert.equal(v.inventoryAngle,0);assert.equal(v.state.inventoryBack,false);
    const displayed=matrices();pose(0);for(const [id,m]of displayed)assert.ok(v.renderParts.get(id).mesh.matrix.equals(m));
  }
  v.reset();pose();v.allParts();pose(.1);v.flipMovement();const entryPose=matrices();pose(0);
  for(const [id,m]of entryPose)close(v.renderParts.get(id).mesh.matrix,m,'Entry flip composes without a jump');
  pose(1);assert.equal(v.inventoryAngle,0,'Entry turn waits for original slots');pose(1);assert.equal(v.inventoryAngle,Math.PI);
  for(const [id,p]of v.spread)assert.ok(center(v.renderParts.get(id)).distanceTo(p.bounds.getCenter(new THREE.Vector3()))<1e-8);
  v.reset();pose();assert.equal(v.assemblyError('presentation'),0);
  results.push({check:'no-frame enter/flip/exit, Reset and Back clear pending turns; flip during entry waits for the original slots then turns continuously and reassembles exactly',status:'pass'});

  v.reduced=true;v.allParts();pose();
  for(const [id,p]of v.renderParts)if(v.spread.has(id)&&p.source.name.startsWith('010-')){
    const head=new THREE.Vector3(0,0,1).transformDirection(p.mesh.matrix);
    assert.ok(head.distanceTo(new THREE.Vector3(0,-1,0))<1e-8,'Every screw head sits above its threaded shaft');
    assert.ok(new THREE.Vector3(0,1,0).transformDirection(p.mesh.matrix).distanceTo(new THREE.Vector3(0,0,1))<1e-8,'Every movement and fitted screw exposes its straight side profile');
  }
  const coupling=[...v.renderParts.values()].find(p=>p.source.definitionId==='d_0_1_1_97');
  assert.ok(new THREE.Vector3(0,0,1).transformDirection(coupling.mesh.matrix).distanceTo(new THREE.Vector3(0,0,-1))<1e-8,'Actual toothed coupling face is not edge-on');
  v.reduced=false;v.flipMovement();pose(.27);const resizeAngle=v.inventoryAngle;
  v.host={clientWidth:1440,clientHeight:788};v.resize();pose(0);assert.equal(v.inventoryAngle,resizeAngle);
  pose(1);audit();assert.equal(v.inventoryAngle,Math.PI);
  const missingId=[...v.fitted][0],missing=v.renderParts.get(missingId);v.renderParts.delete(missingId);v.catalogLoaded=false;
  let arrive;const catalog=v.loadCatalog;v.loadCatalog=()=>new Promise(resolve=>{arrive=()=>{v.renderParts.set(missingId,missing);v.catalogLoaded=true;resolve();};});
  const pending=v.configureDials();v.flipMovement();pose(.21);v.flipMovement();pose(.11);const arrivalAngle=v.inventoryAngle;
  arrive();await pending;pose(0);assert.equal(v.inventoryAngle,arrivalAngle);assert.ok(v.fitted.has(missingId));assert.equal(missing.motion,undefined);
  const baseline=missing.displayMatrix??missing.assembled;
  const placement=v.spread.get(missingId),c=placement.bounds.getCenter(new THREE.Vector3());
  const expected=baseline.clone().premultiply(new THREE.Matrix4().makeTranslation(-missing.center.x,-missing.center.y,-missing.center.z)).premultiply(new THREE.Matrix4().makeRotationFromQuaternion(placement.rotation)).premultiply(new THREE.Matrix4().makeTranslation(missing.center.x+placement.offset.x,missing.center.y+placement.offset.y,missing.center.z+placement.offset.z)).premultiply(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z)).premultiply(new THREE.Matrix4().makeRotationY(arrivalAngle)).premultiply(new THREE.Matrix4().makeTranslation(c.x,c.y,c.z));
  close(missing.mesh.matrix,expected,'Late packet adopts displayed shared angle during reversal');
  v.loadCatalog=catalog;pose(1);v.reset();pose();assert.equal(v.assemblyError('presentation'),0);
  results.push({check:'actual screw/coupling face axes, resize during travel and delayed complete-packet arrival during repeated reversals retain the source-derived current orientation',status:'pass'});

  v.reduced=true;v.allParts();v.flipMovement();pose(0);assert.equal(v.inventoryAngle,Math.PI,'Reduced motion must apply a queued entry flip immediately');v.reset();pose();

}
