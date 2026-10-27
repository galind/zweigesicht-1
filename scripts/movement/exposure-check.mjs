/** Local production A/B audit; test-only clock and exposure overrides. */
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const root = "artifacts/balance-exposure";
await fs.mkdir(root, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const report = { errors: [], profiles: [], comparisons: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (e) => report.errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource:"))
      report.errors.push(m.text());
  });
  await page.goto(process.argv[2] ?? "http://127.0.0.1:4179", { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => {
      for (const el of document.querySelectorAll("*")) {
        const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
        for (let f = key && el[key]; f; f = f.return)
          for (let h = f.memoizedState; h; h = h.next) {
            const v = h.memoizedState?.current;
            if (v?.runningMovement && v.ready) {
              window.exposureAudit = v;
              return true;
            }
          }
      }
      return false;
    },
    null,
    { timeout: 90000 },
  );
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const v = window.exposureAudit;
    window.savedShow = v.runningMovement.exposure.show;
    window.savedAdvance = v.runningMovement.clock.advance;
  });
  for (const enabled of process.env.EXPOSURE_SKIP_PROFILE ? [] : [false, true]) {
    await page.evaluate((enabled) => {
      const v = window.exposureAudit;
      v.runningMovement.exposure.show = enabled ? window.savedShow : () => {};
    }, enabled);
    const profile = await page.evaluate(async () => {
      const v = window.exposureAudit,
        deltas = [];
      const memoryStart = { ...v.renderer.info.memory };
      let last;
      await new Promise((resolve) => {
        const end = performance.now() + 12000;
        function tick(now) {
          if (last !== undefined) deltas.push(now - last);
          last = now;
          if (now >= end) resolve();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      deltas.sort((a, b) => a - b);
      return {
        frames: deltas.length,
        p50: deltas[Math.floor(deltas.length * 0.5)],
        p95: deltas[Math.floor(deltas.length * 0.95)],
        memoryStart,
        memoryEnd: { ...v.renderer.info.memory },
        active: v.runningMovement.active,
      };
    });
    report.profiles.push({ enabled, ...profile });
    assert.ok(profile.active);
    assert.deepEqual(profile.memoryStart, profile.memoryEnd);
  }
  await page.evaluate(() => {
    const v = window.exposureAudit;
    cancelAnimationFrame(v.frame);
    v.frame = 0;
    v.camera.position.set(0, -10, -25);
    v.controls.target.set(0, -10, -2.5);
    v.travel = null;
    v.controls.update();
  });
  for (const index of [0, 4, 5, 6, 10, 15]) {
    for (const enabled of [false, true]) {
      const state = await page.evaluate(
        ({ index, enabled }) => {
          const v = window.exposureAudit,
            r = v.runningMovement,
            seconds = index / 60;
          r.exposure.show = enabled
            ? function (seconds, _duration, angle, transform) {
                return window.savedShow.call(this, seconds, 1 / 120, angle, transform);
              }
            : () => {};
          r.clock.seconds = seconds - 1 / 60;
          r.clock.advance = function () {
            this.seconds = seconds;
            return seconds;
          };
          v.tick(performance.now());
          cancelAnimationFrame(v.frame);
          v.frame = 0;
          const proxies = [];
          v.scene.traverse((o) => {
            if (o.userData.balanceExposure)
              proxies.push({
                visible: o.visible,
                samples: o.count,
                sourceVisible: o.userData.balanceExposureSource.visible,
              });
          });
          return {
            seconds: r.clock.seconds,
            pose: { ...r.pose },
            proxies,
            render: v.renderCount,
            error: v.error,
            quality: v.state.quality,
          };
        },
        { index, enabled },
      );
      report.comparisons.push({ index, enabled, ...state });
      await page.screenshot({ path: `${root}/${enabled ? "exposed" : "sharp"}-${index}.png` });
    }
    const [sharp, exposed] = report.comparisons.slice(-2);
    assert.deepEqual(sharp.pose, exposed.pose);
    assert.equal(sharp.seconds, exposed.seconds);
    assert.ok(exposed.proxies.every((p) => p.visible && !p.sourceVisible && p.samples === 9));
    assert.ok(sharp.proxies.every((p) => !p.visible && p.sourceVisible));
  }
  report.shaderAudit = await page.evaluate(() => {
    const v = window.exposureAudit,
      gl = v.renderer.getContext();
    return v.renderer.info.programs
      .filter((p) => gl.getShaderSource(p.vertexShader).includes("vExposureSample"))
      .map((p) => ({
        instancing: gl
          .getShaderSource(p.vertexShader)
          .includes("vExposureSample = float(gl_InstanceID)"),
        mask: gl.getShaderSource(p.fragmentShader).includes("exposureNoise * 9.0"),
      }));
  });
  assert.equal(report.errors.length, 0);
} finally {
  await fs.writeFile(`${root}/exposure-report.json`, JSON.stringify(report, null, 2) + "\n");
  await browser.close();
}
