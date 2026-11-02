/** GitHub-runner-only interactions. No screenshots or CAD publication. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import * as THREE from "../../explorer/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js";
import { PARTS, componentIds } from "../../explorer/src/assembly/lesson.ts";
assert.equal(process.env.GITHUB_ACTIONS, "true", "Use GitHub CI, not the owner’s computer.");
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
// Independently project original fitted geometry. No app placement/zero-distance helpers.
const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const records = new Map(
  read("explorer/public/models/assembly-manifest.json").instances.map((part) => [part.id, part]),
);
const pieces = new Map();
for (const path of Object.values(read("explorer/public/models/asset-paths.json"))) {
  const bytes = fs.readFileSync("explorer/public" + path);
  const gltf = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  gltf.scene.traverse((node) => {
    if (!node.isMesh) return;
    let parent = node;
    while (parent && !records.has(parent.name)) parent = parent.parent;
    if (!parent || pieces.has(parent.name)) return;
    const mesh = new THREE.Mesh(node.geometry);
    mesh.matrixAutoUpdate = false;
    mesh.matrix.set(...records.get(parent.name).worldTransform.flat());
    pieces.set(parent.name, mesh);
  });
}
const bounds = (ids) => {
  const group = new THREE.Group();
  for (const id of ids) group.add(pieces.get(id).clone());
  return new THREE.Box3().setFromObject(group);
};
const fixture = bounds(componentIds(12));
function project(rect, item) {
  const camera = new THREE.PerspectiveCamera(33, rect.width / rect.height, 0.05, 2000);
  const center = fixture.getCenter(new THREE.Vector3());
  const tangent = Math.tan((33 * Math.PI) / 360);
  let distance = 8;
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(
      i & 1 ? fixture.max.x : fixture.min.x,
      i & 2 ? fixture.max.y : fixture.min.y,
      i & 4 ? fixture.max.z : fixture.min.z,
    ).sub(center);
    distance = Math.max(
      distance,
      -p.z + 1.18 * Math.max(Math.abs(p.x) / (tangent * camera.aspect), Math.abs(p.y) / tangent),
    );
  }
  camera.up.set(0, -1, 0);
  camera.position.copy(center).add(new THREE.Vector3(0, 0, -distance));
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  const p = bounds(PARTS[item]).getCenter(new THREE.Vector3()).project(camera);
  return { x: rect.x + ((p.x + 1) * rect.width) / 2, y: rect.y + ((1 - p.y) * rect.height) / 2 };
}
const server = spawn("npm", ["--prefix", "explorer", "run", "dev"], {
  detached: true,
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "",
  browser,
  activePage;
for (const stream of [server.stdout, server.stderr])
  stream.on("data", (chunk) => {
    logs = (logs + chunk).slice(-12000);
  });
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4173/workshop")).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  for (const width of [1440, 390, 320]) {
    const viewport = { width, height: width === 320 ? 740 : 900 };
    const context = await browser.newContext({
      viewport,
      hasTouch: width < 600,
      isMobile: width < 600,
    });
    const page = (activePage = await context.newPage());
    const cdp = width < 600 ? await context.newCDPSession(page) : null;
    const errors = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
      console.error("Browser error:", error.message);
    });
    await page.addInitScript(() => {
      window.__workshopInput = [];
      for (const type of [
        "pointerdown",
        "pointerup",
        "pointercancel",
        "gotpointercapture",
        "lostpointercapture",
      ])
        window.addEventListener(
          type,
          (event) => {
            window.__workshopInput.push({
              type,
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              target: event.target?.closest("[data-drag]")?.dataset.drag ?? event.target?.className,
              pointerType: event.pointerType,
            });
          },
          true,
        );
    });
    await page.goto("http://127.0.0.1:4173/workshop");
    // Seed once, then compare the entire storage map across interactions and reloads.
    await page.evaluate(() => {
      localStorage.setItem("zweigesicht:watchmaker:chapter-1:v1", '{"existing":"chapter bytes"}');
      localStorage.setItem("zweigesicht:play:session:v1", '{"existing":"legacy bytes"}');
      localStorage.setItem("unrelated-setting", "untouched");
    });
    const storage = () =>
      page.evaluate(() =>
        Object.fromEntries(
          Object.keys(localStorage)
            .sort()
            .map((key) => [key, localStorage.getItem(key)]),
        ),
      );
    const saved = await storage();
    const button = (name) => page.getByRole("button", { name, exact: true });
    const root = page.locator(".watchmaker-workshop"),
      sheet = page.locator(".workshop-panel");
    const state = async () => ({
      cursor: await root.getAttribute("data-cursor"),
      mistakes: await root.getAttribute("data-mistakes"),
    });
    const waitReady = () =>
      page.waitForFunction(
        () => !document.querySelector(".workshop-actions button")?.disabled,
        null,
        { timeout: 90000 },
      );
    await waitReady();
    assert.deepEqual(await state(), { cursor: "12", mistakes: "0" });
    assert.equal(
      await page
        .getByRole("button", {
          name: /Separate stem|Place on movement|Placement options|hands|tweezers|screwdriver|Resume chapter/,
        })
        .count(),
      0,
    );
    assert.equal(await page.locator(".workshop-seat").count(), 0);
    const surface = () => page.locator(".workshop-surface").boundingBox();
    const stable = await surface();
    const checkStable = async () =>
      assert.deepEqual(
        await surface(),
        stable,
        "Pickup, feedback, invalid attempts and placement must not resize/reposition workspace",
      );
    const open = async () => {
      if (!(await sheet.isVisible())) await button("Parts").click();
      await sheet.waitFor();
    };
    await open();
    const search = page.getByRole("searchbox", { name: "Search parts" });
    await search.fill("winding-bridge screw");
    assert.equal(await page.locator("[data-drag]").count(), 2);
    await search.fill("");
    assert.equal(await page.locator("[data-drag]").count(), 9);
    await button("available").click();
    assert.equal(await page.locator("[data-drag]").count(), 3);
    await button("installed").click();
    assert.equal(await page.locator("[data-drag]").count(), 6);
    await button("All parts").click();
    assert.equal(await page.locator('[data-drag="mainplate"]').isDisabled(), true);
    await page.locator('[data-identify="bridge"]').scrollIntoViewIfNeeded();
    assert.ok(
      await page
        .locator('[data-identify="bridge"] img')
        .evaluate((image) => image.src.startsWith("data:image/png") && image.naturalWidth > 0),
    );
    if (cdp) await page.locator('[data-identify="bridge"]').tap();
    else await page.locator('[data-identify="bridge"]').click();
    assert.ok(await sheet.isVisible(), "Name/preview only identifies; Parts remains open");
    assert.deepEqual(await state(), { cursor: "12", mistakes: "0" });
    await checkStable();
    if (cdp) {
      const list = page.locator(".workshop-parts");
      await list.evaluate((el) => {
        el.scrollTop = 0;
      });
      const rect = await list.boundingBox();
      const start = { x: rect.x + rect.width * 0.4, y: rect.y + rect.height - 25 };
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ ...start, id: 1 }],
      });
      for (let i = 1; i <= 8; i++)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: start.x, y: start.y - i * 15, id: 1 }],
        });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForFunction(() => document.querySelector(".workshop-parts").scrollTop > 20);
      assert.ok(await sheet.isVisible(), "Native scrolling on row content does not pick up");
      assert.equal(await page.locator(".workshop-held").count(), 0);
      assert.deepEqual(await state(), { cursor: "12", mistakes: "0" });
    }
    const move = async (point) =>
      cdp
        ? cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ ...point, id: 1 }],
          })
        : page.mouse.move(point.x, point.y);
    const end = async (cancel = false) =>
      cdp
        ? cdp.send("Input.dispatchTouchEvent", {
            type: cancel ? "touchCancel" : "touchEnd",
            touchPoints: [],
          })
        : page.mouse.up();
    const begin = async (item) => {
      await open();
      const handle = page.locator(`[data-drag="${item}"]`);
      await handle.scrollIntoViewIfNeeded();
      const rect = await handle.boundingBox(),
        start = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      assert.equal(
        await page.evaluate(
          ({ x, y }) => document.elementFromPoint(x, y)?.closest("[data-drag]")?.dataset.drag,
          start,
        ),
        item,
      );
      if (cdp)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ ...start, id: 1 }],
        });
      else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
      }
      assert.ok(await sheet.isVisible(), "Pointer-down alone does not close Parts");
      await move({ x: start.x + 2, y: start.y - 2 });
      assert.ok(await sheet.isVisible(), "Sub-threshold movement does not establish drag intent");
      assert.equal(await page.locator(".workshop-held").count(), 0);
      await move({ x: start.x - 12, y: start.y - 14 });
      await sheet.waitFor({ state: "hidden" });
      await page.locator(".workshop-held img").waitFor();
      assert.ok(
        await page.evaluate(() =>
          window.__workshopInput.some(
            (event) => event.type === "gotpointercapture" && event.target === "workshop-surface",
          ),
        ),
        "Persistent surface captures actual pointer",
      );
      await checkStable();
      return start;
    };
    const aimAt = async (point) => {
      await move({ x: point.x, y: point.y + (cdp ? 64 : 0) });
      await page.waitForFunction(({ x, y }) => {
        const held = document.querySelector(".workshop-held");
        return (
          held &&
          Math.abs(parseFloat(held.style.left) - x) < 0.1 &&
          Math.abs(parseFloat(held.style.top) - y) < 0.1
        );
      }, point);
      await checkStable();
    };
    const drop = async (item, point, valid) => {
      await begin(item);
      await aimAt(point);
      assert.equal(await page.locator(".workshop-held").getAttribute("data-valid"), String(valid));
      await end();
      await page.locator(".workshop-held").waitFor({ state: "hidden" });
      await checkStable();
    };
    const target = (item) => project(stable, item);
    // Wrong part is an actual drag and remains available for retry.
    await drop("bridge-screw-1", target("bridge-screw-1"), false);
    assert.deepEqual(await state(), { cursor: "12", mistakes: "1" });
    assert.equal(await root.getAttribute("data-outcome"), "invalid");
    await sheet.waitFor();
    assert.equal(await page.locator('[data-drag="bridge-screw-1"]').isDisabled(), false);
    const beforeCancellation = await state();
    for (const kind of [
      "escape",
      "explicit",
      "pointercancel",
      "lostcapture",
      "blur",
      "hidden",
      "resize",
    ]) {
      await begin("bridge");
      await aimAt(target("bridge"));
      if (kind === "escape") await page.keyboard.press("Escape");
      if (kind === "explicit") {
        await button("Cancel placement").focus();
        await page.keyboard.press("Enter");
      }
      if (kind === "pointercancel") {
        if (cdp) await end(true);
        else
          await page.evaluate(() =>
            document.querySelector(".workshop-surface").dispatchEvent(
              new PointerEvent("pointercancel", {
                bubbles: true,
                pointerId: window.__workshopInput.filter((e) => e.type === "pointerdown").at(-1).id,
              }),
            ),
          );
      }
      if (kind === "lostcapture")
        await page.evaluate(() => {
          const host = document.querySelector(".workshop-surface");
          host.releasePointerCapture(
            window.__workshopInput.filter((e) => e.type === "pointerdown").at(-1).id,
          );
        });
      if (kind === "blur") await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      if (kind === "hidden")
        await page.evaluate(() => {
          Object.defineProperty(document, "hidden", { configurable: true, value: true });
          document.dispatchEvent(new Event("visibilitychange"));
          delete document.hidden;
        });
      if (kind === "resize")
        await page.setViewportSize({ ...viewport, height: viewport.height - 20 });
      if (kind === "lostcapture")
        await move({ x: target("bridge").x + 2, y: target("bridge").y + (cdp ? 64 : 0) });
      await page.waitForFunction(
        () => document.querySelector(".watchmaker-workshop").dataset.outcome === "cancelled",
      );
      if (!(kind === "pointercancel" && cdp)) await end();
      if (kind === "resize") {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(100);
      }
      assert.deepEqual(await state(), beforeCancellation, `${kind} must not submit an attempt`);
      await checkStable();
    }
    await drop("bridge", { x: 2, y: 150 }, false);
    assert.equal(await root.getAttribute("data-outcome"), "outside");
    assert.deepEqual(await state(), beforeCancellation);
    // An inside-but-far release differs from outside and cancellation.
    await drop("bridge", { x: stable.x + 12, y: stable.y + stable.height - 12 }, false);
    assert.deepEqual(await state(), { cursor: "12", mistakes: "2" });
    // Complete all three using actual pointer motion and native release.
    const bridge = target("bridge");
    await drop("bridge", { x: bridge.x + 4, y: bridge.y - 3 }, true);
    assert.deepEqual(await state(), { cursor: "13", mistakes: "2" });
    const first = target("bridge-screw-1"),
      second = target("bridge-screw-2");
    await drop("bridge-screw-1", second, false);
    assert.deepEqual(await state(), { cursor: "13", mistakes: "3" });
    assert.match(await page.locator(".workshop-feedback").innerText(), /other screw hole/);
    await drop(
      "bridge-screw-1",
      { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
      false,
    );
    assert.deepEqual(await state(), { cursor: "13", mistakes: "4" });
    // Imperfect placement on the correct side of the destination boundary.
    await drop(
      "bridge-screw-1",
      { x: first.x + (first.x - second.x) * 0.1, y: first.y + (first.y - second.y) * 0.1 },
      true,
    );
    assert.deepEqual(await state(), { cursor: "14", mistakes: "4" });
    await drop("bridge-screw-2", first, false);
    assert.deepEqual(await state(), { cursor: "14", mistakes: "5" });
    await drop("bridge-screw-2", second, true);
    assert.deepEqual(await state(), { cursor: "15", mistakes: "5" });
    const completed = await state();
    // Supplemental duplicate delivery: replay the consumed native pointer ID.
    await page.evaluate(() => {
      const e = window.__workshopInput.filter((e) => e.type === "pointerup").at(-1);
      for (let i = 0; i < 2; i++)
        document.querySelector(".workshop-surface").dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            pointerId: e.id,
            clientX: e.x,
            clientY: e.y,
          }),
        );
    });
    assert.deepEqual(await state(), completed);
    assert.match(await page.locator(".workshop-feedback").innerText(), /Practice complete/);
    await checkStable();
    assert.deepEqual(await storage(), saved);
    // Explicit opt-in mode is independently exercisable with keyboard or native taps.
    await button("Reset practice").click();
    await button("Alternative controls").focus();
    await page.keyboard.press("Enter");
    assert.equal(await button("Alternative controls").getAttribute("aria-pressed"), "true");
    for (const [item, label, cursor] of [
      ["bridge", "Pinned winding bridge", "13"],
      ["bridge-screw-1", "Winding-bridge screw 1", "14"],
      ["bridge-screw-2", "Winding-bridge screw 2", "15"],
    ]) {
      await open();
      assert.equal(await page.locator("[data-drag]").count(), 0);
      const choose = button("Choose " + label);
      if (cdp) await choose.tap();
      else {
        await choose.focus();
        await page.keyboard.press("Enter");
      }
      await sheet.waitFor({ state: "hidden" });
      await page.waitForFunction(() => document.activeElement?.tagName === "SELECT");
      await page.getByLabel("Destination", { exact: true }).selectOption(item);
      if (cdp) await button("Confirm placement").tap();
      else {
        await button("Confirm placement").focus();
        await page.keyboard.press("Enter");
      }
      assert.equal((await state()).cursor, cursor);
      await page.waitForFunction(() => document.activeElement?.textContent === "Parts");
      await checkStable();
    }
    await button("Alternative controls").click();
    await button("Reset practice").click();
    // Graphics interruption consumes an active gesture; Retry creates a new renderer.
    await begin("bridge");
    await aimAt(target("bridge"));
    await page
      .locator(".workshop-surface canvas")
      .evaluate((canvas) =>
        canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext(),
      );
    await button("Retry").waitFor();
    await end();
    assert.deepEqual(await state(), { cursor: "12", mistakes: "0" });
    await button("Retry").click();
    await waitReady();
    await checkStable();
    assert.deepEqual(await storage(), saved);
    assert.ok(stable.height >= 240);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const path of [
      "/workshop",
      "/workshop/prototype",
      "/workshop/assembly",
      "/workshop?mode=easy",
      "/workshop?mode=hard",
    ]) {
      await page.goto("http://127.0.0.1:4173" + path);
      await waitReady();
      assert.equal(new URL(page.url()).pathname, "/workshop");
      assert.deepEqual(await state(), { cursor: "12", mistakes: "0" });
      assert.deepEqual(await storage(), saved);
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        width,
        status: "passed",
        placements: "three actual drags",
        input: cdp ? "native emulated touch" : "mouse",
        cancellations: 8,
        stationaryWorkspace: stable,
        unchangedStorage: true,
        alternativeControls: true,
      }),
    );
    await context.close();
  }
} catch (error) {
  console.error(logs);
  if (activePage && !activePage.isClosed()) {
    console.error(await activePage.locator("body").innerText());
    console.error(await activePage.evaluate(() => window.__workshopInput));
  }
  throw error;
} finally {
  await browser?.close();
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
}
