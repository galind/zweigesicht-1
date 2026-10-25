# Current project status

Updated 25 October 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Review findings and historical evidence:
[repository review](docs/REPOSITORY_REVIEW.md).

## Integration state

`develop` includes the Bench feature in [PR #31](https://github.com/galind/zweigesicht-1/pull/31)
and the homepage/Bench onboarding in [PR #33](https://github.com/galind/zweigesicht-1/pull/33).
The owner reports staging release; this review starts at `48ef8b3`. Production
promotion and live staging delivery have not been verified by this cleanup.
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
- Holder/environment payloads remain local. Vercel packaging excludes
  `bench-local`; integrating the code does not make those assets available remotely.

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

## Remaining work and release limits

Review and merge this cleanup into `develop`, then review staging separately.
Keep current status concise: replace superseded next actions rather than adding
another chronological entry.

Maker permission for current/historical CAD derivatives, hosted/history remediation,
physical-device and representative accessibility/usability review, mechanical
review, and clean-machine CAD reproduction remain outstanding. Source URLs/hashes
and authored placement evidence remain in their existing manifests. The
[release gates](docs/RELEASE_GATES.md) contain the decisions and remediation paths;
the [permission request](docs/ASSET_PERMISSION_REQUEST.md) remains unsent.
Original code/documentation use MIT; maker design/CAD and derivatives do not.
