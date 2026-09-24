import { CASE_LEAVES, caseOffset } from './watch';
import { DIALS, displayFace, displayHostPart } from './dials';
import handPoses from '../../../assets/authored/hand-display-poses.json';
import complete from '../../../assets/derived/complete-separation.json';
import authored from '../../../assets/authored/explosion.json';
import { GROUPS, inMembers, type Part } from './catalog';

export const EXPLOSION = authored;
export const COMPLETE_SEPARATION = complete;
export type ExplosionState = {
  separation: number;
  partSpread: number;
  reveal: number;
  group: string | null;
};
type Vec3 = [number, number, number];
const rules = new Map(authored.parts.map((p) => [p.id, p]));
const hosts = new Map(authored.hosts.map((h) => [h.id, h]));
export function stageProgress(progress: number, stage: number[]) {
  const t = Math.max(
    0,
    Math.min(1, (progress - stage[0]) / (stage[1] - stage[0])),
  );
  return t * t * (3 - 2 * t);
}
function worldDirection(part: Part, local: number[]): Vec3 {
  return [0, 1, 2].map((i) =>
    local.reduce((sum, n, j) => sum + part.worldTransform[i][j] * n, 0),
  ) as Vec3;
}
export function explosionHost(id: string) {
  return rules.get(id)?.host;
}
export function uncoverHost(id: string, group: string | null) {
  const focus = authored.mechanisms[group as keyof typeof authored.mechanisms];
  // Children inherit the cover's lift. Treat the whole lifted packet as an
  // obstruction so rear-display parts cannot float across an unrelated focus.
  let host = explosionHost(id);
  while (host) {
    if (focus?.uncover.includes(host)) return true;
    host = hosts.get(host)?.parent ?? undefined;
  }
  return false;
}
/** Illustrative outward layers, not a mechanical release sequence. Repeated
 * indices/screws retain their distinct XY seats on a shared axial layer. */
export const DISPLAY_LAYERS = Object.fromEntries(
  (['central', 'small'] as const).map((face) => {
    const root = DIALS.faces[face].rootId;
    const prefix = root + (face === 'central' ? '__0_1_1_22_' : '__0_1_1_2_');
    const structure = (
      face === 'central'
        ? [[4], [5], [1], [23, 3, 7, 8, 11, 12, 13, 15, 16, 17, 19, 20, 21]]
        : [[19], [28], [11, 17, 22], [3, 4, 6, 7, 8, 9, 10, 12, 13, 14, 15, 27]]
    ).map((layer) => layer.map((n) => prefix + n));
    const hands = (
      face === 'central' ? ['hour', 'minute', 'seconds'] : ['hour', 'minute']
    ).flatMap((role) => {
      const records = handPoses.hands.filter(
        (h) => h.face === face && h.role === role,
      );
      return [
        [...new Set(records.map((h) => h.supportLeafId))],
        records.map((h) => h.leafId),
      ];
    });
    return [face, [...structure, ...hands]];
  }),
) as Record<'central' | 'small', string[][]>;

const displayOffsetsCache = new WeakMap<Part[], Map<string, number>>();
const assemblyOffsetsCache = new WeakMap<Part[], Map<string, Vec3>>();
export function displaySeparationOffsets(parts: Part[]) {
  const cached = displayOffsetsCache.get(parts);
  if (cached) return cached;
  const byId = new Map(parts.map((p) => [p.id, p]));
  const offsets = new Map<string, number>();
  for (const face of ['central', 'small'] as const) {
    const sign = face === 'central' ? 1 : -1;
    let edge = -Infinity;
    for (const layer of DISPLAY_LAYERS[face]) {
      // Include all style variants so toggling hands cannot move the other layers.
      const bounds = layer.flatMap((id) => {
        const box = byId.get(id)?.boundsWorldMm;
        return box ? [box] : [];
      });
      if (!bounds.length) continue;
      const min = Math.min(
        ...bounds.map((b) => sign * b[sign === 1 ? 0 : 1][2]),
      );
      const max = Math.max(
        ...bounds.map((b) => sign * b[sign === 1 ? 1 : 0][2]),
      );
      const distance = Math.max(0, edge + complete.gapMm - min);
      for (const id of layer) offsets.set(id, sign * distance);
      edge = max + distance;
    }
  }
  displayOffsetsCache.set(parts, offsets);
  return offsets;
}

function assemblySeparationOffsets(parts: Part[]): Map<string, Vec3> {
  const cached = assemblyOffsetsCache.get(parts);
  if (cached) return cached;
  const displayOffsets = displaySeparationOffsets(parts);
  const ids = new Set(parts.map((p) => p.id));
  const result = new Map<string, Vec3>(
    complete.parts
      .filter((p) => ids.has(p.id))
      .map((p) => [p.id, [...p.offsetMm] as Vec3]),
  );
  const minZ = Math.min(
    ...complete.parts.map((p) => p.boundsWorldMm[0][2] + p.offsetMm[2]),
  );
  const maxZ = Math.max(
    ...complete.parts.map((p) => p.boundsWorldMm[1][2] + p.offsetMm[2]),
  );
  for (const face of ['central', 'small'] as const) {
    // Start each display outside the movement envelope, then separate its
    // individual layers along its outward axis. Fitted XY remains unchanged.
    const structure = parts.filter(
      (p) =>
        DIALS.faces[face].structureLeafIds.includes(p.id) && p.boundsWorldMm,
    );
    if (!structure.length) continue;
    const edge =
      face === 'central'
        ? Math.min(...structure.map((p) => p.boundsWorldMm![0][2]))
        : Math.max(...structure.map((p) => p.boundsWorldMm![1][2]));
    const z =
      face === 'central'
        ? maxZ + complete.gapMm - edge
        : minZ - complete.gapMm - edge;
    for (const part of parts)
      if (!part.isAssembly && displayFace(part.id) === face)
        result.set(part.id, [0, 0, z + (displayOffsets.get(part.id) ?? 0)]);
  }
  for (const id of CASE_LEAVES) result.set(id, caseOffset(id, 1));
  assemblyOffsetsCache.set(parts, result);
  return result;
}

/** One evaluator owns all assembly presentation offsets. Source matrices are read only.
 * Fitted hand poses compose underneath presentation offsets; packing owns spread offsets.
 */
export function explosionOffsets(
  parts: Part[],
  state: ExplosionState,
): Map<string, Vec3> {
  const displayOffsets = displaySeparationOffsets(parts);
  if (!state.group) {
    const progress = Math.max(0, Math.min(1, state.separation));
    return new Map(
      [...assemblySeparationOffsets(parts)].map(([id, offset]) => [
        id,
        offset.map((n) => n * progress) as Vec3,
      ]),
    );
  }
  const byId = new Map(parts.map((p) => [p.id, p]));
  const focus =
    authored.mechanisms[state.group as keyof typeof authored.mechanisms];
  const mechanism = GROUPS.find((group) => group.id === state.group);
  const activeHosts = new Set(
    authored.parts
      .filter((part) => mechanism && inMembers(part.id, mechanism.members))
      .map((part) => part.host),
  );
  const hostOffsets = new Map<string, Vec3>();
  function hostOffset(id: string, revealAncestors = true): Vec3 {
    const cacheKey = `${id}:${revealAncestors}`;
    const cached = hostOffsets.get(cacheKey);
    if (cached) return cached;
    const host = hosts.get(id)!;
    const frame = byId.get(host.frameId)!;
    const direction = worldDirection(frame, host.directionLocal);
    // A cover-only reveal must not lift a retained mechanism with its parent
    // cover. Complete separation still composes the physical parent offset.
    const parent = host.parent
      ? hostOffset(host.parent, revealAncestors && !activeHosts.has(id))
      : [0, 0, 0];
    // A focused control advances the same reviewed progression, never adds another delta.
    let distance =
      host.distanceMm * stageProgress(state.separation, host.stage);
    if (focus?.separate.includes(id)) {
      const stages = focus.separateStages as Record<string, number[]>;
      distance = Math.max(
        distance,
        host.distanceMm * stageProgress(state.partSpread, stages[id]),
      );
    }
    // Uncover follows the host's reviewed extraction axis, then removes the distant cover.
    if (revealAncestors && focus?.uncover.includes(id))
      distance = Math.max(distance, 28 * stageProgress(state.reveal, [0.2, 1]));
    const offset = direction.map((n, i) => parent[i] + n * distance) as Vec3;
    hostOffsets.set(cacheKey, offset);
    return offset;
  }
  const result = new Map<string, Vec3>();
  for (const rule of authored.parts) {
    const part = byId.get(rule.id);
    if (!part) continue;
    const offset = [...hostOffset(rule.host)] as Vec3;
    const progress = Math.max(
      state.separation,
      focus?.separate.includes(rule.host) ? state.partSpread : 0,
      focus?.uncover.includes(rule.host) ? state.reveal : 0,
    );
    if (rule.rule === 'release') {
      const direction = worldDirection(part, rule.directionLocal);
      const distance = rule.distanceMm * stageProgress(progress, rule.stage);
      for (let i = 0; i < 3; i++) offset[i] += direction[i] * distance;
    }
    result.set(rule.id, offset);
  }
  for (const part of parts) {
    const proxy = displayHostPart(part.id);
    if (!part.isAssembly && proxy !== part.id) {
      const offset = [...(result.get(proxy) ?? [0, 0, 0])] as Vec3;
      const progress = Math.max(
        state.separation,
        state.group === 'display' ? state.partSpread : 0,
      );
      offset[2] +=
        (displayOffsets.get(part.id) ?? 0) * Math.max(0, Math.min(1, progress));
      result.set(part.id, offset);
    }
  }
  return result;
}
