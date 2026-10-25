/** Sustained interactive rendering + repeat navigation; explicit synthetic fixtures. */
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { launchBenchBrowser } from "./foreground-browser.mjs";
import { summarize } from "./summarize-workload.mjs";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const base = process.argv[2] || "http://127.0.0.1:4198",
  label = process.argv[3] || "workload";
const out = process.env.PLAY_QA_OUTPUT || "artifacts/bench-performance";
await fs.mkdir(out, { recursive: true });
const { page, close } = await launchBenchBrowser(chromium, {
  width: Number(process.env.PROFILE_WIDTH || 1280),
  height: Number(process.env.PROFILE_HEIGHT || 1327),
  dpr: 2,
  headless: process.env.BENCH_BROWSER !== "headed",
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const visits = [];
if (process.env.WORKSHOP_DEPTH === "fallback")
  await page.addInitScript(() => {
    const get = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (name) {
      return name === "EXT_clip_control" ? null : get.call(this, name);
    };
  });
try {
  for (let visit = 0; visit < 3; visit++) {
    const start = Date.now();
    await page.goto(base + "/bench?inspect=1");
    await page.waitForFunction(() => !!window.bench);
    const early = await page.evaluate(() => {
      const b = window.bench;
      window.loadFrames = [];
      window.loadStages = { bvh: [], compile: [] };
      const add = b.world.add.bind(b.world);
      b.world.add = (...a) => {
        const t = performance.now();
        const v = add(...a);
        window.loadStages.bvh.push(performance.now() - t);
        return v;
      };
      const compile = b.renderer.compileAsync.bind(b.renderer);
      b.renderer.compileAsync = async (...a) => {
        const t = performance.now();
        const promise = compile(...a);
        const submit = performance.now() - t;
        const v = await promise;
        window.loadStages.compile.push({ submit, total: performance.now() - t });
        return v;
      };
      const render = b.renderer.render.bind(b.renderer);
      b.renderer.render = (...args) => {
        const t = performance.now(),
          programs = b.renderer.info.programs.length;
        render(...args);
        window.loadFrames.push({
          cpu: performance.now() - t,
          programsBefore: programs,
          programsAfter: b.renderer.info.programs.length,
          ready: b.status.ready,
        });
      };
      return !b.status.ready;
    });
    await page.waitForFunction(() => window.bench.status.ready, null, { timeout: 90000 });
    const readyMs = Date.now() - start;
    await page.waitForTimeout(150);
    visits.push(
      await page.evaluate(
        ({ early, readyMs }) => ({
          early,
          readyMs,
          frames: window.loadFrames,
          stages: window.loadStages,
          memory: { ...bench.renderer.info.memory },
          programs: bench.renderer.info.programs.length,
        }),
        { early, readyMs },
      ),
    );
    if (visit === 0 && !process.env.PROFILE_LOADING_ONLY) {
      await page.addScriptTag({ path: "scripts/bench/workload-probe.js" });
      // Persist directly through Playwright rather than requiring the native collector.
      await page.route("http://127.0.0.1:4201/report", async (route) => {
        await route.fulfill({
          status: 200,
          headers: { "access-control-allow-origin": "*" },
          body: "ok",
        });
      });
      await page.addStyleTag({
        content: ".bench-start,.bench-menu,.bench-menu-backdrop{display:none!important}",
      });
      await page.evaluate(
        (n) => (window.benchWorkloadRepeats = n),
        Number(process.env.PROFILE_REPEATS || 2),
      );
      const session = await page.context().newCDPSession(page);
      if (process.env.PROFILE_CPU_TRACE) {
        await session.send("Profiler.enable");
        await session.send("Profiler.start");
      }
      await page.evaluate(async (label) => {
        await runBenchWorkload(label);
      }, label);
      if (process.env.PROFILE_CPU_TRACE) {
        const { profile } = await session.send("Profiler.stop");
        await fs.writeFile(`${out}/${label}.cpuprofile`, JSON.stringify(profile));
      }
      await session.detach();
      const report = await page.evaluate(() => benchProbe.report);
      assert.ok(report.samples.length > 1000);
      assert.ok(
        report.samples.every((s) => !s.hidden && s.focused),
        "Focus/visibility lost",
      );
      assert.equal(report.disjoint, 0);
      await fs.writeFile(`${out}/${label}.json`, JSON.stringify(report));
      const summary = summarize(report);
      if (process.env.PROFILE_MAX_P95) {
        // Assess the repeated circuit after Auto has had time to respond. Keep
        // first-use intervals in the report; never silently trim warmup/stalls.
        const repeated = summary.rows.filter((row) => /-1$/.test(row.phase));
        assert.ok(repeated.length >= 10, "Threshold checks require two circuits");
        assert.ok(
          repeated.every((row) => row.p95 <= Number(process.env.PROFILE_MAX_P95)),
          "Repeated workload exceeds p95 budget",
        );
      }
      console.log(JSON.stringify(summary));
    }
    if (process.env.PROFILE_EXPECT_PREPARED) {
      const v = visits.at(-1);
      assert.ok(v.early && v.frames.some((f) => !f.ready), "Uploads must finish before ready");
      assert.ok(
        v.frames.filter((f) => f.ready).every((f) => f.programsAfter === f.programsBefore),
        "Entry must not compile new programs",
      );
    }
    await page.evaluate(() => {
      window.retiredBench = bench;
    });
    await page.getByRole("link", { name: "Back to the explorer", exact: true }).click();
    await page.waitForFunction(() => !window.bench);
    const cleanup = await page.evaluate(() => {
      const b = window.retiredBench;
      const state = {
        dead: b.dead,
        solids: b.world.solids.length,
        trees: b.world.trees.size,
        memory: { ...b.renderer.info.memory },
        contextLost: b.renderer.getContext().isContextLost(),
      };
      delete window.retiredBench;
      return state;
    });
    assert.ok(cleanup.dead && cleanup.solids === 0 && cleanup.trees === 0);
    assert.equal(cleanup.memory.geometries, 0);
    if (process.env.PROFILE_EXPECT_PREPARED)
      assert.ok(
        cleanup.contextLost,
        "Retired route must release its WebGL context, including internal targets",
      );
    visits.at(-1).cleanup = cleanup;
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${out}/${label}-loading.json`, JSON.stringify({ visits, errors }, null, 2));
  console.log({ visits, errors });
} finally {
  await close();
}
