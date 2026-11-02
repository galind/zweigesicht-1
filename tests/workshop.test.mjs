import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import * as THREE from "../explorer/node_modules/three/build/three.module.js";
import * as lesson from "../explorer/src/assembly/lesson.ts";
import manifest from "../explorer/public/models/assembly-manifest.json" with { type: "json" };
const require = createRequire(import.meta.url);
const ts = require("../explorer/node_modules/typescript");
function load(path, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    { exports: module.exports, require: (id) => dependencies[id] ?? {}, console },
  );
  return module.exports;
}
const framing = load("explorer/src/viewer/StudioFrame.ts", { three: THREE });
const input = load("explorer/src/assembly/workshopInput.ts", {});
const { WorkshopViewer } = load("explorer/src/assembly/WorkshopViewer.ts", {
  three: THREE,
  "./lesson": lesson,
  "../viewer/StudioFrame": framing,
  "./workshopInput": input,
});
const records = new Map(manifest.instances.map((part) => [part.id, part]));
function rig() {
  const viewer = Object.create(WorkshopViewer.prototype);
  Object.assign(viewer, {
    ready: true,
    cursor: 12,
    pieces: new Map(),
    assembly: new THREE.Group(),
    camera: new THREE.PerspectiveCamera(33, 1, 0.05, 2000),
    render() {},
  });
  for (const id of lesson.LEAF_IDS) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
    mesh.name = id;
    mesh.matrixAutoUpdate = false;
    mesh.matrix.set(...records.get(id).worldTransform.flat());
    viewer.pieces.set(id, mesh);
  }
  return viewer;
}
test("workshop retains exact fitted matrices and contains only the current movement", () => {
  const viewer = rig();
  for (const cursor of [12, 13, 14, 15]) {
    viewer.update(cursor);
    const ids = [];
    viewer.assembly.updateMatrixWorld(true);
    viewer.assembly.traverse((object) => {
      if (!object.isMesh) return;
      ids.push(object.name);
      assert.deepEqual(
        object.matrixWorld.elements,
        new THREE.Matrix4().set(...records.get(object.name).worldTransform.flat()).elements,
      );
    });
    assert.deepEqual(ids.sort(), lesson.componentIds(cursor).sort());
    assert.equal(viewer.cursor, cursor);
  }
});
test("shared Explorer fit contains real checkpoint bounds and fills the active viewport", () => {
  for (const aspect of [1440 / 600, 390 / 420, 320 / 300])
    for (const cursor of [12, 13, 14, 15]) {
      const ids = lesson.componentIds(cursor);
      const bounds = new THREE.Box3();
      for (const id of ids) {
        const box = records.get(id).boundsWorldMm;
        bounds.union(new THREE.Box3(new THREE.Vector3(...box[0]), new THREE.Vector3(...box[1])));
      }
      const camera = new THREE.PerspectiveCamera(33, aspect, 0.05, 2000);
      const direction = new THREE.Vector3(0, 0, -1);
      camera.up.set(0, -1, 0);
      const { center, distance } = framing.studioFrame(camera, bounds, direction, camera.up);
      camera.position.copy(center).addScaledVector(direction, distance);
      camera.lookAt(center);
      camera.updateMatrixWorld(true);
      const projected = framing.boundsCorners(bounds).map((point) => point.project(camera));
      assert.ok(projected.every((p) => Math.abs(p.x) < 0.86 && Math.abs(p.y) < 0.86));
      const span =
        Math.max(
          Math.max(...projected.map((p) => p.x)) - Math.min(...projected.map((p) => p.x)),
          Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y)),
        ) / 2;
      assert.ok(
        span > 0.6,
        `Movement at ${cursor} fills ${(100 * span).toFixed(1)}% at aspect ${aspect}`,
      );
    }
});

test("fixed fixture camera and independently projected screw destinations survive every placement", () => {
  const viewer = rig();
  viewer.host = { getBoundingClientRect: () => ({ left: 8, top: 100, width: 304, height: 400 }) };
  viewer.camera.aspect = 304 / 400;
  viewer.update(12);
  const camera = viewer.camera.matrixWorld.elements.slice();
  const seat = viewer.project(viewer.seatPoint("bridge-screw-1"));
  for (const cursor of [12, 13, 14, 15]) {
    viewer.update(cursor);
    assert.deepEqual(viewer.camera.matrixWorld.elements, camera);
    assert.deepEqual(viewer.project(viewer.seatPoint("bridge-screw-1")), seat);
  }
  const other = viewer.project(viewer.seatPoint("bridge-screw-2"));
  assert.equal(viewer.placement(other, "bridge-screw-1").distanceMm, Infinity);
  assert.equal(viewer.placement(seat, "bridge-screw-2").distanceMm, Infinity);
  assert.ok(
    viewer.placement(seat, "bridge-screw-1").distanceMm < 1e-8,
    JSON.stringify({
      result: viewer.placement(seat, "bridge-screw-1"),
      seat,
      other,
      worldSeat: viewer.seatPoint("bridge-screw-1").toArray(),
      hit: viewer.onPlane(seat, viewer.seatPoint("bridge-screw-1").z)?.toArray(),
      camera: viewer.camera.position.toArray(),
    }),
  );
  const middle = { x: (seat.x + other.x) / 2, y: (seat.y + other.y) / 2 };
  assert.equal(viewer.placement(middle, "bridge-screw-1").distanceMm, Infinity);
  assert.equal(viewer.placement(middle, "bridge-screw-2").distanceMm, Infinity);
  // Imperfect input away from the neighbour still gets positioning assistance.
  const imperfect = { x: seat.x + (seat.x - other.x) * 0.1, y: seat.y + (seat.y - other.y) * 0.1 };
  assert.ok(viewer.placement(imperfect, "bridge-screw-1").distanceMm > 0);
  assert.ok(viewer.placement(imperfect, "bridge-screw-1").distanceMm < 5);
});
test("touch and mouse aim coordinates are deterministic and screw identity ignores selected part", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(input.aimPoint({ x: 100, y: 200 }, "touch"))), {
    x: 100,
    y: 136,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(input.aimPoint({ x: 100, y: 200 }, "mouse"))), {
    x: 100,
    y: 200,
  });
  assert.equal(
    input.screwDestination({ x: 4.2, y: 0 }, { x: 0, y: 0 }, { x: 4.2, y: 0 }),
    "bridge-screw-2",
  );
  assert.equal(input.screwDestination({ x: 2.1, y: 0 }, { x: 0, y: 0 }, { x: 4.2, y: 0 }), null);
});
