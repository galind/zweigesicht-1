/** Actual keyboard flip journey + labelled deterministic safety/CAD fixtures. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright"
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const base = process.argv[2] || "http://127.0.0.1:4188",
  out = process.env.PLAY_QA_OUTPUT || "artifacts/bench-flip";
await fs.mkdir(out, { recursive: true });
const report = { checks: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
const check = (name, pass, detail) => {
  report.checks.push({ name, pass, detail });
  assert.ok(pass, name + ": " + JSON.stringify(detail));
};
const state = () =>
  page.evaluate(() => {
    const b = window.bench,
      w = b.walker,
      f = b.flip;
    return {
      side: f.side,
      active: f.active,
      elapsed: f.elapsed,
      completed: f.completed,
      blocked: f.blocked,
      feet: w.feet.toArray(),
      velocity: w.velocity.toArray(),
      yaw: w.yaw,
      pitch: w.pitch,
      resets: w.resets,
      grounded: w.grounded,
      eye: b.camera.position.y - w.feet.y,
      captured: b.status.captured,
      guard: !!w.guard,
    };
  });
const enter = async () => {
  await page.getByRole("button", { name: /^(Start exploring|Resume exploring)$/ }).click();
  await page.waitForFunction(() => window.bench.status.captured);
};
const done = () => page.waitForFunction(() => !window.bench.flip.active, null, { timeout: 15000 });
try {
  await page.goto(base + "/?inspect=1");
  await page.locator(".stage canvas").waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole("link", { name: "Explore it in first person", exact: true }).click();
  await page.locator(".bench-menu-controls").waitFor();
  check(
    "Bench introduction has F",
    await page
      .locator(".bench-start")
      .innerText()
      .then((t) => /F\s+Flip movement/.test(t)),
  );
  await page.screenshot({ path: out + "/entry-controls.png" });
  await page.goto(base + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
  await enter();
  check(
    "exploration hint has F",
    await page
      .locator(".bench-legend")
      .innerText()
      .then((t) => t.includes("F Flip")),
  );
  // Ground-level scene inspection position; player size and eye offset are untouched.
  await page.evaluate(() => {
    const b = window.bench,
      w = b.walker;
    w.feet.set(28, 0.00001, 27);
    w.velocity.set(0, 0, 0);
    w.grounded = true;
    w.yaw = Math.atan2(28, 34);
    w.pitch = 0.47;
    b.wake();
  });
  await page.waitForTimeout(150);
  const before = await state();
  await page.screenshot({ path: out + "/before-flip.png" });
  await page.keyboard.press("f");
  await page.waitForFunction(() => window.bench.flip.elapsed > 1.7);
  await page.screenshot({ path: out + "/during-flip.png" });
  await page.keyboard.press("f");
  await page.keyboard.down("f");
  await page.waitForTimeout(100);
  await page.keyboard.down("f");
  await done();
  await page.keyboard.down("f"); // Auto-repeat after completion must not restart.
  await page.keyboard.up("f");
  const after = await state();
  await page.screenshot({ path: out + "/after-flip.png" });
  check(
    "forward flip and repeat suppression",
    after.side === "dial" && after.completed === 1 && !after.active,
    after,
  );
  check(
    "safe grounded visitor undisturbed",
    Math.hypot(after.feet[0] - before.feet[0], after.feet[2] - before.feet[2]) < 1e-8 &&
      Math.abs(after.feet[1] - before.feet[1]) < 0.001 &&
      after.yaw === before.yaw &&
      after.pitch === before.pitch &&
      after.resets === before.resets &&
      !after.blocked,
    { before, after },
  );
  check("visitor eye remains 1.48 mm", Math.abs(after.eye - 1.48) < 1e-8);
  await page.keyboard.press("f");
  await page.waitForFunction(() => window.bench.flip.elapsed > 1.7);
  await page.screenshot({ path: out + "/during-reverse.png" });
  await done();
  check("reverse flip", (await state()).side === "bridge");
  await page.screenshot({ path: out + "/after-reverse.png" });
  await page.keyboard.press("f");
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Resume exploring" }).waitFor();
  check(
    "Escape menu has F",
    await page
      .locator(".bench-menu-controls")
      .innerText()
      .then((t) => /F\s+Flip movement/.test(t)),
  );
  await done();
  check("Escape settles while visible", (await state()).side === "dial");
  await enter();
  await page.keyboard.press("f");
  await page.waitForTimeout(300);
  const other = await page.context().newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  await page.waitForFunction(() => !window.bench.status.captured);
  await done();
  check(
    "actual focus loss completes flip and clears input",
    await page.evaluate(
      () =>
        !window.bench.flip.active &&
        window.bench.walker.keys.size === 0 &&
        !window.bench.walker.guard,
    ),
  );
  await other.close();
  await page.bringToFront();
  await enter();
  await page.keyboard.press("f");
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  check(
    "hidden document settles atomically",
    await page.evaluate(
      () =>
        !window.bench.flip.active &&
        !window.bench.walker.guard &&
        window.bench.flip.side === "dial" &&
        window.bench.frame === 0,
    ),
  );
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await enter();
  await page.evaluate(() => {
    const b = window.bench,
      w = b.walker;
    b.flip.setRest("bridge");
    w.clear();
    w.feet.set(0, b.world.floor(0, -7) + 0.00001, -7);
    w.grounded = true;
    w.velocity.set(0, 0, 0);
    b.wake();
  });
  await page.waitForTimeout(100);
  const blockedBefore = await state();
  await page.keyboard.press("f");
  await page.getByText("Move away from the movement to flip it.", { exact: true }).waitFor();
  await page.keyboard.press("f");
  const blockedAfter = await state();
  check(
    "F on movement shows message without relocation or flip",
    blockedAfter.blocked &&
      !blockedAfter.active &&
      blockedAfter.side === "bridge" &&
      blockedAfter.feet.every((v, i) => Math.abs(v - blockedBefore.feet[i]) < 0.001) &&
      blockedAfter.yaw === blockedBefore.yaw &&
      blockedAfter.pitch === blockedBefore.pitch,
  );
  await page.screenshot({ path: out + "/blocked-flip.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Resume exploring", exact: true }).waitFor();
  await page.screenshot({ path: out + "/centered-menu.png" });
  await enter();
  check(
    "blocked notice survives Escape and resume",
    await page.locator(".bench-legend .bench-flip-notice").isVisible(),
  );
  await page.evaluate(() => {
    const b = window.bench;
    b.walker.feet.set(35, 0.00001, 28);
    b.walker.velocity.set(0, 0, 0);
    b.walker.grounded = true;
    b.wake();
  });
  await page.waitForFunction(() => !window.bench.status.flipBlocked);
  check("moving away clears message without starting automatically", !(await state()).active);
  await page.keyboard.press("f");
  await page.waitForFunction(() => window.bench.flip.active);
  await done();
  check("fresh F after moving away flips normally", (await state()).side === "dial");
  report.fixtures = await page.evaluate(() => {
    const b = window.bench,
      w = b.walker,
      f = b.flip,
      results = [];
    for (const solid of b.world.solids) solid.mesh.geometry.boundsTree = solid.tree;
    b.pause();
    cancelAnimationFrame(b.frame);
    b.frame = 0;
    const reset = () => {
      f.finish();
      f.setRest("bridge");
      w.clear();
      w.velocity.set(0, 0, 0);
      w.yaw = 0.6;
      w.pitch = -0.2;
      w.grounded = false;
    };
    const row = (name, pass, detail) => results.push({ name, pass, detail });
    const run = () => {
      for (let i = 0; i < 260; i++) {
        f.update(1 / 60);
        w.update(1 / 60);
      }
    };
    // Standing on actual highest CAD, rather than an invented proxy floor.
    reset();
    w.feet.set(0, b.world.floor(0, -7) + 0.00001, -7);
    w.grounded = true;
    const resets = w.resets,
      standing = w.feet.clone();
    row(
      "standing on movement blocks flip without relocating",
      !f.start() &&
        f.blocked &&
        w.feet.equals(standing) &&
        w.resets === resets &&
        w.yaw === 0.6 &&
        w.pitch === -0.2,
    );
    run();
    row(
      "standing visitor retains resting support",
      !f.active && f.side === "bridge" && w.feet.distanceTo(standing) < 0.001 && w.grounded,
    );
    reset();
    w.feet.set(0, 28, -7);
    w.velocity.set(1, 3, 2);
    w.keys.add("Space");
    const airborne = w.feet.clone();
    row(
      "blocked airborne visitor preserves position, momentum, view and thrust",
      !f.start() &&
        f.blocked &&
        w.feet.equals(airborne) &&
        w.velocity.y === 3 &&
        w.yaw === 0.6 &&
        w.keys.has("Space"),
    );
    // Clear visitors over or beside the sweep keep their full state at activation.
    for (const point of [
      [35, 25, -7],
      [0, 90, -7],
    ]) {
      reset();
      w.feet.fromArray(point);
      w.velocity.set(2, -3, 1);
      const started = f.start();
      row(
        "safe airborne state " + point.join(","),
        started &&
          !f.blocked &&
          w.feet.toArray().every((v, i) => v === point[i]) &&
          w.velocity.y === -3,
      );
      f.finish();
    }
    reset();
    w.feet.set(22, f.liftHeight + 14, 8);
    const clearCorner = w.feet.clone();
    row(
      "corner fixture inside coarse bounds is clear",
      f.forbiddenFeet.containsPoint(w.feet) && !f.isUnsafe(w.feet),
    );
    f.start();
    row(
      "safe corner visitor remains undisturbed",
      f.active && !f.blocked && w.feet.equals(clearCorner),
    );
    f.finish();
    // Find real free capsules below CAD, including a holder-destination obstruction.
    reset();
    let clearUnder = null,
      blockedUnder = null;
    search: for (let y = 0.00001; y < 8; y += 0.5)
      for (let x = -18; x <= 18; x += 1)
        for (let z = -18; z <= 18; z += 1) {
          const p = w.feet.clone().set(x, y, z - 7);
          if (b.world.overlaps(p) || f.isUnsafe(p)) continue;
          const incoming = b.world.overlaps(p, f.holderMeshes("dial"));
          if (incoming && !blockedUnder) blockedUnder = p.toArray();
          if (!incoming && !clearUnder && Math.hypot(x, z) < 16) clearUnder = p.toArray();
          if (clearUnder && blockedUnder) break search;
        }
    if (clearUnder) {
      reset();
      w.feet.fromArray(clearUnder);
      const started = f.start();
      row(
        "safe visitor beneath movement remains in place",
        started && !f.blocked && w.feet.toArray().every((v, i) => v === clearUnder[i]),
        clearUnder,
      );
      f.finish();
      row("safe beneath after exchange", !b.world.overlaps(w.feet));
    } else row("safe beneath fixture exists", false);
    if (blockedUnder) {
      reset();
      w.feet.fromArray(blockedUnder);
      const started = f.start();
      row(
        "actual incoming-holder obstruction blocks flip without relocating",
        !started && f.blocked && w.feet.toArray().every((v, i) => v === blockedUnder[i]),
        blockedUnder,
      );
      f.finish();
      row("destination-obstructing visitor finishes clear", !b.world.overlaps(w.feet));
    } else row("destination fixture exists", false);
    // Enter the incoming holder's empty space after activation, before exchange.
    if (blockedUnder) {
      reset();
      w.feet.set(35, 0, -7);
      f.start();
      w.feet.fromArray(blockedUnder);
      f.finish();
      row(
        "late destination obstruction rechecked",
        f.blocked &&
          f.side === "bridge" &&
          !f.active &&
          !b.world.overlaps(w.feet) &&
          w.feet.toArray().every((v, i) => v === blockedUnder[i]),
      );
    }
    reset();
    w.feet.set(0, f.liftHeight, f.forbiddenFeet.max.z + 0.02);
    w.velocity.set(2, 0, -100);
    w.yaw = 0;
    w.keys.add("KeyW");
    f.start();
    w.update(10);
    row(
      "incoming high-speed visitor constrained per substep",
      !f.isUnsafe(w.feet) && !b.world.overlaps(w.feet),
    );
    f.finish();
    reset();
    w.feet.set(35, 0.00001, 28);
    w.grounded = true;
    f.start();
    const matrices = b.station.movement.children.map((m) => m.matrix.toArray());
    const samples = [];
    for (let frame = 0; frame <= 250; frame++) {
      f.update(1 / 60);
      if (frame % 10 !== 0) continue;
      const activeHolder =
        b.station.holders[b.station.holders.bridge.visible ? "bridge" : "dial"].children[0];
      const contacts = [],
        errors = [];
      for (const solid of b.world.solids) {
        if (solid.mesh.userData.stationId !== "movement") continue;
        const identity = solid.inverse.clone().multiply(solid.mesh.matrixWorld);
        if (identity.elements.some((v, i) => Math.abs(v - (i % 5 === 0 ? 1 : 0)) > 1e-10))
          errors.push(solid.mesh.name);
        if (
          f.active &&
          f.elapsed > 0.1 &&
          f.elapsed < 3.9 &&
          solid.bounds.intersectsBox(b.world.solids.find((s) => s.mesh === activeHolder).bounds) &&
          solid.tree.intersectsGeometry(
            activeHolder.geometry,
            solid.inverse.clone().multiply(activeHolder.matrixWorld),
          )
        )
          contacts.push(solid.mesh.userData.partId);
      }
      samples.push({ elapsed: f.elapsed, contacts, errors });
    }
    row(
      "animation collision matrices align",
      samples.every((s) => !s.errors.length),
      samples,
    );
    row(
      "lift turn and lower clear active holder",
      samples.every((s) => !s.contacts.length),
      samples.filter((s) => s.contacts.length),
    );
    row(
      "reviewed local matrices never change",
      b.station.movement.children.every((m, i) =>
        m.matrix.toArray().every((v, j) => v === matrices[i][j]),
      ),
    );
    row(
      "one 219-leaf assembly and one visible holder",
      b.station.movement.children.length === 219 &&
        Object.values(b.station.holders).filter((g) => g.visible).length === 1 &&
        b.world.solids.filter((s) => s.mesh.userData.stationId === "movement").length === 219,
    );
    b.reset();
    b.wake();
    return results;
  });
  for (const r of report.fixtures) check(r.name, r.pass, r.detail);
  // Explicit static inspection fixture: hide menu blur only for seating captures.
  await page.addStyleTag({
    content: ".bench-menu, .bench-menu-backdrop { display: none !important; }",
  });
  for (const side of ["bridge", "dial"]) {
    await page.evaluate((side) => {
      const b = window.bench;
      b.pause();
      b.flip.setRest(side);
      b.walker.feet.set(32, 27, 32);
      b.walker.velocity.set(0, 0, 0);
      b.walker.grounded = true;
      b.walker.yaw = Math.atan2(32, 39);
      b.walker.pitch = -0.3;
      b.wake();
    }, side);
    await page.waitForTimeout(100);
    await page.screenshot({ path: out + "/" + side + "-rest-inspection.png" });
  }
  check("no browser errors", report.errors.length === 0, report.errors);
  console.log(JSON.stringify({ checks: report.checks.length, passed: true }));
} finally {
  await fs.writeFile(out + "/flip-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
