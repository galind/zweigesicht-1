'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
  onOpenChange,
}: {
  state: ViewerSnapshot;
  viewer: () => MovementViewer | null;
  available: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [open, updateOpen] = useState(false),
    [narrow, setNarrow] = useState(false);
  const setOpen = (value: boolean) => {
    updateOpen(value);
    onOpenChange(value);
  };
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = matchMedia('(max-width: 700px)');
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const view = state.dialRequest?.view ?? dialView(state);
  const face = view === 'central' ? 'central' : 'small';
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
        <ToggleGroupItem value="central">Dial A</ToggleGroupItem>
        <ToggleGroupItem value="small">Dial B</ToggleGroupItem>
      </ToggleGroup>
      {view !== 'movement' && (
        <>
          <p className="dial-label">
            Hands{' '}
            <span>{face === 'central' ? 'Central dial' : 'Small dial'}</span>
          </p>
          <ToggleGroup
            aria-label={`${face === 'central' ? 'Central' : 'Small'} dial hands`}
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
  const label = (
    <>
      Dial &amp; hands <ChevronDown aria-hidden="true" />
    </>
  );
  return narrow ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        ref={trigger}
        className="text-button dial-trigger"
        data-active={state.layout === 'assembly' && view !== 'movement'}
        disabled={!available}
      >
        {label}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="dial-sheet"
        finalFocus={() => trigger.current}
      >
        <SheetHeader>
          <SheetTitle>Dial &amp; hands</SheetTitle>
          <SheetDescription>Choose a face and its hands.</SheetDescription>
        </SheetHeader>
        {controls}
      </SheetContent>
    </Sheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={trigger}
        className="text-button dial-trigger"
        data-active={state.layout === 'assembly' && view !== 'movement'}
        disabled={!available}
      >
        {label}
      </PopoverTrigger>
      <PopoverContent
        className="dial-popover"
        side="top"
        sideOffset={12}
        finalFocus={() => trigger.current}
      >
        <PopoverTitle>Dial &amp; hands</PopoverTitle>
        {controls}
      </PopoverContent>
    </Popover>
  );
}
