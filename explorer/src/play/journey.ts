import { actions, canPlace } from './state.ts';
import type { PlayManifest, PlaySession, PlayStep } from './types';

/** Editorial observations of the authored puzzle, not mechanical instructions. */
export const chapterNotes: Record<
  string,
  { title: string; invitation: string; detail: string; reward: string }
> = {
  power: {
    title: 'Begin with energy',
    invitation: 'Two barrels. The beginning of the build.',
    detail:
      'Look for the pair of broad, circular barrel assemblies. Compare their shapes before adding the bridge above them.',
    reward:
      'The barrel pair and its supporting pieces are in place. Notice how the bridge changes the silhouette.',
  },
  train: {
    title: 'Follow the wheels',
    invitation: 'A landscape of wheels and bridges.',
    detail:
      'Watch the open spaces fill with wheels of different sizes. Their source positions reveal a much clearer pattern than a tray of loose parts.',
    reward:
      'The going-train chapter is complete. Turn the model to see the layers you have added.',
  },
  escapement: {
    title: 'Find the heartbeat',
    invitation: 'Small pieces. A distinctive balance.',
    detail:
      'Compare the open balance assembly with the compact pallet assembly. Here, a few small components make a striking visual difference.',
    reward:
      'The balance and escapement pieces are fitted. This is a static reconstruction; the movement does not run.',
  },
  indicator: {
    title: 'A signature detail',
    invitation: 'Meet the shock-indicator assembly.',
    detail:
      'Easy places this as one prepared assembly. Hard opens it on a separate bench so you can discover its individual components.',
    reward:
      'The shock-indicator assembly is seated in the movement. A small chapter with a remarkably intricate structure.',
  },
  winding: {
    title: 'Build the connection',
    invitation: 'From the stem to the surrounding levers.',
    detail:
      'Start at the winding stem and watch the surrounding cluster take shape. Bridges and screws bring the larger pieces together.',
    reward:
      'The winding and setting chapter is complete. Compare this dense cluster with the open shapes of the train.',
  },
  display: {
    title: 'Across to the other face',
    invitation: 'Discover the motion works.',
    detail:
      'There is more to build on the dial side. Use Flip whenever you want to compare the two faces; your progress stays exactly where you left it.',
    reward:
      'The motion works are in place. The other face is becoming a watch of its own.',
  },
  fittings: {
    title: 'The finishing structure',
    invitation: 'Small fittings make the whole.',
    detail:
      'Notice the repeated clamps and their screws. Similar-looking parts still have their own source positions in this puzzle.',
    reward:
      'The plates and clamps are fitted. The supporting structure is complete.',
  },
  dials: {
    title: 'Give it a face. Twice.',
    invitation: 'The final transformation: dials and hands.',
    detail:
      'Final dial fitting waits for the underlying puzzle work. In Hard, you can prepare display parts on their benches earlier. Compare the character of the two faces.',
    reward:
      'Both displays are complete. Take a moment to turn the movement over and see what you made.',
  },
};

export function chapterProgress(manifest: PlayManifest, session: PlaySession) {
  const all = actions(manifest, session.level);
  const done = new Set(session.actionIds);
  return manifest.groups.map((group) => {
    const steps = all.filter((step) => step.groupId === group.id);
    return {
      ...group,
      total: steps.length,
      done: steps.filter((step) => done.has(step.id)).length,
      ready: steps.filter((step) => canPlace(manifest, session, step.id))
        .length,
    };
  });
}

/** Recommend only legal actions. Keep bench work together, then explicitly transfer.
 * A blocked chapter follows its actual prerequisite graph, never display order. */
export function recommendFit(
  manifest: PlayManifest,
  session: PlaySession,
  groupId?: string,
  workspaceId?: string | null,
): PlayStep | null {
  const all = actions(manifest, session.level);
  const ready = all.filter((step) => canPlace(manifest, session, step.id));
  const inChapter = ready.filter((step) => step.groupId === groupId);
  const candidates = inChapter.length ? inChapter : [];
  if (candidates.length)
    return (
      candidates.find((step) => step.kind === 'transfer') ??
      candidates.find(
        (step) => workspaceId && step.workspaceId === workspaceId,
      ) ??
      candidates[0]
    );
  const done = new Set(session.actionIds);
  const visited = new Set<string>();
  const dependency = (step: PlayStep): PlayStep | null => {
    if (visited.has(step.id) || done.has(step.id)) return null;
    visited.add(step.id);
    if (canPlace(manifest, session, step.id)) return step;
    for (const id of step.prerequisiteStepIds) {
      const parent = all.find((item) => item.id === id);
      const result = parent && dependency(parent);
      if (result) return result;
    }
    return null;
  };
  for (const step of all.filter((item) => item.groupId === groupId)) {
    const result = dependency(step);
    if (result) return result;
  }
  return ready.find((step) => step.kind === 'transfer') ?? ready[0] ?? null;
}
