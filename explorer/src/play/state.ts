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

/** Stable inventory order is independent of dependency order and user selection. */
export function actions(
  manifest: PlayManifest,
  level: PlayLevel,
): readonly PlayStep[] {
  return [...manifest.levels[level].steps, ...manifest.levels[level].transfers];
}

export function createSession(
  manifest: PlayManifest,
  level: PlayLevel,
): PlaySession {
  if (level !== 'easy' && level !== 'hard')
    throw new Error('Unknown play level.');
  return {
    manifestVersion: manifest.version,
    level,
    actionIds: [],
    hints: false,
  };
}

export function missingPrerequisites(
  manifest: PlayManifest,
  session: PlaySession,
  id: string,
): PlayStep[] {
  const all = actions(manifest, session.level);
  const step = all.find((s) => s.id === id);
  const done = new Set(session.actionIds);
  return step
    ? all.filter(
        (s) => step.prerequisiteStepIds.includes(s.id) && !done.has(s.id),
      )
    : [];
}

export function canPlace(
  manifest: PlayManifest,
  session: PlaySession,
  id: string,
): boolean {
  const step = actions(manifest, session.level).find((s) => s.id === id);
  return (
    !!step &&
    !session.actionIds.includes(id) &&
    step.prerequisiteStepIds.every((p) => session.actionIds.includes(p))
  );
}

/** Component work and transfers are different actions; transfers never add physical count. */
export function assembledLeafIds(
  manifest: PlayManifest,
  session: PlaySession,
): string[] {
  const done = new Set(session.actionIds);
  return [
    ...manifest.initialLeafIds,
    ...manifest.levels[session.level].steps
      .filter((s) => done.has(s.id))
      .flatMap((s) => s.leafIds),
  ];
}

export function fittedLeafIds(
  manifest: PlayManifest,
  session: PlaySession,
): string[] {
  const done = new Set(session.actionIds);
  return [
    ...manifest.initialLeafIds,
    ...actions(manifest, session.level)
      .filter((s) => !s.workspaceId && done.has(s.id))
      .flatMap((s) => s.leafIds),
  ];
}

export function workspaceLeafIds(
  manifest: PlayManifest,
  session: PlaySession,
  workspace: string,
): string[] {
  const packet = manifest.packets.find((p) => p.id === workspace);
  if (!packet || session.actionIds.includes(packet.transferId)) return [];
  const done = new Set(session.actionIds);
  return manifest.levels.hard.steps
    .filter((s) => s.workspaceId === workspace && done.has(s.id))
    .flatMap((s) => s.leafIds);
}

export function isComplete(
  manifest: PlayManifest,
  session: PlaySession,
): boolean {
  if (validateSession(manifest, session).status !== 'saved') return false;
  const fitted = new Set(fittedLeafIds(manifest, session));
  return (
    fitted.size === manifest.finalLeafIds.length &&
    manifest.finalLeafIds.every((id) => fitted.has(id))
  );
}

/** A release carries its original action ID; stale and duplicate releases do nothing. */
export function commitPlacement(
  manifest: PlayManifest,
  session: PlaySession,
  id: string,
): PlaySession {
  if (
    validateSession(manifest, session).status !== 'saved' ||
    !canPlace(manifest, session, id)
  )
    return session;
  return { ...session, actionIds: [...session.actionIds, id] };
}

export function undoPlacement(
  manifest: PlayManifest,
  session: PlaySession,
): PlaySession {
  if (
    validateSession(manifest, session).status !== 'saved' ||
    !session.actionIds.length
  )
    return session;
  return { ...session, actionIds: session.actionIds.slice(0, -1) };
}

export type SessionValidation =
  | { status: 'saved'; session: PlaySession }
  | { status: 'incompatible' | 'corrupt' };

/** Replay the committed DAG history, rejecting missing supports, duplicates and foreign actions. */
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
    !Array.isArray(data.actionIds) ||
    typeof data.hints !== 'boolean' ||
    Object.keys(data).some(
      (key) =>
        !['manifestVersion', 'level', 'actionIds', 'hints'].includes(key),
    )
  )
    return { status: 'corrupt' };
  const byId = new Map(actions(manifest, data.level).map((s) => [s.id, s]));
  const done = new Set<string>();
  for (const id of data.actionIds) {
    const step = typeof id === 'string' ? byId.get(id) : undefined;
    if (
      !step ||
      done.has(id) ||
      step.prerequisiteStepIds.some((p) => !done.has(p))
    )
      return { status: 'corrupt' };
    done.add(id);
  }
  return {
    status: 'saved',
    session: {
      manifestVersion: manifest.version,
      level: data.level,
      actionIds: [...data.actionIds],
      hints: data.hints,
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
