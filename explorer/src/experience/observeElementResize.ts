type ResizeTarget = Element | null | undefined;

/**
 * Run a layout measurement now and whenever its owning elements resize.
 * Returns the complete effect cleanup so components cannot forget a listener.
 */
export function observeElementResize(
  targets: Iterable<ResizeTarget>,
  measure: () => void,
  { observeWindow = false }: { observeWindow?: boolean } = {},
) {
  const observer = new ResizeObserver(measure);
  for (const target of targets) {
    if (target) observer.observe(target);
  }
  if (observeWindow) window.addEventListener('resize', measure);
  measure();
  return () => {
    observer.disconnect();
    if (observeWindow) window.removeEventListener('resize', measure);
  };
}
