'use client';
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
      <label className="dial-visibility">
        <input
          type="checkbox"
          checked={state.dialsVisible}
          disabled={!available}
          onChange={(event) =>
            void viewer()?.configureDials({
              dialsVisible: event.target.checked,
            })
          }
        />
        <span>Show both dials</span>
      </label>
      <div className="hand-choices">
        {(['central', 'small'] as const).map((face) => {
          const label = face === 'central' ? 'Three hands' : 'Skeleton';
          const styleKey = face === 'central' ? 'centralStyle' : 'smallStyle';
          return (
            <label className="dial-face" key={face}>
              <span>{label}</span>
              <div className="dial-hand-select">
                <select
                  aria-label={`${label} hand style`}
                  value={state[styleKey]}
                  disabled={!available}
                  onChange={(event) =>
                    void viewer()?.configureDials({
                      [styleKey]: event.target.value,
                    })
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
            </label>
          );
        })}
      </div>
      <p className="dial-note">
        Hand choices are remembered while the dials are hidden.
      </p>
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
