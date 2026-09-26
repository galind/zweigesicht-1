'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  Undo2,
  LocateFixed,
  ListRestart,
  Lightbulb,
  Gauge,
  ArrowLeft,
  MoveUpRight,
  Wrench,
} from 'lucide-react';
import {
  TextButton as Control,
  FlipButton,
  ResetViewButton,
} from '@/components/viewer-controls';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import authored from '../../../assets/authored/play-manifest.json';
import {
  actions,
  assembledLeafIds,
  canPlace,
  commitPlacement,
  createSession,
  fittedLeafIds,
  getSavedSession,
  isComplete,
  missingPrerequisites,
  saveSession,
  undoPlacement,
  workspaceLeafIds,
} from './state';
import type { PlayLevel, PlayManifest, PlaySession, PlayStep } from './types';
import { PlayViewer, type PlayViewStatus } from './PlayViewer';
import { useTextScalePreview } from '../experience/useTextScalePreview';
import './play.css';

const manifest = authored as PlayManifest;
const blank: PlayViewStatus = {
  ready: false,
  busy: false,
  error: '',
  cutaway: false,
  side: 'front',
};

function Thumbnail({
  step,
  viewer,
  ready,
}: {
  step: PlayStep;
  viewer: () => PlayViewer | null;
  ready: boolean;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!host.current || !ready) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        timer = setTimeout(() => {
          setSrc(viewer()?.thumbnail(step) ?? null);
        }, 0);
        observer.disconnect();
      },
      { rootMargin: '80px' },
    );
    observer.observe(host.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [step, viewer, ready]);
  return (
    <span className="play-thumbnail" ref={host}>
      {src && <span style={{ backgroundImage: `url(${src})` }} />}
    </span>
  );
}

export default function Play() {
  useTextScalePreview();
  const app = useRef<HTMLElement>(null),
    host = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLButtonElement>(null),
    destination = useRef<HTMLButtonElement>(null);
  const savedCamera = useRef<ReturnType<PlayViewer['captureCamera']> | null>(
    null,
  );
  const viewer = useRef<PlayViewer | null>(null),
    sessionRef = useRef<PlaySession | null>(null);
  const activeRef = useRef(false),
    selectionRef = useRef<string | null>(null),
    workspaceRef = useRef<string | null>(null),
    assistanceRef = useRef(false);
  const [session, setSession] = useState<PlaySession | null>(null),
    [active, setActive] = useState(false);
  const [selection, setSelection] = useState<string | null>(null),
    [workspace, setWorkspace] = useState<string | null>(null);
  const [assistance, setAssistance] = useState(false),
    [group, setGroup] = useState(manifest.groups[0].id),
    [query, setQuery] = useState('');
  const [status, setStatus] = useState(blank),
    [storage, setStorage] = useState(''),
    [notice, setNotice] = useState('');
  const [help, setHelp] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [confirm, setConfirm] = useState<
    'restart' | 'levels' | PlayLevel | null
  >(null);
  const dialog = useRef<HTMLDialogElement>(null),
    lastFocus = useRef<HTMLElement | null>(null);
  const helpButton = useRef<HTMLButtonElement>(null),
    choiceTitle = useRef<HTMLHeadingElement>(null);
  const inventory = useRef<HTMLDivElement>(null),
    [headerBottom, setHeaderBottom] = useState(70);
  const scrollPositions = useRef(new Map<string, number>());
  const cardPointerHandled = useRef<string | null>(null);

  const sync = useCallback(() => {
    const controller = viewer.current,
      current = sessionRef.current;
    if (!controller) return;
    const selected =
      current && activeRef.current
        ? actions(manifest, current.level).find(
            (s) => s.id === selectionRef.current,
          )
        : null;
    const held =
      selected &&
      !current!.actionIds.includes(selected.id) &&
      selected.workspaceId === workspaceRef.current
        ? selected
        : null;
    controller.setAssistance(
      current?.hints ?? false,
      !!current && !!held && canPlace(manifest, current, held.id),
      assistanceRef.current,
    );
    controller.update(
      new Set(
        current
          ? workspaceRef.current
            ? workspaceLeafIds(manifest, current, workspaceRef.current)
            : fittedLeafIds(manifest, current)
          : manifest.initialLeafIds,
      ),
      held ?? null,
      activeRef.current,
    );
  }, []);
  const getViewer = useCallback(() => viewer.current, []);
  const persist = useCallback((next: PlaySession) => {
    sessionRef.current = next;
    setSession(next);
    setStorage(
      saveSession(manifest, next).status === 'saved'
        ? 'Saved on this device'
        : 'Saving is unavailable. Keep playing in this tab.',
    );
  }, []);
  const apply = useCallback(
    (next: PlaySession) => {
      persist(next);
      sync();
    },
    [persist, sync],
  );
  const pick = (id: string) => {
    selectionRef.current = id;
    setSelection(id);
    assistanceRef.current = false;
    setAssistance(false);
    setNotice('');
    sync();
  };
  const enterWorkspace = (id: string | null) => {
    if (status.busy) return;
    viewer.current?.setWorkspace(id);
    workspaceRef.current = id;
    setWorkspace(id);
    assistanceRef.current = false;
    setAssistance(false);
    setNotice('');
    sync();
  };
  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      const saved = getSavedSession(manifest);
      if (saved.status === 'saved') {
        sessionRef.current = saved.session;
        setSession(saved.session);
        sync();
      } else if (saved.status === 'corrupt' || saved.status === 'incompatible')
        setStorage(
          saved.status === 'incompatible'
            ? 'Your saved linear assembly is incompatible with free assembly. It stays saved until you explicitly start a new game.'
            : 'Your previous session cannot be restored. Choose a level to start again.',
        );
      else if (saved.status === 'unavailable')
        setStorage('Saving is unavailable. You can play in this tab.');
    });
    return () => {
      mounted = false;
    };
  }, [sync]);
  useEffect(() => {
    if (!host.current || !stage.current || !destination.current) return;
    let controller: PlayViewer;
    try {
      if (new URLSearchParams(location.search).get('no3d') === '1')
        throw new Error('3D disabled');
      controller = new PlayViewer(
        host.current,
        stage.current,
        destination.current,
        manifest,
        setStatus,
        (id) => {
          const previous = sessionRef.current;
          if (!previous) return;
          const next = commitPlacement(manifest, previous, id);
          if (next === previous) return;
          const step = actions(manifest, next.level).find((s) => s.id === id)!;
          apply(next);
          setNotice(
            isComplete(manifest, next)
              ? 'Your watch is assembled. Turn it over and take a look.'
              : `${step.label} ${step.kind === 'transfer' ? 'seated in the watch' : 'placed'}. Choose another piece.`,
          );
          // Keep focus on the player's chosen card; never select the next correct item.
          if (
            document.activeElement === stage.current ||
            document.activeElement === destination.current
          )
            app.current
              ?.querySelector<HTMLButtonElement>(`[data-action-id="${id}"]`)
              ?.focus({ preventScroll: true });
        },
        () => {},
        setNotice,
      );
      viewer.current = controller;
      sync();
      if (savedCamera.current) controller.restoreCamera(savedCamera.current);
      void controller.load();
      if (new URLSearchParams(location.search).has('inspect'))
        Object.assign(window, {
          __playInspect: () => ({
            ...controller.inspect(),
            session: sessionRef.current,
            active: activeRef.current,
            selection: selectionRef.current,
          }),
          __playAccessAudit: async () =>
            (await import('./accessAudit')).auditAccess(
              manifest,
              controller.pieces,
            ),
          __playContext: (restore = false) =>
            restore
              ? controller.renderer.forceContextRestore()
              : controller.renderer.forceContextLoss(),
        });
    } catch {
      queueMicrotask(() =>
        setStatus({
          ...blank,
          error: '3D could not start. Retry the view to continue.',
        }),
      );
    }
    return () => {
      if (controller) savedCamera.current = controller.captureCamera();
      controller?.dispose();
      viewer.current = null;
      const w = window as unknown as Record<string, unknown>;
      delete w.__playInspect;
      delete w.__playContext;
      delete w.__playAccessAudit;
    };
  }, [apply, sync, attempt]);
  useLayoutEffect(() => {
    const layout = () => {
      const bottom =
        app.current?.querySelector('.play-heading')?.getBoundingClientRect()
          .bottom ?? 70;
      setHeaderBottom(bottom);
      app.current?.style.setProperty('--play-header-bottom', `${bottom}px`);
      viewer.current?.layout();
    };
    layout();
    const observer = new ResizeObserver(layout);
    app.current
      ?.querySelectorAll(
        '.play-heading, .play-dock, .play-choice, .play-workspace',
      )
      .forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [active, status.ready]);
  useEffect(() => {
    if (confirm) {
      lastFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
      if (lastFocus.current?.isConnected) lastFocus.current.focus();
      lastFocus.current = null;
    }
  }, [confirm]);

  const disabled = !status.ready || status.busy;
  const all = session ? actions(manifest, session.level) : [];
  const selected = all.find((s) => s.id === selection) ?? null;
  const done = new Set(session?.actionIds ?? []);
  const fitted = selected ? done.has(selected.id) : false;
  const available =
    !!session && !!selected && canPlace(manifest, session, selected.id);
  const held =
    selected && !fitted && selected.workspaceId === workspace ? selected : null;
  const hints = session?.hints ?? false;
  const missing =
    selected && session && hints
      ? missingPrerequisites(manifest, session, selected.id)
      : [];
  const complete = !!session && isComplete(manifest, session);
  const count = session
    ? assembledLeafIds(manifest, session).length -
      manifest.initialLeafIds.length
    : 0;
  const physicalTotal =
    manifest.finalLeafIds.length - manifest.initialLeafIds.length;
  const packet = manifest.packets.find((p) => p.id === workspace);
  const selectedPacket = manifest.packets.find(
    (p) => p.id === selected?.workspaceId,
  );
  const gallery = all.filter(
    (s) =>
      (session?.level !== 'hard' || s.groupId === group) &&
      (!query || s.label.toLowerCase().includes(query.toLowerCase())),
  );
  const scrollKey = `${session?.level}:${group}:${query}`;
  useLayoutEffect(() => {
    const element = inventory.current;
    if (!element) return;
    const positions = scrollPositions.current;
    element.scrollLeft = positions.get(scrollKey) ?? 0;
    return () => {
      positions.set(scrollKey, element.scrollLeft);
    };
  }, [scrollKey]);
  const start = (level: PlayLevel) => {
    if (workspaceRef.current) enterWorkspace(null);
    selectionRef.current = null;
    setSelection(null);
    workspaceRef.current = null;
    setWorkspace(null);
    assistanceRef.current = false;
    setAssistance(false);
    activeRef.current = true;
    setActive(true);
    setQuery('');
    setGroup(manifest.groups[0].id);
    apply(createSession(manifest, level));
    requestAnimationFrame(() => {
      viewer.current?.layout();
      viewer.current?.resetView();
      inventory.current?.querySelector('button')?.focus();
    });
    setNotice(
      `${level === 'easy' ? 'Easy' : 'Hard'} assembly started. Choose any piece.`,
    );
  };
  const choose = (level: PlayLevel) =>
    session?.actionIds.length || storage.includes('incompatible')
      ? setConfirm(level)
      : start(level);
  const discard = () => {
    if (confirm === 'levels') {
      if (workspace) enterWorkspace(null);
      activeRef.current = false;
      setActive(false);
      sync();
      requestAnimationFrame(() => choiceTitle.current?.focus());
    } else if (confirm === 'restart' && session) start(session.level);
    else if (confirm === 'easy' || confirm === 'hard') start(confirm);
    setConfirm(null);
  };
  const reveal = () => {
    assistanceRef.current = true;
    setAssistance(true);
    viewer.current?.setAssistance(hints, available, true);
    viewer.current?.guide();
  };

  return (
    <main
      ref={app}
      className="play-app"
      data-active={active}
      data-workspace={!!workspace}
    >
      <div className="play-canvas" ref={host} />
      <header className="play-heading">
        <span>Zweigesicht–1</span>
        <span>Assembly</span>
        {active && (
          <Control
            aria-pressed={hints}
            disabled={disabled}
            onClick={() => {
              assistanceRef.current = false;
              setAssistance(false);
              setNotice('');
              if (session) apply({ ...session, hints: !hints });
            }}
          >
            <Lightbulb aria-hidden="true" /> Hints {hints ? 'on' : 'off'}
          </Control>
        )}
        <Control
          ref={helpButton}
          onClick={() => setHelp(!help)}
          aria-expanded={help}
          aria-controls="play-help"
        >
          How to play
        </Control>
      </header>
      {active && (
        <div className="play-workspace" style={{ top: headerBottom + 6 }}>
          {workspace ? (
            <>
              <span>
                <Wrench aria-hidden="true" /> Workbench · {packet?.label}
              </span>
              <Control disabled={disabled} onClick={() => enterWorkspace(null)}>
                <ArrowLeft aria-hidden="true" /> Return to watch
              </Control>
            </>
          ) : (
            <span>
              Watch ·{' '}
              {status.side === 'front' ? 'Three-hands face' : 'Skeleton face'}
            </span>
          )}
        </div>
      )}
      <Control
        ref={stage}
        className="play-stage"
        aria-label={held ? `Drag ${held.label}` : 'Picked-up piece'}
        disabled={disabled || !held || (hints && !available)}
        hidden={!held}
      >
        <span className="play-stage-caption" aria-hidden="true">
          Drag piece
        </span>
      </Control>
      <Control
        ref={destination}
        className="play-target"
        aria-label={
          held ? `Place ${held.label} at its destination` : 'Destination'
        }
        disabled={disabled || !held || !available}
        hidden={!held || !(hints || assistance)}
        onClick={() => viewer.current?.place()}
      >
        <span aria-hidden="true">＋</span>
      </Control>
      {!active && (
        <section className="play-choice" aria-labelledby="play-title">
          <h1 ref={choiceTitle} id="play-title" tabIndex={-1}>
            Assemble the movement
          </h1>
          <p>Choose the parts. Find their places. Take your time.</p>
          {session && (
            <Control
              className="play-primary"
              disabled={disabled}
              onClick={() => {
                activeRef.current = true;
                setActive(true);
                sync();
                requestAnimationFrame(() => {
                  viewer.current?.layout();
                  viewer.current?.resetView();
                });
              }}
            >
              Continue {session.level === 'easy' ? 'Easy' : 'Hard'} · {count} /{' '}
              {physicalTotal} parts
            </Control>
          )}
          <div className="play-levels">
            <Control disabled={disabled} onClick={() => choose('easy')}>
              <strong>Easy</strong>
              <span>Prepared assemblies · 89 choices</span>
            </Control>
            <Control disabled={disabled} onClick={() => choose('hard')}>
              <strong>Hard</strong>
              <span>249 individual parts · workbench</span>
            </Control>
          </div>
          <small>
            The fitted mainplate is ready in both levels. Hints start off.
          </small>
        </section>
      )}
      {active && (
        <section className="play-dock" aria-label="Assembly inventory">
          <div className="play-progress">
            <span>
              {session?.level === 'easy' ? 'Easy' : 'Hard'} · {count} /{' '}
              {physicalTotal} parts assembled
            </span>
            <span>
              {complete
                ? 'Complete'
                : `${session ? fittedLeafIds(manifest, session).length : 16} in watch`}
            </span>
          </div>
          <div className="play-inventory-tools">
            {session?.level === 'hard' && (
              <label>
                <span className="sr-only">Parts group</span>
                <select
                  aria-label="Parts group"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  {manifest.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label} ·{' '}
                      {
                        manifest.levels.hard.steps.filter(
                          (s) => s.groupId === g.id && !done.has(s.id),
                        ).length
                      }{' '}
                      parts ·{' '}
                      {
                        manifest.levels.hard.transfers.filter(
                          (s) => s.groupId === g.id && !done.has(s.id),
                        ).length
                      }{' '}
                      to seat
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="play-search">
              <span className="sr-only">Find a part</span>
              <input
                type="search"
                aria-label="Find a part"
                placeholder="Find a part…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <div
            className="play-gallery"
            ref={inventory}
            aria-label="Parts gallery. Swipe to browse, select a card to pick up a piece."
            onScroll={() => {
              if (inventory.current)
                scrollPositions.current.set(
                  scrollKey,
                  inventory.current.scrollLeft,
                );
            }}
          >
            {gallery.map((s) => {
              const contextLabel = manifest.packets.find(
                (p) => p.id === s.workspaceId,
              )?.label;
              const placed = done.has(s.id),
                unavailable =
                  hints &&
                  !!session &&
                  !placed &&
                  !canPlace(manifest, session, s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className="play-card"
                  data-action-id={s.id}
                  data-unavailable={unavailable}
                  data-fitted={placed}
                  data-draggable={
                    !placed && !unavailable && s.workspaceId === workspace
                  }
                  aria-pressed={selection === s.id}
                  aria-label={`${s.label}${contextLabel ? `, ${contextLabel}` : ''}${s.kind === 'transfer' ? ', seat assembly' : ''}${placed ? ', fitted' : unavailable ? ', unavailable; select for details' : ''}`}
                  onPointerDown={(event) => {
                    cardPointerHandled.current = null;
                    // Touch swipes browse the gallery. The labeled drag control
                    // below it owns touch dragging without delaying scrolling.
                    if (event.pointerType !== 'mouse' || event.button !== 0)
                      return;
                    event.currentTarget.focus({ preventScroll: true });
                    if (selectionRef.current !== s.id) pick(s.id);
                    if (
                      !placed &&
                      !unavailable &&
                      s.workspaceId === workspace &&
                      viewer.current?.beginDrag(
                        event.nativeEvent,
                        event.currentTarget,
                      )
                    )
                      cardPointerHandled.current = s.id;
                  }}
                  onClick={(event) => {
                    // Captured pointerup also produces click. Do not let that
                    // click cancel the piece's settling animation or reselect it.
                    if (event.detail > 0 && cardPointerHandled.current === s.id)
                      return;
                    pick(s.id);
                  }}
                  disabled={disabled}
                >
                  <Thumbnail step={s} viewer={getViewer} ready={status.ready} />
                  <span className="play-card-label">{s.label}</span>
                  <span className="play-card-state">
                    {contextLabel ? `${contextLabel} · ` : ''}
                    {placed
                      ? s.kind === 'transfer' || !s.workspaceId
                        ? 'Fitted'
                        : 'Assembled'
                      : unavailable
                        ? 'Not yet'
                        : s.kind === 'transfer'
                          ? 'Seat assembly'
                          : s.workspaceId
                            ? 'Part'
                            : s.leafIds.length > 1
                              ? 'Prepared assembly'
                              : 'Part'}
                  </span>
                </button>
              );
            })}
            {!gallery.length && (
              <p>No parts match. Try another name or group.</p>
            )}
          </div>
          <div className="play-selection" aria-live="polite" aria-atomic="true">
            <div>
              <strong>
                {complete
                  ? 'Every piece in place.'
                  : (selected?.label ?? 'Choose a piece to begin')}
              </strong>
              <p>
                {hints && missing.length
                  ? `Needs ${missing
                      .slice(0, 3)
                      .map((s) => s.label)
                      .join(
                        ', ',
                      )}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}.`
                  : notice ||
                    (fitted
                      ? 'Placed. Choose another piece, or undo the last action.'
                      : selected && selected.workspaceId !== workspace
                        ? selected.workspaceId
                          ? 'Open the workbench first, then drag this part into the assembly.'
                          : 'This piece belongs in the watch.'
                        : held
                          ? hints || assistance
                            ? status.obstructed
                              ? 'The seat is obscured or outside this view. Orbit or use Show destination.'
                              : 'Hold Drag part and move it onto the highlighted seat.'
                            : 'Hold Drag part and move it into the assembly. With a mouse, you can also drag the card.'
                          : 'Select a part, then hold Drag part and move it into the assembly.')}
              </p>
            </div>
            {selected && !fitted && selected.workspaceId !== workspace && (
              <Control
                disabled={disabled}
                onClick={() => enterWorkspace(selected.workspaceId)}
              >
                {selectedPacket ? 'Open workbench' : 'Return to watch'}
              </Control>
            )}
            {held && !fitted && (
              <Control
                className="play-drag-control"
                disabled={disabled || (hints && !available)}
                aria-label={`Drag part: ${held.label}`}
                onPointerDown={(event) =>
                  viewer.current?.beginDrag(
                    event.nativeEvent,
                    event.currentTarget,
                  )
                }
                onClick={(event) => {
                  if (event.detail === 0)
                    setNotice(
                      'Hold and move Drag part to drag. For keyboard or tap placement, choose Show destination below.',
                    );
                }}
              >
                <MoveUpRight aria-hidden="true" /> Drag part
              </Control>
            )}
            {workspace &&
              packet &&
              done.has(packet.stepIds[packet.stepIds.length - 1]) &&
              packet.stepIds.every((id) => done.has(id)) && (
                <Control
                  disabled={disabled}
                  onClick={() => {
                    enterWorkspace(null);
                    pick(packet.transferId);
                  }}
                >
                  Pick up assembly
                </Control>
              )}
          </div>
          <div className="play-actions">
            {held && !fitted && (
              <Control
                disabled={disabled || (hints && !available)}
                onClick={reveal}
              >
                <LocateFixed aria-hidden="true" /> Show destination
              </Control>
            )}
            <Control
              disabled={disabled || !session?.actionIds.length}
              onClick={() => {
                if (session) {
                  apply(undoPlacement(manifest, session));
                  setNotice('Last action undone.');
                }
              }}
            >
              <Undo2 aria-hidden="true" /> Undo
            </Control>
            <FlipButton
              disabled={disabled}
              onClick={() => viewer.current?.flip()}
            />
            <ResetViewButton
              disabled={disabled}
              onClick={() => viewer.current?.resetView()}
            />
            <Control
              disabled={disabled}
              aria-label="Restart assembly"
              onClick={() => setConfirm('restart')}
            >
              <ListRestart aria-hidden="true" /> Restart
            </Control>
            <Control
              disabled={disabled}
              aria-label="Choose difficulty"
              onClick={() => setConfirm('levels')}
            >
              <Gauge aria-hidden="true" /> Difficulty
            </Control>
          </div>
        </section>
      )}
      {(!status.ready || status.error) && (
        <section className="play-loading" aria-label="Loading status">
          <output>{status.error || 'Preparing the watch…'}</output>
          {status.error && (
            <Control
              onClick={() => {
                setStatus(blank);
                setAttempt((n) => n + 1);
              }}
            >
              Retry 3D
            </Control>
          )}
        </section>
      )}
      <output className="play-storage">{storage}</output>
      <Sheet modal={false} open={help} onOpenChange={setHelp}>
        <SheetContent
          id="play-help"
          className="explorer-panel settings-panel header-panel play-help-panel"
          style={{ '--header-bottom': `${headerBottom}px` } as CSSProperties}
          showOverlay={false}
          scrollContent
          finalFocus={helpButton}
        >
          <SheetHeader>
            <SheetTitle>How to play</SheetTitle>
            <SheetDescription className="sr-only">
              Assembly controls and keyboard shortcuts
            </SheetDescription>
          </SheetHeader>
          <div className="panel-body play-help-copy">
            <p>
              With a mouse, drag a card straight into the assembly. On touch,
              swipe the gallery to browse, tap a card, then hold the gold Drag
              part button and move your finger into the assembly. A missed drop
              returns the piece. Supports must be fitted before their
              attachments, and internals before covers.
            </p>
            <p>
              Hints starts off. Turn it on to inspect missing prerequisites and
              see selected seats. Your choice is saved and restored by Continue.
              Show destination is explicit assistance: it reveals the seat and
              reframes the view. You can then tap the destination, or Tab to it
              and press Enter, to place without dragging.
            </p>
            <p>
              In Hard, open a part’s workbench to build its assembly one
              component at a time. Return whenever you like. Pick up a complete
              assembly and seat it in the watch; the transfer adds no parts.
              Undo reverses the last placement or transfer.
            </p>
            <p>
              Drag empty space to orbit; right-drag to pan; scroll or pinch to
              zoom. On the canvas, arrow keys orbit, + / − zoom, and Home resets
              the view. Flip and Reset preserve progress. Workbench return
              restores your watch camera.
            </p>
            <small>
              A source-based puzzle using Marco Lang’s CAD. Assembly rules are
              puzzle assumptions, not servicing instructions.
            </small>
          </div>
        </SheetContent>
      </Sheet>
      <dialog
        ref={dialog}
        className="play-confirm"
        aria-labelledby="play-confirm-title"
        aria-describedby="play-confirm-description"
        onCancel={() => setConfirm(null)}
      >
        <h2 id="play-confirm-title">
          {confirm === 'levels' ? 'Choose a different level?' : 'Start again?'}
        </h2>
        <p id="play-confirm-description">
          {confirm === 'levels'
            ? 'Your save remains available until you start another assembly.'
            : 'This replaces your saved progress with a fresh assembly. Hints will start off.'}
        </p>
        <div>
          <Control onClick={() => setConfirm(null)} autoFocus>
            Keep playing
          </Control>
          <Control onClick={discard}>
            {confirm === 'levels' ? 'Choose level' : 'Start again'}
          </Control>
        </div>
      </dialog>
    </main>
  );
}
