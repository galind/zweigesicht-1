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
  PREFIX,
  belongs,
  inMembers,
  partLabel,
  category,
  type Part,
} from '@/src/experience/catalog';
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
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<MovementViewer | null>(null);
  const [s, set] = useState<ViewerSnapshot>(empty),
    [catalog, setCatalog] = useState(false),
    [about, setAbout] = useState(false),
    [collapsed, setCollapsed] = useState(false),
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
    void viewer.current?.select(id);
  };
  const chooseGroup = (id: string | null) => {
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
    <main className="explorer">
      <header className="topbar">
        <div className="brand">
          MARCO LANG<small>INDEPENDENT WATCHMAKING · DRESDEN</small>
        </div>
        <div className="header-actions">
          <span className="edition">ml–01 / Movement study</span>
          <button className="text-button" onClick={() => setAbout(true)}>
            About this study
          </button>
        </div>
      </header>
      <section className="workspace" aria-label="Movement explorer">
        <aside className={'intro ' + (collapsed ? 'collapsed' : '')}>
          <div className="title-row">
            <div>
              <span className="eyebrow">Calibre ml–01</span>
              <h1>Zweigesicht</h1>
            </div>
            <button
              className="tool collapse-button"
              aria-expanded={!collapsed}
              aria-label={
                collapsed ? 'Expand mechanisms' : 'Collapse mechanisms'
              }
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '＋' : '−'}
            </button>
          </div>
          <div className="mechanism-panel">
            <p className="section-label">EXPLORE THE MOVEMENT</p>
            <ToggleGroup
              className="mechanism-list"
              orientation="vertical"
              value={s.group ? [s.group] : ['whole']}
              onValueChange={(values) => {
                const id = values[0];
                if (id) chooseGroup(id === 'whole' ? null : id);
              }}
              aria-label="Choose a mechanism"
            >
              <ToggleGroupItem className="mechanism-choice" value="whole">
                <span className="mechanism-number">00</span>
                <span>The whole movement</span>
              </ToggleGroupItem>
              {GROUPS.map((g, i) => (
                <ToggleGroupItem
                  key={g.id}
                  className="mechanism-choice"
                  value={g.id}
                >
                  <span className="mechanism-number">0{i + 1}</span>
                  <span>{g.name}</span>
                  <span className="choice-arrow">↗</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <button
              className="catalog-button"
              onClick={() => setCatalog(true)}
              disabled={!s.parts.length}
            >
              Browse all parts{' '}
              <span>{s.parts.length ? s.parts.length - 1 : '—'} →</span>
            </button>
          </div>
        </aside>
        <div
          className={'stage ' + (collapsed ? 'panel-collapsed' : '')}
          ref={host}
          aria-label="Interactive CAD movement"
        />
        {(!s.ready || s.error) && (
          <div className="fallback">
            {/* Prepared local CAD still; deliberately no server image-transform dependency. */}
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
                  className="primary"
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
        {(group || selected) && (
          <article className="focus-card" aria-live="polite">
            <div className="focus-heading">
              <span className="eyebrow">
                {selected ? 'Selected component' : group?.technical}
              </span>
              <button
                className="text-button"
                onClick={() => {
                  if (viewer.current) viewer.current.back();
                  else chooseGroup(null);
                }}
                aria-label="Back to previous view"
              >
                ← Back
              </button>
            </div>
            <h2>{selected ? partLabel(selected) : group?.name}</h2>
            <p>{selected ? category(selected) : group?.caption}</p>
            {selected ? (
              <>
                <div className="part-actions">
                  <button
                    className="tool"
                    aria-pressed={s.isolated}
                    onClick={() => patch({ isolated: !s.isolated })}
                  >
                    {s.isolated ? 'Show context' : 'Isolate part'}
                  </button>
                  <button
                    className="tool"
                    onClick={() => {
                      patch({
                        part: null,
                        isolated: false,
                        phase: group ? 'mechanism' : 'whole',
                      });
                      if (group) viewer.current?.frameGroup(group);
                      else viewer.current?.homeCamera();
                    }}
                  >
                    Done
                  </button>
                </div>
                <details>
                  <summary>Source identity</summary>
                  <p>{selected.name}</p>
                  <p className="source-id">{selected.sourceInstanceId}</p>
                  <p>{selected.triangles ?? 0} source triangles</p>
                  {selected.id === PREFIX + '66' && (
                    <p>
                      Alternative to the standard setting spring. Configuration
                      remains unreviewed.
                    </p>
                  )}
                  {selected.definitionId === 'd_0_1_1_111' && (
                    <p>
                      Source eccentric has three faces that could not be
                      tessellated.
                    </p>
                  )}
                </details>
              </>
            ) : (
              <>
                <div className="reveal-control">
                  <span id="reveal-label">Uncover</span>
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
                </div>
                {members.length > 0 && (
                  <details className="member-list">
                    <summary>Inspect {members.length} components</summary>
                    <div>
                      {members.map((p) => (
                        <button key={p.id} onClick={() => selectPart(p.id)}>
                          {partLabel(p)}
                          <span>↗</span>
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </article>
        )}
        <div className="view-tools">
          <button
            className="tool icon-button"
            aria-label="Zoom in"
            onClick={() => viewer.current?.zoom(0.8)}
          >
            ＋
          </button>
          <button
            className="tool icon-button"
            aria-label="Zoom out"
            onClick={() => viewer.current?.zoom(1.25)}
          >
            −
          </button>
          <button
            className="tool reset-button"
            onClick={() => {
              if (viewer.current) viewer.current.reset();
              else chooseGroup(null);
            }}
          >
            Reset
          </button>
        </div>
        <div className="orientation-tools" aria-label="Orbit alternatives">
          <button
            className="text-button"
            aria-label="Orbit left"
            onClick={() => viewer.current?.orbit(-0.25, 0)}
          >
            ↶
          </button>
          <button
            className="text-button"
            aria-label="Tilt up"
            onClick={() => viewer.current?.orbit(0, -0.2)}
          >
            ↑
          </button>
          <button
            className="text-button"
            aria-label="Orbit right"
            onClick={() => viewer.current?.orbit(0.25, 0)}
          >
            ↷
          </button>
        </div>
        <div className="caption">
          {s.separation || s.partSpread
            ? 'CONSTRUCTION STUDY · NOT A SERVICE SEQUENCE'
            : 'Original Marco Lang CAD'}
        </div>
      </section>
      <footer
        className="control-deck"
        inert={!s.ready || !!s.error}
        aria-disabled={!s.ready || !!s.error}
      >
        <div className="primary-controls">
          <div className="treatment">
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
          </div>
          <div className="separation-control">
            <span id="separation-label">
              {s.group ? 'Separate components' : 'Separate layers'}
            </span>
            <Slider
              aria-labelledby="separation-label"
              value={[s.group ? s.partSpread : s.separation]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => {
                const value = Array.isArray(v) ? v[0] : v;
                patch(s.group ? { partSpread: value } : { separation: value });
              }}
            />
            <button
              className="text-button"
              onClick={() => patch({ separation: 0, partSpread: 0 })}
            >
              Reassemble
            </button>
          </div>
          <div className="side-buttons">
            <button
              className="tool"
              aria-pressed={s.side === 'back'}
              onClick={() => viewer.current?.setSide('back')}
            >
              Movement
            </button>
            <button
              className="tool"
              aria-pressed={s.side === 'front'}
              onClick={() => viewer.current?.setSide('front')}
            >
              Dial side
            </button>
          </div>
        </div>
      </footer>
      <Sheet open={catalog} onOpenChange={setCatalog}>
        <SheetContent className="catalog-sheet">
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
                  <span>{partLabel(p)}</span>
                  <small>{p.isAssembly ? 'Assembly' : 'Part'} ↗</small>
                </button>
              ))}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={about} onOpenChange={setAbout}>
        <SheetContent className="about-sheet">
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
              Separation paths are illustrative. This is a local study;
              redistribution and release approval remain open.
            </p>
            <a
              href="https://www.marcolangwatches.com/en/cad-2/zweigesicht-1/movement/"
              target="_blank"
              rel="noreferrer"
            >
              Marco Lang · Original CAD ↗
            </a>
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="low">Lightweight</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
