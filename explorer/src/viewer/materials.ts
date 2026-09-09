import * as THREE from 'three';

/** Authored surface interpretations of local maker references, not measured finishes. */
const profiles = {
  steel: { color: 0xc3c9d0, metalness: 1, roughness: 0.2, pattern: 0 },
  bridge: { color: 0xd0d4dc, metalness: 1, roughness: 0.32, pattern: 1 },
  frosted: { color: 0xcfa487, metalness: 0.88, roughness: 0.49, pattern: 3 },
  brass: { color: 0xd3aa59, metalness: 1, roughness: 0.25, pattern: 2 },
  barrel: { color: 0xd7a66d, metalness: 1, roughness: 0.3, pattern: 2 },
  ratchet: { color: 0xc7d0da, metalness: 1, roughness: 0.2, pattern: 2 },
  blue: { color: 0x174e87, metalness: 1, roughness: 0.17, pattern: 0 },
  spring: { color: 0x304f83, metalness: 1, roughness: 0.25, pattern: 0 },
  ruby: { color: 0x9c1746, metalness: 0.08, roughness: 0.12, pattern: 0 },
  leather: { color: 0x684330, metalness: 0, roughness: 0.78, pattern: 3 },
  rubber: { color: 0x17191c, metalness: 0, roughness: 0.7, pattern: 0 },
  enamel: { color: 0x143a69, metalness: 0.12, roughness: 0.12, pattern: 0 },
};
type Finish = keyof typeof profiles;
// Exact definition identity wins over source-name fallbacks. No geometry is modified.
const definitions: Record<number, Finish> = {};
for (const [family, ids] of Object.entries({
  frosted: [195],
  bridge: [147, 99, 133, 219, 222, 228, 230, 240, 251, 156, 165],
  barrel: [85, 86, 90, 91],
  ratchet: [131, 249],
  brass: [
    94, 96, 100, 111, 114, 115, 117, 137, 141, 142, 183, 187, 188, 203, 206,
    207, 210, 213, 216, 224, 233, 235, 238, 243,
  ],
  steel: [
    53, 55, 57, 60, 61, 68, 72, 87, 97, 110, 95, 105, 113, 120, 121, 126, 127,
    129, 130, 143, 144, 151, 152, 153, 154, 159, 160, 161, 164, 167, 172,
    174, 176, 177, 178, 184, 185, 190, 193, 211, 214, 217, 234, 237, 242, 244,
    246, 248, 252, 254,
  ],
  ruby: [112, 155, 204, 205],
  spring: [116],
}))
  for (const id of ids) definitions[id] = family as Finish;

export function finishFor(name: string, definitionId?: string) {
  let family = definitions[Number(definitionId?.split('_').at(-1))];
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
  const finish = { ...profiles[family], family };
  if (family === 'leather' && /dunkelblau/i.test(name)) finish.color = 0x182a41;
  if (family === 'leather' && /schwarz/i.test(name)) finish.color = 0x191b20;
  if (family === 'enamel' && /rot/i.test(name)) finish.color = 0x6c2031;
  return finish;
}

const declarations = /* glsl */ `
varying vec3 vFinishPosition;
varying vec3 vFinishNormal;
uniform vec3 finishOrigin;
uniform float finishAxis;
uniform float finishPattern;
uniform float finishEnabled;
`;
const surface = /* glsl */ `
float finishHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float finishNoise(vec2 p) {
 vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(finishHash(i),finishHash(i+vec2(1,0)),f.x),mix(finishHash(i+vec2(0,1)),finishHash(i+vec2(1,1)),f.x),f.y);
}
vec2 finishPlane(vec3 p) { return finishAxis<.5?p.yz:finishAxis<1.5?p.xz:p.xy; }
`;

export function setFinishEnabled(
  material: THREE.MeshStandardMaterial,
  enabled: boolean,
) {
  const uniform = material.userData.finishEnabled as
    | { value: number }
    | undefined;
  if (uniform) uniform.value = enabled ? 1 : 0;
}

export function createMaterial(
  name: string,
  definitionId?: string,
  geometry?: THREE.BufferGeometry,
) {
  const finish = finishFor(name, definitionId);
  const material = new THREE.MeshStandardMaterial({
    color: finish.color,
    metalness: finish.metalness,
    roughness: finish.roughness,
  });
  material.name = finish.family;
  const origin = new THREE.Vector3(),
    size = new THREE.Vector3();
  geometry?.computeBoundingBox();
  geometry?.boundingBox?.getCenter(origin);
  geometry?.boundingBox?.getSize(size);
  const dimensions = size.toArray(),
    axis = dimensions.indexOf(Math.min(...dimensions));
  const enabled = { value: 1 };
  material.userData.finishEnabled = enabled;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      finishOrigin: { value: origin },
      finishAxis: { value: axis },
      finishPattern: { value: finish.pattern },
      finishEnabled: enabled,
    });
    shader.vertexShader =
      'varying vec3 vFinishPosition;\nvarying vec3 vFinishNormal;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvFinishPosition=position; vFinishNormal=normal;',
      );
    shader.fragmentShader = declarations + surface + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
#include <color_fragment>
vec2 finishUv = finishPlane(vFinishPosition-finishOrigin);
float finishFacing = abs(finishAxis<.5?vFinishNormal.x:finishAxis<1.5?vFinishNormal.y:vFinishNormal.z);
float finishFace = smoothstep(.9,.995,finishFacing);
float finishGrain = .5, finishHeight = 0.0;
if(finishEnabled>.5 && finishPattern>.5) {
 if(finishPattern<1.5) {
  // Fine straight graining follows component coordinates, even during reveals.
  float frequency=12.0;
  float aa=1.0-smoothstep(.35,1.3,fwidth(finishUv.y*frequency));
  finishGrain=mix(.5,finishNoise(vec2(finishUv.x*.35,finishUv.y*frequency)),aa);
  finishGrain += .16*(finishNoise(vec2(finishUv.x*.08,finishUv.y*5.0))-.5);
  finishHeight=(finishGrain-.5)*.0010;
 } else if(finishPattern<2.5) {
  float r=length(finishUv), aa=1.0-smoothstep(.35,1.3,fwidth(r*18.0));
  finishGrain=.5+.28*sin(r*113.097)*aa;
  finishGrain+=.15*(finishNoise(finishUv*2.0)-.5);
  finishHeight=(finishGrain-.5)*.0004;
 } else {
  float aa=1.0-smoothstep(.4,1.7,length(fwidth(finishUv*22.0)));
  finishGrain=mix(.5,finishNoise(finishUv*22.0),aa);
  finishGrain+=.22*(finishNoise(finishUv*8.0)-.5);
  finishHeight=(finishGrain-.5)*.0016;
 }
 diffuseColor.rgb *= 1.0+(finishGrain-.5)*.22*finishFace;
}
`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      /* glsl */ `
#include <roughnessmap_fragment>
if(finishEnabled>.5 && finishPattern>.5) {
 roughnessFactor=clamp(roughnessFactor+(finishGrain-.5)*.12,.09,.85);
 // Existing CAD chamfers catch polished reflections; broad faces keep their graining.
 if(finishPattern<2.5) roughnessFactor=mix(.10,roughnessFactor,finishFace);
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
 normal=normalize(abs(det)*normal-grad*finishFace);
}
`,
    );
  };
  material.customProgramCacheKey = () => 'ml01-source-surface-v1';
  return material;
}
