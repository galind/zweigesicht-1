import * as THREE from 'three';
import type { MovementViewer } from './MovementViewer';
import { EXPLOSION, explosionOffsets } from '../experience/explosion';
import { ROOT, belongs, PREFIX } from '../experience/catalog';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function settle(v: MovementViewer) {
  for (
    let i = 0;
    i < 180 && (v.travel || v.presentationMoving || v.needsRender);
    i++
  )
    await wait(50);
  if (v.travel || v.presentationMoving)
    throw new Error('Explosion did not settle');
}
export async function runExplosionChecks(v: MovementViewer) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  v.reset();
  await settle(v);
  let maxAnimatedNdc = 0;
  v.inspectionFrame = (_now, rendered) => {
    if (!rendered) return;
    for (const p of v.renderParts.values()) {
      if (!p.mesh.visible) continue;
      const b = p.mesh.geometry.boundingBox!;
      for (let i = 0; i < 8; i++) {
        const point = new THREE.Vector3(
          i & 1 ? b.max.x : b.min.x,
          i & 2 ? b.max.y : b.min.y,
          i & 4 ? b.max.z : b.min.z,
        )
          .applyMatrix4(p.mesh.matrixWorld)
          .project(v.camera);
        maxAnimatedNdc = Math.max(
          maxAnimatedNdc,
          Math.abs(point.x),
          Math.abs(point.y),
        );
      }
    }
  };
  try {
    v.patch({ separation: 1 });
    await settle(v);
    v.patch({ separation: 0 });
    await settle(v);
  } finally {
    v.inspectionFrame = undefined;
  }
  checks.push({
    name: 'Complete opening and closing keep displayed geometry within the viewport',
    pass: maxAnimatedNdc < 1,
    details: { maxAnimatedNdc },
  });
  const source = new Map(
    [...v.renderParts].map(([id, p]) => [id, p.assembled.clone()]),
  );
  let maxPoseError = 0,
    maxNdc = 0;
  for (const side of ['front', 'back'] as const) {
    v.setSide(side);
    await settle(v);
    for (const separation of [
      0, 0.1, 0.2, 0.35, 0.52, 0.72, 1, 0.72, 0.52, 0.2, 0,
    ]) {
      v.scrub({ separation });
      await settle(v);
      const expected = explosionOffsets(v.parts, v.state);
      for (const p of v.renderParts.values()) {
        if (!belongs(p.source.id, ROOT)) continue;
        const offset = expected.get(p.source.id)!;
        maxPoseError = Math.max(
          maxPoseError,
          p.offset.distanceTo(new THREE.Vector3(...offset)),
        );
      }
      for (const p of v.targetPoints((p) => p.mesh.visible)) {
        p.project(v.camera);
        maxNdc = Math.max(maxNdc, Math.abs(p.x), Math.abs(p.y));
      }
    }
  }
  checks.push({
    name: 'Both sides: intermediate separation and reversal match complete poses and fit all visible bounds',
    pass: maxPoseError < 1e-9 && maxNdc < 1,
    details: { maxPoseError, maxNdc },
  });
  for (const group of Object.keys(EXPLOSION.mechanisms)) {
    v.group(group);
    await settle(v);
    v.scrub({ partSpread: 1 });
    await settle(v);
    const expected = explosionOffsets(v.parts, v.state);
    for (const p of v.renderParts.values())
      if (expected.has(p.source.id))
        maxPoseError = Math.max(
          maxPoseError,
          p.offset.distanceTo(new THREE.Vector3(...expected.get(p.source.id)!)),
        );
  }
  checks.push({
    name: 'All six focused mechanisms retain their reviewed host evaluator for Uncover and Separate',
    pass: maxPoseError < 1e-9,
  });
  for (let i = 0; i < 24; i++) {
    v.scrub({ separation: i % 2, partSpread: (i % 5) / 4 });
    await wait(20);
    if (i % 4 === 0) v.group(Object.keys(EXPLOSION.mechanisms)[i % 6]);
  }
  v.reset();
  await settle(v);
  checks.push({
    name: 'Rapid interrupted scrubbing and mechanism changes restore exact source assembly',
    pass:
      v.assemblyError() === 0 &&
      [...source].every(([id, m]) =>
        v.renderParts.get(id)!.assembled.equals(m),
      ),
  });
  v.scrub({ separation: 0.72 });
  await settle(v);
  v.orbit(0.3, 0.2);
  await settle(v);
  const camera = v.camera.position.clone(),
    target = v.controls.target.clone();
  v.scrub({ separation: 1 });
  await settle(v);
  checks.push({
    name: 'Manual orbit retains camera ownership during subsequent separation',
    pass:
      v.camera.position.distanceTo(camera) < 1e-8 &&
      v.controls.target.distanceTo(target) < 1e-8,
  });
  await v.select(PREFIX + '54__0_1_1_194_11');
  v.patch({ isolated: true });
  await settle(v);
  const screw = v.renderParts.get(PREFIX + '54__0_1_1_194_11')!;
  checks.push({
    name: 'Radial screw selection/isolation outline follows the displayed geometry',
    pass:
      screw.mesh.visible &&
      v.selectionBox.visible &&
      v.selectionBox.box.containsBox(
        new THREE.Box3().setFromObject(screw.mesh),
      ),
  });
  v.back();
  await settle(v);
  v.reset();
  await settle(v);
  const reduced = v.reduced;
  v.reduced = true;
  v.patch({ separation: 1 });
  await settle(v);
  v.reset();
  await settle(v);
  v.reduced = reduced;
  checks.push({
    name: 'Reduced motion reaches complete endpoint and restores source assembly',
    pass: v.assemblyError() === 0,
  });
  const before = v.stats();
  for (let i = 0; i < 3; i++) {
    v.scrub({ separation: 1 });
    await settle(v);
    v.scrub({ separation: 0 });
    await settle(v);
  }
  const after = v.stats();
  const renders = v.renderCount;
  await wait(350);
  checks.push({
    name: 'Repeated explosion retains GPU resources and settled view does not redraw',
    pass:
      before.geometries === after.geometries &&
      before.textures === after.textures &&
      v.renderCount === renders,
    details: { before, after, idleRenders: v.renderCount - renders },
  });
  return { checks, stats: v.stats() };
}
