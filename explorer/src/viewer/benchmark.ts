import type { MovementViewer } from './MovementViewer';

export interface Benchmark {
  onFrame: (viewer: MovementViewer, now: number, interval: number) => void;
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
    onFrame(viewer, now, interval) {
      benchmarkFrame(viewer, this, now, interval);
    },
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
