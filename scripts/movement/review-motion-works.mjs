/** Diagnostic conditional packets in an isolated Node process; never writes app assets. */
import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import * as THREE from "../../explorer/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
import { MeshBVH } from "../../explorer/node_modules/three-mesh-bvh/build/index.module.js";
import {
  MOVEMENT,
  RunningMovement,
  movementPose,
  shaftMatrix,
} from "../../explorer/src/viewer/RunningMovement.ts";
import { wheelDisplayMatrix } from "../../explorer/src/viewer/WheelDisplayPose.ts";
assert.equal(MOVEMENT.packets.length, 8,
  'Historical motion-work audit: use revision a62c820 with its recorded inputs. For installed packets use review-display-phases.mjs --installed; see docs/MOVEMENT_PR_REVIEW.md.');
const root = "artifacts/motion-works";
const read = (p) => JSON.parse(fs.readFileSync(p));
const manifest = read("explorer/public/models/assembly-manifest.json");
const source = read(root + "/source.json");
const periods = read(root + "/periods.json").pairs;
const ratios = {
  cannon1: [-1, 540],
  motion1: [1, 1620],
  hour1: [-1, 6480],
  motion2: [-1, 1620],
  motion3: [-1, 1620],
  cannon2: [1, 540],
  hour2: [1, 6480],
};
const candidates = Object.entries(source.packets).map(([name, p]) => ({
  name,
  members: p.members,
  ratio: ratios[name],
  pivot: source.leaves[p.definitions[0]].worldTransform.slice(0, 3).map((r) => r[3]),
}));
const paths = read("explorer/public/models/asset-paths.json");
const bytes = fs.readFileSync("explorer/public" + paths.overview);
const model = await new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
const records = new Map(manifest.instances.map((p) => [p.id, p]));
const meshes = new Map();
model.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  let ancestor = mesh;
  while (ancestor && !records.has(ancestor.name)) ancestor = ancestor.parent;
  if (!ancestor) return;
  const r = records.get(ancestor.name),
    m = new THREE.Matrix4().set(...r.worldTransform.flat());
  const instance = new THREE.Mesh(mesh.geometry, mesh.material);
  instance.matrixAutoUpdate = false;
  instance.matrix.copy(wheelDisplayMatrix(r.id, m) ?? m);
  meshes.set(r.id, instance);
});
const base = new Map([...meshes].map(([id, m]) => [id, m.matrix.clone()]));
const byDefinition = (n) => meshes.get(source.leaves[n].id);
const packetByName = new Map(candidates.map((p) => [p.name, p]));
const originalLength = MOVEMENT.packets.length;
// Test-only substitution: the released controller and its clock are otherwise unmodified.
MOVEMENT.packets.push(...candidates);
const raw = fs.readFileSync("explorer/public" + MOVEMENT.file);
const run = new RunningMovement(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
  meshes,
);
const pose = {};
function timeForEscape(target) {
  const cycle = Math.floor((target + 0.1) / 18);
  let lo = cycle / 3,
    hi = (cycle + 1) / 3;
  for (let k = 0; k < 48; k++) {
    const mid = (lo + hi) / 2;
    if (movementPose(mid, pose).escape < target) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  assert.ok(Math.abs(movementPose(t, pose).escape - target) < 1e-6);
  return t;
}
const geomRecords = Object.keys(source.leaves)
  .map(Number)
  .filter((n) => candidates.some((p) => p.members.includes(source.leaves[n].id)))
  .map((n) => {
    const mesh = byDefinition(n);
    return {
      n,
      matrix: base.get(source.leaves[n].id).toArray(),
      position: Array.from(mesh.geometry.attributes.position.array),
      index: Array.from(mesh.geometry.index.array),
    };
  });
fs.writeFileSync(root + "/runtime-meshes.json", JSON.stringify(geomRecords));
const output = [];
let maxControllerError = 0;
for (const period of periods) {
  const [a, b] = period.pair,
    [pa, pb] = [period.fastPacket, period.slowPacket].map((n) => packetByName.get(n));
  const ma = byDefinition(a),
    mb = byDefinition(b);
  const ta = (ma.geometry.boundsTree ??= new MeshBVH(ma.geometry, { indirect: true }));
  mb.geometry.boundsTree ??= new MeshBVH(mb.geometry, { indirect: true });
  const ratio = pa.ratio[0] / pa.ratio[1];
  const steps = period.configurations - 1;
  const selected = new Set([
    0,
    steps,
    ...[0.125, 0.333, 0.5, 0.777].map((f) => Math.round(f * steps)),
    Math.round((period.worstGapFastDegrees / period.fastPeriodDegrees) * steps),
    Math.round((period.worstOverlapFastDegrees / period.fastPeriodDegrees) * steps),
    ...Array.from({ length: 8 }, (_, i) => Math.round(((i + 1) * period.subdivisionsPerEvent) / 8)),
  ]);
  const rows = [],
    solidSamples = [];
  for (let i = 0; i <= steps; i++) {
    const fast = (period.fastPeriodDegrees * i) / steps;
    // Positive active time traverses the same closed material period for either sign.
    const e = (ratio < 0 ? fast - period.fastPeriodDegrees : fast) / ratio;
    const t = timeForEscape(e);
    const actualE = movementPose(t, pose).escape;
    const am = shaftMatrix(new THREE.Matrix4(), pa.pivot, (actualE * pa.ratio[0]) / pa.ratio[1]);
    const bm = shaftMatrix(new THREE.Matrix4(), pb.pivot, (actualE * pb.ratio[0]) / pb.ratio[1]);
    const xy = (m) => {
      const e = m.elements;
      return [e[0], e[4], e[1], e[5], e[12], e[13]];
    };
    rows.push({ t, e: actualE, fastDegrees: fast, a: xy(am), b: xy(bm) });
    if (selected.has(i)) {
      run.restore();
      run.clock.suspend();
      run.clock.seconds = t;
      run.update(0, true);
      for (const [mesh, delta, n] of [
        [ma, am, a],
        [mb, bm, b],
      ]) {
        const expected = delta.clone().multiply(base.get(source.leaves[n].id));
        maxControllerError = Math.max(
          maxControllerError,
          ...expected.elements.map((v, k) => Math.abs(v - mesh.matrix.elements[k])),
        );
      }
      const relative = ma.matrix.clone().invert().multiply(mb.matrix);
      solidSamples.push({
        t,
        e: actualE,
        fastDegrees: fast,
        triangleIntersection: ta.intersectsGeometry(mb.geometry, relative),
        minimumTriangleDistanceMm: ta.closestPointToGeometry(mb.geometry, relative).distance,
      });
    }
  }
  output.push({ pair: period.pair, z: period.sectionZMm, rows, solidSamples });
  console.log(
    period.pair,
    "selected runtime triangle intersections",
    solidSamples.filter((r) => r.triangleIntersection).length,
    "/",
    solidSamples.length,
  );
}
run.dispose();
MOVEMENT.packets.splice(originalLength);
assert.ok(maxControllerError < 1e-10);
fs.writeFileSync(root + "/runtime-transforms.json", JSON.stringify(output));
fs.writeFileSync(
  root + "/runtime.json",
  JSON.stringify(
    {
      scope:
        "Conditional diagnostic packets only; actual production movementPose/shaftMatrix and selected RunningMovement matrices. No packets enabled in the app.",
      asset: paths.overview,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      maxControllerError,
      pairs: output.map(({ rows, ...p }) => ({ ...p, configurations: rows.length })),
    },
    null,
    2,
  ) + "\n",
);
