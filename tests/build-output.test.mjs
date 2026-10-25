import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pruneBuildOutput } from '../explorer/scripts/prune-build-output.mjs';
import { packageVercel } from '../explorer/scripts/package-vercel.mjs';
import { downloadBenchAssets, expectedBenchAssets } from '../explorer/scripts/bench-assets.mjs';

async function fixture(t) {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), 'zweigesicht-build-'));
  t.after(() => fs.rm(output, { recursive: true, force: true }));
  const models = path.join(output, 'models');
  await fs.mkdir(models);
  const assets = { overview: '/models/overview-123456abcdef.glb', catalog: '/models/catalog-123456abcdef.glb' };
  const surfaces = { overview: assets.overview, file: '/models/finish-surfaces-123456abcdef.bin' };
  await fs.writeFile(path.join(models, 'asset-paths.json'), JSON.stringify(assets));
  await fs.writeFile(path.join(models, 'finish-surfaces.json'), JSON.stringify(surfaces));
  for (const name of ['assembly-manifest.json', 'case-lug-recovery.json', 'diamond-c74ee2731a1f.stl', ...Object.values(assets).map(p => path.basename(p)), path.basename(surfaces.file)]) {
    await fs.writeFile(path.join(models, name), 'fixture');
  }
  await fs.writeFile(path.join(models, 'overview-123456abcdef.glb.gz'), 'compressed');
  await fs.writeFile(path.join(models, 'obsolete.bin'), 'stale');
  await fs.mkdir(path.join(output, 'reference'));
  await fs.writeFile(path.join(output, 'reference', 'original.png'), 'private reference');
  return { output, models, assets };
}

test('packaging retains runtime assets/gzip and excludes stale variants and local reference copies', async t => {
  const { output, models } = await fixture(t);
  assert.deepEqual((await pruneBuildOutput(output)).removed, ['obsolete.bin']);
  assert.equal(await fs.readFile(path.join(models, 'case-lug-recovery.json'), 'utf8'), 'fixture');
  assert.equal(await fs.readFile(path.join(models, 'overview-123456abcdef.glb.gz'), 'utf8'), 'compressed');
  await assert.rejects(fs.access(path.join(output, 'reference')), { code: 'ENOENT' });
  assert.deepEqual((await pruneBuildOutput(output)).removed, []);
});

test('incomplete and mismatched builds fail before deleting anything', async t => {
  const { output, models, assets } = await fixture(t);
  await fs.rm(path.join(models, 'case-lug-recovery.json'));
  await assert.rejects(pruneBuildOutput(output), { code: 'ENOENT' });
  await fs.access(path.join(models, 'obsolete.bin'));
  await fs.writeFile(path.join(models, 'asset-paths.json'), JSON.stringify({ ...assets, catalog: '../outside.glb' }));
  await assert.rejects(pruneBuildOutput(output), /Invalid runtime asset path/);
  await fs.writeFile(path.join(models, 'asset-paths.json'), JSON.stringify(assets));
  await fs.writeFile(path.join(models, 'finish-surfaces.json'), JSON.stringify({ overview: 'wrong', file: '/models/finish-surfaces-123456abcdef.bin' }));
  await assert.rejects(pruneBuildOutput(output), /Surface\/overview mismatch/);
});

test('local bench assets survive a local build but unconfigured Vercel packaging excludes them', async t => {
  const { output } = await fixture(t);
  const bench = path.join(output, 'bench-local');
  await fs.mkdir(bench);
  await fs.writeFile(path.join(bench, 'movement.stl'), 'local maker asset');
  await pruneBuildOutput(output);
  assert.equal(await fs.readFile(path.join(bench, 'movement.stl'), 'utf8'), 'local maker asset');
  assert.deepEqual(await packageVercel(output), { benchEnabled: false });
  await assert.rejects(fs.access(bench), { code: 'ENOENT' });
});

const payloads = new Map(['movement.stl', 'dial.stl', 'environment.glb'].map(name => [name, Buffer.from('fixture:' + name)]));
const benchAssets = [...payloads].map(([name, bytes]) => ({
  name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
}));
const benchSource = 'https://assets.example.test/reviewed/';

test('hosted packaging installs only complete, hash-verified Bench payloads', async t => {
  const { output } = await fixture(t);
  const bench = path.join(output, 'bench-local');
  await fs.mkdir(bench);
  await fs.writeFile(path.join(bench, 'unreviewed.stl'), 'incidental local copy');
  const requests = [];
  const result = await packageVercel(output, {
    baseUrl: benchSource, token: 'fixture-token', assets: benchAssets,
    fetchImpl: async (url, options) => {
      requests.push(url.href);
      assert.equal(options.headers.Authorization, 'Bearer fixture-token');
      assert.equal(options.redirect, 'error');
      return new Response(payloads.get(path.basename(url.pathname)));
    },
  });
  assert.deepEqual(result, { benchEnabled: true });
  assert.deepEqual(requests, benchAssets.map(asset => benchSource + asset.name));
  assert.deepEqual((await fs.readdir(bench)).sort(), [...payloads.keys()].sort());
  for (const [name, bytes] of payloads)
    assert.deepEqual(await fs.readFile(path.join(bench, name)), bytes);
});

test('missing or corrupt hosted assets fail packaging without publishing a partial Bench', async t => {
  for (const failure of ['missing', 'corrupt', 'transfer']) {
    const { output } = await fixture(t);
    await assert.rejects(packageVercel(output, {
      baseUrl: benchSource, assets: benchAssets,
      fetchImpl: async (url) => {
        const name = path.basename(url.pathname);
        if (name === 'environment.glb') {
          if (failure === 'missing') return new Response(null, { status: 404 });
          if (failure === 'corrupt') return new Response('wrong bytes');
          return { ok: true, arrayBuffer() { throw Error('private upstream details'); } };
        }
        return new Response(payloads.get(name));
      },
    }), /Bench asset (unavailable|integrity mismatch|transfer failed): environment.glb/);
    await assert.rejects(fs.access(path.join(output, 'bench-local')), { code: 'ENOENT' });
    await fs.access(path.join(output, 'models', 'obsolete.bin'));
  }
});

test('asset configuration rejects unsafe sources and does not leak credentials in request errors', async () => {
  for (const baseUrl of ['http://assets.example.test/', 'https://user:secret@assets.example.test/', 'https://assets.example.test/?secret=value'])
    await assert.rejects(downloadBenchAssets({ baseUrl, assets: benchAssets }), /HTTPS directory URL/);
  await assert.rejects(downloadBenchAssets({
    baseUrl: benchSource, token: 'fixture-token', assets: benchAssets,
    fetchImpl() { throw Error('fixture-token and private storage details'); },
  }), { message: 'Bench asset request failed: movement.stl' });
});

test('Bench packaging derives the three payload identities from reviewed manifests', async () => {
  const assets = await expectedBenchAssets();
  assert.deepEqual(assets.map(asset => asset.name), ['movement.stl', 'dial.stl', 'environment.glb']);
  assert.equal(assets[0].sha256, 'd8177c22d9f844c424d6abb80a31c7a33b913811b7e000142f98bc914192bc4a');
  assert.equal(assets[1].sha256, '2f95f97ebd6d5a56881788b957e98d8186d25ac8084491027f5f177182c5bba4');
  assert.match(assets[2].sha256, /^[a-f0-9]{64}$/);
});
