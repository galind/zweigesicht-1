import * as THREE from 'three';
import { StudioEnvironment } from './StudioEnvironment';

/** Shared authored lighting; controllers retain scene and lifetime ownership. */
export function configureRenderer(renderer: THREE.WebGLRenderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
}

export function addStudioLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight(0xffecd6, 0.8);
  key.position.set(-25, 40, -45);
  const rim = new THREE.DirectionalLight(0xc0dff3, 0.6);
  rim.position.set(30, -10, 35);
  scene.add(new THREE.HemisphereLight(0xc8e0ed, 0x29221b, 0.25), key, rim);
}

/** Allocate before replacing the owner's old environment, including on recovery. */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  let room: StudioEnvironment | undefined;
  try {
    room = new StudioEnvironment();
    return pmrem.fromScene(room, 0.015);
  } finally {
    room?.dispose();
    pmrem.dispose();
  }
}

/**
 * Scene resources can be shared by several mesh occurrences. Release each once.
 * CAD materials have no image maps; the controller owns its PMREM target and
 * contact pass textures separately. This does not claim ownership of textures
 * referenced by arbitrary materials.
 */
export function disposeObjectResources(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material)
      ? node.material
      : [node.material])
      materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
