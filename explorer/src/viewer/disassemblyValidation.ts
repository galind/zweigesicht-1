import * as THREE from 'three';
import type { MovementViewer } from './MovementViewer';
import { GROUPS } from '../experience/catalog';
import { WATCH } from '../experience/watch';
import { CASE_LUGS, caseDisplayMatrix, caseFlipPhase } from './CasePose';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
async function settle(v: MovementViewer) {
  for (
    let i = 0;
    i < 400 && (v.travel || v.presentationMoving || v.needsRender);
    i++
  )
    await wait(30);
  if (v.travel || v.presentationMoving)
    throw new Error('Disassembly did not settle');
}
type Capture = (name: string, v: MovementViewer) => Promise<void>;
/** Inspect real rendered poses. Separate service validity from presentation regressions. */
export async function runDisassemblyChecks(
  v: MovementViewer,
  capture?: Capture,
) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  const check = (name: string, pass: boolean, details?: unknown) =>
    checks.push({ name, pass, details });
  const matrices = () =>
    new Map(
      [...v.renderParts]
        .filter(([, p]) => p.mesh.visible)
        .map(([id, p]) => [id, p.mesh.matrix.clone()]),
    );
  const exact = (source: Map<string, THREE.Matrix4>) =>
    [...source].every(([id, m]) =>
      v.renderParts.get(id)!.mesh.matrix.equals(m),
    );
  const samples: unknown[] = [];
  for (const [label, caseVisible, dialsVisible] of [
    ['bare', false, false],
    ['dials', false, true],
    ['case', true, false],
    ['complete', true, true],
  ] as const) {
    v.reset();
    await v.configureWatch({
      caseVisible,
      dialsVisible,
      caseMaterial: 'platinum',
      centralStyle: 'fine',
      smallStyle: 'lance',
    });
    await settle(v);
    for (const side of ['front', 'back'] as const) {
      v.setSide(side);
      await settle(v);
      const assembled = matrices();
      await capture?.(`${label}-${side}-assembled`, v);
      for (const progress of [0.05, 0.2, 0.4, 0.7, 1, 0.7, 0.2, 0]) {
        v.scrub({ separation: progress });
        await settle(v);
        let minLugOutward = Infinity;
        if (v.caseEffective())
          for (const id of CASE_LUGS) {
            const p = v.renderParts.get(id)!;
            const center = p.mesh.geometry.boundingBox!.getCenter(
              new THREE.Vector3(),
            );
            const base = center
              .clone()
              .applyMatrix4(
                caseDisplayMatrix(id, p.assembled, side === 'back' ? 1 : 0),
              );
            const shown = center.applyMatrix4(p.mesh.matrix);
            minLugOutward = Math.min(
              minLugOutward,
              (shown.y - base.y) * Math.sign(base.y),
            );
          }
        samples.push({
          label,
          side,
          progress,
          minLugOutward: Number.isFinite(minLugOutward) ? minLugOutward : null,
        });
        if (progress === 0.2 || progress === 0.4 || progress === 1)
          await capture?.(`${label}-${side}-${progress * 100}`, v);
        check(
          `${label}/${side}/${progress}: attachments travel outward`,
          minLugOutward >= -1e-8,
          { minLugOutward },
        );
      }
      check(`${label}/${side}: exact reassembly`, exact(assembled));
    }
  }
  await v.configureWatch({ caseVisible: true, dialsVisible: true });
  for (const group of GROUPS) {
    v.group(group.id);
    await settle(v);
    for (const side of ['front', 'back'] as const) {
      v.setSide(side);
      await settle(v);
      for (const reveal of [0, 0.4, 1]) {
        v.scrub({ reveal });
        await settle(v);
        check(
          `${group.id}/${side}/cover-${reveal}: case temporarily hidden`,
          !v.caseEffective() && v.state.caseVisible,
        );
      }
      for (const partSpread of [0.15, 0.5, 1, 0]) {
        v.scrub({ partSpread });
        await settle(v);
        if (partSpread === 1) await capture?.(`focus-${group.id}-${side}`, v);
      }
    }
  }
  v.reset();
  await settle(v);
  v.patch({ separation: 0.6 });
  await settle(v);
  for (const centralStyle of ['fine', 'lance', 'open-lance'] as const)
    for (const smallStyle of ['lance', 'broad-lance', 'pear'] as const) {
      await v.configureWatch({ centralStyle, smallStyle });
      await settle(v);
      const original = matrices();
      for (const preset of WATCH.caseMaterials) {
        await v.configureWatch({ caseMaterial: preset.id });
        await settle(v);
        check(
          `${centralStyle}/${smallStyle}/${preset.id}: finish does not move geometry`,
          exact(original),
        );
      }
    }
  for (const separation of [0, 0.45, 1]) {
    v.patch({ separation });
    await wait(180);
    v.flipMovement();
    await wait(180);
    v.flipMovement();
    await settle(v);
    check(
      `Flip interruption at ${separation}: finite matrices`,
      [...matrices().values()].every((m) => m.elements.every(Number.isFinite)),
    );
  }
  v.patch({ separation: 0.65 });
  await settle(v);
  const beforeInventory = matrices();
  v.allParts();
  await settle(v);
  v.flipMovement();
  await settle(v);
  v.back();
  await settle(v);
  v.back();
  await settle(v);
  check('All parts return restores separated pose', exact(beforeInventory));
  const selected = WATCH.leaves.find(
    (p) => p.definitionId === 'd_0_1_1_54',
  )!.id;
  await v.select(selected);
  await settle(v);
  v.patch({ isolated: true });
  await settle(v);
  check(
    'Explicit isolation retains only selected lug',
    [...v.renderParts.values()]
      .filter((p) => p.mesh.visible)
      .every((p) => p.source.id === selected),
  );
  v.reset();
  await settle(v);
  for (let i = 0; i < 10; i++) {
    v.scrub({ separation: i % 2 ? 0.35 : 0.85 });
    await wait(25);
  }
  v.reset();
  await settle(v);
  check(
    'Rapid scrubbing then Reset restores fitted endpoint',
    v.assemblyError('presentation') === 0,
  );
  const reduced = v.reduced;
  v.reduced = true;
  v.patch({ separation: 1 });
  await settle(v);
  v.flipMovement();
  await settle(v);
  v.reset();
  await settle(v);
  v.reduced = reduced;
  check(
    'Reduced motion restores fitted endpoint',
    v.assemblyError('presentation') === 0,
  );
  return {
    checks,
    samples,
    viewport: [v.host.clientWidth, v.host.clientHeight],
  };
}

/** Real-frame coverage for interruption, configuration changes and delayed assets.
 * Optional images remain local inspection evidence, excluded from normal viewing. */
export async function runDisassemblyTransitionChecks(
  v: MovementViewer,
  images = false,
) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  const frames: { name: string; ms: number; image: string }[] = [];
  const check = (name: string, pass: boolean, details?: unknown) =>
    checks.push({ name, pass, details });
  v.reset();
  await settle(v);
  // On ?delivery=dial-slow the real catalog finishes after the view intent changes.
  const wasCold = !v.catalogLoaded;
  const pending = v.configureWatch({ caseVisible: true, dialsVisible: true });
  v.patch({ separation: 0.55 });
  v.setSide('front');
  const latest = v.configureWatch({
    caseMaterial: 'platinum',
    centralStyle: 'open-lance',
    smallStyle: 'pear',
  });
  await Promise.all([pending, latest]);
  await settle(v);
  check(
    'Optional completion retains separation, face, latest style/material and complete packets',
    v.state.separation === 0.55 &&
      v.state.side === 'front' &&
      v.state.centralStyle === 'open-lance' &&
      v.state.caseMaterial === 'platinum' &&
      v.fittedCase.size === 41 &&
      v.fitted.size > 0,
    { wasCold },
  );
  let maxFrameError = 0,
    maxNdc = 0,
    frameCount = 0,
    lastImage = -Infinity,
    start = 0,
    label = '';
  const sample = (now: number, rendered: boolean) => {
    if (!rendered) return;
    frameCount++;
    for (const id of CASE_LUGS) {
      if (!v.fittedCase.has(id)) continue;
      const p = v.renderParts.get(id)!;
      const point = p.mesh.geometry.boundingBox!.getCenter(new THREE.Vector3());
      const shown = point.clone().applyMatrix4(p.mesh.matrix);
      const base = point.applyMatrix4(
        caseDisplayMatrix(id, p.assembled, v.caseTurn),
      );
      // In the unturned observer frame the whole packet keeps its authored ±Y offset.
      const delta = shown
        .sub(base)
        .applyAxisAngle(
          new THREE.Vector3(1, 0, 0),
          caseFlipPhase(v.caseTurn).angle,
        );
      const sign =
        WATCH.leaves.find((p) => p.id === id)!.packet === 'upper-lugs' ? 1 : -1;
      maxFrameError = Math.max(
        maxFrameError,
        Math.abs(delta.x),
        Math.abs(delta.z),
        Math.abs(
          delta.y -
            sign *
              40 *
              (v.displayedExplosionState?.separation ?? v.state.separation),
        ),
      );
    }
    for (const p of v.renderParts.values())
      if (p.mesh.visible) {
        const b = p.mesh.geometry.boundingBox!;
        for (let i = 0; i < 8; i++) {
          const ndc = new THREE.Vector3(
            i & 1 ? b.max.x : b.min.x,
            i & 2 ? b.max.y : b.min.y,
            i & 4 ? b.max.z : b.min.z,
          )
            .applyMatrix4(p.mesh.matrix)
            .project(v.camera);
          maxNdc = Math.max(maxNdc, Math.abs(ndc.x), Math.abs(ndc.y));
        }
      }
    if (images && now - lastImage > 140) {
      lastImage = now;
      frames.push({
        name: label,
        ms: now - start,
        image: v.renderer.domElement.toDataURL('image/png'),
      });
    }
  };
  try {
    for (const side of ['front', 'back'] as const) {
      v.reset();
      v.setSide(side);
      await settle(v);
      label = `${side}-open-reverse`;
      start = performance.now();
      lastImage = -Infinity;
      v.inspectionFrame = sample;
      v.patch({ separation: 1 });
      await wait(400);
      v.patch({ separation: 0.25 });
      await wait(110);
      v.patch({ separation: 1 });
      await settle(v);
      label = `${side}-separated-flip`;
      start = performance.now();
      lastImage = -Infinity;
      v.flipMovement();
      await wait(750);
      v.flipMovement();
      await wait(150);
      v.scrub({ separation: 0.45 });
      await settle(v);
      v.inspectionFrame = undefined;
      for (const caseVisible of [false, true])
        for (const dialsVisible of [false, true]) {
          await v.configureWatch({ caseVisible, dialsVisible });
          await settle(v);
          check(
            `${side}: visibility ${caseVisible}/${dialsVisible} preserves partial separation`,
            v.state.separation === 0.45 && v.state.side === side,
          );
        }
      await v.configureWatch({ caseVisible: true, dialsVisible: true });
      await settle(v);
      for (const view of [side, 'oblique'] as const) {
        v.view(view);
        await settle(v);
      }
    }
  } finally {
    v.inspectionFrame = undefined;
  }
  check(
    'Live separated Flip and reversals keep all attachments in their outward frame',
    maxFrameError < 1e-8 && frameCount > 10,
    { maxFrameError, frameCount },
  );
  check(
    'Automatic interrupted motion keeps visible geometry inside viewport',
    maxNdc < 1,
    { maxNdc },
  );
  v.reset();
  await settle(v);
  check(
    'Interrupted sequences restore exact fitted pose',
    v.assemblyError('presentation') === 0,
  );
  return {
    checks,
    frames,
    viewport: [v.host.clientWidth, v.host.clientHeight],
  };
}
