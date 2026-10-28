import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "../explorer/node_modules/three/build/three.module.js";
import { RunningHands, handClock, movementPose } from "../explorer/src/viewer/RunningMovement.ts";
const read = (p) => JSON.parse(fs.readFileSync(p));
const authored = read("assets/authored/hand-display-poses.json");
const dials = read("assets/authored/dial-configurations.json");
const manifest = read("explorer/public/models/assembly-manifest.json");
// Independently reconstruct the recorded static 10:10 fixture from immutable source tips.
const audit = {
  records: authored.hands.map((h) => {
    const source = new THREE.Matrix4().set(
      ...manifest.instances.find((p) => p.id === h.leafId).worldTransform.flat(),
    );
    const pivot = new THREE.Vector3().fromArray(h.boreLocalMm).applyMatrix4(source);
    const tip = new THREE.Vector3().fromArray(h.tipLandmarkLocalMm).applyMatrix4(source).sub(pivot);
    const theta = (authored.clockAnglesDegrees[h.role] * Math.PI) / 180;
    const direction = Math.atan2(
      (h.face === "central" ? 1 : -1) * Math.cos(theta),
      Math.sin(theta),
    );
    const [x, y] = dials.faces[h.face].axleWorldXYMm;
    const matrix = new THREE.Matrix4()
      .makeTranslation(x, y, 0)
      .multiply(new THREE.Matrix4().makeRotationZ(direction - Math.atan2(tip.y, tip.x)))
      .multiply(new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, 0))
      .multiply(source);
    return {
      ...h,
      fittedWorldTransform: [0, 1, 2, 3].map((i) =>
        [0, 1, 2, 3].map((j) => matrix.elements[j * 4 + i]),
      ),
    };
  }),
};
const close = (a, b, t = 1e-8) => assert.ok(Math.abs(a - b) < t, `${a} != ${b}`);
function fixture() {
  const entries = new Map();
  for (const h of audit.records) {
    const ref = new THREE.Matrix4().set(...h.fittedWorldTransform.flat());
    for (const id of [h.leafId, h.supportLeafId]) {
      const reference =
        id === h.leafId
          ? ref
          : new THREE.Matrix4().set(
              ...manifest.instances.find((p) => p.id === id).worldTransform.flat(),
            );
      const mesh = new THREE.Mesh();
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(reference);
      entries.set(id, { id, mesh, reference });
    }
  }
  const run = new RunningHands();
  run.configure([...entries.values()], true);
  return { entries, run };
}
function angle(h, m) {
  const bore = new THREE.Vector3().fromArray(h.boreLocalMm).applyMatrix4(m);
  const tip = new THREE.Vector3().fromArray(h.tipLandmarkLocalMm).applyMatrix4(m).sub(bore);
  const face = dials.faces[h.face];
  close(bore.x, face.axleWorldXYMm[0]);
  close(bore.y, face.axleWorldXYMm[1]);
  return ((Math.atan2(tip.x, tip.y * (h.face === "central" ? 1 : -1)) * 180) / Math.PI + 360) % 360;
}
const circular = (a, b) =>
  close(Math.atan2(Math.sin(((a - b) * Math.PI) / 180), Math.cos(((a - b) * Math.PI) / 180)), 0);
test("15 source tips, all nine style combinations, exact fractional known times on opposite faces", () => {
  const { entries, run } = fixture();
  assert.equal(entries.size, 22);
  assert.equal(audit.records.length, 15);
  assert.equal(
    dials.faces.small.styles.some((s) => "seconds" in s.handLeafIds),
    false,
  );
  const times = [
    [12, 0, 0, 0],
    [3, 15, 0, 0],
    [6, 30, 0, 0],
    [23, 59, 59, 999],
    [0, 0, 0, 0],
    [11, 59, 59, 900],
    [4, 23, 42, 500],
  ];
  for (const [h, m, s, ms] of times) {
    const seconds = (h % 12) * 3600 + m * 60 + s + ms / 1000;
    run.update(true, 0, 0, new Date(2026, 9, 28, h, m, s, ms));
    for (const hand of audit.records) {
      circular(
        angle(hand, entries.get(hand.leafId).mesh.matrix),
        (seconds * { hour: 1 / 120, minute: 0.1, seconds: 6 }[hand.role]) % 360,
      );
      const support = entries.get(hand.supportLeafId);
      // Blade/support relative pose remains exactly rigid for every style.
      const actual = support.mesh.matrix
        .clone()
        .invert()
        .multiply(entries.get(hand.leafId).mesh.matrix);
      const expected = support.reference
        .clone()
        .invert()
        .multiply(entries.get(hand.leafId).reference);
      actual.elements.forEach((v, i) => close(v, expected.elements[i]));
    }
  }
  run.dispose();
  for (const e of entries.values()) assert.ok(e.mesh.matrix.equals(e.reference));
});
test("local time, fractional progress, delayed frames, long sessions and timezone/system-clock changes", () => {
  const old = process.env.TZ;
  try {
    const date = new Date("2026-10-28T23:59:59.500Z");
    for (const [tz, want] of [
      ["UTC", 43199.5],
      ["Europe/Madrid", 3599.5],
      ["Asia/Kathmandu", 20699.5],
      ["America/New_York", 28799.5],
    ]) {
      process.env.TZ = tz;
      close(handClock(date, 360000000, 360000000 * 54), want);
    }
    process.env.TZ = "UTC";
    for (const sec of [0, 1 / 6, 1 / 3, 59.999, 60, 3600, 43200, 86400, 1e8]) {
      const p = movementPose(sec, {});
      const clock = handClock(new Date(date.getTime() + sec * 1000), sec, p.escape);
      const civil = handClock(new Date(date.getTime() + sec * 1000), 0, 0);
      assert.ok(Math.abs(clock - civil) < 0.34);
    }
    close(handClock(new Date("2026-10-29T00:00:00Z"), 1e8, 54e8), 0);
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
});
test("pause carries frozen shaft with separation, resume resyncs, inventory and Workshop Undo restore bases", () => {
  const { run, entries } = fixture();
  const e = entries.values().next().value;
  run.update(false, 0, 0);
  const loaded = angle(audit.records[0], e.mesh.matrix);
  const device = handClock(new Date(), 0, 0) / 120;
  assert.ok(Math.abs(Math.atan2(Math.sin((loaded-device)*Math.PI/180), Math.cos((loaded-device)*Math.PI/180))) < .001);
  run.update(true, 0, 0, new Date(2026, 9, 28, 3, 15));
  const frozen = e.mesh.matrix.clone();
  run.restore();
  const presentation = new THREE.Matrix4()
    .makeTranslation(7, -2, 13)
    .multiply(new THREE.Matrix4().makeRotationX(0.3));
  e.mesh.matrix.copy(presentation).multiply(e.reference);
  run.update(false, 0, 0, new Date(2026, 9, 28, 9, 45));
  const want = presentation.clone().multiply(frozen);
  e.mesh.matrix.elements.forEach((v, i) => close(v, want.elements[i]));
  run.restore();
  e.mesh.matrix.copy(e.reference);
  run.update(true, 0, 0, new Date(2026, 9, 28, 9, 45));
  circular(angle(audit.records[0], e.mesh.matrix), 292.5);
  run.configure([...entries.values()], false);
  run.update(false, 0, 0);
  assert.ok(e.mesh.matrix.equals(e.reference));
  run.configure([]);
  run.update(true, 0, 0);
  run.dispose();
  run.dispose();
});
test("sub-beat movement follows the existing escape recoil and exact gear ratios", () => {
  for (const dt of [0.001, 0.05, 0.16, 0.25, 0.333, 250, 3600]) {
    const a = 12345,
      b = a + dt,
      pa = movementPose(a, {}),
      pb = movementPose(b, {});
    const base = new Date(2026, 9, 28, 1, 0, 0).getTime();
    const delta =
      handClock(new Date(base + dt * 1000), b, pb.escape) - handClock(new Date(base), a, pa.escape);
    close(delta * 6, (pb.escape - pa.escape) / 9, 1e-7);
  }
});
