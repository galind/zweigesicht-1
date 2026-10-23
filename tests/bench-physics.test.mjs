import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../explorer/node_modules/three/build/three.module.js";
import { CollisionWorld, Walker, WALK } from "../explorer/src/bench/physics.ts";
function box(world, size, position) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size));
  mesh.position.set(...position);
  world.add(mesh);
  return mesh;
}
function rig() {
  const world = new CollisionWorld();
  box(world, [30, 1, 30], [0, -0.5, 0]);
  const w = new Walker(world);
  w.feet.set(0, 0.002, 0);
  for (let i = 0; i < 10; i++) w.update(1 / 60);
  return { world, w };
}
function advance(w, seconds, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) w.update(1 / fps);
}
test("capsule walks, jumps and lands on visible floors at 30, 60 and 144 Hz", () => {
  for (const fps of [30, 60, 144]) {
    const { w } = rig();
    assert.ok(w.grounded);
    w.keys.add("KeyW");
    advance(w, 1, fps);
    assert.ok(Math.abs(w.feet.x - WALK.speed) < 0.02);
    w.keys.clear();
    w.jumpQueued = true;
    advance(w, 0.35, fps);
    assert.ok(w.feet.y > 1);
    advance(w, 1, fps);
    assert.ok(w.grounded);
    assert.ok(Math.abs(w.feet.y) < 0.001);
  }
});
test("thin wall blocks ordinary travel, including jump and long-frame clamp", () => {
  const { world, w } = rig();
  box(world, [0.025, 6, 10], [2, 3, 0]);
  w.keys.add("KeyW");
  advance(w, 1);
  assert.ok(w.feet.x < 1.77);
  w.jumpQueued = true;
  advance(w, 1);
  w.update(10);
  assert.ok(w.feet.x < 1.77);
  assert.ok(w.feet.x > 1.7);
});
test("openings have no invisible collision floor; lower visible floor catches falling visitor", () => {
  const world = new CollisionWorld();
  box(world, [12, 1, 12], [0, -4.5, 0]);
  box(world, [4, 1, 12], [-4, -0.5, 0]);
  box(world, [4, 1, 12], [4, -0.5, 0]);
  assert.equal(world.floor(0, 0), -4);
  assert.equal(world.floor(4, 0), 0);
  const w = new Walker(world);
  w.feet.set(0, 1, 0);
  advance(w, 2);
  assert.ok(Math.abs(w.feet.y + 4) < 0.001);
  assert.ok(w.grounded);
});
test("step clearance and head clearance are enforced", () => {
  const { world, w } = rig();
  box(world, [2, 0.15, 4], [2, 0.075, 0]);
  w.keys.add("KeyW");
  advance(w, 0.4);
  assert.ok(w.feet.x > 1.9);
  assert.ok(w.feet.y > 0.14);
  w.keys.clear();
  box(world, [4, 0.1, 4], [2, 2, 0]);
  w.jumpQueued = true;
  advance(w, 0.1);
  assert.ok(w.feet.y + WALK.height < 1.951);
});
test("reset and focus clearing remove all held input; falls recover without reloading", () => {
  const { w } = rig();
  w.keys.add("KeyW");
  w.jumpQueued = true;
  w.clear();
  assert.equal(w.keys.size, 0);
  assert.equal(w.jumpQueued, false);
  w.feet.set(0, -9, 0);
  w.update(1 / 60);
  assert.equal(w.resets, 1);
  assert.equal(w.feet.x, -59);
  assert.equal(w.yaw, -Math.PI / 2);
});
test("hidden opposite presentation cannot collide; source geometry indices remain unchanged", () => {
  const world = new CollisionWorld();
  const mesh = box(world, [5, 1, 5], [0, 3, 0]);
  const indices = Array.from(mesh.geometry.index.array);
  world.sync();
  assert.equal(world.floor(0, 0), 3.5);
  mesh.visible = false;
  assert.equal(world.floor(0, 0), -Infinity);
  assert.deepEqual(Array.from(mesh.geometry.index.array), indices);
});

test('a jump just after leaving an edge is accepted once, with no midair repeat', () => {
  const { w } = rig();
  w.feet.set(15.4, 1, 0); w.grounded = false; w.groundGrace = .06;
  w.jumpQueued = true; w.update(1 / 60);
  assert.ok(w.velocity.y > 6);
  advance(w, .15);
  const speed = w.velocity.y;
  w.jumpQueued = true; w.update(1 / 60);
  assert.ok(w.velocity.y < speed);
});
