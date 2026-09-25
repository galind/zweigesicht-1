/** CPU execution of actual controller methods with renderer/network facades.
 * These verify ownership and failure paths; browser tests supply WebGL/interaction evidence.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as THREE from '../explorer/node_modules/three/build/three.module.js';

const require = createRequire(import.meta.url);
const ts = require('../explorer/node_modules/typescript');
const source = ts.createSourceFile('PlayViewer.ts', fs.readFileSync(new URL('../explorer/src/play/PlayViewer.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const declaration = source.statements.find(ts.isClassDeclaration);
function actual(name, fixture, globals = {}) {
  const member = declaration.members.find((node) => node.name?.getText(source) === name);
  assert.ok(member, `Actual controller member ${name} exists`);
  let code;
  if (ts.isPropertyDeclaration(member)) code = `module.exports = function() { return ${member.initializer.getText(source)}; };`;
  else {
    const text = member.getText(source);
    code = `module.exports = ${text.startsWith('async ') ? `async function ${text.slice(6)}` : `function ${text}`};`;
  }
  const module = {exports: {}};
  vm.runInNewContext(ts.transpileModule(code, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText, {
    module, THREE, performance, console: {error() {}}, ...globals,
  });
  return ts.isPropertyDeclaration(member) ? module.exports.call(fixture) : module.exports.bind(fixture);
}
function scene(id = 'leaf') {
  const result = new THREE.Group();
  result.name = id;
  const geometry = new THREE.BoxGeometry(1, 1, 1), material = new THREE.MeshBasicMaterial();
  const disposal = {geometry: 0, material: 0};
  geometry.addEventListener('dispose', () => disposal.geometry++);
  material.addEventListener('dispose', () => disposal.material++);
  result.add(new THREE.Mesh(geometry, material));
  return {object: result, disposal};
}
const identity = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
function fixture(globals = {}) {
  const value = {
    generation: 0, dead: false, ready: false, busy: false, frame: 0, error: '', renderCount: 0,
    pieces: new Map(), loadedObjects: [], staged: new THREE.Group(), scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(), controls: {enabled: true}, fitted: new Set(), current: null, active: false,
    manifest: {finalLeafIds: ['leaf'], targetPoses: {leaf: identity}}, notifications: [], updates: 0,
    notify(status) { this.notifications.push(status); },
    update() { this.updates++; }, positionStage() {},
  };
  for (const name of ['emit', 'disposeObject', 'clearPieces', 'load']) value[name] = actual(name, value, globals);
  return value;
}
function loadGlobals({overview, catalog, diamond, surfaces = async () => new Map(), metadataFails = false}) {
  class Loader {
    setMeshoptDecoder() { return this; }
    async loadAsync(path) { return {scene: await (path === 'overview' ? overview() : catalog())}; }
  }
  return {
    GLTFLoader: Loader, MeshoptDecoder: {}, assetRequestUrl: (path) => path,
    loadRecoveredDiamond: diamond, loadSourceSurfaces: surfaces, attachSourceSurface() {},
    createMaterial: () => new THREE.MeshBasicMaterial(), setFinishEnabled() {}, DIALS: {presentationOverrides: []},
    fetch: async (path) => ({ok: !metadataFails, json: async () => path.includes('assembly-manifest')
      ? {instances: [{id: 'leaf', name: 'Fixture leaf', definitionId: 'fixture-definition'}]}
      : {overview: 'overview', catalog: 'catalog'}}),
  };
}

test('all required load failures retain a disabled session, dispose successful siblings, and retry', async () => {
  for (const failure of ['overview', 'catalog', 'diamond', 'surfaces', 'metadata']) {
    let failing = true;
    const resources = [];
    const produce = (asset) => async () => {
      if (failing && failure === asset) throw new Error(`Injected ${asset} failure`);
      const s = scene(asset === 'overview' ? 'leaf' : 'other'); resources.push(s); return s.object;
    };
    const globals = loadGlobals({
      overview: produce('overview'), catalog: produce('catalog'), diamond: produce('diamond'),
      surfaces: async () => { if (failing && failure === 'surfaces') throw Error('Annotation failure'); return new Map(); },
    });
    const fetch = globals.fetch;
    globals.fetch = async (...args) => failing && failure === 'metadata' ? {ok: false} : fetch(...args);
    const v = fixture(globals);
    await v.load();
    assert.equal(v.ready, false, failure);
    assert.match(v.error, /could not load completely/, failure);
    assert.equal(v.pieces.size, 0);
    assert.equal(v.updates, 0);
    for (const {disposal} of resources) assert.deepEqual(disposal, {geometry: 1, material: 1});
    const failedCount = resources.length;
    failing = false;
    await v.load();
    assert.equal(v.ready, true, `${failure} retry`);
    assert.equal(v.pieces.size, 1);
    assert.equal(v.error, '');
    assert.equal(v.updates, 1);
    for (const {disposal} of resources.slice(failedCount)) assert.deepEqual(disposal, {geometry: 0, material: 0});
    v.clearPieces();
    for (const {disposal} of resources) assert.deepEqual(disposal, {geometry: 1, material: 1});
  }
});

test('missing geometry cannot enable play or silently declare a complete asset set', async () => {
  const resources = [scene('unrelated'), scene('other'), scene('diamond')];
  const v = fixture(loadGlobals({overview: async () => resources[0].object, catalog: async () => resources[1].object, diamond: async () => resources[2].object}));
  await v.load();
  assert.equal(v.ready, false);
  assert.match(v.error, /could not load completely/);
  assert.equal(v.pieces.size, 0);
  for (const {disposal} of resources) assert.deepEqual(disposal, {geometry: 1, material: 1});
});

test('a route exit while requests are pending releases late geometry without state notifications', async () => {
  let finish;
  const slow = new Promise((resolve) => { finish = resolve; });
  const resources = [scene('leaf'), scene('other'), scene('diamond')];
  const v = fixture(loadGlobals({overview: async () => { await slow; return resources[0].object; }, catalog: async () => resources[1].object, diamond: async () => resources[2].object}));
  const loading = v.load();
  await Promise.resolve(); await Promise.resolve();
  v.dead = true; v.generation++;
  const notifications = v.notifications.length;
  finish(); await loading;
  assert.equal(v.pieces.size, 0);
  assert.equal(v.ready, false);
  assert.equal(v.updates, 0);
  assert.equal(v.notifications.length, notifications);
  for (const {disposal} of resources) assert.deepEqual(disposal, {geometry: 1, material: 1});
});

test('idle rendering schedules one frame for coalesced invalidations and then sleeps', () => {
  let scheduled = 0, draws = 0;
  const callbacks = [];
  const v = fixture();
  const globals = {requestAnimationFrame: (callback) => { callbacks.push(callback); return ++scheduled; }};
  v.renderer = {render: () => draws++};
  v.invalidate = actual('invalidate', v, globals);
  v.render = actual('render', v, globals);
  for (let i = 0; i < 20; i++) v.invalidate();
  assert.equal(scheduled, 1);
  callbacks.shift()(performance.now());
  assert.equal(draws, 1);
  assert.equal(v.frame, 0);
  assert.equal(callbacks.length, 0, 'No idle requestAnimationFrame loop');
  v.dead = true; v.invalidate();
  assert.equal(scheduled, 1);
});

test('unchanged layout preserves keyboard orbit while changed chrome bounds reframe and locate staging', () => {
  let reframes = 0, invalidations = 0;
  const header = {bottom: 60}, dock = {top: 680, left: 0};
  const rect = {left: 0, top: 0, width: 390, height: 844, right: 390, bottom: 844};
  const v = fixture();
  Object.assign(v, {
    active: true, current: {id: 'offered-part'}, frameRegion: {top: 0, bottom: 0, left: 0, width: 0},
    stage: {offsetHeight: 84, style: {}},
    host: {
      getBoundingClientRect: () => rect,
      parentElement: {querySelector: (selector) => ({getBoundingClientRect: () => selector === '.play-heading' ? header : dock})},
    },
    controls: {enabled: true, target: new THREE.Vector3(), update() {}},
    reframe() {reframes++; this.camera.position.set(0, 0, 100);},
    invalidate() {invalidations++;},
  });
  const layout = actual('layout', v), keyDown = actual('keyDown', v);
  layout();
  assert.equal(reframes, 1);
  assert.equal(v.stage.style.top, '556px');
  const initialStage = {...v.stage.style};
  keyDown({key: 'ArrowLeft', preventDefault() {}});
  const orbited = v.camera.position.toArray();
  assert.notDeepEqual(orbited, [0, 0, 100]);
  for (let i = 0; i < 4; i++) layout();
  assert.equal(reframes, 1, 'Redundant observer delivery must not reset user camera ownership');
  assert.deepEqual(v.camera.position.toArray(), orbited);
  assert.deepEqual(v.stage.style, initialStage, 'Staging remains anchored despite repeated layout delivery');
  header.bottom += 0.25;
  layout();
  assert.equal(reframes, 1, 'Subpixel observer noise does not reset the camera');
  assert.deepEqual(v.camera.position.toArray(), orbited);
  dock.top -= 60;
  layout();
  assert.equal(reframes, 2, 'A newly expanded dock changes the usable region');
  assert.deepEqual(v.camera.position.toArray(), [0, 0, 100]);
  assert.equal(v.stage.style.top, '496px');
  const stageTop = Number.parseFloat(v.stage.style.top), stageLeft = Number.parseFloat(v.stage.style.left);
  assert.ok(stageTop > header.bottom && stageTop + v.stage.offsetHeight < dock.top);
  assert.ok(stageLeft >= 0 && stageLeft + v.stage.offsetHeight <= rect.width);
  assert.equal(invalidations, 7, 'Each live layout keeps stage rendering fresh');
});

test('the production settle commits once, blocks duplicate activation and stops scheduling at completion', () => {
  for (const reduced of [false, true]) {
    let id = 0, commits = 0;
    const callbacks = [], scales = [];
    const v = fixture();
    const globals = {requestAnimationFrame: (callback) => {callbacks.push(callback); return ++id;}};
    Object.assign(v, {
      ready: true, active: true, current: {id: 'offered-part'}, target: new THREE.Vector3(20, 10, 0),
      media: {matches: reduced}, renderer: {render() {}}, destination: {style: {}},
      project(point) {return {x: point.x, y: point.y};},
      positionStage(point, scale) {if (scale !== undefined) scales.push(scale);},
      placed(stepId) {assert.equal(stepId, 'offered-part'); commits++; this.current = null;},
    });
    v.staged.scale.setScalar(8);
    for (const name of ['invalidate', 'render', 'animate', 'place']) v[name] = actual(name, v, globals);
    v.place(); v.place(); v.place();
    assert.equal(v.busy, true); assert.equal(v.controls.enabled, false); assert.equal(commits, 0);
    const start = v.animation.start;
    callbacks.shift()(start + 100);
    assert.equal(commits, reduced ? 1 : 0);
    if (!reduced) callbacks.shift()(start + 240);
    assert.equal(commits, 1); assert.equal(v.busy, false); assert.equal(v.controls.enabled, true);
    assert.equal(v.animation, undefined); assert.equal(callbacks.length, 0); assert.equal(v.frame, 0);
    assert.equal(scales.at(-1), 1, 'The authored target ends at true physical scale');
  }
});

test('context interruption cancels an uncommitted settle and restores controls only after recovery', () => {
  const cancelled = [];
  const v = fixture();
  let committed = 0, prevented = 0, env = 0;
  Object.assign(v, {ready: true, busy: true, frame: 7, animation: {complete: () => committed++}, cancel() {}, makeEnvironment() {env++;}, invalidate() {}, pieces: new Map([['leaf', {}]])});
  v.contextLost = actual('contextLost', v, {cancelAnimationFrame: (id) => cancelled.push(id)});
  v.contextRestored = actual('contextRestored', v);
  v.contextLost({preventDefault: () => prevented++});
  assert.equal(v.ready, false); assert.equal(v.busy, false); assert.equal(v.animation, undefined);
  assert.equal(v.controls.enabled, false); assert.equal(v.frame, 0); assert.deepEqual(cancelled, [7]);
  assert.equal(prevented, 1); assert.equal(committed, 0);
  v.contextRestored();
  assert.equal(v.ready, true); assert.equal(v.controls.enabled, true); assert.equal(v.error, '');
  assert.equal(env, 1); assert.equal(v.updates, 1); assert.equal(committed, 0);
});

test('controller disposal releases geometry, cloned materials, listeners, observer and canvas', () => {
  const releases = [];
  const original = scene('leaf'), displayMaterial = new THREE.MeshBasicMaterial();
  let displayDisposed = 0;
  displayMaterial.addEventListener('dispose', () => displayDisposed++);
  const v = fixture();
  const display = new THREE.Mesh(original.object.children[0].geometry, displayMaterial);
  v.scene.add(display); v.pieces.set('leaf', {mesh: display}); v.loadedObjects.push(original.object);
  Object.assign(v, {
    frame: 19, releaseCapture() {releases.push('capture');}, observer: {disconnect() {releases.push('observer');}},
    controls: {dispose() {releases.push('controls');}}, environment: {dispose() {releases.push('environment');}},
    stage: {removeEventListener(name) {releases.push(`stage:${name}`);}},
    media: {removeEventListener(name) {releases.push(`media:${name}`);}},
    renderer: {dispose() {releases.push('renderer');}, domElement: {removeEventListener(name) {releases.push(`canvas:${name}`);}, remove() {releases.push('canvas');}}},
  });
  const dispose = actual('dispose', v, {cancelAnimationFrame: (id) => {assert.equal(id, 19); releases.push('frame');}});
  dispose(); dispose();
  assert.equal(v.dead, true); assert.equal(v.pieces.size, 0); assert.equal(v.loadedObjects.length, 0);
  assert.deepEqual(original.disposal, {geometry: 1, material: 1}); assert.equal(displayDisposed, 1);
  for (const key of ['capture', 'observer', 'controls', 'environment', 'renderer', 'canvas', 'frame', 'media:change',
    'stage:pointerdown', 'stage:pointermove', 'stage:pointerup', 'stage:pointercancel', 'stage:lostpointercapture', 'stage:keydown',
    'canvas:webglcontextlost', 'canvas:webglcontextrestored', 'canvas:keydown']) assert.equal(releases.filter((value) => value === key).length, 1, key);
});

test('context recovery allocation failure exposes retry without enabling play', () => {
  const v = fixture();
  Object.assign(v, {ready: false, contextUnavailable: true, makeEnvironment() {throw Error('PMREM allocation failure');}, invalidate() {throw Error('Must not schedule failed recovery');}});
  assert.doesNotThrow(actual('contextRestored', v));
  assert.equal(v.ready, false); assert.equal(v.controls.enabled, false);
  assert.match(v.error, /could not be restored.*Retry/);
  assert.equal(v.updates, 0);
});

test('context recovery cannot erase a required-asset failure into an endless loading state', () => {
  const v = fixture();
  Object.assign(v, {ready: false, contextUnavailable: true, error: 'The watch could not load completely. Retry to restore your assembly.', makeEnvironment() {}, invalidate() {}});
  actual('contextRestored', v)();
  assert.equal(v.ready, false);
  assert.equal(v.controls.enabled, false);
  assert.match(v.error, /retry/i);
  assert.equal(v.updates, 0);
});

test('asset completion during context loss cannot re-enable placements before restoration', async () => {
  let finish;
  const pending = new Promise((resolve) => {finish = resolve;});
  const resources = [scene('leaf'), scene('catalog'), scene('diamond')];
  const v = fixture(loadGlobals({overview: async () => {await pending; return resources[0].object;}, catalog: async () => resources[1].object, diamond: async () => resources[2].object}));
  Object.assign(v, {cancel() {}, makeEnvironment() {}, invalidate() {}});
  const loading = v.load();
  actual('contextLost', v, {cancelAnimationFrame() {}})({preventDefault() {}});
  finish(); await loading;
  assert.equal(v.ready, false);
  assert.equal(v.controls.enabled, false);
  assert.equal(v.pieces.size, 1, 'Completed geometry is retained for recovery');
  actual('contextRestored', v)();
  assert.equal(v.ready, true); assert.equal(v.controls.enabled, true);
  v.clearPieces();
});

test('assets completing after context recovery clear the temporary interruption without a second retry', async () => {
  let finish;
  const pending = new Promise((resolve) => {finish = resolve;});
  const resources = [scene('leaf'), scene('catalog'), scene('diamond')];
  const v = fixture(loadGlobals({overview: async () => {await pending; return resources[0].object;}, catalog: async () => resources[1].object, diamond: async () => resources[2].object}));
  Object.assign(v, {cancel() {}, makeEnvironment() {}, invalidate() {}});
  const loading = v.load();
  actual('contextLost', v, {cancelAnimationFrame() {}})({preventDefault() {}});
  actual('contextRestored', v)();
  assert.equal(v.ready, false);
  assert.equal(v.contextUnavailable, false);
  assert.notEqual(v.error, '', 'Pending geometry remains unavailable after GPU recovery');
  finish(); await loading;
  assert.equal(v.ready, true);
  assert.equal(v.error, '', 'Successful asset completion removes the temporary recovery error');
  assert.equal(v.pieces.size, 1);
  assert.equal(v.updates, 1);
  assert.equal(v.notifications.at(-1).ready, true);
  assert.equal(v.notifications.at(-1).error, '');
  v.clearPieces();
});

test('failed controller construction frees the renderer, controls, canvas and temporary studio', () => {
  const released = [];
  const canvas = {setAttribute() {}, removeEventListener() {}, remove() {released.push('canvas');}};
  class Renderer {domElement = canvas; setPixelRatio() {} setClearColor() {} dispose() {released.push('renderer');}}
  class Controls {addEventListener() {} dispose() {released.push('controls');}}
  class Room {dispose() {released.push('room');}}
  class Pmrem {fromScene() {throw Error('Injected environment failure');} dispose() {released.push('pmrem');}}
  const globals = {THREE: {...THREE, WebGLRenderer: Renderer, PMREMGenerator: Pmrem}, OrbitControls: Controls, StudioEnvironment: Room, devicePixelRatio: 1, cancelAnimationFrame() {}};
  const v = fixture();
  Object.assign(v, {stage: {removeEventListener() {}}, destination: {dataset: {}}, media: {removeEventListener() {}}});
  for (const name of ['makeEnvironment', 'dispose', 'releaseCapture']) v[name] = actual(name, v, globals);
  const constructor = declaration.members.find(ts.isConstructorDeclaration), module = {exports: {}};
  vm.runInNewContext(ts.transpileModule(`module.exports = function(host,stage,destination,manifest,notify,placed,selected) ${constructor.body.getText(source)}`, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText, {module, ...globals});
  assert.throws(() => module.exports.call(v, {appendChild() {}}, v.stage, v.destination, v.manifest, () => {}, () => {}, () => {}), /Injected environment failure/);
  assert.equal(v.dead, true);
  for (const key of ['renderer', 'controls', 'canvas', 'room', 'pmrem']) assert.equal(released.filter((value) => value === key).length, 1, key);
});
