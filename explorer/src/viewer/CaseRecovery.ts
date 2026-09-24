import * as THREE from 'three';
/** Local, source-derived patch for d54 face 1. No new surface or wire is authored. */
export async function loadCaseRecovery() {
  const response = await fetch('/models/case-lug-recovery.json');
  if (!response.ok) throw new Error('Case surface recovery unavailable');
  const bytes = await response.arrayBuffer();
  const digest = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    (n) => n.toString(16).padStart(2, '0'),
  ).join('');
  if (
    digest !==
    'c45e91a76b2182d2dfb184d797be44c21dc63466a3b042d59a8cf2625959a9d2'
  )
    throw new Error('Case recovery hash mismatch');
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (
    data.sourceSha256 !==
      'f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b' ||
    data.definitionId !== 'd_0_1_1_54' ||
    data.sourceFace !== 1 ||
    data.triangles?.length !== 34
  )
    throw new Error('Unexpected case recovery');
  return data as { vertices: number[][]; triangles: number[][] };
}
export function recoverCaseSurfaces(
  scene: THREE.Object3D,
  patch: Awaited<ReturnType<typeof loadCaseRecovery>>,
) {
  const replacements = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
  const face = new THREE.BufferGeometry();
  face.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(patch.vertices.flat(), 3),
  );
  face.setIndex(patch.triangles.flat());
  face.computeVertexNormals();
  scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || !node.name) return;
    // Source exporter binds definition identity on the material, reused by occurrences.
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    if (!materials.some((m) => m.name === 'd_0_1_1_54')) return;
    const original = node.geometry;
    let geometry = replacements.get(original);
    if (!geometry) {
      geometry = new THREE.BufferGeometry();
      const count = original.getAttribute('position').count;
      for (const key of ['position', 'normal']) {
        geometry.setAttribute(
          key,
          new THREE.Float32BufferAttribute(
            [
              ...original.getAttribute(key).array,
              ...face.getAttribute(key).array,
            ],
            3,
          ),
        );
      }
      geometry.setIndex([
        ...original.index!.array,
        ...patch.triangles.flat().map((i) => i + count),
      ]);
      replacements.set(original, geometry);
    }
    node.geometry = geometry;
    node.userData.caseSurfaceRecovery = 'd54-face1-0.03mm';
  });
  face.dispose();
  for (const geometry of replacements.keys()) geometry.dispose();
  if (!replacements.size) throw new Error('Case recovery target missing');
}
