import type { MovementViewer } from './MovementViewer';
import * as THREE from 'three';
import { DIALS, fittedLeaves } from '../experience/dials';
import { ROOT, belongs } from '../experience/catalog';
const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
async function settle(v: MovementViewer) {
  const start = performance.now();
  do {
    await pause(30);
  } while (
    (v.travel || v.presentationMoving || v.needsRender) &&
    performance.now() - start < 8000
  );
  if (v.travel || v.presentationMoving || !v.ready)
    throw new Error('Display did not settle');
}
export async function runDialChecks(v: MovementViewer) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  const check = (name: string, pass: boolean, details?: unknown) =>
    checks.push({ name, pass, details });
  v.reset();
  await settle(v);
  const baseline = v.stats();
  if (!v.catalogLoaded) {
    const path = v.paths.catalog;
    v.paths.catalog = '/models/inspection-unavailable-dials.glb';
    await v.showDial('central');
    check(
      'First-load failure retains usable bare movement and current retry',
      v.state.presentation === 'movement' &&
        v.ready &&
        !!v.dialError &&
        v.dialRequest?.view === 'central',
    );
    v.paths.catalog = path;
    const start = performance.now();
    await v.retryDials();
    await settle(v);
    check(
      'Retry fits the complete selected display',
      v.state.presentation === 'dials' && !v.dialError,
      { firstUseThroughSettledMs: performance.now() - start },
    );
  } else check('Catalog already warm for this run', true);
  const rows = [];
  for (const face of ['central', 'small'] as const)
    for (const style of DIALS.faces[face].styles) {
      await v.showDial(face, face, style.id);
      await settle(v);
      const expected = fittedLeaves(v.state);
      const visible = [...v.renderParts.values()].filter(
        (p) => p.mesh.visible && !belongs(p.source.id, ROOT),
      );
      rows.push({
        face,
        style: style.id,
        visible: visible.length,
        stats: v.stats(),
      });
      check(
        face +
          ' ' +
          style.label +
          ' has only its fitted leaves at the reviewed display pose',
        visible.length === (face === 'central' ? 22 : 21) &&
          visible.every((p) =>
            belongs(p.source.id, DIALS.faces[face].rootId),
          ) &&
          visible.every((p) => expected.has(p.source.id)) &&
          v.assemblyError('presentation') === 0,
      );
    }
  for (const face of ['central', 'small'] as const) {
    const initialRight = new THREE.Vector3(1, 0, 0).applyQuaternion(
      v.camera.quaternion,
    );
    const previous = v.camera.quaternion.clone();
    let angularTravel = 0,
      maxRightDrift = 0,
      maxNdc = 0,
      frames = 0;
    v.inspectionFrame = (_now, rendered) => {
      if (!rendered) return;
      frames++;
      angularTravel += previous.angleTo(v.camera.quaternion);
      previous.copy(v.camera.quaternion);
      maxRightDrift = Math.max(
        maxRightDrift,
        initialRight.angleTo(
          new THREE.Vector3(1, 0, 0).applyQuaternion(v.camera.quaternion),
        ),
      );
      for (const p of v.renderParts.values()) {
        if (!p.mesh.visible) continue;
        const b = p.mesh.geometry.boundingBox!;
        for (let i = 0; i < 8; i++) {
          const point = new THREE.Vector3(
            i & 1 ? b.max.x : b.min.x,
            i & 2 ? b.max.y : b.min.y,
            i & 4 ? b.max.z : b.min.z,
          )
            .applyMatrix4(p.mesh.matrixWorld)
            .project(v.camera);
          maxNdc = Math.max(maxNdc, Math.abs(point.x), Math.abs(point.y));
        }
      }
    };
    try {
      await v.showDial(face);
      await settle(v);
    } finally {
      v.inspectionFrame = undefined;
    }
    check(
      face +
        ' turnover is one restrained half-turn with no sideways tumble or clipping',
      frames > 2 &&
        angularTravel < Math.PI + 0.01 &&
        maxRightDrift < 0.1 &&
        maxNdc < 1,
      { frames, angularTravel, maxRightDrift, maxNdc },
    );
  }
  const warmed = v.stats();
  const transfers = performance
    .getEntriesByType('resource')
    .filter((r) => r.name.includes('catalog-')).length;
  for (let i = 0; i < 20; i++) {
    void v.showDial(
      i % 2 ? 'central' : 'small',
      i % 2 ? 'central' : 'small',
      i % 2 ? 'fine' : 'pear',
    );
    if (i % 4 === 0) v.group('energy');
    if (i % 4 === 1) v.scrub({ separation: 0.3 });
    if (i % 4 === 2) v.allParts();
    await pause(25);
  }
  await v.showDial('central', 'central', 'open-lance');
  await settle(v);
  const position = v.camera.position.clone(),
    target = v.controls.target.clone(),
    up = v.camera.up.clone();
  await v.showDial('central', 'central', 'fine');
  await settle(v);
  check(
    'Style change preserves camera within floating-point tolerance',
    position.distanceTo(v.camera.position) < 1e-9 &&
      target.distanceTo(v.controls.target) < 1e-9 &&
      up.distanceTo(v.camera.up) < 1e-12,
    {
      positionErrorMm: position.distanceTo(v.camera.position),
      targetErrorMm: target.distanceTo(v.controls.target),
      upError: up.distanceTo(v.camera.up),
    },
  );
  await v.showDial('small', 'small', 'pear');
  await settle(v);
  v.setSide('front');
  await settle(v);
  check(
    'Side switch agrees with dial selector and independent preferences',
    v.state.side === 'front' &&
      v.state.smallStyle === 'pear' &&
      v.state.centralStyle === 'fine',
  );
  v.group('energy');
  await settle(v);
  v.back();
  await settle(v);
  check(
    'Back restores fitted view from mechanism',
    v.state.presentation === 'dials' &&
      v.state.side === 'front' &&
      v.state.smallStyle === 'pear',
  );
  await v.showDial('small');
  await settle(v);
  const raw = DIALS.presentationOverrides[0].leafId;
  await v.select(raw);
  v.patch({ isolated: true });
  await settle(v);
  check(
    'Raw enamel isolation retains its red interpretation',
    v.renderParts.get(raw)?.material.color.getHex() === 0x6c2031 &&
      [...v.renderParts.values()].filter((p) => p.mesh.visible).length === 1,
  );
  v.back();
  await settle(v);
  check(
    'Back restores only the small dial with blue enamel',
    v.renderParts.get(raw)?.material.color.getHex() === 0x143a69 &&
      [...v.renderParts.values()].filter(
        (p) => p.mesh.visible && !belongs(p.source.id, ROOT),
      ).length === 21,
  );
  v.setSide('front');
  await pause(100);
  v.orbit(0.1, 0.02);
  const owned = v.camera.position.clone();
  await pause(150);
  check(
    'Manual orbit cancels dial camera travel',
    !v.travel &&
      v.cameraUserOwned &&
      owned.distanceTo(v.camera.position) < 1e-8,
  );
  await v.showDial('central');
  await settle(v);
  const extension = v.renderer.getContext().getExtension('WEBGL_lose_context');
  if (extension) {
    const before = { ...v.state };
    extension.loseContext();
    await pause(100);
    extension.restoreContext();
    const start = performance.now();
    while (!v.ready && performance.now() - start < 8000) await pause(50);
    await settle(v);
    check(
      'Graphics restoration preserves styles, fitted displays, annotations and diamond',
      v.ready &&
        v.state.presentation === before.presentation &&
        v.state.centralStyle === before.centralStyle &&
        v.state.smallStyle === before.smallStyle &&
        v.sourceSurfaces?.size === 58 &&
        v.stats().recoveredDiamond === true,
    );
  } else check('Graphics recovery extension available', false);
  const reloaded = { ...v.state },
    reloadCamera = v.camera.position.clone(),
    reloadTarget = v.controls.target.clone(),
    reloadUp = v.camera.up.clone();
  await v.load();
  const reloadStart = performance.now();
  while (!v.ready && performance.now() - reloadStart < 8000) await pause(30);
  await settle(v);
  check(
    'Retry preparation preserves an existing dial inspection and camera',
    v.state.presentation === reloaded.presentation &&
      v.state.centralStyle === reloaded.centralStyle &&
      v.state.smallStyle === reloaded.smallStyle &&
      // OrbitControls reconstructs Cartesian coordinates after recovery; allow
      // numerical roundoff, using the same millimetre tolerance as style changes.
      reloadCamera.distanceTo(v.camera.position) < 1e-9 &&
      reloadTarget.distanceTo(v.controls.target) < 1e-9 &&
      reloadUp.distanceTo(v.camera.up) < 1e-12,
    {
      before: reloaded,
      after: { ...v.state },
      beforeCamera: reloadCamera.toArray(),
      afterCamera: v.camera.position.toArray(),
      cameraError: reloadCamera.distanceTo(v.camera.position),
      targetError: reloadTarget.distanceTo(v.controls.target),
      upError: reloadUp.distanceTo(v.camera.up),
    },
  );
  // Restore the same style pair used for resource warm-up; first outline selection may add one geometry.
  await v.showDial('small', 'small', 'pear');
  await settle(v);
  const after = v.stats(),
    renders = v.renderCount;
  await pause(650);
  check('Idle display does not redraw', v.renderCount === renders);
  check(
    'Repeated style changes reuse the catalog transfer',
    performance
      .getEntriesByType('resource')
      .filter((r) => r.name.includes('catalog-')).length === transfers,
  );
  check(
    'Resources stable after warm-up',
    Number(after.geometries) <= Number(warmed.geometries) + 1 &&
      after.textures === warmed.textures,
    { warmed, after },
  );
  v.allParts();
  await settle(v);
  check(
    'Spread remains exactly 216',
    v.auditSpread().members === 216 && v.auditSpread().visible === 216,
  );
  v.reset();
  await settle(v);
  check(
    'Reset restores opening and exact assembly',
    v.state.presentation === 'movement' &&
      v.state.centralStyle === 'fine' &&
      v.state.smallStyle === 'lance' &&
      v.assemblyError() === 0 &&
      v.camera.up.y === -1,
  );
  return {
    scope:
      'Real local browser; viewport emulation, no physical-device or mechanical certification',
    pass: checks.every((c) => c.pass),
    checks,
    baseline,
    styles: rows,
  };
}
