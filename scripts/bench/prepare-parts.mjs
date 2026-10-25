/** Derive rigid storage poses from actual decoded CAD; never modify source buffers. */
import fs from "node:fs/promises";
import crypto from "node:crypto";
import * as T from "../../explorer/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
const read = async (p) => JSON.parse(await fs.readFile(p));
const dials = await read("assets/authored/dial-configurations.json"),
  watch = await read("assets/authored/watch-configurations.json"),
  poses = await read("assets/authored/hand-display-poses.json");
const manifest = await read("explorer/public/models/assembly-manifest.json"),
  records = new Map(manifest.instances.map((p) => [p.id, p]));
const paths = await read("explorer/public/models/asset-paths.json");
const bytes = await fs.readFile("explorer/public" + paths.catalog);
const scene = (
  await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")
).scene;
const meshes = new Map();
scene.traverse((o) => {
  if (!o.isMesh) return;
  let p = o;
  while (p && !records.has(p.name)) p = p.parent;
  if (p) meshes.set(p.name, o);
});
const matrix = (a) => new T.Matrix4().set(...a.flat());
const source = (id) => matrix(records.get(id).worldTransform);
function fitted(id) {
  const s = source(id),
    h = poses.hands.find((h) => h.leafId === id);
  if (!h) return s;
  const pivot = new T.Vector3(...h.boreLocalMm).applyMatrix4(s),
    tip = new T.Vector3(...h.tipLandmarkLocalMm).applyMatrix4(s),
    clock = (poses.clockAnglesDegrees[h.role] * Math.PI) / 180;
  const angle =
    Math.atan2(Math.cos(clock) * (h.face === "central" ? 1 : -1), Math.sin(clock)) -
    Math.atan2(tip.y - pivot.y, tip.x - pivot.x);
  return new T.Matrix4()
    .makeTranslation(...dials.faces[h.face].axleWorldXYMm, 0)
    .multiply(new T.Matrix4().makeRotationZ(angle))
    .multiply(new T.Matrix4().makeTranslation(-pivot.x, -pivot.y, 0))
    .multiply(s);
}
const vertices = (leafIds, local, transform) =>
  leafIds.flatMap((id) => {
    const p = meshes.get(id).geometry.attributes.position,
      m = transform.clone().multiply(local.get(id)),
      v = new T.Vector3(),
      out = [];
    for (let i = 0; i < p.count; i++) out.push(v.fromBufferAttribute(p, i).applyMatrix4(m).clone());
    return out;
  });
const box = (ids, local, m) => new T.Box3().setFromPoints(vertices(ids, local, m));
const pack = (id, ids, local, rotation, center, y) => {
  const b = box(ids, local, rotation),
    c = b.getCenter(new T.Vector3());
  const transform = new T.Matrix4()
    .makeTranslation(center[0] - c.x, y - b.min.y, center[1] - c.z)
    .multiply(rotation);
  const final = box(ids, local, transform);
  return {
    id,
    leafIds: ids,
    transform: transform.toArray(),
    localMatrices: Object.fromEntries(ids.map((id) => [id, local.get(id).toArray()])),
    bounds: [final.min.toArray(), final.max.toArray()],
  };
};
const caseIds = watch.leaves
    .filter((p) => p.packet !== "crown" && records.get(p.id).definitionId !== "d_0_1_1_67")
    .map((p) => p.id),
  groups = [];
// Central opening up, complete attached source lug packets run along world X.
const caseLocal = new Map(caseIds.map((id) => [id, source(id)]));
groups.push(
  pack(
    "case",
    caseIds,
    caseLocal,
    new T.Matrix4()
      .makeRotationY(Math.PI / 2)
      .multiply(new T.Matrix4().makeRotationX(-Math.PI / 2)),
    [0, -92],
    0,
  ),
);
for (const [face, x] of [
  ["central", -105],
  ["small", 105],
]) {
  const config = dials.faces[face],
    style = config.styles.find((s) => s.id === dials.defaults[face]);
  const rotation = new T.Matrix4().makeRotationX(face === "central" ? -Math.PI / 2 : Math.PI / 2);
  const dialLocal = new Map(config.structureLeafIds.map((id) => [id, source(id)]));
  const dial = pack(face + "-dial", config.structureLeafIds, dialLocal, rotation, [x, -35], 0);
  groups.push(dial);
  const packets = [];
  for (const [i, [role, id]] of Object.entries(style.handLeafIds).entries()) {
    const h = poses.hands.find((h) => h.leafId === id);
    if (!style.supportLeafIds.includes(h.supportLeafId)) throw Error("Unknown bushing");
    const ids = [id, h.supportLeafId],
      local = new Map(ids.map((id) => [id, fitted(id)]));
    // Rotate the fitted packet as one rigid body to align each blade along -Z.
    const pivot = new T.Vector3(...h.boreLocalMm)
        .applyMatrix4(local.get(id))
        .applyMatrix4(rotation),
      tip = new T.Vector3(...h.tipLandmarkLocalMm)
        .applyMatrix4(local.get(id))
        .applyMatrix4(rotation);
    const yaw = Math.atan2(tip.x - pivot.x, -(tip.z - pivot.z));
    const r = new T.Matrix4().makeRotationY(yaw).multiply(rotation);
    packets.push({
      ...pack(
        face + "-" + role,
        ids,
        local,
        r,
        [x + (i - (Object.keys(style.handLeafIds).length - 1) / 2) * 9, 35],
        0,
      ),
      role,
    });
  }
  groups.push({ id: face + "-hands", style: style.id, packets, center: [x, 35] });
}
const selected = groups.flatMap((g) => g.leafIds ?? g.packets.flatMap((p) => p.leafIds));
if (new Set(selected).size !== selected.length) throw Error("Duplicate");
const result = {
  schemaVersion: 1,
  units: "mm",
  sourceSha256: watch.sourceSha256,
  notes:
    "Generated rigid presentation matrices; source buffers and authored fitted poses unchanged. Original parts seated directly on the mat; both case crystals omitted at owner request.",
  groups,
  excluded: manifest.instances
    .filter(
      (p) => !p.isAssembly && p.id.startsWith(watch.rootId + "__") && !selected.includes(p.id),
    )
    .map((p) => ({
      id: p.id,
      reason:
        watch.leaves.find((w) => w.id === p.id)?.packet === "crown"
          ? "Already on working movement"
          : p.definitionId === "d_0_1_1_67"
            ? "Both case crystals removed at owner request; catalog geometry retained"
            : "Alternate lug occurrence, strap or buckle excluded by reviewed case manifest",
    })),
};
await fs.writeFile(
  "assets/authored/bench-parts-layout.json",
  JSON.stringify(result, null, 2) + "\n",
);
const evidence = {
  accessed: "2026-10-25",
  references: (await read("assets/source-manifest/bench-parts.json")).references,
  referenceStatus:
    "Historical protector references retained with hashes; containers removed at owner request.",
  assumptions: {
    placement:
      "Each intact dial or blade/bushing packet is rigidly lowered until its lowest decoded source vertex meets mat Y0. This is a presentation pose, not a servicing instruction.",
  },
  sourceFiles: [],
};
for (const p of [
  "assets/authored/dial-configurations.json",
  "assets/authored/watch-configurations.json",
  "assets/authored/hand-display-poses.json",
  "assets/authored/bench-parts-layout.json",
  "scripts/bench/prepare-parts.mjs",
  "explorer/public" + paths.catalog,
])
  evidence.sourceFiles.push({
    path: p,
    sha256: crypto
      .createHash("sha256")
      .update(await fs.readFile(p))
      .digest("hex"),
  });
await fs.writeFile(
  "assets/source-manifest/bench-parts.json",
  JSON.stringify(evidence, null, 2) + "\n",
);
console.log(
  groups.map((g) => ({
    id: g.id,
    bounds: g.bounds,
    packets: g.packets?.map((p) => ({ id: p.id, bounds: p.bounds })),
  })),
);
