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
function fixture({compile = async () => {}} = {}) {
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
    mesh.userData.atelierVersion = 1;
    mesh.userData.collisionRole = 'walkable';
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
    RunningMovement: class {dispose() {} clock = {suspend() {}};},
    createDetachedParts: () => new THREE.Group(), finishBenchSurface: noop,
    MOVEMENT: {packets: [], spring: {id: 'spring'}},
    BenchFlip: class {finish() {}}, layout: {stations: []},
    setTimeout: callback => {callback();},
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
    scene: new THREE.Scene(), station: {root: new THREE.Group(), movement: new THREE.Group(),
      holders: {bridge: new THREE.Group(), dial: new THREE.Group()}}, assets: [],
    camera: new THREE.PerspectiveCamera(), roomBounds: new THREE.Sphere(),
    updateCamera: noop, updateStation: noop, wake: noop,
    releasedMaterial: new Set(), releasedGeometry: new Set(), releasedTexture: new Set(),
    walker: {reset: noop}, world: { solids: [], trees: new Map(), add: noop }, pause: noop,
    renderer: { domElement: { removeEventListener: noop, remove: noop }, dispose: noop, forceContextLoss: noop,
      capabilities: {getMaxAnisotropy: () => 1}, getRenderTarget: () => null, targets: [],
      setRenderTarget(target) {this.targets.push(target);}, compileAsync: compile,
      render: noop, getContext: () => ({fenceSync: () => null, isContextLost: () => false}),
    },
  };
  v.station.root.add(v.station.movement, ...Object.values(v.station.holders));
  v.scene.add(v.station.root);
  for (const name of ['load', 'emit', 'release', 'releaseMaterial', 'dispose', 'contextLost', 'enter']) {
    const member = declaration.members.find(node => node.name?.getText(source) === name);
    const text = member.getText(source);
    const body = ts.isPropertyDeclaration(member)
      ? `function() { return ${member.initializer.getText(source)}; }`
      : text.startsWith('async ') ? 'async function ' + text.slice(6) : 'function ' + text;
    const code = `${loadedValue}\nmodule.exports = ${body}`;
    const module = { exports: {} };
    vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, { module, ...globals });
    v[name] = ts.isPropertyDeclaration(member) ? module.exports.call(v) : module.exports.bind(v);
  }
  return { v, resources, motion, document: globals.document, pending: Promise.all([requested.promise, assetsLoaded.promise]) };
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


test('context loss during asset loading invalidates late results and preserves Retry', async () => {
  const {v, resources, motion, pending} = fixture();
  const loading = v.load(); await pending;
  v.contextLost({preventDefault() {}});
  const notifications = v.notifications;
  motion.resolve(new ArrayBuffer(0)); await loading;
  assert.equal(v.status.ready, false);
  assert.match(v.status.error, /Graphics were interrupted/);
  assert.equal(v.notifications, notifications);
  assert.equal(v.station.movement.children.length, 0);
  for (const resource of resources) assert.equal(resource.disposals, 1);
  v.dispose();
});

test('context loss during shader compilation cannot resume GL work or replace its recovery error', async () => {
  for (const reject of [false, true]) {
    const compilation = deferred(), started = deferred();
    let compilations = 0, draws = 0;
    const {v, resources, motion} = fixture({compile: () => {
      compilations++; started.resolve(); return compilation.promise;
    }});
    v.renderer.render = () => draws++;
    const loading = v.load(); motion.resolve(new ArrayBuffer(0)); await started.promise;
    v.contextLost({preventDefault() {}});
    const notifications = v.notifications;
    if (reject) compilation.reject(Error('Driver interrupted')); else compilation.resolve();
    await loading;
    assert.equal(compilations, 1); assert.equal(draws, 0);
    assert.equal(v.renderer.targets.length, 1, 'No framebuffer restoration on the lost generation');
    assert.equal(v.status.ready, false);
    assert.match(v.status.error, /Graphics were interrupted/);
    assert.equal(v.notifications, notifications);
    v.dispose();
    for (const resource of resources) assert.equal(resource.disposals, 1);
  }
});

test('a pointer capture request completing after route exit releases only its own canvas', async () => {
  for (const outcome of ['capture', 'reject', 'other-canvas']) {
    const {v, document} = fixture(), capture = deferred();
    let exits = 0;
    document.exitPointerLock = () => {exits++; document.pointerLockElement = null;};
    v.status.ready = true;
    v.renderer.domElement.requestPointerLock = () => capture.promise;
    v.lockError = () => assert.fail('Disposed route reported a late capture error');
    const entering = v.enter(); v.dispose();
    if (outcome === 'reject') capture.reject(Error('Capture declined'));
    else {
      document.pointerLockElement = outcome === 'capture' ? v.renderer.domElement : {};
      capture.resolve();
    }
    await entering;
    assert.equal(exits, outcome === 'capture' ? 1 : 0);
  }
});
