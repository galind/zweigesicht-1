/** Visible-browser regression: browser-dispatched input, plus explicitly labelled stress fixtures. */
import { launchForeground } from './foreground-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const base = process.argv[2] || 'http://127.0.0.1:4176';
await fs.mkdir('artifacts/bench', { recursive: true });
const { page, close } = await launchForeground(chromium, {});
const checks = [];
function check(name, pass, details) {
  checks.push({ name, pass, details });
  assert.ok(pass, name + ': ' + JSON.stringify(details));
}

try {
  await page.goto(base + '/bench?inspect=1');
  await page.bringToFront();
  await page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
  check(
    'responsive Auto is the default',
    await page.evaluate(
      () =>
        window.bench.status.quality === 'Auto' &&
        window.bench.renderer.getPixelRatio() === 1,
    ),
  );
  // Real browser input/capture; no direct call of the look handler.
  await page
    .getByRole('button', { name: 'Enter the movement', exact: true })
    .click();
  await page.waitForFunction(() => !!document.pointerLockElement);
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.bench.frameTimes = [];
    window.bench.cpuTimes = [];
  });
  const before = await page.evaluate(() => window.bench.walker.yaw);
  for (let i = 0; i < 90; i++) {
    await page.mouse.move(
      720 + Math.sin(i / 9) * 200,
      450 + Math.cos(i / 17) * 80,
    );
    await page.waitForTimeout(16);
  }
  const look = await page.evaluate(() => ({
    samples: window.bench.frameTimes.length,
    yaw: window.bench.walker.yaw,
    keys: window.bench.walker.keys.size,
    captured: !!document.pointerLockElement,
    focused: document.hasFocus(),
  }));
  check(
    'stationary browser mouse-look is captured, rendered and sampled',
    look.samples > 100 &&
      look.yaw !== before &&
      !look.keys &&
      look.captured &&
      look.focused,
    look,
  );
  const idleSnapshot = () =>
    page.evaluate(() => ({
      renders: window.bench.renderCount,
      samples: window.bench.frameTimes.length,
      input: window.bench.activity.lastInput,
      frame: window.bench.frame,
      captured: window.bench.status.captured,
      grounded: window.bench.walker.grounded,
    }));
  let idle, resting;
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.waitForFunction(() => window.bench.frame === 0, null, {
      polling: 100,
      timeout: 10000,
    });
    idle = await idleSnapshot();
    await page.waitForTimeout(500);
    resting = await idleSnapshot();
    if (resting.input === idle.input) break; // Native device input is not idle.
  }
  check(
    'captured stationary view sleeps without accumulating idle samples',
    resting.input === idle.input &&
      resting.renders === idle.renders &&
      resting.samples === idle.samples &&
      resting.captured,
    { idle, resting },
  );
  await page.mouse.move(800, 500);
  await page.waitForTimeout(100);
  check(
    'first look after idle does not record the sleep as a stall',
    await page.evaluate(() => Math.max(...window.bench.frameTimes) < 200),
  );
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.pointerLockElement);
  for (const mode of ['Low', 'High', 'Auto']) {
    await page.getByRole('button', { name: /^Detail:/ }).click();
    check(
      'menu selects ' + mode,
      await page.evaluate((mode) => window.bench.status.quality === mode, mode),
    );
  }
  // Controlled scheduling stress: delay render submission. This is a state-machine
  // regression, not evidence about normal GPU or physical mouse performance.
  const adaptation = await page.evaluate(async () => {
    const b = window.bench;
    const original = b.renderer.render.bind(b.renderer);
    const originalSetRatio = b.renderer.setPixelRatio.bind(b.renderer);
    const changes = [];
    b.renderer.setPixelRatio = (ratio) => {
      changes.push({ ratio, at: performance.now() });
      originalSetRatio(ratio);
    };
    b.renderer.render = (...args) => {
      const stop = performance.now() + 27;
      while (performance.now() < stop) {
        /* deliberate test load */
      }
      original(...args);
    };
    b.status.captured = true;
    const timer = setInterval(
      () =>
        document.dispatchEvent(new MouseEvent('mousemove', { movementX: 1 })),
      8,
    );
    await new Promise((r) => setTimeout(r, 20000));
    clearInterval(timer);
    b.status.captured = false;
    b.renderer.render = original;
    b.renderer.setPixelRatio = originalSetRatio;
    return {
      ratio: b.renderer.getPixelRatio(),
      mode: b.status.quality,
      changes,
    };
  });
  check(
    'stationary look drives gradual bounded Auto reduction',
    adaptation.ratio === 0.7 &&
      adaptation.mode === 'Auto' &&
      adaptation.changes.length === 2 &&
      adaptation.changes[0].ratio === 0.85 &&
      adaptation.changes[1].at - adaptation.changes[0].at > 5000,
    adaptation,
  );
  await page.evaluate(() => window.bench.quality('High'));
  check(
    'explicit High restores its fixed resolution',
    await page.evaluate(
      () =>
        window.bench.renderer.getPixelRatio() === 1.5 &&
        window.bench.detail.mode === 'High',
    ),
  );
  // Discrete side changes preserve quality and do not retain pending look.
  for (const side of ['dial', 'bridge']) {
    await page
      .getByRole('button', { name: 'Switch side', exact: true })
      .click();
    await page.waitForFunction(
      (side) => window.bench.status.side === side && !window.bench.status.busy,
      side,
    );
    check(
      side + ' switch preserves manual choice and clears input',
      await page.evaluate(
        () =>
          window.bench.status.quality === 'High' &&
          window.bench.renderer.getPixelRatio() === 1.5 &&
          !window.bench.activity.pending &&
          window.bench.walker.feet.x === -59,
      ),
    );
  }
  // Static close-up inspection fixtures. They do not claim a walked route.
  await page.addStyleTag({
    content: '.bench-menu { display: none !important; }',
  });
  for (const side of ['bridge', 'dial']) {
    for (const scale of [1, 0.5]) {
      await page.evaluate(
        ({ side, scale }) => {
          const b = window.bench;
          b.present(side);
          b.emit();
          b.renderer.transmissionResolutionScale = scale;
          b.walker.feet.set(-8, b.world.floor(-8, 0) + 0.002, 0);
          b.walker.yaw = -Math.PI / 2;
          b.walker.pitch = -0.55;
          b.walker.grounded = true;
          b.wake();
        },
        { side, scale },
      );
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `artifacts/bench/finish-${side}-${scale}.png`,
      });
    }
  }
  console.log(JSON.stringify(checks, null, 2));
} finally {
  await fs.writeFile(
    'artifacts/bench/interaction-check.json',
    JSON.stringify(checks, null, 2),
  );
  await close();
}
