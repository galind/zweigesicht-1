/** Independent CPU regression review of the actual viewer source and local CAD assets.
 * Run: node scripts/cad/review-runtime.mjs
 * Requires prepared explorer/public/models assets and installed explorer dependencies.
 * Does not create a browser, WebGL context, server, or generated output.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(import.meta.url);
const ts=require(path.join(ROOT,'explorer/node_modules/typescript'));
const THREE=await import(path.join(ROOT,'explorer/node_modules/three/build/three.module.js'));
const {GLTFLoader}=await import(path.join(ROOT,'explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js'));
const {MeshoptDecoder}=await import(path.join(ROOT,'explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'));
const {OrbitControls}=await import(path.join(ROOT,'explorer/node_modules/three/examples/jsm/controls/OrbitControls.js'));
function sourceModules({loader=GLTFLoader,fetchImpl=globalThis.fetch}={}){
 const cache=new Map();
 return function load(file){
  file=path.resolve(ROOT,file);if(cache.has(file))return cache.get(file);
  const module={exports:{}};cache.set(file,module.exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const localRequire=id=>{
   if(id==='three')return THREE;
   if(id.includes('GLTFLoader'))return {GLTFLoader:loader};
   if(id.startsWith('three/addons/'))return {}; // Constructor-only browser dependencies are unused.
   if(id.startsWith('.')){const p=path.resolve(path.dirname(file),id);return fs.existsSync(p+'.ts')?load(p+'.ts'):require(p)}
   return require(path.join(ROOT,'explorer/node_modules',id));
  };
  vm.runInNewContext(code,{module,exports:module.exports,require:localRequire,console,performance,fetch:fetchImpl},{filename:file});
  cache.set(file,module.exports);return module.exports;
 };
}
const load=sourceModules();
const {MovementViewer:Viewer}=load('explorer/src/viewer/MovementViewer.ts');
const {initialState}=load('explorer/src/experience/state.ts');
const {PlaybackClock}=load('explorer/src/motion/evaluate.ts');
const {PREFIX,belongs}=load('explorer/src/experience/catalog.ts');
const parts=JSON.parse(fs.readFileSync(path.join(ROOT,'explorer/public/models/assembly-manifest.json'))).instances;
const v=Object.create(Viewer.prototype);
Object.assign(v,{parts,root:new THREE.Group(),renderParts:new Map(),state:{...initialState},clock:new PlaybackClock(),selectionBox:new THREE.Box3Helper(new THREE.Box3()),reduced:false,emit(){}});
const assetPaths=JSON.parse(fs.readFileSync(path.join(ROOT,'explorer/public/models/asset-paths.json')));
async function parse(name){
 const url=name==='overview.glb'?assetPaths.overview:assetPaths.catalog;
 assert.ok(/^\/models\/[^/]+\.glb$/.test(url),'Runtime asset must be a local models GLB');
 const b=fs.readFileSync(path.join(ROOT,'explorer/public/models',path.basename(url)));
 return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
}
const results=[];
v.ingest((await parse('overview.glb')).scene);v.retarget();v.applyPose(0);
assert.equal(v.renderParts.size,222);
assert.equal(new Set([...v.renderParts.values()].map(p=>p.mesh.geometry)).size,138);
assert.equal(v.assemblyError(),0);
results.push({check:'overview ingest preserves shared geometry and world placements',status:'pass',renderedParts:222,sharedGeometries:138,assemblyError:0});
v.state.study=true;v.clock.time=.172;v.retarget();v.applyPose(1/60);
assert.equal(v.renderParts.get(PREFIX+'4').mesh.visible,false,'Unanimated upstream meshing wheel must be omitted in timing study');
for(const p of v.renderParts.values())if(['d_0_1_1_112','d_0_1_1_114','d_0_1_1_116'].includes(p.source.definitionId)||belongs(p.source.id,PREFIX+'13'))assert.equal(p.mesh.visible,false);
v.state.study=false;v.retarget();v.applyPose(1/60);assert.equal(v.assemblyError(),0);
results.push({check:'timing omits unresolved contacts/upstream wheel and source return restores exact matrices',status:'pass'});
v.state={...initialState,group:'regulation',reveal:1};v.retarget();
const bridge=[...v.renderParts.values()].find(p=>belongs(p.source.id,PREFIX+'59'));
for(const p of v.renderParts.values())p.offset.copy(p.target);
v.retargetVisibility();assert.equal(bridge.mesh.visible,false);
v.state.reveal=0;v.retarget();
for(let i=0;i<240;i++){v.applyPose(1/60);v.retargetVisibility()}
assert.equal(bridge.mesh.visible,true,'Bridge must return when Uncover returns to zero');assert.equal(v.assemblyError(),0);
results.push({check:'completed reveal reverses visibility and exact assembled placement',status:'pass'});
v.state={...initialState,part:PREFIX+'66'};v.retarget();v.retargetVisibility();
assert.equal(v.renderParts.get(PREFIX+'66').mesh.visible,true);assert.equal(v.renderParts.get(PREFIX+'53').mesh.visible,false);
v.state.part=null;v.retarget();v.retargetVisibility();assert.equal(v.renderParts.get(PREFIX+'66').mesh.visible,false);assert.equal(v.renderParts.get(PREFIX+'53').mesh.visible,true);
results.push({check:'setting-spring alternative is exclusive and default restores on exit',status:'pass'});
const movementObjects=new Map([...v.renderParts].map(([id,p])=>[id,p.mesh]));
v.ingest((await parse('catalog.glb')).scene);assert.equal(v.renderParts.size,364);
for(const [id,mesh]of movementObjects)assert.equal(v.renderParts.get(id).mesh,mesh,'Catalog must not replace existing movement objects');
v.state={...initialState};v.retarget();v.applyPose(0);assert.equal(v.assemblyError(),0);
results.push({check:'catalog adds external leaves without replacing movement objects',status:'pass',totalRenderedParts:v.renderParts.size});
v.camera=new THREE.PerspectiveCamera(33,1,.05,2000);v.camera.position.set(0,0,200);v.controls=new OrbitControls(v.camera,null);v.controls.minDistance=3;v.controls.maxDistance=200;
const casing=parts.find(p=>p.name==='ml01 Gehäuse SS montiert');const low=new THREE.Vector3(...casing.boundsWorldMm[0]),high=new THREE.Vector3(...casing.boundsWorldMm[1]);const distance=low.distanceTo(high)*2.2;
v.frameTo(new THREE.Vector3(),distance,new THREE.Vector3(0,0,1));
for(let i=0;i<240;i++){v.camera.position.lerp(v.travel.position,1-Math.exp(-1/60*6));v.controls.target.lerp(v.travel.target,1-Math.exp(-1/60*6));v.controls.update()}
const travelError=v.camera.position.distanceTo(v.travel.position);assert.ok(travelError<.005,`Case camera never settles: ${travelError}`);assert.ok(v.controls.maxDistance>=distance);assert.ok(v.camera.far>distance);
results.push({check:'case/strap framing converges within active camera limits',status:'pass',requestedDistanceMm:distance,residualMm:travelError});
const savedCase={state:{...initialState},position:v.camera.position.clone(),target:v.controls.target.clone()};
v.frameTo(new THREE.Vector3(),8,new THREE.Vector3(0,0,1),true);v.history=[savedCase];v.back();
for(let i=0;i<240;i++){v.camera.position.lerp(v.travel.position,1-Math.exp(-1/60*6));v.controls.target.lerp(v.travel.target,1-Math.exp(-1/60*6));v.controls.update()}
assert.ok(v.camera.position.distanceTo(v.travel.position)<.005,'Back must restore catalog framing beyond movement camera limits');
results.push({check:'Back restores distant catalog camera after a small-part close-up',status:'pass'});
v.frameTo(new THREE.Vector3(),distance,new THREE.Vector3(0,0,1));v.host={clientWidth:400,clientHeight:1000};v.renderer={setSize(){}};v.ready=true;v.invalidate=()=>{};v.resize();
for(let i=0;i<240;i++){v.camera.position.lerp(v.travel.position,1-Math.exp(-1/60*6));v.controls.target.lerp(v.travel.target,1-Math.exp(-1/60*6));v.controls.update()}
assert.ok(v.camera.position.distanceTo(v.travel.position)<.005,'Portrait resize must keep scaled travel reachable');
results.push({check:'portrait resize preserves reachable catalog framing',status:'pass'});
v.ready=false;v.group('energy');assert.equal(v.state.group,'energy');v.emit();assert.equal(v.state.group,'energy');
results.push({check:'metadata-only mechanism selection persists while viewer is not ready',status:'pass'});

// No DOM was connected in this CPU harness, so OrbitControls has no DOM listeners to dispose.
const pending=[];class DeferredLoader{setMeshoptDecoder(){return this}loadAsync(url,progress){return new Promise((resolve,reject)=>pending.push({resolve,reject,progress}))}}
const loadRace=sourceModules({loader:DeferredLoader,fetchImpl:async()=>({ok:true,json:async()=>({instances:[]})})});const {MovementViewer:RaceViewer}=loadRace('explorer/src/viewer/MovementViewer.ts');const race=Object.create(RaceViewer.prototype);
Object.assign(race,{loadGeneration:0,dead:false,error:'',ready:false,loadStart:performance.now(),paths:{overview:'fixture.glb'},emit(){},ingest(){},homeCamera(){},retarget(){},disposeObject(){}});
const obsolete=race.load(),current=race.load();while(pending.length<2)await Promise.resolve();pending[1].resolve({scene:{}});await current;assert.equal(race.ready,true);assert.equal(race.error,'');pending[0].progress?.({loaded:25,total:100});assert.equal(race.status,'','Obsolete progress must not overwrite completed loading status');pending[0].reject(Error('Obsolete fixture request'));await obsolete;assert.equal(race.error,'','An obsolete failure must not overwrite newer successful state');
results.push({check:'obsolete load progress/failure cannot overwrite newer successful load',status:'pass'});
// Read the actual class-field handler through the TypeScript AST. This is resilient
// to source formatting and does not construct the browser-bound viewer.
const viewerSourcePath=path.join(ROOT,'explorer/src/viewer/MovementViewer.ts');
const viewerSource=ts.createSourceFile(viewerSourcePath,fs.readFileSync(viewerSourcePath,'utf8'),ts.ScriptTarget.Latest,true);
const viewerClass=viewerSource.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='MovementViewer');
const restoreField=viewerClass.members.find(n=>ts.isPropertyDeclaration(n)&&n.name.getText(viewerSource)==='onContextRestored');
assert.ok(restoreField?.initializer,'Context-restore handler must exist');
const restoreModule={exports:{}};
const restoreCode=ts.transpileModule('module.exports=function(){return '+restoreField.initializer.getText(viewerSource)+';};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let oldDisposed=0,roomDisposed=0,generatorDisposed=0,environmentCreated=0,notifications=0;
const oldTexture={id:'lost-context-texture'},replacementTexture={id:'restored-context-texture'},rendererFixture={};
class RoomStub{dispose(){roomDisposed++}}
class PmremStub{
 constructor(renderer){assert.equal(renderer,rendererFixture)}
 fromScene(room,sigma){assert.ok(room instanceof RoomStub);assert.equal(sigma,.04);environmentCreated++;return {texture:replacementTexture,dispose(){}}}
 dispose(){generatorDisposed++}
}
vm.runInNewContext(restoreCode,{module:restoreModule,THREE:{PMREMGenerator:PmremStub},RoomEnvironment:RoomStub});
const restoreFixture={renderer:rendererFixture,environment:{texture:oldTexture,dispose(){oldDisposed++}},scene:{environment:oldTexture,environmentIntensity:.8},contextLost:true,error:'Graphics interruption',needsRender:false,emit(){notifications++}};
restoreModule.exports.call(restoreFixture)();
assert.equal(oldDisposed,1);assert.equal(environmentCreated,1);assert.equal(restoreFixture.environment.texture,replacementTexture);assert.equal(restoreFixture.scene.environment,replacementTexture);assert.notEqual(restoreFixture.scene.environment,oldTexture);assert.equal(restoreFixture.scene.environmentIntensity,.8);assert.equal(roomDisposed,1);assert.equal(generatorDisposed,1);assert.equal(restoreFixture.contextLost,false);assert.equal(restoreFixture.error,'');assert.equal(restoreFixture.needsRender,true);assert.equal(notifications,1);
results.push({check:'context restore replaces environment texture and releases temporary PMREM resources',status:'pass',scope:'actual handler with CPU PMREM/room stubs; not WebGL reflection proof'});
const snapshotFixture=Object.create(Viewer.prototype),benchmarkResult={fixture:'completed benchmark'};
Object.assign(snapshotFixture,{state:{...initialState},ready:true,status:'',error:'',detailError:'',parts:[],history:[],catalogLoaded:true,benchmark:{result:benchmarkResult},stats(){return {}}});
const snapshot=snapshotFixture.snapshot();assert.equal(snapshot.catalogLoaded,true);assert.equal(snapshot.benchmarkResult,benchmarkResult);
snapshotFixture.benchmark=null;assert.equal(snapshotFixture.snapshot().benchmarkResult,undefined);
results.push({check:'snapshot exposes catalog/benchmark values without requiring render-time refs',status:'pass'});
console.log(JSON.stringify({scope:'CPU source/asset regression checks; not browser/WebGL/device QA',results},null,2));
