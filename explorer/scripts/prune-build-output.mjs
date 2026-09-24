import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Only build copies are pruned; local source/reproduction inputs stay intact. */
export async function pruneBuildOutput(output) {
  const models = path.join(output, 'models');
  const read = async (name) =>
    JSON.parse(await fs.readFile(path.join(models, name), 'utf8'));
  const [assets, surfaces] = await Promise.all([
    read('asset-paths.json'),
    read('finish-surfaces.json'),
  ]);
  const asset = (url, pattern) => {
    if (typeof url !== 'string' || !pattern.test(url))
      throw new Error(`Invalid runtime asset path: ${url}`);
    return path.basename(url);
  };
  const overview = asset(
    assets.overview,
    /^\/models\/overview-[a-f0-9]{12}\.glb$/,
  );
  const catalog = asset(
    assets.catalog,
    /^\/models\/catalog-[a-f0-9]{12}\.glb$/,
  );
  const finish = asset(
    surfaces.file,
    /^\/models\/finish-surfaces-[a-f0-9]{12}\.bin$/,
  );
  if (surfaces.overview !== assets.overview)
    throw new Error('Surface/overview mismatch');
  const required = [
    'assembly-manifest.json',
    'case-lug-recovery.json',
    'asset-paths.json',
    'diamond-c74ee2731a1f.stl',
    'finish-surfaces.json',
    overview,
    catalog,
    finish,
  ];
  // Incomplete output is an error, never a successful but unpruned release.
  await Promise.all(required.map((name) => fs.access(path.join(models, name))));
  const keep = new Set(required.flatMap((name) => [name, `${name}.gz`]));
  const removed = [];
  for (const name of await fs.readdir(models)) {
    if (!keep.has(name)) {
      await fs.rm(path.join(models, name), { recursive: true, force: true });
      removed.push(name);
    }
  }
  await fs.rm(path.join(output, 'reference'), { recursive: true, force: true });
  return { removed, runtimeAssets: (await fs.readdir(models)).length };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const output = path.resolve(
    import.meta.dirname,
    '..',
    process.argv[2] ?? 'dist/client',
  );
  console.log(JSON.stringify(await pruneBuildOutput(output)));
}
