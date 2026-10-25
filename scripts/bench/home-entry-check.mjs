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
      const entry = page.getByRole("link", { name: "Explore it in first person", exact: true });
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
      await page.waitForURL(base + "/bench");
      await page.getByRole("heading", { name: "The workbench", exact: true }).waitFor();
      await page.locator('.bench-menu-controls').waitFor();
      assert.match(await page.locator(".bench-start").innerText(), /WASD/);
      assert.equal(await page.getByRole("dialog").count(), 0);
      assert.equal(await page.evaluate(() => !!document.pointerLockElement), false);
      report.push({ width, height, text, reducedMotion, pass: true });
    }
  }
  // Real touch emulation: a wide tablet must not be mistaken for a desktop.
  for (const [width, height, text] of [
    [390, 844, 100],
    [1024, 768, 100],
    [320, 640, 200],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await context.newPage();
    const assets = [];
    mobile.on("request", (r) => {
      if (r.url().includes("/bench-local/")) assets.push(r.url());
    });
    await mobile.goto(base + "/?no3d=1&text=" + text);
    await mobile.getByText("Explore on desktop", { exact: true }).waitFor();
    assert.equal(await mobile.getByRole("link", { name: "Explore it in first person" }).count(), 0);
    assert.match(
      await mobile.locator(".bench-unavailable").innerText(),
      /Keyboard and mouse required/,
    );
    await mobile.screenshot({ path: `${out}/touch-home-${width}.png` });
    await mobile.goto(base + "/bench?text=" + text);
    await mobile.getByRole("heading", { name: "Explore on desktop" }).waitFor();
    assert.equal(await mobile.getByRole("button", { name: "Start exploring" }).count(), 0);
    assert.equal(await mobile.locator("canvas").count(), 0);
    assert.deepEqual(assets, []);
    await mobile.screenshot({ path: `${out}/touch-bench-${width}.png` });
    await mobile.getByRole("link", { name: "Return to the explorer", exact: true }).click();
    await mobile.waitForURL(base + "/");
    report.push({ width, height, touch: true, pass: true });
    await context.close();
  }
  // API absence is distinct from refusal after a user starts; neither should auto-capture.
  const unsupported = await browser.newContext();
  await unsupported.addInitScript(() => {
    Element.prototype.requestPointerLock = undefined;
  });
  const unavailable = await unsupported.newPage();
  await unavailable.goto(base + "/bench");
  await unavailable
    .getByText("This browser does not support mouse capture.", { exact: false })
    .waitFor();
  assert.equal(await unavailable.locator("canvas").count(), 0);
  await unsupported.close();
  report.push({ pointerLockUnavailable: true, pass: true });
  assert.deepEqual(errors, []);
  console.log(`${report.length} homepage layout, input-state and keyboard journeys passed.`);
} finally {
  await fs.writeFile(`${out}/home-entry-report.json`, JSON.stringify({ report, errors }, null, 2));
  await browser.close();
}
