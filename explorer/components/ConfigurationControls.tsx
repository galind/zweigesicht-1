'use client';
import { ChevronDown } from 'lucide-react';
import { WATCH } from '@/src/experience/watch';
import { DIALS } from '@/src/experience/dials';
import type {
  MovementViewer,
  ViewerSnapshot,
} from '@/src/viewer/MovementViewer';

export function ConfigurationControls({
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
          checked={state.caseVisible}
          disabled={!available}
          onChange={(event) =>
            void viewer()?.configureWatch({ caseVisible: event.target.checked })
          }
        />
        <span>Show case</span>
      </label>
      <label className="dial-face case-material">
        <span>Case material</span>
        <div className="dial-hand-select">
          <select
            aria-label="Case material"
            value={state.caseMaterial}
            disabled={!available}
            onChange={(event) =>
              void viewer()?.configureWatch({
                caseMaterial: event.target.value,
              })
            }
          >
            {WATCH.caseMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" />
        </div>
      </label>
      <p className="dial-note">
        Case includes both crystals and fittings. It is temporarily hidden in
        Focus and All parts, and during raw CAD inspection.
      </p>
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
      <label className="dial-face hand-finish">
        <span>Three hands material</span>
        <div className="dial-hand-select">
          <select
            aria-label="Three hands material"
            value={state.centralFinish}
            disabled={!available}
            aria-describedby="hand-material-note"
            onChange={(event) =>
              void viewer()?.configureWatch({
                centralFinish: event.target.value,
              })
            }
          >
            <option value="blued-steel">Blued steel</option>
            <option value="rose-gold" disabled={state.centralStyle !== 'fine'}>
              Rose gold{state.centralStyle !== 'fine' ? ' · Fine only' : ''}
            </option>
          </select>
          <ChevronDown aria-hidden="true" />
        </div>
      </label>
      <p className="dial-note" id="hand-material-note">
        Rose gold is verified for Fine hands. Other shapes retain blued steel.
        Shapes and materials are remembered while hidden; Reset keeps your
        configuration.
      </p>
      <output aria-live="polite" className="dial-status">
        {state.configurationNotice}
      </output>
      <output aria-live="polite" className="dial-status">
        {state.caseError || (state.caseRequest ? 'Loading case…' : '')}
      </output>
      {state.caseError && (
        <button
          className="tool"
          disabled={!available || state.catalogLoading}
          onClick={() => void viewer()?.retryDials()}
        >
          Retry case
        </button>
      )}
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
