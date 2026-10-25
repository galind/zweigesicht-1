import * as THREE from 'three';

/** Millimetre-scale, nonrepeating detail over the procedural contact bake.
 * No geometry displacement: seating, clearances and collision stay authoritative.
 */
export function finishBenchSurface(material: THREE.MeshStandardMaterial) {
  const stand = material.name === 'Stand oak';
  const wood = material.name === 'Oak' || stand;
  if (!wood && material.name !== 'Matte green') return;
  if (wood) material.envMapIntensity = 0.65;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      (wood ? 'attribute vec3 _wood_coord;\n' : '') +
      'varying vec3 benchSurfacePosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nbenchSurfacePosition = ' +
        (wood ? '_wood_coord;' : '(modelMatrix * vec4(transformed, 1.0)).xyz;'),
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
        // Each real wooden component has an authored millimetre frame. X is
        // along the fibres, Y/Z cut across the same solid grain at its ends.
        vec3 p = surfaceP * ${stand ? '1.15' : '1.0'};
        float drift = surfaceNoise(p * vec3(0.018, 0.07, 0.035)) - 0.5;
        float radial = length(vec2(p.y + 48.0, p.z * 0.72 + 22.0 + drift * 3.0));
        // Irregular growth spacing rather than periodic stripes. The warped
        // radial field remains continuous across the face, ends and bores.
        vec3 bandP = vec3(p.x * 0.026, radial * 0.85, 3.1);
        float band = surfaceNoise(bandP) - 0.5;
        vec3 veinP = vec3(p.x * 0.065 + drift, radial * 3.2, p.y * 0.22);
        float veinFade = 1.0 - smoothstep(0.35, 1.6, length(fwidth(veinP)));
        float latewood = (smoothstep(0.52, 0.8, surfaceNoise(veinP)) - 0.12) * veinFade;
        // Small isolated ellipsoidal vessels, with independently jittered
        // centers and occupancy. Their footprint vanishes before aliasing.
        vec3 poreP = p * vec3(2.5, 35.0, 35.0);
        vec3 cell = floor(poreP);
        vec3 center = vec3(surfaceHash(cell + 4.7), surfaceHash(cell + 13.1), surfaceHash(cell + 25.9));
        vec3 vessel = (fract(poreP) - (0.3 + 0.4 * center)) * vec3(1.0, 1.4, 1.4);
        float poreFade = 1.0 - smoothstep(0.2, 0.9, length(fwidth(poreP)));
        float pores = (1.0 - smoothstep(0.16, 0.28, length(vessel))) *
          step(0.55, surfaceHash(cell + 37.2)) * poreFade;
        vec3 fibreP = p * vec3(0.5, 60.0, 60.0);
        float fibreFade = 1.0 - smoothstep(0.35, 1.6, length(fwidth(fibreP)));
        float fibre = (surfaceNoise(fibreP) - 0.5) * fibreFade;
        float tone = surfaceNoise(p * vec3(0.035, 0.1, 0.16)) - 0.5;
        diffuseColor.rgb *= 1.0 + 0.07 * tone + ${stand ? '0.12' : '0.18'} * band
          - 0.085 * latewood - 0.13 * pores + 0.04 * fibre;
        roughnessFactor = clamp(roughnessFactor + 0.06 * pores + 0.025 * fibre, 0.58, 0.82);
        float surfaceHeight = -0.0003 * latewood - 0.001 * pores + 0.0006 * fibre;
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
    `bench-surface-v3-${stand ? 'stand' : wood ? 'oak' : 'mat'}`;
}
