'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Link from 'next/link';
import {
  Hand,
  Pencil,
  Wrench,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Pause,
  Play,
  Undo2,
  RotateCcw,
} from 'lucide-react';
import { AssemblyViewer, type Drop } from './AssemblyViewer';
import {
  OPERATIONS,
  LABELS,
  LESSON,
  availableItems,
  arrangement,
  type Item,
  type Tool,
  type Side,
  type Destination,
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
const TOOL_ICONS = { hands: Hand, tweezers: Pencil, screwdriver: Wrench };
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
  const [selected, setSelected] = useState<Item>();
  const [side, setSide] = useState<Side>('movement');
  const [support, setSupport] = useState<Side>('movement');
  const [feedback, setFeedback] = useState(
    'Select a tool, then drag a part to the working area.',
  );
  const [hint, setHint] = useState(false);
  const [radius, setRadius] = useState(LESSON.placementRadiusMm);
  const [restartOpen, setRestartOpen] = useState(false);
  const [destination, setDestination] = useState<Destination>('work');
  const [retry, setRetry] = useState(0);
  const cursor = session?.cursor ?? 0;
  const complete = cursor === OPERATIONS.length;
  const active = ready && !paused && !!session && !complete && !restartOpen;
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
  function beginGesture(
    item: Item,
    event: { pointerId: number; clientX: number; clientY: number },
    element: HTMLElement,
    surface = false,
  ) {
    const value = current.current;
    setSelected(item);
    if (!active || !value) return;
    gesture.current = {
      id: crypto.randomUUID(),
      runId: value.runId,
      revision: value.revision,
      tool,
      side,
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
      tool,
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
          ? 'return'
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
    setFeedback(result.message);
    if (result.accepted) {
      setSelected(undefined);
      const following = OPERATIONS[result.session.cursor];
      // Preparation for a new assembly resets the placement controls. It never commits an action.
      if (
        following &&
        (result.session.cursor === 6 || result.session.cursor === 10)
      ) {
        setSide(following.side);
        setSupport(following.support ?? 'movement');
      }
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
    setTool(null);
    setFeedback(
      'Select a tool, then drag the movement-side support into the centre.',
    );
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
        const next = OPERATIONS[saved.session.cursor];
        const plan = arrangement(saved.session.cursor);
        setSide(next?.side ?? plan.side);
        setSupport(next?.support ?? plan.side);
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

  useEffect(() => {
    commitRef.current = (drop) => attempt(drop);
    pickRef.current = (item, event) =>
      beginGesture(item, event, viewer.current!.renderer.domElement, true);
  });
  useEffect(() => {
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
        setFeedback(
          'This chapter changed in another tab. Resume the latest saved state.',
        );
      }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  const inventory = availableItems(cursor);
  const partButton = (item: Item) => (
    <button
      key={item}
      type="button"
      className={`assembly-part ${selected === item ? 'selected' : ''}`}
      aria-pressed={selected === item}
      disabled={!session || complete}
      onClick={() => setSelected(item)}
      onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
        if (event.button === 0) beginGesture(item, event, event.currentTarget);
      }}
    >
      <span>{LABELS[item]}</span>
      <small>
        {item.startsWith('support-')
          ? '3D-printed support'
          : item.includes('assembly') || item === 'movement'
            ? 'Move on this surface'
            : 'Inspect or drag'}
      </small>
    </button>
  );

  return (
    <main className="assembly-page" data-tool={tool ?? 'none'}>
      <header className="assembly-header">
        <div>
          <Link href="/">Zweigesicht-1</Link>
          <h1>Be a watchmaker: Assembly</h1>
          <p>Chapter 1 · The winding assembly</p>
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
            <dd>{cursor} / 15</dd>
          </div>
        </dl>
        <div className="assembly-session-controls">
          <button
            disabled={!session || !ready || complete}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play /> : <Pause />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            disabled={!session || !cursor || !active}
            onClick={() => {
              if (current.current) {
                apply(undo(current.current));
                setSelected(undefined);
                setSide(arrangement(cursor - 1).side);
                setSupport(arrangement(cursor - 1).side);
                setFeedback(
                  'Undone. Points already earned will not be awarded again.',
                );
              }
            }}
          >
            <Undo2 />
            Undo
          </button>
          <button
            onClick={() => {
              setRestartOpen(true);
              viewer.current?.cancel();
            }}
          >
            <RotateCcw />
            Restart
          </button>
        </div>
      </header>
      <section className="assembly-instruction" aria-label="Current operation">
        <div>
          <span className="assembly-eyebrow">
            {complete ? 'Chapter complete' : `Operation ${cursor + 1} of 15`}
          </span>
          <h2>{complete ? 'The winding bridge is installed.' : next.label}</h2>
          <p>
            {complete
              ? 'This completes the first chapter. The rest of the movement is still unassembled.'
              : `${TOOL_LABELS[next.tool]} · ${next.side} side up${next.support ? ` · ${next.support}-side support` : ' · clear central area'}`}
          </p>
        </div>
        <progress max={15} value={cursor} aria-label="Chapter progress" />
      </section>
      <div className="assembly-surface-wrap">
        <aside
          className="assembly-tray assembly-tray-left"
          aria-label="Mainplate and setting parts"
        >
          <h3>Mainplate & setting</h3>
          {inventory
            .filter((item) =>
              [
                'mainplate',
                'setting-screw',
                'setting-lever',
                'movement',
              ].includes(item),
            )
            .map(partButton)}
        </aside>
        <div className="assembly-surface" ref={host} />
        <div className="assembly-zone assembly-zone-left">Movement aside</div>
        <div className="assembly-zone assembly-zone-centre">Working area</div>
        <div className="assembly-zone assembly-zone-right">Stem aside</div>
        <aside
          className="assembly-tray assembly-tray-right"
          aria-label="Winding parts"
        >
          <h3>Stem & winding bridge</h3>
          {inventory
            .filter((item) =>
              [
                'stem',
                'wheel',
                'coupling',
                'bridge',
                'bridge-screw-1',
                'bridge-screw-2',
                'stem-assembly',
              ].includes(item),
            )
            .map(partButton)}
        </aside>
        <div className="assembly-view-controls">
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
          <label>
            <input
              type="checkbox"
              checked={hint}
              onChange={(e) => setHint(e.target.checked)}
            />
            Show seat
          </label>
        </div>
        {(!ready || (paused && !complete) || restartOpen || !session) && (
          <div className="assembly-overlay">
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
                <p>
                  The two recorded support models must be available alongside
                  the movement.
                </p>
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
                <h2>Preparing your assembly surface</h2>
                <p>Loading the movement and the two existing supports…</p>
              </>
            ) : !session ? (
              <>
                <h2>Start a new chapter</h2>
                <p>{saveNotice}</p>
                <button onClick={restart}>Start new chapter</button>
              </>
            ) : (
              <>
                <h2>
                  {cursor
                    ? 'Your assembly is waiting'
                    : 'Begin at an empty work area'}
                </h2>
                <p>
                  Choose a tool, then drag a part. Click to inspect; Escape or a
                  drop outside the surface cancels for free.
                </p>
                <button onClick={() => setPaused(false)}>
                  {cursor ? 'Resume chapter' : 'Start chapter'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <section className="assembly-tools" aria-label="Tools and supports">
        <div>
          <h3>
            Tools <small>provisional</small>
          </h3>
          <div className="assembly-tool-buttons">
            {(['hands', 'tweezers', 'screwdriver'] as Tool[]).map((value) => {
              const Icon = TOOL_ICONS[value];
              return (
                <button
                  key={value}
                  aria-pressed={tool === value}
                  onClick={() => {
                    viewer.current?.cancel();
                    setTool(value);
                  }}
                >
                  <Icon />
                  {TOOL_LABELS[value]}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h3>Supports</h3>
          <div className="assembly-support-buttons">
            {(['movement', 'dial'] as Side[]).map((value) => (
              <div key={value}>
                {partButton(`support-${value}`)}
                <label>
                  <input
                    type="radio"
                    name="assembly-support"
                    checked={support === value}
                    onChange={() => {
                      viewer.current?.cancel();
                      setSupport(value);
                    }}
                  />
                  Use for turn / return
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="assembly-turn">
          <label>
            Placement / turn side
            <select
              aria-label="Placement / turn side"
              value={side}
              onChange={(e) => {
                viewer.current?.cancel();
                setSide(e.target.value as Side);
              }}
            >
              <option value="movement">Movement side upward</option>
              <option value="dial">Dial side upward</option>
            </select>
          </label>
          <button
            disabled={!active}
            onClick={() => {
              gesture.current = null;
              attempt(
                { item: 'movement', destination: 'work', distanceMm: 0 },
                'flip',
              );
            }}
          >
            <RotateCw />
            Turn & exchange support
          </button>
        </div>
      </section>
      <output className="assembly-feedback" aria-live="polite">
        {feedback}
      </output>
      {saveNotice && (
        <output className="assembly-save-notice">{saveNotice}</output>
      )}
      <details className="assembly-review">
        <summary>Placement controls & prototype notes</summary>
        <p>
          Tool assignments are provisional. The holder poses follow recorded
          mainplate seating; fit and stability of these partial assemblies still
          need Marco’s review. The stem rests in the clear area without claiming
          a fit in either holder.
        </p>
        <p>
          The prepared mainplate includes its existing pins and fixed jewels.
          The five Incabloc components and two later cap-plate screws are
          reserved for a future chapter. Bridge screw order is provisional.
        </p>
        <label>
          Placement radius{' '}
          <select
            aria-label="Placement radius"
            value={radius}
            onChange={(e) => {
              viewer.current?.cancel();
              setRadius(Number(e.target.value));
            }}
          >
            <option value={5}>5 mm</option>
            <option value={10}>10 mm (review)</option>
          </select>
        </label>
        <p>
          Keyboard alternative: select a labelled part and tool, choose a
          destination, then place it at the exact seat. The same sequence, tool,
          side and support checks apply.
        </p>
        <div className="assembly-keyboard">
          <label>
            Destination
            <select
              aria-label="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value as Destination)}
            >
              <option value="work">Working area</option>
              <option value="movement">Movement seat</option>
              <option value="stem">Stem seat</option>
              <option value="movement-rest">Movement aside (left)</option>
              <option value="stem-rest">Stem aside (right)</option>
            </select>
          </label>
          <button
            disabled={!active || !selected}
            onClick={() => {
              if (selected) {
                gesture.current = null;
                attempt({ item: selected, destination, distanceMm: 0 });
              }
            }}
          >
            Place selected part at seat
          </button>
        </div>
        <p>
          +10 once per operation · −2 per committed mistake · Undo retains the
          scoring ledger · No penalty for inspection or cancelled drags.
        </p>
      </details>
    </main>
  );
}
