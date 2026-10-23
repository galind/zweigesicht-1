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
const page = await browser.newPage();
const report = [];
const base = process.argv[2] || 'http://127.0.0.1:4176';
try {
  for (const [width, height, text] of [
    [1440, 900, 100],
    [390, 844, 100],
    [320, 640, 100],
    [1440, 900, 200],
    [390, 844, 200],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base + '/?no3d=1&text=' + text, {
      waitUntil: 'networkidle',
    });
    const entry = page.getByRole('link', {
      name: 'Walk inside the movement',
      exact: true,
    });
    const accessible = await entry.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const hit = document.elementFromPoint(
        r.x + r.width / 2,
        r.y + r.height / 2,
      );
      return {
        hit: e === hit || e.contains(hit),
        within:
          r.x >= 0 &&
          r.right <= innerWidth &&
          r.top >= 0 &&
          r.bottom <= innerHeight,
      };
    });
    assert.ok(
      accessible.hit && accessible.within,
      JSON.stringify({ width, height, text, accessible }),
    );
    await entry.click();
    await page.waitForURL(base + '/bench');
    report.push({ width, height, text, pass: true });
  }
  await fs.writeFile(
    'artifacts/bench/home-entry-report.json',
    JSON.stringify(report, null, 2),
  );
  console.log('Five homepage viewport/text-size entry checks passed.');
} finally {
  await browser.close();
}
