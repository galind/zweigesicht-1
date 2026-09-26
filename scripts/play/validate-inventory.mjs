import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {actions, createSession, canPlace, commitPlacement, fittedLeafIds, isComplete} from '../../explorer/src/play/state.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (name) => JSON.parse(readFileSync(path.join(root, name), 'utf8'));
const play = read('assets/authored/play-manifest.json');
const source = read('explorer/public/models/assembly-manifest.json');
const dials = read('assets/authored/dial-configurations.json');
const hands = read('assets/authored/hand-display-poses.json');
const parts = new Map(source.instances.map((part) => [part.id, part]));
const under = (id, parent) => id === parent || id.startsWith(`${parent}__`);
const sameSet = (actual, expected, message) => assert.deepEqual([...actual].sort(), [...expected].sort(), message);
const unique = (ids, message) => assert.equal(new Set(ids).size, ids.length, message);
const allLeaves = source.instances.filter((part) => !part.isAssembly).map((part) => part.id);
const geometry = new Set();
for (const asset of Object.values(read('explorer/public/models/asset-paths.json'))) {
  const buffer = readFileSync(path.join(root, 'explorer/public', asset));
  assert.equal(buffer.toString('utf8', 0, 4), 'glTF');
  const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12)));
  for (const node of gltf.nodes) {
    if (node.mesh === undefined) continue;
    const mesh = gltf.meshes[node.mesh];
    assert.ok(mesh.primitives.every((primitive) => gltf.accessors[primitive.attributes.POSITION].count > 0));
    geometry.add(node.extras?.partId ?? node.name);
  }
}
const diamond = 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_59__0_1_1_221_3__0_1_1_223_2';
const recoveryPath = path.join(root, 'explorer/public/models/diamond-c74ee2731a1f.stl');
assert.ok(existsSync(recoveryPath), 'Required original maker diamond STL exists');
const recovery = readFileSync(recoveryPath);
assert.equal(createHash('sha256').update(recovery).digest('hex'), 'c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a');
assert.ok(recovery.readUInt32LE(80) > 0, 'Diamond STL has triangles');
geometry.add(diamond);

assert.equal(play.schemaVersion, 2);
assert.ok(play.version);
assert.equal(play.sourceSha256, source.source.sha256);
const deferred = [11, 12].map((index) => 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_54__0_1_1_194_' + index);
sameSet(play.deferredFoundationLeafIds, deferred, 'Only the two explicitly requested source dial-retaining screws are deferred');
for (const id of deferred) assert.equal(parts.get(id)?.definitionId, 'd_0_1_1_201', 'Deferred fittings retain the audited screw identity');
const expectedInitial = allLeaves.filter((id) => under(id, play.foundationRootId) && !deferred.includes(id));
sameSet(play.initialLeafIds, expectedInitial, 'Foundation is the fitted mainplate subtree minus the two explicitly deferred dial screws');
assert.equal(play.initialLeafIds.length, 16);
assert.equal(play.version, 'play-4', 'Nonlinear workbench state rejects earlier prefix saves explicitly');
const expectedFinal = allLeaves.filter((id) => under(id, 'p_0_1_1_1__0_1_1_1_4') && id !== 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_66');
for (const key of ['central', 'small']) {
  const face = dials.faces[key];
  expectedFinal.push(...face.structureLeafIds, ...face.styles.find((style) => style.id === dials.defaults[key]).leafIds);
}
sameSet(play.finalLeafIds, expectedFinal, 'Final scope is exactly selected movement and authored default dial/hand sets');
unique(play.finalLeafIds, 'Final leaves are unique');
unique(play.initialLeafIds, 'Initial leaves are unique');
const excluded = play.excludedLeaves.map((item) => item.leafId);
unique(excluded, 'Exclusions are unique');
sameSet([...play.finalLeafIds, ...excluded], allLeaves, 'Every source physical leaf included or explicitly excluded');
assert.ok(play.excludedLeaves.every((item) => item.reason.length > 10));
const fittedHandIds = new Set(hands.hands.map((hand) => hand.leafId));
for (const id of play.finalLeafIds) {
  assert.ok(parts.has(id) && !parts.get(id).isAssembly, `Physical source ID exists: ${id}`);
  assert.ok(geometry.has(id), `Geometry available: ${id}`);
  const matrix = play.targetPoses[id];
  assert.ok(matrix?.length === 4 && matrix.every((row) => row.length === 4 && row.every(Number.isFinite)), `Valid target matrix: ${id}`);
  assert.deepEqual(matrix[3], [0, 0, 0, 1]);
  if (!fittedHandIds.has(id)) assert.deepEqual(matrix, parts.get(id).worldTransform, `Unchanged source endpoint: ${id}`);
  const hand = hands.hands.find((entry) => entry.leafId === id);
  if (hand) {
    const transform = (point) => [0, 1, 2].map((row) => matrix[row][3] + point.reduce((sum, value, axis) => sum + value * matrix[row][axis], 0));
    const pivot = transform(hand.boreLocalMm);
    const tip = transform(hand.tipLandmarkLocalMm);
    const axle = dials.faces[hand.face].axleWorldXYMm;
    assert.ok(Math.hypot(pivot[0] - axle[0], pivot[1] - axle[1]) < 1e-9, `Fitted hand bore seats on authored arbor: ${id}`);
    const angle = hands.clockAnglesDegrees[hand.role] * Math.PI / 180;
    const direction = [Math.sin(angle), Math.cos(angle) * (hand.face === 'central' ? 1 : -1)];
    const delta = [tip[0] - pivot[0], tip[1] - pivot[1]];
    assert.ok(Math.abs(delta[0] * direction[1] - delta[1] * direction[0]) < 1e-9 && delta[0] * direction[0] + delta[1] * direction[1] > 0, `Fitted hand indicates authored 10:10:00: ${id}`);
    assert.deepEqual(matrix[2], parts.get(id).worldTransform[2], `Hand correction preserves source axial position: ${id}`);
  }
  const b = play.targetBoundsWorldMm[id];
  assert.ok(b?.length === 2 && b.flat().every(Number.isFinite));
  assert.ok(b[0].every((value, index) => value <= b[1][index]));
}
const completed = {};
for (const level of ['easy', 'hard']) {
  const { steps } = play.levels[level];
  const placed = new Set(play.initialLeafIds);
  const stepIds = new Set();
  const packetPlaced = new Map();
  for (const [index, step] of steps.entries()) {
    assert.ok(step.id && !stepIds.has(step.id), `Unique step ${step.id}`);
    assert.ok(step.label && step.assemblyId && step.instruction);
    assert.ok(['front', 'back'].includes(step.side));
    assert.equal(step.staging, 'lower-left');
    if (step.viewDirectionWorld) {
      assert.ok(step.viewDirectionWorld.length === 3 && step.viewDirectionWorld.every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(...step.viewDirectionWorld) - 1) < 1e-12, 'Authored camera direction is normalized');
      assert.ok(step.leafIds.length === 1 && deferred.includes(step.leafIds[0]), 'Only audited radial dial screws use the oblique view');
      const matrix = parts.get(step.leafIds[0]).worldTransform;
      const axis = [matrix[0][2], matrix[1][2], matrix[2][2]];
      assert.deepEqual(step.sourceWithdrawalAxisWorld, axis, 'Radial screw direction uses source local +Z transformed to world');
      assert.ok(Math.abs(axis[2]) < 1e-12, 'These screw axes lie in the source XY plane');
      const view = step.viewDirectionWorld;
      assert.ok(view[2] > 0 && view[0] * axis[0] + view[1] * axis[1] > .8, 'Oblique front view exposes the outward-facing radial screw head');
    }
    assert.ok(step.leafIds.length > 0);
    if (level === 'hard') assert.equal(step.leafIds.length, 1, 'Hard places exactly one unsplit source leaf');
    unique(step.leafIds, `Unique leaves within ${step.id}`);
    assert.ok(Array.isArray(step.prerequisiteStepIds));
    assert.ok(play.groups.some((group) => group.id === step.groupId));
    if (step.workspaceId) assert.ok(play.packets.some((packet) => packet.id === step.workspaceId && packet.leafIds.includes(step.leafIds[0])));
    for (const id of step.leafIds) {
      assert.ok(play.finalLeafIds.includes(id), `Included step leaf: ${id}`);
      assert.ok(!placed.has(id), `Physical leaf placed exactly once: ${id}`);
      placed.add(id);
    }
    stepIds.add(step.id);
  }
  const all = actions(play, level), ids = new Set(all.map((s) => s.id));
  unique([...all.map((s) => s.id)], 'Action IDs unique, including nonphysical transfers');
  for (const action of all) {
    assert.ok(action.prerequisiteStepIds.every((id) => ids.has(id) && id !== action.id), 'Every prerequisite exists within the level');
    unique(action.prerequisiteStepIds, 'No repeated prerequisite');
  }
  // Traverse forward, reverse and shuffled ready choices. Covers can never lock out later work.
  for (let seed = 0; seed < 40; seed++) {
    let session = createSession(play, level), random = seed + 1;
    while (session.actionIds.length < all.length) {
      const ready = all.filter((s) => canPlace(play, session, s.id));
      assert.ok(ready.length, `${level} has no dependency dead end at seed ${seed}`);
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      const selected = ready[seed === 0 ? 0 : seed === 1 ? ready.length - 1 : random % ready.length];
      session = commitPlacement(play, session, selected.id);
    }
    assert.equal(isComplete(play, session), true);
    sameSet(fittedLeafIds(play, session), play.finalLeafIds, 'Every valid order fits exactly the audited physical set');
  }
  sameSet([...placed], play.finalLeafIds, `${level} completes exactly full intended assembly`);
  assert.equal(play.levels[level].placementCount, steps.length);
  completed[level] = [...placed];
}
sameSet(completed.easy, completed.hard, 'Both levels finish identical configurations');
assert.ok(play.levels.easy.steps.length < play.levels.hard.steps.length);
console.log(JSON.stringify({ sourceLeaves: allLeaves.length, fittedMainplateLeaves: play.initialLeafIds.length, deferredDialScrews: deferred.length, includedLeaves: play.finalLeafIds.length, excludedLeaves: excluded.length, easyPlacements: play.levels.easy.steps.length, hardPlacements: play.levels.hard.steps.length, geometry: 'All selected mesh nodes plus hash-checked maker diamond STL', dependencyOrders: '40 alternate graph traversals per level; browser visible-seat checks recorded separately.' }, null, 2));
