import * as THREE from 'three';
import type { MovementViewer } from './MovementViewer';

/** Local comparison QA: inspect actual rendered matrices while each study opens/closes. */
export async function runExplosionStyleChecks(v: MovementViewer) {
  const results = [];
  const settle = async () => {
    for (let frame = 0; frame < 1200; frame++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (!v.travel && !v.presentationMoving && !v.needsRender) return;
    }
    throw new Error('Study did not settle');
  };
  try {
    for (const style of ['layers', 'islands', 'guided'] as const) {
      v.compareExplosion(style);
      await settle();
      let maxNdc = 0,
        samples = 0;
      v.inspectionFrame = (_now, rendered) => {
        if (!rendered) return;
        samples++;
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
            maxNdc = Math.max(maxNdc, Math.abs(point.x), Math.abs(point.y));
          }
        }
      };
      await v.playExplosionStudy(true);
      await settle();
      await v.playExplosionStudy(false);
      await settle();
      let reassemblyError = 0;
      for (const p of v.renderParts.values())
        for (let i = 0; i < 16; i++)
          reassemblyError = Math.max(
            reassemblyError,
            Math.abs(p.mesh.matrix.elements[i] - p.assembled.elements[i]),
          );
      results.push({
        style,
        samples,
        maxNdc,
        reassemblyError,
        pass: samples > 1 && maxNdc < 1 && reassemblyError === 0,
      });
      v.inspectionFrame = undefined;
    }
  } finally {
    v.inspectionFrame = undefined;
    v.compareExplosion('current');
  }
  return results;
}
