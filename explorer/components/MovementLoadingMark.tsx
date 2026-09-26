type MovementLoadingMarkProps = {
  label: string;
  detail?: string;
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
