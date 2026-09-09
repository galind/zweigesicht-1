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
    this.pass.kernelRadius = 0.8; // Source world remains millimetres.
    this.pass.ssaoMaterial.fragmentShader =
      this.pass.ssaoMaterial.fragmentShader.replace(
        'vec3( 1.0 - occlusion )',
        'vec3( 1.0 - 0.48 * occlusion )',
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
    this.pass.maxDistance = 1.4 / depthRange;
    this.pass.render(
      renderer,
      this.pass.ssaoRenderTarget,
      this.pass.ssaoRenderTarget,
      0,
      false,
    );
  }
  dispose() {
    this.pass.noiseTexture.dispose();
    this.pass.ssaoMaterial.dispose();
    this.pass.dispose();
  }
}
