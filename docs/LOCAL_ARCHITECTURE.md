# Application architecture

`explorer/` uses React/TypeScript, vinext/Vite and Three.js. `app/page.tsx` owns the explorer UI; `app/workshop/page.tsx` supplies Workshop’s separate canonical/noindex metadata. The homepage links directly to Marco’s chapter without prefetching its renderer. `/workshop/assembly` redirects to `/workshop`. The root `vercel.json` owns deployment packaging.

## Authority and assets

- `explorer/public/models/assembly-manifest.json`: runtime source identities and immutable occurrence matrices. Source paths become `p_` IDs; reusable definitions use `d_` IDs. Millimetres and source axes are preserved.
- `assets/authored/`: reviewed labels, scope, mechanism groups, dial/hand/case configuration, focused separation and component fittings. Workshop’s 15 operations and exact occurrence membership live in `src/assembly/lesson.ts`.
- `assets/derived/complete-separation.json`: generated whole-movement offsets, separate from authored mounting rules.
- `asset-paths.json` and `finish-surfaces.json` in the runtime models directory: active content-hashed GLBs and source-face buffer. The diamond STL and case recovery have explicit hashes in their loaders.
- `assets/source-manifest/`: URLs, hashes and reference provenance. Original sources, conversion caches and analysis evidence are ignored.

`MovementViewer`, `AssemblyViewer` and `BenchViewer` own their route's geometry,
immutable source matrices, presentation transforms, camera state and resource
lifetime. Explorer's eligible assembled movement keeps its scheduler active;
separation and inventory return to on-demand rendering. Clock-only frames do not
notify Explorer React. The assembly chapter renders on demand and never loads a
running-movement controller. Its active-time counter is separate from rendering.

`GraphicsResources.ts` shares renderer settings, studio lighting, PMREM allocation and deduplicated disposal. `CameraFrame.ts`, native viewer buttons, Sheet and `useTextScalePreview` share interaction primitives. The controllers keep their own loading and state policies.

## Explorer

`MovementViewer` opens on negative source Z with negative Y up. `mechanisms.json` supplies six groups; `explosion.json` supplies focused host/release paths. Whole-movement disassembly uses the generated complete-separation offsets. Presentation translations compose outside source matrices; zero separation returns to exact endpoints. All parts has independent framing/flip state.

One active-panel value coordinates Explorer sheets and menus. The full-viewport canvas sits behind the identity, reading/acknowledgement/settings panels and bottom controls. Phone Menu and More expose secondary actions. Search defaults to displayed physical components and can include the entire CAD hierarchy. Renderer visibility supplies search status; selection and isolation are separate actions.

Dial visibility is one shared intent, initially false. Both selected dial/hand packets must be complete before either is fitted. Legacy visibility aliases normalize to the same value; conflicting API visibility inputs are rejected. Hand shapes are independent and changing hidden preferences does not enable a dial. Reset preserves side and configuration. WebMCP uses the same validated controller actions and unregisters on unmount.

The catalog promise coalesces optional requests, including the hash-checked original-face d54 recovery. A complete case and a complete dial pair have independent gates. Failed loads retain preferences and retry; stale completion cannot restore old intent. Shared recovery geometry serves four catalog occurrences, two in the fitted case. Discarded loads and partially constructed resources are disposed.

The fitted case has 41 leaves. Focus, All parts, raw external inspection and isolation can hide it without clearing its preference. Selecting a fitted case part retains configured context. Crystals permit pointer selection through them while remaining catalog-selectable. Exterior alloy presets and Fine hand overrides are scoped to the reviewed occurrences; raw inspection retains its own finishes.

`WheelDisplayPose.ts` applies the 20 separately reviewed wheel-packet occurrence phases to all
assembled Explorer and Bench views. Explorer retains its raw assembled matrix
and applies the phase as a display matrix, including spread layout. The chapter's
22 leaves use unchanged source fitted poses. Bench builds collision from the
same corrected mesh. The [earlier contact review](REMAINING_WHEEL_CONTACT_REVIEW.md)
and [rear-display review](REAR_DISPLAY_ANIMATION.md) record these authored
placement phases and their evidence limits. `RunningMovement.ts` applies the separate
prescribed-motion overlay after those poses; see [running movement](RUNNING_MOVEMENT.md)
for the clock, geometry ownership, product-state policy and validation.

`CasePose.ts` stages upper withdrawal, lower withdrawal, CAD-X case turnover, lower reseating and upper reseating. Camera and attachments share an inverse rotation frame, leaving source case/movement matrices intact. Exact endpoints reuse original counterpart occurrences. Reversal continues from the displayed phase; reduced motion snaps. Hidden-case turns skip invisible withdrawal/reseating time. Lug disassembly vectors follow the current attachment frame, and camera refits defer during turnover. The four unresolved locking pins stay seated. Detailed constraints are in [CAD notes](CAD_NOTES.md).

`?inspect=1` dynamically loads the inspection panel and browser QA/benchmark modules. `?no3d=1` and `?text=200` are explicit verification modes. No database or visitor account is required.

## Workshop

`/workshop` renders the sole **Be a watchmaker: Assembly** chapter. There is no
mode chooser, Easy/Hard DAG, packet workbench or completed-movement animation.
Old difficulty query parameters are ignored. The former `/workshop/assembly`
prototype URL redirects to the canonical route.

`Assembly.tsx` owns tool/part selection, pause/resume/restart, feedback and storage.
`lesson.ts` defines Marco's first 15 operations, required tools and exact occurrence
IDs. `session.ts` validates sequence, tool, side, support, destination and millimetre
placement radius, and retains an attempt/reward ledger across Undo and reload.
The chapter key remains `zweigesicht:watchmaker:chapter-1:v1`. The retired
`zweigesicht:play:session:v1` key is neither read, migrated nor deleted.

`AssemblyViewer` loads the required 22 leaves from the existing runtime GLBs and
uses each source record's `worldTransform` directly. Before retiring the old pose
manifest, all 22 matrices were compared and found identical. There is no duplicate
pose manifest. Existing materials, surface annotations, lighting and graphics
resource helpers are shared with the other views. The two existing holders are
hash-checked against recorded assets and use recorded side-specific seating.

The initially empty centre, loose parts, supported movement and separate stem
assembly share one surface. A fixed camera permits zoom and explicit rigid
turn/support exchange. `drag.ts` retains the pointer's grab offset. Committed
drops use a 5 mm model-space radius, optionally 10 mm for review; cancelled drags
and inspection are free. The keyboard exact-seat path uses the same validator.

See [chapter mappings and review limits](ASSEMBLY_CHAPTER_ONE.md). Partial-assembly
holder stability and physical insertion paths remain unverified. Completion ends
this chapter, not the entire movement. [Release gates](RELEASE_GATES.md) remain.

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
Animated internals keep a rest BVH and a reference pose under the moving parent.
Collision sync derives one forward/inverse transform pair from that pose: bounds,
floor hits, capsule corrections and contact normals all use the collision frame,
including between syncs while the visible mesh continues animating.
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

The chapter asset validator uses tracked meshes and source records, without original CAD:

```sh
node scripts/review/validate-assembly.mjs
```

The `Assembly chapter` GitHub workflow runs `scripts/review/assembly-chapter.mjs`
on a GitHub-hosted Chromium runner. It checks direct entry and retired links,
the full chapter, drag/cancellation, save/resume, scoring and required-asset Retry.
This script is intentionally guarded against local execution. Existing generic
Explorer/Bench browser tools remain separate; they require an existing Playwright
installation (`PLAYWRIGHT_MODULE`) and optionally Chrome (`CHROME_PATH`). The
Explorer loading suite expects the homepage entry to be visible in a development
or Preview build. Follow repository safeguards: prefer CI over local execution.

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
