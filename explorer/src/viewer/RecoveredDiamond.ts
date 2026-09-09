import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import type { Part } from '../experience/catalog';

export const DIAMOND_ID =
  'p_0_1_1_1__0_1_1_1_4__0_1_1_83_59__0_1_1_221_3__0_1_1_223_2';
export const DIAMOND_SHA =
  'c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a';

/** Maker's separate STL, not a reconstruction or a change to the empty STEP. */
export async function loadRecoveredDiamond(parts: Part[]) {
  const record = parts.find((p) => p.id === DIAMOND_ID);
  if (
    !record ||
    record.definitionId !== 'd_0_1_1_225' ||
    record.triangles !== 0
  )
    throw new Error('Diamond recovery does not match the empty source record');
  const response = await fetch('/models/diamond-c74ee2731a1f.stl');
  if (!response.ok) throw new Error('Maker diamond STL unavailable');
  const buffer = await response.arrayBuffer();
  const digest = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
  if (digest !== DIAMOND_SHA)
    throw new Error('Maker diamond STL integrity mismatch');
  const geometry = new STLLoader().parse(buffer);
  // These original coordinates cancel the source instance's -125/-105 offset.
  // Do not center, scale, smooth or replace the supplied facet normals.
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.name = record.id;
  mesh.userData.sourceRecovery = 'maker-component-stl';
  const scene = new THREE.Group();
  scene.add(mesh);
  return scene;
}
