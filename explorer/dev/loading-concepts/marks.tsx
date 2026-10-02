/** Decorative proposals only. Imported exclusively by the development preview. */
export const concepts = [
  {
    id: 'poise',
    name: 'Poise',
    rationale:
      'The original interlocking gg, with a slower, smaller counter-motion that feels poised rather than buoyant.',
    motion:
      'The letters tilt by 2° and rise or fall by 1px in opposition, then settle together. A 4.8-second loop with a quiet rest.',
    strength:
      'Closest to the original character; still clearly alive without a busy rhythm.',
    drawback:
      'Retains a little of the original rocking character. Choose Breath if any rocking feels too playful.',
    reduced: 'Both letters sit upright, interlocked and fully visible.',
  },
  {
    id: 'breath',
    name: 'Breath',
    rationale:
      'Treat gg as a single, settled monogram. Its presence changes softly while its silhouette stays completely still.',
    motion:
      'The complete mark moves between 65% and full opacity over 4.4 seconds. No movement, scaling or glow.',
    strength:
      'The quietest option, with a stable silhouette and no competing gestures.',
    drawback:
      'Subtle enough to look static during a short load; the darkest phase has less visual weight.',
    reduced: 'The complete monogram remains at full opacity.',
  },
  {
    id: 'converge',
    name: 'Converge',
    rationale:
      'Two letters gently find their shared position, echoing the act of bringing two components together.',
    motion:
      'Each g travels 4px inward, holds in the interlocked position, then releases. A 5.6-second loop with a long central dwell.',
    strength:
      'A clear assembly-related gesture that keeps the familiar gg identity.',
    drawback: 'The changing spacing draws more attention than Poise or Breath.',
    reduced: 'The letters remain in their final interlocked position.',
  },
  {
    id: 'engraved',
    name: 'Engraved',
    rationale:
      'Fine outlines give the same gg a lighter, engraved character, with ivory and champagne taking turns in emphasis.',
    motion:
      'The outlined letters exchange opacity between 55% and full strength over 5.2 seconds. Their positions never move.',
    strength:
      'The most delicate treatment; distinctly different without introducing another symbol or typeface.',
    drawback:
      'Thin contours have less presence on small or low-contrast screens and need physical-device review.',
    reduced: 'Both outlines remain fully visible, one ivory and one champagne.',
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
