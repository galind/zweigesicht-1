/** Local UI review: real capture/input; explicitly injected loading/error fixtures. */
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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);
const base = process.argv[2] || "http://127.0.0.1:4187";
const out = process.env.PLAY_QA_OUTPUT || "artifacts/bench-glass";
await fs.mkdir(out, { recursive: true });
const checks = [];
const check = (name, pass, detail) => {
  checks.push({ name, pass, detail });
  assert.ok(pass, name + ": " + JSON.stringify(detail));
};
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });
const ready = () =>
  page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
const enter = () => page.getByRole("button", { name: /^(Enter the movement|Resume exploring)$/ });
const layout = () =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll(
        ".bench-header a,.bench-start,.bench-start button,.bench-menu,.bench-menu button,.bench-menu-controls,.bench-legend,.bench-entry-popup",
      ),
    ].map((e) => {
      const r = e.getBoundingClientRect();
      return {
        text: e.textContent,
        within: r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        overflow: e.scrollWidth > e.clientWidth + 1,
      };
    }),
  );
try {
  await page.goto(base + "/");
  await page.locator(".stage canvas").waitFor();
  await page.waitForTimeout(2000);
  const home = await page.evaluate(() => ({
    font: getComputedStyle(document.body).fontFamily,
    color: getComputedStyle(document.querySelector(".site-identity h1")).color,
    radius: getComputedStyle(document.querySelector(".bench-trigger")).borderRadius,
  }));
  await shot("homepage");
  // Diagnostics are enabled only for the following local test visits.
  for (const [width, height, text] of [
    [1440, 900, 100],
    [1024, 640, 100],
    [2400, 1300, 100],
    [800, 600, 100],
    [1024, 768, 200],
  ]) {
    const label = `${width}x${height}-${text}`;
    await page.setViewportSize({ width, height });
    await page.goto(base + "/?text=" + text);
    const trigger = page.getByRole("button", { name: "Walk inside the movement", exact: true });
    await trigger.click();
    const popup = page.getByRole("dialog");
    await popup.waitFor();
    check(
      label + " homepage shows controls before navigation",
      new URL(page.url()).pathname === "/" &&
        (await popup
          .innerText()
          .then((t) => ["WASD", "Mouse", "Space", "F", "R", "Esc"].every((k) => t.includes(k)))),
    );
    check(
      label + " popup layout",
      (await layout()).every((x) => x.within && !x.overflow),
      await layout(),
    );
    await page.keyboard.press("Escape");
    await popup.waitFor({ state: "hidden" });
    await page.waitForFunction(
      () => document.activeElement?.textContent?.trim() === "Walk inside the movement",
    );
    check(
      label + " cancel restores homepage focus",
      await trigger.evaluate((e) => e === document.activeElement),
    );
    await trigger.press("Enter");
    await popup.waitFor();
    await enter().waitFor();
    await page.waitForFunction(
      () => document.activeElement?.textContent?.trim() === "Enter the movement",
    );
    check(
      label + " popup focuses Enter",
      await enter().evaluate((e) => e === document.activeElement),
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.waitForFunction(() =>
      document.querySelector('[role="dialog"]')?.contains(document.activeElement),
    );
    check(
      label + " popup contains keyboard focus",
      await popup.evaluate((e) => e.contains(document.activeElement)),
    );
    await page.waitForFunction(() => {
      const overlay = document.querySelector('[data-slot="sheet-overlay"]');
      return (
        overlay &&
        getComputedStyle(overlay).opacity === "1" &&
        overlay.getAnimations().every((animation) => animation.playState === "finished")
      );
    });
    const popupGlass = await popup.evaluate((e) => {
      const style = getComputedStyle(e);
      const backdrop = getComputedStyle(document.querySelector('[data-slot="sheet-overlay"]'));
      return {
        background: style.backgroundColor,
        blur: style.backdropFilter,
        radius: style.borderRadius,
        backdrop: backdrop.backdropFilter,
      };
    });
    check(label + " popup blurs background", popupGlass.backdrop.includes("blur("), popupGlass);
    await shot("popup-" + label);
    await enter().click();
    await page.waitForURL(base + "/bench");
    await page.waitForFunction(() => !!document.pointerLockElement);
    await page.locator(".bench-legend").waitFor();
    check(
      label + " popup enters captured scene without another instruction screen",
      (await page.locator(".bench-menu,.bench-start,.bench-entry-popup").count()) === 0,
    );
    check(
      label + " scene is sharp while captured",
      (await page.locator(".bench-menu-backdrop,[data-slot='sheet-overlay']").count()) === 0,
    );
    await shot("arrival-" + label);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Resume exploring", exact: true }).waitFor();
    await page.getByRole("link", { name: "Back to the explorer", exact: true }).click();
    await page.waitForURL(base + "/");
    await page.goBack();
    await page.waitForURL(base + "/bench");
    await enter().waitFor();
    check(
      label + " browser Back never reuses capture intent",
      (await page.evaluate(() => !document.pointerLockElement)) &&
        (await page.locator(".bench-start").isVisible()),
    );
    await page.goto(base + "/bench?inspect=1");
    await ready();
    if (text !== 100) await page.addStyleTag({ content: `html{font-size:${text}%}` });
    const styles = await page.evaluate(() => ({
      font: getComputedStyle(document.querySelector(".bench-start")).fontFamily,
      color: getComputedStyle(document.querySelector(".bench-start")).color,
      radius: getComputedStyle(document.querySelector(".bench-start")).borderRadius,
    }));
    check(
      label + " uses homepage font, foreground and surface radius",
      JSON.stringify(styles) === JSON.stringify(home),
      { home, styles },
    );
    check(
      label + " entry layout",
      (await layout()).every((x) => x.within && !x.overflow),
      await layout(),
    );
    check(label + " entry focused", await enter().evaluate((e) => e === document.activeElement));
    check(label + " no entry settings", (await page.locator(".bench-options").count()) === 0);
    check(
      label + " navigation and menu do not overlap",
      await page.evaluate(() => {
        const header = document.querySelector(".bench-header").getBoundingClientRect();
        const menu = document.querySelector(".bench-start").getBoundingClientRect();
        return header.bottom < menu.top;
      }),
    );
    const contrast = await page.evaluate(() => {
      const luminance = (color) => {
        const channels = color.match(/[\d.]+/g).map(Number);
        const alpha = channels[3] ?? 1;
        // Conservative contrast: composite translucent surfaces over pure white.
        const rgb = channels
          .slice(0, 3)
          .map((n) => n * alpha + 255 * (1 - alpha))
          .map((n) => {
            const c = n / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      return [".bench-enter", ".bench-header a"].map((selector) => {
        const element = document.querySelector(selector);
        const style = getComputedStyle(element);
        const background =
          selector === ".bench-enter" || selector === ".bench-header a"
            ? style.backgroundColor
            : getComputedStyle(document.querySelector(".bench-menu")).backgroundColor;
        const a = luminance(style.color),
          b = luminance(background);
        return { selector, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
    });
    check(
      label + " text contrast exceeds 4.5:1",
      contrast.every((x) => x.ratio >= 4.5),
      contrast,
    );
    check(
      label + " direct visit has no repeated instructions",
      (await page.locator(".bench-menu-controls,h1").count()) === 0,
    );
    await shot("direct-" + label);
    await page.keyboard.press("Shift+Tab");
    check(
      label + " keyboard navigation focus visible",
      await page
        .getByRole("link", { name: "Back to the explorer" })
        .evaluate(
          (e) => e === document.activeElement && getComputedStyle(e).outlineStyle === "solid",
        ),
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => !!document.pointerLockElement);
    await page.locator(".bench-menu,.bench-start").waitFor({ state: "hidden" });
    check(
      label + " explicit keyboard entry captures mouse",
      (await page.locator(".bench-menu").count()) === 0,
    );
    check(
      label + " essential hints",
      await page
        .locator(".bench-legend")
        .innerText()
        .then((s) => ["WASD", "Space", "R", "Esc"].every((x) => s.includes(x))),
    );
    const initial = await page.evaluate(() => ({
      yaw: window.bench.walker.yaw,
      feet: window.bench.walker.feet.toArray(),
    }));
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(width / 2 + i * 10, height / 2);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(100);
    check(
      label + " captured mouse look",
      await page.evaluate((y) => window.bench.walker.yaw !== y, initial.yaw),
    );
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(200);
    await page.keyboard.up("KeyW");
    await page.keyboard.down("Space");
    await page.waitForTimeout(300);
    await page.keyboard.up("Space");
    const flight = await page.evaluate(() => ({
      feet: window.bench.walker.feet.toArray(),
      eye: window.bench.camera.position.y,
    }));
    check(
      label + " walking and thrust retain eye height",
      flight.feet[2] !== initial.feet[2] &&
        flight.feet[1] > 0.01 &&
        Math.abs(flight.eye - flight.feet[1] - 1.48) < 1e-8,
      flight,
    );
    check(
      label + " exploration layout",
      (await layout()).every((x) => x.within && !x.overflow),
      await layout(),
    );
    await shot("exploration-" + label);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.pointerLockElement);
    await page.getByRole("button", { name: "Resume exploring", exact: true }).waitFor();
    check(
      label + " Escape clears input and focuses resume",
      await page.evaluate(
        () =>
          !window.bench.walker.keys.size &&
          document.activeElement?.textContent === "Resume exploring",
      ),
    );
    check(
      label + " menu layout",
      (await layout()).every((x) => x.within && !x.overflow),
      await layout(),
    );
    check(
      label + " menu actions are not clipped",
      await page.evaluate(() => {
        const menu = document.querySelector(".bench-menu").getBoundingClientRect();
        return [...document.querySelectorAll(".bench-menu button")].every((e) => {
          const r = e.getBoundingClientRect();
          return r.top >= menu.top && r.bottom <= menu.bottom;
        });
      }),
    );
    const menuGlass = await page.locator(".bench-menu").evaluate((e) => {
      const style = getComputedStyle(e);
      return {
        background: style.backgroundColor,
        blur: style.backdropFilter,
        radius: style.borderRadius,
        backdrop: getComputedStyle(document.querySelector(".bench-menu-backdrop")).backdropFilter,
      };
    });
    check(
      label + " Escape menu matches popup glass and backdrop",
      JSON.stringify(menuGlass) === JSON.stringify(popupGlass),
      { popupGlass, menuGlass },
    );
    await shot("menu-" + label);
    await page.getByRole("button", { name: "Reset position", exact: true }).click();
    check(
      label + " menu reset",
      await page.evaluate(
        () => Math.abs(window.bench.walker.feet.x) < 1e-8 && window.bench.walker.feet.z === 54,
      ),
    );
    await page.getByRole("button", { name: "Detail: Auto", exact: true }).click();
    check(
      label + " retained detail control",
      await page.getByRole("button", { name: "Detail: Low", exact: true }).isVisible(),
    );
    // Chrome requires a short interval before recapture after a user Escape.
    await page.waitForTimeout(1200);
    await enter().click();
    await page.waitForFunction(() => !!document.pointerLockElement);
    await page.locator(".bench-menu,.bench-start").waitFor({ state: "hidden" });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.pointerLockElement);
    await enter().waitFor();
    await page.getByRole("link", { name: "Back to the explorer", exact: true }).click();
    await page.waitForURL(base + "/");
    check(label + " resume and return navigation", true);
  }
  await page.setViewportSize({ width: 1024, height: 640 });
  // Escape during a pending homepage entry must cancel future automatic capture.
  let finishLoad;
  const heldLoad = new Promise((resolve) => {
    finishLoad = resolve;
  });
  await page.route("**/bench-local/environment.glb", async (route) => {
    await heldLoad;
    await route.continue();
  });
  await page.goto(base + "/");
  await page.getByRole("button", { name: "Walk inside the movement", exact: true }).click();
  await enter().click();
  await page.waitForURL(base + "/bench");
  await page.getByText("Loading the movement…", { exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(6000);
  finishLoad();
  await enter().waitFor();
  check(
    "Escape during slow loading cancels automatic capture",
    await page.evaluate(() => !document.pointerLockElement),
  );
  await page.unroute("**/bench-local/environment.glb");
  // Hold the environment response to inspect an actual pending load, then fail it.
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/bench-local/environment.glb", async (route) => {
    await pending;
    await route.abort();
  });
  await page.goto(base + "/bench?inspect=1");
  await page.getByText("Loading the movement…", { exact: true }).waitFor();
  check(
    "loading is announced and cannot enter",
    (await page.locator("output").isVisible()) && (await enter().count()) === 0,
  );
  await shot("loading");
  release();
  const retry = page.getByRole("button", { name: "Retry loading", exact: true });
  await retry.waitFor();
  check(
    "asset error is readable and retry focused",
    (await page.getByRole("alert").isVisible()) &&
      (await retry.evaluate((e) => e === document.activeElement)),
  );
  await shot("load-error");
  await page.unroute("**/bench-local/environment.glb");
  await retry.click();
  await ready();
  check(
    "asset retry recovers one canvas",
    (await page.locator(".bench-canvas canvas").count()) === 1,
  );
  // Explicit rejection fixture, followed by the real API again.
  await page.evaluate(() => {
    const c = window.bench.renderer.domElement;
    c.savedLock = c.requestPointerLock;
    c.requestPointerLock = () => Promise.reject(new Error("UI fixture"));
  });
  await enter().click();
  await page.getByRole("alert").waitFor();
  check(
    "capture rejection preserves entry and navigation",
    (await enter().isVisible()) &&
      (await page.getByRole("link", { name: "Back to the explorer" }).isVisible()),
  );
  await shot("capture-error");
  await page.evaluate(() => {
    const c = window.bench.renderer.domElement;
    c.requestPointerLock = c.savedLock;
  });
  await enter().click();
  await page.waitForFunction(() => !!document.pointerLockElement);
  await page.locator(".bench-menu,.bench-start").waitFor({ state: "hidden" });
  check("capture retry recovers", (await page.getByRole("alert").count()) === 0);
  await page.keyboard.press("Escape");
  await page.evaluate(() =>
    window.bench.renderer.getContext().getExtension("WEBGL_lose_context").loseContext(),
  );
  await retry.waitFor();
  await shot("graphics-error");
  await retry.click();
  await ready();
  check(
    "graphics retry recovers one canvas",
    (await page.locator(".bench-canvas canvas").count()) === 1,
  );
  console.log(`${checks.length} bench UI checks passed.`);
} finally {
  await fs.writeFile(`${out}/ui-report.json`, JSON.stringify(checks, null, 2));
  await browser.close();
}
