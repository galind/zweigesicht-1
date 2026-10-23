# Repository review — 23 October 2026

Baseline: clean `develop` at `33de8d1`. Changes are in draft PR #30; the exact
branch has Vercel Git deployment disabled. No release or publication is included.

## Ownership map and risks

| Area | Connections and maintenance risk |
| --- | --- |
| Routes/UI | `explorer/app/page.tsx` → domain modules → `MovementViewer`; `app/workshop/page.tsx` → `Play.tsx` → `PlayViewer`. Shared controls/chooser use Base UI. Panel focus/layout and synchronous React refs couple UI to controllers. Robots and sitemap use framework conventions. |
| State/rendering | `src/experience/` owns selection, configuration, fitting and separation; `src/play/state.ts` replays the prerequisite graph and saves. Controllers own immutable source matrices, presentation, camera, async generations and GPU lifetime. These boundaries need transition/lifecycle coverage when changed. |
| Assets/reproduction | Authored JSON, generated separation offsets and hashed models/sidecars are distinct authorities. Python XCAF export → movement extraction → lossless Meshopt → runtime preparation; source/fit/appearance probes feed regression evidence. IDs, vertex order and hashes must stay aligned. |
| Build/dependencies | Separate application and offline asset npm locks. vinext/Vite serves local builds; Nitro packages Vercel; pruning validates build copies. Runtime imports, CSS imports and vinext RSC peers account for dependencies; no package was proven removable. |
| Tests/release | CPU graph/controller/camera/release tests, retained-input CAD regression and manual browser runners cover different contracts. Read-only CI validates PRs; the main-only release controller uses protected PRs. Server-side settings and live delivery are separate qualification. |

## Findings and removals

| Impact | Evidence and action |
| --- | --- |
| P1 correctness | `Play.tsx` redirected fresh visits and difficulty changes to `/?assemble=1`, which production ignores. Reproduced in the production browser/focused suite. The existing chooser now works directly on Workshop; geometry waits for a session. Homepage visibility, saves and confirmations remain. |
| P1 tooling, exploitability unproven | Audit traced vulnerable Vite, PostCSS's source-map-js and oxfmt's tinypool. Updated only Vite 8.2.4, source-map-js 1.2.2 and tinypool 2.1.2; scoped override retains oxfmt. [Upstream references](LOCAL_ARCHITECTURE.md#dependency-maintenance). No deployed exploit was demonstrated. |
| P2 dead controller code | UI never enabled retired Hints; cutaway was always false and the selection callback was a no-op. Scale animation fed an ignored `positionStage` argument; `_straightOn` was also ignored. Removed those paths and the single-use return-animation wrapper; tests now inspect actual staged geometry rather than unused argument values. Save-schema `hints` remains. |
| P2 dead CSS | `globals.css` retained 73 declarations overridden by later declarations for every same selector, property, importance and media/supports/layer context. Removed those and empty rules, plus four obsolete class rules. Generated `camera-${direction}` classes remain. Cascade evidence is retained locally in `artifacts/cleanup-cascade-removals.json`; browser style comparisons validate the result. |
| P3 stale guidance | Corrected a deleted CAD-document reference and labeled old visibility/release setup claims as historical. Current public visibility does not clear redistribution or release gates. |

Inspection modules are lazy `?inspect=1` entry points. Offline probes, source
manifests, authored overrides, CAD evidence and source-derived assets remain even
when frontend imports do not reach them. Legacy dial aliases and saved
session compatibility have explicit consumers/tests. Static search alone was not
used as a deletion criterion.

## Validation and limits

Initial validation passed 93 CPU tests, inventory, typecheck/lint, both production
builds and Preview; 114 CAD/runtime checks, original-source hashes, Meshopt byte
identity and 1,119 sampled access checks. Browser runs completed 89 Easy and 284
Hard actions, 87 drag checks, 92 focused checks, nine explorer suites and both
entry policies; Preview loading/retry/layout passed 175 assertions. All 36 tracked
asset/provenance/image/license/notice files match baseline. Follow-up results are
recorded in [PROGRESS.md](../PROGRESS.md); logs/screenshots remain ignored.

The original production chooser failure is fixed. Large-chunk/classification
warnings remain. Abort/route-exit fixtures emit vinext stream diagnostics while
browser checks pass; their cause was not isolated against baseline. This review
does not certify actual devices, representative accessibility, mechanics,
uncached CAD reproduction, hosted settings/history or live deployment.

## Deferred decisions

- Split controller/loading/camera boundaries when a feature touches them, with
  existing behavioral coverage; avoid a rewrite driven only by file size.
- Agree a loading budget (homepage static JS closure is about 405 KB gzip) and
  browser-CI provisioning before changing chunking or startup policy.
- Decide Workshop homepage promotion, supported CAD platforms and mechanical/
  appearance scope separately; representative device/expert evidence is needed.
- Resolve maker permission versus external-asset/code-only distribution and the
  outstanding hosted/publication gates before publishing anything further.
