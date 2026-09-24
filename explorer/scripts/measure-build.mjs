import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const root = path.resolve(import.meta.dirname, '../dist/client');
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.vite/manifest.json')));
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
console.log(JSON.stringify({
  pageStaticImports: [...visited].map(key => size(manifest[key].file)),
  css: fs.readdirSync(path.join(root, '_next/static/css')).map(file => size(`_next/static/css/${file}`)),
  installedPackages: Object.keys(JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../package-lock.json'))).packages).length - 1,
}, null, 2));
