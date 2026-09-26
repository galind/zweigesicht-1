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
  Wrench,
  Menu,
  PackageOpen,
  Sparkles,
  Trophy,
  CircleHelp,
  Boxes,
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
  side: 'back',
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
  const destination = useRef<HTMLButtonElement>(null);
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
    [menu, setMenu] = useState(false),
    [inventoryView, setInventoryView] = useState<'ready' | 'all'>('ready'),
    [placementPulse, setPlacementPulse] = useState(0),
    [attempt, setAttempt] = useState(0);
  const [confirm, setConfirm] = useState<
    'restart' | 'levels' | PlayLevel | null
  >(null);
  const dialog = useRef<HTMLDialogElement>(null),
    lastFocus = useRef<HTMLElement | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null),
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
      selected && !current!.actionIds.includes(selected.id) ? selected : null;
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
        ? ''
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
    setInventoryView('ready');
    setQuery('');
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
    if (!host.current || !destination.current) return;
    let controller: PlayViewer;
    try {
      if (new URLSearchParams(location.search).get('no3d') === '1')
        throw new Error('3D disabled');
      controller = new PlayViewer(
        host.current,
        () =>
          app.current?.querySelector<HTMLElement>(
            `[data-drag-id="${selectionRef.current}"]`,
          ) ??
          app.current?.querySelector<HTMLElement>(
            `[data-action-id="${selectionRef.current}"]`,
          ) ??
          null,
        destination.current,
        manifest,
        setStatus,
        (id) => {
          const previous = sessionRef.current;
          if (!previous) return;
          const next = commitPlacement(manifest, previous, id);
          if (next === previous) return;
          const step = actions(manifest, next.level).find((s) => s.id === id)!;
          const packet = step.workspaceId
            ? manifest.packets.find((item) => item.id === step.workspaceId)
            : null;
          const finishedPacket =
            packet &&
            packet.stepIds.every((stepId) => next.actionIds.includes(stepId));
          const groupSteps = actions(manifest, next.level).filter(
            (item) => item.groupId === step.groupId,
          );
          const finishedSystem = groupSteps.every((item) =>
            next.actionIds.includes(item.id),
          );
          const fittedWithoutClue = !previous.hints && !assistanceRef.current;
          apply(next);
          setPlacementPulse((value) => value + 1);
          setNotice(
            isComplete(manifest, next)
              ? 'The movement is complete. Turn it over and enjoy what you built.'
              : finishedPacket
                ? `${packet.label} is complete. Return to the watch and seat the assembly.`
                : finishedSystem
                  ? `${manifest.groups.find((item) => item.id === step.groupId)?.label ?? 'System'} complete.`
                  : `${step.label} ${step.kind === 'transfer' ? 'seated in the watch' : `fitted${fittedWithoutClue ? ' without a clue' : ''}`}.`,
          );
          // Keep focus on the player's chosen card; never select the next correct item.
          if (
            document.activeElement?.hasAttribute('data-drag-id') ||
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
  const levelSteps = session ? manifest.levels[session.level].steps : [];
  const selected = all.find((s) => s.id === selection) ?? null;
  const done = new Set(session?.actionIds ?? []);
  const fitted = selected ? done.has(selected.id) : false;
  const available =
    !!session && !!selected && canPlace(manifest, session, selected.id);
  const held = selected && !fitted ? selected : null;
  const inWorkspace = held?.workspaceId === workspace;
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
  const packetComplete =
    !!packet && packet.stepIds.every((stepId) => done.has(stepId));
  const selectedPacket = manifest.packets.find(
    (p) => p.id === selected?.workspaceId,
  );
  const normalizedQuery = query.trim().toLowerCase();
  const inHardMode = session?.level === 'hard';
  const contextActions = inHardMode
    ? workspace
      ? all.filter((step) => step.workspaceId === workspace)
      : all.filter((step) => !step.workspaceId)
    : all;
  const gallery = contextActions.filter(
    (step) =>
      (!inHardMode || !!workspace || step.groupId === group) &&
      (!normalizedQuery ||
        step.label.toLowerCase().includes(normalizedQuery)) &&
      (inventoryView === 'all' ||
        (!done.has(step.id) &&
          !!session &&
          canPlace(manifest, session, step.id))),
  );
  const projects =
    inHardMode && !workspace
      ? manifest.packets.filter((candidate) => {
          if (candidate.groupId !== group || done.has(candidate.transferId))
            return false;
          if (candidate.stepIds.every((stepId) => done.has(stepId)))
            return false;
          const steps = all.filter((step) => step.workspaceId === candidate.id);
          const matches =
            !normalizedQuery ||
            candidate.label.toLowerCase().includes(normalizedQuery) ||
            steps.some((step) =>
              step.label.toLowerCase().includes(normalizedQuery),
            );
          if (!matches) return false;
          return (
            inventoryView === 'all' ||
            steps.some(
              (step) =>
                !done.has(step.id) &&
                !!session &&
                canPlace(manifest, session, step.id),
            )
          );
        })
      : [];
  const completedFits = levelSteps.filter((step) => done.has(step.id)).length;
  const completedSystems = manifest.groups.filter((candidate) =>
    all
      .filter((step) => step.groupId === candidate.id)
      .every((step) => done.has(step.id)),
  ).length;
  const readyInGroup = (groupId: string) => {
    if (!session) return 0;
    const direct = all.filter(
      (step) =>
        !step.workspaceId &&
        step.groupId === groupId &&
        !done.has(step.id) &&
        canPlace(manifest, session, step.id),
    ).length;
    const benches = manifest.packets.filter((candidate) => {
      if (candidate.groupId !== groupId || done.has(candidate.transferId))
        return false;
      return all.some(
        (step) =>
          step.workspaceId === candidate.id &&
          !done.has(step.id) &&
          canPlace(manifest, session, step.id),
      );
    }).length;
    return direct + benches;
  };
  const scrollKey = `${session?.level}:${workspace ?? group}:${inventoryView}:${query}`;
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
    viewer.current?.setDetail(null);
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
    setInventoryView('ready');
    apply(createSession(manifest, level));
    requestAnimationFrame(() => {
      viewer.current?.layout();
      if (viewer.current) viewer.current.side = 'back';
      viewer.current?.resetView();
      inventory.current?.querySelector('button')?.focus();
    });
    setNotice(
      `${level === 'easy' ? 'Workshop' : 'Master bench'} started. Choose a ready piece and find its seat.`,
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
        <div className="play-brand">
          <span>Zweigesicht–1</span>
          <span>
            {active
              ? session?.level === 'hard'
                ? 'Master bench'
                : 'Workshop'
              : 'Assembly workshop'}
          </span>
        </div>
        {active && (
          <Control
            aria-label={`Hints ${hints ? 'on' : 'off'}`}
            aria-pressed={hints}
            disabled={disabled}
            onClick={() => {
              assistanceRef.current = false;
              setAssistance(false);
              setNotice('');
              if (session) apply({ ...session, hints: !hints });
            }}
          >
            <Lightbulb aria-hidden="true" />
            <span className="play-control-label">
              Clues {hints ? 'on' : 'off'}
            </span>
          </Control>
        )}
        <Control
          ref={menuButton}
          aria-label="Menu"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-controls="play-menu"
        >
          <Menu aria-hidden="true" />
          <span className="play-control-label">Menu</span>
        </Control>
      </header>
      {active && (
        <div className="play-workspace" style={{ top: headerBottom + 6 }}>
          {status.detail ? (
            <>
              <span>
                Dial edge · {all.find((s) => s.id === status.detail)?.label}
              </span>
              <Control
                disabled={disabled}
                onClick={() => viewer.current?.setDetail(null)}
              >
                <ArrowLeft aria-hidden="true" /> Return to faces
              </Control>
            </>
          ) : workspace ? (
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
              Watch · {status.side === 'front' ? 'Dial side' : 'Movement side'}
            </span>
          )}
        </div>
      )}
      {active &&
        workspace &&
        session &&
        workspaceLeafIds(manifest, session, workspace).length === 0 && (
          <div className="play-empty-fixture" aria-hidden="true">
            <span />
            <small>Empty fixture · fit the first bench piece</small>
          </div>
        )}
      <Control
        ref={destination}
        className="play-target"
        aria-label={
          held ? `Place ${held.label} at its destination` : 'Destination'
        }
        disabled={disabled || !held || !inWorkspace || !available}
        hidden={!held || !inWorkspace || !(hints || assistance)}
        onClick={() => viewer.current?.place()}
      >
        <span aria-hidden="true">＋</span>
      </Control>
      {!active && (
        <section className="play-choice" aria-labelledby="play-title">
          <span className="play-kicker">A mechanical puzzle in real CAD</span>
          <h1 ref={choiceTitle} id="play-title" tabIndex={-1}>
            Build the movement, piece by piece
          </h1>
          <p>
            Choose a part from the bench, study the movement, and find the seat
            it was made for. There is no timer and no penalty for looking
            closer.
          </p>
          {session && (
            <Control
              className="play-primary play-continue"
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
              Continue {session.level === 'easy' ? 'Workshop' : 'Master bench'}
              <span>
                {count} of {physicalTotal} parts fitted
              </span>
            </Control>
          )}
          <div className="play-levels">
            <Control
              data-level="easy"
              disabled={disabled}
              onClick={() => choose('easy')}
            >
              <span className="play-level-icon" aria-hidden="true">
                <PackageOpen />
              </span>
              <strong>Workshop</strong>
              <span>89 considered fits using prepared subassemblies</span>
              <small>Best place to learn the movement</small>
            </Control>
            <Control
              data-level="hard"
              disabled={disabled}
              onClick={() => choose('hard')}
            >
              <span className="play-level-icon" aria-hidden="true">
                <Wrench />
              </span>
              <strong>Master bench</strong>
              <span>249 individual parts across 35 subassemblies</span>
              <small>A long-form challenge; progress saves locally</small>
            </Control>
          </div>
          <div className="play-choice-notes">
            <span>Clues start off</span>
            <span>Forgiving placement</span>
            <span>Pick up where you left off</span>
          </div>
        </section>
      )}
      {active && (
        <section
          className="play-dock"
          aria-label="Assembly workbench"
          data-pulse={placementPulse}
        >
          <div className="play-progress">
            <div className="play-progress-copy">
              <span className="play-mode-mark">
                {workspace
                  ? packet?.label
                  : session?.level === 'hard'
                    ? manifest.groups.find((item) => item.id === group)?.label
                    : 'Ready bench'}
              </span>
              <strong>
                {complete
                  ? 'Movement complete'
                  : `${count} of ${physicalTotal} parts fitted`}
              </strong>
            </div>
            <div className="play-progress-score">
              <span>
                {completedFits} / {levelSteps.length} fits
              </span>
              <span>
                {completedSystems} / {manifest.groups.length} systems
              </span>
            </div>
          </div>
          <progress
            className="play-progress-bar"
            aria-label="Assembly progress"
            max={physicalTotal}
            value={count}
          />
          <div className="play-system-track" aria-label="Mechanism progress">
            {manifest.groups.map((candidate) => {
              const systemActions = all.filter(
                (step) => step.groupId === candidate.id,
              );
              const systemDone = systemActions.filter((step) =>
                done.has(step.id),
              ).length;
              return (
                <span
                  key={candidate.id}
                  data-active={!workspace && candidate.id === group}
                  data-complete={
                    !!systemActions.length &&
                    systemDone === systemActions.length
                  }
                  style={
                    {
                      '--system-progress': `${systemActions.length ? (systemDone / systemActions.length) * 100 : 0}%`,
                    } as CSSProperties
                  }
                  title={`${candidate.label}: ${systemDone} of ${systemActions.length}`}
                />
              );
            })}
          </div>
          {complete ? (
            <div className="play-complete" aria-live="polite">
              <span className="play-complete-icon" aria-hidden="true">
                <Trophy />
              </span>
              <div>
                <strong>You completed the movement.</strong>
                <p>
                  All 265 physical pieces are in place. Flip it over and take in
                  both faces—or begin a fresh build when you are ready.
                </p>
              </div>
              <FlipButton
                disabled={disabled}
                onClick={() => viewer.current?.flip()}
              />
              <Control
                disabled={disabled}
                onClick={() => setConfirm('restart')}
              >
                Build again
              </Control>
            </div>
          ) : (
            <>
              <div className="play-inventory-tools">
                <div className="play-inventory-switch" aria-label="Parts view">
                  <button
                    type="button"
                    aria-pressed={inventoryView === 'ready'}
                    onClick={() => {
                      setInventoryView('ready');
                      setQuery('');
                    }}
                  >
                    <Sparkles aria-hidden="true" /> Ready now
                  </button>
                  <button
                    type="button"
                    aria-pressed={inventoryView === 'all'}
                    onClick={() => setInventoryView('all')}
                  >
                    <Boxes aria-hidden="true" /> All parts
                  </button>
                </div>
                {inHardMode && !workspace && (
                  <label>
                    <span className="sr-only">Parts group</span>
                    <select
                      aria-label="Parts group"
                      value={group}
                      onChange={(event) => {
                        setGroup(event.target.value);
                        setQuery('');
                      }}
                    >
                      {manifest.groups.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.label} · {readyInGroup(candidate.id)} ready
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {inventoryView === 'all' && (
                  <label className="play-search">
                    <span className="sr-only">Find a part</span>
                    <input
                      type="search"
                      aria-label="Find a part"
                      placeholder="Find a part…"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                )}
              </div>
              <div
                className="play-gallery"
                ref={inventory}
                aria-label="Parts gallery. Drag a card with a mouse. On touch, select a card then drag its image. Swipe elsewhere to browse."
                onScroll={() => {
                  if (inventory.current)
                    scrollPositions.current.set(
                      scrollKey,
                      inventory.current.scrollLeft,
                    );
                }}
              >
                {projects.map((candidate) => {
                  const transfer = all.find(
                    (step) => step.id === candidate.transferId,
                  );
                  const projectDone = candidate.stepIds.filter((id) =>
                    done.has(id),
                  ).length;
                  return (
                    <button
                      type="button"
                      className="play-project"
                      key={candidate.id}
                      data-packet-id={candidate.id}
                      disabled={disabled}
                      onClick={() => {
                        selectionRef.current = null;
                        setSelection(null);
                        enterWorkspace(candidate.id);
                      }}
                    >
                      {transfer && (
                        <Thumbnail
                          step={transfer}
                          viewer={getViewer}
                          ready={status.ready}
                        />
                      )}
                      <span className="play-card-label">{candidate.label}</span>
                      <span className="play-card-state">
                        {projectDone} / {candidate.stepIds.length} · Open bench
                      </span>
                    </button>
                  );
                })}
                {gallery.map((step) => {
                  const contextLabel = manifest.packets.find(
                    (candidate) => candidate.id === step.workspaceId,
                  )?.label;
                  const placed = done.has(step.id);
                  const unavailable =
                    hints &&
                    !!session &&
                    !placed &&
                    !canPlace(manifest, session, step.id);
                  return (
                    <div
                      className="play-card-item"
                      key={step.id}
                      data-selected={selection === step.id && !placed}
                    >
                      <button
                        type="button"
                        className="play-card"
                        data-action-id={step.id}
                        data-unavailable={unavailable}
                        data-fitted={placed}
                        data-draggable={!placed && !unavailable}
                        aria-pressed={selection === step.id}
                        aria-label={`${step.label}${contextLabel ? `, ${contextLabel}` : ''}${step.kind === 'transfer' ? ', seat assembly' : ''}${placed ? ', fitted' : unavailable ? ', unavailable; select for details' : ''}`}
                        onPointerDown={(event) => {
                          cardPointerHandled.current = null;
                          if (
                            event.pointerType !== 'mouse' ||
                            event.button !== 0
                          )
                            return;
                          event.currentTarget.focus({ preventScroll: true });
                          if (selectionRef.current !== step.id) pick(step.id);
                          if (
                            !placed &&
                            !unavailable &&
                            viewer.current?.beginDrag(
                              event.nativeEvent,
                              event.currentTarget,
                            )
                          )
                            cardPointerHandled.current = step.id;
                        }}
                        onClick={(event) => {
                          if (
                            event.detail > 0 &&
                            cardPointerHandled.current === step.id
                          )
                            return;
                          pick(step.id);
                        }}
                        disabled={disabled}
                      >
                        <Thumbnail
                          step={step}
                          viewer={getViewer}
                          ready={status.ready}
                        />
                        <span className="play-card-label">{step.label}</span>
                        <span className="play-card-state">
                          {placed
                            ? 'Fitted'
                            : unavailable
                              ? 'Waiting for earlier work'
                              : step.kind === 'transfer'
                                ? 'Ready to seat'
                                : step.leafIds.length > 1
                                  ? 'Prepared assembly'
                                  : 'Ready to fit'}
                        </span>
                      </button>
                      {selection === step.id && !placed && (
                        <button
                          type="button"
                          className="play-card-drag"
                          data-drag-id={step.id}
                          aria-label={`Drag part: ${step.label}`}
                          disabled={disabled || unavailable}
                          onPointerDown={(event) =>
                            viewer.current?.beginDrag(
                              event.nativeEvent,
                              event.currentTarget,
                            )
                          }
                          onClick={(event) => {
                            if (event.detail === 0)
                              setNotice(
                                'Drag the part image into the movement, or choose Show seat for keyboard placement.',
                              );
                          }}
                        />
                      )}
                    </div>
                  );
                })}
                {!projects.length && !gallery.length && (
                  <div className="play-empty">
                    <strong>
                      {inventoryView === 'ready'
                        ? packetComplete
                          ? 'This assembly is ready for the watch.'
                          : 'This bench is waiting on another system.'
                        : 'No parts match this search.'}
                    </strong>
                    <span>
                      {inventoryView === 'ready'
                        ? packetComplete
                          ? 'Seat it to continue the movement build.'
                          : 'Choose another mechanism or browse all parts to inspect what comes next.'
                        : 'Try a broader part name.'}
                    </span>
                    {inventoryView === 'ready' && !packetComplete && (
                      <button
                        type="button"
                        onClick={() => setInventoryView('all')}
                      >
                        Browse all parts
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div
                className="play-selection"
                aria-live="polite"
                aria-atomic="true"
                key={`selection-${placementPulse}`}
              >
                <div>
                  <strong>{selected?.label ?? 'Choose your next fit'}</strong>
                  <p>
                    {hints && missing.length
                      ? `Needs ${missing
                          .slice(0, 3)
                          .map((step) => step.label)
                          .join(
                            ', ',
                          )}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}.`
                      : notice ||
                        (fitted
                          ? 'Fitted. Choose another piece or undo the last move.'
                          : held?.viewDirectionWorld &&
                              inWorkspace &&
                              status.detail !== held.id
                            ? 'This screw enters from the dial edge. Open its fitting view.'
                            : selected && selected.workspaceId !== workspace
                              ? selected.workspaceId
                                ? 'Build this part on its dedicated bench first.'
                                : 'Return to the watch to fit this piece.'
                              : held
                                ? hints || assistance
                                  ? status.obstructed
                                    ? 'The seat is hidden on this face. Flip or show the seat.'
                                    : 'Drag the highlighted part onto its seat.'
                                  : 'Study the part, then drag its image to the matching seat.'
                                : inventoryView === 'ready'
                                  ? 'Every piece in this tray can be fitted now. Pick one and find its seat.'
                                  : 'Browse the full inventory, or return to Ready now for a focused challenge.')}
                  </p>
                </div>
                {held?.viewDirectionWorld &&
                  inWorkspace &&
                  status.detail !== held.id && (
                    <Control
                      disabled={disabled}
                      onClick={() => viewer.current?.setDetail(held)}
                    >
                      View fitting edge
                    </Control>
                  )}
                {selected && !fitted && selected.workspaceId !== workspace && (
                  <Control
                    disabled={disabled}
                    onClick={() => enterWorkspace(selected.workspaceId)}
                  >
                    {selectedPacket ? 'Open workbench' : 'Return to watch'}
                  </Control>
                )}
                {workspace && packet && packetComplete && (
                  <Control
                    disabled={disabled}
                    onClick={() => {
                      enterWorkspace(null);
                      pick(packet.transferId);
                    }}
                  >
                    Seat completed assembly
                  </Control>
                )}
              </div>
              <div className="play-actions">
                {held &&
                  !fitted &&
                  inWorkspace &&
                  (!held.viewDirectionWorld || status.detail === held.id) && (
                    <Control
                      disabled={disabled || (hints && !available)}
                      onClick={reveal}
                    >
                      <LocateFixed aria-hidden="true" /> Show seat
                    </Control>
                  )}
                <Control
                  disabled={disabled || !session?.actionIds.length}
                  onClick={() => {
                    if (session) {
                      apply(undoPlacement(manifest, session));
                      setNotice('Last fit undone.');
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
              </div>
            </>
          )}
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
      <Sheet modal={false} open={menu} onOpenChange={setMenu}>
        <SheetContent
          id="play-menu"
          className="explorer-panel settings-panel header-panel play-menu-panel"
          style={{ '--header-bottom': `${headerBottom}px` } as CSSProperties}
          showOverlay={false}
          scrollContent
          finalFocus={menuButton}
        >
          <SheetHeader>
            <SheetTitle>Workshop menu</SheetTitle>
            <SheetDescription>
              View controls and assembly options
            </SheetDescription>
          </SheetHeader>
          <div className="panel-body play-menu-actions">
            {active && (
              <>
                <Control
                  aria-label={`Hints ${hints ? 'on' : 'off'}`}
                  aria-pressed={hints}
                  disabled={disabled}
                  onClick={() => {
                    assistanceRef.current = false;
                    setAssistance(false);
                    setNotice('');
                    if (session) apply({ ...session, hints: !hints });
                  }}
                >
                  <Lightbulb aria-hidden="true" /> Clues {hints ? 'on' : 'off'}
                </Control>
                <ResetViewButton
                  disabled={disabled}
                  onClick={() => {
                    viewer.current?.resetView();
                    setMenu(false);
                  }}
                />
              </>
            )}
            <Control
              onClick={() => {
                setMenu(false);
                setHelp(true);
              }}
              aria-expanded={help}
              aria-controls="play-help"
            >
              <CircleHelp aria-hidden="true" /> How to play
            </Control>
            {active && (
              <>
                <Control
                  disabled={disabled}
                  aria-label="Restart assembly"
                  onClick={() => {
                    setMenu(false);
                    setConfirm('restart');
                  }}
                >
                  <ListRestart aria-hidden="true" /> Restart build
                </Control>
                <Control
                  disabled={disabled}
                  aria-label="Choose difficulty"
                  onClick={() => {
                    setMenu(false);
                    setConfirm('levels');
                  }}
                >
                  <Gauge aria-hidden="true" /> Change challenge
                </Control>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet modal={false} open={help} onOpenChange={setHelp}>
        <SheetContent
          id="play-help"
          className="explorer-panel settings-panel header-panel play-help-panel"
          style={{ '--header-bottom': `${headerBottom}px` } as CSSProperties}
          showOverlay={false}
          scrollContent
          finalFocus={menuButton}
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
              swipe the tray to browse, tap a card, then drag its part image
              into the assembly. Ready now contains pieces that can be fitted
              immediately. All parts lets you inspect the wider dependency
              puzzle. A missed drop simply returns the piece.
            </p>
            <p>
              Clues start off. Turn them on to inspect missing prerequisites and
              see the selected seat. Show seat is explicit assistance: it
              reveals and reframes the fitting point. You can then tap the
              destination, or Tab to it and press Enter, to place without
              dragging. A fit made without either aid receives a quiet
              acknowledgement.
            </p>
            <p>
              In Master bench, open a subassembly card to build it one component
              at a time. Return whenever you like, then seat the finished
              assembly in the watch. Undo reverses the last fit or transfer.
              Dial-edge screws have an explicit fitting view.
            </p>
            <p>
              Flip switches between the two fixed sides. Scroll or pinch to zoom
              toward the center. On the canvas, F flips, + / − zoom, and Home
              resets the view. Flip and Reset preserve progress. Workbench
              return restores your watch camera.
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
          {confirm === 'levels'
            ? 'Choose a different challenge?'
            : 'Start again?'}
        </h2>
        <p id="play-confirm-description">
          {confirm === 'levels'
            ? 'Your save remains available until you start another assembly.'
            : 'This replaces your saved progress with a fresh assembly. Clues will start off.'}
        </p>
        <div>
          <Control onClick={() => setConfirm(null)} autoFocus>
            Keep playing
          </Control>
          <Control onClick={discard}>
            {confirm === 'levels' ? 'Choose challenge' : 'Start again'}
          </Control>
        </div>
      </dialog>
    </main>
  );
}
