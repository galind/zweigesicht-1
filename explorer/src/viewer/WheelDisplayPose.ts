import * as THREE from 'three';
import poses from '../../../assets/authored/wheel-display-poses.json' with { type: 'json' };

const wheels = new Map(poses.wheels.map((wheel) => [wheel.leafId, wheel]));

/** Static phase about the original bore. Always supply the immutable base pose. */
export function wheelDisplayMatrix(id: string, source: THREE.Matrix4) {
  const wheel = wheels.get(id);
  if (!wheel) return undefined;
  const [x, y, z] = wheel.pivotLocalMm;
  return source
    .clone()
    .multiply(new THREE.Matrix4().makeTranslation(x, y, z))
    .multiply(
      new THREE.Matrix4().makeRotationZ(
        THREE.MathUtils.degToRad(wheel.localZDegrees),
      ),
    )
    .multiply(new THREE.Matrix4().makeTranslation(-x, -y, -z));
}
