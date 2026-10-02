/** Local-only loading design QA. Uses an existing Playwright + Chrome install. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright"
);
const base = process.argv[2] || "http://127.0.0.1:4173";
const out = path.resolve(process.env.PLAY_QA_OUTPUT || "artifacts/browser/loading-concepts");
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const page = await browser.newPage();
const report = { base, checks: [], errors: [] };
page.on("pageerror", (error) => report.errors.push(String(error)));
const check = (name, pass, detail) => {
  report.checks.push({ name, pass: Boolean(pass), detail });
  assert.ok(pass, name);
};
const concepts = ["exchange", "turn", "lock"];
try {
  for (const surface of ["home", "workshop"]) {
    for (const concept of concepts) {
      for (const [width, height, text] of [
        [1440, 900, 100],
        [390, 844, 100],
        [320, 568, 100],
        [568, 320, 100],
        [320, 568, 200],
        [568, 320, 200],
      ]) {
        await page.setViewportSize({ width, height });
        await page.goto(`${base}/__loading?concept=${concept}&surface=${surface}&text=${text}`);
        await page.locator(".study-mark").waitFor();
        const key = `${concept}-${surface}-${width}x${height}-${text}`;
        const geometry = await page.evaluate(() => {
          const rect = (selector) => {
            const r = document.querySelector(selector).getBoundingClientRect();
            return {
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              bottom: r.bottom,
              right: r.right,
            };
          };
          return {
            mark: rect(".study-mark"),
            label: rect(".movement-loader-label"),
            output: rect(".movement-loader"),
            header: rect(".site-header"),
            scroll: document.documentElement.scrollWidth,
            width: innerWidth,
            height: innerHeight,
          };
        });
        check(
          `${key}: envelope, text and header do not overlap`,
          geometry.mark.width === 120 &&
            geometry.mark.height === 80 &&
            geometry.label.y >= geometry.mark.bottom + 9 &&
            geometry.mark.y >= geometry.header.bottom &&
            geometry.output.bottom <= height &&
            geometry.output.x >= 0 &&
            geometry.output.right <= width &&
            geometry.scroll <= width,
          geometry,
        );
        check(
          `${key}: one polite status, decorative mark hidden`,
          (await page.locator('output[aria-live="polite"]').count()) === 1 &&
            (await page
              .locator(".study-mark")
              .evaluate((e) => !!e.closest('[aria-hidden="true"]'))),
        );
        // Seek the real CSS animations, without changing any geometry or asset state.
        const phases = await page.evaluate(() => {
          const animations = document.querySelector(".study-mark").getAnimations({ subtree: true });
          return [0, 900, 2200, 4200].map((time) => {
            animations.forEach((a) => {
              a.pause();
              a.currentTime = time;
            });
            const r = document.querySelector(".movement-loader-label").getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          });
        });
        check(
          `${key}: animation cannot move the status layout`,
          phases.every((p) => JSON.stringify(p) === JSON.stringify(phases[0])),
        );
        if ((width === 1440 || width === 390) && text === 100)
          await page.screenshot({
            path: path.join(
              out,
              `${concept}-${surface}-${width === 1440 ? "desktop" : "mobile"}.png`,
            ),
          });
        if (text === 200 || height === 320)
          await page.screenshot({ path: path.join(out, `${key}.png`) });
        await page.emulateMedia({ reducedMotion: "reduce" });
        const staticState = await page.locator(".study-mark").evaluate((e) => ({
          animations: e.getAnimations({ subtree: true }).length,
          visible: [...e.querySelectorAll(".study-gg, .study-gg > span")].every(
            (n) => getComputedStyle(n).opacity === "1",
          ),
        }));
        check(
          `${key}: reduced motion keeps a visible static motif`,
          staticState.animations === 0 && staticState.visible,
          staticState,
        );
        await page.emulateMedia({ reducedMotion: "no-preference" });
      }
      await page.goto(
        `${base}/__loading?concept=${concept}&surface=${surface}&state=error&text=200`,
      );
      check(
        `${concept}-${surface}: error has no decorative motion`,
        (await page.locator(".study-mark").count()) === 0 &&
          (await page.locator('.movement-loader-error[aria-live="polite"]').count()) === 1,
      );
      const retry = page.getByRole("button", { name: "Retry 3D" });
      await retry.focus();
      await page.keyboard.press("Enter");
      check(
        `${concept}-${surface}: keyboard retry restores loading`,
        (await page.locator(".study-mark").isVisible()) &&
          (await page.locator(".movement-loader-error").count()) === 0,
      );
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/__loading`);
  await page.locator(".study-mark").first().waitFor();
  const label = page.locator(".movement-loader-label").first();
  const before = await label.boundingBox();
  await page.getByRole("button", { name: "Toggle transfer detail" }).first().click();
  check(
    "Transfer detail arrival/removal keeps label in place",
    JSON.stringify(before) === JSON.stringify(await label.boundingBox()),
  );
  await page.getByRole("button", { name: "Toggle transfer detail" }).first().click();
  await page.screenshot({ path: path.join(out, "comparison-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(out, "comparison-mobile.png"), fullPage: true });
  check("No uncaught browser errors", report.errors.length === 0, report.errors);
  console.log(`${report.checks.length} loading concept checks passed`);
} catch (error) {
  report.failure = String(error);
  await page.screenshot({ path: path.join(out, "failure.png") });
  console.error(error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
