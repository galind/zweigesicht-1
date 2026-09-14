/** Quiet, finite motion: gentle acceleration at both ends, with no overshoot.
 * Direct manipulation starts responding immediately instead of repeatedly
 * restarting an ease-in every time the slider sends a new value. */
export function motionEase(progress: number, direct = false) {
  const t = Math.max(0, Math.min(1, progress));
  if (direct) return 1 - (1 - t) ** 3;
  // Evaluate the nearer endpoint to avoid cancellation just before arrival.
  const u = t > 0.5 ? 1 - t : t;
  const eased = u * u * u * (u * (u * 6 - 15) + 10);
  return t > 0.5 ? 1 - eased : eased;
}

export const MOTION = {
  navigate: 0.85,
  scrub: 0.075,
  separate: 1.25,
  assemble: 1.05,
  fade: 0.24,
} as const;
