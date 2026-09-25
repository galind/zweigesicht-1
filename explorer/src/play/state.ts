import type {
  PlayLevel,
  PlayManifest,
  PlaySession,
  PlayStep,
  ScreenPoint,
} from './types';

export const PLAY_STORAGE_KEY = 'zweigesicht:play:session:v1';
/** CSS pixels, deliberately independent of camera zoom and difficulty. */
export const SNAP_RADIUS_PX = 56;

export function createSession(
  manifest: PlayManifest,
  level: PlayLevel,
): PlaySession {
  if (level !== 'easy' && level !== 'hard')
    throw new Error('Unknown play level.');
  return { manifestVersion: manifest.version, level, completedStepIds: [] };
}

export function currentStep(
  manifest: PlayManifest,
  session: PlaySession,
): PlayStep | null {
  if (validateSession(manifest, session).status !== 'saved') return null;
  return (
    manifest.levels[session.level].steps[session.completedStepIds.length] ??
    null
  );
}

export function fittedLeafIds(
  manifest: PlayManifest,
  session: PlaySession,
): string[] {
  return [
    ...manifest.initialLeafIds,
    ...manifest.levels[session.level].steps
      .slice(0, session.completedStepIds.length)
      .flatMap((step) => step.leafIds),
  ];
}

/** A release carries its original step ID, so duplicate/stale releases cannot advance twice. */
export function commitPlacement(
  manifest: PlayManifest,
  session: PlaySession,
  expectedStepId: string,
): PlaySession {
  if (session.manifestVersion !== manifest.version) return session;
  const step = currentStep(manifest, session);
  if (!step || step.id !== expectedStepId) return session;
  return {
    ...session,
    completedStepIds: [...session.completedStepIds, step.id],
  };
}

export function undoPlacement(
  manifest: PlayManifest,
  session: PlaySession,
): PlaySession {
  if (
    validateSession(manifest, session).status !== 'saved' ||
    !session.completedStepIds.length
  )
    return session;
  return {
    ...session,
    completedStepIds: session.completedStepIds.slice(0, -1),
  };
}

export type SessionValidation =
  | { status: 'saved'; session: PlaySession }
  | { status: 'incompatible' | 'corrupt' };

/** Restore only an exact ordered prefix. Never infer progress from a count or remap IDs. */
export function validateSession(
  manifest: PlayManifest,
  value: unknown,
): SessionValidation {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { status: 'corrupt' };
  const data = value as Record<string, unknown>;
  if (typeof data.manifestVersion !== 'string') return { status: 'corrupt' };
  if (data.manifestVersion !== manifest.version)
    return { status: 'incompatible' };
  if (
    (data.level !== 'easy' && data.level !== 'hard') ||
    !Array.isArray(data.completedStepIds) ||
    Object.keys(data).some(
      (key) => !['manifestVersion', 'level', 'completedStepIds'].includes(key),
    )
  )
    return { status: 'corrupt' };
  const steps = manifest.levels[data.level].steps;
  if (
    data.completedStepIds.length > steps.length ||
    Array.from(data.completedStepIds).some(
      (id, index) => typeof id !== 'string' || id !== steps[index].id,
    )
  )
    return { status: 'corrupt' };
  return {
    status: 'saved',
    session: {
      manifestVersion: manifest.version,
      level: data.level,
      completedStepIds: [...data.completedStepIds],
    },
  };
}

export interface PlayStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type StorageSource = PlayStorage | (() => PlayStorage);
const browserStorage = (): PlayStorage => window.localStorage;
const resolveStorage = (source: StorageSource): PlayStorage =>
  typeof source === 'function' ? source() : source;

export type SavedSessionResult =
  | SessionValidation
  | { status: 'empty' | 'unavailable' };

/** The getter itself can throw (privacy restrictions), as can each storage operation. */
export function getSavedSession(
  manifest: PlayManifest,
  storage: StorageSource = browserStorage,
): SavedSessionResult {
  let raw: string | null;
  try {
    raw = resolveStorage(storage).getItem(PLAY_STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'empty' };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: 'corrupt' };
  }
  return validateSession(manifest, value);
}

export function saveSession(
  manifest: PlayManifest,
  session: PlaySession,
  storage: StorageSource = browserStorage,
): { status: 'saved' | 'unavailable' | 'corrupt' | 'incompatible' } {
  const validated = validateSession(manifest, session);
  if (validated.status !== 'saved') return validated;
  try {
    resolveStorage(storage).setItem(
      PLAY_STORAGE_KEY,
      JSON.stringify(validated.session),
    );
    return { status: 'saved' };
  } catch {
    return { status: 'unavailable' };
  }
}

export function clearSavedSession(
  storage: StorageSource = browserStorage,
): boolean {
  try {
    resolveStorage(storage).removeItem(PLAY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** grabOffset is pointer minus the piece's staging center at pointerdown. */
export function dragCenter(
  pointer: ScreenPoint,
  grabOffset: ScreenPoint,
): ScreenPoint {
  return { x: pointer.x - grabOffset.x, y: pointer.y - grabOffset.y };
}

/** Validate only on release. Hover/preview callers must never commit a placement. */
export function snapDrop({
  pointer,
  grabOffset,
  target,
  radius = SNAP_RADIUS_PX,
}: {
  pointer: ScreenPoint;
  grabOffset: ScreenPoint;
  target: ScreenPoint;
  radius?: number;
}): boolean {
  if (
    ![
      pointer.x,
      pointer.y,
      grabOffset.x,
      grabOffset.y,
      target.x,
      target.y,
      radius,
    ].every(Number.isFinite) ||
    radius <= 0
  )
    return false;
  const center = dragCenter(pointer, grabOffset);
  return Math.hypot(center.x - target.x, center.y - target.y) <= radius;
}
