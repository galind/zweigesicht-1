/** CPU execution of actual controller methods with renderer/network facades.
 * These verify ownership and failure paths; browser tests supply WebGL/interaction evidence.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as THREE from '../explorer/node_modules/three/build/three.module.js';
import {OrbitControls} from '../explorer/node_modules/three/examples/jsm/controls/OrbitControls.js';
import * as CameraFrame from '../explorer/src/viewer/CameraFrame.ts';
import {motionEase, MOTION} from '../explorer/src/experience/motion.ts';

const require = createRequire(import.meta.url);
const ts = require('../explorer/node_modules/typescript');
const source = ts.createSourceFile('PlayViewer.ts', fs.readFileSync(new URL('../explorer/src/play/PlayViewer.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const declaration = source.statements.find(ts.isClassDeclaration);
const graphicsSource = fs.readFileSync(new URL('../explorer/src/viewer/GraphicsResources.ts', import.meta.url), 'utf8');
function graphics(overrides = {}) {
  const module = {exports: {}};
  vm.runInNewContext(ts.transpileModule(graphicsSource, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS}}).outputText, {
    module, exports: module.exports, devicePixelRatio: 1,
    require(name) { return name === 'three' ? (overrides.THREE ?? THREE) : {StudioEnvironment: overrides.StudioEnvironment}; },
  });
  return module.exports;
}
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
    module, THREE, performance, window: {addEventListener() {}, removeEventListener() {}}, getComputedStyle: () => ({getPropertyValue: () => '0px'}), ...CameraFrame, motionEase, MOTION, ...graphics(globals), console: {error() {}}, ...globals,
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
  const camera = new THREE.PerspectiveCamera(33, 1.5, .01, 2000);
  camera.position.set(0, 0, 60);
  const document = {addEventListener() {}, removeEventListener() {}};
  const element = {style: {}, ownerDocument: document, getRootNode: () => document, addEventListener() {}, removeEventListener() {}};
  const controls = new OrbitControls(camera, element);
  controls.enableDamping = true;
  controls.minDistance = 3;
  controls.maxDistance = 1500;
  const value = {
    generation: 0, dead: false, ready: false, busy: false, frame: 0, error: '', renderCount: 0,
    pieces: new Map(), loadedObjects: [], staged: new THREE.Group(), ghost: new THREE.Group(), ghostMaterial: new THREE.MeshBasicMaterial(), thumbnails: new Map(), scene: new THREE.Scene(),
    camera, controls, fitted: new Set(), current: null, active: false,
    target: new THREE.Vector3(), frameFocus: new THREE.Vector3(), stepBounds: new THREE.Box3(),
    manifest: {initialLeafIds: ['leaf'], packets: [], finalLeafIds: ['leaf'], targetPoses: {leaf: identity}}, notifications: [], updates: 0,
    notify(status) { this.notifications.push(status); },
    update() { this.updates++; }, positionStage() {}, updateSeat() {}, updateProjection() {}, available: true, seatVisible: true, seatInView: true, feedback() {},
  };
  for (const name of ['emit', 'disposeObject', 'clearPieces', 'load', 'stopOrbitMotion', 'presentContext']) value[name] = actual(name, value, globals);
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
  let finish, started;
  const slow = new Promise((resolve) => { finish = resolve; });
  const loadingStarted = new Promise((resolve) => { started = resolve; });
  const resources = [scene('leaf'), scene('other'), scene('diamond')];
  const v = fixture(loadGlobals({overview: async () => { started(); await slow; return resources[0].object; }, catalog: async () => resources[1].object, diamond: async () => resources[2].object}));
  const loading = v.load();
  await loadingStarted;
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

test('chrome layout changes preserve camera ownership without a detached drag tray', () => {
  for (const [width,height] of [[1440,900],[390,844],[320,568],[568,320]]) {
    const v=fixture(); let updates=0;
    const rect={left:0,top:0,width,height,right:width,bottom:height};
    const dock={top:height-260,left:width>height&&height<600?width*.52:0};
    const heading={bottom:60};
    Object.assign(v,{active:true,hasFramed:true,stage:{offsetHeight:64,style:{},querySelector:()=>null},
      host:{getBoundingClientRect:()=>rect,parentElement:{querySelector:selector=>({getBoundingClientRect:()=>selector==='.play-heading'?heading:selector==='.play-workspace'?{bottom:80}:dock})}},
      updateProjection(){updates++;},invalidate(){},reframe(){throw Error('Layout cannot claim camera ownership');},
    });
    const layout=actual('layout',v),before=v.camera.position.clone(),target=v.controls.target.clone();
    layout();dock.top-=10;layout();heading.bottom+=5;layout();
    assert.ok(v.camera.position.equals(before));assert.ok(v.controls.target.equals(target));
    assert.equal(updates,3);assert.ok(v.frameRegion.bottom>v.frameRegion.top);
    v.controls.dispose();
  }
});

function renderedFixture() {
  const callbacks = new Map();
  let next = 0;
  const globals = {
    requestAnimationFrame(callback) {const id = ++next; callbacks.set(id, callback); return id;},
    cancelAnimationFrame(id) {callbacks.delete(id);},
  };
  const v = fixture(globals);
  Object.assign(v, {ready: true, side: 'front', media: {matches: false}, draws: 0, renderer: {render() {v.draws++;}}});
  for (const name of ['render', 'invalidate', 'cameraChanged', 'flip', 'contextLost']) v[name] = actual(name, v, globals);
  v.controls.addEventListener('change', v.cameraChanged);
  function frame(now) {
    const entry = callbacks.entries().next().value;
    assert.ok(entry, 'A frame is scheduled');
    callbacks.delete(entry[0]); entry[1](now);
  }
  function settle(start, limit = 500) {
    let count = 0;
    while (callbacks.size && count < limit) frame(start + ++count * 16);
    assert.equal(callbacks.size, 0, 'Finite movement returns to idle');
    return count;
  }
  return {v, callbacks, frame, settle};
}

test('flip uses the shared orbit basis throughout a finite camera arc and reduced-motion endpoint', () => {
  for (const sign of [-1, 1]) for (const reduced of [false, true]) {
    const {v, callbacks, frame, settle} = renderedFixture();
    v.side = sign === 1 ? 'front' : 'back'; v.media.matches = reduced;
    v.camera.position.set(7, 5, sign * 60); v.camera.up.set(0, sign, 0);
    CameraFrame.syncOrbitUp(v.camera, v.controls); v.controls.update();
    settle(performance.now());
    const before = v.camera.position.clone(), up = v.camera.up.clone(), radius = before.length();
    v.flip();
    const start = v.cameraMotion.start, rotation = -sign * Math.PI;
    assert.equal(v.busy, true); assert.equal(v.controls.enabled, false);
    assert.ok(v.camera.position.distanceTo(before) < 1e-9, 'Flip does not jump at activation');
    frame(start + 100);
    assert.ok(Math.abs(v.camera.position.length() - radius) < 1e-8, 'Flip keeps a safe orbit radius');
    assert.ok(v.camera.up.clone().applyQuaternion(v.controls._quat).distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-8);
    if (!reduced) {assert.equal(v.busy, true); assert.ok(v.cameraMotion);}
    else {assert.equal(v.busy, false); assert.equal(v.cameraMotion, undefined);}
    settle(start + 100);
    assert.equal(v.cameraMotion, undefined); assert.equal(v.busy, false); assert.equal(v.controls.enabled, true);
    assert.ok(v.camera.position.distanceTo(before.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), rotation)) < 1e-8);
    assert.ok(v.camera.up.distanceTo(up.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), rotation)) < 1e-8);
    const count = v.draws;
    assert.equal(callbacks.size, 0); assert.equal(v.frame, 0);
    v.flip(); settle(v.cameraMotion.start);
    assert.ok(v.camera.position.distanceTo(before) < 1e-8, 'A second flip restores the original orbit');
    assert.ok(v.camera.up.distanceTo(up) < 1e-8); assert.ok(v.draws > count);
    v.controls.dispose();
  }
});

test('off-center assembly framing keeps its projected center fixed throughout flip and double flip', () => {
  for (const sign of [-1, 1]) for (const reduced of [false, true]) {
    const {v, callbacks, frame, settle} = renderedFixture();
    const center = new THREE.Vector3(3, -7, 2), halfSize = new THREE.Vector3(14, 14, 4);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(28, 28, 8), new THREE.MeshBasicMaterial());
    mesh.position.copy(center);
    v.pieces.set('leaf', {mesh, bounds: new THREE.Box3(center.clone().sub(halfSize), center.clone().add(halfSize))});
    v.fitted.add('leaf'); v.scene.add(mesh);
    Object.assign(v, {
      side: sign === 1 ? 'front' : 'back', host: {clientWidth: 390, clientHeight: 844},
      frameRegion: {top: 80, bottom: 400, left: 0, width: 390}, hasFramed: false,
    });
    v.camera.aspect = 390 / 844; v.camera.updateProjectionMatrix();
    v.media.matches = reduced;
    for (const name of ['boundsFor', 'reframe', 'project', 'updateProjection']) v[name] = actual(name, v);
    v.reframe(); settle(performance.now());
    assert.ok(v.frameFocus.distanceTo(center) < 1e-9, 'Framing stores the actual assembly center');
    assert.ok(v.controls.target.distanceTo(center) < 1e-9, 'Orbit pivot stays on geometry; projection reserves chrome space');
    const initialPoint = v.project(center), initialPosition = v.camera.position.clone(), initialTarget = v.controls.target.clone(), initialUp = v.camera.up.clone();
    assert.ok(Math.abs(initialPoint.x - 195) < 1e-8);
    assert.ok(Math.abs(initialPoint.y - 240) < 1e-8, 'Assembly appears in the deliberately off-center usable region');
    const centerDistance = v.camera.position.distanceTo(center);
    for (let turn = 0; turn < 2; turn++) {
      v.flip();
      const start = v.cameraMotion.start;
      assert.ok(v.cameraMotion.rotationPivot.distanceTo(center) < 1e-9);
      for (const fraction of reduced ? [1] : [.05, .15, .3, .5, .7, .9, 1]) {
        frame(start + MOTION.navigate * 1000 * fraction + .001);
        const point = v.project(center);
        assert.ok(Math.hypot(point.x - initialPoint.x, point.y - initialPoint.y) < 1e-7, `Projected assembly center stays clear of staging at flip fraction ${fraction}`);
        assert.ok(Math.abs(v.camera.position.distanceTo(center) - centerDistance) < 1e-8, 'The assembly remains at a fixed viewing distance');
        assert.ok(point.y >= v.frameRegion.top && point.y <= v.frameRegion.bottom);
      }
      settle(start + MOTION.navigate * 1000 + 1);
      assert.equal(callbacks.size, 0); assert.equal(v.busy, false);
      const point = v.project(center);
      assert.ok(Math.hypot(point.x - initialPoint.x, point.y - initialPoint.y) < 1e-7);
    }
    assert.ok(v.camera.position.distanceTo(initialPosition) < 1e-8);
    assert.ok(v.controls.target.distanceTo(initialTarget) < 1e-8);
    assert.ok(v.camera.up.distanceTo(initialUp) < 1e-8);
    mesh.geometry.dispose(); mesh.material.dispose(); v.controls.dispose();
  }
});

test('Reset and Home preserve the viewed side and assembly while Guide restores the authored screw view', () => {
  for (const authoredSide of ['front', 'back']) for (const viewedSide of ['front', 'back']) for (const reduced of [false, true]) for (const action of ['reset', 'home']) {
    const {v, settle} = renderedFixture();
    const authoredSign = authoredSide === 'front' ? 1 : -1, viewedSign = viewedSide === 'front' ? 1 : -1;
    const screw = {
      id: 'radial-retaining-screw', side: authoredSide, leafIds: ['leaf'], focusLeafIds: ['leaf'],
      contextLeafIds: ['foundation'], viewDirectionWorld: [.8, .25, authoredSign * .45],
    };
    const part = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 2), new THREE.MeshBasicMaterial());
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 1), new THREE.MeshBasicMaterial());
    v.pieces.set('leaf', {mesh: part, bounds: new THREE.Box3(new THREE.Vector3(-.5, -.5, -1), new THREE.Vector3(.5, .5, 1))});
    v.pieces.set('foundation', {mesh: foundation, bounds: new THREE.Box3(new THREE.Vector3(-5, -5, -2), new THREE.Vector3(5, 5, -1))});
    v.scene.add(part, foundation); v.fitted.add('foundation'); v.manifest.initialLeafIds=['foundation'];
    let commits = 0, prevented = 0;
    Object.assign(v, {
      active: true, current: screw, side: viewedSide, hasFramed: false,
      host: {clientWidth: 390, clientHeight: 844}, frameRegion: {top: 80, bottom: 400, left: 0, width: 390},
      destination: {style: {}}, placed() {commits++;},
    });
    v.camera.aspect = 390 / 844; v.camera.updateProjectionMatrix(); v.media.matches = reduced;
    for (const name of ['boundsFor', 'reframe', 'project', 'resetView', 'guide', 'keyDown', 'updateProjection']) v[name] = actual(name, v);
    v.reframe(); settle(performance.now());
    CameraFrame.orbitCamera(v.camera, v.controls, .2, .2); settle(performance.now());
    const fitted = v.fitted, current = v.current;
    if (action === 'reset') v.resetView();
    else v.keyDown({key: 'Home', preventDefault() {prevented++;}});
    settle(v.cameraMotion?.start ?? performance.now());
    const straight = v.camera.position.clone().sub(v.controls.target).normalize();
    assert.ok(straight.distanceTo(new THREE.Vector3(0, 0, viewedSign)) < 1e-8, `${action} is straight-on even when a screw has an authored oblique view`);
    assert.ok(v.camera.up.distanceTo(new THREE.Vector3(0, viewedSign, 0)) < 1e-8);
    assert.equal(v.side, viewedSide); assert.equal(v.current, current); assert.equal(v.fitted, fitted);
    assert.deepEqual([...v.fitted], ['foundation']); assert.equal(commits, 0);
    assert.equal(prevented, action === 'home' ? 1 : 0);
    v.guide(); settle(v.cameraMotion?.start ?? performance.now());
    assert.equal(v.side, authoredSide, 'Guide deliberately restores the part’s authored side');
    const guided = v.camera.position.clone().sub(v.controls.target).normalize();
    assert.ok(guided.distanceTo(new THREE.Vector3().fromArray(screw.viewDirectionWorld).normalize()) < 1e-8, 'Guide restores the oblique radial-screw destination');
    assert.equal(v.current, current); assert.equal(v.fitted, fitted); assert.equal(commits, 0);
    assert.equal(v.busy, false); assert.equal(v.frame, 0);
    part.geometry.dispose(); part.material.dispose(); foundation.geometry.dispose(); foundation.material.dispose(); v.controls.dispose();
  }
});

test('capturing a part clears orbit inertia and prevents flip or camera drift during dragging', () => {
  const {v, callbacks, settle} = renderedFixture();
  Object.assign(v, {
    active: true, current: {id: 'offered-part'}, point: () => ({x: 40, y: 50}), stagePoint: () => ({x: 40, y: 50}),
    stage: {addEventListener() {}, removeEventListener() {}, setPointerCapture() {}, hasPointerCapture() {return true;}, releasePointerCapture() {}},
    destination: {dataset: {}, style: {}}, selected() {}, project() {return {x: 100, y: 100};},
  });
  for (const name of ['beginDrag', 'cancel', 'releaseCapture', 'reframe']) v[name] = actual(name, v);
  v.controls._sphericalDelta.theta = .6;
  v.controls.update();
  assert.ok(v.controls._sphericalDelta.theta !== 0, 'A real damped orbit has inertia');
  const before = v.camera.position.clone(), side = v.side;
  v.beginDrag({button: 0, pointerId: 7, preventDefault() {}, stopPropagation() {}}, v.stage);
  assert.equal(v.controls.enabled, false); assert.ok(v.drag);
  assert.equal(v.controls._sphericalDelta.theta, 0); assert.equal(v.controls._sphericalDelta.phi, 0);
  v.flip(); assert.equal(v.cameraMotion, undefined); assert.equal(v.side, side);
  v.reframe(true); assert.equal(v.cameraMotion, undefined, 'Guidance also cannot turn during capture');
  settle(performance.now());
  assert.ok(v.camera.position.distanceTo(before) < 1e-10, 'Captured part keeps its screen-space target fixed');
  assert.equal(callbacks.size, 0);
  v.cancel(); settle(performance.now());
  assert.equal(v.drag, undefined); assert.equal(v.controls.enabled, true);
  assert.ok(v.camera.position.distanceTo(before) < 1e-10, 'Old inertia does not resume after cancellation');
  v.controls.dispose();
});

test('drag positioning preserves source scale independently of viewport or part size', () => {
  const v=fixture();
  Object.assign(v,{ready:true,current:{id:'tiny-jewel'},stagePoint:()=>({x:10,y:20}),planePoint:p=>new THREE.Vector3(p.x,p.y,3)});
  v.positionStage=actual('positionStage',v);
  for(const oldScale of [.01,1,8,120]) {
    v.staged.scale.setScalar(oldScale);
    v.positionStage({x:30,y:50},oldScale);
    assert.deepEqual(v.staged.scale.toArray(),[1,1,1]);
    assert.deepEqual(v.staged.position.toArray(),[30,50,3]);
  }
  v.controls.dispose();
});

test('inventory drag capture owns and removes its temporary listeners on cancel and release', () => {
  const {v, settle} = renderedFixture();
  const listeners = new Map(), captured = new Set();
  const origin = {
    addEventListener(name, listener) {listeners.set(name, listener);},
    removeEventListener(name, listener) {assert.equal(listeners.get(name), listener); listeners.delete(name);},
    setPointerCapture(id) {captured.add(id);}, hasPointerCapture(id) {return captured.has(id);},
    releasePointerCapture(id) {captured.delete(id);},
  };
  Object.assign(v, {
    active: true, current: {id: 'gallery-part'}, point: () => ({x: 160, y: 500}),
    stage: {}, destination: {dataset: {}}, selected() {},
  });
  for (const name of ['beginDrag', 'cancel', 'releaseCapture']) v[name] = actual(name, v);
  const event = {button: 0, pointerId: 9, preventDefault() {}, stopPropagation() {}};
  for (const finish of ['cancel', 'releaseCapture']) {
    assert.equal(v.beginDrag(event, origin), true);
    assert.equal(listeners.size, 4); assert.equal(captured.size, 1);
    assert.equal(v.drag.position.x, 160); assert.equal(v.drag.position.y, 500);
    assert.equal(v.drag.grab.x, 0); assert.equal(v.drag.grab.y, 0);
    assert.equal(v.controls.enabled, false);
    v[finish](); settle(performance.now());
    assert.equal(listeners.size, 0); assert.equal(captured.size, 0);
    assert.equal(v.captureElement, undefined); assert.equal(v.drag, undefined);
    assert.equal(v.controls.enabled, true);
  }
  v.hints = true; v.available = false;
  assert.equal(v.beginDrag(event, origin), false);
  assert.equal(listeners.size, 0); assert.equal(captured.size, 0);
  v.controls.dispose();
});

test('real OrbitControls damping drives a bounded render tail and then sleeps', () => {
  const {v, callbacks, settle} = renderedFixture();
  v.controls._sphericalDelta.theta = .7;
  v.controls.update();
  assert.ok(callbacks.size > 0);
  const start = v.camera.position.clone();
  const frames = settle(performance.now());
  assert.ok(frames > 5 && frames < 500, `Damping settles in ${frames} frames`);
  assert.ok(v.camera.position.distanceTo(start) > 1, 'The tail applies real camera motion');
  assert.equal(v.frame, 0); assert.equal(callbacks.size, 0);
  const draws = v.draws;
  assert.equal(callbacks.size, 0); assert.equal(v.draws, draws);
  v.controls.dispose();
});

test('context loss cancels a camera turn without committing or leaving a scheduled render tail', () => {
  const {v, callbacks, frame} = renderedFixture();
  v.cancel = actual('cancel', v);
  v.flip(); frame(v.cameraMotion.start + 100);
  assert.ok(v.cameraMotion);
  v.contextLost({preventDefault() {}});
  assert.equal(v.cameraMotion, undefined); assert.equal(v.busy, false); assert.equal(v.ready, false);
  assert.equal(v.controls.enabled, false); assert.equal(v.frame, 0); assert.equal(callbacks.size, 0);
  v.controls.dispose();
});

test('beauty or contact-render failure stops pending damping frames and exposes retry', () => {
  for (const pass of ['beauty', 'occlusion']) {
    const {v, callbacks, frame} = renderedFixture();
    v.controls._sphericalDelta.theta = .5;
    v.controls.update();
    let attempts = 0;
    const fail = () => {attempts++; throw Error(`Injected ${pass} failure`);};
    if (pass === 'beauty') v.renderer.render = fail;
    else v.surfaceOcclusion = {render: fail};
    assert.doesNotThrow(() => frame(performance.now()));
    assert.equal(v.ready, false); assert.equal(v.busy, false); assert.equal(v.controls.enabled, false);
    assert.match(v.error, /could not render.*Retry/);
    assert.equal(v.animation, undefined); assert.equal(v.cameraMotion, undefined);
    assert.equal(callbacks.size, 0, 'A failed renderer must stay idle until retry');
    v.render(performance.now() + 16);
    assert.equal(attempts, 1, 'A late frame cannot retry a broken renderer');
    v.controls.dispose();
  }
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
    v.staged.scale.setScalar(1);
    for (const name of ['invalidate', 'render', 'animate', 'place']) v[name] = actual(name, v, globals);
    v.place(); v.place(); v.place();
    assert.equal(v.busy, true); assert.equal(v.controls.enabled, false); assert.equal(commits, 0);
    const start = v.animation.start;
    callbacks.shift()(start + 100);
    assert.equal(commits, reduced ? 1 : 0);
    if (!reduced) callbacks.shift()(start + 240);
    assert.equal(commits, 1); assert.equal(v.busy, false); assert.equal(v.controls.enabled, true);
    assert.equal(v.animation, undefined); assert.equal(callbacks.length, 0); assert.equal(v.frame, 0);
    assert.ok(scales.length && scales.every(s=>s===1), 'Pickup and settling both retain true physical scale');
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
    controls: {removeEventListener() {}, dispose() {releases.push('controls');}}, environment: {dispose() {releases.push('environment');}}, surfaceOcclusion: {dispose() {releases.push('occlusion');}},
    stage: {removeEventListener(name) {releases.push(`stage:${name}`);}},
    media: {removeEventListener(name) {releases.push(`media:${name}`);}},
    renderer: {dispose() {releases.push('renderer');}, domElement: {removeEventListener(name) {releases.push(`canvas:${name}`);}, remove() {releases.push('canvas');}}},
  });
  const dispose = actual('dispose', v, {cancelAnimationFrame: (id) => {assert.equal(id, 19); releases.push('frame');}});
  dispose(); dispose();
  assert.equal(v.dead, true); assert.equal(v.pieces.size, 0); assert.equal(v.loadedObjects.length, 0);
  assert.deepEqual(original.disposal, {geometry: 1, material: 1}); assert.equal(displayDisposed, 1);
  for (const key of ['capture', 'observer', 'controls', 'environment', 'occlusion', 'renderer', 'canvas', 'frame', 'media:change',
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
  class Controls {touches = {}; addEventListener() {} removeEventListener() {} dispose() {released.push('controls');}}
  class Room {dispose() {released.push('room');}}
  class Pmrem {fromScene() {throw Error('Injected environment failure');} dispose() {released.push('pmrem');}}
  const globals = {THREE: {...THREE, WebGLRenderer: Renderer, PMREMGenerator: Pmrem}, OrbitControls: Controls, StudioEnvironment: Room, devicePixelRatio: 1, cancelAnimationFrame() {}};
  const v = fixture();
  Object.assign(v, {stage: {removeEventListener() {}}, destination: {dataset: {}}, media: {removeEventListener() {}}});
  for (const name of ['makeEnvironment', 'dispose', 'releaseCapture']) v[name] = actual(name, v, globals);
  const constructor = declaration.members.find(ts.isConstructorDeclaration), module = {exports: {}};
  vm.runInNewContext(ts.transpileModule(`module.exports = function(host,stage,destination,manifest,notify,placed,selected) ${constructor.body.getText(source)}`, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText, {module, window: {addEventListener() {}, removeEventListener() {}}, ...graphics(globals), ...globals});
  assert.throws(() => module.exports.call(v, {appendChild() {}}, v.stage, v.destination, v.manifest, () => {}, () => {}, () => {}), /Injected environment failure/);
  assert.equal(v.dead, true);
  for (const key of ['renderer', 'controls', 'canvas', 'room', 'pmrem']) assert.equal(released.filter((value) => value === key).length, 1, key);
});


test('route exit during metadata loading never starts geometry or recovery requests', async () => {
  let finish, requests = 0;
  const gate = new Promise((resolve) => {finish = resolve;});
  const globals = loadGlobals({overview: async () => {requests++;}, catalog: async () => {requests++;}, diamond: async () => {requests++;}, surfaces: async () => {requests++;}});
  const fetch = globals.fetch;
  globals.fetch = async (...args) => { await gate; return fetch(...args); };
  const v = fixture(globals);
  const loading = v.load();
  v.dead = true; v.generation++;
  const notifications = v.notifications.length;
  finish(); await loading;
  assert.equal(requests, 0);
  assert.equal(v.notifications.length, notifications);
  assert.equal(v.pieces.size, 0);
});

test('leaf preparation failure keeps the previous complete scene and releases new resources exactly once', async () => {
  for (const fault of ['surface', 'pose', 'finish']) {
    const original = scene('leaf'), next = scene('leaf'), second = scene('second');
    next.object.add(second.object);
    let attempt = 0, materialsReleased = 0;
    const globals = loadGlobals({overview: async () => attempt ? next.object : original.object, catalog: async () => new THREE.Group(), diamond: async () => new THREE.Group()});
    const fetch = globals.fetch;
    globals.fetch = async (...args) => {
      const response = await fetch(...args), json = response.json;
      response.json = async () => {
        const value = await json();
        if (value.instances) value.instances.push({id: 'second', name: 'second', definitionId: 'second'});
        return value;
      };
      return response;
    };
    globals.setFinishEnabled = () => { if (attempt && fault === 'finish') throw Error('Injected finish initialization failure'); };
    globals.attachSourceSurface = (_geometry, data) => { if (data === 'bad') throw Error('Injected surface error'); };
    globals.loadSourceSurfaces = async () => new Map(attempt && fault === 'surface' ? [['second', 'bad']] : []);
    globals.createMaterial = () => {
      const material = new THREE.MeshBasicMaterial();
      material.addEventListener('dispose', () => materialsReleased++);
      return material;
    };
    const v = fixture(globals);
    await v.load();
    assert.equal(v.ready, true);
    const previous = v.pieces.get('leaf').mesh;
    attempt++;
    v.manifest.finalLeafIds.push('second');
    if (fault === 'surface') v.manifest.targetPoses.second = identity;
    await v.load();
    assert.equal(v.ready, false);
    assert.match(v.error, /could not load/);
    assert.equal(v.pieces.size, 1);
    assert.equal(v.pieces.get('leaf').mesh, previous);
    assert.equal(previous.parent, v.scene);
    assert.deepEqual(original.disposal, {geometry: 0, material: 0});
    assert.deepEqual(next.disposal, {geometry: 1, material: 1});
    assert.deepEqual(second.disposal, {geometry: 1, material: 1});
    assert.equal(materialsReleased, fault === 'pose' ? 2 : 1);
    v.clearPieces();
    assert.deepEqual(original.disposal, {geometry: 1, material: 1});
  }
});

test('selection and undo updates preserve camera, fitted visibility and shared source materials', () => {
  const v=fixture();
  const plate=new THREE.Mesh(new THREE.BoxGeometry(20,20,1),new THREE.MeshBasicMaterial());
  const incoming=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial());
  const pose=new THREE.Matrix4().makeTranslation(2,3,1);
  for(const [id,mesh,matrix] of [['plate',plate,new THREE.Matrix4()],['piece',incoming,pose]]) {
    mesh.matrixAutoUpdate=false;mesh.matrix.copy(matrix);v.scene.add(mesh);
    v.pieces.set(id,{mesh,pose:matrix,bounds:new THREE.Box3().setFromBufferAttribute(mesh.geometry.getAttribute('position')).applyMatrix4(matrix)});
  }
  Object.assign(v,{ready:true,hasFramed:true,active:true,available:true,hints:true,seatSamples:[],cancel(){},invalidate(){},layout(){throw Error('Selection cannot reframe');},reframe(){throw Error('Selection cannot reframe');}});
  const step={id:'piece',leafIds:['piece'],side:'back'};
  v.camera.position.set(12,8,65);v.controls.target.set(2,4,1);v.camera.up.set(0,1,0);
  const before=[v.camera.position.clone(),v.controls.target.clone(),v.camera.up.clone()],material=plate.material;
  v.cameraMotion={start:0};
  actual('update',v)(new Set(['plate']),step,true);
  assert.equal(v.cameraMotion,undefined,'Old guided motion cannot resume after selection');
  assert.ok(v.camera.position.equals(before[0]));assert.ok(v.controls.target.equals(before[1]));assert.ok(v.camera.up.equals(before[2]));
  assert.equal(plate.visible,true);assert.equal(incoming.visible,false);assert.equal(plate.material,material);assert.equal(material.opacity,1);
  assert.equal(v.staged.children[0].material,incoming.material,'Staging keeps the authored finish');
  assert.notEqual(v.ghost.children[0].material,incoming.material,'Hint overlay owns a separate material');
  v.camera.position.set(-20,10,-60);v.presentContext();assert.equal(plate.visible,true,'Orbit must never hide opaque fitted geometry');
  const orbited=v.camera.position.clone();actual('update',v)(new Set(['plate']),null,true);
  assert.ok(v.camera.position.equals(orbited),'Clearing selection/undo does not choose a face');
  assert.equal(material.opacity,1);assert.equal(material.transparent,false);
  for(const mesh of [plate,incoming]){mesh.geometry.dispose();mesh.material.dispose();}v.ghostMaterial.dispose();v.controls.dispose();
});

test('a source seat behind an opaque fitted surface rejects placement without hiding that surface',()=>{
  const v=fixture();
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(10,10,1),new THREE.MeshBasicMaterial());mesh.position.z=5;mesh.userData.partId='cover';v.scene.add(mesh);v.pieces.set('cover',{mesh});v.scene.updateMatrixWorld(true);
  v.occludersAt=actual('occludersAt',v);v.visibleSeat=actual('visibleSeat',v);
  assert.deepEqual(Array.from(v.occludersAt(new THREE.Vector3())),['cover','cover']);
  assert.equal(v.visibleSeat(new THREE.Vector3()),false);assert.equal(mesh.visible,true);assert.equal(mesh.material.opacity,1);
  assert.equal(v.visibleSeat(new THREE.Vector3(10,0,0)),true,'An actually clear ray can be used');
  mesh.material.transparent=true;mesh.material.opacity=.2;
  assert.equal(v.visibleSeat(new THREE.Vector3()),true,'Genuinely authored transparency is retained');
  assert.equal(mesh.material.opacity,.2);mesh.geometry.dispose();mesh.material.dispose();v.controls.dispose();
});
