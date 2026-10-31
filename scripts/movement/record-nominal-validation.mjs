/** Record the timing-only milestone; preserve the original geometry audit. */
import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { MOVEMENT, movementPose } from "../../explorer/src/viewer/RunningMovement.ts";

const root = "artifacts/nominal-movement/";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const hash = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const baseline = read("assets/source-manifest/running-movement.json");
for (const [p, sha] of Object.entries(baseline.generated)) assert.equal(hash(p), sha, p);
assert.equal(MOVEMENT.secondsPerCycle, 1 / 3);
const browser = read(root + "browser-report.json");
assert.ok(browser.checks.length >= 18 && browser.checks.every((c) => c.pass));
assert.equal(browser.errors.length, 0);
const tests = fs.readFileSync(root + "focused-tests.txt", "utf8");
assert.match(tests, /ℹ fail 0/);
assert.match(tests, /ℹ tests 8/);
assert.match(fs.readFileSync(root + "build.txt", "utf8"), /Build complete/);
const sourcePath = root + "maker-watches.html";
assert.match(fs.readFileSync(sourcePath, "utf8"), /3 Hertz/);

// Same normalized poses and identical GPU spring export preserve geometry evidence.
const old = read("artifacts/running-movement/runtime-samples.json");
const current = read(root + "runtime-samples.json");
assert.equal(old.poses.length, 8557);
assert.equal(current.poses.length, old.poses.length);
const maximumDifference = { normalizedTime: 0, balance: 0, pallet: 0, escape: 0 };
old.poses.forEach((a, i) => {
  const b = current.poses[i];
  maximumDifference.normalizedTime = Math.max(
    maximumDifference.normalizedTime,
    Math.abs(a.t / 8 - b.t * 3),
  );
  for (const key of ["balance", "pallet", "escape"])
    maximumDifference[key] = Math.max(maximumDifference[key], Math.abs(a[key] - b[key]));
});
assert.ok(Object.values(maximumDifference).every((v) => v < 1e-10));
assert.equal(
  hash(root + "runtime-spring.bin"),
  hash("artifacts/running-movement/runtime-spring.bin"),
);

const sampling = [15, 30, 60, 120].map((fps) => {
  let maxBalanceStepDegrees = 0,
    maxEscapeStepDegrees = 0;
  // A one-second grid covers three full cycles, including cycle seams.
  for (let i = 1; i <= fps; i++) {
    const a = movementPose((i - 1) / fps, {}),
      b = movementPose(i / fps, {});
    maxBalanceStepDegrees = Math.max(maxBalanceStepDegrees, Math.abs(a.balance - b.balance));
    maxEscapeStepDegrees = Math.max(maxEscapeStepDegrees, Math.abs(a.escape - b.escape));
  }
  return { fps, samplesPerCycle: fps / 3, maxBalanceStepDegrees, maxEscapeStepDegrees };
});
const record = {
  schemaVersion: 1,
  date: "2026-10-27",
  baselineCommit: "bdf8259",
  previousEvidence: "assets/source-manifest/running-movement.json",
  frequencyEvidence: {
    status: "Manufacturer nominal specification, independently corroborated by ratio derivation",
    url: "https://www.marcolangwatches.com/en/watches/",
    section: "Caliber ml-01",
    quote: "frequency 3 Hertz (21.600 osz./ hour)",
    consulted: "2026-10-27",
    localSnapshot: sourcePath,
    sha256: hash(sourcePath),
    cadPage: "https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/",
    cadPageScope: "Assembly provenance; no independent timing specification on the download page",
    frequencyHz: 3,
    beatsPerCycle: 2,
    beatsPerHour: 21600,
    derivation:
      "20 escape teeth: 18 degrees/cycle. Escape pinion 9 / seconds wheel 81: -2 degrees/cycle. Assuming one seconds-shaft revolution per 60 seconds: 360/2/60 = 3 Hz.",
    limitation:
      "Manufacturer nominal rate is not a measurement or dynamic solution of this CAD assembly",
  },
  shaftMeanPeriodsSeconds: {
    escape: 20 / 3,
    seconds: 60,
    third: 562.5,
    center: 3600,
    transfer: 7800,
    barrelII: 24000,
  },
  validation: {
    localNecessity:
      "No push authorized, so new CI unavailable; focused CPU checks and production-browser sampling/performance review were explained before local execution",
    cpuTests: 8,
    typecheck: "passed",
    lint: "passed",
    productionBuild: "passed; existing vinext route-classification notice",
    browserChecks: browser.checks.length,
    sustainedRendering: browser.checks.find((c) => c.name.startsWith("Sustained")).details,
    delayedFrame: browser.checks.find((c) => c.name.startsWith("Visible delayed")).details,
    normalizedPoseCount: current.poses.length,
    maximumDifference,
    gpuSpringExportIdentical: true,
    sampling,
    visualReview:
      "Inspected 20 consecutive nominal 60 FPS macro poses. Spring stays attached; no new pose/geometry discontinuity. Sparse sampling leaves fast balance spokes susceptible to apparent reversal and misses brief release/recoil motion, particularly at 15/30 FPS. No temporal blur or geometry/amplitude changes introduced.",
    scope:
      "One local headless Chrome desktop run; visibility handler exercised through a synthetic hidden-document fixture. Not OS lifecycle, physical-device, thermal or continuous whole-solid qualification. Earlier 171-test/32-flip results remain historical, not rerun here.",
  },
  limitations: [
    "Prescribed kinematics at source-confirmed nominal speed, not physically self-sustaining motion",
    "No new contact-force, elastic dynamics, torque, backlash or mechanical acceptance claim",
    "Mainsprings, arbors, ratchets, barrel I, motion works and hands remain static",
    "Hidden and disassembled time excluded; active-time shaft periods do not represent wall-clock timekeeping",
    "Instantaneous rendering can strobe; low frame rates and delayed frames skip intermediate release/recoil poses without slowing elapsed time",
    "Publication and CAD redistribution gates remain uncleared",
  ],
  implementationSha256: Object.fromEntries(
    [
      "assets/authored/running-movement.json",
      "explorer/src/viewer/RunningMovement.ts",
      "tests/running-movement.test.mjs",
      "scripts/movement/browser-check.mjs",
      "scripts/movement/sample-runtime.mjs",
      "scripts/movement/record-validation.mjs",
      "scripts/movement/record-nominal-validation.mjs",
    ].map((p) => [p, hash(p)]),
  ),
  unchangedGeneratedSha256: baseline.generated,
  inputsSha256: Object.fromEntries(
    [
      "assets/source-manifest/running-movement.json",
      "assets/source-manifest/train-coupling-study.json",
      "artifacts/running-movement/runtime-samples.json",
      "artifacts/running-movement/runtime-spring.bin",
    ].map((p) => [p, hash(p)]),
  ),
  localEvidenceSha256: Object.fromEntries(
    [
      "maker-watches.html",
      "focused-tests.txt",
      "typecheck.txt",
      "lint.txt",
      "build.txt",
      "browser-report.json",
      "runtime-samples.json",
      "runtime-spring.bin",
      "sampling-60fps.png",
      "assembled.png",
      "fitted-front.png",
      "fitted-back.png",
      "bench.png",
      ...Array.from({ length: 20 }, (_, i) => `escapement-frame-${i}.png`),
    ].map((p) => [root + p, hash(root + p)]),
  ),
};
fs.writeFileSync(
  "assets/source-manifest/nominal-operating-speed.json",
  JSON.stringify(record, null, 2) + "\n",
);
console.log(
  JSON.stringify({ maximumDifference, sampling, browserChecks: browser.checks.length }, null, 2),
);
