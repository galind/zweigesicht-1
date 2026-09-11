import { focusRole, focusCover } from '../experience/emphasis';
import {
  GROUPS,
  ROOT,
  PREFIX,
  belongs,
  inMembers,
} from '../experience/catalog';
import { fittedLeaves, type DialPreferences } from '../experience/dials';
import { uncoverHost } from '../experience/explosion';
import { EMPHASIS, finishFor, type EmphasisRole } from './materials';
import type { MovementViewer } from './MovementViewer';
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
async function settle(v: MovementViewer) {
  const start = performance.now();
  do {
    await sleep(50);
  } while (
    (v.travel || v.presentationMoving || v.needsRender) &&
    performance.now() - start < 8000
  );
  if (v.travel || v.presentationMoving)
    throw new Error('Presentation did not settle');
}
export async function runBrowserChecks(v: MovementViewer) {
  if (!v.ready) throw new Error('Movement not ready');
  const canvas = v.renderer.domElement;
  const preferenceKeys = [
    'centralVisible', 'smallVisible', 'centralStyle', 'smallStyle',
  ] as const satisfies readonly (keyof DialPreferences)[];
  const preferences = { ...v.state };
  const dialCount = fittedLeaves(preferences).size;
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  v.reset();
  await settle(v);
  // First selection uploads the one persistent outline geometry. Warm it before
  // comparing repeated interactions, then verify no subsequent growth.
  const sample = [...v.spread.keys()].find(
    (id) => v.renderParts.get(id)?.source.definitionId === 'd_0_1_1_225',
  )!;
  await v.select(sample);
  await settle(v);
  v.reset();
  await settle(v);
  const before = v.stats();
  const ids = [
    'regulation',
    'energy',
    'transmission',
    'display',
    'winding',
    'shock',
  ];
  for (const id of ids) {
    v.group(id);
    await settle(v);
    const unstyled = [...v.renderParts.values()]
      .filter((p) => p.mesh.visible)
      .filter(
        (p) =>
          (p.material.userData.finishEnabled as { value?: number } | undefined)
            ?.value !== 1,
      );
    checks.push({
      name: `${id} keeps authored finishes on every visible part`,
      pass: unstyled.length === 0,
      details: unstyled.map((p) => p.source.id),
    });
  }
  // Exercise the actual rendered materials after mechanism changes and orbit.
  for (const group of GROUPS) {
    v.group(group.id);
    await settle(v);
    const focusPoints = v
      .targetPoints(
        (p) =>
          inMembers(p.source.id, group.members) &&
          !group.partObstructions?.some((suffix) =>
            belongs(p.source.id, PREFIX + suffix),
          ),
      )
      .map((point) => point.project(v.camera));
    const xs = focusPoints.map((p) => p.x),
      ys = focusPoints.map((p) => p.y);
    const width =
      ((Math.max(...xs) - Math.min(...xs)) * canvas.clientWidth) / 2;
    const height =
      ((Math.max(...ys) - Math.min(...ys)) * canvas.clientHeight) / 2;
    const occupancy =
      Math.max(width, height) /
      Math.min(canvas.clientWidth, canvas.clientHeight);
    checks.push({
      name: `${group.id} focus is readable and fits the viewport`,
      pass:
        occupancy >= 0.28 &&
        focusPoints.every((p) => Math.abs(p.x) < 1 && Math.abs(p.y) < 1),
      details: { occupancy },
    });
    v.orbit(0.35, 0.15);
    v.scrub({ partSpread: 0.35 });
    await settle(v);
    const failures: string[] = [];
    for (const p of v.renderParts.values()) {
      const id = p.source.id;
      if (!belongs(id, ROOT) || id === PREFIX + '66') continue;
      const role: EmphasisRole = focusRole(id, p.source.definitionId, group);
      const finish = finishFor(p.source.name, p.source.definitionId, id);
      if (
        p.material.userData.emphasisRole !== role ||
        p.material.userData.emphasis.value.x !== EMPHASIS[role][0] ||
        p.material.userData.emphasis.value.y !== EMPHASIS[role][1] ||
        p.material.color.getHex() !== finish.color ||
        p.material.roughness !== finish.roughness ||
        p.material.metalness !== finish.metalness ||
        p.material.opacity !== 1 ||
        !p.material.depthWrite ||
        p.mesh.visible !==
          (role !== 'surrounding' &&
            !focusCover(id, group) &&
            !(
              uncoverHost(id, group.id) &&
              p.offset.length() > 24 &&
              role !== 'member'
            ))
      )
        failures.push(id);
    }
    checks.push({
      name: `${group.id} preserves emphasis, physical finishes and context through orbit/separation`,
      pass: !failures.length,
      details: failures,
    });
  }
  v.reset();
  await settle(v);
  for (let i = 0; i < 24; i++) {
    v.scrub({ separation: (i % 5) / 5 });
    if (i % 4 === 0) v.setSide('front');
    if (i % 4 === 1) v.view('oblique');
    v.allParts();
    await sleep(30);
    v.group(ids[i % ids.length]);
    await sleep(30);
    v.patch({ reveal: 0.7, partSpread: 0.45 });
    await sleep(30);
    v.allParts();
    await sleep(30);
    await v.select(sample);
    v.patch({ isolated: true });
    await sleep(30);
    v.back();
    if (i % 3 === 0) v.reset();
  }
  v.reset();
  await settle(v);
  v.group('energy');
  await settle(v);
  v.scrub({ partSpread: 0.35 });
  await settle(v);
  const prior = {
    state: { ...v.state },
    position: v.camera.position.clone(),
    target: v.controls.target.clone(),
  };
  v.allParts();
  await sleep(150);
  v.back();
  await settle(v);
  checks.push({
    name: 'Back restores prior section, separation and camera after interrupted entry',
    pass:
      v.state.group === prior.state.group &&
      v.state.partSpread === prior.state.partSpread &&
      v.camera.position.distanceTo(prior.position) < 1e-6 &&
      v.controls.target.distanceTo(prior.target) < 1e-6,
  });
  v.allParts();
  await sleep(120);
  v.pan(0.1, 0);
  const manualPosition = v.camera.position.clone(),
    manualTarget = v.controls.target.clone();
  await settle(v);
  checks.push({
    name: 'Manual input cancels camera travel without a later snap',
    pass:
      !v.travel &&
      v.camera.position.distanceTo(manualPosition) < 1e-6 &&
      v.controls.target.distanceTo(manualTarget) < 1e-6,
  });
  v.reset();
  await settle(v);
  checks.push({
    name: '24 interrupted spread, section, reveal, selection, isolation and Reset sequences return exactly',
    pass: v.assemblyError('presentation') === 0,
    details: v.assemblyError('presentation'),
  });
  v.allParts();
  await settle(v);
  const spreadAudit = v.auditSpread();
  checks.push({
    name: 'Spread membership, source scale and projected bounds are correct in the real renderer',
    pass:
      spreadAudit.members === 216 + dialCount &&
      spreadAudit.visible === 216 + dialCount &&
      spreadAudit.overlaps.length === 0 &&
      spreadAudit.clipped.length === 0 &&
      spreadAudit.maxScaleError < 1e-9,
    details: spreadAudit,
  });
  v.patch({ separation: 1, reveal: 1, partSpread: 1 });
  await settle(v);
  checks.push({
    name: 'Spread rejects competing separation/reveal ownership',
    pass:
      v.state.separation === 0 &&
      v.state.reveal === 0 &&
      v.state.partSpread === 0,
  });
  const preferredMotion = v.reduced;
  v.reduced = true;
  v.allParts();
  v.applyPose(0);
  const reducedSpread = v.auditSpread();
  v.reset();
  v.applyPose(0);
  checks.push({
    name: 'Reduced-motion destinations and exact return apply without interpolating',
    pass:
      !v.travel &&
      v.assemblyError('presentation') === 0 &&
      reducedSpread.visible === 216 + dialCount &&
      reducedSpread.overlaps.length === 0,
  });
  v.reduced = preferredMotion;
  v.group('regulation');
  await settle(v);
  v.patch({ reveal: 0 });
  await settle(v);
  const regulation = GROUPS.find((g) => g.id === 'regulation')!;
  checks.push({
    name: 'Uncover reversal restores section covers and keeps unrelated assemblies hidden',
    pass: [...v.renderParts.values()]
      .filter(
        (p) => belongs(p.source.id, ROOT) && p.source.id !== PREFIX + '66',
      )
      .every(
        (p) =>
          p.mesh.visible ===
          (focusRole(p.source.id, p.source.definitionId, regulation) !==
            'surrounding'),
      ),
  });
  v.patch({ separation: 0.65, partSpread: 0.3 });
  await settle(v);
  v.patch({ separation: 0, partSpread: 0, reveal: 0 });
  await settle(v);
  checks.push({
    name: 'Layer and component separation restore exact movement and fitted dial matrices',
    pass: v.assemblyError('presentation') === 0,
    details: v.assemblyError('presentation'),
  });
  v.reset();
  await settle(v);
  checks.push({
    name: 'Reset restores all default movement parts and releases section fade state',
    pass:
      [...v.renderParts.values()].filter((p) => p.mesh.visible).length ===
        222 + dialCount && [...v.renderParts.values()].every((p) => !p.cutaway),
  });
  checks.push({
    name: 'Navigation and Reset preserve both dial visibility and hand style preferences',
    pass: preferenceKeys.every((key) => v.state[key] === preferences[key]),
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
  await settle(v);
  const after = v.stats();
  const startCamera = v.camera.position.clone(),
    startPart = v.state.part;
  const e = (id = 1, x = 20, extra = {}) =>
    ({
      pointerId: id,
      clientX: x,
      clientY: 20,
      isPrimary: id === 1,
      button: 0,
      ...extra,
    }) as PointerEvent;
  v.pointerDown(e());
  v.pointerMove(e(1, 60));
  v.pointerMove(e());
  v.pointerUp(e());
  v.pointerDown(e());
  v.pointerDown(e(2));
  v.pointerUp(e());
  v.pointerUp(e(2));
  v.pointerDown(e());
  v.pointerCancel(e());
  v.pointerUp(e());
  checks.push({
    name: 'Browser handler emulation rejects out-and-back drag, pinch and cancelled selection',
    pass: v.state.part === startPart && v.camera.position.equals(startCamera),
    details: { scope: 'Handler emulation, not physical touch hardware' },
  });
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
