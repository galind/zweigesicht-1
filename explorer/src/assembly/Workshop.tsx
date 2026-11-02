'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, PackageOpen, X, RotateCcw, Grip } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { matchesPart, normalizeSearch } from '../experience/catalog';
import {
  PARTS,
  LABELS,
  OPERATIONS,
  LESSON,
  componentIds,
  type PartItem,
} from './lesson';
import { createSession, commitAttempt, type Session } from './session';
import { WorkshopViewer } from './WorkshopViewer';
import { aimPoint, DRAG_INTENT_PX, type Point } from './workshopInput';
import './workshop.css';

const ITEMS = Object.keys(PARTS) as PartItem[];
const DESTINATIONS = ['bridge', 'bridge-screw-1', 'bridge-screw-2'] as const;
const SEATS = {
  bridge: 'Bridge seat',
  'bridge-screw-1': 'Screw hole 1',
  'bridge-screw-2': 'Screw hole 2',
};
function checkpoint(): Session {
  // Explicit prepared fixture: movement side up and supported. No lesson transition/save.
  return { ...createSession(crypto.randomUUID()), cursor: 12, awarded: 12 };
}
type Gesture = {
  pointer: number;
  item: PartItem;
  start: Point;
  pointerType: string;
  active: boolean;
  rect: DOMRect;
};
function sameRect(a: DOMRect, b: DOMRect) {
  return ['x', 'y', 'width', 'height'].every(
    (key) => a[key as keyof DOMRect] === b[key as keyof DOMRect],
  );
}
function inside(point: Point, rect: DOMRect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}
export default function Workshop() {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<WorkshopViewer | null>(null);
  const partsButton = useRef<HTMLButtonElement>(null),
    alternativeButton = useRef<HTMLButtonElement>(null);
  const destinationControl = useRef<HTMLSelectElement>(null);
  const retryItem = useRef<PartItem | undefined>(undefined);
  const gesture = useRef<Gesture | null>(null);
  const [session, setSession] = useState(checkpoint);
  const sessionRef = useRef(session);
  const [selected, setSelected] = useState<PartItem>();
  const selectedRef = useRef<PartItem | undefined>(undefined);
  const [panel, setPanel] = useState(false);
  const [alternative, setAlternative] = useState(false);
  const [destination, setDestination] = useState('');
  const [query, setQuery] = useState(''),
    [group, setGroup] = useState('all');
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const [thumbnails, setThumbnails] = useState<
    Partial<Record<PartItem, string>>
  >({});
  const [feedback, setFeedback] = useState(
    'Open Parts. Drag a handle to the movement, or enable Alternative controls.',
  );
  const [held, setHeld] = useState<{
    item: PartItem;
    aim: Point;
    valid: boolean;
  }>();
  const [outcome, setOutcome] = useState('idle');
  const handlers = useRef({
    cancel: (_message?: string) => {},
    attempt: (_item: PartItem, _distance: number, _message?: string) => {},
  });
  const finished = session.cursor >= OPERATIONS.length;
  const installed = new Set(componentIds(session.cursor));
  const available = (item: PartItem) =>
    !PARTS[item].every((id) => installed.has(id));

  function clearGesture() {
    const previous = gesture.current;
    gesture.current = null; // Consume before release can synchronously dispatch lost capture.
    if (previous && host.current?.hasPointerCapture(previous.pointer))
      host.current.releasePointerCapture(previous.pointer);
    setHeld(undefined);
    return previous;
  }
  function cancel(message = 'Placement cancelled. No attempt counted.') {
    clearGesture();
    selectedRef.current = undefined;
    setSelected(undefined);
    setDestination('');
    setOutcome('cancelled');
    setFeedback(message);
    setPanel(false);
    partsButton.current?.focus();
  }
  function identify(item: PartItem) {
    if (!ready || finished || !available(item) || gesture.current) return;
    selectedRef.current = item;
    setSelected(item);
    setDestination('');
    setFeedback(
      `${LABELS[item]}. ${alternative ? 'Choose a destination, then confirm placement.' : 'Use its Drag handle to pick it up. Names and previews only identify parts.'}`,
    );
    if (alternative) setPanel(false);
  }
  function attempt(item: PartItem, distanceMm: number, message = '') {
    if (!ready || sessionRef.current.cursor >= OPERATIONS.length) return;
    selectedRef.current = undefined;
    setSelected(undefined);
    setDestination('');
    const current = sessionRef.current;
    const result = commitAttempt(
      current,
      {
        id: crypto.randomUUID(),
        runId: current.runId,
        revision: current.revision,
        item,
        destination: 'movement',
        distanceMm,
        kind: 'place',
        tool: null,
        // Prepared fixture assumptions; historical chapter validation remains unchanged.
        side: 'movement',
        support: 'movement',
      },
      LESSON.placementRadiusMm,
      { requireTool: false },
    );
    sessionRef.current = result.session;
    setSession(result.session);
    setOutcome(result.accepted ? 'accepted' : 'invalid');
    setFeedback(
      result.accepted
        ? `${LABELS[item]} fitted. ${result.session.cursor === OPERATIONS.length ? 'Practice complete — the winding bridge and screws are fitted.' : 'Choose the next part from Parts.'}`
        : `${message || result.message} ${alternative ? 'Choose' : 'Drag'} again from Parts.`,
    );
    if (result.accepted) partsButton.current?.focus();
    else {
      retryItem.current = item;
      setPanel(true);
    }
  }
  useLayoutEffect(() => {
    handlers.current = { cancel, attempt };
  });
  useLayoutEffect(() => {
    viewer.current?.update(session.cursor);
  }, [session.cursor, ready]);
  useEffect(() => {
    let live = true;
    let instance: WorkshopViewer | undefined;
    try {
      instance = new WorkshopViewer(host.current!, (message) => {
        if (live) {
          handlers.current.cancel(
            'Graphics interrupted. Placement cancelled; no attempt counted.',
          );
          setReady(false);
          setError(message);
        }
      });
      viewer.current = instance;
      void instance
        .load()
        .then((images) => {
          if (live && instance?.ready) {
            setThumbnails(images);
            setReady(true);
          }
        })
        .catch((reason: unknown) => {
          if (live)
            setError(
              reason instanceof Error
                ? reason.message
                : 'Unable to load workshop.',
            );
        });
    } catch (reason) {
      queueMicrotask(() => {
        if (live)
          setError(
            reason instanceof Error ? reason.message : 'Graphics unavailable.',
          );
      });
    }
    return () => {
      live = false;
      clearGesture();
      instance?.dispose();
      viewer.current = null;
    };
  }, [retry]);
  useEffect(() => {
    const changedCoordinates = () => {
      const drag = gesture.current;
      if (
        drag &&
        host.current &&
        !sameRect(drag.rect, host.current.getBoundingClientRect())
      ) {
        handlers.current.cancel(
          'View changed. Placement cancelled; no attempt counted.',
        );
        return true;
      }
      return false;
    };
    const move = (event: PointerEvent) => {
      const drag = gesture.current;
      if (!drag || drag.pointer !== event.pointerId || changedCoordinates())
        return;
      const point = { x: event.clientX, y: event.clientY };
      if (
        !drag.active &&
        Math.hypot(point.x - drag.start.x, point.y - drag.start.y) <
          DRAG_INTENT_PX
      )
        return;
      if (!drag.active) {
        drag.active = true;
        selectedRef.current = drag.item;
        setSelected(drag.item);
        setPanel(false); // Intent and persistent capture already established.
        setOutcome('dragging');
      }
      const aim = aimPoint(point, drag.pointerType);
      const hit = viewer.current?.placement(aim, drag.item);
      const valid =
        inside(aim, drag.rect) &&
        !!hit &&
        hit.distanceMm <= LESSON.placementRadiusMm &&
        OPERATIONS[sessionRef.current.cursor]?.item === drag.item;
      setHeld({ item: drag.item, aim, valid });
      setFeedback(
        !inside(aim, drag.rect)
          ? 'Outside movement view. Release returns the part without an attempt.'
          : valid
            ? 'Release to fit here.'
            : hit?.message ||
              'This placement is not ready. Release to try, or cancel.',
      );
    };
    const release = (event: PointerEvent) => {
      const drag = gesture.current;
      if (!drag || drag.pointer !== event.pointerId || changedCoordinates())
        return;
      clearGesture();
      if (!drag.active) return; // A tap on the handle never places or dismisses Parts.
      const aim = aimPoint(
        { x: event.clientX, y: event.clientY },
        drag.pointerType,
      );
      if (!inside(aim, drag.rect)) {
        selectedRef.current = undefined;
        setSelected(undefined);
        setOutcome('outside');
        setFeedback(
          'Released outside the movement view. No attempt counted. Try again from Parts.',
        );
        retryItem.current = drag.item;
        setPanel(true);
        return;
      }
      const hit = viewer.current?.placement(aim, drag.item);
      if (hit) handlers.current.attempt(drag.item, hit.distanceMm, hit.message);
    };
    const abort = () => {
      if (gesture.current) handlers.current.cancel();
    };
    const pointerAbort = (event: PointerEvent) => {
      if (gesture.current?.pointer === event.pointerId) abort();
    };
    const hidden = () => {
      if (document.hidden) abort();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (gesture.current || selectedRef.current))
        handlers.current.cancel();
    };
    const observer = new ResizeObserver(changedCoordinates);
    observer.observe(host.current!);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', pointerAbort);
    window.addEventListener('lostpointercapture', pointerAbort);
    window.addEventListener('blur', abort);
    window.addEventListener('keydown', escape, true);
    window.addEventListener('resize', changedCoordinates);
    window.addEventListener('scroll', changedCoordinates, true);
    window.visualViewport?.addEventListener('resize', abort);
    window.visualViewport?.addEventListener('scroll', abort);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', pointerAbort);
      window.removeEventListener('lostpointercapture', pointerAbort);
      window.removeEventListener('blur', abort);
      window.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', changedCoordinates);
      window.removeEventListener('scroll', changedCoordinates, true);
      window.visualViewport?.removeEventListener('resize', abort);
      window.visualViewport?.removeEventListener('scroll', abort);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);

  return (
    <main
      className="watchmaker-workshop"
      data-cursor={session.cursor}
      data-mistakes={session.mistakes}
      data-outcome={outcome}
    >
      <header className="workshop-header">
        <Link href="/" aria-label="Back to Explorer">
          <ArrowLeft />
        </Link>
        <div>
          <h1>Be a watchmaker!</h1>
          <small>
            Prepared movement · three placements · progress resets on reload
          </small>
        </div>
      </header>
      <section className="workshop-context">
        <p>
          {finished
            ? 'Practice complete: winding bridge and two screws fitted.'
            : OPERATIONS[session.cursor].label}
        </p>
      </section>
      <section className="workshop-workspace" aria-label="Movement workspace">
        <div className="workshop-surface" ref={host} />
        <span className="workshop-assembly-label">
          Movement · winding-bridge practice
        </span>
        {!ready && (
          <div className="workshop-loading" role={error ? 'alert' : 'status'}>
            {error || 'Loading original components…'}
            {error && (
              <button
                onClick={() => {
                  setReady(false);
                  setError('');
                  setRetry((value) => value + 1);
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </section>
      <footer className="workshop-dock">
        <output
          className="workshop-feedback"
          aria-live="polite"
          aria-atomic="true"
        >
          {feedback}
        </output>
        <div className="workshop-selection">
          {selected ? (
            <>
              <Image
                src={thumbnails[selected] ?? ''}
                alt=""
                width={120}
                height={100}
                unoptimized
              />
              <strong>{LABELS[selected]}</strong>
              {!alternative && (
                <button aria-label="Cancel placement" onClick={() => cancel()}>
                  <X />
                </button>
              )}
            </>
          ) : (
            <span>
              {finished ? 'Practice complete' : 'Use a Drag handle in Parts'}
            </span>
          )}
        </div>
        <div className="workshop-actions">
          <button
            ref={partsButton}
            disabled={!ready}
            aria-expanded={panel}
            onClick={() => {
              if (gesture.current) cancel();
              retryItem.current = undefined;
              setPanel(true);
            }}
          >
            <PackageOpen />
            Parts
          </button>
          <button
            ref={alternativeButton}
            aria-pressed={alternative}
            onClick={() => {
              cancel(
                alternative
                  ? 'Drag controls enabled. Open Parts to begin.'
                  : 'Alternative controls enabled. Open Parts, choose a part and a destination, then confirm.',
              );
              setAlternative(!alternative);
              alternativeButton.current?.focus();
            }}
          >
            Alternative controls
          </button>
          <button
            aria-label="Reset practice"
            onClick={() => {
              cancel('Practice reset. Choose a part from Parts.');
              const fresh = checkpoint();
              sessionRef.current = fresh;
              setSession(fresh);
            }}
          >
            <RotateCcw />
          </button>
        </div>
      </footer>
      {alternative && selected && !panel && (
        <section
          className="workshop-alternative"
          aria-label="Alternative placement controls"
        >
          <p>{LABELS[selected]} — choose its destination.</p>
          <label>
            Destination{' '}
            <select
              ref={destinationControl}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              <option value="">Choose a seat…</option>
              {DESTINATIONS.map((item) => (
                <option key={item} value={item}>
                  {SEATS[item]}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!destination || !ready}
            onClick={() => {
              const item = selectedRef.current;
              if (!item || !destination) return;
              selectedRef.current = undefined; // One activation consumes the selection, including invalid attempts.
              attempt(
                item,
                destination === item ? 0 : Infinity,
                destination === item
                  ? ''
                  : 'That destination belongs to another part.',
              );
            }}
          >
            Confirm placement
          </button>
          <button onClick={() => cancel()}>Cancel placement</button>
        </section>
      )}
      {held && (
        <div
          className="workshop-held"
          aria-hidden="true"
          data-valid={held.valid}
          style={{ left: held.aim.x, top: held.aim.y }}
        >
          <Image
            src={thumbnails[held.item] ?? ''}
            alt=""
            width={120}
            height={100}
            unoptimized
          />
          <span className="workshop-aim" />
          <span
            className="workshop-held-name"
            style={{
              left:
                Math.max(
                  8,
                  Math.min(window.innerWidth - 158, held.aim.x - 75),
                ) - held.aim.x,
            }}
          >
            {LABELS[held.item]}
          </span>
        </div>
      )}
      <Sheet
        modal={false}
        open={panel}
        onOpenChange={(open) => {
          setPanel(open);
          if (!open && gesture.current && !gesture.current.active) cancel();
        }}
      >
        <SheetContent
          side="bottom"
          className="workshop-panel"
          showOverlay={false}
          initialFocus={() =>
            retryItem.current
              ? document.querySelector<HTMLButtonElement>(
                  `[data-${alternative ? 'identify' : 'drag'}="${retryItem.current}"]`,
                )
              : undefined
          }
          finalFocus={() =>
            gesture.current
              ? false
              : alternative && selected
                ? destinationControl.current
                : partsButton.current
          }
        >
          <SheetHeader>
            <SheetTitle>Parts</SheetTitle>
            <SheetDescription>
              {alternative
                ? 'Alternative controls: choose a part, then select and confirm its destination.'
                : 'Scroll on names or previews. Pull a Drag handle to pick up; release over the movement. The crosshair is your aim point.'}
            </SheetDescription>
          </SheetHeader>
          <div className="component-finder workshop-filters">
            <label className="catalog-search">
              <span className="sr-only">Search parts</span>
              <input
                type="search"
                placeholder="Search parts…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <nav aria-label="Part groups">
              {['all', 'available', 'installed'].map((value) => (
                <button
                  key={value}
                  aria-pressed={group === value}
                  onClick={() => setGroup(value)}
                >
                  {value === 'all' ? 'All parts' : value}
                </button>
              ))}
            </nav>
          </div>
          <div className="catalog-index workshop-parts">
            {ITEMS.filter(
              (item) =>
                matchesPart(normalizeSearch(LABELS[item]), query) &&
                (group === 'all' ||
                  available(item) === (group === 'available')),
            ).map((item) => (
              <div className="workshop-part-row" key={item}>
                <button
                  data-identify={item}
                  disabled={!available(item) || finished}
                  onClick={() => identify(item)}
                  aria-label={`${alternative ? 'Choose' : 'Identify'} ${LABELS[item]}`}
                >
                  <Image
                    src={thumbnails[item] ?? ''}
                    alt=""
                    width={120}
                    height={100}
                    unoptimized
                  />
                  <span>
                    {LABELS[item]}
                    <small>{available(item) ? 'Available' : 'Installed'}</small>
                  </span>
                </button>
                {!alternative && (
                  <button
                    className="workshop-drag-handle"
                    data-drag={item}
                    disabled={!available(item) || finished}
                    aria-label={`Drag ${LABELS[item]}`}
                    onClick={() => identify(item)}
                    onPointerDown={(event) => {
                      if (
                        !event.isPrimary ||
                        event.button !== 0 ||
                        !ready ||
                        gesture.current
                      )
                        return;
                      event.preventDefault();
                      gesture.current = {
                        pointer: event.pointerId,
                        item,
                        start: { x: event.clientX, y: event.clientY },
                        pointerType: event.pointerType,
                        active: false,
                        rect: host.current!.getBoundingClientRect(),
                      };
                      try {
                        host.current!.setPointerCapture(event.pointerId);
                      } catch {
                        cancel();
                      }
                    }}
                  >
                    <Grip />
                    <span>Drag</span>
                  </button>
                )}
              </div>
            ))}
            {!ITEMS.some(
              (item) =>
                matchesPart(normalizeSearch(LABELS[item]), query) &&
                (group === 'all' ||
                  available(item) === (group === 'available')),
            ) && <p>No matching parts.</p>}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
