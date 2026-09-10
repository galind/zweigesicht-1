import * as THREE from 'three';

/** Authored surface interpretations of local maker references, not measured finishes. */
const profiles = {
  steel: { color: 0xc7cdd4, metalness: 1, roughness: 0.18, pattern: 0 },
  brushedSteel: { color: 0xc9ced5, metalness: 1, roughness: 0.28, pattern: 4 },
  bridge: { color: 0xd4d8de, metalness: 1, roughness: 0.25, pattern: 1 },
  warmPlate: { color: 0xd4a58e, metalness: 1, roughness: 0.27, pattern: 1 },
  frosted: { color: 0xd2a48b, metalness: 1, roughness: 0.49, pattern: 3 },
  brass: { color: 0xd9aa7d, metalness: 1, roughness: 0.27, pattern: 2 },
  barrel: { color: 0xd2a079, metalness: 1, roughness: 0.3, pattern: 2 },
  ratchet: { color: 0xc7d0da, metalness: 1, roughness: 0.29, pattern: 2 },
  gold: { color: 0xd8b572, metalness: 1, roughness: 0.16, pattern: 0 },
  satinGold: { color: 0xd8b572, metalness: 1, roughness: 0.31, pattern: 2 },
  roseGold: { color: 0xd9ab94, metalness: 1, roughness: 0.16, pattern: 0 },
  balance: { color: 0xc69d83, metalness: 1, roughness: 0.22, pattern: 0 },
  crown: { color: 0xbac1ca, metalness: 1, roughness: 0.055, pattern: 5 },
  blackPolished: { color: 0xaeb6c0, metalness: 1, roughness: 0.055, pattern: 5 },
  dialSilver: { color: 0xd5d8dc, metalness: 1, roughness: 0.25, pattern: 6 },
  blue: { color: 0x0b3768, metalness: 1, roughness: 0.13, pattern: 0 },
  spring: { color: 0x304f83, metalness: 1, roughness: 0.25, pattern: 0 },
  ruby: { color: 0xb72b68, metalness: 0, roughness: 0.055, pattern: 0 },
  leather: { color: 0x684330, metalness: 0, roughness: 0.78, pattern: 3 },
  rubber: { color: 0x17191c, metalness: 0, roughness: 0.7, pattern: 0 },
  enamel: { color: 0x062e78, metalness: 0, roughness: 0.065, pattern: 0 },
  sapphire: { color: 0xffffff, metalness: 0, roughness: 0.035, pattern: 0 },
  diamond: { color: 0xffffff, metalness: 0, roughness: 0.025, pattern: 0 },
};
type Finish = keyof typeof profiles;
// Shared straight-brush controls: updating a family affects all its parts.
// Circular gear finishes keep their existing response.
const brushingDetail: Partial<Record<Finish, number>> = {
  bridge: 2.6,
  brushedSteel: 1.65,
  warmPlate: 1.65,
};
// Authored frosting controls: grain frequency per mm, optical depth and
// roughness contrast. Source face masks independently define placement.
const frostingDetail = {
  plate: { scale: 12, depth: .006, contrast: .26 },
  mounting: { scale: 16, depth: .0045, contrast: .22 },
};
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
  ratchet: [97, 131, 172, 249],
  // Flat keyless levers/springs, including both source setting-spring variants.
  // Unlike bridge feet these faces are brushed on both sides of local Z0.
  brushedSteel: [174, 176, 178, 190, 193, 244, 246, 248],
  crown: [251],
  blue: screwDefinitions,
  steel: [
    53, 55, 57, 60, 61, 68, 72, 87, 88, 93, 95, 103, 113, 114, 117, 124, 126,
    127, 129, 130, 135, 137, 142, 143, 144, 148, 149, 150, 151, 154,
    157, 158, 159, 160, 161, 162, 164, 167, 173, 177, 183, 184, 185, 188,
    211, 214, 217, 220, 234, 235, 237, 242, 252, 254,
  ],
  brass: [
    94, 96, 115, 141, 187, 210, 213, 216, 233, 238, 243,
  ],
  gold: [118, 163, 179, 200, 206],
  satinGold: [121],
  roseGold: [100, 203, 207, 224],
  balance: [110, 111],
  ruby: [101, 102, 106, 112, 128, 134, 155, 196, 197, 198, 199, 204, 205, 208, 231],
  sapphire: [67],
  diamond: [225],
  spring: [116],
}))
  for (const id of ids) definitions[id] = family as Finish;

// Reviewed optional catalog identities. Keep material-bearing rings separate
// from enamel inserts and hands; name fallbacks conflated all three.
for (const [family, ids] of Object.entries({
  dialSilver: [3, 14, 17, 26],
  steel: [
    5, 23, 27, 46, 48, 52, 54, 56, 59, 62, 70, 71, 73, 75, 76,
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
  // Exact source instances: rear-facing screws, hairspring stud screw, and
  // previously reviewed neutral fasteners. Shared screw definitions stay blue.
  if (
    [11, 25, 33, 43, 44, 45, 48, 49, 50, 51, 52, 67, 68, 71, 72, 77, 78, 81, 82].some(
      (i) => instanceId === `p_0_1_1_1__0_1_1_1_4__0_1_1_83_${i}`,
    ) || ['11', '12'].some(
      (i) => instanceId === `p_0_1_1_1__0_1_1_1_4__0_1_1_83_54__0_1_1_194_${i}`,
    ) || [9, 20, 21, 24, 27, 32, 33].some(
      (i) => instanceId === `p_0_1_1_1__0_1_1_1_4__0_1_1_83_29__0_1_1_145_${i}`,
    ) || instanceId === 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_59__0_1_1_221_7'
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
  // Match the balance rim's color while retaining the eccentric's polish.
  if (definitionId === 'd_0_1_1_111') finish.roughness = 0.16;
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
varying vec3 vFinishViewNormal;
varying vec3 vFinishX;
varying vec3 vFinishY;
varying float vFinishRole;
uniform float finishPattern;
uniform float finishBrushDetail;
uniform float finishEnabled;
uniform float finishEngraved;
uniform float finishWholeBlue;
uniform float finishFrosted;
uniform vec3 finishFrostDetail;
uniform float finishSnailing;
uniform float finishSnailTurn;
uniform float finishRadius;
uniform vec2 finishBrushAxis;
uniform float finishCapSeat;
uniform float finishShockBlock;
uniform float finishHeatBlue;
uniform float finishBlackPolished;
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
// Jittered cellular grains provide irregular pits/ridges rather than soft
// cloudy noise. Screen-space filtering removes grains below pixel resolution.
float finishFrost(vec2 p) {
 vec2 q=p*finishFrostDetail.x;
 q+=1.6*vec2(finishNoise(q*.43),finishNoise(q*.43+vec2(37.1,9.2)));
 vec2 cell=floor(q), f=fract(q);
 float nearest=4.0;
 for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) {
  vec2 offset=vec2(float(x),float(y));
  vec2 seed=cell+offset;
  vec2 jitter=vec2(finishHash(seed),finishHash(seed+vec2(19.7,71.3)));
  vec2 delta=offset+.15+.7*jitter-f;
  nearest=min(nearest,dot(delta,delta));
 }
 float footprint=max(length(dFdx(q)),length(dFdy(q)));
 float filtered=1.0-smoothstep(.35,1.3,footprint);
 float grains=(.3-sqrt(nearest))*filtered;
 return grains*.78+filteredFinishNoise(q*3.7)*.22;
}
float finishBrush(vec2 p) {
 // A wider strand layer survives normal bridge framing, while the finer
 // layers retain close-up detail. Derivative filtering still prevents shimmer.
 return filteredFinishNoise(p*vec2(.45,32.0))*.35
      + filteredFinishNoise(p*vec2(.8,90.0))*.3
      + filteredFinishNoise(p*vec2(2.2,230.0))*.23
      + filteredFinishNoise(p*vec2(5.0,520.0))*.12;
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
    ['ruby', 'enamel', 'sapphire', 'diamond'].includes(material.name)
  ) {
    material.transmission = enabled
      ? ((material.userData.finishTransmission as number | undefined) ?? 0)
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
    anisotropy: finish.pattern === 1 ? 0.52 : finish.pattern === 2 ? 0.58 : finish.pattern === 4 ? 0.55 : finish.pattern === 6 ? 0.48 : 0,
  });
  material.name = finish.family;
  if (geometry?.hasAttribute('sourceFinishNormal'))
    material.defines = { ...material.defines, SOURCE_FINISH: 1 };
  if (finish.family === 'ruby') {
    material.ior = 1.76;
    material.transmission = 0.72;
    material.thickness = 0.55;
    material.attenuationColor.setHex(0x9b174f);
    material.attenuationDistance = 0.7;
    material.clearcoat = 1;
    material.clearcoatRoughness = 0.035;
  }
  if (finish.family === 'enamel') {
    material.ior = 1.53;
    // Raw catalog enamel retains its source-color inspection. The fitted blue
    // chapter ring supplies the translucent optical target in retarget().
    material.transmission = 0;
    material.thickness = 0.35;
    material.attenuationColor.setHex(0x063b9a);
    material.attenuationDistance = 0.65;
    material.clearcoat = 1;
    material.clearcoatRoughness = 0.035;
  }
  if (finish.family === 'sapphire' || finish.family === 'diamond') {
    // Authored optical emulation; source geometry is retained. Single-layer
    // transmission cannot reproduce a diamond's internal multiple reflections.
    material.ior = finish.family === 'diamond' ? 2.417 : 1.76;
    material.transmission = finish.family === 'diamond' ? 0.92 : 0.98;
    material.thickness = finish.family === 'diamond' ? 1.26 : 1;
    material.attenuationDistance = Infinity;
  }
  material.userData.finishTransmission = material.transmission;
  // Kept for the existing catalog framing cache; never change source buffers.
  geometry?.computeBoundingBox();
  const bounds = geometry?.boundingBox;
  const radius = bounds ? Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x), Math.abs(bounds.min.y), Math.abs(bounds.max.y)) : 6;
  // d105 screw axes are (+/-.75,-1.1), jewel axis (0,0): grain follows +Y.
  const brushAxis = new THREE.Vector2(definitionId === 'd_0_1_1_105' ? 0 : 1, definitionId === 'd_0_1_1_105' ? 1 : 0);
  // d240 source placement rotates local X by 8 degrees from assembly horizontal.
  // Counter-rotate the grain and its reflection frame; keep the CAD pose intact.
  if (definitionId === 'd_0_1_1_240') brushAxis.set(Math.cos(Math.PI * 8 / 180), -Math.sin(Math.PI * 8 / 180));
  const enabled = { value: 1 };
  material.userData.finishEnabled = enabled;
  const etched = [99, 219, 222, 228].includes(
    Number(definitionId?.split('_').at(-1)),
  );
  const frost = finish.family === 'frosted' ? frostingDetail.plate : frostingDetail.mounting;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      finishPattern: { value: finish.pattern },
      finishBrushDetail: { value: brushingDetail[finish.family] ?? 1 },
      finishEnabled: enabled,
      finishEngraved: { value: etched ? 1 : 0 },
      finishWholeBlue: { value: wholeBlue ? 1 : 0 },
      finishFrostDetail: { value: new THREE.Vector3(frost.scale, frost.depth, frost.contrast) },
      finishFrosted: { value: finish.family === 'frosted' ? 1 : 0 },
      finishSnailing: { value: finish.family === 'barrel' ? 1 : 0 },
      // Right-hand drum/lid local XY has the opposite handedness to the left.
      // Reverse its source-local winding, preserving the left barrel's finish.
      finishSnailTurn: { value: ['d_0_1_1_90', 'd_0_1_1_91'].includes(definitionId ?? '') ? -1.15 : 1.15 },
      finishRadius: { value: Math.max(radius, .01) },
      finishBrushAxis: { value: brushAxis },
      finishCapSeat: { value: definitionId === 'd_0_1_1_99' ? 1 : 0 },
      finishShockBlock: { value: definitionId === 'd_0_1_1_159' ? 1 : 0 },
      finishHeatBlue: { value: finish.family === 'blue' || finish.family === 'spring' ? 1 : 0 },
      finishBlackPolished: { value: ['blackPolished', 'crown'].includes(finish.family) ? 1 : 0 },
    });
    shader.vertexShader =
      'varying vec3 vFinishPosition;\nvarying vec3 vFinishNormal;\nvarying vec3 vFinishViewNormal;\nvarying vec3 vFinishX;\nvarying vec3 vFinishY;\nvarying float vFinishRole;\n#ifdef SOURCE_FINISH\nattribute vec3 sourceFinishNormal;\nattribute float sourceFinishRole;\n#endif\n' +
      shader.vertexShader
        .replace(
          '#include <beginnormal_vertex>',
          '#include <beginnormal_vertex>\n#ifdef SOURCE_FINISH\nobjectNormal=sourceFinishNormal;\n#endif',
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvFinishPosition=position; vFinishNormal=normal; vFinishRole=0.0;\n#ifdef SOURCE_FINISH\nvFinishNormal=sourceFinishNormal; vFinishRole=sourceFinishRole;\n#endif\nvFinishViewNormal=normalize(normalMatrix*vFinishNormal);\nvFinishX=mat3(modelViewMatrix)*vec3(1,0,0); vFinishY=mat3(modelViewMatrix)*vec3(0,1,0);',
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
vec2 finishBrushUv=vec2(dot(finishUv,finishBrushAxis),dot(finishUv,vec2(-finishBrushAxis.y,finishBrushAxis.x)));
float finishFacing=abs(normalize(vFinishNormal).z);
float finishFace=smoothstep(.96,.999,finishFacing);
// Reviewed BRep roles override the conservative normal-angle fallback.
float finishBevel=smoothstep(.16,.42,finishFacing)*(1.0-smoothstep(.82,.96,finishFacing));
#ifdef SOURCE_FINISH
finishBevel=1.0-step(.2,abs(vFinishRole-9.0));
#endif
float finishGrain=0.0;
float finishHeight=0.0;
float finishField=1.0;
float finishFrostMask=finishFrosted;
float finishBase=0.0;
// Audited d99 face 54 is the only flat source plane at Z=-.3 mm.
// The tight plane mask leaves the lower feet, chamfers and engraving separate.
float finishSeat=finishCapSeat*finishFace*(1.0-smoothstep(.0001,.0003,abs(vFinishPosition.z+.3)));
// Only separately audited source regions may cross metal/dielectric families.
if(finishEnabled>.5 && finishWholeBlue<.5 && abs(vFinishRole-2.0)<.2) diffuseColor.rgb=vec3(.546,.584,.631);
if(finishEnabled>.5 && abs(vFinishRole-5.0)<.2) diffuseColor.rgb=vec3(.006);
if(finishEnabled>.5 && abs(vFinishRole-4.0)<.2) diffuseColor.rgb=vec3(.018,.08,.24);
if(finishEnabled>.5 && abs(vFinishRole-7.0)<.2) diffuseColor.rgb=vec3(.22,.002,.018);
// Heat-blued steel changes from blue-black to cobalt as the reflected angle
// turns. Neutral source seats remain steel unless the whole screw is blued.
// All four arms, including narrow connections, bevels and their shared bottom
// face, lie outside |X| = Y/2. The steel spine lies inside this source-local
// wedge. Evaluate per fragment so interpolated face roles cannot leave gaps.
float finishShockArms=step(vFinishPosition.y*.5,abs(vFinishPosition.x));
float finishShockBlue=finishShockBlock*max(finishShockArms,1.0-smoothstep(1.05,1.45,vFinishPosition.y));
float finishBlueSurface=max(max(finishHeatBlue,1.0-step(.2,abs(vFinishRole-4.0))),finishShockBlue);
if(finishWholeBlue<.5 && abs(vFinishRole-2.0)<.2) finishBlueSurface=0.0;
if(finishEnabled>.5 && finishBlueSurface>0.0) {
 float blueAngle=pow(1.0-abs(dot(normalize(vFinishViewNormal),normalize(vViewPosition))),1.7);
 diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.004,.018,.055),vec3(.018,.16,.46),.22+blueAngle*.78),finishBlueSurface);
}
if(finishEnabled>.5 && finishPattern>.5) {
 if(finishPattern<1.5 || (finishPattern>3.5 && finishPattern<4.5) || finishPattern>5.5) {
  finishField=finishPattern<1.5?smoothstep(-.006,.001,vFinishPosition.z):1.0;
  #ifdef SOURCE_FINISH
  if(finishPattern<1.5) {
   finishField=1.0-step(.2,abs(vFinishRole-1.0));
   finishBase=1.0-step(.2,abs(vFinishRole-8.0));
  }
  #endif
  // Lower bridge geometry is no longer darkened or frosted by position alone.
  // Role 8 identifies the exposed base, now smooth satin by user correction.
  float silverRadius=length(finishUv);
  float brushed=finishPattern>5.5
    ? filteredFinishNoise(vec2(silverRadius*150.0,11.0))
    : finishBrush(finishBrushUv)*finishBrushDetail;
  // Broad lower bases stay satin; only seven explicit mounting pads frost.
  finishFrostMask=1.0-step(.2,abs(vFinishRole-12.0));
  float mountingFrost=finishFrostMask>.5?finishFrost(finishUv):0.0;
  finishGrain=brushed*finishField+mountingFrost;
  finishHeight=brushed*finishField*.00018+mountingFrost*finishFrostDetail.y;
  finishFrostMask*=1.0-finishSeat;
  finishGrain*=1.0-finishSeat;
  finishHeight*=1.0-finishSeat;
 } else if(finishPattern<2.5) {
  float radius=length(finishUv);
  if(finishSnailing>.5) {
   // Curved rays: theta + turn*r/R is constant along each sweeping stroke.
   // Sample a closed circle, avoiding an atan seam and concentric lathe rings.
   float phase=atan(finishUv.y,finishUv.x)+finishSnailTurn*radius/finishRadius;
   vec2 spiral=vec2(cos(phase),sin(phase));
   finishGrain=filteredFinishNoise(spiral*90.0+radius*.12)*.5
     + filteredFinishNoise(spiral*250.0+radius*.06)*.32
     + filteredFinishNoise(spiral*600.0)*.18;
  } else {
  // Irregular concentric brushing around the original source axle. The slow
  // XY variation breaks up perfect lathe rings without an angular seam.
  float wander=finishNoise(finishUv*2.1)*.012;
  finishGrain=filteredFinishNoise(vec2((radius+wander)*45.0,0.0))*.46
    + filteredFinishNoise(vec2((radius+wander*.5)*140.0,7.0))*.34
    + filteredFinishNoise(vec2(radius*360.0,19.0))*.2;
  }
  finishHeight=finishGrain*.00022;
 } else {
  #ifdef SOURCE_FINISH
  finishFrostMask=finishFrosted*(1.0-step(.2,abs(vFinishRole-10.0)));
  #endif
  finishGrain=finishFrosted>.5?finishFrost(finishUv)*finishFrostMask:0.0;
  finishHeight=finishGrain*finishFrostDetail.y;
 }
 // Restrained reflectance variation carries the grain without wood/stone-like
 // color mottling. Geometry and broad studio reflections do most of the work.
 if(finishPattern<4.5 || finishPattern>5.5)
  diffuseColor.rgb*=1.0+finishGrain*mix(.08,.045,finishFrostMask)*finishFace;
 if(abs(vFinishRole-6.0)<.2) diffuseColor.rgb*=.62;
 // Existing recessed decoration on audited bridges. This is reversible surface
 // shading of source floors, never fabricated text, outlines or bevel geometry.
 if(finishEngraved>.5) {
  float floorMask=1.0-smoothstep(.003,.012,abs(vFinishPosition.z+.1));
  float textMask=1.0-smoothstep(.002,.009,abs(vFinishPosition.z+.07));
  float ink=max(floorMask,textMask)*finishFace;
  #ifdef SOURCE_FINISH
  ink=1.0-step(.2,abs(vFinishRole-3.0));
  #endif
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.008,.03,.105),ink*.82);
 }
}
if(finishEnabled>.5 && abs(vFinishRole-11.0)<.2) {
 diffuseColor.rgb=vec3(.008,.03,.105);
 finishHeight=0.0;
}
`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      /* glsl */ `
#include <roughnessmap_fragment>
if(finishEnabled>.5 && finishWholeBlue<.5 && abs(vFinishRole-2.0)<.2) roughnessFactor=.2;
if(finishEnabled>.5 && abs(vFinishRole-5.0)<.2) roughnessFactor=.25;
if(finishEnabled>.5 && abs(vFinishRole-3.0)<.2) roughnessFactor=.085;
if(finishEnabled>.5 && finishHeatBlue>.5 && (finishWholeBlue>.5 || abs(vFinishRole-2.0)>.2)) roughnessFactor=.13;
if(finishEnabled>.5 && finishShockBlock>.5) roughnessFactor=mix(roughnessFactor,.13,finishBlueSurface);
if(finishEnabled>.5 && finishBlackPolished>.5) roughnessFactor=.055;
if(finishEnabled>.5 && finishPattern>.5) {
 float finishContrast=.1;
 roughnessFactor=clamp(roughnessFactor+finishGrain*finishContrast,.09,.85);
 if(finishPattern<2.5 || (finishPattern>3.5 && finishPattern<4.5) || finishPattern>5.5) {
  roughnessFactor=mix(.34,roughnessFactor,finishFace);
  roughnessFactor=mix(roughnessFactor,.5+finishGrain*.12,finishFace*finishFrostMask);
  roughnessFactor=mix(roughnessFactor,.34,finishSeat);
  roughnessFactor=mix(roughnessFactor,.075,finishBevel);
 }
}
if(finishEnabled>.5 && finishFrostMask>.5) roughnessFactor=clamp(.46+finishGrain*finishFrostDetail.z,.3,.65);
if(finishEnabled>.5 && finishBase>.5) roughnessFactor=.24;
if(finishEnabled>.5 && abs(vFinishRole-11.0)<.2) roughnessFactor=.085;
`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <metalnessmap_fragment>',
      '#include <metalnessmap_fragment>\nif(finishEnabled>.5 && (abs(vFinishRole-5.0)<.2 || abs(vFinishRole-11.0)<.2)) metalnessFactor=0.0;',
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      /* glsl */ `
#include <normal_fragment_maps>
if(finishEnabled>.5 && finishPattern>.5 && finishBlackPolished<.5) {
 vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
 vec3 r1=cross(dy,normal),r2=cross(normal,dx);
 float det=dot(dx,r1);
 vec3 grad=sign(det)*(dFdx(finishHeight)*r1+dFdy(finishHeight)*r2);
 normal=normalize(max(abs(det),1e-12)*normal-grad*finishFace);
}
#ifdef USE_ANISOTROPY
// Source-local frame avoids dependence on absent CAD UVs or tangent attributes.
vec2 radial=normalize(finishUv+vec2(1e-8));
vec2 finishDirection=finishPattern>1.5 && finishPattern<2.5?radial:vec2(-finishBrushAxis.y,finishBrushAxis.x);
if(finishSnailing>.5) finishDirection=normalize(vec2(-radial.y,radial.x)+radial*(finishSnailTurn*length(finishUv)/finishRadius));
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
if(finishPattern<1.5) material.anisotropy*=finishField;
material.alphaT=mix(pow2(material.roughness),1.0,pow2(material.anisotropy));
#endif
`,
    );
  };
  material.customProgramCacheKey = () =>
    ['sapphire', 'diamond'].includes(finish.family)
      ? 'ml01-source-surface-clear-v7'
      : 'ml01-source-surface-v7';
  return material;
}
