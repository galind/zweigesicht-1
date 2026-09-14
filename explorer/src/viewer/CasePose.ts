import * as THREE from 'three';
import { WATCH } from '../experience/watch';

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
/** Source endpoints; the clearing arc is presentation, not a mechanical procedure. */
export function caseDisplayMatrix(
  id: string,
  assembled: THREE.Matrix4,
  turn: number,
) {
  const lug = lugs.get(id);
  if (!lug || turn === 0) return assembled;
  if (turn === 1) return lug.opposite;
  const z = WATCH.lugPresentation.pivotMm[2];
  return new THREE.Matrix4()
    .makeTranslation(
      0,
      lug.sign * WATCH.lugPresentation.clearanceMm * Math.sin(Math.PI * turn),
      z,
    )
    .multiply(new THREE.Matrix4().makeRotationY(Math.PI * turn))
    .multiply(new THREE.Matrix4().makeTranslation(0, 0, -z))
    .multiply(assembled);
}
