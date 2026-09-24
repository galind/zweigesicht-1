'use client';
import { useId } from 'react';
import { Check } from 'lucide-react';
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
  const id = useId();
  const caseStatus =
    state.caseError ||
    (state.caseRequest ? 'Loading case…' : '') ||
    (state.caseVisible && !state.caseEffective
      ? 'Temporarily hidden in this view.'
      : state.caseVisible
        ? 'Case visible.'
        : 'Case hidden. Choose a finish for later.');
  const dialStatus =
    state.dialError ||
    (state.dialRequest ? 'Loading dials…' : '') ||
    (state.dialsVisible
      ? 'Both dials visible.'
      : 'Dials hidden. Your hand choices are kept.');
  return (
    <div className="dial-options">
      <fieldset className="configuration-group" disabled={!available}>
        <legend className="sr-only">Case</legend>
        <label className="visibility-switch">
          <span>Show case</span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={state.caseVisible}
            checked={state.caseVisible}
            onChange={(event) =>
              void viewer()?.configureWatch({
                caseVisible: event.target.checked,
              })
            }
          />
          <span className="switch-track" aria-hidden="true" />
        </label>
        <fieldset className="choice-group material-choices">
          <legend>Case material</legend>
          <div className="choice-options">
            {WATCH.caseMaterials.map((material) => (
              <label
                className="choice-option"
                key={material.id}
                aria-label={material.label}
              >
                <input
                  type="radio"
                  name={`${id}-material`}
                  value={material.id}
                  checked={state.caseMaterial === material.id}
                  onChange={() =>
                    void viewer()?.configureWatch({ caseMaterial: material.id })
                  }
                />
                <span className="choice-label">
                  <span
                    className="material-swatch"
                    data-material={material.id}
                    aria-hidden="true"
                  >
                    {state.caseMaterial === material.id && <Check />}
                  </span>
                  <span>{material.label}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="configuration-feedback">
          <output aria-live="polite" className="dial-status">
            {caseStatus}
          </output>
          {state.caseError && (
            <button
              className="tool"
              disabled={state.catalogLoading}
              onClick={() => void viewer()?.retryDials()}
            >
              Retry case
            </button>
          )}
        </div>
      </fieldset>
      <fieldset className="configuration-group" disabled={!available}>
        <legend className="sr-only">Dials &amp; hands</legend>
        <label className="visibility-switch">
          <span>Show both dials</span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={state.dialsVisible}
            checked={state.dialsVisible}
            onChange={(event) =>
              void viewer()?.configureDials({
                dialsVisible: event.target.checked,
              })
            }
          />
          <span className="switch-track" aria-hidden="true" />
        </label>
        {(['small', 'central'] as const).map((face) => (
          <fieldset className="choice-group" key={face}>
            <legend>
              {face === 'small' ? 'Skeleton hands' : 'Three hands'}
            </legend>
            <div className="choice-options">
              {DIALS.faces[face].styles.map((hand) => (
                <label className="choice-option" key={hand.id}>
                  <input
                    type="radio"
                    name={`${id}-${face}`}
                    value={hand.id}
                    checked={
                      state[
                        face === 'small' ? 'smallStyle' : 'centralStyle'
                      ] === hand.id
                    }
                    onChange={() =>
                      void viewer()?.configureDials(
                        face === 'small'
                          ? { smallStyle: hand.id }
                          : { centralStyle: hand.id },
                      )
                    }
                  />
                  <span className="choice-label">{hand.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="configuration-feedback">
          <output aria-live="polite" className="dial-status">
            {dialStatus}
          </output>
          {state.dialError && (
            <button
              className="tool"
              disabled={state.catalogLoading}
              onClick={() => void viewer()?.retryDials()}
            >
              Retry dials
            </button>
          )}
        </div>
      </fieldset>
      <output aria-live="polite" className="configuration-notice">
        {state.configurationNotice}
      </output>
      <p className="configuration-footer">
        Your choices are kept when you reset the view.
      </p>
    </div>
  );
}
