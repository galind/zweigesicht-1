/** Read-only phase search on decoded source triangles. Candidate endpoints require original-solid and neighbor review. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import * as THREE from "../../explorer/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
import { MeshBVH } from "../../explorer/node_modules/three-mesh-bvh/build/index.module.js";

const root = new URL("../../", import.meta.url);
const read = async (path) => JSON.parse(await fs.readFile(new URL(path, root), "utf8"));
const source = await read("explorer/public/models/assembly-manifest.json");
const audit = await read("assets/source-manifest/wheel-contact.json");
const paths = await read("explorer/public/models/asset-paths.json");
assert.equal(source.source.sha256, audit.source.sha256);
const bytes = await fs.readFile(new URL("explorer/public" + paths.overview, root));
const model = await new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
model.scene.updateMatrixWorld(true);
const records = new Map(source.instances.map((p) => [p.id, p]));
const meshes = new Map();
model.scene.traverse((node) => {
  if (!node.isMesh) return;
  let ancestor = node;
  while (ancestor && !records.has(ancestor.name)) ancestor = ancestor.parent;
  if (ancestor) meshes.set(ancestor.name, node);
});
const digest = (geometry) => {
  const h = createHash("sha256");
  for (const attr of [geometry.attributes.position, geometry.attributes.normal, geometry.index])
    h.update(Buffer.from(attr.array.buffer, attr.array.byteOffset, attr.array.byteLength));
  return h.digest("hex");
};
const hashes = new Map([...meshes].map(([id, mesh]) => [id, digest(mesh.geometry)]));
const trees = new Map();
const tree = (mesh) => {
  if (!trees.has(mesh.geometry)) {
    const bvh = new MeshBVH(mesh.geometry, { indirect: true });
    mesh.geometry.boundsTree = bvh;
    trees.set(mesh.geometry, bvh);
  }
  return trees.get(mesh.geometry);
};
for (const [id, mesh] of meshes) {
  const expected = new THREE.Matrix4().set(...records.get(id).worldTransform.flat());
  assert.ok(
    Math.max(...expected.elements.map((v, i) => Math.abs(v - mesh.matrixWorld.elements[i]))) <
      1e-12,
  );
}

// Diagnostic only: proposal search never writes an authored runtime pose.
const byDef = new Map(
  [...meshes].map(([id, m]) => [Number(records.get(id).definitionId.split("_").at(-1)), m]),
);
function posed(d, worldAngle = 0) {
  const m = byDef.get(d),
    axis = m.matrixWorld.elements[10];
  if (Math.abs(axis) < 0.99) throw Error("non-Z");
  return m.matrixWorld
    .clone()
    .multiply(new THREE.Matrix4().makeRotationZ(((worldAngle * Math.PI) / 180) * Math.sign(axis)));
}
function pair(a, b, aa = 0, ab = 0, gap = false) {
  const ma = byDef.get(a),
    mb = byDef.get(b);
  tree(ma);
  tree(mb);
  const am = aa === 0 ? ma.matrixWorld : posed(a, aa),
    bm = ab === 0 ? mb.matrixWorld : posed(b, ab),
    rel = am.clone().invert().multiply(bm);
  if (tree(ma).intersectsGeometry(mb.geometry, rel)) return 0;
  return gap ? tree(ma).closestPointToGeometry(mb.geometry, rel).distance : 1;
}
function candidates(d, fixed, range, step) {
  const found = [];
  for (let i = 0; i <= Math.round(range / step); i++)
    for (const sign of i ? [1, -1] : [1]) {
      const angle = i * step * sign;
      if (fixed.every((other) => pair(d, other, angle))) {
        const gap = Math.min(...fixed.map((other) => pair(d, other, angle, 0, true)));
        found.push({ angle, gap });
      }
    }
  return found;
}
const mode = process.argv[2] ?? "train";
assert.ok(["train", "winding", "motion"].includes(mode));
let result;
if (mode === "train") {
  result = {};
  result.crown = candidates(249, [90, 97], 4, 0.05);
  console.log("crown", JSON.stringify(result.crown));
  result.hour2 = candidates(187, [217], 5.625, 0.125);
  console.log("hour2", JSON.stringify(result.hour2));
  result.third = candidates(237, [94], 18, 0.2);
  result.seconds = candidates(243, [234], 22.5, 0.1);
  result.train = [];
  for (const t of result.third)
    for (const s of result.seconds) {
      if (pair(238, 242, t.angle, s.angle)) {
        const gap = Math.min(t.gap, s.gap, pair(238, 242, t.angle, s.angle, true));
        result.train.push({
          third: t.angle,
          seconds: s.angle,
          gap,
          cost: Math.abs(t.angle) + Math.abs(s.angle),
        });
      }
    }
  result.train.sort((a, b) => a.cost - b.cost);
  console.log("train", JSON.stringify(result.train.slice(0, 30)));
} else if (mode === "winding") {
  result = { barrel: candidates(90, [249], 2.25, 0.05), clutch: [] };
  const a = byDef.get(97),
    b = byDef.get(249);
  tree(a);
  tree(b);
  for (let i = -105; i <= 105; i++) {
    const local = i * 0.1,
      pose = a.matrixWorld
        .clone()
        .multiply(new THREE.Matrix4().makeRotationZ((local * Math.PI) / 180)),
      relative = pose.clone().invert().multiply(b.matrixWorld);
    if (!tree(a).intersectsGeometry(b.geometry, relative))
      result.clutch.push({
        local,
        gap: tree(a).closestPointToGeometry(b.geometry, relative).distance,
      });
  }
} else {
  result = { candidates: [], crown: [] };
  for (const p of candidates(210, [213], 5, 0.05)) {
    const cannon = [],
      hour = [];
    for (let k = -150; k <= 150; k++) {
      const angle = k * 0.1;
      if (pair(137, 210, angle, p.angle)) {
        const gap = pair(137, 210, angle, p.angle, true);
        if (gap > 0.002) cannon.push({ angle, gap });
      }
    }
    for (let k = -90; k <= 90; k++) {
      const angle = k * 0.05;
      if (pair(141, 211, angle, p.angle)) {
        const gap = pair(141, 211, angle, p.angle, true);
        if (gap > 0.002) hour.push({ angle, gap });
      }
    }
    if (p.gap > 0.002 && cannon.length && hour.length) {
      cannon.sort((a, b) => b.gap - a.gap);
      hour.sort((a, b) => b.gap - a.gap);
      const c = cannon[0],
        h = hour[0];
      result.candidates.push({
        motion1: p.angle,
        cannon: c.angle,
        hour: h.angle,
        gap: Math.min(p.gap, c.gap, h.gap),
        cost: Math.abs(p.angle) + Math.abs(c.angle) + Math.abs(h.angle),
      });
    }
  }
  result.candidates.sort((a, b) => a.cost - b.cost);
  console.log("motion", JSON.stringify(result.candidates.slice(0, 20)));
  result.crown = candidates(249, [97], 4, 0.1);
  console.log("crown only clutch", JSON.stringify(result.crown));
}
for (const [id, mesh] of meshes) assert.equal(digest(mesh.geometry), hashes.get(id));
await fs.mkdir(new URL("artifacts/remaining-wheel-contact/", root), { recursive: true });
await fs.writeFile(
  new URL(`artifacts/remaining-wheel-contact/repeated-search-${mode}.json`, root),
  JSON.stringify(result, null, 2) + "\n",
);
