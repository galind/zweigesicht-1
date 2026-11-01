'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Link from 'next/link';
import {
  Hand,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Pause,
  Play,
  Undo2,
  RotateCcw,
  ArrowLeft,
  Maximize,
  MoreHorizontal,
  X,
  MousePointer2,
  HelpCircle,
} from 'lucide-react';
import {
  AssemblyViewer,
  type Drop,
  type SurfaceLayout,
  type Point,
} from './AssemblyViewer';
import {
  OPERATIONS,
  LABELS,
  LESSON,
  arrangement,
  type Item,
  type Tool,
  type Side,
} from './lesson';
import {
  ActiveClock,
  STORAGE_KEY,
  createSession,
  commitAttempt,
  readSession,
  saveSession,
  score,
  undo,
  type Session,
  type Attempt,
} from './session';
import './assembly.css';

const TOOL_LABELS: Record<Tool, string> = {
  hands: 'Hands',
  tweezers: 'Tweezers',
  screwdriver: 'Screwdriver',
};
function ToolIcon({ tool }: { tool: Tool }) {
  if (tool === 'hands') return <Hand aria-hidden="true" />;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tool === 'tweezers' ? (
        <path d="M7 3c-2 0-3 2-2 4l6 14M7 3l12 15M7 3l8 16M11 21l1-5m7 2-5-2" />
      ) : (
        <>
          <path d="m14 3 7 7-3 3-7-7zM12 9l-8 8-1 4 4-1 8-8M15 5l4 4" />
        </>
      )}
    </svg>
  );
}
const storage = () => window.localStorage;
const duration = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

export default function Assembly() {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<AssemblyViewer | null>(null);
  const current = useRef<Session | null>(null);
  const gesture = useRef<{
    id: string;
    runId: string;
    revision: number;
    tool: Tool | null;
    side: Side;
    support: Side;
  } | null>(null);
  const commitRef = useRef<(drop: Drop) => void>(() => {});
  const pickRef = useRef<(item: Item, event: PointerEvent) => void>(() => {});
  const [session, setSession] = useState<Session | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [tool, setTool] = useState<Tool | null>(null);
  const toolRef = useRef<Tool | null>(null);
  const toolTouchUntil = useRef(0);
  const [selected, setSelected] = useState<Item>();
  const [side, setSide] = useState<Side>('movement');
  const [support, setSupport] = useState<Side>('movement');
  const [feedback, setFeedback] = useState('');
  const [feedbackPoint, setFeedbackPoint] = useState<Point>();
  const [accepted, setAccepted] = useState(false);
  const [layout, setLayout] = useState<SurfaceLayout>({ items: [], zones: [] });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState<Item>();
  const [changingSupport, setChangingSupport] = useState(false);
  const [panel, setPanel] = useState<'menu' | 'help' | 'review' | null>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const lastLayout = useRef('');
  const [hint, setHint] = useState(false);
  const [radius, setRadius] = useState(LESSON.placementRadiusMm);
  const [restartOpen, setRestartOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const cursor = session?.cursor ?? 0;
  const complete = cursor === OPERATIONS.length;
  const active =
    ready && !paused && !!session && !complete && !restartOpen && !panel;
  const next = OPERATIONS[cursor];

  function persist(value: Session) {
    if (!saveSession(value, storage))
      setSaveNotice(
        'Saving is unavailable. Keep this page open to retain this attempt.',
      );
  }
  function apply(value: Session) {
    current.current = value;
    setSession(value);
    setElapsed(value.elapsedMs);
    persist(value);
  }
  function cancelGesture() {
    viewer.current?.cancel();
    gesture.current = null;
  }
  function chooseTool(value: Tool) {
    cancelGesture();
    toolRef.current = value;
    setTool(value);
  }
  function itemSide(item: Item): Side {
    if (selected === item) return side;
    if (
      ['mainplate', 'stem', 'wheel', 'coupling', 'stem-assembly'].includes(item)
    )
      return 'movement';
    return arrangement(current.current?.cursor ?? 0).side;
  }
  function choose(item: Item) {
    cancelGesture();
    if (changingSupport && item.startsWith('support-')) {
      setSupport(item === 'support-dial' ? 'dial' : 'movement');
      setChangingSupport(false);
      setFeedback('Support chosen. Seat the movement when ready.');
      return;
    }
    setSide(itemSide(item));
    setSelected(item);
    setFeedback('');
  }
  function beginGesture(
    item: Item,
    event: { pointerId: number; clientX: number; clientY: number },
    element: HTMLElement,
    surface = false,
  ) {
    const value = current.current;
    if (changingSupport) {
      if (item.startsWith('support-')) choose(item);
      return;
    }
    const chosenSide = itemSide(item);
    setSide(chosenSide);
    setSelected(item);
    setFeedback('');
    if (!active || !value) return;
    gesture.current = {
      id: crypto.randomUUID(),
      runId: value.runId,
      revision: value.revision,
      tool: toolRef.current,
      side: chosenSide,
      support,
    };
    viewer.current?.begin(item, event, element, surface);
  }
  function attempt(drop: Drop, kind?: Attempt['kind']) {
    const value = current.current;
    if (!value || !active) return;
    const captured = gesture.current ?? {
      id: crypto.randomUUID(),
      runId: value.runId,
      revision: value.revision,
      tool: toolRef.current,
      side,
      support,
    };
    gesture.current = null;
    const looseStem = value.cursor >= 6 && value.cursor < 10;
    const operationKind =
      kind ??
      (drop.destination.endsWith('-rest')
        ? 'aside'
        : drop.item === 'movement'
          ? arrangement(value.cursor).movement === 'aside'
            ? 'return'
            : 'flip'
          : drop.item === 'stem-assembly'
            ? 'insert'
            : 'place');
    const result = commitAttempt(
      value,
      {
        ...drop,
        ...captured,
        kind: operationKind,
        support: looseStem ? null : captured.support,
      },
      radius,
    );
    if (result.session === value) return;
    apply(result.session);
    setAccepted(result.accepted);
    const surface = host.current?.getBoundingClientRect();
    const point =
      drop.point ??
      viewer.current?.project(
        viewer.current.target(drop.item, drop.destination),
      );
    if (surface && point)
      setFeedbackPoint({
        x: Math.max(120, Math.min(surface.width - 120, point.x - surface.left)),
        y: Math.max(
          20,
          Math.min(surface.height - 45, point.y - surface.top - 45),
        ),
      });
    setFeedback(
      result.accepted
        ? value.cursor < value.awarded
          ? 'Placed · already scored'
          : '+10 · Placed'
        : result.message
            .replace(' (prototype tool assignment)', '')
            .replace(/^Next: (.*?)\. .*$/, 'First: $1.'),
    );
    setChangingSupport(false);
    if (result.accepted) {
      setSelected(undefined);
      setSide(arrangement(result.session.cursor).side);
      setSupport(arrangement(result.session.cursor).side);
    }
  }
  function restart() {
    viewer.current?.cancel();
    gesture.current = null;
    const value = createSession(crypto.randomUUID());
    apply(value);
    setPaused(false);
    setRestartOpen(false);
    setSide('movement');
    setSupport('movement');
    setSelected(undefined);
    toolRef.current = null;
    setTool(null);
    setPanel(null);
    setChangingSupport(false);
    setFeedback('');
  }

  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => {
      if (disposed) return;
      const saved = readSession(storage);
      if (saved.session) {
        current.current = saved.session;
        setSession(saved.session);
        setElapsed(saved.session.elapsedMs);
        const plan = arrangement(saved.session.cursor);
        setSide(plan.side);
        setSupport(plan.side);
        setFeedback('Your chapter is saved. Resume when you are ready.');
      } else if (saved.status === 'empty' || saved.status === 'unavailable') {
        const value = createSession(crypto.randomUUID());
        current.current = value;
        setSession(value);
        if (saved.status === 'unavailable')
          setSaveNotice(
            'Saving is unavailable. This attempt will stay in memory.',
          );
      } else
        setSaveNotice(
          'This chapter save cannot be read. Start a new chapter to replace it.',
        );
    });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!host.current) return;
    let controller: AssemblyViewer;
    try {
      controller = new AssemblyViewer(host.current, (loaded, message) => {
        setReady(loaded);
        setError(message);
      });
      viewer.current = controller;
      controller.onLayout = (value) => {
        const json = JSON.stringify(value);
        if (lastLayout.current !== json) {
          lastLayout.current = json;
          setLayout(value);
        }
      };
      controller.onDrag = setDragging;
      controller.onDrop = (drop) => commitRef.current(drop);
      controller.onPick = (item, event) => pickRef.current(item, event);
      void controller.load();
    } catch {
      queueMicrotask(() =>
        setError('3D could not start. Enable WebGL, then retry.'),
      );
      return;
    }
    return () => {
      controller.dispose();
      viewer.current = null;
    };
  }, [retry]);

  useLayoutEffect(() => {
    commitRef.current = (drop) => attempt(drop);
    pickRef.current = (item, event) =>
      beginGesture(item, event, viewer.current!.renderer.domElement, true);
  });
  useLayoutEffect(() => {
    if (session)
      viewer.current?.update(session, selected, side, active, hint, radius);
  }, [session, selected, side, active, hint, radius, ready, retry]);

  useEffect(() => {
    const clock = new ActiveClock();
    let frame = 0,
      lastSave = 0;
    const tick = (now: number) => {
      const value = current.current;
      const delta = clock.sample(
        now,
        active && !document.hidden && document.hasFocus(),
      );
      if (value && delta)
        current.current = { ...value, elapsedMs: value.elapsedMs + delta };
      if (now - lastSave >= 1000 && current.current) {
        lastSave = now;
        setElapsed(current.current.elapsedMs);
        if (active && !saveSession(current.current, storage))
          setSaveNotice('Saving is unavailable. Keep this page open.');
      }
      frame = requestAnimationFrame(tick);
    };
    const interrupt = () => {
      clock.sample(performance.now(), false);
      viewer.current?.cancel();
      gesture.current = null;
      if (current.current) saveSession(current.current, storage);
    };
    const hidden = () => {
      if (document.hidden) interrupt();
    };
    const suspend = () => {
      interrupt();
      setPaused(true);
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', interrupt);
    window.addEventListener('pagehide', suspend);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      interrupt();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', interrupt);
      window.removeEventListener('pagehide', suspend);
    };
  }, [active]);

  // A second tab may advance the ledger. Suspend and adopt its validated save rather than overwrite it.
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const saved = readSession(storage);
      if (saved.session) {
        viewer.current?.cancel();
        gesture.current = null;
        setPaused(true);
        current.current = saved.session;
        setSession(saved.session);
        setElapsed(saved.session.elapsedMs);
        setSelected(undefined);
        setSide(arrangement(saved.session.cursor).side);
        setSupport(arrangement(saved.session.cursor).side);
        setFeedback(
          'This chapter changed in another tab. Resume the latest saved state.',
        );
      }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  const blocked = !ready || (paused && !complete) || restartOpen || !session;
  useEffect(() => {
    if (blocked || panel) {
      if (!modal.current?.open) modal.current?.showModal();
    } else modal.current?.close();
  }, [blocked, panel]);

  const focusedItem = hovered ?? selected;
  const focusAnchor = layout.items.find((entry) => entry.item === focusedItem);
  const canTurn = selected === 'movement' || selected === 'mainplate';
  const targetLabel = (destination: Drop['destination']) =>
    destination === 'movement-rest'
      ? 'Set aside left'
      : destination === 'stem-rest'
        ? 'Set aside right'
        : destination === 'movement'
          ? 'Fit to movement'
          : destination === 'stem'
            ? 'Fit to stem'
            : 'Place in working area';
  function place(destination: Drop['destination']) {
    if (!selected) return;
    cancelGesture();
    attempt({ item: selected, destination, distanceMm: 0 });
  }
  function undoStep() {
    cancelGesture();
    if (!current.current) return;
    apply(undo(current.current));
    if (complete) setPaused(false);
    setSelected(undefined);
    setChangingSupport(false);
    setSide(arrangement(cursor - 1).side);
    setSupport(arrangement(cursor - 1).side);
    setFeedback('Undone · earned points are kept');
  }

  return (
    <main
      className="assembly-page"
      data-tool={tool ?? 'none'}
      data-dragging={dragging}
    >
      <header className="assembly-header">
        <Link href="/" aria-label="Back to Zweigesicht-1">
          <ArrowLeft />
        </Link>
        <div className="assembly-title">
          <h1>Be a watchmaker!</h1>
          <span>01 / The winding assembly</span>
        </div>
        <dl className="assembly-stats">
          <div>
            <dt>Score</dt>
            <dd>{session ? score(session) : 0}</dd>
          </div>
          <div>
            <dt>Active time</dt>
            <dd>{duration(elapsed)}</dd>
          </div>
          <div>
            <dt>Progress</dt>
            <dd>
              {cursor}
              <small> / 15</small>
            </dd>
          </div>
        </dl>
        <button
          aria-label="Workshop menu"
          onClick={() => {
            cancelGesture();
            setPanel('menu');
          }}
        >
          <MoreHorizontal />
        </button>
      </header>

      <section className="assembly-instruction" aria-label="Current operation">
        <span className="assembly-step">
          {complete ? '✓' : String(cursor + 1).padStart(2, '0')}
        </span>
        <h2>{complete ? 'The winding bridge is installed.' : next.label}</h2>
        <progress max={15} value={cursor} aria-label="Chapter progress" />
      </section>

      <div className="assembly-surface-wrap">
        <div className="assembly-surface" ref={host} />
        <span className="assembly-surface-caption" aria-hidden="true">
          ZWEIGESICHT–1 <i>At the watchmaker’s bench</i>
        </span>
        <div className="assembly-parts" aria-label="Parts on the surface">
          {layout.items.map((entry) => (
            <button
              key={entry.item}
              type="button"
              className="assembly-part"
              data-item={entry.item}
              style={{
                left: entry.x,
                top: entry.y,
                width: entry.width,
                height: entry.height,
              }}
              aria-label={LABELS[entry.item]}
              aria-pressed={selected === entry.item}
              disabled={!active}
              data-support-choice={
                changingSupport && entry.item.startsWith('support-')
              }
              onFocus={() => setHovered(entry.item)}
              onBlur={() => setHovered(undefined)}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'touch') setHovered(entry.item);
              }}
              onPointerLeave={() => setHovered(undefined)}
              onClick={(event) => {
                if (event.detail === 0) choose(entry.item);
              }}
              onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
                if (event.isPrimary && event.button === 0)
                  beginGesture(entry.item, event, event.currentTarget, true);
              }}
            >
              <span className="assembly-part-dot" aria-hidden="true" />
            </button>
          ))}
        </div>
        {focusAnchor && !dragging && (
          <span
            className="assembly-part-name"
            style={{
              left: focusAnchor.x,
              top: focusAnchor.y + focusAnchor.height / 2 + 7,
            }}
          >
            {LABELS[focusAnchor.item]}
          </span>
        )}
        {layout.zones.map((zone) => (
          <div
            className="assembly-zone"
            key={zone.destination}
            style={{ left: zone.x, top: zone.y }}
            data-active={!!selected}
          >
            <span aria-hidden="true">
              {zone.destination.endsWith('-rest')
                ? zone.destination === 'movement-rest'
                  ? 'Movement'
                  : 'Stem'
                : 'Working area'}
            </span>
            {selected && !changingSupport && !dragging && (
              <button
                disabled={!active}
                onClick={() => place(zone.destination)}
              >
                {targetLabel(zone.destination)}
              </button>
            )}
          </div>
        ))}
        {feedback && feedbackPoint && (
          <output
            key={session?.revision}
            className="assembly-feedback assembly-action-feedback"
            data-accepted={accepted}
            aria-live="polite"
            style={{ left: feedbackPoint.x, top: feedbackPoint.y }}
          >
            {feedback}
          </output>
        )}
        <div className="assembly-view-controls" aria-label="View controls">
          <button
            aria-label="Zoom in"
            onClick={() => viewer.current?.zoom(1.25)}
          >
            <ZoomIn />
          </button>
          <button
            aria-label="Zoom out"
            onClick={() => viewer.current?.zoom(0.8)}
          >
            <ZoomOut />
          </button>
          <button
            aria-label="Show all parts"
            onClick={() => viewer.current?.resetView()}
          >
            <Maximize />
          </button>
        </div>
      </div>

      <div className="assembly-action-space">
        <output
          key={session?.revision}
          className="assembly-feedback"
          data-accepted={accepted}
          aria-live="polite"
        >
          {(!feedbackPoint && feedback) ||
            (changingSupport
              ? 'Choose either red support on the surface.'
              : '')}
        </output>
        {selected && !dragging ? (
          <section
            className="assembly-selection"
            aria-label="Selected part actions"
          >
            <div className="assembly-selected-name">
              <strong>{LABELS[selected]}</strong>
              {canTurn && (
                <small>
                  {side === 'movement' ? 'Movement' : 'Dial'} side up ·{' '}
                  {support}-side support
                </small>
              )}
            </div>
            {canTurn && (
              <button
                aria-label="Turn over"
                onClick={() => {
                  cancelGesture();
                  setSide(side === 'movement' ? 'dial' : 'movement');
                }}
              >
                <RotateCw />
                <span>Turn over</span>
              </button>
            )}
            {selected === 'movement' && (
              <button
                aria-pressed={changingSupport}
                onClick={() => {
                  cancelGesture();
                  setChangingSupport(!changingSupport);
                }}
              >
                Change support
              </button>
            )}
            <button
              aria-label="Cancel selection"
              onClick={() => {
                cancelGesture();
                setSelected(undefined);
                setSide(arrangement(cursor).side);
                setSupport(arrangement(cursor).side);
                setChangingSupport(false);
                setFeedback('');
              }}
            >
              <X />
            </button>
          </section>
        ) : (
          <p className="assembly-guidance">
            {complete
              ? 'Chapter complete. Your work is saved.'
              : dragging
                ? 'Release to place · Escape to cancel'
                : 'Choose a tool. Pick up a part. Make it yours.'}
          </p>
        )}
      </div>

      <footer className="assembly-toolbar">
        <fieldset className="assembly-tool-buttons" aria-label="Tools">
          {(['hands', 'tweezers', 'screwdriver'] as Tool[]).map((value) => (
            <button
              key={value}
              aria-pressed={tool === value}
              onPointerUp={(event) => {
                if (event.pointerType !== 'touch' || !event.isPrimary) return;
                const rect = event.currentTarget.getBoundingClientRect();
                if (
                  event.clientX < rect.left ||
                  event.clientX > rect.right ||
                  event.clientY < rect.top ||
                  event.clientY > rect.bottom
                )
                  return;
                // Browsers may suppress the compatibility click immediately after a drag.
                toolTouchUntil.current = performance.now() + 700;
                chooseTool(value);
              }}
              onClick={(event) => {
                // Keyboard activation has detail 0; ignore only duplicate pointer clicks.
                if (
                  event.detail > 0 &&
                  performance.now() < toolTouchUntil.current
                )
                  return;
                chooseTool(value);
              }}
            >
              <ToolIcon tool={value} />
              <span>{TOOL_LABELS[value]}</span>
            </button>
          ))}
        </fieldset>
        <div className="assembly-session-controls">
          <button
            aria-label="Undo"
            disabled={!session || !cursor || (!active && !complete)}
            onClick={undoStep}
          >
            <Undo2 />
            <span>Undo</span>
          </button>
          <button
            aria-label={paused ? 'Resume' : 'Pause'}
            disabled={!session || !ready || complete}
            onClick={() => {
              cancelGesture();
              setPaused(!paused);
            }}
          >
            {paused ? <Play /> : <Pause />}
            <span>{paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            aria-label="How to play"
            onClick={() => {
              cancelGesture();
              setPanel('help');
            }}
          >
            <HelpCircle />
          </button>
        </div>
      </footer>
      {saveNotice && (
        <output className="assembly-save-notice">{saveNotice}</output>
      )}

      <dialog
        ref={modal}
        className="assembly-dialog"
        onCancel={(event) => {
          event.preventDefault();
          if (panel) setPanel(null);
          else if (restartOpen) setRestartOpen(false);
        }}
      >
        {restartOpen ? (
          <>
            <h2>Restart this chapter?</h2>
            <p>This replaces this chapter’s score, time and progress.</p>
            <button onClick={restart}>Start new chapter</button>
            <button onClick={() => setRestartOpen(false)}>
              Keep this attempt
            </button>
          </>
        ) : error ? (
          <>
            <h2>The surface could not load</h2>
            <p>{error}</p>
            <button
              onClick={() => {
                setReady(false);
                setError('');
                setRetry(retry + 1);
              }}
            >
              Retry
            </button>
          </>
        ) : !ready ? (
          <>
            <span className="assembly-eyebrow">Your watchmaking bench</span>
            <h2>Preparing your assembly surface</h2>
            <p>Arranging the parts and supports…</p>
          </>
        ) : !session ? (
          <>
            <h2>Start a new chapter</h2>
            <p>{saveNotice}</p>
            <button onClick={restart}>Start new chapter</button>
          </>
        ) : panel === 'menu' ? (
          <>
            <h2>Your bench</h2>
            <button onClick={() => setPanel('help')}>
              <MousePointer2 /> How to play
            </button>
            <button
              onClick={() => {
                setPanel(null);
                setRestartOpen(true);
              }}
            >
              <RotateCcw /> Restart
            </button>
            <button onClick={() => setPanel('review')}>
              Development / review
            </button>
            <button onClick={() => setPanel(null)}>Back to bench</button>
          </>
        ) : panel === 'help' ? (
          <>
            <h2>Take your place at the bench.</h2>
            <p>
              Select a tool, then drag a part to the working area. Tap or focus
              a part to see its name.
            </p>
            <p>
              Prefer not to drag? Select a part, then tap one of the three
              placement areas. With a keyboard, use Tab and Enter. The same
              tool, order, side and support rules apply.
            </p>
            <p>
              To turn the movement, select it, choose Turn over, then Change
              support and pick a red support. Place it back in the working area.
              Set assemblies aside using the left or right area.
            </p>
            <p>
              Escape cancels a drag for free. +10 per new operation, −2 per
              mistake. Undo keeps earned points.
            </p>
            <button onClick={() => setPanel(null)}>Back to bench</button>
          </>
        ) : panel === 'review' ? (
          <>
            <h2>Development / review</h2>
            <p>
              This interface is a proposed interpretation, not a Marco-approved
              design. Tool assignments, prepared components and screw numbering
              remain provisional.
            </p>
            <p>
              Recorded support seating does not establish partial-assembly
              stability or insertion paths. The separate stem, deferred Incabloc
              parts and original fitted geometry are retained. See
              docs/ASSEMBLY_CHAPTER_ONE.md for evidence.
            </p>
            <label>
              Placement radius{' '}
              <select
                aria-label="Placement radius"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
              >
                <option value={5}>5 mm</option>
                <option value={10}>10 mm (review)</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={hint}
                onChange={(event) => setHint(event.target.checked)}
              />{' '}
              Show selected part’s seat
            </label>
            <button onClick={() => setPanel(null)}>Back to bench</button>
          </>
        ) : (
          <>
            <span className="assembly-eyebrow">
              Chapter 01 · The winding assembly
            </span>
            <h2>
              {cursor
                ? 'Your assembly is waiting'
                : 'Every movement starts with a single part.'}
            </h2>
            <p>
              Fifteen operations. A clear work area. Choose your tools and bring
              the winding assembly together.
            </p>
            <p className="assembly-dialog-hint">
              Drag to assemble, or select a part and tap a placement area.
            </p>
            <button
              className="assembly-start"
              onClick={() => {
                setPaused(false);
                setFeedback('');
              }}
            >
              {cursor ? 'Resume chapter' : 'Start chapter'}
              <Play />
            </button>
          </>
        )}
      </dialog>
    </main>
  );
}
