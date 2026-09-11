import { Vector2 } from 'three';
import type { MovementViewer } from './MovementViewer';
import { ROOT, belongs, partLabel } from '../experience/catalog';
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
async function settle(v: MovementViewer) {
  const start = performance.now();
  do {
    await sleep(50);
  } while (
    (v.travel || v.presentationMoving || v.needsRender) &&
    performance.now() - start < 8000
  );
  if (v.travel || v.presentationMoving)
    throw new Error('UX check did not settle');
}
export async function runUxChecks(v: MovementViewer) {
  const checks: { name: string; pass: boolean; details?: unknown }[] = [];
  const canvas = v.renderer.domElement;
  const dockButtons = [
    ...document.querySelectorAll<HTMLButtonElement>('.action-dock button'),
  ];
  checks.push({
    name: 'Dock follows inspection, display, reset order in keyboard navigation',
    pass:
      dockButtons
        .map((b) => b.getAttribute('aria-label') || b.textContent?.trim())
        .join('|') ===
      'Explore|Separate|All parts|Dial & hands|Flip movement|Reset view',
  });
  checks.push({
    name: 'Dock controls retain touch targets',
    pass: dockButtons.every((b) => b.getBoundingClientRect().height >= 44),
  });
  const sample = [...v.spread.keys()].find(
    (id) => v.renderParts.get(id)?.source.definitionId === 'd_0_1_1_225',
  )!;
  const context = () => {
    const {
      part: _part,
      isolated: _isolated,
      phase: _phase,
      ...rest
    } = v.state;
    return JSON.stringify({ ...rest, spreadFocus: v.spreadFocus });
  };
  const empty = () => {
    const rect = canvas.getBoundingClientRect();
    for (const x of [-0.98, 0.98, -0.8, 0.8])
      for (const y of [-0.98, 0.98, -0.8, 0.8]) {
        v.raycaster.setFromCamera(new Vector2(x, y), v.camera);
        if (
          !v.raycaster.intersectObjects(
            [...v.renderParts.values()]
              .filter((p) => p.mesh.visible)
              .map((p) => p.mesh),
            false,
          ).length
        )
          return {
            clientX: rect.left + ((x + 1) * rect.width) / 2,
            clientY: rect.top + ((1 - y) * rect.height) / 2,
          };
      }
    throw new Error('No empty canvas point');
  };
  const event = (
    type: string,
    xy: { clientX: number; clientY: number },
    extra = {},
  ) =>
    new PointerEvent(type, {
      ...xy,
      pointerId: 101,
      isPrimary: true,
      button: 0,
      bubbles: true,
      ...extra,
    });
  const tap = () => {
    const xy = empty();
    v.pointerDown(event('pointerdown', xy));
    v.pointerUp(event('pointerup', xy));
  };
  const rects = () =>
    Object.fromEntries(
      [
        '.stage',
        '.back-button',
        '.reset-button',
        '.options-trigger',
        '.explore-button',
        '.separate-trigger',
        '.dial-trigger',
        '.all-parts-button',
        '.side-slot',
      ].map((selector) => {
        const r = document.querySelector(selector)!.getBoundingClientRect();
        return [selector, [r.x, r.y, r.width, r.height]];
      }),
    );
  v.reset();
  await settle(v);
  for (const label of [
    'Balance bridge',
    'Third wheel',
    'Setting lever',
    'Dial ring',
    'Screw',
    'Regulation support',
  ]) {
    const part = v.parts.find((p) => partLabel(p) === label)!;
    await v.select(part.id);
    await settle(v);
    const strip = document.querySelector<HTMLElement>('.focus-strip')!;
    checks.push({
      name: `${label}: selection shows only readable name and isolation action`,
      pass:
        strip.querySelector('h2')?.textContent === label &&
        strip.querySelectorAll('button').length === 1 &&
        strip.querySelector('button')?.textContent?.trim() === 'Isolate part' &&
        !strip.querySelector('.component-caption') &&
        !document.querySelector('#component-details') &&
        ![part.id, part.definitionId, part.sourceInstanceId, part.name].some(
          (id) => strip.innerText.includes(id),
        ),
    });
    strip.querySelector<HTMLButtonElement>('button')!.click();
    await settle(v);
    checks.push({
      name: `${label}: isolation remains available`,
      pass: v.state.isolated && strip.innerText.includes('Show context'),
    });
    strip.querySelector<HTMLButtonElement>('button')!.click();
    await settle(v);
  }
  v.reset();
  await settle(v);
  const baseline = rects();
  // A panel is UI state, never a camera or presentation action. Exercise the
  // actual React triggers so regressions in layout and focus restoration count.
  for (const selector of [
    '.explore-button',
    '.separate-trigger',
    '.dial-trigger',
    '.options-trigger',
  ]) {
    const trigger = document.querySelector<HTMLButtonElement>(selector)!;
    const position = v.camera.position.clone(),
      target = v.controls.target.clone();
    const state = JSON.stringify(v.state),
      history = v.history.length;
    trigger.click();
    await sleep(300);
    const panel = document.querySelector<HTMLElement>('.explorer-panel');
    const beforeClose = rects();
    checks.push({
      name: `${selector} opens without reframing, changing selection, or blocking the canvas`,
      pass:
        !!panel &&
        panel.getAttribute('aria-modal') !== 'true' &&
        !document.querySelector('[data-slot="sheet-overlay"]') &&
        JSON.stringify(beforeClose) === JSON.stringify(baseline) &&
        v.camera.position.distanceTo(position) < 1e-8 &&
        v.controls.target.distanceTo(target) < 1e-8 &&
        JSON.stringify(v.state) === state &&
        v.history.length === history,
    });
    panel
      ?.querySelector<HTMLButtonElement>('[data-slot="sheet-close"]')
      ?.click();
    await sleep(300);
    checks.push({
      name: `${selector} restores keyboard focus on close`,
      pass: document.activeElement === trigger,
    });
  }

  for (const mode of [
    'whole',
    'separated',
    'mechanism',
    'inventory',
    'inventory group',
    'dials',
  ]) {
    v.reset();
    if (mode === 'separated') v.patch({ separation: 0.65 });
    if (mode === 'mechanism') {
      v.group('regulation');
      v.patch({ reveal: 0.55, partSpread: 0.4 });
    }
    if (mode.startsWith('inventory')) {
      v.allParts();
      if (mode === 'inventory group') v.frameSpread('Twin barrels');
    }
    if (mode === 'dials') await v.showDial('central', 'central', 'lance');
    await settle(v);
    await v.select(sample);
    await settle(v);
    for (const isolated of [false, true]) {
      if (!v.state.part) {
        await v.select(sample);
        await settle(v);
      }
      v.patch({ isolated });
      v.zoom(4);
      await settle(v);
      const before = context(),
        position = v.camera.position.clone(),
        target = v.controls.target.clone(),
        up = v.camera.up.clone(),
        history = v.history.length;
      tap();
      await settle(v);
      checks.push({
        name: `Empty tap preserves ${mode}${isolated ? ' isolated' : ''} context and camera`,
        pass:
          !v.state.part &&
          !v.state.isolated &&
          !v.selectionBox.visible &&
          context() === before &&
          v.camera.position.distanceTo(position) < 1e-8 &&
          v.controls.target.distanceTo(target) < 1e-8 &&
          v.camera.up.equals(up) &&
          history === v.history.length,
      });
    }
    const measured = rects();
    checks.push({
      name: `Stable controls in ${mode}`,
      pass: JSON.stringify(measured) === JSON.stringify(baseline),
      details: measured,
    });
  }
  v.reset();
  await settle(v);
  await v.select(sample);
  await settle(v);
  v.zoom(4);
  await settle(v);
  const xy = empty();
  const sequences = [
    [
      event('pointerdown', xy),
      event('pointermove', { ...xy, clientX: xy.clientX + 24 }),
      event('pointermove', xy),
      event('pointerup', xy),
    ],
    [
      event('pointerdown', xy),
      event('pointercancel', xy),
      event('pointerup', xy),
    ],
    [
      event('pointerdown', xy),
      event('pointerdown', xy, { pointerId: 102, isPrimary: false }),
      event('pointerup', xy, { pointerId: 102, isPrimary: false }),
      event('pointerup', xy),
    ],
    ...[1, 2].map((button) => [
      event('pointerdown', xy, { button }),
      event('pointerup', xy, { button }),
    ]),
  ];
  for (const [i, sequence] of sequences.entries()) {
    for (const e of sequence) {
      if (e.type === 'pointerdown') v.pointerDown(e);
      if (e.type === 'pointermove') v.pointerMove(e);
      if (e.type === 'pointercancel') v.pointerCancel(e);
      if (e.type === 'pointerup') v.pointerUp(e);
    }
    checks.push({
      name: `Gesture rejection ${i + 1}`,
      pass: v.state.part === sample,
    });
  }
  const other = [...v.spread.keys()].find((id) => id !== sample)!;
  await v.select(other);
  await settle(v);
  checks.push({
    name: 'Object-to-object selection replaces the selected part',
    pass: v.state.part === other && !v.state.isolated,
  });
  canvas.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  await settle(v);
  checks.push({
    name: 'Canvas Escape deselects',
    pass: !v.state.part && !v.selectionBox.visible,
  });
  v.reset();
  await settle(v);
  // Delayed optional geometry must never resurrect a selection after empty-space input.
  const load = v.loadCatalog.bind(v),
    loaded = v.catalogLoaded;
  let complete!: () => void;
  v.catalogLoaded = false;
  v.loadCatalog = () =>
    new Promise<void>((resolve) => {
      complete = resolve;
    });
  const pending = v.select(
    v.parts.find((p) => !p.isAssembly && !belongs(p.id, ROOT))!.id,
  );
  tap();
  complete();
  await pending;
  v.loadCatalog = load;
  v.catalogLoaded = loaded;
  checks.push({
    name: 'Empty tap cancels pending catalog selection',
    pass: !v.state.part && !v.catalogRetry,
  });
  v.reset();
  await settle(v);
  const before = v.stats();
  await sleep(900);
  const after = v.stats();
  checks.push({
    name: 'Settled UX adds no redraws or resources',
    pass:
      before.renderCount === after.renderCount &&
      before.geometries === after.geometries &&
      before.textures === after.textures,
  });
  return checks;
}
