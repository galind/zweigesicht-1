export type LoadStage =
  | 'movement'
  | 'preparing'
  | 'ready'
  | 'recovering'
  | 'error';

/** A transfer percentage is never an estimate of scene preparation. */
export function transferProgress(loaded: number, total: number) {
  return Number.isFinite(total) && total > 0 && Number.isFinite(loaded)
    ? Math.min(100, Math.max(0, Math.floor((loaded / total) * 100)))
    : null;
}

export function loadingMessage(stage: LoadStage) {
  return {
    movement: 'Loading the movement',
    preparing: 'Preparing the view',
    ready: 'Movement ready',
    recovering: 'Restoring the view',
    error: '3D is unavailable',
  }[stage];
}

/** Explicit local QA visits bypass previously cached asset responses. */
export function assetRequestUrl(path: string) {
  const flags = new URLSearchParams(location.search);
  return flags.has('inspect') && flags.has('delivery')
    ? `${path}?inspection=${encodeURIComponent(`${flags.get('delivery')}:${flags.get('case') ?? 'default'}`)}`
    : path;
}
