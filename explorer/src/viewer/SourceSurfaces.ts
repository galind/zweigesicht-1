import * as THREE from 'three';
import { assetRequestUrl } from '../experience/loading';

export type SourceSurfaces = Map<string, Float32Array>;

/** Separate, reversible shading annotations. No source attribute is replaced. */
export async function loadSourceSurfaces(
  overview: string,
): Promise<SourceSurfaces> {
  const response = await fetch('/models/finish-surfaces.json');
  if (!response.ok) throw new Error('Source surface annotations unavailable');
  const manifest = (await response.json()) as {
    schemaVersion: number;
    overview: string;
    file: string;
    sha256: string;
    definitions: Record<string, { byteOffset: number; vertexCount: number }>;
  };
  if (
    manifest.schemaVersion !== 1 ||
    manifest.overview !== overview ||
    !/^\/models\/finish-surfaces-[a-f0-9]+\.bin$/.test(manifest.file)
  )
    throw new Error('Source surface annotations do not match this geometry');
  const data = await fetch(assetRequestUrl(manifest.file));
  if (!data.ok) throw new Error('Source surface buffer unavailable');
  const buffer = await data.arrayBuffer();
  const digest = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
  if (digest !== manifest.sha256)
    throw new Error('Source surface buffer integrity mismatch');
  const result: SourceSurfaces = new Map();
  for (const [id, entry] of Object.entries(manifest.definitions) as [
    string,
    { byteOffset: number; vertexCount: number },
  ][]) {
    if (
      !/^d_0_1_1_\d+$/.test(id) ||
      !Number.isInteger(entry.byteOffset) ||
      entry.byteOffset < 0 ||
      entry.byteOffset % 4 ||
      !Number.isInteger(entry.vertexCount) ||
      entry.vertexCount < 1 ||
      entry.byteOffset + entry.vertexCount * 16 > buffer.byteLength
    )
      throw new Error('Invalid source surface entry');
    const values = new Float32Array(
      buffer,
      entry.byteOffset,
      entry.vertexCount * 4,
    );
    for (let i = 0; i < values.length; i += 4) {
      const length = Math.hypot(values[i], values[i + 1], values[i + 2]);
      if (
        !Number.isFinite(length) ||
        Math.abs(length - 1) > 0.01 ||
        ![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(values[i + 3])
      )
        throw new Error('Invalid source surface normal or role');
    }
    result.set(id, values);
  }
  return result;
}

export function attachSourceSurface(
  geometry: THREE.BufferGeometry,
  data?: Float32Array,
) {
  if (!data || geometry.hasAttribute('sourceFinishNormal')) return;
  if (data.length !== geometry.getAttribute('position').count * 4)
    throw new Error('Source surface vertex count changed');
  const buffer = new THREE.InterleavedBuffer(data, 4);
  geometry.setAttribute(
    'sourceFinishNormal',
    new THREE.InterleavedBufferAttribute(buffer, 3, 0),
  );
  geometry.setAttribute(
    'sourceFinishRole',
    new THREE.InterleavedBufferAttribute(buffer, 1, 3),
  );
}
