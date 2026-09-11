import configurations from '../../../assets/authored/dial-configurations.json';
import type { ExperienceState } from './state';
export const DIALS = configurations;
export type DialFace = 'central' | 'small';
export type DialView = 'movement' | DialFace;
export type DialPreferences = Pick<
  ExperienceState,
  'centralVisible' | 'smallVisible' | 'centralStyle' | 'smallStyle'
>;
export function fittedLeaves(state: DialPreferences): Set<string> {
  const leaves = new Set<string>();
  for (const face of ['central', 'small'] as const) {
    if (!state[face === 'central' ? 'centralVisible' : 'smallVisible'])
      continue;
    const config = DIALS.faces[face];
    const id = state[face === 'central' ? 'centralStyle' : 'smallStyle'];
    const style = config.styles.find((s) => s.id === id) ?? config.styles[0];
    for (const leaf of [...config.structureLeafIds, ...style.leafIds])
      leaves.add(leaf);
  }
  return leaves;
}

// Reviewed presentation hosts; source identities and geometry remain external.
const movementPrefix = 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_';
export function displayFace(id: string): DialFace | undefined {
  return (['central', 'small'] as const).find((face) =>
    id.startsWith(DIALS.faces[face].rootId + '__'),
  );
}
export function displayHostPart(id: string): string {
  const face = displayFace(id);
  return face === 'central'
    ? movementPrefix + '20'
    : face === 'small'
      ? movementPrefix + '37__0_1_1_182_1'
      : id;
}
