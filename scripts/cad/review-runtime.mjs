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
const {STLLoader}=await import(path.join(ROOT,'explorer/node_modules/three/examples/jsm/loaders/STLLoader.js'));
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
   if(id.includes('STLLoader'))return {STLLoader};
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
  assert.ok([0,1,2,3,4,5,6,7,8,9,10,11,12].includes(data[i+3]));
  roles[data[i+3]]=(roles[data[i+3]]??0)+1;
 }
 assert.deepEqual(roles,entry.roles);
}
// Independent spatial guard for the top-origin screw regression discovered in
// the final macro. Preserve original region identity independently of the
// whole-screw bluing override in the material shader.
for(const n of [9,107,122,180,181]){
 const id=`d_0_1_1_${n}`,raw=fs.readFileSync(path.join(ROOT,`artifacts/finishing-cad/sidecars/${id}.bin`)),data=v.sourceSurfaces.get(id);
 let head=0,shank=0;
 for(let i=0;i<data.length/4;i++){
  const z=raw.readFloatLE((i*10+2)*4),role=data[i*4+3];
  if(z>-.05){assert.notEqual(role,2,id+' blue top must not become steel');head++;}
  if(z<(n===180?-2:-.5)){assert.equal(role,2,id+' source shank annotation must remain intact');shank++;}
 }
 assert.ok(head>0&&shank>0);
}
results.push({check:'top-origin screw head/shank source annotations remain intact beneath the whole-screw finish override',status:'pass'});
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
assert.equal(new Set([...v.renderParts.values()].filter(p=>p.mesh.geometry.hasAttribute('sourceFinishNormal')).map(p=>p.source.definitionId)).size,new Set([...v.renderParts.values()].filter(p=>v.sourceSurfaces.has(p.source.definitionId)).map(p=>p.source.definitionId)).size);
const digestFixture=new THREE.BufferGeometry();digestFixture.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));
const cleanDigest=geometryDigest(digestFixture);
surfaceModule.attachSourceSurface(digestFixture,new Float32Array([0,0,1,0]));assert.equal(geometryDigest(digestFixture),cleanDigest);
digestFixture.setAttribute('unexpectedExtra',new THREE.Float32BufferAttribute([1],1));assert.notEqual(geometryDigest(digestFixture),cleanDigest,'Unexpected attributes must not bypass original-buffer verification');
digestFixture.dispose();
results.push({check:'actual ingest attaches reversible sidecars; only two known attributes are excluded from original hashes',status:'pass',annotatedMeshes});
const fallback=Object.create(Viewer.prototype),badDefinition='d_0_1_1_105';
Object.assign(fallback,{parts,root:new THREE.Group(),renderParts:new Map(),state:{...initialState},selectionBox:new THREE.Box3Helper(new THREE.Box3()),sourceSurfaces:new Map([[badDefinition,new Float32Array([0,0,1,0])]]),reduced:false,emit(){}});
const mismatchedScene=(await parse('overview.glb')).scene;
assert.throws(()=>fallback.ingest(mismatchedScene),/vertex count changed/);
assert.equal(fallback.renderParts.size,0);assert.equal(fallback.root.children.length,0);assert.match(fallback.sourceSurfaceError,/vertex count changed/);
fallback.disposeObject(mismatchedScene);fallback.selectionBox.geometry.dispose();fallback.selectionBox.material.dispose();
results.push({check:'invalid per-definition vertex counts reject ingestion before any movement leaves enter the visible scene',status:'pass'});
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
const bridge=[...v.renderParts.values()].find(p=>belongs(p.source.id,PREFIX+'6'));
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
assert.equal(rubyPart.material.transmission,.72);
const anisotropicVersion=anisotropicPart.material.version;
v.patch({treatment:'function'});
assert.equal('treatment' in v.state,false);
for(const p of v.renderParts.values()) assert.equal(p.material.userData.finishEnabled.value,1);
assert.equal(anisotropicPart.material.version,anisotropicVersion,'Legacy appearance input must preserve shader programs');
const rubyFinishColor=rubyPart.material.color.clone();
v.state={...initialState,part:rubyPart.source.id,isolated:true};v.retarget();assert.equal(rubyPart.material.transmission,.72);assert.ok(rubyPart.material.color.equals(rubyFinishColor));
v.patch({treatment:'function'});assert.equal(rubyPart.material.transmission,.72);assert.ok(rubyPart.material.color.equals(rubyFinishColor));
v.state={...initialState,group:'energy'};v.retarget();assert.equal(rubyPart.material.transmission,rubyPart.material.userData.finishEnabled.value ? .72 : 0);
v.state={...initialState};v.retarget();assert.equal(rubyPart.material.transmission,.72);
const {finishFor,createMaterial,setFinishEnabled}=load('explorer/src/viewer/materials.ts');
const finishShaderFor=(n)=>{
 const p=[...v.renderParts.values()].find(p=>p.source.definitionId===`d_0_1_1_${n}`);
 assert.ok(p);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
 p.material.onBeforeCompile(shader,{});return {p,shader};
};
for(const suffix of ['54__0_1_1_194_11','54__0_1_1_194_12']){
 const p=v.renderParts.get(PREFIX+suffix);assert.ok(p);
 assert.equal(p.source.definitionId,'d_0_1_1_201');
 assert.equal(p.material.name,'steel');
 const m=new THREE.Matrix4().set(...p.source.worldTransform.flat());
 const pos=new THREE.Vector3().setFromMatrixPosition(m),axis=new THREE.Vector3(0,0,1).transformDirection(m);
 assert.ok(Math.abs(Math.hypot(pos.x,pos.y)-16)<1e-4);
 assert.ok(Math.abs(axis.z)<1e-8&&axis.dot(new THREE.Vector3(pos.x,pos.y,0).normalize())>.99999);
}
assert.equal(finishFor('shared screw','d_0_1_1_201','other-instance').family,'blue');
results.push({check:'exact two radial dial screws at 16mm radius use neutral steel; unrelated shared d201 stays blue',status:'pass'});
const capMeta=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/finishing-cad/sidecars/d_0_1_1_105.json')));
const windingFinish=finishShaderFor(240),windingAxis=windingFinish.shader.uniforms.finishBrushAxis.value;
const windingWorld=new THREE.Vector3(windingAxis.x,windingAxis.y,0).transformDirection(new THREE.Matrix4().set(...windingFinish.p.source.worldTransform.flat()));
assert.ok(Math.abs(windingWorld.y)<1e-10&&Math.abs(windingWorld.z)<1e-10&&Math.abs(windingWorld.x)>.999999,'Winding grain must be horizontal in the actual source assembly');
const holeCenter=(i)=>{const b=capMeta.faces[i-1].boundsLocalMm;return new THREE.Vector2((b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2)};
const toJewel=holeCenter(16).add(holeCenter(21)).multiplyScalar(-.5).normalize();
assert.ok(toJewel.dot(finishShaderFor(105).shader.uniforms.finishBrushAxis.value)>.999999);
const seatRaw=fs.readFileSync(path.join(ROOT,'artifacts/finishing-cad/sidecars/d_0_1_1_99.bin'));
let seatCount=0;for(let offset=0;offset<seatRaw.length;offset+=40){
 const z=seatRaw.readFloatLE(offset+8),nz=seatRaw.readFloatLE(offset+32),face=seatRaw.readFloatLE(offset+36);
 const seat=Math.abs(z+.3)<.0001&&Math.abs(nz)>.999;
 assert.equal(seat,face===54,'Satin mask must identify only the original cap-seat face');if(seat)seatCount++;
}
assert.equal(seatCount,263);assert.equal(finishShaderFor(99).shader.uniforms.finishCapSeat.value,1);
assert.equal(finishShaderFor(222).shader.uniforms.finishCapSeat.value,0);
for(const n of [85,86,90,91])assert.equal(finishShaderFor(n).shader.uniforms.finishSnailing.value,1);
// A world-space winding comparison catches mirrored source-local barrel axes.
const barrelWinding=[85,86,90,91].map(n=>{
 const {p,shader}=finishShaderFor(n),m=p.source.worldTransform;
 const parity=Math.sign(m[0][0]*m[1][1]-m[0][1]*m[1][0]);
 if(n===85||n===86)assert.equal(shader.uniforms.finishSnailTurn.value,1.15,'Accepted left barrel must retain its winding');
 return parity*shader.uniforms.finishSnailTurn.value;
});
for(const winding of barrelWinding)assert.equal(winding,barrelWinding[0]);
const rearScrews=[...v.renderParts.values()].filter(p=>p.source.id.startsWith(PREFIX)&&/^010-/.test(p.source.name)&&p.source.worldTransform[2][2]>.999);
assert.equal(rearScrews.length,11);
for(const p of rearScrews)assert.equal(p.material.name,'steel',p.source.id+' is fitted from the back');
const studScrew=v.renderParts.get(PREFIX+'59__0_1_1_221_7');
assert.equal(studScrew.source.definitionId,'d_0_1_1_226');assert.equal(studScrew.material.name,'steel');
const studs=[...v.renderParts.values()].filter(p=>p.source.definitionId==='d_0_1_1_117');
assert.equal(studs.length,2);for(const p of studs)assert.equal(p.material.name,'steel');
assert.equal(finishFor('shared stud screw','d_0_1_1_226','elsewhere').family,'blue');
results.push({check:'all four source barrel transforms produce the accepted left winding; all eleven rear-facing screws and hairspring stud/screw are steel with exact instance scope',status:'pass'});
for(const n of [94,131,249])assert.equal(finishShaderFor(n).shader.uniforms.finishSnailing.value,0);
assert.equal(finishShaderFor(249).p.material.name,'ratchet');
assert.equal(finishShaderFor(249).shader.uniforms.finishPattern.value,2);
assert.equal(finishShaderFor(249).shader.uniforms.finishBlackPolished.value,0);
assert.equal(finishShaderFor(251).p.material.name,'crown');
for(const n of [99,133,147,156,165,219,222,228,230,240]){
 const roles=finishShaderFor(n).p.mesh.geometry.getAttribute('sourceFinishRole');
 assert.ok(roles);let bases=0;for(let i=0;i<roles.count;i++)if(roles.getX(i)===8)bases++;
 assert.ok(bases>0,`Reviewed bridge ${n} must have an exact exposed-base role`);
}
assert.ok(!finishShaderFor(230).shader.uniforms.finishEngraved.value);
assert.equal(finishShaderFor(219).shader.uniforms.finishEngraved.value,1);
const shockBlockShader=finishShaderFor(159).shader;
assert.equal(shockBlockShader.uniforms.finishShockBlock.value,1);
// Exercise the actual neutral-role assignment: mixed source-role triangles can
// interpolate through steel (role 2) even in the middle of an authored blue arm.
const neutralBlueAssignment=shockBlockShader.fragmentShader.match(/if\(finishWholeBlue<\.5 && abs\(vFinishRole-2\.0\)<\.2\) finishBlueSurface=([^;]+);/);
assert.ok(neutralBlueAssignment);
const resolveNeutralBlue=new Function('finishShockBlue',`return ${neutralBlueAssignment[1]};`);
assert.equal(resolveNeutralBlue(1),1,'Neutral-role arm fragments must remain fully blue');
assert.equal(resolveNeutralBlue(0),0,'Central spine and other source steel seats must remain neutral');
assert.equal(resolveNeutralBlue(.5),.5,'Preserve the authored transition into the spine');

assert.equal(finishShaderFor(156).shader.uniforms.finishShockBlock.value,0);
assert.match(shockBlockShader.fragmentShader,/vFinishRole-7\.0\)<\.2\) diffuseColor\.rgb=vec3\(\.22,\.002,\.018\)/);
results.push({check:'cap grain follows actual screw bores; exact bridge bases and recesses replace blanket lower-Z frosting; four barrels retain handed fine snailing; crown wheel is circular brushed',status:'pass'});
// Reference-requested keyless surfaces must reach a directional material on
// real source geometry, including negative-Z faces and the catalog alternative.
for(const n of [174,176,178,190,193,244,246,248,97,172]){
 const part=[...v.renderParts.values()].find(p=>p.source.definitionId===`d_0_1_1_${n}`);
 assert.ok(part,`Missing reviewed keyless definition ${n}`);
 assert.equal(part.material.name,[97,172].includes(n)?'ratchet':'brushedSteel');
 assert.ok(part.material.anisotropy>0,`Unbrushed keyless part ${n}`);
 const normals=part.mesh.geometry.getAttribute('normal');
 let flat=0;for(let i=0;i<normals.count;i++)if(Math.abs(normals.getZ(i))>.96)flat++;
 assert.ok(flat>0,`Source-local brushing frame misses all faces on ${n}`);
 const version=part.material.version;
 setFinishEnabled(part.material,false);
 assert.equal(part.material.userData.finishEnabled.value,0);
 setFinishEnabled(part.material,true);
 assert.equal(part.material.version,version);
}
for(const n of [143,144,173,177])assert.equal(finishFor('',`d_0_1_1_${n}`).family,'steel','Stem, coupling and pins keep their separate turned finish');
results.push({check:'ten source keyless definitions use straight/circular satin with real local-Z face coverage; Function toggles without recompilation; turned shafts/pins remain separate',status:'pass'});
for(const definition of [114,137,142,183,188,235]){
 const steelPart=createMaterial('steel correction fixture',`d_0_1_1_${definition}`);
 assert.equal(steelPart.name,'steel');assert.equal(steelPart.metalness,1);assert.equal(steelPart.transmission,0);steelPart.dispose();
}
assert.equal(finishShaderFor(114).shader.uniforms.finishPattern.value,0);
for(const n of [99,133,147,156,165,219,222,228,230,240]){
 const shader=finishShaderFor(n).shader.fragmentShader;
 assert.ok(!shader.includes('frost*finishBase'),'No bridge base grain or bump frosting');
 assert.ok(shader.includes('finishBase>.5) roughnessFactor=.24'),'Shared satin base response');
}
results.push({check:'all ten formerly frosted bridge bases use smooth satin; double roller is unbrushed steel',status:'pass'});
for(const n of [99,133,147,152,153,156,165,219,222,228,230,240])assert.equal(finishShaderFor(n).shader.uniforms.finishBrushDetail.value,2.6);
for(const n of [105,120,174,176,178,190,193,244,246,248])assert.equal(finishShaderFor(n).shader.uniforms.finishBrushDetail.value,1.65);
for(const n of [85,86,90,91,94,97,114,131,172,187,233,249])assert.equal(finishShaderFor(n).shader.uniforms.finishBrushDetail.value,1,'Circular gears, barrels and smooth steel must keep their response');
results.push({check:'stronger straight brushing reaches every bridge and flat brushed family; circular gear/barrel and smooth double-roller responses remain unchanged',status:'pass'});
for(const [n,expected] of [[99,[28,30]],[222,[31,33]],[228,[49,50,52]]]){
 const p=finishShaderFor(n).p,roles=p.mesh.geometry.getAttribute('sourceFinishRole');
 const b=fs.readFileSync(path.join(ROOT,`artifacts/finishing-cad/sidecars/d_0_1_1_${n}.bin`));
 const raw=new Float32Array(b.buffer,b.byteOffset,b.length/4),found=new Set();
 for(let i=0;i<roles.count;i++){
  const face=raw[i*10+9];assert.equal(roles.getX(i)===12,expected.includes(face),`Mounting frost d${n} face ${face}`);
  if(roles.getX(i)===12)found.add(face);
 }
 assert.deepEqual([...found].sort((a,b)=>a-b),expected);
}
for(const [id,data] of v.sourceSurfaces)if(!['d_0_1_1_99','d_0_1_1_222','d_0_1_1_228'].includes(id))for(let i=3;i<data.length;i+=4)assert.notEqual(data[i],12);
results.push({check:'frosting matches exactly seven mounting pad faces on the three approved bridges; no other definition receives mounting frosting',status:'pass'});
assert.deepEqual(finishShaderFor(195).shader.uniforms.finishFrostDetail.value.toArray(),[4,.16]);
for(const n of [99,222,228])assert.deepEqual(finishShaderFor(n).shader.uniforms.finishFrostDetail.value.toArray(),[6,.13]);
for(const n of [195,99,222,228]){
 const {shader}=finishShaderFor(n),fragment=shader.fragmentShader;
 // The real compile hook must keep frosting out of the normal/anisotropy path,
 // including mounting masks on otherwise brushed materials. Pixel QA is separate.
 assert.match(fragment,/finishBlackPolished<\.5 && finishFrostMask<\.5/);
 assert.match(fragment,/material\.anisotropy\*=finishFace\*finishEnabled\*\(1\.0-finishFrostMask\)/);
 const heights=fragment.split('\n').filter(line=>line.includes('finishHeight='));
 assert.ok(heights.every(line=>!/(mountingFrost|finishFrostDetail|finishGrain)/.test(line)||line.includes('*.00022')), 'Frosting must never drive bump height');
 assert.match(fragment,/clamp\(\.49\+finishGrain\*finishFrostDetail\.y,\.43,\.57\)/);
 assert.ok(fragment.indexOf('float finishFrostGrain=finishFrost(finishUv)')<fragment.indexOf('if(finishEnabled>.5'), 'Frost derivatives must run before source-role branches');
 assert.match(fragment,/1\.0-smoothstep\(\.2,\.75,footprint\)/);
 assert.ok(!fragment.includes('sqrt(nearest)'), 'No sharp cellular ridges');
}
assert.equal(finishShaderFor(195).p.material.roughness,.49);
assert.equal(finishShaderFor(99).p.material.anisotropy,.52);
assert.equal(finishShaderFor(251).p.material.roughness,.055);
results.push({check:'plate and seven mounting pads retain filtered reflectance grain with bounded roughness, no frost normal perturbation or anisotropy; satin and polished responses remain distinct',status:'pass',scope:'actual shader hooks and source masks; temporal appearance requires browser review'});
const mass=createMaterial('user-corrected jewel','d_0_1_1_155');
assert.equal(mass.name,'ruby');assert.equal(mass.metalness,0);assert.equal(mass.transmission,.72);mass.dispose();
for(const id of [99,230]){
 const part=finishShaderFor(id).p;
 const roles=part.mesh.geometry.getAttribute('sourceFinishRole');
 const bytes=fs.readFileSync(path.join(ROOT,`artifacts/finishing-cad/sidecars/d_0_1_1_${id}.bin`));
 const raw=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);
 const faces=new Set();
 for(let i=0;i<roles.count;i++){
  const face=raw[i*10+9];
  const expected=id===99?face>=129&&face<=247&&![219,223,227].includes(face):face>=37&&face<=66;
  assert.equal(roles.getX(i)===11,expected,`Enamel scope d${id} face ${face}`);
  if(expected)faces.add(face);
 }
 assert.equal(faces.size,id===99?116:30);
}
{
 const p=finishShaderFor(159).p,roles=p.mesh.geometry.getAttribute('sourceFinishRole'),pos=p.mesh.geometry.getAttribute('position');
 const coverage={leftTop:0,rightTop:0,leftBottom:0,rightBottom:0};
 for(let i=0;i<roles.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  if(y>5)assert.notEqual(roles.getX(i),4,'Central spine must remain steel');
  if(roles.getX(i)===4&&Math.abs(x)>2){
   if(z>-.01)coverage[x<0?'leftTop':'rightTop']++;
   if(z<-.19)coverage[x<0?'leftBottom':'rightBottom']++;
  }
 }
 for(const [region,count] of Object.entries(coverage))assert.ok(count>0,`Blue thickness coverage: ${region}`);
}
{
 const rawBytes=fs.readFileSync(path.join(ROOT,'artifacts/finishing-cad/sidecars/d_0_1_1_159.bin'));
 const raw=new Float32Array(rawBytes.buffer,rawBytes.byteOffset,rawBytes.length/4);
 const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
 const arms=new Set([...range(1,4),...range(62,70),...range(79,98),...range(104,123),...range(139,158),...range(164,173),180,...range(186,261),8,11,12,15,33,38,39,44]);
 const visited=new Set();
 for(let i=0;i<raw.length;i+=10){
  const [x,y]=raw.subarray(i,i+2),face=raw[i+9];
  if(arms.has(face)){
   assert.ok(Math.abs(x)>=y*.5 || y<=1.05,`Entire arm face ${face} must be fully blue, not merely its top footprint`);
   visited.add(face);
  }
  if(face>=125&&face<=137&&y>=1.45)assert.ok(Math.abs(x)<y*.5,'Spine sides must stay outside the blue arm region');
 }
 assert.equal(visited.size,arms.size);
 results.push({check:'every vertex of all complete arm/connection faces lies in the fully blue fragment region; spine sidewalls stay steel beyond the fade',status:'pass',faces:visited.size});
}
results.push({check:'jewel mass is dielectric; enamel matches every intended face and no others; both spring arms carry blue on upper and lower surfaces with steel spine preserved',status:'pass'});
// Guard the installed renderer contract, so a Three upgrade cannot silently turn
// isolated clear parts into white discs again. Browser evidence checks pixels.
assert.ok(THREE.ShaderChunk.transmission_pars_fragment.includes('return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );'));
const rendererSource=fs.readFileSync(path.join(ROOT,'explorer/node_modules/three/src/renderers/WebGLRenderer.js'),'utf8');
assert.match(rendererSource,/setClearColor\(\s*0xffffff,\s*0\.5\s*\)/);
for(const definition of [67,225]){
 const optical=createMaterial('optical fixture',`d_0_1_1_${definition}`);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
 optical.onBeforeCompile(shader,{});
 assert.equal(shader.fragmentShader.includes('float uncovered ='),true);
 assert.equal(optical.customProgramCacheKey().includes('clear'),true);
 const transmission=optical.transmission;setFinishEnabled(optical,false);assert.equal(optical.transmission,0);setFinishEnabled(optical,true);assert.equal(optical.transmission,transmission);
 optical.dispose();
}
const backdrop=(rgb,alpha)=>rgb.map((c,i)=>Math.max(c-Math.min(1,Math.max(0,(1-alpha)*2)),0)+[.012,.019,.024][i]*Math.min(1,Math.max(0,(1-alpha)*2)));
assert.deepEqual(backdrop([.3,.6,.9],1),[.3,.6,.9]);assert.deepEqual(backdrop([1,1,1],.5),[.012,.019,.024]);
results.push({check:'clear optics match installed transmission-buffer contract, preserve opaque samples, isolate program cache, and restore after Function; ruby optical path retained',status:'pass',scope:'shader hook and renderer contract; actual pixels reviewed in browser'});
for(const suffix of [33,43,44,45,77,78,81,82,...[9,20,21,24,27,32,33].map(n=>'29__0_1_1_145_'+n)]){
 const p=v.renderParts.get(PREFIX+suffix);assert.ok(p);
 const assigned=finishFor(p.source.name,p.source.definitionId,p.source.id);
 assert.equal(assigned.assignment,'source-instance');assert.equal(assigned.family,'steel');assert.equal(p.material.name,'steel');
}
const sharedBlue=[...v.renderParts.values()].find(p=>p.source.definitionId==='d_0_1_1_181'&&p.material.name==='blue');
assert.ok(sharedBlue,'Instance overrides must preserve shared screw definition blue elsewhere');
assert.equal(v.renderParts.get(PREFIX+'29__0_1_1_145_30').material.name,'blue');
results.push({check:'fifteen reviewed fasteners use instance steel overrides while shared screw definitions and the central shock mounting screw stay blue',status:'pass'});
let blueScrews=0,steelScrews=0,blueShankVertices=0,neutralHandSeats=0;
const blueScrewDefinitions=new Set();
for(const p of v.renderParts.values()){
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
 p.material.onBeforeCompile(shader,{});
 const screw=/^010-/.test(p.source.name),blue=screw&&p.material.name==='blue';
 assert.equal(shader.uniforms.finishWholeBlue.value,blue?1:0,p.source.id);
 // Both steel color and roughness overrides must respect the per-instance gate.
 assert.equal((shader.fragmentShader.match(/finishEnabled>\.5 && finishWholeBlue<\.5 && abs\(vFinishRole-2\.0\)<\.2/g)||[]).length,2);
 const roles=p.mesh.geometry.getAttribute('sourceFinishRole');
 if(blue){
  blueScrews++;blueScrewDefinitions.add(p.source.definitionId);
  assert.ok(roles,'Every source screw carries its reviewed face annotation');
  for(let i=0;i<roles.count;i++){
   const role=roles.getX(i);
   assert.ok([0,1,2].includes(role),'No other face color may override a blued screw');
   if(role===2)blueShankVertices++;
  }
 }else if(screw&&p.material.name==='steel')steelScrews++;
 else if(p.material.name==='blue'&&roles){
  for(let i=0;i<roles.count;i++)if(roles.getX(i)===2)neutralHandSeats++;
 }
}
assert.equal(blueScrewDefinitions.size,8);assert.ok(steelScrews>=29);
assert.ok(blueShankVertices>0&&neutralHandSeats>0);
// Twelve screw definitions currently occur only at steel-override locations;
// their default finish must still cover the whole screw at any blue placement.
for(const n of [9,107,122,123,136,138,139,166,168,169,170,180,181,189,191,192,201,226,253,255]){
 const material=createMaterial('010-screw',`d_0_1_1_${n}`);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
 material.onBeforeCompile(shader,{});
 assert.equal(shader.uniforms.finishWholeBlue.value,1);
 material.dispose();
}
results.push({check:'all blued screw surfaces bypass neutral CAD color/roughness while twenty-nine steel screws and neutral hand seats retain their finishes',status:'pass',blueScrews,definitions:blueScrewDefinitions.size,blueShankVertices,neutralHandSeats});
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
results.push({check:'authored surface and optical hooks retain physical lighting and reuse shader programs',status:'pass',scope:'actual CPU controller/hook state; not GLSL compile proof'});
// Selection hierarchy must never rewrite physical materials or make context absent.
const {GROUPS:emphasisGroups,inMembers:emphasisMember}=load('explorer/src/experience/catalog.ts');
const {finishFor:emphasisFinish,EMPHASIS}=load('explorer/src/viewer/materials.ts');
const {uncoverHost:emphasisCover}=load('explorer/src/experience/explosion.ts');
const {focusRole,focusCover}=load('explorer/src/experience/emphasis.ts');
for(const group of emphasisGroups) {
 for(const reveal of [0,.49,.51,1]) {
  v.state={...initialState,group:group.id,reveal};v.retarget();v.applyPose(10);v.retargetVisibility();
  for(const p of v.renderParts.values()) {
   if(!belongs(p.source.id,ROOT)||p.source.id===PREFIX+'66')continue;
   const member=emphasisMember(p.source.id,group.members);
   const role=focusRole(p.source.id,p.source.definitionId,group);
   assert.equal(p.material.userData.emphasisRole,role);
   assert.deepEqual([...p.material.userData.emphasis.value.toArray()],[...EMPHASIS[role]]);
   const finish=emphasisFinish(p.source.name,p.source.definitionId,p.source.id);
   assert.equal(p.material.color.getHex(),finish.color);
   assert.equal(p.material.metalness,finish.metalness);assert.equal(p.material.roughness,finish.roughness);
   assert.equal(p.material.opacity,1);assert.equal(p.material.depthWrite,true);
   if((member||!emphasisCover(p.source.id,group.id)) && !(focusCover(p.source.id,group)&&reveal>.8))assert.ok(p.mesh.visible,`${group.id}: unexplained missing ${p.source.id}`);
  }
 }
}
const windingFocus=emphasisGroups.find(g=>g.id==='winding');
assert.equal(focusRole(PREFIX+'53','d_0_1_1_193',windingFocus),'context','Keyless setting spring must remain readable');
assert.equal(focusRole(PREFIX+'54__0_1_1_194_1','d_0_1_1_195',windingFocus),'support','Plate must not compete with keyless work');
assert.ok(EMPHASIS.context[0] >= EMPHASIS.support[0]*2);
assert.ok(EMPHASIS.member[0] >= EMPHASIS.surrounding[0]*3);
assert.equal(emphasisCover(PREFIX+'37__0_1_1_182_1','shock'),true,'Rear display inherits barrel-cover occlusion');
v.state={...initialState,group:'regulation',reveal:1};v.retarget();v.applyPose(.14);
const bridgeCut=v.renderParts.get(PREFIX+'59__0_1_1_221_1');
assert.ok(bridgeCut.cutaway.level>0&&bridgeCut.cutaway.level<1);
assert.ok(bridgeCut.mesh.userData.cutawayFading);
v.state={...initialState,group:'winding',reveal:1};v.retarget();v.applyPose(.28);v.retargetVisibility();
assert.equal(bridgeCut.cutaway.level,1);assert.equal(bridgeCut.material.opacity,1);assert.ok(bridgeCut.material.depthWrite);
v.state={...initialState,group:'regulation',reveal:1};v.retarget();v.applyPose(1);v.retargetVisibility();
for(const suffix of ['59__0_1_1_221_1','34','35'])assert.equal(v.renderParts.get(PREFIX+suffix).mesh.visible,false);
results.push({check:'keyless springs outrank supporting plate; lifted children inherit cover visibility; balance bridge and fasteners fade together and reverse without residual transparency',status:'pass'});
v.state={...initialState,group:'winding',part:PREFIX+'53'};v.retarget();
const focusedSpring=v.renderParts.get(PREFIX+'53');
assert.equal(focusedSpring.material.userData.emphasisRole,'selected');
assert.equal(focusedSpring.material.userData.emphasis.value.y,EMPHASIS.selected[1]);
const emphasisShader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
focusedSpring.material.onBeforeCompile(emphasisShader,{});
assert.equal(emphasisShader.uniforms.emphasis,focusedSpring.material.userData.emphasis);
assert.match(emphasisShader.fragmentShader,/outgoingLight = outgoingLight \* emphasis.x/);
assert.ok(emphasisShader.fragmentShader.indexOf('float focusRim')>emphasisShader.fragmentShader.indexOf('#include <lights_fragment_end>'));
v.state={...initialState};v.retarget();v.applyPose(10);v.retargetVisibility();
for(const p of v.renderParts.values()){
 assert.equal(p.material.userData.emphasisRole,'whole');
 assert.equal(p.material.userData.emphasis.value.x,1);assert.equal(p.material.userData.emphasis.value.y,0);
}
results.push({check:'all six emphasis groups preserve physical finishes, opaque depth, selected members and surrounding context across reveal threshold and reset',status:'pass'});
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
const preparedFetch=async url=>url==='/models/assembly-manifest.json'?{ok:true,json:async()=>({instances:parts})}:url==='/models/asset-paths.json'?{ok:true,json:async()=>assetPaths}:modelFetch(url);
const loadRace=sourceModules({loader:DeferredLoader,fetchImpl:preparedFetch});const {MovementViewer:RaceViewer}=loadRace('explorer/src/viewer/MovementViewer.ts');const race=Object.create(RaceViewer.prototype);
Object.assign(race,{camera:new THREE.PerspectiveCamera(),renderParts:new Map(),loadGeneration:0,dead:false,error:'',ready:false,loadStart:performance.now(),paths:{overview:'fixture.glb'},emit(){},ingest(){},homeCamera(){},retarget(){},disposeObject(){}});
const obsolete=race.load();while(pending.length<1)await Promise.resolve();const current=race.load();while(pending.length<2)await Promise.resolve();pending[1].resolve({scene:{}});await current;assert.equal(race.ready,false);assert.equal(race.awaitingFirstFrame,true);assert.equal(race.error,'');pending[0].progress?.({loaded:25,total:100});assert.equal(race.status,'','Obsolete progress must not overwrite completed loading status');pending[0].reject(Error('Obsolete fixture request'));await obsolete;assert.equal(race.error,'','An obsolete failure must not overwrite newer successful state');
results.push({check:'obsolete load progress/failure cannot overwrite newer successful load',status:'pass'});
const disposedStale=[];race.disposeObject=scene=>disposedStale.push(scene);
const staleSuccess=race.load();while(pending.length<3)await Promise.resolve();const newerSuccess=race.load();while(pending.length<4)await Promise.resolve();
pending[3].resolve({scene:{id:'current-scene'}});await newerSuccess;
const staleScene={id:'stale-scene'};pending[2].resolve({scene:staleScene});await staleSuccess;
assert.deepEqual(disposedStale,[staleScene]);assert.equal(race.ready,false);assert.equal(race.awaitingFirstFrame,true);assert.equal(race.error,'');
results.push({check:'obsolete successful geometry is disposed after newer load succeeds',status:'pass'});
const metadataPending=[];let immediateLoads=0;
class ImmediateLoader{setMeshoptDecoder(){return this}async loadAsync(){immediateLoads++;return {scene:{}}}}
const metadataModules=sourceModules({loader:ImmediateLoader,fetchImpl:async url=>{
 if(url==='/models/assembly-manifest.json')return new Promise(resolve=>metadataPending.push(resolve));
 if(url==='/models/asset-paths.json')return {ok:true,json:async()=>assetPaths};
 return modelFetch(url);
}});
const {MovementViewer:MetadataViewer}=metadataModules('explorer/src/viewer/MovementViewer.ts');
const metadataRace=Object.create(MetadataViewer.prototype);
Object.assign(metadataRace,{camera:new THREE.PerspectiveCamera(),renderParts:new Map(),loadGeneration:0,dead:false,error:'',ready:false,loadStart:performance.now(),paths:{overview:'fixture.glb'},emit(){},ingest(){},homeCamera(){},retarget(){},disposeObject(){}});
const oldMetadata=metadataRace.load(),newMetadata=metadataRace.load();
assert.equal(metadataPending.length,2);
const latestParts=[...parts];metadataPending[1]({ok:true,json:async()=>({instances:latestParts})});
await newMetadata;assert.equal(metadataRace.ready,false);assert.equal(metadataRace.awaitingFirstFrame,true);assert.equal(metadataRace.parts,latestParts);
metadataPending[0]({ok:true,json:async()=>({instances:[{id:'obsolete'}]})});await oldMetadata;
assert.equal(metadataRace.parts,latestParts);assert.equal(immediateLoads,1,'Obsolete metadata must not launch geometry');
assert.equal(metadataRace.paths.overview,assetPaths.overview);
assert.equal(metadataRace.sourceSurfaces.size,sidecarReport.definitions.length);assert.equal(metadataRace.error,'');
results.push({check:'late metadata cannot overwrite current parts/paths or launch geometry; current preparation verifies actual annotation and diamond assets',status:'pass'});

// Protected prepared assets must fail before either temporary scene is ingested.
// Read the real hashed sidecar/STL through modelFetch; only GLTF decoding and
// scene ingestion are facades here (actual decoded geometry is checked above).
for(const failingAsset of ['annotations','diamond']){
 let failPrepared=true;const temporaryScenes=[],ingestedScenes=[],releasedScenes=[];
 class PreparedLoader{setMeshoptDecoder(){return this}async loadAsync(){const scene=new THREE.Group();scene.name='temporary-overview';const mesh=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial());scene.add(mesh);scene.userData.disposals={geometry:0,material:0};mesh.geometry.addEventListener('dispose',()=>scene.userData.disposals.geometry++);mesh.material.addEventListener('dispose',()=>scene.userData.disposals.material++);temporaryScenes.push(scene);return {scene}}}
 const preparedModules=sourceModules({loader:PreparedLoader,fetchImpl:async url=>{
  if(failPrepared&&((failingAsset==='annotations'&&url==='/models/finish-surfaces.json')||(failingAsset==='diamond'&&url.includes('/models/diamond-'))))return {ok:false};
  return preparedFetch(url);
 }});
 const {MovementViewer:PreparedViewer}=preparedModules('explorer/src/viewer/MovementViewer.ts');
 const prepared=Object.create(PreparedViewer.prototype);
 Object.assign(prepared,{camera:new THREE.PerspectiveCamera(),renderParts:new Map(),loadGeneration:0,selectionGeneration:0,dead:false,error:'',ready:false,loadStart:performance.now(),paths:{...assetPaths},controls:{enabled:false},emit(){},ingest(scene){ingestedScenes.push(scene)},homeCamera(){},retarget(){},disposeObject(scene){releasedScenes.push(scene);Viewer.prototype.disposeObject.call(this,scene)}});
 await prepared.load();
 assert.equal(prepared.loadStage,'error',failingAsset+' failure needs a retry state');assert.equal(prepared.ready,false);assert.equal(prepared.awaitingFirstFrame,false);assert.equal(prepared.contentPrepared,false);assert.equal(prepared.controls.enabled,false);assert.ok(prepared.error);
 assert.equal(ingestedScenes.length,0,'Do not ingest a partial scene after '+failingAsset+' failure');assert.equal(prepared.renderParts.size,0);
 assert.equal(releasedScenes.filter(scene=>scene===temporaryScenes[0]).length,1,'Release temporary overview once after '+failingAsset+' failure');
 assert.deepEqual(temporaryScenes[0].userData.disposals,{geometry:1,material:1});
 failPrepared=false;await prepared.load();
 assert.equal(prepared.error,'');assert.equal(prepared.ready,false,'Retry must still wait for its first complete frame');assert.equal(prepared.awaitingFirstFrame,true);assert.equal(prepared.contentPrepared,true);
 assert.equal(prepared.sourceSurfaces.size,sidecarReport.definitions.length);assert.equal(ingestedScenes.length,2);assert.equal(ingestedScenes[0],temporaryScenes[1]);
 assert.ok(ingestedScenes[1].children.some(mesh=>mesh.userData.sourceRecovery==='maker-component-stl'),'Retry must include the verified maker diamond');
 for(const scene of ingestedScenes)Viewer.prototype.disposeObject.call(prepared,scene);
 results.push({check:failingAsset+' preparation failure preserves an empty scene, disposes temporary geometry and retries with all annotations and recovered diamond',status:'pass'});
}

// A request may become obsolete after geometry and annotations have finished,
// while its diamond fetch is pending. Both temporary scenes remain request-owned.
let delayedDiamondResponse,diamondRequests=0;
const diamondRaceScenes=[],diamondRaceReleased=[],diamondRaceIngested=[];
class DiamondRaceLoader{setMeshoptDecoder(){return this}async loadAsync(){const scene=new THREE.Group();diamondRaceScenes.push(scene);return {scene}}}
const diamondRaceModules=sourceModules({loader:DiamondRaceLoader,fetchImpl:async url=>{
 if(url.includes('/models/diamond-')&&diamondRequests++===0)return new Promise(resolve=>{delayedDiamondResponse=resolve});
 return preparedFetch(url);
}});
const {MovementViewer:DiamondRaceViewer}=diamondRaceModules('explorer/src/viewer/MovementViewer.ts');
const diamondRace=Object.create(DiamondRaceViewer.prototype);
Object.assign(diamondRace,{camera:new THREE.PerspectiveCamera(),renderParts:new Map(),loadGeneration:0,selectionGeneration:0,dead:false,error:'',ready:false,paths:{...assetPaths},emit(){},ingest(scene){diamondRaceIngested.push(scene)},homeCamera(){},retarget(){},disposeObject(scene){diamondRaceReleased.push(scene);Viewer.prototype.disposeObject.call(this,scene)}});
const oldDiamondLoad=diamondRace.load();
while(!delayedDiamondResponse)await new Promise(setImmediate);
await diamondRace.load();const preparedAnnotations=diamondRace.sourceSurfaces;
assert.equal(diamondRaceIngested.length,2);assert.equal(diamondRaceIngested[0],diamondRaceScenes[1]);
delayedDiamondResponse(await modelFetch('/models/diamond-c74ee2731a1f.stl'));await oldDiamondLoad;
assert.equal(diamondRaceIngested.length,2,'Late recovered geometry must not enter the new scene');assert.equal(diamondRaceReleased.length,2);assert.equal(diamondRaceReleased[0],diamondRaceScenes[0]);
assert.ok(diamondRaceReleased[1].children.some(mesh=>mesh.userData.sourceRecovery==='maker-component-stl'));
assert.equal(diamondRace.sourceSurfaces,preparedAnnotations);assert.equal(diamondRace.error,'');assert.equal(diamondRace.contentPrepared,true);assert.equal(diamondRace.awaitingFirstFrame,true);
for(const scene of diamondRaceIngested)Viewer.prototype.disposeObject.call(diamondRace,scene);
results.push({check:'a stale diamond completion disposes both request-owned scenes without replacing newer preparation or entering the scene',status:'pass'});

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
const {transferProgress}=load('explorer/src/experience/loading.ts');
assert.equal(transferProgress(50,100),50);assert.equal(transferProgress(150,100),100);
for(const total of [0,NaN,Infinity,-1])assert.equal(transferProgress(50,total),null);
assert.equal(transferProgress(NaN,100),null);
results.push({check:'unknown or invalid transfer totals remain indeterminate; measurable transfer is bounded',status:'pass'});

const tickField=viewerClass.members.find(n=>ts.isPropertyDeclaration(n)&&n.name.getText(viewerSource)==='tick');
const tickModule={exports:{}};
const tickCode=ts.transpileModule('module.exports=function(){return '+tickField.initializer.getText(viewerSource)+';};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(tickCode,{module:tickModule,THREE,performance,console,requestAnimationFrame:()=>1,document:{hidden:false}});
const renderOrder=[];
const frameFixture={dead:false,contextLost:false,lastFrame:0,lastNotify:1e9,benchmark:null,needsRender:true,presentationMoving:false,travel:null,ready:false,awaitingFirstFrame:true,loadStart:performance.now(),frameIntervals:[],renderCount:0,
 state:{...initialState,phase:'whole'},camera:new THREE.PerspectiveCamera(),scene:{},controls:{enabled:false,target:new THREE.Vector3(),update:()=>false},
 renderer:{render(){renderOrder.push('beauty')},info:{render:{triangles:1,calls:1}}},surfaceOcclusion:{render(){renderOrder.push('surface')}},
 applyPose:()=>false,retargetVisibility(){},ensureFramingRange(){},emit(){renderOrder.push(this.ready?'ready':'pending')}};
const tick=tickModule.exports.call(frameFixture);
assert.equal(frameFixture.ready,false);tick(100);
assert.deepEqual(renderOrder,['beauty','surface','ready']);assert.equal(frameFixture.ready,true);assert.equal(frameFixture.loadStage,'ready');assert.equal(frameFixture.controls.enabled,true);
frameFixture.needsRender=false;frameFixture.presentationMoving=true;renderOrder.length=0;tick(108);
assert.deepEqual(renderOrder,['beauty','surface'],'The terminal pose sample must be painted even when moving becomes false');
renderOrder.length=0;tick(112);assert.equal(renderOrder.length,0,'After the terminal sample the viewer must be idle');
frameFixture.ready=false;frameFixture.awaitingFirstFrame=true;frameFixture.needsRender=true;frameFixture.renderer.render=()=>{throw Error('No valid frame')};
assert.doesNotThrow(()=>tick(116));assert.equal(frameFixture.ready,false);assert.equal(frameFixture.awaitingFirstFrame,false);assert.equal(frameFixture.loadStage,'error');assert.equal(frameFixture.controls.enabled,false);assert.ok(frameFixture.error);assert.equal(frameFixture.travel,null);assert.equal(frameFixture.presentationMoving,false);
let errorFrameAttempts=0;frameFixture.renderer.render=()=>{errorFrameAttempts++};tick(120);assert.equal(errorFrameAttempts,0,'A failed renderer must stay idle until retry');
// Re-enter preparation as load() does, then require both passes before ready.
frameFixture.loadStage='preparing';frameFixture.error='';frameFixture.awaitingFirstFrame=true;frameFixture.needsRender=true;tick(124);assert.equal(frameFixture.ready,true);assert.equal(frameFixture.loadStage,'ready');assert.equal(frameFixture.controls.enabled,true);
frameFixture.ready=false;frameFixture.awaitingFirstFrame=true;frameFixture.needsRender=true;frameFixture.surfaceOcclusion.render=()=>{throw Error('No valid contact frame')};tick(128);assert.equal(frameFixture.loadStage,'error');assert.equal(frameFixture.ready,false);assert.equal(frameFixture.controls.enabled,false);
frameFixture.surfaceOcclusion.render=()=>{};frameFixture.loadStage='preparing';frameFixture.error='';frameFixture.awaitingFirstFrame=true;frameFixture.needsRender=true;tick(132);assert.equal(frameFixture.ready,true);
frameFixture.renderer.render=()=>{};frameFixture.awaitingFirstFrame=false;frameFixture.ready=true;
frameFixture.camera.position.set(0,0,70);frameFixture.travel={position:new THREE.Vector3(0,0,-70),target:new THREE.Vector3()};
for(let i=1;i<=12;i++){tick(116+i*100);assert.ok(frameFixture.camera.position.distanceTo(frameFixture.controls.target)>69.999,'Side reversal must not cut through the movement');}
assert.equal(frameFixture.travel,null);assert.ok(frameFixture.camera.position.equals(new THREE.Vector3(0,0,-70)));
results.push({check:'readiness follows complete beauty/contact frame; beauty/contact failures expose a retry state and stop rendering until successful retry; camera side reversal keeps safe radius and settles exactly',status:'pass',scope:'actual frame callback with CPU renderer facade'});

// Exercise the actual frame callback with real OrbitControls: opposite faces
// must turn over without the sideways roll caused by independent up/view arcs.
const facadeControls=frameFixture.controls;
frameFixture.controls=new OrbitControls(frameFixture.camera,null);
frameFixture.syncOrbitUp=()=>Viewer.prototype.syncOrbitUp.call(frameFixture);
frameFixture.camera.position.set(.04,.06,1).normalize().multiplyScalar(70);
frameFixture.camera.up.set(0,1,0);frameFixture.syncOrbitUp();frameFixture.controls.update();
for(const sign of [-1,1]){
 const position=new THREE.Vector3(.04,.06,sign).normalize().multiplyScalar(70);
 const up=new THREE.Vector3(0,sign,0);
 const right=new THREE.Vector3(1,0,0).applyQuaternion(frameFixture.camera.quaternion);
 const previous=frameFixture.camera.quaternion.clone();let arc=0,maxRightDrift=0;
 frameFixture.travel={position,target:new THREE.Vector3(),up,duration:1.05};
 for(let i=0;i<110;i++){
  tick(frameFixture.lastFrame+10);
  arc+=previous.angleTo(frameFixture.camera.quaternion);previous.copy(frameFixture.camera.quaternion);
  maxRightDrift=Math.max(maxRightDrift,right.angleTo(new THREE.Vector3(1,0,0).applyQuaternion(frameFixture.camera.quaternion)));
  assert.ok(Math.abs(frameFixture.camera.position.length()-70)<1e-8,'Turnover must retain its radius');
 }
 assert.ok(arc>3&&arc<Math.PI+.01,'Turnover must have one half-turn of angular travel');
 assert.ok(maxRightDrift<.1,'Turnover must not tumble sideways');
 assert.equal(frameFixture.travel,null);assert.ok(frameFixture.camera.position.distanceTo(position)<1e-9);assert.ok(frameFixture.camera.up.equals(up));
}
frameFixture.travel={position:new THREE.Vector3(0,0,-70),target:new THREE.Vector3(),up:new THREE.Vector3(0,-1,0),duration:1.05};
for(let i=0;i<40;i++)tick(frameFixture.lastFrame+10);
const interruptedPosition=frameFixture.camera.position.clone(),interruptedOrientation=frameFixture.camera.quaternion.clone();
frameFixture.travel={position:new THREE.Vector3(0,0,70),target:new THREE.Vector3(),up:new THREE.Vector3(0,1,0),duration:1.05};
tick(frameFixture.lastFrame);
assert.ok(frameFixture.camera.position.distanceTo(interruptedPosition)<1e-9);
assert.ok(frameFixture.camera.quaternion.angleTo(interruptedOrientation)<1e-7,'Reversal must begin at the displayed orientation');
frameFixture.reduced=true;tick(frameFixture.lastFrame+10);assert.equal(frameFixture.travel,null);assert.ok(frameFixture.camera.position.distanceTo(new THREE.Vector3(0,0,70))<1e-9);
frameFixture.reduced=false;frameFixture.controls=facadeControls;
results.push({check:'dial turnover keeps screen-right stable, follows one half-turn at safe radius, reverses continuously and respects reduced motion',status:'pass',scope:'actual frame callback and real OrbitControls'});

const framing=Object.create(Viewer.prototype);
Object.assign(framing,{parts,state:{...initialState},camera:new THREE.PerspectiveCamera(33,1,.05,2000),reduced:true,renderParts:new Map(),cameraUserOwned:false});
framing.controls=new OrbitControls(framing.camera,null);
for(const aspect of [1280/504,374/560,304/456,1920/864]) {
 framing.camera.aspect=aspect;framing.state={...initialState};framing.homeCamera(true);
 const center=framing.controls.target.clone(),position=framing.camera.position.clone(),radius=position.distanceTo(center);
 assert.ok(Number.isFinite(radius)&&radius>40);
 assert.ok(Math.abs(center.x)<1e-9 && Math.abs(center.y)<1e-9,'The central hand arbor is the movement framing anchor, independent of the stem');
 for(const side of ['front','back']) {
  framing.state={...initialState,presentation:'dials',side};framing.camera.up.set(.3,.4,.5).normalize();framing.frameDials();
  assert.ok(framing.controls.target.distanceTo(center)<1e-9,'All assembled presentations use the same center');
  assert.ok(Math.abs(framing.camera.position.distanceTo(center)-radius)<1e-9,'Both faces use the same scale even after a rolled camera');
  assert.equal(framing.camera.up.y,side==='front'?1:-1);
 }
 framing.state={...initialState};framing.fitPresentation();
 assert.ok(framing.camera.position.distanceTo(position)<1e-9,'Reassembly framing must equal the opening preset');
 framing.renderParts=v.renderParts;framing.homeCamera(true);
 assert.ok(framing.camera.position.distanceTo(position)<1e-9,'Optional catalog availability cannot change the default');
}
results.push({check:'assembled framing shares center/radius across both faces, ignores prior rolled up vectors and optional catalog, and reassembly returns to the opening preset at four aspects',status:'pass',scope:'actual framing methods with real OrbitControls and source metadata'});

const catalogFixture=Object.create(RaceViewer.prototype),externalParts=parts.filter(p=>!belongs(p.id,load('explorer/src/experience/catalog.ts').ROOT));
Object.assign(catalogFixture,{ready:true,dead:false,selectionGeneration:0,catalogLoaded:false,catalogPending:null,detailError:'',status:'',parts:externalParts,paths:{catalog:'fixture-catalog.glb'},state:{...initialState,phase:'whole'},history:[],saves:0,save(){this.saves++},emit(){},ingest(){},retarget(){},targetBounds:()=>new THREE.Box3(),disposeObject(){}});
const preserved=JSON.stringify(catalogFixture.state);
let idx=pending.length;const failedSelection=catalogFixture.select(externalParts[1].id);
assert.equal(JSON.stringify(catalogFixture.state),preserved);assert.equal(catalogFixture.saves,0);
pending[idx].reject(Error('Optional catalog unavailable'));await failedSelection;
assert.equal(JSON.stringify(catalogFixture.state),preserved);assert.equal(catalogFixture.catalogPending,null);assert.ok(catalogFixture.detailError);
idx=pending.length;const obsoleteSelection=catalogFixture.select(externalParts[1].id);
catalogFixture.patch({treatment:'function'});pending[idx].resolve({scene:{}});await obsoleteSelection;
assert.equal(catalogFixture.state.part,null);assert.equal('treatment' in catalogFixture.state,false);assert.equal(catalogFixture.saves,0);assert.equal(catalogFixture.catalogLoaded,true);
results.push({check:'optional catalog failure preserves pose/state/history; retry succeeds and intervening navigation cancels obsolete selection',status:'pass'});
// Background dismissal cancels successful, failing and retrying optional selections.
for (const fails of [false,true]) {
 catalogFixture.catalogLoaded=false;idx=pending.length;
 const pendingSelection=catalogFixture.select(externalParts[1].id);
 const stateBefore={...catalogFixture.state},savesBefore=catalogFixture.saves;
 catalogFixture.deselect();
 if(fails)pending[idx].reject(Error('Dismissed request'));else pending[idx].resolve({scene:{}});
 await pendingSelection;
 assert.equal(JSON.stringify(catalogFixture.state),JSON.stringify(stateBefore));assert.equal(catalogFixture.saves,savesBefore);
 assert.equal(catalogFixture.catalogRetry,undefined);assert.equal(catalogFixture.detailError,'');
}
results.push({check:'empty-space dismissal invalidates pending selection success/failure without adding history or stale retry',status:'pass'});
catalogFixture.catalogLoaded=false;idx=pending.length;const secondFailure=catalogFixture.select(externalParts[2].id);
pending[idx].reject(Error('Retry fixture'));await secondFailure;
idx=pending.length;const targetedRetry=catalogFixture.retryCatalog();pending[idx].resolve({scene:{}});await targetedRetry;
assert.equal(catalogFixture.state.part,externalParts[2].id);assert.equal(catalogFixture.saves,1);
catalogFixture.catalogLoaded=false;idx=pending.length;const disposedCatalog=catalogFixture.loadCatalog();catalogFixture.dead=true;
const disposedCatalogScenes=[];catalogFixture.disposeObject=o=>disposedCatalogScenes.push(o);const disposedScene={id:'disposed-catalog'};
pending[idx].resolve({scene:disposedScene});await disposedCatalog;assert.deepEqual(disposedCatalogScenes,[disposedScene]);
results.push({check:'catalog retry completes the original requested selection; a disposed viewer releases late catalog geometry',status:'pass'});

frameFixture.ready=true;frameFixture.state.part='fixture';frameFixture.cameraUserOwned=true;frameFixture.host={clientWidth:500,clientHeight:1000};
frameFixture.camera.aspect=2;frameFixture.camera.position.set(20,10,60);frameFixture.controls.target.set(0,0,0);
frameFixture.travel={position:new THREE.Vector3(0,0,-70),target:new THREE.Vector3(),fromPosition:new THREE.Vector3(0,0,70),fromTarget:new THREE.Vector3(),fromUp:new THREE.Vector3(1,0,0),up:frameFixture.camera.up.clone(),elapsed:.3,duration:.85};
frameFixture.renderer.setSize=()=>{};frameFixture.surfaceOcclusion.resize=()=>{};frameFixture.invalidate=()=>{frameFixture.needsRender=true};
Viewer.prototype.resize.call(frameFixture);const resizedPosition=frameFixture.camera.position.clone();
tick(frameFixture.lastFrame);assert.ok(frameFixture.camera.position.distanceTo(resizedPosition)<1e-10);
assert.ok(frameFixture.travel.fromPosition.equals(resizedPosition));assert.equal(frameFixture.travel.elapsed,0);
assert.ok(frameFixture.travel.fromUp.equals(frameFixture.camera.up),'Resize must rebase the displayed up vector along with position');
results.push({check:'resize during selected-part camera travel rebases from the resized displayed pose without a following-frame snap',status:'pass'});

const {partLabel,buildPartIndex,matchesPart}=load('explorer/src/experience/catalog.ts');
const searchIndex=buildPartIndex(parts);
assert.equal(new Set([...searchIndex.values()].map(p=>p.reference)).size,parts.length);
for(const p of parts){const entry=searchIndex.get(p.id);for(const query of [partLabel(p),p.name,p.id,p.sourceInstanceId,p.definitionId,entry.reference])assert.ok(matchesPart(entry.search,query),p.id+' must remain findable by '+query);}
for(const [definition,label]of [['142','Hour-wheel hub 1'],['188','Hour-wheel hub 2'],['184','Cannon-pinion arbor 2'],['152','Indicator fork underplate · Y'],['153','Indicator fork underplate · X'],['71','Crown guard']])assert.equal(partLabel(parts.find(p=>p.definitionId==='d_0_1_1_'+definition)),label);
assert.ok(parts.filter(p=>/Source component|Source assembly/.test(partLabel(p))).length===0);
const umlaut=parts.find(p=>p.name.includes('brücke'));assert.ok(matchesPart(searchIndex.get(umlaut.id).search,'brucke'));
assert.ok(![...searchIndex.values()].some(p=>matchesPart(p.search,'unmatched_xyz_789')));
results.push({check:'all source instances searchable by readable/source names and every stable ID; repeated instances have unique references; substring label collisions corrected',status:'pass',instances:parts.length});
for(const [geometry,digest]of geometryBefore)assert.equal(geometryDigest(geometry),digest,'Material creation, ingest, reveal and timing must preserve all decoded geometry bytes');
results.push({check:'surface materials and controller operations preserve decoded attributes and indices byte for byte',status:'pass',decodedGeometryObjects:geometryBefore.size});

// Real installed SSAOPass objects; only renderer operations are a CPU facade.
// This exercises render-target sequencing and disposal, not GLSL compilation or pixels.
const {SurfaceOcclusion}=load('explorer/src/viewer/SurfaceOcclusion.ts');
const aoScene=new THREE.Scene(),aoCamera=new THREE.PerspectiveCamera(33,1,.05,2000);
const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial());aoScene.add(line);
const fadingDial=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial());fadingDial.userData.dialFading=true;aoScene.add(fadingDial);
const fadingCover=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial());fadingCover.userData.cutawayFading=true;aoScene.add(fadingCover);
const ao=new SurfaceOcclusion(aoScene,aoCamera),pass=ao.pass;
assert.ok(pass instanceof SSAOPass);assert.ok(pass.ssaoMaterial.fragmentShader.includes('1.0 - 0.24 * occlusion'));
assert.equal(pass.kernelRadius,.4);
ao.resize(640.4,479.6);assert.equal(pass.normalRenderTarget.width,640);assert.equal(pass.blurRenderTarget.height,480);
aoCamera.far=700;aoCamera.aspect=.6;aoCamera.updateProjectionMatrix();
let target=null,clearAlpha=.3,clearColor=new THREE.Color(0x123456),clears=0;
const initialClear=clearColor.clone(),draws=[];
const renderer={autoClear:true,getRenderTarget(){return target},getClearColor(out){return out.copy(clearColor)},getClearAlpha(){return clearAlpha},setClearColor(value,alpha){clearColor.set(value);if(alpha!==undefined)clearAlpha=alpha},setClearAlpha(value){clearAlpha=value},setRenderTarget(value){target=value},clear(){clears++},render(object){
 if(object===aoScene){assert.equal(line.visible,false);assert.equal(fadingDial.visible,false,'Fading dials must not cast solid contact silhouettes');assert.equal(fadingCover.visible,false,'Cutaway covers must not cast solid contact silhouettes');assert.equal(aoScene.overrideMaterial,pass.normalMaterial)}
 draws.push({target,material:object===aoScene?aoScene.overrideMaterial:object.material});
}};
ao.render(renderer);
assert.equal(fadingDial.visible,true,'Contact pass must restore fading dial beauty visibility');
assert.deepEqual(draws.map(d=>d.target),[pass.normalRenderTarget,pass.ssaoRenderTarget,pass.blurRenderTarget,null]);
assert.deepEqual(draws.map(d=>d.material),[pass.normalMaterial,pass.ssaoMaterial,pass.blurMaterial,pass.copyMaterial]);
assert.equal(clears,1);assert.equal(target,null);assert.equal(renderer.autoClear,true);assert.equal(clearAlpha,.3);assert.ok(clearColor.equals(initialClear));assert.equal(line.visible,true);assert.equal(aoScene.overrideMaterial,null);
assert.equal(pass.ssaoMaterial.uniforms.cameraFar.value,700);assert.equal(pass.ssaoMaterial.uniforms.cameraNear.value,.05);assert.ok(pass.ssaoMaterial.uniforms.cameraProjectionMatrix.value.equals(aoCamera.projectionMatrix));assert.ok(pass.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.equals(aoCamera.projectionMatrixInverse));
assert.equal(pass.ssaoMaterial.uniforms.minDistance.value,.035/(700-.05));assert.equal(pass.ssaoMaterial.uniforms.maxDistance.value,.65/(700-.05));
assert.equal(pass.copyMaterial.uniforms.tDiffuse.value,pass.blurRenderTarget.texture);assert.equal(pass.copyMaterial.blending,THREE.CustomBlending);
const normalRender=renderer.render;
renderer.render=()=>{throw Error('Injected normal-pass failure')};
assert.throws(()=>ao.render(renderer),/Injected normal-pass failure/);
assert.equal(fadingDial.visible,true,'Failed contact pass must restore fading dial beauty visibility');
assert.equal(target,null);assert.equal(renderer.autoClear,true);assert.equal(clearAlpha,.3);assert.ok(clearColor.equals(initialClear));assert.equal(line.visible,true);assert.equal(aoScene.overrideMaterial,null);
line.visible=false;renderer.render=normalRender;ao.render(renderer);assert.equal(line.visible,false,'A failed pass must clear its visibility cache before retry');line.visible=true;
results.push({check:'contact-pass exceptions restore render target, clear state, override material and line visibility before retry',status:'pass'});
fadingDial.visible=false;ao.render(renderer);assert.equal(fadingDial.visible,false);fadingDial.geometry.dispose();fadingDial.material.dispose();aoScene.remove(fadingDial);
results.push({check:'fading dials are excluded from solid contact depth and their original beauty visibility survives successful and failed passes',status:'pass'});
const resources=[pass.normalRenderTarget,pass.ssaoRenderTarget,pass.blurRenderTarget,pass.normalMaterial,pass.blurMaterial,pass.copyMaterial,pass.depthRenderMaterial,pass.noiseTexture,pass.ssaoMaterial,pass._fsQuad._mesh.geometry];
const disposals=new Map(resources.map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>disposals.set(r,disposals.get(r)+1));
ao.dispose();for(const count of disposals.values())assert.equal(count,1,'Every contact-pass owned resource must be disposed once');line.geometry.dispose();line.material.dispose();
results.push({check:'contact pass refreshes camera/depth scale, multiplies after beauty, restores render state and disposes owned resources',status:'pass',resourcesDisposed:resources.length,scope:'real SSAOPass with CPU renderer facade; not WebGL proof'});
// New recovery independently verifies original STL floats and original placement.
const recovery=sourceModules({fetchImpl:modelFetch})('explorer/src/viewer/RecoveredDiamond.ts');
const recovered=await recovery.loadRecoveredDiamond(parts);
const gem=recovered.children[0],stl=fs.readFileSync(path.join(modelsDir,'diamond-c74ee2731a1f.stl'));
assert.equal(gem.geometry.attributes.position.count,1640*3);
for(let face=0;face<1640;face++)for(let vertex=0;vertex<3;vertex++)for(let axis=0;axis<3;axis++)
 assert.equal(gem.geometry.attributes.position.getComponent(face*3+vertex,axis),stl.readFloatLE(84+face*50+12+vertex*12+axis*4));
const sourceGem=parts.find(p=>p.id===recovery.DIAMOND_ID);
assert.equal(sourceGem.triangles,0);assert.equal(sourceGem.boundsWorldMm,null);
const oldCount=v.renderParts.size;v.ingest(recovered);assert.equal(v.renderParts.size,oldCount+1);
const placed=v.renderParts.get(recovery.DIAMOND_ID);
assert.ok(placed.assembled.equals(new THREE.Matrix4().set(...sourceGem.worldTransform.flat())));
assert.ok(placed.center.distanceTo(new THREE.Vector3(0,-9.999833239,-5.220654917))<.01);
v.state={...initialState};v.retarget();v.applyPose(0);assert.equal(placed.mesh.visible,true);assert.equal(placed.material.transmission,.92);
v.state={...initialState,part:recovery.DIAMOND_ID,isolated:true};v.retarget();assert.equal(placed.mesh.visible,true);
v.patch({treatment:'function'});assert.equal(placed.material.transmission,.92);
v.state={...initialState};v.retarget();v.applyPose(0);assert.equal(v.assemblyError(),0);
await assert.rejects(()=>recovery.loadRecoveredDiamond([]),/empty source record/);
const badRecovery=sourceModules({fetchImpl:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(84)})})('explorer/src/viewer/RecoveredDiamond.ts');
await assert.rejects(()=>badRecovery.loadRecoveredDiamond(parts),/integrity mismatch/);
results.push({check:'maker diamond STL vertices byte-exact, original empty record/matrix retained, placement, selection, optics, reassembly and corrupt recovery rejection',status:'pass'});
for(const [clamp,screw]of [[38,45],[39,44],[41,43]]){
 const c=parts.find(p=>p.id===PREFIX+clamp),s=parts.find(p=>p.id===PREFIX+screw);
 assert.equal(c.definitionId,'d_0_1_1_185');assert.equal(s.definitionId,'d_0_1_1_189');
 const hole=new THREE.Vector3(0,.6,0).applyMatrix4(new THREE.Matrix4().set(...c.worldTransform.flat()));
 assert.ok(Math.hypot(hole.x-s.worldTransform[0][3],hole.y-s.worldTransform[1][3])<1e-8);
 assert.equal(finishFor(s.name,s.definitionId,s.id).family,'steel');
}
assert.equal(finishFor('shared','d_0_1_1_189','unrelated-instance').family,'blue');
for(const n of [105,120])assert.equal(finishFor('cap',`d_0_1_1_${n}`).family,'warmPlate');
const leafDefs=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/generated/assembly-manifest.json'))).definitions.filter(d=>!d.isAssembly);
for(const d of leafDefs)assert.equal(finishFor(d.name,d.id).assignment,'source-definition',d.id+' must not use fallback');
results.push({check:'all 202 leaf definitions explicit; three steel screw axes coincide with clamp holes; shared definition remains blue; both warm cap identities fixed',status:'pass'});
// Redesign: exercise the actual source controller on all decoded assets, including recovered diamond.
const {makeSpread,spreadMember,SPREAD_EXCLUSIONS}=load('explorer/src/experience/spread.ts');
v.spread=makeSpread(v.renderParts.values());
const expectedSpread=parts.filter(p=>!p.isAssembly&&belongs(p.id,load('explorer/src/experience/catalog.ts').ROOT)&&![38,39,41,43,44,45,66].map(n=>PREFIX+n).includes(p.id));
assert.equal(expectedSpread.length,216);assert.equal(v.spread.size,216);
assert.deepEqual([...v.spread.keys()].sort(),expectedSpread.map(p=>p.id).sort());
assert.ok(v.spread.has(recovery.DIAMOND_ID));
for(const id of SPREAD_EXCLUSIONS)assert.ok(parts.some(p=>p.id===id)&&!v.spread.has(id));
const reverse=makeSpread([...v.renderParts.values()].reverse());
for(const [id,placement]of v.spread){
 assert.ok(reverse.get(id).offset.equals(placement.offset));assert.ok(reverse.get(id).rotation.equals(placement.rotation));
 assert.ok(Math.abs(placement.rotation.length()-1)<1e-12);
}
results.push({check:'216 unique active physical leaves, explicit seven exclusions, recovered diamond, deterministic layout independent of traversal/catalog order',status:'pass'});
v.state={...initialState,layout:'spread'};v.retarget();v.reduced=true;v.applyPose(0);v.root.updateMatrixWorld(true);
const spreadBoxes=[...v.renderParts.values()].filter(p=>spreadMember(p.source)).map(p=>({id:p.source.id,box:new THREE.Box3().setFromObject(p.mesh)}));
for(let i=0;i<spreadBoxes.length;i++)for(let j=i+1;j<spreadBoxes.length;j++){
 const a=spreadBoxes[i].box,b=spreadBoxes[j].box;
 assert.ok(a.max.x<=b.min.x || b.max.x<=a.min.x || a.max.y<=b.min.y || b.max.y<=a.min.y,`Spread bounds overlap: ${spreadBoxes[i].id}, ${spreadBoxes[j].id}`);
}
for(const p of v.renderParts.values()) {
 assert.ok(p.assembled.equals(new THREE.Matrix4().set(...p.source.worldTransform.flat())));
 assert.ok(Math.abs(p.mesh.matrix.determinant()-p.assembled.determinant())<1e-9);
}
// Verify perspective projection from the actual spread overview method at all requested aspect ratios.
const corners=box=>[0,1,2,3,4,5,6,7].map(i=>new THREE.Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z));
for(const aspect of [1280/480,1600/740,390/500,320/390,600/220]){
 v.spread=makeSpread(v.renderParts.values(),aspect);v.retarget();v.applyPose(0);v.root.updateMatrixWorld(true);
 const repeated=makeSpread([...v.renderParts.values()].reverse(),aspect);
 for(const [id,p]of v.spread)assert.ok(p.offset.equals(repeated.get(id).offset));
 const spreadBoxes=[...v.renderParts.values()].filter(p=>spreadMember(p.source)).map(p=>({id:p.source.id,box:new THREE.Box3().setFromObject(p.mesh)}));
 v.camera.aspect=aspect;v.frameSpread();v.camera.updateProjectionMatrix();v.camera.updateMatrixWorld(true);
 const projected=spreadBoxes.map(p=>({id:p.id,box:new THREE.Box3().setFromPoints(corners(p.box).map(c=>c.project(v.camera)))}));
 for(const {box,id}of projected)assert.ok(box.min.x>=-1&&box.max.x<=1&&box.min.y>=-1&&box.max.y<=1,'Spread clipped: '+id);
 for(let i=0;i<projected.length;i++)for(let j=i+1;j<projected.length;j++){
  const a=projected[i].box,b=projected[j].box;
  assert.ok(a.max.x<=b.min.x || b.max.x<=a.min.x || a.max.y<=b.min.y || b.max.y<=a.min.y,'Projected overlap: '+projected[i].id+' / '+projected[j].id);
 }
}
results.push({check:'all settled physical and projected bounding boxes are disjoint at five overview aspect ratios; rigid transforms preserve source scale/matrices',status:'pass'});
v.patch({separation:.9,partSpread:.7,reveal:1,group:'regulation'});
assert.equal(v.state.separation,0);assert.equal(v.state.partSpread,0);assert.equal(v.state.reveal,0);assert.equal(v.state.group,null);
const beforeSpreadMatrices=new Map([...v.renderParts].map(([id,p])=>[id,p.mesh.matrix.clone()]));v.applyPose(0);
for(const [id,m]of beforeSpreadMatrices)assert.ok(v.renderParts.get(id).mesh.matrix.equals(m));
results.push({check:'spread exclusively owns transforms and rejects competing reveal/separation/group patches',status:'pass'});
v.reduced=false;v.ready=true;v.history=[];
const groupIds=load('explorer/src/experience/catalog.ts').GROUPS.map(g=>g.id);
for(let i=0;i<24;i++) {
 v.allParts();v.applyPose(.05);v.group(groupIds[i%6]);v.applyPose(.04);
 v.patch({partSpread:.6,reveal:.6});v.applyPose(.03);v.allParts();v.applyPose(.02);
 await v.select(recovery.DIAMOND_ID);v.patch({isolated:true});v.applyPose(.01);v.back();
 v.reset();for(let n=0;n<260;n++)v.applyPose(1/60);v.retargetVisibility();
 assert.equal(v.assemblyError(),0);assert.equal([...v.renderParts.values()].filter(p=>p.mesh.visible).length,222);
 assert.equal(v.state.layout,'assembly');assert.equal(v.state.side,'back');assert.equal('treatment' in v.state,false);assert.equal(v.history.length,0);assert.equal(v.state.part,null);
}
for(const [geometry,digest]of geometryBefore)assert.equal(geometryDigest(geometry),digest);
results.push({check:'24 mixed interrupted spread/reveal/section/select/isolate/Back/reset cycles return exactly, restore all 222 leaves, preserve geometry bytes',status:'pass'});
v.reset();v.applyPose(1);v.cameraUserOwned=true;v.travel=null;
v.scrub({separation:.8});const probe=[...v.renderParts.values()].find(p=>p.target.length()>1);
const displayed=probe.offset.clone();v.applyPose(0);assert.ok(probe.offset.equals(displayed));
v.applyPose(.03);const reversed=probe.offset.clone();v.scrub({separation:.1});v.applyPose(0);assert.ok(probe.offset.equals(reversed));
v.applyPose(.075);assert.ok(probe.offset.equals(probe.target));assert.equal(v.travel,null,'Scrubbing cannot retake a manually owned camera');
v.allParts();v.applyPose(.3);const poseBefore=probe.mesh.matrix.clone();v.group('regulation');v.applyPose(0);assert.ok(Math.max(...probe.mesh.matrix.elements.map((n,i)=>Math.abs(n-poseBefore.elements[i])))<1e-10,'Retarget must start at displayed matrix');
v.reset();v.applyPose(.85);assert.equal(v.assemblyError(),0);assert.ok([...v.renderParts.values()].every(p=>!p.motion));
results.push({check:'direct slider reversal starts from displayed pose and settles in 75 ms; camera ownership survives; interrupted layout returns exactly within bounded 850 ms',status:'pass'});
// Source field handlers are extracted because CPU tests intentionally do not construct WebGL/DOM.
const handlers={};
for(const name of ['pointerDown','pointerMove','pointerCancel','pointerUp','pointerWheel']){
 const field=viewerClass.members.find(m=>m.name?.getText(viewerSource)===name),module={exports:{}};
 const code=ts.transpileModule('module.exports=function(){return '+field.initializer.getText(viewerSource)+';};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module,THREE});handlers[name]=module.exports;
}
let selections=0,dismissals=0;const gesture={pointers:new Set(),pointer:{x:0,y:0,id:-1,cancelled:false},renderer:{domElement:{getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}}},camera:v.camera,renderParts:new Map(),raycaster:{setFromCamera(){},intersectObjects(){return [{object:{userData:{partId:'fixture'}}}]}},select(){selections++},deselect(){dismissals++}};
for(const [name,handler]of Object.entries(handlers))gesture[name]=handler.call(gesture);
const event=(id=1,x=10,y=10,extra={})=>({pointerId:id,clientX:x,clientY:y,button:0,isPrimary:id===1,...extra});
const sequences=[
 [['pointerDown',event()],['pointerMove',event(1,40)],['pointerMove',event()],['pointerUp',event()]],
 [['pointerDown',event()],['pointerDown',event(2)],['pointerUp',event()],['pointerUp',event(2)]],
 [['pointerDown',event()],['pointerDown',event(2)],['pointerUp',event(2)],['pointerUp',event()]],
 [['pointerDown',event()],['pointerCancel',event()],['pointerUp',event()]],
 [['pointerDown',event()],['pointerWheel',{}],['pointerUp',event()]],
 [['pointerDown',event(1,1,10)],['pointerUp',event(1,-1,10)]],
 [['pointerDown',event(1,10,10,{button:2})],['pointerUp',event(1,10,10,{button:2})]],
 [['pointerDown',event(1,10,10,{button:1})],['pointerUp',event(1,10,10,{button:1})]],
];
for(const sequence of sequences){for(const [name,e]of sequence)gesture[name](e);assert.equal(selections,0);assert.equal(gesture.pointers.size,0);}
gesture.pointerDown(event());gesture.pointerUp(event());assert.equal(selections,1);
gesture.raycaster.intersectObjects=()=>[];
for(const sequence of sequences){for(const [name,e]of sequence)gesture[name](e);assert.equal(dismissals,0);}
gesture.pointerDown(event());gesture.pointerUp(event());assert.equal(dismissals,1);
results.push({check:'out-and-back drags, pinch release orders, cancellation, right/middle clicks reject selection; deliberate tap selects exactly once',status:'pass',scope:'actual event handlers with CPU raycast fixture; browser/touch-emulation checked separately'});

const {reviewExplosion}=await import('./review-explosion.mjs');
reviewExplosion({v,THREE,initialState,load,ROOT,parts,results});
const {reviewDials}=await import('./review-dials.mjs');
await reviewDials({v,Viewer,THREE,initialState,load,sourceModules,ROOT,parts,results});
console.log(JSON.stringify({scope:'CPU source/asset regression checks; not browser/WebGL/device QA',results},null,2));
