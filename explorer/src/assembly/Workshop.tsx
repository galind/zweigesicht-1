'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, PackageOpen, X, RotateCcw, Settings2 } from 'lucide-react';
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
  type Side,
} from './lesson';
import { createSession, commitAttempt, type Session } from './session';
import { WorkshopViewer, type Seat } from './WorkshopViewer';
import './workshop.css';

const ITEMS = Object.keys(PARTS) as PartItem[];
function checkpoint(): Session {
  // Explicit review fixture, never a lesson transition or a persisted chapter save.
  return { ...createSession('movement-practice'), cursor: 12, awarded: 12 };
}
export default function Workshop() {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<WorkshopViewer | null>(null);
  const partsButton = useRef<HTMLButtonElement>(null),
    cancelButton = useRef<HTMLButtonElement>(null);
  const [session, setSession] = useState(checkpoint);
  const [selected, setSelected] = useState<PartItem>();
  const [side, setSide] = useState<Side>('movement');
  const [support, setSupport] = useState<Side | null>('movement');
  const [panel, setPanel] = useState<'parts' | 'setup' | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const [thumbnails, setThumbnails] = useState<
    Partial<Record<PartItem, string>>
  >({});
  const [seat, setSeat] = useState<Seat>({ x: 0, y: 0, width: 1, height: 1 });
  const [feedback, setFeedback] = useState(
    'Open Parts and choose a component to fit to the movement.',
  );
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number }>();
  const gesture = useRef<{
    pointer: number;
    item: PartItem;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const commitRef = useRef<(item: PartItem, distance: number) => void>(
    () => {},
  );
  const cancelRef = useRef<() => void>(() => {});
  const finished = session.cursor >= OPERATIONS.length;
  const installed = new Set(componentIds(session.cursor));
  const available = (item: PartItem) =>
    !PARTS[item].every((id) => installed.has(id));

  function cancel(message = 'Placement cancelled. No attempt counted.') {
    gesture.current = null;
    viewer.current?.movePreview();
    setDragPoint(undefined);
    setSelected(undefined);
    setFeedback(message);
    partsButton.current?.focus();
  }
  function choose(item: PartItem) {
    if (!ready || finished || !available(item)) return;
    setSelected(item);
    setPanel(null);
    setFeedback(
      `${LABELS[item]} selected. Drag onto the movement or choose Place on movement.`,
    );
  }
  function attempt(item: PartItem, distanceMm: number) {
    if (!ready || finished) return;
    const result = commitAttempt(
      session,
      {
        id: crypto.randomUUID(),
        runId: session.runId,
        revision: session.revision,
        item,
        destination: 'movement',
        distanceMm,
        kind: 'place',
        tool: null,
        side,
        support,
      },
      LESSON.placementRadiusMm,
      { requireTool: false },
    );
    setSession(result.session);
    setFeedback(
      result.accepted
        ? `${LABELS[item]} fitted. ${result.session.cursor === OPERATIONS.length ? 'Practice complete — the winding bridge and screws are fitted.' : 'Choose the next part from Parts.'}`
        : result.message,
    );
    if (result.accepted) {
      setSelected(undefined);
      partsButton.current?.focus();
    }
  }
  useLayoutEffect(() => {
    commitRef.current = attempt;
    cancelRef.current = () => cancel();
  });
  useLayoutEffect(() => {
    viewer.current?.update(session.cursor, selected, side);
  }, [session.cursor, selected, side, ready]);
  useEffect(() => {
    let live = true;
    let instance: WorkshopViewer | undefined;
    try {
      instance = new WorkshopViewer(host.current!, setSeat, (message) => {
        if (live) {
          setReady(false);
          setError(message);
          gesture.current = null;
          setDragPoint(undefined);
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
      instance?.dispose();
      viewer.current = null;
    };
  }, [retry]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = gesture.current;
      if (!drag || drag.pointer !== event.pointerId) return;
      drag.moved ||=
        Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6;
      if (!drag.moved) return;
      const point = { x: event.clientX, y: event.clientY };
      setDragPoint(point);
      viewer.current?.movePreview(point);
    };
    const release = (event: PointerEvent) => {
      const drag = gesture.current;
      if (!drag || drag.pointer !== event.pointerId) return;
      gesture.current = null;
      const instance = viewer.current,
        rect = host.current!.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (drag.moved && inside && instance)
        commitRef.current(
          drag.item,
          instance.distance({ x: event.clientX, y: event.clientY }),
        );
      else if (drag.moved) cancelRef.current();
      else cancelButton.current?.focus();
      instance?.movePreview();
      setDragPoint(undefined);
    };
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !document.querySelector('.workshop-panel:not([data-ending-style])')
      )
        cancelRef.current();
    };
    const abort = () => {
      if (gesture.current) cancelRef.current();
    };
    const hidden = () => {
      if (document.hidden) abort();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', abort);
    window.addEventListener('blur', abort);
    window.addEventListener('keydown', escape);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', abort);
      window.removeEventListener('blur', abort);
      window.removeEventListener('keydown', escape);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);

  return (
    <main
      className="watchmaker-workshop"
      data-cursor={session.cursor}
      data-mistakes={session.mistakes}
    >
      <header className="workshop-header">
        <Link href="/" aria-label="Back to Explorer">
          <ArrowLeft />
        </Link>
        <div>
          <h1>Be a watchmaker!</h1>
          <small>Practice checkpoint · progress resets on reload</small>
        </div>
      </header>
      <section className="workshop-context">
        <p>
          {finished
            ? 'Practice complete: winding bridge and two screws fitted.'
            : OPERATIONS[session.cursor].label}
        </p>
      </section>
      <section className="workshop-workspace">
        <div
          className="workshop-surface"
          ref={host}
          onLostPointerCapture={() => {
            if (gesture.current) cancel();
          }}
        />
        <span className="workshop-assembly-label">
          Movement · winding-bridge practice
        </span>
        {selected && ready && (
          <button
            className="workshop-seat"
            aria-label={`Place ${LABELS[selected]} on movement`}
            style={{
              left: Math.max(24, Math.min(seat.width - 24, seat.x)),
              top: Math.max(24, Math.min(seat.height - 24, seat.y)),
            }}
            onClick={() => attempt(selected, 0)}
          >
            <span>+</span>
          </button>
        )}
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
        <output className="workshop-feedback" aria-live="polite">
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
              <button
                ref={cancelButton}
                aria-label="Cancel placement"
                onClick={() => cancel()}
              >
                <X />
              </button>
            </>
          ) : (
            <span>
              {finished ? 'Practice complete' : 'Pick a part to begin'}
            </span>
          )}
        </div>
        {selected && (
          <div
            className="workshop-destinations"
            aria-label="Choose placement destination"
          >
            <button disabled={!ready} onClick={() => attempt(selected, 0)}>
              Place on movement
            </button>
          </div>
        )}
        <div className="workshop-actions">
          <button
            ref={partsButton}
            disabled={!ready}
            aria-expanded={panel === 'parts'}
            onClick={() => setPanel('parts')}
          >
            <PackageOpen />
            Parts
          </button>
          <button
            disabled={!ready || finished}
            aria-label="Placement setup"
            onClick={() => setPanel('setup')}
          >
            <Settings2 />
            Placement options
          </button>
          <button
            aria-label="Reset practice"
            onClick={() => {
              cancel('Practice reset. Choose a part from Parts.');
              setSession(checkpoint());
              setSide('movement');
              setSupport('movement');
            }}
          >
            <RotateCcw />
          </button>
        </div>
      </footer>
      {dragPoint && selected && (
        <div
          className="workshop-drag-label"
          style={{
            left: Math.max(
              8,
              Math.min(window.innerWidth - 210, dragPoint.x + 16),
            ),
            top: Math.max(8, dragPoint.y - 48),
          }}
        >
          {LABELS[selected]}
        </div>
      )}
      <Sheet
        modal={false}
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="workshop-panel"
          showOverlay={false}
          finalFocus={() =>
            gesture.current
              ? false
              : selected
                ? cancelButton.current
                : partsButton.current
          }
        >
          <SheetHeader>
            <SheetTitle>
              {panel === 'setup' ? 'Placement setup' : 'Parts'}
            </SheetTitle>
            <SheetDescription>
              {panel === 'setup'
                ? 'Orientation and support are retained until you change them.'
                : 'Tap a part to select it, or drag its preview onto the active assembly.'}
            </SheetDescription>
          </SheetHeader>
          {panel === 'setup' ? (
            <div className="workshop-setup">
              <fieldset>
                <legend>Part side upward</legend>
                {(['movement', 'dial'] as const).map((value) => (
                  <button
                    key={value}
                    aria-pressed={side === value}
                    onClick={() => setSide(value)}
                  >
                    {value}
                  </button>
                ))}
              </fieldset>
              <fieldset>
                <legend>Support</legend>
                {([null, 'movement', 'dial'] as const).map((value) => (
                  <button
                    key={value ?? 'none'}
                    aria-pressed={support === value}
                    onClick={() => setSupport(value)}
                  >
                    {value ?? 'None'}
                  </button>
                ))}
              </fieldset>
              <button onClick={() => setPanel(null)}>Done</button>
            </div>
          ) : (
            <>
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
                      data-item={item}
                      disabled={!available(item) || finished}
                      onPointerDown={(event) => {
                        if (!event.isPrimary || event.button !== 0 || !ready)
                          return;
                        event.preventDefault();
                        choose(item);
                        gesture.current = {
                          pointer: event.pointerId,
                          item,
                          x: event.clientX,
                          y: event.clientY,
                          moved: false,
                        };
                        // Capture on the persistent surface before the outgoing sheet unmounts.
                        host.current?.setPointerCapture(event.pointerId);
                      }}
                      onClick={(event) => {
                        if (event.detail === 0) choose(item);
                      }}
                      aria-label={`Pick ${LABELS[item]}`}
                    >
                      <Image
                        src={thumbnails[item] ?? ''}
                        alt=""
                        width={120}
                        height={100}
                        unoptimized
                      />
                      <span className="sr-only">Pick up</span>
                    </button>
                    <button
                      disabled={!available(item) || finished}
                      onClick={() => choose(item)}
                    >
                      <span>
                        {LABELS[item]}
                        <small>
                          {available(item) ? 'Available' : 'Installed'} ·{' '}
                          Movement
                        </small>
                      </span>
                    </button>
                  </div>
                ))}
                {!ITEMS.some(
                  (item) =>
                    matchesPart(normalizeSearch(LABELS[item]), query) &&
                    (group === 'all' ||
                      available(item) === (group === 'available')),
                ) && <p>No matching parts.</p>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
