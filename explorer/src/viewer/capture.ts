import type { MovementViewer } from './MovementViewer';

export type MotionCase =
  | 'separate'
  | 'scrub'
  | 'spread'
  | 'interrupt'
  | 'dials'
  | 'flip';
/** Local inspection only. Sample real rendered frames, never fabricated tween frames. */
export async function captureMotion(v: MovementViewer, kind: MotionCase) {
  v.reset();
  if (kind === 'dials') await v.showDial('central');
  const scrub = (patch: Parameters<MovementViewer['patch']>[0]) =>
    v.scrub ? v.scrub(patch) : v.patch(patch);
  const frames: { ms: number; image: string }[] = [];
  const steps: [number, () => void][] =
    kind === 'flip'
      ? [
          [0, () => v.flipMovement()],
          [2300, () => v.flipMovement()],
        ]
      : kind === 'separate'
        ? [
            [0, () => v.patch({ separation: 1 })],
            [1800, () => v.patch({ separation: 0 })],
          ]
        : kind === 'dials'
          ? [
              [0, () => void v.showDial('small')],
              [1600, () => void v.showDial('central')],
            ]
          : kind === 'scrub'
            ? [
                [0, () => scrub({ separation: 0.2 })],
                [200, () => scrub({ separation: 0.5 })],
                [400, () => scrub({ separation: 0.8 })],
                [600, () => scrub({ separation: 1 })],
                [800, () => scrub({ separation: 0.65 })],
                [1000, () => scrub({ separation: 0.25 })],
                [1200, () => scrub({ separation: 0 })],
              ]
            : kind === 'spread'
              ? [
                  [0, () => v.allParts()],
                  [2000, () => v.back()],
                ]
              : [
                  [0, () => v.patch({ separation: 0.45 })],
                  [300, () => v.setSide('front')],
                  [600, () => v.allParts()],
                  [950, () => v.group('regulation')],
                  [1250, () => v.allParts()],
                  [1550, () => v.back()],
                  [1850, () => v.reset()],
                ];
  return new Promise<unknown>((resolve) => {
    let start = 0,
      next = 0,
      sampled = -100;
    v.inspectionFrame = (now, rendered) => {
      if (!start) {
        if (v.travel || v.presentationMoving) return;
        start = now;
      }
      const ms = now - start;
      // Read the frame before requesting the next destination; timestamp records actual sampling.
      if (rendered && ms - sampled >= 95) {
        frames.push({
          ms,
          image: v.renderer.domElement.toDataURL('image/png'),
        });
        sampled = ms;
      }
      while (next < steps.length && ms >= steps[next][0]) steps[next++][1]();
      if (ms < (kind === 'flip' ? 4700 : 4000)) v.invalidate();
      else {
        v.inspectionFrame = undefined;
        resolve({
          kind,
          viewport: [v.host.clientWidth, v.host.clientHeight],
          duration: ms,
          frames,
        });
      }
    };
    v.invalidate();
  });
}
