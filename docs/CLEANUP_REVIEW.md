# Codebase cleanup review — 24 September 2026

Base: `89d9fca` on `main`; branch: `codex/codebase-cleanup`. The pre-existing domain-history edit in `PROGRESS.md` is excluded from this work. No deployment or merge is authorized by this cleanup.

## Audit scope and decisions

| Area | Review and outcome |
| --- | --- |
| Application and controls | Traced page, configuration and information panels through controller actions, focus/resize listeners, component search, diagnostics and WebMCP. Retained the four reachable UI primitives (sheet, button, select, slider). Removed 56 unreachable scaffold components, the unused mobile hook and scaffold generator configuration. Inspection controls and regression suites now load only for `?inspect=1`. |
| State and navigation | Traced shared dial visibility, case/hand normalization, selection generations, history, Reset, layout and side changes. Retained legacy visibility aliases and `configureDials` because they remain exercised API/snapshot contracts; removing them would change accepted behavior. Removed the unused exponential `damp` helper and its self-only test: production motion uses `motionEase`, covered by endpoint/reversal tests. |
| Rendering and resources | Reviewed immutable source matrices, fitted material scopes, pose/camera transitions, draw scheduling, source annotations, diamond recovery, contact shading and context recovery. Idle React notifications/quality scans stop after the final frame. Shared geometry/material disposal is deduplicated, disposal is idempotent, and explicit canvas/control listeners are removed. Finish/shader/lighting parameters and source geometry are unchanged. |
| Repeated calculations | Cached source-only complete-separation endpoints and fitted display layer distances by immutable manifest-array identity. Per-frame maps/vectors remain independent. Case packet lookup and vectors are precomputed. Focused extraction paths retain their original evaluator. |
| Loading and errors | Traced overview preparation, hash checks, coalesced optional catalog loads, complete-case/dial gates, stale completion disposal, first-frame failure and retry. Existing generation and failure tests remain. Inspection suites now report thrown errors instead of leaving a permanent running result; the inspection context-recovery timeout is cleaned up on unmount. |
| Styles | Removed nine obsolete selectors after tracing their former UI paths; retained dynamically named camera selectors. Replaced the scaffold CSS import with the five Base UI variants actually used. Retained the existing responsive/cascade structure to avoid a visual redesign. The retained UI primitives now participate in lint. |
| Dependencies and scripts | Removed unused UI/scaffold/Cloudflare tooling dependencies and corrected `start` to serve the actual vinext build. Added typecheck/test commands. Standard and Vercel builds use one manifest-driven pruner, fail on incomplete/mismatched assets and exclude local reference copies. Source preparation remains offline and release-gated. |
| Assets and evidence | Removed three superseded finish buffer/gzip pairs (23,238,795 bytes) from runtime storage. Current `finish-surfaces.json` references only `bd9958b41c29`. Kept active GLBs, current sidecars, hashes, authored overrides, original-source manifests, separation inputs and historical mechanical/appearance/preflight records. Older runtime copies remain recoverable from Git. |
| Offline tooling and documentation | Reviewed script entry points, inputs/outputs, import references, asset preparation/transport, preflight and mechanical-evidence boundaries. Syntax checked all tracked Python, shell and MJS scripts and parsed JSON. Source extraction/Blender/mechanical probes were not rerun: they reproduce preserved evidence and this task changes no source geometry. Corrected stale UI and sidecar statements in current technical docs. |

## Validation baseline

Before edits: 16 state/motion tests, 102 CPU source/runtime checks, TypeScript, lint, production build and 196 cold-catalog browser watch checks passed. Captured both flat faces at 1275×1354, with default 1.5 pixel ratio. Existing notices: Node `module.register()` deprecation, a large client chunk and vinext's unknown route classification. Baseline logs and measurements are ignored under `artifacts/browser/cleanup/`.

## Measurements

- Warm complete-separation evaluator, same source manifest, five runs of 500 steps: median 140.10 ms before, 33.53 ms after (about 76% less CPU time). This is a CPU microbenchmark, not a GPU frame-rate or device claim.
- Production page chunk: 1,274,051 → 1,214,981 bytes; gzip 324,459 → 307,243. The inspection module is separately loaded on demand. Shared chunk membership also changed; page-chunk size alone is not a complete startup-network measurement.
- CSS: 204,611 → 59,266 bytes; gzip 31,546 → 11,252 (about 64% less gzip).
- Lockfile package entries (including platform-specific optional packages): 723 → 300. Fresh offline install: 208 installed packages. No dependency version upgrade was requested.
- At rest the old loop emitted roughly 2.5 full snapshots/second indefinitely. New scheduler regression exercises ten seconds idle with zero notifications/quality scans, followed by one changed frame and one publication.

Recheck bundle sizes with `node explorer/scripts/measure-build.mjs` after `npm run build`.

## Remaining work and limits

Final browser/phone regression and visual comparison are in progress. This document will be updated with final results before publication.

The controller and main page remain large. A broad camera/pose rewrite or complete CSS cascade rewrite is deferred because those boundaries are coupled to verified presentation and would add risk without a measured benefit here. The idle scheduler still wakes via requestAnimationFrame; this change removes repeated snapshots, not every idle callback. Historical probe scripts were reviewed for boundaries and syntax, not independently recertified against fresh CAD extraction. The CPU suite intentionally requires ignored prepared CAD evidence; it is not a clean-clone CI suite. Physical-device/thermal testing, representative accessibility review, source-redistribution permission and expert mechanical review remain separate release gates.
