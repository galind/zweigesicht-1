import * as THREE from 'three';

/** Convex optical boundary from the maker's facets; never edits the STL buffers. */
export function diamondBoundary(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const planes: THREE.Vector4[] = [];
  for (let i = 0; i < normals.count; i += 3) {
    const n = new THREE.Vector3().fromBufferAttribute(normals, i).normalize();
    if (planes.some((p) => n.x * p.x + n.y * p.y + n.z * p.z > 0.99999))
      continue;
    let support = -Infinity;
    for (let j = 0; j < positions.count; j++) {
      support = Math.max(
        support,
        n.x * (positions.getX(j) - center.x) +
          n.y * (positions.getY(j) - center.y) +
          n.z * (positions.getZ(j) - center.z),
      );
    }
    planes.push(new THREE.Vector4(n.x, n.y, n.z, support));
  }
  if (planes.length < 4 || planes.length > 64)
    throw new Error('Diamond optical boundary exceeds its facet budget');
  return { center, planes };
}

// Trace a bounded path through the actual convex cut. Internal reflections reveal
// pavilion facets through the broad table, instead of sampling the background
// once like a pane of glass. Studio illumination and the bounce limit remain an
// authored optical approximation (not spectral path tracing or gem certification).
export const diamondOpticsGLSL = /* glsl */ `
uniform vec3 diamondCenter;
uniform vec4 diamondPlanes[DIAMOND_PLANES];
varying vec3 vDiamondZ;

bool diamondHit(vec3 origin, vec3 ray, out vec3 hitNormal, out float hitDistance) {
  hitDistance = 1e6;
  hitNormal = vec3(0.0);
  for (int facet = 0; facet < DIAMOND_PLANES; facet++) {
    vec4 plane = diamondPlanes[facet];
    float toward = dot(plane.xyz, ray);
    if (toward > 1e-5) {
      float distance = (plane.w - dot(plane.xyz, origin)) / toward;
      if (distance > 1e-5 && distance < hitDistance) {
        hitDistance = distance;
        hitNormal = plane.xyz;
      }
    }
  }
  return hitDistance < 1e5;
}
`;

export const diamondLightGLSL = /* glsl */ `
#ifdef ENVMAP_TYPE_CUBE_UV
mat3 diamondToView = mat3(normalize(vFinishX), normalize(vFinishY), normalize(vDiamondZ));
vec3 diamondViewRay = -normalize(vViewPosition);
vec3 diamondIncoming = vec3(dot(diamondViewRay, diamondToView[0]),
  dot(diamondViewRay, diamondToView[1]), dot(diamondViewRay, diamondToView[2]));
vec3 diamondNormal = normalize(vFinishNormal);
vec3 diamondRay = refract(diamondIncoming, diamondNormal, 1.0 / ior);
vec3 diamondOrigin = vFinishPosition - diamondCenter + diamondRay * 0.0005;
vec3 diamondLight = vec3(0.0);
float diamondWeight = 1.0;
float diamondF0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
for (int bounce = 0; bounce < 5; bounce++) {
  vec3 hitNormal;
  float hitDistance;
  if (!diamondHit(diamondOrigin, diamondRay, hitNormal, hitDistance)) break;
  diamondOrigin += diamondRay * hitDistance;
  vec3 escaped = refract(diamondRay, -hitNormal, ior);
  if (dot(escaped, escaped) > 0.001) {
    float fresnel = diamondF0 + (1.0 - diamondF0) * pow(1.0 - abs(dot(diamondRay, hitNormal)), 5.0);
    vec3 worldRay = transformDirectionByInverseViewMatrix(diamondToView * escaped, viewMatrix);
    vec3 radiance = textureCubeUV(envMap, envMapRotation * worldRay, 0.025).rgb * envMapIntensity;
    diamondLight += diamondWeight * (1.0 - fresnel) * radiance;
    diamondWeight *= fresnel;
  }
  diamondRay = reflect(diamondRay, hitNormal);
  diamondOrigin += diamondRay * 0.0005;
  if (diamondWeight < 0.01) break;
}
float diamondEntryFresnel = diamondF0 + (1.0 - diamondF0) * pow(1.0 - abs(dot(diamondIncoming, diamondNormal)), 5.0);
outgoingLight = totalSpecular + diamondLight * (1.0 - diamondEntryFresnel);
#endif
`;
