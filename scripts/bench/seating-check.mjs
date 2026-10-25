/** Verify seating against actual runtime CAD and the actual bored wood mesh. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const layout = JSON.parse(await fs.readFile("assets/authored/bench-parts-layout.json"));
const stand = JSON.parse(await fs.readFile("assets/authored/workshop-environment.json")).props.find(
  (p) => p.id === "dial-hand-stand",
);
const { dialX: dx, handsX: hx, topY: sy } = stand;
const cz = stand.rows.find((r) => r.face === "central").z,
  sz = stand.rows.find((r) => r.face === "small").z;
const out = process.env.PLAY_QA_OUTPUT || "artifacts/workshop-seating";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = { checks: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
function check(name, pass, detail) {
  report.checks.push({ name, pass, detail });
  assert.ok(pass, name + ": " + JSON.stringify(detail));
}
try {
  await page.goto((process.argv[2] || "http://127.0.0.1:4198") + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
  report.geometry = await page.evaluate((layout) => {
    const b = window.bench;
    cancelAnimationFrame(b.frame);
    b.frame = 0;
    b.scene.updateMatrixWorld(true);
    const V = b.walker.feet.constructor,
      top = layout.standSeating.topY,
      holes = layout.standSeating.holes;
    const wood = b.world.solids.filter((s) =>
      s.mesh.userData.semanticIds?.includes("dial-hand-stand"),
    );
    if (wood.length !== 1) throw Error("Missing bored stand collision mesh");
    const woodMeshes = new Set(wood.map((s) => s.mesh));
    const floor = (x, z) => b.world.floor(x, z, top + 1, woodMeshes);
    const bores = holes.map((h) => {
      const inside = [],
        outside = [];
      for (let i = 0; i < 16; i++) {
        const t = (i * Math.PI) / 8;
        inside.push(
          floor(h.x + (h.radius - 0.02) * Math.cos(t), h.z + (h.radius - 0.02) * Math.sin(t)),
        );
        outside.push(
          floor(h.x + (h.radius + 0.04) * Math.cos(t), h.z + (h.radius + 0.04) * Math.sin(t)),
        );
      }
      return { id: h.id, center: floor(h.x, h.z), inside, outside };
    });
    const packets = [];
    for (const spec of layout.groups
      .flatMap((g) => (g.leafIds ? [g] : g.packets))
      .filter((p) => p.id !== "case")) {
      const group = b.detached.getObjectByName(spec.id),
        supports = layout.standSeating.packets.find((p) => p.id === spec.id).supportingIds;
      let clippedPoints = 0,
        woodOverlap = 0,
        minClearance = Infinity,
        minPartY = Infinity,
        bladeBelow = 0;
      const contacts = [];
      for (const mesh of group.children) {
        const g = mesh.geometry,
          p = g.attributes.position,
          idx = g.index,
          vs = Array.from({ length: p.count }, (_, i) =>
            new V().fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld),
          );
        for (const v of vs) {
          minPartY = Math.min(minPartY, v.y);
          if (supports.includes(mesh.userData.partId)) {
            if (spec.role && v.y < top - 1e-6) bladeBelow++;
            if (Math.abs(v.y - top) < 1e-5 && Math.abs(floor(v.x, v.z) - top) < 1e-4)
              contacts.push(v.toArray());
          }
        }
        for (let i = 0; i < idx.count; i += 3) {
          const tri = [0, 1, 2].map((j) => vs[idx.getX(i + j)]);
          if (Math.min(...tri.map((v) => v.y)) >= top - 1e-6) continue;
          const polygon = [];
          for (let j = 0; j < 3; j++) {
            const a = tri[j],
              c = tri[(j + 1) % 3];
            if (a.y <= top) polygon.push(a);
            if (a.y <= top !== c.y <= top)
              polygon.push(a.clone().lerp(c, (top - a.y) / (c.y - a.y)));
          }
          // A convex circular bore encloses a clipped triangle iff all its vertices fit.
          const h = holes
            .filter((h) => h.packet === spec.id)
            .find((h) => polygon.every((v) => Math.hypot(v.x - h.x, v.z - h.z) < h.radius));
          if (!h) {
            woodOverlap++;
            continue;
          }
          for (const v of polygon) {
            clippedPoints++;
            minClearance = Math.min(minClearance, h.radius - Math.hypot(v.x - h.x, v.z - h.z));
            if (floor(v.x, v.z) > v.y + 1e-5) woodOverlap++;
          }
        }
      }
      const zs = contacts.map((v) => v[2]);
      packets.push({
        id: spec.id,
        clippedPoints,
        woodOverlap,
        minClearance,
        minPartY,
        bladeBelow,
        contacts: contacts.length,
        contactSpanZ: Math.max(...zs) - Math.min(...zs),
      });
    }
    return { bores, packets };
  }, layout);
  check(
    "ten genuine through-bores open to the tabletop below the mat",
    report.geometry.bores.length === 10 &&
      report.geometry.bores.every(
        (h) => Math.abs(h.center + 1) < 1e-4 && h.inside.every((y) => Math.abs(y + 1) < 1e-4),
      ),
    report.geometry.bores,
  );
  check(
    "wood remains around every bore at the specified stand height",
    report.geometry.bores.every((h) =>
      h.outside.every((y) => Math.abs(y - layout.standSeating.topY) < 1e-4),
    ),
  );
  check(
    "every clipped source triangle clears actual wood; pins stay above mat",
    report.geometry.packets.every(
      (p) => p.clippedPoints > 0 && p.woodOverlap === 0 && p.minClearance > 0.119 && p.minPartY > 0,
    ),
    report.geometry.packets,
  );
  check(
    "both dial backs and all blades have separated contacts on actual wood",
    report.geometry.packets.every(
      (p) => p.contacts >= 2 && p.contactSpanZ > 5 && p.bladeBelow === 0,
    ),
    report.geometry.packets,
  );
  await page.addStyleTag({
    content: ".bench-menu,.bench-start,.bench-menu-backdrop,.bench-legend{display:none!important}",
  });
  for (const [name, position, target, hidden] of [
    [
      "stand-bores-exposed",
      [hx + 29, 100, sz + 59],
      [(stand.minX + stand.maxX) / 2, sy, (cz + sz) / 2],
      true,
    ],
    ["central-dial-flush", [dx + 19, sy + 1.5, cz + 22], [dx, sy, cz], false],
    ["small-dial-flush", [dx + 18, sy + 1.5, sz + 21], [dx, sy, sz], false],
    ["hand-seating-close", [hx + 22, sy + 4.5, cz + 23], [hx, sy, cz], false],
  ]) {
    await page.evaluate(
      ({ position, target, hidden }) => {
        const b = window.bench;
        b.detached.visible = !hidden;
        b.camera.position.fromArray(position);
        b.camera.lookAt(...target);
        b.camera.fov = 42;
        b.camera.far = 3000;
        b.camera.updateProjectionMatrix();
        b.renderer.setPixelRatio(1);
        b.renderer.render(b.scene, b.camera);
      },
      { position, target, hidden },
    );
    await page.screenshot({ path: out + "/" + name + ".png" });
  }
  check("no browser errors", report.errors.length === 0, report.errors);
} finally {
  await fs.writeFile(out + "/seating-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
console.log("Seating checks", report.checks.length);
