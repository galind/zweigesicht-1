/** Decorative proposals only. Imported exclusively by the development preview. */
export const concepts = [
  {
    id: 'balance',
    name: 'Balance',
    rationale:
      'A fine rim and poised spokes suggest the regulating organ, with the restraint of a technical engraving.',
    motion:
      'A small ±18° oscillation over 4.8 seconds. Soft reversals, no full rotation.',
    strength:
      'Recognisably horological; clear at small sizes; equally suited to exploration and assembly.',
    drawback:
      'The circular silhouette can read as a spinner at first glance. This is an abstract motif, not a simulation.',
    reduced:
      'The wheel rests upright, with its axle and two fixed banking marks visible.',
  },
  {
    id: 'register',
    name: 'Register',
    rationale:
      'Three offset plates quietly find a common centre: precision revealed through alignment.',
    motion:
      'Two plates travel 7 pixels in opposite directions, align and dwell, then gently separate. A six-second loop.',
    strength:
      'Quietest geometric option; the alignment particularly echoes Workshop assembly.',
    drawback:
      'Less immediately watch-specific; could suggest stacked data or layers.',
    reduced: 'All three plates remain registered around the central pin.',
  },
  {
    id: 'calibre',
    name: 'Calibre',
    rationale:
      'An editorial calibre inscription places the object’s identity ahead of an animated symbol.',
    motion:
      '“ml” and “01” exchange emphasis with a two-pixel baseline shift, settling together for most of a 6.4-second loop.',
    strength:
      'Most discreet; elegant alongside the existing utilitarian interface typography.',
    drawback:
      'Introduces a serif voice and a second identity line; less legible as activity during its long rest.',
    reduced:
      'The complete “ml — 01” inscription stays aligned and fully legible.',
  },
  {
    id: 'impulse',
    name: 'Impulse',
    rationale:
      'Two poised levers exchange a tiny impulse across a fixed jewel: a spare mechanical punctuation.',
    motion:
      'The levers tip by 7° in sequence, return, then hold for half of a 5.6-second loop.',
    strength:
      'Distinctive open silhouette without a rotating ring; local movement keeps attention on the status.',
    drawback:
      'Most abstract proposal; can resemble calipers. Not a faithful escapement diagram.',
    reduced: 'Both levers rest symmetrically around the visible jewel.',
  },
] as const;
export type Concept = (typeof concepts)[number]['id'];

export function ConceptMark({ concept }: { concept: Concept }) {
  return (
    <span className={`study-mark study-${concept}`} data-concept={concept}>
      {concept === 'calibre' ? (
        <span className="study-inscription">
          <span className="study-type-left">ml</span>
          <span className="study-type-rule">—</span>
          <span className="study-type-right">01</span>
        </span>
      ) : (
        <svg
          viewBox="0 0 120 80"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          {concept === 'balance' && (
            <>
              <path className="study-muted" d="M26 36v8M94 36v8" />
              <g className="study-wheel">
                <circle cx="60" cy="40" r="25" />
                <path
                  className="study-muted"
                  d="M60 19v16M42 50l14-8M78 50l-14-8"
                />
                <path className="study-accent" d="M48 18a25 25 0 0 1 24 0" />
                <circle className="study-accent" cx="60" cy="40" r="4" />
              </g>
              <circle className="study-pin" cx="60" cy="40" r="1.3" />
            </>
          )}
          {concept === 'register' && (
            <>
              <path className="study-muted" d="M60 10v6M60 64v6" />
              <rect
                className="study-plate-top"
                x="36"
                y="21"
                width="48"
                height="10"
                rx="5"
              />
              <rect
                className="study-accent"
                x="30"
                y="35"
                width="60"
                height="10"
                rx="5"
              />
              <rect
                className="study-plate-bottom"
                x="36"
                y="49"
                width="48"
                height="10"
                rx="5"
              />
              <circle className="study-pin" cx="60" cy="40" r="2" />
            </>
          )}
          {concept === 'impulse' && (
            <>
              <g className="study-lever-left">
                <path d="M34 57V27q0-6 6-6h10M34 36h15l5 5" />
                <circle cx="34" cy="57" r="3" />
              </g>
              <g className="study-lever-right">
                <path d="M86 57V27q0-6-6-6H70M86 36H71l-5 5" />
                <circle cx="86" cy="57" r="3" />
              </g>
              <path className="study-accent" d="m60 35 5 5-5 5-5-5Z" />
              <path className="study-muted" d="M50 64h20" />
            </>
          )}
        </svg>
      )}
    </span>
  );
}
