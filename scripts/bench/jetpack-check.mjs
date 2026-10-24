/** Actual keyboard journey, then explicitly synthetic collision/boundary fixtures. */
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
const out = process.env.PLAY_QA_OUTPUT || "artifacts/jetpack";
await fs.mkdir(out, { recursive: true });
const report = { checks: [], views: [], errors: [] };
page.on("pageerror", (e) => report.errors.push(e.message));
const check = (name, pass, detail) => {
  report.checks.push({ name, pass, detail });
  assert.ok(pass, name + ": " + JSON.stringify(detail));
};
const snap = () =>
  page.evaluate(() => {
    const b = window.bench,
      w = b.walker;
    return {
      feet: w.feet.toArray(),
      velocity: w.velocity.toArray(),
      eye: b.camera.position.toArray(),
      grounded: w.grounded,
      keys: [...w.keys],
      resets: w.resets,
      captured: b.status.captured,
    };
  });
const wait = (ms) => page.waitForTimeout(ms);
const capture = async () => {
  await page.getByRole("button", { name: "Enter the movement", exact: true }).click();
  await page.waitForFunction(() => window.bench.status.captured);
};
const shot = async (name) => {
  report.views.push({ name, ...(await snap()) });
  await page.screenshot({ path: out + "/" + name + ".png" });
};
async function flyTo(x, z, name) {
  await page.keyboard.down("Space");
  await page.waitForFunction(() => window.bench.walker.feet.y > 25, null, {
    timeout: 12000,
    polling: 16,
  });
  await page.keyboard.up("Space");
  await page.evaluate(
    ({ x, z }) => {
      const b = window.bench;
      b.walker.yaw = Math.atan2(-(x - b.walker.feet.x), -(z - b.walker.feet.z));
      b.walker.pitch = -0.35;
      b.wake();
    },
    { x, z },
  );
  await page.keyboard.down("KeyW");
  let thrust = false,
    done = false;
  // Test driver pulses the actual key; the application has no altitude controller.
  for (let i = 0; i < 400; i++) {
    const s = await snap();
    if (Math.hypot(x - s.feet[0], z - s.feet[2]) < 0.8) {
      done = true;
      break;
    }
    const next = s.velocity[1] < 1.5 * (26 - s.feet[1]);
    if (next !== thrust) {
      await page.keyboard[next ? "down" : "up"]("Space");
      thrust = next;
    }
    if (i === 15) await shot(name + "-approach");
    await wait(60);
  }
  await page.keyboard.up("KeyW");
  await page.keyboard.up("Space");
  check(name + " reachable by keyboard flight", done, await snap());
  await page.waitForFunction(() => window.bench.walker.grounded, null, {
    timeout: 12000,
    polling: 16,
  });
  await wait(300);
  const s = await snap();
  check(
    name + " lands on real movement",
    s.grounded && s.feet[1] > 9 && Math.hypot(x - s.feet[0], z - s.feet[2]) < 1,
    s,
  );
  check(name + " eye remains 1.48 mm above feet", Math.abs(s.eye[1] - s.feet[1] - 1.48) < 1e-8, s);
  await shot(name + "-landed");
}
try {
  await page.goto((process.argv[2] || "http://127.0.0.1:4185") + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, { timeout: 90000 });
  await capture();
  await wait(300);
  const initial = await snap();
  check(
    "real arrival on mat, both full stations visible",
    Math.abs(initial.feet[1]) < 0.001 &&
      (await page.evaluate(() =>
        window.bench.stations.every((s) => s.root.visible && s.movement.children.length === 227),
      )),
    initial,
  );
  await shot("default-arrival");
  await page.keyboard.down("Space");
  await wait(450);
  const lift = await snap();
  check(
    "takeoff accelerates",
    !lift.grounded && lift.velocity[1] > 0 && lift.velocity[1] < 5,
    lift,
  );
  await wait(1400);
  const sustained = await snap();
  check("held thrust sustains ascent", sustained.feet[1] > lift.feet[1] + 5, sustained);
  await page.keyboard.up("Space");
  await wait(90);
  const coast = await snap();
  check(
    "release coasts upward",
    coast.feet[1] > sustained.feet[1] &&
      coast.velocity[1] > 0 &&
      coast.velocity[1] < sustained.velocity[1],
    coast,
  );
  await wait(650);
  const fall = await snap();
  check("gravity produces fall", fall.velocity[1] < -3, fall);
  await page.keyboard.down("Space");
  await wait(90);
  const brake = await snap();
  check(
    "thrust brakes descent before climbing",
    brake.velocity[1] < 0 && brake.velocity[1] > fall.velocity[1],
    brake,
  );
  await wait(900);
  check("continued thrust reverses descent", (await snap()).velocity[1] > 0, await snap());
  await page.keyboard.up("Space");
  await page.waitForFunction(() => window.bench.walker.grounded, null, { timeout: 8000 });
  check("lands naturally back on mat", Math.abs((await snap()).feet[1]) < 0.001, await snap());
  await flyTo(-39, -7, "bridge");
  await flyTo(15, -7, "dial");
  check(
    "both movements explored without reset or swap",
    (await snap()).resets === initial.resets,
    await snap(),
  );
  // Lifecycle events while actually thrusting.
  for (const event of ["Escape", "blur", "hidden"]) {
    await page.keyboard.down("Space");
    await page.keyboard.down("KeyW");
    await wait(150);
    if (event === "Escape") await page.keyboard.press("Escape");
    else
      await page.evaluate((event) => {
        if (event === "hidden") {
          Object.defineProperty(document, "hidden", { configurable: true, value: true });
          document.dispatchEvent(new Event("visibilitychange"));
        } else window.dispatchEvent(new Event("blur"));
      }, event);
    await wait(50);
    const s = await snap();
    check(event + " clears all held controls and thrust", !s.keys.length && !s.captured, s);
    if (event === "hidden")
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      });
    await page.keyboard.up("Space");
    await page.keyboard.up("KeyW");
    await capture();
  }
  // Independent geometry fixtures do not qualify the keyboard journey above.
  await page.keyboard.press("Escape");
  report.fixtures = await page.evaluate(() => {
    const b = window.bench,
      w = b.walker,
      rows = [];
    cancelAnimationFrame(b.frame);
    b.frame = 0;
    const advance = (n) => {
      for (let i = 0; i < n; i++) w.update(1 / 180);
    };
    const setup = (x, y, z) => {
      w.clear();
      w.velocity.set(0, 0, 0);
      w.feet.set(x, y, z);
      w.grounded = false;
      w.yaw = 0;
    };
    for (const y of [-0.12, 50, 500])
      for (const dx of [-1, 0, 1])
        for (const dz of [-1, 0, 1]) {
          if (!dx && !dz) continue;
          const B = w.bounds,
            x = dx < 0 ? B.minX + 0.221 : dx > 0 ? B.maxX - 0.221 : 0,
            z = dz < 0 ? B.minZ + 0.221 : dz > 0 ? B.maxZ - 0.221 : 40;
          setup(x, y, z);
          advance(10);
          if (dx) w.keys.add(dx < 0 ? "KeyA" : "KeyD");
          if (dz) w.keys.add(dz < 0 ? "KeyW" : "KeyS");
          w.velocity.set(dx * 100, 0, dz * 100);
          w.update(10);
          advance(180);
          rows.push({
            name: `edge/corner ${dx},${dz} at ${y}`,
            pass:
              w.feet.x >= B.minX + 0.22 &&
              w.feet.x <= B.maxX - 0.22 &&
              w.feet.z >= B.minZ + 0.22 &&
              w.feet.z <= B.maxZ - 0.22,
            feet: w.feet.toArray(),
          });
        }
    for (const y of [-0.12, 50])
      for (const side of ["minX", "maxX", "minZ", "maxZ"]) {
        const B = w.bounds,
          isX = side.endsWith("X"),
          negative = side.startsWith("min");
        setup(
          isX ? B[side] + (negative ? 0.22 : -0.22) : 0,
          y,
          isX ? 40 : B[side] + (negative ? 0.22 : -0.22),
        );
        w.keys.add(isX ? (negative ? "KeyA" : "KeyD") : negative ? "KeyW" : "KeyS");
        w.keys.add(isX ? "KeyW" : "KeyD");
        advance(180);
        rows.push({
          name: `slide ${side} at ${y}`,
          pass: isX ? w.feet.z < 37 : w.feet.x > 3,
          feet: w.feet.toArray(),
        });
      }
    for (const st of b.stations) {
      // Original holder wall, then the movement top and its underside.
      setup(st.x, 2, st.z + 24);
      w.keys.add("KeyW");
      advance(360);
      rows.push({
        name: st.id + " holder side",
        pass: w.feet.z > st.z + 19,
        feet: w.feet.toArray(),
      });
      setup(st.x - 12, 25, st.z);
      advance(540);
      rows.push({
        name: st.id + " movement from above",
        pass: w.grounded && w.feet.y > 9,
        feet: w.feet.toArray(),
      });
      // A ray query identifies a real source underside in the inner well.
      const floor = b.world.floor(st.x - 12, st.z, 10);
      setup(st.x - 12, floor + 0.001, st.z);
      const start = w.feet.clone();
      b.world.resolve(w.feet);
      const initiallyClear = w.feet.distanceTo(start) < 0.002;
      w.keys.add("Space");
      advance(360);
      rows.push({
        name: st.id + " movement underside",
        pass: initiallyClear && w.feet.y > floor + 0.1 && w.feet.y < 13 && w.velocity.y === 0,
        feet: w.feet.toArray(),
        floor,
        initiallyClear,
      });
    }
    // Continuous ground circuit, no position changes between its waypoints.
    setup(-55, 0.001, 40);
    advance(30);
    for (const [x, z] of [
      [-55, -35],
      [55, -35],
      [55, 40],
      [0, 40],
      [0, -35],
    ]) {
      w.clear();
      w.velocity.set(0, 0, 0);
      w.yaw = Math.atan2(-(x - w.feet.x), -(z - w.feet.z));
      w.keys.add("KeyW");
      let reached = false;
      for (let i = 0; i < 5000; i++) {
        w.update(1 / 180);
        if (Math.hypot(w.feet.x - x, w.feet.z - z) < 0.1) {
          reached = true;
          break;
        }
      }
      rows.push({
        name: `ground circulation ${x},${z}`,
        pass: reached && w.grounded,
        feet: w.feet.toArray(),
      });
    }
    setup(0, 35, 40);
    advance(900);
    rows.push({
      name: "real mat catches falling visitor",
      pass: w.grounded && Math.abs(w.feet.y) < 0.001,
      feet: w.feet.toArray(),
    });
    return rows;
  });
  for (const f of report.fixtures) check(f.name, f.pass, f);
  check("no browser errors", report.errors.length === 0, report.errors);
  console.log(JSON.stringify({ checks: report.checks.length, views: report.views }, null, 2));
} finally {
  await fs.writeFile(out + "/jetpack-report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
