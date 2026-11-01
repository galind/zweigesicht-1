/** The sole Workshop lesson: Marco's Tabelle1 rows 5–19. */
export type Side = 'movement' | 'dial';
export type Tool = 'hands' | 'tweezers' | 'screwdriver';
export type Destination =
  | 'work'
  | 'movement'
  | 'stem'
  | 'movement-rest'
  | 'stem-rest';
export type Item =
  | 'support-movement'
  | 'support-dial'
  | 'mainplate'
  | 'setting-screw'
  | 'setting-lever'
  | 'stem'
  | 'wheel'
  | 'coupling'
  | 'bridge'
  | 'bridge-screw-1'
  | 'bridge-screw-2'
  | 'movement'
  | 'stem-assembly';
export const PREFIX = 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_';
const plate = PREFIX + '54__0_1_1_194_';
export const PARTS = {
  mainplate: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14].map((n) => plate + n),
  'setting-screw': [PREFIX + '33'],
  'setting-lever': [1, 2].map((n) => PREFIX + '70__0_1_1_247_' + n),
  stem: [PREFIX + '27'],
  wheel: [PREFIX + '5'],
  coupling: [PREFIX + '28'],
  bridge: [1, 2, 3].map((n) => PREFIX + '64__0_1_1_239_' + n),
  'bridge-screw-1': [PREFIX + '73'],
  'bridge-screw-2': [PREFIX + '79'],
} satisfies Partial<Record<Item, string[]>>;
export type PartItem = keyof typeof PARTS;
export const DEFERRED_FOUNDATION = [
  plate + '11',
  plate + '12',
  ...[1, 2, 3, 4, 5].map((n) => plate + '13__0_1_1_202_' + n),
];
export const LABELS: Record<Item, string> = {
  'support-movement': 'Movement-side support',
  'support-dial': 'Dial-side support',
  mainplate: 'Prepared mainplate',
  'setting-screw': 'Setting-lever screw',
  'setting-lever': 'Pinned setting lever',
  stem: 'Winding stem',
  wheel: 'Coupling wheel',
  coupling: 'Sliding coupling',
  bridge: 'Pinned winding bridge',
  'bridge-screw-1': 'Winding-bridge screw 1',
  'bridge-screw-2': 'Winding-bridge screw 2',
  movement: 'Movement assembly',
  'stem-assembly': 'Stem assembly',
};
export interface Operation {
  id: string;
  row: number;
  label: string;
  item: Item;
  kind: 'place' | 'flip' | 'aside' | 'return' | 'insert';
  destination: Destination;
  side: Side;
  support: Side | null;
  tool: Tool;
  toolProvisional: true;
  adds: readonly string[];
}
const op = (
  row: number,
  label: string,
  item: Item,
  kind: Operation['kind'],
  destination: Destination,
  side: Side,
  support: Side | null,
  tool: Tool,
  adds: readonly string[] = [],
): Operation => ({
  id: `chapter-1:${row}`,
  row,
  label,
  item,
  kind,
  destination,
  side,
  support,
  tool,
  toolProvisional: true,
  adds,
});
export const OPERATIONS: readonly Operation[] = [
  op(
    5,
    'Place the movement-side support in the centre',
    'support-movement',
    'place',
    'work',
    'movement',
    'movement',
    'hands',
  ),
  op(
    6,
    'Place the mainplate, movement side upward',
    'mainplate',
    'place',
    'work',
    'movement',
    'movement',
    'hands',
    PARTS.mainplate,
  ),
  op(
    7,
    'Fit the setting-lever screw',
    'setting-screw',
    'place',
    'movement',
    'movement',
    'movement',
    'screwdriver',
    PARTS['setting-screw'],
  ),
  op(
    8,
    'Turn to the dial side and exchange supports',
    'movement',
    'flip',
    'work',
    'dial',
    'dial',
    'hands',
  ),
  op(
    9,
    'Fit the setting lever',
    'setting-lever',
    'place',
    'movement',
    'dial',
    'dial',
    'tweezers',
    PARTS['setting-lever'],
  ),
  op(
    10,
    'Set the supported movement aside on the left',
    'movement',
    'aside',
    'movement-rest',
    'dial',
    'dial',
    'hands',
  ),
  op(
    11,
    'Place the winding stem in the working area',
    'stem',
    'place',
    'work',
    'movement',
    null,
    'tweezers',
    PARTS.stem,
  ),
  op(
    12,
    'Fit the coupling wheel to the stem',
    'wheel',
    'place',
    'stem',
    'movement',
    null,
    'tweezers',
    PARTS.wheel,
  ),
  op(
    13,
    'Fit the sliding coupling to the stem',
    'coupling',
    'place',
    'stem',
    'movement',
    null,
    'tweezers',
    PARTS.coupling,
  ),
  op(
    14,
    'Set the completed stem assembly aside on the right',
    'stem-assembly',
    'aside',
    'stem-rest',
    'movement',
    null,
    'tweezers',
  ),
  op(
    15,
    'Return the movement, movement side upward',
    'movement',
    'return',
    'work',
    'movement',
    'movement',
    'hands',
  ),
  op(
    16,
    'Fit the stem assembly into the movement',
    'stem-assembly',
    'insert',
    'movement',
    'movement',
    'movement',
    'tweezers',
  ),
  op(
    17,
    'Fit the winding bridge',
    'bridge',
    'place',
    'movement',
    'movement',
    'movement',
    'tweezers',
    PARTS.bridge,
  ),
  op(
    18,
    'Fit the first winding-bridge screw',
    'bridge-screw-1',
    'place',
    'movement',
    'movement',
    'movement',
    'screwdriver',
    PARTS['bridge-screw-1'],
  ),
  op(
    19,
    'Fit the second winding-bridge screw',
    'bridge-screw-2',
    'place',
    'movement',
    'movement',
    'movement',
    'screwdriver',
    PARTS['bridge-screw-2'],
  ),
];
export const LESSON = {
  version: 'watchmaker-chapter-1:v1',
  placementRadiusMm: 5,
  correctPoints: 10,
  incorrectPoints: -2,
  operations: OPERATIONS,
};
export const LEAF_IDS = Object.values(PARTS).flat();

/** Transfers never add occurrences. The foundation is not automatically installed. */
export function componentIds(cursor: number) {
  return OPERATIONS.slice(0, cursor).flatMap((operation) => operation.adds);
}
export function arrangement(cursor: number) {
  return {
    side: (cursor >= 4 && cursor < 11 ? 'dial' : 'movement') as Side,
    movement:
      cursor < 2 ? 'tray' : cursor >= 6 && cursor < 11 ? 'aside' : 'work',
    stem:
      cursor < 7
        ? 'tray'
        : cursor < 10
          ? 'work'
          : cursor < 12
            ? 'aside'
            : 'inserted',
    supportPlaced: cursor >= 1,
  };
}

/** Selectable inventory is based on physical ownership, never the next legal action. */
export function availableItems(cursor: number): Item[] {
  const owned = new Set(componentIds(cursor));
  const loose = (Object.keys(PARTS) as PartItem[]).filter(
    (item) => !PARTS[item].every((id) => owned.has(id)),
  );
  return [
    ...loose,
    ...(cursor >= 2 ? ['movement' as const] : []),
    ...(cursor >= 7 && cursor < 12 ? ['stem-assembly' as const] : []),
    'support-movement',
    'support-dial',
  ];
}
