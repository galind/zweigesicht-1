'use client';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DIALS, dialView, type DialView } from '@/src/experience/dials';
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
  const view = state.dialRequest?.view ?? dialView(state);
  const face = view === 'central' ? 'central' : 'small';
  const faceLabel = face === 'central' ? 'Three hands' : 'Skeleton';
  const style =
    face === 'central'
      ? (state.dialRequest?.centralStyle ?? state.centralStyle)
      : (state.dialRequest?.smallStyle ?? state.smallStyle);
  const controls = (
    <div className="dial-options">
      <ToggleGroup
        aria-label="Display view"
        value={[view]}
        disabled={!available}
        onValueChange={(values) => {
          if (values[0]) void viewer()?.showDial(values[0] as DialView);
        }}
      >
        <ToggleGroupItem value="movement">Movement</ToggleGroupItem>
        <ToggleGroupItem value="central">Three hands</ToggleGroupItem>
        <ToggleGroupItem value="small">Skeleton</ToggleGroupItem>
      </ToggleGroup>
      {view !== 'movement' && (
        <>
          <p className="dial-label">
            Hands <span>{faceLabel}</span>
          </p>
          <ToggleGroup
            aria-label={`${faceLabel} hand styles`}
            value={[style]}
            disabled={!available}
            onValueChange={(values) => {
              if (values[0]) void viewer()?.showDial(view, face, values[0]);
            }}
          >
            {DIALS.faces[face].styles.map((hand) => (
              <ToggleGroupItem key={hand.id} value={hand.id}>
                {hand.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
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
  return (
    <details className="inline-dials">
      <summary>Dial &amp; hands</summary>
      {controls}
    </details>
  );
}
