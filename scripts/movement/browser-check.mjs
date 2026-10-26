/** Focused local runtime audit. Test-only controller access, no production debug hooks. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const root = "artifacts/running-movement",
  report = { checks: [], errors: [], httpFailures: [] };
const base = process.argv[2] ?? "http://127.0.0.1:4173";
async function viewer(page) {
  await page.waitForFunction(
    () => {
      for (const el of document.querySelectorAll("*")) {
        const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
        for (let f = key && el[key]; f; f = f.return)
          for (let h = f.memoizedState; h; h = h.next) {
            const v = h.memoizedState?.current;
            if (v?.runningMovement && (v.ready || v.status?.ready)) {
              window.movementAudit = v;
              return true;
            }
          }
      }
      return false;
    },
    null,
    { timeout: 90000 },
  );
}
const check = (name, condition, details) => {
  report.checks.push({ name, pass: !!condition, details });
  assert.ok(condition, name);
};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (e) => report.errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource:"))
      report.errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) report.httpFailures.push({ url: r.url(), status: r.status() });
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await viewer(page);
  await page.waitForTimeout(1500);
  let state = await page.evaluate(() => ({
    active: window.movementAudit.runningMovement.active,
    pose: window.movementAudit.runningMovement.pose,
    render: window.movementAudit.renderCount,
  }));
  check("Explorer runs automatically", state.active, state);
  await page.screenshot({ path: root + "/assembled.png" });
  const sample = await page.evaluate(async () => {
    const v = window.movementAudit,
      r = v.runningMovement;
    const start = {
      seconds: r.clock.seconds,
      escape: r.pose.escape,
      render: v.renderCount,
      memory: { ...v.renderer.info.memory },
    };
    const deltas = [];
    let last = performance.now();
    await new Promise((resolve) => {
      const until = last + 25000;
      function tick(now) {
        deltas.push(now - last);
        last = now;
        if (now >= until) resolve();
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    deltas.sort((a, b) => a - b);
    return {
      start,
      end: {
        seconds: r.clock.seconds,
        escape: r.pose.escape,
        render: v.renderCount,
        memory: { ...v.renderer.info.memory },
      },
      p50: deltas[Math.floor(deltas.length * 0.5)],
      p95: deltas[Math.floor(deltas.length * 0.95)],
      frames: deltas.length,
    };
  });
  check(
    "Sustained rendering spans multiple cycles without resource growth",
    sample.end.seconds - sample.start.seconds > 24 &&
      sample.end.render - sample.start.render > 100 &&
      sample.end.memory.geometries === sample.start.memory.geometries,
    sample,
  );
  // Snapshot then deterministic verification through the production controller.
  const product = await page.evaluate(async () => {
    const v = window.movementAudit;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const rows = [];
    for (const patch of [
      { separation: 1 },
      { separation: 0 },
      { layout: "spread" },
      { layout: "assembly" },
      { dialsVisible: true, caseVisible: true },
      { dialsVisible: false, caseVisible: false },
    ]) {
      v.patch(patch);
      await sleep(1800);
      rows.push({
        patch,
        active: v.runningMovement.active,
        state: v.state.layout,
        separation: v.state.separation,
        error: v.error,
      });
    }
    return rows;
  });
  check(
    "Separated and inventory views stay static; assembled views resume",
    !product[0].active && product[1].active && !product[2].active && product[3].active,
    product,
  );
  await page.screenshot({ path: root + "/returned-assembly.png" });
  await page.evaluate(async () => {
    const v = window.movementAudit;
    await v.configureWatch({ caseVisible: true, dialsVisible: true });
    v.setSide("front");
  });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: root + "/fitted-front.png" });
  check(
    "Fitted front remains running",
    await page.evaluate(() => window.movementAudit.runningMovement.active),
  );
  await page.evaluate(() => window.movementAudit.setSide("back"));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: root + "/fitted-back.png" });
  check(
    "Fitted case flip resumes motion",
    await page.evaluate(() => window.movementAudit.runningMovement.active),
  );
  await page.evaluate(async () => {
    const v = window.movementAudit;
    await v.configureWatch({ caseVisible: false, dialsVisible: false });
    v.camera.position.set(0, -9, -16);
    v.controls.target.set(0, -9, -2.5);
    v.travel = null;
    v.controls.update();
    v.requestRender();
    window.savedAdvance = v.runningMovement.clock.advance;
  });
  for (const seconds of [0, 4]) {
    await page.evaluate((seconds) => {
      const v = window.movementAudit;
      v.runningMovement.clock.advance = () => seconds;
      v.requestRender();
    }, seconds);
    await page.waitForTimeout(200);
    await page.screenshot({ path: root + `/escapement-${seconds}.png` });
  }
  await page.evaluate(() => {
    window.movementAudit.runningMovement.clock.advance = window.savedAdvance;
    window.movementAudit.runningMovement.clock.suspend();
  });
  const suspension = await page.evaluate(async () => {
    const v = window.movementAudit,
      r = v.runningMovement;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    v.onVisibility();
    const a = r.clock.seconds;
    await new Promise((r) => setTimeout(r, 500));
    const b = r.clock.seconds;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    v.onVisibility();
    await new Promise((r) => requestAnimationFrame(r));
    const c = r.clock.seconds;
    return { a, b, c, active: r.active };
  });
  check(
    "Visibility lifecycle stops time and resumes without catch-up",
    suspension.a === suspension.b && Math.abs(suspension.c - suspension.b) < 0.1,
    suspension,
  );
  // Isolated selected components stay at static poses.
  await page.evaluate(async () => {
    const v = window.movementAudit;
    await v.select(v.parts.find((p) => p.definitionId === "d_0_1_1_110").id);
    v.patch({ isolated: true });
  });
  await page.waitForTimeout(1200);
  check(
    "Isolated inspection stays static",
    !(await page.evaluate(() => window.movementAudit.runningMovement.active)),
  );
  await page.screenshot({ path: root + "/isolated.png" });
  const explorerCleanup = await page.evaluate(() => {
    const v = window.movementAudit;
    v.dispose();
    return { dead: v.dead, frame: v.frame, active: v.runningMovement.active };
  });
  check(
    "Explorer cleanup stops RAF and restores geometry",
    explorerCleanup.dead && !explorerCleanup.frame && !explorerCleanup.active,
    explorerCleanup,
  );
  // Route exit disposes the old animation resources and RAF owner.
  await page.evaluate(() => {
    window.oldMovement = window.movementAudit;
  });
  await page.goto(base + "/workshop?mode=easy", { waitUntil: "networkidle" });
  await viewer(page);
  state = await page.evaluate(() => ({
    active: window.movementAudit.runningMovement.active,
    pieces: window.movementAudit.pieces.size,
  }));
  check("Incomplete Workshop is static", !state.active, state);
  await page.screenshot({ path: root + "/workshop-partial.png" });
  // Fixture the final inventory through the existing controller update entrypoint.
  const workshop = await page.evaluate(async () => {
    const v = window.movementAudit;
    v.update(new Set(v.manifest.finalLeafIds), null, true);
    await new Promise((r) => setTimeout(r, 300));
    const complete = v.runningMovement.active;
    v.update(new Set(v.manifest.initialLeafIds), null, true);
    await new Promise((r) => setTimeout(r, 100));
    return { complete, undone: v.runningMovement.active };
  });
  check("Workshop completion runs and Undo stops", workshop.complete && !workshop.undone, workshop);
  const playCleanup = await page.evaluate(() => {
    const v = window.movementAudit;
    v.dispose();
    return { dead: v.dead, frame: v.frame };
  });
  check("Workshop cleanup stops RAF", playCleanup.dead && !playCleanup.frame, playCleanup);
  await page.goto(base + "/bench?inspect=1", { waitUntil: "networkidle" });
  await viewer(page);
  await page.waitForTimeout(1000);
  state = await page.evaluate(() => ({
    active: window.movementAudit.runningMovement.active,
    ready: window.movementAudit.status.ready,
  }));
  check("Bench assembled movement runs", state.active, state);
  await page.getByRole("button", { name: "Start exploring", exact: true }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press("f");
  await page.waitForTimeout(1300);
  check(
    "Bench flip preserves running child motion",
    await page.evaluate(() => window.movementAudit.runningMovement.active),
  );
  await page.screenshot({ path: root + "/bench.png" });
  const cleanup = await page.evaluate(() => {
    const v = window.movementAudit,
      r = v.runningMovement;
    v.dispose();
    const result = { frame: v.frame, active: r.active, dead: v.dead };
    v.dispose();
    return result;
  });
  check(
    "Disposal stops animation and restores geometry",
    !cleanup.frame && !cleanup.active && cleanup.dead,
    cleanup,
  );
  check("No browser runtime or shader errors", report.errors.length === 0, report.errors);
  check('All application assets load', report.httpFailures.every(r => new URL(r.url).pathname === '/_vercel/insights/script.js'), report.httpFailures);
} finally {
  await fs.writeFile(root + "/browser-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
