# Codebase cleanup review — 24 September 2026

Base: `89d9fca` on `main`; branch: `codex/codebase-cleanup`. The pre-existing domain-history edit in `PROGRESS.md` is excluded from this work. No deployment or merge is authorized by this cleanup.

## Audit scope and decisions

| Area | Review and outcome |
| --- | --- |
| Application and controls | Traced page, configuration and information panels through controller actions, focus/resize listeners, component search, diagnostics and WebMCP. Retained the four reachable UI primitives (sheet, button, select, slider). Removed 56 unreachable scaffold components, the unused mobile hook and scaffold generator configuration. Inspection controls and regression suites now load only for `?inspect=1`. |
| State and navigation | Traced shared dial visibility, case/hand normalization, selection generations, history, Reset, layout and side changes. Retained legacy visibility aliases and `configureDials` because they remain exercised API/snapshot contracts; removing them would change accepted behavior. Removed the unused exponential `damp` helper and its self-only test: production motion uses `motionEase`, covered by endpoint/reversal tests. |
| Rendering and resources | Reviewed immutable source matrices, fitted material scopes, pose/camera transitions, draw scheduling, source annotations, diamond recovery, contact shading and context recovery. Idle React notifications/quality scans stop after the final frame. Shared geometry/material disposal is deduplicated, disposal is idempotent, and explicit canvas/control listeners are removed. Partial initialization and failed context restoration now release temporary PMREM/studio resources and retain an explicit Reload 3D recovery path. Finish/shader/lighting parameters and source geometry are unchanged. |
| Repeated calculations | Cached source-only complete-separation endpoints and fitted display layer distances by immutable manifest-array identity. Per-frame maps/vectors remain independent. Case packet lookup and vectors are precomputed. Focused extraction paths retain their original evaluator. |
| Loading and errors | Traced overview preparation, hash checks, coalesced optional catalog loads, complete-case/dial gates, stale completion disposal, first-frame failure and retry. Existing generation and failure tests remain. Inspection suites now report thrown errors instead of leaving a permanent running result; the inspection context-recovery timeout is cleaned up on unmount. |
| Styles | Removed nine obsolete selectors after tracing their former UI paths; retained dynamically named camera selectors. Replaced the scaffold CSS import with the five Base UI variants actually used. Retained the existing responsive/cascade structure to avoid a visual redesign. The retained UI primitives now participate in lint. The 320 px / 200% text review exposed an existing fallback/header overlap: enlarged loading/error copy is now bounded below the measured header and above the dock, with scrolling to keep Retry reachable. |
| Dependencies and scripts | Removed unused UI/scaffold/Cloudflare tooling dependencies and corrected `start` to serve the actual vinext build. Added typecheck/test commands. Standard and Vercel builds use one manifest-driven pruner, fail on incomplete/mismatched assets and exclude local reference copies. Source preparation remains offline and release-gated. |
| Assets and evidence | Removed three superseded finish buffer/gzip pairs (23,238,795 bytes) from runtime storage. Current `finish-surfaces.json` references only `bd9958b41c29`. Kept active GLBs, current sidecars, hashes, authored overrides, original-source manifests, separation inputs and historical mechanical/appearance/preflight records. Older runtime copies remain recoverable from Git. |
| Offline tooling and documentation | Reviewed script entry points, inputs/outputs, import references, asset preparation/transport, preflight and mechanical-evidence boundaries. Syntax checked all tracked Python, shell and MJS scripts and parsed JSON. Source extraction/Blender/mechanical probes were not rerun: they reproduce preserved evidence and this task changes no source geometry. Corrected stale UI and sidecar statements in current technical docs, and labeled superseded UI goal/review documents as historical records. |

## Validation baseline

Before edits: 16 state/motion tests, 102 CPU source/runtime checks, TypeScript, lint, production build and 196 cold-catalog browser watch checks passed. Captured both flat faces at 1275×1354, with default 1.5 pixel ratio. Existing notices: Node `module.register()` deprecation, a large client chunk and vinext's unknown route classification. Baseline logs and measurements are ignored under `artifacts/browser/cleanup/`.

## Measurements

- Warm complete-separation evaluator, same source manifest, 500 steps per trial: three alternating before/after processes, five trials per process, median 142.76 ms before, 11.27 ms after (about 92% less CPU time). This is a CPU microbenchmark, not a GPU frame-rate or device claim.
- Production application JavaScript (union of static bootstrap, page and Analytics dependencies): 1,690,974 → 1,632,089 bytes; gzip 451,191 → 434,054 (17,137 bytes / 3.8% less gzip). Page chunk alone: 1,274,051 → 1,215,151 bytes; gzip 324,459 → 307,314. Inspection code loads only on demand. Measured from both clean production builds using Node 24.19.0; this is artifact size, not a network-latency claim.
- CSS: 204,611 → 59,409 bytes; gzip 31,546 → 11,292 (about 64% less gzip).
- Lockfile package entries (including platform-specific optional packages): 723 → 300. Fresh offline install: 208 installed packages. All retained package versions are unchanged; no new package entries were added.
- At rest the old loop emitted roughly 2.5 full snapshots/second indefinitely. New scheduler regression exercises ten seconds idle with zero notifications/quality scans, followed by one changed frame and one publication.

Recheck bundle sizes with `node explorer/scripts/measure-build.mjs` after `npm run build`.

## Final validation

- 17 state/motion/packaging tests and 107 CPU source/runtime checks pass. New checks cover independent cached results, idle publication, shared-resource/listener disposal, partial-constructor failure and failed context restoration. The removed test only exercised the unused `damp` helper.
- Browser suites pass: watch 196, dials 57, inventory 22, camera 19, explosion 8, UX 59, interactions 32 and frosting 7 (400 assertions total). Coverage includes staged X-axis flipping and interrupted reversal, reduced motion, case/dial visibility, configuration retention, fitted hands, component exploration, disassembly/reassembly, asset failure/retry and context restoration. Dial/inventory suites ran before the final failure-cleanup patch; the final watch run and CPU fault injection cover that patch.
- TypeScript, lint (including retained UI), standard production build and Vercel build pass. Final enlarged-fallback CSS was followed by repeat TypeScript, lint, both builds and production retry verification.
- Production start and SEO/HTTP checks pass. Clean production browsing and phone interactions logged no warnings/errors. Normal-page markup does not preload the inspection chunk; manifest tracing confirms no static import path to it.
- Both flat faces were compared with baseline renders at 1275×1354, pixel ratio 1.5. Visual inspection finds no visible change in framing, lighting, steel brushing/frosting/polished edges, rose gold, steel escape wheel or brass washer. Pixel differences are not zero: in the matching movement crop, mean absolute RGB differences are 0.484/255 (back) and 0.278/255 (front); 0.352% / 0.130% of pixels differ by more than 8 in any channel. These are render comparisons, not calibrated material measurements.
- Production 390×844 checks cover both fitted faces, configuration controls/retention, flip, disassembly/reassembly, no horizontal overflow and six 44 px dock controls. At 320×740 / 200% text, fallback copy clears header/dock, scrolls to Retry, and retry restores 3D without overflow. This is viewport emulation, not physical touch-device QA.
- All 30 active runtime/authored/source/derived files in the preserved-asset audit are byte-identical to baseline. The appearance ledger only changes its material-source hash for a corrected documentation comment. Decoded geometry/metadata verification passes. No original CAD, source imagery, secrets or temporary reports were added.

Ignored evidence is under `artifacts/browser/cleanup/` (suite JSON, both-face comparisons, phone captures, paired CPU timings and build metrics).

## Remaining work and limits

The application startup graph still contains about 1.63 MB of JavaScript before gzip. Existing build notices remain: Node module-registration deprecation, large chunks, vinext route classification, and a Vercel framework error-module import warning. These are not claimed as fixed.

The controller and main page remain large. A broad camera/pose rewrite or complete CSS cascade rewrite is deferred because those boundaries are coupled to verified presentation and would add risk without a measured benefit here. The idle scheduler still wakes via requestAnimationFrame; this change removes repeated snapshots, not every idle callback. Historical probe scripts were reviewed for boundaries and syntax, not independently recertified against fresh CAD extraction. The CPU suite intentionally requires ignored prepared CAD evidence; it is not a clean-clone CI suite. Physical-device/thermal testing, representative accessibility review, source-redistribution permission and expert mechanical review remain separate release gates.
