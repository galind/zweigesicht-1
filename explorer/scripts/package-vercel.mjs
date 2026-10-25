import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { downloadBenchAssets, expectedBenchAssets } from './bench-assets.mjs';
import { pruneBuildOutput } from './prune-build-output.mjs';

export async function packageVercel(output, {
  baseUrl, token, assets, fetchImpl,
} = {}) {
  let prepared;
  try {
    if (baseUrl) {
      prepared = await downloadBenchAssets({
        baseUrl, token, fetchImpl,
        assets: assets ?? await expectedBenchAssets(),
      });
    }
    // Remove incidental public/ copies before installing verified files.
    await pruneBuildOutput(output, { localBench: false });
    if (prepared)
      await fs.cp(prepared, path.join(output, 'bench-local'), { recursive: true });
    return { benchEnabled: Boolean(prepared) };
  } finally {
    if (prepared) await fs.rm(prepared, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await packageVercel(
    fileURLToPath(new URL('../.vercel/output/static/', import.meta.url)),
    { baseUrl: process.env.BENCH_ASSET_BASE_URL, token: process.env.BENCH_ASSET_TOKEN },
  );
  console.log(result.benchEnabled
    ? 'Packaged three verified Bench assets.'
    : 'Packaged without Bench assets; hosted Bench entry is disabled.');
}
