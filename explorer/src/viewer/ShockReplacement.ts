import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import replacement from '../../../assets/authored/shock-replacement.json';
import { PREFIX, belongs } from '../experience/catalog';
import { assetRequestUrl } from '../experience/loading';

export const SHOCK_REPLACEMENT = replacement;
export function shockVariantMember(id: string, indicator: boolean) {
  if (id === replacement.part.id) return !indicator;
  if (belongs(id, PREFIX + '29'))
    return indicator || replacement.retainedLeafIds.includes(id);
  return true;
}
export async function loadShockReplacement(): Promise<THREE.Object3D> {
  const response = await fetch(assetRequestUrl(replacement.asset));
  if (!response.ok) throw new Error('Engraving plate unavailable');
  const buffer = await response.arrayBuffer();
  const digest = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
  if (digest !== replacement.sha256)
    throw new Error('Engraving plate integrity mismatch');
  return (await new GLTFLoader().parseAsync(buffer, '')).scene;
}
