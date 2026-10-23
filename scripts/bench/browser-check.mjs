/** Browser journey uses real mouse capture and keyboard input. Geometry probes are explicitly separate. */
import { launchForeground } from './foreground-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const base = process.argv[2] || 'http://127.0.0.1:4173';
const out = path.resolve('artifacts/bench');
await fs.mkdir(out, { recursive: true });
const foreground = process.env.HEADED
  ? await launchForeground(chromium, { dpr: 1 })
  : null;
const browser =
  foreground?.browser ??
  (await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  }));
const page =
  foreground?.page ??
  (await browser.newPage({ viewport: { width: 1440, height: 900 } }));
const report = {
  base,
  started: new Date().toISOString(),
  checks: [],
  journey: [],
  errors: [],
  requests: [],
};
page.on('pageerror', (e) => report.errors.push(e.message));
page.on('request', (r) => report.requests.push(r.url()));
const check = (name, pass, details) => {
  report.checks.push({ name, pass, details });
  assert.ok(pass, name + ': ' + JSON.stringify(details));
};
const snapshot = () =>
  page.evaluate(() => {
    const b = window.bench;
    return {
      status: b.status,
      position: b.walker.feet.toArray(),
      grounded: b.walker.grounded,
      keys: [...b.walker.keys],
      resets: b.walker.resets,
      renderCount: b.renderCount,
      parts: b.movement.children.length,
    };
  });
const shot = async (name) => {
  await page.screenshot({ path: path.join(out, name + '.png') });
  report.journey.push({ name, ...(await snapshot()) });
};
const hold = async (key, ms) => {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
};
const ready = async () => {
  await page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
};
const capture = async () => {
  await page
    .getByRole('button', { name: 'Enter the movement', exact: true })
    .click();
  await page.waitForFunction(
    () => !!document.pointerLockElement && window.bench.status.captured,
  );
};
try {
  await page.goto(base + '/?inspect=1', { waitUntil: 'networkidle' });
  check(
    'homepage does not load bench assets',
    !report.requests.some(
      (u) => u.includes('/bench-local/') || u.includes('BenchViewer'),
    ),
  );
  await page
    .getByRole('link', { name: 'Walk inside the movement', exact: true })
    .click();
  // Enable the read-only QA observation handle with a direct route reload.
  await page.goto(base + '/bench?inspect=1');
  await page.bringToFront();
  await ready();
  check(
    'direct route complete and no automatic capture',
    !(await snapshot()).status.captured,
  );
  check(
    'all 223 movement leaves loaded without catalog',
    (await snapshot()).parts === 223 &&
      !report.requests.some((u) => u.includes('/models/catalog-')),
  );
  await shot('01-entry');
  await capture();
  await page.mouse.move(720, 450);
  await page.keyboard.press('KeyR');
  await page.mouse.move(720, 520);
  await page.waitForFunction(() => window.bench.walker.pitch < 0);
  check(
    'mouse look keeps level horizon',
    await page.evaluate(
      () =>
        window.bench.walker.pitch < 0 && window.bench.camera.rotation.z === 0,
    ),
  );
  await page.waitForTimeout(400);
  await hold('KeyW', 500);
  check('walk on mat', (await snapshot()).position[0] > -58);
  await shot('02-mat');
  await hold('KeyW', 5500);
  let s = await snapshot();
  check('climb actual fixture', s.position[1] > 10 && s.position[0] < -25, s);
  await shot('03-ramp');
  await hold('KeyW', 4300);
  await page.waitForTimeout(500);
  s = await snapshot();
  check('reach actual bridge', s.position[0] > -14 && s.position[1] > 16, s);
  await shot('04-bridge-entry');
  // Cross a screw and bridge onto the adjacent moving-train surfaces.
  const before = (await snapshot()).position;
  await page.keyboard.down('KeyW');
  await page.keyboard.press('Space');
  await page.waitForTimeout(220);
  s = await snapshot();
  check('jump rises above surface', s.position[1] > before[1] + 0.35, {
    before,
    after: s.position,
  });
  await page.waitForTimeout(900);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(600);
  s = await snapshot();
  check('cross several movement parts', s.position[0] > -9, s);
  await shot('05-across-bridges');
  await hold('KeyD', 700);
  await page.keyboard.press('Space');
  await hold('KeyW', 650);
  await page.waitForTimeout(600);
  await shot('06-train-detail');
  // Escape and focus loss must clear keys and release capture.
  await page.keyboard.down('KeyW');
  await page.keyboard.press('Escape');
  await page.keyboard.up('KeyW');
  await page.waitForFunction(() => !document.pointerLockElement);
  s = await snapshot();
  check(
    'Escape releases and clears held keys',
    !s.status.captured && s.keys.length === 0,
  );
  await page.waitForTimeout(700);
  const idleA = (await snapshot()).renderCount;
  await page.waitForTimeout(700);
  check(
    'stationary menu stops rendering',
    (await snapshot()).renderCount === idleA,
  );
  await page.waitForTimeout(1200);
  await capture();
  await page.keyboard.down('KeyW');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(200);
  s = await snapshot();
  check(
    'focus loss releases and clears keys',
    !s.status.captured && s.keys.length === 0,
  );
  await page.waitForTimeout(1200);
  await capture();
  await page.keyboard.press('KeyT');
  await page.keyboard.press('KeyT');
  await page.keyboard.press('KeyT');
  await page.waitForTimeout(700);
  s = await snapshot();
  check(
    'repeated T changes once and returns safely',
    s.status.side === 'dial' && s.position[0] === -59 && !s.status.busy,
    s,
  );
  await hold('KeyW', 10000);
  await page.waitForTimeout(400);
  s = await snapshot();
  check(
    'dial presentation accessible from mat',
    s.position[0] > -14 && Math.abs(s.position[1] - 15.7) < 0.05,
    s,
  );
  await shot('07-dial-plate');
  await hold('KeyD', 700);
  const dialBefore = (await snapshot()).position;
  await page.keyboard.down('KeyW');
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  s = await snapshot();
  check('jump on opposite face', s.position[1] > dialBefore[1] + 0.3, {
    before: dialBefore,
    after: s.position,
  });
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(500);
  await shot('08-dial-exploration');
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(100);
  s = await snapshot();
  check('R resets to safe mat', s.position[0] === -59 && s.keys.length === 0);
  await shot('09-reset');
  // Independent test fixture: drop beyond the playable bounds, never part of journey.
  await page.evaluate(() => {
    window.bench.walker.feet.set(0, -9, 0);
    window.bench.walker.grounded = false;
    window.bench.wake();
  });
  await page.waitForTimeout(100);
  s = await snapshot();
  check(
    'automatic fall recovery',
    s.position[0] === -59 && s.position[1] > -0.01,
    s,
  );
  // Sample collision floors against the source geometry, including genuine holes.
  const samples = await page.evaluate(() => {
    const b = window.bench;
    return {
      plate: b.world.floor(-10, 4),
      opening: b.world.floor(0, 0),
      holder: b.world.floor(-19, 8),
      offMat: b.world.floor(100, 100),
    };
  });
  report.geometrySamples = samples;
  // Read performance accumulated during the real route; no fps claim from sleeping frames.
  report.performance = await page.evaluate(() => {
    const b = window.bench;
    const pct = (a, p) =>
      [...a].sort((a, b) => a - b)[Math.floor((a.length - 1) * p)];
    const gl = b.renderer.getContext(),
      ext = gl.getExtension('WEBGL_debug_renderer_info');
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
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable',
      userAgent: navigator.userAgent,
    };
  });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.pointerLockElement);
  await page.evaluate(() => (window.previousBench = window.bench));
  await page
    .getByRole('link', { name: 'Back to the explorer', exact: true })
    .click();
  await page.waitForURL(base + '/');
  check(
    'return home disposes controller',
    await page.evaluate(
      () =>
        window.previousBench.dead &&
        window.previousBench.world.solids.length === 0,
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
      're-entry has one canvas ' + i,
      (await page.locator('.bench-canvas canvas').count()) === 1,
    );
    await page
      .getByRole('link', { name: 'Back to the explorer', exact: true })
      .click();
    await page.waitForURL(base + '/');
  }
  await page.route('**/bench-local/movement.stl', (route) => route.abort());
  await page.goto(base + '/bench?inspect=1');
  await page.bringToFront();
  await page
    .getByRole('button', { name: 'Retry loading', exact: true })
    .waitFor({ timeout: 90000 });
  check(
    'asset failure blocks entry',
    (await page
      .getByRole('button', { name: 'Enter the movement', exact: true })
      .count()) === 0,
  );
  await page.screenshot({ path: path.join(out, '10-load-failure.png') });
  await page.unroute('**/bench-local/movement.stl');
  await page
    .getByRole('button', { name: 'Retry loading', exact: true })
    .click();
  await ready();
  check('retry reconstructs complete scene', (await snapshot()).parts === 223);
  check(
    'no uncaught browser errors',
    report.errors.length === 0,
    report.errors,
  );
  console.log(
    JSON.stringify(
      { checks: report.checks.length, performance: report.performance },
      null,
      2,
    ),
  );
} finally {
  await fs.writeFile(
    path.join(out, 'browser-report.json'),
    JSON.stringify(report, null, 2),
  );
  if (foreground) await foreground.close();
  else await browser.close();
}
