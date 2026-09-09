import type { MovementViewer } from './MovementViewer';
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
export async function runBrowserChecks(v: MovementViewer) {
  if (!v.ready) throw new Error('Movement not ready');
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  v.reset();
  await sleep(1800);
  const before = v.stats();
  const ids = [
    'regulation',
    'energy',
    'transmission',
    'display',
    'winding',
    'shock',
  ];
  for (let i = 0; i < 20; i++) {
    v.group(ids[i % ids.length]);
    await sleep(90);
  }
  v.reset();
  await sleep(1900);
  checks.push({
    name: '20 interrupted reveals return to exact assembly',
    pass: v.assemblyError() === 0,
    details: v.assemblyError(),
  });
  v.group('regulation');
  await sleep(1800);
  v.patch({ reveal: 0 });
  await sleep(1900);
  checks.push({
    name: 'Uncover reversal restores all default movement visibility',
    pass:
      [...v.renderParts.values()].filter((p) => p.mesh.visible).length === 221,
  });
  v.patch({ separation: 0.65, partSpread: 0.3 });
  await sleep(1800);
  v.patch({ separation: 0, partSpread: 0, reveal: 0 });
  await sleep(1900);
  checks.push({
    name: 'Layer and component separation restore exact source matrices',
    pass: v.assemblyError() === 0,
    details: v.assemblyError(),
  });
  const essential = [...v.renderParts.values()].filter((p) =>
    ['112', '114', '116', '126', '127', '128', '129', '130', '96'].some(
      (id) => p.source.definitionId === `d_0_1_1_${id}`,
    ),
  );
  checks.push({
    name: 'All ten former playback omissions remain visible at rest',
    pass: essential.length === 10 && essential.every((p) => p.mesh.visible),
    details: essential.map((p) => ({
      id: p.source.id,
      visible: p.mesh.visible,
    })),
  });
  v.reset();
  await sleep(1900);
  const after = v.stats();
  checks.push({
    name: 'No GPU resource growth across switches',
    pass:
      before.geometries === after.geometries &&
      before.textures === after.textures,
    details: {
      before: { geometries: before.geometries, textures: before.textures },
      after: { geometries: after.geometries, textures: after.textures },
    },
  });
  const first = v.renderCount;
  await sleep(500);
  checks.push({
    name: 'Static assembly renders on demand',
    pass: v.renderCount - first <= 1,
    details: { additionalRenders: v.renderCount - first },
  });
  return {
    scope: 'Real in-app browser; local automated state/renderer checks',
    at: new Date().toISOString(),
    checks,
    stats: after,
  };
}
export interface Benchmark {
  start: number;
  duration: number;
  phase: number;
  frames: number[][];
  done: boolean;
  result?: unknown;
}
export function startBenchmark(v: MovementViewer, seconds: number): Benchmark {
  v.reset();
  v.frameIntervals = [];
  return {
    start: performance.now(),
    duration: seconds * 1000,
    phase: -1,
    frames: [[], [], []],
    done: false,
  };
}
export function benchmarkFrame(
  v: MovementViewer,
  b: Benchmark,
  now: number,
  interval: number,
) {
  if (b.done) return;
  const elapsed = now - b.start;
  if (elapsed >= b.duration) {
    b.done = true;
    b.result = {
      scope:
        'Desktop in-app browser, real rendered frames; not phone or thermal certification',
      elapsedMs: elapsed,
      visibleFrameTimeMs: b.frames.flat().reduce((a, b) => a + b, 0),
      viewport: [v.host.clientWidth, v.host.clientHeight],
      pixelRatio: v.renderer.getPixelRatio(),
      phases: b.frames.map((values, i) => {
        const sorted = [...values].sort((a, b) => a - b),
          sum = values.reduce((a, b) => a + b, 0);
        return {
          name: [
            'assembled orbit',
            'revealed mechanism orbit',
            'separated orbit',
          ][i],
          samples: values.length,
          meanFrameMs: sum / values.length,
          p95FrameMs: sorted[Math.floor((sorted.length - 1) * 0.95)],
          maxFrameMs: sorted.at(-1),
        };
      }),
      stats: v.stats(),
    };
    v.emit();
    return;
  }
  const phase = Math.floor(elapsed / 20000) % 3;
  if (phase !== b.phase) {
    b.phase = phase;
    if (phase === 0) v.reset();
    if (phase === 1) {
      v.group('regulation');
    }
    if (phase === 2) {
      v.reset();
      v.patch({ separation: 0.65 });
    }
  }
  if (!v.travel) v.orbit(0.002, 0);
  if (interval > 0) b.frames[phase].push(interval);
}
