# Application architecture

`explorer/` uses React/TypeScript, vinext/Vite and Three.js. `app/page.tsx` owns the explorer UI; `app/workshop/page.tsx` supplies Workshop’s separate canonical/noindex metadata. The homepage opens a shared Easy/Hard chooser and loads no Workshop manifest or renderer. `next.config.ts` retains the `/play` compatibility redirect. The root `vercel.json` owns deployment packaging.

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

`CasePose.ts` stages upper withdrawal, lower withdrawal, CAD-X case turnover, lower reseating and upper reseating. Camera and attachments share an inverse rotation frame, leaving source case/movement matrices intact. Exact endpoints reuse original counterpart occurrences. Reversal continues from the displayed phase; reduced motion snaps. Hidden-case turns skip invisible withdrawal/reseating time. Lug disassembly vectors follow the current attachment frame, and camera refits defer during turnover. The four unresolved locking pins stay seated. Detailed constraints are in [CAD notes](CAD_NOTES.md).

`?inspect=1` dynamically loads the inspection panel and browser QA/benchmark modules. `?no3d=1` and `?text=200` are explicit verification modes. No database or visitor account is required.

## Workshop

`Play.tsx` owns selection, Ready now/All parts, grouping/search, explicit workbench navigation, confirmations and storage feedback. `state.ts` owns graph readiness, validated replay, physical accounting and Undo. `play-manifest.json` version `play-4` owns exact leaf sets, endpoints, exclusions, action IDs and prerequisite edges; display order never defines dependencies.

Easy has 89 placements. Hard has 249 single-leaf placements and 35 packet transfers; workbench components are assembled but not counted as fitted until transfer. Both retain the 16-leaf mainplate foundation and complete at exactly 265 fitted leaves. Undo removes the last committed action. Unavailable parts remain inspectable but cannot be dragged. Show seat and the optional next-fit guide reveal fitting points; Fit part provides a named click/keyboard placement control. The removed Hints preference is retained only in the saved-session schema for compatibility.

The storage key remains `zweigesicht:play:session:v1`. Direct visits resume valid saves; absent mode/save returns to the homepage chooser. Changing a progressed mode or replacing corrupt/incompatible data requires confirmation. Earlier linear saves are never silently reinterpreted. Unavailable storage allows a current-tab build with a warning and retained mode query.

`PlayViewer` loads required geometry transactionally; missing recovery or leaves block play/completion. Late metadata after unmount cannot start heavy loads. Thumbnail targets share authored materials and encode linear pixels for browser display, then center their transparent bounds. Dragging starts on gallery cards (selected thumbnails for touch), keeps source scale, and leaves no detached copy between interactions.

Free mouse/one-finger orbit matches the explorer. Flip, Reset and bounded centered zoom remain quick actions. The shock workbench has an angled face pair; radial dial screws have explicit edge presets in `fixedViews.ts`. Selection, placement and Undo preserve the camera; returning from a workbench restores the main view. Camera changes never hide fitted geometry. A drop requires the active workspace, prerequisites and an exposed source-surface sample. This is visual reachability, not physical collision certification.

[Release gates](RELEASE_GATES.md) distinguish automated/browser checks from mechanical, physical-device and representative human review.

`journey.ts` derives eight chapter summaries and legal recommendations from the
existing graph. It keeps available bench work together, prioritizes explicit
transfers, and follows missing prerequisites for a blocked chapter. No guide
action commits a placement. Chapter notes are editorial observations of the puzzle.
The desktop companion is excluded from the model's measured framing region.

Finished-movement preview is transient presentation: `sync` supplies final leaves
with no held part and disables placement while previewing. Camera/workspace/detail
state is captured before entering and restored on return; session and storage are
untouched. Completion uses the same viewing mode. See the [review and decision](WORKSHOP_REVIEW.md).

## Extended verification

Run these commands from the repository root after the basic checks in the
[README](../README.md). Production HTTP examples use the local server at
`http://127.0.0.1:4176`.

The HTTP metadata check covers homepage and Workshop social cards in the initial
HTML for X, Facebook and LinkedIn crawler user agents, clean canonical URLs for
query-string links, the `/play` redirect, and delivery of the preview image.
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
node scripts/play/browser-check.mjs http://127.0.0.1:4176 easy
node scripts/play/browser-check.mjs http://127.0.0.1:4176 hard
node scripts/play/drag-check.mjs http://127.0.0.1:4176
node scripts/play/access-check.mjs http://127.0.0.1:4176
node scripts/review/explorer-check.mjs http://127.0.0.1:4176
node explorer/scripts/measure-build.mjs
```

The `focused`, `home` and loading suites expect the entry to be visible. It is
now enabled in all builds. After building and starting the local server, run `node scripts/play/browser-check.mjs http://127.0.0.1:4176 focused`,
the same runner with `home`, and
`node scripts/review/loading-check.mjs http://127.0.0.1:4176`. These are local
checks; deployment remains subject to the release gates.

Workshop runner modes are `easy`, `hard`, `focused`, `home` and `all`. `PLAY_ORDER=reverse` and `PLAY_WIDTH=320` exercise alternate legal orders and narrow Hard layouts; `PLAY_QA_OUTPUT` sets the ignored browser-evidence directory. The fixed-access check verifies the retained face/edge guidance presets at three sampled distances, not a restriction on free orbit or proof of physical insertion clearance.

`/?inspect=1` exposes lazy browser regression/benchmark tools and local delivery-failure fixtures. `?no3d=1` exercises fallback and `?text=200` enlarges root text. Browser viewport and synthetic touch checks do not establish physical-device or accessibility certification.
