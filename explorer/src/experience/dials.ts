import configurations from '../../../assets/authored/dial-configurations.json';
import type { ExperienceState } from './state';
export const DIALS = configurations;
export type DialFace = 'central' | 'small';
export type DialView = 'movement' | DialFace;
export type DialPreferences = Pick<
  ExperienceState,
  | 'dialsVisible'
  | 'centralVisible'
  | 'smallVisible'
  | 'centralStyle'
  | 'smallStyle'
>;
export function fittedLeaves(state: DialPreferences): Set<string> {
  const leaves = new Set<string>();
  if (!state.centralVisible || !state.smallVisible) return leaves;
  for (const face of ['central', 'small'] as const) {
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

/** Validate API input before any controller state or history is changed. */
export function validateDialPatch(
  input: unknown,
): asserts input is Partial<DialPreferences> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Expected a dial configuration object');
  for (const [key, value] of Object.entries(input)) {
    if (['dialsVisible', 'centralVisible', 'smallVisible'].includes(key)) {
      if (typeof value !== 'boolean')
        throw new Error('Expected boolean visibility');
    } else if (key === 'centralStyle' || key === 'smallStyle') {
      const face = key === 'centralStyle' ? 'central' : 'small';
      if (!DIALS.faces[face].styles.some((style) => style.id === value))
        throw new Error('Unknown hand style');
    } else throw new Error('Unknown dial setting');
  }
  const values = input as Partial<DialPreferences>;
  const visibility = [
    values.dialsVisible,
    values.centralVisible,
    values.smallVisible,
  ].filter((value) => value !== undefined);
  if (new Set(visibility).size > 1)
    throw new Error('Both dials share one visibility setting');
}
