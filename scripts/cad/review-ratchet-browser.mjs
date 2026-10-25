/** Headless production-pose check and repeatable homepage contact close-up. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.argv[2] || "http://127.0.0.1:4179";
const stage = process.argv[3] || "after";
assert.ok(["before", "after"].includes(stage));
const out = path.resolve(`artifacts/ratchet-contact/browser-${stage}`);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const report = { base, stage, headless: true, checks: [], errors: [] };
try {
  for (const route of ["/", "/workshop?mode=easy", "/bench?inspect=1"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => report.errors.push(String(e)));
    await page.goto(base + route, { waitUntil: "networkidle" });
    // Read the existing controller ref without adding production debug APIs.
    await page.waitForFunction(
      () => {
        for (const el of document.querySelectorAll("*")) {
          const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
          for (let f = key && el[key]; f; f = f.return) {
            for (let h = f.memoizedState; h; h = h.next) {
              const v = h.memoizedState?.current;
              if (
                (v?.ready && (v.renderParts?.size || v.pieces?.size)) ||
                (v?.status?.ready && v.movement)
              ) {
                window.ratchetAuditViewer = v;
                return true;
              }
            }
          }
        }
        return false;
      },
      null,
      { timeout: 90000 },
    );
    const checks = await page.evaluate(
      async ({ stage, route }) => {
        const v = window.ratchetAuditViewer;
        const manifest = await (await fetch("/models/assembly-manifest.json")).json();
        const prefix = "p_0_1_1_1__0_1_1_1_4__0_1_1_83_";
        const phases = {
          4: 6.25,
          14: 0,
          15: stage === "after" ? -1.8 : 0,
          "1__0_1_1_84_3": stage === "after" ? 1.8 : 0,
        };
        return Object.entries(phases).map(([suffix, angle]) => {
          const id = prefix + suffix,
            source = manifest.instances.find((p) => p.id === id).worldTransform;
          const rendered =
            v.renderParts?.get(id)?.mesh.matrix ??
            v.pieces?.get(id)?.pose ??
            v.movement.children.find((m) => m.userData.partId === id).matrix;
          const expected = source.map((r) => [...r]);
          const c = Math.cos((angle * Math.PI) / 180),
            s = Math.sin((angle * Math.PI) / 180);
          for (let r = 0; r < 3; r++) {
            expected[r][0] = source[r][0] * c + source[r][1] * s;
            expected[r][1] = -source[r][0] * s + source[r][1] * c;
          }
          return {
            route,
            id,
            localDegrees: angle,
            source,
            rendered: rendered.elements,
            maxError: Math.max(
              ...rendered.elements.map((n, i) => Math.abs(n - expected[i % 4][Math.floor(i / 4)])),
            ),
          };
        });
      },
      { stage, route },
    );
    report.checks.push(...checks);
    assert.ok(
      checks.every((c) => c.maxError < 1e-12),
      JSON.stringify(checks),
    );
    if (route === "/") {
      await page.screenshot({ path: path.join(out, "homepage.png") });
      await page.evaluate(() => {
        const v = window.ratchetAuditViewer;
        v.travel = undefined;
        v.controls.minDistance = 0.1;
        v.controls.target.set(0, 8.1, -0.835);
        v.camera.position.set(0, 8.1, 7.5);
        v.camera.up.set(0, -1, 0);
        v.camera.lookAt(v.controls.target);
        v.controls.update();
        v.requestRender();
      });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(out, "ratchet-closeup.png") });
    }
    await page.close();
  }
  assert.deepEqual(report.errors, []);
  console.log(
    `${stage}: ${report.checks.length} live transform checks across explorer, Workshop and bench passed`,
  );
} finally {
  await fs.writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
