import { TextButton } from './viewer-controls';
import type { ReactNode } from 'react';

type MovementLoadingMarkProps = {
  label: string;
  detail?: string;
  /** Optional decorative study; callers retain the shared status semantics. */
  mark?: ReactNode;
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
  mark,
}: MovementLoadingMarkProps) {
  return (
    <output className="movement-loader" aria-live="polite">
      {mark ? (
        <span aria-hidden="true">{mark}</span>
      ) : (
        <span className="movement-loader-mark" aria-hidden="true">
          <span>g</span>
          <span>g</span>
        </span>
      )}
      <span className="movement-loader-label">{label}</span>
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
  mark,
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
        <MovementLoadingMark label={label} detail={detail} mark={mark} />
      )}
      {actionLabel && onAction && (
        <TextButton className={actionClassName} onClick={onAction}>
          {actionLabel}
        </TextButton>
      )}
    </>
  );
}
