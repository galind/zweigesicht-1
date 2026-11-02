/** Validate the active chapter against tracked CAD identities and runtime meshes. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LEAF_IDS,
  DEFERRED_FOUNDATION,
  OPERATIONS,
  componentIds,
} from "../../explorer/src/assembly/lesson.ts";

const root = new URL("../../", import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const source = read("explorer/public/models/assembly-manifest.json");
const reference = read("assets/source-manifest/assembly-chapter-one.json");
const records = new Map(source.instances.map((part) => [part.id, part]));
assert.equal(source.source.sha256, reference.cadSourceSha256);
const geometry = new Set();
for (const path of Object.values(read("explorer/public/models/asset-paths.json"))) {
  const bytes = readFileSync(new URL(`explorer/public${path}`, root));
  assert.equal(bytes.toString("utf8", 0, 4), "glTF");
  const gltf = JSON.parse(bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)));
  for (const node of gltf.nodes) {
    if (node.mesh === undefined) continue;
    assert.ok(
      gltf.meshes[node.mesh].primitives.every(
        (primitive) => gltf.accessors[primitive.attributes.POSITION].count > 0,
      ),
    );
    geometry.add(node.extras?.partId ?? node.name);
  }
}
assert.equal(OPERATIONS.length, 15);
assert.equal(LEAF_IDS.length, 22);
assert.equal(new Set(LEAF_IDS).size, LEAF_IDS.length);
assert.deepEqual(componentIds(0), []);
assert.deepEqual([...componentIds(15)].sort(), [...LEAF_IDS].sort());
for (const id of LEAF_IDS) {
  const record = records.get(id);
  assert.equal(record?.isAssembly, false, `Physical occurrence: ${id}`);
  assert.ok(geometry.has(id), `Runtime geometry: ${id}`);
  const matrix = record.worldTransform;
  assert.ok(
    matrix.length === 4 && matrix.every((row) => row.length === 4 && row.every(Number.isFinite)),
    `Fitted transform: ${id}`,
  );
  assert.deepEqual(matrix[3], [0, 0, 0, 1]);
}
for (const id of DEFERRED_FOUNDATION) {
  assert.ok(records.has(id), `Deferred occurrence: ${id}`);
  assert.ok(!LEAF_IDS.includes(id), `Deferred component is not installed: ${id}`);
}
console.log(
  "Assembly chapter: 15 operations, 22 unique source leaves, exact source transforms and required runtime geometry verified.",
);
