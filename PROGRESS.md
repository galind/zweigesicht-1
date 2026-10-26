# Current project status

Updated 26 October 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Review findings and historical evidence:
[repository review](docs/REPOSITORY_REVIEW.md).

## Escapement feasibility investigation

Active investigation branch: `codex/escapement-clearance-study`.
`codex/escapement-foundation` and the earlier `codex/running-movement` are
deprecated for new work and retained as historical evidence. Their findings about
the unchanged source geometry remain valid; the clearance study supersedes their
illustrative-animation feasibility status, without establishing mechanical operation.

The isolated [clearance study](docs/ESCAPEMENT_CLEARANCE_STUDY.md), starting from
`8c0a367`, finds an illustrative two-swing rigid cycle with one separate fork-body
correction: approximately 25 µm floor relief, 31 µm maximum sampled local change,
and 0.1823% removed body volume. Both swings advance the original escape wheel by
one tooth pitch. Core original-solid, refined section and supplementary cross-shaft
checks pass within their recorded sampled scope. This is authored kinematics,
not a force-driven or mechanically accepted escapement; train coupling,
physical spring behavior and runtime performance remain open. Experimental
CAD and preview stay ignored in `artifacts/escapement-clearance-20261026/`.
Application code, runtime models and display overrides are unchanged; no push,
deployment or publication.

The [interfaces and hairspring follow-up](docs/ESCAPEMENT_INTERFACES_AND_HAIRSPRING.md)
finds no new sampled support interference and a constrained spring deformation
that preserves both attachments and clears the sampled surrounding geometry.
Rendered eccentric envelopes also clear, while their original solids remain
invalid. Integration is still deferred: the escape pinion hits the frozen seconds
wheel, and coupling that shaft exposes the next frozen train boundary. Next:
investigate consistent train coupling before runtime spring/timing integration.

## Integration state

`develop` includes the Bench feature in [PR #31](https://github.com/galind/zweigesicht-1/pull/31)
and the homepage/Bench onboarding in [PR #33](https://github.com/galind/zweigesicht-1/pull/33).
This review starts at `48ef8b3`. UAT now manually serves PR #34's application
commit `c127cc8`; Vercel reports deployment `dpl_FaFSZZJQdMex7PcVXAfz7P4ScKah`
ready and promoted to `zweigesicht-uat.vercel.app`. The PR remains open toward
`develop`; the separate production project and `main` were not changed.
Repository visibility is public, confirmed through the connected GitHub app.

## Current application

- Explorer: 426 source instances, six mechanism groups, component inspection,
  separation, and fitted case/dial/hand configurations.
- Workshop: 83 Easy placements, or 243 Hard placements and 35 transfers; 16
  foundation leaves, 259 fitted leaves at completion. Undo and local saves remain.
  Direct `/workshop` visits choose a difficulty or resume a validated save.
  Its homepage entry appears only in development and Vercel Preview builds.
- Bench: one movement and two exchanged original holders, a compact oak desk,
  green mat, steel case and fitted dial/hand stand. Explicit Start captures the
  mouse; Esc releases it. WASD, Shift, Space, F and R control exploration.
  Touch-only devices get a desktop explanation without loading the scene.
  [Bench reference](docs/BENCH_EXPERIENCE.md) owns dimensions, reproduction and controls;
  [performance review](docs/BENCH_PERFORMANCE.md) owns measurements and their limits.
- Original holder files remain outside Git. The three prepared Bench payloads
  are served as owner-approved optimized GLBs through UAT's verified build asset source.

## Cleanup under review

Branch `codex/staging-code-cleanup` targets `develop`; its Vercel Git deployment
is disabled. Removed superseded design briefs, unused workshop artwork tooling
and redundant browser-runner aliases. Current guidance replaces the chronological
progress log; original records remain recoverable at the revisions linked in the
review. CAD evidence, source manifests and runtime assets are retained.

Bench loading now names and type-checks settled assets instead of asserting
numeric result types. Disposal is idempotent and cannot rebind graphics targets
when shader preparation completes after navigation. Profilers use explicit quality
modes and the current single station. Interaction checks use the current Detail
select and handle both reversed-depth and fallback Auto settings.

A deeper pass shares dial-enamel setup across all three routes and records the
fitted transmission for finish restoration in Workshop. Detached Bench materials
enter the cleanup tree before finish/pose preparation. All four hashed asset
loaders share one SHA-256 encoder while retaining their existing integrity gates.
New CPU regressions cover finish transitions, failure cleanup and corrupt assets.
[GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/40231829429)
passed on `b29c081`: all 157 CPU tests, Workshop inventory, typecheck, lint and
production build. No local tests, builds or browser automation were run for this
follow-up. This preference is recorded in [AGENTS.md](AGENTS.md).

The preceding cleanup milestone verified: 149 CPU tests, Workshop inventory,
typecheck with unused-code checks, lint, production build, HTTP/SEO checks,
159 Bench UI checks, 22 entry/device
journeys, nine lifecycle checks, 32 flip checks and 11 interaction checks in each
of normal and forced fallback depth modes. The independent geometry audit retains
219 movement/crown leaves in each rest, source/collision agreement and 16 drops.
The new disposal regression fails against the previous build and passes here.
Both npm audits report zero findings; 85 local Markdown links and 47 tracked JSON
files validate. Runtime assets, source manifests and active layouts are unchanged.
The Vercel production build also passes and excludes `bench-local`. Both first-use
High fixtures and all 18 Auto/High/Low profiling scenarios complete; these are
harness checks, not a new device-performance qualification. Evidence is local in
`artifacts/staging-cleanup/` and `artifacts/bench/staging-cleanup-first-use.json`.

## Hosted delivery and remaining review

The missing Bench payloads are fixed. UAT serves `movement.glb`, `dial.glb` and
`environment.glb` from the verified asset source. Original holder STLs stay outside
Git and public output. Their Blob copies and the previous STL-serving deployment
have been deleted. [Live delivery CI passed](https://github.com/galind/zweigesicht-1/actions/runs/40237774201):
entry pages and GLBs return HTTP 200 with matching hashes; the six old holder STL
URLs across UAT, Blob and the retired deployment return HTTP 404/410.
[Integration CI on `c127cc8`](https://github.com/galind/zweigesicht-1/actions/runs/40237774186)
passed all 162 tests, inventory, typecheck, lint and both builds.

[Holder conversion CI](https://github.com/galind/zweigesicht-1/actions/runs/40237774203)
checks recorded source hashes and exact triangle positions, winding and bounds.
Combined raw size drops from 2,684,768 to 1,407,336 bytes (47.6%); gzip level-9 drops
from 1,080,745 to 1,045,456 bytes (3.3%). SNORM16 lighting normals have component
error below 0.000016. Three.js and an independent decoder pass. Runtime hashes and
measurements are in `assets/source-manifest/holder-runtime.json`; workflow artifacts
contain only GLBs and the report. Original source URLs/hashes remain unchanged.
No local conversion, benchmark, build, test or browser automation was run for this
follow-up. These are size/geometry checks, not live WebGL or FPS measurements.

Review and merge PR #34 into `develop`; UAT serves its checked application snapshot
without a merge. Actual browser scene-entry review remains separate.
Keep current status concise: replace superseded next actions rather than adding
another chronological entry.

Maker permission for current/historical CAD derivatives, hosted/history remediation,
physical-device and representative accessibility/usability review, mechanical
review, and clean-machine CAD reproduction remain outstanding. Source URLs/hashes
and authored placement evidence remain in their existing manifests. The
[release gates](docs/RELEASE_GATES.md) contain the decisions and remediation paths;
the [permission request](docs/ASSET_PERMISSION_REQUEST.md) remains unsent.
Original code/documentation use MIT; maker design/CAD and derivatives do not.
