# Current project status

Updated 27 October 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Review findings and historical evidence:
[repository review](docs/REPOSITORY_REVIEW.md).

## Running movement implementation

Active branch: `codex/escapement-clearance-study`. The assembled escapement,
attached hairspring and coupled train through barrel-II drum/lid share the maker's
**3 Hz / 21,600 beats per hour** nominal speed (1/3 second per complete oscillation).
The independent ML-01 specification agrees with the recorded −2° seconds-shaft
advance per cycle. Mean periods: escape 6⅔ s, seconds 60 s, third 562.5 s,
center 1 h, transfer 2 h 10 min, barrel II 6 h 40 min.

The local rendering follow-up to `38fc38a` softens the balance rim and four
eccentrics with nine spatially dithered shutter samples. The half-frame exposure
is capped at 1/120 second; frequency, ±180° amplitude, shared clock, exact matrices,
source geometry, recoil, display phases and ratios remain unchanged. Staff,
roller, collet, spring and train retain exact instantaneous poses. Inspection,
separation and resume restore sharp source geometry. Hidden time remains excluded.

The [runtime record](docs/RUNNING_MOVEMENT.md) and
[rendering provenance](assets/source-manifest/balance-exposure.json) document the
method, source evidence, validation and limits. Nine focused movement tests,
typecheck, lint, build, 18 browser checks and six A/B pose pairs pass locally.
The paired 12-second desktop runs show 597 sharp versus 592 exposed frames,
identical p95 ≈33.4 ms and stable resource counts. Both missed frames under
concurrent app load. The effect reduces hard strobing, but fine dithering remains
visible at extreme zoom and low-FPS aliasing is not eliminated. Local rendering
validation was explained before execution; no push was authorized.

Earlier nominal-speed evidence stays in
[nominal-operating-speed.json](assets/source-manifest/nominal-operating-speed.json).
The 8,557 normalized poses and unchanged geometry retain the earlier CAD audit's
scope; this rendering change is not a new clearance or dynamics certification.
Evidence remains ignored under `artifacts/balance-exposure/`; previous evidence
folders are preserved. Mainsprings, arbors, ratchets, barrel I, motion works and
hands remain static. Motion is prescribed, not physically self-sustaining.

No push, PR, merge, deployment or publication. Next: review the softened local
movement view and its close-zoom tradeoff before any release decision. Invalid
original solids, continuous contacts, physical-device qualification, expert
mechanical acceptance and CAD redistribution permission remain unresolved.

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
