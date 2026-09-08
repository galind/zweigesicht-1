import authored from '../../../assets/authored/mechanisms.json';
export const ROOT = authored.movementRoot;
export const PREFIX = authored.directChildPrefix;
export const GROUPS = authored.groups;
export type Mechanism = (typeof GROUPS)[number];
export interface Part {
  id: string;
  sourceInstanceId: string;
  name: string;
  parentId: string | null;
  definitionId: string;
  isAssembly: boolean;
  worldTransform: number[][];
  boundsWorldMm: number[][] | null;
  triangles?: number;
}
export interface Manifest {
  schemaVersion: number;
  instances: Part[];
  summary: Record<string, unknown>;
  exceptions: unknown[];
}
export function belongs(id: string, parent: string) {
  return id === parent || id.startsWith(parent + '__');
}
export function inMembers(id: string, indices: number[]) {
  return indices.some((i) => belongs(id, PREFIX + i));
}
const labels: Record<string, string> = {
  d_0_1_1_110: 'Balance rim',
  d_0_1_1_111: 'Timing eccentric',
  d_0_1_1_112: 'Impulse jewel',
  d_0_1_1_113: 'Balance staff',
  d_0_1_1_114: 'Double roller',
  d_0_1_1_115: 'Hairspring collet',
  d_0_1_1_116: 'Hairspring',
  d_0_1_1_126: 'Pallet fork',
  d_0_1_1_127: 'Pallet staff',
  d_0_1_1_233: 'Escape wheel',
  d_0_1_1_234: 'Escape pinion',
  d_0_1_1_242: 'Seconds pinion',
  d_0_1_1_243: 'Seconds wheel',
  d_0_1_1_237: 'Third-wheel pinion',
  d_0_1_1_238: 'Third wheel',
  d_0_1_1_93: 'Minute pinion',
  d_0_1_1_94: 'Minute wheel',
  d_0_1_1_225: 'Diamond (empty source)',
};
export function partLabel(p: Part) {
  return (
    labels[p.definitionId] ||
    p.name
      .replace(/^ml01 /, '')
      .replace(
        / montiert.*$| vernietet$| verpresst$| verstiftet versteint$| verstiftet$| versteint$/,
        '',
      )
  );
}
export function category(p: Part) {
  if (p.id === PREFIX + '66')
    return 'Alternate setting spring · hidden in assembled view';
  if (p.definitionId === 'd_0_1_1_225')
    return 'Empty source geometry · no mesh';
  if (!belongs(p.id, ROOT))
    return 'Case, display variant or source support · loaded on demand';
  return p.isAssembly ? 'Source subassembly' : 'Movement component';
}
