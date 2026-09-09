# Interface polish review

Status: complete locally and ready for user visual review. Publication remains outside this task.

Preview: http://127.0.0.1:4173/. Start with `cd explorer` and `npm run dev -- --host 127.0.0.1 --port 4173`. Nothing has been pushed, registered, uploaded or deployed during this task.

## Copy changes

| Before | After |
|---|---|
| Make yourself comfortable | View options |
| Finish / Function | Materials / Mechanism colors |
| Crown controls | Winding & setting |
| Dial side / Movement side | Show dial side / Show movement side |
| Every source component | Source catalog |
| Movement function · seconds stop | Seconds-stop function |
| Loading movement · 100% while preparing | Loading the movement → Preparing the view → Movement ready |
| Raw German names as catalog headlines | Shared English labels, with original names and unique source references beneath |
| An individual component of the source construction | Supported role where available; otherwise source context and reference |
| Uncover section without explanation | Moves covering parts aside; Separate section spaces its own components |

Explore, All parts, Back and Reset retain their established names. Whole movement restores the complete assembly while retaining appearance/quality preferences. Reassemble clears separation and uncovering within the current context. Reset restores the full opening state and options. No running-watch controls or claims were introduced.

Readable names come from the existing manifest, source/mechanism review and appearance ledger. `assets/authored/component-labels.json` adds exact definition overrides for ambiguous substring matches and previously generic entries. Wheel hubs, a cannon-pinion arbor, fork underplates and the crown guard no longer inherit the wrong labels. Original names, complete instance IDs and definition IDs remain searchable. Repeated occurrences receive the shortest unique source-path suffix plus readable parent context. The generated manifest is unchanged.

## Loading and recovery

The text-led loading and fallback states use the existing charcoal environment and typography. They request no still image. Progress represents only a measurable movement-file transfer; unknown totals and view preparation are indeterminate. One polite announcement reports each stage, independently of byte updates. The viewer becomes available only after the beauty and contact passes render a valid prepared scene. Annotation, recovered-diamond and first-frame failures now enter a retryable error state; temporary request-owned scenes are disposed before retry or after stale completion. No partial finish/diamond result is presented as ready. No minimum display time is imposed.

Unavailable 3D controls are disabled, while Options, About and available source/section reading remain accessible. Graphics recovery retains the inspection state and provides Reload 3D. Optional catalog selection waits for geometry before changing the current scene. Retry completes the requested selection only if subsequent navigation has not superseded it.

Local delivery fixtures are opt-in on `?inspect=1&delivery=MODE&case=UNIQUE`: `slow` sends a measured uncompressed movement stream; `unknown` sends a compressed stream without a total; `prepare` delays the annotation buffer; `failure` fails the first movement request; `catalog-failure` fails the first catalog request; `surface-failure` and `diamond-failure` fail the respective protected asset; `render-failure` throws once on the first prepared beauty frame and `contact-failure` throws inside its normal/contact pass. The Vite-only middleware serves local files, clears timers on disconnect and changes no production delivery. Explicit fixture requests use query suffixes to avoid reusing cached assets.

## Motion and layout decisions

Baseline motion was captured from the committed application at `a806295` in `/private/tmp/zweigesicht-polish-baseline`, served on loopback port 4174. Only inspection capture hooks, a first-frame timestamp and matching delivery fixtures were added to that temporary copy. The same prepared manifest gzip was supplied to both servers for equivalent delivery measurements. Early baseline observations without that gzip are not equivalent timing evidence.

The baseline spread completed much of its outward travel in the first 200 ms, followed by a long convergence tail. The candidate uses an 850 ms smoothstep transition for both camera and part poses. Each retarget begins with the displayed position and orientation. Quaternion interpolation takes the short rotation path; camera direction follows an arc while camera distance interpolates, avoiding a pass through the object when changing sides. Direct slider updates use a 75 ms response and do not retake a manually controlled camera. The terminal pose is explicitly rendered before idling.

Desktop group arrangement is retained. Portrait views compare deterministic one-, two- and three-column block layouts and choose the best common inspection scale. Parts are never individually enlarged. All 216 eligible leaves, including the recovered diamond, retain source geometry, original relative scale and identity. Source assembly matrices, materials, lighting and annotations remain protected. Presentation paths are not physical disassembly procedures.

`explorer/src/viewer/capture.ts` samples real rendered canvas frames at approximately 100 ms intervals. The inspection controls record four-second sequences for explosion scrubbing/reversal, All parts entry/Back, and interrupted destinations. Sampling timestamps are stored with each frame; recording overhead is separate from performance benchmarks.

## Acceptance evidence

The local [review gallery](http://127.0.0.1:4173/reference/polish-review/index.html) pairs **90 screenshots**: nine states at 1280×720, 1600×1000, 390×844, 320×740 and 844×390, before and after. States are loading, ready, fallback, Options, catalog, search, selected component, mechanism details and All parts. Additional evidence covers actual initial errors/retries, all six separated mechanisms from both sides, 200% text and direct pointer interaction. `raster-audit.json` verifies all 90 native viewport dimensions. Raw browser screenshot bytes are retained without resampling (the provider encodes these as JPEG despite the historical `.png` filenames). A stale viewport-frame capture issue was found and the affected captures were replaced.

Six matched motion comparisons cover desktop and portrait scrubbing/reversal, spread entry/Back and interrupted destinations. Every four-second recording was played through with the gallery’s timestamp clock (`playback-review.json`); intermediate frames and live playback snapshots are retained. Around 300 ms the original spread is already near its distant destination, while the candidate still shows the main plate, shafts and blue fittings moving through a connected intermediate arrangement. By about 850 ms the candidate is fully settled. Return and interrupted moves start from the displayed pose. Related parts approach together without added staging delays or spins. Existing layer and section offsets were retained after both-side/oblique review; the identified weaknesses were response, camera ownership and the convergence tail. Portrait two-column packing increases the common inspection scale; the landscape/desktop grouping remains useful. Crossing during travel is an authored presentation, not a validated service procedure.

| Brief requirement | Authoritative verification |
|---|---|
| 1. Honest loading and recovery | Measured slow transfer, absent totals and delayed annotation preparation were observed live. Two initial overview failure/retry cycles, optional catalog failure/retry, protected annotation/diamond failures, beauty/contact first-prepared-frame exceptions, forced no-3D retry and real WebGL context loss/restoration recover successfully. `loading-layout.json` records identical 1232×540.328 px workspace bounds before/after preparation. The DOM has a stage-only polite status and scoped progressbar. CPU checks cover stale metadata/progress/success/failure, temporary-scene disposal, invalid sidecars and retry; ready requires beauty and contact rendering. No still is requested, so there is no still-failure dependency. |
| 2. Copy and identities | The table above is implemented across visitor controls and details. Actual manifest checks exercise every English/source-ID search and all 427 unique occurrence references. Exact authored labels preserve source names, IDs, provenance and uncertainty; no generated manifest edit or new mechanical claim. Live English, source-ID and empty-state searches pass. Suffix counts avoid repeated whole-catalog scans during startup. |
| 3. Icons | Visitor-authored page, experience and authored-copy audit contains no emoji or Unicode icon artwork. Lucide SVGs distinguish internal navigation, external links, side switch, reassembly, expansion and close. Decorative icons are hidden; reassembly and close are named. Source/keyboard punctuation remains intact. |
| 4. Interaction and responsive polish | All five sizes have matched final evidence. No final document overflow; original search overflow at 390/320 px is recorded. Options/catalog/About Escape and close restore their proper parent focus, while source selection returns to the canvas. Keyboard source selection, slider, orbit/pan/zoom and Home reset pass. Actual pointer pan/orbit and slider drag/reversal pass. Sheet close/camera/toggle controls have at least 44 px targets; compact text navigation is at least 40 px. 200% text reflows at 320 px and desktop, including Options, search and selection; bounded detail areas scroll. Reduced motion was exercised in the real renderer’s preference branch and inspected in its CSS override, rather than claimed as OS/device emulation. |
| 5. Explosion, spread and transitions | 12 checks pass at both 1280 and 390 px, including 24 mixed interrupted explosion/reveal/spread/selection/isolation/Back/Reset sequences, prior-context restoration and manual camera takeover. Both-side views of all six sections and direct oblique slider gestures supplement the motion comparisons. Actual-asset packing tests cover five aspect ratios. Spread has 216 visible members, zero settled projected overlap/clipping and maximum relative-scale error 4.44×10⁻¹⁶. Exact reassembly error is 0. GPU resources stabilize at 140 geometries/8 textures after selection warm-up; idle adds zero renders. |
| Protected baseline and local scope | Original source hashes and both exported GLB integrity/placement checks pass. All original position/normal/index bytes, IDs, assembly matrices, accepted material/lighting parameters, 58 annotations and recovered diamond remain protected. No retessellation, re-export, playback or dependency migration. FINISHING_GOAL.md is untouched. No push, deployment, registration, upload or additional redistribution. |
| Validation and handoff | 46 actual-source/asset CPU checks, four state tests, 12 desktop and 12 portrait browser checks, TypeScript, authored lint and production build pass. The build retains its existing large-chunk warning. Copy decisions, recordings, measurements, screenshots, local preview and this acceptance record are delivered. |

Evidence files live under `artifacts/browser/polish/`. `before-` records the original; `after-` is accepted final behavior. Early `candidate-` recordings and single preliminary loading measurements are exploratory; the final comparisons use `before/after-{scrub,spread,interrupt}-{1280,390}.json`, `loading-comparison.json` and `benchmark-before/after.json`. Loading screenshots expose the opt-in inspection disclosure; it is absent from the visitor URL.

## Equivalent measurements

In-app Chromium 152 on this Mac, viewport 1280×720, DPR 1, identical geometry and local gzip delivery. These are warm-server desktop measurements, not remote-network, physical-phone or sustained thermal measurements.

| Measurement | Before | After |
|---|---:|---:|
| Encoded model/manifest/annotation/diamond payload | 5,953,914 bytes | 5,953,914 bytes |
| Uncached first prepared frame, median of three | 254.0 ms | 268.9 ms |
| Cached first prepared frame, median of three | 247.8 ms | 269.6 ms |
| 60 s assembled orbit mean / p95 | 16.667 / 16.8 ms | 16.667 / 16.9 ms |
| Revealed mechanism orbit mean / p95 | 16.667 / 18.1 ms | 16.667 / 18.0 ms |
| Separated orbit mean / p95 | 16.667 / 16.8 ms | 16.665 / 16.8 ms |

The new startup carries a small measured first-frame cost; it does not add model payload or an artificial wait. Payload totals are the six instrumented model resources, not a claim about every HTML/JavaScript/font request. The old loading still is no longer fetched. The baseline uses an added post-render timestamp for comparison; its original pre-render `loadMs` is not treated as first-frame timing. Slow/unknown fixtures took about 13–14 seconds by design, with readiness withheld through preparation. The browser cadence changed after a session restart, so both 60-second benchmarks were recorded again in the current session; the final pair averages about 16.67 ms per frame and has maxima at or below 18.7 ms. Earlier 13.34 ms-cadence records remain as explicitly named historical evidence and are not mixed into the final comparison. No broader performance certification is implied.

Physical touch hardware, screen-reader use, notched devices, prolonged thermal testing, human comprehension and expert mechanical review were not performed. These are review limitations; they do not narrow the completed local interface-polish scope or clear publication/mechanical release gates.

## Reproduce the local checks

```sh
node --test tests/experience.test.mjs
node scripts/cad/review-runtime.mjs
python3 scripts/preflight/verify_sources.py
node scripts/assets/verify-three.mjs
cd explorer
npx tsc --noEmit
npx oxlint app/page.tsx src/experience src/viewer vite.config.ts
npm run build
npm run dev -- --host 127.0.0.1 --port 4173
```

Open `?inspect=1` for interaction checks, a 60-second benchmark and timestamped motion capture. The gallery generator is `node scripts/cad/polish-gallery.mjs`; its local evidence directory is linked by the ignored `explorer/public/reference/polish-review` symlink. Production hosting is not involved.

## Final review findings resolved

Selecting a component from the nested catalog now returns focus to the movement canvas; ordinary catalog/About closure returns to its parent button, and closing Options returns to Options. Retry catalog hands focus to the existing canvas before its button disappears. English search survives periodic viewer snapshots; empty results explain the supported search terms. The source audit found no emoji or icon text glyphs in visitor-authored page, experience or mechanism/label content; mathematical/keyboard notation is retained.

Optional catalog failure was exercised from the Energy section with separation 0.35: the section, separation and camera remained intact, and Retry catalog selected the requested case assembly. Graphics loss in All parts restored 216 visible leaves, all 58 annotations and the recovered diamond. Live surface, diamond and first-frame failures each offered Retry 3D and recovered the accepted complete appearance.

The installed Three.js contact pass can throw between its internal override and restoration. The wrapper now restores the target, clear settings, override material and line visibility, and clears the pinned pass’s visibility cache before retry. A real injected normal-pass exception recovered the accepted live view; an actual-SSAOPass CPU fixture verifies restoration and that hidden lines stay hidden on the next successful pass. Nominal shading parameters and output are unchanged.
