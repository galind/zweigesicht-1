import assert from "node:assert/strict";
import fs from "node:fs";
import {load} from "./test-loader.mjs";
const f=load("scripts/mechanics/harness/foundation.ts"), a=load("scripts/mechanics/harness/audit.ts");
const {parameters,manifest}=load("scripts/mechanics/harness/parameters.ts");
const {bases}=load("scripts/mechanics/harness/bases.ts");
const captures=JSON.parse(fs.readFileSync("artifacts/mechanics/running-movement/m2/renderer-captures.json"));
assert.equal(captures.length,11);
let maxError=0;
for(const c of captures){
 assert.ok(c.ready);assert.equal(c.meshes.length,364);assert.equal(c.lift,false);
 const pose=c.raw?f.evaluate(c.time,{kind:"sourceRest"},parameters):a.auditPose(c.time,c.audit.shaft,parameters);
 for(const m of c.meshes){
  const expected=f.compose(bases.find(b=>b.id===m.id),pose,c.raw?"raw":"fitted");
  m.matrix.forEach((x,i)=>{maxError=Math.max(maxError,Math.abs(x-expected[i]));});
  if(c.raw)assert.deepEqual(m.matrix,[...expected]);
  assert.deepEqual(m.matrix,m.worldMatrix);
 }
 for(const shaft of parameters.shafts.filter(s=>["balance","pallet","escape"].includes(s.id)))
  for(const id of shaft.members)assert.ok(c.meshes.find(m=>m.id===id)?.visible);
 for(const d of [116,200])for(const p of manifest.instances.filter(p=>p.definitionId===`d_0_1_1_${d}`))
  assert.ok(c.meshes.find(m=>m.id===p.id)?.visible);
}
assert.ok(maxError<1e-10);
for(const k of [3,5]) assert.deepEqual(captures[1].meshes,captures[k].meshes);
for(const shaft of ["balance","pallet","escape"]) for(const sign of [-1,1])
 assert.ok(captures.some(c=>!c.raw&&c.audit.shaft===shaft&&Math.sign(c.audit.angleRad)===sign));
console.log(JSON.stringify({captures:captures.length,maxError,repeatSeekAndRawReturn:"exact",allRigidContactLeavesAndSourceSpring:"visible",cameraScales:captures.filter((c,i)=>[0,6,10].includes(i)).map(c=>({preset:c.camera.preset,cssPixelsPerMmAtTarget:c.camera.stage[1]/(2*Math.tan(c.camera.fov*Math.PI/360)*Math.hypot(...c.camera.position.map((v,i)=>v-c.camera.target[i])))}))},null,2));
