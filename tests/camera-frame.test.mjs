/** Real OrbitControls with a DOM event facade; no browser/WebGL emulation claims. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as THREE from '../explorer/node_modules/three/build/three.module.js';
import {OrbitControls} from '../explorer/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {
  syncOrbitUp, orbitCamera, zoomCamera, KEYBOARD_ORBIT_MOVES,
  KEYBOARD_ORBIT_STEP, KEYBOARD_ZOOM_IN, KEYBOARD_ZOOM_OUT,
} from '../explorer/src/viewer/CameraFrame.ts';

function eventSurface() {
  const listeners = new Map();
  return {
    style: {}, clientWidth: 900, clientHeight: 600,
    addEventListener(name, fn) {if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn);},
    removeEventListener(name, fn) {listeners.get(name)?.delete(fn);},
    emit(name, event) {for (const fn of [...(listeners.get(name) ?? [])]) fn(event);},
    setPointerCapture() {}, releasePointerCapture() {},
  };
}
function rig(up = 1, z = 60) {
  const element = eventSurface(), document = eventSurface();
  element.ownerDocument = document; element.getRootNode = () => document;
  const camera = new THREE.PerspectiveCamera(33, 1.5, .01, 2000);
  camera.position.set(0, 0, z); camera.up.set(0, up, 0);
  const controls = new OrbitControls(camera, element);
  controls.enablePan = false; controls.maxDistance = 200;
  return {element, document, camera, controls};
}
function drag(v, dx, dy, pointerType = 'mouse') {
  const event = (x, y) => ({pointerId: 1, pointerType, button: 0, clientX: x, clientY: y, pageX: x, pageY: y, preventDefault() {}});
  v.element.emit('pointerdown', event(400, 300));
  v.document.emit('pointermove', event(400 + dx, 300 + dy));
  v.document.emit('pointerup', event(400 + dx, 300 + dy));
}
function sameFrame(a, b) {
  assert.ok(a.camera.position.distanceTo(b.camera.position) < 1e-9);
  assert.ok(a.camera.up.distanceTo(b.camera.up) < 1e-12);
  assert.ok(a.camera.getWorldDirection(new THREE.Vector3()).distanceTo(b.camera.getWorldDirection(new THREE.Vector3())) < 1e-9);
  assert.ok(new THREE.Vector3(1, 0, 0).applyQuaternion(a.camera.quaternion).distanceTo(new THREE.Vector3(1, 0, 0).applyQuaternion(b.camera.quaternion)) < 1e-9);
}

test('turning the camera up synchronizes real OrbitControls to fresh controls on both faces', () => {
  for (const sign of [-1, 1]) for (const [dx, dy] of [[30, 0], [0, 30], [-20, 25]]) for (const pointerType of ['mouse', 'touch']) {
    const reused = rig(-sign, -sign * 60), fresh = rig(sign, sign * 60);
    reused.camera.up.set(0, sign, 0); reused.camera.position.set(0, 0, sign * 60);
    syncOrbitUp(reused.camera, reused.controls); reused.controls.update();
    sameFrame(reused, fresh);
    drag(reused, dx, dy, pointerType); drag(fresh, dx, dy, pointerType);
    sameFrame(reused, fresh);
    assert.ok(Math.abs(reused.camera.position.length() - 60) < 1e-9, 'Orbit preserves camera distance');
    reused.controls.dispose(); fresh.controls.dispose();
  }
});

test('cached-basis regression is observable: an unsynchronized face turn reverses pointer motion', () => {
  const stale = rig(-1, -60), fixed = rig(-1, -60);
  for (const v of [stale, fixed]) {v.camera.up.set(0, 1, 0); v.camera.position.set(0, 0, 60);}
  syncOrbitUp(fixed.camera, fixed.controls);
  stale.controls.update(); fixed.controls.update();
  drag(stale, 30, 0); drag(fixed, 30, 0);
  assert.ok(stale.camera.position.x * fixed.camera.position.x < 0, 'The original cache mismatch reverses the horizontal drag');
  stale.controls.dispose(); fixed.controls.dispose();
});

test('shared keyboard steps preserve explorer world-axis orbit and zoom bounds on both faces', () => {
  assert.equal(KEYBOARD_ORBIT_STEP, .2); assert.equal(KEYBOARD_ZOOM_IN, .83); assert.equal(KEYBOARD_ZOOM_OUT, 1.2);
  for (const sign of [-1, 1]) for (const [key, move] of Object.entries(KEYBOARD_ORBIT_MOVES)) {
    const v = rig(sign, sign * 60);
    const before = new THREE.Spherical().setFromVector3(v.camera.position);
    orbitCamera(v.camera, v.controls, ...move);
    const after = new THREE.Spherical().setFromVector3(v.camera.position);
    const angle = Math.atan2(Math.sin(after.theta - before.theta), Math.cos(after.theta - before.theta));
    assert.ok(Math.abs(angle - move[0]) < 1e-9, key);
    assert.ok(Math.abs(after.phi - before.phi - move[1]) < 1e-9, key);
    assert.ok(Math.abs(after.radius - 60) < 1e-9);
    zoomCamera(v.camera, v.controls, KEYBOARD_ZOOM_IN);
    assert.ok(Math.abs(v.camera.position.length() - 49.8) < 1e-9);
    zoomCamera(v.camera, v.controls, KEYBOARD_ZOOM_OUT);
    assert.ok(Math.abs(v.camera.position.length() - 59.76) < 1e-9);
    zoomCamera(v.camera, v.controls, .0001);
    assert.ok(Math.abs(v.camera.position.length() - 3) < 1e-9);
    zoomCamera(v.camera, v.controls, 1000);
    assert.ok(Math.abs(v.camera.position.length() - 200) < 1e-9);
    v.controls.dispose();
  }
});

test('orbit clamps away from the poles without moving the orbit target', () => {
  const v = rig();
  v.controls.target.set(2, 3, 4); v.camera.position.set(2, 3, 64); v.controls.update();
  orbitCamera(v.camera, v.controls, 0, -100);
  let spherical = new THREE.Spherical().setFromVector3(v.camera.position.clone().sub(v.controls.target));
  assert.ok(Math.abs(spherical.phi - .02) < 1e-9);
  orbitCamera(v.camera, v.controls, 0, 100);
  spherical = new THREE.Spherical().setFromVector3(v.camera.position.clone().sub(v.controls.target));
  assert.ok(Math.abs(spherical.phi - (Math.PI - .02)) < 1e-9);
  assert.ok(v.controls.target.distanceTo(new THREE.Vector3(2, 3, 4)) < 1e-12);
  v.controls.dispose();
});

test('homepage wrappers retain manual camera ownership, spread pan and travel cancellation', () => {
  const require = createRequire(import.meta.url), ts = require('../explorer/node_modules/typescript');
  const source = ts.createSourceFile('MovementViewer.ts', fs.readFileSync(new URL('../explorer/src/viewer/MovementViewer.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
  const declaration = source.statements.find(ts.isClassDeclaration);
  const v = rig(), actions = [];
  Object.assign(v, {state: {layout: 'assembly'}, travel: {active: true}, manual() {actions.push('manual');}, invalidate() {actions.push('invalidate');}, pan(dx, dy) {actions.push(['pan', dx, dy]);}});
  for (const name of ['orbit', 'zoom', 'syncOrbitUp']) {
    const node = declaration.members.find((entry) => entry.name?.getText(source) === name), module = {exports: {}};
    const code = ts.transpileModule(`module.exports = function ${node.getText(source).replace(`${name}(`, 'wrapper(')}`, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
    vm.runInNewContext(code, {module, orbitCamera, zoomCamera, syncOrbitUp});
    v[name] = module.exports.bind(v);
  }
  v.orbit(.2, 0); assert.deepEqual(actions, ['manual', 'invalidate']); assert.equal(v.travel, null);
  actions.length = 0; v.travel = {active: true}; v.zoom(.83);
  assert.deepEqual(actions, ['manual', 'invalidate']); assert.equal(v.travel, null);
  actions.length = 0; v.travel = {active: true}; v.state.layout = 'spread';
  const camera = v.camera.position.clone(); v.orbit(.2, -.2);
  assert.deepEqual(actions, ['manual', ['pan', .2, -.2]]); assert.deepEqual(v.travel, {active: true});
  assert.ok(v.camera.position.equals(camera));
  v.camera.up.set(0, -1, 0); v.syncOrbitUp();
  assert.ok(v.camera.up.clone().applyQuaternion(v.controls._quat).distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-9);
  v.controls.dispose();
});
