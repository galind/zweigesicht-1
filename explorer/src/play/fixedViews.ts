import * as THREE from 'three';
import type { PlaySide, PlayStep } from './types';

/** Two prescribed faces per workspace; source geometry never moves. */
export function fixedViewDirection(
  side: PlaySide,
  workspace: string | null,
  detail?: PlayStep | null,
) {
  // This fixed bench tilt exposes both indicator washers beneath their retainers.
  const base =
    detail?.viewDirectionWorld ??
    (workspace === 'movement-29' ? [-1, 1, 1] : [0, 0, 1]);
  const direction = new THREE.Vector3().fromArray(base).normalize();
  if (side === 'back')
    direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  return direction;
}
