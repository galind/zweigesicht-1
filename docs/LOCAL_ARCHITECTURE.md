# Application architecture

`explorer/` uses React/TypeScript, vinext/Vite and Three.js. `app/page.tsx` owns the explorer UI; `app/workshop/page.tsx` supplies Workshop’s separate canonical/noindex metadata. The homepage opens a shared Easy/Hard chooser and loads no Workshop manifest or renderer. The root `vercel.json` owns deployment packaging.

## Authority and assets

- `explorer/public/models/assembly-manifest.json`: runtime source identities and immutable occurrence matrices. Source paths become `p_` IDs; reusable definitions use `d_` IDs. Millimetres and source axes are preserved.
- `assets/authored/`: reviewed labels, scope, mechanism groups, dial/hand/case configuration, focused separation and Workshop membership/dependencies.
- `assets/derived/complete-separation.json`: generated whole-movement offsets, separate from authored mounting rules.
- `asset-paths.json` and `finish-surfaces.json` in the runtime models directory: active content-hashed GLBs and source-face buffer. The diamond STL and case recovery have explicit hashes in their loaders.
- `assets/source-manifest/`: URLs, hashes and reference provenance. Original sources, conversion caches and analysis evidence are ignored.

`MovementViewer` and `PlayViewer` own geometry, immutable source matrices, presentation transforms, camera state and resource lifetime. React sends discrete intent and receives snapshots on changes and after the final frame; neither controller polls React at rest. Both schedule rendering on demand, with bounded damping and transition tails. Visibility, resize, interaction and recovery wake them.

`GraphicsResources.ts` shares renderer settings, studio lighting, PMREM allocation and deduplicated disposal. `CameraFrame.ts`, native viewer buttons, Sheet and `useTextScalePreview` share interaction primitives. The controllers keep their own loading and state policies.

## Explorer

`MovementViewer` opens on negative source Z with negative Y up. `mechanisms.json` supplies six groups; `explosion.json` supplies focused host/release paths. Whole-movement disassembly uses the generated complete-separation offsets. Presentation translations compose outside source matrices; zero separation returns to exact endpoints. All parts has independent framing/flip state.

The full-viewport canvas sits behind the identity, reading/acknowledgement/settings panels and bottom controls. Phone Menu and More expose secondary actions. Search defaults to displayed physical components and can include the entire CAD hierarchy. Renderer visibility supplies search status; selection and isolation are separate actions.

Dial visibility is one shared intent, initially false. Both selected dial/hand packets must be complete before either is fitted. Legacy visibility aliases normalize to the same value; conflicting API visibility inputs are rejected. Hand shapes are independent and changing hidden preferences does not enable a dial. Reset preserves side and configuration. WebMCP uses the same validated controller actions and unregisters on unmount.

The catalog promise coalesces optional requests, including the hash-checked original-face d54 recovery. A complete case and a complete dial pair have independent gates. Failed loads retain preferences and retry; stale completion cannot restore old intent. Shared recovery geometry serves four catalog occurrences, two in the fitted case. Discarded loads and partially constructed resources are disposed.

The fitted case has 41 leaves. Focus, All parts, raw external inspection and isolation can hide it without clearing its preference. Selecting a fitted case part retains configured context. Crystals permit pointer selection through them while remaining catalog-selectable. Exterior alloy presets and Fine hand overrides are scoped to the reviewed occurrences; raw inspection retains its own finishes.

`WheelDisplayPose.ts` applies the 18 separately reviewed wheel-packet occurrence phases to all
three experiences. Explorer retains its raw assembled matrix and applies the
phase as a display matrix, including spread layout. Workshop retains base target
poses and derives corrected seat bounds at load. Bench builds collision from the
same corrected mesh. See the [latest contact review](REMAINING_WHEEL_CONTACT_REVIEW.md); this is
a set of static placement exceptions. `RunningMovement.ts` applies the separate
prescribed-motion overlay after those poses; see [running movement](RUNNING_MOVEMENT.md)
for the clock, geometry ownership, product-state policy and validation.

`CasePose.ts` stages upper withdrawal, lower withdrawal, CAD-X case turnover, lower reseating and upper reseating. Camera and attachments share an inverse rotation frame, leaving source case/movement matrices intact. Exact endpoints reuse original counterpart occurrences. Reversal continues from the displayed phase; reduced motion snaps. Hidden-case turns skip invisible withdrawal/reseating time. Lug disassembly vectors follow the current attachment frame, and camera refits defer during turnover. The four unresolved locking pins stay seated. Detailed constraints are in [CAD notes](CAD_NOTES.md).

`?inspect=1` dynamically loads the inspection panel and browser QA/benchmark modules. `?no3d=1` and `?text=200` are explicit verification modes. No database or visitor account is required.

## Workshop

`Play.tsx` owns selection, Ready now/All parts, grouping/search, explicit workbench navigation, confirmations and storage feedback. `state.ts` owns graph readiness, validated replay, physical accounting and Undo. `play-manifest.json` version `play-5` owns exact leaf sets, endpoints, exclusions, action IDs and prerequisite edges; display order never defines dependencies. Previous `play-4` saves migrate by removing only the six retired case-fitting actions; all other validated progress is preserved.

Easy has 83 placements. Hard has 243 single-leaf placements and 35 packet transfers; workbench components are assembled but not counted as fitted until transfer. Both retain the 16-leaf mainplate foundation and complete at exactly 259 fitted leaves. Undo removes the last committed action. Unavailable parts remain inspectable but cannot be dragged. Show seat is the optional aid; the removed Hints preference is retained only in the saved-session schema for compatibility.

The storage key remains `zweigesicht:play:session:v1`. Direct visits resume valid
saves; absent mode/save opens the shared chooser on Workshop without starting
geometry loads. Changing difficulty also opens that local chooser, independent
of the homepage entry flag. Changing a progressed mode or replacing
corrupt/incompatible data requires confirmation. Earlier linear saves are never
silently reinterpreted. Unavailable storage allows a current-tab build with a
warning and retained mode query.

`PlayViewer` loads required geometry transactionally; missing recovery or leaves block play/completion. Late metadata after unmount cannot start heavy loads. Thumbnail targets share authored materials and encode linear pixels for browser display, then center their transparent bounds. Dragging starts on gallery cards (selected thumbnails for touch), keeps source scale, and leaves no detached copy between interactions.

Free mouse/one-finger orbit matches the explorer. Flip, Reset and bounded centered zoom remain quick actions. The shock workbench has an angled face pair; radial dial screws have explicit edge presets in `fixedViews.ts`. Selection, placement and Undo preserve the camera; returning from a workbench restores the main view. Camera changes never hide fitted geometry. A drop requires the active workspace, prerequisites and an exposed source-surface sample. This is visual reachability, not physical collision certification.

[Release gates](RELEASE_GATES.md) distinguish automated/browser checks from mechanical, physical-device and representative human review.

## Bench

Hosted builds first check whether Bench asset delivery is configured; unavailable
builds omit its invitation and never start the renderer. When enabled, `/bench`
checks input capabilities before dynamically importing `BenchViewer`.
`useBenchAccess` also gates the homepage invitation; touch-only visits do not load
scene assets. Start explicitly requests pointer capture after the scene is ready.
`physics.ts` owns
the visitor capsule and per-definition BVH collision queries; `Bench.tsx` owns
the capture/menu/loading UI. Source transforms remain immutable inside an outer
presentation group. The two maker fixtures and authored Blender environment
stay out of Git, with hashes and nominal seating evidence recorded separately.
Configured Vercel builds fetch them from an approved source and verify their
hashes before packaging. See [bench reproduction and verification](BENCH_EXPERIENCE.md).

## Extended verification

Run these commands from the repository root after the basic checks in the
[README](../README.md). Production HTTP examples use the local server at
`http://127.0.0.1:4176`.

The HTTP metadata check covers homepage and Workshop social cards in the initial
HTML for X, Facebook and LinkedIn crawler user agents, clean canonical URLs for
query-string links, removed routes, and delivery of the preview image.
Actual platform preview rendering and cache refreshes still need a deployed check.

The source/runtime regression suite additionally needs the ignored CAD inputs described in [CAD notes](CAD_NOTES.md):

```sh
node scripts/cad/review-runtime.mjs
```

The sampled access check uses tracked meshes and does not require original CAD:

```sh
node scripts/play/fixed-access-check.mjs
```

Browser runners use an existing Playwright installation and Chrome. Set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` path and `CHROME_PATH` to the Chrome executable when they are not available through the defaults. No browser dependency is required by the application.

```sh
node scripts/play/entry-check.mjs http://127.0.0.1:4176 production
node scripts/play/browser-check.mjs http://127.0.0.1:4176 easy
node scripts/play/browser-check.mjs http://127.0.0.1:4176 hard
node scripts/play/drag-check.mjs http://127.0.0.1:4176
node scripts/play/access-check.mjs http://127.0.0.1:4176
node scripts/review/explorer-check.mjs http://127.0.0.1:4176
node explorer/scripts/measure-build.mjs
```

The `home` and loading suites expect the homepage entry to be visible. The
`entry-check` runner accepts `production` (default) or `preview` and checks the
corresponding homepage policy plus direct Workshop entry and save safety.
The `focused` suite works with either policy. Build
with `VERCEL_ENV=preview npm --prefix explorer run build`, restart the local server,
then run `node scripts/play/entry-check.mjs http://127.0.0.1:4176 preview`,
`node scripts/play/browser-check.mjs http://127.0.0.1:4176 home`, and
`node scripts/review/loading-check.mjs http://127.0.0.1:4176`. These are local
checks; do not deploy or promote the compiled Preview artifact to production.

Workshop runner modes are `easy`, `hard`, `focused`, `home` and `all`. `PLAY_ORDER=reverse` and `PLAY_WIDTH=320` exercise alternate legal orders and narrow Hard layouts; `PLAY_QA_OUTPUT` sets the ignored browser-evidence directory. The fixed-access check verifies the retained face/edge guidance presets at three sampled distances, not a restriction on free orbit or proof of physical insertion clearance.

`/?inspect=1` exposes lazy browser regression/benchmark tools and local delivery-failure fixtures. `?no3d=1` exercises fallback and `?text=200` enlarges root text. Browser viewport and synthetic touch checks do not establish physical-device or accessibility certification.

## Dependency maintenance

Keep the two npm lockfiles separate: `explorer/` is the application and
`scripts/assets/` is the offline Meshopt pipeline. The app's scoped
`overrides.oxfmt.tinypool` pins 2.1.2 to patch the formatter's exact 2.1.0
transitive dependency without a formatter upgrade. Revisit that override when
updating oxfmt. Vite 8.2.4 and source-map-js 1.2.2 are security patch updates;
no React, Three.js, vinext, Nitro or CAD package upgrades accompany this cleanup.

The upstream [Vite advisory](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22),
[tinypool advisory](https://github.com/tinylibs/tinypool/security/advisories/GHSA-85c8-ppgw-ccpr)
and [source-map-js patch](https://github.com/7rulnik/source-map-js/releases/tag/v1.2.2)
record the affected tooling paths. Audit severity alone does not establish a
visitor-reachable vulnerability in this static CAD application.

The staging cleanup removes the unused direct resvg dependency with the retired
workshop artwork generator, and updates only transitive fast-uri 3.1.8 → 3.1.9
inside Ajv's existing range. The [review](REPOSITORY_REVIEW.md) records its upstream
advisory and the dependency path. Typecheck also rejects unused locals/parameters.
