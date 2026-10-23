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
const context =
  foreground?.context ??
  (await browser.newContext({ viewport: { width: 1440, height: 900 } }));
const page = foreground?.page ?? (await context.newPage());
const checks = [];
const check = (name, pass, detail) => {
  checks.push({ name, pass, detail });
  assert.ok(pass, name + ': ' + JSON.stringify(detail));
};
try {
  await page.goto(base + '/bench?inspect=1');
  await page.bringToFront();
  await page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
  await page
    .getByRole('button', { name: 'Enter the movement', exact: true })
    .click();
  await page.waitForFunction(() => window.bench.status.captured);
  await page.keyboard.down('KeyW');
  const other = await page.context().newPage();
  await other.goto('about:blank');
  await other.bringToFront();
  await page.waitForTimeout(700);
  const hidden = await page.evaluate(() => ({
    hidden: document.hidden,
    captured: window.bench.status.captured,
    keys: [...window.bench.walker.keys],
    frames: window.bench.renderCount,
  }));
  check(
    'actual window focus loss releases and clears keys',
    !hidden.captured && !hidden.keys.length,
    hidden,
  );
  let windowSession, windowId;
  if (process.env.HEADED) {
    // Playwright pages can occupy separate visible windows on macOS. Minimize
    // this owned test window to test actual browser visibility, not just blur.
    windowSession = await context.newCDPSession(page);
    ({ windowId } = await windowSession.send('Browser.getWindowForTarget'));
    await windowSession.send('Browser.setWindowBounds', {
      windowId,
      bounds: { windowState: 'minimized' },
    });
    await page
      .waitForFunction(() => document.hidden, null, {
        timeout: 10000,
        polling: 100,
      })
      .catch(async (error) => {
        console.error(
          'Visibility probe',
          await windowSession.send('Browser.getWindowBounds', { windowId }),
          await page.evaluate(() => ({
            hidden: document.hidden,
            visibility: document.visibilityState,
            focus: document.hasFocus(),
          })),
        );
        throw error;
      });
    hidden.frames = await page.evaluate(() => window.bench.renderCount);
    await page.waitForTimeout(700);
    check(
      'actual minimized window is hidden and stops rendering',
      await page.evaluate(
        (frames) => document.hidden && window.bench.renderCount === frames,
        hidden.frames,
      ),
    );
  }
  // Also exercise the visibility handler explicitly in headless Chrome.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(700);
  check(
    'hidden-document event stops rendering',
    (await page.evaluate(() => window.bench.renderCount)) === hidden.frames,
  );
  if (windowSession)
    await windowSession.send('Browser.setWindowBounds', {
      windowId,
      bounds: { windowState: 'normal' },
    });
  await page.bringToFront();
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.keyboard.up('KeyW');
  await other.close();
  await page.waitForTimeout(500);
  await page.waitForFunction(() => !document.hidden);
  check(
    'returning window does not capture without action',
    await page.evaluate(() => !window.bench.status.captured),
  );
  // Simulate a genuine WebGL context loss through the browser extension.
  await page.evaluate(() =>
    window.bench.renderer
      .getContext()
      .getExtension('WEBGL_lose_context')
      .loseContext(),
  );
  await page
    .getByRole('button', { name: 'Retry loading', exact: true })
    .waitFor();
  check('graphics loss offers retry', true);
  await page
    .getByRole('button', { name: 'Retry loading', exact: true })
    .click();
  await page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
  check(
    'graphics retry creates one canvas',
    (await page.locator('.bench-canvas canvas').count()) === 1,
  );
  await page
    .getByRole('link', { name: 'Back to the explorer', exact: true })
    .click();
  await page.route('**/models/overview-*.glb', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue().catch(() => {});
  });
  await page.goto(base + '/bench?inspect=1');
  await page.bringToFront();
  await page.waitForFunction(() => !!window.bench);
  await page.evaluate(() => (window.departingBench = window.bench));
  await page
    .getByRole('link', { name: 'Back to the explorer', exact: true })
    .click();
  await page.waitForURL(base + '/');
  await page.waitForTimeout(2500);
  const departed = await page.evaluate(() => ({
    dead: window.departingBench.dead,
    ready: window.departingBench.status.ready,
    solids: window.departingBench.world.solids.length,
    canvas: document.querySelectorAll('.bench-canvas canvas').length,
  }));
  check(
    'late load cannot revive departed scene',
    departed.dead &&
      !departed.ready &&
      departed.solids === 0 &&
      departed.canvas === 0,
    departed,
  );
  console.log(JSON.stringify(checks, null, 2));
} finally {
  await fs.writeFile(
    'artifacts/bench/lifecycle-report.json',
    JSON.stringify(checks, null, 2),
  );
  if (foreground) await foreground.close();
  else await browser.close();
}
