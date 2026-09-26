/** Exercise the actual homepage frame owner with real OrbitControls and a deterministic RAF queue. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as THREE from '../explorer/node_modules/three/build/three.module.js';
import {OrbitControls} from '../explorer/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {motionEase, MOTION} from '../explorer/src/experience/motion.ts';
const require = createRequire(import.meta.url);
const ts = require('../explorer/node_modules/typescript');
const source = ts.createSourceFile('MovementViewer.ts', fs.readFileSync(new URL('../explorer/src/viewer/MovementViewer.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const declaration = source.statements.find(ts.isClassDeclaration);
function actual(name, fixture, globals) {
  const member = declaration.members.find(node => node.name?.getText(source) === name);
  const arrow = ts.isPropertyDeclaration(member);
  const code = arrow ? `module.exports = function() { return ${member.initializer.getText(source)}; };` : `module.exports = function ${member.getText(source)};`;
  const module = {exports: {}};
  vm.runInNewContext(ts.transpileModule(code, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText, {module, THREE, performance, motionEase, MOTION, ...globals});
  return arrow ? module.exports.call(fixture) : module.exports.bind(fixture);
}
function fixture() {
  const callbacks = new Map(), document = {hidden: false};
  let serial = 0, now = 1000, draws = 0, snapshots = 0;
  const globals = {
    document,
    requestAnimationFrame(callback) {callbacks.set(++serial, callback); return serial;},
    cancelAnimationFrame(id) {callbacks.delete(id);},
  };
  const camera = new THREE.PerspectiveCamera(33, 1, .01, 2000);
  camera.position.set(0, 0, 80);
  const domDocument = {addEventListener() {}, removeEventListener() {}};
  const element = {style: {}, getRootNode: () => domDocument, ownerDocument: domDocument, addEventListener() {}, removeEventListener() {}};
  const controls = new OrbitControls(camera, element);
  controls.enableDamping = true;
  const v = {
    frame: 0, dead: false, contextLost: false, contextLosses: 0, loadStage: 'ready', ready: true,
    needsRender: false, lastFrame: 0, lastNotify: 0, renderCount: 0, frameIntervals: [], snapshotPending: false,
    state: {quality: 'high', phase: 'whole'}, scene: new THREE.Scene(), camera, controls,
    presentationMoving: false, travel: null, benchmark: null,
    applyPose() {return false;}, retargetVisibility() {}, ensureFramingRange() {}, adjustQuality() {},
    renderer: {render() {draws++;}, info: {render: {triangles: 1, calls: 1}}},
    surfaceOcclusion: {render() {}}, emit() {snapshots++; this.snapshotPending = false;},
  };
  for (const name of ['scheduleFrame', 'requestRender', 'invalidate', 'tick', 'onVisibility', 'onContextLost'])
    v[name] = actual(name, v, globals);
  const accessors = declaration.members.filter(node => (ts.isGetAccessor(node) || ts.isSetAccessor(node)) && node.name?.getText(source) === 'inspectionFrame');
  const module = {exports: {}};
  vm.runInNewContext(ts.transpileModule(`module.exports = class {${accessors.map(node => node.getText(source)).join('\n')}}`, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText, {module});
  Object.defineProperty(v, 'inspectionFrame', Object.getOwnPropertyDescriptor(module.exports.prototype, 'inspectionFrame'));
  controls.addEventListener('change', v.invalidate);
  function frame() {
    now += 16;
    const pending = [...callbacks.values()]; callbacks.clear();
    for (const callback of pending) callback(now);
  }
  function settle() {
    let count = 0;
    while (callbacks.size && count < 500) {frame(); count++;}
    assert.equal(callbacks.size, 0, `Frames must settle within 500 callbacks (ran ${count})`);
    return count;
  }
  return {v, document, callbacks, frame, settle, draws: () => draws, snapshots: () => snapshots};
}

test('homepage coalesces redraws, publishes its terminal state and schedules no idle callback', () => {
  const f = fixture();
  for (let i = 0; i < 20; i++) f.v.invalidate();
  assert.equal(f.callbacks.size, 1);
  f.settle();
  assert.equal(f.draws(), 1);
  assert.equal(f.snapshots(), 1);
  assert.equal(f.v.frame, 0); assert.equal(f.v.lastFrame, 0);
  f.v.invalidate(); f.settle();
  assert.equal(f.draws(), 2); assert.equal(f.snapshots(), 2);
  f.v.dead = true; f.v.invalidate();
  assert.equal(f.callbacks.size, 0);
  f.v.controls.dispose();
});

test('real homepage orbit inertia and pose transitions finish exactly before sleeping', () => {
  const f = fixture();
  f.v.controls._sphericalDelta.theta = .6;
  f.v.controls.update();
  const position = f.v.camera.position.clone();
  const tail = f.settle();
  assert.ok(tail > 5 && tail < 500);
  assert.ok(f.v.camera.position.distanceTo(position) > 1);
  assert.equal(f.v.frame, 0);
  let poses = 4;
  f.v.applyPose = () => --poses > 0;
  f.v.requestRender(); f.settle();
  assert.equal(poses, 0);
  assert.equal(f.v.presentationMoving, false);
  assert.equal(f.v.snapshotPending, false);
  // Start the independent guided-camera check without the earlier orbit's residual delta.
  f.v.controls.enableDamping = false; f.v.controls.update(); f.v.controls.enableDamping = true;
  const target = f.v.camera.position.clone().multiplyScalar(.8);
  f.v.travel = {position: target, target: f.v.controls.target.clone(), duration: .1};
  f.v.requestRender(); f.settle();
  assert.equal(f.v.travel, null);
  assert.ok(f.v.camera.position.distanceTo(target) < 1e-8);
  f.v.controls.dispose();
});

test('hidden and lost-context viewers suspend callbacks and wake for a new visible request', () => {
  const f = fixture();
  f.v.invalidate(); f.document.hidden = true; f.v.onVisibility();
  assert.equal(f.callbacks.size, 0); assert.equal(f.v.frame, 0);
  f.v.invalidate(); assert.equal(f.callbacks.size, 0);
  f.document.hidden = false; f.v.onVisibility(); f.settle();
  assert.equal(f.draws(), 1);
  f.v.invalidate(); f.v.onContextLost({preventDefault() {}});
  assert.equal(f.callbacks.size, 0); assert.equal(f.v.frame, 0);
  f.v.invalidate(); assert.equal(f.callbacks.size, 0);
  f.v.contextLost = false; f.v.loadStage = 'recovering'; f.v.awaitingFirstFrame = true;
  f.v.requestRender(); f.settle();
  assert.equal(f.v.ready, true); assert.equal(f.v.loadStage, 'ready');
  assert.equal(f.draws(), 2); f.v.controls.dispose();
});

test('render failure cancels a queued damping tail and a successful retry returns to sleep', () => {
  const f = fixture();
  f.v.controls._sphericalDelta.theta = .5;
  f.v.controls.update();
  f.v.surfaceOcclusion.render = () => {throw Error('Injected contact failure');};
  f.frame();
  assert.equal(f.v.loadStage, 'error'); assert.equal(f.v.ready, false);
  assert.equal(f.callbacks.size, 0); assert.equal(f.v.frame, 0);
  f.v.invalidate(); assert.equal(f.callbacks.size, 0);
  f.v.surfaceOcclusion.render = () => {};
  f.v.loadStage = 'preparing'; f.v.awaitingFirstFrame = true; f.v.loadStart = performance.now();
  f.v.requestRender(); f.settle();
  assert.equal(f.v.ready, true); assert.equal(f.callbacks.size, 0);
  f.v.controls.dispose();
});

test('opt-in inspection wakes a sleeping viewer and benchmarks sustain only their active interval', () => {
  const f = fixture();
  let samples = 0;
  f.v.inspectionFrame = () => { if (++samples === 4) f.v.inspectionFrame = undefined; };
  assert.equal(f.callbacks.size, 1);
  f.settle(); assert.equal(samples, 4);
  assert.equal(f.draws(), 0, 'Inspection callbacks alone need no GPU redraw');
  let benchmarkFrames = 0;
  f.v.benchmark = {done: false, onFrame(viewer) {
    if (this.done) return;
    benchmarkFrames++;
    viewer.requestRender();
    if (benchmarkFrames === 5) this.done = true;
  }};
  f.v.requestRender(); f.settle();
  assert.equal(benchmarkFrames, 5);
  f.v.controls.dispose();
});
