/** Record completed local evidence without publishing CAD or screenshots. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'artifacts/running-movement/';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const path = 'assets/source-manifest/running-movement.json';
const record = read(path);
for (const [p, sha] of Object.entries(record.generated)) assert.equal(hash(p), sha, p);
const geometry = read(root + 'geometry-check.json'), meshes = read(root + 'mesh-check.json');
const browser = read(root + 'browser-report.json');
assert.equal(geometry.overlaps.length, 0);
assert.ok(Object.values(meshes.minimumMeshSectionGapMm).every(x => x > 0));
assert.ok(meshes.terminalConservativeGapLowerBoundMm > 0);
assert.ok(browser.checks.every(x => x.pass) && !browser.errors.length);
const cpu = fs.readFileSync(root + 'cpu-tests.txt', 'utf8');
assert.match(cpu, /ℹ fail 0/);
const build = fs.readFileSync(root + 'build.txt', 'utf8');
assert.match(build, /Build complete/);
const flipPath = root + 'bench-flip/flip-report.json';
const flip = read(flipPath);
assert.ok(flip.checks.every(x => x.pass) && !flip.errors.length);
record.report = 'docs/RUNNING_MOVEMENT.md';
record.validation = {
  date: '2026-10-27',
  cpuTests: Number(cpu.match(/ℹ tests (\d+)/)[1]),
  timedRuntimeConfigurations: geometry.timedConfigurations,
  minimumSourceSectionGapsMm: geometry.minimumSectionGapsMm,
  minimumRuntimeMeshSectionGapsMm: meshes.minimumMeshSectionGapMm,
  springConfigurations: geometry.springConfigurations,
  minimumInterturnGapMm: geometry.minimumInterturnGapMm,
  maximumAttachmentErrorMm: geometry.maximumAttachmentErrorMm,
  maximumTotalCenterlineLengthChangeMm: geometry.maximumTotalCenterlineLengthChangeMm,
  maximumFreshSolveDifferenceMm: geometry.maximumFreshSolveDifferenceMm,
  terminalDistanceQueries: meshes.terminalDistanceQueries,
  terminalConservativeGapLowerBoundMm: meshes.terminalConservativeGapLowerBoundMm,
  browserChecks: browser.checks.length,
  benchFlipChecks: flip.checks.length,
  sustainedRendering: browser.checks.find(x => x.name.startsWith('Sustained')).details,
  build: 'Local production build and asset pruning passed',
  scope: 'Prescribed visual motion; sampled geometry and desktop runtime evidence, not physical or publication acceptance',
};
record.implementationSha256 = Object.fromEntries([
  'explorer/src/viewer/RunningMovement.ts', 'explorer/src/viewer/MovementViewer.ts',
  'explorer/src/play/PlayViewer.ts', 'explorer/src/bench/BenchViewer.ts',
  'explorer/src/bench/physics.ts', 'explorer/scripts/prune-build-output.mjs',
  'scripts/cad/escapement-clearance/export_runtime.py',
  'scripts/cad/escapement-clearance/check_runtime.py',
  'scripts/cad/escapement-clearance/check_runtime_meshes.py',
  'scripts/movement/sample-runtime.mjs', 'scripts/movement/export-meshes.mjs',
  'scripts/movement/browser-check.mjs', 'scripts/movement/record-validation.mjs',
  'scripts/bench/flip-check.mjs',
].map(p => [p, hash(p)]));
record.localEvidenceSha256 = Object.fromEntries([
  'geometry-check.json', 'mesh-check.json', 'browser-report.json', 'cpu-tests.txt',
  'focused-tests.txt', 'sample-hashes.json', 'inventory.txt', 'build.txt', 'bench-flip/flip-report.json',
  'assembled.png', 'fitted-front.png', 'fitted-back.png', 'escapement-frame-0.png',
  'escapement-frame-10.png', 'workshop-partial.png', 'isolated.png', 'bench.png',
].map(p => [root + p, hash(root + p)]));
fs.writeFileSync(path, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify(record.validation, null, 2));
