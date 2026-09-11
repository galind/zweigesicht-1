import * as THREE from 'three';
import { ROOT, PREFIX, GROUPS, belongs, inMembers, type Part } from './catalog';

/** Case-mounting fittings and the incompatible alternate setting spring.
 * These remain in the accepted assembly and/or optional source catalog. */
export const SPREAD_EXCLUSIONS = [38, 39, 41, 43, 44, 45, 66].map(
  (n) => PREFIX + n,
);
export function spreadMember(p: Part) {
  return (
    !p.isAssembly && belongs(p.id, ROOT) && !SPREAD_EXCLUSIONS.includes(p.id)
  );
}
export type SpreadInput = {
  source: Part;
  mesh: THREE.Mesh;
  assembled: THREE.Matrix4;
  center: THREE.Vector3;
};
export type SpreadPlacement = {
  offset: THREE.Vector3;
  rotation: THREE.Quaternion;
  bounds: THREE.Box3;
  group: string;
};
export const SPREAD_GROUPS = [
  ...GROUPS.map((g) => g.technical),
  'Plates & bridges',
  'Small fittings',
];
/** Layout is evaluated from actual immutable geometry in source millimetres.
 * Pack whole projected bounding boxes; never use manifest triangle/size filters. */
export function makeSpread(
  parts: Iterable<SpreadInput>,
  aspect = 2,
  fitted = new Set<string>(),
) {
  const entries = [...parts]
    .filter((p) => spreadMember(p.source) || fitted.has(p.source.id))
    .sort((a, b) => a.source.id.localeCompare(b.source.id));
  const blocks = SPREAD_GROUPS.map(
    () =>
      [] as {
        p: SpreadInput;
        rotation: THREE.Quaternion;
        bounds: THREE.Box3;
        w: number;
        h: number;
        x: number;
        y: number;
      }[],
  );
  for (const p of entries) {
    p.mesh.geometry.computeBoundingBox();
    const sourceBox = p.mesh.geometry
      .boundingBox!.clone()
      .applyMatrix4(p.assembled);
    const size = sourceBox.getSize(new THREE.Vector3());
    const rotation = new THREE.Quaternion();
    // Lay long axial parts across the inspection plane; retain original form/scale.
    if (size.z > Math.max(size.x, size.y))
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    else if (size.y < Math.min(size.x, size.z))
      rotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    else if (size.x < Math.min(size.y, size.z))
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    rotation.premultiply(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.13, -0.1, 0)),
    );
    const matrix = new THREE.Matrix4()
      .makeRotationFromQuaternion(rotation)
      .multiply(
        new THREE.Matrix4().makeTranslation(
          -p.center.x,
          -p.center.y,
          -p.center.z,
        ),
      )
      .multiply(p.assembled);
    const bounds = p.mesh.geometry.boundingBox!.clone().applyMatrix4(matrix);
    const extent = bounds.getSize(new THREE.Vector3());
    const mechanism = GROUPS.findIndex((g) =>
      inMembers(p.source.id, g.members),
    );
    const hardware = /^(010|020)|schraube|stift|stein|scheibe/i.test(
      p.source.name,
    );
    const group = fitted.has(p.source.id)
      ? GROUPS.findIndex((g) => g.id === 'display')
      : mechanism >= 0
        ? mechanism
        : hardware
          ? 7
          : 6;
    blocks[group].push({
      p,
      rotation,
      bounds,
      w: extent.x * 1.16 + 1.6,
      h: extent.y * 1.16 + 1.6,
      x: 0,
      y: 0,
    });
  }
  const dimensions = blocks.map((block) => {
    block.sort(
      (a, b) => b.h - a.h || a.p.source.id.localeCompare(b.p.source.id),
    );
    const width = Math.max(
      22,
      ...block.map((e) => e.w),
      Math.sqrt(block.reduce((s, e) => s + e.w * e.h, 0)) * 1.7,
    );
    let x = 0,
      y = 0,
      row = 0,
      used = 0;
    for (const e of block) {
      if (x && x + e.w > width) {
        y += row;
        x = 0;
        row = 0;
      }
      e.x = x + e.w / 2;
      e.y = y + e.h / 2;
      x += e.w;
      row = Math.max(row, e.h);
      used = Math.max(used, x);
    }
    return { w: used, h: y + row };
  });
  const candidates = (aspect < 1 ? [1, 2, 3] : [3]).map((columns) => {
    const columnWidths = Array.from({ length: columns }, (_, c) =>
      Math.max(
        ...dimensions.filter((_, i) => i % columns === c).map((d) => d.w),
      ),
    );
    const rowHeights = Array.from(
      { length: Math.ceil(blocks.length / columns) },
      (_, r) =>
        Math.max(
          ...dimensions
            .filter((_, i) => Math.floor(i / columns) === r)
            .map((d) => d.h),
        ),
    );
    const totalW = columnWidths.reduce((a, b) => a + b, 0) + (columns - 1) * 6;
    const totalH =
      rowHeights.reduce((a, b) => a + b, 0) + (rowHeights.length - 1) * 6;
    return {
      columns,
      columnWidths,
      rowHeights,
      totalW,
      totalH,
      fit: Math.min(aspect / totalW, 1 / totalH),
    };
  });
  // Preserve the desktop grouping; on portrait screens choose the arrangement
  // that gives every source-scale component the largest shared inspection scale.
  candidates.sort((a, b) => b.fit - a.fit || a.columns - b.columns);
  const { columns, columnWidths, rowHeights, totalW, totalH } = candidates[0];
  const placements = new Map<string, SpreadPlacement>();
  blocks.forEach((block, i) => {
    const col = i % columns,
      row = Math.floor(i / columns),
      x =
        columnWidths.slice(0, col).reduce((a, b) => a + b + 6, 0) - totalW / 2,
      y = rowHeights.slice(0, row).reduce((a, b) => a + b + 6, 0) - totalH / 2;
    for (const e of block) {
      const center = e.bounds.getCenter(new THREE.Vector3());
      const destination = new THREE.Vector3(x + e.x, y + e.y, 0).sub(center);
      const bounds = e.bounds.clone().translate(destination);
      placements.set(e.p.source.id, {
        offset: destination.clone().sub(e.p.center),
        rotation: e.rotation,
        bounds,
        group: SPREAD_GROUPS[i],
      });
    }
  });
  return placements;
}
