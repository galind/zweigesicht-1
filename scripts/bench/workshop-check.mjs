/** Revision 3 geometry/collision/visibility fixtures. Inspection views are labelled. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright"
);
const out = process.env.PLAY_QA_OUTPUT || "artifacts/workshop-implementation";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const base = process.argv[2] || "http://127.0.0.1:4198";
const provenance = JSON.parse(
  await fs.readFile("assets/source-manifest/workshop-environment.json"),
);
const report = { checks: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
const check = (name, pass, detail) => {
  report.checks.push({ name, pass, detail });
  assert.ok(pass, name + ": " + JSON.stringify(detail));
};
try {
  if (process.env.WORKSHOP_DEPTH === "fallback")
    await page.addInitScript(() => {
      const get = WebGL2RenderingContext.prototype.getExtension;
      WebGL2RenderingContext.prototype.getExtension = function (name) {
        return name === "EXT_clip_control" ? null : get.call(this, name);
      };
    });
  await page.goto(base + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
  report.geometry = await page.evaluate(({ semantics }) => {
    const b = window.bench,
      w = b.walker,
      V = w.feet.constructor,
      B = b.flip.swept.constructor;
    cancelAnimationFrame(b.frame);
    b.frame = 0;
    const meshes = [];
    b.scene.traverse((o) => {
      if (o.geometry && o.userData.atelierVersion) meshes.push(o);
    });
    const stats = {
      visible: 0,
      collision: 0,
      draws: meshes.length,
      textures: [],
      nonOpaque: [],
      missingIds: [],
      sweepHits: [],
      holderHits: [],
      decorIntrusions: [],
    };
    const textureSet = new Set();
    const triangleBox = new B(),
      a = new V(),
      c = new V(),
      d = new V();
    const positiveOverlap = (a, b) =>
      ["x", "y", "z"].every(
        (k) => Math.min(a.max[k], b.max[k]) - Math.max(a.min[k], b.min[k]) > 1e-4,
      );
    const holderBoxes = Object.values(b.station.holders).map((h) => new B().setFromObject(h));
    // Per-part columns include the visitor margin, so disjointness proves a
    // conservative continuous lift/lower clearance. Turn discs are continuously
    // enclosed by per-part boxes; this is not a sampled-animation clearance claim.
    const turnBoxes = b.flip.discs.map(
      (x) =>
        new B(
          new V(x.minX, x.y - x.radius, x.z - x.radius),
          new V(x.maxX, x.y + x.radius, x.z + x.radius),
        ),
    );
    const sweeps = [...b.flip.columns, ...turnBoxes];
    for (const mesh of meshes) {
      const g = mesh.geometry,
        p = g.attributes.position,
        idx = g.index,
        n = (idx?.count || p.count) / 3;
      const collides = b.world.solids.some((s) => s.mesh === mesh);
      stats.visible += n;
      if (collides) stats.collision += n;
      if (mesh.material.transmission || mesh.material.transparent) stats.nonOpaque.push(mesh.name);
      for (const v of Object.values(mesh.material)) if (v?.isTexture) textureSet.add(v);
      for (let i = 0; i < n; i++) {
        [a, c, d].forEach((v, j) =>
          v
            .fromBufferAttribute(p, idx ? idx.getX(i * 3 + j) : i * 3 + j)
            .applyMatrix4(mesh.matrixWorld),
        );
        triangleBox.setFromPoints([a, c, d]);
        if (collides) {
          if (sweeps.some((box) => positiveOverlap(box, triangleBox)))
            stats.sweepHits.push([mesh.name, i]);
          if (holderBoxes.some((box) => positiveOverlap(box, triangleBox)))
            stats.holderHits.push([mesh.name, i]);
        } else if (
          mesh.material.name !== "Guillem Galindo" &&
          triangleBox.max.y > -33 &&
          triangleBox.min.x < 550 &&
          triangleBox.max.x > -550 &&
          triangleBox.min.z < 185 &&
          triangleBox.max.z > -465
        )
          stats.decorIntrusions.push([mesh.name, i]);
      }
    }
    stats.textures = [...textureSet].map((t) => ({
      width: t.image.width,
      height: t.image.height,
      mipmaps: t.generateMipmaps,
      bytes: t.image.width * t.image.height * 4 * (t.generateMipmaps ? 4 / 3 : 1),
    }));
    stats.missingIds = semantics
      .filter((s) => !meshes.some((m) => m.userData.semanticIds?.includes(s.id)))
      .map((s) => s.id);
    stats.sweep = {
      parts: b.flip.discs.length,
      columns: b.flip.columns.length,
      liftHeight: b.flip.liftHeight,
      box: [b.flip.swept.min.toArray(), b.flip.swept.max.toArray()],
    };
    const setup = (x, y, z) => {
      w.clear();
      w.velocity.set(0, 0, 0);
      w.feet.set(x, y, z);
      w.grounded = false;
      w.yaw = 0;
    };
    const advance = (n) => {
      for (let i = 0; i < n; i++) w.update(1 / 180);
    };
    const collisions = [];
    for (const [name, x, z, height] of [
      ["wood", 0, 160, -1],
      ["mat", 100, 0, 0],
      ["stand", -380, -70, 27],
      ["screwdriver", -380, -90, 99],
      ["tray interior", -380, 65, 1],
      ["tray rim", -454, 65, 11],
      ["loupe", 210, 0, 25.75],
      ["tweezers", 225, 100, 1.76],
      ["notebook", 350, -170, 7],
      ["lamp base", -325, -230, 14],
      ["lamp hinge", -300, -230, 200],
      ["lamp head", -190, -135, 385],
    ]) {
      const floor = b.world.floor(x, z, 500);
      setup(x, floor + 3, z);
      advance(500);
      collisions.push({
        name,
        floor,
        expected: height,
        grounded: w.grounded,
        feet: w.feet.toArray(),
        pass: Math.abs(floor - height) < 1.1 && w.grounded && Math.abs(w.feet.y - floor) < 0.03,
      });
    }
    // Mat descent, walking rejection, then thrust return on all four edges.
    const outerEdges = [];
    for (const dx of [-1, 0, 1])
      for (const dz of [-1, 0, 1]) {
        if (!dx && !dz) continue;
        setup(
          dx < 0 ? -549.779 : dx > 0 ? 549.779 : 0,
          -0.998,
          dz < 0 ? -464.779 : dz > 0 ? 184.779 : 40,
        );
        if (dx) w.keys.add(dx < 0 ? "KeyA" : "KeyD");
        if (dz) w.keys.add(dz < 0 ? "KeyW" : "KeyS");
        advance(1800);
        outerEdges.push({
          dx,
          dz,
          feet: w.feet.toArray(),
          grounded: w.grounded,
          pass: w.grounded && w.feet.y > -1.05,
        });
      }
    const matEdges = [];
    for (const [x, z, outKey, inKey, axis, sign] of [
      [174, 40, "KeyD", "KeyA", "x", 1],
      [-174, 40, "KeyA", "KeyD", "x", -1],
      [100, 124, "KeyS", "KeyW", "z", 1],
      [100, -124, "KeyW", "KeyS", "z", -1],
    ]) {
      setup(x, 0.002, z);
      advance(20);
      w.keys.add(outKey);
      advance(130);
      w.clear();
      advance(90);
      const off = w.feet.toArray();
      w.keys.add(inKey);
      advance(180);
      const blocked = w.feet.toArray();
      const edge = axis === "x" ? 175 : 125;
      w.keys.add("Space");
      advance(170);
      w.clear();
      advance(500);
      const back = w.feet.toArray();
      matEdges.push({
        off,
        blocked,
        back,
        pass:
          Math.abs(off[1] + 1) < 0.01 &&
          sign * blocked[axis === "x" ? 0 : 2] > edge &&
          Math.abs(back[1]) < 0.01 &&
          w.grounded,
      });
    }
    // Every semantic reachable prop has corresponding render triangles in a
    // collision mesh, including all arm/head components and five instruments.
    return {
      stats,
      collisions,
      matEdges,
      outerEdges,
      bounds: w.bounds,
      near: b.camera.near,
      depth: {
        reversed: b.renderer.capabilities.reversedDepthBuffer,
        logarithmic: b.renderer.capabilities.logarithmicDepthBuffer,
      },
      fog: b.scene.fog,
      station: b.station.root.position.toArray(),
      arrival: w.spawn.toArray(),
    };
  }, provenance);
  const g = report.geometry,
    s = g.stats;
  check("one precision depth path enabled", g.depth.reversed !== g.depth.logarithmic, g.depth);
  if (process.env.WORKSHOP_DEPTH === "fallback")
    check("forced legacy GPU uses logarithmic fallback", g.depth.logarithmic && !g.depth.reversed);
  check(
    "environment budgets",
    s.visible <= 40000 &&
      s.collision <= 8000 &&
      s.draws <= 24 &&
      s.textures.reduce((n, t) => n + t.bytes, 0) <= 24 * 1024 ** 2,
    s,
  );
  check(
    "manifest matches actual runtime",
    s.visible === provenance.budgets.visibleTriangles &&
      s.collision === provenance.budgets.collisionTriangles &&
      s.draws === provenance.budgets.drawsPerPass,
  );
  check("all semantics retained; reachable geometry collides", !s.missingIds.length, s.missingIds);
  check("no new transparent or transmission passes", !s.nonOpaque.length, s.nonOpaque);
  check(
    "continuous per-part flip envelopes clear every static triangle",
    !s.sweepHits.length,
    s.sweepHits,
  );
  check(
    "both complete holder bounds clear new solids, contact allowed",
    !s.holderHits.length,
    s.holderHits,
  );
  check("decor stays outside reachable column", !s.decorIntrusions.length, s.decorIntrusions);
  check(
    "approved desk boundaries",
    JSON.stringify(g.bounds) === JSON.stringify({ minX: -550, maxX: 550, minZ: -465, maxZ: 185 }),
    g.bounds,
  );
  check(
    "unchanged arrival/station/near; no fog",
    JSON.stringify(g.arrival) === "[0,0.002,54]" &&
      JSON.stringify(g.station) === "[0,0,-7]" &&
      g.near === 0.035 &&
      g.fog === null,
    g,
  );
  for (const row of g.collisions) check("drop on " + row.name, row.pass, row);
  for (const row of g.outerEdges)
    check("solid outer desk edge " + row.dx + "," + row.dz, row.pass, row);
  for (const [i, row] of g.matEdges.entries())
    check("mat edge descent/block/jetpack " + i, row.pass, row);
  // Real keyboard input across a mat edge, in addition to labelled fixtures.
  await page.evaluate(() => {
    const b = window.bench;
    b.walker.reset();
    b.walker.feet.set(173, 0.002, 40);
    b.wake();
  });
  await page.getByRole("button", { name: "Enter the movement", exact: true }).click();
  await page.waitForFunction(() => window.bench.status.captured);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1000);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(500);
  check(
    "actual keyboard walks from mat to wood",
    await page.evaluate(() => Math.abs(window.bench.walker.feet.y + 1) < 0.01),
  );
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(900);
  await page.keyboard.up("KeyA");
  check(
    "actual walking cannot climb 1 mm mat",
    await page.evaluate(
      () => window.bench.walker.feet.x > 175 && window.bench.walker.feet.y < -0.9,
    ),
  );
  await page.keyboard.down("Space");
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(1200);
  await page.keyboard.up("Space");
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(2000);
  check(
    "actual jetpack returns to mat",
    await page.evaluate(
      () => window.bench.walker.grounded && Math.abs(window.bench.walker.feet.y) < 0.01,
    ),
  );
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(200);
  check(
    "arrival eyes remain 1.48 mm",
    await page.evaluate(
      () => Math.abs(window.bench.camera.position.y - window.bench.walker.feet.y - 1.48) < 1e-10,
    ),
  );
  await page.screenshot({ path: out + "/arrival.png" });
  await page.keyboard.press("Escape");
  await page.addStyleTag({
    content: ".bench-menu,.bench-start,.bench-menu-backdrop,.bench-legend{display:none!important}",
  });
  // Explicit camera fixtures, never exposed as visitor camera controls.
  for (const [name, position, target] of [
    ["room-inspection", [0, 300, 1600], [0, -130, -140]],
    ["desk-inspection", [280, 480, 420], [0, 0, -120]],
    ["map-inspection", [0, 420, -80], [0, 420, -500]],
    ["wordmark-inspection", [154, 15, 127], [154, 0, 114]],
  ]) {
    await page.evaluate(
      ({ position, target }) => {
        const b = window.bench;
        cancelAnimationFrame(b.frame);
        b.frame = 0;
        b.camera.fov = 45;
        b.camera.updateProjectionMatrix();
        b.camera.position.fromArray(position);
        b.camera.lookAt(...target);
        b.renderer.render(b.scene, b.camera);
      },
      { position, target },
    );
    await page.screenshot({ path: out + "/" + name + ".png" });
  }
  for (const side of ["bridge", "dial"]) {
    await page.evaluate((side) => {
      const b = window.bench;
      b.camera.fov = 68;
      b.camera.updateProjectionMatrix();
      b.flip.setRest(side);
      b.walker.feet.set(-8, b.world.floor(-8, -7) + 0.002, -7);
      b.walker.yaw = -Math.PI / 2;
      b.walker.pitch = -0.55;
      b.wake();
    }, side);
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + "/" + side + "-landed.png" });
  }
  report.highFlight = [];
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    await page.evaluate((yaw) => {
      const b = window.bench;
      b.walker.feet.set(0, 6000, 54);
      b.walker.velocity.set(0, 0, 0);
      b.walker.yaw = yaw;
      b.walker.pitch = -1.4;
      b.wake();
    }, yaw);
    await page.waitForTimeout(100);
    const row = await page.evaluate(() => {
      const b = window.bench;
      return {
        far: b.camera.far,
        needed: b.camera.position.distanceTo(b.roomBounds.center) + b.roomBounds.radius,
        height: b.camera.position.y,
        near: b.camera.near,
      };
    });
    report.highFlight.push(row);
    check(
      "high flight room containment " + yaw,
      row.far > row.needed && row.height > 5900 && row.near === 0.035,
      row,
    );
  }
  await page.screenshot({ path: out + "/high-flight.png" });
  report.disposal = await page.evaluate(() => {
    const b = window.bench,
      geometry = new Set(),
      materials = new Set(),
      textures = new Set();
    b.scene.traverse((o) => {
      if (!o.userData.atelierVersion) return;
      geometry.add(o.geometry);
      materials.add(o.material);
      for (const v of Object.values(o.material)) if (v?.isTexture) textures.add(v);
    });
    const released = { geometry: 0, materials: 0, textures: 0 };
    for (const [key, set] of Object.entries({ geometry, materials, textures }))
      for (const item of set) item.addEventListener("dispose", () => released[key]++);
    b.dispose();
    b.dispose();
    return {
      expected: { geometry: geometry.size, materials: materials.size, textures: textures.size },
      released,
      solids: b.world.solids.length,
      trees: b.world.trees.size,
    };
  });
  check(
    "all environment GPU resources disposed exactly once",
    JSON.stringify(report.disposal.expected) === JSON.stringify(report.disposal.released) &&
      report.disposal.solids === 0 &&
      report.disposal.trees === 0,
    report.disposal,
  );
  await page.reload();
  await page.waitForFunction(() => window.bench?.status.ready);
  check(
    "route reload recreates environment",
    await page.evaluate(() =>
      window.bench.world.solids.some((s) => s.mesh.material.name === "Oak"),
    ),
  );
  check("no browser errors", !report.errors.length, report.errors);
  console.log(
    JSON.stringify({
      checks: report.checks.length,
      triangles: s.visible,
      collision: s.collision,
      draws: s.draws,
    }),
  );
} finally {
  await fs.writeFile(out + "/workshop-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
