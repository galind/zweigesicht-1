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
      <fieldset className="configuration-group">
        <legend>Case</legend>
        <label className="dial-visibility">
          <input
            type="checkbox"
            checked={state.caseVisible}
            disabled={!available}
            onChange={(event) =>
              void viewer()?.configureWatch({
                caseVisible: event.target.checked,
              })
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
        {state.caseVisible &&
          !state.caseEffective &&
          !state.caseRequest &&
          !state.caseError && (
            <p className="dial-note">
              The case is temporarily hidden in this view.
            </p>
          )}
      </fieldset>
      <fieldset className="configuration-group">
        <legend>Dials &amp; hands</legend>
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
        <label className="dial-face">
          <span>Skeleton hands</span>
          <div className="dial-hand-select">
            <select
              aria-label="Skeleton hand style"
              value={state.smallStyle}
              disabled={!available}
              onChange={(event) =>
                void viewer()?.configureDials({
                  smallStyle: event.target.value,
                })
              }
            >
              {DIALS.faces.small.styles.map((hand) => (
                <option key={hand.id} value={hand.id}>
                  {hand.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
        </label>
        <label className="dial-face">
          <span>Three hands</span>
          <div className="dial-hand-select">
            <select
              aria-label="Three hands style"
              value={state.centralStyle}
              disabled={!available}
              onChange={(event) =>
                void viewer()?.configureDials({
                  centralStyle: event.target.value,
                })
              }
            >
              {DIALS.faces.central.styles.map((hand) => (
                <option key={hand.id} value={hand.id}>
                  {hand.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
        </label>
      </fieldset>
      <p className="dial-note">
        Your choices are kept when you reset the view.
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
