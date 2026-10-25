import { useSyncExternalStore } from 'react';

const pointerQuery = '(any-pointer: fine)';
const hoverQuery = '(any-hover: hover)';
function subscribe(onChange: () => void) {
  const queries = [pointerQuery, hoverQuery].map((query) => matchMedia(query));
  for (const query of queries) query.addEventListener('change', onChange);
  return () => {
    for (const query of queries) query.removeEventListener('change', onChange);
  };
}
function getAccess() {
  // A narrow window is still usable, and a hybrid device can have a mouse attached.
  // Browsers cannot reliably detect a physical keyboard; keep that requirement explicit.
  if (!matchMedia(pointerQuery).matches || !matchMedia(hoverQuery).matches)
    return 'touch';
  if (typeof Element.prototype.requestPointerLock !== 'function')
    return 'unsupported';
  return 'ready';
}
export function useBenchAccess() {
  return useSyncExternalStore(subscribe, getAccess, () => 'checking' as const);
}
