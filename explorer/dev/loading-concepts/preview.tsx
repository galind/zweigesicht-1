import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MovementLoadingState } from '../../components/MovementLoadingMark';
import { SiteHeader } from '../../components/site-chrome';
import { concepts, ConceptMark } from './marks';
import '../../app/globals.css';
import '../../src/play/play.css';
import './studies.css';

const params = new URLSearchParams(location.search);
const selected = concepts.find((c) => c.id === params.get('concept'));
const surface = params.get('surface') === 'workshop' ? 'workshop' : 'home';
const enlarged = params.get('text') === '200';
if (enlarged) {
  document.documentElement.style.fontSize = '200%';
  document.documentElement.classList.add('text-enlarged');
}
const reduced = params.get('motion') === 'reduce';
const isolated = Boolean(selected);
document.body.classList.add(isolated ? 'study-isolated' : 'study-gallery');
if (reduced) document.body.classList.add('study-reduced');

function Study({ concept }: { concept: (typeof concepts)[number] }) {
  const [error, setError] = useState(params.get('state') === 'error');
  const [detail, setDetail] = useState(params.get('detail') !== 'none');
  const shell = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = shell.current;
    const header = element?.querySelector('header');
    if (!element || !header) return;
    const measure = () =>
      element.style.setProperty(
        '--header-bottom',
        `${header.getBoundingClientRect().bottom - element.getBoundingClientRect().top}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
  }, []);
  const loader = (
    <MovementLoadingState
      mark={<ConceptMark concept={concept.id} />}
      label={
        error
          ? 'Movement unavailable'
          : surface === 'home'
            ? 'Loading the movement'
            : 'Preparing the movement'
      }
      detail={
        error
          ? 'The movement could not be loaded. Please try again.'
          : surface === 'home' && detail
            ? 'Movement file · 37%'
            : undefined
      }
      tone={error ? 'error' : 'loading'}
      actionLabel={error ? 'Retry 3D' : undefined}
      onAction={() => setError(false)}
    />
  );
  return (
    <article className="study-card">
      {!isolated && (
        <div className="study-caption">
          <h2>{concept.name}</h2>
          <p>{concept.rationale}</p>
        </div>
      )}
      <div
        ref={shell}
        className={`study-viewport ${surface === 'workshop' ? 'play-app' : 'explorer'}`}
      >
        <SiteHeader />
        {surface === 'home' ? (
          <div className="fallback">
            <div className="load-message">{loader}</div>
          </div>
        ) : (
          <section className="play-loading" aria-label="Loading status">
            {loader}
          </section>
        )}
        <span className="study-context" aria-hidden="true">
          {surface === 'home' ? 'Movement explorer' : 'Workshop'} ·{' '}
          {concept.name}
        </span>
      </div>
      {!isolated && (
        <div className="study-notes">
          <p>{concept.motion}</p>
          <p>
            <strong>Strength:</strong> {concept.strength}
          </p>
          <p>
            <strong>Tradeoff:</strong> {concept.drawback}
          </p>
          <p>
            <strong>Reduced motion:</strong> {concept.reduced}
          </p>
          <div className="study-links">
            <a href={`?concept=${concept.id}&surface=${surface}`}>
              Open full view
            </a>
            <button onClick={() => setError((e) => !e)}>Toggle error</button>
            {surface === 'home' && (
              <button onClick={() => setDetail((d) => !d)}>
                Toggle transfer detail
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
function Preview() {
  return (
    <>
      {!isolated && (
        <header className="study-intro">
          <p className="study-eyebrow">Local design study · 02 October 2026</p>
          <h1>Constructing the movement.</h1>
          <p>
            Three technical studies: datums, sections and a fitted assembly.
            Shared status and recovery components; no CAD or simulated progress.
            The production loader is unchanged.
          </p>
          <nav aria-label="Study controls">
            <a
              aria-current={surface === 'home' ? 'page' : undefined}
              href={`?surface=home${reduced ? '&motion=reduce' : ''}`}
            >
              Homepage
            </a>
            <a
              aria-current={surface === 'workshop' ? 'page' : undefined}
              href={`?surface=workshop${reduced ? '&motion=reduce' : ''}`}
            >
              Workshop
            </a>
            <a href={`?surface=${surface}${reduced ? '' : '&motion=reduce'}`}>
              {reduced ? 'Use system motion setting' : 'Preview reduced motion'}
            </a>
          </nav>
        </header>
      )}
      <main className="study-grid">
        {(selected ? [selected] : concepts).map((c) => (
          <Study key={c.id} concept={c} />
        ))}
      </main>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Preview />);
