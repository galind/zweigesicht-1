import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as T from "../explorer/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
const read = (p) => JSON.parse(fs.readFileSync(p));
const layout = read("assets/authored/bench-parts-layout.json"),
  dials = read("assets/authored/dial-configurations.json"),
  watch = read("assets/authored/watch-configurations.json"),
  hands = read("assets/authored/hand-display-poses.json");
const records = new Map(
  read("explorer/public/models/assembly-manifest.json").instances.map((p) => [p.id, p]),
);
const packets = layout.groups.flatMap((g) => (g.leafIds ? [g] : g.packets)),
  ids = packets.flatMap((g) => g.leafIds);
const matrix = (a) => new T.Matrix4().fromArray(a),
  source = (id) => new T.Matrix4().set(...records.get(id).worldTransform.flat());
const close = (a, b, t = 1e-8) =>
  assert.ok(
    a.every((v, i) => Math.abs(v - b[i]) < t),
    JSON.stringify({ a, b }),
  );
const bytes = fs.readFileSync(
  "explorer/public" + read("explorer/public/models/asset-paths.json").catalog,
);
const catalog = (
  await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")
).scene;
const geometry = new Map();
catalog.traverse((o) => {
  if (!o.isMesh) return;
  let p = o;
  while (p && !records.has(p.name)) p = p.parent;
  if (p) geometry.set(p.name, o.geometry);
});
test("five stationary groups, one case, two dial identities and exact default hand memberships", () => {
  assert.equal(layout.groups.length, 5);
  assert.equal(ids.length, 78);
  assert.equal(new Set(ids).size, 78);
  assert.deepEqual(
    new Set(layout.groups[0].leafIds),
    new Set(
      watch.leaves
        .filter((p) => p.packet !== "crown" && records.get(p.id).definitionId !== "d_0_1_1_67")
        .map((p) => p.id),
    ),
  );
  for (const face of ["central", "small"]) {
    assert.deepEqual(
      layout.groups.find((g) => g.id === face + "-dial").leafIds,
      dials.faces[face].structureLeafIds,
    );
    const group = layout.groups.find((g) => g.id === face + "-hands"),
      style = dials.faces[face].styles.find((s) => s.id === dials.defaults[face]);
    assert.equal(group.style, style.id);
    assert.equal(group.packets.length, face === "central" ? 3 : 2);
    assert.deepEqual(new Set(group.packets.flatMap((p) => p.leafIds)), new Set(style.leafIds));
    for (const packet of group.packets) {
      const hand = hands.hands.find((h) => h.leafId === style.handLeafIds[packet.role]);
      assert.deepEqual(packet.leafIds, [hand.leafId, hand.supportLeafId]);
    }
  }
});
test("crown leaves, alternate lugs, straps and buckle remain explicitly excluded", () => {
  const crown = watch.leaves.filter((p) => p.packet === "crown");
  assert.equal(crown.length, 4);
  for (const p of crown) {
    assert.ok(!ids.includes(p.id));
    assert.match(layout.excluded.find((e) => e.id === p.id).reason, /working movement/);
  }
  const caseSource = [...records.values()].filter(
    (p) => !p.isAssembly && p.id.startsWith(watch.rootId + "__"),
  );
  assert.equal(caseSource.length, layout.groups[0].leafIds.length + layout.excluded.length);
  for (const p of layout.excluded) assert.ok(!ids.includes(p.id));
  const crystals = caseSource.filter((p) => p.definitionId === "d_0_1_1_67");
  assert.equal(crystals.length, 2);
  for (const p of crystals) {
    assert.ok(!ids.includes(p.id));
    assert.match(layout.excluded.find((e) => e.id === p.id).reason, /crystals removed/);
  }
});
test("all presentation transforms are rigid, and non-hand source matrices are exact", () => {
  for (const p of packets) {
    const m = matrix(p.transform);
    assert.ok(Math.abs(m.determinant() - 1) < 1e-12);
    const scale = new T.Vector3();
    m.decompose(new T.Vector3(), new T.Quaternion(), scale);
    close(scale.toArray(), [1, 1, 1]);
    for (const id of p.leafIds) {
      const local = matrix(p.localMatrices[id]);
      if (!hands.hands.some((h) => h.leafId === id)) close(local.elements, source(id).elements);
      const before = local.clone().invert().multiply(matrix(p.localMatrices[p.leafIds[0]]));
      const after = m
        .clone()
        .multiply(local)
        .invert()
        .multiply(m.clone().multiply(matrix(p.localMatrices[p.leafIds[0]])));
      close(before.elements, after.elements);
    }
  }
});
test("actual decoded vertices reproduce measured bounds and sit on their visible support at original scale", () => {
  for (const p of packets) {
    const b = new T.Box3(),
      v = new T.Vector3();
    for (const id of p.leafIds) {
      const geo = geometry.get(id),
        m = matrix(p.transform).multiply(matrix(p.localMatrices[id]));
      for (let i = 0; i < geo.attributes.position.count; i++)
        b.expandByPoint(v.fromBufferAttribute(geo.attributes.position, i).applyMatrix4(m));
    }
    close(b.min.toArray(), p.bounds[0]);
    close(b.max.toArray(), p.bounds[1]);
    assert.ok(b.min.x >= -175 && b.max.x <= 175 && b.min.z >= -125 && b.max.z <= 125);
    const stand = read("assets/authored/workshop-environment.json").props.find(
      (p) => p.id === "dial-hand-stand",
    );
    if (p.id === "case") close([b.min.y], [0]);
    else {
      assert.ok(b.min.y < stand.topY && b.min.y > stand.bottomY);
      const support = layout.standSeating.packets.find((s) => s.id === p.id);
      assert.ok(support.contactVertices >= 2);
      close([support.contactBounds[0][1], support.contactBounds[1][1]], [stand.topY, stand.topY]);
    }
    if (p.id !== "case") {
      assert.ok(b.min.x > stand.minX + stand.cornerCut && b.max.x < stand.maxX - stand.cornerCut);
      assert.ok(b.min.z > stand.minZ + stand.cornerCut && b.max.z < stand.maxZ - stand.cornerCut);
    }
  }
});
test("hand packets remain separated on the stand", () => {
  for (const g of layout.groups.filter((g) => g.packets)) {
    for (let i = 0; i < g.packets.length; i++)
      for (let j = i + 1; j < g.packets.length; j++) {
        const a = g.packets[i].bounds,
          b = g.packets[j].bounds;
        assert.ok(a[1][0] + 2 < b[0][0] || b[1][0] + 2 < a[0][0]);
      }
  }
});
test("compact tabletop retains arrival, station seats, holder rotations and front margin", () => {
  const a = read("assets/authored/atelier-layout.json"),
    e = read("assets/authored/workshop-environment.json");
  assert.deepEqual(a.arrival, [0, 0.002, 54]);
  assert.deepEqual(a.station, { x: 0, z: -7 });
  assert.deepEqual(a.stations, [
    { id: "bridge", x: 0, z: -7, seat: 12.2, rotationX: 90, holderRotationY: 90 },
    { id: "dial", x: 0, z: -7, seat: 16.3, rotationX: -90, holderRotationY: 90 },
  ]);
  assert.deepEqual(a.deskBounds, { minX: -225, maxX: 225, minZ: -195, maxZ: 135 });
  for (const k of Object.keys(a.deskBounds)) assert.equal(e.mainDesk[k], a.deskBounds[k]);
  assert.equal(e.mainDesk.maxZ - e.mat.maxZ, 10);
});
test("stored fitted blades remain aligned with their original bushing axes", () => {
  for (const p of packets.filter((p) => p.role)) {
    const h = hands.hands.find((h) => h.leafId === p.leafIds[0]),
      blade = matrix(p.localMatrices[h.leafId]),
      bushing = matrix(p.localMatrices[h.supportLeafId]);
    const bore = new T.Vector3(...h.boreLocalMm).applyMatrix4(blade),
      axis = new T.Vector3().applyMatrix4(bushing);
    close([bore.x, bore.y], dials.faces[h.face].axleWorldXYMm);
    close([bore.x, bore.y], [axis.x, axis.y]);
    // Independent 10:10 display direction before the common storage rotation.
    const tip = new T.Vector3(...h.tipLandmarkLocalMm).applyMatrix4(blade).sub(bore),
      angle = (hands.clockAnglesDegrees[h.role] * Math.PI) / 180;
    const direction = new T.Vector2(tip.x, tip.y).normalize();
    close(direction.toArray(), [
      Math.sin(angle),
      Math.cos(angle) * (h.face === "central" ? 1 : -1),
    ]);
  }
});
