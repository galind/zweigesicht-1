/** Build on a CI runner by default; --local reads private CAD for local reproduction. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { STLLoader } from '../../explorer/node_modules/three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from '../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder as ThreeDecoder } from '../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
import { holderGlb } from './holder-glb.mjs';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(await fs.readFile(new URL('assets/source-manifest/holder.json', root), 'utf8'));
const out = new URL('assets/generated/holders/', root);
const sha = data => createHash('sha256').update(data).digest('hex');
const buffer = data => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
await fs.mkdir(out, { recursive: true });
await Promise.all([MeshoptDecoder.ready, ThreeDecoder.ready]);
const io = new NodeIO().registerExtensions([EXTMeshoptCompression])
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const loader = new GLTFLoader().setMeshoptDecoder(ThreeDecoder);
const files = [];
for (const entry of manifest.files.filter(file => file.path.endsWith('.stl'))) {
  let source;
  if (process.argv.includes('--local')) source = await fs.readFile(new URL(entry.path, root));
  else {
    // Read the original from its recorded maker URL, never our public deployment.
    const response = await fetch(entry.url, { signal: AbortSignal.timeout(60000) });
    assert.equal(response.status, 200, `Source unavailable: ${path.basename(entry.path)}`);
    source = Buffer.from(await response.arrayBuffer());
  }
  assert.equal(source.length, entry.bytes);
  assert.equal(sha(source), entry.sha256, 'Source provenance mismatch');
  const candidates = [];
  for (const reorder of ['none', 'cache', 'spatial']) {
    const options = { indexed: true, compressed: true, reorder };
    const data = await holderGlb(source, options);
    candidates.push({ options, data, bytes: data.length, gzipBytes: gzipSync(data, { level: 9 }).length });
  }
  console.log(JSON.stringify({ source: path.basename(entry.path), bytes: source.length,
    gzipBytes: gzipSync(source, { level: 9 }).length,
    candidates: candidates.map(({ options, bytes, gzipBytes }) => ({ ...options, bytes, gzipBytes })) }));
  const selected = candidates.filter(candidate => candidate.bytes < source.length)
    .sort((a, b) => a.gzipBytes - b.gzipBytes)[0];
  assert.ok(selected, 'A GLB candidate must reduce raw bytes');
  const glb = selected.data;
  assert.deepEqual(await holderGlb(source, selected.options), glb, 'Conversion must be deterministic');
  const original = new STLLoader().parse(buffer(source));
  const gltf = await loader.parseAsync(buffer(glb), '');
  const mesh = gltf.scene.children[0];
  assert.equal(gltf.scene.children.length, 1);
  assert.ok(mesh.isMesh);
  assert.deepEqual(mesh.position.toArray(), [0, 0, 0]);
  assert.deepEqual(mesh.scale.toArray(), [1, 1, 1]);
  assert.deepEqual(mesh.quaternion.toArray(), [0, 0, 0, 1]);
  const expanded = mesh.geometry.toNonIndexed();
  // Compare oriented triangles including normals; order and cyclic starting corner may change.
  const triangles = geometry => {
    const result = [];
    for (let t = 0; t < geometry.attributes.position.count; t += 3) {
      const corners = [];
      for (let corner = t; corner < t + 3; corner++) {
        corners.push(['position', 'normal'].map(name => {
          const array = geometry.attributes[name].array;
          return Buffer.from(array.buffer, array.byteOffset + corner * 12, 12).toString('hex');
        }).join(''));
      }
      result.push([0, 1, 2].map(start => [0, 1, 2].map(n => corners[(start + n) % 3]).join(':')).sort()[0]);
    }
    return result.sort();
  };
  assert.deepEqual(triangles(expanded), triangles(original), 'Oriented triangle positions/normals differ');
  original.computeBoundingBox(); mesh.geometry.computeBoundingBox();
  assert.ok(original.boundingBox.equals(mesh.geometry.boundingBox));
  const independent = await io.readBinary(glb);
  const primitive = independent.getRoot().listMeshes()[0].listPrimitives()[0];
  assert.deepEqual(primitive.getIndices().getArray(), mesh.geometry.index.array);
  for (const [semantic, attribute] of [['POSITION', 'position'], ['NORMAL', 'normal']])
    assert.deepEqual(primitive.getAttribute(semantic).getArray(), mesh.geometry.attributes[attribute].array);
  const name = path.basename(entry.path).replace('.stl', '.glb');
  const gzipBytes = gzipSync(glb, { level: 9 }).length;
  const sourceGzipBytes = gzipSync(source, { level: 9 }).length;
  assert.ok(glb.length < source.length, `${name}: raw bytes must decrease`);
  assert.ok(gzipBytes < sourceGzipBytes, `${name}: gzip bytes must decrease`);
  const report = { name, encoding: selected.options, sha256: sha(glb), bytes: glb.length, sourceSha256: entry.sha256,
    sourceBytes: source.length, gzipBytes, sourceGzipBytes,
    reductionPercent: +(100 * (1 - glb.length / source.length)).toFixed(2),
    gzipReductionPercent: +(100 * (1 - gzipBytes / sourceGzipBytes)).toFixed(2),
    triangles: original.attributes.position.count / 3,
    sourceVertices: original.attributes.position.count, vertices: mesh.geometry.attributes.position.count,
    trianglePositionsAndNormalsExact: true, boundsExact: true, deterministic: true,
    threeLoaderDecodePassed: true, independentNodeIoDecodePassed: true };
  await fs.writeFile(new URL(name, out), glb);
  files.push(report);
  console.log(JSON.stringify(report));
  original.dispose(); expanded.dispose(); mesh.geometry.dispose(); mesh.material.dispose();
}
const report = { schemaVersion: 1,
  method: 'Exact position/normal deduplication; meshopt v0 ATTRIBUTES/INDICES; no quantization, filters or decimation. Lossless vertex/triangle ordering selected by gzip size. Original millimetres and Z-up axes retained for the existing scene transform.',
  toolVersions: JSON.parse(await fs.readFile(new URL('scripts/assets/package.json', root))).dependencies,
  files };
await fs.writeFile(new URL('holder-runtime.json', out), JSON.stringify(report, null, 2) + '\n');
// Originals are never written to public output or uploaded as workflow artifacts.
if (process.argv.includes('--local')) {
  const publicDir = new URL('explorer/public/bench-local/', root);
  await fs.mkdir(publicDir, { recursive: true });
  for (const file of files) await fs.copyFile(new URL(file.name, out), new URL(file.name, publicDir));
  for (const name of ['movement.stl', 'dial.stl']) await fs.rm(new URL(name, publicDir), { force: true });
}
