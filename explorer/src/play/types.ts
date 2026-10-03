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
  prerequisiteStepIds: readonly string[];
  kind: 'place' | 'transfer';
  groupId: string;
  packetId: string;
  workspaceId: string | null;
}

export interface PlayPacket {
  id: string;
  label: string;
  leafIds: readonly string[];
  stepIds: readonly string[];
  transferId: string;
  side: PlaySide;
  groupId: string;
}

export interface PlayManifest {
  version: string;
  foundationRootId: string;
  groups: readonly { id: string; label: string }[];
  packets: readonly PlayPacket[];
  initialLeafIds: readonly string[];
  finalLeafIds: readonly string[];
  targetPoses: Readonly<Record<string, readonly (readonly number[])[]>>;
  levels: Record<
    PlayLevel,
    { steps: readonly PlayStep[]; transfers: readonly PlayStep[] }
  >;
}

/** Persist actions and the legacy hints field for save compatibility; selection and rendering are transient. */
export interface PlaySession {
  readonly manifestVersion: string;
  readonly level: PlayLevel;
  readonly actionIds: readonly string[];
  readonly hints: boolean;
}

export interface ScreenPoint {
  x: number;
  y: number;
}
