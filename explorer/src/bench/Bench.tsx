'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { BenchViewer, BenchStatus } from './BenchViewer';
import './bench.css';
const initial: BenchStatus = {
  ready: false,
  captured: false,
  busy: false,
  side: 'bridge',
  error: '',
  quality: 'Auto',
};
export default function Bench() {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<BenchViewer | null>(null);
  const enter = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState(initial),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    void import('./BenchViewer')
      .then(({ BenchViewer }) => {
        if (disposed || !host.current) return;
        setState(initial);
        try {
          const v = new BenchViewer(host.current, setState);
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
            error: 'The walking experience could not load. Retry to reconnect.',
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
    if (state.ready && !state.captured) enter.current?.focus();
  }, [state.ready, state.captured]);
  return (
    <main className="bench-experience">
      <div className="bench-canvas" ref={host} />
      <header className="bench-header">
        <Link href="/" aria-label="Return to homepage">
          ← Zweigesicht-1
        </Link>
        <span>
          {state.side === 'bridge' ? 'Bridge side' : 'Dial side'} <i> / </i>{' '}
          1.65 mm tall
        </span>
      </header>
      {!state.captured && (
        <section className="bench-menu" aria-label="Walking menu">
          <p className="bench-kicker">A different perspective</p>
          <h1>
            Walk inside
            <br />
            the movement.
          </h1>
          <p>
            From the green mat to the plates and bridges.
            <br />
            Follow the red ramp, then find your own way.
          </p>
          <div className="bench-menu-controls">
            <span>
              <kbd>W A S D</kbd> Walk
            </span>
            <span>
              <kbd>Mouse</kbd> Look
            </span>
            <span>
              <kbd>Space</kbd> Jump
            </span>
            <span>
              <kbd>T</kbd> Other side
            </span>
            <span>
              <kbd>R</kbd> Start again
            </span>
            <span>
              <kbd>Esc</kbd> Menu
            </span>
          </div>
          {state.error && (
            <p role="alert" className="bench-error">
              {state.error}
            </p>
          )}
          {state.ready ? (
            <button
              ref={enter}
              className="bench-enter"
              disabled={state.busy}
              onClick={() => void viewer.current?.enter()}
            >
              Enter the movement
            </button>
          ) : state.error ? (
            <button
              className="bench-enter"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Retry loading
            </button>
          ) : (
            <output className="bench-loading">
              Preparing the movement and walking surfaces…
            </output>
          )}
          {state.ready && (
            <div className="bench-options">
              <button
                onClick={() => viewer.current?.reset()}
                disabled={state.busy}
              >
                Reset position
              </button>
              <button
                onClick={() => viewer.current?.switchSide()}
                disabled={state.busy}
              >
                Switch side
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
          <p className="bench-note">
            Desktop keyboard & mouse · Static CAD exploration
          </p>
          <Link className="bench-back" href="/">
            Back to the explorer
          </Link>
        </section>
      )}
      {state.captured && (
        <>
          <div className="bench-reticle" aria-hidden="true" />
          <div className="bench-legend">
            <span>
              <kbd>WASD</kbd> Walk
            </span>
            <span>
              <kbd>Space</kbd> Jump
            </span>
            <span>
              <kbd>T</kbd> Side
            </span>
            <span>
              <kbd>R</kbd> Reset
            </span>
            <span>
              <kbd>Esc</kbd> Menu
            </span>
          </div>
        </>
      )}
      <div
        className={'bench-fade' + (state.busy ? ' is-active' : '')}
        aria-hidden="true"
      />
      <div className="bench-sr" aria-live="polite">
        {state.busy
          ? 'Changing presentation. Returning to the mat.'
          : state.ready
            ? `${state.side} side ready`
            : ''}
      </div>
    </main>
  );
}
