import * as THREE from 'three';

export function boundsCorners(bounds: THREE.Box3) {
  return Array.from(
    { length: 8 },
    (_, i) =>
      new THREE.Vector3(
        i & 1 ? bounds.max.x : bounds.min.x,
        i & 2 ? bounds.max.y : bounds.min.y,
        i & 4 ? bounds.max.z : bounds.min.z,
      ),
  );
}

/** Explorer's perspective fit, shared with the assembly presentation prototype. */
export function studioFrame(
  camera: THREE.PerspectiveCamera,
  bounds: THREE.Box3,
  direction: THREE.Vector3,
  cameraUp: THREE.Vector3,
  points = boundsCorners(bounds),
) {
  const center = bounds.getCenter(new THREE.Vector3());
  const right = new THREE.Vector3()
    .crossVectors(cameraUp, direction)
    .normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let distance = 8;
  for (const corner of points) {
    const point = corner.clone().sub(center);
    distance = Math.max(
      distance,
      point.dot(direction) +
        1.18 *
          Math.max(
            Math.abs(point.dot(right)) / (tangent * camera.aspect),
            Math.abs(point.dot(up)) / tangent,
          ),
    );
  }
  return { center, distance };
}
