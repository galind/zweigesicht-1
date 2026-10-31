/** Execute the actual loader/disposal methods without WebGL or private Bench assets. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as THREE from '../explorer/node_modules/three/build/three.module.js';

const require = createRequire(import.meta.url);
const ts = require('../explorer/node_modules/typescript');
const source = ts.createSourceFile('BenchViewer.ts', fs.readFileSync(new URL('../explorer/src/bench/BenchViewer.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const declaration = source.statements.find(ts.isClassDeclaration);
const loadedValue = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === 'loadedValue').getText(source);
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function fixture() {
  const motion = deferred(), requested = deferred(), assetsLoaded = deferred();
  const resources = [];
  const leaf = 'p_0_1_1_1__0_1_1_1_4__fixture';
  function material() {
    const value = new THREE.MeshBasicMaterial();
    const resource = { value, disposals: 0 };
    value.addEventListener('dispose', () => resource.disposals++);
    resources.push(resource);
    return value;
  }
  let scenes = 0;
  function scene(name) {
    const object = new THREE.Group();
    const geometry = new THREE.BoxGeometry();
    const resource = { value: geometry, disposals: 0 };
    geometry.addEventListener('dispose', () => resource.disposals++);
    resources.push(resource);
    const mesh = new THREE.Mesh(geometry, material());
    mesh.name = name === 'overview' ? leaf : name;
    object.add(mesh);
    if (++scenes === 6) assetsLoaded.resolve();
    return object;
  }
  class Loader {
    setMeshoptDecoder() { return this; }
    async loadAsync(name) { return { scene: scene(name) }; }
    async parseAsync(bytes) { return { scene: scene(bytes) }; }
  }
  const noop = () => {};
  const globals = {
    THREE, GLTFLoader: Loader, MeshoptDecoder: {},
    loadRecoveredDiamond: async () => scene('diamond'),
    loadSourceSurfaces: async () => new Map(),
    loadCaseRecovery: async () => ({}), recoverCaseSurfaces: noop,
    loadMovementBuffer: () => { requested.resolve(); return motion.promise; },
    assetRequestUrl: path => path, sha256: async () => 'fixture-hash',
    holderManifest: { files: ['movement', 'dial'].map(name => ({ name: name + '.glb', sha256: 'fixture-hash' })) },
    printedPlastic: material, createMaterial: material,
    attachSourceSurface: noop, setFinishEnabled: noop,
    assemblyFittingPresent: () => true, watchConfiguration: { leaves: [] },
    wheelDisplayMatrix: () => undefined,
    fetch: async path => ({
      ok: true, arrayBuffer: async () => path,
      json: async () => path.includes('assembly-manifest')
        ? { instances: [{ id: leaf, definitionId: 'fixture', worldTransform: [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]] }] }
        : { overview: 'overview', catalog: 'catalog' },
    }),
    document: { removeEventListener: noop }, window: { removeEventListener: noop },
    cancelAnimationFrame: noop, console: { error: noop },
  };
  const v = {
    generation: 0, dead: false, frame: 0, status: { ready: false, error: '' },
    notifications: 0, notify() { this.notifications++; },
    scene: new THREE.Scene(), station: { movement: new THREE.Group() }, assets: [],
    releasedMaterial: new Set(), releasedGeometry: new Set(), releasedTexture: new Set(),
    walker: {}, world: { solids: [], trees: new Map() }, pause: noop,
    renderer: { domElement: { removeEventListener: noop, remove: noop }, dispose: noop, forceContextLoss: noop },
  };
  v.scene.add(v.station.movement);
  for (const name of ['load', 'emit', 'release', 'releaseMaterial', 'dispose']) {
    const text = declaration.members.find(node => node.name?.getText(source) === name).getText(source);
    const code = `${loadedValue}\nmodule.exports = ${text.startsWith('async ') ? 'async function ' + text.slice(6) : 'function ' + text};`;
    const module = { exports: {} };
    vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, { module, ...globals });
    v[name] = module.exports.bind(v);
  }
  return { v, resources, motion, pending: Promise.all([requested.promise, assetsLoaded.promise]) };
}

test('Bench route exit during motion loading releases all settled siblings exactly once', async () => {
  const { v, resources, motion, pending } = fixture();
  const loading = v.load();
  await pending;
  v.dispose();
  const notifications = v.notifications;
  motion.resolve(new ArrayBuffer(0));
  await loading;
  v.dispose();
  assert.ok(resources.length >= 12);
  for (const resource of resources) assert.equal(resource.disposals, 1);
  assert.equal(v.notifications, notifications);
  assert.equal(v.runningMovement, undefined);
  assert.equal(v.status.ready, false);
});

test('Bench motion failure releases siblings before any scene ownership transfer', async () => {
  const { v, resources, motion, pending } = fixture();
  const loading = v.load();
  await pending;
  motion.reject(new Error('Motion integrity failure'));
  await loading;
  assert.match(v.status.error, /could not load completely/);
  assert.equal(v.status.ready, false);
  assert.equal(v.station.movement.children.length, 0);
  for (const resource of resources) assert.equal(resource.disposals, 1);
  v.dispose();
  for (const resource of resources) assert.equal(resource.disposals, 1);
});

test('superseded Bench motion loads cannot install a controller or notify', async () => {
  const { v, resources, motion, pending } = fixture();
  const loading = v.load();
  await pending;
  v.generation++;
  const notifications = v.notifications;
  motion.resolve(new ArrayBuffer(0));
  await loading;
  assert.equal(v.notifications, notifications);
  assert.equal(v.runningMovement, undefined);
  assert.equal(v.station.movement.children.length, 0);
  for (const resource of resources) assert.equal(resource.disposals, 1);
  v.dispose();
});
