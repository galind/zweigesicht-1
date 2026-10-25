/** Exact positions, 16-bit lighting normals and meshopt compression; no CAD changes. */
import { MeshoptEncoder } from 'meshoptimizer';
import { STLLoader } from '../../explorer/node_modules/three/examples/jsm/loaders/STLLoader.js';

const bytes = (array) => Buffer.from(array.buffer, array.byteOffset, array.byteLength);

export async function holderGlb(source, { reorder = 'cache' } = {}) {
  // These recorded inputs are binary STL. Reject truncation and unsupported variants.
  if (source.length < 84 || source.length !== 84 + source.readUInt32LE(80) * 50)
    throw Error('Invalid binary holder STL');
  const geometry = new STLLoader().parse(source.buffer.slice(
    source.byteOffset, source.byteOffset + source.byteLength,
  ));
  try {
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;
    if (!positions.length || [...positions, ...normals].some(value => !Number.isFinite(value)))
      throw Error('Invalid holder geometry');
    // Quantize only lighting directions. Positions and triangle winding remain exact.
    const vertices = new Map(), positionValues = [], normalValues = [], indices = [];
    const positionBytes = bytes(positions);
    for (let vertex = 0; vertex < positions.length / 3; vertex++) {
      const offset = vertex * 12;
      const n = normals.subarray(vertex * 3, vertex * 3 + 3);
      const length = Math.hypot(...n);
      if (!length) throw Error('Invalid holder normal');
      const normal = new Int16Array([...n].map(value => Math.round(value / length * 32767)));
      const key = positionBytes.subarray(offset, offset + 12).toString('hex') + bytes(normal).toString('hex');
      if (!vertices.has(key)) {
        vertices.set(key, vertices.size);
        positionValues.push(...positions.subarray(vertex * 3, vertex * 3 + 3));
        normalValues.push(...normal, 0); // Four-short stride is required by meshopt alignment.
      }
      indices.push(vertices.get(key));
    }
    let arrays = [new Float32Array(positionValues), new Int16Array(normalValues),
      vertices.size < 65536 ? new Uint16Array(indices) : new Uint32Array(indices)];
    await MeshoptEncoder.ready;
    if (reorder !== 'none') {
      const ordered = new Uint32Array(indices);
      const remap = MeshoptEncoder.reorderMesh(ordered, true, true)[0];
      arrays = arrays.slice(0, 2).map((source, attribute) => {
        const width = attribute === 0 ? 3 : 4;
        const target = new source.constructor(source.length);
        for (let i = 0; i < remap.length; i++) target.set(source.subarray(i * width, i * width + width), remap[i] * width);
        return target;
      }).concat([vertices.size < 65536 ? new Uint16Array(ordered) : ordered]);
    }
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    const accessors = [
      { bufferView: 0, componentType: 5126, count: vertices.size, type: 'VEC3', min: bounds.min.toArray(), max: bounds.max.toArray() },
      { bufferView: 1, componentType: 5122, normalized: true, count: vertices.size, type: 'VEC3' },
      { bufferView: 2, componentType: arrays[2] instanceof Uint16Array ? 5123 : 5125, count: indices.length, type: 'SCALAR' },
    ];
    const blocks = [], views = [];
    let compressedOffset = 0, decodedOffset = 0;
    for (let i = 0; i < arrays.length; i++) {
      const raw = bytes(arrays[i]), count = accessors[i].count;
      const stride = raw.length / count, mode = i === 2 ? (reorder === 'cache' ? 'TRIANGLES' : 'INDICES') : 'ATTRIBUTES';
      // Version 0 and NONE preserve attribute bits; TRIANGLES may rotate starting corners.
      const encoded = Buffer.from(MeshoptEncoder.encodeGltfBuffer(raw, count, stride, mode, 0));
      views.push({ buffer: 1, byteOffset: decodedOffset, byteLength: raw.length,
        target: i === 2 ? 34963 : 34962, ...(i === 1 ? { byteStride: 8 } : {}),
        extensions: { EXT_meshopt_compression: { buffer: 0, byteOffset: compressedOffset,
          byteLength: encoded.length, byteStride: stride, count, mode, filter: 'NONE' } } });
      const padding = Buffer.alloc((4 - encoded.length % 4) % 4);
      blocks.push(encoded, padding);
      compressedOffset += encoded.length + padding.length;
      decodedOffset += raw.length + (4 - raw.length % 4) % 4;
    }
    const json = { asset: { version: '2.0', generator: 'zweigesicht-holder-lossless-v1' },
      extensionsUsed: ['EXT_meshopt_compression', 'KHR_mesh_quantization'],
      extensionsRequired: ['EXT_meshopt_compression', 'KHR_mesh_quantization'],
      scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2 }] }],
      accessors, bufferViews: views,
      buffers: [{ byteLength: compressedOffset }, { byteLength: decodedOffset,
        extensions: { EXT_meshopt_compression: { fallback: true } } }],
      extras: { units: 'millimetres', sourceAxis: 'Z-up' } };
    const jsonBytes = Buffer.from(JSON.stringify(json));
    const paddedJson = Buffer.concat([jsonBytes, Buffer.alloc((4 - jsonBytes.length % 4) % 4, 32)]);
    const binary = Buffer.concat(blocks), header = Buffer.alloc(20), binHeader = Buffer.alloc(8);
    header.write('glTF'); header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + paddedJson.length + binary.length, 8);
    header.writeUInt32LE(paddedJson.length, 12); header.write('JSON', 16);
    binHeader.writeUInt32LE(binary.length); binHeader.write('BIN\0', 4);
    return Buffer.concat([header, paddedJson, binHeader, binary]);
  } finally {
    geometry.dispose();
  }
}
