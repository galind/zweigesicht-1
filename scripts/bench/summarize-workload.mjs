import fs from "node:fs/promises";
export function summarize(report) {
  const pct = (v, p) => {
    v = v.filter(Number.isFinite).sort((a, b) => a - b);
    return v.length ? +v[Math.floor((v.length - 1) * p)].toFixed(2) : null;
  };
  const rows = [...new Set(report.samples.map((s) => s.phase))].map((phase) => {
    const s = report.samples.filter((s) => s.phase === phase),
      times = s.map((s) => s.interval).filter(Number.isFinite);
    return {
      phase,
      n: times.length,
      p50: pct(times, 0.5),
      p95: pct(times, 0.95),
      p99: pct(times, 0.99),
      max: pct(times, 1),
      over25: times.filter((x) => x > 25).length,
      over50: times.filter((x) => x > 50).length,
      cpu95: pct(
        s.map((s) => s.cpu),
        0.95,
      ),
      physics95: pct(
        s.map((s) => s.physics),
        0.95,
      ),
      flip95: pct(
        s.map((s) => s.flip),
        0.95,
      ),
      gpu95: pct(
        s.map((s) => s.gpu),
        0.95,
      ),
      input95: pct(
        s.map((s) => s.inputAge),
        0.95,
      ),
      draws: pct(
        s.map((s) => s.calls),
        0.5,
      ),
      triangles: pct(
        s.map((s) => s.triangles),
        0.5,
      ),
      ratios: [...new Set(s.map((s) => s.ratio))],
      unfocused: s.filter((s) => !s.focused || s.hidden).length,
    };
  });
  return {
    label: report.label,
    viewport: report.viewport,
    dpr: report.dpr,
    gpu: report.gpu,
    depth: report.depth,
    disjoint: report.disjoint,
    rows,
  };
}
if (process.argv[1]?.endsWith("summarize-workload.mjs"))
  for (const file of process.argv.slice(2))
    console.log(JSON.stringify(summarize(JSON.parse(await fs.readFile(file))), null, 2));
