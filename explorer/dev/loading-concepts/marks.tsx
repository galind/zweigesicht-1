import { useId } from 'react';
/** Decorative technical studies only; not dimensions or a mechanism simulation. */
export const concepts = [
  {
    id: 'datum',
    name: 'Datum',
    rationale:
      'Treat gg as geometry being registered to a drawing datum. One letter stays fixed while the other resolves onto the reference axes.',
    motion:
      'The champagne g approaches from an 8px horizontal and 6px vertical offset, corrects each axis in sequence, then holds in register. A 4.2-second loop.',
    strength:
      'Keeps the identity but gives its movement an explicit geometric purpose.',
    drawback:
      'Fine construction lines and outlined letters are less prominent than solid typography.',
    reduced: 'Both letters remain registered to the visible drawing datums.',
  },
  {
    id: 'section',
    name: 'Section',
    rationale:
      'An exploded drawing of the gg itself: three horizontal sections settle into one continuous contour.',
    motion:
      'Upper and lower sections separate, then slide into alignment in sequence around a fixed middle section. The complete gg holds before the next 4.8-second cycle.',
    strength:
      'A more distinctive connection between typography and CAD, with a clearly readable assembled state.',
    drawback:
      'The letters are intentionally fragmented during the exploded phase.',
    reduced: 'All three sections form one complete, aligned gg.',
  },
  {
    id: 'fit',
    name: 'Fit',
    rationale:
      'A small sectional drawing replaces the monogram: two hatched collars register against a central shaft shoulder.',
    motion:
      'The left collar slides onto the shaft, then the right; both remain seated before withdrawing. A 4.4-second loop along a fixed centreline.',
    strength:
      'The most explicitly engineering-led option; the motion reads as fitting rather than decoration.',
    drawback:
      'Drops gg and introduces a generic assembly schematic, not a verified component of the watch.',
    reduced:
      'The shaft and both collars remain assembled, with section hatching and centreline visible.',
  },
] as const;
export type Concept = (typeof concepts)[number]['id'];
export function ConceptMark({ concept }: { concept: Concept }) {
  const id = useId().replace(/:/g, '');
  return (
    <span className={`study-mark study-${concept}`} data-concept={concept}>
      <svg
        className="study-drawing"
        viewBox="0 0 120 80"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {concept === 'datum' && (
          <>
            <path
              className="study-guide"
              d="M20 57H104M60 12v58"
              strokeDasharray="3 4"
            />
            <path
              className="study-rule"
              d="M26 17v-4h68v4M26 65v4h68v-4M18 26h-4v30h4M102 26h4v30h-4"
            />
            <text className="study-glyph" x="33" y="55">
              g
            </text>
            <g className="study-register">
              <text className="study-glyph study-brass" x="56" y="55">
                g
              </text>
              <path className="study-brass" d="M88 19v8M84 23h8" />
            </g>
            <path className="study-rule" d="m12 57 3-3 3 3-3 3Z" />
          </>
        )}
        {concept === 'section' && (
          <>
            <defs>
              {[0, 1, 2].map((n) => (
                <clipPath key={n} id={`${id}-slice-${n}`}>
                  <rect
                    x="0"
                    y={[10, 35, 50][n]}
                    width="120"
                    height={[25, 15, 20][n]}
                  />
                </clipPath>
              ))}
            </defs>
            <path
              className="study-guide"
              d="M18 35h84M18 50h84M60 8v64"
              strokeDasharray="2 4"
            />
            {[0, 1, 2].map((n) => (
              <g key={n} className={`study-slice study-slice-${n}`}>
                <g clipPath={`url(#${id}-slice-${n})`}>
                  <text className="study-glyph" x="33" y="55">
                    g
                  </text>
                  <text className="study-glyph study-brass" x="56" y="55">
                    g
                  </text>
                </g>
              </g>
            ))}
            <path className="study-rule" d="M22 29v6h5M93 50h5v6" />
          </>
        )}
        {concept === 'fit' && (
          <>
            <path
              className="study-guide"
              d="M5 40h110"
              strokeDasharray="6 3 1 3"
            />
            <path
              className="study-rule"
              d="M15 32h36V22h18v10h36v16H69v10H51V48H15ZM56 23v10M63 23v10M56 47v10M63 47v10"
            />
            <path className="study-guide" d="M51 13v-5M69 13v-5M51 10h18" />
            <g className="study-collar-left study-brass">
              <path d="M35 20h14v12H35ZM35 48h14v12H35ZM36 27l6-6M41 31l7-7M36 55l6-6M41 59l7-7M35 20v40M49 20v40" />
            </g>
            <g className="study-collar-right">
              <path d="M71 20h14v12H71ZM71 48h14v12H71ZM72 27l6-6M77 31l7-7M72 55l6-6M77 59l7-7M71 20v40M85 20v40" />
            </g>
            <path className="study-rule" d="M51 65v5M69 65v5M51 68h18" />
          </>
        )}
      </svg>
    </span>
  );
}
