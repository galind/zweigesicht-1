import * as THREE from 'three';
import handPoses from '../../../assets/authored/hand-display-poses.json';
import {
  DISPLAY_LAYERS,
  displaySeparationOffsets,
} from '../experience/explosion';
import type { MovementViewer } from './MovementViewer';
import { DIALS, fittedLeaves, displayHostPart } from '../experience/dials';
import { ROOT, belongs, GROUPS } from '../experience/catalog';
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
    throw new Error('Display did not settle');
}
export async function runDialChecks(v: MovementViewer) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  const check = (name: string, pass: boolean, details?: unknown) =>
    checks.push({ name, pass, details });
  const faceOn = () => {
    const direction = v.camera.position
      .clone()
      .sub(v.controls.target)
      .normalize();
    return (
      v.state.viewAngle === 'face' &&
      Math.abs(direction.x) < 1e-8 &&
      Math.abs(direction.y) < 1e-8
    );
  };
  const prefs = () =>
    JSON.stringify([
      v.state.centralVisible,
      v.state.smallVisible,
      v.state.centralStyle,
      v.state.smallStyle,
    ]);
  const visible = () =>
    [...v.renderParts.values()].filter(
      (p) => p.mesh.visible && !belongs(p.source.id, ROOT),
    );
  const exact = () => {
    const expected = fittedLeaves(v.state);
    return (
      visible().length === expected.size &&
      visible().every((p) => expected.has(p.source.id))
    );
  };
  v.reset();
  await settle(v);
  if (!v.catalogLoaded) {
    const path = v.paths.catalog;
    v.paths.catalog = '/models/inspection-unavailable-dials.glb';
    await v.configureDials({ centralVisible: true, smallVisible: true });
    check(
      'Cold-load failure keeps both preferences, usable movement and retry',
      v.ready &&
        v.state.centralVisible &&
        v.state.smallVisible &&
        !!v.dialError &&
        visible().length === 0,
    );
    v.paths.catalog = path;
    v.setSide('front');
    v.patch({ separation: 0.4 });
    await v.retryDials();
    await settle(v);
    check(
      'Retry loads both packets into current separated view',
      exact() &&
        !v.dialError &&
        v.state.separation === 0.4 &&
        v.state.side === 'front',
    );
  }
  v.reset();
  await settle(v);
  for (const dialsVisible of [false, true]) {
    const centralVisible = dialsVisible,
      smallVisible = dialsVisible;
    await v.configureDials({
      centralVisible,
      smallVisible,
      centralStyle: 'lance',
      smallStyle: 'pear',
    });
    check(
      'Visibility toggle presents every enabled leaf at full opacity immediately',
      exact() &&
        visible().every(
          (p) =>
            p.material.opacity === 1 &&
            !p.material.transparent &&
            p.material.depthWrite &&
            !p.motion,
        ),
    );
    await settle(v);
    const before = prefs();
    const label = `${Number(centralVisible)}${Number(smallVisible)}`;
    check(`${label}: exact enabled leaves and independent styles`, exact());
    v.setSide(v.state.side === 'front' ? 'back' : 'front');
    await settle(v);
    check(
      `${label}: side switch retains visibility and styles`,
      before === prefs() && exact(),
    );
    v.patch({ separation: 1 });
    await settle(v);
    const leaves = visible();
    const layersClear = (['central', 'small'] as const).every((face) => {
      const sign = face === 'central' ? 1 : -1;
      let edge = -Infinity;
      return DISPLAY_LAYERS[face].every((layer) => {
        const boxes = leaves
          .filter((p) => layer.includes(p.source.id))
          .map((p) =>
            p.mesh.geometry.boundingBox!.clone().applyMatrix4(p.mesh.matrix),
          );
        if (!boxes.length) return true;
        const min = Math.min(
          ...boxes.map((b) => sign * (sign === 1 ? b.min.z : b.max.z)),
        );
        const clear = min - edge >= 0.999;
        edge = Math.max(
          ...boxes.map((b) => sign * (sign === 1 ? b.max.z : b.min.z)),
        );
        return clear;
      });
    });
    check(
      `${label}: enabled individual dial/hand layers separate with 1 mm clearance`,
      before === prefs() && exact() && layersClear,
    );
    v.patch({ separation: 0 });
    await settle(v);
    check(
      `${label}: reassembly restores exact fitted matrices`,
      exact() && v.assemblyError('presentation') === 0 && before === prefs(),
    );
    v.allParts();
    await settle(v);
    const packed = v.auditSpread();
    check(
      `${label}: All parts includes every enabled leaf without overlap or clipping`,
      v.spread.size === 216 + fittedLeaves(v.state).size &&
        packed.overlaps.length === 0 &&
        packed.clipped.length === 0 &&
        exact(),
      packed,
    );
    check(
      `${label}: every fitted inventory part faces forward and upright`,
      leaves.every((p) => {
        if (p.source.name.startsWith('010-'))
          return (
            new THREE.Vector3(0, 0, 1)
              .transformDirection(p.mesh.matrix)
              .distanceTo(new THREE.Vector3(0, -1, 0)) < 1e-9
          );
        const hand = handPoses.hands.find((h) => h.leafId === p.source.id);
        if (hand) {
          const direction = new THREE.Vector3()
            .fromArray(hand.tipLandmarkLocalMm)
            .sub(new THREE.Vector3().fromArray(hand.boreLocalMm))
            .transformDirection(p.mesh.matrix);
          return (
            new THREE.Vector3(direction.x, direction.y, 0)
              .normalize()
              .distanceTo(new THREE.Vector3(0, -1, 0)) < 1e-9
          );
        }
        const sign = belongs(p.source.id, DIALS.faces.central.rootId) ? 1 : -1;
        const rotation = v.spread.get(p.source.id)!.rotation;
        return (
          new THREE.Vector3(0, 0, sign)
            .applyQuaternion(rotation)
            .distanceTo(new THREE.Vector3(0, 0, -1)) < 1e-9 &&
          new THREE.Vector3(0, sign, 0)
            .applyQuaternion(rotation)
            .distanceTo(new THREE.Vector3(0, -1, 0)) < 1e-9
        );
      }),
    );
    if (leaves.length) {
      await v.select(leaves[0].source.id);
      await settle(v);
      check(
        `${label}: selecting fitted inventory part retains layout and styles`,
        v.state.layout === 'spread' && before === prefs(),
      );
    }
    const resetSide = v.state.side;
    v.reset();
    await settle(v);
    check(
      `${label}: Reset keeps visibility/styles/side and reassembles from inventory`,
      before === prefs() &&
        v.state.side === resetSide &&
        v.state.viewAngle === 'overview' &&
        exact() &&
        v.state.layout === 'assembly' &&
        v.assemblyError('presentation') === 0,
    );
    v.group(null);
    await settle(v);
    check(
      `${label}: return from All parts restores fitted pose`,
      v.assemblyError('presentation') === 0 && exact() && before === prefs(),
    );
  }
  await v.configureDials({ centralVisible: true, smallVisible: true });
  await settle(v);
  for (const face of ['central', 'small'] as const)
    for (const style of DIALS.faces[face].styles) {
      const other =
        face === 'central' ? v.state.smallStyle : v.state.centralStyle;
      await v.configureDials({
        [face === 'central' ? 'centralStyle' : 'smallStyle']: style.id,
      });
      await settle(v);
      check(
        `${face} ${style.label}: independent hand style with both dials`,
        exact() &&
          v.assemblyError('presentation') === 0 &&
          other ===
            (face === 'central' ? v.state.smallStyle : v.state.centralStyle),
      );
    }
  for (const group of GROUPS) {
    v.group(group.id);
    await settle(v);
    const before = prefs();
    if (group.id === 'display')
      check(
        'Uncover retains both display packets at their seats',
        visible().length === 43 &&
          visible().every((p) => p.offset.length() === 0),
      );
    v.patch({ partSpread: 1 });
    await settle(v);
    check(
      `${group.id}: display layers compose with their section hosts`,
      before === prefs() &&
        visible().every(
          (p) =>
            p.offset.distanceTo(
              v.renderParts
                .get(displayHostPart(p.source.id))!
                .offset.clone()
                .add(
                  new THREE.Vector3(
                    0,
                    0,
                    group.id === 'display'
                      ? (displaySeparationOffsets(v.parts).get(p.source.id) ??
                          0)
                      : 0,
                  ),
                ),
            ) < 1e-9,
        ),
    );
    v.patch({ partSpread: 0, reveal: 0 });
    await settle(v);
    check(
      `${group.id}: restoring section and covers preserves preferences`,
      before === prefs() && visible().every((p) => p.offset.length() === 0),
    );
  }
  v.group(null);
  await settle(v);
  for (const change of [{ centralStyle: 'fine' }, { centralVisible: false }]) {
    await v.configureDials({ centralVisible: true, smallVisible: true });
    v.group('energy');
    await settle(v);
    v.group(null);
    await pause(90);
    await v.configureDials(change);
    await settle(v);
    check(
      'Interrupted section restoration and dial change preserve opaque material state',
      [...v.renderParts.values()].every(
        (p) =>
          !p.cutaway &&
          p.material.opacity === 1 &&
          !p.material.transparent &&
          p.material.depthWrite,
      ),
    );
  }
  v.reset();
  v.group('display');
  await settle(v);
  await v.configureDials({ centralVisible: true, smallVisible: true });
  await settle(v);
  const fittedPoints = v
    .targetPoints((p) => v.fitted.has(p.source.id))
    .map((point) => point.project(v.camera));
  check(
    'Enabling dials inside Time display fits all display bounds',
    fittedPoints.every((p) => Math.abs(p.x) < 1 && Math.abs(p.y) < 1),
  );
  v.group(null);
  await settle(v);
  await v.configureDials({
    centralVisible: false,
    smallVisible: false,
    centralStyle: 'fine',
    smallStyle: 'lance',
  });
  v.reset();
  await v.chooseDial('central', true);
  await settle(v);
  check(
    'Menu enable turns to Three hands and shows its complete dial',
    v.state.side === 'front' &&
      faceOn() &&
      exact() &&
      v.state.centralVisible &&
      v.state.smallVisible,
  );
  await v.chooseDial('small', true, 'pear');
  await settle(v);
  check(
    'Menu style choice enables Skeleton and faces it without hiding Three hands',
    v.state.side === 'back' &&
      faceOn() &&
      exact() &&
      v.state.centralVisible &&
      v.state.smallVisible &&
      v.state.smallStyle === 'pear',
  );
  await v.chooseDial('central', false);
  await settle(v);
  check(
    'Hiding a dial keeps the camera side and its hand style',
    v.state.side === 'back' &&
      !v.state.centralVisible &&
      v.state.centralStyle === 'fine',
  );
  v.group('energy');
  await settle(v);
  await v.chooseDial('central', true, 'lance');
  await settle(v);
  check(
    'Menu dial choice leaves an unrelated scope so the selected face is visible',
    v.state.group === null &&
      v.state.phase === 'whole' &&
      v.state.side === 'front' &&
      exact() &&
      v.state.smallVisible,
  );
  v.allParts();
  await settle(v);
  await v.select(DIALS.faces.central.structureLeafIds[0]);
  v.patch({ isolated: true });
  await settle(v);
  await v.chooseDial('small', true, 'lance');
  await settle(v);
  check(
    'Menu hand choice clears isolation and retains the face-on All parts layout',
    v.state.layout === 'spread' &&
      !v.state.isolated &&
      !v.state.part &&
      exact() &&
      v.auditSpread().overlaps.length === 0,
  );
  v.group(null);
  await settle(v);
  const warmed = v.stats();
  for (let i = 0; i < 12; i++) {
    void v.configureDials({
      centralVisible: !!(i % 2),
      smallVisible: !!(i % 2),
      centralStyle: i % 2 ? 'lance' : 'open-lance',
    });
    v.patch({ separation: i % 2 });
    await pause(25);
  }
  v.allParts();
  await pause(80);
  v.group(null);
  await v.configureDials({
    centralVisible: true,
    smallVisible: true,
    centralStyle: 'lance',
    smallStyle: 'pear',
  });
  await settle(v);
  check(
    'Rapid toggles and interrupted separation/spread restore latest fitted geometry',
    exact() && v.assemblyError('presentation') === 0,
  );
  check(
    'Transitions release all fade flags and restore opaque materials',
    [...v.renderParts.values()].every(
      (p) =>
        !p.cutaway &&
        !p.material.transparent &&
        p.material.opacity === 1 &&
        p.material.depthWrite,
    ),
  );
  check(
    'Warm toggles reuse geometry and textures',
    v.stats().geometries === warmed.geometries &&
      v.stats().textures === warmed.textures,
  );
  // Delay the real cached loader to exercise navigation/reset while an async
  // request is outstanding without relying on network timing.
  const loader = v.loadCatalog.bind(v);
  let release!: () => void;
  v.loadCatalog = () =>
    new Promise<void>((resolve) => {
      release = () => {
        void loader().then(resolve);
      };
    });
  const pending = v.configureDials({
    centralVisible: true,
    smallVisible: true,
  });
  v.setSide('front');
  v.patch({ separation: 0.65 });
  release();
  await pending;
  await settle(v);
  check(
    'Loading completion preserves newer side and separation',
    v.state.side === 'front' &&
      v.state.separation === 0.65 &&
      v.state.centralVisible &&
      v.state.smallVisible &&
      exact(),
  );
  const cancelled = v.configureDials({ centralVisible: true });
  const resetPreferences = prefs();
  const resetSide = v.state.side;
  v.reset();
  release();
  await cancelled;
  v.loadCatalog = loader;
  await settle(v);
  check(
    'Reset retains pending dial preferences and current side while reassembling',
    prefs() === resetPreferences &&
      v.state.side === resetSide &&
      v.state.viewAngle === 'overview' &&
      v.state.layout === 'assembly' &&
      v.state.separation === 0 &&
      v.state.partSpread === 0 &&
      v.state.reveal === 0 &&
      v.assemblyError('presentation') === 0 &&
      !v.dialRequest &&
      !v.dialError,
  );
  await v.configureDials({
    centralVisible: true,
    smallVisible: true,
    centralStyle: 'open-lance',
    smallStyle: 'pear',
  });
  await settle(v);
  v.patch({ separation: 0.5 });
  await settle(v);
  const recoveryPrefs = prefs();
  const surfaceCount = v.sourceSurfaces?.size;
  const extension = v.renderer.getContext().getExtension('WEBGL_lose_context');
  if (extension) {
    extension.loseContext();
    await pause(100);
    extension.restoreContext();
    const start = performance.now();
    while (!v.ready && performance.now() - start < 10000) await pause(50);
    await settle(v);
    check(
      'WebGL recovery preserves both separated displays and styles',
      prefs() === recoveryPrefs &&
        v.state.separation === 0.5 &&
        exact() &&
        v.sourceSurfaces?.size === surfaceCount,
    );
  }
  await v.load();
  const reloadStart = performance.now();
  while (!v.ready && performance.now() - reloadStart < 10000) await pause(30);
  await settle(v);
  check(
    'Retry preparation preserves both display preferences and separation',
    prefs() === recoveryPrefs && v.state.separation === 0.5 && exact(),
  );
  v.group(null);
  await settle(v);
  const selectedHand = DIALS.faces.central.styles[2].handLeafIds.hour;
  await v.select(selectedHand);
  await settle(v);
  await v.configureDials({ centralVisible: false });
  await settle(v);
  check(
    'Hiding selected display clears stale selection and outgoing geometry',
    !v.state.part && exact(),
  );
  const reduced = v.reduced;
  v.reduced = true;
  await v.configureDials({ centralVisible: true, smallVisible: true });
  v.patch({ separation: 1 });
  await settle(v);
  v.patch({ separation: 0 });
  await settle(v);
  check(
    'Reduced motion preserves both displays and exact reassembly',
    exact() && v.assemblyError('presentation') === 0,
  );
  v.reduced = reduced;
  v.reset();
  await settle(v);
  return {
    scope:
      'Local Chromium renderer; mobile viewport emulation, not physical-device or mechanical certification',
    pass: checks.every((c) => c.pass),
    checks,
  };
}
