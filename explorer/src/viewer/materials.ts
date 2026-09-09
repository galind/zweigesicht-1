import * as THREE from 'three';

/** Authored surface interpretations of local maker references, not measured finishes. */
const profiles = {
  steel: { color: 0xc3c9d0, metalness: 1, roughness: 0.2, pattern: 0 },
  bridge: { color: 0xd0d4dc, metalness: 1, roughness: 0.23, pattern: 1 },
  frosted: { color: 0xd9ae8f, metalness: 1, roughness: 0.43, pattern: 3 },
  brass: { color: 0xdcae85, metalness: 1, roughness: 0.25, pattern: 2 },
  barrel: { color: 0xd6a17f, metalness: 1, roughness: 0.3, pattern: 2 },
  ratchet: { color: 0xc7d0da, metalness: 1, roughness: 0.2, pattern: 2 },
  gold: { color: 0xd8b572, metalness: 1, roughness: 0.16, pattern: 0 },
  balance: { color: 0xc69d83, metalness: 1, roughness: 0.22, pattern: 0 },
  crown: { color: 0xd1d5dd, metalness: 1, roughness: 0.12, pattern: 0 },
  blue: { color: 0x287bb8, metalness: 0.92, roughness: 0.19, pattern: 0 },
  spring: { color: 0x304f83, metalness: 1, roughness: 0.25, pattern: 0 },
  ruby: { color: 0xd34f8c, metalness: 0, roughness: 0.09, pattern: 0 },
  shockMass: { color: 0xd2779e, metalness: 0, roughness: 0.12, pattern: 0 },
  leather: { color: 0x684330, metalness: 0, roughness: 0.78, pattern: 3 },
  rubber: { color: 0x17191c, metalness: 0, roughness: 0.7, pattern: 0 },
  enamel: { color: 0x143a69, metalness: 0.12, roughness: 0.12, pattern: 0 },
};
type Finish = keyof typeof profiles;
// Exact definition identity wins over source-name fallbacks. No geometry is modified.
// Full movement coverage by source definition. Unknown physical processes remain
// authored; see docs/FINISHING_REFERENCES.md for confidence by surface family.
const definitions: Record<number, Finish> = {};
for (const [family, ids] of Object.entries({
  frosted: [195],
  bridge: [99, 133, 147, 152, 153, 156, 165, 219, 222, 228, 230, 240],
  barrel: [85, 86, 90, 91],
  ratchet: [131],
  crown: [249, 251],
  blue: [
    9, 107, 122, 123, 136, 138, 139, 166, 168, 169, 170, 180, 181, 189, 191,
    192, 201, 226, 253, 255,
  ],
  steel: [
    53, 55, 57, 60, 61, 68, 72, 87, 88, 93, 95, 97, 103, 105, 113, 120, 121,
    124, 126, 127, 129, 130, 135, 143, 144, 148, 149, 150, 151, 154, 157, 158,
    159, 160, 161, 162, 164, 167, 172, 173, 174, 176, 177, 178, 184, 185, 190,
    193, 211, 214, 217, 220, 234, 237, 242, 244, 246, 248, 252, 254,
  ],
  brass: [
    94, 96, 114, 115, 117, 137, 141, 142, 183, 187, 188, 210, 213, 216, 233,
    235, 238, 243,
  ],
  gold: [100, 111, 118, 163, 179, 200, 203, 206, 207, 224],
  balance: [110],
  ruby: [
    101, 102, 106, 112, 128, 134, 196, 197, 198, 199, 204, 205, 208, 225, 231,
  ],
  spring: [116],
  shockMass: [155],
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
    [33, 77, 78, 81, 82].some(
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
    ['ruby', 'shockMass'].includes(material.name)
  ) {
    material.transmission = enabled ? 0.55 : 0;
  }
}

export function createMaterial(
  name: string,
  definitionId?: string,
  geometry?: THREE.BufferGeometry,
  instanceId?: string,
) {
  const finish = finishFor(name, definitionId, instanceId);
  const material = new THREE.MeshPhysicalMaterial({
    color: finish.color,
    metalness: finish.metalness,
    roughness: finish.roughness,
    anisotropy: finish.pattern === 1 ? 0.48 : finish.pattern === 2 ? 0.55 : 0,
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
if(finishEnabled>.5 && abs(vFinishRole-4.0)<.2) diffuseColor.rgb=vec3(.018,.08,.24);
if(finishEnabled>.5 && abs(vFinishRole-7.0)<.2) diffuseColor.rgb=vec3(.35,.005,.04);
if(finishEnabled>.5 && finishPattern>.5) {
 if(finishPattern<1.5) {
  float field=smoothstep(-.025,-.005,vFinishPosition.z);
  diffuseColor.rgb*=mix(.62,1.0,field);
  float brushed=filteredFinishNoise(vec2(finishUv.x*2.0,finishUv.y*40.0));
  float frost=filteredFinishNoise(finishUv*32.0);
  finishGrain=mix(frost,brushed,field);
  finishHeight=mix(frost*.0007,brushed*.00065,field);
 } else if(finishPattern<2.5) {
  float radius=length(finishUv);
  // Stochastic fine radial variation, without periodic visible concentric rings.
  finishGrain=filteredFinishNoise(vec2(radius*100.0,0.0));
 } else {
  finishGrain=filteredFinishNoise(finishUv*32.0);
  finishHeight=finishGrain*.0006;
 }
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
if(finishEnabled>.5 && finishPattern>.5) {
 roughnessFactor=clamp(roughnessFactor+finishGrain*.14,.09,.85);
 if(finishPattern<2.5) {
  float finishTop=finishPattern<1.5?smoothstep(-.025,-.005,vFinishPosition.z):1.0;
  roughnessFactor=mix(.42,roughnessFactor,finishFace*finishTop);
  roughnessFactor=mix(roughnessFactor,.10,finishBevel);
 }
}
`,
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
vec2 finishDirection=finishPattern>1.5?normalize(finishUv+vec2(1e-8)):vec2(0,1);
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
  material.customProgramCacheKey = () => 'ml01-source-surface-v2';
  return material;
}
