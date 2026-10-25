/** Loading / first-turn / first visit to each resting side probe with synthetic look fixtures. */
import {
  launchProfileBrowser,
  profileEnvironment,
} from './profile-browser.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const base = process.argv[2] || 'http://127.0.0.1:4176',
  mode = process.argv[4] || 'Auto';
assert.ok(
  ['Auto', 'High', 'Low'].includes(mode),
  'Mode must be Auto, High or Low',
);
await fs.mkdir('artifacts/bench', { recursive: true });
const { page, browser, close, executionMode } =
  await launchProfileBrowser(chromium);
const label = process.argv[3] || `profile-${executionMode}`;
const report = {
  label,
  mode,
  executionMode,
  status: 'incomplete',
  input:
    'Synthetic fixed-placement turns at 125 Hz; fresh browser process, existing OS driver cache.',
  sampleMs: 6000,
  warmupMs: 0,
};

try {
  const start = Date.now();
  await page.goto(base + '/bench?inspect=1');
  await page.bringToFront();
  await page.waitForFunction(() => !!window.bench);
  report.instrumentedBeforeReady = await page.evaluate(() => {
    const b = window.bench;
    window.firstFrames = [];
    const render = b.renderer.render.bind(b.renderer);
    b.renderer.render = (...args) => {
      const start = performance.now(),
        before = b.renderer.info.programs?.length;
      render(...args);
      window.firstFrames.push({
        at: start,
        cpu: performance.now() - start,
        before,
        after: b.renderer.info.programs?.length,
        side: b.status.side,
        renderRatio: b.renderer.getPixelRatio(),
      });
    };
    return !b.status.ready;
  });
  await page.waitForFunction(() => window.bench.status.ready, null, {
    timeout: 90000,
  });
  report.readyMs = Date.now() - start;
  report.initialFrames = await page.evaluate(() => window.firstFrames);
  assert.ok(
    report.instrumentedBeforeReady,
    'Missed pre-ready instrumentation; rerun first-use probe',
  );
  report.environment = await profileEnvironment(
    page,
    browser,
    executionMode,
    base,
  );
  await page.addStyleTag({
    content: '.bench-menu { display:none !important; }',
  });
  report.turns = [];
  for (const side of ['bridge', 'dial']) {
    await page.bringToFront();
    await page.waitForFunction(() => document.hasFocus(), null, {
      polling: 100,
    });
    const result = await page.evaluate(
      async ({ mode, side }) => {
        const b = window.bench;
        b.quality(mode);
        b.walker.clear();
        b.flip?.setRest(side);
        const station = b.station.root.position;
        const x = station.x - 8,
          z = station.z;
        b.walker.feet.set(x, b.world.floor(x, z) + 0.002, z);
        b.updateStation();
        b.walker.yaw = -Math.PI / 2;
        b.walker.pitch = -0.55;
        b.status.captured = true;
        window.firstFrames = [];
        const start = performance.now();
        let hidden = 0,
          unfocused = 0;
        const timer = setInterval(() => {
          hidden += Number(document.hidden);
          unfocused += Number(!document.hasFocus());
          b.status.captured = true;
          document.dispatchEvent(
            new MouseEvent('mousemove', {
              movementX:
                Math.floor((performance.now() - start) / 700) % 2 ? -14 : 14,
            }),
          );
        }, 8);
        b.wake();
        await new Promise((r) => setTimeout(r, 6000));
        clearInterval(timer);
        b.status.captured = false;
        const frames = window.firstFrames;
        const intervals = frames.slice(1).map((f, i) => f.at - frames[i].at);
        const stats = (a) => {
          const s = [...a].sort((a, b) => a - b);
          return {
            n: s.length,
            p50: s[Math.floor((s.length - 1) * 0.5)],
            p95: s[Math.floor((s.length - 1) * 0.95)],
            p99: s[Math.floor((s.length - 1) * 0.99)],
            max: s.at(-1),
            over25: s.filter((x) => x > 25).length,
            over50: s.filter((x) => x > 50).length,
          };
        };
        return {
          side,
          hidden,
          unfocused,
          sampledSpan: frames.length ? frames.at(-1).at - frames[0].at : 0,
          quality: b.status.quality,
          renderRatio: b.renderer.getPixelRatio(),
          ratios: [...new Set(frames.map((f) => f.renderRatio))],
          intervals: stats(intervals),
          cpu: stats(frames.map((f) => f.cpu)),
          shaderGrowth: frames.filter((f) => f.after > f.before),
          firstFrames: frames.slice(0, 6),
        };
      },
      { mode, side },
    );
    report.turns.push(result);
    assert.ok(
      !result.hidden && !result.unfocused && result.sampledSpan > 5500,
      `Invalid ${executionMode} first-use sample`,
    );
  }
  report.status = 'complete';
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.error = String(error);
  throw error;
} finally {
  try {
    await fs.writeFile(
      `artifacts/bench/${label}-first-use.json`,
      JSON.stringify(report, null, 2),
    );
  } finally {
    await close();
  }
}
