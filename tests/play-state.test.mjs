import test from 'node:test';
import assert from 'node:assert/strict';
import actualManifest from '../assets/authored/play-manifest.json' with { type: 'json' };
import {
  PLAY_STORAGE_KEY, SNAP_RADIUS_PX, createSession, currentStep, fittedLeafIds,
  commitPlacement, undoPlacement, validateSession, getSavedSession,
  saveSession, clearSavedSession, dragCenter, snapDrop,
} from '../explorer/src/play/state.ts';

const step = (id, leafIds, side = 'front') => ({
  id, leafIds, side, label: id, assemblyId: 'packet', staging: 'lower-left',
  contextLeafIds: [], focusLeafIds: leafIds,
});
const manifest = {
  version: 'fixture-1', initialLeafIds: ['plate', 'retained-pin'],
  finalLeafIds: ['plate', 'retained-pin', 'wheel', 'bridge', 'jewel', 'dial', 'hand'],
  targetPoses: {},
  levels: {
    easy: { steps: [step('easy-wheel', ['wheel']), step('easy-bridge', ['bridge', 'jewel']), step('easy-face', ['dial', 'hand'], 'back')] },
    hard: { steps: [step('hard-wheel', ['wheel']), step('hard-jewel', ['jewel']), step('hard-bridge', ['bridge']), step('hard-dial', ['dial'], 'back'), step('hard-hand', ['hand'], 'back')] },
  },
};
function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

test('both sequences preserve the foundation and commit only the offered stable step ID once', () => {
  for (const level of ['easy', 'hard']) {
    let session = createSession(manifest, level);
    const initial = session;
    assert.deepEqual(fittedLeafIds(manifest, session), manifest.initialLeafIds);
    assert.equal(undoPlacement(manifest, session), session);
    for (const step of manifest.levels[level].steps) {
      assert.equal(currentStep(manifest, session).id, step.id);
      assert.equal(commitPlacement(manifest, session, 'wrong-step'), session);
      const before = session;
      session = commitPlacement(manifest, session, step.id);
      assert.notEqual(session, before);
      assert.equal(session.completedStepIds.length, before.completedStepIds.length + 1);
      assert.equal(commitPlacement(manifest, session, step.id), session, 'duplicate pointer/keyboard release is ignored');
      assert.ok(manifest.initialLeafIds.every((id) => fittedLeafIds(manifest, session).includes(id)));
    }
    assert.deepEqual(initial.completedStepIds, [], 'commits do not mutate older React snapshots');
    assert.equal(currentStep(manifest, session), null);
    assert.equal(commitPlacement(manifest, session, 'anything'), session);
    assert.deepEqual(fittedLeafIds(manifest, session).sort(), [...manifest.finalLeafIds].sort());
  }
});

test('undo crosses sides and prepared assemblies without losing leaf membership', () => {
  let session = createSession(manifest, 'easy');
  const snapshots = [session];
  for (const step of manifest.levels.easy.steps) snapshots.push(session = commitPlacement(manifest, session, step.id));
  while (session.completedStepIds.length) {
    session = undoPlacement(manifest, session);
    assert.deepEqual(session, snapshots[session.completedStepIds.length]);
    const ids = fittedLeafIds(manifest, session);
    assert.equal(ids.includes('bridge'), ids.includes('jewel'), 'prepared bridge is undone atomically');
  }
  assert.equal(currentStep(manifest, snapshots[2]).side, 'back');
  assert.equal(currentStep(manifest, snapshots[1]).side, 'front');
});

test('restore recreates every exact committed prefix and next step at both difficulties', () => {
  for (const level of ['easy', 'hard']) {
    const storage = memoryStorage();
    let session = createSession(manifest, level);
    assert.equal(getSavedSession(manifest, storage).status, 'empty');
    for (let index = 0; index <= manifest.levels[level].steps.length; index++) {
      assert.equal(saveSession(manifest, session, storage).status, 'saved');
      assert.deepEqual([...storage.data.keys()], [PLAY_STORAGE_KEY]);
      const restored = getSavedSession(manifest, storage);
      assert.equal(restored.status, 'saved');
      assert.deepEqual(restored.session, session);
      assert.deepEqual(fittedLeafIds(manifest, restored.session), fittedLeafIds(manifest, session));
      assert.deepEqual(currentStep(manifest, restored.session), currentStep(manifest, session));
      const step = currentStep(manifest, session);
      if (step) session = commitPlacement(manifest, session, step.id);
    }
    assert.equal(clearSavedSession(storage), true);
    assert.equal(getSavedSession(manifest, storage).status, 'empty');
  }
});

test('corrupt, out-of-order, duplicate, alternate-level and transient saves never remap progress', () => {
  const base = createSession(manifest, 'easy');
  const bad = [null, [], 7, {}, {...base, level: 'medium'}, {...base, completedStepIds: 1},
    {...base, completedStepIds: ['easy-bridge']}, {...base, completedStepIds: ['easy-wheel', 'easy-wheel']},
    {...base, completedStepIds: ['hard-wheel']}, {...base, completedStepIds: [null]},
    {...base, completedStepIds: new Array(1)}, {...base, drag: { stepId: 'easy-wheel' }},
    {...base, completedStepIds: [...manifest.levels.easy.steps.map((s) => s.id), 'extra']},
  ];
  for (const value of bad) assert.equal(validateSession(manifest, value).status, 'corrupt', JSON.stringify(value));
  const storage = memoryStorage();
  storage.setItem(PLAY_STORAGE_KEY, '{broken');
  assert.equal(getSavedSession(manifest, storage).status, 'corrupt');
  const incompatible = {...base, manifestVersion: 'older'};
  assert.equal(validateSession(manifest, incompatible).status, 'incompatible');
  assert.equal(saveSession(manifest, incompatible, storage).status, 'incompatible');
  assert.equal(storage.getItem(PLAY_STORAGE_KEY), '{broken', 'rejected write does not overwrite saved evidence');
  assert.equal(commitPlacement(manifest, incompatible, 'easy-wheel'), incompatible);
  const outOfOrder = {...base, completedStepIds: ['easy-bridge']};
  assert.equal(commitPlacement(manifest, outOfOrder, 'easy-bridge'), outOfOrder);
});

test('storage getter, read, quota and deletion failures are reported without blocking play', () => {
  const failure = () => { throw new Error('Storage unavailable'); };
  const session = createSession(manifest, 'easy');
  for (const storage of [failure, {getItem: failure, setItem: failure, removeItem: failure}]) {
    assert.equal(getSavedSession(manifest, storage).status, 'unavailable');
    assert.equal(saveSession(manifest, session, storage).status, 'unavailable');
    assert.equal(clearSavedSession(storage), false);
    assert.equal(commitPlacement(manifest, session, 'easy-wheel').completedStepIds.length, 1);
  }
  const quota = {...memoryStorage(), setItem: failure};
  assert.equal(saveSession(manifest, session, quota).status, 'unavailable');
  assert.equal(getSavedSession(manifest, quota).status, 'empty');
});

test('snap validation uses the held piece center, generous CSS pixels, and a finite target', () => {
  const target = {x: 180, y: 250};
  const grabOffset = {x: 23, y: -18};
  const pointer = {x: target.x + grabOffset.x, y: target.y + grabOffset.y};
  assert.deepEqual(dragCenter(pointer, grabOffset), target);
  assert.equal(snapDrop({pointer, grabOffset, target}), true);
  assert.equal(snapDrop({pointer: {...pointer, x: pointer.x + SNAP_RADIUS_PX}, grabOffset, target}), true);
  assert.equal(snapDrop({pointer: {...pointer, x: pointer.x + SNAP_RADIUS_PX + 1}, grabOffset, target}), false);
  // A finger can be outside the destination while the held object's center is correctly placed.
  assert.equal(snapDrop({pointer: {x: 280, y: 250}, grabOffset: {x: 100, y: 0}, target}), true);
  assert.equal(snapDrop({pointer: target, grabOffset: {x: 100, y: 0}, target}), false);
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.equal(snapDrop({pointer: {...pointer, x: value}, grabOffset, target}), false);
    assert.equal(snapDrop({pointer, grabOffset, target: {...target, y: value}}), false);
    assert.equal(snapDrop({pointer, grabOffset: {...grabOffset, x: value}, target}), false);
    assert.equal(snapDrop({pointer, grabOffset, target, radius: value}), false);
  }
  for (const radius of [0, -1]) assert.equal(snapDrop({pointer, grabOffset, target, radius}), false);
});

test('target preview and invalid releases do not mutate discrete state', () => {
  const session = createSession(manifest, 'hard');
  const options = {pointer: {x: 150, y: 150}, target: {x: 150, y: 150}, grabOffset: {x: 0, y: 0}};
  for (let index = 0; index < 100; index++) assert.equal(snapDrop(options), true);
  assert.deepEqual(session.completedStepIds, []);
  assert.equal(snapDrop({...options, pointer: {x: 500, y: 500}}), false);
  assert.deepEqual(session.completedStepIds, []);
});

test('audited Easy and Hard manifests restore and undo every actual committed prefix', () => {
  for (const level of ['easy', 'hard']) {
    let session = createSession(actualManifest, level);
    const storage = memoryStorage();
    const expected = new Set(actualManifest.initialLeafIds);
    for (const step of actualManifest.levels[level].steps) {
      assert.equal(currentStep(actualManifest, session).id, step.id);
      session = commitPlacement(actualManifest, session, step.id);
      for (const id of step.leafIds) expected.add(id);
      assert.deepEqual(new Set(fittedLeafIds(actualManifest, session)), expected);
      assert.equal(saveSession(actualManifest, session, storage).status, 'saved');
      const restored = getSavedSession(actualManifest, storage);
      assert.equal(restored.status, 'saved');
      assert.deepEqual(restored.session, session);
      assert.deepEqual(fittedLeafIds(actualManifest, restored.session), fittedLeafIds(actualManifest, session));
    }
    assert.equal(currentStep(actualManifest, session), null);
    assert.deepEqual(new Set(fittedLeafIds(actualManifest, session)), new Set(actualManifest.finalLeafIds));
    for (const step of [...actualManifest.levels[level].steps].reverse()) {
      session = undoPlacement(actualManifest, session);
      for (const id of step.leafIds) expected.delete(id);
      assert.equal(currentStep(actualManifest, session).id, step.id);
      assert.deepEqual(new Set(fittedLeafIds(actualManifest, session)), expected);
    }
    assert.deepEqual(fittedLeafIds(actualManifest, session), actualManifest.initialLeafIds);
  }
});
