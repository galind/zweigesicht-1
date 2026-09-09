'use client';
import { runUxChecks } from '@/src/viewer/uxValidation';
import { runExplosionChecks } from '@/src/viewer/explosionValidation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FlipHorizontal2,
  X,
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
  category,
  type Part,
} from '@/src/experience/catalog';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '@/components/ui/popover';
import { SPREAD_GROUPS } from '@/src/experience/spread';
import { factsFor, partDetail } from '@/src/experience/copy';
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
  const deck = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<MovementViewer | null>(null);
  const [s, set] = useState<ViewerSnapshot>(empty),
    [catalog, setCatalog] = useState(false),
    [about, setAbout] = useState(false),
    [explore, setExplore] = useState(false),
    [spreadGroups, setSpreadGroups] = useState(false),
    [options, setOptions] = useState(false),
    [details, setDetails] = useState(false),
    [dialOpen, setDialOpen] = useState(false),
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
  useEffect(() => {
    const footer = deck.current;
    if (!footer) return;
    const measure = () =>
      footer.parentElement?.style.setProperty(
        '--deck-height',
        `${footer.getBoundingClientRect().height}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    measure();
    return () => observer.disconnect();
  }, []);
  const group = GROUPS.find((g) => g.id === s.group),
    selected = s.parts.find((p) => p.id === s.part),
    members = s.parts.filter(
      (p) => !p.isAssembly && group && inMembers(p.id, group.members),
    );
  useEffect(() => {
    queueMicrotask(() => setDetails(false));
  }, [s.part, s.group]);
  const dismissSelection = () => {
    setDetails(false);
    viewer.current?.deselect();
    host.current?.querySelector('canvas')?.focus();
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        catalog ||
        about ||
        explore ||
        spreadGroups ||
        options ||
        details ||
        dialOpen
      )
        return;
      event.preventDefault();
      viewer.current?.deselect();
      host.current?.querySelector('canvas')?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [catalog, about, explore, spreadGroups, options, details, dialOpen]);
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
  const dialSide =
    s.dialRequest && s.dialRequest.view !== 'movement'
      ? s.dialRequest.view === 'central'
        ? 'front'
        : 'back'
      : s.side;
  const sideLabel =
    s.presentation === 'dials' || s.dialRequest
      ? dialSide === 'back'
        ? 'Show Dial A'
        : 'Show Dial B'
      : s.side === 'back'
        ? 'Show dial side'
        : 'Show movement side';
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
          <span>
            Marco Lang <i>·</i> <span className="calibre">Calibre ml–01</span>
          </span>
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
          <button
            className="text-button reset-button"
            disabled={s.loadStage === 'recovering' || (!available && !s.group)}
            title="Restore the opening view and options"
            onClick={() => {
              setExplore(false);
              setSpreadGroups(false);
              setDetails(false);
              if (viewer.current) viewer.current.reset();
              else set({ ...empty, loadStage: 'error', error: s.error });
            }}
          >
            Reset
          </button>
          <Sheet
            open={options}
            onOpenChange={(open) => {
              if (open) selectionFocus.current = false;
              setOptions(open);
            }}
          >
            <SheetTrigger
              ref={optionsButton}
              className="text-button options-trigger"
            >
              Options
            </SheetTrigger>
            <SheetContent
              className="about-sheet"
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
                  onClick={() => setCatalog(true)}
                  disabled={!s.parts.length}
                >
                  Source catalog <ChevronRight aria-hidden="true" />
                </button>
                <button
                  ref={aboutButton}
                  className="menu-link"
                  onClick={() => setAbout(true)}
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
          className="focus-strip"
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
              {(group || selected) && (
                <button
                  ref={detailButton}
                  className="text-button"
                  onClick={() => setDetails(true)}
                >
                  Details
                </button>
              )}
              {selected && (
                <button
                  className="text-button dismiss-button"
                  aria-label="Deselect part"
                  title="Deselect part (Escape)"
                  onClick={dismissSelection}
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {selected && (
            <div className="selected-summary">
              <small
                className="selection-identity"
                title={partIndex.get(selected.id)?.reference}
              >
                {partIndex.get(selected.id)?.context} ·{' '}
                {partIndex.get(selected.id)?.reference}
              </small>
              <button
                className="text-button isolate-button"
                aria-pressed={s.isolated}
                disabled={!available}
                onClick={() => patch({ isolated: !s.isolated })}
              >
                {s.isolated ? 'Show context' : 'Isolate part'}
              </button>
            </div>
          )}
        </section>
      )}
      <footer ref={deck} className="control-deck">
        <Popover open={explore} onOpenChange={setExplore}>
          <PopoverTrigger
            className="explore-button"
            disabled={s.loadStage === 'recovering'}
          >
            Explore <ChevronDown aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent
            className="explore-menu"
            side="top"
            align="start"
            sideOffset={12}
          >
            <PopoverTitle>Inside the movement</PopoverTitle>
            <button className="menu-link" onClick={() => chooseGroup(null)}>
              Whole movement <ChevronRight aria-hidden="true" />
            </button>
            {GROUPS.map((g, i) => (
              <button
                className="menu-link"
                key={g.id}
                onClick={() => chooseGroup(g.id)}
              >
                <span>
                  <small>0{i + 1}</small>
                  {g.technical}
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <DialControls
          state={s}
          viewer={() => viewer.current}
          available={available}
          onOpenChange={setDialOpen}
        />
        <div className="side-slot">
          <button
            className="side-switch text-button"
            disabled={!available || s.layout === 'spread'}
            style={{ visibility: s.layout === 'spread' ? 'hidden' : 'visible' }}
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
        <div className="separation-control">
          {s.layout === 'spread' ? (
            <>
              <button
                className="text-button overview-button"
                disabled={!available}
                onClick={() => viewer.current?.frameSpread()}
              >
                Fit all
              </button>
              <Popover open={spreadGroups} onOpenChange={setSpreadGroups}>
                <PopoverTrigger className="text-button" disabled={!available}>
                  Groups
                </PopoverTrigger>
                <PopoverContent className="explore-menu" side="top">
                  <PopoverTitle>Groups in the spread</PopoverTitle>
                  {SPREAD_GROUPS.map((name) => (
                    <button
                      className="menu-link"
                      key={name}
                      onClick={() => {
                        setSpreadGroups(false);
                        viewer.current?.frameSpread(name);
                      }}
                    >
                      {name}
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>
              <span id="separation-label">
                Separate
                <span className="sr-only">{group ? ' section' : ''}</span>
              </span>
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
              <button
                className="text-button reassemble"
                aria-label="Reassemble"
                title="Reassemble"
                disabled={
                  !available || !(s.separation || s.partSpread || s.reveal)
                }
                onClick={() =>
                  patch({ separation: 0, partSpread: 0, reveal: 0 })
                }
              >
                <RotateCcw aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <button
          className="text-button all-parts-button"
          disabled={!available}
          aria-pressed={s.layout === 'spread'}
          onClick={() =>
            s.layout === 'spread'
              ? chooseGroup(null)
              : viewer.current?.allParts()
          }
        >
          All parts
        </button>
      </footer>
      <Sheet open={details} onOpenChange={setDetails}>
        <SheetContent
          className="about-sheet"
          finalFocus={() =>
            detailButton.current ??
            host.current?.querySelector('canvas') ??
            false
          }
        >
          <SheetHeader>
            <SheetTitle>
              {selected ? partLabel(selected) : group?.technical}
            </SheetTitle>
            {(!selected || partDetail(selected)) && (
              <SheetDescription>
                {selected ? partDetail(selected) : group?.caption}
              </SheetDescription>
            )}
          </SheetHeader>
          <div className="about-copy">
            {selected ? (
              <>
                <h3>Source identity</h3>
                <p>{selected.name}</p>
                <p className="source-id">{selected.sourceInstanceId}</p>
                <p>{category(selected)}</p>
                {selected.definitionId === 'd_0_1_1_256' && (
                  <p>
                    The support’s role and intended visibility remain
                    unresolved.
                  </p>
                )}
              </>
            ) : (
              group && (
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
                  <span id="reveal-label">Uncover section</span>
                  <Slider
                    disabled={!available}
                    aria-labelledby="reveal-label"
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
                  <p className="secondary">
                    Moves covering parts aside. Separate section spaces the
                    section’s own components.
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
                          <small>
                            {partIndex.get(p.id)?.context} ·{' '}
                            {partIndex.get(p.id)?.reference}
                          </small>
                        </span>{' '}
                        <ChevronRight aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={catalog} onOpenChange={setCatalog}>
        <SheetContent
          className="catalog-sheet"
          finalFocus={() =>
            options
              ? catalogButton.current
              : (host.current?.querySelector('canvas') ?? false)
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
      <Sheet open={about} onOpenChange={setAbout}>
        <SheetContent className="about-sheet" finalFocus={aboutButton}>
          <SheetHeader>
            <SheetTitle>A study of the ml–01</SheetTitle>
            <SheetDescription>
              Explore the original Marco Lang CAD at rest, with authored
              materials and construction reveals.
            </SheetDescription>
          </SheetHeader>
          <div className="about-copy">
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
