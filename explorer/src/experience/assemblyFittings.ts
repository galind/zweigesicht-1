import fittings from '../../../assets/authored/assembly-fittings.json' with { type: 'json' };

export const CASE_MOUNTS = new Set(fittings.caseMounts);
export const DIAL_RETAINERS = new Set(fittings.dialRetainers);

/** Configuration membership, independent of geometry, pose, finish and view. */
export function assemblyFittingPresent(
  id: string,
  context: { casePresent: boolean; centralDialPresent: boolean },
) {
  if (CASE_MOUNTS.has(id)) return context.casePresent;
  if (DIAL_RETAINERS.has(id)) return context.centralDialPresent;
  return true;
}
