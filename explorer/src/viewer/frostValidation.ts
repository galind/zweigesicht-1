import * as THREE from 'three';
import { FROST, frostReliefGLSL } from './FrostedSurface';
import type { MovementViewer } from './MovementViewer';

/** Numeric GPU tests of the production relief functions, not appearance approval.
 * An isolated framebuffer leaves source meshes, annotations and materials intact.
 */
export function runFrostChecks(v: MovementViewer) {
  const renderer = v.renderer;
  if (!renderer.extensions.has('EXT_color_buffer_float'))
    return {
      error:
        'Float render-target readback unavailable; frost numeric checks not run',
    };
  const size = 192;
  const target = new THREE.WebGLRenderTarget(size, size, {
    type: THREE.FloatType,
    depthBuffer: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    footprintOnly: { value: false },
    footprintMapping: { value: [1, 0, 0, 1] },
    footprint: { value: 0 },
    offsetMm: { value: 0 },
    seam: { value: false },
  };
  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    defines: { FROST_RELIEF: 1 },
    vertexShader:
      'precision highp float; in vec3 position; void main(){gl_Position=vec4(position,1.0);}',
    fragmentShader: `precision highp float; precision highp int;
      uniform float footprint; uniform float offsetMm; uniform bool seam;
      uniform bool footprintOnly; uniform mat2 footprintMapping;
      out vec4 result;
      ${frostReliefGLSL}
      void main(){
        if(footprintOnly){ result=vec4(frostFootprint(footprintMapping*gl_FragCoord.xy)); return; }
        vec2 p=(gl_FragCoord.xy-vec2(96.0))*.03617+vec2(.127,offsetMm);
        if(seam) p=vec2(floor(gl_FragCoord.x*.5)/${FROST.cellsPerMm.toFixed(1)}
          +(mod(floor(gl_FragCoord.x),2.0)<.5?-0.000001:0.000001),p.y);
        vec3 relief=frostReliefAtFootprint(p,footprint);
        result=vec4(relief,frostRoughness(relief.z));
      }`,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();
  const previous = renderer.getRenderTarget();
  const sample = (footprint: number, offset = 0, seam = false) => {
    uniforms.footprint.value = footprint;
    uniforms.offsetMm.value = offset;
    uniforms.seam.value = seam;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    const pixels = new Float32Array(size * size * 4);
    renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
    return pixels;
  };
  const moments = (pixels: Float32Array) => {
    let x = 0,
      y = 0,
      xx = 0,
      yy = 0,
      xy = 0,
      maxSlope = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const sx = pixels[i],
        sy = pixels[i + 1];
      x += sx;
      y += sy;
      xx += sx * sx;
      yy += sy * sy;
      xy += sx * sy;
      maxSlope = Math.max(maxSlope, Math.hypot(sx, sy));
    }
    const n = pixels.length / 4;
    return {
      x: x / n,
      y: y / n,
      xx: xx / n,
      yy: yy / n,
      xy: xy / n,
      maxSlope,
      unresolved: pixels[2],
      roughness: pixels[3],
    };
  };
  try {
    const resolved = sample(0),
      repeated = sample(0),
      translated = sample(0, 1);
    const m = moments(resolved);
    const samples = [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1, 1.5, 2, 4].map((f) => ({
      footprint: f,
      ...moments(sample(f)),
    }));
    const seams = sample(0, 0, true);
    let maxSeam = 0,
      different = 0;
    for (let i = 0; i < seams.length; i += 8)
      maxSeam = Math.max(
        maxSeam,
        Math.hypot(seams[i] - seams[i + 4], seams[i + 1] - seams[i + 5]),
      );
    for (let i = 0; i < resolved.length; i += 4)
      different +=
        (resolved[i] - translated[i]) ** 2 +
        (resolved[i + 1] - translated[i + 1]) ** 2;
    different /= size * size;
    uniforms.footprintOnly.value = true;
    const derivativeChecks = [
      { matrix: [1, 0, 0, 1], expected: 1 },
      { matrix: [0.4, 0, 0, 1.3], expected: 1.3 },
      { matrix: [0.32, 0.24, -0.78, 1.04], expected: 1.3 },
      { matrix: [0, -1.3, 0.4, 0], expected: 1.3 },
    ].map(({ matrix, expected }) => {
      uniforms.footprintMapping.value = matrix;
      const measured = sample(0);
      return {
        matrix,
        expected,
        maxError: measured.reduce((max, x) => Math.max(max, Math.abs(x - expected)), 0),
      };
    });
    const checks = [
      {
        name: 'Real screen derivatives preserve the major footprint under rotation and foreshortening',
        pass: derivativeChecks.every((c) => c.maxError < 0.0001),
        details: derivativeChecks,
      },
      {
        name: 'GPU relief is finite, nonzero and deterministic',
        pass:
          resolved.every(Number.isFinite) &&
          m.xx > 0.0001 &&
          resolved.every((value, i) => value === repeated[i]),
      },
      {
        name: 'Relief has no preferred direction or net slope',
        pass:
          Math.abs(m.x) < 0.005 &&
          Math.abs(m.y) < 0.005 &&
          m.xx / m.yy > 0.9 &&
          m.xx / m.yy < 1.1 &&
          Math.abs(m.xy) < 0.05 * m.xx,
      },
      {
        name: 'Hash cell boundaries are continuous',
        pass: maxSeam < 0.002,
        details: maxSeam,
      },
      {
        name: 'Source positions one millimetre apart do not repeat',
        pass: different > m.xx + m.yy,
        details: different,
      },
      {
        name: 'Minification smoothly removes slope variance and increases BRDF roughness',
        pass: samples
          .slice(1)
          .every(
            (s, i) =>
              s.xx + s.yy <= samples[i].xx + samples[i].yy + 1e-6 &&
              s.roughness >= samples[i].roughness,
          ),
      },
      {
        name: 'Unresolved frosting retains a finite metallic lobe with zero residual grain',
        pass:
          samples.at(-1)!.xx + samples.at(-1)!.yy < 1e-10 &&
          samples.at(-1)!.roughness > m.roughness &&
          samples.at(-1)!.roughness < 0.7,
      },
    ];
    return {
      checks,
      moments: m,
      samples,
      scope:
        'Production GLSL on this WebGL renderer; visual and temporal review are separate.',
    };
  } finally {
    renderer.setRenderTarget(previous);
    target.dispose();
    geometry.dispose();
    material.dispose();
    v.invalidate();
  }
}
