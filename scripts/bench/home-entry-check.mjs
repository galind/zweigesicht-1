/** Invitation layout, keyboard flow and original navigation at narrow/large-text sizes. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright"
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const page = await browser.newPage();
const report = [];
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.argv[2] || "http://127.0.0.1:4176";
const out = process.env.PLAY_QA_OUTPUT || "artifacts/bench";
await fs.mkdir(out, { recursive: true });
try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion });
    for (const [width, height, text] of [
      [1440, 900, 100],
      [1200, 800, 100],
      [1199, 800, 100],
      [390, 844, 100],
      [320, 640, 100],
      [844, 390, 100],
      [1440, 900, 200],
      [390, 844, 200],
      [320, 640, 200],
    ]) {
      const label = `${width}x${height}-${text}-${reducedMotion}`;
      await page.setViewportSize({ width, height });
      await page.goto(base + "/?no3d=1&text=" + text, { waitUntil: "networkidle" });
      const entry = page.getByRole("button", { name: "Explore it in first person", exact: true });
      const accessible = await entry.evaluate((e) => {
        const r = e.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        const dock = document.querySelector(".action-dock").getBoundingClientRect();
        return {
          hit: e === hit || e.contains(hit),
          within:
            r.x >= 0 &&
            r.right <= innerWidth &&
            r.top >= 0 &&
            r.bottom <= innerHeight &&
            (r.right <= dock.left || r.bottom <= dock.top),
          overflow: e.scrollWidth > e.clientWidth + 1,
        };
      });
      assert.ok(
        accessible.hit && accessible.within && !accessible.overflow,
        label + JSON.stringify(accessible),
      );
      // Removing the decorative arrow must not change the usable name or copy.
      await page.addStyleTag({ content: ".bench-trigger svg { display: none; }" });
      assert.ok(await entry.isVisible());
      await entry.focus();
      assert.ok(await entry.evaluate((e) => getComputedStyle(e).outlineStyle !== "none"));
      const normal = await entry.evaluate((e) => getComputedStyle(e).backgroundColor);
      await entry.hover();
      await page.waitForTimeout(50);
      const hover = await entry.evaluate((e) => getComputedStyle(e).backgroundColor);
      assert.notEqual(hover, normal, label + " hover");
      if (width === 1440 && text === 100)
        await page.screenshot({ path: `${out}/hover-${reducedMotion}.png` });
      await page.mouse.down();
      await page.waitForTimeout(50);
      const pressed = await entry.evaluate((e) => getComputedStyle(e).backgroundColor);
      assert.notEqual(
        pressed,
        hover,
        label +
          " pressed " +
          JSON.stringify(
            await entry.evaluate((e) => ({
              active: e.matches(":active"),
              hover: e.matches(":hover"),
              expanded: e.getAttribute("aria-expanded"),
            })),
          ),
      );
      if (width === 1440 && text === 100)
        await page.screenshot({ path: `${out}/pressed-${reducedMotion}.png` });
      await page.mouse.move(width - 2, height / 2);
      await page.mouse.up();
      // A keyboard activation, Escape cancellation and restoration are all required.
      await entry.press("Enter");
      const popup = page.getByRole("dialog", { name: "Before you begin" });
      await popup.waitFor();
      assert.match(await popup.innerText(), /Keyboard and mouse required/);
      await page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement);
      });
      assert.equal(new URL(page.url()).pathname, "/");
      // Focus may land before the popup's opening transition has settled.
      await page.waitForFunction(() => {
        const e = document.querySelector('[role="dialog"]');
        if (!e) return false;
        const r = e.getBoundingClientRect();
        const title = e.querySelector("h2").getBoundingClientRect();
        return (
          r.x >= 0 &&
          r.right <= innerWidth &&
          r.y >= 0 &&
          r.bottom <= innerHeight &&
          e.scrollWidth <= e.clientWidth + 1 &&
          title.top >= r.top &&
          title.bottom <= r.bottom
        );
      });
      await page.keyboard.press("Escape");
      await popup.waitFor({ state: "hidden" });
      await page.waitForFunction(() => document.activeElement?.matches(".bench-trigger"));
      // The invitation must yield space to the original header navigation.
      const menu = page.getByRole("button", { name: "Menu", exact: true });
      if (await menu.isVisible()) {
        await menu.click();
        assert.ok(!(await entry.isVisible()));
        const panel = page.locator(".mobile-navigation");
        assert.ok(
          await panel.evaluate((e) => e.getBoundingClientRect().height > 100),
          label + " usable menu height",
        );
        await page.getByRole("button", { name: "Settings", exact: true }).click();
        await page.getByRole("dialog", { name: "Settings", exact: true }).waitFor();
        await page.keyboard.press("Escape");
        await page
          .getByRole("dialog", { name: "Settings", exact: true })
          .waitFor({ state: "hidden" });
        await panel.waitFor({ state: "hidden" });
        assert.ok(await entry.isVisible());
      }
      await entry.press("Enter");
      await popup.waitFor();
      assert.match(await popup.innerText(), /Keyboard and mouse required/);
      await page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement);
      });
      const enter = page.getByRole("button", { name: "Enter workbench", exact: true });
      if (
        await page
          .getByRole("heading", { name: "Before you begin" })
          .evaluate((e) => e === document.activeElement)
      ) {
        await page.keyboard.press("Tab");
      }
      assert.ok(await enter.evaluate((e) => e === document.activeElement));
      await page.keyboard.press("Tab");
      assert.ok(
        await page
          .getByRole("button", { name: "Close", exact: true })
          .evaluate((e) => e === document.activeElement),
      );
      await page.keyboard.press("Tab");
      await page.waitForFunction(() =>
        document.activeElement?.matches('.bench-enter,[data-slot="sheet-title"]'),
      );
      assert.ok(
        await popup.evaluate((e) => e.contains(document.activeElement)),
        label + " focus stays in popup",
      );
      await enter.press("Enter");
      await page.waitForURL(base + "/bench");
      report.push({ width, height, text, reducedMotion, pass: true });
    }
  }
  assert.deepEqual(errors, []);
  console.log(`${report.length} homepage layout, input-state and keyboard journeys passed.`);
} finally {
  await fs.writeFile(`${out}/home-entry-report.json`, JSON.stringify({ report, errors }, null, 2));
  await browser.close();
}
