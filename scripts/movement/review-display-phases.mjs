/** Offline review only. Hypothetical phases/packets never enter application assets. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as THREE from '../../explorer/node_modules/three/build/three.module.js';
import {GLTFLoader} from '../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
import {MeshBVH} from '../../explorer/node_modules/three-mesh-bvh/build/index.module.js';
import {MOVEMENT,RunningMovement,movementPose} from '../../explorer/src/viewer/RunningMovement.ts';
import {wheelDisplayMatrix} from '../../explorer/src/viewer/WheelDisplayPose.ts';
const out='artifacts/display-phase-review';fs.mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p));
const records=read('explorer/public/models/assembly-manifest.json').instances;
const source=read('artifacts/motion-works/source.json');
const prior=read('assets/source-manifest/reverse-mesh-diagnosis.json');
const phases=prior.equivalentSimultaneousDiagnosticPacketPhases;
const require=createRequire(import.meta.url),ts=require('../../explorer/node_modules/typescript');
// Same offline TypeScript loading pattern as scripts/cad/review-runtime.mjs.
const cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const localRequire=id=>id==='three'?THREE:id.startsWith('.')?(fs.existsSync(path.resolve(path.dirname(file),id)+'.ts')?load(path.resolve(path.dirname(file),id)+'.ts'):require(path.resolve(path.dirname(file),id))):require(id);
 vm.runInNewContext(code,{module,exports:module.exports,require:localRequire},{filename:file});cache.set(file,module.exports);return module.exports;
}
const {handDisplayMatrix}=load('explorer/src/viewer/HandDisplayPose.ts');
const fitted=records.flatMap(r=>{
 if(r.isAssembly)return [];
 const m=handDisplayMatrix(r.id,new THREE.Matrix4().set(...r.worldTransform.flat()));
 return m?[{id:r.id,definition:r.definitionId,matrix:[0,1,2,3].map(i=>[0,1,2,3].map(j=>m.elements[j*4+i]))}]:[];
});
fs.writeFileSync(out+'/fitted-hands.json',JSON.stringify(fitted,null,2)+'\n');
if(process.argv[2]==='hands'){console.log({fittedHandOccurrences:fitted.length});process.exit(0);}
const paths=read('explorer/public/models/asset-paths.json'),meshes=new Map(),byId=new Map(records.map(r=>[r.id,r]));
for(const file of [paths.overview,paths.catalog]){
 const bytes=fs.readFileSync('explorer/public'+file);
 const model=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 model.scene.traverse(mesh=>{
  if(!mesh.isMesh)return;let p=mesh;while(p&&!byId.has(p.name))p=p.parent;
  if(!p||meshes.has(p.name))return;
  const m=new THREE.Mesh(mesh.geometry,mesh.material);m.matrixAutoUpdate=false;meshes.set(p.name,m);
 });
}
const ratios={cannon1:[-1,540],motion1:[1,1620],hour1:[-1,6480],motion2:[-1,1620],motion3:[-1,1620],cannon2:[1,540],hour2:[1,6480]};
const additions=Object.entries(ratios).map(([name,ratio])=>({name,ratio,members:source.packets[name].members,pivot:source.leaves[source.packets[name].definitions[0]].worldTransform.slice(0,3).map(r=>r[3])}));
const initialLength=MOVEMENT.packets.length;
MOVEMENT.packets.push(...additions);
for(const [id,m] of meshes){
 const r=byId.get(id),s=new THREE.Matrix4().set(...r.worldTransform.flat());
 m.matrix.copy(wheelDisplayMatrix(id,s)??s);
 const p=additions.find(p=>p.members.includes(id));
 if(p?.name==='cannon2'||p?.name==='hour2')m.matrix.copy(s).multiply(new THREE.Matrix4().makeRotationZ(phases[p.name+'WorldDegrees']*r.worldTransform[2][2]*Math.PI/180));
}
const bases=new Map([...meshes].map(([id,m])=>[id,m.matrix.clone()]));
const raw=fs.readFileSync('explorer/public'+MOVEMENT.file);
const run=new RunningMovement(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),meshes);
const pairs=[[137,210,10800],[211,141,43200],[210,213,10800],[183,216,10800],[217,187,43200]];
let maxRigidError=0,maxIndependentError=0;const results=[];
function applyEscape(e){ // Find a time at this accumulated phase; update the actual controller once.
 const cycle=Math.floor((e+.1)/18);let lo=cycle/3,hi=(cycle+1)/3;
 const pose={};
 for(let i=0;i<48;i++) {const t=(lo+hi)/2;if(movementPose(t,pose).escape<e)lo=t;else hi=t;}
 run.restore();run.clock.seconds=(lo+hi)/2;run.clock.suspend();run.update(0,true);
 assert.ok(Math.abs(run.pose.escape-e)<1e-5);return run.pose.escape;
}
try{
 for(const t of [0,.017,1/3,123.456,10800,43200,1e9]){
  run.restore();run.clock.seconds=t;run.clock.suspend();run.update(0,true);
  for(const p of additions){
   const theta=run.pose.escape*p.ratio[0]/p.ratio[1]*Math.PI/180,c=Math.cos(theta%(2*Math.PI)),s=Math.sin(theta%(2*Math.PI));
   for(const id of p.members)for(const v of [[0,0,0],[.31,.17,.09],[-.5,.4,.7]]){
    const b=new THREE.Vector3(...v).applyMatrix4(bases.get(id)),[x,y]=p.pivot;
    const expected=[x+c*(b.x-x)-s*(b.y-y),y+s*(b.x-x)+c*(b.y-y),b.z];
    const actual=new THREE.Vector3(...v).applyMatrix4(meshes.get(id).matrix).toArray();
    maxIndependentError=Math.max(maxIndependentError,...actual.map((v,i)=>Math.abs(v-expected[i])));
   }
   const [a,b]=p.members;if(b){
    const before=bases.get(a).clone().invert().multiply(bases.get(b)),after=meshes.get(a).matrix.clone().invert().multiply(meshes.get(b).matrix);
    maxRigidError=Math.max(maxRigidError,...after.elements.map((v,i)=>Math.abs(v-before.elements[i])));
   }
  }
 }
 for(const [a,b,period] of (process.argv[2]==='neighbors'?[]:pairs)){
  const ma=meshes.get(source.leaves[a].id),mb=meshes.get(source.leaves[b].id);
  const tree=ma.geometry.boundsTree??=new MeshBVH(ma.geometry,{indirect:true});
  mb.geometry.boundsTree??=new MeshBVH(mb.geometry,{indirect:true});
  // Whole-triangle witnesses complement the inherited dense original-profile
  // sweeps and continuous polygon bounds; they do not replace those bounds.
  const count=({137:6912,211:7680,210:6912,183:4608,217:6144})[a];let intersections=0,minGap=Infinity,worst=0,distanceSamples=0;
  console.log('Checking complete triangle period',a,b,count+1);
  // Full pair period sampled uniformly in shared accumulated escape angle.
  for(let i=0;i<=count;i++){
   const e=54*period*i/count;applyEscape(e);
   const relative=ma.matrix.clone().invert().multiply(mb.matrix);
   if(tree.intersectsGeometry(mb.geometry,relative))intersections++;
   if(i%Math.ceil(count/8)===0||i===count){
    const gap=tree.closestPointToGeometry(mb.geometry,relative).distance;distanceSamples++;
    if(gap<minGap){minGap=gap;worst=e;}
   }
  }
  const critical=[];
  if(a===183||a===217){
   const comparison=read('artifacts/reverse-mesh-diagnosis/comparison.json').pairs.find(p=>p.pair[0]===a);
   const witnesses=[...comparison.cases.find(c=>c.label==='isolated-phase').selectedSolids];
   if(a===217)witnesses.push(...read('artifacts/reverse-mesh-diagnosis/fine-bound.json').fineWholeSolidWitnesses);
   const p=additions.find(p=>p.members.includes(source.leaves[a].id)),phase=a===183?phases.cannon2WorldDegrees:0;
   for(const w of witnesses){
    let e=(w.fastDegrees-phase)*p.ratio[1]/p.ratio[0];const repeat=period*54;
    e=((e%repeat)+repeat)%repeat;applyEscape(e);
    const relative=ma.matrix.clone().invert().multiply(mb.matrix),gap=tree.closestPointToGeometry(mb.geometry,relative).distance;
    critical.push({sourceFastDegrees:w.fastDegrees,escapeDegrees:e,sourceSolidGapMm:w.gapMm,triangleIntersection:tree.intersectsGeometry(mb.geometry,relative),triangleGapMm:gap});
   }
  }
  results.push({pair:[a,b],periodSeconds:period,intersectionConfigurations:count+1,intersections,distanceSamples,minimumSampledTriangleGapMm:minGap,worstDistanceSampleEscapeDegrees:worst,sourceCriticalWitnesses:critical});
  console.log(results.at(-1));
 }
 if(process.argv[2]==='neighbors'){
  const review=read(out+'/neighbors.json'),rows=[];
  for(const p of review.pairs){
   const ids=p.ids.map(id=>id.replace(/@fitted$/,'')),[ma,mb]=ids.map(id=>meshes.get(id));
   if(!ma||!mb){rows.push({ids:p.ids,definitions:p.definitions,status:'missing-runtime-geometry'});continue;}
   const tree=ma.geometry.boundsTree??=new MeshBVH(ma.geometry,{indirect:true});
   mb.geometry.boundsTree??=new MeshBVH(mb.geometry,{indirect:true});
   const [num,den=1]=p.fastRatioToEscape.split('/').map(Number);
   const angles=p.constantRelativeTransform?[0]:[...new Set([0,p.fastAnglePeriodDegrees/3,2*p.fastAnglePeriodDegrees/3,p.worstOverlap?.fastDegrees??0])];
   const witnesses=[];
   for(const angle of angles){
    const e=applyEscape(angle*den/num);
    for(let i=0;i<2;i++)if(p.ids[i].endsWith('@fitted')){
     const f=fitted.find(f=>f.id===ids[i]);assert.ok(f);
     meshes.get(ids[i]).matrix.set(...f.matrix.flat());
    }
    const relative=ma.matrix.clone().invert().multiply(mb.matrix);
    witnesses.push({fastDegrees:angle,escapeDegrees:e,triangleIntersection:tree.intersectsGeometry(mb.geometry,relative)});
    for(let i=0;i<2;i++)if(p.ids[i].endsWith('@fitted'))meshes.get(ids[i]).matrix.copy(bases.get(ids[i]));
   }
   let baselineAuthoredTriangleIntersection=null,baselineSourceTriangleIntersection=null;
   if(witnesses.some(w=>w.triangleIntersection)){
    run.restore();
    for(const mode of ['source','authored']){
     for(let i=0;i<2;i++){
      const s=new THREE.Matrix4().set(...byId.get(ids[i]).worldTransform.flat());
      const fittedPose=p.ids[i].endsWith('@fitted')?fitted.find(f=>f.id===ids[i]):null;
      meshes.get(ids[i]).matrix.copy(fittedPose?new THREE.Matrix4().set(...fittedPose.matrix.flat()):mode==='source'?s:wheelDisplayMatrix(ids[i],s)??s);
     }
     const hit=tree.intersectsGeometry(mb.geometry,ma.matrix.clone().invert().multiply(mb.matrix));
     if(mode==='source')baselineSourceTriangleIntersection=hit;else baselineAuthoredTriangleIntersection=hit;
    }
    for(const id of ids)meshes.get(id).matrix.copy(bases.get(id));
   }
   rows.push({ids:p.ids,definitions:p.definitions,variant:p.variant,sourceStatus:p.status,maximumSourceCommonMm3:p.maximumCommonMm3??0,baselineSourceTriangleIntersection,baselineAuthoredTriangleIntersection,witnesses});
  }
  fs.writeFileSync(out+'/neighbor-runtime.json',JSON.stringify({scope:'Selected full decoded triangle witnesses for every candidate neighbor pair, production controller and fitted-hand matrices; surface intersection test, not swept-solid or containment certificate',pairs:rows},null,2)+'\n');
  console.log('neighbor runtime',rows.length,'pairs',rows.flatMap(r=>r.witnesses??[]).length,'poses');
 }
}finally{run.dispose();MOVEMENT.packets.splice(initialLength);}
assert.ok(maxRigidError<1e-9);assert.ok(maxIndependentError<1e-7);
if(process.argv[2]!=='neighbors')fs.writeFileSync(out+'/runtime.json',JSON.stringify({scope:'All seven candidate packets together in isolated production controller; full-period sampled decoded triangle meshes, not continuous bounds',fittedHandOccurrences:fitted.length,maxRigidError,maxIndependentPointErrorMm:maxIndependentError,pairs:results},null,2)+'\n');
