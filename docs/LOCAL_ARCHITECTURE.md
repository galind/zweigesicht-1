# Application architecture

`explorer/` uses React/TypeScript, vinext/Vite and Three.js. `app/page.tsx` owns the explorer UI; `app/workshop/page.tsx` supplies Workshop’s separate canonical/noindex metadata. The homepage links directly to Marco’s chapter without prefetching its renderer. `/workshop/assembly` redirects to `/workshop`. The root `vercel.json` owns deployment packaging.

## Authority and assets

- `explorer/public/models/assembly-manifest.json`: runtime source identities and immutable occurrence matrices. Source paths become `p_` IDs; reusable definitions use `d_` IDs. Millimetres and source axes are preserved.
- `assets/authored/`: reviewed labels, scope, mechanism groups, dial/hand/case configuration, focused separation and component fittings. Workshop’s 15 operations and exact occurrence membership live in `src/assembly/lesson.ts`.
- `assets/derived/complete-separation.json`: generated whole-movement offsets, separate from authored mounting rules.
- `asset-paths.json` and `finish-surfaces.json` in the runtime models directory: active content-hashed GLBs and source-face buffer. The diamond STL and case recovery have explicit hashes in their loaders.
- `assets/source-manifest/`: URLs, hashes and reference provenance. Original sources, conversion caches and analysis evidence are ignored.

`MovementViewer`, `WorkshopViewer` and `BenchViewer` own their route's geometry,
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

`/workshop` renders **Be a watchmaker!**, the movement-only practice promoted
from the presentation prototype. Former `/workshop/prototype` and
`/workshop/assembly` links redirect here; old difficulty query parameters are ignored.
There is no separate-stem screen, hand-tool selection or old chapter interface.

`Workshop.tsx` owns parts browsing, drag/tap/keyboard placement, cancellation,
feedback and memory-only checkpoint state. The starting fixture is chapter cursor
12: fit the winding bridge and its two screws onto the prepared movement. It does
not simulate the preceding operations or claim a completed full lesson.

`lesson.ts` retains the historical chapter mapping and exact occurrence IDs.
`session.ts` supplies placement validation and the retained save schema, but the
current workshop never reads or writes storage. Both old save keys remain untouched.
Tool checking is explicitly disabled for practice; part, sequence, orientation,
support and 5mm placement validation remain. The movement is the sole destination.

`WorkshopViewer` loads the existing 22 source leaves, retains their matrices and
finish annotations, and shares Explorer's studio resources, perspective framing and
contact shading. Only installed movement components and a dragged part enter the
scene. The Parts Sheet has CAD previews, search and availability filters; its phone
bottom-sheet handoff preserves pointer capture. No holder downloads or animation
are required. See [workshop scope and review limits](WORKSHOP.md).

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

The `Workshop` GitHub workflow runs `scripts/review/workshop.mjs`
on a GitHub-hosted Chromium runner. It checks the three movement placements,
menu dragging/cancellation, tap/keyboard alternatives, save isolation and old-link
redirects on desktop and emulated phones.
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
