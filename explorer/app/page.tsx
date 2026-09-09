'use client';
import { useEffect, useRef, useState } from 'react';
import {
  MovementViewer,
  type ViewerSnapshot,
} from '@/src/viewer/MovementViewer';
import { registerMovementTools } from '@/src/experience/webmcp';
import { runBrowserChecks, startBenchmark } from '@/src/viewer/validation';
import { initialState } from '@/src/experience/state';
import {
  GROUPS,
  ROOT,
  belongs,
  inMembers,
  partLabel,
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
const empty: ViewerSnapshot = {
  ...initialState,
  ready: false,
  spreadFocus: null,
  status: 'Preparing the movement…',
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
    aboutButton = useRef<HTMLButtonElement>(null),
    detailButton = useRef<HTMLButtonElement>(null);
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<MovementViewer | null>(null);
  const [s, set] = useState<ViewerSnapshot>(empty),
    [catalog, setCatalog] = useState(false),
    [about, setAbout] = useState(false),
    [explore, setExplore] = useState(false),
    [spreadGroups, setSpreadGroups] = useState(false),
    [options, setOptions] = useState(false),
    [details, setDetails] = useState(false),
    [inspect, setInspect] = useState(false),
    [qa, setQa] = useState<unknown>(null);
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
            'Interactive 3D is unavailable. Explore the mechanism descriptions and reference view.',
          status: '',
        })),
      );
      return;
    }
    let v: MovementViewer;
    try {
      v = new MovementViewer(host.current, set);
      viewer.current = v;
    } catch {
      queueMicrotask(() =>
        set((prev) => ({
          ...prev,
          error:
            'Interactive 3D is unavailable. You can still explore the mechanism descriptions and reference view.',
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
  const selectPart = (id: string) => {
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
            Marco Lang <i>·</i> Calibre ml–01
          </span>
        </div>
        <Sheet open={options} onOpenChange={setOptions}>
          <SheetTrigger className="text-button options-trigger">
            Options
          </SheetTrigger>
          <SheetContent className="about-sheet">
            <SheetHeader>
              <SheetTitle>Make yourself comfortable</SheetTitle>
              <SheetDescription>
                View controls, appearance and sources.
              </SheetDescription>
            </SheetHeader>
            <div className="about-copy">
              <p>
                Drag to orbit. Pinch or scroll to zoom. Tap a component to
                inspect it. In All parts, drag to pan.
              </p>
              <div
                className="alternative-controls"
                aria-label="Camera controls"
              >
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
              </div>
              <p className="secondary">
                On the movement: arrow keys orbit (pan in All parts), + / −
                zoom, Home resets. All components are also available in the
                catalog.
              </p>
              <ToggleGroup
                value={[s.treatment]}
                aria-label="Visual treatment"
                onValueChange={(v) => {
                  if (v[0]) patch({ treatment: v[0] as 'finish' | 'function' });
                }}
              >
                <ToggleGroupItem value="finish">Finish</ToggleGroupItem>
                <ToggleGroupItem value="function">Function</ToggleGroupItem>
              </ToggleGroup>
              <div className="quality-control">
                <label htmlFor="render-quality">Rendering quality</label>
                <Select
                  value={s.quality}
                  onValueChange={(v) =>
                    patch({ quality: v as 'auto' | 'high' | 'low' })
                  }
                >
                  <SelectTrigger
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
                  </SelectTrigger>
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
                Source catalog <span>↗</span>
              </button>
              <button
                ref={aboutButton}
                className="menu-link"
                onClick={() => setAbout(true)}
              >
                About & sources <span>↗</span>
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
        />
        {(!s.ready || s.error) && (
          <div className="fallback">
            {/* oxlint-disable-next-line next/no-img-element */}
            <img
              src="/reference/movement-back.png"
              alt="Assembled movement from original Marco Lang CAD"
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
            <output className="load-message">
              {s.error || s.status}
              {s.error && (
                <button
                  className="tool"
                  onClick={() => {
                    if (viewer.current && !viewer.current.contextLost)
                      void viewer.current.load();
                    else location.reload();
                  }}
                >
                  Retry 3D
                </button>
              )}
            </output>
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
              onClick={() => void viewer.current?.loadCatalog().catch(() => {})}
            >
              Retry catalog
            </button>
          </div>
        )}
        {s.layout !== 'spread' && (
          <button
            className="side-switch text-button"
            disabled={!s.ready}
            onClick={() =>
              viewer.current?.setSide(s.side === 'back' ? 'front' : 'back')
            }
            aria-label={
              s.side === 'back' ? 'Show dial side' : 'Show movement side'
            }
          >
            ↻ <span>{s.side === 'back' ? 'Dial side' : 'Movement side'}</span>
          </button>
        )}
      </section>
      {(group || selected || s.layout === 'spread') && (
        <section
          className="focus-strip"
          aria-label="Current view"
          aria-live="polite"
        >
          <div className="focus-title">
            <h2>
              {selected
                ? partLabel(selected)
                : group
                  ? group.technical
                  : s.spreadFocus
                    ? `All parts · ${s.spreadFocus}`
                    : 'All parts'}
            </h2>
            <div className="focus-actions">
              {s.canBack && (
                <button
                  className="text-button"
                  onClick={() => {
                    viewer.current?.back();
                    host.current?.querySelector('canvas')?.focus();
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                className="text-button"
                onClick={() => {
                  chooseGroup(null);
                  host.current?.querySelector('canvas')?.focus();
                }}
              >
                Whole movement
              </button>
              {(group || selected) && (
                <button
                  ref={detailButton}
                  className="text-button"
                  onClick={() => setDetails(true)}
                >
                  Details
                </button>
              )}
            </div>
          </div>
          {selected ? (
            <div className="selected-summary">
              <p>{partDetail(selected)}</p>
              <button
                className="text-button"
                aria-pressed={s.isolated}
                onClick={() => patch({ isolated: !s.isolated })}
              >
                {s.isolated ? 'Show context' : 'Isolate part'}
              </button>
            </div>
          ) : group ? (
            <ul className="facts">
              {factsFor(group.id).map((f) => (
                <li key={f.text}>{f.text}</li>
              ))}
            </ul>
          ) : (
            <p className="spread-hint">
              Drag to pan · Pinch or scroll to look closer
            </p>
          )}
        </section>
      )}
      <footer className="control-deck">
        <Popover open={explore} onOpenChange={setExplore}>
          <PopoverTrigger className="explore-button">
            Explore <span>＋</span>
          </PopoverTrigger>
          <PopoverContent
            className="explore-menu"
            side="top"
            align="start"
            sideOffset={12}
          >
            <PopoverTitle>Inside the movement</PopoverTitle>
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
                <span>↗</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <div className="separation-control">
          {s.layout === 'spread' ? (
            <>
              <button
                className="text-button overview-button"
                onClick={() => viewer.current?.frameSpread()}
              >
                Fit all parts
              </button>
              <Popover open={spreadGroups} onOpenChange={setSpreadGroups}>
                <PopoverTrigger className="text-button">
                  Look closer
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
                      <span>↗</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>
              <span id="separation-label">
                {group ? 'Separate section' : 'Separate'}
              </span>
              <Slider
                disabled={!s.ready || !!s.error}
                aria-labelledby="separation-label"
                value={[group ? s.partSpread : s.separation]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => {
                  const value = Array.isArray(v) ? v[0] : v;
                  patch(group ? { partSpread: value } : { separation: value });
                }}
              />
              <button
                className="text-button reassemble"
                aria-label="Reassemble"
                title="Reassemble"
                disabled={!(s.separation || s.partSpread)}
                style={{
                  visibility:
                    s.separation || s.partSpread ? 'visible' : 'hidden',
                }}
                onClick={() =>
                  patch({ separation: 0, partSpread: 0, reveal: 0 })
                }
              >
                ↩
              </button>
            </>
          )}
        </div>
        <button
          className="text-button all-parts-button"
          disabled={!s.ready || !!s.error}
          aria-pressed={s.layout === 'spread'}
          onClick={() =>
            s.layout === 'spread'
              ? chooseGroup(null)
              : viewer.current?.allParts()
          }
        >
          All parts
        </button>
        <button
          className="text-button reset-button"
          onClick={() => {
            setExplore(false);
            setSpreadGroups(false);
            setDetails(false);
            if (viewer.current) viewer.current.reset();
            else set({ ...empty, error: s.error });
          }}
        >
          Reset
        </button>
      </footer>
      <Sheet open={details} onOpenChange={setDetails}>
        <SheetContent className="about-sheet" finalFocus={detailButton}>
          <SheetHeader>
            <SheetTitle>
              {selected ? partLabel(selected) : group?.technical}
            </SheetTitle>
            <SheetDescription>
              {selected ? partDetail(selected) : group?.caption}
            </SheetDescription>
          </SheetHeader>
          <div className="about-copy">
            {selected ? (
              <>
                <h3>Source identity</h3>
                <p>{selected.name}</p>
                <p className="source-id">{selected.sourceInstanceId}</p>
                <p>{category(selected)}</p>
              </>
            ) : (
              group && (
                <>
                  <ul className="detail-facts">
                    {factsFor(group.id).map((f) => (
                      <li key={f.text}>
                        {f.text}{' '}
                        <a href={f.url} target="_blank" rel="noreferrer">
                          {f.attribution} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                  <span id="reveal-label">Uncover section</span>
                  <Slider
                    disabled={!s.ready}
                    aria-labelledby="reveal-label"
                    value={[s.reveal]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(v) =>
                      patch({ reveal: Array.isArray(v) ? v[0] : v })
                    }
                  />
                  <h3>Components</h3>
                  <div className="catalog-index">
                    {members.map((p) => (
                      <button key={p.id} onClick={() => selectPart(p.id)}>
                        {partLabel(p)} <span>↗</span>
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
        <SheetContent className="catalog-sheet" finalFocus={catalogButton}>
          <SheetHeader>
            <SheetTitle>Every source component</SheetTitle>
            <SheetDescription>
              365 parts and 61 subassemblies. Alternatives and empty geometry
              remain documented.
            </SheetDescription>
          </SheetHeader>
          <div className="catalog-search">
            <Combobox
              items={s.parts.filter((p) => p.id !== 'p_0_1_1_1')}
              itemToStringLabel={(p: Part) =>
                `${p.name} · ${p.sourceInstanceId.split('/').at(-1)}`
              }
              onValueChange={(p: Part | null) => {
                if (p) selectPart(p.id);
              }}
            >
              <ComboboxInput
                placeholder="Find a part or assembly…"
                aria-label="Search all source parts"
              />
              <ComboboxContent>
                <ComboboxEmpty>No matching parts.</ComboboxEmpty>
                <ComboboxList>
                  {(p: Part) => (
                    <ComboboxItem key={p.id} value={p}>
                      <span>
                        {p.name}
                        <small>
                          {p.isAssembly
                            ? 'Assembly'
                            : belongs(p.id, ROOT)
                              ? 'Movement'
                              : 'Variant / case'}{' '}
                          · {p.sourceInstanceId.split('/').at(-1)}
                        </small>
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
                <button key={p.id} onClick={() => selectPart(p.id)}>
                  <span>{p.name.replace(/^ml01 /, '')}</span>
                  <small>{p.isAssembly ? 'Assembly' : 'Part'} ↗</small>
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
              Marco Lang · Original CAD ↗
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
