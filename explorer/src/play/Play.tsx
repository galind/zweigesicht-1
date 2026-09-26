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
  commitPlacement,
  createSession,
  currentStep,
  fittedLeafIds,
  getSavedSession,
  saveSession,
  undoPlacement,
} from './state';
import type { PlayLevel, PlayManifest, PlaySession } from './types';
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
export default function Play() {
  useTextScalePreview();
  const app = useRef<HTMLElement>(null);
  const choiceTitle = useRef<HTMLHeadingElement>(null);
  const progressTitle = useRef<HTMLHeadingElement>(null);
  const nextFocus = useRef<'piece' | 'choice' | null>(null);
  const host = useRef<HTMLDivElement>(null),
    stage = useRef<HTMLButtonElement>(null),
    destination = useRef<HTMLButtonElement>(null);
  const viewer = useRef<PlayViewer | null>(null),
    sessionRef = useRef<PlaySession | null>(null),
    activeRef = useRef(false);
  const [session, setSession] = useState<PlaySession | null>(null),
    [active, setActive] = useState(false);
  const [status, setStatus] = useState(blank),
    [storage, setStorage] = useState(''),
    [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(false),
    [hint, setHint] = useState(false),
    [help, setHelp] = useState(false);
  const [confirm, setConfirm] = useState<
      'restart' | 'levels' | PlayLevel | null
    >(null),
    [attempt, setAttempt] = useState(0);
  const helpButton = useRef<HTMLButtonElement>(null);
  const [headerBottom, setHeaderBottom] = useState(80);
  const dialog = useRef<HTMLDialogElement>(null),
    lastFocus = useRef<HTMLElement | null>(null);
  const apply = useCallback(
    (next: PlaySession, playing = true, persist = true) => {
      sessionRef.current = next;
      activeRef.current = playing;
      setSession(next);
      setActive(playing);
      setSelected(false);
      setHint(false);
      viewer.current?.update(
        new Set(fittedLeafIds(manifest, next)),
        playing ? currentStep(manifest, next) : null,
        playing,
      );
      if (persist)
        setStorage(
          saveSession(manifest, next).status === 'saved'
            ? 'Saved on this device'
            : 'Saving is unavailable. You can keep playing in this tab.',
        );
    },
    [],
  );
  useEffect(() => {
    // Hydrate the external local-storage session after mount.
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      const saved = getSavedSession(manifest);
      if (saved.status === 'saved') {
        sessionRef.current = saved.session;
        setSession(saved.session);
      } else if (saved.status === 'corrupt' || saved.status === 'incompatible')
        setStorage(
          saved.status === 'incompatible'
            ? 'Your saved assembly uses an earlier part sequence. Choose a level to start again with the dial screws.'
            : 'Your previous session cannot be restored. Choose a level to start again.',
        );
      else if (saved.status === 'unavailable')
        setStorage('Saving is unavailable. You can play in this tab.');
      if (saved.status === 'saved')
        viewer.current?.update(
          new Set(fittedLeafIds(manifest, saved.session)),
          null,
          false,
        );
    });
    return () => {
      mounted = false;
    };
  }, []);
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
          const step = currentStep(manifest, previous);
          if (
            document.activeElement === stage.current ||
            document.activeElement === destination.current
          )
            nextFocus.current = 'piece';
          apply(next);
          setNotice(
            `${step?.label} placed. ${next.completedStepIds.length} of ${manifest.levels[next.level].steps.length}.`,
          );
        },
        () => setSelected(true),
      );
      viewer.current = controller;
      const current = sessionRef.current;
      controller.update(
        new Set(
          current ? fittedLeafIds(manifest, current) : manifest.initialLeafIds,
        ),
        current && activeRef.current ? currentStep(manifest, current) : null,
        activeRef.current,
      );
      void controller.load();
      if (new URLSearchParams(location.search).has('inspect')) {
        Object.assign(window, {
          __playInspect: () => ({
            ...controller.inspect(),
            session: sessionRef.current,
            active: activeRef.current,
          }),
          __playContext: (restore = false) => {
            if (restore) controller.renderer.forceContextRestore();
            else controller.renderer.forceContextLoss();
          },
        });
      }
    } catch {
      queueMicrotask(() =>
        setStatus({
          ...blank,
          error: '3D could not start. Retry the view to continue.',
        }),
      );
    }
    return () => {
      controller?.dispose();
      viewer.current = null;
      const w = window as unknown as Record<string, unknown>;
      delete w.__playInspect;
      delete w.__playContext;
    };
  }, [apply, attempt]);
  useEffect(() => {
    if (confirm) {
      lastFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
      if (!nextFocus.current && lastFocus.current?.isConnected)
        lastFocus.current.focus();
      lastFocus.current = null;
    }
  }, [confirm]);
  useLayoutEffect(() => {
    const layout = () => {
      const storageMessage = app.current?.querySelector('.play-storage');
      app.current?.style.setProperty(
        '--storage-height',
        `${storageMessage?.getBoundingClientRect().height ?? 0}px`,
      );
      const caption = app.current?.querySelector('.play-stage-caption');
      app.current?.style.setProperty(
        '--play-stage-reserve',
        `${(stage.current?.offsetHeight || 84) + (caption?.getBoundingClientRect().height ?? 0) + 8}px`,
      );
      const heading = app.current?.querySelector('.play-heading');
      if (heading) {
        const bottom = heading.getBoundingClientRect().bottom;
        setHeaderBottom(bottom);
        app.current?.style.setProperty('--play-header-bottom', `${bottom}px`);
      }
      viewer.current?.layout();
    };
    layout();
    const observer = new ResizeObserver(layout);
    host.current?.parentElement
      ?.querySelectorAll(
        '.play-heading, .play-dock, .play-choice, .play-stage-caption, .play-storage',
      )
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [active, session, hint, storage, status.ready]);
  const step = session && active ? currentStep(manifest, session) : null;
  const total = session ? manifest.levels[session.level].steps.length : 0;
  const completed = !!session && active && !step;
  const disabled = !status.ready || status.busy;
  useEffect(() => {
    if (confirm || disabled || !nextFocus.current) return;
    const target =
      nextFocus.current === 'choice'
        ? choiceTitle.current
        : step
          ? stage.current
          : progressTitle.current;
    if (target) {
      target.focus({ preventScroll: true });
      nextFocus.current = null;
    }
  }, [confirm, disabled, active, step]);
  const start = (level: PlayLevel) => {
    nextFocus.current = 'piece';
    apply(createSession(manifest, level));
    setNotice(`${level === 'easy' ? 'Easy' : 'Hard'} assembly started.`);
  };
  const requestConfirmation = (intent: 'restart' | 'levels' | PlayLevel) => {
    setHelp(false);
    setConfirm(intent);
  };
  const choose = (level: PlayLevel) => {
    if (session?.completedStepIds.length) requestConfirmation(level);
    else start(level);
  };
  const undo = () => {
    if (!session) return;
    const next = undoPlacement(manifest, session);
    apply(next);
    setNotice('Last placement undone. The previous piece is ready.');
  };
  const discard = () => {
    if (confirm === 'levels') {
      nextFocus.current = 'choice';
      activeRef.current = false;
      setActive(false);
      setSelected(false);
      viewer.current?.update(new Set(manifest.initialLeafIds), null, false);
    } else if (confirm === 'restart' && session) start(session.level);
    else if (confirm === 'easy' || confirm === 'hard') start(confirm);
    setConfirm(null);
  };
  return (
    <main ref={app} className="play-app" data-active={active}>
      <div className="play-canvas" ref={host} />
      <header className="play-heading">
        <span>Zweigesicht–1</span>
        <span>Assembly</span>
        <Control
          ref={helpButton}
          onClick={() => setHelp(!help)}
          aria-expanded={help}
          aria-controls="play-help"
        >
          How to play
        </Control>
      </header>
      <Control
        ref={stage}
        className="play-stage"
        aria-label={step ? `Select ${step.label}` : 'Current piece'}
        aria-pressed={selected}
        disabled={disabled || !step}
        hidden={!step}
        onClick={() => setSelected(true)}
      >
        <span
          className="play-stage-caption"
          data-selected={selected}
          aria-hidden="true"
        >
          <span>Drag this piece</span>
          <span>Selected</span>
        </span>
      </Control>
      <Control
        ref={destination}
        className="play-target"
        data-hint={hint}
        aria-label={
          step ? `Place ${step.label} at its destination` : 'Destination'
        }
        disabled={disabled || !selected || !step}
        hidden={!step}
        onClick={() => {
          nextFocus.current = 'piece';
          viewer.current?.place();
        }}
      >
        <span aria-hidden="true">＋</span>
      </Control>
      {!active && (
        <section className="play-choice" aria-labelledby="play-title">
          <h1 ref={choiceTitle} id="play-title" tabIndex={-1}>
            Assemble the movement
          </h1>
          <p>Choose how much you assemble. Take your time.</p>
          {session && (
            <Control
              className="play-primary"
              disabled={disabled}
              onClick={() => {
                nextFocus.current = 'piece';
                apply(session, true, false);
              }}
            >
              Continue {session.level === 'easy' ? 'Easy' : 'Hard'} ·{' '}
              {session.completedStepIds.length} / {total}
            </Control>
          )}
          <div className="play-levels">
            <Control disabled={disabled} onClick={() => choose('easy')}>
              <strong>Easy</strong>
              <span>
                Prepared assemblies · {manifest.levels.easy.steps.length} steps
              </span>
            </Control>
            <Control disabled={disabled} onClick={() => choose('hard')}>
              <strong>Hard</strong>
              <span>
                Individual components · {manifest.levels.hard.steps.length}{' '}
                steps
              </span>
            </Control>
          </div>
          <small>The fitted mainplate is ready in both levels.</small>
        </section>
      )}
      {active && (
        <section className="play-dock" aria-label="Assembly controls">
          <div className="play-progress">
            <span>
              {session?.level === 'easy' ? 'Easy' : 'Hard'}{' '}
              <span aria-hidden="true">·</span>{' '}
              {session?.completedStepIds.length} / {total}
            </span>
            <span>
              {completed
                ? 'Complete'
                : status.cutaway
                  ? 'Assembly close-up'
                  : status.side === 'front'
                    ? 'Three-hands face'
                    : 'Skeleton face'}
            </span>
          </div>
          <h1 ref={progressTitle} tabIndex={-1}>
            {completed ? 'Every piece in place.' : step?.label}
          </h1>
          <p>
            {completed
              ? 'Your watch is assembled. Turn it over and take a look.'
              : selected
                ? 'Drag to the ring, or activate the destination.'
                : 'Drag the piece into the ring. Or select it, then tap the destination.'}
          </p>
          {hint && step && (
            <p className="play-hint">
              {step.instruction ||
                'The ring marks the fitted position. Orientation is taken care of.'}{' '}
              Small fittings are enlarged in staging.
            </p>
          )}
          <div className="play-actions">
            <Control
              disabled={disabled || !session?.completedStepIds.length}
              onClick={undo}
            >
              <Undo2 aria-hidden="true" /> Undo
            </Control>
            {step && (
              <Control
                disabled={disabled}
                title="Return to the current piece’s placement view; keep assembly progress"
                onClick={() => {
                  setHelp(false);
                  viewer.current?.guide();
                }}
              >
                <LocateFixed aria-hidden="true" /> Show placement
              </Control>
            )}
            <FlipButton
              disabled={disabled}
              onClick={() => {
                setHelp(false);
                viewer.current?.flip();
              }}
            />
            <ResetViewButton
              disabled={disabled}
              title="Return to the straight-on view; keep assembly progress"
              onClick={() => {
                setHelp(false);
                viewer.current?.resetView();
              }}
            />
            {step && (
              <Control
                disabled={disabled}
                aria-pressed={hint}
                onClick={() => setHint(!hint)}
              >
                <Lightbulb aria-hidden="true" /> Hint
              </Control>
            )}
            <Control
              disabled={disabled}
              aria-label={completed ? 'Play again' : 'Restart assembly'}
              title="Start a new assembly after confirmation"
              onClick={() => requestConfirmation('restart')}
            >
              <ListRestart aria-hidden="true" />{' '}
              {completed ? 'Play again' : 'Restart'}
            </Control>
            <Control
              disabled={disabled}
              aria-label="Choose difficulty"
              title="Choose Easy or Hard; keep your save until a new assembly starts"
              onClick={() => requestConfirmation('levels')}
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
              Drag the staged part near the ring and release. A missed drop
              simply returns it. Tap the part and then the ring, or use Tab and
              Enter, if you prefer.
            </p>
            <p>
              Drag empty space to orbit. Scroll or pinch to zoom. On the canvas,
              arrow keys orbit, + / − zoom, and Home resets the current view.
              Reset view keeps your progress and the face you are viewing. Show
              placement returns to the current piece’s guided view. Undo returns
              the last piece.
            </p>
            <p>
              Close-ups temporarily hide surrounding parts so small fittings
              remain visible. The completed watch brings everything together.
            </p>
            <small>
              A guided puzzle using Marco Lang’s CAD, not watch-servicing
              instructions.
            </small>
          </div>
        </SheetContent>
      </Sheet>
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {notice}
      </output>
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
            ? 'You can continue your saved assembly from the level screen. Starting another level replaces it.'
            : 'This replaces your current progress with a fresh assembly.'}
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
