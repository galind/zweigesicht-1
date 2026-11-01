import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import * as lesson from "../explorer/src/assembly/lesson.ts";
import source from "../explorer/public/models/assembly-manifest.json" with { type: "json" };
import { dragCenter } from "../explorer/src/assembly/drag.ts";
const sourcePoses = Object.fromEntries(
  source.instances.map((part) => [part.id, part.worldTransform]),
);
import seating from "../assets/authored/atelier-layout.json" with { type: "json" };
import * as THREE from "../explorer/node_modules/three/build/three.module.js";
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
    {
      exports: module.exports,
      require: (id) => {
        if (!(id in dependencies)) throw Error(`Unexpected import: ${id}`);
        return dependencies[id];
      },
      console,
    },
  );
  return module.exports;
}
const state = load("explorer/src/assembly/session.ts", { "./lesson": lesson });
const {
  createSession,
  commitAttempt,
  score,
  undo,
  validateSession,
  readSession,
  saveSession,
  ActiveClock,
  STORAGE_KEY,
} = state;
const {
  OPERATIONS,
  PARTS,
  LEAF_IDS,
  DEFERRED_FOUNDATION,
  componentIds,
  arrangement,
  availableItems,
} = lesson;
function attempt(s, overrides = {}) {
  const op = OPERATIONS[s.cursor];
  return {
    id: `attempt-${s.revision}`,
    runId: s.runId,
    revision: s.revision,
    item: op.item,
    kind: op.kind,
    tool: op.tool,
    side: op.side,
    support: op.support,
    destination: op.destination,
    distanceMm: 0,
    ...overrides,
  };
}
function advance(s) {
  return commitAttempt(s, attempt(s)).session;
}
function at(cursor) {
  let s = createSession("run-1");
  while (s.cursor < cursor) s = advance(s);
  return s;
}
function memory() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

test("the workbook chapter is exactly rows 5–19, with explicit tools and the supplied coupling order", () => {
  assert.deepEqual(
    OPERATIONS.map((op) => op.row),
    Array.from({ length: 15 }, (_, i) => i + 5),
  );
  assert.ok(OPERATIONS.every((op) => op.tool && op.toolProvisional));
  assert.deepEqual(
    OPERATIONS.slice(6, 9).map((op) => op.item),
    ["stem", "wheel", "coupling"],
  );
  assert.deepEqual(componentIds(0), []);
  assert.equal(OPERATIONS[3].kind, "flip");
  assert.equal(OPERATIONS[10].kind, "return");
  assert.equal(OPERATIONS[11].kind, "insert");
});
test("every chapter leaf exists once, with an exact existing fitted transform; deferred foundation is excluded", () => {
  const byId = new Map(source.instances.map((part) => [part.id, part]));
  assert.equal(LEAF_IDS.length, 22);
  assert.equal(new Set(LEAF_IDS).size, LEAF_IDS.length);
  for (const id of LEAF_IDS) {
    assert.equal(byId.get(id)?.isAssembly, false, id);
    assert.ok(sourcePoses[id], id);
  }
  assert.equal(PARTS.mainplate.length, 11);
  assert.equal(DEFERRED_FOUNDATION.length, 7);
  for (const id of DEFERRED_FOUNDATION) {
    assert.ok(byId.has(id));
    assert.ok(!LEAF_IDS.includes(id));
  }
  assert.deepEqual([...componentIds(15)].sort(), [...LEAF_IDS].sort());
  for (const cursor of [4, 6, 10, 11, 12])
    assert.equal(
      componentIds(cursor).length,
      componentIds(cursor - 1).length,
      `Transfer ${cursor} does not duplicate physical parts`,
    );
});
test("screw mappings have source-axis and symmetric bridge-seat evidence, without using labels as IDs", () => {
  const byId = new Map(source.instances.map((part) => [part.id, part]));
  const screw = byId.get(PARTS["setting-screw"][0]);
  const lever = byId.get(lesson.PREFIX + "70");
  for (const axis of [0, 1])
    assert.equal(screw.worldTransform[axis][3], lever.worldTransform[axis][3]);
  const screws = ["bridge-screw-1", "bridge-screw-2"].map((item) => byId.get(PARTS[item][0]));
  assert.equal(screws[0].definitionId, screws[1].definitionId);
  assert.equal(screws[0].worldTransform[0][3], screws[1].worldTransform[0][3]);
  assert.ok(Math.abs(screws[0].worldTransform[1][3] + screws[1].worldTransform[1][3]) < 1e-12);
});
test("all 15 operations complete once, and completion never adds the remaining movement", () => {
  let s = createSession("run");
  for (const op of OPERATIONS) {
    const result = commitAttempt(s, attempt(s));
    assert.equal(result.accepted, true, op.label);
    s = result.session;
  }
  assert.equal(s.cursor, 15);
  assert.equal(score(s), 150);
  assert.equal(s.mistakes, 0);
  assert.equal(
    commitAttempt(s, { ...attempt(at(14)), runId: s.runId, revision: s.revision }).session,
    s,
  );
});
test("wrong part, sequence, tool, side, holder, destination and distance each cost one committed attempt", () => {
  const original = at(2);
  const variants = [
    { item: "bridge" },
    { kind: "flip" },
    { tool: null },
    { tool: "hands" },
    { side: "dial" },
    { support: "dial" },
    { destination: "stem-rest" },
    { distanceMm: 5.001 },
    { distanceMm: NaN },
    { distanceMm: -1 },
  ];
  for (const change of variants) {
    const event = attempt(original, change);
    const result = commitAttempt(original, event);
    assert.equal(result.accepted, false);
    assert.ok(result.message);
    assert.equal(result.session.cursor, original.cursor);
    assert.equal(score(result.session), score(original) - 2);
    assert.equal(
      commitAttempt(result.session, event).session,
      result.session,
      "Duplicate wrong release is free",
    );
  }
  assert.ok(
    availableItems(0).includes("bridge"),
    "Future parts remain available for wrong attempts",
  );
});
test("5 mm placement radius is in model units and can be reviewed at 10 mm", () => {
  const s = at(2);
  assert.equal(commitAttempt(s, attempt(s, { distanceMm: 5 })).accepted, true);
  assert.equal(commitAttempt(s, attempt(s, { distanceMm: 9.9 })).accepted, false);
  assert.equal(commitAttempt(s, attempt(s, { distanceMm: 10 }), 10).accepted, true);
  assert.equal(commitAttempt(s, attempt(s), 0).accepted, false);
});
test("support exchange and a separately built stem follow the chapter state", () => {
  assert.equal(arrangement(0).supportPlaced, false);
  assert.equal(arrangement(1).movement, "tray");
  assert.equal(arrangement(4).side, "dial");
  assert.equal(arrangement(6).movement, "aside");
  assert.equal(arrangement(7).stem, "work");
  assert.equal(arrangement(10).stem, "aside");
  assert.equal(arrangement(11).movement, "work");
  assert.equal(arrangement(11).side, "movement");
  assert.equal(arrangement(12).stem, "inserted");
  const turn = at(3);
  assert.equal(commitAttempt(turn, attempt(turn, { support: "movement" })).accepted, false);
  const returning = at(10);
  assert.equal(commitAttempt(returning, attempt(returning, { side: "dial" })).accepted, false);
  assert.equal(commitAttempt(returning, attempt(returning, { support: "dial" })).accepted, false);
});
test("duplicate events, undo, restart and resume cannot farm points", () => {
  const s = at(2),
    event = attempt(s),
    accepted = commitAttempt(s, event).session;
  assert.equal(commitAttempt(accepted, event).session, accepted);
  const undone = undo(accepted);
  assert.equal(undone.cursor, 2);
  assert.equal(score(undone), 30);
  assert.equal(commitAttempt(undone, event).session, undone, "Stale pre-Undo gesture ignored");
  const resumed = validateSession(JSON.parse(JSON.stringify(undone)));
  assert.ok(resumed);
  assert.equal(score(advance(resumed)), 30);
  assert.equal(commitAttempt(createSession("new-run"), event).session.runId, "new-run");
});
test("separate storage preserves Workshop and rejects malformed/incompatible saves", () => {
  const store = memory();
  store.setItem("zweigesicht:play:session:v1", "untouched");
  let s = at(9);
  s = { ...s, elapsedMs: 12345 };
  assert.equal(
    saveSession(s, () => store),
    true,
  );
  assert.equal(readSession(() => store).session.elapsedMs, 12345);
  assert.equal(store.getItem("zweigesicht:play:session:v1"), "untouched");
  for (const value of [
    { ...s, cursor: 16 },
    { ...s, cursor: 10, awarded: 9 },
    { ...s, attempts: ["duplicate", "duplicate"] },
    { ...s, elapsedMs: -1 },
    { ...s, version: "play-5" },
    { ...s, revision: 0 },
  ])
    assert.equal(validateSession(value), null);
  store.setItem(STORAGE_KEY, "{broken");
  assert.equal(readSession(() => store).status, "corrupt");
  assert.equal(
    readSession(() => {
      throw Error("privacy");
    }).status,
    "unavailable",
  );
  assert.equal(
    saveSession(s, () => {
      throw Error("quota");
    }),
    false,
  );
});
test("active clock excludes hidden, interrupted, suspended and reloaded time", () => {
  const clock = new ActiveClock();
  assert.equal(clock.sample(100, true), 0);
  assert.equal(clock.sample(116, true), 16);
  assert.equal(clock.sample(132, false), 0);
  assert.equal(clock.sample(10000, true), 0);
  assert.equal(clock.sample(10016, true), 16);
  assert.equal(clock.sample(90000, true), 0, "Suspension gap");
  assert.equal(clock.sample(90016, true), 16);
  assert.equal(clock.sample(90000, true), 0, "Non-monotonic sample");
  assert.equal(
    new ActiveClock().sample(1000000, true),
    0,
    "Reload establishes a fresh time origin",
  );
});

const { AssemblyViewer } = load("explorer/src/assembly/AssemblyViewer.ts", {
  three: THREE,
  "three/addons/loaders/GLTFLoader.js": {},
  "three/addons/libs/meshopt_decoder.module.js": {},
  "../../../assets/authored/atelier-layout.json": seating,
  "../../../assets/source-manifest/holder-runtime.json": {},
  "../experience/loading": {},
  "../viewer/GraphicsResources": {},
  "../viewer/SourceSurfaces": {},
  "../viewer/materials": {},
  "./drag": { dragCenter },
  "./lesson": lesson,
});
const viewerSource = ts.createSourceFile(
  "AssemblyViewer.ts",
  fs.readFileSync("explorer/src/assembly/AssemblyViewer.ts", "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const viewerClass = viewerSource.statements.find(ts.isClassDeclaration);
function field(name, fixture) {
  const declaration = viewerClass.members.find(
    (member) => member.name?.getText(viewerSource) === name,
  );
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(
      `module.exports = function() { return ${declaration.initializer.getText(viewerSource)}; };`,
      {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
      },
    ).outputText,
    {
      module,
      THREE,
      dragCenter,
    },
  );
  return module.exports.call(fixture);
}
function rig(cursor) {
  const viewer = Object.create(AssemblyViewer.prototype);
  Object.assign(viewer, {
    host: { clientWidth: 1200 },
    state: at(cursor),
    ready: true,
    enabled: true,
    side: arrangement(cursor).side,
    groups: new Map(),
    support: new Map(),
    pieces: new Map(),
    scene: new THREE.Scene(),
    ghost: new THREE.Group(),
    seat: new THREE.Mesh(),
    radius: 5,
    render() {},
  });
  viewer.cancel = field("cancel", viewer);
  viewer.release = field("release", viewer);
  const records = new Map(source.instances.map((part) => [part.id, part]));
  for (const id of LEAF_IDS) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    mesh.matrixAutoUpdate = false;
    mesh.matrix.set(...sourcePoses[id].flat());
    const bounds = records.get(id).boundsWorldMm;
    viewer.pieces.set(id, {
      mesh,
      bounds: new THREE.Box3(new THREE.Vector3(...bounds[0]), new THREE.Vector3(...bounds[1])),
    });
  }
  for (const item of [...Object.keys(PARTS), "movement", "stem-assembly"]) {
    const group = new THREE.Group();
    viewer.groups.set(item, group);
    viewer.scene.add(group);
  }
  for (const side of ["movement", "dial"]) {
    const group = new THREE.Group();
    viewer.support.set(side, group);
    viewer.scene.add(group);
  }
  viewer.layout();
  return viewer;
}
test("scene accounting preserves fitted matrices, both assemblies and recorded holder poses", () => {
  const viewer = rig(0);
  assert.equal(viewer.groups.get("movement").children.length, 0);
  for (let cursor = 1; cursor <= 15; cursor++) {
    viewer.state = at(cursor);
    viewer.layout();
    const meshes = [...viewer.groups.values()].flatMap((group) => group.children);
    assert.equal(meshes.length, 22);
    assert.equal(new Set(meshes).size, 22);
    for (const [id, piece] of viewer.pieces)
      assert.deepEqual(
        piece.mesh.matrix.elements,
        new THREE.Matrix4().set(...sourcePoses[id].flat()).elements,
      );
    const plan = arrangement(cursor);
    assert.equal(viewer.support.get(plan.side).position.x, plan.movement === "aside" ? -68 : 0);
    const movement = viewer.groups.get("movement");
    assert.equal(movement.matrix.elements[13], plan.side === "movement" ? 12.2 : 16.3);
    if (cursor === 9) {
      assert.equal(viewer.groups.get("stem-assembly").children.length, 3);
      assert.equal(movement.children.length, 14);
      assert.equal(movement.matrix.elements[12], -68);
    }
    if (cursor === 12) assert.equal(viewer.groups.get("stem-assembly").children.length, 0);
  }
});
test("cancelled/inspection drags do not submit, a release submits only once, and holder visibility restores", () => {
  const viewer = rig(2);
  let drops = 0;
  viewer.host = { getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 100 }) };
  viewer.onPlane = () => new THREE.Vector3();
  viewer.target = () => new THREE.Vector3();
  viewer.onDrop = () => drops++;
  const element = { removeEventListener() {}, hasPointerCapture: () => false };
  const drag = () => ({
    item: "setting-screw",
    pointer: 1,
    element,
    grab: { x: 0, y: 0 },
    moved: true,
  });
  viewer.drag = { ...drag(), moved: false };
  viewer.release({ pointerId: 1, clientX: 50, clientY: 50 });
  assert.equal(drops, 0);
  viewer.drag = drag();
  viewer.release({ pointerId: 1, clientX: 150, clientY: 50 });
  assert.equal(drops, 0);
  viewer.drag = drag();
  viewer.cancel();
  assert.equal(drops, 0);
  viewer.support.get("movement").visible = false;
  viewer.drag = drag();
  viewer.release({ pointerId: 1, clientX: 50, clientY: 50 });
  assert.equal(drops, 1);
  viewer.release({ pointerId: 1, clientX: 50, clientY: 50 });
  assert.equal(drops, 1);
  assert.equal(viewer.support.get("movement").visible, true);
});
