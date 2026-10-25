/** Real keyboard journey: hold, release, both Shift keys and pause/re-entry. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out = process.env.PLAY_QA_OUTPUT || "artifacts/workshop-stand";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const report = { checks: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
const check = (name, pass) => {
  report.checks.push({ name, pass });
  assert.ok(pass, name);
};
const speed = (target) =>
  page.waitForFunction(
    (target) => {
      const v = window.bench.walker.velocity;
      return Math.abs(Math.hypot(v.x, v.z) - target) < 0.02;
    },
    target,
    { timeout: 5000 },
  );
const enter = async () => {
  await page.getByRole("button", { name: /^(Enter workbench|Resume exploring)$/ }).click();
  await page.waitForFunction(() => window.bench.status.captured);
};
try {
  await page.goto((process.argv[2] || "http://127.0.0.1:4198") + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
  await enter();
  check(
    "walking legend teaches hold Shift to run",
    (await page.locator(".bench-legend").innerText()).includes("Shift Hold to run"),
  );
  await page.keyboard.down("KeyW");
  await speed(5.5);
  await page.keyboard.down("ShiftLeft");
  await speed(11);
  check("left Shift accelerates to run speed", true);
  await page.keyboard.up("ShiftLeft");
  await speed(5.5);
  check("release returns to walk while W remains down", true);
  await page.keyboard.down("ShiftRight");
  await speed(11);
  check("right Shift also runs", true);
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.up("ShiftRight");
  await speed(11);
  check("releasing one Shift preserves the other held Shift", true);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !window.bench.status.captured);
  check(
    "menu teaches hold Shift to run",
    (await page.locator(".bench-menu-controls").innerText()).includes("Shift Hold to run"),
  );
  check(
    "pause clears movement and sprint input",
    await page.evaluate(() => window.bench.walker.keys.size === 0),
  );
  await page.keyboard.up("KeyW");
  await page.keyboard.up("ShiftLeft");
  await enter();
  await page.keyboard.down("KeyS");
  await speed(5.5);
  check("resume starts at ordinary speed without stuck sprint", true);
  await page.keyboard.up("KeyS");
  await speed(0);
  check("release movement stops travel", true);
  await page.keyboard.press("Escape");
  await page.screenshot({ path: out + "/run-controls.png" });
  check("no browser errors", report.errors.length === 0);
} finally {
  await fs.writeFile(out + "/run-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
console.log("Run checks", report.checks.length);
