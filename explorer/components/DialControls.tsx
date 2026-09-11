'use client';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
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
      {(['small', 'central'] as const).map((face) => {
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
                void viewer()?.chooseDial(face, !state[visibilityKey])
              }
            >
              <span className="dial-switch" aria-hidden="true" />
              <span>{label}</span>
            </button>
            <div className="dial-hand-select">
              <select
                aria-label={`${label} hand style`}
                value={state[styleKey]}
                disabled={!available}
                onChange={(event) =>
                  void viewer()?.chooseDial(face, true, event.target.value)
                }
              >
                {DIALS.faces[face].styles.map((hand) => (
                  <option key={hand.id} value={hand.id}>
                    {hand.label}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" />
            </div>
          </section>
        );
      })}
      <section className="shock-option" aria-label="Shock indicator option">
        <label className="shock-checkbox-label" htmlFor="shock-indicator">
          <Checkbox
            id="shock-indicator"
            className="shock-checkbox"
            checked={state.shockIndicator}
            disabled={!available}
            onCheckedChange={(checked) =>
              void viewer()?.chooseShockIndicator(checked)
            }
          />
          <span>Shock indicator</span>
        </label>
        <p className="shock-description">
          {state.shockIndicator ? 'Fitted' : 'Engraving plate'}
        </p>
        <output aria-live="polite" className="dial-status">
          {state.shockError ||
            (state.shockLoading ? 'Loading engraving plate…' : '')}
        </output>
        {state.shockError && (
          <button
            className="tool"
            disabled={state.shockLoading}
            onClick={() => void viewer()?.chooseShockIndicator(false)}
          >
            Retry engraving plate
          </button>
        )}
      </section>
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
