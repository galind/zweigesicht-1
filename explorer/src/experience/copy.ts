import { partLabel, type Part } from './catalog';
const maker = 'https://www.marcolangwatches.com/en/watches/';
const cad = 'https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/';
const facts: Record<string, string[]> = {
  regulation: [
    '3 Hz balance frequency',
    'Breguet hairspring',
    'Eccentric regulation',
  ],
  energy: ['Two barrels in series', '70 h movement power reserve'],
  transmission: [
    'Center wheel · 64 teeth',
    'Third wheel · 75 teeth',
    'Seconds wheel · 81 teeth',
  ],
  display: [
    'Face I · hours, minutes, central seconds',
    'Face II · hours and minutes',
  ],
  winding: ['Seconds-stop function', 'Winding stem & sliding coupling'],
  shock: [
    'Four directions · X/Y',
    'Resettable indication',
    'Optional mechanism',
  ],
};
export function factsFor(id: string) {
  return (facts[id] || []).map((text, i) => ({
    text,
    url: id === 'transmission' || (id === 'winding' && i === 1) ? cad : maker,
    attribution:
      id === 'transmission'
        ? 'Measured from source CAD'
        : id === 'winding' && i === 1
          ? 'Source component names'
          : 'Marco Lang · ml–01',
  }));
}
const roles: Record<string, string> = {
  '110': 'The rim of the regulating balance.',
  '112': 'The impulse jewel couples the balance to the lever.',
  '113': 'The balance staff carries the regulating assembly.',
  '114': 'The roller belongs to the balance and escapement assembly.',
  '116': 'The hairspring belongs to the regulating balance.',
  '126': 'The lever between the escape wheel and balance.',
  '233': 'The escape wheel at the end of the going train.',
  '243': 'The seconds wheel in the going train.',
  '238': 'The third wheel in the going train.',
  '94': 'The center wheel in the going train.',
  '225': 'Diamond endstone in the balance setting.',
  '84': 'One of the movement’s two series-connected mainspring barrels.',
  '89': 'One of the movement’s two series-connected mainspring barrels.',
  '145':
    'The optional assembly records impacts in four directions and can be reset.',
  '202':
    'Balance shock protection, separate from the optional impact indicator.',
};
export function partDetail(p: Part) {
  const exact = roles[p.definitionId.replace('d_0_1_1_', '')];
  if (exact) return exact;
  if (p.definitionId === 'd_0_1_1_256')
    return 'A support included with the regulating components; its precise role and intended visibility are still unresolved.';
  const label = partLabel(p);
  // Explain only the role supported by the readable identity. Never substitute
  // an import address or an unreviewed mechanical claim for missing copy.
  const families: [RegExp, string][] = [
    [/Balance bridge/i, 'Supports the balance assembly above the main plate, holding its upper bearing in position.'],
    [/bridge/i, 'Supports and locates the components beneath it within the movement.'],
    [/Setting lever/i, 'Part of the mechanism that switches between winding the watch and setting the hands.'],
    [/Winding stem/i, 'Connects the crown to the winding and hand-setting mechanism.'],
    [/Sliding coupling|Coupling lever|Coupling wheel/i, 'Part of the coupling that selects the winding or hand-setting connection.'],
    [/Hand-setting/i, 'Part of the mechanism that transfers crown input to the hands during time setting.'],
    [/wheel|pinion/i, 'Part of a geared connection that transfers rotation through the watch.'],
    [/Dial|index|marker|GMT ring/i, 'Part of the display face, providing a reference for reading the hands.'],
    [/Minute hand|Hour hand|Seconds hand/i, 'Points to the corresponding time scale on the dial.'],
    [/screw|locking pin|screw bar/i, 'Secures adjoining components in their assembled positions.'],
    [/jewel|diamond|bearing/i, 'Part of a bearing or setting that supports a moving component.'],
    [/spring/i, 'An elastic component associated with its surrounding mechanism.'],
    [/Main.plate/i, 'The structural base that locates and supports the movement’s mechanisms.'],
    [/Barrel|Mainspring/i, 'Part of the assembly that stores and delivers energy to the movement.'],
    [/Indicator/i, 'Part of the optional mechanism for recording and resetting impact indications.'],
    [/Sapphire crystal/i, 'A transparent cover over the watch display.'],
    [/Gasket/i, 'A seal between adjoining case components.'],
    [/Case|Crown guard/i, 'Part of the enclosure that houses and protects the movement.'],
    [/Strap|Buckle|Lug/i, 'Part of the attachment that holds the watch on the wrist.'],
    [/washer|spacer/i, 'A small component that separates or seats adjoining parts.'],
  ];
  return families.find(([pattern]) => pattern.test(label))?.[1] ??
    (p.isAssembly
      ? 'A group of components shown together in their assembled relationship.'
      : 'Its shape and assembly position can be explored here; a more specific role has not yet been documented.');
}
