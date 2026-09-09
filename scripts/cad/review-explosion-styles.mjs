import assert from "node:assert/strict";
export function reviewExplosionStyles({ load, parts, initialState, results }) {
  const { styleOffsets } = load("explorer/src/experience/explosionStyles.ts");
  const { EXPLOSION, explosionOffsets } = load("explorer/src/experience/explosion.ts");
  const source = JSON.stringify(parts);
  for (const style of ["current", "layers", "islands", "guided"]) {
    const snapshots = new Map();
    for (const step of [
      ...Array.from({ length: 101 }, (_, i) => i),
      ...Array.from({ length: 101 }, (_, i) => 100 - i),
    ]) {
      const state = { ...initialState, separation: step / 100 };
      const offsets = styleOffsets(parts, state, style);
      const serialized = JSON.stringify([...offsets]);
      if (snapshots.has(step)) assert.equal(serialized, snapshots.get(step));
      snapshots.set(step, serialized);
      assert.equal(offsets.size, 223);
      const hostOffsets = new Map();
      for (const rule of EXPLOSION.parts) {
        const offset = offsets.get(rule.id);
        assert.ok(offset.every(Number.isFinite));
        if (!step || (rule.host === "plate" && style !== "current"))
          assert.ok(offset.every((n) => n === 0));
        if (style !== "current") {
          if (hostOffsets.has(rule.host))
            assert.equal(JSON.stringify(offset), hostOffsets.get(rule.host));
          hostOffsets.set(rule.host, JSON.stringify(offset));
        }
      }
      if (style === "current")
        assert.equal(serialized, JSON.stringify([...explosionOffsets(parts, state)]));
    }
    for (const group of ["regulation", "energy", "transmission", "display", "winding", "shock"]) {
      const state = { ...initialState, group, reveal: 1, partSpread: 0.5 };
      assert.equal(
        JSON.stringify([...styleOffsets(parts, state, style)]),
        JSON.stringify([...explosionOffsets(parts, state)]),
      );
    }
    results.push({
      check: `${style} study: 223 finite translations, exact zero reassembly, 101 reversible samples, rigid hosts and unchanged focused mechanisms`,
      status: "pass",
    });
  }
  assert.equal(JSON.stringify(parts), source);
}
