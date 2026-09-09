import * as THREE from 'three';
import poses from '../../../assets/authored/hand-display-poses.json';
import { DIALS } from '../experience/dials';

export const HAND_TIME = poses.time;
const hands = new Map(poses.hands.map((hand) => [hand.leafId, hand]));

/** A static fitted-display transform; source occurrence matrices stay immutable. */
export function handDisplayMatrix(id: string, source: THREE.Matrix4) {
  const hand = hands.get(id);
  if (!hand) return undefined;
  const pivot = new THREE.Vector3().fromArray(hand.boreLocalMm).applyMatrix4(source);
  const tip = new THREE.Vector3().fromArray(hand.tipLandmarkLocalMm).applyMatrix4(source);
  const face = hand.face as 'central' | 'small';
  const role = hand.role as keyof typeof poses.clockAnglesDegrees;
  const clockAngle = THREE.MathUtils.degToRad(poses.clockAnglesDegrees[role]);
  // Both outward camera frames have screen-right +X; their up axes differ.
  const targetAngle = Math.atan2(
    Math.cos(clockAngle) * (face === 'central' ? 1 : -1),
    Math.sin(clockAngle),
  );
  const angle = targetAngle - Math.atan2(tip.y - pivot.y, tip.x - pivot.x);
  const [x, y] = DIALS.faces[face].axleWorldXYMm;
  return new THREE.Matrix4()
    .makeTranslation(x, y, 0)
    .multiply(new THREE.Matrix4().makeRotationZ(angle))
    .multiply(new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, 0))
    .multiply(source);
}
