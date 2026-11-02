import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as THREE from '../explorer/node_modules/three/build/three.module.js';
import * as lesson from '../explorer/src/assembly/lesson.ts';
import manifest from '../explorer/public/models/assembly-manifest.json' with { type: 'json' };
const require = createRequire(import.meta.url);
const ts = require('../explorer/node_modules/typescript');
function load(path, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, { exports: module.exports, require: (id) => dependencies[id] ?? {}, console });
  return module.exports;
}
const framing = load('explorer/src/viewer/StudioFrame.ts', { three: THREE });
const { WorkshopViewer } = load('explorer/src/assembly/WorkshopViewer.ts', {
  three: THREE, './lesson': lesson, '../viewer/StudioFrame': framing,
});
const records = new Map(manifest.instances.map((part) => [part.id, part]));
function rig() {
  const viewer = Object.create(WorkshopViewer.prototype);
  Object.assign(viewer, { ready: true, cursor: 12, side: 'movement', pieces: new Map(), assembly: new THREE.Group(), preview: new THREE.Group(), camera: new THREE.PerspectiveCamera(33, 1, .05, 2000), render() {}, publishSeat() {} });
  for (const id of lesson.LEAF_IDS) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1));
    mesh.name = id;
    mesh.matrixAutoUpdate = false;
    mesh.matrix.set(...records.get(id).worldTransform.flat());
    viewer.pieces.set(id, mesh);
  }
  return viewer;
}
test('workshop retains exact fitted matrices and contains only the current movement', () => {
  const viewer = rig();
  for (const cursor of [12, 13, 14, 15]) {
    viewer.update(cursor, undefined, 'movement');
    const ids = [];
    viewer.assembly.updateMatrixWorld(true);
    viewer.assembly.traverse((object) => {
      if (!object.isMesh) return;
      ids.push(object.name);
      assert.deepEqual(object.matrixWorld.elements, new THREE.Matrix4().set(...records.get(object.name).worldTransform.flat()).elements);
    });
    assert.deepEqual(ids.sort(), lesson.componentIds(cursor).sort());
    assert.equal(viewer.cursor, cursor);
    assert.equal(viewer.preview.children.length, 0);
  }
  viewer.update(12, 'bridge', 'dial');
  assert.equal(viewer.preview.visible, false, 'Only a manipulated part may appear on the mat');
  assert.equal(viewer.assembly.children[0].children.length, lesson.componentIds(12).length, 'Selection never installs a part');
});
test('shared Explorer fit contains real checkpoint bounds and fills the active viewport', () => {
  for (const aspect of [1440 / 600, 390 / 420, 320 / 300]) for (const cursor of [12, 13, 14, 15]) {
    const ids = lesson.componentIds(cursor);
    const bounds = new THREE.Box3();
    for (const id of ids) {
      const box = records.get(id).boundsWorldMm;
      bounds.union(new THREE.Box3(new THREE.Vector3(...box[0]), new THREE.Vector3(...box[1])));
    }
    const camera = new THREE.PerspectiveCamera(33, aspect, .05, 2000);
    const direction = new THREE.Vector3(0, 0, -1);
    camera.up.set(0, -1, 0);
    const { center, distance } = framing.studioFrame(camera, bounds, direction, camera.up);
    camera.position.copy(center).addScaledVector(direction, distance); camera.lookAt(center); camera.updateMatrixWorld(true);
    const projected = framing.boundsCorners(bounds).map((point) => point.project(camera));
    assert.ok(projected.every((p) => Math.abs(p.x) < .86 && Math.abs(p.y) < .86));
    const span = Math.max(Math.max(...projected.map((p) => p.x)) - Math.min(...projected.map((p) => p.x)), Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y))) / 2;
    assert.ok(span > .6, `Movement at ${cursor} fills ${(100 * span).toFixed(1)}% at aspect ${aspect}`);
  }
});
