import authored from '../../../assets/authored/explosion.json';
import type { Part } from './catalog';

export const EXPLOSION = authored;
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
  return !!focus?.uncover.includes(explosionHost(id) ?? '');
}
/** One evaluator owns all assembly presentation offsets. Source matrices are read only.
 * Inventory packing and fitted hand poses have separate, mutually exclusive ownership.
 */
export function explosionOffsets(
  parts: Part[],
  state: ExplosionState,
): Map<string, Vec3> {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const focus =
    authored.mechanisms[state.group as keyof typeof authored.mechanisms];
  const hostOffsets = new Map<string, Vec3>();
  function hostOffset(id: string): Vec3 {
    const cached = hostOffsets.get(id);
    if (cached) return cached;
    const host = hosts.get(id)!;
    const frame = byId.get(host.frameId)!;
    const direction = worldDirection(frame, host.directionLocal);
    const parent = host.parent ? hostOffset(host.parent) : [0, 0, 0];
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
    if (focus?.uncover.includes(id))
      distance = Math.max(distance, 28 * stageProgress(state.reveal, [0.2, 1]));
    const offset = direction.map((n, i) => parent[i] + n * distance) as Vec3;
    hostOffsets.set(id, offset);
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
  return result;
}
