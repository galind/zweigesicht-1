import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
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
try {
  await page.goto(
    (process.argv[2] || 'http://127.0.0.1:4176') + '/bench?inspect=1',
  );
  await page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
  const report = [];
  for (const side of ['bridge', 'dial']) {
    await page.evaluate((side) => {
      const b = window.bench;
      b.present(side);
      b.emit();
      b.walker.clear();
      b.walker.grounded = true;
      cancelAnimationFrame(b.frame);
      b.frame = 0;
    }, side);
    await page.waitForTimeout(100);
    const dimensions = await page.evaluate((side) => {
      const b = window.bench;
      const mesh = side === 'bridge' ? b.bridgeHolder : b.dialHolder;
      const solid = b.world.solids.find((s) => s.mesh === mesh);
      b.camera.position.set(-40, 40, 40);
      b.camera.lookAt(0, 12, 0);
      b.renderer.render(b.scene, b.camera);
      document.querySelector('.bench-menu').style.display = 'none';
      return {
        side,
        holderMin: solid.bounds.min.toArray(),
        holderMax: solid.bounds.max.toArray(),
        movementMatrix: b.movement.matrix.elements,
        visibleRamps: b.ramps.filter((r) => r.visible).map((r) => r.name),
      };
    }, side);
    assert.ok(
      Math.abs(dimensions.holderMin[1]) < 1e-5 &&
        Math.abs(dimensions.holderMax[1] - 15) < 1e-5,
    );
    assert.equal(dimensions.visibleRamps.length, 2);
    report.push(dimensions);
    await page.screenshot({
      path: 'artifacts/bench/' + side + '-presentation.png',
    });
  }
  await fs.writeFile(
    'artifacts/bench/presentation-report.json',
    JSON.stringify(report, null, 2),
  );
  console.log(
    'Both holder presentations retain source height and their matching access fixture.',
  );
} finally {
  await browser.close();
}
