import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

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

assert.equal(play.schemaVersion, 1);
assert.ok(play.version);
assert.equal(play.sourceSha256, source.source.sha256);
const expectedInitial = allLeaves.filter((id) => under(id, play.foundationRootId));
sameSet(play.initialLeafIds, expectedInitial, 'Foundation is exactly the fitted mainplate subtree');
assert.equal(play.initialLeafIds.length, 18);
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
    assert.ok(step.leafIds.length > 0);
    if (level === 'hard') assert.equal(step.leafIds.length, 1, 'Hard places exactly one unsplit source leaf');
    unique(step.leafIds, `Unique leaves within ${step.id}`);
    assert.deepEqual(step.prerequisiteStepIds, index ? [steps[index - 1].id] : [], `Valid ordered dependency: ${step.id}`);
    assert.ok(step.prerequisiteStepIds.every((id) => stepIds.has(id)));
    for (const id of step.contextLeafIds) {
      assert.ok(placed.has(id), `Context already fitted before ${step.id}: ${id}`);

    }
    for (const id of step.focusLeafIds) assert.ok(step.leafIds.includes(id) || step.contextLeafIds.includes(id));
    const local = packetPlaced.get(step.assemblyId) ?? [];
    if (level === 'easy' || local.length === 0) {
      assert.ok(play.initialLeafIds.every((id) => step.contextLeafIds.includes(id)), 'Whole assembly views retain the fitted mainplate as meaningful context');
      assert.ok(play.initialLeafIds.every((id) => step.focusLeafIds.includes(id)), 'Whole assembly views frame the mainplate, not a cropped collection of distant fittings');
    } else {
      sameSet(step.contextLeafIds, local, 'Hard close-up contains precisely the previously fitted source packet, not unrelated foundation jewels');
      sameSet(step.focusLeafIds, [...local, ...step.leafIds], 'Hard close-up frames the actual assembly and current piece');
    }
    packetPlaced.set(step.assemblyId, [...local, ...step.leafIds]);
    for (const id of step.leafIds) {
      assert.ok(play.finalLeafIds.includes(id), `Included step leaf: ${id}`);
      assert.ok(!placed.has(id), `Physical leaf placed exactly once: ${id}`);
      placed.add(id);
    }
    stepIds.add(step.id);
  }
  const occurrencePrefix = 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_';
  const placementIndex = new Map(steps.flatMap((step, index) => step.leafIds.map((id) => [id, index])));
  const packetIndices = (child) => [...placementIndex].filter(([id]) => under(id, occurrencePrefix + child)).map(([, index]) => index);
  // Independent source-host constraints; the full chapter sequence is not mechanically certified.
  for (const [inner, cover] of [[1, 60], [2, 60], [3, 61], [63, 6], [65, 6], [62, 6], [13, 16], [7, 59]]) {
    assert.ok(Math.max(...packetIndices(inner)) < Math.min(...packetIndices(cover)), `Place movement child ${inner} before covering bridge ${cover}`);
  }
  for (const [host, fastener] of [[60, 17], [60, 19], [60, 21], [6, 18], [6, 22], [59, 23], [59, 24], [16, 34], [16, 35], [61, 10], [61, 36]]) {
    assert.ok(Math.max(...packetIndices(host)) < Math.min(...packetIndices(fastener)), `Fastener ${fastener} follows source host ${host}`);
  }
  if (level === 'hard') {
    for (const [packet, definition] of [[1, 84], [2, 89]]) {
      const stem = occurrencePrefix + packet + '__0_1_1_' + definition + '_';
      assert.ok(placementIndex.get(stem + '3') < placementIndex.get(stem + '2') && placementIndex.get(stem + '4') < placementIndex.get(stem + '2'), 'Barrel arbor and mainspring precede cover');
    }
  }
  sameSet([...placed], play.finalLeafIds, `${level} completes exactly full intended assembly`);
  assert.equal(play.levels[level].placementCount, steps.length);
  completed[level] = [...placed];
}
sameSet(completed.easy, completed.hard, 'Both levels finish identical configurations');
assert.ok(play.levels.easy.steps.length < play.levels.hard.steps.length);
console.log(JSON.stringify({ sourceLeaves: allLeaves.length, fittedMainplateLeaves: play.initialLeafIds.length, includedLeaves: play.finalLeafIds.length, excludedLeaves: excluded.length, easyPlacements: play.levels.easy.steps.length, hardPlacements: play.levels.hard.steps.length, geometry: 'All selected mesh nodes plus hash-checked maker diamond STL', targetVisibility: 'Meaningful whole-movement and local-packet contexts verified; renderer geometry-ray occlusion and browser reachability checks remain required.' }, null, 2));
