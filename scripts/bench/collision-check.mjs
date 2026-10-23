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
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
try {
  await page.goto(
    (process.argv[2] || 'http://127.0.0.1:4176') + '/bench?inspect=1',
  );
  await page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
  const report = await page.evaluate(async () => {
    const b = window.bench,
      manifest = await (await fetch('/models/assembly-manifest.json')).json();
    const byId = new Map(manifest.instances.map((p) => [p.id, p]));
    const transformErrors = b.movement.children.map((mesh) => {
      const expected = byId.get(mesh.userData.partId).worldTransform;
      return Math.max(
        ...mesh.matrix.elements.map((v, i) =>
          Math.abs(v - expected[i % 4][Math.floor(i / 4)]),
        ),
      );
    });
    const drops = [];
    for (const side of ['bridge', 'dial']) {
      b.present(side);
      for (const [x, z] of [
        [-12, 0],
        [-6, 5],
        [6, 10],
        [-10, -5],
        [3, 8],
        [8, 8],
        [-8, 4],
        [10, -4],
      ]) {
        const floor = b.world.floor(x, z);
        b.walker.clear();
        b.walker.grounded = false;
        b.walker.feet.set(x, floor + 0.5, z);
        for (let i = 0; i < 180; i++) b.walker.update(1 / 180);
        drops.push({
          side,
          x,
          z,
          visibleFloor: floor,
          feet: b.walker.feet.toArray(),
          grounded: b.walker.grounded,
          pass: b.walker.feet.y >= floor - 0.08,
        });
      }
    }
    // These include plate holes and inter-part openings, with lower actual support.
    const heights = [];
    for (let x = -12; x <= 12; x += 1)
      for (let z = -12; z <= 12; z += 1)
        if (x * x + z * z < 180) heights.push(b.world.floor(x, z));
    return {
      sourceMatricesUnchanged: Math.max(...transformErrors) === 0,
      maxMatrixError: Math.max(...transformErrors),
      drops,
      dialHeightRange: [Math.min(...heights), Math.max(...heights)],
      lowerOpenings: heights.filter((y) => y < 15.5).length,
    };
  });
  await fs.writeFile(
    'artifacts/bench/collision-report.json',
    JSON.stringify(report, null, 2),
  );
  assert.ok(report.sourceMatricesUnchanged);
  assert.ok(
    report.drops.every((d) => d.pass),
    JSON.stringify(report.drops.filter((d) => !d.pass)),
  );
  assert.ok(report.lowerOpenings > 0);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
