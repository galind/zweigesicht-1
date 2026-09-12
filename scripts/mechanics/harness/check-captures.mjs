/** Validate exported real-renderer evidence. Capture through the visible harness button; see M1_REPORT.md. */
import assert from "node:assert/strict";
import fs from "node:fs";
import { load, root } from "./test-loader.mjs";
const { bases } = load("scripts/mechanics/harness/bases.ts");
const { parameters, manifest, dials } = load("scripts/mechanics/harness/parameters.ts");
const { evaluate, compose } = load("scripts/mechanics/harness/foundation.ts");
const dir = root + "/artifacts/mechanics/running-movement/m1/";
const data = JSON.parse(fs.readFileSync(dir + "renderer-poses.json"));
const styles = JSON.parse(fs.readFileSync(dir + "all-styles-renderer.json"));
const plain = (x) => JSON.parse(JSON.stringify(x));
const lift = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 12, 0, 0, 0, 1];
const prefix = "p_0_1_1_1__0_1_1_1_4__0_1_1_83_";
const essential = new Set([
  ...parameters.shafts.filter((s) => !s.id.includes("-")).flatMap((s) => s.members),
  ...parameters.deformations.map((d) => d.id),
]);
let maxComputedError = 0;
for (const capture of [data.poseOne, data.rawPose, data.restored, ...styles]) {
  assert.ok(capture.ready);
  assert.equal(capture.meshes.length, 364);
  const actual = new Map(capture.meshes.map((m) => [m.id, m]));
  assert.equal(actual.size, 364);
  const pose = evaluate(
    capture.time,
    capture.raw ? { kind: "sourceRest" } : capture.state,
    parameters,
  );
  for (const base of bases) {
    const m = actual.get(base.id);
    if (!m) {
      assert.equal(manifest.instances.find((p) => p.id === base.id).definitionId, "d_0_1_1_225");
      continue;
    }
    assert.deepEqual(m.worldMatrix, m.matrix, "Flat world ownership: " + m.id);
    const cover = [6, 16, 59, 60, 64, 23, 24, 34, 35].some(
      (i) => base.id === prefix + i || base.id.startsWith(prefix + i + "__"),
    );
    const expected = compose(
      base,
      pose,
      capture.raw ? "raw" : "fitted",
      capture.lift && cover && !essential.has(base.id) ? lift : undefined,
    );
    if (capture.raw) assert.deepEqual(m.matrix, plain(expected), "Raw source exact: " + m.id);
    else
      for (let i = 0; i < 16; i++) {
        const error = Math.abs(m.matrix[i] - expected[i]);
        maxComputedError = Math.max(maxComputedError, error);
        assert.ok(error <= 1e-10, "Cross-runtime computed matrix budget: " + m.id);
      }
    if (essential.has(m.id) || m.id.startsWith("p_0_1_1_1__0_1_1_1_4__"))
      assert.equal(m.visible, true, "Essential source contact/spring visible");
  }
  for (const [face, display] of Object.entries(capture.displays)) {
    if (!display.visible) continue;
    const style = dials.faces[face].styles.find((s) => s.id === display.style);
    for (const id of style.leafIds)
      assert.equal(actual.get(id).visible, true, "Complete fitted hand set");
  }
}
assert.deepEqual(data.poseOne.meshes, data.restored.meshes);
assert.equal(data.renderChecks.exactSeek, true);
assert.equal(new Set(styles.map((s) => s.displays.central.style)).size, 3);
assert.equal(new Set(styles.map((s) => s.displays.small.style)).size, 3);
console.log(
  "PASS: six renderer captures; 364 loaded source meshes per capture; exact world ownership and budgeted computed composition, raw restoration, essential contact/spring presence and all six fitted hand styles. Empty STEP diamond 225 retained as metadata; no STL recovery claimed by this harness.",
);

console.log({ maxComputedError });
