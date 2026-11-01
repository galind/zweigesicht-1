/** GitHub-runner-only integration check. No assets/screenshots are uploaded or published. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import * as THREE from "../../explorer/node_modules/three/build/three.module.js";
import holders from "../../assets/source-manifest/holder-runtime.json" with { type: "json" };

assert.equal(
  process.env.GITHUB_ACTIONS,
  "true",
  "Run this check on GitHub CI, not the owner’s computer.",
);
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const directory = new URL("../../explorer/public/bench-local/", import.meta.url);
await fs.mkdir(directory, { recursive: true });
for (const file of holders.files) {
  // Reuse only the previously approved runtime delivery; no new original CAD downloads.
  const response = await fetch(`https://zweigesicht-uat.vercel.app/bench-local/${file.name}`, {
    redirect: "error",
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${file.name} unavailable from existing UAT delivery`);
  const data = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash("sha256").update(data).digest("hex"), file.sha256);
  await fs.writeFile(new URL(file.name, directory), data);
}
const server = spawn("npm", ["--prefix", "explorer", "run", "dev"], {
  detached: true,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    log = (log + chunk).slice(-15000);
  });
let browser, page, touchClient;
const key = "zweigesicht:watchmaker:chapter-1:v1";
const manifest = JSON.parse(
  await fs.readFile(
    new URL("../../explorer/public/models/assembly-manifest.json", import.meta.url),
  ),
);
const { PARTS, OPERATIONS } = await import("../../explorer/src/assembly/lesson.ts");
const bounds = new Map(manifest.instances.map((part) => [part.id, part.boundsWorldMm]));
const saved = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const waitCursor = (cursor) =>
  page.waitForFunction(
    ({ key, cursor }) => JSON.parse(localStorage.getItem(key))?.cursor === cursor,
    { key, cursor },
    { timeout: 10000 },
  );
const part = (item) => page.locator(`.assembly-part[data-item="${item}"]`);
const button = (name) => page.getByRole("button", { name, exact: true });
const toolName = { hands: "Hands", tweezers: "Tweezers", screwdriver: "Screwdriver" };

// Independently project the recorded CAD bounds/seats. No renderer handles or exact-seat action.
async function target(item, destination, side) {
  const surface = await page.locator(".assembly-surface").boundingBox();
  const portrait = surface.width < 650;
  const halfWidth = portrait
    ? Math.max(70, (102 * surface.width) / surface.height)
    : Math.max(105, (67 * surface.width) / surface.height);
  const halfHeight = (halfWidth * surface.height) / surface.width;
  const camera = new THREE.OrthographicCamera(
    -halfWidth,
    halfWidth,
    halfHeight,
    -halfHeight,
    0.1,
    500,
  );
  camera.position.set(0, 150, 58);
  camera.lookAt(0, 5, 0);
  camera.updateMatrixWorld(true);
  const rest = destination.endsWith("-rest");
  const x = rest ? (destination === "movement-rest" ? -1 : 1) * (portrait ? 34 : 68) : 0;
  const z = rest ? (portrait ? 65 : 0) : portrait ? 15 : 0;
  let point = new THREE.Vector3(x, 0, z);
  if (!item.startsWith("support-")) {
    const cursor = (await saved()).cursor;
    const stemIds = [...PARTS.stem, ...PARTS.wheel, ...PARTS.coupling];
    const ids =
      item === "movement"
        ? OPERATIONS.slice(0, cursor)
            .flatMap((op) => op.adds)
            .filter((id) => cursor >= 12 || !stemIds.includes(id))
        : item === "stem-assembly"
          ? OPERATIONS.slice(6, Math.min(cursor, 9)).flatMap((op) => op.adds)
          : PARTS[item];
    const box = new THREE.Box3();
    for (const id of ids)
      box.union(
        new THREE.Box3(
          new THREE.Vector3(...bounds.get(id)[0]),
          new THREE.Vector3(...bounds.get(id)[1]),
        ),
      );
    const stem =
      destination === "stem" ||
      destination === "stem-rest" ||
      (destination === "work" && item === "stem");
    const frame = new THREE.Matrix4().makeRotationX(
      stem || side === "movement" ? Math.PI / 2 : -Math.PI / 2,
    );
    frame.setPosition(
      stem ? x - 15.5250054869334 : x,
      stem ? 2.2 : side === "movement" ? 12.2 : 16.3,
      z,
    );
    point = box.getCenter(new THREE.Vector3()).applyMatrix4(frame);
  }
  point.project(camera);
  return {
    x: surface.x + ((point.x + 1) * surface.width) / 2,
    y: surface.y + ((1 - point.y) * surface.height) / 2,
  };
}
async function drag(
  item,
  destination,
  side = "movement",
  { cancel = false, miss = 0, touch = false } = {},
) {
  const box = await part(item).boundingBox();
  assert.ok(box, `Selectable geometry for ${item}`);
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const end = await target(item, destination, side);
  end.x += miss;
  if (touch) {
    const cdp = touchClient;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...start, id: 1 }],
    });
    // A short excursion also exercises returning a turned part to its existing location.
    for (let step = 1; step <= 3; step++) {
      const t = step / 3;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: start.x + (end.x - start.x) * t + Math.sin(t * Math.PI) * 10,
            y: start.y + (end.y - start.y) * t,
            id: 1,
          },
        ],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: cancel ? "touchCancel" : "touchEnd",
      touchPoints: [],
    });
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 10, start.y + 10, { steps: 2 });
    await page.mouse.move(end.x, end.y, { steps: 3 });
    if (cancel) await page.keyboard.press("Escape");
    await page.mouse.up();
  }
}
async function activate(locator, mode) {
  if (mode === "keyboard") {
    await locator.focus();
    await page.keyboard.press("Enter");
  } else if (mode === "touch") {
    await locator.waitFor({ state: "visible" });
    const box = await locator.boundingBox();
    assert.ok(box, "Visible touch control");
    await touchClient.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }],
    });
    await touchClient.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else await locator.click();
}
async function chooseSupport(side, mode) {
  await activate(button("Change support"), mode);
  await activate(part(`support-${side}`), mode);
}
async function layoutCheck(label) {
  const result = await page.evaluate(() => {
    const wrap = document.querySelector(".assembly-surface").getBoundingClientRect();
    const parts = [...document.querySelectorAll(".assembly-part")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        name: el.dataset.item,
        x: r.x,
        y: r.y,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    });
    return {
      width: innerWidth,
      height: innerHeight,
      scroll: document.documentElement.scrollHeight,
      surface: { width: wrap.width, height: wrap.height },
      parts,
      controls: [
        ...document.querySelectorAll(
          ".assembly-toolbar button, .assembly-header button, .assembly-header a, .assembly-selection:not([inert]) button",
        ),
      ].map((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          name: el.getAttribute("aria-label") || el.textContent,
          visible: r.x >= 0 && r.right <= innerWidth && r.bottom <= innerHeight + 1,
          hit: el === hit || el.contains(hit),
          width: r.width,
          height: r.height,
        };
      }),
    };
  });
  assert.equal(result.width, page.viewportSize().width, `${label}: CSS device width`);
  assert.ok(
    result.scroll <= result.height + 1,
    `${label}: no scrolling form ${JSON.stringify(result)}`,
  );
  assert.ok(result.surface.width >= result.width - 50, `${label}: mat retains working width`);
  assert.ok(
    result.surface.height >= result.height * 0.5,
    `${label}: at least half the viewport remains working space`,
  );
  for (const control of result.controls)
    assert.ok(
      control.visible && control.hit && control.width >= 43 && control.height >= 43,
      `${label}: accessible toolbar ${JSON.stringify(control)}`,
    );
  for (const p of result.parts) {
    assert.ok(p.width >= 43 && p.height >= 43, `${label}: touch target ${p.name}`);
    assert.ok(
      p.x >= -1 && p.right <= result.width + 1 && p.y >= 0 && p.bottom <= result.height,
      `${label}: visible ${JSON.stringify(p)}`,
    );
  }
  console.log(
    `${label}: viewport containment and 44 px geometry targets passed (${result.surface.width} × ${result.surface.height} surface).`,
  );
}
try {
  const base = "http://127.0.0.1:4173";
  let online = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(base, { signal: AbortSignal.timeout(2000) })).ok) {
        online = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(online, log);
  browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const modes = process.env.ASSEMBLY_INPUT_MODE
    ? [process.env.ASSEMBLY_INPUT_MODE]
    : ["desktop", "touch", "keyboard"];
  assert.ok(modes.every((mode) => ["desktop", "touch", "keyboard"].includes(mode)));
  for (const mode of modes) {
    const touch = mode === "touch";
    const context = await browser.newContext({
      viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      isMobile: touch,
      hasTouch: touch,
    });
    page = await context.newPage();
    touchClient = touch ? await context.newCDPSession(page) : undefined;
    await page.addInitScript(() => {
      window.__assemblyInputTrace = [];
      for (const type of ["pointerdown", "pointerup", "pointercancel", "click"])
        document.addEventListener(
          type,
          (event) => {
            const button = event.target.closest?.("button");
            window.__assemblyInputTrace.push({
              type,
              target:
                button?.getAttribute("aria-label") || button?.textContent || event.target.tagName,
              pointer: event.pointerId,
              primary: event.isPrimary,
              detail: event.detail,
            });
            if (window.__assemblyInputTrace.length > 40) window.__assemblyInputTrace.shift();
          },
          true,
        );
    });
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /THREE|WebGL|shader/i.test(message.text()))
        errors.push(message.text());
    });
    await page.goto(base);
    const entry = page.getByRole("link", { name: "Be a watchmaker!", exact: true });
    assert.equal(await entry.getAttribute("href"), "/workshop");
    await entry.click();
    await activate(button("Start chapter"), mode);
    await page.evaluate(() =>
      localStorage.setItem("zweigesicht:play:session:v1", "legacy sentinel"),
    );
    await layoutCheck(mode);
    assert.equal(await page.locator("select:visible").count(), 0);
    assert.equal(
      await page.locator(".assembly-surface-wrap button:not(.assembly-part)").count(),
      0,
    );
    assert.equal(await button("Place…").count(), 0, "Actions wait for a selection");
    assert.equal(await button("Turn over").count(), 0);
    assert.equal(
      await page.locator(".assembly-stats:visible").count(),
      0,
      "Session metrics stay in the menu",
    );
    await activate(button("How to play"), mode);
    await page.getByText("To play without dragging,", { exact: false }).waitFor();
    await activate(button("Back to bench"), mode);
    await page.locator(".assembly-dialog").waitFor({ state: "hidden" });
    // Discover the tap/keyboard alternative, inspect every destination, then cancel for free.
    await activate(part("bridge"), mode);
    assert.equal(
      await button("Turn over").count(),
      0,
      "Loose screws/parts have no turn or support controls",
    );
    assert.equal(await button("Change support").count(), 0);
    await activate(button("Place…"), mode);
    assert.equal(await page.locator(".assembly-placement .menu-link").count(), 3);
    if (mode === "keyboard") {
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => document.activeElement?.textContent === "Place…");
    } else
      await activate(
        page.locator(".assembly-placement").getByRole("button", { name: "Close", exact: true }),
        mode,
      );
    await activate(button("Cancel selection"), mode);
    assert.equal((await saved()).mistakes, 0);
    assert.equal((await saved()).cursor, 0);
    assert.equal(
      await page
        .locator(".assembly-page > :not(dialog)")
        .filter({ hasText: "provisional" })
        .count(),
      0,
    );
    const place = async (op) => {
      if (mode === "keyboard") {
        await part(op.item).focus();
        await page.keyboard.press("Enter");
        const label =
          op.destination === "movement-rest"
            ? "Set aside left"
            : op.destination === "stem-rest"
              ? "Set aside right"
              : op.destination === "movement"
                ? "Fit to movement"
                : op.destination === "stem"
                  ? "Fit to stem"
                  : "Place in working area";
        await activate(button("Place…"), mode);
        assert.equal(await page.locator(".assembly-placement .menu-link").count(), 3);
        await button(label).focus();
        await page.keyboard.press("Enter");
      } else await drag(op.item, op.destination, op.side, { touch });
    };
    // Native pointer cancellation must never submit a placement.
    await button("Hands").click();
    await drag("support-movement", "work", "movement", { cancel: true, touch });
    assert.equal((await saved()).cursor, 0);
    assert.equal((await saved()).mistakes, 0);
    if (mode === "desktop") {
      await drag("bridge", "work");
      await page.getByRole("status").filter({ hasText: "First:" }).waitFor();
      assert.equal((await saved()).cursor, 0);
    }
    for (let index = 0; index < OPERATIONS.length; index++) {
      const op = OPERATIONS[index];
      await activate(button(toolName[op.tool]), mode);
      await page.waitForFunction(
        (name) =>
          [...document.querySelectorAll(".assembly-tool-buttons button")].some(
            (el) => el.textContent.trim() === name && el.getAttribute("aria-pressed") === "true",
          ),
        toolName[op.tool],
      );
      if (index === 3 || index === 10) {
        await activate(part("movement"), mode);
        // Both side and support must be chosen, with no automatic correct choice.
        if (mode === "desktop") {
          await place(op);
          await page.getByRole("status").filter({ hasText: "side must face upward" }).waitFor();
          assert.equal((await saved()).cursor, index);
        }
        await layoutCheck(`${mode} contextual movement actions at ${index}`);
        await activate(button("Turn over"), mode);
        if (mode === "desktop") {
          const mistakes = (await saved()).mistakes;
          await place(op);
          await page.waitForFunction(
            ({ key, mistakes }) => JSON.parse(localStorage.getItem(key)).mistakes === mistakes + 1,
            { key, mistakes },
          );
          assert.equal((await saved()).cursor, index);
          await page.getByRole("status").filter({ hasText: "support" }).waitFor();
        }
        await chooseSupport(op.support, mode);
      }
      if (index === 2 && mode === "desktop") {
        await button("Hands").click();
        await drag(op.item, op.destination);
        await page.getByRole("status").filter({ hasText: "Use screwdriver" }).waitFor();
        assert.equal((await saved()).cursor, 2);
        await button("Screwdriver").click();
        await drag(op.item, op.destination, op.side, { miss: 50 });
        await page.getByRole("status").filter({ hasText: "within 5 mm" }).waitFor();
        assert.equal((await saved()).cursor, 2);
      }
      if (index === 5 && mode === "desktop") {
        await drag("movement", "stem-rest", "dial");
        await page
          .getByRole("status")
          .filter({ hasText: "Move this part to movement rest" })
          .waitFor();
        assert.equal((await saved()).cursor, 5);
      }
      await place(op);
      await waitCursor(index + 1);
      if (index === 2) {
        await activate(button("Undo"), mode);
        await waitCursor(2);
        await place(op);
        await waitCursor(3);
        assert.equal((await saved()).awarded, 3);
      }
      if (index === 8) {
        await activate(button("Pause"), mode);
        const before = (await saved()).elapsedMs;
        await page.waitForTimeout(1250);
        assert.equal((await saved()).elapsedMs, before);
        await page.reload();
        await activate(button("Resume chapter"), mode);
        assert.equal((await saved()).cursor, 9);
        await layoutCheck(`${mode} separate assemblies`);
      }
    }
    await page
      .getByRole("heading", { name: "The winding bridge is installed.", exact: true })
      .waitFor();
    const final = await saved();
    assert.equal(final.awarded, 15);
    assert.equal(final.mistakes, mode === "desktop" ? 8 : 0);
    await page.waitForTimeout(1250);
    assert.equal((await saved()).elapsedMs, final.elapsedMs);
    assert.equal(
      await page.evaluate(() => localStorage.getItem("zweigesicht:play:session:v1")),
      "legacy sentinel",
    );
    assert.deepEqual(errors, []);
    console.log(
      `${mode}: all 15 operations, cancellation, Undo, pause/reload/resume, completion and legacy-save isolation passed.`,
    );
    if (mode === "desktop") {
      await page.route("**/bench-local/dial.glb", (route) =>
        route.fulfill({ status: 404, body: "" }),
      );
      await page.reload();
      await page.getByText("The surface could not load", { exact: true }).waitFor();
      assert.equal((await saved()).cursor, 15);
      await page.unroute("**/bench-local/dial.glb");
      await button("Retry").click();
      await page.locator(".assembly-dialog").waitFor({ state: "hidden" });
      for (const path of ["/workshop?mode=easy", "/workshop?mode=hard", "/workshop/assembly"]) {
        await page.goto(base + path);
        await page
          .getByRole("heading", { name: "The winding bridge is installed.", exact: true })
          .waitFor();
        assert.equal(new URL(page.url()).pathname, "/workshop");
        assert.equal((await saved()).cursor, 15);
      }
      console.log("Required-holder failure/Retry and legacy URLs passed.");
    }
    if (mode === "keyboard") {
      await activate(button("Workshop menu"), mode);
      await activate(button("Restart"), mode);
      await activate(button("Keep this attempt"), mode);
      assert.equal((await saved()).cursor, 15);
      await activate(button("Workshop menu"), mode);
      await activate(button("Restart"), mode);
      await activate(button("Start new chapter"), mode);
      await waitCursor(0);
      assert.equal((await saved()).awarded, 0);
      assert.equal((await saved()).mistakes, 0);
      assert.equal(
        await page.evaluate(() => localStorage.getItem("zweigesicht:play:session:v1")),
        "legacy sentinel",
      );
      console.log("Keyboard restart cancellation and confirmed restart preserve legacy saves.");
    }
    if (touch) {
      await page.setViewportSize({ width: 320, height: 740 });
      // Software WebGL can finish the resize more than one frame after the viewport changes.
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".assembly-part")].every((el) => {
          const r = el.getBoundingClientRect();
          return r.left >= -1 && r.right <= innerWidth + 1;
        }),
      );
      await layoutCheck("320 px phone completed assembly");
      await activate(button("Workshop menu"), mode);
      await activate(button("Restart"), mode);
      await activate(button("Start new chapter"), mode);
      await waitCursor(0);
      await part("mainplate").waitFor();
      await layoutCheck("320 px phone loose parts");
      // Complete a second chapter using only native taps and the contextual destination menu.
      for (const [index, op] of OPERATIONS.entries()) {
        await activate(button(toolName[op.tool]), mode);
        await activate(part(op.item), mode);
        if (index === 3 || index === 10) {
          await layoutCheck(`320 px tap movement actions at ${index}`);
          await activate(button("Turn over"), mode);
          await chooseSupport(op.support, mode);
        }
        await activate(button("Place…"), mode);
        const destinations = page.locator(".assembly-placement .menu-link");
        assert.equal(await destinations.count(), 3);
        const targetIndex =
          op.destination === "movement-rest" ? 0 : op.destination === "stem-rest" ? 2 : 1;
        await activate(destinations.nth(targetIndex), mode);
        await waitCursor(index + 1);
      }
      assert.equal((await saved()).awarded, 15);
      assert.equal((await saved()).mistakes, 0);
      console.log(
        "320 px: all 15 operations also passed with native taps and explicit destination choices.",
      );
    }
    await touchClient?.detach();
    touchClient = undefined;
    await context.close();
  }
} catch (error) {
  console.error(log);
  if (page && !page.isClosed()) {
    console.error(await page.locator("body").innerText());
    console.error(await page.evaluate(() => window.__assemblyInputTrace));
  }
  throw error;
} finally {
  await browser?.close();
  if (server.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
  }
}
