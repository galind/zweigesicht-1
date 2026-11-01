import {
  LESSON,
  OPERATIONS,
  LABELS,
  type Item,
  type Tool,
  type Side,
  type Destination,
  type Operation,
} from './lesson';

export const STORAGE_KEY = 'zweigesicht:watchmaker:chapter-1:v1';
export interface Session {
  version: string;
  runId: string;
  revision: number;
  cursor: number;
  awarded: number;
  attempts: string[];
  mistakes: number;
  elapsedMs: number;
}
export interface Attempt {
  id: string;
  runId: string;
  revision: number;
  item: Item;
  kind: Operation['kind'];
  tool: Tool | null;
  side: Side;
  support: Side | null;
  destination: Destination;
  distanceMm: number;
}
export const createSession = (runId: string): Session => ({
  version: LESSON.version,
  runId,
  revision: 0,
  cursor: 0,
  awarded: 0,
  attempts: [],
  mistakes: 0,
  elapsedMs: 0,
});
export const score = (session: Session) =>
  session.awarded * LESSON.correctPoints +
  session.mistakes * LESSON.incorrectPoints;

export function commitAttempt(
  session: Session,
  attempt: Attempt,
  radius = LESSON.placementRadiusMm,
) {
  if (
    attempt.runId !== session.runId ||
    attempt.revision !== session.revision ||
    session.attempts.includes(attempt.id) ||
    session.cursor === OPERATIONS.length
  )
    return { session, message: '', accepted: false };
  const next = OPERATIONS[session.cursor];
  let message = '';
  if (attempt.item !== next.item || attempt.kind !== next.kind)
    message = `Next: ${next.label}. ${LABELS[attempt.item]} is not ready for that operation.`;
  else if (attempt.tool !== next.tool)
    message = `Use ${next.tool} for this operation (prototype tool assignment).`;
  else if (attempt.side !== next.side)
    message = `The ${next.side} side must face upward.`;
  else if (attempt.support !== next.support)
    message = next.support
      ? `Choose the ${next.support}-side support for this orientation.`
      : 'Work on the loose stem in the clear central area.';
  else if (attempt.destination !== next.destination)
    message = `Move this part to ${next.destination.replaceAll('-', ' ')}.`;
  else if (
    !Number.isFinite(radius) ||
    radius < 5 ||
    radius > 10 ||
    !Number.isFinite(attempt.distanceMm) ||
    attempt.distanceMm < 0 ||
    attempt.distanceMm > radius
  )
    message = `Place the part within ${radius} mm of its seat.`;
  const accepted = !message;
  return {
    session: {
      ...session,
      revision: session.revision + 1,
      attempts: [...session.attempts, attempt.id],
      cursor: session.cursor + Number(accepted),
      awarded: accepted
        ? Math.max(session.awarded, session.cursor + 1)
        : session.awarded,
      mistakes: session.mistakes + Number(!accepted),
    },
    accepted,
    message:
      message ||
      `${next.label}. ${session.cursor < session.awarded ? 'Already scored.' : `+${LESSON.correctPoints} points.`}`,
  };
}
/** Undo restores physical state but retains the reward/attempt ledger. */
export function undo(session: Session): Session {
  return session.cursor
    ? { ...session, cursor: session.cursor - 1, revision: session.revision + 1 }
    : session;
}
export function validateSession(value: unknown): Session | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const s = value as Session;
  if (
    s.version !== LESSON.version ||
    typeof s.runId !== 'string' ||
    !s.runId ||
    ![s.revision, s.cursor, s.awarded, s.mistakes].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    s.cursor > s.awarded ||
    s.awarded > OPERATIONS.length ||
    !Number.isFinite(s.elapsedMs) ||
    s.elapsedMs < 0 ||
    !Array.isArray(s.attempts) ||
    s.attempts.some((id) => typeof id !== 'string' || !id) ||
    new Set(s.attempts).size !== s.attempts.length ||
    s.attempts.length < s.awarded + s.mistakes ||
    s.revision < s.attempts.length
  )
    return null;
  return {
    version: s.version,
    runId: s.runId,
    revision: s.revision,
    cursor: s.cursor,
    awarded: s.awarded,
    attempts: [...s.attempts],
    mistakes: s.mistakes,
    elapsedMs: s.elapsedMs,
  };
}
export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function readSession(storage: () => Storage): {
  status: 'saved' | 'empty' | 'corrupt' | 'unavailable';
  session?: Session;
} {
  try {
    const raw = storage().getItem(STORAGE_KEY);
    if (raw === null) return { status: 'empty' };
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      return { status: 'corrupt' };
    }
    const session = validateSession(value);
    return session ? { status: 'saved', session } : { status: 'corrupt' };
  } catch {
    return { status: 'unavailable' };
  }
}
export function saveSession(session: Session, storage: () => Storage): boolean {
  if (!validateSession(session)) return false;
  try {
    storage().setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

/** Monotonic samples only. A long RAF gap is suspension, never active play time. */
export class ActiveClock {
  last: number | null = null;
  sample(now: number, active: boolean): number {
    const previous = this.last;
    this.last = active && Number.isFinite(now) ? now : null;
    if (!active || previous === null) return 0;
    const delta = now - previous;
    return delta >= 0 && delta <= 1000 ? delta : 0;
  }
}
