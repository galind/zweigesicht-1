/** Cross-route configuration and saved-session verification on a local build. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import rules from "../../assets/authored/assembly-fittings.json" with { type: "json" };
import manifest from "../../assets/authored/play-manifest.json" with { type: "json" };
import {
  actions,
  createSession,
  canPlace,
  commitPlacement,
  isComplete,
} from "../../explorer/src/play/state.ts";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright"
);
const base = process.argv[2] || "http://127.0.0.1:4185",
  out = "artifacts/assembly-fittings";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const report = { checks: [], errors: [] };
const check = (name, pass, detail) => {
  report.checks.push({ name, pass, detail });
  assert.ok(pass, name + ": " + JSON.stringify(detail));
};
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
page.on("pageerror", (e) => report.errors.push(e.message));
try {
  await page.goto(base + "/?inspect=1");
  await page.waitForFunction(
    () => {
      for (const el of document.querySelectorAll("*")) {
        const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
        for (let f = key && el[key]; f; f = f.return)
          for (let h = f.memoizedState; h; h = h.next) {
            const v = h.memoizedState?.current;
            if (v?.ready && v.renderParts?.size) {
              window.fittingsViewer = v;
              return true;
            }
          }
      }
      return false;
    },
    null,
    { timeout: 90000 },
  );
  for (const caseVisible of [false, true])
    for (const dialsVisible of [false, true]) {
      const state = await page.evaluate(
        async ({ caseVisible, dialsVisible, rules }) => {
          const v = window.fittingsViewer;
          v.reset();
          await v.configureWatch({ caseVisible, dialsVisible });
          return {
            caseMounts: rules.caseMounts.map((id) => v.renderParts.get(id).mesh.visible),
            dialRetainers: rules.dialRetainers.map((id) => v.renderParts.get(id).mesh.visible),
          };
        },
        { caseVisible, dialsVisible, rules },
      );
      check(
        `explorer case=${caseVisible} dials=${dialsVisible}`,
        state.caseMounts.every((v) => v === caseVisible) &&
          state.dialRetainers.every((v) => v === dialsVisible),
        state,
      );
    }
  for (const [id, patch] of [
    [rules.caseMounts[0], { caseVisible: false }],
    [rules.dialRetainers[0], { dialsVisible: false }],
  ]) {
    const s = await page.evaluate(
      async ({ id, patch }) => {
        const v = window.fittingsViewer;
        await v.configureWatch({ caseVisible: true, dialsVisible: true });
        await v.select(id);
        await v.configureWatch(patch);
        return { selected: v.state.part, visible: v.renderParts.get(id).mesh.visible };
      },
      { id, patch },
    );
    check("turning host off clears its selected fitting", s.selected !== id && !s.visible, s);
  }
  await page.evaluate(async () => {
    const v = window.fittingsViewer;
    v.reset();
    await v.configureWatch({ caseVisible: false, dialsVisible: false });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: out + "/explorer-uncased.png" });
  for (const dialsVisible of [false, true]) {
    const s = await page.evaluate(
      async ({ dialsVisible, rules }) => {
        const v = window.fittingsViewer;
        await v.configureWatch({ dialsVisible });
        v.allParts();
        return {
          mounts: rules.caseMounts.filter((id) => v.spread.has(id)),
          retainers: rules.dialRetainers.filter((id) => v.spread.has(id)),
        };
      },
      { dialsVisible, rules },
    );
    check(
      "inventory follows fitted dial state " + dialsVisible,
      s.mounts.length === 0 && s.retainers.length === (dialsVisible ? rules.dialRetainers.length : 0),
      s,
    );
  }
  await page.goto(base + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
  const bench = await page.evaluate((rules) => {
    const b = window.bench,
      ids = [...rules.caseMounts, ...rules.dialRetainers];
    return {
      counts: b.stations.map((s) => s.movement.children.length),
      rendered: b.stations.flatMap((s) =>
        s.movement.children
          .filter((m) => ids.includes(m.userData.partId))
          .map((m) => m.userData.partId),
      ),
      colliders: b.world.solids.filter((s) => ids.includes(s.mesh.userData.partId)).length,
    };
  }, rules);
  check(
    "walking movement omits all nine fittings from rendering and collision",
    bench.counts.every((n) => n === 218) && !bench.rendered.length && !bench.colliders,
    bench,
  );
  // Load completed old saves to verify migration through the actual route UI,
  // plus a fresh session to check dial screws are absent until assembly.
  for (const level of ["easy", "hard"]) {
    let complete = createSession(manifest, level);
    while (!isComplete(manifest, complete))
      complete = commitPlacement(
        manifest,
        complete,
        actions(manifest, level).find((a) => canPlace(manifest, complete, a.id)).id,
      );
    const old = {
      ...complete,
      manifestVersion: "play-4",
      actionIds: [...Object.keys(manifest.previousVersion.retiredActions), ...complete.actionIds],
    };
    await page.evaluate(
      (old) => localStorage.setItem("zweigesicht:play:session:v1", JSON.stringify(old)),
      old,
    );
    await page.goto(base + "/workshop?inspect=1");
    await page.waitForFunction(() => window.__playInspect?.().ready, null, { timeout: 90000 });
    const s = await page.evaluate(() => window.__playInspect());
    check(
      level + " old complete save migrates without losing useful progress",
      s.session.manifestVersion === "play-5" &&
        s.session.actionIds.length === complete.actionIds.length &&
        s.fitted.length === 259 &&
        rules.caseMounts.every((id) => !s.visible.includes(id)) &&
        rules.dialRetainers.every((id) => s.visible.includes(id)),
      {
        version: s.session.manifestVersion,
        actions: s.session.actionIds.length,
        visible: s.visible.length,
      },
    );
    await page.evaluate(
      (session) => localStorage.setItem("zweigesicht:play:session:v1", JSON.stringify(session)),
      createSession(manifest, level),
    );
    await page.reload();
    await page.waitForFunction(() => window.__playInspect?.().ready, null, { timeout: 90000 });
    const fresh = await page.evaluate(() => window.__playInspect());
    check(
      level + " fresh assembly has neither case clamps nor dial retainers",
      [...rules.caseMounts, ...rules.dialRetainers].every((id) => !fresh.visible.includes(id)),
      { visible: fresh.visible.length },
    );
  }
  check("no browser errors", report.errors.length === 0, report.errors);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await fs.writeFile(out + "/browser-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
