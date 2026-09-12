// Same direct-source transpilation convention as scripts/cad/review-runtime.mjs.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url),
  ts = require(root + "/explorer/node_modules/typescript");
export const THREE = await import(root + "/explorer/node_modules/three/build/three.module.js");
const cache = new Map();
export function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id === "three") return THREE;
    const p = path.resolve(path.dirname(file), id);
    if (id.startsWith(".")) return fs.existsSync(p + ".ts") ? load(p + ".ts") : require(p);
    return require(id);
  };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(
    code,
    { module, exports: module.exports, require: localRequire, console },
    { filename: file },
  );
  cache.set(file, module.exports);
  return module.exports;
}
