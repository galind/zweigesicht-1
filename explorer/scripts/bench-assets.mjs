import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

/** Read provenance, not runtime URLs, from the reviewed source manifests. */
export async function expectedBenchAssets() {
  const read = async (name) => JSON.parse(await fs.readFile(
    new URL('../../assets/source-manifest/' + name, import.meta.url), 'utf8',
  ));
  const [holders, environment] = await Promise.all([
    read('holder-runtime.json'), read('workshop-environment.json'),
  ]);
  return [
    ...['movement.glb', 'dial.glb'].map((name) => {
      const entry = holders.files.find((file) => file.name === name);
      if (!entry) throw Error(`Missing provenance for ${name}`);
      return { name, sha256: entry.sha256, bytes: entry.bytes };
    }),
    {
      name: 'environment.glb',
      sha256: environment.files.find((file) =>
        file.path === 'explorer/public/bench-local/environment.glb')?.sha256,
    },
  ];
}

/** Fetch to a temporary directory; never modify the local reproduction assets. */
export async function downloadBenchAssets({
  baseUrl, token, assets, fetchImpl = fetch,
}) {
  let base;
  try { base = new URL(baseUrl); } catch { throw Error('Invalid BENCH_ASSET_BASE_URL'); }
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash)
    throw Error('BENCH_ASSET_BASE_URL must be an HTTPS directory URL without credentials or query parameters');
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  if (!assets.length || assets.some((asset) =>
    !/^[a-z]+\.glb$/.test(asset.name) || !/^[a-f0-9]{64}$/.test(asset.sha256)))
    throw Error('Invalid Bench asset provenance');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'zweigesicht-bench-'));
  try {
    for (const asset of assets) {
      let response;
      try {
        response = await fetchImpl(new URL(asset.name, base), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          redirect: 'error',
          signal: AbortSignal.timeout(60000),
        });
      } catch {
        // Credentials, private URLs and storage-provider errors must stay out of logs.
        throw Error(`Bench asset request failed: ${asset.name}`);
      }
      if (!response.ok) throw Error(`Bench asset unavailable: ${asset.name} (HTTP ${response.status})`);
      let bytes;
      try { bytes = Buffer.from(await response.arrayBuffer()); }
      catch { throw Error(`Bench asset transfer failed: ${asset.name}`); }
      if ((asset.bytes !== undefined && bytes.length !== asset.bytes) ||
          createHash('sha256').update(bytes).digest('hex') !== asset.sha256)
        throw Error(`Bench asset integrity mismatch: ${asset.name}`);
      await fs.writeFile(path.join(directory, asset.name), bytes);
    }
    return directory;
  } catch (error) {
    await fs.rm(directory, { recursive: true, force: true });
    throw error;
  }
}
