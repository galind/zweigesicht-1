/** Paired-world journey: real capture/keyboard translation, automated look headings.
 * No position injection until the separately labelled recovery probes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const base = process.argv[2] || 'http://127.0.0.1:4182';
const out = process.env.PLAY_QA_OUTPUT || 'artifacts/paired-atelier';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = { checks: [], journey: [], errors: [], requests: [] };
page.on('pageerror', (e) => report.errors.push(e.message));
page.on('request', (r) => report.requests.push(r.url()));
const check = (name, pass, detail) => {
  report.checks.push({ name, pass, detail });
  assert.ok(pass, name + ': ' + JSON.stringify(detail));
};
const snap = () =>
  page.evaluate(() => {
    const b = window.bench;
    return {
      position: b.walker.feet.toArray(),
      grounded: b.walker.grounded,
      resets: b.walker.resets,
      status: b.status,
      keys: [...b.walker.keys],
      renders: b.renderCount,
      parts: b.stations.map((s) => s.movement.children.length),
    };
  });
const ready = () =>
  page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
const capture = async () => {
  await page
    .getByRole('button', { name: 'Enter the movement', exact: true })
    .click();
  await page.waitForFunction(
    () => !!document.pointerLockElement && window.bench.status.captured,
  );
};
const shot = async (name) => {
  await page.screenshot({ path: out + '/' + name + '.png' });
  report.journey.push({ name, ...(await snap()) });
};
async function walkTo(x, z, name) {
  const before = await snap();
  const distance = Math.hypot(x - before.position[0], z - before.position[2]);
  // Deterministic mouse heading only; actual W events drive every movement step.
  await page.evaluate(
    ({ x, z }) => {
      const b = window.bench;
      b.walker.yaw = Math.atan2(-(x - b.walker.feet.x), -(z - b.walker.feet.z));
      b.walker.pitch = 0;
      b.wake();
    },
    { x, z },
  );
  await page.keyboard.down('KeyW');
  try {
    await page.waitForFunction(
      ({ x, z }) =>
        Math.hypot(
          window.bench.walker.feet.x - x,
          window.bench.walker.feet.z - z,
        ) < 0.15,
      { x, z },
      { timeout: Math.max(5000, (distance / 5.5) * 2000), polling: 16 },
    );
  } catch (error) {
    report.journey.push({ name: 'BLOCKED ' + name, ...(await snap()) });
    throw error;
  } finally {
    await page.keyboard.up('KeyW');
  }
  await page.waitForTimeout(100);
  const s = await snap();
  check(name, s.resets === before.resets && s.grounded, s);
  report.journey.push({ name, ...s });
}
try {
  await page.goto(base + '/?inspect=1', { waitUntil: 'networkidle' });
  check(
    'home does not load local bench assets',
    !report.requests.some((u) => u.includes('/bench-local/')),
  );
  await page
    .getByRole('link', { name: 'Walk inside the movement', exact: true })
    .click();
  await page.goto(base + '/bench?inspect=1');
  await ready();
  check(
    'both complete movements and four crowns present before capture',
    (await snap()).parts.every((n) => n === 227),
  );
  check('explicit capture only', !(await snap()).status.captured);
  check(
    'no obsolete swap control',
    (await page
      .getByRole('button', { name: 'Switch side', exact: true })
      .count()) === 0,
  );
  await shot('journey-arrival');
  await capture();
  const initialResets = (await snap()).resets;
  await walkTo(-75, 40, 'open worktop from arrival');
  await walkTo(-75, 12, 'direct bridge ramp foot');
  await walkTo(-49, 12, 'straight bridge approach');
  await walkTo(-37, 12, 'enter real bridge CAD without jumping');
  await shot('journey-bridge');
  await walkTo(-49, 12, 'return from bridge to external approach');
  await walkTo(-75, 12, 'descend bridge ramp');
  await walkTo(-75, -18, 'open worktop west of bridge');
  await walkTo(-3, -18, 'level worktop between stations');
  await shot('journey-connector');
  await walkTo(-3, -6, 'direct dial ramp foot');
  await walkTo(13, -6, 'straight dial approach');
  await walkTo(23, -6, 'enter real dial CAD without jumping');
  await shot('journey-dial');
  check(
    'nearby status follows dial station',
    (await snap()).status.side === 'dial',
  );
  await walkTo(13, -6, 'return from dial CAD');
  await walkTo(-3, -6, 'descend dial ramp');
  await walkTo(-3, -18, 'dial external return');
  await walkTo(-75, -18, 'reverse level connector');
  await walkTo(-75, 12, 'bridge ramp return');
  await walkTo(-49, 12, 'bridge return');
  check(
    'complete round trip has no automatic resets',
    (await snap()).resets === initialResets,
  );
  await walkTo(-37, 12, 'revisit bridge for optional jump');
  const beforeJump = (await snap()).position[1];
  await page.keyboard.press('Space');
  await page.waitForTimeout(230);
  check(
    'jump remains available on CAD',
    (await snap()).position[1] > beforeJump + 0.3,
  );
  await page.waitForTimeout(900);
  await walkTo(-49, 12, 'return after optional CAD jump');
  const beforeT = await snap();
  await page.keyboard.press('KeyT');
  await page.waitForTimeout(300);
  const afterT = await snap();
  check(
    'T cannot swap or reset',
    afterT.resets === beforeT.resets &&
      JSON.stringify(afterT.position) === JSON.stringify(beforeT.position),
  );
  await page.keyboard.down('KeyW');
  await page.keyboard.press('Escape');
  await page.keyboard.up('KeyW');
  await page.waitForFunction(() => !document.pointerLockElement);
  check(
    'Escape releases capture and keys',
    !(await snap()).status.captured && (await snap()).keys.length === 0,
  );
  await page.waitForTimeout(500);
  const renders = (await snap()).renders;
  await page.waitForTimeout(500);
  check('resting scene sleeps', (await snap()).renders === renders);
  await capture();
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(150);
  check(
    'blur clears capture and keys',
    !(await snap()).status.captured && (await snap()).keys.length === 0,
  );
  await page.waitForTimeout(1200);
  await capture();
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(150);
  check(
    'explicit R returns to shared forecourt',
    Math.abs((await snap()).position[0] + 64) < 0.01 &&
      (await snap()).position[2] === 40,
  );
  // Independent fixtures: force falls near each station, outside normal journey.
  for (const [side, x, z] of [
    ['bridge', -24, 12],
    ['dial', 38, -6],
  ]) {
    await page.evaluate(
      ({ x, z }) => {
        const b = window.bench;
        b.walker.feet.set(x, -9, z);
        b.updateStation();
        b.walker.grounded = false;
        b.wake();
      },
      { x, z },
    );
    await page.waitForTimeout(150);
    const s = await snap();
    check(
      side + ' fall recovers to nearby approach',
      s.status.side === side && s.position[1] > 15,
      s,
    );
  }
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.pointerLockElement);
  await page.evaluate(() => (window.previousBench = window.bench));
  await page
    .getByRole('link', { name: 'Back to the explorer', exact: true })
    .click();
  await page.waitForURL(base + '/');
  check(
    'disposal clears scene collision ownership',
    await page.evaluate(
      () =>
        window.previousBench.dead &&
        window.previousBench.world.solids.length === 0 &&
        window.previousBench.world.trees.size === 0,
    ),
  );
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole('link', { name: 'Walk inside the movement', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Enter the movement', exact: true })
      .waitFor({ timeout: 90000 });
    check(
      'reentry owns exactly one canvas ' + i,
      (await page.locator('.bench-canvas canvas').count()) === 1,
    );
    await page
      .getByRole('link', { name: 'Back to the explorer', exact: true })
      .click();
    await page.waitForURL(base + '/');
  }
  await page.route('**/bench-local/movement.stl', (r) => r.abort());
  await page.goto(base + '/bench?inspect=1');
  await page
    .getByRole('button', { name: 'Retry loading', exact: true })
    .waitFor({ timeout: 90000 });
  check(
    'incomplete asset load blocks capture',
    (await page
      .getByRole('button', { name: 'Enter the movement', exact: true })
      .count()) === 0,
  );
  await page.unroute('**/bench-local/movement.stl');
  await page
    .getByRole('button', { name: 'Retry loading', exact: true })
    .click();
  await ready();
  check(
    'retry restores both complete stations',
    (await snap()).parts.every((n) => n === 227),
  );
  check('no uncaught errors', report.errors.length === 0, report.errors);
  console.log(report.checks.length + ' paired walking checks pass');
} finally {
  await fs.writeFile(
    out + '/browser-report.json',
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
