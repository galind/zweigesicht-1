import watch from '../../../assets/authored/watch-configurations.json' with { type: 'json' };
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
  presentation: 'movement' | 'dials'; // Derived from shared dial visibility.
  caseVisible: boolean;
  caseMaterial: string;
  centralFinish: string;
  dialsVisible: boolean;
  // Compatibility snapshots; always equal to dialsVisible.
  centralVisible: boolean;
  smallVisible: boolean;
  centralStyle: string;
  smallStyle: string;
  layout: 'assembly' | 'spread';
  inventoryBack: boolean;
  group: string | null;
  part: string | null;
  side: 'back' | 'front';
  viewAngle: 'overview' | 'face';
  separation: number;
  partSpread: number;
  reveal: number;
  isolated: boolean;
  quality: 'auto' | 'high' | 'low';
}
export const initialState: ExperienceState = {
  phase: 'loading',
  presentation: 'movement',
  caseVisible: false,
  caseMaterial: 'steel',
  centralFinish: 'blued-steel',
  dialsVisible: false,
  centralVisible: false,
  smallVisible: false,
  centralStyle: configurations.defaults.central,
  smallStyle: configurations.defaults.small,
  layout: 'assembly',
  inventoryBack: false,
  group: null,
  part: null,
  side: 'back',
  viewAngle: 'overview',
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
  const next = { ...initialState, ...previous, ...patch };
  // Discard obsolete or unknown state fields, including historical playback input.
  for (const key of Object.keys(next))
    if (!(key in initialState))
      delete (next as unknown as Record<string, unknown>)[key];
  next.inventoryBack = next.layout === 'spread' && next.inventoryBack === true;
  next.viewAngle = next.viewAngle === 'face' ? 'face' : 'overview';
  // Migrate old face-specific intent into one switch. Conflicting historical
  // preferences close both displays; a legacy single-field action toggles both.
  const legacy = ['centralVisible', 'smallVisible'] as const;
  const supplied = legacy.filter((key) => key in patch);
  next.dialsVisible =
    'dialsVisible' in patch
      ? patch.dialsVisible === true
      : supplied.length
        ? supplied.every((key) => patch[key] === true)
        : previous.centralVisible === true && previous.smallVisible === true;
  next.centralVisible = next.smallVisible = next.dialsVisible;
  next.presentation = next.dialsVisible ? 'dials' : 'movement';
  for (const face of ['central', 'small'] as const) {
    const key = face === 'central' ? 'centralStyle' : 'smallStyle';
    if (
      !configurations.faces[face].styles.some((style) => style.id === next[key])
    )
      next[key] = configurations.defaults[face];
  }
  next.caseVisible = next.caseVisible === true;
  if (
    !watch.caseMaterials.some((material) => material.id === next.caseMaterial)
  )
    next.caseMaterial = 'steel';
  const finishes =
    watch.handFinishes[next.centralStyle as keyof typeof watch.handFinishes];
  if (!finishes.includes(next.centralFinish))
    next.centralFinish = 'blued-steel';
  // Fine hands follow the selected case, including while the case is hidden.
  if (next.centralStyle === 'fine')
    next.centralFinish =
      next.caseMaterial === 'steel' ? 'blued-steel' : 'rose-gold';
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
/** Reset the view without changing the user's fitted display configuration. */
export function resetViewState(state: ExperienceState): ExperienceState {
  return resolveState(initialState, {
    phase: 'recovering',
    side: state.side,
    caseVisible: state.caseVisible,
    caseMaterial: state.caseMaterial,
    centralFinish: state.centralFinish,
    dialsVisible: state.centralVisible && state.smallVisible,
    centralStyle: state.centralStyle,
    smallStyle: state.smallStyle,
  });
}
