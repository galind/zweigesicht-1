import * as THREE from 'three';

/** Millimetre-scale, nonrepeating detail over the procedural contact bake.
 * No geometry displacement: seating, clearances and collision stay authoritative.
 */
export function finishBenchSurface(material: THREE.MeshStandardMaterial) {
  const wood = material.name === 'Oak';
  if (!wood && material.name !== 'Matte green') return;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'varying vec3 benchSurfacePosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nbenchSurfacePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;',
    );
    shader.fragmentShader =
      `
      varying vec3 benchSurfacePosition;
      float surfaceHash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float surfaceNoise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(mix(surfaceHash(i), surfaceHash(i+vec3(1,0,0)), f.x),
                       mix(surfaceHash(i+vec3(0,1,0)), surfaceHash(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(surfaceHash(i+vec3(0,0,1)), surfaceHash(i+vec3(1,0,1)), f.x),
                       mix(surfaceHash(i+vec3(0,1,1)), surfaceHash(i+vec3(1,1,1)), f.x), f.y), f.z);
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      vec3 surfaceP = benchSurfacePosition;
      ${
        wood
          ? `
        // Long irregular fibres run along X, wrapping continuously over edges.
        float warp = surfaceNoise(surfaceP * vec3(0.025, 0.08, 0.08));
        vec3 grainP = surfaceP * vec3(0.18, 9.0, 9.0) + vec3(0.0, warp, warp);
        float grainFade = 1.0 - smoothstep(0.35, 1.8, length(fwidth(grainP)));
        float fibre = (surfaceNoise(grainP) - 0.5) * grainFade;
        vec3 poreP = surfaceP * vec3(0.055, 1.8, 1.8) + vec3(0.0, warp*2.0, warp*2.0);
        float poreFade = 1.0 - smoothstep(0.35, 1.8, length(fwidth(poreP)));
        float pores = (surfaceNoise(poreP) - 0.5) * poreFade;
        diffuseColor.rgb *= 1.0 + 0.18 * fibre + 0.16 * pores;
        roughnessFactor = clamp(roughnessFactor + 0.06 * fibre, 0.65, 0.82);
        float surfaceHeight = 0.010 * fibre + 0.008 * pores;
      `
          : `
        // Fine moulded rubber, with no repeating UV tile or large colour flecks.
        vec3 grainP = surfaceP * 24.0;
        float grainFade = 1.0 - smoothstep(0.35, 1.8, length(fwidth(grainP)));
        float grain = (surfaceNoise(grainP) - 0.5) * grainFade;
        diffuseColor.rgb *= 1.0 + 0.045 * grain;
        roughnessFactor = clamp(roughnessFactor + 0.035 * grain, 0.92, 1.0);
        float surfaceHeight = 0.004 * grain;
      `
      }
    `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      // Derivative bump in view space; filtered out before subpixel frequencies alias.
      vec3 surfaceDx = dFdx(-vViewPosition), surfaceDy = dFdy(-vViewPosition);
      vec3 surfaceR1 = cross(surfaceDy, normal), surfaceR2 = cross(normal, surfaceDx);
      float surfaceDet = dot(surfaceDx, surfaceR1);
      vec3 surfaceGradient = sign(surfaceDet) *
        (dFdx(surfaceHeight) * surfaceR1 + dFdy(surfaceHeight) * surfaceR2);
      normal = normalize(abs(surfaceDet) * normal - surfaceGradient);
    `,
    );
  };
  material.customProgramCacheKey = () =>
    `bench-surface-v1-${wood ? 'oak' : 'mat'}`;
}
