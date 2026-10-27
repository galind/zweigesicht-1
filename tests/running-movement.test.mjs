import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import * as THREE from "../explorer/node_modules/three/build/three.module.js";
import {
  MOVEMENT,
  movementPose,
  MovementClock,
  RunningMovement,
  RunningSpring,
  shaftMatrix,
  loadMovementBuffer,
} from "../explorer/src/viewer/RunningMovement.ts";
import { wheelDisplayMatrix } from "../explorer/src/viewer/WheelDisplayPose.ts";
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf8"));
const manifest = read("../explorer/public/models/assembly-manifest.json");
const train = read("../assets/source-manifest/train-coupling-study.json");
const data = fs.readFileSync(new URL("../explorer/public" + MOVEMENT.file, import.meta.url));
const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
const pose = (t) => movementPose(t, { balance: 0, pallet: 0, escape: 0 });
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
function fixture(staticIds = []) {
  const meshes = new Map();
  for (const id of [
    ...MOVEMENT.packets.flatMap((p) => p.members),
    MOVEMENT.spring.id,
    ...staticIds,
  ]) {
    const p = manifest.instances.find((p) => p.id === id),
      mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    const source = new THREE.Matrix4().set(...p.worldTransform.flat());
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(wheelDisplayMatrix(id, source) ?? source);
    meshes.set(id, mesh);
  }
  return { meshes, run: new RunningMovement(buffer, meshes) };
}
test("runtime sidecar integrity and exact evidence memberships, pivots and ratios", () => {
  assert.equal(crypto.createHash("sha256").update(data).digest("hex"), MOVEMENT.sha256);
  assert.equal(data.length, MOVEMENT.byteLength);
  assert.equal(MOVEMENT.sourceSha256, manifest.source.sha256);
  assert.equal(MOVEMENT.packets[0].members.length, 9);
  assert.equal(MOVEMENT.packets[1].members.length, 6);
  for (const p of train.kinematics.packets) {
    const actual = MOVEMENT.packets.find((a) => a.name === p.name);
    assert.deepEqual(
      actual.members,
      p.members.map((m) => m.id),
    );
    assert.deepEqual(actual.pivot, p.worldPivotMm);
    const [num, den = 1] = p.ratioToEscape.split("/").map(Number);
    assert.deepEqual(actual.ratio, [num, den]);
  }
});
test("multiple cycles, turn boundary and recoil retain continuous slower-shaft phases", () => {
  for (const n of [0, 1, 19, 20, 199, 2807999]) {
    const start = pose(n * MOVEMENT.secondsPerCycle),
      end = pose((n + 1) * MOVEMENT.secondsPerCycle);
    close(end.escape - start.escape, 18, 1e-7);
    close(start.balance, end.balance);
    close(start.pallet, end.pallet);
    for (const p of MOVEMENT.packets.slice(2)) {
      close(
        ((end.escape - start.escape) * p.ratio[0]) / p.ratio[1],
        (18 * p.ratio[0]) / p.ratio[1],
        1e-7,
      );
      const before = pose((n + 1) * MOVEMENT.secondsPerCycle - 1e-6),
        after = pose((n + 1) * MOVEMENT.secondsPerCycle + 1e-6);
      close(
        (before.escape * p.ratio[0]) / p.ratio[1],
        (after.escape * p.ratio[0]) / p.ratio[1],
        1e-7,
      );
    }
  }
  let recoils = 0;
  for (let i = 1; i <= 16000; i++)
    if (
      pose((i * MOVEMENT.secondsPerCycle) / 16000).escape <
      pose(((i - 1) * MOVEMENT.secondsPerCycle) / 16000).escape - 1e-9
    )
      recoils++;
  assert.ok(recoils > 0);
});
test("nominal 3 Hz, two beats per oscillation and all shaft periods agree independently", () => {
  close(MOVEMENT.secondsPerCycle, 1 / 3);
  close((2 * 3600) / MOVEMENT.secondsPerCycle, 21600);
  // Independent expected periods from the recorded tooth counts, in active seconds.
  const periods = {
    escape: 20 / 3,
    seconds: 60,
    third: 562.5,
    center: 3600,
    transfer: 7800,
    barrel: 24000,
  };
  for (const packet of MOVEMENT.packets.slice(2)) {
    const period = periods[packet.name];
    assert.ok(period, packet.name);
    // All periods are whole cycles except third (1687.5); two turns retain local phase.
    const elapsed = packet.name === "third" ? 2 * period : period;
    const turns = packet.name === "third" ? 2 : 1;
    close(
      ((pose(elapsed).escape - pose(0).escape) * packet.ratio[0]) / packet.ratio[1],
      Math.sign(packet.ratio[0]) * turns * 360,
      1e-8,
    );
  }
});
test("clock is frame-rate independent and resumes without hidden catch-up", () => {
  for (const fps of [15, 24, 30, 60, 90, 120, 144]) {
    const c = new MovementClock();
    for (let i = 0; i <= fps * 61; i++) c.advance(1000 + (i * 1000) / fps, true);
    c.advance(62137, true); // Off-cycle endpoint catches phase errors hidden by full turns.
    close(c.seconds, 61.137);
    const expected = pose(61.137),
      actual = pose(c.seconds);
    for (const key of Object.keys(expected)) close(actual[key], expected[key], 1e-7);
  }
  const c = new MovementClock();
  c.advance(0, true);
  c.advance(16000, true);
  close(c.seconds, 16);
  c.suspend();
  c.advance(500000, true);
  close(c.seconds, 16);
  c.advance(501000, true);
  close(c.seconds, 17);
  c.advance(502000, false);
  c.advance(600000, true);
  close(c.seconds, 17);
});
test("delayed frames, hidden time and reassembly retain the shared pose, shafts and spring", () => {
  const { run, meshes } = fixture();
  const { run: reference, meshes: expectedMeshes } = fixture();
  run.update(1000, true);
  for (const ms of [1016, 1033, 1250, 12000, 62137]) run.update(ms, true);
  close(run.clock.seconds, 61.137);
  reference.update(0, true);
  reference.update(61137, true);
  function compare() {
    for (const key of Object.keys(run.pose)) close(run.pose[key], reference.pose[key], 1e-7);
    for (const [id, mesh] of meshes)
      mesh.matrix.elements.forEach((v, i) =>
        close(v, expectedMeshes.get(id).matrix.elements[i], 1e-7),
      );
    const actual = run.spring.geometry.getAttribute("position").array;
    const expected = reference.spring.geometry.getAttribute("position").array;
    actual.forEach((v, i) => close(v, expected[i], 1e-6));
  }
  compare();
  run.clock.suspend(); // Same visibility lifecycle used by all viewers.
  run.update(900000, true);
  compare();
  run.update(900010, false); // Original source poses while disassembled.
  assert.equal(run.active, false);
  run.update(1800000, true);
  compare();
  run.update(1800271, true);
  reference.update(61408, true);
  compare();
  run.dispose();
  reference.dispose();
});
test("actual controller retains display phases, handles reversed axes and restores detached geometry", () => {
  const { meshes, run } = fixture(),
    bases = new Map([...meshes].map(([id, m]) => [id, m.matrix.clone()]));
  const originalSpring = meshes.get(MOVEMENT.spring.id).geometry;
  run.update(0, true);
  run.update(195000, true);
  for (const packet of MOVEMENT.packets) {
    const deg =
      packet.name === "balance"
        ? run.pose.balance
        : packet.name === "pallet"
          ? run.pose.pallet
          : (run.pose.escape * packet.ratio[0]) / packet.ratio[1];
    for (const id of packet.members) {
      const expected = shaftMatrix(new THREE.Matrix4(), packet.pivot, deg).multiply(bases.get(id));
      for (let i = 0; i < 16; i++) close(meshes.get(id).matrix.elements[i], expected.elements[i]);
    }
    const [id, ...others] = packet.members;
    for (const other of others) {
      const before = bases.get(id).clone().invert().multiply(bases.get(other));
      const after = meshes.get(id).matrix.clone().invert().multiply(meshes.get(other).matrix);
      before.elements.forEach((v, i) => close(v, after.elements[i]));
    }
  }
  assert.notEqual(meshes.get(MOVEMENT.spring.id).geometry, originalSpring);
  run.update(196000, false);
  for (const [id, m] of meshes) assert.ok(m.matrix.equals(bases.get(id)));
  assert.equal(meshes.get(MOVEMENT.spring.id).geometry, originalSpring);
  let disposals = 0;
  run.fork.addEventListener("dispose", () => disposals++);
  run.spring.geometry.addEventListener("dispose", () => disposals++);
  run.dispose();
  run.dispose();
  assert.equal(disposals, 2);
  assert.equal(run.update(200000, true), false);
});
test("spring attachment neighborhoods are rigid at interpolated angles, normals and topology remain valid", () => {
  const spring = new RunningSpring(buffer),
    g = spring.geometry,
    positions = g.getAttribute("position"),
    normals = g.getAttribute("normal");
  const weights = new Float32Array(
    buffer,
    MOVEMENT.spring.weights.offset * 4,
    MOVEMENT.spring.weights.count,
  );
  const world = new THREE.Matrix4().set(...MOVEMENT.spring.sourceMatrix.flat());
  spring.update(0);
  const source = spring.points.slice();
  for (const deg of [-177.614, -123.17, -0.47, 2.385806786849, 67.41, 181.37]) {
    spring.update(deg);
    const a = (deg * Math.PI) / 180,
      c = Math.cos(a),
      s = Math.sin(a);
    for (let i = 0; i < weights.length; i++)
      if (weights[i] === 0 || weights[i] === 1) {
        const x = source[2 * i],
          y = source[2 * i + 1] + 10;
        close(spring.points[2 * i], weights[i] ? c * x - s * y : x, 2e-6);
        close(spring.points[2 * i + 1], (weights[i] ? s * x + c * y : y) - 10, 2e-6);
      }
    for (let i = 0; i < positions.count; i++) assert.ok(Number.isFinite(positions.getX(i)));
    for (let i = 0; i < MOVEMENT.spring.pointCount * 8; i += 43)
      close(Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i)), 1, 1e-6);
    // Actual GPU ribbon retains both thickness and width under source's reversed axis.
    for (let i = 0; i < MOVEMENT.spring.pointCount; i += 71) {
      const a = new THREE.Vector3().fromBufferAttribute(positions, i * 8).applyMatrix4(world);
      const b = new THREE.Vector3().fromBufferAttribute(positions, i * 8 + 1).applyMatrix4(world);
      close(a.distanceTo(b), 0.035, 1e-6);
    }
  }
  const ps = positions.array,
    ns = normals.array;
  for (let k = 0; k < (MOVEMENT.spring.pointCount - 1) * 24; k += 3) {
    const ids = [g.index.array[k], g.index.array[k + 1], g.index.array[k + 2]];
    const [a, b, c] = ids.map((i) => new THREE.Vector3().fromArray(ps, i * 3));
    const face = b.sub(a).cross(c.sub(a));
    assert.ok(face.dot(new THREE.Vector3().fromArray(ns, ids[0] * 3)) > 0, "outward winding");
  }
  g.dispose();
});
test("loader rejects missing and corrupt motion assets", async () => {
  const old = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(loadMovementBuffer(), /unavailable/);
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) });
    await assert.rejects(loadMovementBuffer(), /integrity/);
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => buffer });
    assert.equal(await loadMovementBuffer(), buffer);
  } finally {
    globalThis.fetch = old;
  }
});

// These source packets have no accepted driven path; clear static meshes are insufficient.
test("unresolved display packets and hand leaves stay static through long clocks and lifecycle changes", () => {
  const study = read("../assets/source-manifest/motion-works-study.json");
  const candidates = study.packets.flatMap((p) => p.members.map((m) => m.id));
  assert.equal(candidates.length, 13);
  const hands = manifest.instances
    .filter(
      (p) => !p.isAssembly && /Zeiger|Zeigerbuchse/.test(p.name) && !candidates.includes(p.id),
    )
    .map((p) => p.id);
  const ids = [...candidates, ...hands];
  for (const id of ids) assert.ok(!MOVEMENT.packets.some((p) => p.members.includes(id)), id);
  const { run, meshes } = fixture(ids);
  const bases = new Map(ids.map((id) => [id, meshes.get(id).matrix.clone()]));
  for (const [ms, active] of [
    [0, true],
    [43200137, true],
    [43200138, false],
    [90000000, true],
    [90000271, true],
  ]) {
    run.update(ms, active);
    for (const id of ids) assert.ok(meshes.get(id).matrix.equals(bases.get(id)), id);
  }
  run.dispose();
  for (const id of ids) assert.ok(meshes.get(id).matrix.equals(bases.get(id)), id);
});
