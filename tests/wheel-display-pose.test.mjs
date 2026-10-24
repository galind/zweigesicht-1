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

test("only the reviewed transfer wheel receives a rigid static phase", () => {
  assert.equal(override.sourceSha256, manifest.source.sha256);
  assert.equal(override.wheels.length, 1);
  assert.equal(override.wheels[0].leafId, id);
  assert.equal(part.definitionId, "d_0_1_1_96");
  for (const p of manifest.instances) {
    const source = new THREE.Matrix4().set(...p.worldTransform.flat());
    const before = source.clone();
    const result = wheelDisplayMatrix(p.id, source);
    assert.ok(source.equals(before), "Caller source matrix is immutable");
    assert.equal(!!result, p.id === id);
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
