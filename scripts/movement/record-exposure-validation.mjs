/** Record the completed local balance-rendering audit without changing earlier evidence. */
import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const root = "artifacts/balance-exposure/";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const hash = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const browser = read(root + "browser-report.json"),
  exposure = read(root + "exposure-report.json");
assert.equal(browser.checks.length, 18);
assert.ok(browser.checks.every((c) => c.pass));
assert.equal(browser.errors.length, 0);
assert.equal(exposure.errors.length, 0);
assert.equal(exposure.comparisons.length, 12);
assert.equal(exposure.profiles.length, 2);
assert.ok(exposure.shaderAudit.every((s) => s.instancing && s.mask));
for (let i = 0; i < exposure.comparisons.length; i += 2)
  assert.deepEqual(exposure.comparisons[i].pose, exposure.comparisons[i + 1].pose);
const tests = fs.readFileSync(root + "movement-tests.txt", "utf8");
assert.match(tests, /ℹ tests 9/);
assert.match(tests, /ℹ fail 0/);
assert.match(fs.readFileSync(root + "build.txt", "utf8"), /Build complete/);
const nominal = read("assets/source-manifest/nominal-operating-speed.json");
for (const [p, h] of Object.entries(nominal.unchangedGeneratedSha256)) assert.equal(hash(p), h);
const record = {
  schemaVersion: 1,
  date: "2026-10-27",
  baselineCommit: "38fc38a",
  frequencyEvidence: "assets/source-manifest/nominal-operating-speed.json",
  method:
    "Rendering-only, nine spatially dithered shutter poses of balance rim definition 110 and four eccentrics 111; centered half-frame exposure capped at 1/120 second, from the existing active-time clock",
  unchanged: [
    "3 Hz frequency",
    "±180 degree balance amplitude",
    "exact source-mesh matrices",
    "gear ratios, recoil and accumulated shaft phases",
    "hairspring/collet and escapement coupling",
    "source and generated geometry",
  ],
  lifecycle:
    "No frame history. First/resumed frame is sharp; inspection/separation restores source visibility. Proxies share source geometry, own only materials/instance buffers, ignore picking and are removed on disposal.",
  shading:
    "Opaque per-pixel sample selection retains scene depth ordering. Authored finish basis includes instance transform. Contact shading uses the exact center pose, not shutter instances.",
  validation: {
    localNecessity:
      "Explained before execution: no push authorized and the rendering tradeoff requires local GPU inspection/performance comparison",
    cpuTests: 9,
    typecheck: "passed",
    lint: "passed",
    productionBuild: "passed",
    browserChecks: 18,
    pairedPoseChecks: 6,
    shaderPrograms: exposure.shaderAudit.length,
    pairedProfiles: exposure.profiles,
    sustainedRendering: browser.checks.find((c) => c.name.startsWith("Sustained")).details,
    imageComparison: read(root + "image-comparison.json"),
  },
  limitations: [
    "Stochastic exposure is a rendering approximation; fine pixel dithering remains visible at extreme zoom, especially low pixel density",
    "Cannot eliminate temporal aliasing at very low frame rates; shutter is capped rather than stretching across delayed/hidden frames",
    "Contact shading and attached staff/roller/collet/hairspring use the instantaneous center pose",
    "Paired measurements are one local desktop Chrome session under concurrent application load, not a device-performance guarantee",
    "Prescribed motion remains kinematic, not physically self-sustaining; hands/motion works and release gates remain unchanged",
  ],
  unchangedGeneratedSha256: nominal.unchangedGeneratedSha256,
  implementationSha256: Object.fromEntries(
    [
      "explorer/src/viewer/BalanceExposure.ts",
      "explorer/src/viewer/RunningMovement.ts",
      "explorer/src/viewer/SurfaceOcclusion.ts",
      "explorer/tsconfig.json",
      "tests/running-movement.test.mjs",
      "scripts/movement/exposure-check.mjs",
      "scripts/movement/record-exposure-validation.mjs",
    ].map((p) => [p, hash(p)]),
  ),
  localEvidenceSha256: Object.fromEntries(
    [
      "movement-tests.txt",
      "typecheck.txt",
      "lint.txt",
      "build.txt",
      "browser-report.json",
      "exposure-report.json",
      "image-comparison.json",
      ...[0, 4, 5, 6, 10, 15].flatMap((i) => [`sharp-${i}.png`, `exposed-${i}.png`]),
    ].map((p) => [root + p, hash(root + p)]),
  ),
};
fs.writeFileSync(
  "assets/source-manifest/balance-exposure.json",
  JSON.stringify(record, null, 2) + "\n",
);
console.log(JSON.stringify(record.validation, null, 2));
