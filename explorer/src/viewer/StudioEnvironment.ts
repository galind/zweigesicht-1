import * as THREE from 'three';

/** Authored watch-photo softboxes. Illumination only; no movement geometry. */
export class StudioEnvironment extends THREE.Scene {
  constructor() {
    super();
    this.background = new THREE.Color(0x747880);
    const panel = (
      position: [number, number, number],
      size: [number, number],
      intensity: number,
    ) => {
      const geometry = new THREE.PlaneGeometry(size[0], size[1], 16, 16);
      const uv = geometry.getAttribute('uv');
      const colors = new Float32Array(uv.count * 3);
      for (let i = 0; i < uv.count; i++) {
        const x = (uv.getX(i) - .5) * 2, y = (uv.getY(i) - .5) * 2;
        const value = .18 + .82 * Math.exp(-2.2 * x * x - 1.4 * y * y);
        colors.set([value, value, value], i * 3);
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().setScalar(intensity),
          vertexColors: true,
          side: THREE.DoubleSide,
        }),
      );
      mesh.position.set(...position);
      mesh.lookAt(0, 0, 0);
      this.add(mesh);
    };
    // Unequal broad sources and narrow cards leave dark reflection intervals.
    // Both hemispheres are lit so the reverse side supports the same inspection.
    panel([-18, -20, -60], [75, 50], 1.7);
    panel([65, 0, 0], [32, 85], 2.8);
    panel([0, 65, 0], [85, 32], 2.8);
    panel([18, -18, 60], [75, 50], 1.7);
    panel([-65, 0, 0], [32, 85], 2.8);
    panel([0, -65, 0], [85, 32], 2.8);
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
