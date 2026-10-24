/** Actual decoded runtime triangles before/after the separate static phase. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import * as THREE from "../../explorer/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
import { MeshBVH } from "../../explorer/node_modules/three-mesh-bvh/build/index.module.js";
import { wheelDisplayMatrix } from "../../explorer/src/viewer/WheelDisplayPose.ts";

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
const results = [];
for (const pair of audit.solidToothContacts) {
  const [aid, bid] = pair.occurrenceIds;
  const [a, b] = [meshes.get(aid), meshes.get(bid)];
  assert.ok(a && b, pair.key);
  const bvh = tree(a);
  tree(b);
  const result = { key: pair.key, occurrenceIds: pair.occurrenceIds };
  for (const phase of ["before", "after"]) {
    const am =
      phase === "after" ? (wheelDisplayMatrix(aid, a.matrixWorld) ?? a.matrixWorld) : a.matrixWorld;
    const bm =
      phase === "after" ? (wheelDisplayMatrix(bid, b.matrixWorld) ?? b.matrixWorld) : b.matrixWorld;
    const relative = am.clone().invert().multiply(bm);
    const closest = bvh.closestPointToGeometry(b.geometry, relative);
    assert.ok(closest);
    result[phase] = {
      triangleSurfaceIntersection: bvh.intersectsGeometry(b.geometry, relative),
      minimumTriangleDistanceMm: closest.distance,
    };
  }
  if (pair.decision === "static-phase-corrected") {
    assert.ok(result.before.triangleSurfaceIntersection, pair.key + " before");
    assert.equal(result.after.triangleSurfaceIntersection, false, pair.key + " after");
    assert.ok(result.after.minimumTriangleDistanceMm > 0.02, pair.key + " mesh clearance");
  } else {
    assert.deepEqual(result.after, result.before, pair.key + " unresolved pair unchanged");
  }
  results.push(result);
}
for (const [id, mesh] of meshes)
  assert.equal(digest(mesh.geometry), hashes.get(id), "Triangle buffers immutable");
const report = {
  sourceSha256: source.source.sha256,
  runtimeAsset: paths.overview,
  runtimeSha256: createHash("sha256").update(bytes).digest("hex"),
  unchangedGeometryBuffers: meshes.size,
  results,
  limitations:
    "Triangle-surface queries verify rendered geometry; original BRep probes separately establish solid penetration. No mechanical certification.",
};
await fs.mkdir(new URL("artifacts/wheel-contact/", root), { recursive: true });
await fs.writeFile(
  new URL("artifacts/wheel-contact/mesh-pairs.json", root),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
