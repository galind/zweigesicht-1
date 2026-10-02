/** Decorative proposals only. Imported exclusively by the development preview. */
export const concepts = [
  {
    id: 'exchange',
    name: 'Exchange',
    rationale:
      'The two g forms trade places, passing above and below each other like a compact moving monogram.',
    motion:
      'Ivory and champagne exchange positions along opposing arcs, pause, then exchange again. A 3.6-second loop with 22px of horizontal travel and 14px of lift.',
    strength:
      'A recognisable gesture and a changing colour arrangement, even during a short wait.',
    drawback:
      'The overlapping midpoint is deliberately dense. More conspicuous than the previous studies.',
    reduced: 'A static ivory-and-champagne gg in its original order.',
  },
  {
    id: 'turn',
    name: 'Turn',
    rationale:
      'Each letter turns like a small piece being inspected, with the second following the first.',
    motion:
      'Two staggered 360° turns around the vertical axis, followed by a long shared pause. A 3.8-second loop; the letters become edge-on and briefly mirrored mid-turn.',
    strength:
      'The clearest three-dimensional gesture while keeping the mark in one place.',
    drawback:
      'Brief mirrored forms interrupt legibility; the most theatrical option.',
    reduced: 'Both letters face forward, fully readable.',
  },
  {
    id: 'lock',
    name: 'Lock',
    rationale:
      'Two offset letters square up and engage, giving the gg a definite assembly rhythm.',
    motion:
      'The letters separate by 12px each and counter-rotate by 18°, then close and straighten in two stages. They hold interlocked for half of a 3.2-second loop.',
    strength:
      'A decisive, legible action with a long rest; a natural fit for Workshop.',
    drawback:
      'A stronger mechanical metaphor than the homepage requires; the closing action attracts attention.',
    reduced: 'The completed, upright interlocked gg.',
  },
] as const;
export type Concept = (typeof concepts)[number]['id'];
export function ConceptMark({ concept }: { concept: Concept }) {
  return (
    <span className={`study-mark study-${concept}`} data-concept={concept}>
      <span className="study-gg">
        <span>g</span>
        <span>g</span>
      </span>
    </span>
  );
}
