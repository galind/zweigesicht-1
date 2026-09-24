import * as THREE from 'three';

/** Authored watch-photo softboxes. Illumination only; no movement geometry. */
export class StudioEnvironment extends THREE.Scene {
  constructor() {
    super();
    this.background = new THREE.Color(0x5a5e64);
    const ambient = this.background;
    const panel = (
      position: [number, number, number],
      size: [number, number],
      intensity: number,
    ) => {
      const geometry = new THREE.PlaneGeometry(size[0], size[1], 16, 16);
      const uv = geometry.getAttribute('uv');
      const colors = new Float32Array(uv.count * 3);
      for (let i = 0; i < uv.count; i++) {
        const x = (uv.getX(i) - 0.5) * 2,
          y = (uv.getY(i) - 0.5) * 2;
        // Feather into the surround with zero slope at the card boundary.
        // This avoids rectangular bright/dark steps as polished parts turn.
        const value = intensity * (1 - x * x) ** 2 * (1 - y * y) ** 2;
        colors.set([ambient.r + value, ambient.g + value, ambient.b + value], i * 3);
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          vertexColors: true,
          side: THREE.DoubleSide,
        }),
      );
      mesh.position.set(...position);
      mesh.lookAt(0, 0, 0);
      this.add(mesh);
    };
    // Off-axis broad keys serve both flat faces. Unequal edge cards give
    // polished borders direction, with a restrained fill on the opposite side.
    panel([-30, -18, -60], [90, 74], 2.8);
    panel([60, 18, -8], [24, 90], 3.0);
    panel([0, 65, 0], [85, 32], 2.0);
    panel([-30, 18, 60], [90, 74], 2.8);
    panel([-60, -12, 8], [38, 100], 1.7);
    panel([0, -65, 0], [75, 40], 1.2);
  }
  dispose() {
    this.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      }
    });
  }
}
