import * as THREE from 'three';

/** Authored surface interpretations of local maker references, not measured finishes. */
const profiles = {
  steel: { color: 0xc3c9d0, metalness: 1, roughness: 0.2, pattern: 0 },
  brushedSteel: { color: 0xc3c9d0, metalness: 1, roughness: 0.31, pattern: 4 },
  bridge: { color: 0xd0d4dc, metalness: 1, roughness: 0.23, pattern: 1 },
  warmPlate: { color: 0xd9ab94, metalness: 1, roughness: 0.24, pattern: 1 },
  frosted: { color: 0xd9ae8f, metalness: 1, roughness: 0.51, pattern: 3 },
  brass: { color: 0xdcae85, metalness: 1, roughness: 0.31, pattern: 2 },
  barrel: { color: 0xd6a17f, metalness: 1, roughness: 0.34, pattern: 2 },
  ratchet: { color: 0xc7d0da, metalness: 1, roughness: 0.29, pattern: 2 },
  gold: { color: 0xd8b572, metalness: 1, roughness: 0.16, pattern: 0 },
  balance: { color: 0xc69d83, metalness: 1, roughness: 0.22, pattern: 0 },
  crown: { color: 0xd1d5dd, metalness: 1, roughness: 0.12, pattern: 0 },
  blue: { color: 0x287bb8, metalness: 0.92, roughness: 0.19, pattern: 0 },
  spring: { color: 0x304f83, metalness: 1, roughness: 0.25, pattern: 0 },
  ruby: { color: 0xd34f8c, metalness: 0, roughness: 0.09, pattern: 0 },
  shockMass: { color: 0xd2779e, metalness: 0, roughness: 0.12, pattern: 0 },
  leather: { color: 0x684330, metalness: 0, roughness: 0.78, pattern: 3 },
  rubber: { color: 0x17191c, metalness: 0, roughness: 0.7, pattern: 0 },
  enamel: { color: 0x143a69, metalness: 0, roughness: 0.12, pattern: 0 },
  sapphire: { color: 0xffffff, metalness: 0, roughness: 0.035, pattern: 0 },
  diamond: { color: 0xffffff, metalness: 0, roughness: 0.025, pattern: 0 },
};
type Finish = keyof typeof profiles;
const screwDefinitions = [
  9, 107, 122, 123, 136, 138, 139, 166, 168, 169, 170, 180, 181, 189, 191,
  192, 201, 226, 253, 255,
];
// Exact definition identity wins over source-name fallbacks. No geometry is modified.
// Full movement coverage by source definition. Unknown physical processes remain
// authored; see docs/FINISHING_REFERENCES.md for confidence by surface family.
const definitions: Record<number, Finish> = {};
for (const [family, ids] of Object.entries({
  frosted: [195],
  warmPlate: [105, 120],
  bridge: [99, 133, 147, 152, 153, 156, 165, 219, 222, 228, 230, 240],
  barrel: [85, 86, 90, 91],
  ratchet: [97, 131, 172],
  // Flat keyless levers/springs, including both source setting-spring variants.
  // Unlike bridge feet these faces are brushed on both sides of local Z0.
  brushedSteel: [174, 176, 178, 190, 193, 244, 246, 248],
  crown: [249, 251],
  blue: screwDefinitions,
  steel: [
    53, 55, 57, 60, 61, 68, 72, 87, 88, 93, 95, 103, 113, 121, 124, 126,
    127, 129, 130, 135, 143, 144, 148, 149, 150, 151, 154, 157, 158, 159, 160,
    161, 162, 164, 167, 173, 177, 184, 185, 211,
    214, 217, 220, 234, 237, 242, 252, 254,
  ],
  brass: [
    94, 96, 114, 115, 117, 137, 141, 142, 183, 187, 188, 210, 213, 216, 233,
    235, 238, 243,
  ],
  gold: [100, 111, 118, 163, 179, 200, 203, 206, 207, 224],
  balance: [110],
  ruby: [101, 102, 106, 112, 128, 134, 196, 197, 198, 199, 204, 205, 208, 231],
  sapphire: [67],
  diamond: [225],
  spring: [116],
  shockMass: [155],
}))
  for (const id of ids) definitions[id] = family as Finish;

// Reviewed optional catalog identities. Keep material-bearing rings separate
// from enamel inserts and hands; name fallbacks conflated all three.
for (const [family, ids] of Object.entries({
  steel: [
    3, 5, 14, 17, 23, 26, 27, 46, 48, 52, 54, 56, 59, 62, 70, 71, 73, 75, 76,
    77, 256,
  ],
  blue: [
    7, 8, 11, 12, 13, 16, 18, 19, 24, 28, 29, 30, 31, 32, 34, 35, 38, 39, 41,
    42,
  ],
  gold: [25, 36],
  enamel: [4, 21],
  rubber: [44, 47, 66, 78],
  leather: [50, 63, 64, 80, 81, 82],
}))
  for (const id of ids) definitions[id] = family as Finish;

export function finishFor(
  name: string,
  definitionId?: string,
  instanceId?: string,
) {
  let family = /^d_0_1_1_\d+$/.test(definitionId ?? '')
    ? definitions[Number(definitionId!.split('_').at(-1))]
    : undefined;
  let assignment = family ? 'source-definition' : 'catalog-fallback';
  // Photographed crown-cap / click fasteners; shared d181 stays blue elsewhere.
  if (
    [33, 43, 44, 45, 77, 78, 81, 82].some(
      (i) => instanceId === `p_0_1_1_1__0_1_1_1_4__0_1_1_83_${i}`,
    )
  ) {
    family = 'steel';
    assignment = 'source-instance';
  }
  if (!family) {
    if (/^030-|rubin|ellipse|hebestein/i.test(name)) family = 'ruby';
    else if (name.startsWith('010-') && !/\bss\b/i.test(name)) family = 'blue';
    else if (
      /^020-|stift|trieb|welle|hebel|anker|flitter|feder|butzen|schale/i.test(
        name,
      )
    )
      family = /\bms\b/i.test(name) ? 'brass' : 'steel';
    else if (/grundplatin|werkplatte|grundplatte/i.test(name))
      family = 'frosted';
    else if (/brücke|bruecke|deckplättchen/i.test(name)) family = 'bridge';
    else if (/trommel|federhausdeckel/i.test(name)) family = 'barrel';
    else if (/kronrad|sperrrad/i.test(name)) family = 'ratchet';
    else if (/rad|unruhreif|chaton|rolle|buchse/i.test(name)) family = 'brass';
    else if (/lederband/i.test(name)) family = 'leather';
    else if (/dring|dichtung/i.test(name)) family = 'rubber';
    else if (/emaille|zb ring|zeiger/i.test(name)) family = 'enamel';
    else family = 'steel';
  }
  const finish = { ...profiles[family], family, assignment };
  if (family === 'leather' && /dunkelblau/i.test(name)) finish.color = 0x182a41;
  if (family === 'leather' && /schwarz/i.test(name)) finish.color = 0x191b20;
  if (family === 'enamel' && /rot/i.test(name)) finish.color = 0x6c2031;
  return finish;
}

// Source CAD uses local Z for the reviewed rotational and plate definitions.
// Periods below are authored millimetre scales, not measured machining values.
const declarations = /* glsl */ `
varying vec3 vFinishPosition;
varying vec3 vFinishNormal;
varying vec3 vFinishX;
varying vec3 vFinishY;
varying float vFinishRole;
uniform float finishPattern;
uniform float finishEnabled;
uniform float finishEngraved;
uniform float finishWholeBlue;
uniform float finishFrosted;
`;
const surface = /* glsl */ `
float finishHash(vec2 p) {
 vec3 p3=fract(vec3(p.xyx)*.1031);
 p3+=dot(p3,p3.yzx+33.33);
 return fract((p3.x+p3.y)*p3.z);
}
float finishNoise(vec2 p) {
 vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(finishHash(i),finishHash(i+vec2(1,0)),f.x),mix(finishHash(i+vec2(0,1)),finishHash(i+vec2(1,1)),f.x),f.y);
}
float filteredFinishNoise(vec2 p) {
 float footprint=max(length(dFdx(p)),length(dFdy(p)));
 return (finishNoise(p)-.5)*(1.0-smoothstep(.4,1.8,footprint));
}
// Several irregular scales keep satin readable at assembly distance, while
// derivatives fade only the unresolved scratches instead of the entire finish.
float finishFrost(vec2 p) {
 return filteredFinishNoise(p*10.0)*.55
      + filteredFinishNoise(p*32.0)*.32
      + filteredFinishNoise(p*80.0)*.13;
}
float finishBrush(vec2 p) {
 return filteredFinishNoise(p*vec2(.65,20.0))*.45
      + filteredFinishNoise(p*vec2(2.0,55.0))*.35
      + filteredFinishNoise(p*vec2(4.0,120.0))*.2;
}
`;

export function setFinishEnabled(
  material: THREE.MeshStandardMaterial,
  enabled: boolean,
) {
  const uniform = material.userData.finishEnabled as
    | { value: number }
    | undefined;
  if (uniform) uniform.value = enabled ? 1 : 0;
  if (
    material instanceof THREE.MeshPhysicalMaterial &&
    ['ruby', 'shockMass', 'sapphire', 'diamond'].includes(material.name)
  ) {
    material.transmission = enabled
      ? material.name === 'sapphire'
        ? 0.98
        : material.name === 'diamond'
          ? 0.92
          : 0.55
      : 0;
  }
}

export function createMaterial(
  name: string,
  definitionId?: string,
  geometry?: THREE.BufferGeometry,
  instanceId?: string,
) {
  const finish = finishFor(name, definitionId, instanceId);
  // Bluing covers the entire screw, including the slot, underside and shaft.
  // Retain source face annotations as provenance, but override their CAD colors.
  // Instance-level steel assignments and neutral hand seats remain independent.
  const wholeBlue = finish.family === 'blue' &&
    screwDefinitions.includes(Number(definitionId?.split('_').at(-1)));
  const material = new THREE.MeshPhysicalMaterial({
    color: finish.color,
    metalness: finish.metalness,
    roughness: finish.roughness,
    anisotropy: finish.pattern === 1 ? 0.48 : finish.pattern === 2 ? 0.68 : finish.pattern === 4 ? 0.6 : 0,
  });
  material.name = finish.family;
  if (geometry?.hasAttribute('sourceFinishNormal'))
    material.defines = { ...material.defines, SOURCE_FINISH: 1 };
  if (['ruby', 'shockMass'].includes(finish.family)) {
    material.ior = 1.76;
    material.transmission = 0.55;
    material.thickness = 0.3;
    material.attenuationColor.setHex(0xb52c67);
    material.attenuationDistance = 0.45;
  }
  if (finish.family === 'sapphire' || finish.family === 'diamond') {
    // Authored optical emulation; source geometry is retained. Single-layer
    // transmission cannot reproduce a diamond's internal multiple reflections.
    material.ior = finish.family === 'diamond' ? 2.417 : 1.76;
    material.transmission = finish.family === 'diamond' ? 0.92 : 0.98;
    material.thickness = finish.family === 'diamond' ? 1.26 : 1;
    material.attenuationDistance = Infinity;
  }
  // Kept for the existing catalog framing cache; never change source buffers.
  geometry?.computeBoundingBox();
  const enabled = { value: 1 };
  material.userData.finishEnabled = enabled;
  const etched = [99, 222, 228, 230].includes(
    Number(definitionId?.split('_').at(-1)),
  );
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      finishPattern: { value: finish.pattern },
      finishEnabled: enabled,
      finishEngraved: { value: etched ? 1 : 0 },
      finishWholeBlue: { value: wholeBlue ? 1 : 0 },
      finishFrosted: { value: finish.family === 'frosted' ? 1 : 0 },
    });
    shader.vertexShader =
      'varying vec3 vFinishPosition;\nvarying vec3 vFinishNormal;\nvarying vec3 vFinishX;\nvarying vec3 vFinishY;\nvarying float vFinishRole;\n#ifdef SOURCE_FINISH\nattribute vec3 sourceFinishNormal;\nattribute float sourceFinishRole;\n#endif\n' +
      shader.vertexShader
        .replace(
          '#include <beginnormal_vertex>',
          '#include <beginnormal_vertex>\n#ifdef SOURCE_FINISH\nobjectNormal=sourceFinishNormal;\n#endif',
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvFinishPosition=position; vFinishNormal=normal; vFinishRole=0.0;\n#ifdef SOURCE_FINISH\nvFinishNormal=sourceFinishNormal; vFinishRole=sourceFinishRole;\n#endif\nvFinishX=mat3(modelViewMatrix)*vec3(1,0,0); vFinishY=mat3(modelViewMatrix)*vec3(0,1,0);',
        );
    shader.fragmentShader = declarations + surface + shader.fragmentShader;
    if (finish.family === 'sapphire' || finish.family === 'diamond') {
      // r186 clears the transmission buffer white/alpha .5 on an alpha canvas.
      // That empty-space sentinel otherwise becomes a white disc. Replace only
      // the uncovered fraction with a dark studio backdrop; opaque scene samples
      // remain unchanged. This is a backdrop approximation, not internal gem rays.
      const transmission = THREE.ShaderChunk.transmission_pars_fragment.replace(
        'return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );',
        `vec4 sampled = textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
         float uncovered = clamp((1.0-sampled.a)*2.0,0.0,1.0);
         sampled.rgb = max(sampled.rgb-vec3(uncovered),vec3(0.0))
           + vec3(.012,.019,.024)*uncovered;
         sampled.a = 1.0;
         return sampled;`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <transmission_pars_fragment>',
        transmission,
      );
    }
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
#include <color_fragment>
vec2 finishUv=vFinishPosition.xy;
float finishFacing=abs(normalize(vFinishNormal).z);
float finishFace=smoothstep(.96,.999,finishFacing);
// Only existing inclined faces receive a polish; vertical walls stay satin.
float finishBevel=smoothstep(.12,.4,finishFacing)*(1.0-smoothstep(.85,.98,finishFacing));
float finishGrain=0.0;
float finishHeight=0.0;
float finishField=1.0;
float finishFrostMask=finishFrosted;
// Only separately audited source regions may cross metal/dielectric families.
if(finishEnabled>.5 && finishWholeBlue<.5 && abs(vFinishRole-2.0)<.2) diffuseColor.rgb=vec3(.546,.584,.631);
if(finishEnabled>.5 && abs(vFinishRole-5.0)<.2) diffuseColor.rgb=vec3(.006);
if(finishEnabled>.5 && abs(vFinishRole-4.0)<.2) diffuseColor.rgb=vec3(.018,.08,.24);
if(finishEnabled>.5 && abs(vFinishRole-7.0)<.2) diffuseColor.rgb=vec3(.35,.005,.04);
if(finishEnabled>.5 && finishPattern>.5) {
 if(finishPattern<1.5 || finishPattern>3.5) {
  finishField=finishPattern>3.5?1.0:smoothstep(-.025,-.005,vFinishPosition.z);
  diffuseColor.rgb*=mix(.62,1.0,finishField);
  float brushed=finishPattern>3.5?finishBrush(finishUv):filteredFinishNoise(finishUv*vec2(2.0,40.0));
  float frost=finishFrost(finishUv);
  finishFrostMask=1.0-finishField;
  finishGrain=mix(frost,brushed,finishField);
  finishHeight=mix(frost*.009,brushed*(finishPattern>3.5?.0012:.00065),finishField);
 } else if(finishPattern<2.5) {
  float radius=length(finishUv);
  // Irregular concentric brushing around the original source axle. The slow
  // XY variation breaks up perfect lathe rings without an angular seam.
  float wander=finishNoise(finishUv*1.7)*.035;
  finishGrain=filteredFinishNoise(vec2((radius+wander)*20.0,0.0))*.45
    + filteredFinishNoise(vec2((radius+wander*.5)*55.0,7.0))*.35
    + filteredFinishNoise(vec2(radius*120.0,19.0))*.2;
  finishHeight=finishGrain*.0012;
 } else {
  finishGrain=finishFrosted>.5?finishFrost(finishUv):filteredFinishNoise(finishUv*32.0);
  finishHeight=finishGrain*mix(.0006,.009,finishFrosted);
 }
 // Small reflectance variation carries the grain through broad studio lights;
 // existing chamfers stay distinct from the textured flat fields.
 if(finishPattern<2.5 || finishPattern>3.5 || finishFrosted>.5)
  diffuseColor.rgb*=1.0+finishGrain*mix(.34,.48,finishFrostMask)*finishFace;
 if(vFinishRole>5.5) diffuseColor.rgb*=.64;
 // Existing recessed decoration on audited bridges. This is reversible surface
 // shading of source floors, never fabricated text, outlines or bevel geometry.
 if(finishEngraved>.5) {
  float floorMask=1.0-smoothstep(.003,.012,abs(vFinishPosition.z+.1));
  float textMask=1.0-smoothstep(.002,.009,abs(vFinishPosition.z+.07));
  float ink=max(floorMask,textMask)*finishFace;
  #ifdef SOURCE_FINISH
  ink=1.0-step(.2,abs(vFinishRole-3.0));
  #endif
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.008,.018,.05),ink*.9);
 }
}
`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      /* glsl */ `
#include <roughnessmap_fragment>
if(finishEnabled>.5 && finishWholeBlue<.5 && abs(vFinishRole-2.0)<.2) roughnessFactor=.2;
if(finishEnabled>.5 && abs(vFinishRole-5.0)<.2) roughnessFactor=.25;
if(finishEnabled>.5 && finishPattern>.5) {
 float finishContrast=finishPattern>2.5 && finishPattern<3.5 && finishFrosted<.5?.14:.24;
 roughnessFactor=clamp(roughnessFactor+finishGrain*finishContrast,.09,.85);
 if(finishPattern<2.5 || finishPattern>3.5) {
  roughnessFactor=mix(.42,roughnessFactor,finishFace);
  roughnessFactor=mix(roughnessFactor,.52+finishGrain*.24,finishFace*finishFrostMask);
  roughnessFactor=mix(roughnessFactor,.10,finishBevel);
 }
}
`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <metalnessmap_fragment>',
      '#include <metalnessmap_fragment>\nif(finishEnabled>.5 && abs(vFinishRole-5.0)<.2) metalnessFactor=0.0;',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      /* glsl */ `
#include <normal_fragment_maps>
if(finishEnabled>.5 && finishPattern>.5) {
 vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
 vec3 r1=cross(dy,normal),r2=cross(normal,dx);
 float det=dot(dx,r1);
 vec3 grad=sign(det)*(dFdx(finishHeight)*r1+dFdy(finishHeight)*r2);
 normal=normalize(max(abs(det),1e-12)*normal-grad*finishFace);
}
#ifdef USE_ANISOTROPY
// Source-local frame avoids dependence on absent CAD UVs or tangent attributes.
vec2 finishDirection=finishPattern>1.5 && finishPattern<2.5?normalize(finishUv+vec2(1e-8)):vec2(0,1);
vec3 finishT=vFinishX*finishDirection.x+vFinishY*finishDirection.y;
finishT-=normal*dot(normal,finishT);
if(dot(finishT,finishT)<1e-8) finishT=cross(normal,abs(normal.z)<.9?vec3(0,0,1):vec3(0,1,0));
finishT=normalize(finishT);
tbn=mat3(finishT,normalize(cross(normal,finishT)),normal);
#endif
`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_physical_fragment>',
      /* glsl */ `
#include <lights_physical_fragment>
#ifdef USE_ANISOTROPY
material.anisotropy*=finishFace*finishEnabled;
if(finishPattern<1.5) material.anisotropy*=smoothstep(-.025,-.005,vFinishPosition.z);
material.alphaT=mix(pow2(material.roughness),1.0,pow2(material.anisotropy));
#endif
`,
    );
  };
  material.customProgramCacheKey = () =>
    ['sapphire', 'diamond'].includes(finish.family)
      ? 'ml01-source-surface-clear-v5'
      : 'ml01-source-surface-v5';
  return material;
}
