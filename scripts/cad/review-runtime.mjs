/** Independent CPU regression review of the actual viewer source and local CAD assets.
 * Run: node scripts/cad/review-runtime.mjs
 * Requires prepared explorer/public/models assets and installed explorer dependencies.
 * Does not create a browser, WebGL context, server, or generated output.
 */
import assert from 'node:assert/strict';
import {createHash, webcrypto} from 'node:crypto';
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
const {SSAOPass}=await import(path.join(ROOT,'explorer/node_modules/three/examples/jsm/postprocessing/SSAOPass.js'));
function sourceModules({loader=GLTFLoader,fetchImpl=globalThis.fetch}={}){
 const cache=new Map();
 return function load(file){
  file=path.resolve(ROOT,file);if(cache.has(file))return cache.get(file);
  const module={exports:{}};cache.set(file,module.exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const localRequire=id=>{
   if(id==='three')return THREE;
   if(id.includes('GLTFLoader'))return {GLTFLoader:loader};
   if(id.includes('SSAOPass'))return {SSAOPass};
   if(id.startsWith('three/addons/'))return {}; // Constructor-only browser dependencies are unused.
   if(id.startsWith('.')){const p=path.resolve(path.dirname(file),id);return fs.existsSync(p+'.ts')?load(p+'.ts'):require(p)}
   return require(path.join(ROOT,'explorer/node_modules',id));
  };
  vm.runInNewContext(code,{module,exports:module.exports,require:localRequire,console,performance,crypto:webcrypto,Float32Array,Uint8Array,URLSearchParams,location:{search:''},fetch:fetchImpl},{filename:file});
  cache.set(file,module.exports);return module.exports;
 };
}
const load=sourceModules();
const {MovementViewer:Viewer}=load('explorer/src/viewer/MovementViewer.ts');
const {initialState}=load('explorer/src/experience/state.ts');
const {PREFIX,belongs}=load('explorer/src/experience/catalog.ts');
const parts=JSON.parse(fs.readFileSync(path.join(ROOT,'explorer/public/models/assembly-manifest.json'))).instances;
const v=Object.create(Viewer.prototype);
Object.assign(v,{parts,root:new THREE.Group(),renderParts:new Map(),state:{...initialState},selectionBox:new THREE.Box3Helper(new THREE.Box3()),reduced:false,emit(){}});
const assetPaths=JSON.parse(fs.readFileSync(path.join(ROOT,'explorer/public/models/asset-paths.json')));
async function parse(name){
 const url=name==='overview.glb'?assetPaths.overview:assetPaths.catalog;
 assert.ok(/^\/models\/[^/]+\.glb$/.test(url),'Runtime asset must be a local models GLB');
 const b=fs.readFileSync(path.join(ROOT,'explorer/public/models',path.basename(url)));
 return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
}
const results=[];
const modelsDir=path.join(ROOT,'explorer/public/models');
const sidecarManifest=JSON.parse(fs.readFileSync(path.join(modelsDir,'finish-surfaces.json')));
const sidecarReport=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/finishing-cad/runtime-sidecar-report.json')));
async function modelFetch(url){
 assert.ok(/^\/models\/[^/]+$/.test(url),'Fixture must read only the prepared models directory');
 const bytes=fs.readFileSync(path.join(modelsDir,path.basename(url)));
 return {ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
}
const surfaceModule=sourceModules({fetchImpl:modelFetch})('explorer/src/viewer/SourceSurfaces.ts');
v.sourceSurfaces=await surfaceModule.loadSourceSurfaces(assetPaths.overview);
assert.equal(v.sourceSurfaces.size,sidecarReport.definitions.length);
assert.ok(v.sourceSurfaces.size>0);
for(const entry of sidecarReport.definitions){
 const data=v.sourceSurfaces.get(entry.definitionId);
 assert.equal(data.length,entry.vertexCount*4);
 const roles={};
 for(let i=0;i<data.length;i+=4){
  assert.ok(Number.isFinite(data[i])&&Number.isFinite(data[i+1])&&Number.isFinite(data[i+2]));
  const len=Math.hypot(data[i],data[i+1],data[i+2]);
  assert.ok(Math.abs(len-1)<1e-5,'Nonzero shading normal must be normalized');
  assert.ok([0,1,3,4,6,7].includes(data[i+3]));
  roles[data[i+3]]=(roles[data[i+3]]??0)+1;
 }
 assert.deepEqual(roles,entry.roles);
}
results.push({check:'actual hash-verified sidecars match packaged definition counts and recorded surface roles',status:'pass',bytes:sidecarReport.bytes,definitions:v.sourceSurfaces.size});
for(const [label,alter]of [
 ['wrong overview',m=>({...m,overview:'/models/wrong.glb'})],
 ['wrong schema',m=>({...m,schemaVersion:2})],
 ['external buffer path',m=>({...m,file:'https://example.com/surface.bin'})],
 ['bad digest',m=>({...m,sha256:'0'.repeat(64)})],
 ['out-of-bounds definition',m=>({...m,definitions:{d_0_1_1_99:{byteOffset:1e9,vertexCount:3}}})],
]){
 const tested=sourceModules({fetchImpl:async url=>url==='/models/finish-surfaces.json'?{ok:true,json:async()=>alter(sidecarManifest)}:modelFetch(url)})('explorer/src/viewer/SourceSurfaces.ts');
 await assert.rejects(()=>tested.loadSourceSurfaces(assetPaths.overview),undefined,label);
}
const unavailable=sourceModules({fetchImpl:async()=>({ok:false})})('explorer/src/viewer/SourceSurfaces.ts');
await assert.rejects(()=>unavailable.loadSourceSurfaces(assetPaths.overview),/unavailable/);
results.push({check:'sidecar loader rejects mismatched asset/schema, external path, bad SHA, invalid range and unavailable response',status:'pass'});
for(const [label,index,value]of [['nonfinite normal',0,NaN],['nonunit normal',0,999],['invalid role',3,99]]){
 const bytes=fs.readFileSync(path.join(modelsDir,path.basename(sidecarManifest.file)));
 bytes.writeFloatLE(value,index*4);
 const changedManifest={...sidecarManifest,sha256:createHash('sha256').update(bytes).digest('hex')};
 const tested=sourceModules({fetchImpl:async url=>url==='/models/finish-surfaces.json'?{ok:true,json:async()=>changedManifest}:{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}})('explorer/src/viewer/SourceSurfaces.ts');
 await assert.rejects(()=>tested.loadSourceSurfaces(assetPaths.overview),/Invalid source surface normal or role/,label);
}
results.push({check:'sidecars with matching SHA still reject nonfinite/nonunit normals and unknown roles',status:'pass'});
// Only these explicitly authored annotations may be excluded from source-byte checks.
const allowedSurfaceAttributes=new Set(['sourceFinishNormal','sourceFinishRole']);
// Hash decoded attribute/index bytes before material construction or controller edits.
const geometryBefore=new Map();
function geometryDigest(geometry){
 const hash=createHash('sha256');
 const attributes=[...Object.entries(geometry.attributes).filter(([name])=>!allowedSurfaceAttributes.has(name)),['index',geometry.index],...Object.entries(geometry.morphAttributes).flatMap(([name,attrs])=>attrs.map((a,i)=>[`${name}:${i}`,a]))];
 for(const [name,attribute]of attributes){
  if(!attribute)continue;
  const array=attribute.isInterleavedBufferAttribute?attribute.data.array:attribute.array;
  hash.update(JSON.stringify([name,attribute.itemSize,attribute.count,attribute.normalized,attribute.offset,attribute.data?.stride]));
  hash.update(new Uint8Array(array.buffer,array.byteOffset,array.byteLength));
 }
 return hash.digest('hex');
}
function rememberGeometry(scene){scene.traverse(o=>{if(o instanceof THREE.Mesh&&!geometryBefore.has(o.geometry))geometryBefore.set(o.geometry,geometryDigest(o.geometry))})}
const overviewScene=(await parse('overview.glb')).scene;rememberGeometry(overviewScene);
v.ingest(overviewScene);v.retarget();v.applyPose(0);
assert.equal(v.renderParts.size,222);
assert.equal(new Set([...v.renderParts.values()].map(p=>p.mesh.geometry)).size,138);
assert.equal(v.assemblyError(),0);
let annotatedMeshes=0;
for(const part of v.renderParts.values()){
 const data=v.sourceSurfaces.get(part.source.definitionId),g=part.mesh.geometry;
 if(!data)continue;
 annotatedMeshes++;
 const n=g.getAttribute('sourceFinishNormal'),role=g.getAttribute('sourceFinishRole');
 assert.ok(n&&role&&n.isInterleavedBufferAttribute&&role.isInterleavedBufferAttribute);
 assert.equal(n.data,role.data);assert.equal(n.data.array,data);
 assert.equal(n.count,g.getAttribute('position').count);assert.equal(n.offset,0);assert.equal(role.offset,3);
 assert.equal(part.material.defines.SOURCE_FINISH,1);
 const originalBuffer=n.data;surfaceModule.attachSourceSurface(g,data);assert.equal(g.getAttribute('sourceFinishNormal').data,originalBuffer);
}
assert.equal(new Set([...v.renderParts.values()].filter(p=>p.mesh.geometry.hasAttribute('sourceFinishNormal')).map(p=>p.source.definitionId)).size,v.sourceSurfaces.size);
const digestFixture=new THREE.BufferGeometry();digestFixture.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));
const cleanDigest=geometryDigest(digestFixture);
surfaceModule.attachSourceSurface(digestFixture,new Float32Array([0,0,1,0]));assert.equal(geometryDigest(digestFixture),cleanDigest);
digestFixture.setAttribute('unexpectedExtra',new THREE.Float32BufferAttribute([1],1));assert.notEqual(geometryDigest(digestFixture),cleanDigest,'Unexpected attributes must not bypass original-buffer verification');
digestFixture.dispose();
results.push({check:'actual ingest attaches reversible sidecars; only two known attributes are excluded from original hashes',status:'pass',annotatedMeshes});
const fallback=Object.create(Viewer.prototype),badDefinition=v.sourceSurfaces.keys().next().value;
Object.assign(fallback,{parts,root:new THREE.Group(),renderParts:new Map(),state:{...initialState},selectionBox:new THREE.Box3Helper(new THREE.Box3()),sourceSurfaces:new Map([[badDefinition,new Float32Array([0,0,1,0])]]),reduced:false,emit(){}});
fallback.ingest((await parse('overview.glb')).scene);
assert.equal(fallback.renderParts.size,222);assert.match(fallback.sourceSurfaceError,/vertex count changed/);
for(const p of fallback.renderParts.values())if(p.source.definitionId===badDefinition)assert.equal(p.mesh.geometry.hasAttribute('sourceFinishNormal'),false);
fallback.disposeObject(fallback.root);fallback.selectionBox.geometry.dispose();fallback.selectionBox.material.dispose();
results.push({check:'invalid per-definition vertex counts fall back to source geometry while all movement leaves ingest',status:'pass'});
results.push({check:'overview ingest preserves shared geometry and world placements',status:'pass',renderedParts:222,sharedGeometries:138,assemblyError:0});
// A legacy input cannot recover a timing mode or alter source poses.
v.patch({study:true,playing:true,time:.172,speed:1});
assert.equal('study' in v.state,false);assert.equal('playing' in v.state,false);
assert.equal('time' in v.state,false);assert.equal('speed' in v.state,false);
for(let i=0;i<120;i++)v.applyPose(1/60);
assert.equal(v.assemblyError(),0);
const essentials=[...v.renderParts.values()].filter(p=>['112','114','116','126','127','128','129','130','96'].includes(p.source.definitionId.replace('d_0_1_1_','')));
assert.equal(essentials.length,10);assert.ok(essentials.every(p=>p.mesh.visible));
results.push({check:'legacy timing input is discarded; all ten essential former omissions retain exact visible source poses',status:'pass'});
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
const catalogScene=(await parse('catalog.glb')).scene;rememberGeometry(catalogScene);v.ingest(catalogScene);assert.equal(v.renderParts.size,364);
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

// Exercise actual controller material retargeting, including optical state restoration.
v.state={...initialState};v.retarget();
const rubyPart=[...v.renderParts.values()].find(p=>p.material.name==='ruby');
const anisotropicPart=[...v.renderParts.values()].find(p=>p.material.anisotropy>0);
assert.ok(rubyPart&&anisotropicPart);
assert.equal(rubyPart.material.transmission,.55);
const anisotropicVersion=anisotropicPart.material.version;
v.state={...initialState,treatment:'function'};v.retarget();
for(const p of v.renderParts.values()){
 assert.equal(p.material.userData.finishEnabled.value,0);
 if(['ruby','shockMass'].includes(p.material.name))assert.equal(p.material.transmission,0);
}
assert.equal(anisotropicPart.material.version,anisotropicVersion,'Function anisotropy gating must not change shader program version');
v.state={...initialState};v.retarget();assert.equal(rubyPart.material.transmission,.55);
const rubyFinishColor=rubyPart.material.color.clone();
v.state={...initialState,part:rubyPart.source.id,isolated:true};v.retarget();assert.equal(rubyPart.material.transmission,.55);assert.ok(rubyPart.material.color.equals(rubyFinishColor));
v.state={...initialState,treatment:'function',part:rubyPart.source.id};v.retarget();assert.equal(rubyPart.material.transmission,0);assert.ok(rubyPart.material.color.equals(new THREE.Color('#f5cf88')));
v.state={...initialState,group:'energy'};v.retarget();assert.equal(rubyPart.material.transmission,rubyPart.material.userData.finishEnabled.value ? .55 : 0);
v.state={...initialState};v.retarget();assert.equal(rubyPart.material.transmission,.55);
const {finishFor,createMaterial,setFinishEnabled}=load('explorer/src/viewer/materials.ts');
assert.equal(finishFor('si HMzylinder','d_0_1_1_155').family,'shockMass');
const shockMaterial=createMaterial('si HMzylinder','d_0_1_1_155');setFinishEnabled(shockMaterial,false);assert.equal(shockMaterial.transmission,0);setFinishEnabled(shockMaterial,true);assert.equal(shockMaterial.transmission,.55);shockMaterial.dispose();
for(const suffix of [33,77,78,81,82]){
 const p=v.renderParts.get(PREFIX+suffix);assert.ok(p);
 const assigned=finishFor(p.source.name,p.source.definitionId,p.source.id);
 assert.equal(assigned.assignment,'source-instance');assert.equal(assigned.family,'steel');assert.equal(p.material.name,'steel');
}
const sharedBlue=[...v.renderParts.values()].find(p=>p.source.definitionId==='d_0_1_1_181'&&p.material.name==='blue');
assert.ok(sharedBlue,'Instance overrides must preserve shared screw definition blue elsewhere');
results.push({check:'five reviewed fasteners use instance steel overrides while shared screw definition stays blue elsewhere',status:'pass'});
const physicalDefaults=new THREE.MeshPhysicalMaterial();
for(const p of v.renderParts.values()){
 assert.ok(p.material instanceof THREE.MeshPhysicalMaterial);
 for(const [key,value]of Object.entries(physicalDefaults.defines)){
  assert.ok(Object.hasOwn(p.material.defines,key),`Custom sidecar defines must retain physical define ${key}`);
  assert.equal(p.material.defines[key],value);
 }
}
physicalDefaults.dispose();
results.push({check:'all physical materials retain installed STANDARD/PHYSICAL defaults when SOURCE_FINISH defines are added',status:'pass'});
// Compile-hook smoke uses actual installed shader templates; real GLSL compilation remains browser-owned.
for(const part of [rubyPart,anisotropicPart,...[...v.renderParts.values()].filter(p=>p.mesh.geometry.hasAttribute('sourceFinishNormal'))]){
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
 part.material.onBeforeCompile(shader,{});
 assert.ok(shader.vertexShader.includes('vFinishPosition=position'));
 assert.ok(shader.fragmentShader.includes('tbn=mat3(finishT'));
 assert.ok(shader.fragmentShader.includes('material.alphaT=mix'));
 assert.equal(shader.uniforms.finishEnabled,part.material.userData.finishEnabled);
 assert.equal((shader.fragmentShader.match(/#include <lights_physical_fragment>/g)||[]).length,1);
}
results.push({check:'Function/context gate transmission, Finish isolation preserves optics, Function selection highlights, and anisotropy toggles reuse program',status:'pass',scope:'actual CPU controller/hook state; not GLSL compile proof'});
const {StudioEnvironment}=load('explorer/src/viewer/StudioEnvironment.ts');
const studio=new StudioEnvironment(),studioResources=[];
studio.traverse(o=>{if(o instanceof THREE.Mesh){studioResources.push(o.geometry,o.material);assert.ok(o.material.color.r>1);assert.equal(o.material.side,THREE.DoubleSide)}});
assert.equal(studioResources.length,12);
const studioDisposals=new Map(studioResources.map(r=>[r,0]));
for(const r of studioResources)r.addEventListener('dispose',()=>studioDisposals.set(r,studioDisposals.get(r)+1));
studio.dispose();for(const count of studioDisposals.values())assert.equal(count,1);
results.push({check:'actual six-card studio has HDR emission colors and disposes every temporary geometry/material once',status:'pass'});

// No DOM was connected in this CPU harness, so OrbitControls has no DOM listeners to dispose.
const pending=[];class DeferredLoader{setMeshoptDecoder(){return this}loadAsync(url,progress){return new Promise((resolve,reject)=>pending.push({resolve,reject,progress}))}}
const loadRace=sourceModules({loader:DeferredLoader,fetchImpl:async()=>({ok:true,json:async()=>({instances:[]})})});const {MovementViewer:RaceViewer}=loadRace('explorer/src/viewer/MovementViewer.ts');const race=Object.create(RaceViewer.prototype);
Object.assign(race,{loadGeneration:0,dead:false,error:'',ready:false,loadStart:performance.now(),paths:{overview:'fixture.glb'},emit(){},ingest(){},homeCamera(){},retarget(){},disposeObject(){}});
const obsolete=race.load();while(pending.length<1)await Promise.resolve();const current=race.load();while(pending.length<2)await Promise.resolve();pending[1].resolve({scene:{}});await current;assert.equal(race.ready,true);assert.equal(race.error,'');pending[0].progress?.({loaded:25,total:100});assert.equal(race.status,'','Obsolete progress must not overwrite completed loading status');pending[0].reject(Error('Obsolete fixture request'));await obsolete;assert.equal(race.error,'','An obsolete failure must not overwrite newer successful state');
results.push({check:'obsolete load progress/failure cannot overwrite newer successful load',status:'pass'});
const disposedStale=[];race.disposeObject=scene=>disposedStale.push(scene);
const staleSuccess=race.load();while(pending.length<3)await Promise.resolve();const newerSuccess=race.load();while(pending.length<4)await Promise.resolve();
pending[3].resolve({scene:{id:'current-scene'}});await newerSuccess;
const staleScene={id:'stale-scene'};pending[2].resolve({scene:staleScene});await staleSuccess;
assert.deepEqual(disposedStale,[staleScene]);assert.equal(race.ready,true);assert.equal(race.error,'');
results.push({check:'obsolete successful geometry is disposed after newer load succeeds',status:'pass'});
const metadataPending=[];let immediateLoads=0;
class ImmediateLoader{setMeshoptDecoder(){return this}async loadAsync(){immediateLoads++;return {scene:{}}}}
const metadataModules=sourceModules({loader:ImmediateLoader,fetchImpl:async url=>{
 if(url==='/models/assembly-manifest.json')return new Promise(resolve=>metadataPending.push(resolve));
 if(url==='/models/asset-paths.json')return {ok:true,json:async()=>({overview:'latest.glb',catalog:'latest-catalog.glb'})};
 return {ok:false};
}});
const {MovementViewer:MetadataViewer}=metadataModules('explorer/src/viewer/MovementViewer.ts');
const metadataRace=Object.create(MetadataViewer.prototype);
Object.assign(metadataRace,{loadGeneration:0,dead:false,error:'',ready:false,loadStart:performance.now(),paths:{overview:'fixture.glb'},emit(){},ingest(){},homeCamera(){},retarget(){},disposeObject(){}});
const oldMetadata=metadataRace.load(),newMetadata=metadataRace.load();
assert.equal(metadataPending.length,2);
const latestParts=[{id:'latest'}];metadataPending[1]({ok:true,json:async()=>({instances:latestParts})});
await newMetadata;assert.equal(metadataRace.ready,true);assert.equal(metadataRace.parts,latestParts);
metadataPending[0]({ok:true,json:async()=>({instances:[{id:'obsolete'}]})});await oldMetadata;
assert.equal(metadataRace.parts,latestParts);assert.equal(immediateLoads,1,'Obsolete metadata must not launch geometry');
assert.equal(metadataRace.paths.overview,'latest.glb');
assert.match(metadataRace.sourceSurfaceError,/unavailable/);assert.equal(metadataRace.error,'','Optional sidecar failure must preserve movement loading');
results.push({check:'late metadata cannot overwrite current parts/paths or launch geometry; unavailable annotations fall back without movement failure',status:'pass'});

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
 fromScene(room,sigma){assert.ok(room instanceof RoomStub);assert.equal(sigma,.015);environmentCreated++;return {texture:replacementTexture,dispose(){}}}
 dispose(){generatorDisposed++}
}
vm.runInNewContext(restoreCode,{module:restoreModule,THREE:{PMREMGenerator:PmremStub},StudioEnvironment:RoomStub});
const restoreFixture={renderer:rendererFixture,environment:{texture:oldTexture,dispose(){oldDisposed++}},scene:{environment:oldTexture,environmentIntensity:.8},contextLost:true,error:'Graphics interruption',needsRender:false,emit(){notifications++}};
restoreModule.exports.call(restoreFixture)();
assert.equal(oldDisposed,1);assert.equal(environmentCreated,1);assert.equal(restoreFixture.environment.texture,replacementTexture);assert.equal(restoreFixture.scene.environment,replacementTexture);assert.notEqual(restoreFixture.scene.environment,oldTexture);assert.equal(restoreFixture.scene.environmentIntensity,.8);assert.equal(roomDisposed,1);assert.equal(generatorDisposed,1);assert.equal(restoreFixture.contextLost,false);assert.equal(restoreFixture.error,'');assert.equal(restoreFixture.needsRender,true);assert.equal(notifications,1);
results.push({check:'context restore replaces environment texture and releases temporary PMREM resources',status:'pass',scope:'actual handler with CPU PMREM/room stubs; not WebGL reflection proof'});
const snapshotFixture=Object.create(Viewer.prototype),benchmarkResult={fixture:'completed benchmark'};
Object.assign(snapshotFixture,{state:{...initialState},ready:true,status:'',error:'',detailError:'',parts:[],history:[],catalogLoaded:true,benchmark:{result:benchmarkResult},stats(){return {}}});
const snapshot=snapshotFixture.snapshot();assert.equal(snapshot.catalogLoaded,true);assert.equal(snapshot.benchmarkResult,benchmarkResult);
snapshotFixture.benchmark=null;assert.equal(snapshotFixture.snapshot().benchmarkResult,undefined);
results.push({check:'snapshot exposes catalog/benchmark values without requiring render-time refs',status:'pass'});
for(const [geometry,digest]of geometryBefore)assert.equal(geometryDigest(geometry),digest,'Material creation, ingest, reveal and timing must preserve all decoded geometry bytes');
results.push({check:'surface materials and controller operations preserve decoded attributes and indices byte for byte',status:'pass',decodedGeometryObjects:geometryBefore.size});

// Real installed SSAOPass objects; only renderer operations are a CPU facade.
// This exercises render-target sequencing and disposal, not GLSL compilation or pixels.
const {SurfaceOcclusion}=load('explorer/src/viewer/SurfaceOcclusion.ts');
const aoScene=new THREE.Scene(),aoCamera=new THREE.PerspectiveCamera(33,1,.05,2000);
const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial());aoScene.add(line);
const ao=new SurfaceOcclusion(aoScene,aoCamera),pass=ao.pass;
assert.ok(pass instanceof SSAOPass);assert.ok(pass.ssaoMaterial.fragmentShader.includes('1.0 - 0.24 * occlusion'));
assert.equal(pass.kernelRadius,.4);
ao.resize(640.4,479.6);assert.equal(pass.normalRenderTarget.width,640);assert.equal(pass.blurRenderTarget.height,480);
aoCamera.far=700;aoCamera.aspect=.6;aoCamera.updateProjectionMatrix();
let target=null,clearAlpha=.3,clearColor=new THREE.Color(0x123456),clears=0;
const initialClear=clearColor.clone(),draws=[];
const renderer={autoClear:true,getClearColor(out){return out.copy(clearColor)},getClearAlpha(){return clearAlpha},setClearColor(value){clearColor.set(value)},setClearAlpha(value){clearAlpha=value},setRenderTarget(value){target=value},clear(){clears++},render(object){
 if(object===aoScene){assert.equal(line.visible,false);assert.equal(aoScene.overrideMaterial,pass.normalMaterial)}
 draws.push({target,material:object===aoScene?aoScene.overrideMaterial:object.material});
}};
ao.render(renderer);
assert.deepEqual(draws.map(d=>d.target),[pass.normalRenderTarget,pass.ssaoRenderTarget,pass.blurRenderTarget,null]);
assert.deepEqual(draws.map(d=>d.material),[pass.normalMaterial,pass.ssaoMaterial,pass.blurMaterial,pass.copyMaterial]);
assert.equal(clears,1);assert.equal(target,null);assert.equal(renderer.autoClear,true);assert.equal(clearAlpha,.3);assert.ok(clearColor.equals(initialClear));assert.equal(line.visible,true);assert.equal(aoScene.overrideMaterial,null);
assert.equal(pass.ssaoMaterial.uniforms.cameraFar.value,700);assert.equal(pass.ssaoMaterial.uniforms.cameraNear.value,.05);assert.ok(pass.ssaoMaterial.uniforms.cameraProjectionMatrix.value.equals(aoCamera.projectionMatrix));assert.ok(pass.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.equals(aoCamera.projectionMatrixInverse));
assert.equal(pass.ssaoMaterial.uniforms.minDistance.value,.035/(700-.05));assert.equal(pass.ssaoMaterial.uniforms.maxDistance.value,.65/(700-.05));
assert.equal(pass.copyMaterial.uniforms.tDiffuse.value,pass.blurRenderTarget.texture);assert.equal(pass.copyMaterial.blending,THREE.CustomBlending);
const resources=[pass.normalRenderTarget,pass.ssaoRenderTarget,pass.blurRenderTarget,pass.normalMaterial,pass.blurMaterial,pass.copyMaterial,pass.depthRenderMaterial,pass.noiseTexture,pass.ssaoMaterial,pass._fsQuad._mesh.geometry];
const disposals=new Map(resources.map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>disposals.set(r,disposals.get(r)+1));
ao.dispose();for(const count of disposals.values())assert.equal(count,1,'Every contact-pass owned resource must be disposed once');line.geometry.dispose();line.material.dispose();
results.push({check:'contact pass refreshes camera/depth scale, multiplies after beauty, restores render state and disposes owned resources',status:'pass',resourcesDisposed:resources.length,scope:'real SSAOPass with CPU renderer facade; not WebGL proof'});
console.log(JSON.stringify({scope:'CPU source/asset regression checks; not browser/WebGL/device QA',results},null,2));
