import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import * as THREE from "../explorer/node_modules/three/build/three.module.js";
import * as physics from "../explorer/src/bench/physics.ts";
const require = createRequire(import.meta.url);
const ts = require("../explorer/node_modules/typescript");
const module = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("explorer/src/bench/flip.ts", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: module.exports, require: (id) => (id === "three" ? THREE : physics) },
);
const { BenchFlip, FLIP_DURATION } = module.exports;
function rig() {
  const world = new physics.CollisionWorld(),
    w = new physics.Walker(world, { minX: -30, maxX: 30, minZ: -30, maxZ: 30 });
  const root = new THREE.Group(),
    movement = new THREE.Group(),
    holders = { bridge: new THREE.Group(), dial: new THREE.Group() };
  root.add(movement, holders.bridge, holders.dial);
  function box(parent, size, pos) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size));
    mesh.position.set(...pos);
    mesh.updateMatrix();
    parent.add(mesh);
    return mesh;
  }
  box(root, [60, 1, 60], [0, -0.5, 0]);
  const part = box(movement, [8, 8, 1], [0, 0, 0]);
  part.matrixAutoUpdate = false;
  box(holders.bridge, [8, 2, 8], [0, 1, 0]);
  box(holders.dial, [10, 3, 10], [0, 1.5, 0]);
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (m.isMesh) world.add(m);
  });
  const flip = new BenchFlip(movement, holders, world, w, [
    { id: "bridge", rotationX: 90, seat: 2.5 },
    { id: "dial", rotationX: -90, seat: 3.5 },
  ]);
  w.feet.set(15, 0.00001, 0);
  w.grounded = true;
  w.yaw = 0.72;
  w.pitch = -0.25;
  return { world, w, root, flip, movement, holders };
}
function finish(flip, fps = 60) {
  for (let i = 0; i < (FLIP_DURATION + 0.2) * fps; i++) flip.update(1 / fps);
}
test("both directions are rigid, exclusive and finish at exact seats at 30/60/144 Hz", () => {
  for (const fps of [30, 60, 144]) {
    const { flip, movement, holders, world } = rig();
    const matrix = movement.children[0].matrix.clone();
    for (const side of ["dial", "bridge"]) {
      assert.ok(flip.start());
      assert.equal(flip.start(), false);
      finish(flip, fps);
      assert.equal(flip.side, side);
      assert.equal(flip.active, false);
      assert.equal(holders[side].visible, true);
      assert.equal(holders[side === "dial" ? "bridge" : "dial"].visible, false);
      assert.equal(movement.position.y, side === "dial" ? 3.5 : 2.5);
      assert.ok(movement.children[0].matrix.equals(matrix));
      for (const s of world.solids) {
        assert.ok(s.inverse.clone().multiply(s.mesh.matrixWorld).equals(new THREE.Matrix4()));
        const expected = s.mesh.parent.matrixWorld.clone().multiply(s.mesh.matrix);
        assert.ok(
          s.mesh.matrixWorld.equals(expected),
          "collision must use the current parent pose before render",
        );
      }
    }
  }
});
test("safe visitor position, look, held inputs and velocity survive start and atomic finish", () => {
  const { flip, w } = rig();
  w.keys.add("KeyW");
  w.keys.add("Space");
  w.velocity.set(1, 2, 3);
  w.grounded = false;
  const before = [...w.feet.toArray(), ...w.velocity.toArray(), w.yaw, w.pitch, w.resets];
  assert.ok(flip.start());
  flip.update(0.05);
  flip.finish();
  assert.deepEqual(
    [...w.feet.toArray(), ...w.velocity.toArray(), w.yaw, w.pitch, w.resets],
    before,
  );
  assert.equal(w.keys.size, 2);
  assert.equal(flip.relocations, 0);
  assert.equal(w.guard, undefined);
});
test("standing and airborne visitors in the sweep move locally without losing view or input", () => {
  for (const grounded of [true, false]) {
    const { flip, w, world } = rig();
    w.feet.set(0, grounded ? 3 : 7, 0);
    w.grounded = grounded;
    w.keys.add("Space");
    w.velocity.set(1, 2, 3);
    assert.ok(flip.start());
    assert.equal(flip.relocations, 1);
    assert.ok(!flip.forbiddenFeet.containsPoint(w.feet));
    assert.ok(!world.overlaps(w.feet));
    assert.equal(w.yaw, 0.72);
    assert.equal(w.pitch, -0.25);
    assert.ok(w.keys.has("Space"));
    assert.equal(w.resets, 0);
    if (!grounded) {
      assert.equal(w.feet.y, 7);
      assert.equal(w.velocity.y, 2);
    } else assert.ok(w.feet.y < 0.001);
    assert.ok(w.feet.length() < 15);
  }
});
test("swept boundary blocks entrants on every substep, retaining tangential movement", () => {
  const { flip, w } = rig();
  flip.start();
  w.feet.set(flip.forbiddenFeet.max.x + 0.01, 4, 0);
  w.velocity.set(-100, 0, 3);
  w.yaw = Math.PI / 2;
  w.keys.add("KeyW");
  w.grounded = false;
  w.update(10);
  assert.ok(w.feet.x > flip.forbiddenFeet.max.x);
  assert.ok(w.feet.z > 0);
  assert.ok(!flip.forbiddenFeet.containsPoint(w.feet));
});
test("incoming holder obstruction is checked even below the movement sweep", () => {
  const { flip, w, world } = rig();
  w.feet.set(4.5, 2.01, 0);
  w.grounded = true;
  assert.equal(world.overlaps(w.feet), false);
  assert.equal(world.overlaps(w.feet, flip.holderMeshes("dial")), true);
  assert.ok(flip.start());
  assert.equal(flip.relocations, 1);
  flip.finish();
  assert.equal(world.overlaps(w.feet), false);
});
test("no safe relocation aborts before movement or holder changes", () => {
  const { flip, w, movement, holders } = rig();
  w.feet.set(0, 3, 0);
  w.bounds = { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };
  assert.equal(flip.start(), false);
  assert.equal(flip.active, false);
  assert.equal(movement.position.y, 2.5);
  assert.equal(holders.bridge.visible, true);
  assert.equal(w.guard, undefined);
});
test("clear space inside overall bounds does not trigger relocation", () => {
  const { flip, w } = rig();
  w.feet.set(0, flip.liftHeight + 3, 4);
  w.grounded = false;
  assert.ok(flip.forbiddenFeet.containsPoint(w.feet));
  assert.equal(flip.isUnsafe(w.feet), false);
  const before = w.feet.clone();
  assert.ok(flip.start());
  assert.equal(flip.relocations, 0);
  assert.ok(w.feet.equals(before));
});
test("closed incoming holder detects capsule wholly inside solid material", () => {
  const { flip, w, world } = rig();
  w.feet.set(4.5, 0.5, 0);
  w.grounded = false;
  assert.equal(world.overlaps(w.feet), false);
  assert.equal(world.overlaps(w.feet, flip.holderMeshes("dial")), true);
  assert.ok(flip.start());
  assert.equal(flip.relocations, 1);
});
test("safe moving visitor follows the same physics trajectory during a flip", () => {
  const active = rig(),
    control = rig();
  for (const r of [active, control]) {
    r.w.feet.set(15, 20, 12);
    r.w.grounded = false;
    r.w.velocity.set(1, -2, 0.5);
    r.w.keys.add("Space");
    r.w.keys.add("KeyD");
  }
  assert.ok(active.flip.start());
  for (let i = 0; i < 240; i++) {
    active.flip.update(1 / 60);
    active.w.update(1 / 60);
    control.w.update(1 / 60);
    assert.ok(active.w.feet.distanceTo(control.w.feet) < 1e-9);
    assert.ok(active.w.velocity.distanceTo(control.w.velocity) < 1e-9);
  }
  assert.equal(active.flip.relocations, 0);
});
