import assert from "node:assert/strict";
import test from "node:test";
import { load, THREE } from "../scripts/mechanics/harness/test-loader.mjs";
const a=load("scripts/mechanics/harness/audit.ts");
const f=load("scripts/mechanics/harness/foundation.ts");
const {parameters:p}=load("scripts/mechanics/harness/parameters.ts");
const {bases}=load("scripts/mechanics/harness/bases.ts");

test("bounded sensitivity returns exact source deltas and never accepts a cycle",()=>{
  for(const shaft of ["balance","pallet","escape"]){
    for(const t of [0,8,16]) {
      const pose=a.auditPose(t,shaft,p);
      assert.equal(pose.connectedReady,false);
      for(const base of bases) assert.equal(f.compose(base,pose,"fitted"),base.fitted);
    }
    assert.equal(a.auditAngle(4,shaft),-a.auditAngle(12,shaft));
    assert.throws(()=>a.auditPose(16.001,shaft,p),/16 s/);
    assert.throws(()=>a.auditPose(-1,shaft,p),/Time/);
  }
  assert.throws(()=>a.auditPose(0,"bogus",p),/shaft/);
});
test("independent quaternion oracle covers every rigid member at dense positive and negative inspection phases",()=>{
  for(const shaft of ["balance","pallet","escape"]){
    const pivot=new THREE.Vector3(...p.shafts.find(s=>s.id===shaft).pivot.value);
    for(let k=0;k<=960;k++){
      const t=k/60,angle=a.auditAngle(t,shaft),pose=a.auditPose(t,shaft,p);
      for(const base of bases.filter(b=>b.shaftId===shaft)){
        const original=new THREE.Vector3(.41,.29,-.12).applyMatrix4(new THREE.Matrix4().set(...base.fitted));
        const expected=original.clone().sub(pivot).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle)).add(pivot);
        const actual=new THREE.Vector3(.41,.29,-.12).applyMatrix4(new THREE.Matrix4().set(...f.compose(base,pose,"fitted")));
        assert.ok(actual.distanceTo(expected)<1e-10);
      }
      assert.equal(JSON.stringify(a.auditPose(t,shaft,p)),JSON.stringify(pose));
    }
  }
});
test("spring mismatch is independently the rotated source terminal displacement",()=>{
  for(const angle of [0,.003535498550947227,-.003535498550947227]){
    const point=new THREE.Vector3(.41668742107478446,-.270732748192483,0);
    const moved=point.clone().applyAxisAngle(new THREE.Vector3(0,0,1),angle);
    assert.ok(Math.abs(a.springMismatch(angle)-point.distanceTo(moved))<1e-12);
  }
});
