import configurations from '../../../assets/authored/dial-configurations.json';
import type { ExperienceState } from './state';
export const DIALS = configurations;
export type DialFace = 'central' | 'small';
export type DialView = 'movement' | DialFace;
export function dialView(state: ExperienceState): DialView {
  return state.presentation === 'movement'
    ? 'movement'
    : state.side === 'front'
      ? 'central'
      : 'small';
}
export function fittedLeaves(state: ExperienceState): Set<string> {
  if (state.presentation !== 'dials') return new Set();
  return new Set(
    (['central', 'small'] as const).flatMap((face) => {
      const config = DIALS.faces[face];
      const id = face === 'central' ? state.centralStyle : state.smallStyle;
      const style = config.styles.find((s) => s.id === id) ?? config.styles[0];
      return [...config.structureLeafIds, ...style.leafIds];
    }),
  );
}
