import * as THREE from 'three';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

/** Live, modest contact shading. Re-evaluates depth after every reveal or pose. */
export class SurfaceOcclusion {
  pass: SSAOPass;
  constructor(
    scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
  ) {
    this.pass = new SSAOPass(scene, camera, 512, 512, 16);
    this.pass.renderToScreen = true;
    this.pass.kernelRadius = 0.4; // Source world remains millimetres.
    this.pass.ssaoMaterial.fragmentShader =
      this.pass.ssaoMaterial.fragmentShader.replace(
        'vec3( 1.0 - occlusion )',
        'vec3( 1.0 - 0.24 * occlusion )',
      );
  }
  resize(width: number, height: number) {
    this.pass.setSize(
      Math.max(1, Math.round(width)),
      Math.max(1, Math.round(height)),
    );
  }
  render(renderer: THREE.WebGLRenderer) {
    const u = this.pass.ssaoMaterial.uniforms;
    u.cameraNear.value = this.camera.near;
    u.cameraFar.value = this.camera.far;
    u.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix);
    u.cameraInverseProjectionMatrix.value.copy(
      this.camera.projectionMatrixInverse,
    );
    const depthRange = this.camera.far - this.camera.near;
    this.pass.minDistance = 0.035 / depthRange;
    this.pass.maxDistance = 0.65 / depthRange;
    const target = renderer.getRenderTarget(),
      autoClear = renderer.autoClear,
      clearColor = renderer.getClearColor(new THREE.Color()),
      clearAlpha = renderer.getClearAlpha(),
      override = this.pass.scene.overrideMaterial,
      visibility: [THREE.Object3D, boolean][] = [];
    this.pass.scene.traverse((object) => {
      if (object instanceof THREE.Line || object instanceof THREE.Points)
        visibility.push([object, object.visible]);
    });
    try {
      this.pass.render(
        renderer,
        this.pass.ssaoRenderTarget,
        this.pass.ssaoRenderTarget,
        0,
        false,
      );
    } catch (error) {
      // SSAOPass may throw between its override and restore steps. A retry
      // must start with the beauty material, default target and original lines.
      // The pinned Three.js pass owns this cache; clear it before restoring
      // our snapshot so a later successful pass cannot reveal a hidden line.
      (
        this.pass as unknown as { _restoreVisibility(): void }
      )._restoreVisibility();
      this.pass.scene.overrideMaterial = override;
      for (const [object, visible] of visibility) object.visible = visible;
      renderer.setRenderTarget(target);
      renderer.autoClear = autoClear;
      renderer.setClearColor(clearColor, clearAlpha);
      throw error;
    }
  }
  dispose() {
    this.pass.noiseTexture.dispose();
    this.pass.ssaoMaterial.dispose();
    this.pass.dispose();
  }
}
