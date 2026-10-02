/** Real-route loading/retry QA. Requires the README's existing Playwright/Chrome setup. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright"
);
const base = process.argv[2] || "http://127.0.0.1:4176";
const out = path.resolve(process.env.PLAY_QA_OUTPUT || "artifacts/browser/movement-loading");
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const report = { base, checks: [], errors: [] };
const check = (name, pass, detail) => {
  report.checks.push({ name, pass: Boolean(pass), detail });
  assert.ok(pass, name);
};
let page;
try {
  for (const surface of ["home", "workshop"]) {
    for (const [width, height, text] of [
      [1440, 900, 100],
      [390, 844, 100],
      [320, 568, 100],
      [568, 320, 100],
      [320, 568, 200],
      [568, 320, 200],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addInitScript(() => {
        window.__loadingPositions = [];
        const sample = () => {
          const mark = document.querySelector(".movement-loader-mark");
          if (mark && getComputedStyle(mark).visibility === "visible") {
            const r = mark.getBoundingClientRect();
            window.__loadingPositions.push([r.x, r.y, r.width, r.height]);
          }
          if (window.__loadingPositions.length < 120) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      page = await context.newPage();
      page.on("pageerror", (e) => report.errors.push(String(e)));
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      let fail = true;
      await page.route("**/models/*.glb*", async (route) => {
        if (fail) {
          await gate;
          await route.abort();
        } else await route.continue();
      });
      const key = `${surface}-${width}x${height}-${text}`;
      await page.goto(
        `${base}/${surface === "home" ? "?" : "workshop?mode=easy&"}inspect=1&text=${text}`,
        { waitUntil: "domcontentloaded" },
      );
      const mark = page.locator(".movement-loader-mark");
      await mark.waitFor();
      // The route measures its real header/dock, including enlarged text.
      await page.waitForTimeout(250);
      const initialPositions = await page.evaluate(() => window.__loadingPositions);
      check(
        `${key}: loader stays fixed from its first visible frame`,
        initialPositions.length > 1 &&
          initialPositions.every((p) =>
            p.every((v, i) => Math.abs(v - initialPositions[0][i]) < 1),
          ),
        initialPositions,
      );
      if (surface === "home") {
        const headerLayout = await page.locator(".topbar").evaluate((header) => {
          const box = (s) => header.querySelector(s).getBoundingClientRect();
          const action = box(".assemble-trigger"),
            brand = box(".identity");
          const controls = box(
            innerWidth <= 1100 || document.documentElement.classList.contains("text-enlarged")
              ? ".mobile-menu-trigger"
              : ".header-actions",
          );
          const apart = (a, b) =>
            a.right <= b.left + 1 ||
            b.right <= a.left + 1 ||
            a.bottom <= b.top + 1 ||
            b.bottom <= a.top + 1;
          return {
            centered: Math.abs((action.left + action.right) / 2 - innerWidth / 2) < 1,
            separated: apart(action, brand) && apart(action, controls),
            label: header.querySelector(".assemble-trigger").textContent.trim(),
          };
        });
        check(
          `${key}: watchmaker action is centered and clear of its neighbors`,
          headerLayout.centered &&
            headerLayout.separated &&
            headerLayout.label === "Be a watchmaker",
          headerLayout,
        );
      }
      const geometry = await page.evaluate((surface) => {
        const rect = (selector) => {
          const r = document.querySelector(selector).getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        const drawing = document.querySelector(".movement-loader-drawing");
        const glyphs = [...drawing.querySelectorAll("defs text")];
        const context = document.createElement("canvas").getContext("2d");
        const ink = glyphs.map((glyph) => {
          context.font = getComputedStyle(glyph).font;
          const m = context.measureText(glyph.textContent.trim());
          const x = Number(glyph.getAttribute("x")),
            y = Number(glyph.getAttribute("y"));
          return {
            left: x - m.actualBoundingBoxLeft,
            right: x + m.actualBoundingBoxRight,
            top: y - m.actualBoundingBoxAscent,
            bottom: y + m.actualBoundingBoxDescent,
          };
        });
        const center = new DOMPoint(
          (Math.min(...ink.map((r) => r.left)) + Math.max(...ink.map((r) => r.right))) / 2,
          (Math.min(...ink.map((r) => r.top)) + Math.max(...ink.map((r) => r.bottom))) / 2,
        ).matrixTransform(drawing.getScreenCTM());
        return {
          inkOffset: [center.x - innerWidth / 2, center.y - innerHeight / 2],
          mark: rect(".movement-loader-mark"),
          drawing: rect(".movement-loader-drawing"),
          label: rect(".movement-loader-label"),
          header: rect(".site-header"),
          shell: rect(surface === "home" ? ".load-message" : ".play-loading"),
          dock: surface === "home" ? rect(".action-dock") : null,
          scroll: document.documentElement.scrollWidth,
        };
      }, surface);
      check(
        `${key}: visible gg letters are centered in the viewport`,
        geometry.inkOffset.every((n) => Math.abs(n) < 0.1),
        geometry.inkOffset,
      );
      check(
        `${key}: fixed drawing without a visible loading label`,
        geometry.mark.width === 120 &&
          geometry.mark.height === 80 &&
          geometry.drawing.width === 120 &&
          geometry.drawing.height === 80 &&
          geometry.label.width <= 1 &&
          geometry.label.height <= 1,
        geometry,
      );
      check(
        `${key}: loading region stays inside usable viewport`,
        geometry.shell.y >= geometry.header.bottom &&
          geometry.shell.bottom <= height &&
          geometry.shell.height >= 44 &&
          geometry.shell.x >= 0 &&
          geometry.shell.right <= width &&
          (!geometry.dock || geometry.shell.bottom <= geometry.dock.y + 1) &&
          geometry.scroll <= width,
        geometry,
      );
      check(
        `${key}: copy and decorative semantics preserved`,
        (await page.locator(".movement-loader-label").textContent()) ===
          (surface === "home" ? "Loading the movement" : "Preparing the movement") &&
          (await page.locator('.movement-loader[aria-live="polite"]').count()) === 1 &&
          (await mark.getAttribute("aria-hidden")) === "true",
      );
      if (surface === "workshop")
        check(
          `${key}: assembly rail and context stay out of loading view`,
          await page
            .locator(".play-dock, .play-workspace")
            .evaluateAll(
              (elements) =>
                elements.length > 0 &&
                elements.every((e) => getComputedStyle(e).visibility === "hidden"),
            ),
        );
      await page.reload({ waitUntil: "domcontentloaded" });
      await mark.waitFor();
      await page.waitForTimeout(250);
      const reloadPositions = await page.evaluate(() => window.__loadingPositions);
      check(
        `${key}: warm reload starts and remains at the viewport center`,
        reloadPositions.length > 1 &&
          reloadPositions.every(
            ([x, y, w, h]) =>
              Math.abs(x + w / 2 - width / 2) < 0.1 && Math.abs(y + h / 2 - height / 2) < 0.1,
          ),
        reloadPositions,
      );
      const phases = await mark.evaluate((e) => {
        const animations = e.getAnimations({ subtree: true });
        const shell = e.parentElement;
        return {
          count: animations.length,
          positions: [0, 900, 2200, 3120, 4800].map((time) => {
            animations.forEach((a) => {
              a.pause();
              a.currentTime = time;
            });
            const r = shell.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        };
      });
      check(
        `${key}: motion leaves status geometry fixed`,
        phases.count > 0 &&
          phases.positions.every((p) => JSON.stringify(p) === JSON.stringify(phases.positions[0])),
      );
      const closedStart = await mark.evaluate((e) => {
        const animations = e.getAnimations({ subtree: true });
        return [0, 200, 800, 1200, 5200, 5400].every((time) => {
          animations.forEach((a) => {
            a.currentTime = time;
          });
          return (
            getComputedStyle(e.querySelector(".movement-loader-whole")).opacity === "1" &&
            [...e.querySelectorAll(".movement-loader-slice, .movement-loader-cut-lines")].every(
              (n) => getComputedStyle(n).opacity === "0",
            )
          );
        });
      });
      check(`${key}: initial and repeated hold show the closed gg`, closedStart);
      check(
        `${key}: longer loads still separate the sections`,
        await mark.evaluate((e) => {
          e.getAnimations({ subtree: true }).forEach((a) => {
            a.currentTime = 2600;
          });
          return (
            getComputedStyle(e.querySelector(".movement-loader-whole")).opacity === "0" &&
            getComputedStyle(e.querySelector(".movement-loader-slice-0")).transform ===
              "matrix(1, 0, 0, 1, -9, -8)" &&
            getComputedStyle(e.querySelector(".movement-loader-slice-2")).transform ===
              "matrix(1, 0, 0, 1, 9, 8)"
          );
        }),
      );
      await page.screenshot({ path: path.join(out, `${key}-open.png`) });
      await mark.evaluate((e) =>
        e.getAnimations({ subtree: true }).forEach((a) => {
          a.currentTime = 600;
        }),
      );
      await page.screenshot({ path: path.join(out, `${key}.png`) });
      check(
        `${key}: loading announcement remains in the accessibility tree`,
        (await page.locator(".movement-loader").ariaSnapshot()).includes(
          surface === "home" ? "Loading the movement" : "Preparing the movement",
        ),
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      check(
        `${key}: reduced motion is a whole static mark`,
        await mark.evaluate(
          (e) =>
            e.getAnimations({ subtree: true }).length === 0 &&
            getComputedStyle(e.querySelector(".movement-loader-whole")).opacity === "1" &&
            [...e.querySelectorAll(".movement-loader-slice, .movement-loader-cut-lines")].every(
              (n) => getComputedStyle(n).display === "none",
            ),
        ),
      );
      release();
      const retry = page.getByRole("button", { name: "Retry 3D", exact: true });
      await retry.waitFor({ timeout: 60000 });
      check(
        `${key}: failed asset replaces animation with recovery`,
        (await mark.count()) === 0 &&
          (await page.locator('.movement-loader-error[aria-live="polite"]').count()) === 1,
      );
      await retry.scrollIntoViewIfNeeded();
      await retry.focus();
      check(
        `${key}: retry is keyboard reachable`,
        await retry.evaluate((e) => e === document.activeElement),
      );
      await page.screenshot({ path: path.join(out, `${key}-error.png`) });
      if (width === 320 && text === 200) {
        fail = false;
        await page.keyboard.press("Enter");
        if (surface === "workshop")
          await page.waitForFunction(() => window.__playInspect?.().ready, null, {
            timeout: 60000,
          });
        else
          await page
            .locator(".movement-loader, .movement-loader-error")
            .waitFor({ state: "detached", timeout: 60000 });
        check(
          `${surface}: keyboard retry reaches the ready experience`,
          (await page.locator(".movement-loader, .movement-loader-error").count()) === 0,
        );
      }
      if (surface === "workshop" && width === 320 && text === 200) {
        await page.locator(".play-dock").waitFor({ state: "visible", timeout: 60000 });
        check(
          "Workshop restores assembly UI after retry",
          await page.locator(".play-dock").isVisible(),
        );
      }
      await context.close();
    }
  }
  page = await browser.newPage();
  for (const route of [
    "/__loading",
    "/dev/loading-concepts/index.html",
    "/dev/loading-concepts/marks.tsx",
  ]) {
    const response = await page.goto(base + route);
    check(`${route}: retired study is unavailable`, response.status() === 404);
  }
  check("No uncaught browser errors", report.errors.length === 0, report.errors);
  console.log(`${report.checks.length} loading checks passed`);
} catch (error) {
  report.failure = String(error);
  await page?.screenshot({ path: path.join(out, "failure.png") }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
