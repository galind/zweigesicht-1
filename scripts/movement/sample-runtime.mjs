/** Export actual runtime outputs for independent geometry verification. */
import fs from "node:fs";
import * as THREE from "../../explorer/node_modules/three/build/three.module.js";
import {
  MOVEMENT,
  RunningSpring,
  movementPose,
} from "../../explorer/src/viewer/RunningMovement.ts";
const root = "artifacts/running-movement";
fs.mkdirSync(root, { recursive: true });
const raw = fs.readFileSync("explorer/public" + MOVEMENT.file);
const spring = new RunningSpring(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
const world = new THREE.Matrix4().set(...MOVEMENT.spring.sourceMatrix.flat());
const n = MOVEMENT.spring.pointCount,
  angles = Array.from({ length: 361 }, (_, i) => MOVEMENT.centers.balance - 180 + i);
const points = new Float32Array(angles.length * n * 3),
  a = new THREE.Vector3(),
  b = new THREE.Vector3();
for (let k = 0; k < angles.length; k++) {
  spring.update(angles[k]);
  const position = spring.geometry.getAttribute("position");
  for (let i = 0; i < n; i++) {
    a.fromBufferAttribute(position, i * 8).applyMatrix4(world);
    b.fromBufferAttribute(position, i * 8 + 1).applyMatrix4(world);
    a.add(b).multiplyScalar(0.5);
    a.z -= 0.1075;
    a.toArray(points, (k * n + i) * 3);
  }
}
fs.writeFileSync(root + "/runtime-spring.bin", Buffer.from(points.buffer));
// Uniform times plus midpoints in every tabulated pallet interval on both swings.
const times = new Set(Array.from({ length: 8001 }, (_, i) => i / 1000));
for (let side = 0; side < 2; side++)
  for (let i = 0; i < MOVEMENT.segments[side].length - 1; i++) {
    const target = (MOVEMENT.segments[side][i][0] + MOVEMENT.segments[side][i + 1][0]) / 2;
    let lo = side * 4,
      hi = (side + 1) * 4;
    for (let k = 0; k < 55; k++) {
      const mid = (lo + hi) / 2,
        p = movementPose(mid, {}).pallet - MOVEMENT.centers.pallet;
      if (p > target === (side === 0)) lo = mid;
      else hi = mid;
    }
    times.add((lo + hi) / 2);
  }
fs.writeFileSync(
  root + "/runtime-samples.json",
  JSON.stringify({
    angles,
    pointCount: n,
    poses: [...times].sort((a, b) => a - b).map((t) => ({ t, ...movementPose(t, {}) })),
  }),
);
spring.geometry.dispose();
