import * as THREE from 'three';

export const EXPOSURE_SAMPLES = 9;
export const MAX_EXPOSURE_SECONDS = 1 / 120;

/** Spatially distributed shutter samples: one opaque time sample per pixel.
 * All five surfaces use the same mask, so depth resolves one coherent pose.
 * No transparent ghost layers, frame history, extra scene pass or source edits.
 */
export function exposureShader(shader: {
  vertexShader: string;
  fragmentShader: string;
}) {
  shader.vertexShader =
    'varying float vExposureSample;\n' +
    shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvExposureSample = float(gl_InstanceID);',
    );
  // The authored finish uses its own object-space basis, outside Three's normal chunks.
  shader.vertexShader = shader.vertexShader
    .replace(
      'normalMatrix*vFinishNormal',
      'normalMatrix*mat3(instanceMatrix)*vFinishNormal',
    )
    .replace(
      'mat3(modelViewMatrix)*vec3(1,0,0)',
      'mat3(modelViewMatrix)*mat3(instanceMatrix)*vec3(1,0,0)',
    )
    .replace(
      'mat3(modelViewMatrix)*vec3(0,1,0)',
      'mat3(modelViewMatrix)*mat3(instanceMatrix)*vec3(0,1,0)',
    );
  shader.fragmentShader =
    'varying float vExposureSample;\n' +
    shader.fragmentShader.replace(
      'void main() {',
      `void main() {
      float exposureNoise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      if (abs(floor(exposureNoise * ${EXPOSURE_SAMPLES}.0) - vExposureSample) > 0.5) discard;`,
    );
}

type Entry = {
  mesh: THREE.Mesh;
  base: THREE.Matrix4;
  packet: { pivot: number[] };
};
type Proxy = {
  source: THREE.Mesh;
  mesh: THREE.InstancedMesh;
  material: THREE.Material;
  sourceMaterial: THREE.Material;
  version: number;
  visible: boolean;
};

/** Rendering-only exposure of the rim and its four eccentrics.
 * Staff, collet, roller/jewel and hairspring keep their exact shared-clock pose.
 */
export class BalanceExposure {
  private readonly proxies: Proxy[] = [];
  private readonly matrix = new THREE.Matrix4();
  private shown = false;
  private dead = false;
  private readonly entries: Entry[];
  constructor(entries: Entry[]) {
    this.entries = entries;
  }

  private material(source: THREE.Material) {
    const material = source.clone();
    material.onBeforeCompile = (shader, renderer) => {
      source.onBeforeCompile(shader, renderer);
      exposureShader(shader);
    };
    material.customProgramCacheKey = () =>
      source.customProgramCacheKey() + '/balance-exposure-v1';
    return material;
  }

  show(
    seconds: number,
    duration: number,
    angle: (seconds: number) => number,
    transform: (
      out: THREE.Matrix4,
      pivot: number[],
      degrees: number,
    ) => THREE.Matrix4,
  ) {
    if (
      this.dead ||
      duration <= 0 ||
      this.entries.some((e) => !e.mesh.parent || Array.isArray(e.mesh.material))
    )
      return;
    if (!this.proxies.length) {
      for (const { mesh: source } of this.entries) {
        const sourceMaterial = source.material as THREE.Material;
        const material = this.material(sourceMaterial);
        const mesh = new THREE.InstancedMesh(
          source.geometry,
          material,
          EXPOSURE_SAMPLES,
        );
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false; // Small fixed packet; avoids stale instance bounds.
        mesh.raycast = () => {}; // Inspection continues to use the original exact-pose mesh.
        mesh.userData.balanceExposure = true;
        mesh.userData.balanceExposureSource = source;
        mesh.visible = false;
        this.proxies.push({
          source,
          mesh,
          material,
          sourceMaterial,
          version: sourceMaterial.version,
          visible: false,
        });
      }
    }
    for (let j = 0; j < this.proxies.length; j++) {
      const p = this.proxies[j],
        entry = this.entries[j];
      const sourceMaterial = p.source.material as THREE.Material;
      if (
        sourceMaterial !== p.sourceMaterial ||
        sourceMaterial.version !== p.version
      ) {
        p.material.dispose();
        p.material = this.material(sourceMaterial);
        p.mesh.material = p.material;
        p.sourceMaterial = sourceMaterial;
        p.version = sourceMaterial.version;
      }
      if (p.mesh.parent !== p.source.parent) p.source.parent!.add(p.mesh);
      p.mesh.layers.mask = p.source.layers.mask;
      p.mesh.renderOrder = p.source.renderOrder;
      p.visible = p.source.visible;
      p.mesh.visible = p.visible;
      p.source.visible = false;
      for (let i = 0; i < EXPOSURE_SAMPLES; i++) {
        const t = Math.max(
          0,
          seconds + duration * (i / (EXPOSURE_SAMPLES - 1) - 0.5),
        );
        transform(this.matrix, entry.packet.pivot, angle(t)).multiply(
          entry.base,
        );
        p.mesh.setMatrixAt(i, this.matrix);
      }
      p.mesh.instanceMatrix.needsUpdate = true;
    }
    this.shown = true;
  }
  hide() {
    if (!this.shown) return;
    for (const p of this.proxies) {
      p.source.visible = p.visible;
      p.mesh.visible = false;
    }
    this.shown = false;
  }
  dispose() {
    if (this.dead) return;
    this.hide();
    for (const p of this.proxies) {
      p.mesh.removeFromParent();
      p.mesh.dispose();
      p.material.dispose();
    }
    this.dead = true;
  }
}
