/** Matched overview, movement and visitor-scale camera fixtures. Run before and after with the same browser/settings. */
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out = process.env.PLAY_QA_OUTPUT || "artifacts/workshop-parts-layout";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const label = process.argv[3] || "after";
try {
  await page.goto((process.argv[2] || "http://127.0.0.1:4198") + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
  await page.addStyleTag({
    content: ".bench-menu,.bench-start,.bench-menu-backdrop,.bench-legend{display:none!important}",
  });
  const results = [];
  for (const [name, side, position, target, fov = 45] of [
    ["overview", "bridge", [0, 420, 420], [0, 0, -30]],
    ["bridge-close", "bridge", [0, 42, 35], [0, 10, -7]],
    ["dial-close", "dial", [0, 42, 35], [0, 10, -7]],
    ["visitor-wood", "bridge", [-20, 0.482, 67], [5, -0.6, 59], 68],
    ["visitor-stand", "bridge", [91, 3.482, 16], [82, 2, -7], 68],
  ]) {
    const result = await page.evaluate(
      async ({ side, position, target, fov }) => {
        const b = window.bench;
        cancelAnimationFrame(b.frame);
        b.frame = 0;
        b.flip.setRest(side);
        b.renderer.setPixelRatio(1);
        b.camera.fov = fov;
        b.camera.far = 3000;
        b.camera.position.fromArray(position);
        b.camera.lookAt(...target);
        b.camera.updateProjectionMatrix();
        b.renderer.info.autoReset = false;
        let last = 0;
        const intervals = [],
          cpu = [],
          calls = [],
          triangles = [];
        for (let i = 0; i < 180; i++) {
          const now = await new Promise(requestAnimationFrame);
          b.renderer.info.reset();
          const start = performance.now();
          b.renderer.render(b.scene, b.camera);
          if (i >= 30) {
            intervals.push(now - last);
            cpu.push(performance.now() - start);
            calls.push(b.renderer.info.render.calls);
            triangles.push(b.renderer.info.render.triangles);
          }
          last = now;
        }
        b.renderer.info.autoReset = true;
        const pct = (v, p) => v.sort((a, b) => a - b)[Math.floor((v.length - 1) * p)];
        const gl = b.renderer.getContext(),
          e = gl.getExtension("WEBGL_debug_renderer_info");
        return {
          frames: intervals.length,
          p50: pct(intervals, 0.5),
          p95: pct(intervals, 0.95),
          p99: pct(intervals, 0.99),
          cpuP95: pct(cpu, 0.95),
          draws: pct(calls, 0.5),
          triangles: pct(triangles, 0.5),
          renderer: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : null,
          pixelRatio: b.renderer.getPixelRatio(),
          transmissionScale: b.renderer.transmissionResolutionScale,
        };
      },
      { side, position, target, fov },
    );
    results.push({ name, position, target, fov, ...result });
    await page.screenshot({ path: `${out}/${label}-${name}.png` });
  }
  await fs.writeFile(
    `${out}/${label}-profile.json`,
    JSON.stringify(
      {
        viewport: [1440, 900],
        mode: "fixed ratio 1; headless overview, movement and visitor-scale fixtures; 30 warmup + 150 frames",
        results,
      },
      null,
      2,
    ),
  );
  console.log(results);
} finally {
  await browser.close();
}
