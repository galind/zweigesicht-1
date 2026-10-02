import { TextButton } from './viewer-controls';
import { useId } from 'react';

type MovementLoadingMarkProps = {
  label: string;
  detail?: string;
};

type MovementLoadingStateProps = MovementLoadingMarkProps & {
  actionClassName?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'loading' | 'error';
};

/** Shared, quiet loading treatment for both movement experiences. */
export function MovementLoadingMark({
  label,
  detail,
}: MovementLoadingMarkProps) {
  const id = useId().replace(/:/g, '');
  const cuts = [10, 34, 49, 72];
  return (
    <output className="movement-loader" aria-live="polite">
      <span className="movement-loader-mark" aria-hidden="true">
        <svg
          className="movement-loader-drawing"
          viewBox="0 0 120 80"
          fill="none"
          focusable="false"
        >
          <defs>
            <g id={`${id}-glyph`}>
              <text className="movement-loader-glyph" x="31" y="54">
                g
              </text>
              <text
                className="movement-loader-glyph movement-loader-brass"
                x="57"
                y="54"
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
            className="movement-loader-cut-lines"
            d="M20 34h80M20 49h80"
            strokeDasharray="2 4"
          />
          {[0, 1, 2].map((n) => (
            <g
              key={n}
              className={`movement-loader-slice movement-loader-slice-${n}`}
            >
              <g clipPath={`url(#${id}-slice-${n})`}>
                <use href={`#${id}-glyph`} />
              </g>
            </g>
          ))}
          <g className="movement-loader-whole">
            <use href={`#${id}-glyph`} />
          </g>
          <path
            className="movement-loader-rule"
            d="M20 30v8M16 34h8M100 45v8M96 49h8M60 8v7M60 72v4"
          />
        </svg>
      </span>
      <span className="movement-loader-label sr-only">{label}</span>
      {detail && <span className="movement-loader-detail">{detail}</span>}
    </output>
  );
}

/** Shared loading/error shell, including its optional recovery action. */
export function MovementLoadingState({
  actionClassName,
  actionLabel,
  detail,
  label,
  onAction,
  tone = 'loading',
}: MovementLoadingStateProps) {
  return (
    <>
      {tone === 'error' ? (
        <output className="movement-loader-error" aria-live="polite">
          <span>{label}</span>
          {detail && <span>{detail}</span>}
        </output>
      ) : (
        <MovementLoadingMark label={label} detail={detail} />
      )}
      {actionLabel && onAction && (
        <TextButton className={actionClassName} onClick={onAction}>
          {actionLabel}
        </TextButton>
      )}
    </>
  );
}
