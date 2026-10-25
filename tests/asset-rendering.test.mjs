/** CPU-only coverage of shared asset and material policies; no WebGL context. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as THREE from '../explorer/node_modules/three/build/three.module.js';
import * as frost from '../explorer/src/viewer/FrostedSurface.ts';
import * as diamond from '../explorer/src/viewer/DiamondOptics.ts';
import * as loading from '../explorer/src/experience/loading.ts';

const require = createRequire(import.meta.url);
const ts = require('../explorer/node_modules/typescript');
// Load actual modules with explicit network/asset fixtures, as in the lifecycle suites.
function sourceModule(file, imports, globals = {}) {
  const source = fs.readFileSync(new URL('../explorer/src/' + file, import.meta.url), 'utf8');
  const module = { exports: {} };
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, Float32Array, TextDecoder,
    require(id) {
      if (id === 'three') return THREE;
      assert.ok(Object.hasOwn(imports, id), `Explicit fixture required for ${id}`);
      return imports[id];
    },
    ...globals,
  });
  return module.exports;
}
const materials = sourceModule('viewer/materials.ts', {
  './FrostedSurface': frost,
  './DiamondOptics': diamond,
});

test('fitted enamel survives finish disabling/restoration without replacing material resources', () => {
  const material = materials.createMaterial('Emaille rot');
  const color = material.color, attenuation = material.attenuationColor;
  const shader = material.onBeforeCompile, finishUniform = material.userData.finishEnabled;
  materials.applyDialEnamel(material);
  assert.equal(material.color.getHex(), 0x0e47ba);
  assert.equal(material.transmission, 0.58);
  assert.equal(material.clearcoat, 1);
  assert.equal(material.ior, 1.53);
  assert.equal(material.thickness, 0.35);
  assert.equal(material.attenuationDistance, 0.65);
  assert.equal(material.attenuationColor.getHex(), 0x063b9a);
  assert.equal(material.polygonOffset, true);
  assert.equal(material.polygonOffsetFactor, -1);
  assert.equal(material.polygonOffsetUnits, -1);
  materials.setFinishEnabled(material, false);
  assert.equal(material.transmission, 0);
  assert.equal(finishUniform.value, 0);
  materials.setFinishEnabled(material, true);
  assert.equal(material.transmission, 0.58, 'Restoration uses the fitted transmission, not raw catalog zero');
  assert.equal(finishUniform.value, 1);
  assert.equal(material.color, color);
  assert.equal(material.attenuationColor, attenuation);
  assert.equal(material.onBeforeCompile, shader);
  material.dispose();
});

test('catalog/fitted transitions restore source color and do not recompile unchanged optical states', () => {
  const material = materials.createMaterial('Emaille rot');
  const raw = materials.finishFor('Emaille rot');
  for (let i = 0; i < 3; i++) {
    materials.applyDialEnamel(material);
    const fittedVersion = material.version;
    materials.applyDialEnamel(material);
    assert.equal(material.version, fittedVersion);
    materials.applyDialEnamel(material, raw);
    const rawVersion = material.version;
    materials.applyDialEnamel(material, raw);
    materials.setFinishEnabled(material, false);
    materials.setFinishEnabled(material, true);
    assert.equal(material.version, rawVersion);
    assert.equal(material.color.getHex(), 0x6c2031);
    assert.equal(material.metalness, raw.metalness);
    assert.equal(material.roughness, raw.roughness);
    assert.equal(material.transmission, 0);
    assert.equal(material.clearcoat, 0);
    assert.equal(material.polygonOffset, false);
  }
  material.dispose();
});

function detachedFixture(failure) {
  const ids = ['first', 'second'];
  const catalog = new THREE.Group();
  const geometry = new THREE.BoxGeometry();
  const sourceMaterial = new THREE.MeshBasicMaterial();
  const disposed = { geometry: 0, source: 0, clones: 0 };
  geometry.addEventListener('dispose', () => disposed.geometry++);
  sourceMaterial.addEventListener('dispose', () => disposed.source++);
  const records = new Map();
  for (const id of ids) {
    const mesh = new THREE.Mesh(geometry, sourceMaterial);
    mesh.name = id;
    catalog.add(mesh);
    records.set(id, { id, name: 'Emaille rot', definitionId: id });
  }
  const identity = new THREE.Matrix4().toArray();
  const localMatrices = Object.fromEntries(ids.map((id) => [id, identity]));
  if (failure === 'pose') delete localMatrices.second;
  let created = 0;
  const module = sourceModule('bench/DetachedParts.ts', {
    '../viewer/materials': {
      ...materials,
      createMaterial(...args) {
        created++;
        const material = materials.createMaterial(...args);
        material.addEventListener('dispose', () => disposed.clones++);
        return material;
      },
      setFinishEnabled(...args) {
        if (failure === 'finish' && created === 2) throw Error('Fixture finish failure');
        materials.setFinishEnabled(...args);
      },
    },
    '../viewer/SourceSurfaces': { attachSourceSurface() {} },
    '../../../assets/authored/bench-parts-layout.json': { default: {
      groups: [{ id: 'dial', leafIds: ids, transform: identity, localMatrices }],
    } },
    '../../../assets/authored/watch-configurations.json': { default: { caseMaterialDefinitions: [] } },
    '../../../assets/authored/dial-configurations.json': { default: {
      presentationOverrides: ids.map((leafId) => ({ leafId })),
    } },
  });
  return {
    disposed, geometry, sourceMaterial,
    build: () => module.createDetachedParts(catalog, records, new Map()),
  };
}

test('detached preparation failure releases every cloned material and retains catalog resources', () => {
  for (const failure of ['finish', 'pose']) {
    const fixture = detachedFixture(failure);
    assert.throws(fixture.build);
    assert.deepEqual(fixture.disposed, { geometry: 0, source: 0, clones: 2 }, failure);
    fixture.geometry.dispose();
    fixture.sourceMaterial.dispose();
  }
});

test('detached dials share immutable catalog geometry and use the fitted finish policy', () => {
  const fixture = detachedFixture();
  const group = fixture.build();
  let count = 0;
  group.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    count++;
    assert.equal(node.geometry, fixture.geometry);
    assert.notEqual(node.material, fixture.sourceMaterial);
    assert.equal(node.material.transmission, 0.58);
    materials.setFinishEnabled(node.material, false);
    materials.setFinishEnabled(node.material, true);
    assert.equal(node.material.transmission, 0.58);
    node.material.dispose();
  });
  assert.equal(count, 2);
  assert.deepEqual(fixture.disposed, { geometry: 0, source: 0, clones: 2 });
  fixture.geometry.dispose();
  fixture.sourceMaterial.dispose();
});

test('shared SHA-256 preserves known digest encoding and detects changed bytes', async () => {
  assert.equal(await loading.sha256(new ArrayBuffer(0)),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const bytes = new TextEncoder().encode('abc');
  assert.equal(await loading.sha256(bytes.buffer),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  bytes[0] ^= 1;
  assert.notEqual(await loading.sha256(bytes.buffer),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('case recovery rejects changed bytes before parsing untrusted content', async () => {
  const { loadCaseRecovery } = sourceModule('viewer/CaseRecovery.ts', {
    '../experience/loading': loading,
  }, {
    fetch: async () => ({ ok: true, arrayBuffer: async () => new TextEncoder().encode('not JSON').buffer }),
  });
  await assert.rejects(loadCaseRecovery(), /Case recovery hash mismatch/);
});

test('surface annotations reject a buffer that differs from the manifest hash', async () => {
  const { loadSourceSurfaces } = sourceModule('viewer/SourceSurfaces.ts', {
    '../experience/loading': { ...loading, assetRequestUrl: (path) => path },
  }, {
    fetch: async () => ({
      ok: true,
      json: async () => ({
        schemaVersion: 1, overview: 'overview', file: '/models/finish-surfaces-abcdef.bin',
        sha256: '0'.repeat(64), definitions: {},
      }),
      arrayBuffer: async () => new ArrayBuffer(16),
    }),
  });
  await assert.rejects(loadSourceSurfaces('overview'), /Source surface buffer integrity mismatch/);
});

test('diamond recovery rejects changed bytes before handing them to the STL parser', async () => {
  const { loadRecoveredDiamond, DIAMOND_ID } = sourceModule('viewer/RecoveredDiamond.ts', {
    '../experience/loading': { ...loading, assetRequestUrl: (path) => path },
    'three/addons/loaders/STLLoader.js': { STLLoader: class {
      parse() { assert.fail('Corrupt bytes must never reach the STL parser'); }
    } },
  }, {
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) }),
  });
  await assert.rejects(loadRecoveredDiamond([
    { id: DIAMOND_ID, definitionId: 'd_0_1_1_225', triangles: 0 },
  ]), /Maker diamond STL integrity mismatch/);
});
