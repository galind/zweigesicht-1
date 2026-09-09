import authored from '../../../assets/authored/mechanisms.json';
import readable from '../../../assets/authored/component-labels.json';
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
  d_0_1_1_93: 'Center-wheel pinion',
  d_0_1_1_94: 'Center wheel',
  d_0_1_1_225: 'Diamond',
};
// Readable identities follow source names; untranslated ambiguity stays explicit.
const sourceLabels: [RegExp, string][] = [
  [/Gehäuse/, 'Case assembly'],
  [/Werk montiert/, 'Movement assembly'],
  [/Gruppe Zifferblatt|Zifferblatt Front/, 'Dial assembly'],
  [/Anker montiert/, 'Pallet assembly'],
  [/Unruh montiert/, 'Balance assembly'],
  [/^010-/, 'Screw'],
  [/^020-/, 'Pin'],
  [/^030-/, 'Jewel'],
  [/Federhaustrommel/, 'Barrel drum'],
  [/Federhausdeckel/, 'Barrel cover'],
  [/Federkern/, 'Barrel arbor'],
  [/Zugfeder/, 'Mainspring'],
  [/Federhausbrücke/, 'Barrel bridge'],
  [/Grundplatine/, 'Main plate'],
  [/Räderbrücke/, 'Train bridge'],
  [/Unruhbrücke/, 'Balance bridge'],
  [/Ankerbrücke/, 'Pallet bridge'],
  [/Diamantchaton/, 'Diamond setting'],
  [/Chaton/, 'Jewel setting'],
  [/DPL/, 'Cap plate'],
  [/Aufzugwelle/, 'Winding stem'],
  [/Aufzugsbrücke/, 'Winding bridge'],
  [/Kupplungstrieb/, 'Sliding coupling'],
  [/Kupplungshebel/, 'Coupling lever'],
  [/Kupplungsrad/, 'Coupling wheel'],
  [/Winkelhebelfeder/, 'Setting-lever spring'],
  [/Winkelhebel/, 'Setting lever'],
  [/Sperrfeder/, 'Click spring'],
  [/Sperrklinke/, 'Click'],
  [/Sperrrad/, 'Ratchet wheel'],
  [/Kronradplatte/, 'Crown-wheel plate'],
  [/Kronrad/, 'Crown wheel'],
  [/Stoppfedersäule/, 'Stop-spring pillar'],
  [/Stoppfederplatte/, 'Stop-spring plate'],
  [/Stoppfeder/, 'Stop spring'],
  [/Werkhaltelasche/, 'Case-mounting clamp'],
  [/Zeigerstellungsfeder/, 'Hand-setting spring'],
  [/Zeigerstellhebel/, 'Hand-setting lever'],
  [/Zeigerstellrad/, 'Hand-setting wheel'],
  [/Zeigerwerksbrücke/, 'Motion-works bridge'],
  [/Zeigerwerkswelle/, 'Motion-works arbor'],
  [/Stundenrad/, 'Hour wheel'],
  [/Minutenbrücke/, 'Center-wheel bridge'],
  [/Viertelrohr/, 'Cannon pinion'],
  [/Wechselrad/, 'Motion-works wheel'],
  [/Wechseltrieb/, 'Motion-works pinion'],
  [/ÜFHMinRad/, 'Barrel-to-center wheel'],
  [/Sekundenwellenlager/, 'Seconds-arbor bearing'],
  [/Butzen/, 'Wheel hub'],
  [/Klötzchen/, 'Hairspring stud'],
  [/Ankerhörnchen/, 'Pallet horns'],
  [/Messer/, 'Escapement safety component'],
  [/si GabelX/, 'Shock-indicator fork · X'],
  [/si GabelY/, 'Shock-indicator fork · Y'],
  [/si Rückstellfeder/, 'Indicator return spring'],
  [/si Grundplatte/, 'Indicator base plate'],
  [/si Anschlagrahmen/, 'Indicator stop frame'],
  [/si /, 'Shock-indicator component'],
  [/Min_Zeiger/, 'Minute hand'],
  [/St_Zeiger/, 'Hour hand'],
  [/Sek_Zeiger/, 'Seconds hand'],
  [/Zeigerbuchse/, 'Hand bushing'],
  [/Saphirglas/, 'Sapphire crystal'],
  [/Glasdichtung|Dring/, 'Gasket'],
  [/Lederband/, 'Leather strap'],
  [/ZB /, 'Dial component'],
  [/Krone/, 'Crown component'],
  [/incabloc/, 'Shock-protection component'],
];
export function partLabel(p: Part) {
  const exact = (readable.definitions as Record<string, string>)[
    p.definitionId.replace('d_0_1_1_', '')
  ];
  const label =
    exact ||
    labels[p.definitionId] ||
    sourceLabels.find(([pattern]) => pattern.test(p.name))?.[1] ||
    (p.isAssembly ? 'Source assembly' : 'Source component');
  return p.isAssembly && !/assembly|assemblies/i.test(label)
    ? `${label} assembly`
    : label;
}

const normalizeSearch = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[–—-]/g, ' ');
export function buildPartIndex(parts: Part[]) {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const suffixCounts = new Map<string, number>();
  for (const p of parts) {
    const segments = p.sourceInstanceId.split('/');
    for (let length = 1; length <= segments.length; length++) {
      const suffix = segments.slice(-length).join('/');
      suffixCounts.set(suffix, (suffixCounts.get(suffix) ?? 0) + 1);
    }
  }
  return new Map(
    parts.map((p) => {
      const ancestry: Part[] = [];
      let parent = p.parentId ? byId.get(p.parentId) : undefined;
      while (parent && !ancestry.includes(parent)) {
        ancestry.push(parent);
        parent = parent.parentId ? byId.get(parent.parentId) : undefined;
      }
      const segments = p.sourceInstanceId.split('/');
      let length = 1;
      while (
        length < segments.length &&
        (suffixCounts.get(segments.slice(-length).join('/')) ?? 0) > 1
      )
        length++;
      const reference = segments.slice(-length).join('/');
      return [
        p.id,
        {
          reference,
          context: ancestry[0] ? partLabel(ancestry[0]) : 'Complete source',
          search: normalizeSearch(
            [
              partLabel(p),
              p.name,
              p.id,
              p.sourceInstanceId,
              p.definitionId,
              ...ancestry.flatMap((a) => [partLabel(a), a.name]),
            ].join(' '),
          ),
        },
      ] as const;
    }),
  );
}
export function matchesPart(search: string, query: string) {
  return normalizeSearch(query)
    .trim()
    .split(/\s+/)
    .every((term) => search.includes(term));
}
export function category(p: Part) {
  if (p.id === PREFIX + '66')
    return 'Alternate setting spring · hidden in assembled view';
  if (p.definitionId === 'd_0_1_1_225')
    return 'Maker component STL · assembly STEP is empty';
  if (!belongs(p.id, ROOT))
    return 'Case, display variant or source support · loaded on demand';
  return p.isAssembly ? 'Source subassembly' : 'Movement component';
}
