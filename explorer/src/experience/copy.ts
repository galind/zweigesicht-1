import type { Part } from './catalog';
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
  winding: ['Movement function · seconds stop', 'Stem & sliding coupling'],
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
};
export function partDetail(p: Part) {
  return (
    roles[p.definitionId.replace('d_0_1_1_', '')] ||
    (p.isAssembly
      ? 'A group of related source components.'
      : 'An individual component of the source construction.')
  );
}
