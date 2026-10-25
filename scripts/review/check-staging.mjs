/** Remote HTTP verification, intended to run on a GitHub-hosted runner. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { expectedBenchAssets } from '../../explorer/scripts/bench-assets.mjs';

const origin = 'https://zweigesicht-uat.vercel.app';
async function get(path) {
  const response = await fetch(new URL(path, origin), {
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response;
}

for (const path of ['/', '/bench']) {
  const response = await get(path);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  const html = await response.text();
  assert.doesNotMatch(html, /The workbench is not available in this version/);
  assert.match(html, path === '/' ? /Explore it in first person/ : /The workbench/);
  console.log(`${path}: HTTP 200, Bench entry enabled`);
}
for (const asset of await expectedBenchAssets()) {
  const response = await get('/bench-local/' + asset.name);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.name);
  if (asset.bytes !== undefined) assert.equal(bytes.length, asset.bytes, asset.name);
  console.log(`${asset.name}: HTTP 200, ${bytes.length} bytes, recorded SHA-256 matches`);
}
console.log('Staging delivery verified. This HTTP check does not execute WebGL or browser interaction.');
