'use client';
import { runUxChecks } from '@/src/viewer/uxValidation';
import { runExplosionChecks } from '@/src/viewer/explosionValidation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FlipHorizontal2,
  RotateCcw,
} from 'lucide-react';
import { Select as SelectPrimitive } from '@base-ui/react/select';
import { loadingMessage } from '@/src/experience/loading';
import {
  MovementViewer,
  type ViewerSnapshot,
} from '@/src/viewer/MovementViewer';
import { registerMovementTools } from '@/src/experience/webmcp';
import { runDialChecks } from '@/src/viewer/dialValidation';
import { runCameraChecks } from '@/src/viewer/cameraValidation';
import { runBrowserChecks, startBenchmark } from '@/src/viewer/validation';
import { captureMotion, type MotionCase } from '@/src/viewer/capture';
import { DialControls } from '@/components/DialControls';
import { initialState } from '@/src/experience/state';
import {
  GROUPS,
  ROOT,
  inMembers,
  partLabel,
  buildPartIndex,
  matchesPart,
  type Part,
} from '@/src/experience/catalog';
import { SPREAD_GROUPS } from '@/src/experience/spread';
import { factsFor } from '@/src/experience/copy';
import { Slider } from '@/components/ui/slider';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
const empty: ViewerSnapshot = {
  ...initialState,
  ready: false,
  loadStage: 'movement',
  transfer: null,
  catalogLoading: false,
  dialRequest: null,
  dialError: '',
  spreadFocus: null,
  status: '',
  error: '',
  detailError: '',
  parts: [],
  canBack: false,
  catalogLoaded: false,
  benchmarkResult: null,
  stats: {},
};
export default function Home() {
  const catalogButton = useRef<HTMLButtonElement>(null),
    optionsButton = useRef<HTMLButtonElement>(null),
    aboutButton = useRef<HTMLButtonElement>(null),
    detailButton = useRef<HTMLButtonElement>(null);
  const selectionFocus = useRef(false);
  const panelAnchor = useRef<HTMLElement | null>(null);
  const [panelX, setPanelX] = useState<number | null>(null);
  const [panelBottom, setPanelBottom] = useState<number | null>(null);
  const [optionsTop, setOptionsTop] = useState(64);
  const panelStyle = {
    '--panel-anchor-x': panelX === null ? '50vw' : `${panelX}px`,
    '--panel-bottom': panelBottom === null ? undefined : `${panelBottom}px`,
  } as CSSProperties;
  useEffect(() => {
    const measure = () => {
      const optionsRect = optionsButton.current?.getBoundingClientRect();
      if (optionsRect) setOptionsTop(optionsRect.bottom + 12);
      const rect = panelAnchor.current?.getBoundingClientRect();
      if (rect) setPanelX(rect.left + rect.width / 2);
      const dockRect = document
        .querySelector('.action-dock')
        ?.getBoundingClientRect();
      if (dockRect) setPanelBottom(window.innerHeight - dockRect.top + 12);
    };
    window.addEventListener('resize', measure);
    const observer = new ResizeObserver(measure);
    const dock = document.querySelector('.action-dock');
    if (dock) observer.observe(dock);
    if (optionsButton.current) observer.observe(optionsButton.current);
    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, []);
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<MovementViewer | null>(null);
  const [s, set] = useState<ViewerSnapshot>(empty),
    [catalog, setCatalog] = useState(false),
    [about, setAbout] = useState(false),
    [explore, setExplore] = useState(false),
    [separate, setSeparate] = useState(false),
    [dials, setDials] = useState(false),
    [options, setOptions] = useState(false),
    [details, setDetails] = useState(false),
    [inspect, setInspect] = useState(false),
    [qa, setQa] = useState<unknown>(null);
  const [motion, setMotion] = useState<unknown>(null);
  const [catalogQuery, setCatalogQuery] = useState('');
  const partIndex = useMemo(() => buildPartIndex(s.parts), [s.parts]);
  const catalogParts = useMemo(
    () => s.parts.filter((p) => p.id !== 'p_0_1_1_1'),
    [s.parts],
  );
  const available = s.ready && !s.error && s.loadStage === 'ready';
  useEffect(() => {
    if (!host.current) return;
    const flags = new URLSearchParams(location.search);
    queueMicrotask(() => setInspect(flags.has('inspect')));
    document.documentElement.style.fontSize =
      flags.get('text') === '200' ? '200%' : '';
    document.documentElement.classList.toggle(
      'text-enlarged',
      flags.get('text') === '200',
    );
    if (flags.has('no3d')) {
      queueMicrotask(() =>
        set((prev) => ({
          ...prev,
          error:
            'Explore the section descriptions, or retry the interactive view.',
          loadStage: 'error',
          status: '',
        })),
      );
      return;
    }
    let v: MovementViewer;
    try {
      v = new MovementViewer(host.current, set);
      if (
        flags.has('inspect') &&
        ['render-failure', 'contact-failure'].includes(
          flags.get('delivery') ?? '',
        )
      ) {
        const render = v.renderer.render.bind(v.renderer);
        v.renderer.render = (...args) => {
          if (
            v.awaitingFirstFrame &&
            (flags.get('delivery') === 'render-failure' ||
              v.scene.overrideMaterial)
          ) {
            v.renderer.render = render;
            throw new Error('Local inspection: first prepared frame fails');
          }
          return render(...args);
        };
      }
      viewer.current = v;
    } catch {
      queueMicrotask(() =>
        set((prev) => ({
          ...prev,
          error:
            'Explore the section descriptions, or retry the interactive view.',
          loadStage: 'error',
          status: '',
        })),
      );
      return;
    }
    const unregister = registerMovementTools(v);
    return () => {
      unregister();
      v.dispose();
      viewer.current = null;
    };
  }, []);
  const group = GROUPS.find((g) => g.id === s.group),
    selected = s.parts.find((p) => p.id === s.part),
    members = s.parts.filter(
      (p) => !p.isAssembly && group && inMembers(p.id, group.members),
    );
  useEffect(() => {
    queueMicrotask(() => setDetails(false));
  }, [s.part, s.group]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        catalog ||
        about ||
        explore ||
        separate ||
        dials ||
        options ||
        details
      )
        return;
      event.preventDefault();
      viewer.current?.deselect();
      host.current?.querySelector('canvas')?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [catalog, about, explore, separate, dials, options, details]);
  const selectPart = (id: string) => {
    selectionFocus.current = true;
    setCatalog(false);
    setOptions(false);
    setDetails(false);
    void viewer.current?.select(id);
  };
  const chooseGroup = (id: string | null) => {
    setExplore(false);
    setDetails(false);
    if (viewer.current) viewer.current.group(id);
    else
      set((prev) => ({
        ...prev,
        group: id,
        part: null,
        phase: id ? 'mechanism' : 'whole',
      }));
  };
  const dialSide = s.side;
  const sideLabel = 'Switch side';
  const closePanels = () => {
    setExplore(false);
    setSeparate(false);
    setDials(false);
    setOptions(false);
    setDetails(false);
    setCatalog(false);
    setAbout(false);
  };
  const openPanel = (update: (open: boolean) => void, open: boolean) => {
    if (open) {
      selectionFocus.current = false;
      const selector =
        update === setExplore
          ? '.explore-button'
          : update === setDials
            ? '.dial-trigger'
            : update === setSeparate
              ? '.separate-trigger'
              : '.action-dock';
      panelAnchor.current = document.querySelector<HTMLElement>(selector);
      const rect = panelAnchor.current?.getBoundingClientRect();
      if (rect) setPanelX(rect.left + rect.width / 2);
      const dockRect = document
        .querySelector('.action-dock')
        ?.getBoundingClientRect();
      if (dockRect) setPanelBottom(window.innerHeight - dockRect.top + 12);
      closePanels();
    }
    update(open);
  };
  const patch = (v: Parameters<MovementViewer['patch']>[0]) =>
    viewer.current?.patch(v);
  return (
    <main
      className={
        'explorer' +
        (group || selected || s.layout === 'spread' ? ' has-focus' : '')
      }
    >
      <header className="topbar">
        <div className="identity">
          <h1>Zweigesicht</h1>
          <span>ml–01</span>
        </div>
        <nav className="global-actions" aria-label="View history and options">
          <button
            className="text-button back-button"
            aria-label="Back"
            title="Previous view"
            disabled={!available || !s.canBack}
            onClick={() => {
              viewer.current?.back();
              host.current?.querySelector('canvas')?.focus();
            }}
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <Sheet
            modal={false}
            open={options}
            onOpenChange={(open) => {
              if (open) selectionFocus.current = false;
              openPanel(setOptions, open);
            }}
          >
            <SheetTrigger
              ref={optionsButton}
              className="text-button options-trigger"
            >
              Options
            </SheetTrigger>
            <SheetContent
              side="top"
              style={{ '--options-top': `${optionsTop}px` } as CSSProperties}
              className="explorer-panel about-sheet options-panel"
              showOverlay={false}
              scrollContent
              finalFocus={() =>
                selectionFocus.current
                  ? (host.current?.querySelector('canvas') ?? false)
                  : optionsButton.current
              }
            >
              <SheetHeader>
                <SheetTitle>View options</SheetTitle>
                <SheetDescription>
                  Camera, quality and sources.
                </SheetDescription>
              </SheetHeader>
              <div className="about-copy">
                <p>
                  Drag to orbit. Pinch or scroll to zoom. Tap a component to
                  inspect it. Tap empty space to deselect. In All parts, drag to
                  pan.
                </p>
                <fieldset
                  className="alternative-controls"
                  aria-label="Camera controls"
                  disabled={!available}
                >
                  {s.layout !== 'spread' && (
                    <>
                      <button
                        className="tool"
                        onClick={() => viewer.current?.orbit(-0.25, 0)}
                      >
                        Orbit left
                      </button>
                      <button
                        className="tool"
                        onClick={() => viewer.current?.orbit(0.25, 0)}
                      >
                        Orbit right
                      </button>
                      <button
                        className="tool"
                        onClick={() => viewer.current?.orbit(0, -0.2)}
                      >
                        Tilt up
                      </button>
                      <button
                        className="tool"
                        onClick={() => viewer.current?.orbit(0, 0.2)}
                      >
                        Tilt down
                      </button>
                    </>
                  )}
                  <button
                    className="tool"
                    onClick={() => viewer.current?.zoom(0.8)}
                  >
                    Zoom in
                  </button>
                  <button
                    className="tool"
                    onClick={() => viewer.current?.zoom(1.25)}
                  >
                    Zoom out
                  </button>
                  {s.layout === 'spread' && (
                    <>
                      <button
                        className="tool"
                        onClick={() => viewer.current?.pan(-0.15, 0)}
                      >
                        Pan left
                      </button>
                      <button
                        className="tool"
                        onClick={() => viewer.current?.pan(0.15, 0)}
                      >
                        Pan right
                      </button>
                      <button
                        className="tool"
                        onClick={() => viewer.current?.pan(0, -0.15)}
                      >
                        Pan up
                      </button>
                      <button
                        className="tool"
                        onClick={() => viewer.current?.pan(0, 0.15)}
                      >
                        Pan down
                      </button>
                    </>
                  )}
                </fieldset>
                <p className="secondary">
                  On the movement: arrow keys orbit (pan in All parts), + / −
                  zoom, Home resets, Escape deselects. All components are also
                  available in the catalog.
                </p>
                <div className="quality-control">
                  <label htmlFor="render-quality">Rendering quality</label>
                  <Select
                    value={s.quality}
                    disabled={!available}
                    onValueChange={(v) =>
                      patch({ quality: v as 'auto' | 'high' | 'low' })
                    }
                  >
                    <SelectPrimitive.Trigger
                      className="tool quality-trigger"
                      id="render-quality"
                      aria-label="Rendering quality"
                    >
                      <SelectValue>
                        {s.quality === 'auto'
                          ? 'Automatic'
                          : s.quality === 'high'
                            ? 'High'
                            : 'Lightweight'}
                      </SelectValue>
                      <ChevronDown aria-hidden="true" />
                    </SelectPrimitive.Trigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="low">Lightweight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <button
                  ref={catalogButton}
                  className="menu-link"
                  onClick={() => openPanel(setCatalog, true)}
                  disabled={!s.parts.length}
                >
                  Source catalog <ChevronRight aria-hidden="true" />
                </button>
                <button
                  ref={aboutButton}
                  className="menu-link"
                  onClick={() => openPanel(setAbout, true)}
                >
                  About & sources <ChevronRight aria-hidden="true" />
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>
      <section className="workspace" aria-label="Movement explorer">
        <div
          className="stage"
          ref={host}
          aria-label="Interactive CAD movement"
          aria-busy={!available}
          inert={!available}
          style={{ visibility: available ? 'visible' : 'hidden' }}
        />
        <output className="sr-only" aria-live="polite" aria-atomic="true">
          {loadingMessage(s.loadStage)}
        </output>
        {!available && (
          <div className="fallback">
            <div className="load-message">
              <p>{loadingMessage(s.loadStage)}</p>
              {s.error ? (
                <p className="secondary">{s.error}</p>
              ) : (
                <>
                  <progress
                    aria-label={
                      s.loadStage === 'movement'
                        ? 'Movement file transfer'
                        : loadingMessage(s.loadStage)
                    }
                    max={100}
                    value={
                      s.loadStage === 'movement' && s.transfer !== null
                        ? s.transfer
                        : undefined
                    }
                  />
                  {s.loadStage === 'movement' && s.transfer !== null && (
                    <span className="transfer-scope" aria-hidden="true">
                      Movement file · {s.transfer}%
                    </span>
                  )}
                </>
              )}
              {(s.error || s.loadStage === 'recovering') && (
                <button
                  className="tool"
                  onClick={() => {
                    if (viewer.current && !viewer.current.contextLost)
                      void viewer.current.load();
                    else {
                      const url = new URL(location.href);
                      url.searchParams.delete('no3d');
                      location.assign(url.href);
                    }
                  }}
                >
                  {s.loadStage === 'recovering' ? 'Reload 3D' : 'Retry 3D'}
                </button>
              )}
            </div>
          </div>
        )}
        {s.ready && s.status && (
          <output className="load-toast">{s.status}</output>
        )}
        {s.detailError && (
          <div className="load-toast" role="alert">
            {s.detailError}
            <button
              className="tool"
              disabled={s.catalogLoading || !available}
              onClick={() => {
                host.current?.querySelector('canvas')?.focus();
                void viewer.current?.retryCatalog().catch(() => {});
              }}
            >
              Retry catalog
            </button>
          </div>
        )}
      </section>
      {(group || selected || s.layout === 'spread') && (
        <section
          className={`focus-strip${selected ? ' part-selection' : ''}`}
          aria-label="Current view"
          aria-live="polite"
        >
          <div className="focus-title">
            <h2 title={selected ? partLabel(selected) : group?.technical}>
              {selected
                ? partLabel(selected)
                : group
                  ? group.technical
                  : s.spreadFocus
                    ? `All parts · ${s.spreadFocus}`
                    : 'All parts'}
            </h2>
            <div className="focus-actions">
              {group && !selected && (
                <button
                  ref={detailButton}
                  className="text-button"
                  onClick={() => openPanel(setDetails, !details)}
                  aria-expanded={details}
                  aria-controls="component-details"
                >
                  About mechanism
                </button>
              )}
              {selected && (
                <button
                  className="text-button isolate-button"
                  aria-pressed={s.isolated}
                  disabled={!available}
                  onClick={() => patch({ isolated: !s.isolated })}
                >
                  {s.isolated ? 'Show context' : 'Isolate part'}
                </button>
              )}
            </div>
          </div>
          {group && !selected && (
            <p className="component-caption">{group.caption}</p>
          )}
        </section>
      )}
      <nav className="action-dock" aria-label="Movement controls">
        <Sheet
          modal={false}
          open={explore}
          onOpenChange={(open) => openPanel(setExplore, open)}
        >
          <SheetTrigger
            className="explore-button text-button"
            disabled={s.loadStage === 'recovering'}
          >
            Explore <ChevronDown aria-hidden="true" />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            style={panelStyle}
            className="explorer-panel explore-panel"
            showOverlay={false}
            scrollContent
          >
            <SheetHeader>
              <SheetTitle>Explore</SheetTitle>
              <SheetDescription>Choose a mechanism.</SheetDescription>
            </SheetHeader>
            <div className="panel-body explore-menu">
              <button
                className="menu-link"
                aria-pressed={!s.group && s.layout === 'assembly'}
                onClick={() => chooseGroup(null)}
              >
                Whole movement <ChevronRight aria-hidden="true" />
              </button>
              {GROUPS.map((g, i) => (
                <button
                  className="menu-link"
                  key={g.id}
                  aria-pressed={s.group === g.id}
                  onClick={() => chooseGroup(g.id)}
                >
                  <span>
                    <small>0{i + 1}</small>
                    {g.technical}
                  </span>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <Sheet
          modal={false}
          open={dials}
          onOpenChange={(open) => openPanel(setDials, open)}
        >
          <SheetTrigger
            className="text-button dial-trigger"
            disabled={!available}
          >
            <span>Dial &amp; hands</span>
            <ChevronDown aria-hidden="true" />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            style={panelStyle}
            className="explorer-panel dial-panel"
            showOverlay={false}
            scrollContent
          >
            <SheetHeader>
              <SheetTitle>Dial &amp; hands</SheetTitle>
              <SheetDescription className="sr-only">
                Show either dial, or both. Choose hands for each.
              </SheetDescription>
            </SheetHeader>
            <div className="panel-body">
              <DialControls
                state={s}
                viewer={() => viewer.current}
                available={available}
              />
            </div>
          </SheetContent>
        </Sheet>
        <button
          className="text-button all-parts-button"
          disabled={!available}
          aria-pressed={s.layout === 'spread'}
          onClick={() => {
            closePanels();
            if (s.layout === 'spread') chooseGroup(null);
            else viewer.current?.allParts();
          }}
        >
          All parts
        </button>

        <Sheet
          modal={false}
          open={separate}
          onOpenChange={(open) => openPanel(setSeparate, open)}
        >
          <SheetTrigger
            className="text-button separate-trigger"
            disabled={!available}
          >
            {s.layout === 'spread' ? 'Arrange' : 'Separate'}
            {(group ? s.partSpread : s.separation) > 0 &&
              s.layout !== 'spread' && (
                <span className="state-dot" aria-label="Separation active" />
              )}
            <ChevronDown aria-hidden="true" />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            style={panelStyle}
            className="explorer-panel separation-panel"
            showOverlay={false}
            scrollContent
          >
            <SheetHeader>
              <SheetTitle>
                {s.layout === 'spread'
                  ? 'Arrange parts'
                  : group
                    ? 'Separate section'
                    : 'Separate movement'}
              </SheetTitle>
              <SheetDescription>
                {s.layout === 'spread'
                  ? 'Fit the spread or focus on a group.'
                  : group
                    ? group.technical
                    : 'Space the assembly to see its construction.'}
              </SheetDescription>
            </SheetHeader>
            <div className="panel-body">
              {s.layout === 'spread' ? (
                <>
                  <button
                    className="menu-link"
                    onClick={() => viewer.current?.frameSpread()}
                  >
                    Fit all
                  </button>
                  {SPREAD_GROUPS.map((name) => (
                    <button
                      className="menu-link"
                      key={name}
                      onClick={() => viewer.current?.frameSpread(name)}
                    >
                      {name}
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="slider-heading">
                    <span id="separation-label">
                      {group ? 'Separate section' : 'Separate'}
                    </span>
                    <output>
                      {Math.round((group ? s.partSpread : s.separation) * 100)}%
                    </output>
                  </div>
                  <Slider
                    disabled={!available}
                    aria-labelledby="separation-label"
                    value={[group ? s.partSpread : s.separation]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(v) => {
                      const value = Array.isArray(v) ? v[0] : v;
                      viewer.current?.scrub(
                        group ? { partSpread: value } : { separation: value },
                      );
                    }}
                  />
                  {group && (
                    <>
                      <div className="slider-heading">
                        <span id="uncover-label">Uncover section</span>
                        <output>{Math.round(s.reveal * 100)}%</output>
                      </div>
                      <Slider
                        disabled={!available}
                        aria-labelledby="uncover-label"
                        value={[s.reveal]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(v) =>
                          viewer.current?.scrub({
                            reveal: Array.isArray(v) ? v[0] : v,
                          })
                        }
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
        <div className="side-slot">
          <button
            className="side-switch text-button"
            disabled={!available || s.layout === 'spread'}
            style={{
              visibility: s.layout === 'spread' ? 'hidden' : 'visible',
            }}
            onClick={() =>
              viewer.current?.setSide(dialSide === 'back' ? 'front' : 'back')
            }
            aria-label={sideLabel}
            title={sideLabel}
          >
            <FlipHorizontal2 aria-hidden="true" />
            <span>{sideLabel}</span>
          </button>
        </div>
        <button
          className="text-button reset-button"
          disabled={s.loadStage === 'recovering' || (!available && !s.group)}
          aria-label="Reset view"
          title="Reassemble and recenter; keep dials and hands"
          onClick={() => {
            closePanels();
            if (viewer.current) viewer.current.reset();
            else set({ ...empty, loadStage: 'error', error: s.error });
          }}
        >
          <RotateCcw aria-hidden="true" />
          <span>Reset view</span>
        </button>
      </nav>
      <Sheet modal={false} open={details} onOpenChange={setDetails}>
        <SheetContent
          side="bottom"
          style={panelStyle}
          className="explorer-panel about-sheet"
          id="component-details"
          showOverlay={false}
          scrollContent
          finalFocus={() =>
            (selectionFocus.current ? null : detailButton.current) ??
            host.current?.querySelector('canvas') ??
            false
          }
        >
          <SheetHeader>
            <SheetTitle>{group?.technical}</SheetTitle>
            <SheetDescription>{group?.caption}</SheetDescription>
          </SheetHeader>
          <div className="about-copy">
            {group && (
              <>
                <ul className="detail-facts">
                  {factsFor(group.id).map((f) => (
                    <li key={f.text}>
                      {f.text}{' '}
                      <a href={f.url} target="_blank" rel="noreferrer">
                        {f.attribution} <ExternalLink aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="secondary">
                  Other mechanisms are hidden; connected parts stay dimmed. In
                  Separate, Uncover moves this section’s covers aside. Separate
                  section spaces its own components.
                  {group.id === 'regulation' &&
                    ' The balance bridge and its screws fade out to expose the spring. Lower Uncover to restore them.'}
                </p>
                <h3>Components</h3>
                <div className="catalog-index">
                  {members.map((p) => (
                    <button
                      key={p.id}
                      disabled={!available}
                      onClick={() => selectPart(p.id)}
                    >
                      <span>
                        {partLabel(p)}
                        <small>{partIndex.get(p.id)?.context}</small>
                      </span>{' '}
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet modal={false} open={catalog} onOpenChange={setCatalog}>
        <SheetContent
          side="bottom"
          style={panelStyle}
          className="explorer-panel catalog-sheet"
          showOverlay={false}
          scrollContent
          finalFocus={() =>
            selectionFocus.current
              ? (host.current?.querySelector('canvas') ?? false)
              : optionsButton.current
          }
        >
          <SheetHeader>
            <SheetTitle>Source catalog</SheetTitle>
            <SheetDescription>
              365 parts and 61 subassemblies, including case parts, alternatives
              and entries with no geometry. Additional geometry loads when
              selected.
            </SheetDescription>
          </SheetHeader>
          <div className="catalog-search">
            <Combobox
              items={catalogParts}
              inputValue={catalogQuery}
              onInputValueChange={setCatalogQuery}
              itemToStringLabel={(p: Part) => partLabel(p)}
              filter={(p: Part, query: string) =>
                matchesPart(partIndex.get(p.id)?.search ?? '', query)
              }
              onValueChange={(p: Part | null) => {
                if (p) selectPart(p.id);
              }}
            >
              <ComboboxInput
                placeholder="Find a part or assembly…"
                aria-label="Search all source parts"
                showTrigger={false}
              />
              <ComboboxContent>
                <ComboboxEmpty>
                  No matching parts. Try an English name, source name or ID.
                </ComboboxEmpty>
                <ComboboxList>
                  {(p: Part) => (
                    <ComboboxItem key={p.id} value={p} disabled={!available}>
                      <span>
                        {partLabel(p)}
                        <small>
                          {partIndex.get(p.id)?.context} ·{' '}
                          {partIndex.get(p.id)?.reference}
                        </small>
                        <small lang="de">{p.name}</small>
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="catalog-index">
            {s.parts
              .filter((p) => p.parentId === ROOT || p.parentId === 'p_0_1_1_1')
              .map((p) => (
                <button
                  key={p.id}
                  disabled={!available}
                  onClick={() => selectPart(p.id)}
                >
                  <span>
                    {partLabel(p)}
                    <small>{partIndex.get(p.id)?.reference}</small>
                    <small lang="de">{p.name}</small>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet modal={false} open={about} onOpenChange={setAbout}>
        <SheetContent
          side="bottom"
          style={panelStyle}
          className="explorer-panel about-sheet"
          showOverlay={false}
          scrollContent
          finalFocus={optionsButton}
        >
          <SheetHeader>
            <SheetTitle>A study of the ml–01</SheetTitle>
            <SheetDescription>
              Explore the original Marco Lang CAD at rest, with authored
              materials and construction reveals.
            </SheetDescription>
          </SheetHeader>
          <div className="about-copy">
            <p>Independent project. Not affiliated with Marco Lang.</p>
            <p>
              The overview shows the movement without the case, straps or
              alternate dial designs. The catalog retains every imported part.
            </p>
            <p>
              The mechanism is shown in its source pose. Reveal and separation
              controls expose its construction; they do not simulate a running
              watch.
            </p>
            <p>
              {s.stats.recoveredDiamond
                ? 'The diamond is recovered from the maker’s separate component STL; its assembly STEP entry is empty.'
                : 'The assembly STEP diamond is empty; its separate maker STL has not loaded.'}{' '}
              Four balance eccentrics contain untessellated faces. An
              overlapping setting-spring alternative is hidden in the assembled
              view.
            </p>
            <p>
              Finishes follow maker photography and macro references. Surface
              response and lighting are authored, with separate CAD-derived
              shading corrections; no missing geometry has been invented.
            </p>
            <p>
              Separation and All parts travel are authored presentations, not
              service procedures. All parts contains the active movement’s
              physical components at their original relative scale; case parts
              and incompatible alternatives remain in the source catalog.
            </p>
            <a
              href="https://www.marcolangwatches.com/en/cad-2/zweigesicht-1/movement/"
              target="_blank"
              rel="noreferrer"
            >
              Marco Lang · Original CAD <ExternalLink aria-hidden="true" />
            </a>
            <p>
              Drag to orbit; pinch or scroll to zoom. All mechanisms, components
              and view controls are also available through keyboard navigation.
            </p>
          </div>
        </SheetContent>
      </Sheet>
      <pre id="viewer-diagnostics" hidden>
        {JSON.stringify({ ...s, parts: undefined })}
      </pre>
      {inspect && (
        <details className="inspection">
          <summary>Inspection tools</summary>
          <button
            onClick={async () => {
              if (!viewer.current) return;
              setQa({ running: true });
              setQa(await runCameraChecks(viewer.current));
            }}
          >
            Run camera checks
          </button>
          <button
            onClick={async () => {
              if (viewer.current) {
                setQa({ running: true });
                setQa(await runUxChecks(viewer.current));
              }
            }}
          >
            Run UX checks
          </button>
          {(['scrub', 'spread', 'interrupt', 'dials'] as MotionCase[]).map(
            (kind) => (
              <button
                key={kind}
                onClick={async () => {
                  if (!viewer.current) return;
                  setMotion({ running: true });
                  setMotion(await captureMotion(viewer.current, kind));
                }}
              >
                Record {kind}
              </button>
            ),
          )}
          <pre id="motion-report" hidden>
            {JSON.stringify(motion)}
          </pre>
          <div>
            <button onClick={() => viewer.current?.view('front')}>
              Front reference
            </button>
            <button onClick={() => viewer.current?.view('back')}>
              Back reference
            </button>
            <button onClick={() => viewer.current?.view('side')}>
              Side reference
            </button>
            <button onClick={() => viewer.current?.view('oblique')}>
              Oblique reference
            </button>
          </div>
          <button
            onClick={async () => {
              if (viewer.current) {
                setQa({ running: true });
                setQa(await runExplosionChecks(viewer.current));
              }
            }}
          >
            Run explosion checks
          </button>
          <button
            onClick={async () => {
              if (viewer.current) {
                setQa({ running: true });
                setQa(await runDialChecks(viewer.current));
              }
            }}
          >
            Run dial checks
          </button>
          <button
            onClick={async () => {
              if (viewer.current) {
                setQa({ running: true });
                setQa(await runBrowserChecks(viewer.current));
              }
            }}
          >
            Run interaction checks
          </button>
          <button
            onClick={() => {
              if (viewer.current)
                viewer.current.benchmark = startBenchmark(viewer.current, 60);
            }}
          >
            Benchmark 60 seconds
          </button>
          <button
            onClick={() => {
              if (viewer.current)
                viewer.current.benchmark = startBenchmark(viewer.current, 300);
            }}
          >
            Benchmark 5 minutes
          </button>
          <button
            disabled={s.catalogLoaded}
            onClick={async () => {
              const v = viewer.current;
              if (!v) return;
              const path = v.paths.catalog;
              v.paths.catalog = '/models/intentionally-missing-catalog.glb';
              try {
                await v.loadCatalog();
              } catch {
              } finally {
                v.paths.catalog = path;
              }
            }}
          >
            Test catalog failure
          </button>
          <button
            onClick={() => {
              const ext = viewer.current?.renderer
                .getContext()
                .getExtension('WEBGL_lose_context');
              if (ext) {
                ext.loseContext();
                setTimeout(() => ext.restoreContext(), 1200);
              }
            }}
          >
            Test context recovery
          </button>
          <pre id="qa-report">{JSON.stringify(qa, null, 2)}</pre>
          <pre id="benchmark-report">
            {JSON.stringify(s.benchmarkResult ?? s.stats, null, 2)}
          </pre>
        </details>
      )}
    </main>
  );
}
