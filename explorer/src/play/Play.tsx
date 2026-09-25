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
    if (new URLSearchParams(location.search).get('text') === '200')
      document
        .querySelector<HTMLElement>('.play-app')
        ?.style.setProperty('font-size', '200%');
    viewer.current?.layout();
  }, []);
  useEffect(() => {
    if (confirm) {
      lastFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
      lastFocus.current?.focus();
    }
  }, [confirm]);
  useLayoutEffect(() => {
    const layout = () => {
      viewer.current?.layout();
      const heading =
        host.current?.parentElement?.querySelector('.play-heading');
      if (heading) setHeaderBottom(heading.getBoundingClientRect().bottom);
    };
    layout();
    const observer = new ResizeObserver(layout);
    host.current?.parentElement
      ?.querySelectorAll(
        '.play-heading, .play-dock, .play-choice, .play-stage-caption',
      )
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [active, session, hint, status.ready]);
  const step = session && active ? currentStep(manifest, session) : null;
  const total = session ? manifest.levels[session.level].steps.length : 0;
  const completed = !!session && active && !step;
  const disabled = !status.ready || status.busy;
  const start = (level: PlayLevel) => {
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
      activeRef.current = false;
      setActive(false);
      setSelected(false);
      viewer.current?.update(new Set(manifest.initialLeafIds), null, false);
    } else if (confirm === 'restart' && session) start(session.level);
    else if (confirm === 'easy' || confirm === 'hard') start(confirm);
    setConfirm(null);
  };
  return (
    <main className="play-app" data-active={active}>
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
        onClick={() => viewer.current?.place()}
      >
        <span aria-hidden="true">＋</span>
      </Control>
      {!active && (
        <section className="play-choice" aria-labelledby="play-title">
          <h1 id="play-title">Assemble the movement</h1>
          <p>Choose how much you assemble. Take your time.</p>
          {session && (
            <Control
              className="play-primary"
              disabled={disabled}
              onClick={() => apply(session, true, false)}
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
          <h1>{completed ? 'Every piece in place.' : step?.label}</h1>
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
          <p>{status.error || 'Preparing the watch…'}</p>
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
      <div className="play-storage">{storage}</div>
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
      <output className="play-sr" aria-live="polite" aria-atomic="true">
        {notice}
      </output>
      <dialog
        ref={dialog}
        className="play-confirm"
        onCancel={() => setConfirm(null)}
      >
        <h2>
          {confirm === 'levels' ? 'Choose a different level?' : 'Start again?'}
        </h2>
        <p>
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
