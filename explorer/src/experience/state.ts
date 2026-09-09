export type Treatment = 'finish' | 'function';
export type Phase =
  | 'loading'
  | 'whole'
  | 'revealing'
  | 'mechanism'
  | 'part'
  | 'recovering';
export interface ExperienceState {
  phase: Phase;
  group: string | null;
  part: string | null;
  side: 'back' | 'front';
  treatment: Treatment;
  separation: number;
  partSpread: number;
  reveal: number;
  isolated: boolean;
  quality: 'auto' | 'high' | 'low';
}
export const initialState: ExperienceState = {
  phase: 'loading',
  group: null,
  part: null,
  side: 'back',
  treatment: 'finish',
  separation: 0,
  partSpread: 0,
  reveal: 0,
  isolated: false,
  quality: 'auto',
};
const clamp = (x: number) =>
  Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0;
export function resolveState(
  previous: ExperienceState,
  patch: Partial<ExperienceState>,
): ExperienceState {
  const next = { ...previous, ...patch };
  // Discard obsolete or unknown state fields, including historical playback input.
  for (const key of Object.keys(next))
    if (!(key in initialState))
      delete (next as unknown as Record<string, unknown>)[key];
  next.separation = clamp(next.separation);
  next.partSpread = clamp(next.partSpread);
  next.reveal = clamp(next.reveal);
  if (!next.part) next.isolated = false;
  return next;
}
/** Stable presentation offsets are evaluated in source world millimetres. */
export function layerOffset(z: number, progress: number): number {
  return (z + 2.8) * clamp(progress) * 4;
}
export function damp(
  current: number,
  target: number,
  seconds: number,
  reduced = false,
) {
  return reduced
    ? target
    : current + (target - current) * (1 - Math.exp(-Math.max(0, seconds) * 7));
}
