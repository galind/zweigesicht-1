import fs from "node:fs";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
import { MOVEMENT } from "../../explorer/src/viewer/RunningMovement.ts";
const manifest = JSON.parse(fs.readFileSync("explorer/public/models/assembly-manifest.json"));
const assets = JSON.parse(fs.readFileSync("explorer/public/models/asset-paths.json"));
const bytes = fs.readFileSync("explorer/public" + assets.overview);
const gltf = await new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
const out = [];
gltf.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  let parent = mesh,
    record;
  while (parent && !record) {
    record = manifest.instances.find((p) => p.id === parent.name);
    parent = parent.parent;
  }
  if (
    !record ||
    ![112, 128, 233, 114, 130, 126].some((n) => record.definitionId === `d_0_1_1_${n}`)
  )
    return;
  out.push({
    id: record.id,
    definition: record.definitionId,
    matrix: record.worldTransform,
    position: Array.from(mesh.geometry.attributes.position.array),
    index: Array.from(mesh.geometry.index.array),
  });
});
const raw = fs.readFileSync("explorer/public" + MOVEMENT.file),
  buffer = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
const fork = out.find((p) => p.id === MOVEMENT.fork.id);
fork.position = Array.from(
  new Float32Array(buffer, MOVEMENT.fork.position.offset * 4, MOVEMENT.fork.position.count),
);
fork.index = Array.from(
  new Uint32Array(buffer, MOVEMENT.fork.index.offset * 4, MOVEMENT.fork.index.count),
);
fs.writeFileSync("artifacts/running-movement/runtime-meshes.json", JSON.stringify(out));
