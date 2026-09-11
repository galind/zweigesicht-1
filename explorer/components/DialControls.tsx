'use client';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DIALS } from '@/src/experience/dials';
import type {
  MovementViewer,
  ViewerSnapshot,
} from '@/src/viewer/MovementViewer';

export function DialControls({
  state,
  viewer,
  available,
}: {
  state: ViewerSnapshot;
  viewer: () => MovementViewer | null;
  available: boolean;
}) {
  return (
    <div className="dial-options">
      {(['central', 'small'] as const).map((face) => {
        const label = face === 'central' ? 'Three hands' : 'Skeleton';
        const visibilityKey =
          face === 'central' ? 'centralVisible' : 'smallVisible';
        const styleKey = face === 'central' ? 'centralStyle' : 'smallStyle';
        return (
          <section
            className="dial-face"
            key={face}
            aria-label={`${label} display`}
          >
            <button
              className="dial-visibility"
              type="button"
              aria-pressed={state[visibilityKey]}
              disabled={!available}
              onClick={() =>
                void viewer()?.configureDials({
                  [visibilityKey]: !state[visibilityKey],
                })
              }
            >
              <span>{label}</span>
              <span className="dial-toggle-state" aria-hidden="true">
                {state[visibilityKey] ? 'Shown' : 'Hidden'}
                <span className="dial-switch" />
              </span>
            </button>
            <div className="dial-style-row">
              <ToggleGroup
                aria-label={`${label} hand styles`}
                value={[state[styleKey]]}
                disabled={!available}
                onValueChange={(values) => {
                  if (values[0])
                    void viewer()?.configureDials({ [styleKey]: values[0] });
                }}
              >
                {DIALS.faces[face].styles.map((hand) => (
                  <ToggleGroupItem key={hand.id} value={hand.id}>
                    {hand.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </section>
        );
      })}
      <output aria-live="polite" className="dial-status">
        {state.dialError || (state.dialRequest ? 'Loading dials…' : '')}
      </output>
      {state.dialError && (
        <button
          className="tool"
          disabled={!available || state.catalogLoading}
          onClick={() => void viewer()?.retryDials()}
        >
          Retry dials
        </button>
      )}
    </div>
  );
}
