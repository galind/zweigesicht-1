/** Loading / first-turn / side-switch probe; visible browser with synthetic look fixtures. */
import { launchForeground } from './foreground-browser.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const base = process.argv[2],
  label = process.argv[3],
  mode = process.argv[4] || 'Auto';
await fs.mkdir('artifacts/bench', { recursive: true });
const { page, close } = await launchForeground(chromium, {
  width: 2400,
  height: 1300,
});
const report = {
  label,
  mode,
  input:
    'Synthetic fixed-placement turns in visible Chrome; fresh browser process, existing OS driver cache.',
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
        busy: b.status.busy,
      });
    };
    return !b.status.ready;
  });
  await page.waitForFunction(() => window.bench.status.ready, null, {
    timeout: 90000,
  });
  report.readyMs = Date.now() - start;
  report.initialFrames = await page.evaluate(() => window.firstFrames);
  await page.addStyleTag({
    content: '.bench-menu { display:none !important; }',
  });
  report.turns = [];
  for (const side of ['bridge', 'dial']) {
    await page.bringToFront();
    await page.waitForFunction(() => document.hasFocus(), null, {
      polling: 100,
    });
    let switchMs = null;
    if (side === 'dial') {
      const t = Date.now();
      await page.evaluate(() => {
        window.bench.status.captured = false;
        window.bench.switchSide();
      });
      await page.waitForFunction(() => !window.bench.status.busy);
      switchMs = Date.now() - t;
    }
    const result = await page.evaluate(
      async ({ mode, side }) => {
        const b = window.bench;
        b.quality(mode === 'Auto' ? 'Auto' : false);
        b.slowFrames = -1e9;
        b.walker.clear();
        b.walker.feet.set(-8, b.world.floor(-8, 0) + 0.002, 0);
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
            p95: s[Math.floor((s.length - 1) * 0.95)],
            p99: s[Math.floor((s.length - 1) * 0.99)],
            max: s.at(-1),
            over50: s.filter((x) => x > 50).length,
          };
        };
        return {
          side,
          hidden,
          unfocused,
          intervals: stats(intervals),
          cpu: stats(frames.map((f) => f.cpu)),
          shaderGrowth: frames.filter((f) => f.after > f.before),
          firstFrames: frames.slice(0, 6),
        };
      },
      { mode, side },
    );
    report.turns.push({ ...result, switchMs });
    assert.ok(!result.hidden && !result.unfocused);
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await fs.writeFile(
    `artifacts/bench/${label}-first-use.json`,
    JSON.stringify(report, null, 2),
  );
  await close();
}
