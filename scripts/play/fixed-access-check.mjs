/** CPU audit of prescribed Play views with every legal opaque obstruction present.
 * Uses the shipped source meshes, controller sampling density and camera presets.
 * Conservative: treats authored transparent surfaces as opaque. No UI or saves touched. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixedViewDirection } from "../../explorer/src/play/fixedViews.ts";
import * as THREE from "../../explorer/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
import { STLLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/STLLoader.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(fs.readFileSync(root + "/assets/authored/play-manifest.json")),
  records = JSON.parse(
    fs.readFileSync(root + "/explorer/public/models/assembly-manifest.json"),
  ).instances,
  byId = new Map(records.map((r) => [r.id, r]));
const paths = JSON.parse(fs.readFileSync(root + "/explorer/public/models/asset-paths.json"));
const pieces = new Map();
for (const url of Object.values(paths)) {
  const b = fs.readFileSync(root + "/explorer/public" + url),
    scene = (
      await new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "")
    ).scene;
  scene.traverse((node) => {
    if (!node.isMesh) return;
    let parent = node,
      record;
    while (parent && !record) {
      record = byId.get(parent.name);
      parent = parent.parent;
    }
    if (record && manifest.finalLeafIds.includes(record.id) && !pieces.has(record.id))
      pieces.set(record.id, { geometry: node.geometry });
  });
}
const diamond = manifest.finalLeafIds.find((id) => byId.get(id).definitionId === "d_0_1_1_225");
const b = fs.readFileSync(root + "/explorer/public/models/diamond-c74ee2731a1f.stl");
pieces.set(diamond, {
  geometry: new STLLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)),
});
for (const [id, p] of pieces) {
  p.geometry.computeBoundingBox();
  p.pose = new THREE.Matrix4().set(...manifest.targetPoses[id].flat());
  p.mesh = new THREE.Mesh(p.geometry, new THREE.MeshBasicMaterial());
  p.mesh.matrixAutoUpdate = false;
  p.mesh.matrix.copy(p.pose);
  p.mesh.updateMatrixWorld(true);
  p.mesh.userData.partId = id;
  p.bounds = new THREE.Box3()
    .setFromBufferAttribute(p.geometry.getAttribute("position"))
    .applyMatrix4(p.pose);
}
const bounds = (ids) => {
  const b = new THREE.Box3();
  for (const id of ids) b.union(pieces.get(id).bounds);
  return b;
};
const results = [];
const distanceFactors = [2, 4, 6];
for (const level of ["easy", "hard"])
  for (const step of [...manifest.levels[level].steps, ...manifest.levels[level].transfers]) {
    const all = [...manifest.levels[level].steps, ...manifest.levels[level].transfers],
      blocked = new Set([step.id]);
    let old = 0;
    while (old !== blocked.size) {
      old = blocked.size;
      for (const a of all)
        if (a.prerequisiteStepIds.some((id) => blocked.has(id))) blocked.add(a.id);
    }
    const ids = new Set(step.workspaceId ? [] : manifest.initialLeafIds);
    for (const a of all)
      if (!blocked.has(a.id) && a.workspaceId === step.workspaceId)
        for (const id of a.leafIds) ids.add(id);
    const obstacles = [...ids].map((id) => pieces.get(id).mesh),
      points = [];
    for (const id of step.leafIds) {
      const p = pieces.get(id),
        v = p.geometry.getAttribute("position"),
        stride = Math.max(1, Math.floor(v.count / 80));
      for (let i = 0; i < v.count; i += stride)
        points.push(new THREE.Vector3().fromBufferAttribute(v, i).applyMatrix4(p.pose));
    }
    const b = bounds(
        step.workspaceId
          ? manifest.packets.find((p) => p.id === step.workspaceId).leafIds
          : manifest.initialLeafIds,
      ),
      center = b.getCenter(new THREE.Vector3()),
      span = Math.max(...b.getSize(new THREE.Vector3()).toArray(), step.workspaceId ? 1 : 25);
    const views = [];
    const blockers = {};
    for (const factor of distanceFactors) {
      let pass = false,
        face;
      for (const side of ["front", "back"]) {
        const direction = fixedViewDirection(
          side,
          step.workspaceId,
          step.viewDirectionWorld ? step : null,
        );
        const eye = center.clone().addScaledVector(direction, span * factor);
        for (const point of points) {
          const offset = point.clone().sub(eye),
            ray = new THREE.Raycaster(eye, offset.clone().normalize(), 0, offset.length() - 0.035);
          const hit = ray.intersectObjects(obstacles, false)[0];
          if (!hit) {
            pass = true;
            face = side;
            break;
          }
          blockers[hit.object.userData.partId] = (blockers[hit.object.userData.partId] ?? 0) + 1;
        }
        if (pass) break;
      }
      views.push({ distanceFactor: factor, pass, face });
    }
    const pass = views.every((v) => v.pass);

    results.push({
      level,
      id: step.id,
      label: step.label,
      workspace: step.workspaceId,
      detail: !!step.viewDirectionWorld,
      views,
      pass,
      blockers: pass ? undefined : blockers,
    });
  }
const output = path.resolve(process.env.PLAY_QA_OUTPUT ?? "artifacts/browser/play-fixed-views");
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "fixed-access-audit.json"), JSON.stringify(results, null, 2));
const failures = results.filter((r) => !r.pass);
console.log(
  JSON.stringify(
    { total: results.length, cameraChecks: results.length * distanceFactors.length, failures },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
