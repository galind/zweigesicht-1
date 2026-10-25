/** Surface review fixtures; external views are explicitly separate from visitor scale. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out = process.env.PLAY_QA_OUTPUT || "artifacts/workshop-polish";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const report = { checks: [], errors: [], fixtures: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error" && /THREE|shader|WebGL/i.test(m.text())) report.errors.push(m.text());
});
function check(name, pass, detail) {
  report.checks.push({ name, pass, detail });
  assert.ok(pass, name + ": " + JSON.stringify(detail));
}
try {
  if (process.env.WORKSHOP_DEPTH === "fallback")
    await page.addInitScript(() => {
      const get = WebGL2RenderingContext.prototype.getExtension;
      WebGL2RenderingContext.prototype.getExtension = function (name) {
        return name === "EXT_clip_control" ? null : get.call(this, name);
      };
    });
  await page.goto((process.argv[2] || "http://127.0.0.1:4198") + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
  const woodFrames = await page.evaluate(() => {
    const frames = [];
    window.bench.scene.traverse((mesh) => {
      if (!mesh.isMesh || !["Oak", "Stand oak"].includes(mesh.material.name)) return;
      const a = mesh.geometry.attributes._wood_coord, p = mesh.geometry.attributes.position;
      let errors = 0, alongX = 0, alongZ = 0;
      if (a?.count === p.count) {
        for (let i = 0; i < p.count; i++) {
          const v = new window.bench.walker.feet.constructor().fromBufferAttribute(p, i)
            .applyMatrix4(mesh.matrixWorld);
          const same = Math.abs(a.getX(i) - v.x) + Math.abs(a.getY(i) - v.y) + Math.abs(a.getZ(i) - v.z);
          const turned = Math.abs(a.getX(i) - v.z) + Math.abs(a.getY(i) - v.y) + Math.abs(a.getZ(i) - v.x);
          if (same < 1e-4) alongX++;
          else if (turned < 1e-4) alongZ++;
          else errors++;
        }
      } else errors++;
      frames.push({ material: mesh.material.name, errors, alongX, alongZ });
    });
    return frames;
  });
  check("both woods retain physical grain coordinates through export", woodFrames.length === 2 &&
    woodFrames.every((f) => f.errors === 0), woodFrames);
  check("desk grain follows slab/back and side rails; stand grain follows its length",
    woodFrames.find((f) => f.material === "Oak")?.alongX > 0 &&
    woodFrames.find((f) => f.material === "Oak")?.alongZ > 0 &&
    woodFrames.find((f) => f.material === "Stand oak")?.alongZ > 0 &&
    woodFrames.find((f) => f.material === "Stand oak")?.alongX === 0, woodFrames);
  const shadows = await page.evaluate(() => {
    const b = window.bench;
    cancelAnimationFrame(b.frame);
    b.frame = 0;
    let calls = 0;
    b.bridgeHolder.onBeforeShadow = () => calls++;
    b.dialHolder.onBeforeShadow = () => calls++;
    const render = () => b.renderer.render(b.scene, b.camera);
    render();
    calls = 0;
    b.camera.rotation.y += 0.01;
    render();
    const walking = calls;
    b.flip.setRest("dial");
    render();
    const dial = calls;
    b.flip.setRest("bridge");
    render();
    const bridge = calls;
    b.bridgeHolder.onBeforeShadow = () => {};
    b.dialHolder.onBeforeShadow = () => {};
    return { walking, dial, bridge, map: b.surfaceLight.shadow.map.width };
  });
  check("camera movement reuses shadow map", shadows.walking === 0, shadows);
  check(
    "both resting poses refresh actual holder shadows",
    shadows.dial > 0 && shadows.bridge > shadows.dial,
    shadows,
  );
  await page.addStyleTag({
    content: ".bench-menu,.bench-start,.bench-menu-backdrop,.bench-legend{display:none!important}",
  });
  const fixtures = [
    { name: "final-overview", position: [0, 180, 225], target: [0, -1, -7], fov: 45 },
    { name: "final-detail", position: [113, 57, 66], target: [68, 1, -12], fov: 42 },
    { name: "final-profile", position: [250, 65, 180], target: [0, -1, -7], fov: 45 },
    { name: "visitor-arrival", feet: [0, 0.002, 54], target: [0, 1.482, -7] },
    { name: "visitor-mat", feet: [-18, 0.002, 47], target: [-14, 0, 34] },
    { name: "visitor-stand", feet: [91, 2.002, 16], target: [82, 2, -7] },
    { name: "visitor-stand-edge", feet: [93, 0.002, 24], target: [92, 1, 19] },
    { name: "visitor-wood", feet: [-20, -0.998, 67], target: [5, -0.6, 59] },
    { name: "visitor-rim", feet: [105, -0.998, -20], target: [113, 0.6, -35] },
  ];
  for (const fixture of fixtures) {
    const details = await page.evaluate((f) => {
      const b = window.bench;
      const position = f.feet ? [f.feet[0], f.feet[1] + 1.48, f.feet[2]] : f.position;
      b.camera.position.fromArray(position);
      b.camera.lookAt(...f.target);
      b.camera.fov = f.fov || 68;
      b.camera.far = 1000;
      b.camera.updateProjectionMatrix();
      b.renderer.setPixelRatio(1);
      b.renderer.render(b.scene, b.camera);
      return {
        position,
        fov: b.camera.fov,
        floor: f.feet ? b.world.floor(f.feet[0], f.feet[2], f.feet[1] + 0.1) : null,
      };
    }, fixture);
    if (fixture.feet)
      check(
        fixture.name + " uses actual surface and 1.48 mm eyes",
        Math.abs(details.floor - fixture.feet[1]) < 0.003,
        details,
      );
    report.fixtures.push({ ...fixture, ...details });
    await page.screenshot({ path: `${out}/${fixture.name}.png` });
    if (fixture.name === "final-overview") {
      const clearMat = await page.evaluate(() => {
        const b = window.bench,
          gl = b.renderer.getContext();
        const sample = () => {
          b.renderer.render(b.scene, b.camera);
          const pixels = new Uint8Array(80 * 20 * 4);
          // Unobstructed front mat, well outside every projected part shadow.
          gl.readPixels(680, 300, 80, 20, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          return pixels;
        };
        const lit = sample();
        b.renderer.shadowMap.enabled = false;
        const unshadowed = sample();
        b.renderer.shadowMap.enabled = true;
        b.renderer.shadowMap.needsUpdate = true;
        b.renderer.render(b.scene, b.camera);
        return lit.reduce((sum, v, i) => sum + Math.abs(v - unshadowed[i]), 0) / lit.length;
      });
      check("unobstructed mat stays free of shadow acne", clearMat < 1, clearMat);
    }
  }
  const releases = await page.evaluate(() => {
    const b = window.bench;
    let count = 0;
    b.surfaceLight.shadow.map.addEventListener("dispose", () => count++);
    b.dispose();
    b.dispose();
    return count;
  });
  check("shadow render target disposes exactly once", releases === 1, releases);
  check("no runtime or shader errors", report.errors.length === 0, report.errors);
} finally {
  await fs.writeFile(`${out}/surface-report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log("Surface checks", report.checks.length);
