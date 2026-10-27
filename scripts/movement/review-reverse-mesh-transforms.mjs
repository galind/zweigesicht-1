/** Isolated diagnostic: production controller versus independent point transforms.
 * Candidate phases and packets exist only in this Node process, never in app files.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as THREE from '../../explorer/node_modules/three/build/three.module.js';
import { GLTFLoader } from '../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
import { MeshBVH } from '../../explorer/node_modules/three-mesh-bvh/build/index.module.js';
import { MOVEMENT, RunningMovement, movementPose } from '../../explorer/src/viewer/RunningMovement.ts';
import { wheelDisplayMatrix } from '../../explorer/src/viewer/WheelDisplayPose.ts';
const read = p => JSON.parse(fs.readFileSync(p));
const root = 'artifacts/reverse-mesh-diagnosis';
const source = read('artifacts/motion-works/source.json');
const diagnosis = read(root + '/comparison.json');
const manifest = read('explorer/public/models/assembly-manifest.json');
const overrides = new Map(read('assets/authored/wheel-display-poses.json').wheels.map(x => [x.leafId,x.localZDegrees]));
const paths = read('explorer/public/models/asset-paths.json');
const bytes = fs.readFileSync('explorer/public' + paths.overview);
const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const records = new Map(manifest.instances.map(x => [x.id,x]));
const meshes = new Map();
model.scene.traverse(mesh => {
 if (!mesh.isMesh) return;
 let parent=mesh;
 while(parent && !records.has(parent.name)) parent=parent.parent;
 if(!parent) return;
 const r=records.get(parent.name),m=new THREE.Mesh(mesh.geometry,mesh.material);
 m.matrixAutoUpdate=false;m.matrix.set(...r.worldTransform.flat());meshes.set(r.id,m);
});
const ratios={motion3:[-1,1620],cannon2:[1,540],hour2:[1,6480]};
const candidates=Object.entries(ratios).map(([name,ratio])=>({name,ratio,members:source.packets[name].members,pivot:source.leaves[source.packets[name].definitions[0]].worldTransform.slice(0,3).map(r=>r[3])}));
const numbers=[183,184,216,217,187,188];
const packet=n=>candidates.find(p=>p.members.includes(source.leaves[n].id));
const mesh=n=>meshes.get(source.leaves[n].id);
const raw=fs.readFileSync('explorer/public'+MOVEMENT.file);
const buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
const originalLength=MOVEMENT.packets.length;
const comparisons=[];let maxPointError=0,maxBaseError=0,maxPivotError=0;
const originalFileHashes=Object.fromEntries(['assets/authored/wheel-display-poses.json','explorer/public/models/movement-runtime.json','explorer/src/viewer/RunningMovement.ts','explorer/src/viewer/WheelDisplayPose.ts'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
function rotatePoint([x,y,z],degrees){const a=(degrees%360)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [c*x-s*y,s*x+c*y,z];}
function expectedPoint(n,point,localPhase,e){
 const s=source.leaves[n].worldTransform,p=rotatePoint(point,localPhase);
 const w=s.slice(0,3).map(row=>row[3]+row[0]*p[0]+row[1]*p[1]+row[2]*p[2]);
 const {pivot,ratio}=packet(n),v=rotatePoint([w[0]-pivot[0],w[1]-pivot[1],w[2]],e*ratio[0]/ratio[1]);
 return [v[0]+pivot[0],v[1]+pivot[1],v[2]];
}
const pose={};
function timeForEscape(e){
 const cycle=Math.floor((e+.1)/18);let lo=cycle/3,hi=(cycle+1)/3;
 for(let i=0;i<48;i++){const t=(lo+hi)/2;if(movementPose(t,pose).escape<e)lo=t;else hi=t;}
 const t=(lo+hi)/2;assert.ok(Math.abs(movementPose(t,pose).escape-e)<1e-6);return t;
}
MOVEMENT.packets.push(...candidates);
try {
 for(const label of ['source','display','isolated-phase']){
  const phase=new Map(numbers.map(n=>[n,label==='display'?(overrides.get(source.leaves[n].id)??0):0]));
  if(label==='isolated-phase'){
   const offset1=diagnosis.pairs[0].cases.find(c=>c.label===label).offsetWorldDegrees;
   const offset2=diagnosis.pairs[1].cases.find(c=>c.label===label).offsetWorldDegrees;
   // Keep motion works 3 fixed: transfer pair-one phase to complete cannon packet.
   for(const n of [183,184])phase.set(n,-3*offset1);
   for(const n of [187,188])phase.set(n,-offset2);
  }
  for(const [id,m] of meshes){
   const s=new THREE.Matrix4().set(...records.get(id).worldTransform.flat());
   const n=numbers.find(n=>source.leaves[n].id===id);
   if(n!==undefined)m.matrix.copy(s).multiply(new THREE.Matrix4().makeRotationZ(phase.get(n)*Math.PI/180));
   else m.matrix.copy(wheelDisplayMatrix(id,s)??s);
   if(n!==undefined && label==='display'){
    const p=wheelDisplayMatrix(id,s)??s;
    maxBaseError=Math.max(maxBaseError,...m.matrix.elements.map((v,k)=>Math.abs(v-p.elements[k])));
   }
  }
  const run=new RunningMovement(buffer,meshes);
  function apply(t){run.restore();run.clock.suspend();run.clock.seconds=t;run.update(0,true);return run.pose.escape;}
  for(const t of [0,.017,1/3,123.456,10800,43200,1e9]){
   const e=apply(t);
   for(const n of numbers){
    for(const point of [[0,0,0],[1,0,0],[0,1,0],[0,0,1],[.31,.17,.09],[-.5,.4,.7]]){
     const actual=new THREE.Vector3(...point).applyMatrix4(mesh(n).matrix).toArray();
     const expected=expectedPoint(n,point,phase.get(n),e);
     maxPointError=Math.max(maxPointError,...actual.map((v,k)=>Math.abs(v-expected[k])));
    }
    const pivot=packet(n).pivot,origin=new THREE.Vector3().applyMatrix4(mesh(n).matrix);
    maxPivotError=Math.max(maxPivotError,Math.hypot(origin.x-pivot[0],origin.y-pivot[1]));
   }
  }
  for(const pair of diagnosis.pairs){
   const [a,b]=pair.pair,report=pair.cases.find(c=>c.label===label),rows=[];
   const ma=mesh(a),mb=mesh(b),tree=ma.geometry.boundsTree??=new MeshBVH(ma.geometry,{indirect:true});
   for(const row of report.selectedSolids){
    const offset=label==='isolated-phase'&&a===183?3*report.offsetWorldDegrees:0;
    let fast=row.fastDegrees-offset;
    if(a===183){while(fast<0)fast+=1080;}
    else fast-=1440;
    const ratio=packet(a).ratio;
    const t=timeForEscape(fast*ratio[1]/ratio[0]),e=apply(t);
    const relative=ma.matrix.clone().invert().multiply(mb.matrix);
    const matrices=[ma.matrix.toArray(),mb.matrix.toArray()];
    rows.push({fastDegrees:row.fastDegrees,t,e,sourceCommonMm3:row.commonMm3,triangleIntersection:tree.intersectsGeometry(mb.geometry,relative),triangleGapMm:tree.closestPointToGeometry(mb.geometry,relative).distance,matrices});
   }
   comparisons.push({label,pair:pair.pair,rows});
  }
  run.dispose();
 }
} finally {MOVEMENT.packets.splice(originalLength);}
assert.ok(maxPointError<1e-10);assert.ok(maxBaseError<1e-12);assert.ok(maxPivotError<1e-10);
for(const [p,h] of Object.entries(originalFileHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),h);
const result={scope:'Source/display/isolated phase variants in memory; independent point rotation versus production RunningMovement; selected decoded-mesh witnesses',timesSeconds:[0,.017,1/3,123.456,10800,43200,1e9],maxPointErrorMm:maxPointError,maxDisplayBaseMatrixError:maxBaseError,maxPivotErrorMm:maxPivotError,overview:{path:paths.overview,sha256:crypto.createHash('sha256').update(bytes).digest('hex')},comparisons};
fs.writeFileSync(root+'/runtime.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,comparisons:comparisons.map(({label,pair,rows})=>({label,pair,samples:rows.length,intersections:rows.filter(x=>x.triangleIntersection).length}))},null,2));
