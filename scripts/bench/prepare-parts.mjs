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
const environment = await read("assets/authored/workshop-environment.json"),
  stand = environment.props.find((p) => p.id === "dial-hand-stand");
if (!stand) throw Error("Missing dial and hand stand");
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
const pack = (id, ids, local, rotation, center, y, seatIds = ids) => {
  const b = box(ids, local, rotation),
    c = b.getCenter(new T.Vector3());
  const transform = new T.Matrix4()
    .makeTranslation(center[0] - c.x, y - box(seatIds, local, rotation).min.y, center[1] - c.z)
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
// Seat the visible bodies, allowing their original pins/bushings to enter the stand.
const seating = { topY: stand.topY, radialClearance: 0.12, holes: [], packets: [] };
function lowerSupport(ids, local, rotation) {
  const pts = vertices(ids, local, rotation)
    .map((v) => [v.z, v.y])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const hull = [];
  for (const p of pts) {
    while (hull.length > 1) {
      const a = hull.at(-2),
        b = hull.at(-1);
      if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) > 1e-10) break;
      hull.pop();
    }
    hull.push(p);
  }
  const edges = hull.slice(1).map((b, i) => ({ a: hull[i], b, span: b[0] - hull[i][0] }));
  edges.sort((a, b) => b.span - a.span);
  const e = edges[0];
  if (!e || e.span < 1) throw Error("Missing blade support span");
  return Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]);
}
function dialRearPlane(spec, local) {
  const levels = new Map(),
    transform = new T.Matrix4().fromArray(spec.transform);
  for (const id of spec.leafIds) {
    const g = meshes.get(id).geometry,
      m = transform.clone().multiply(local.get(id));
    for (let i = 0; i < g.index.count; i += 3) {
      const [a, b, c] = [0, 1, 2].map((j) =>
        new T.Vector3()
          .fromBufferAttribute(g.attributes.position, g.index.getX(i + j))
          .applyMatrix4(m),
      );
      const n = b.clone().sub(a).cross(c.clone().sub(a)),
        area = n.length() / 2;
      if (area < 1e-10 || n.y / n.length() > -0.99999) continue;
      const y = (a.y + b.y + c.y) / 3,
        key = y.toFixed(5),
        level = levels.get(key) || { area: 0, sumY: 0, leafIds: new Set() };
      level.area += area;
      level.sumY += area * y;
      level.leafIds.add(id);
      levels.set(key, level);
    }
  }
  const plane = [...levels.values()].sort((a, b) => b.area - a.area)[0];
  if (!plane || plane.area < 10) throw Error("Missing broad rear dial surface");
  return { y: plane.sumY / plane.area, area: plane.area, leafIds: [...plane.leafIds] };
}
function recordSeating(spec, supportingIds, tiltDegrees = 0) {
  const local = new Map(
      Object.entries(spec.localMatrices).map(([id, m]) => [id, new T.Matrix4().fromArray(m)]),
    ),
    transform = new T.Matrix4().fromArray(spec.transform),
    vs = vertices(supportingIds, local, transform),
    contacts = vs.filter((v) => Math.abs(v.y - stand.topY) < 1e-5);
  if (contacts.length < 2) throw Error("Missing seating contacts: " + spec.id);
  const contactBounds = new T.Box3().setFromPoints(contacts);
  seating.packets.push({
    id: spec.id,
    supportingIds,
    tiltDegrees,
    contactBounds: [contactBounds.min.toArray(), contactBounds.max.toArray()],
    contactVertices: contacts.length,
  });
  // Clip every source triangle at the wood surface, then group connected protrusions.
  // Cylinders enclose the complete clipped triangles, not just below-surface vertices.
  const points = [],
    parent = [],
    shared = new Map();
  const root = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const add = (v) => {
    const key = v
      .toArray()
      .map((n) => n.toFixed(5))
      .join(",");
    if (shared.has(key)) return shared.get(key);
    const i = points.length;
    points.push(v);
    parent.push(i);
    shared.set(key, i);
    return i;
  };
  for (const id of spec.leafIds) {
    const g = meshes.get(id).geometry,
      m = transform.clone().multiply(local.get(id));
    for (let i = 0; i < g.index.count; i += 3) {
      const tri = [0, 1, 2].map((j) =>
        new T.Vector3()
          .fromBufferAttribute(g.attributes.position, g.index.getX(i + j))
          .applyMatrix4(m),
      );
      if (Math.min(...tri.map((v) => v.y)) >= stand.topY - 1e-6) continue;
      const clipped = [];
      for (let j = 0; j < 3; j++) {
        const a = tri[j],
          b = tri[(j + 1) % 3],
          inside = a.y <= stand.topY,
          next = b.y <= stand.topY;
        if (inside) clipped.push(a);
        if (inside !== next) clipped.push(a.clone().lerp(b, (stand.topY - a.y) / (b.y - a.y)));
      }
      const ids = clipped.map(add);
      for (const id of ids) parent[root(id)] = root(ids[0]);
    }
  }
  const components = new Map();
  for (let i = 0; i < points.length; i++) {
    const k = root(i);
    if (!components.has(k)) components.set(k, []);
    components.get(k).push(points[i]);
  }
  for (const pts of components.values()) {
    const bounds = new T.Box3().setFromPoints(pts),
      c = bounds.getCenter(new T.Vector3()),
      radius =
        Math.max(...pts.map((v) => Math.hypot(v.x - c.x, v.z - c.z))) + seating.radialClearance;
    if (radius > 2 || bounds.min.y < stand.bottomY)
      throw Error("Unexpected protrusion: " + spec.id);
    seating.holes.push({
      id: spec.id + "-clearance-" + seating.holes.filter((h) => h.packet === spec.id).length,
      packet: spec.id,
      x: c.x,
      z: c.z,
      radius,
      minPartY: bounds.min.y,
    });
  }
}
const caseIds = watch.leaves
    .filter((p) => p.packet !== "crown" && records.get(p.id).definitionId !== "d_0_1_1_67")
    .map((p) => p.id),
  groups = [];
// Central opening up, complete attached source lug packets run along world Z, matching the movement orientation.
const caseLocal = new Map(caseIds.map((id) => [id, source(id)]));
groups.push(
  pack("case", caseIds, caseLocal, new T.Matrix4().makeRotationX(-Math.PI / 2), [-55, -7], 0),
);
for (const { face, z } of stand.rows) {
  const config = dials.faces[face],
    style = config.styles.find((s) => s.id === dials.defaults[face]);
  const rotation = new T.Matrix4().makeRotationX(face === "central" ? -Math.PI / 2 : Math.PI / 2);
  const dialLocal = new Map(config.structureLeafIds.map((id) => [id, source(id)]));
  const dial = pack(
    face + "-dial",
    config.structureLeafIds,
    dialLocal,
    rotation,
    [stand.dialX, z],
    stand.topY,
  );
  const rear = dialRearPlane(dial, dialLocal);
  const shift = stand.topY - rear.y;
  dial.transform[13] += shift;
  dial.bounds[0][1] += shift;
  dial.bounds[1][1] += shift;
  recordSeating(dial, rear.leafIds);
  seating.packets.at(-1).rearSupportArea = rear.area;
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
    const aligned = new T.Matrix4().makeRotationY(yaw).multiply(rotation);
    const tilt = lowerSupport([id], local, aligned);
    const r = new T.Matrix4().makeRotationX(tilt).multiply(aligned);
    packets.push({
      ...pack(
        face + "-" + role,
        ids,
        local,
        r,
        [stand.handsX + (i - (Object.keys(style.handLeafIds).length - 1) / 2) * 9, z],
        stand.topY,
        [id],
      ),
      role,
    });
    recordSeating(packets.at(-1), [id], (tilt * 180) / Math.PI);
  }
  groups.push({ id: face + "-hands", style: style.id, packets, center: [stand.handsX, z] });
}
const selected = groups.flatMap((g) => g.leafIds ?? g.packets.flatMap((p) => p.leafIds));
if (new Set(selected).size !== selected.length) throw Error("Duplicate");
const result = {
  schemaVersion: 1,
  units: "mm",
  sourceSha256: watch.sourceSha256,
  notes:
    "Generated rigid presentation matrices; source buffers and authored fitted poses unchanged. Case seated on mat; dial backs and hand blades seated on oak with fitted through-holes for their projections; both case crystals omitted at owner request.",
  groups,
  standSeating: seating,
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
    placement: `Broad dial back surfaces contact Y${stand.topY}, with original pins/screws entering through-holes. Each complete hand/bushing packet is rigidly tilted onto a lower supporting blade plane; bushings enter measured clearance holes. Radial clearance is 0.12 mm, an authored display allowance. The case rests at mat Y0. This is a presentation pose, not a servicing instruction.`,
  },
  sourceFiles: [],
};
for (const p of [
  "assets/authored/dial-configurations.json",
  "assets/authored/watch-configurations.json",
  "assets/authored/hand-display-poses.json",
  "assets/authored/bench-parts-layout.json",
  "assets/authored/workshop-environment.json",
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
