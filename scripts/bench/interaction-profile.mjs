/** Repeatable rendering workload. Synthetic input/placements, NOT human latency evidence. */
import {
  launchProfileBrowser,
  profileEnvironment,
} from './profile-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const base = process.argv[2] || 'http://127.0.0.1:4176';
const modes = (process.env.PROFILE_MODES || 'Auto,High,Low').split(',');
assert.ok(
  modes.every((mode) =>
    ['Auto', 'High', 'Low', 'HalfTransmission', 'NoTransmission'].includes(
      mode,
    ),
  ),
  'Invalid PROFILE_MODES',
);
await fs.mkdir('artifacts/bench', { recursive: true });
const { page, browser, close, executionMode } =
  await launchProfileBrowser(chromium);
const label = process.argv[3] || `profile-${executionMode}`;
const report = {
  label,
  executionMode,
  status: 'incomplete',
  workload:
    'Synthetic 125 Hz mouse events and held keys; deterministic close-up placements. Not physical input-to-photon latency.',
  warmupMs: 700,
  sampleMs: 6000,
  scenarios: [],
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
  await page.evaluate(() => document.exitPointerLock());
  await page.waitForFunction(() => !window.bench.status.captured);
  await page.addStyleTag({
    content: '.bench-menu { display: none !important; }',
  });
  report.environment = await profileEnvironment(
    page,
    browser,
    executionMode,
    base,
  );
  await page.evaluate(() => {
    sessionStorage.profileTransmission = String(
      window.bench.renderer.transmissionResolutionScale,
    );
  });
  for (const mode of modes) {
    for (const side of ['bridge', 'dial']) {
      for (const walk of [false, true]) {
        let result;
        for (let attempt = 0; attempt < 3; attempt++) {
          await page.bringToFront();
          await page.waitForFunction(() => document.hasFocus(), null, {
            polling: 100,
            timeout: 5000,
          });
          result = await page.evaluate(
            async ({ mode, side, walk }) => {
              const b = window.bench;
              b.walker.clear();
              // Focus/visibility are recorded; genuine pointer capture is checked above.
              b.present(side);
              b.walker.clear();
              b.slowFrames = -1e9; // Hold the baseline manual setting; old code otherwise overrides High.
              if (mode === 'Auto') b.quality('Auto');
              else b.quality(mode === 'Low');
              b.renderer.transmissionResolutionScale =
                mode === 'HalfTransmission'
                  ? 0.5
                  : Number(sessionStorage.profileTransmission);
              b.movement.traverse((o) => {
                if (o.material)
                  o.material.transmission =
                    mode === 'NoTransmission'
                      ? 0
                      : o.material.userData.finishTransmission || 0;
              });
              b.walker.feet.set(-8, b.world.floor(-8, 0) + 0.002, 0);
              b.walker.yaw = -Math.PI / 2;
              b.walker.pitch = -0.55;
              b.status.captured = true;
              b.wake();
              await new Promise((r) => setTimeout(r, 700));
              b.status.captured = true;
              b.frameTimes = [];
              b.cpuTimes = [];
              const gl = b.renderer.getContext(),
                ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
              const frames = [],
                renderCPU = [],
                physicsCPU = [],
                gpu = [],
                inputAge = [],
                calls = [],
                triangles = [],
                ratios = [],
                queries = [];
              let unfocusedInputs = 0,
                hiddenInputs = 0;
              let first = 0,
                last = 0,
                inputAt = 0,
                inputs = 0,
                lastInput = 0,
                disjoint = 0;
              const render = b.renderer.render.bind(b.renderer),
                update = b.walker.update.bind(b.walker);
              b.renderer.info.autoReset = false;
              b.walker.update = (dt) => {
                const t = performance.now();
                update(dt);
                physicsCPU.push(performance.now() - t);
              };
              b.renderer.render = (...args) => {
                const t = performance.now();
                if (!first) first = t;
                if (last) frames.push(t - last);
                last = t;
                if (inputs !== lastInput) {
                  inputAge.push(t - inputAt);
                  lastInput = inputs;
                }
                if (ext && gl.getParameter(ext.GPU_DISJOINT_EXT)) {
                  disjoint++;
                  for (const q of queries.splice(0)) gl.deleteQuery(q);
                }
                while (
                  queries.length &&
                  gl.getQueryParameter(queries[0], gl.QUERY_RESULT_AVAILABLE)
                ) {
                  const q = queries.shift();
                  gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
                  gl.deleteQuery(q);
                }
                const q = ext && queries.length < 8 ? gl.createQuery() : null;
                b.renderer.info.reset();
                if (q) gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
                render(...args);
                if (q) {
                  gl.endQuery(ext.TIME_ELAPSED_EXT);
                  queries.push(q);
                }
                renderCPU.push(performance.now() - t);
                calls.push(b.renderer.info.render.calls);
                triangles.push(b.renderer.info.render.triangles);
                ratios.push(b.renderer.getPixelRatio());
              };
              const programsBefore = b.renderer.info.programs?.length;
              const start = performance.now();
              const timer = setInterval(() => {
                const elapsed = performance.now() - start;
                if (!document.hasFocus()) unfocusedInputs++;
                if (document.hidden) hiddenInputs++;
                b.status.captured = true;
                // Rapid alternating yaw; pitch changes expose close-up finishes and openings.
                const phase = Math.floor(elapsed / 700) % 2 ? -1 : 1;
                if (!inputAt || inputs === lastInput)
                  inputAt = performance.now();
                inputs++;
                document.dispatchEvent(
                  new MouseEvent('mousemove', {
                    movementX: phase * 14,
                    movementY: Math.floor(elapsed / 350) % 2 ? 2 : -2,
                  }),
                );
                if (walk) {
                  b.walker.keys.clear();
                  b.walker.keys.add(
                    Math.floor(elapsed / 500) % 2 ? 'KeyS' : 'KeyW',
                  );
                  b.wake();
                }
              }, 8);
              await new Promise((r) => setTimeout(r, 6000));
              clearInterval(timer);
              b.walker.clear();
              b.status.captured = false;
              b.renderer.render = render;
              b.walker.update = update;
              b.renderer.info.autoReset = true;
              for (const q of queries) gl.deleteQuery(q);
              const stats = (a) => {
                const s = [...a].sort((a, b) => a - b);
                const p = (n) => s[Math.floor((s.length - 1) * n)] ?? null;
                return {
                  n: a.length,
                  mean: a.length
                    ? a.reduce((a, b) => a + b, 0) / a.length
                    : null,
                  p50: p(0.5),
                  p95: p(0.95),
                  p99: p(0.99),
                  max: p(1),
                  over25: a.filter((x) => x > 25).length,
                  over50: a.filter((x) => x > 50).length,
                };
              };
              return {
                mode,
                side,
                walk,
                focused: document.hasFocus(),
                hidden: document.hidden,
                frame: stats(frames),
                renderCPU: stats(renderCPU),
                physicsCPU: stats(physicsCPU),
                gpu: stats(gpu),
                gpuTimerAvailable: !!ext,
                disjoint,
                inputHandlerToRender: stats(inputAge),
                inputs,
                unfocusedInputs,
                hiddenInputs,
                sampledSpan: last - first,
                actualElapsed: performance.now() - start,
                calls: stats(calls),
                triangles: stats(triangles),
                ratios: [...new Set(ratios)],
                internalSamples: b.frameTimes.length,
                programsBefore,
                programsAfter: b.renderer.info.programs?.length,
                endPosition: b.walker.feet.toArray(),
              };
            },
            { mode, side, walk },
          );
          if (
            !result.unfocusedInputs &&
            !result.hiddenInputs &&
            result.sampledSpan > 5500
          )
            break;
          (report.discarded ??= []).push(result);
        }
        report.scenarios.push(result);
        assert.ok(
          !result.unfocusedInputs &&
            !result.hiddenInputs &&
            result.sampledSpan > 5500,
          `Invalid ${executionMode} sample: ` + JSON.stringify(result),
        );
        console.log(
          JSON.stringify({
            mode,
            side,
            walk,
            frame: result.frame,
            gpu: result.gpu,
            cpu: result.renderCPU.p95,
            calls: result.calls.p50,
            focused: result.focused,
          }),
        );
      }
    }
  }
  await page.screenshot({ path: `artifacts/bench/${label}.png` });
  report.status = 'complete';
} catch (error) {
  report.error = String(error);
  throw error;
} finally {
  try {
    await fs.mkdir('artifacts/bench', { recursive: true });
    await fs.writeFile(
      `artifacts/bench/${label}.json`,
      JSON.stringify(report, null, 2),
    );
  } finally {
    await close();
  }
}
