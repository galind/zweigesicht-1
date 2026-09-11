import { belongs, inMembers, PREFIX, type Mechanism } from './catalog';
import { EXPLOSION, explosionHost } from './explosion';

/** Context follows the authored rigid packets, not just the top-level CAD tree. */
export function focusRole(
  id: string,
  definition: string,
  group?: Mechanism,
  selection?: string | null,
) {
  if (selection && belongs(id, selection)) return 'selected';
  if (!group) return 'whole';
  if (inMembers(id, group.members)) return 'member';
  // The large plate is a spatial reference. Its pressed jewels still provide
  // readable bearing locations and keep their contextual treatment.
  if (definition === 'd_0_1_1_195') return 'support';
  if (inMembers(id, group.context)) return 'context';
  const host = explosionHost(id);
  if (
    host &&
    EXPLOSION.parts.some(
      (part) => part.host === host && inMembers(part.id, group.members),
    )
  )
    return 'connected';
  return 'surrounding';
}

/** The balance bridge belongs to the regulator packet but covers its spring.
 * Uncover may hide that named bridge without moving the spring anchorage.
 * This is a presentation cutaway, not a disassembly instruction. */
export function focusCover(id: string, group?: Mechanism) {
  return (
    group?.id === 'regulation' &&
    [59, 34, 35].some((index) => belongs(id, PREFIX + index))
  );
}
