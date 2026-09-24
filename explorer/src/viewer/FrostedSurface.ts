/** Authored shallow, overlapping impressions in source millimetres.
 * Photographic interpretation, not measured topography. No tiled texture/UVs.
 */
export const FROST = {
  cellsPerMm: 10,
  slopeAmplitude: 0.035,
  microRoughness: 0.31,
  minRadius: 0.5,
  maxRadius: 0.85,
};

export const frostReliefGLSL = /* glsl */ `
#ifdef FROST_RELIEF
// Integer avalanche avoids the precision bands of large floating-point hashes.
uint frostHash(uint x) {
 x ^= x >> 16u; x *= 0x7feb352du;
 x ^= x >> 15u; x *= 0x846ca68bu;
 return x ^ (x >> 16u);
}
vec4 frostRandom(ivec2 cell, uint site) {
 uint seed=uint(cell.x)*0x9e3779b9u ^ uint(cell.y)*0x85ebca6bu ^ site;
 return vec4(uvec4(frostHash(seed),frostHash(seed+1u),frostHash(seed+2u),frostHash(seed+3u)) >> 8u)/16777216.0;
}
// Major axis of the screen footprint: conservative for foreshortening without
// screen-axis bias. All derivatives precede source face/finish branches.
float frostFootprint(vec2 q) {
 vec2 dx=dFdx(q),dy=dFdy(q);
 float a=dot(dx,dx),b=dot(dx,dy),c=dot(dy,dy);
 return sqrt(.5*(a+c+sqrt(max(0.0,(a-c)*(a-c)+4.0*b*b))));
}
float frostFilter(float footprint, float radius) {
 return exp(-1.4*footprint*footprint/(radius*radius));
}
vec3 frostReliefAtFootprint(vec2 positionMm, float footprint) {
 vec2 q=positionMm*${FROST.cellsPerMm.toFixed(1)};
 vec2 slope=vec2(0);
 // Compact radial kernels have zero slope and curvature at their perimeter.
 // Overlapping independently jittered sites create irregular connected relief,
 // with neither Voronoi cusps nor the rows of a value-noise lattice.
 if(footprint<2.0) {
  ivec2 cell=ivec2(floor(q));
  vec2 within=fract(q);
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) {
   for(uint site=0u;site<2u;site++) {
    vec4 random=frostRandom(cell+ivec2(x,y),site*0x27d4eb2du);
    vec2 delta=within-vec2(x,y)-random.xy;
    float radius=mix(${FROST.minRadius},${FROST.maxRadius},random.z);
    float u=max(0.0,1.0-dot(delta,delta)/(radius*radius));
    slope+=8.0*delta/(radius*radius)*u*u*u
      *frostFilter(footprint,radius)*${FROST.slopeAmplitude};
   }
  }
 }
 // Independent-impression variance provides a conservative approximation:
 // per-axis variance = 8*pi/7 * amplitude². Stratification lowers measured
 // variance by about 10%. This Gaussian amplitude filter and GGX variance
 // transfer approximate footprint integration, not exact height convolution.
 // Quadrature over the radius distribution keeps the distant metallic lobe.
 float retained=0.0;
 for(int i=0;i<4;i++) {
  float radius=mix(${FROST.minRadius},${FROST.maxRadius},(float(i)+.5)/4.0);
  float attenuation=frostFilter(footprint,radius);
  retained+=attenuation*attenuation*.25;
 }
 float variance=(8.0*3.14159265359/7.0)*${FROST.slopeAmplitude}*${FROST.slopeAmplitude};
 return vec3(slope,variance*(1.0-retained));
}
vec3 frostRelief(vec2 positionMm) {
 return frostReliefAtFootprint(positionMm,frostFootprint(positionMm*${FROST.cellsPerMm.toFixed(1)}));
}
float frostRoughness(float unresolvedVariance) {
 return pow(pow(${FROST.microRoughness},4.0)+unresolvedVariance,.25);
}
#endif
`;
