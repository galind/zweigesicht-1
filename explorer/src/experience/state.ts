import configurations from '../../../assets/authored/dial-configurations.json' with { type: 'json' };
export type Phase =
  | 'loading'
  | 'whole'
  | 'revealing'
  | 'mechanism'
  | 'part'
  | 'recovering';
export interface ExperienceState {
  phase: Phase;
  presentation: 'movement' | 'dials'; // Derived summary; visibility belongs to each face.
  centralVisible: boolean;
  smallVisible: boolean;
  centralStyle: string;
  smallStyle: string;
  layout: 'assembly' | 'spread';
  group: string | null;
  part: string | null;
  side: 'back' | 'front';
  separation: number;
  partSpread: number;
  reveal: number;
  isolated: boolean;
  quality: 'auto' | 'high' | 'low';
}
export const initialState: ExperienceState = {
  phase: 'loading',
  presentation: 'movement',
  centralVisible: false,
  smallVisible: false,
  centralStyle: configurations.defaults.central,
  smallStyle: configurations.defaults.small,
  layout: 'assembly',
  group: null,
  part: null,
  side: 'back',
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
  next.centralVisible = next.centralVisible === true;
  next.smallVisible = next.smallVisible === true;
  next.presentation =
    next.centralVisible || next.smallVisible ? 'dials' : 'movement';
  for (const face of ['central', 'small'] as const) {
    const key = face === 'central' ? 'centralStyle' : 'smallStyle';
    if (
      !configurations.faces[face].styles.some((style) => style.id === next[key])
    )
      next[key] = configurations.defaults[face];
  }
  next.separation = clamp(next.separation);
  next.partSpread = clamp(next.partSpread);
  next.reveal = clamp(next.reveal);
  if (next.layout === 'spread') {
    next.group = null;
    next.separation = 0;
    next.partSpread = 0;
    next.reveal = 0;
  }
  if (!next.part) next.isolated = false;
  return next;
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

/** Reset the view without changing the user's fitted display configuration. */
export function resetViewState(state: ExperienceState): ExperienceState {
  return resolveState(initialState, {
    phase: 'recovering',
    side: state.side,
    centralVisible: state.centralVisible,
    smallVisible: state.smallVisible,
    centralStyle: state.centralStyle,
    smallStyle: state.smallStyle,
  });
}
