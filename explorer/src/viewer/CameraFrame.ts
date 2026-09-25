import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const KEYBOARD_ORBIT_STEP = 0.2;
export const KEYBOARD_ZOOM_IN = 0.83;
export const KEYBOARD_ZOOM_OUT = 1.2;
export const KEYBOARD_ORBIT_MOVES: Readonly<
  Record<string, readonly [number, number]>
> = {
  ArrowLeft: [-KEYBOARD_ORBIT_STEP, 0],
  ArrowRight: [KEYBOARD_ORBIT_STEP, 0],
  ArrowUp: [0, -KEYBOARD_ORBIT_STEP],
  ArrowDown: [0, KEYBOARD_ORBIT_STEP],
};

/** Three r186 caches its orbit basis at construction. Keep that basis aligned
 * with camera turnover without recreating the controls or their event handlers.
 */
export function syncOrbitUp(camera: THREE.Camera, orbit: OrbitControls) {
  const controls = orbit as OrbitControls & {
    _quat?: THREE.Quaternion;
    _quatInverse?: THREE.Quaternion;
  };
  if (controls._quat && controls._quatInverse) {
    controls._quat.setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
    controls._quatInverse.copy(controls._quat).invert();
  }
}

/** Preserve the explorer's established keyboard/control-button orbit convention. */
export function orbitCamera(
  camera: THREE.Camera,
  controls: Pick<OrbitControls, 'target' | 'update'>,
  dx: number,
  dy: number,
) {
  const offset = camera.position.clone().sub(controls.target),
    spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta += dx;
  spherical.phi = THREE.MathUtils.clamp(
    spherical.phi + dy,
    0.02,
    Math.PI - 0.02,
  );
  camera.position
    .copy(controls.target)
    .add(new THREE.Vector3().setFromSpherical(spherical));
  controls.update();
}

export function zoomCamera(
  camera: THREE.Camera,
  controls: Pick<OrbitControls, 'target' | 'maxDistance' | 'update'>,
  factor: number,
) {
  const offset = camera.position.clone().sub(controls.target);
  offset.setLength(
    THREE.MathUtils.clamp(offset.length() * factor, 3, controls.maxDistance),
  );
  camera.position.copy(controls.target).add(offset);
  controls.update();
}
