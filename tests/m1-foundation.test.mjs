import assert from "node:assert/strict";
import test from "node:test";
import { load, THREE } from "../scripts/mechanics/harness/test-loader.mjs";
const f = load("scripts/mechanics/harness/foundation.ts");
const { parameters: p, manifest, hands, dials } = load("scripts/mechanics/harness/parameters.ts");
const { bases } = load("scripts/mechanics/harness/bases.ts");
const baseById = new Map(bases.map((b) => [b.id, b]));
const plain = (x) => JSON.parse(JSON.stringify(x));
const near = (a, b, tol = 1e-10) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
const point = (m, v) => new THREE.Vector3(...v).applyMatrix4(new THREE.Matrix4().set(...m));
const rest = f.evaluate(0, { kind: "sourceRest" }, p);

test("same timestamp is exact after arbitrary seeks and 30/60/144 Hz histories; 12 h retains turns", () => {
  const state = f.fixture("third", -0.025, 0.125),
    expected = JSON.stringify(f.evaluate(123.456, state, p));
  for (const hz of [30, 60, 144]) {
    const clock = new f.MechanicalClock();
    clock.play(0);
    for (let i = 0; i <= hz * 3; i++) f.evaluate(clock.read((i * 1000) / hz), state, p);
    clock.seek(40000, 4000);
    clock.seek(1, 5000);
    clock.seek(123.456, 6000);
    assert.equal(JSON.stringify(f.evaluate(clock.read(6000), state, p)), expected);
  }
  const end = f
    .evaluate(43200, f.fixture("seconds", 1 / 60), p)
    .shafts.find((s) => s.id === "seconds");
  assert.equal(end.turns, 720);
  assert.equal(end.phaseTurns, 0);
  assert.equal(end.delta, f.identity);
});
test("clock reads at different rates agree independently without seeking; pause, speed, hidden rebase", () => {
  for (const hz of [30, 60, 144]) {
    const c = new f.MechanicalClock();
    c.play(0);
    for (let i = 0; i <= hz * 5; i++) near(c.read((i * 1000) / hz), i / hz);
    c.pause(5000);
    near(c.read(15000), 5);
    c.setSpeed(0.25, 15000);
    c.play(20000);
    near(c.read(24000), 6);
    c.setSpeed(2, 24000);
    near(c.read(26000), 10);
    c.setHidden(true, 26000);
    near(c.read(126000), 10);
    c.setHidden(false, 126000);
    near(c.read(127000), 12);
    c.pause(127000);
    c.play(130000);
    near(c.read(131000), 14);
    c.seek(43200, 131000);
    c.pause(131000);
    assert.equal(c.read(999000), 43200);
  }
});
test("invalid time, overflow, unknown state/shaft and invalid clock inputs fail explicitly", () => {
  for (const t of [-1, NaN, Infinity, -Infinity, 43200.01])
    assert.throws(() => f.evaluate(t, { kind: "sourceRest" }, p), /Time/);
  assert.throws(() => f.evaluate(0, { kind: "bogus" }, p), /state/);
  assert.throws(() => f.evaluate(0, f.fixture("bogus", 1), p), /shaft/);
  assert.throws(() => f.fixture("balance", NaN), /Nonfinite/);
  assert.throws(() => f.evaluate(43200, f.fixture("balance", 1e6), p), /65536/);
  const c = new f.MechanicalClock();
  c.play(0);
  assert.throws(() => c.setSpeed(-1, 100), /Speed/);
  near(c.read(1000), 1);
  assert.throws(() => c.seek(-1, 2000), /Time/);
  near(c.read(2000), 2);
  assert.throws(() => c.read(1000), /monotonic/);
  assert.throws(() => c.read(NaN), /monotonic/);
});
test("all 365 immutable bases restore exactly; fitted source-rest is exact, no accumulation", () => {
  assert.equal(bases.length, 365);
  for (const base of bases) {
    assert.deepEqual(
      plain(base.source),
      manifest.instances.find((p) => p.id === base.id).worldTransform.flat(),
    );
    assert.ok(Object.isFrozen(base.source) && Object.isFrozen(base.fitted));
    const saved = JSON.stringify(base);
    for (const t of [0, 10, 43200, 2, 0]) {
      const pose = f.evaluate(t, f.fixture(base.shaftId ?? "balance", 0.025), p);
      f.compose(base, pose, "fitted");
      assert.equal(
        f.compose(base, pose, "raw", [1, 0, 0, 99, 0, 1, 0, 3, 0, 0, 1, 5, 0, 0, 0, 1]),
        base.source,
      );
    }
    assert.equal(f.compose(base, rest, "fitted"), base.fitted);
    assert.equal(JSON.stringify(base), saved);
  }
});
test("world quarter turn landmarks and independent quaternion oracle cover every rigid leaf and local flip", () => {
  let count = 0;
  const localZ = new Set();
  for (const shaft of p.shafts) {
    const pose = f.evaluate(10, f.fixture(shaft.id, 0.025), p),
      [x, y] = shaft.pivot.value;
    for (const id of shaft.members) {
      const base = baseById.get(id);
      assert.ok(base);
      count++;
      const matrix = f.compose(base, pose, "fitted");
      for (const v of [
        [0, 0, 0],
        [1.7, -0.3, 0.9],
        [-0.2, 2.1, -0.4],
      ]) {
        const q = point(base.fitted, v),
          actual = point(matrix, v);
        // Hand-calculated RH quarter turn: (dx,dy) -> (-dy,dx), independent of evaluator trig.
        near(actual.x, x - (q.y - y));
        near(actual.y, y + (q.x - x));
        near(actual.z, q.z);
      }
      const a = point(matrix, [1, 2, 3]),
        b = point(matrix, [-2, 0, 1]);
      near(a.distanceTo(b), Math.sqrt(17));
      localZ.add(Math.sign(base.source[10]));
      const arbitrary = f.evaluate(1, f.fixture(shaft.id, 0.137), p);
      const q = point(base.fitted, [0.41, 0.82, -0.33]);
      const expected = q
        .clone()
        .sub(new THREE.Vector3(x, y, shaft.pivot.value[2]))
        .applyQuaternion(
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.137 * 2 * Math.PI),
        )
        .add(new THREE.Vector3(...shaft.pivot.value));
      const got = point(f.compose(base, arbitrary, "fitted"), [0.41, 0.82, -0.33]);
      near(got.distanceTo(expected), 0);
    }
  }
  assert.equal(count, new Set(p.shafts.flatMap((s) => s.members)).size);
  assert.ok(localZ.has(-1) && localZ.has(1));
  const defs = p.shafts
    .filter((s) => ["balance", "pallet", "escape"].includes(s.id))
    .flatMap((s) =>
      s.members.map((id) => manifest.instances.find((p) => p.id === id).definitionId),
    );
  for (const d of [112, 114, 126, 127, 129, 130, 233, 234, 235])
    assert.ok(defs.includes("d_0_1_1_" + d));
  assert.equal(defs.filter((d) => d === "d_0_1_1_128").length, 2);
  assert.ok(
    !p.shafts
      .flatMap((s) => s.members)
      .some((id) => manifest.instances.find((p) => p.id === id).isAssembly),
  );
});
test("center/seconds ownership is separate; presentation composes last and raw bypasses it", () => {
  const pose = f.evaluate(10, f.fixture("seconds", 0.025), p);
  for (const id of p.shafts.find((s) => s.id === "minute").members)
    assert.equal(f.compose(baseById.get(id), pose, "fitted"), baseById.get(id).fitted);
  const base = baseById.get(p.shafts.find((s) => s.id === "seconds").members[0]);
  const presentation = [1, 0, 0, 7, 0, 0, -1, 3, 0, 1, 0, 11, 0, 0, 0, 1];
  const a = point(f.compose(base, pose, "fitted"), [1, 2, 3]),
    b = point(f.compose(base, pose, "fitted", presentation), [1, 2, 3]);
  near(b.x, a.x + 7);
  near(b.y, 3 - a.z);
  near(b.z, 11 + a.y);
  assert.equal(f.compose(base, pose, "raw", presentation), base.source);
});
test("all six styles / nine pairs: reviewed bore and tip directions, support pairing and Lance correction once", () => {
  let combos = 0;
  for (const central of dials.faces.central.styles)
    for (const small of dials.faces.small.styles) {
      combos++;
      for (const [face, style] of [
        ["central", central],
        ["small", small],
      ])
        for (const id of Object.values(style.handLeafIds)) {
          const h = hands.hands.find((h) => h.leafId === id),
            base = baseById.get(id),
            [x, y] = dials.faces[face].axleWorldXYMm;
          assert.ok(style.supportLeafIds.includes(h.supportLeafId));
          for (const t of [0, 10, 43200]) {
            const pose = f.evaluate(t, f.fixture(`${face}-${h.role}`, 1 / 40), p),
              matrix = f.compose(base, pose, "fitted");
            const bore = point(matrix, h.boreLocalMm),
              sourceBore = point(base.source, h.boreLocalMm),
              tip = point(matrix, h.tipLandmarkLocalMm);
            near(bore.x, x);
            near(bore.y, y);
            near(bore.z, sourceBore.z);
            const clockAngle = ({ hour: 305, minute: 60, seconds: 0 }[h.role] * Math.PI) / 180;
            const heading = Math.atan2(
              Math.cos(clockAngle) * (face === "central" ? 1 : -1),
              Math.sin(clockAngle),
            );
            const actual = Math.atan2(tip.y - bore.y, tip.x - bore.x),
              expected = heading + ((t % 40) / 40) * 2 * Math.PI;
            near(Math.sin(actual), Math.sin(expected));
            near(Math.cos(actual), Math.cos(expected));
            const support = baseById.get(h.supportLeafId),
              center = point(f.compose(support, pose, "fitted"), [0, 0, 0]);
            near(center.x, x);
            near(center.y, y);
          }
        }
    }
  assert.equal(combos, 9);
  assert.equal(hands.hands.length, 15);
  const lance = hands.hands.find((h) => h.leafId.endsWith("__0_1_1_22_9")),
    base = baseById.get(lance.leafId);
  const source = point(base.source, lance.boreLocalMm);
  near(source.x, 12.4254391598701);
  near(source.y, 7.08174217766239);
  assert.equal(f.compose(base, rest, "raw"), base.source);
  assert.equal(f.compose(base, rest, "fitted"), base.fitted);
});
test("all graph diagnostics and spring handles remain unresolved in experiment and connected states", () => {
  for (const state of [
    { kind: "connected" },
    f.fixture("balance", 0.025),
    { kind: "sourceRest" },
  ]) {
    const pose = f.evaluate(10, state, p);
    assert.equal(pose.connectedReady, false);
    assert.equal(pose.diagnostics.length, 37);
    assert.equal(pose.deformations.length, 3);
    assert.ok(
      Object.values(pose.operating).every(
        (p) => p.value === null && p.evidenceId && p.units && p.frame && p.reviewStatus,
      ),
    );
    for (const d of pose.deformations) {
      assert.match(d.status, /unresolved/);
      assert.ok(!baseById.get(d.id).shaftId);
    }
    if (state.kind === "connected")
      assert.ok(pose.shafts.every((s) => s.status.includes("unresolved")));
  }
  for (const s of p.shafts)
    for (const param of [s.pivot, s.axis, s.membership])
      for (const k of ["evidenceId", "units", "frame", "derivation", "confidence", "reviewStatus"])
        assert.ok(param[k]);
});

test("independent rational phase samples through 12 hours and unsupported contracts", () => {
  for (let n = 0; n <= 43200; n += 137) {
    const t = Math.min(43200, n + 0.25);
    const pose = f
      .evaluate(t, f.fixture("balance", 1 / 40), p)
      .shafts.find((s) => s.id === "balance");
    near(pose.angleRad, ((t % 40) * Math.PI) / 20);
  }
  const altered = plain(p);
  altered.shafts[0].axis.value = [0, 0, -1];
  assert.throws(() => f.evaluate(0, { kind: "sourceRest" }, altered), /axis/);
  const duplicate = plain(p);
  duplicate.shafts[1].members.push(duplicate.shafts[0].members[0]);
  assert.throws(() => f.evaluate(0, { kind: "sourceRest" }, duplicate), /Duplicate/);
  assert.equal(p.diagnostics.find((d) => d.id === "R08").status, "rejected");
});
