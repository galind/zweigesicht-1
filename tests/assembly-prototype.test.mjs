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
const { PrototypeViewer } = load('explorer/src/assembly/prototype/PrototypeViewer.ts', {
  three: THREE, '../lesson': lesson, '../../viewer/StudioFrame': framing,
});
const records = new Map(manifest.instances.map((part) => [part.id, part]));
const stemIds = new Set([...lesson.PARTS.stem, ...lesson.PARTS.wheel, ...lesson.PARTS.coupling]);
function rig() {
  const viewer = Object.create(PrototypeViewer.prototype);
  Object.assign(viewer, { ready: true, cursor: 7, view: 'movement', side: 'movement', pieces: new Map(), assembly: new THREE.Group(), preview: new THREE.Group(), camera: new THREE.PerspectiveCamera(33, 1, .05, 2000), render() {}, publishSeat() {} });
  for (const id of lesson.LEAF_IDS) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1));
    mesh.name = id;
    mesh.matrixAutoUpdate = false;
    mesh.matrix.set(...records.get(id).worldTransform.flat());
    viewer.pieces.set(id, mesh);
  }
  return viewer;
}
test('prototype view switching retains ownership, exact fitted matrices and no loose scene inventory', () => {
  const viewer = rig();
  for (const cursor of [7, 8, 9]) for (const view of ['movement', 'stem', 'movement']) {
    viewer.update(cursor, view, undefined, 'movement');
    const ids = [];
    viewer.assembly.updateMatrixWorld(true);
    viewer.assembly.traverse((object) => {
      if (!object.isMesh) return;
      ids.push(object.name);
      assert.deepEqual(object.matrixWorld.elements, new THREE.Matrix4().set(...records.get(object.name).worldTransform.flat()).elements);
    });
    assert.deepEqual(ids.sort(), lesson.componentIds(cursor).filter((id) => stemIds.has(id) === (view === 'stem')).sort());
    assert.equal(viewer.cursor, cursor);
    assert.equal(viewer.preview.children.length, 0);
  }
  viewer.update(7, 'stem', 'bridge', 'dial');
  assert.equal(viewer.preview.visible, false, 'Only a manipulated part may appear on the mat');
  assert.equal(viewer.assembly.children[0].children.length, 1, 'Invalid selection never changes stem ownership');
});
test('shared Explorer fit contains real checkpoint bounds and fills the active viewport', () => {
  for (const aspect of [1440 / 600, 390 / 420, 320 / 300]) for (const view of ['movement', 'stem']) {
    const ids = view === 'movement' ? lesson.componentIds(6) : [...stemIds];
    const bounds = new THREE.Box3();
    for (const id of ids) {
      const box = records.get(id).boundsWorldMm;
      bounds.union(new THREE.Box3(new THREE.Vector3(...box[0]), new THREE.Vector3(...box[1])));
    }
    const camera = new THREE.PerspectiveCamera(33, aspect, .05, 2000);
    const direction = view === 'movement' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(.62, .38, -1).normalize();
    camera.up.set(0, view === 'movement' ? 1 : -1, 0);
    const { center, distance } = framing.studioFrame(camera, bounds, direction, camera.up);
    camera.position.copy(center).addScaledVector(direction, distance); camera.lookAt(center); camera.updateMatrixWorld(true);
    const projected = framing.boundsCorners(bounds).map((point) => point.project(camera));
    assert.ok(projected.every((p) => Math.abs(p.x) < .86 && Math.abs(p.y) < .86));
    const span = Math.max(Math.max(...projected.map((p) => p.x)) - Math.min(...projected.map((p) => p.x)), Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y))) / 2;
    assert.ok(span > .6, `Active ${view} fills ${(100 * span).toFixed(1)}% at aspect ${aspect}`);
  }
});
