import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const base = process.argv[2] || 'http://127.0.0.1:4176';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const out = path.resolve('artifacts/bench');
await fs.mkdir(out, { recursive: true });
try {
  await page.goto(base + '/bench?inspect=1');
  await page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
  await page
    .getByRole('button', { name: 'Start exploring', exact: true })
    .click();
  await page.waitForFunction(() => window.bench.status.captured);
  // Independent benchmark fixture, not part of the user journey.
  await page.evaluate(() => {
    const b = window.bench;
    const station = b.station.root.position,
      x = station.x - 12,
      z = station.z;
    b.walker.feet.set(x, b.world.floor(x, z) + 0.002, z);
    b.walker.pitch = -0.35;
    b.wake();
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.bench.frameTimes = [];
    window.bench.cpuTimes = [];
  });
  const started = Date.now();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyW');
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyS');
  }
  const report = await page.evaluate(() => {
    const b = window.bench;
    const pct = (a, p) =>
      [...a].sort((a, b) => a - b)[Math.floor((a.length - 1) * p)];
    const gl = b.renderer.getContext(),
      e = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      samples: b.frameTimes.length,
      meanMs: b.frameTimes.reduce((a, v) => a + v, 0) / b.frameTimes.length,
      p50Ms: pct(b.frameTimes, 0.5),
      p95Ms: pct(b.frameTimes, 0.95),
      p99Ms: pct(b.frameTimes, 0.99),
      cpuP95Ms: pct(b.cpuTimes, 0.95),
      quality: b.status.quality,
      pixelRatio: b.renderer.getPixelRatio(),
      drawCalls: b.renderer.info.render.calls,
      triangles: b.renderer.info.render.triangles,
      gpu: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : null,
      position: b.walker.feet.toArray(),
    };
  });
  report.elapsedMs = Date.now() - started;
  report.viewport = { width: 1440, height: 900, deviceScaleFactor: 2 };
  report.mode =
    'Headless Chrome; real keyboard W/S alternation on bridge; benchmark fixture placement';
  await page.screenshot({ path: path.join(out, 'performance-view.png') });
  await fs.writeFile(
    path.join(out, 'performance-report.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  // Review both nominal presentations independently of the walking journey.
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.pointerLockElement);
  await page.waitForTimeout(300);
  for (const side of ['bridge', 'dial']) {
    await page.evaluate((side) => {
      const b = window.bench;
      b.flip?.setRest(side);
      const station = b.station.root.position;
      b.emit();
      b.walker.clear();
      b.walker.grounded = true;
      cancelAnimationFrame(b.frame);
      b.frame = 0;
      b.camera.position.set(station.x - 45, 45, station.z + 45);
      b.camera.lookAt(station.x, 12, station.z);
      b.renderer.render(b.scene, b.camera);
      document.querySelector('.bench-menu').style.display = 'none';
    }, side);
    await page.screenshot({ path: path.join(out, side + '-presentation.png') });
  }
} finally {
  await browser.close();
}
