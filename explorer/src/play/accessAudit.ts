/** Opt-in, read-only geometry audit. It never changes the game, camera or source meshes. */
import * as THREE from 'three';
import { actions } from './state';
import { fixedViewDirection } from './fixedViews';
import type { PlayManifest, PlayStep } from './types';
import type { PlayViewer } from './PlayViewer';

export async function auditAccess(
  manifest: PlayManifest,
  pieces: PlayViewer['pieces'],
) {
  const meshes = new Map(
    [...pieces].map(([id, p]) => {
      const mesh = new THREE.Mesh(p.mesh.geometry, p.mesh.material);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(p.pose);
      mesh.updateMatrixWorld(true);
      mesh.userData.partId = id;
      return [id, mesh] as const;
    }),
  );
  const results: {
    level: string;
    id: string;
    label: string;
    pass: boolean;
    blockers: { id: string; hits: number }[];
  }[] = [];
  const sample = (step: PlayStep) => {
    const points: THREE.Vector3[] = [];
    for (const id of step.leafIds) {
      const piece = pieces.get(id)!,
        positions = piece.mesh.geometry.getAttribute('position');
      const stride = Math.max(1, Math.floor(positions.count / 100));
      for (let i = 0; i < positions.count; i += stride)
        points.push(
          new THREE.Vector3()
            .fromBufferAttribute(positions, i)
            .applyMatrix4(piece.pose),
        );
    }
    return points;
  };
  for (const level of ['easy', 'hard'] as const) {
    const all = actions(manifest, level);
    for (const step of all) {
      // Every non-descendant can legally precede this action. This is the most
      // obstructed possible state; removing opaque blockers cannot hide a seat.
      const blocked = new Set([step.id]);
      let size = 0;
      while (size !== blocked.size) {
        size = blocked.size;
        for (const a of all)
          if (a.prerequisiteStepIds.some((p) => blocked.has(p)))
            blocked.add(a.id);
      }
      const ids = new Set(step.workspaceId ? [] : manifest.initialLeafIds);
      for (const a of all)
        if (!blocked.has(a.id) && a.workspaceId === step.workspaceId)
          for (const id of a.leafIds) ids.add(id);
      const obstacles = [...ids]
        .map((id) => meshes.get(id)!)
        .filter((mesh) => {
          const material = mesh.material as THREE.Material;
          return !(material.transparent && material.opacity < 0.5);
        });
      const points = sample(step);
      const frameBounds = new THREE.Box3();
      const frameIds = step.workspaceId
        ? manifest.packets.find((p) => p.id === step.workspaceId)!.leafIds
        : manifest.initialLeafIds;
      for (const id of frameIds) frameBounds.union(pieces.get(id)!.bounds);
      const center = frameBounds.getCenter(new THREE.Vector3());
      const frameSize = frameBounds.getSize(new THREE.Vector3());
      const distance =
        Math.max(
          frameSize.x,
          frameSize.y,
          frameSize.z,
          step.workspaceId ? 1 : 25,
        ) * 4;
      const directions = (['front', 'back'] as const).map((side) =>
        fixedViewDirection(
          side,
          step.workspaceId,
          step.viewDirectionWorld ? step : null,
        ),
      );
      const blockers = new Map<string, number>();
      let pass = false;
      for (const direction of directions) {
        const eye = center.clone().addScaledVector(direction, distance);
        for (const point of points) {
          const offset = point.clone().sub(eye),
            distance = offset.length();
          const ray = new THREE.Raycaster(
            eye,
            offset.normalize(),
            0,
            distance - 0.035,
          );
          const hit = ray.intersectObjects(obstacles, false)[0];
          if (!hit) {
            pass = true;
            break;
          }
          const id = hit.object.userData.partId as string;
          blockers.set(id, (blockers.get(id) ?? 0) + 1);
        }
        if (pass) break;
      }
      results.push({
        level,
        id: step.id,
        label: step.label,
        pass,
        blockers: pass
          ? []
          : [...blockers]
              .sort((a, b) => b[1] - a[1])
              .map(([id, hits]) => ({ id, hits })),
      });
      // Yield between actions so this diagnostic cannot starve browser input.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return results;
}
