import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright"
);
const phases = JSON.parse(
  await fs.readFile(
    new URL("../../assets/authored/wheel-display-poses.json", import.meta.url),
    "utf8",
  ),
).wheels;
const out = process.env.PLAY_QA_OUTPUT || "artifacts/bench";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
try {
  await page.goto((process.argv[2] || "http://127.0.0.1:4176") + "/bench?inspect=1");
  await page.waitForFunction(() => window.bench?.status.ready, null, {
    timeout: 90000,
  });
  const report = await page.evaluate(async (phases) => {
    const b = window.bench,
      manifest = await (await fetch("/models/assembly-manifest.json")).json();
    const byId = new Map(manifest.instances.map((p) => [p.id, p]));
    const rawChanges = [];
    const transformErrors = b.movement.children.map((mesh) => {
      const source = byId.get(mesh.userData.partId).worldTransform;
      const expected = source.map((row) => [...row]);
      const phase = phases.find((p) => p.leafId === mesh.userData.partId);
      if (phase) {
        if (phase.pivotLocalMm.some((v) => v !== 0)) throw Error("Update independent pivot audit");
        const angle = (phase.localZDegrees * Math.PI) / 180,
          c = Math.cos(angle),
          s = Math.sin(angle);
        for (let row = 0; row < 3; row++) {
          expected[row][0] = source[row][0] * c + source[row][1] * s;
          expected[row][1] = -source[row][0] * s + source[row][1] * c;
        }
      }
      const rawError = Math.max(
        ...mesh.matrix.elements.map((v, i) => Math.abs(v - source[i % 4][Math.floor(i / 4)])),
      );
      if (rawError > 1e-12) rawChanges.push(mesh.userData.partId);
      return Math.max(
        ...mesh.matrix.elements.map((v, i) => Math.abs(v - expected[i % 4][Math.floor(i / 4)])),
      );
    });
    const drops = [];
    const collisionPoseErrors = [];
    for (const side of ["bridge", "dial"]) {
      b.present(side);
      for (const phase of phases) {
        const solid = b.world.solids.find((s) => s.mesh.userData.partId === phase.leafId);
        if (!solid) throw Error("Phased wheel missing from collision world");
        const identity = solid.inverse.clone().multiply(solid.mesh.matrixWorld);
        collisionPoseErrors.push(
          Math.max(...identity.elements.map((v, i) => Math.abs(v - (i % 5 === 0 ? 1 : 0)))),
        );
      }
      for (const [x, z] of [
        [-12, 0],
        [-6, 5],
        [6, 10],
        [-10, -5],
        [3, 8],
        [8, 8],
        [-8, 4],
        [10, -4],
      ]) {
        const floor = b.world.floor(x, z);
        b.walker.clear();
        b.walker.grounded = false;
        b.walker.feet.set(x, floor + 0.5, z);
        for (let i = 0; i < 180; i++) b.walker.update(1 / 180);
        drops.push({
          side,
          x,
          z,
          visibleFloor: floor,
          feet: b.walker.feet.toArray(),
          grounded: b.walker.grounded,
          pass: b.walker.feet.y >= floor - 0.08,
        });
      }
    }
    // These include plate holes and inter-part openings, with lower actual support.
    const heights = [];
    for (let x = -12; x <= 12; x += 1)
      for (let z = -12; z <= 12; z += 1) if (x * x + z * z < 180) heights.push(b.world.floor(x, z));
    return {
      rawChanges,
      maxPresentationMatrixError: Math.max(...transformErrors),
      maxCollisionPoseError: Math.max(...collisionPoseErrors),
      drops,
      dialHeightRange: [Math.min(...heights), Math.max(...heights)],
      lowerOpenings: heights.filter((y) => y < 15.5).length,
    };
  }, phases);
  await fs.writeFile(out + "/collision-report.json", JSON.stringify(report, null, 2));
  assert.deepEqual(report.rawChanges.sort(), phases.map((p) => p.leafId).sort());
  assert.ok(report.maxPresentationMatrixError < 1e-12);
  assert.ok(report.maxCollisionPoseError < 1e-12);
  assert.ok(
    report.drops.every((d) => d.pass),
    JSON.stringify(report.drops.filter((d) => !d.pass)),
  );
  assert.ok(report.lowerOpenings > 0);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
