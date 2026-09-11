import { inMembers, belongs, type Mechanism } from './catalog';
import { explosionHost } from './explosion';
import scope from '../../../assets/authored/explore-scope.json';

export const EXPLORE_SCOPE = scope.sections;
function section(group: Mechanism) {
  return EXPLORE_SCOPE[group.id as keyof typeof EXPLORE_SCOPE];
}

/** Explicit section scope prevents shared presentation hosts from pulling in
 * unrelated mechanisms. Source subassemblies retain all of their own leaves. */
export function focusRole(
  id: string,
  definition: string,
  group?: Mechanism,
  selection?: string | null,
) {
  if (selection && belongs(id, selection)) return 'selected';
  if (!group) return 'whole';
  if (inMembers(id, group.members)) return 'member';
  if (definition === 'd_0_1_1_195') return 'support';
  const rule = section(group);
  if (inMembers(id, rule.context)) return 'context';
  // Plate-mounted pins and jewels remain with the spatial reference.
  if (
    explosionHost(id) === 'plate' ||
    inMembers(id, rule.connected) ||
    inMembers(id, rule.covers)
  )
    return 'connected';
  return 'surrounding';
}

/** Named static cutaways, including the fasteners belonging to that cover.
 * Other covers follow their authored extraction paths before being hidden. */
export function focusCover(id: string, group?: Mechanism) {
  return !!group && inMembers(id, section(group).cutaway);
}
