import test from 'node:test';
import assert from 'node:assert/strict';
import { holderGlb } from './holder-glb.mjs';

test('conversion rejects truncated, empty and nonfinite STL inputs', async () => {
  await assert.rejects(holderGlb(Buffer.alloc(20)), /Invalid binary/);
  const empty = Buffer.alloc(84);
  await assert.rejects(holderGlb(empty), /Invalid holder geometry/);
  const truncated = Buffer.alloc(84); truncated.writeUInt32LE(1, 80);
  await assert.rejects(holderGlb(truncated), /Invalid binary/);
  const invalid = Buffer.alloc(134); invalid.writeUInt32LE(1, 80);
  invalid.writeFloatLE(NaN, 96);
  await assert.rejects(holderGlb(invalid), /Invalid holder geometry/);
});
