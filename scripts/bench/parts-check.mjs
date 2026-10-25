/** Independent decoded-buffer, placement, collision, continuous-envelope and visual audit. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
const read = async (p) => JSON.parse(await fs.readFile(p));
const layout = await read("assets/authored/bench-parts-layout.json"),
  manifest = await read("explorer/public/models/assembly-manifest.json"),
  paths = await read("explorer/public/models/asset-paths.json"),
  recovery = await read("explorer/public/models/case-lug-recovery.json");
const bytes = await fs.readFile("explorer/public" + paths.catalog),
  catalog = (
    await new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")
  ).scene;
const records = new Map(manifest.instances.map((p) => [p.id, p])),
  expected = {},
  selected = new Set(
    layout.groups.flatMap((g) => g.leafIds ?? g.packets.flatMap((p) => p.leafIds)),
  );
const hash = (a) =>
  crypto
    .createHash("sha256")
    .update(Buffer.from(a.buffer, a.byteOffset, a.byteLength))
    .digest("hex");
catalog.traverse((n) => {
  if (!n.isMesh) return;
  let p = n;
  while (p && !records.has(p.name)) p = p.parent;
  if (!p || !selected.has(p.name)) return;
  let positions = n.geometry.attributes.position.array,
    idx = n.geometry.index.array;
  if (records.get(p.name).definitionId === "d_0_1_1_54") {
    const count = positions.length / 3;
    positions = new Float32Array([...positions, ...recovery.vertices.flat()]);
    idx = new Uint32Array([...idx, ...recovery.triangles.flat().map((v) => v + count)]);
  }
  expected[p.name] = {
    positions: hash(positions),
    sourceNormals: hash(n.geometry.attributes.normal.array),
    sourceNormalLength: n.geometry.attributes.normal.array.length,
    indices: hash(new Uint32Array(idx)),
    triangles: idx.length / 3,
  };
});
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),
  out = process.env.PLAY_QA_OUTPUT || "artifacts/workshop-bare-parts";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH }),
  page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const report = { checks: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().startsWith("Failed to load resource"))
    report.errors.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400) {
    report.httpErrors ??= [];
    report.httpErrors.push({ url: r.url(), status: r.status() });
  }
});
const check = (name, pass, detail) => {
  report.checks.push({ name, pass, detail });
  assert.ok(pass, name + ": " + JSON.stringify(detail));
};
try {
  await page.goto((process.argv[2] || "http://127.0.0.1:4198") + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready || window.bench?.status.error, null, {
    timeout: 90000,
  });
  assert.equal(await page.evaluate(() => window.bench.status.error), "");
  report.audit = await page.evaluate(
    async ({ layout, expected }) => {
      const b = window.bench;
      cancelAnimationFrame(b.frame);
      b.frame = 0;
      b.scene.updateMatrixWorld(true);
      const V = b.walker.feet.constructor,
        B = b.flip.swept.constructor;
      const meshes = [];
      b.detached.traverse((n) => {
        if (n.isMesh) meshes.push(n);
      });
      const digest = async (a) =>
        [...new Uint8Array(await crypto.subtle.digest("SHA-256", a))]
          .map((v) => v.toString(16).padStart(2, "0"))
          .join("");
      const buffers = [];
      for (const m of meshes) {
        const g = m.geometry;
        buffers.push({
          id: m.userData.partId,
          positions: await digest(g.attributes.position.array),
          sourceNormals: await digest(
            g.attributes.normal.array.slice(0, expected[m.userData.partId].sourceNormalLength),
          ),
          indices: await digest(new Uint32Array(g.index.array)),
          triangles: g.index.count / 3,
        });
      }
      const union = new Set(
        [...b.station.movement.children, ...meshes].map((n) => n.userData.partId),
      );
      const stationary = [];
      for (const group of b.detached.children) {
        const box = new B().setFromObject(group, true);
        stationary.push({ id: group.name, min: box.min.toArray(), max: box.max.toArray() });
      }
      const expand = (box) => box.clone().expandByScalar(2);
      const turns = b.flip.discs.map(
        (d) =>
          new B(
            new V(d.minX, d.y - d.radius, d.z - d.radius),
            new V(d.maxX, d.y + d.radius, d.z + d.radius),
          ),
      );
      const sweeps = [...b.flip.columns, ...turns].map(expand),
        holders = Object.values(b.station.holders).map((h) => expand(new B().setFromObject(h)));
      const overlap = (a, c) =>
        ["x", "y", "z"].every(
          (k) => Math.min(a.max[k], c.max[k]) - Math.max(a.min[k], c.min[k]) > 1e-5,
        );
      const clearance = stationary.map((s) => {
        const box = new B(new V(...s.min), new V(...s.max));
        return {
          id: s.id,
          sweepClear: !sweeps.some((s) => overlap(s, box)),
          holderClear: !holders.some((h) => overlap(h, box)),
        };
      });
      const initial = meshes.map((m) => m.matrixWorld.toArray());
      let unchanged = true;
      for (let direction = 0; direction < 2; direction++) {
        if (!b.flip.start()) throw Error("Clear arrival failed to start flip");
        for (let step = 0; step < 600 && b.flip.active; step++) {
          b.flip.update(1 / 60);
          b.scene.updateMatrixWorld(true);
          unchanged &&= meshes.every(
            (m, i) => m.visible && m.matrixWorld.elements.every((v, j) => v === initial[i][j]),
          );
        }
      }
      if (b.flip.side !== "bridge" || b.flip.active) throw Error("Flip did not return");
      const collision = meshes.map((m) => ({
        id: m.userData.partId,
        packet: m.userData.packet,
        collides: b.world.solids.some((s) => s.mesh === m),
      }));
      const caseFloor = b.world.floor(0, -92, 50);
      const containers = [];
      b.scene.traverse((m) => {
        if (m.isMesh && /Elastic membrane|Clear rigid shell|Dial base/.test(m.material.name))
          containers.push(m.name);
      });
      const packetTransforms = [];
      for (const spec of layout.groups.flatMap((g) => (g.leafIds ? [g] : g.packets))) {
        const group = b.detached.getObjectByName(spec.id);
        packetTransforms.push({
          id: spec.id,
          exact:
            group.matrix.elements.every((v, i) => v === spec.transform[i]) &&
            group.children.every((m) =>
              m.matrix.elements.every((v, i) => v === spec.localMatrices[m.userData.partId][i]),
            ),
        });
      }
      return {
        caseFloor,
        containers,
        buffers,
        unique: union.size,
        total: b.station.movement.children.length + meshes.length,
        groups: stationary,
        clearance,
        unchanged,
        collision,
        packetTransforms,
        expectedCount: Object.keys(expected).length,
        triangles: buffers.reduce((n, p) => n + p.triangles, 0),
      };
    },
    { layout, expected },
  );
  const a = report.audit;
  check(
    "78 unique exact source leaves; no duplication with 219 working leaves",
    a.buffers.length === 78 && a.unique === a.total && a.total === 297,
    a.total,
  );
  check(
    "all decoded CAD positions, source normals and indices match; d54 is only reviewed appended recovery",
    a.buffers.every(
      (p) =>
        p.positions === expected[p.id].positions &&
        p.indices === expected[p.id].indices &&
        p.sourceNormals === expected[p.id].sourceNormals,
    ),
  );
  check(
    "five static groups match rigid authored transforms",
    a.groups.length === 5 && a.packetTransforms.every((p) => p.exact),
    a.packetTransforms,
  );
  check(
    "all detached groups clear continuous flip and both holders by 2 mm",
    a.clearance.every((p) => p.sweepClear && p.holderClear),
    a.clearance,
  );
  check("new groups remain stationary and visible when movement changes side", a.unchanged);
  check(
    "all exposed case, dial and hand meshes collide using their actual geometry",
    a.collision.every((p) => p.collides),
  );
  check(
    "case opening reaches the mat; both crystals and all containers are absent",
    Math.abs(a.caseFloor) < 1e-6 &&
      a.containers.length === 0 &&
      a.buffers.every((p) => records.get(p.id).definitionId !== "d_0_1_1_67"),
    { caseFloor: a.caseFloor, containers: a.containers },
  );
  report.renderPasses = await page.evaluate(() => {
    const b = window.bench;
    cancelAnimationFrame(b.frame);
    b.frame = 0;
    b.flip.setRest("bridge");
    b.camera.position.set(0, 420, 420);
    b.camera.lookAt(0, 0, -30);
    b.camera.fov = 45;
    b.camera.far = 3000;
    b.camera.updateProjectionMatrix();
    b.renderer.setPixelRatio(1);
    const original = b.renderer.setRenderTarget,
      targets = [];
    b.renderer.setRenderTarget = function (target, ...args) {
      targets.push(
        target ? { id: target.texture.uuid, width: target.width, height: target.height } : null,
      );
      return original.call(this, target, ...args);
    };
    b.renderer.info.autoReset = false;
    b.renderer.info.reset();
    b.renderer.render(b.scene, b.camera);
    b.renderer.setRenderTarget = original;
    const meshes = [];
    b.scene.traverseVisible((m) => {
      if (m.isMesh) meshes.push(m);
    });
    const result = {
      targetChanges: targets,
      offscreenTargets: new Set(targets.filter(Boolean).map((t) => t.id)).size,
      draws: b.renderer.info.render.calls,
      submittedTriangles: b.renderer.info.render.triangles,
      activeMeshes: meshes.length,
      activeGeometryTriangles: meshes.reduce(
        (n, m) => n + (m.geometry.index?.count ?? m.geometry.attributes.position.count) / 3,
        0,
      ),
      memory: { ...b.renderer.info.memory },
    };
    b.renderer.info.autoReset = true;
    return result;
  });
  await page.addStyleTag({
    content: ".bench-menu,.bench-start,.bench-menu-backdrop,.bench-legend{display:none!important}",
  });
  for (const [name, position, target, side, fov] of [
    ["external-full-tabletop", [0, 340, 430], [0, 0, -30], "bridge", 45],
    ["external-top-mat", [0, 300, -1], [0, 0, 0], "bridge", 50],
    ["external-case", [40, 53, -30], [0, 5, -92], "bridge", 42],
    ["external-central-dial", [-105, 65, 12], [-105, 3, -35], "bridge", 40],
    ["external-small-dial", [105, 65, 12], [105, 3, -35], "bridge", 40],
    ["external-central-hands-top", [-105, 70, 35.1], [-105, 0.5, 35], "bridge", 42],
    ["external-small-hands-top", [105, 70, 35.1], [105, 0.5, 35], "bridge", 42],
    ["external-central-hands-oblique", [-82, 31, 81], [-105, 0.5, 35], "bridge", 45],
    ["external-small-hands-oblique", [128, 31, 81], [105, 0.5, 35], "bridge", 45],
    ["external-central-hands-side", [-105, 10, 83], [-105, 0.5, 35], "bridge", 50],
    ["external-small-hands-side", [105, 10, 83], [105, 0.5, 35], "bridge", 50],
    ["visitor-near-hands", [-105, 1.482, 55.1], [-105, 0.5, 35], "bridge", 68],
    ["visitor-arrival", [0, 1.482, 54], [0, 1.482, -7], "bridge", 68],
    ["visitor-bridge", [-12, 22, -7], [0, 17, -7], "bridge", 68],
    ["visitor-dial", [-12, 22, -7], [0, 17, -7], "dial", 68],
  ]) {
    await page.evaluate(
      ({ name, position, target, side, fov }) => {
        const b = window.bench;
        cancelAnimationFrame(b.frame);
        b.frame = 0;
        b.flip.setRest(side);
        if (name === "visitor-bridge" || name === "visitor-dial")
          position[1] = b.world.floor(position[0], position[2], 100) + 1.482;
        b.camera.position.fromArray(position);
        b.camera.fov = fov;
        b.camera.far = 3000;
        b.camera.lookAt(...target);
        b.camera.updateProjectionMatrix();
        b.renderer.setPixelRatio(1);
        b.renderer.render(b.scene, b.camera);
      },
      { name, position, target, side, fov },
    );
    await page.screenshot({ path: `${out}/${name}.png` });
  }
  check(
    "all five groups rest directly on the mat without penetration",
    a.groups.every((g) => Math.abs(g.min[1]) < 1e-6),
    a.groups,
  );
  check("no browser errors", !report.errors.length, report.errors);
  check(
    "no missing scene assets",
    !(report.httpErrors ?? []).some((e) => !e.url.endsWith("/_vercel/insights/script.js")),
    report.httpErrors,
  );
  report.localAnalyticsNote =
    "Vercel analytics endpoint is absent on local vinext preview; unrelated to scene assets.";
} finally {
  await fs.writeFile(out + "/parts-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
console.log("Parts checks", report.checks.length);
