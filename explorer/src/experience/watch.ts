import configuration from '../../../assets/authored/watch-configurations.json';
import { fittedLeaves, validateDialPatch, type DialPreferences } from './dials';
import type { ExperienceState } from './state';
export const WATCH = configuration;
export const CASE_LEAVES = new Set(WATCH.leaves.map((p) => p.id));
export const CASE_CRYSTALS = new Set(
  WATCH.leaves.filter((p) => p.definitionId === 'd_0_1_1_67').map((p) => p.id),
);
export type WatchPreferences = DialPreferences &
  Pick<ExperienceState, 'caseVisible' | 'caseMaterial' | 'centralFinish'>;
export const WATCH_KEYS = [
  'dialsVisible',
  'centralVisible',
  'smallVisible',
  'centralStyle',
  'smallStyle',
  'caseVisible',
  'caseMaterial',
  'centralFinish',
];
export function requestedWatchLeaves(state: ExperienceState) {
  return new Set([
    ...fittedLeaves(state),
    ...(state.caseVisible ? CASE_LEAVES : []),
  ]);
}
export function caseModeVisible(state: ExperienceState) {
  return state.caseVisible && state.layout === 'assembly' && !state.group;
}
export function validateWatchPatch(
  input: unknown,
): asserts input is Partial<WatchPreferences> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Expected a watch configuration object');
  const dials: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'caseVisible') {
      if (typeof value !== 'boolean')
        throw new Error('Expected boolean case visibility');
    } else if (key === 'caseMaterial') {
      if (!WATCH.caseMaterials.some((m) => m.id === value))
        throw new Error('Unknown case material');
    } else if (key === 'centralFinish') {
      if (!['blued-steel', 'rose-gold'].includes(value as string))
        throw new Error('Unknown hand finish');
    } else dials[key] = value;
  }
  validateDialPatch(dials);
}
const casePackets = new Map(WATCH.leaves.map((p) => [p.id, p.packet]));
const caseVectors: Record<string, [number, number, number]> = {
  'front-back': [0, 0, 120],
  'front-seal': [0, 0, 110],
  'rear-back': [0, 0, -120],
  'rear-seal': [0, 0, -110],
  middle: [-55, 0, 0],
  crown: [45, 0, 0],
  'upper-lugs': [0, 40, 0],
  'lower-lugs': [0, -40, 0],
};

/** Illustrative clearing paths only. Packets keep their internal source placements. */
export function caseOffset(
  id: string,
  progress: number,
): [number, number, number] {
  const packet = casePackets.get(id);
  return (caseVectors[packet ?? ''] ?? [0, 0, 0]).map((n) => n * progress) as [
    number,
    number,
    number,
  ];
}
