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
  ArrowLeft,
  Wrench,
  Menu,
  Sparkles,
  CircleHelp,
  Boxes,
  SlidersHorizontal,
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
  saveSession,
  undoPlacement,
  workspaceLeafIds,
} from './state';
import type { PlayLevel, PlayManifest, PlaySession, PlayStep } from './types';
import { PlayViewer, type PlayViewStatus } from './PlayViewer';
import { useTextScalePreview } from '../experience/useTextScalePreview';
import { observeElementResize } from '../experience/observeElementResize';
import { MovementLoadingState } from '../../components/MovementLoadingMark';
import { SiteHeader, SiteHeaderActions } from '../../components/site-chrome';
import './play.css';

const manifest = authored as PlayManifest;
const blank: PlayViewStatus = {
  ready: false,
  busy: false,
  error: '',
  cutaway: false,
  side: 'back',
};

type StartupConflict =
  | { kind: 'switch'; requested: PlayLevel; saved: PlaySession }
  | {
      kind: 'replace';
      requested: PlayLevel;
      reason: 'corrupt' | 'incompatible';
    };

const requestedMode = (): PlayLevel | null => {
  const value = new URLSearchParams(location.search).get('mode');
  return value === 'easy' || value === 'hard' ? value : null;
};

const clearVisibleMode = () => {
  const url = new URL(location.href);
  if (!url.searchParams.has('mode')) return;
  url.searchParams.delete('mode');
  history.replaceState(
    history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
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
  const [bootResolved, setBootResolved] = useState(false);
  const [startupConflict, setStartupConflict] =
    useState<StartupConflict | null>(null);
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
    [filters, setFilters] = useState(false),
    [progressOpen, setProgressOpen] = useState(false),
    [inventoryView, setInventoryView] = useState<'ready' | 'all'>('ready'),
    [placementPulse, setPlacementPulse] = useState(0),
    [attempt, setAttempt] = useState(0);
  const [confirm, setConfirm] = useState<'restart' | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    lastFocus = useRef<HTMLElement | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null),
    filterButton = useRef<HTMLButtonElement>(null),
    progressButton = useRef<HTMLButtonElement>(null);
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
      false,
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
    const result = saveSession(manifest, next);
    if (result.status === 'saved') {
      setStorage('');
      clearVisibleMode();
    } else {
      setStorage(
        'Saving is unavailable. Leaving or reloading may lose progress in this tab.',
      );
    }
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
      const requested = requestedMode();
      const saved = getSavedSession(manifest);
      if (saved.status === 'saved') {
        sessionRef.current = saved.session;
        setSession(saved.session);
        if (
          requested &&
          requested !== saved.session.level &&
          saved.session.actionIds.length
        ) {
          setStartupConflict({
            kind: 'switch',
            requested,
            saved: saved.session,
          });
        } else if (requested && requested !== saved.session.level) {
          const next = createSession(manifest, requested);
          activeRef.current = true;
          setActive(true);
          persist(next);
        } else {
          activeRef.current = true;
          setActive(true);
          if (requested) clearVisibleMode();
        }
        setBootResolved(true);
        sync();
        return;
      }
      if (saved.status === 'corrupt' || saved.status === 'incompatible') {
        if (!requested) {
          location.replace('/?assemble=1');
          return;
        }
        setStorage(
          saved.status === 'incompatible'
            ? 'This saved assembly is from an incompatible version and must be replaced before Workshop can start.'
            : 'This saved assembly cannot be restored and must be replaced before Workshop can start.',
        );
        setStartupConflict({
          kind: 'replace',
          requested,
          reason: saved.status,
        });
        setBootResolved(true);
        return;
      }
      if (!requested) {
        location.replace('/?assemble=1');
        return;
      }
      const next = createSession(manifest, requested);
      sessionRef.current = next;
      setSession(next);
      activeRef.current = true;
      setActive(true);
      if (saved.status === 'unavailable') {
        setStorage(
          'Saving is unavailable. Leaving or reloading may lose progress in this tab.',
        );
      } else {
        persist(next);
      }
      setBootResolved(true);
      sync();
    });
    return () => {
      mounted = false;
    };
  }, [persist, sync]);
  useEffect(() => {
    if (!bootResolved || !host.current || !destination.current) return;
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
          apply(next);
          setPlacementPulse((value) => value + 1);
          setNotice(
            isComplete(manifest, next)
              ? 'The movement is complete. Turn it over and enjoy what you built.'
              : finishedPacket
                ? `${packet.label} is complete. Return to the watch and seat the assembly.`
                : finishedSystem
                  ? `${manifest.groups.find((item) => item.id === step.groupId)?.label ?? 'System'} complete.`
                  : `${step.label} ${step.kind === 'transfer' ? 'seated in the watch' : 'fitted'}.`,
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
  }, [apply, sync, attempt, bootResolved]);
  useLayoutEffect(() => {
    const layout = () => {
      const bottom =
        app.current?.querySelector('.play-heading')?.getBoundingClientRect()
          .bottom ?? 70;
      setHeaderBottom(bottom);
      app.current?.style.setProperty('--play-header-bottom', `${bottom}px`);
      viewer.current?.layout();
    };
    return observeElementResize(
      app.current?.querySelectorAll(
        '.play-heading, .play-dock, .play-workspace',
      ) ?? [],
      layout,
    );
  }, [active, status.ready]);
  useEffect(() => {
    if (confirm || startupConflict) {
      lastFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
      if (lastFocus.current?.isConnected) lastFocus.current.focus();
      lastFocus.current = null;
    }
  }, [confirm, startupConflict]);

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
      `${level === 'easy' ? 'Easy' : 'Hard'} started. Choose a ready piece and find its seat.`,
    );
  };
  const discard = () => {
    if (confirm === 'restart' && session) start(session.level);
    setConfirm(null);
  };
  const keepSavedStartup = () => {
    if (startupConflict?.kind !== 'switch') {
      location.assign('/?assemble=1');
      return;
    }
    sessionRef.current = startupConflict.saved;
    setSession(startupConflict.saved);
    activeRef.current = true;
    setActive(true);
    clearVisibleMode();
    setStartupConflict(null);
    sync();
  };
  const acceptStartup = () => {
    if (!startupConflict) return;
    const requested = startupConflict.requested;
    setStartupConflict(null);
    setStorage('');
    start(requested);
  };
  const reveal = () => {
    assistanceRef.current = true;
    setAssistance(true);
    viewer.current?.setAssistance(false, available, true);
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
      <SiteHeader className="play-heading" identityClassName="play-brand">
        <SiteHeaderActions
          className="play-header-actions"
          aria-label="Workshop navigation"
        >
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
        </SiteHeaderActions>
      </SiteHeader>
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
        hidden={!held || !inWorkspace || !assistance}
        onClick={() => viewer.current?.place()}
      >
        <span aria-hidden="true">＋</span>
      </Control>
      {active && (
        <section
          className="play-dock site-glass"
          aria-label="Assembly workbench"
          data-pulse={placementPulse}
          data-filters={inHardMode || inventoryView === 'all'}
        >
          <div className="play-progress">
            <button
              type="button"
              className="play-mode-mark"
              ref={progressButton}
              onClick={() => setProgressOpen(true)}
              aria-label={`View ${session?.level === 'hard' ? 'Hard' : 'Easy'} progress`}
            >
              {session?.level === 'hard' ? 'Hard' : 'Easy'}
            </button>
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
            {(inHardMode || inventoryView === 'all') && (
              <button
                type="button"
                className="play-filter-trigger"
                ref={filterButton}
                onClick={() => setFilters(true)}
              >
                <SlidersHorizontal aria-hidden="true" /> Filter
              </button>
            )}
            <strong>
              {completedFits} of {levelSteps.length}{' '}
              {session?.level === 'hard' ? 'parts' : 'fits'}
            </strong>
          </div>
          {complete ? (
            <div className="play-complete" aria-live="polite">
              <div>
                <strong>You completed the movement.</strong>
                <p>
                  All 265 physical pieces are in place. The assembled movement
                  remains yours to explore.
                </p>
              </div>
              <Control onClick={() => location.assign('/')}>
                Explore the movement
              </Control>
              <Control
                disabled={disabled}
                onClick={() => setConfirm('restart')}
              >
                Build again
              </Control>
              <Control onClick={() => location.assign('/?assemble=1')}>
                Change difficulty
              </Control>
            </div>
          ) : (
            <>
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
                    !!session &&
                    !placed &&
                    !canPlace(manifest, session, step.id);
                  const stateLabel = placed
                    ? 'Fitted'
                    : unavailable
                      ? 'Waiting for earlier work'
                      : step.kind === 'transfer'
                        ? 'Seat completed assembly'
                        : contextLabel
                          ? `Workbench · ${contextLabel}`
                          : '';
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
                        {stateLabel && (
                          <span className="play-card-state">{stateLabel}</span>
                        )}
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
              <div className="play-rail-footer">
                <div
                  className="play-selection"
                  aria-live="polite"
                  aria-atomic="true"
                  key={`selection-${placementPulse}`}
                >
                  <div>
                    <strong>{selected?.label ?? 'Choose your next fit'}</strong>
                    <p>
                      {notice ||
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
                              : held && !available
                                ? 'This part is waiting for earlier work. Choose Ready now for pieces you can fit.'
                                : held
                                  ? assistance
                                    ? status.obstructed
                                      ? 'The seat is hidden from this angle. Rotate the movement or show the seat again.'
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
                  {selected &&
                    !fitted &&
                    selected.workspaceId !== workspace && (
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
                  {held &&
                    !fitted &&
                    inWorkspace &&
                    (!held.viewDirectionWorld || status.detail === held.id) && (
                      <Control
                        disabled={disabled || !available}
                        onClick={reveal}
                      >
                        <LocateFixed aria-hidden="true" /> Show seat
                      </Control>
                    )}
                </div>
                <div className="play-actions">
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
              </div>
            </>
          )}
        </section>
      )}
      {bootResolved && (!status.ready || status.error) && (
        <section className="play-loading" aria-label="Loading status">
          <MovementLoadingState
            tone={status.error ? 'error' : 'loading'}
            label={status.error || 'Preparing the movement'}
            actionLabel={status.error ? 'Retry 3D' : undefined}
            onAction={() => {
              setStatus(blank);
              setAttempt((n) => n + 1);
            }}
          />
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
              <ResetViewButton
                disabled={disabled}
                onClick={() => {
                  viewer.current?.resetView();
                  setMenu(false);
                }}
              />
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
                  onClick={() => {
                    setMenu(false);
                    location.assign('/?assemble=1');
                  }}
                >
                  Change difficulty
                </Control>
                <Control onClick={() => location.assign('/')}>
                  Return to the movement viewer
                </Control>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet modal={false} open={filters} onOpenChange={setFilters}>
        <SheetContent
          className="explorer-panel settings-panel header-panel play-filter-panel"
          style={{ '--header-bottom': `${headerBottom}px` } as CSSProperties}
          showOverlay={false}
          scrollContent
          finalFocus={filterButton}
        >
          <SheetHeader>
            <SheetTitle>Filter parts</SheetTitle>
            <SheetDescription>
              Choose a mechanism or search the complete inventory.
            </SheetDescription>
          </SheetHeader>
          <div className="panel-body play-filter-fields">
            {inHardMode && !workspace && (
              <label>
                <span>Mechanism</span>
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
              <label>
                <span>Find a part</span>
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
        </SheetContent>
      </Sheet>
      <Sheet modal={false} open={progressOpen} onOpenChange={setProgressOpen}>
        <SheetContent
          className="explorer-panel settings-panel header-panel play-progress-panel"
          style={{ '--header-bottom': `${headerBottom}px` } as CSSProperties}
          showOverlay={false}
          scrollContent
          finalFocus={progressButton}
        >
          <SheetHeader>
            <SheetTitle>Assembly progress</SheetTitle>
            <SheetDescription>
              {session?.level === 'hard' ? 'Hard' : 'Easy'} build details
            </SheetDescription>
          </SheetHeader>
          <div className="panel-body play-progress-details">
            <p>
              <strong>{completedFits}</strong> of {levelSteps.length}{' '}
              {session?.level === 'hard' ? 'individual parts' : 'prepared fits'}
            </p>
            <p>
              <strong>{count}</strong> of {physicalTotal} physical parts added
            </p>
            <p>
              <strong>{completedSystems}</strong> of {manifest.groups.length}{' '}
              mechanisms complete
            </p>
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
              Ready now shows only pieces that can be fitted immediately; All
              parts keeps the complete dependency view available. Show seat is
              optional assistance: it reveals and reframes the fitting point.
              You can then tap the destination, or Tab to it and press Enter, to
              place without dragging.
            </p>
            <p>
              In Hard mode, open a subassembly card to build it one component at
              a time on its workbench. Return whenever you like, then seat the
              finished assembly in the watch. Undo reverses the last fit or
              transfer. Dial-edge screws have an explicit fitting view.
            </p>
            <p>
              Drag the canvas to rotate the movement freely, and scroll or pinch
              to zoom toward the center. Flip still gives you a quick change of
              side. On the canvas, F flips, + / − zoom, and Home resets the
              view. Camera controls preserve progress. Workbench return restores
              your watch camera.
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
        onCancel={(event) => {
          event.preventDefault();
          if (startupConflict) keepSavedStartup();
          else setConfirm(null);
        }}
      >
        <h2 id="play-confirm-title">
          {startupConflict?.kind === 'switch'
            ? `Start ${startupConflict.requested === 'hard' ? 'Hard' : 'Easy'} instead?`
            : startupConflict?.kind === 'replace'
              ? 'Replace the saved assembly?'
              : 'Start again?'}
        </h2>
        <p id="play-confirm-description">
          {startupConflict?.kind === 'switch'
            ? `This device has ${startupConflict.saved.actionIds.length} completed action${startupConflict.saved.actionIds.length === 1 ? '' : 's'} in ${startupConflict.saved.level === 'hard' ? 'Hard' : 'Easy'}. Starting the selected mode will replace that progress.`
            : startupConflict?.kind === 'replace'
              ? `The saved assembly is ${startupConflict.reason === 'corrupt' ? 'damaged' : 'from an incompatible version'}. It must be replaced before a new build can start.`
              : 'This replaces your saved progress with a fresh assembly.'}
        </p>
        <div>
          <Control
            onClick={() =>
              startupConflict ? keepSavedStartup() : setConfirm(null)
            }
            autoFocus
          >
            {startupConflict?.kind === 'switch'
              ? `Resume ${startupConflict.saved.level === 'hard' ? 'Hard' : 'Easy'}`
              : startupConflict?.kind === 'replace'
                ? 'Return to chooser'
                : 'Keep playing'}
          </Control>
          <Control onClick={startupConflict ? acceptStartup : discard}>
            {startupConflict
              ? `Start ${startupConflict.requested === 'hard' ? 'Hard' : 'Easy'}`
              : 'Start again'}
          </Control>
        </div>
      </dialog>
    </main>
  );
}
