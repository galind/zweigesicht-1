import * as THREE from 'three';
import type { MovementViewer } from './MovementViewer';
import { DIALS } from '../experience/dials';

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
    throw new Error('Inventory did not settle');
}
/** Opt-in browser checks exercise the real renderer, including dock/keyboard targets. */
export async function runInventoryChecks(v: MovementViewer) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  const check = (name: string, pass: boolean, details?: unknown) =>
    checks.push({ name, pass, details });
  const matrices = () =>
    new Map(
      [...v.spread.keys()].map((id) => [
        id,
        v.renderParts.get(id)!.mesh.matrix.clone(),
      ]),
    );
  const center = (id: string) => {
    const p = v.renderParts.get(id)!;
    return p.mesh.geometry
      .boundingBox!.getCenter(new THREE.Vector3())
      .applyMatrix4(p.mesh.matrix);
  };
  const same = (m: THREE.Matrix4, n: THREE.Matrix4) =>
    Math.max(...m.elements.map((x, i) => Math.abs(x - n.elements[i]))) < 1e-9;
  const audit = (name: string) => {
    const result = v.auditSpread();
    check(
      name,
      !result.overlaps.length &&
        !result.clipped.length &&
        result.maxScaleError < 1e-9,
      result,
    );
  };
  const savedReduced = v.reduced;
  v.reset();
  await settle(v);
  v.setSide('front');
  await settle(v);
  v.allParts();
  await settle(v);
  v.flipMovement();
  await settle(v);
  if (!v.catalogLoaded) {
    const path = v.paths.catalog;
    v.paths.catalog = '/models/inventory-unavailable.glb';
    await v.configureDials({ centralVisible: true, smallVisible: true });
    await settle(v);
    check(
      'Failed inventory dial load preserves back orientation and retry intent',
      !!v.dialError && v.state.inventoryBack && v.inventoryAngle === Math.PI,
    );
    v.paths.catalog = path;
    await v.configureDials();
    await settle(v);
    check(
      'Retry shows complete dials immediately at the current back pose',
      !v.dialError &&
        v.fitted.size === 43 &&
        v.inventoryAngle === Math.PI &&
        [...v.fitted].every((id) => !v.renderParts.get(id)!.motion),
    );
  }
  await v.configureDials({ centralVisible: true, smallVisible: true });
  await settle(v);
  v.reset();
  await settle(v);
  v.allParts();
  await settle(v);
  check(
    'Entry starts forward without changing the current assembly side',
    !v.state.inventoryBack &&
      v.inventoryAngle === 0 &&
      v.state.side === 'front',
  );
  const forward = matrices(),
    centers = new Map([...v.spread.keys()].map((id) => [id, center(id)]));
  audit(
    'Both enabled dials and movement fit forward without overlap or clipping',
  );
  const button = document.querySelector<HTMLButtonElement>('.side-switch')!;
  const rect = button.getBoundingClientRect();
  check(
    'Flip movement retains its label, decorative icon, keyboard button and touch target',
    !button.disabled &&
      button.textContent?.trim() === 'Flip' &&
      button.getAttribute('aria-label') === 'Flip movement' &&
      !!button.querySelector('svg[aria-hidden="true"]') &&
      button.tabIndex === 0 &&
      rect.width >= 44 &&
      rect.height >= 44,
  );
  await v.select(DIALS.faces.small.structureLeafIds[0]);
  v.frameSpread();
  await settle(v);
  const selection = v.state.part,
    camera = v.camera.matrixWorld.clone(),
    target = v.controls.target.clone();
  v.reduced = false;
  button.click();
  await settle(v);
  check(
    'All components make the same rigid half-turn about their own unchanged centers',
    [...forward].every(([id, m]) => {
      const c = centers.get(id)!;
      const expected = m
        .clone()
        .premultiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z))
        .premultiply(new THREE.Matrix4().makeRotationY(Math.PI))
        .premultiply(new THREE.Matrix4().makeTranslation(c.x, c.y, c.z));
      return (
        center(id).distanceTo(c) < 1e-8 &&
        same(v.renderParts.get(id)!.mesh.matrix, expected)
      );
    }),
  );
  check(
    'Flip preserves selection, camera, target and the All parts layout',
    v.state.part === selection &&
      same(v.camera.matrixWorld, camera) &&
      v.controls.target.equals(target) &&
      v.state.layout === 'spread',
  );
  audit('Both enabled dials and movement fit back without overlap or clipping');
  button.click();
  await settle(v);
  check(
    'Double flip restores every forward matrix exactly',
    [...forward].every(([id, m]) =>
      v.renderParts.get(id)!.mesh.matrix.equals(m),
    ),
  );
  v.flipMovement();
  await pause(160);
  const mid = matrices(),
    angle = v.inventoryAngle;
  v.flipMovement();
  v.applyPose(0);
  check(
    'Interrupted reversal has no pose jump',
    v.inventoryAngle === angle &&
      [...mid].every(([id, m]) => same(v.renderParts.get(id)!.mesh.matrix, m)),
  );
  v.flipMovement();
  v.flipMovement();
  await settle(v);
  check(
    'Rapid repeated clicks settle at the latest exact forward pose',
    [...forward].every(([id, m]) =>
      v.renderParts.get(id)!.mesh.matrix.equals(m),
    ),
  );
  v.pan(0.1, 0.05);
  v.zoom(0.9);
  await settle(v);
  const panned = v.camera.matrixWorld.clone(),
    panTarget = v.controls.target.clone();
  v.flipMovement();
  await settle(v);
  check(
    'User pan and zoom are unchanged during flip',
    same(v.camera.matrixWorld, panned) && v.controls.target.equals(panTarget),
  );
  for (const dialsVisible of [false, true]) {
    const centralVisible = dialsVisible,
      smallVisible = dialsVisible;
    await v.configureDials({
      centralVisible,
      smallVisible,
      centralStyle: 'open-lance',
      smallStyle: 'pear',
    });
    await settle(v);
    check(
      `Visibility ${centralVisible}/${smallVisible} retains back and independent styles`,
      v.state.inventoryBack &&
        v.inventoryAngle === Math.PI &&
        v.state.centralStyle === 'open-lance' &&
        v.state.smallStyle === 'pear' &&
        v.fitted.size === (centralVisible ? 22 : 0) + (smallVisible ? 21 : 0),
    );
  }
  v.cameraUserOwned = false;
  v.deselect();
  v.frameSpread();
  await settle(v);
  audit('New hand styles fit the current back inventory');
  v.flipMovement();
  await pause(140);
  const departure = matrices();
  v.group(null);
  v.applyPose(0);
  check(
    'Interrupted exit starts at the displayed turned transforms',
    [...departure].every(([id, m]) =>
      same(v.renderParts.get(id)!.mesh.matrix, m),
    ),
  );
  await settle(v);
  check(
    'All parts exit restores exact fitted assembly and retained side',
    v.assemblyError('presentation') === 0 && v.state.side === 'front',
  );
  v.flipMovement();
  await settle(v);
  check(
    'Assembly Flip movement still uses the opposite axial camera side',
    v.state.side === 'back' && v.camera.position.z < v.controls.target.z,
  );
  v.allParts();
  await settle(v);
  v.flipMovement();
  await settle(v);
  v.reset();
  await settle(v);
  const direction = v.camera.position
    .clone()
    .sub(v.controls.target)
    .normalize();
  check(
    'Reset restores straight-on current assembly side and both dial/style preferences',
    v.state.layout === 'assembly' &&
      !v.state.inventoryBack &&
      v.state.side === 'back' &&
      Math.abs(direction.x) < 1e-8 &&
      Math.abs(direction.y) < 1e-8 &&
      v.state.centralVisible &&
      v.state.smallVisible &&
      v.state.centralStyle === 'open-lance' &&
      v.state.smallStyle === 'pear' &&
      v.assemblyError('presentation') === 0,
  );
  v.allParts();
  v.flipMovement();
  await settle(v);
  check(
    'A turn queued during entry waits for framing then reaches the requested back',
    v.inventoryAngle === Math.PI && !v.inventoryEntering && !v.travel,
  );
  audit('Early Flip still finishes with the entire inventory in view');
  v.reset();
  await settle(v);
  v.allParts();
  await settle(v);
  v.reduced = true;
  v.flipMovement();
  v.applyPose(0);
  check(
    'Reduced motion reaches back in one pose update',
    v.inventoryAngle === Math.PI && !v.inventoryTravel,
  );
  v.reset();
  v.reduced = savedReduced;
  await settle(v);
  return {
    checks,
    pass: checks.every((c) => c.pass),
    scope:
      'Actual browser renderer; mobile viewport emulation is not a physical-device review',
  };
}
