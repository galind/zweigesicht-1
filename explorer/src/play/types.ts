/** Authored membership uses immutable source instance IDs, never display names. */
export type PlayLevel = 'easy' | 'hard';
export type PlaySide = 'front' | 'back';

export interface PlayStep {
  id: string;
  label: string;
  leafIds: readonly string[];
  side: PlaySide;
  viewDirectionWorld?: readonly number[];
  assemblyId: string;
  staging: 'lower-left';
  contextLeafIds: readonly string[];
  focusLeafIds: readonly string[];
  instruction?: string;
}

export interface PlayManifest {
  version: string;
  initialLeafIds: readonly string[];
  finalLeafIds: readonly string[];
  targetPoses: Readonly<Record<string, readonly (readonly number[])[]>>;
  levels: Record<PlayLevel, { steps: readonly PlayStep[] }>;
}

/** Only committed placement IDs persist; no renderer or animation state belongs here. */
export interface PlaySession {
  readonly manifestVersion: string;
  readonly level: PlayLevel;
  readonly completedStepIds: readonly string[];
}

export interface ScreenPoint {
  x: number;
  y: number;
}
