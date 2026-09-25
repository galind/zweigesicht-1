'use client';

import { InformationPanel } from '@/components/InformationPanel';
import { makerUrl } from '@/src/content/about';
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  Menu,
  ChevronDown,
  ChevronRight,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  ScanSearch,
  Grid2X2,
  Layers,
  Clock3,
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
import { ConfigurationControls } from '@/components/ConfigurationControls';
import { initialState } from '@/src/experience/state';
import {
  GROUPS,
  category,
  belongs,
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
const InspectionPanel = lazy(() => import('@/components/InspectionPanel'));

const empty: ViewerSnapshot = {
  ...initialState,
  ready: false,
  loadStage: 'movement',
  transfer: null,
  catalogLoading: false,
  dialRequest: null,
  dialError: '',
  caseRequest: false,
  caseError: '',
  caseEffective: false,
  configurationNotice: '',
  spreadFocus: null,
  status: '',
  error: '',
  detailError: '',
  parts: [],
  visiblePartIds: [],
  canBack: false,
  catalogLoaded: false,
  benchmarkResult: null,
  stats: {},
};
export default function Home() {
  const exploreButton = useRef<HTMLButtonElement>(null),
    detailButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const visibleTrigger = (
    selector: string,
    fallback: HTMLButtonElement | null,
  ) => {
    const trigger = document.querySelector<HTMLButtonElement>(selector);
    return trigger?.getClientRects().length ? trigger : fallback;
  };
  const selectionFocus = useRef(false);
  const panelAnchor = useRef<HTMLElement | null>(null);
  const [topBounds, setTopBounds] = useState({ header: 88, context: 150 });
  const [panelX, setPanelX] = useState<number | null>(null);
  const [panelBottom, setPanelBottom] = useState<number | null>(null);
  const [viewportInsets, setViewportInsets] = useState({ top: 0, bottom: 0 });
  const panelStyle = {
    '--header-bottom': `${topBounds.header}px`,
    '--context-bottom': `${topBounds.context}px`,
    '--panel-anchor-x': panelX === null ? '50vw' : `${panelX}px`,
    '--panel-bottom':
      panelBottom === null
        ? undefined
        : `${Math.max(panelBottom, viewportInsets.bottom + 12)}px`,
    '--viewport-top': `${viewportInsets.top}px`,
  } as CSSProperties;
  useEffect(() => {
    const measure = () => {
      const rect = panelAnchor.current?.getBoundingClientRect();
      if (rect) setPanelX(rect.left + rect.width / 2);
      const dockRect = document
        .querySelector('.action-dock')
        ?.getBoundingClientRect();
      if (dockRect) setPanelBottom(window.innerHeight - dockRect.top + 12);
    };
    const viewport = window.visualViewport;
    const measureViewport = () => {
      // Pinch zoom keeps its native viewport behavior. Only compensate for
      // keyboard/browser chrome changes at the normal page scale.
      const top = viewport?.scale === 1 ? viewport.offsetTop : 0;
      const bottom =
        viewport?.scale === 1
          ? Math.max(0, window.innerHeight - viewport.height - top)
          : 0;
      setViewportInsets((previous) =>
        previous.top === top && previous.bottom === bottom
          ? previous
          : { top, bottom },
      );
    };
    window.addEventListener('resize', measure);
    viewport?.addEventListener('resize', measureViewport);
    viewport?.addEventListener('scroll', measureViewport);
    measureViewport();
    const observer = new ResizeObserver(measure);
    const dock = document.querySelector('.action-dock');
    if (dock) observer.observe(dock);
    return () => {
      window.removeEventListener('resize', measure);
      viewport?.removeEventListener('resize', measureViewport);
      viewport?.removeEventListener('scroll', measureViewport);
      observer.disconnect();
    };
  }, []);
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<MovementViewer | null>(null);
  const [s, set] = useState<ViewerSnapshot>(empty),
    [menu, setMenu] = useState(false),
    [more, setMore] = useState(false),
    [catalog, setCatalog] = useState(false),
    [about, setAbout] = useState(false),
    [acknowledgements, setAcknowledgements] = useState(false),
    [explore, setExplore] = useState(false),
    [separate, setSeparate] = useState(false),
    [dials, setDials] = useState(false),
    [options, setOptions] = useState(false),
    [details, setDetails] = useState(false),
    [inspect, setInspect] = useState(false);
  useEffect(() => {
    const breakpoint = window.matchMedia('(max-width: 600px)');
    const dismissNavigation = () => {
      setMenu(false);
      setMore(false);
    };
    breakpoint.addEventListener('change', dismissNavigation);
    return () => breakpoint.removeEventListener('change', dismissNavigation);
  }, []);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [includeAllCad, setIncludeAllCad] = useState(false);
  const visibleParts = useMemo(
    () => new Set(s.visiblePartIds),
    [s.visiblePartIds],
  );
  const partIndex = useMemo(() => buildPartIndex(s.parts), [s.parts]);
  const catalogParts = useMemo(
    () =>
      s.parts.filter(
        (p) =>
          p.id !== 'p_0_1_1_1' &&
          (includeAllCad || (!p.isAssembly && visibleParts.has(p.id))),
      ),
    [s.parts, includeAllCad, visibleParts],
  );
  const filteredParts = catalogParts.filter((p) =>
    matchesPart(partIndex.get(p.id)?.search ?? '', catalogQuery),
  );
  const componentStatus = (p: Part) => {
    if (visibleParts.has(p.id)) return p.isAssembly ? 'Assembly' : '';
    if (p.isAssembly && s.visiblePartIds.some((id) => belongs(id, p.id)))
      return 'Assembly · Contains displayed parts';
    return p.isAssembly ? 'Assembly · Not shown' : 'Not shown';
  };
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
  const memberSections = new Map<string, { label: string; parts: Part[] }>();
  for (const part of members) {
    const key = part.parentId ?? 'root';
    const label = (partIndex.get(part.id)?.context ?? 'Components').replace(
      /^Barrel assembly (\d+)$/,
      'Barrel $1',
    );
    if (!memberSections.has(key)) memberSections.set(key, { label, parts: [] });
    memberSections.get(key)!.parts.push(part);
  }
  const mechanismFacts = group ? factsFor(group.id) : [];
  const mechanismSources = [
    ...new Map(mechanismFacts.map((fact) => [fact.url, fact])).values(),
  ];
  useLayoutEffect(() => {
    const header = document.querySelector('.topbar');
    const context = document.querySelector('.focus-strip');
    const measure = () => {
      const headerBottom = header?.getBoundingClientRect().bottom ?? 88;
      const contextBottom =
        context?.getBoundingClientRect().bottom ?? headerBottom;
      setTopBounds((previous) =>
        previous.header === headerBottom && previous.context === contextBottom
          ? previous
          : { header: headerBottom, context: contextBottom },
      );
    };
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (context) observer.observe(context);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [group, selected, s.layout, topBounds.header]);
  useEffect(() => {
    queueMicrotask(() => setDetails(false));
  }, [s.part, s.group]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        menu ||
        more ||
        catalog ||
        about ||
        acknowledgements ||
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
  }, [
    menu,
    more,
    catalog,
    about,
    acknowledgements,
    explore,
    separate,
    dials,
    options,
    details,
  ]);
  const selectPart = (id: string) => {
    selectionFocus.current = true;
    setCatalog(false);
    setOptions(false);
    setAcknowledgements(false);
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
  const chooseSpreadGroup = (name?: string) => {
    viewer.current?.frameSpread(name);
    setExplore(false);
  };
  const sideLabel = 'Flip movement';
  const closePanels = () => {
    setMenu(false);
    setMore(false);
    setExplore(false);
    setSeparate(false);
    setDials(false);
    setOptions(false);
    setAcknowledgements(false);
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
              : update === setOptions
                ? '.settings-trigger'
                : '.action-dock';
      panelAnchor.current = visibleTrigger(selector, moreButton.current);
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
  const toggleAllParts = () => {
    closePanels();
    if (s.layout === 'spread') chooseGroup(null);
    else viewer.current?.allParts();
  };
  const resetView = () => {
    closePanels();
    if (viewer.current) viewer.current.reset();
    else set({ ...empty, loadStage: 'error', error: s.error });
  };
  const patch = (v: Parameters<MovementViewer['patch']>[0]) =>
    viewer.current?.patch(v);
  return (
    <main
      style={panelStyle}
      className={
        'explorer' +
        (group || selected || s.layout === 'spread' ? ' has-focus' : '')
      }
    >
      <header className="topbar">
        <div className="identity">
          <h1>Zweigesicht-1</h1>
          <a
            className="maker-credit"
            href={makerUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="by Marco Lang — official website, opens in a new tab"
          >
            by Marco Lang
          </a>
        </div>
        <nav className="header-actions" aria-label="Information and settings">
          <InformationPanel
            style={panelStyle}
            open={about}
            restoreFocus={!options && !acknowledgements}
            focusFallback={menuButton}
            onOpenChange={(open) => {
              if (open) closePanels();
              setAbout(open);
            }}
          />
          <button
            className="text-button acknowledgements-trigger"
            aria-expanded={acknowledgements}
            aria-controls="acknowledgements"
            onClick={() => openPanel(setAcknowledgements, !acknowledgements)}
          >
            Acknowledgements
          </button>
          <button
            className="text-button settings-trigger"
            aria-expanded={options}
            aria-controls="viewer-settings"
            onClick={() => openPanel(setOptions, !options)}
          >
            Settings
          </button>
        </nav>
        <Sheet
          modal={false}
          open={menu}
          onOpenChange={(open) => openPanel(setMenu, open)}
        >
          <SheetTrigger
            ref={menuButton}
            className="text-button mobile-menu-trigger"
            aria-label="Menu"
          >
            <Menu aria-hidden="true" />
          </SheetTrigger>
          <SheetContent
            side="top"
            style={panelStyle}
            className="explorer-panel settings-panel header-panel mobile-navigation"
            showOverlay={false}
            scrollContent
          >
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="panel-body explore-menu">
              <a
                className="menu-link mobile-maker-credit"
                href={makerUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="A watch by Marco Lang — official website, opens in a new tab"
              >
                A watch by Marco Lang
              </a>
              <button
                className="menu-link"
                onClick={() => openPanel(setAbout, true)}
              >
                Learn about the watch
                <ChevronRight aria-hidden="true" />
              </button>
              <button
                className="menu-link"
                onClick={() => openPanel(setAcknowledgements, true)}
              >
                Acknowledgements
                <ChevronRight aria-hidden="true" />
              </button>
              <button
                className="menu-link"
                onClick={() => openPanel(setOptions, true)}
              >
                Settings
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </SheetContent>
        </Sheet>
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
              {s.layout === 'spread' && (
                <button
                  className="text-button find-component-button"
                  onClick={() => {
                    setIncludeAllCad(false);
                    setCatalogQuery('');
                    openPanel(setCatalog, true);
                  }}
                >
                  Find a component
                </button>
              )}
              {(group || selected) && (
                <button
                  ref={detailButton}
                  className="text-button"
                  onClick={() => openPanel(setDetails, !details)}
                  aria-expanded={details}
                  aria-controls="component-details"
                >
                  Details
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
          {selected && (
            <p className="component-location">
              {partIndex.get(selected.id)?.location}
            </p>
          )}
        </section>
      )}
      <nav className="action-dock" aria-label="Movement controls">
        <Sheet
          modal={false}
          open={separate}
          onOpenChange={(open) => openPanel(setSeparate, open)}
        >
          <SheetTrigger
            className="text-button separate-trigger"
            disabled={!available}
            aria-pressed={
              s.layout === 'spread' ||
              (group ? s.partSpread > 0 || s.reveal > 0 : s.separation > 0)
            }
          >
            <Layers className="dock-icon" aria-hidden="true" />
            <span>Disassemble</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            style={panelStyle}
            className="explorer-panel separation-panel"
            showOverlay={false}
            scrollContent
          >
            <SheetHeader>
              <SheetTitle>Disassemble</SheetTitle>
            </SheetHeader>
            <div className="panel-body">
              <SheetDescription>
                {s.layout === 'spread'
                  ? 'The parts are laid out individually. Reassemble to return to the movement.'
                  : group
                    ? `Section · ${group.technical}`
                    : 'Whole movement · Adjust the space between parts.'}
              </SheetDescription>
              {s.layout === 'spread' ? (
                <button
                  className="separation-action"
                  onClick={() => {
                    chooseGroup(null);
                    setSeparate(false);
                  }}
                >
                  <Layers aria-hidden="true" />
                  Reassemble
                </button>
              ) : (
                <>
                  <button
                    className="separation-action"
                    disabled={!available}
                    onClick={() => {
                      const value =
                        (group ? s.partSpread : s.separation) > 0 ? 0 : 1;
                      viewer.current?.patch(
                        group ? { partSpread: value } : { separation: value },
                      );
                      setSeparate(false);
                    }}
                  >
                    <Layers aria-hidden="true" />
                    {(group ? s.partSpread : s.separation) > 0
                      ? 'Reassemble'
                      : group
                        ? 'Disassemble section'
                        : 'Disassemble movement'}
                  </button>
                  <div className="slider-heading">
                    <span id="separation-label">Spacing</span>
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
                      <p className="control-instruction">
                        Connected parts stay dimmed.
                        {group.id === 'regulation' &&
                          ' The balance bridge and screws fade to expose the spring; slide back to restore them.'}
                      </p>
                      <div className="slider-heading">
                        <span id="uncover-label">Move covers aside</span>
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
        <Sheet
          modal={false}
          open={explore}
          onOpenChange={(open) => openPanel(setExplore, open)}
        >
          <SheetTrigger
            ref={exploreButton}
            className="explore-button text-button desktop-secondary"
            aria-pressed={s.layout === 'spread' ? !!s.spreadFocus : !!s.group}
            disabled={s.loadStage === 'recovering'}
          >
            <ScanSearch className="dock-icon" aria-hidden="true" />
            <span>Focus</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            style={panelStyle}
            className="explorer-panel explore-panel"
            finalFocus={() =>
              visibleTrigger('.explore-button', moreButton.current)
            }
            showOverlay={false}
            scrollContent
          >
            <SheetHeader>
              <SheetTitle>Focus</SheetTitle>
              <SheetDescription className="sr-only">
                {s.layout === 'spread'
                  ? 'Frame a group of parts.'
                  : 'Focus on a mechanism.'}
              </SheetDescription>
            </SheetHeader>
            <div className="panel-body explore-menu">
              {s.layout === 'spread' ? (
                <>
                  <button
                    className="menu-link"
                    aria-pressed={!s.spreadFocus}
                    onClick={() => chooseSpreadGroup()}
                  >
                    <span>Fit all</span>
                    {!s.spreadFocus && <Check aria-hidden="true" />}
                  </button>
                  {SPREAD_GROUPS.map((name) => (
                    <button
                      className="menu-link"
                      key={name}
                      aria-pressed={s.spreadFocus === name}
                      onClick={() => chooseSpreadGroup(name)}
                    >
                      <span>{name}</span>
                      {s.spreadFocus === name && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    className="menu-link"
                    aria-pressed={!s.group}
                    onClick={() => chooseGroup(null)}
                  >
                    <span>Whole movement</span>
                    {!s.group && <Check aria-hidden="true" />}
                  </button>
                  {GROUPS.map((g) => (
                    <button
                      className="menu-link"
                      key={g.id}
                      aria-pressed={s.group === g.id}
                      onClick={() => chooseGroup(g.id)}
                    >
                      <span>{g.technical}</span>
                      {s.group === g.id && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
        <button
          className="text-button all-parts-button desktop-secondary"
          disabled={!available}
          aria-pressed={s.layout === 'spread'}
          onClick={toggleAllParts}
        >
          <Grid2X2 className="dock-icon" aria-hidden="true" />
          <span>All parts</span>
        </button>

        <Sheet
          modal={false}
          open={dials}
          onOpenChange={(open) => openPanel(setDials, open)}
        >
          <SheetTrigger
            className="text-button dial-trigger"
            disabled={!available}
          >
            <Clock3 className="dock-icon" aria-hidden="true" />
            <span>Configure</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            style={panelStyle}
            className="explorer-panel dial-panel"
            showOverlay={false}
            scrollContent
          >
            <SheetHeader>
              <SheetTitle>Configure</SheetTitle>
              <SheetDescription className="sr-only">
                Configure the case, materials and both dials.
              </SheetDescription>
            </SheetHeader>
            <div className="panel-body">
              <ConfigurationControls
                state={s}
                viewer={() => viewer.current}
                available={available}
              />
            </div>
          </SheetContent>
        </Sheet>
        <div className="side-slot">
          <button
            className="side-switch text-button"
            disabled={!available}
            onClick={() => {
              closePanels();
              viewer.current?.flipMovement();
            }}
            aria-pressed={s.layout === 'spread' ? s.inventoryBack : undefined}
            aria-label={sideLabel}
            title={sideLabel}
          >
            <FlipHorizontal2
              className="dock-icon"
              style={{ transform: 'rotate(90deg)' }}
              aria-hidden="true"
            />
            <span>Flip</span>
          </button>
        </div>
        <button
          className="text-button reset-button desktop-secondary"
          disabled={s.loadStage === 'recovering' || (!available && !s.group)}
          aria-label="Reset view"
          title="Return to the straight-on view; keep watch configuration"
          onClick={resetView}
        >
          <RotateCcw className="dock-icon" aria-hidden="true" />
          <span>Reset view</span>
        </button>
        <Sheet
          modal={false}
          open={more}
          onOpenChange={(open) => openPanel(setMore, open)}
        >
          <SheetTrigger
            ref={moreButton}
            className="text-button mobile-more-trigger"
            aria-pressed={s.layout === 'spread' || !!s.group}
          >
            <span>More</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            style={panelStyle}
            className="explorer-panel mobile-navigation"
            showOverlay={false}
            scrollContent
          >
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="panel-body explore-menu">
              <button
                className="menu-link"
                disabled={s.loadStage === 'recovering'}
                aria-pressed={
                  s.layout === 'spread' ? !!s.spreadFocus : !!s.group
                }
                onClick={() => openPanel(setExplore, true)}
              >
                Focus
                <ChevronRight aria-hidden="true" />
              </button>
              <button
                className="menu-link"
                disabled={!available}
                aria-pressed={s.layout === 'spread'}
                onClick={toggleAllParts}
              >
                All parts{s.layout === 'spread' && <Check aria-hidden="true" />}
              </button>
              <button
                className="menu-link"
                disabled={
                  s.loadStage === 'recovering' || (!available && !s.group)
                }
                onClick={resetView}
              >
                Reset view
                <RotateCcw aria-hidden="true" />
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
      <Sheet
        modal={false}
        open={acknowledgements}
        onOpenChange={(open) => openPanel(setAcknowledgements, open)}
      >
        <SheetContent
          side="top"
          style={panelStyle}
          className="explorer-panel settings-panel acknowledgements-panel header-panel"
          id="acknowledgements"
          showOverlay={false}
          scrollContent
          finalFocus={() =>
            about ||
            options ||
            explore ||
            separate ||
            dials ||
            details ||
            catalog
              ? false
              : selectionFocus.current
                ? (host.current?.querySelector('canvas') ?? false)
                : visibleTrigger(
                    '.acknowledgements-trigger',
                    menuButton.current,
                  )
          }
        >
          <SheetHeader>
            <SheetTitle>Acknowledgements</SheetTitle>
          </SheetHeader>
          <div className="panel-body header-panel-body">
            <SheetDescription
              render={<div />}
              className="acknowledgements-copy"
            >
              <p>
                A big thank you to Marco Lang for generously sharing his CAD
                files, giving everyone the chance to explore his watches and
                learn how they’re made.
              </p>
              <p>
                On a personal note, thank you, Marco, for your feedback, advice
                and encouragement throughout this project.
              </p>
              <p>
                And thank you to everyone who uses and enjoys this website. I
                hope you enjoy exploring it as much as I enjoyed building it.
              </p>
            </SheetDescription>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet
        modal={false}
        open={options}
        onOpenChange={(open) => {
          if (open) selectionFocus.current = false;
          openPanel(setOptions, open);
        }}
      >
        <SheetContent
          side="top"
          style={panelStyle}
          className="explorer-panel about-sheet settings-panel header-panel"
          id="viewer-settings"
          showOverlay={false}
          scrollContent
          finalFocus={() =>
            about || acknowledgements
              ? false
              : selectionFocus.current
                ? (host.current?.querySelector('canvas') ?? false)
                : visibleTrigger('.settings-trigger', menuButton.current)
          }
        >
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription className="sr-only">
              Adjust rendering quality and move the camera.
            </SheetDescription>
          </SheetHeader>
          <div className="about-copy settings-copy header-panel-body">
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
            <fieldset className="alternative-controls" disabled={!available}>
              <legend>Camera controls</legend>
              <div className="camera-pad">
                {[
                  {
                    name: s.layout === 'spread' ? 'Pan up' : 'Tilt up',
                    direction: 'up',
                    Icon: ArrowUp,
                    x: 0,
                    y: -1,
                  },
                  {
                    name: s.layout === 'spread' ? 'Pan left' : 'Orbit left',
                    direction: 'left',
                    Icon: ArrowLeft,
                    x: -1,
                    y: 0,
                  },
                  {
                    name: s.layout === 'spread' ? 'Pan right' : 'Orbit right',
                    direction: 'right',
                    Icon: ArrowRight,
                    x: 1,
                    y: 0,
                  },
                  {
                    name: s.layout === 'spread' ? 'Pan down' : 'Tilt down',
                    direction: 'down',
                    Icon: ArrowDown,
                    x: 0,
                    y: 1,
                  },
                ].map(({ name, direction, Icon, x, y }) => (
                  <button
                    key={direction}
                    className={`tool camera-${direction}`}
                    aria-label={name}
                    title={name}
                    onClick={() =>
                      s.layout === 'spread'
                        ? viewer.current?.pan(x * 0.15, y * 0.15)
                        : viewer.current?.orbit(x * 0.25, y * 0.2)
                    }
                  >
                    <Icon aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="camera-zoom">
                <button
                  className="tool"
                  aria-label="Zoom in"
                  title="Zoom in"
                  onClick={() => viewer.current?.zoom(0.8)}
                >
                  <Plus aria-hidden="true" />
                </button>
                <button
                  className="tool"
                  aria-label="Zoom out"
                  title="Zoom out"
                  onClick={() => viewer.current?.zoom(1.25)}
                >
                  <Minus aria-hidden="true" />
                </button>
              </div>
            </fieldset>
            <h3>Gestures and shortcuts</h3>
            <p className="camera-mode">
              {s.layout === 'spread'
                ? 'All parts · pan'
                : 'Assembled view · orbit'}
              . Keyboard shortcuts work when the movement has focus.
            </p>
            <dl className="gesture-list">
              <div>
                <dt>{s.layout === 'spread' ? 'Pan' : 'Orbit'}</dt>
                <dd>Drag or arrow keys</dd>
              </div>
              <div>
                <dt>Zoom</dt>
                <dd>Pinch, scroll or + / −</dd>
              </div>
              <div>
                <dt>Select</dt>
                <dd>Tap a part; tap empty space or Escape to deselect</dd>
              </div>
              <div>
                <dt>Reset</dt>
                <dd>Home or Reset view</dd>
              </div>
            </dl>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet modal={false} open={details} onOpenChange={setDetails}>
        <SheetContent
          side="top"
          style={panelStyle}
          className="explorer-panel about-sheet mechanism-panel"
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
            <SheetTitle>
              {selected ? partLabel(selected) : group?.technical}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {selected
                ? 'Component location and CAD references'
                : 'Mechanism information and components'}
            </SheetDescription>
          </SheetHeader>
          <div className="about-copy">
            {selected ? (
              <div className="component-source-details">
                <p>{partIndex.get(selected.id)?.location}</p>
                <p>{category(selected)}</p>
                <dl>
                  <dt>Original name</dt>
                  <dd lang="de">{selected.name}</dd>
                  <dt>CAD instance</dt>
                  <dd>{selected.sourceInstanceId}</dd>
                  <dt>Definition</dt>
                  <dd>{selected.definitionId}</dd>
                  <dt>Viewer ID</dt>
                  <dd>{selected.id}</dd>
                  <dt>Type</dt>
                  <dd>{selected.isAssembly ? 'Assembly' : 'Physical part'}</dd>
                </dl>
              </div>
            ) : (
              group && (
                <>
                  <p>{group.caption}</p>
                  <ul className="detail-facts">
                    {mechanismFacts.map((fact) => (
                      <li key={fact.text}>{fact.text}</li>
                    ))}
                  </ul>
                  <div
                    className="watch-sources mechanism-sources"
                    aria-label="Mechanism sources"
                  >
                    <span>Sources</span>
                    {mechanismSources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${source.attribution}, opens in a new tab`}
                      >
                        {source.attribution}
                      </a>
                    ))}
                  </div>
                  <h3>Components</h3>
                  <div className="catalog-index">
                    {[...memberSections].map(([id, section]) => (
                      <section key={id} aria-label={section.label}>
                        <h4>{section.label}</h4>
                        {section.parts.map((part) => (
                          <button
                            key={part.id}
                            disabled={!available}
                            onClick={() => selectPart(part.id)}
                          >
                            <span>{partLabel(part)}</span>
                            <ChevronRight aria-hidden="true" />
                          </button>
                        ))}
                      </section>
                    ))}
                  </div>
                </>
              )
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
          initialFocus={(interaction) =>
            interaction === 'keyboard'
              ? document.querySelector<HTMLInputElement>(
                  '.catalog-search input',
                )
              : document.querySelector<HTMLElement>(
                  '.catalog-sheet .sheet-scroll-area',
                )
          }
          finalFocus={() =>
            selectionFocus.current
              ? (host.current?.querySelector('canvas') ?? false)
              : (document.querySelector<HTMLButtonElement>(
                  '.find-component-button',
                ) ?? visibleTrigger('.all-parts-button', moreButton.current))
          }
        >
          <SheetHeader>
            <SheetTitle>Find a component</SheetTitle>
            <SheetDescription className="sr-only">
              Search by name, location or CAD reference.
            </SheetDescription>
            <div className="component-finder finder-controls">
              <label className="catalog-search">
                <span className="sr-only">Search components</span>
                <input
                  type="search"
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  placeholder="Search components…"
                />
              </label>
            </div>
          </SheetHeader>
          <div className="panel-body component-finder">
            <label className="catalog-scope">
              <input
                type="checkbox"
                checked={includeAllCad}
                onChange={(event) => setIncludeAllCad(event.target.checked)}
              />
              Include all CAD entries
            </label>
            <p className="catalog-scope-note">
              {includeAllCad
                ? 'All CAD entries. Hidden geometry may load on selection.'
                : 'Visible parts, including covered parts.'}
            </p>
            <output
              className="catalog-count"
              aria-live="polite"
              aria-atomic="true"
            >
              {filteredParts.length}{' '}
              {filteredParts.length === 1 ? 'result' : 'results'}
            </output>
            <div className="catalog-index">
              {filteredParts.map((p) => (
                <button
                  key={p.id}
                  disabled={!available}
                  data-part-id={p.id}
                  onClick={() => selectPart(p.id)}
                >
                  <span>
                    {partLabel(p)}
                    <small>{partIndex.get(p.id)?.location}</small>
                    {componentStatus(p) && (
                      <small className="component-status">
                        {componentStatus(p)}
                      </small>
                    )}
                  </span>
                </button>
              ))}
              {!filteredParts.length && (
                <p className="catalog-empty">
                  No matching components. Try another name or include all CAD
                  entries.
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <pre id="viewer-diagnostics" hidden>
        {JSON.stringify({ ...s, parts: undefined })}
      </pre>
      {inspect && (
        <Suspense fallback={null}>
          <InspectionPanel viewer={() => viewer.current} state={s} />
        </Suspense>
      )}
    </main>
  );
}
