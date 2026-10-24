import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "../explorer/node_modules/three/build/three.module.js";
import { wheelDisplayMatrix } from "../explorer/src/viewer/WheelDisplayPose.ts";

const read = (file) => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), "utf8"));
const manifest = read("../explorer/public/models/assembly-manifest.json");
const override = read("../assets/authored/wheel-display-poses.json");
const id = "p_0_1_1_1__0_1_1_1_4__0_1_1_83_4";
const part = manifest.instances.find((p) => p.id === id);
const base = () => new THREE.Matrix4().set(...part.worldTransform.flat());

const phases = new Map([
  [id, 6.25],
  ["p_0_1_1_1__0_1_1_1_4__0_1_1_83_15", -1.8],
  ["p_0_1_1_1__0_1_1_1_4__0_1_1_83_1__0_1_1_84_3", 1.8],
]);

test("only the transfer wheel and reviewed ratchet/core packet receive rigid static phases", () => {
  assert.equal(override.sourceSha256, manifest.source.sha256);
  assert.equal(override.wheels.length, phases.size);
  assert.deepEqual(new Map(override.wheels.map((w) => [w.leafId, w.localZDegrees])), phases);
  assert.equal(override.wheels[0].leafId, id);
  assert.equal(part.definitionId, "d_0_1_1_96");
  for (const p of manifest.instances) {
    const source = new THREE.Matrix4().set(...p.worldTransform.flat());
    const before = source.clone();
    const result = wheelDisplayMatrix(p.id, source);
    assert.ok(source.equals(before), "Caller source matrix is immutable");
    assert.equal(!!result, phases.has(p.id));
    if (result) {
      assert.deepEqual(result.elements.slice(12, 15), source.elements.slice(12, 15));
      assert.deepEqual(result.elements.slice(8, 12), source.elements.slice(8, 12));
      assert.ok(Math.abs(result.determinant() - source.determinant()) < 1e-14);
    }
  }
  const result = wheelDisplayMatrix(id, base());
  assert.ok(Math.abs(result.determinant() - 1) < 1e-14);
  assert.deepEqual(result.elements.slice(12, 15), base().elements.slice(12, 15));
  assert.deepEqual(result.elements.slice(8, 12), base().elements.slice(8, 12));
  const angle = (Math.atan2(result.elements[1], result.elements[0]) * 180) / Math.PI;
  assert.ok(Math.abs(angle - 6.25) < 1e-12);
  for (const z of [-0.5, 0, 0.62]) {
    const point = new THREE.Vector3(0, 0, z);
    assert.ok(point.clone().applyMatrix4(result).equals(point.clone().applyMatrix4(base())));
  }
  assert.ok(result.clone().invert().multiply(result).equals(new THREE.Matrix4()));
});

test("Workshop base endpoint and source remain unchanged; repeated presentation does not accumulate phase", () => {
  const play = read("../assets/authored/play-manifest.json");
  assert.deepEqual(play.targetPoses[id], part.worldTransform);
  const source = base(),
    expected = wheelDisplayMatrix(id, source);
  for (let i = 0; i < 100; i++) assert.ok(wheelDisplayMatrix(id, source).equals(expected));
  const unphase = expected
    .clone()
    .multiply(new THREE.Matrix4().makeRotationZ((-6.25 * Math.PI) / 180));
  assert.ok(Math.max(...unphase.elements.map((v, i) => Math.abs(v - source.elements[i]))) < 1e-14);
});

test("ratchet and keyed core retain their relative mounting pose and Workshop base endpoints", () => {
  const play = read("../assets/authored/play-manifest.json");
  const ids = [...phases.keys()].slice(1);
  const sources = ids.map((id) =>
    new THREE.Matrix4().set(...manifest.instances.find((p) => p.id === id).worldTransform.flat()),
  );
  const posed = ids.map((id, i) => wheelDisplayMatrix(id, sources[i]));
  const before = sources[0].clone().invert().multiply(sources[1]);
  const after = posed[0].clone().invert().multiply(posed[1]);
  assert.ok(Math.max(...before.elements.map((n, i) => Math.abs(n - after.elements[i]))) < 1e-12);
  for (let i = 0; i < ids.length; i++) {
    assert.deepEqual(
      play.targetPoses[ids[i]],
      manifest.instances.find((p) => p.id === ids[i]).worldTransform,
    );
    for (let repeat = 0; repeat < 100; repeat++)
      assert.ok(wheelDisplayMatrix(ids[i], sources[i]).equals(posed[i]));
  }
});
