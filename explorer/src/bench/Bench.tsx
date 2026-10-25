'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { BenchViewer, BenchStatus } from './BenchViewer';
import { BenchControls } from './BenchControls';
import { FLIP_KEY } from './bindings';
import { useBenchAccess } from './useBenchAccess';
import { useTextScalePreview } from '../experience/useTextScalePreview';
import './bench.css';
const flipNotice = 'Move away from the movement to flip it.';
const initial: BenchStatus = {
  ready: false,
  captured: false,
  side: 'bridge',
  error: '',
  flipBlocked: false,
  quality: 'Auto',
};
function BenchHeader() {
  return (
    <header className="bench-header">
      <Link href="/" aria-label="Back to the explorer">
        ← Zweigesicht-1
      </Link>
    </header>
  );
}
export default function Bench() {
  useTextScalePreview();
  const access = useBenchAccess();
  if (access === 'ready') return <BenchScene />;
  return (
    <main className="bench-experience">
      <BenchHeader />
      <section className="bench-start" aria-labelledby="bench-access-title">
        <h1 id="bench-access-title">
          {access === 'checking' ? 'The workbench' : 'Explore on desktop'}
        </h1>
        <p className="bench-introduction">
          {access === 'checking'
            ? 'Checking controls…'
            : 'Keyboard and mouse required. Touch controls are not available for this experience.'}
        </p>
        {access === 'unsupported' && (
          <p className="bench-introduction">
            This browser does not support mouse capture. Try another desktop
            browser.
          </p>
        )}
        <Link href="/" className="bench-enter">
          Return to the explorer
        </Link>
      </section>
    </main>
  );
}
function BenchScene() {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<BenchViewer | null>(null);
  const enter = useRef<HTMLButtonElement>(null);
  const introduction = useRef<HTMLHeadingElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [state, setState] = useState(initial),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    void import('./BenchViewer')
      .then(({ BenchViewer }) => {
        if (disposed || !host.current) return;
        setState(initial);
        try {
          const v = new BenchViewer(host.current, (status) => {
            if (status.captured) setHasEntered(true);
            setState(status);
          });
          viewer.current = v;
          if (new URLSearchParams(location.search).has('inspect'))
            (window as unknown as { bench: BenchViewer | undefined }).bench = v;
          void v.load();
        } catch (error) {
          console.error(error);
          setState({
            ...initial,
            error:
              'This browser could not start 3D graphics. Retry, or return to the explorer.',
          });
        }
      })
      .catch(() => {
        if (!disposed)
          setState({
            ...initial,
            error: 'The workbench could not load. Retry to reconnect.',
          });
      });
    return () => {
      disposed = true;
      viewer.current?.dispose();
      viewer.current = null;
      delete (window as unknown as { bench?: BenchViewer }).bench;
    };
  }, [attempt]);
  useEffect(() => {
    introduction.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!state.captured && (hasEntered || state.error)) enter.current?.focus();
  }, [hasEntered, state.ready, state.captured, state.error]);
  return (
    <main className="bench-experience">
      <div className="bench-canvas" ref={host} />
      {!state.captured && hasEntered && (
        <div
          className="bench-menu-backdrop bg-black/10 backdrop-blur-xs"
          aria-hidden="true"
        />
      )}
      <BenchHeader />
      {!state.captured && (
        <section
          className={hasEntered ? 'bench-menu' : 'bench-start'}
          aria-labelledby="bench-title"
        >
          <h1 id="bench-title" ref={introduction} tabIndex={-1}>
            The workbench
          </h1>
          {!hasEntered && (
            <>
              <p className="bench-introduction">
                Explore the movement, its holders and detached parts at
                miniature scale.
              </p>
              <BenchControls />
              <p className="bench-introduction">
                Keyboard and mouse required. Esc releases the pointer.
              </p>
            </>
          )}
          {state.error && (
            <p role="alert" className="bench-error">
              {state.error}
            </p>
          )}
          {state.ready ? (
            <button
              ref={enter}
              className="bench-enter"
              onClick={() => void viewer.current?.enter()}
            >
              {hasEntered ? 'Resume exploring' : 'Start exploring'}
            </button>
          ) : state.error ? (
            <button
              ref={enter}
              className="bench-enter"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Retry loading
            </button>
          ) : (
            <output className="bench-loading">Preparing the workbench…</output>
          )}
          {state.flipBlocked && (
            <output className="bench-flip-notice">{flipNotice}</output>
          )}
          {hasEntered && <BenchControls />}
          {state.ready && hasEntered && (
            <div className="bench-options">
              <button onClick={() => viewer.current?.reset()}>
                Reset position
              </button>
              <button
                title="Auto adjusts resolution for responsiveness. Low and High stay fixed."
                onClick={() =>
                  viewer.current?.quality(
                    state.quality === 'Auto'
                      ? 'Low'
                      : state.quality === 'Low'
                        ? 'High'
                        : 'Auto',
                  )
                }
              >
                Detail: {state.quality}
              </button>
            </div>
          )}
        </section>
      )}
      {state.captured && (
        <div
          className={
            state.flipBlocked
              ? 'bench-legend bench-legend-notice'
              : 'bench-legend'
          }
        >
          {state.flipBlocked ? (
            <output className="bench-flip-notice">{flipNotice}</output>
          ) : (
            <>
              <span>
                <kbd>WASD</kbd> Move
              </span>
              <span>
                <kbd>Shift</kbd> Hold to run
              </span>
              <span>
                <kbd>Space</kbd> Hold to rise
              </span>
              <span>
                <kbd>{FLIP_KEY.label}</kbd> Flip
              </span>
              <span>
                <kbd>R</kbd> Reset
              </span>
              <span>
                <kbd>Esc</kbd> Menu
              </span>
            </>
          )}
        </div>
      )}
      <div className="bench-sr" aria-live="polite">
        {state.ready
          ? `${state.side === 'bridge' ? 'Bridge' : 'Dial side'} facing up`
          : ''}
      </div>
    </main>
  );
}
