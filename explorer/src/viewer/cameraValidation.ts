import type { MovementViewer } from './MovementViewer';

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
    throw new Error('Camera did not settle');
}
export async function runCameraChecks(v: MovementViewer) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  const views: unknown[] = [];
  const snapshot = (name: string) => {
    const sample = {
      name,
      position: v.camera.position.clone(),
      target: v.controls.target.clone(),
      up: v.camera.up.clone(),
      radius: v.camera.position.distanceTo(v.controls.target),
      state: { ...v.state },
    };
    views.push(sample);
    return sample;
  };
  const same = (
    a: ReturnType<typeof snapshot>,
    b: ReturnType<typeof snapshot>,
  ) =>
    a.position.distanceTo(b.position) < 1e-8 &&
    a.target.distanceTo(b.target) < 1e-8 &&
    a.up.distanceTo(b.up) < 1e-10;
  const check = (name: string, pass: boolean, details?: unknown) =>
    checks.push({ name, pass, details });
  await v.showDial('movement');
  v.reset();
  await settle(v);
  const opening = snapshot('Opening / Reset');
  check(
    'Opening framing is centered on the movement hand axis',
    Math.abs(opening.target.x) < 1e-9 && Math.abs(opening.target.y) < 1e-9,
    { target: opening.target },
  );
  let faceRadius: number | undefined;
  check(
    'Opening uses the tilted overview',
    opening.state.viewAngle === 'overview' &&
      Math.abs(
        (opening.position.x - opening.target.x) /
          (opening.position.z - opening.target.z) +
          0.32,
      ) < 1e-8,
  );
  for (const face of ['central', 'small'] as const) {
    await v.showDial(face);
    await settle(v);
    const dial = snapshot(face);
    faceRadius ??= dial.radius;
    check(
      face + ' faces straight on with the shared dial center and scale',
      dial.target.distanceTo(opening.target) < 1e-8 &&
        Math.abs(dial.radius - faceRadius) < 1e-8 &&
        Math.abs(dial.position.x - dial.target.x) < 1e-8 &&
        Math.abs(dial.position.y - dial.target.y) < 1e-8 &&
        v.state.viewAngle === 'face',
    );
    await v.showDial('movement');
    await settle(v);
    check(
      'Movement from ' + face + ' restores the opening view',
      same(opening, snapshot('Movement from ' + face)) &&
        v.state.side === 'back',
    );
  }
  await v.showDial('central');
  await settle(v);
  const central = snapshot('A before B');
  await v.showDial('small');
  await settle(v);
  const small = snapshot('B after A');
  await v.showDial('central');
  await settle(v);
  check(
    'Repeated face switches have identical destinations',
    same(central, snapshot('A after B')),
  );
  v.orbit(0.7, 0.4);
  await settle(v);
  await v.showDial('small');
  await settle(v);
  check(
    'Default framing is independent of the previous orbit/up basis',
    same(small, snapshot('B after orbit')),
  );
  await v.showDial('central');
  await settle(v);
  v.patch({ separation: 0.4 });
  await settle(v);
  check(
    'Separating directly from Three hands keeps the same face upright',
    v.state.side === 'front' && v.camera.up.distanceTo(central.up) < 1e-10,
  );
  v.patch({ separation: 0 });
  await settle(v);
  check(
    'Reassembly keeps Three hands visible and returns to the tilted overview',
    v.state.centralVisible &&
      v.state.viewAngle === 'overview' &&
      Math.abs(
        (v.camera.position.x - v.controls.target.x) /
          (v.camera.position.z - v.controls.target.z) -
          0.32,
      ) < 1e-8,
  );
  let maxNdc = 0;
  for (const side of ['back', 'front'] as const) {
    await v.showDial('movement');
    await settle(v);
    v.setSide(side);
    await settle(v);
    const assembled = snapshot('Bare ' + side);
    check(
      side + ' bare face shares the common assembled center and scale',
      assembled.target.distanceTo(opening.target) < 1e-8 &&
        Math.abs(assembled.radius - opening.radius) < 1e-8,
    );
    v.inspectionFrame = (_now, rendered) => {
      if (!rendered) return;
      for (const p of v.renderParts.values()) {
        if (!p.mesh.visible) continue;
        for (const corner of v.boundsCorners(p.mesh.geometry.boundingBox!)) {
          corner.applyMatrix4(p.mesh.matrixWorld).project(v.camera);
          maxNdc = Math.max(maxNdc, Math.abs(corner.x), Math.abs(corner.y));
        }
      }
    };
    try {
      for (const separation of [0.001, 0.25, 1, 0.5, 0]) {
        v.patch({ separation });
        await settle(v);
        snapshot(side + ' separation ' + separation);
      }
    } finally {
      v.inspectionFrame = undefined;
    }
    check(
      side + ' reassembly returns to its exact assembled view',
      same(assembled, snapshot(side + ' reassembled')),
    );
  }
  check(
    'Both separation journeys keep every displayed frame inside the viewport',
    maxNdc < 1,
    { maxNdc },
  );
  v.reset();
  await settle(v);
  v.orbit(0.3, 0.2);
  await settle(v);
  const owned = snapshot('Manual camera');
  v.patch({ separation: 0.6 });
  await settle(v);
  check(
    'Separation respects manual camera ownership',
    same(owned, snapshot('Manual separated')),
  );
  v.group(null);
  await settle(v);
  check(
    'Whole movement restores its default after manual separation',
    same(opening, snapshot('Movement after manual separation')),
  );
  v.back();
  await settle(v);
  check(
    'Back restores the previous manual camera and separation',
    same(owned, snapshot('Back')) &&
      v.state.separation === 0.6 &&
      v.cameraUserOwned,
  );
  v.reset();
  await settle(v);
  check(
    'Reset returns to the overview of the retained side',
    v.state.viewAngle === 'overview' &&
      v.state.side === owned.state.side &&
      Math.abs(
        (v.camera.position.x - v.controls.target.x) /
          Math.abs(v.camera.position.z - v.controls.target.z) -
          0.32,
      ) < 1e-8,
  );
  return { checks, views, viewport: [v.host.clientWidth, v.host.clientHeight] };
}
