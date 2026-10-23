# Repository review — 23 October 2026

Scope: tracked application, assets and their provenance, offline tooling, tests,
configuration, documentation and GitHub/Vercel workflows. Baseline is fetched
`develop` `33de8d1`; the working tree was clean. Review branch:
`codex/repository-cleanup-2026-10-23`. Its exact Vercel Git deployment is disabled.
This review does not authorize a release, site deployment or asset redistribution.

## Map and ownership

| Area | Entry points and connections | Main maintenance risk |
| --- | --- | --- |
| Routes and metadata | `explorer/app/layout.tsx` supplies global CSS, JSON-LD and analytics. `app/page.tsx` is the explorer; `app/workshop/page.tsx` mounts Play with separate canonical/noindex metadata. `next.config.ts` retains `/play` → `/workshop`, including queries. `robots.ts` and `sitemap.ts` are route-convention entry points; the sitemap includes only `/`. | Production/Preview entry policy is compiled into both server and client by `vite.config.ts`; direct routes must remain usable independently. |
| Explorer UI | `app/page.tsx` sends intent to `MovementViewer` and renders snapshots, part search, focus/isolation, spread, separation, settings and recovery. `ConfigurationControls`, `InformationPanel`, loading/header/viewer controls and Base UI Sheet/Select/Slider wrappers are shared presentation. | The page owns many panel booleans, focus refs and layout measurements. These are coupled to portaled panels and responsive CSS. |
| Explorer domain | `src/experience/state.ts` normalizes view/configuration state and legacy dial aliases. `catalog.ts` indexes stable source IDs, labels and ancestry. `dials.ts`, `watch.ts`, `explosion.ts`, `spread.ts`, `emphasis.ts` and `motion.ts` separate authored fitting, visibility, transforms and presentation. | Appearance choices must not silently change visibility or immutable source transforms. Source IDs and authored manifests are contracts. |
| Explorer controller | `MovementViewer.ts` owns Three.js, transactional optional catalog requests, geometry/materials, camera history, source/presentation matrices, context recovery and on-demand scheduling. `CasePose`, `HandDisplayPose`, source-surface/diamond/case recovery, materials and contact/optical modules support it. | Async generations, camera ownership and resource disposal cross several user actions; extracting these without preserving transitions would be risky. |
| Workshop | `src/play/Play.tsx` owns startup/save conflicts, selection, workspaces, gallery and dialogs. `state.ts` replays the prerequisite graph, commits/undoes stable actions and distinguishes assembled from fitted leaves. `PlayViewer.ts` owns geometry, camera, thumbnails, seat visibility and drag capture. `fixedViews.ts`, `thumbnailColor.ts` and opt-in `accessAudit.ts` support it. | React state and refs intentionally feed synchronous pointer/controller callbacks. A partial ref/state update can fit a stale selection or lose saved progress. |
| Shared chooser and inspection | `components/WorkshopChooser.tsx` contains the existing Easy/Hard choices without importing the game manifest or renderer. `InspectionPanel` is lazy-loaded only with `?inspect=1`; it imports the browser validation/capture/frost/benchmark modules. `webmcp.ts` registers validated visible explorer actions and aborts registration on unmount. | Diagnostics are runtime entry points despite not appearing in ordinary visits. Removing them by static page-import search would break documented QA. |
| Runtime assets | `public/models/asset-paths.json` resolves hashed overview/catalog GLBs; `finish-surfaces.json` binds the source-face buffer to the overview. Runtime loaders hash-check the face buffer, maker diamond and lug recovery. Authored JSON defines groups, labels, fitting, finishes and Workshop membership; `assets/derived/complete-separation.json` supplies generated offsets. | GLBs, source-face ordering, stable IDs and sidecar hashes must agree. Frontend import reachability does not establish whether provenance or geometry is disposable. |
| Offline CAD | Locked `.venv-cad` tooling imports XCAF, exports raw GLB/manifest and validates placements; `run_pipeline.sh` also recovers the lug face and extracts the movement. `scripts/assets/optimize.mjs` performs lossless Meshopt encoding; `verify-three.mjs` compares decoded bytes. `prepare_local_assets.py` hashes/packages runtime files and invokes finish packing when source sidecars exist. | Environment/cache-dependent reproduction is separate from using tracked runtime assets. Full clean-machine reproduction remains unverified. |
| Source evidence | `scripts/preflight` verifies originals/imports; CAD appearance, dial, hand, case, extraction and depth probes feed source evidence, surface sidecars, offsets and `review-runtime.mjs`. Provenance URLs/hashes and licensing remain in `assets/source-manifest/`, LICENSE and shipped notices. | These are manual workflows, not dead application code. Reviewed mechanical evidence and authored overrides must remain separate from generated output. |
| Build and delivery | `explorer/package.json`: vinext development/local production, Nitro Vercel production, tsc, oxlint, oxfmt and CPU/runtime tests. `prune-build-output.mjs` validates required build copies before pruning stale models/reference copies. Root `vercel.json` packages Nitro output. `check-seo.mjs` checks real initial HTML; `measure-build.mjs` measures static import closure. | Two production targets and upstream beta integrations need both build checks; build success does not qualify a live deployment. |
| CI and release | `.github/workflows/ci.yml` runs CPU tests, inventory, types, lint and production build; release PRs also build Vercel. Branch policy only allows this repo's `develop` PRs to `main`. `release.yml` and `release.cjs` use a main-only environment and short-lived app token, check captured refs and merge through protected PRs, then synchronize. | Server-side rules, environment restrictions and Vercel settings are outside local files. This cleanup changes none of those protections or release logic. |

## Dependencies and configuration traced before removal

The application and offline asset tools have independent npm manifests/locks.
React/React DOM, Three.js, lucide and Base UI have runtime consumers. `clsx` and
`tailwind-merge` support `cn`; Tailwind/PostCSS and `tw-animate-css` supply build
and imported CSS. Analytics is mounted by the layout. vinext uses the directly
installed React server DOM/RSC plugin peers; Nitro is imported conditionally for
the Vercel build. They are retained even where application JSX does not import
them. The asset pipeline directly uses glTF Transform core/extensions and
meshoptimizer. No package was proven removable.

TypeScript's vinext/Next aliases and framework-convention exports remain.
The Workshop flag is active build policy. The `/play` redirect, saved-session
`hints`, and legacy explorer visibility aliases have explicit URL/save/API uses
and tests; they are retained. Renderer-only retired Hints/cutaway state has no
such consumer and was removed. No source/derived asset, notice or manifest was
removed or regenerated.

CSS candidates were checked against JSX, composed classes, shared primitives,
inspection suites and the build. `camera-${direction}` accounts for four
apparently unreferenced classes, so those stay. Only the four obsolete rules
using `.secondary`, `.case-material` and `.dial-note` were removed. Unconsumed
export names alone were not treated as dead modules; several are locally used
public types or helpers consumed by offline source-module loaders.

## Ranked findings and implemented changes

| Impact | Finding and evidence | Result |
| --- | --- | --- |
| P1 correctness, confirmed | `Play.tsx` sent fresh/invalid-mode visits, corrupt-save cancellation and Change difficulty to `/?assemble=1`. `app/page.tsx` ignores that query and omits the chooser in production. Baseline browser reproduction reached that URL with no chooser/trigger; the focused suite timed out on the same missing-mode case. | Workshop now opens the shared chooser locally. It retains URLs, saves, confirmation rules and the hidden production homepage entry. Geometry waits for a session. `scripts/play/entry-check.mjs` checks both build policies, `/play`, invalid mode, keyboard focus, progress retention and corrupt-save cancellation. |
| P1 tooling security, confirmed affected versions; exploitability unproven | Baseline `npm audit` reported four affected packages: Vite high, source-map-js high, tinypool critical and its oxfmt dependent critical. `npm ls` traced source-map-js through PostCSS/Tailwind and tinypool through oxfmt. Vite is loopback-bound here; tinypool advisories require an additional prototype-pollution primitive. No deployed exploit was established. | Updated exactly three locked package versions: Vite 8.2.4, source-map-js 1.2.2 and tinypool 2.1.2. A scoped override retains oxfmt 0.61.0. Clean install, audits and builds pass. [Upstream patch references](LOCAL_ARCHITECTURE.md#dependency-maintenance). |
| P2 maintenance/test fidelity, confirmed | Both UI `setAssistance` calls passed `false` for retired Hints; its persisted field is intentionally compatibility-only. `cutaway` was always false and had no UI consumer. The constructor selection callback had one app caller passing a no-op. Controller tests still set retired Hints directly. | Removed those renderer inputs/state/callback and switched fixtures to actual assistance. A new behavior test checks that assistance cannot reveal an unavailable target or a foreign workspace. Save-schema compatibility remains tested. Inspector output now reports `assistance` instead of retired `hints`/`cutaway`. |
| P2 documentation, confirmed | README/release audit told readers to keep an already-public repository private; historical PROGRESS next actions still asked for PR #27 to merge despite fetched history containing #27/#28/#29. A case-offset comment referenced removed `DISASSEMBLY_REVIEW.md`. | Marked dated visibility/release setup statements as historical, linked current status, and pointed the source comment to retained CAD notes. Historical evidence and unresolved gates remain intact. This does not certify current credentials/settings or production health. |
| P3 dead styles, confirmed | Four rules target classes no longer emitted by either route, shared components, dynamic class builders or QA modules. Configuration uses `material-choices`; catalog help uses `catalog-scope-note`. | Removed only those rules. No layout redesign, selector reorganization or broad formatting change. |

## Validation

Baseline: Node 24.19.0 / npm 11.17.0; 92 CPU tests, inventory, typecheck, lint,
local production build, HTTP metadata/redirect checks and retained-input runtime
regression passed. Production browser reproduced the chooser failure; the
existing focused suite failed on the fresh-visit redirect, not a CPU/build error.

Verified after cleanup: 93 CPU tests; inventory including 40 legal
traversals per level; typecheck/lint; local and Vercel production builds; zero
known vulnerabilities in both npm audits; 114 retained-input runtime checks;
original-source hashes and Meshopt byte identity; all 373 actions at three
sampled camera distances (1,119 access checks); 21 production entry checks;
Easy's 89 actions / 538 checks, Hard's 284 actions / 1,708 checks; and 87 drag
checks. All nine explorer suites pass (350 assertions plus captured flip frames
and a 60-second frame benchmark); Preview homepage (15) and loading/retry/layout
(175) checks pass with no uncaught browser errors. Entry checks also pass in
Preview (21). The 92 focused Workshop checks passed during the Workshop
milestone. Details and limits are summarized in [PROGRESS.md](../PROGRESS.md).
The new CPU total is 93; saved-session replay, controller resource/scheduling,
camera and release-policy tests remain. The independent entry runner exercises
production and Preview, while focused tests no longer assume the homepage flag
is enabled. Its no-3D fixture now confirms save replacement before expecting a
renderer; no geometry should start while replacement is unconfirmed.

Local evidence stays ignored under `artifacts/cleanup-*.log` and
`artifacts/browser/cleanup-*`; no original CAD, cache, environment or screenshot
is added to Git. Tracked asset/provenance/notice bytes are unchanged. The local
build's large Three.js/shared chunk and vinext route-classification notice were
already present at baseline. Vercel also emits upstream bundling/plugin timing
warnings; a local Vercel build is not a live Vercel delivery test.

## Deferred opportunities and uncertainties

- **Controller boundaries (engineering follow-up).** The explorer page/controller
  and Workshop UI/controller remain large. Split by resource loading, camera and
  route startup only when a feature touches the relevant behavior, with existing
  transition/lifecycle and browser tests guarding the boundary. Line count alone
  does not justify a rewrite. Replacing synchronous refs with React-only state
  would require evidence that pointer/retry behavior stays correct.
- **Bundle/loading budget (engineering follow-up).** Local production static
  homepage import closure is about 1.53 MB raw / 405 KB gzip by `measure-build`;
  that is script closure, not actual network transfer, CAD payload or device
  performance. Lazy viewer startup or manual chunking needs a measured loading
  budget and regression checks for ready/fallback behavior. The chooser imports
  no Workshop manifest/controller on the homepage. No speculative lazy-loading
  rewrite is included.
- **Test infrastructure (engineering follow-up).** Existing AST/VM method tests
  exercise real controller code but couple fixtures to method names/private
  Three.js fields. Keep their failure/resource coverage and move toward whole
  controller fixtures when those boundaries change. Browser suites remain a
  separate manual workflow requiring existing Playwright/Chrome; CI does not yet
  run the production/Preview entry matrix. Adding that requires browser/runtime
  provisioning and agreement on CI duration, rather than a source-string test.
- **Request cancellation (observed, cause uncertain).** Browser abort/retry and
  route-exit checks produced vinext server messages for `Premature close` and
  `ERR_STREAM_UNABLE_TO_PIPE`. The server stayed available and browser checks
  passed. An isolated comparison of that logging against the baseline was not
  performed; investigate upstream cancellation handling before calling this a
  regression or changing the framework. Zero uncaught browser errors does not
  mean zero server log diagnostics.
- **Reproduction and platform support (decision before expansion).** Existing
  local inputs support retained-source checks; they do not prove uncached CAD
  reproduction on a fresh machine or another OS. Decide supported CAD platforms
  before changing the Apple Silicon/Python lock or consolidating probe tooling.
- **Workshop availability (product decision).** Keep the homepage entry hidden
  in production until a separately approved code release enables it. Decide
  representative accessibility/device qualification before broader promotion.
- **Mechanical/appearance scope (product/expert decision).** Source exceptions,
  inferred finishes, visual reachability and conservative puzzle prerequisites
  remain documented interpretations. Changing these or adding running movement
  requires reviewed evidence; passing sampled rays is not collision certification.
- **Publication and hosted-state coverage (owner decision).** Redistribution
  permission, historical/hosted surfaces and deployment qualification remain
  unresolved in the release gates. Choose permission-backed distribution or a
  reviewed external-asset/code-only workflow separately. This audit did not
  reconfigure branch rules, inspect all hosted logs/settings, or prove absence of
  secrets/vulnerabilities throughout history or untracked files.

No further feature decision is needed to review these cleanup commits. Resolve
the applicable deferred decisions when planning the next feature or publication.
