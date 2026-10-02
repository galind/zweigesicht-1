import { useId } from 'react';
/** One Section drawing, with the previous treatment retained for local comparison. */
export const concepts = [
  {
    id: 'section-original',
    name: 'Section · previous',
    rationale:
      'The starting point: thin outlined letters, continuous construction lines and diagonal assembly.',
    motion:
      'The upper and lower sections slide diagonally into place in sequence. A 4.8-second loop.',
    strength:
      'The technical, exploded-drawing character that established the direction.',
    drawback:
      'Thin contours, guides crossing the letters and diagonal travel make the resolved mark less clear.',
    reduced: 'The original complete gg, with construction lines visible.',
  },
  {
    id: 'section',
    name: 'Section · refined',
    rationale:
      'A more legible contour, quieter datums and a deliberate two-axis registration sequence.',
    motion:
      'Each section first aligns horizontally, then seats vertically; the upper section leads the lower. The complete contour holds for 1.45 seconds before a staged release. A 5.2-second loop.',
    strength:
      'A clearer assembly operation, stronger mobile strokes and a clean, continuous silhouette at rest.',
    drawback:
      'Slightly larger and more deliberate than the original; still fragmented during the exploded phase.',
    reduced:
      'One complete, uninterrupted gg with quiet peripheral datum marks. No fragments or duplicate outlines.',
  },
] as const;
export type Concept = (typeof concepts)[number]['id'];
export function ConceptMark({ concept }: { concept: Concept }) {
  const id = useId().replace(/:/g, '');
  const refined = concept === 'section';
  const cuts = refined ? [10, 34, 49, 72] : [10, 35, 50, 70];
  return (
    <span className={`study-mark study-${concept}`} data-concept={concept}>
      <svg
        className="study-drawing"
        viewBox="0 0 120 80"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <g id={`${id}-glyph`}>
            <text
              className="study-glyph"
              x={refined ? 31 : 33}
              y={refined ? 54 : 55}
            >
              g
            </text>
            <text
              className="study-glyph study-brass"
              x={refined ? 57 : 56}
              y={refined ? 54 : 55}
            >
              g
            </text>
          </g>
          {[0, 1, 2].map((n) => (
            <clipPath key={n} id={`${id}-slice-${n}`}>
              <rect
                x="0"
                y={cuts[n]}
                width="120"
                height={cuts[n + 1] - cuts[n]}
              />
            </clipPath>
          ))}
        </defs>
        <path
          className="study-guide study-cut-lines"
          d={refined ? 'M20 34h80M20 49h80' : 'M18 35h84M18 50h84M60 8v64'}
          strokeDasharray="2 4"
        />
        {[0, 1, 2].map((n) => (
          <g key={n} className={`study-slice study-slice-${n}`}>
            <g clipPath={`url(#${id}-slice-${n})`}>
              <use href={`#${id}-glyph`} />
            </g>
          </g>
        ))}
        {refined && (
          <g className="study-whole">
            <use href={`#${id}-glyph`} />
          </g>
        )}
        <path
          className="study-rule"
          d={
            refined
              ? 'M20 30v8M16 34h8M100 45v8M96 49h8M60 8v7M60 72v4'
              : 'M22 29v6h5M93 50h5v6'
          }
        />
      </svg>
    </span>
  );
}
