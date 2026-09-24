/** Export actual presentation offsets for the local solid-pair probe.
 * Run from the repository root: node scripts/cad/sample-disassembly.mjs
 * Prepared runtime manifest and explorer dependencies are required.
 * No geometry is generated, edited or published.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fs = require("fs"),
  path = require("path"),
  vm = require("vm");
const root = process.cwd(),
  ts = require(path.join(root, "explorer/node_modules/typescript"));
const cache = new Map();
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith(".json")) return require(file);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (id) => {
        const p = path.resolve(path.dirname(file), id);
        return load(fs.existsSync(p) ? p : p + ".ts");
      },
    },
    { filename: file },
  );
  cache.set(file, module.exports);
  return module.exports;
}
const ex = load("explorer/src/experience/explosion.ts"),
  parts = require(path.join(root, "explorer/public/models/assembly-manifest.json")).instances;
const states = [null, "regulation", "energy", "transmission", "display", "winding", "shock"].map(
  (group) => ({
    group,
    separation: group ? 0 : 1,
    partSpread: group ? 1 : 0,
    reveal: group ? 1 : 0,
  }),
);
const data = states.map((state) => {
  const offsets = ex.explosionOffsets(parts, state);
  return {
    state,
    parts: parts
      .filter((p) => !p.isAssembly)
      .map((p) => ({
        id: p.id,
        name: p.name,
        definitionId: p.definitionId,
        bounds: p.boundsWorldMm,
        offset: offsets.get(p.id) ?? [0, 0, 0],
      })),
  };
});
fs.mkdirSync(path.join(root, "artifacts/disassembly-cad"), { recursive: true });
fs.writeFileSync(
  path.join(root, "artifacts/disassembly-cad/offsets.json"),
  JSON.stringify(data, null, 2),
);
