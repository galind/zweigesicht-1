import * as THREE from 'three';
import type { MovementViewer } from './MovementViewer';

// Local inspection harness, only exposed by ?inspect=1. These are CAD assembly
// millimetres. Fixed views make before/after comparisons independent of gestures.
export const FROST_VIEWS = [
  'overview',
  'inspection',
  'macro',
  'grazing',
] as const;
export type FrostView = (typeof FROST_VIEWS)[number];
export async function frostReviewView(v: MovementViewer, view: FrostView) {
  v.reset();
  v.setSide('back');
  const start = performance.now();
  while (v.travel || v.presentationMoving || v.needsRender) {
    if (performance.now() - start > 10000)
      throw new Error('Frost view did not settle');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  v.cameraUserOwned = true;
  const portrait = Math.max(1, 0.85 / v.camera.aspect);
  const target =
    view === 'overview' || view === 'inspection'
      ? new THREE.Vector3(0, 0, -2.425)
      : new THREE.Vector3(-8.9, -7.4, -3.4);
  const distance =
    { overview: 76, inspection: 46, macro: 15, grazing: 18 }[view] * portrait;
  const direction =
    view === 'grazing'
      ? new THREE.Vector3(0.8, 0.28, -1).normalize()
      : new THREE.Vector3(view === 'macro' ? 0.18 : 0, 0, -1).normalize();
  v.controls.target.copy(target);
  v.camera.position.copy(target).addScaledVector(direction, distance);
  v.camera.up.set(0, -1, 0);
  v.syncOrbitUp();
  v.controls.update();
  const before = v.renderCount;
  v.invalidate();
  while (v.renderCount === before) {
    if (performance.now() - start > 10000)
      throw new Error('Frost view did not render');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return { view, stats: v.stats() };
}

/** Real canvas video with continuous orbit/dolly; no interpolated still frames. */
export async function recordFrostMotion(v: MovementViewer) {
  if (v.inspectionFrame)
    return { error: 'An inspection capture is already running' };
  const startPosition = v.camera.position.clone();
  const target = v.controls.target.clone();
  const offset = startPosition.clone().sub(target);
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder;
  let mimeType: string;
  try {
    mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    stream = v.renderer.domElement.captureStream(30);
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 10000000,
    });
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    return { error: `Video recording unavailable: ${String(error)}` };
  }
  const chunks: Blob[] = [];
  const intervals: number[] = [];
  const trace: { ms: number; camera: number[] }[] = [];
  let previous = 0,
    first = 0,
    renders = 0;
  recorder.ondataavailable = (event) => chunks.push(event.data);
  const result = new Promise<string>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Video encoder failed'));
    recorder.onstop = () => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Video readback failed'));
      reader.readAsDataURL(new Blob(chunks, { type: mimeType }));
    };
  });
  const reduced = v.reduced;
  // Explicit diagnostic action may animate even when reduced motion is set;
  // normal explorer behavior and the preference itself are never changed.
  // Attach rejection handling immediately while the frame loop is active.
  const encoded = result.then(
    (video) => ({ video }),
    (error: Error) => ({ error: error.message }),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    recorder.start();
    await new Promise<void>((resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error('Recording interrupted or renderer inactive')),
        12000,
      );
      v.inspectionFrame = (now, rendered) => {
        first ||= now;
        const t = Math.min(1, (now - first) / 6000);
        if (rendered) {
          renders++;
          if (previous) intervals.push(now - previous);
          previous = now;
          trace.push({ ms: now - first, camera: v.camera.position.toArray() });
        }
        const phase = t * Math.PI * 2;
        v.camera.position
          .copy(offset)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(phase) * 0.24)
          .multiplyScalar(1 + 0.22 * Math.sin(phase * 2))
          .add(target);
        v.controls.update();
        v.invalidate();
        if (t === 1) {
          v.inspectionFrame = undefined;
          v.camera.position.copy(startPosition);
          v.controls.target.copy(target);
          v.controls.update();
          v.invalidate();
          recorder.stop();
          resolve();
        }
      };
      v.invalidate();
    });
    const sorted = [...intervals].sort((a, b) => a - b);
    const video = await Promise.race([
      encoded,
      new Promise<{ error: string }>((resolve) => {
        clearTimeout(timer);
        timer = setTimeout(
          () => resolve({ error: 'Video readback timed out' }),
          5000,
        );
      }),
    ]);
    return {
      ...video,
      durationMs: previous - first,
      renders,
      intervals,
      trace,
      fovDegrees: v.camera.fov,
      aspect: v.camera.aspect,
      cameraUp: v.camera.up.toArray(),
      p50Ms: sorted[Math.floor(sorted.length * 0.5)],
      p95Ms: sorted[Math.floor(sorted.length * 0.95)],
      viewport: [v.host.clientWidth, v.host.clientHeight],
      camera: startPosition.toArray(),
      target: target.toArray(),
      reduced,
      stats: v.stats(),
      timingScope:
        'Rendered-frame RAF intervals with video encoding overhead; not GPU time or encoded-frame counts.',
    };
  } catch (error) {
    return { error: String(error) };
  } finally {
    clearTimeout(timer);
    v.inspectionFrame = undefined;
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    v.camera.position.copy(startPosition);
    v.controls.target.copy(target);
    v.controls.update();
    v.invalidate();
  }
}
