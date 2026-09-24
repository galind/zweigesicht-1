import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const project = path.resolve(
  process.argv[2] ?? path.join(import.meta.dirname, '..'),
);
const root = path.join(project, 'dist/client');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, '.vite/manifest.json')),
);
const visited = new Set();
function visit(key) {
  if (visited.has(key)) return;
  visited.add(key);
  for (const imported of manifest[key].imports ?? []) visit(imported);
}
visit('app/page.tsx');
const size = (file) => {
  const bytes = fs.readFileSync(path.join(root, file));
  return { file, bytes: bytes.length, gzip: gzipSync(bytes).length };
};
const pageStaticImports = [...visited].map((key) => size(manifest[key].file));
visit('virtual:vinext-app-browser-entry');
visit('node_modules/@vercel/analytics/dist/next/index.mjs');
console.log(
  JSON.stringify(
    {
      pageStaticImports,
      applicationJs: [...visited].map((key) => size(manifest[key].file)),
      css: fs
        .readdirSync(path.join(root, '_next/static/css'))
        .map((file) => size(`_next/static/css/${file}`)),
      installedPackages:
        Object.keys(
          JSON.parse(fs.readFileSync(path.join(project, 'package-lock.json')))
            .packages,
        ).length - 1,
    },
    null,
    2,
  ),
);
