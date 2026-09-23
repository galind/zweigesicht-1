import * as THREE from 'three';
import { WATCH } from '../experience/watch';
import { motionEase } from '../experience/motion';

const lugs = new Map(
  WATCH.leaves
    .filter((p) => p.oppositeWorldTransform)
    .map((p) => [
      p.id,
      {
        opposite: new THREE.Matrix4().set(
          ...(p.oppositeWorldTransform!.flat() as Parameters<
            THREE.Matrix4['set']
          >),
        ),
        sign: p.packet === 'upper-lugs' ? 1 : -1,
      },
    ]),
);
export const CASE_LUGS = new Set(lugs.keys());
export const CASE_LOCKING_PINS = new Set(
  WATCH.lugPresentation.lockingPinLeafIds,
);
export const CASE_PIVOT = new THREE.Vector3(
  ...(WATCH.lugPresentation.pivotMm as [number, number, number]),
);
/** Maker sequence; distances/timing are authored, not service instructions. */
export function caseFlipPhase(turn: number, sign = 1) {
  return {
    angle: Math.PI * motionEase((turn - 0.24) / 0.52),
    clearance:
      WATCH.lugPresentation.clearanceMm *
      motionEase((Math.min(turn, 1 - turn) - (sign > 0 ? 0 : 0.12)) / 0.12),
  };
}
/** Source CAD frame. The observer follows the same inverse X rotation, leaving
 * the attachments stationary on screen while the case turns between them.
 * This change of reference frame preserves all source buffers and case matrices.
 */
export function caseDisplayMatrix(
  id: string,
  assembled: THREE.Matrix4,
  turn: number,
) {
  const lug = lugs.get(id);
  if (!lug || turn === 0) return assembled;
  if (turn === 1) return lug.opposite;
  const phase = caseFlipPhase(turn, lug.sign);
  return new THREE.Matrix4()
    .makeTranslation(...CASE_PIVOT.toArray())
    .multiply(new THREE.Matrix4().makeRotationX(-phase.angle))
    .multiply(
      new THREE.Matrix4().makeTranslation(
        0,
        lug.sign * phase.clearance,
        -CASE_PIVOT.z,
      ),
    )
    .multiply(assembled);
}
