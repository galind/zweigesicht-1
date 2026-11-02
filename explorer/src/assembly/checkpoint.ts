import { createSession, undo, type Session } from './session';

/** Memory-only adapter; never import or persist the historical chapter session. */
export const CHECKPOINT_START = 12;
export const CHECKPOINT_PLACEMENTS = 3;
export function createCheckpoint(runId: string): Session {
  return {
    ...createSession(runId),
    cursor: CHECKPOINT_START,
    awarded: CHECKPOINT_START,
  };
}
export function undoCheckpoint(session: Session): Session {
  return session.cursor > CHECKPOINT_START ? undo(session) : session;
}
