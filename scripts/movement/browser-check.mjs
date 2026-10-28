/** Focused local runtime audit. Test-only controller access, no production debug hooks. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import hands from "../../assets/authored/hand-display-poses.json" with { type: "json" };
import settings from "../../assets/authored/running-movement.json" with { type: "json" };
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const root = process.env.MOVEMENT_EVIDENCE_ROOT ?? "artifacts/running-movement",
  report = { checks: [], errors: [], httpFailures: [] };
await fs.mkdir(root, { recursive: true });
const secondsPerCycle = 1 / settings.frequencyHz;
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
// Inspect the actual route controller, not a hypothetical seven-packet fixture.
async function displayScope(page, label) {
  const result = await page.evaluate((packets) => {
    const r = window.movementAudit.runningMovement;
    const installed = r.entries.filter(e => packets.some(p => p.members.includes(e.mesh.name)));
    // Mesh names can differ between owners; entry packet identity is authoritative.
    const entries = r.entries.filter(e => packets.some(p => p.name === e.packet.name));
    let maxError = 0;
    for (const e of entries) {
      const p = packets.find(p => p.name === e.packet.name);
      const angle = (r.pose.escape * p.ratio[0] / p.ratio[1] % 360) * Math.PI / 180;
      const c = Math.cos(angle), s = Math.sin(angle), [x,y] = p.pivot;
      const b = e.base.elements, actual = e.mesh.matrix.elements;
      for (let col = 0; col < 4; col++) {
        const k = col * 4, w = b[k+3];
        const want = [c*b[k]-s*b[k+1]+(x-c*x+s*y)*w,
          s*b[k]+c*b[k+1]+(y-s*x-c*y)*w,b[k+2],w];
        want.forEach((v,i) => maxError = Math.max(maxError,Math.abs(v-actual[k+i])));
      }
    }
    return {active:r.active, entries:entries.length, names:[...new Set(entries.map(e=>e.packet.name))],
      totalEntries:r.entries.length, rear:r.entries.filter(e=>['motion3','cannon2','hour2'].includes(e.packet.name)).length,
      maxError, namedMembers:installed.length};
  }, settings.displayPackets);
  check(label + " uses the exact seven display packets and shared escape phase",
    result.active && result.entries === 13 && result.totalEntries === 41 && result.rear === 6 &&
    result.names.length === 7 && result.maxError < 1e-9, result);
}
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
  await displayScope(page, "Explorer");
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
    const updateMs = [];
    const update = r.update;
    r.update = function (...args) {
      const start = performance.now();
      const result = update.apply(this, args);
      updateMs.push(performance.now() - start);
      return result;
    };
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
    r.update = update;
    deltas.sort((a, b) => a - b);
    updateMs.sort((a, b) => a - b);
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
      updateP50Ms: updateMs[Math.floor(updateMs.length * 0.5)],
      updateP95Ms: updateMs[Math.floor(updateMs.length * 0.95)],
    };
  });
  check(
    "Sustained rendering spans multiple cycles without resource growth",
    sample.end.seconds - sample.start.seconds > 24 &&
      sample.end.render - sample.start.render > 100 &&
      sample.end.memory.geometries === sample.start.memory.geometries &&
      sample.end.memory.textures === sample.start.memory.textures,
    sample,
  );
  const elapsed = sample.end.seconds - sample.start.seconds;
  check(
    "Nominal escape rate agrees with elapsed active time",
    Math.abs(sample.end.escape - sample.start.escape - (elapsed * 18) / secondsPerCycle) < 18,
    { elapsed, escapeAdvance: sample.end.escape - sample.start.escape },
  );
  const delayed = await page.evaluate(async () => {
    const r = window.movementAudit.runningMovement;
    await new Promise(requestAnimationFrame);
    const before = r.clock.seconds,
      start = performance.now();
    // One deliberate visible main-thread stall: verify there is no dt clamp.
    while (performance.now() - start < 250) {
      /* test-only delayed frame */
    }
    await new Promise(requestAnimationFrame);
    return { activeDelta: r.clock.seconds - before, wallDelta: (performance.now() - start) / 1000 };
  });
  check(
    "Visible delayed frame advances elapsed time without a clamp",
    delayed.activeDelta >= 0.24 && Math.abs(delayed.activeDelta - delayed.wallDelta) < 0.05,
    delayed,
  );
  // Sample every rendered Explorer frame against independent point transforms.
  // Presentation offsets/tilts are applied AFTER source-shaft rotation.
  await page.evaluate((handIds) => {
    const v = window.movementAudit;
    window.inspectionSamples = {frames: 0, policyErrors: 0, pausedFrames: 0, maxError: 0, handError: 0, handSamples: 0, selectionFrames: 0, selectionError: 0};
    v.inspectionFrame = () => {
      if (v.state.layout !== 'assembly') return;
      const r = v.runningMovement, result = window.inspectionSamples;
      result.frames++;
      const separated = v.state.separation || v.state.partSpread ||
        v.displayedExplosionState?.separation || v.displayedExplosionState?.partSpread;
      if (r.active === !!separated) result.policyErrors++;
      if (!r.active) result.pausedFrames++;
      for (const entry of r.entries) {
        const part = v.renderParts.get(entry.id), packet = entry.packet;
        const degrees = packet.name === 'balance' ? r.pose.balance : packet.name === 'pallet' ? r.pose.pallet : r.pose.escape * packet.ratio[0] / packet.ratio[1];
        const a = r.active ? (degrees % 360) * Math.PI / 180 : 0, c = Math.cos(a), s = Math.sin(a);
        for (const point of [[0,0,0],[.31,-.27,.19]]) {
          const local = part.center.clone().fromArray(point);
          const expected = local.clone().applyMatrix4(part.displayMatrix ?? part.assembled);
          const x = expected.x - packet.pivot[0], y = expected.y - packet.pivot[1];
          expected.set(packet.pivot[0] + c*x - s*y, packet.pivot[1] + s*x + c*y, expected.z);
          expected.sub(part.center).applyQuaternion(part.rotation).add(part.center).add(part.offset);
          result.maxError = Math.max(result.maxError, expected.distanceTo(local.applyMatrix4(part.mesh.matrix)));
        }
      }
      for (const id of handIds) {
        const part = v.renderParts.get(id);
        if (!part) continue;
        result.handSamples++;
        const local = part.center.clone().set(.31,-.27,.19);
        const expected = local.clone().applyMatrix4(part.displayMatrix ?? part.assembled)
          .sub(part.center).applyQuaternion(part.rotation).add(part.center).add(part.offset);
        result.handError = Math.max(result.handError, expected.distanceTo(local.applyMatrix4(part.mesh.matrix)));
      }
      if (v.state.part && v.selectionBox.visible) {
        result.selectionFrames++;
        const bounds = v.selectionBox.box.clone().makeEmpty();
        for (const [id, part] of v.renderParts)
          if (part.mesh.visible && (id === v.state.part || id.startsWith(v.state.part + '__')))
            bounds.expandByObject(part.mesh);
        if (!bounds.isEmpty()) result.selectionError = Math.max(result.selectionError,
          bounds.min.distanceTo(v.selectionBox.box.min), bounds.max.distanceTo(v.selectionBox.box.max));
      }
    };
  }, hands.hands.map(h => h.leafId));
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
    "Disassembly and inventory pause; assembly resumes",
    !product[0].active && product[1].active && !product[2].active && product[3].active,
    product,
  );
  await displayScope(page, "Reassembled Explorer");
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
    "Fitted case flip keeps motion",
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
  // Full-cycle consecutive frame samples for inspection of temporal aliasing.
  // Freeze only this audit's shared clock; no production playback controls.
  for (const seconds of Array.from({ length: 20 }, (_, i) => (i * secondsPerCycle) / 20)) {
    await page.evaluate((seconds) => {
      const v = window.movementAudit;
      v.runningMovement.clock.advance = () => seconds;
      v.requestRender();
    }, seconds);
    await page.waitForTimeout(200);
    await page.screenshot({
      path: root + `/escapement-frame-${Math.round((seconds / secondsPerCycle) * 20)}.png`,
    });
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
  // Focus runs; both disassembly modes pause the clock until reassembled.
  const inspection = await page.evaluate(async () => {
    const v = window.movementAudit, rows = [];
    for (const action of [() => v.group('regulation'), () => v.patch({partSpread: 1}),
      () => v.group(null), () => v.patch({separation: 1}), () => v.patch({separation: 0})]) {
      const before = v.runningMovement.clock.seconds;
      action();
      await new Promise(r => setTimeout(r, 1600));
      rows.push({active: v.runningMovement.active, delta: v.runningMovement.clock.seconds - before,
        group: v.state.group, separation: v.state.separation, partSpread: v.state.partSpread});
    }
    return rows;
  });
  check("Focus runs; disassembly freezes time and reassembly resumes",
    inspection[0].active && inspection[0].delta > 1.4 &&
    [inspection[1], inspection[3]].every(r => !r.active && r.delta === 0) &&
    [inspection[2], inspection[4]].every(r => r.active && r.delta > 0 && r.delta < 1.5), inspection);
  await page.evaluate(async () => {
    const v = window.movementAudit;
    await v.select(v.parts.find((p) => p.definitionId === "d_0_1_1_110").id);
    v.patch({ isolated: true });
  });
  await page.waitForTimeout(1200);
  check(
    "Isolated inspection keeps running",
    await page.evaluate(() => window.movementAudit.runningMovement.active),
  );
  await page.screenshot({ path: root + "/isolated.png" });
  const inspectionResult = await page.evaluate(() => {
    const v = window.movementAudit;
    v.inspectionFrame = undefined;
    return window.inspectionSamples;
  });
  check("Every sampled frame obeys inspection/disassembly policy and displayed shaft transforms",
    inspectionResult.frames > 100 && inspectionResult.policyErrors === 0 && inspectionResult.pausedFrames > 10 && inspectionResult.maxError < 1e-8, inspectionResult);
  check("Hands retain presentation poses and selection bounds follow animated parts",
    inspectionResult.handSamples > 100 && inspectionResult.selectionFrames > 10 && inspectionResult.handError < 1e-8 && inspectionResult.selectionError < 1e-8, inspectionResult);
  const explorerCleanup = await page.evaluate(async () => {
    const v = window.movementAudit;
    v.dispose();
    const count = v.renderCount;
    await new Promise(r => setTimeout(r, 100));
    v.dispose();
    return { dead: v.dead, frame: v.frame, active: v.runningMovement.active, stopped: v.renderCount === count };
  });
  check(
    "Explorer cleanup stops RAF and restores geometry",
    explorerCleanup.dead && !explorerCleanup.frame && !explorerCleanup.active && explorerCleanup.stopped,
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
    return { complete };
  });
  await displayScope(page, "Completed Workshop");
  const undone = await page.evaluate(async () => {
    const v = window.movementAudit;
    v.update(new Set(v.manifest.initialLeafIds), null, true);
    await new Promise((r) => setTimeout(r, 100));
    return v.runningMovement.active;
  });
  check("Workshop completion runs and Undo stops", workshop.complete && !undone, { ...workshop, undone });
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
  await displayScope(page, "Bench");
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
  check(
    "All application assets load",
    report.httpFailures.every((r) => new URL(r.url).pathname === "/_vercel/insights/script.js"),
    report.httpFailures,
  );
} finally {
  await fs.writeFile(root + "/browser-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
