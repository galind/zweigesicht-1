import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const models = path.join(root, '.vercel/output/static/models');
const assetPaths = JSON.parse(
  await fs.readFile(path.join(models, 'asset-paths.json'), 'utf8'),
);
const surfaces = JSON.parse(
  await fs.readFile(path.join(models, 'finish-surfaces.json'), 'utf8'),
);
const keep = new Set([
  'assembly-manifest.json',
  'asset-paths.json',
  path.basename(assetPaths.catalog),
  `${path.basename(assetPaths.catalog)}.gz`,
  'diamond-c74ee2731a1f.stl',
  'finish-surfaces.json',
  path.basename(surfaces.file),
  `${path.basename(surfaces.file)}.gz`,
  path.basename(assetPaths.overview),
  `${path.basename(assetPaths.overview)}.gz`,
]);

for (const entry of await fs.readdir(models)) {
  if (!keep.has(entry)) await fs.rm(path.join(models, entry), { force: true });
}

console.log(
  `Vercel output keeps ${keep.size} required CAD assets and removes stale generated variants.`,
);
