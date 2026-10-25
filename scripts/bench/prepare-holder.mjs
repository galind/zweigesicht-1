/** Local, hash-checked import. No automatic download or publication. */
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(
  await fs.readFile(
    new URL('../../assets/source-manifest/holder.json', import.meta.url),
  ),
);
const out = new URL('../../explorer/public/bench-local/', import.meta.url);
await fs.mkdir(out, { recursive: true });
for (const entry of manifest.files.filter((f) => f.path.endsWith('.stl'))) {
  const data = await fs.readFile(
    new URL('../../' + entry.path, import.meta.url),
  );
  if (createHash('sha256').update(data).digest('hex') !== entry.sha256)
    throw Error('Holder source hash mismatch: ' + entry.path);
  await fs.writeFile(new URL(entry.path.split('/').pop(), out), data);
}
console.log(
  'Prepared local-only maker holder STLs. Publication gates remain closed.',
);
