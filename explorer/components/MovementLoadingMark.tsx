import { TextButton } from './viewer-controls';

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
  return (
    <output className="movement-loader" aria-live="polite">
      <span className="movement-loader-mark" aria-hidden="true">
        <span>g</span>
        <span>g</span>
      </span>
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
