import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pruneBuildOutput } from '../explorer/scripts/prune-build-output.mjs';

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
