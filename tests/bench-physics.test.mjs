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
test("capsule walks, thrusts and lands on visible floors at 30, 60 and 144 Hz", () => {
  for (const fps of [30, 60, 144]) {
    const { w } = rig();
    assert.ok(w.grounded);
    w.keys.add("KeyW");
    advance(w, 1, fps);
    assert.ok(Math.abs(w.feet.x - (WALK.speed - 0.67)) < 0.08);
    w.keys.clear();
    w.keys.add("Space");
    advance(w, 0.65, fps);
    assert.ok(w.feet.y > 1);
    w.keys.delete("Space");
    advance(w, 2, fps);
    assert.ok(w.grounded);
    assert.ok(Math.abs(w.feet.y) < 0.001);
  }
});
test("thin wall blocks ordinary travel, including thrust and long-frame clamp", () => {
  const { world, w } = rig();
  box(world, [0.025, 6, 10], [2, 3, 0]);
  w.keys.add("KeyW");
  advance(w, 1);
  assert.ok(w.feet.x < 1.77);
  w.keys.add("Space");
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
  advance(w, 0.55);
  assert.ok(w.feet.x > 1.9);
  assert.ok(w.feet.y > 0.14);
  w.keys.clear();
  box(world, [4, 0.1, 4], [2, 2, 0]);
  w.keys.add("Space");
  advance(w, 0.1);
  assert.ok(w.feet.y + WALK.height < 1.951);
});
test("input clearing cuts thrust without discarding physical momentum", () => {
  const { w } = rig();
  w.keys.add("Space");
  advance(w, 0.7);
  const vy = w.velocity.y;
  w.clear();
  assert.equal(w.keys.size, 0);
  assert.equal(w.velocity.y, vy);
  w.update(1 / 60);
  assert.ok(w.velocity.y > 0 && w.velocity.y < vy);
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

test("release coasts, gravity falls, thrust brakes before climbing, landing permits relaunch", () => {
  for (const fps of [30, 60, 144]) {
    const { w } = rig();
    w.keys.add("Space");
    advance(w, 2, fps);
    assert.ok(w.feet.y > 8 && w.velocity.y > 5);
    w.keys.delete("Space");
    const releaseY = w.feet.y;
    advance(w, 0.1, fps);
    assert.ok(w.feet.y > releaseY && w.velocity.y > 0);
    advance(w, 0.7, fps);
    assert.ok(w.velocity.y < -3);
    const falling = w.velocity.y;
    w.keys.add("Space");
    w.update(1 / fps);
    assert.ok(w.velocity.y < 0 && w.velocity.y > falling);
    advance(w, 1, fps);
    assert.ok(w.velocity.y > 0);
    w.keys.delete("Space");
    advance(w, 4, fps);
    assert.ok(w.grounded);
    w.keys.add("Space");
    advance(w, 0.5, fps);
    assert.ok(!w.grounded && w.feet.y > 0.5);
  }
});

test("two visible instances share a BVH while keeping independent world poses", () => {
  const world = new CollisionWorld();
  const first = box(world, [5, 1, 5], [-12, 3, 0]);
  const second = first.clone();
  second.position.set(12, 7, 0);
  world.add(second);
  assert.equal(world.trees.size, 1);
  assert.equal(world.floor(-12, 0), 3.5);
  assert.equal(world.floor(12, 0), 7.5);
  first.position.y = 4;
  world.sync();
  assert.equal(world.floor(-12, 0), 4.5);
  assert.equal(world.floor(12, 0), 7.5);
});

test("explicit reset is the only position reset", () => {
  const { w } = rig();
  w.spawn.set(-8, 1, 3);
  w.spawnYaw = 0;
  w.feet.set(10, -9, -4);
  w.update(1 / 60);
  assert.equal(w.resets, 0);
  w.reset();
  assert.deepEqual(w.feet.toArray(), [-8, 1, 3]);
  assert.equal(w.yaw, 0);
  assert.equal(w.resets, 1);
});

test("all edges and corners contain the capsule grounded and airborne, even in long fast frames", () => {
  for (const y of [0, 50, 500])
    for (const x of [-1, 0, 1])
      for (const z of [-1, 0, 1]) {
        if (!x && !z) continue;
        const { w } = rig();
        w.bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
        w.feet.set(x * 9.77, y, z * 9.77);
        w.yaw = 0;
        if (x) w.keys.add(x < 0 ? "KeyA" : "KeyD");
        if (z) w.keys.add(z < 0 ? "KeyW" : "KeyS");
        w.velocity.set(x * 100, 80, z * 100);
        w.update(10);
        advance(w, 1);
        assert.ok(Math.abs(w.feet.x) <= 9.78 && Math.abs(w.feet.z) <= 9.78);
        assert.equal(w.resets, 0);
      }
});

test("boundary allows tangential travel at ground and flight heights", () => {
  for (const y of [0, 50]) {
    const { w } = rig();
    w.bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
    w.feet.set(9.78, y, 0);
    w.yaw = 0;
    w.keys.add("KeyD");
    w.keys.add("KeyW");
    advance(w, 1);
    assert.equal(w.feet.x, 9.78);
    assert.ok(w.feet.z < -3);
  }
});

test("sustained thrust stops below a thin ceiling and resumes after moving clear", () => {
  const { world, w } = rig();
  box(world, [3, 0.025, 3], [0, 3, 0]);
  w.keys.add("Space");
  advance(w, 2);
  assert.ok(w.feet.y + WALK.height <= 2.988);
  assert.equal(w.velocity.y, 0);
  w.keys.add("KeyW");
  advance(w, 1);
  assert.ok(w.feet.x > 3 && w.feet.y > 2);
});

// Independent support oracle: triangulate the authored outline and raycast its
// visible top, including a ring around the capsule; no boundary formula reuse.
const tabletop = (
  await import("../assets/authored/workshop-environment.json", { with: { type: "json" } })
).default.mainDesk;
function tabletopRig() {
  const shape = new THREE.Shape(tabletop.footprint.map(([x, z]) => new THREE.Vector2(x, z)));
  const geometry = new THREE.ShapeGeometry(shape).rotateX(Math.PI / 2).translate(0, -1, 0);
  const world = new CollisionWorld();
  world.add(new THREE.Mesh(geometry));
  return new Walker(world, tabletop);
}
function supported(w) {
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI) / 16;
    assert.ok(
      Number.isFinite(
        w.world.floor(w.feet.x + 0.2199 * Math.cos(a), w.feet.z + 0.2199 * Math.sin(a), 10),
      ),
      `unsupported capsule at ${w.feet.toArray()}`,
    );
  }
}
test("rectangular tabletop contains every edge and corner at all flight heights", () => {
  const w = tabletopRig(),
    points = tabletop.footprint;
  for (const y of [-0.998, 50, 6000]) {
    for (let i = 0; i < points.length; i++) {
      const [ax, az] = points[i],
        [bx, bz] = points[(i + 1) % points.length];
      for (const t of [0, 0.5]) {
        w.feet.set(ax + (bx - ax) * t, y, az + (bz - az) * t);
        w.velocity.set(0, 7, 0);
        w.constrainToDesk();
        supported(w);
        assert.equal(w.feet.y, y);
        assert.equal(w.velocity.y, 7);
      }
    }
  }
});
test("tabletop edges reject outward motion, preserving inward and tangent momentum", () => {
  const w = tabletopRig(),
    points = tabletop.footprint;
  for (let i = 0; i < points.length; i++) {
    const [ax, az] = points[i],
      [bx, bz] = points[(i + 1) % points.length];
    const length = Math.hypot(bx - ax, bz - az),
      tx = (bx - ax) / length,
      tz = (bz - az) / length;
    const nx = -tz,
      nz = tx;
    for (const inward of [-3, 0, 3]) {
      w.feet.set((ax + bx) / 2 + nx * 0.22, 500, (az + bz) / 2 + nz * 0.22);
      w.velocity.set(2 * tx + inward * nx, 4, 2 * tz + inward * nz);
      w.constrainToDesk();
      assert.ok(Math.abs(w.velocity.x * tx + w.velocity.z * tz - 2) < 1e-6);
      assert.ok(Math.abs(w.velocity.x * nx + w.velocity.z * nz - Math.max(0, inward)) < 1e-6);
      assert.equal(w.velocity.y, 4);
    }
  }
});
test("fast substeps stay on the straight front edge and permit inward travel", () => {
  const w = tabletopRig();
  for (const sign of [-1, 1])
    for (const y of [-0.998, 50, 6000]) {
      w.feet.set(sign * 295, y, tabletop.maxZ - 0.23);
      w.velocity.set(sign * 80, 0, 100);
      w.yaw = 0;
      w.keys.add("KeyS");
      w.update(10);
      supported(w);
      w.clear();
      w.velocity.set(0, 0, 0);
      const start = w.feet.z;
      w.keys.add("KeyW");
      advance(w, 1);
      assert.ok(w.feet.z < start - 4);
      supported(w);
      w.clear();
      assert.equal(w.resets, 0);
    }
});

test("flight along a long vertical rim does not treat its triangle seam as a ceiling", () => {
  const world = new CollisionWorld();
  box(world, [1100, 1, 600], [0, -1.5, -165]);
  box(world, [6, 5, 590], [547, 1.5, -170]);
  const w = new Walker(world);
  w.feet.set(542, -0.998, 0);
  w.yaw = 0;
  w.keys.add("KeyD");
  advance(w, 1);
  w.keys.add("Space");
  advance(w, 2);
  assert.ok(w.feet.y > 4 && w.velocity.y > 0, JSON.stringify(w.feet));
});

test("either Shift runs at double speed, diagonals stay normalized, release returns to walking", () => {
  for (const fps of [30, 60, 144]) {
    for (const shift of ["ShiftLeft", "ShiftRight"]) {
      for (const diagonal of [false, true]) {
        const { world, w } = rig();
        box(world, [100, 1, 100], [0, -0.5, 0]);
        w.keys.add("KeyW");
        if (diagonal) w.keys.add("KeyD");
        w.keys.add(shift);
        advance(w, 0.8, fps);
        assert.ok(Math.abs(Math.hypot(w.velocity.x, w.velocity.z) - WALK.speed * 2) < 1e-6);
        assert.ok(w.grounded);
        w.keys.delete(shift);
        advance(w, 0.4, fps);
        assert.ok(Math.abs(Math.hypot(w.velocity.x, w.velocity.z) - WALK.speed) < 1e-6);
        w.clear();
        advance(w, 0.4, fps);
        assert.ok(Math.hypot(w.velocity.x, w.velocity.z) < 1e-6);
      }
    }
  }
});
test("running cannot tunnel through thin walls or leave the tabletop during a long frame", () => {
  for (const fps of [30, 60, 144]) {
    const { world, w } = rig();
    box(world, [0.025, 6, 10], [2, 3, 0]);
    w.keys.add("KeyW");
    w.keys.add("ShiftLeft");
    advance(w, 1, fps);
    w.update(10);
    assert.ok(w.feet.x > 1.7 && w.feet.x < 1.77);
    assert.ok(w.grounded);
    const edge = tabletopRig();
    edge.feet.set(0, 0.002, tabletop.maxZ - 0.25);
    edge.yaw = 0;
    edge.keys.add("KeyS");
    edge.keys.add("ShiftRight");
    advance(edge, 1, fps);
    edge.update(10);
    supported(edge);
  }
});
test("Shift alone does not move and does not change vertical thrust", () => {
  const a = rig().w,
    b = rig().w;
  a.keys.add("ShiftLeft");
  advance(a, 0.5);
  assert.ok(Math.hypot(a.feet.x, a.feet.z) < 1e-8);
  a.keys.add("Space");
  b.keys.add("Space");
  advance(a, 0.7);
  advance(b, 0.7);
  assert.ok(Math.abs(a.feet.y - b.feet.y) < 1e-8);
  a.reset();
  assert.equal(a.keys.size, 0);
});

test("illustrated internals retain their collision pose through parent turnover", () => {
  const world = new CollisionWorld();
  const parent = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6));
  mesh.geometry.computeBoundingBox();
  parent.add(mesh);
  mesh.updateMatrix();
  world.add(mesh, mesh.matrix);
  const original = world.solids[0].bounds.clone();
  mesh.rotation.z = Math.PI / 3;
  mesh.updateMatrix();
  // The visual spring can replace geometry; collisions still own their rest BVH.
  mesh.geometry = new THREE.SphereGeometry(20);
  parent.updateMatrixWorld(true);
  world.sync();
  assert.ok(world.solids[0].bounds.equals(original));
  parent.rotation.x = Math.PI / 2;
  parent.position.set(7, 8, 9);
  parent.updateMatrixWorld(true);
  world.sync();
  const expected = original.clone().applyMatrix4(parent.matrixWorld);
  assert.ok(world.solids[0].bounds.equals(expected));
  assert.ok(world.solids[0].inverse.equals(parent.matrixWorld.clone().invert()));
});

test("animated internals return floor hits and capsule corrections in the retained collision frame", () => {
  const reference = new CollisionWorld(), animated = new CollisionWorld();
  const parents = [new THREE.Group(), new THREE.Group()];
  const geometry = new THREE.BoxGeometry(6, 2, 4);
  const meshes = parents.map(parent => {
    const mesh = new THREE.Mesh(geometry);
    mesh.position.set(1, 2, 3);
    parent.add(mesh);
    mesh.updateMatrix();
    return mesh;
  });
  reference.add(meshes[0]);
  animated.add(meshes[1], meshes[1].matrix);
  // Rendering can borrow another geometry without changing the collision BVH.
  meshes[1].geometry = new THREE.SphereGeometry(20);
  let hits = 0, contacts = 0;
  for (const turn of [0, Math.PI / 2, -Math.PI / 2]) {
    for (const parent of parents) {
      parent.rotation.x = turn;
      parent.position.set(7, 8, 9);
    }
    reference.sync();
    for (const phase of [Math.PI / 3, -Math.PI / 4]) {
      meshes[1].rotation.z = phase;
      meshes[1].updateMatrix();
      animated.sync();
      // Ordinary motion also changes matrixWorld between collision syncs.
      meshes[1].rotation.z += 0.2;
      parents[1].updateMatrixWorld(true);
      const bounds = reference.solids[0].bounds;
      const center = bounds.getCenter(new THREE.Vector3());
      for (const x of [center.x - 1, center.x, center.x + 1]) {
        const floor = reference.floor(x, center.z);
        assert.ok(Number.isFinite(floor));
        assert.ok(Math.abs(animated.floor(x, center.z) - floor) < 1e-10);
        hits++;
      }
      for (const point of [
        new THREE.Vector3(center.x, bounds.max.y - 0.05, center.z),
        new THREE.Vector3(center.x, bounds.min.y - WALK.height + 0.05, center.z),
        new THREE.Vector3(bounds.max.x + WALK.radius - 0.05, center.y, center.z),
      ]) {
        const expected = point.clone(), actual = point.clone();
        const a = reference.resolve(expected), b = animated.resolve(actual);
        assert.ok(a.contacts.length > 0, "Probe must exercise a collision");
        assert.ok(actual.distanceTo(expected) < 1e-10);
        assert.equal(b.grounded, a.grounded);
        assert.equal(b.ceiling, a.ceiling);
        assert.equal(b.contacts.length, a.contacts.length);
        a.contacts.forEach((normal, i) => assert.ok(normal.distanceTo(b.contacts[i]) < 1e-10));
        assert.equal(animated.overlaps(point), reference.overlaps(point));
        contacts++;
      }
    }
  }
  assert.equal(hits, 18);
  assert.equal(contacts, 18);
  geometry.dispose();
  meshes[1].geometry.dispose();
  meshes.forEach(mesh => mesh.material.dispose());
});
