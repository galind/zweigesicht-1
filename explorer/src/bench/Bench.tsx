'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { BenchViewer, BenchStatus } from './BenchViewer';
import { BenchControls } from './BenchControls';
import { FLIP_KEY } from './bindings';
import { consumeBenchEntry } from './entryIntent';
import './bench.css';
const initial: BenchStatus = {
  ready: false,
  captured: false,
  side: 'bridge',
  error: '',
  quality: 'Auto',
};
export default function Bench() {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<BenchViewer | null>(null);
  const enter = useRef<HTMLButtonElement>(null);
  const entryIntent = useRef<boolean | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [state, setState] = useState(initial),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    if (entryIntent.current === null) entryIntent.current = consumeBenchEntry();
    let shouldEnter = attempt === 0 && entryIntent.current;
    const cancelEntry = () => {
      shouldEnter = false;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelEntry();
    };
    const onVisibility = () => {
      if (document.hidden) cancelEntry();
    };
    window.addEventListener('blur', cancelEntry);
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
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
          void v.load().then(() => {
            if (
              !disposed &&
              shouldEnter &&
              v.status.ready &&
              document.hasFocus() &&
              !document.hidden
            ) {
              shouldEnter = false;
              void v.enter();
            }
          });
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
            error: 'The walking experience could not load. Retry to reconnect.',
          });
      });
    return () => {
      disposed = true;
      window.removeEventListener('blur', cancelEntry);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      viewer.current?.dispose();
      viewer.current = null;
      delete (window as unknown as { bench?: BenchViewer }).bench;
    };
  }, [attempt]);
  useEffect(() => {
    if (!state.captured && (state.ready || state.error)) enter.current?.focus();
  }, [state.ready, state.captured, state.error]);
  return (
    <main className="bench-experience">
      <div className="bench-canvas" ref={host} />
      {!state.captured && hasEntered && (
        <div
          className="bench-menu-backdrop bg-black/10 backdrop-blur-xs"
          aria-hidden="true"
        />
      )}
      <header className="bench-header">
        <Link href="/" aria-label="Back to the explorer">
          ← Zweigesicht-1
        </Link>
      </header>
      {!state.captured && (
        <section
          className={hasEntered ? 'bench-menu' : 'bench-start'}
          aria-label="Walking menu"
        >
          {hasEntered && <h1>Walk inside the movement</h1>}
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
              {hasEntered ? 'Resume exploring' : 'Enter the movement'}
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
            <output className="bench-loading">Loading the movement…</output>
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
        <div className="bench-legend">
          <span>
            <kbd>WASD</kbd> Move
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
