import * as THREE from 'three';
import { MovementViewer } from './MovementViewer';
import { WATCH, CASE_LEAVES, CASE_CRYSTALS } from '../experience/watch';
import { DIALS } from '../experience/dials';
import { ROOT, GROUPS, belongs } from '../experience/catalog';
const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
async function settle(v: MovementViewer) {
  const start = performance.now();
  do {
    await pause(30);
  } while (
    (v.travel || v.presentationMoving || v.needsRender) &&
    performance.now() - start < 12000
  );
  if (v.travel || v.presentationMoving || !v.ready)
    throw new Error('Watch did not settle');
}
export async function runWatchChecks(v: MovementViewer) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  const check = (name: string, pass: boolean, details?: unknown) =>
    checks.push({ name, pass, details });
  const visibleCase = () =>
    [...CASE_LEAVES].filter((id) => v.renderParts.get(id)?.mesh.visible);
  const exact = () =>
    visibleCase().length === (v.caseEffective() ? CASE_LEAVES.size : 0);
  v.reset();
  await v.configureWatch({ caseVisible: false, dialsVisible: false });
  await settle(v);
  if (!v.catalogLoaded) {
    const path = v.paths.catalog;
    v.paths.catalog = '/models/inspection-missing-case.glb';
    await v.configureWatch({ caseVisible: true, caseMaterial: 'rose-gold' });
    check(
      'Cold case failure preserves intent and bare movement; no partial case',
      !!v.caseError &&
        v.ready &&
        v.state.caseVisible &&
        !visibleCase().length &&
        !v.state.dialsVisible,
    );
    v.paths.catalog = path;
    await v.retryDials();
    await settle(v);
    check(
      'Retry fits complete case without enabling dials',
      !v.caseError &&
        exact() &&
        visibleCase().length === 41 &&
        !v.state.dialsVisible,
    );
  }
  await v.configureWatch({ caseVisible: true, dialsVisible: true });
  await settle(v);
  const geometry = new Map(
    [...v.renderParts].map(([id, p]) => [id, p.mesh.geometry]),
  );
  const materials = new Map(
    [...v.renderParts].map(([id, p]) => [id, p.material]),
  );
  const stableColors = new Map(
    [...v.renderParts]
      .filter(
        ([id]) =>
          belongs(id, ROOT) ||
          DIALS.faces.central.structureLeafIds.includes(id),
      )
      .map(([id, p]) => [id, p.material.color.getHex()]),
  );
  const handOptions = [
    { centralStyle: 'fine', centralFinish: 'blued-steel' },
    { centralStyle: 'fine', centralFinish: 'rose-gold' },
    { centralStyle: 'lance', centralFinish: 'blued-steel' },
    { centralStyle: 'open-lance', centralFinish: 'blued-steel' },
  ];
  for (const side of ['front', 'back'] as const) {
    v.setSide(side);
    await settle(v);
    for (const preset of WATCH.caseMaterials)
      for (const dialsVisible of [false, true])
        for (const hands of handOptions)
          for (const small of DIALS.faces.small.styles) {
            await v.configureWatch({
              caseVisible: true,
              caseMaterial: preset.id,
              dialsVisible,
              ...hands,
              smallStyle: small.id,
            });
            v.applyPose(10);
            v.retargetVisibility();
            const correctColors = [...v.fittedCase]
              .filter((id) =>
                WATCH.caseMaterialDefinitions.includes(
                  v.renderParts.get(id)!.source.definitionId,
                ),
              )
              .every((id) =>
                v.renderParts
                  .get(id)!
                  .material.color.equals(new THREE.Color(preset.color)),
              );
            check(
              `${side}/${preset.id}/dials ${dialsVisible}/${hands.centralStyle}/${hands.centralFinish}/${small.id}`,
              exact() &&
                correctColors &&
                [...stableColors].every(
                  ([id, c]) =>
                    v.renderParts.get(id)!.material.color.getHex() === c,
                ) &&
                v.fitted.size === (dialsVisible ? 43 : 0),
            );
          }
  }
  await v.configureWatch({
    caseMaterial: 'platinum',
    centralStyle: 'fine',
    centralFinish: 'rose-gold',
  });
  await settle(v);
  const before = v.camera.position.clone();
  await v.configureWatch({
    caseMaterial: 'steel',
    centralFinish: 'blued-steel',
  });
  await settle(v);
  check(
    'Material changes preserve camera and per-instance resource identity',
    v.camera.position.equals(before) &&
      [...geometry].every(
        ([id, g]) => v.renderParts.get(id)!.mesh.geometry === g,
      ) &&
      [...materials].every(([id, m]) => v.renderParts.get(id)!.material === m),
  );
  await v.configureWatch({ centralFinish: 'rose-gold', centralStyle: 'lance' });
  check(
    'Unsupported rose Lance normalizes with visible feedback',
    v.state.centralStyle === 'lance' &&
      v.state.centralFinish === 'blued-steel' &&
      !!v.configurationNotice,
  );
  await v.configureWatch({ centralStyle: 'fine', centralFinish: 'rose-gold' });
  const blades = Object.values(DIALS.faces.central.styles[0].handLeafIds);
  check(
    'Rose finish targets exactly the three Fine blades; support seats unchanged',
    [...v.renderParts]
      .filter(([, p]) => p.material.userData.configurationOverride.value === 1)
      .map(([id]) => id)
      .sort()
      .join() === blades.sort().join(),
  );
  for (const separation of [0, 0.15, 0.5, 1, 0.4, 0]) {
    v.patch({ separation });
    await settle(v);
    check(
      `Case separation ${separation}: complete, transparent, within frame`,
      exact() &&
        [...CASE_CRYSTALS].every((id) => {
          const p = v.renderParts.get(id)!;
          return (
            p.mesh.visible &&
            p.material.transparent &&
            !p.material.depthWrite &&
            p.material.opacity === 0.12
          );
        }) &&
        v
          .targetPoints((p) => p.mesh.visible)
          .every((point) => {
            const p = point.project(v.camera);
            return Math.abs(p.x) < 1.01 && Math.abs(p.y) < 1.01;
          }),
    );
  }
  for (const separation of [1, 0, 1, 0.2, 0]) {
    v.patch({ separation });
    await pause(40);
  }
  await settle(v);
  check(
    'Rapid separation reversal returns every case occurrence to exact source matrix',
    [...CASE_LEAVES].every((id) => {
      const p = v.renderParts.get(id)!;
      return p.mesh.matrix.equals(p.assembled);
    }),
  );
  for (const group of GROUPS) {
    v.group(group.id);
    await settle(v);
    check(
      `${group.id}: Focus hides case and retains preference`,
      !visibleCase().length && v.state.caseVisible,
    );
  }
  v.group(null);
  await settle(v);
  check('Whole movement restores case', exact() && v.caseEffective());
  v.allParts();
  await settle(v);
  check(
    'All parts excludes every case/strap leaf and retains case preference',
    !visibleCase().length &&
      v.state.caseVisible &&
      [...v.spread.keys()].every((id) => !id.startsWith(WATCH.rootId)),
  );
  v.reset();
  await settle(v);
  check(
    'Reset restores configured case, hand finish, side and assembled transforms',
    v.caseEffective() &&
      v.state.centralFinish === 'rose-gold' &&
      v.state.side === 'back' &&
      [...CASE_LEAVES].every((id) => {
        const p = v.renderParts.get(id)!;
        return p.mesh.matrix.equals(p.assembled);
      }),
  );
  const crystal = [...CASE_CRYSTALS][0];
  await v.select(crystal);
  await settle(v);
  check(
    'Explicit crystal inspection remains available with raw appearance',
    v.renderParts.get(crystal)!.mesh.visible &&
      !v.caseEffective() &&
      v.state.part === crystal &&
      !v.renderParts.get(crystal)!.material.transparent,
  );
  v.patch({ isolated: true });
  await settle(v);
  check(
    'Crystal isolation contains only selected crystal',
    [...v.renderParts.values()]
      .filter((p) => p.mesh.visible)
      .every((p) => p.source.id === crystal),
  );
  v.reset();
  await settle(v);
  const sourceCase = [...CASE_LEAVES].find(
    (id) => v.renderParts.get(id)!.source.definitionId === 'd_0_1_1_54',
  )!;
  check(
    'Lug recovery is shared across source occurrences with 34 additional face triangles',
    [...v.renderParts.values()]
      .filter((p) => p.source.definitionId === 'd_0_1_1_54')
      .every(
        (p) =>
          p.mesh.geometry.index!.count === 11540 * 3 &&
          p.mesh.userData.caseSurfaceRecovery,
      ),
  );
  await v.select(sourceCase);
  await settle(v);
  check(
    'Raw lug selection temporarily hides configured case',
    !v.caseEffective() && visibleCase().length === 1,
  );
  v.reset();
  await settle(v);
  const loader = v.loadCatalog.bind(v);
  let release!: () => void;
  v.loadCatalog = () =>
    new Promise<void>((resolve) => {
      release = resolve;
    });
  const pending = v.configureWatch({ caseMaterial: 'rose-gold' });
  await v.configureWatch({
    caseVisible: false,
    dialsVisible: false,
    caseMaterial: 'platinum',
    centralFinish: 'blued-steel',
  });
  release();
  await pending;
  v.loadCatalog = loader;
  await settle(v);
  check(
    'Late completion cannot restore stale case, dials or material',
    !visibleCase().length &&
      !v.state.dialsVisible &&
      v.state.caseMaterial === 'platinum',
  );
  await v.configureWatch({ caseVisible: true, dialsVisible: true });
  await settle(v);
  const warm = v.stats();
  for (let i = 0; i < 20; i++)
    await v.configureWatch({
      caseMaterial: WATCH.caseMaterials[i % 3].id,
      centralFinish: i % 2 ? 'rose-gold' : 'blued-steel',
    });
  await settle(v);
  const stable = v.stats();
  await pause(500);
  check(
    'Warm configuration changes reuse GPU geometry/textures and stop rendering at idle',
    v.stats().geometries === warm.geometries &&
      v.stats().textures === warm.textures &&
      v.renderCount === stable.renderCount,
  );
  const extension = v.renderer.getContext().getExtension('WEBGL_lose_context');
  if (extension) {
    extension.loseContext();
    await pause(150);
    extension.restoreContext();
    await pause(900);
    await settle(v);
    check(
      'WebGL restoration retains complete configured case and clear crystals',
      v.ready && exact() && v.caseEffective() && CASE_CRYSTALS.size === 2,
    );
  }
  v.patch({ quality: 'low' });
  await settle(v);
  check(
    'Reduced quality preserves crystal transparency',
    [...CASE_CRYSTALS].every(
      (id) => v.renderParts.get(id)!.material.opacity === 0.12,
    ),
  );
  v.patch({ quality: 'auto' });
  await v.configureWatch({
    caseVisible: false,
    dialsVisible: false,
    caseMaterial: 'steel',
    centralStyle: 'fine',
    centralFinish: 'blued-steel',
    smallStyle: 'lance',
  });
  v.reset();
  await settle(v);
  return {
    scope:
      'Local browser; material presets are authored, viewport emulation is not physical-device review',
    checks,
    pass: checks.every((c) => c.pass),
  };
}
