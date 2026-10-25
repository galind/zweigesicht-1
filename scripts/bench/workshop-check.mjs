/** Rectangular tabletop geometry/collision/visibility fixtures. Inspection views are labelled. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright"
);
const out = process.env.PLAY_QA_OUTPUT || "artifacts/workshop-stand";
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
const environment = JSON.parse(await fs.readFile("assets/authored/workshop-environment.json"));
const desk = environment.mainDesk,
  mat = environment.mat,
  detail = environment.tabletopDetail;
const stand = environment.props.find((p) => p.id === "dial-hand-stand");
const fixtures = { ...provenance, desk, mat, detail, stand };
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
  report.geometry = await page.evaluate(({ semantics, desk, mat, detail, stand }) => {
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
          triangleBox.max.y > desk.bottomY &&
          triangleBox.min.x < desk.maxX &&
          triangleBox.max.x > desk.minX &&
          triangleBox.min.z < desk.maxZ &&
          triangleBox.max.z > desk.minZ
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
      ["wood", 0, (mat.maxZ + desk.maxZ) / 2, -1],
      ["mat", mat.minX + 10, 0, 0],
      ["left wood border", desk.minX + detail.rimWidth + 4, 0, -1],
      ["right wood border", desk.maxX - detail.rimWidth - 4, 0, -1],
      ["back wood border", 0, desk.minZ + detail.rimWidth + 5, -1],
      ["open case center", -55, -7, 0],
      ["stand between rows", stand.handsX, -5, 2],
      ["left approach mat", -36, 35, 0],
      ["stand front surface", stand.handsX, stand.maxZ - 3, 2],
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
        pass: Math.abs(floor - height) < 0.03 && w.grounded && Math.abs(w.feet.y - floor) < 0.03,
      });
    }
    // Every sampled visible outline segment and corner, including the straight front edge.
    // Starting on the rim uses its real top; the boundary never supplies a floor.
    const outerEdges = [];
    const outline = w.bounds.footprint;
    for (let i = 0; i < outline.length; i++) {
      const [ax, az] = outline[i],
        [bx, bz] = outline[(i + 1) % outline.length];
      for (const t of [0, 0.5]) {
        setup(ax + (bx - ax) * t, 50, az + (bz - az) * t);
        w.constrainToDesk();
        const floor = b.world.floor(w.feet.x, w.feet.z, 50);
        w.feet.y = floor + 0.002;
        const dx = bx - ax,
          dz = bz - az;
        w.yaw = Math.atan2(-dz, dx); // W points outward (dz, -dx).
        w.keys.add("KeyW");
        advance(60);
        const supported = b.world.floor(w.feet.x, w.feet.z, 50);
        outerEdges.push({
          edge: i,
          t,
          feet: w.feet.toArray(),
          grounded: w.grounded,
          pass: Number.isFinite(supported) && w.grounded && Math.abs(w.feet.y - supported) < 0.03,
        });
      }
    }
    const frontEdges = [];
    for (const sign of [-1, 1]) {
      const x = sign < 0 ? desk.minX + 15 : desk.maxX - 15;
      frontEdges.push({
        name: "no invisible support " + sign,
        pass: !Number.isFinite(b.world.floor(x, desk.maxZ + 15, 50)),
      });
      for (const y of [-0.998, 50, 6000]) {
        setup(x, y, desk.maxZ - 0.23);
        w.velocity.set(sign * 100, 0, 100);
        w.keys.add("KeyS");
        w.update(10);
        advance(180);
        const contained = Number.isFinite(b.world.floor(w.feet.x, w.feet.z, 50));
        w.clear();
        w.velocity.set(0, 0, 0);
        const start = w.feet.z;
        w.keys.add("KeyW");
        advance(180);
        frontEdges.push({
          name: "fast front edge and free inward travel " + sign + " at " + y,
          pass: contained && w.feet.z < start - 4,
          feet: w.feet.toArray(),
        });
      }
    }
    const rimContacts = [];
    for (const [name, x, z, key, axis, limit, sign] of [
      ["left", desk.minX + detail.rimWidth + 2, 0, "KeyA", "x", desk.minX + detail.rimWidth, -1],
      ["right", desk.maxX - detail.rimWidth - 2, 0, "KeyD", "x", desk.maxX - detail.rimWidth, 1],
      ["back", 0, desk.minZ + detail.rimWidth + 2, "KeyW", "z", desk.minZ + detail.rimWidth, -1],
      ["left end", desk.minX + 3, detail.rimFrontZ + 2, "KeyW", "z", detail.rimFrontZ, -1],
      ["right end", desk.maxX - 3, detail.rimFrontZ + 2, "KeyW", "z", detail.rimFrontZ, -1],
    ]) {
      setup(x, -0.998, z);
      w.keys.add(key);
      advance(180);
      const blocked = sign * (w.feet[axis] - limit) < -0.2 && w.feet.y < -0.9;
      w.keys.add("Space");
      advance(360);
      w.clear();
      advance(400);
      rimContacts.push({
        name,
        pass: blocked && w.grounded && Math.abs(w.feet.y - 4) < 0.02,
        feet: w.feet.toArray(),
      });
    }
    const circulation = [];
    for (const [name, x, z, key, height = 0] of [
      ["left approach aisle", -36, 55, "KeyW"],
      ["right approach aisle", 36, 55, "KeyW"],
      ["front of stand", 55, 37, "KeyD"],
      ["between dial rows on stand", stand.dialX, -5, "KeyD", 2],
      ["behind case", -80, -36, "KeyD"],
    ]) {
      setup(x, height + 0.002, z);
      w.keys.add(key);
      advance(900);
      circulation.push({
        name,
        feet: w.feet.toArray(),
        pass:
          w.grounded &&
          Math.abs(w.feet.y - height) < 0.02 &&
          Math.hypot(w.feet.x - x, w.feet.z - z) > 25,
      });
    }
    for (const x of [mat.minX + 12, mat.maxX - 12]) {
      setup(x, 0.002, 57);
      w.keys.add("KeyW");
      advance(240);
      circulation.push({
        name: "front mat remains traversable " + x,
        feet: w.feet.toArray(),
        pass: w.feet.z < 51 && w.grounded && Math.abs(w.feet.y) < 0.02,
      });
    }
    setup(35, 0.002, -3);
    w.keys.add("KeyD");
    w.keys.add("ShiftLeft");
    advance(500);
    const runningStopX = w.feet.x;
    w.clear();
    advance(90); // Settle after contact before asserting the resting grounded state.
    circulation.push({
      name: "running stops at the visible stand wall",
      runningStopX,
      feet: w.feet.toArray(),
      pass:
        runningStopX > 39.7 &&
        runningStopX < 39.8 &&
        w.feet.x < 39.8 &&
        w.grounded &&
        Math.abs(w.feet.y) < 0.02,
    });
    const matEdges = [];
    for (const [x, z, outKey, inKey, axis, sign] of [
      [mat.maxX - 1, 40, "KeyD", "KeyA", "x", 1],
      [mat.minX + 1, 40, "KeyA", "KeyD", "x", -1],
      [30, mat.maxZ - 1, "KeyS", "KeyW", "z", 1],
      [30, mat.minZ + 1, "KeyW", "KeyS", "z", -1],
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
      const edge = axis === "x" ? (sign > 0 ? mat.maxX : mat.minX) : sign > 0 ? mat.maxZ : mat.minZ;
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
          sign * blocked[axis === "x" ? 0 : 2] > sign * edge &&
          Math.abs(back[1]) < 0.01 &&
          w.grounded,
      });
    }
    // All reachable tabletop/rim surfaces use their actual render triangles.
    return {
      stats,
      collisions,
      circulation,
      matEdges,
      outerEdges,
      frontEdges,
      rimContacts,
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
  }, fixtures);
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
  const allowedIds = new Set(["main-oak-top", "green-mat", "low-back-side-rim", "dial-hand-stand"]);
  check(
    "tabletop, low rim, plain mat and oak stand are the only environment parts",
    provenance.semantics.every((part) => allowedIds.has(part.id) && part.min[1] >= -33),
    provenance.semantics,
  );
  check(
    "mat is 15 mm from the straight front edge",
    provenance.semantics.find((p) => p.id === "main-oak-top").max[2] -
      provenance.semantics.find((p) => p.id === "green-mat").max[2] ===
      15,
  );
  check("no transparent environment containers remain", s.nonOpaque.length === 0, s.nonOpaque);
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
    g.bounds.minX === desk.minX &&
      g.bounds.maxX === desk.maxX &&
      g.bounds.minZ === desk.minZ &&
      g.bounds.maxZ === desk.maxZ &&
      g.bounds.footprint.length === 4,
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
  for (const row of g.circulation) check(row.name, row.pass, row);
  for (const row of g.collisions) check("drop on " + row.name, row.pass, row);
  for (const row of g.outerEdges)
    check("solid outline segment/corner " + row.edge + "/" + row.t, row.pass, row);
  for (const row of [...g.frontEdges, ...g.rimContacts]) check(row.name, row.pass, row);
  for (const [i, row] of g.matEdges.entries())
    check("mat edge descent/block/jetpack " + i, row.pass, row);
  // Real keyboard input across a mat edge, in addition to labelled fixtures.
  await page.evaluate((maxX) => {
    const b = window.bench;
    b.walker.reset();
    b.walker.feet.set(maxX - 2, 0.002, 40);
    b.wake();
  }, mat.maxX);
  await page.getByRole("button", { name: "Start exploring", exact: true }).click();
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
      (maxX) => window.bench.walker.feet.x > maxX && window.bench.walker.feet.y < -0.9,
      mat.maxX,
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
    ["open-space-inspection", [270, 180, 320], [20, -10, -5]],
    ["reference-front-overview", [20, 200, 250], [20, -1, -5]],
    ["rim-profile-overview", [250, 65, 180], [20, -1, -5]],
    ["underside-overview", [200, -150, 240], [20, -17, -5]],
    ["desk-inspection", [150, 210, 190], [20, 0, -5]],
  ]) {
    await page.evaluate(
      ({ position, target }) => {
        const b = window.bench;
        cancelAnimationFrame(b.frame);
        b.frame = 0;
        b.camera.fov = 45;
        b.camera.position.fromArray(position);
        b.camera.far = Math.ceil(
          b.camera.position.distanceTo(b.roomBounds.center) + b.roomBounds.radius + 100,
        );
        b.camera.updateProjectionMatrix();
        b.camera.lookAt(...target);
        b.renderer.render(b.scene, b.camera);
      },
      { position, target },
    );
    await page.screenshot({ path: out + "/" + name + ".png" });
  }
  for (const [name, x, z, yaw, pitch] of [
    ["mat-edge-visitor", mat.maxX + 2, 40, Math.PI / 2, -0.3],
    ["rim-visitor", desk.maxX - 8, -30, -Math.PI / 2, 0.1],
    ["front-edge-visitor", desk.maxX - 15, desk.maxZ - 2, Math.PI, -0.35],
  ]) {
    await page.evaluate(
      ({ x, z, yaw, pitch }) => {
        const b = window.bench;
        b.camera.fov = 68;
        b.camera.updateProjectionMatrix();
        b.walker.feet.set(x, b.world.floor(x, z, 50) + 0.002, z);
        b.walker.velocity.set(0, 0, 0);
        b.walker.yaw = yaw;
        b.walker.pitch = pitch;
        b.wake();
      },
      { x, z, yaw, pitch },
    );
    await page.waitForTimeout(200);
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
      "high flight environment containment " + yaw,
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
      if (!o.isMesh) return;
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
    "all bench GPU resources, including shared CAD, disposed exactly once",
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
