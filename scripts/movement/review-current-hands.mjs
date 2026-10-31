/** Decode unchanged runtime meshes and replay source-solid witnesses with the real hand controller. */
import fs from "node:fs";
import assert from "node:assert/strict";
import * as THREE from "../../explorer/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
import { MeshBVH } from "../../explorer/node_modules/three-mesh-bvh/build/index.module.js";
import { RunningHands, shaftMatrix } from "../../explorer/src/viewer/RunningMovement.ts";
import { wheelDisplayMatrix } from "../../explorer/src/viewer/WheelDisplayPose.ts";
const read = (p) => JSON.parse(fs.readFileSync(p));
const root = "artifacts/current-time";
const report = read(root + "/clearance.json");
const audit = read("artifacts/dial-time/hand-pose-source-review.json");
const records = read("explorer/public/models/assembly-manifest.json").instances;
const byId = new Map(records.map((r) => [r.id, r]));
const meshes = new Map();
const paths = read("explorer/public/models/asset-paths.json");
for (const file of [paths.overview, paths.catalog]) {
  const b = fs.readFileSync("explorer/public" + file);
  const model = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "");
  model.scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    let p = mesh;
    while (p && !byId.has(p.name)) p = p.parent;
    if (p && !meshes.has(p.name)) meshes.set(p.name, new THREE.Mesh(mesh.geometry, mesh.material));
  });
}
const refs = new Map();
for (const [id, mesh] of meshes) {
  const p = byId.get(id),
    source = new THREE.Matrix4().set(...p.worldTransform.flat());
  const h = audit.records.find((h) => h.leafId === id);
  const ref = h
    ? new THREE.Matrix4().set(...h.fittedWorldTransform.flat())
    : (wheelDisplayMatrix(id, source) ?? source);
  refs.set(id, ref);
  mesh.matrix.copy(ref);
  mesh.matrixAutoUpdate = false;
}
const run = new RunningHands();
const members = report.members;
run.configure(
  members.map((h) => ({ id: h.id, mesh: meshes.get(h.id), reference: refs.get(h.id) })),
);
let maxMatrixError = 0;
// Each independent angle witness uses the actual production hand transform.
// Simultaneously reachable relative phases are separately reduced below for coaxial hands.
const matrixAt = (id, angle) => {
  const h = members.find((h) => h.id === id);
  if (!h) return shaftMatrix(new THREE.Matrix4(), [0, 0], 0).multiply(refs.get(id));
  const signedRate =
    (h.face === "central" ? -1 : 1) * { hour: 1 / 120, minute: 0.1, seconds: 6 }[h.role];
  const seconds = 36600 + angle / signedRate;
  // A synthetic Date provider keeps exact fractional witness seconds without millisecond rounding.
  run.update(true, 0, 0, {
    getHours: () => 0,
    getMinutes: () => 0,
    getSeconds: () => seconds,
    getMilliseconds: () => 0,
  });
  const actual = meshes.get(id).matrix.clone();
  const expected = shaftMatrix(new THREE.Matrix4(), h.pivot, angle).multiply(refs.get(id));
  actual.elements.forEach(
    (v, i) => (maxMatrixError = Math.max(maxMatrixError, Math.abs(v - expected.elements[i]))),
  );
  return actual;
};
const rows = [];
for (const pair of report.pairs.filter((p) => p.samples)) {
  const [a, b] = pair.ids,
    ma = meshes.get(a),
    mb = meshes.get(b);
  if (!ma || !mb) {
    rows.push({ ids: pair.ids, status: "missing runtime mesh" });
    continue;
  }
  const tree = (ma.geometry.boundsTree ??= new MeshBVH(ma.geometry, { indirect: true }));
  mb.geometry.boundsTree ??= new MeshBVH(mb.geometry, { indirect: true });
  const angles = pair.worst.anglesDegrees ?? [0, 0];
  const matrices = [a, b].map((id, i) =>
    members.some((m) => m.id === id) ? matrixAt(id, angles[i]) : refs.get(id),
  );
  const witnesses = [];
  for (const [label, aa, bb] of [
    ["baseline", refs.get(a), refs.get(b)],
    ["source worst relative phase", ...matrices],
  ]) {
    witnesses.push({
      label,
      triangleIntersection: tree.intersectsGeometry(mb.geometry, aa.clone().invert().multiply(bb)),
    });
  }
  let equivalentCivilSeconds = null;
  const ha = members.find((h) => h.id === a),
    hb = members.find((h) => h.id === b);
  if (ha && hb && ha.role !== hb.role && ha.face === hb.face) {
    const sign = ha.face === "central" ? -1 : 1,
      rate = { hour: 1 / 120, minute: 0.1, seconds: 6 };
    equivalentCivilSeconds =
      (((36600 + (angles[0] - angles[1]) / (sign * (rate[ha.role] - rate[hb.role]))) % 43200) +
        43200) %
      43200;
    run.update(true, 0, 0, {
      getHours: () => 0,
      getMinutes: () => 0,
      getSeconds: () => equivalentCivilSeconds,
      getMilliseconds: () => 0,
    });
    witnesses.push({
      label: "simultaneous actual hand time",
      triangleIntersection: tree.intersectsGeometry(
        mb.geometry,
        ma.matrix.clone().invert().multiply(mb.matrix),
      ),
    });
  }
  rows.push({
    ids: pair.ids,
    definitions: pair.definitions,
    sourceStatus: pair.status,
    sourceWorst: pair.worst,
    equivalentCivilSeconds,
    witnesses,
  });
}
run.dispose();
assert.ok(maxMatrixError < 1e-9);
fs.writeFileSync(
  root + "/runtime-witnesses.json",
  JSON.stringify(
    {
      scope:
        "Actual production fitted-hand matrices on unchanged decoded runtime triangles. Baseline and source-worst relative phase per sampled pair; coaxial different-role hands also replay simultaneously at a reachable civil time. Triangle surface intersections do not measure solid volume or continuous clearance.",
      maxMatrixError,
      rows,
    },
    null,
    2,
  ) + "\n",
);
console.log({
  maxMatrixError,
  pairs: rows.length,
  witnesses: rows.flatMap((r) => r.witnesses ?? []).length,
});
