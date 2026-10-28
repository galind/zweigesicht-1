# Current project status

Updated 28 October 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Review findings and historical evidence:
[repository review](docs/REPOSITORY_REVIEW.md).

## Dial washer visibility

The thin brass dial washer (d121, movement occurrence 9) now follows the shared
dial-fitting visibility rule: hidden on the bare movement and shown with loaded
dials. Inventory and the undialed Bench use the same membership; direct source
inspection and Workshop placement remain available. Existing review expectations
now include the washer and the Bench's 218 rendered movement/crown leaves.

Source and diff review only; no local tests, build or browser automation were run.
Next: validate through GitHub CI when a push is authorized. No push or publication.

## Rear-hour phase ceiling and precision

From clean `09f5469`, the [phase-limit investigation](docs/REAR_HOUR_PHASE_LIMIT.md)
covers the entire rear-hour relative phase range with 37 continuous polygon
intervals and 129 queries. Every phase has a running witness below **45.654 nm**
clearance in the retained section model. Finer sections converge to original-solid
witness gaps of **45.145 nm**; 24 distance queries at three precision settings
agree, and independent analytic circular-support distances reproduce the result.
Phase tuning trades two opposing tight spots rather than opening a larger gap.

This supports a limitation of the **nominal source geometry at fixed shaft
positions**, not a missed phase or ordinary solver precision. The polygon ceiling
is not a continuous whole-solid certificate, and source/export tolerances do not
establish manufactured clearance. Both joint-state interpretations and all prior
neighbor/source-fit limitations remain. All 126 app/authored files are unchanged;
no new gear moves. [Provenance](assets/source-manifest/rear-hour-phase-limit.json)
records the calculations. No app tests, build or browser automation were needed.

Next without maker confirmation: strengthen the 101 sampled-only neighbor checks
with continuous bounds. Rear-hour physical acceptance still needs source/design
precision or manufacturing evidence; more nominal phase tuning is not a useful
route to a materially larger margin. No push, PR, deployment or publication.

## Connected display-train phase and clearance review

From clean `35c7835`, the [complete conditional review](docs/DISPLAY_PHASE_CLEARANCE_REVIEW.md)
applies both rear phase candidates together in isolated diagnostics. All five
meshes pass **32,261 actual-runtime triangle configurations**, with 12 additional
source-critical rear witnesses clear. Exact ratios preserve all seven rigid
packets; the front phases and the existing clock remain unchanged.

The 13 leaves are screened against every source occurrence and all 15 authored
fitted-hand poses: 4,516 full-turn box exclusions and 231 candidate neighbor
pairs. Of those, 121 clear by continuous enclosing/radial bounds, 3 have an
invariant nonpenetrating relative pose, 101 pass sampled full-period checks, and
6 retain original overlaps. There are 9,578 neighbor configurations and 9,434
sampled solid-common queries. No new/increased overlap was found. A 690-pose
runtime neighbor replay retains 11 pre-existing triangle-contact pairs; fresh
source queries identify five as zero-common-volume contact interfaces. These
are not described as positive clearances. Invalid/non-solid source exceptions
and prior spring-envelope limitations remain explicit.

**No app change or new animation.** All 126 app/authored files match the baseline.
The rear-hour ~45 nm source margin remains unqualified; 101 neighbor pairs still
lack continuous whole-solid certification; both joint states still need explicit
maker confirmation. Next: obtain joint/fit and source-precision evidence before
accepting a phase installation. Local CAD and isolated runtime checks were
explained before execution; no app build, test suite or browser automation.
[Provenance](assets/source-manifest/display-phase-review.json) records the inputs
and limits. No push, PR, merge, deployment or publication.

## Reverse-face mesh diagnosis

Research from clean `ac6e37c` separates original source poses, authored phases
and actual runtime transforms. [The diagnosis](docs/REVERSE_MESH_DIAGNOSIS.md)
finds **phase incompatibilities in the current nominal configuration, with no
runtime transform fault detected**. Pair 183/216 has no authored phase offsets
and already fails at the source clocking during rotation. Pair 217/187 fails
more severely at the source phase; the current +0.25° world hour-wheel phase
clears its static pose but leaves running penetration.

Isolated phase experiments clear reviewed source polygons and selected original
solids without editing teeth or axes. Pair 183/216 has about 2.8 µm sampled solid
clearance; pair 217/187 has only about **45 nm**. Positive continuous bounds apply
to planar polygons only. The latter margin is not tolerance-qualified, and no
all-phase neighbor, hand-fit or complete-train acceptance is claimed.

The review records 107,526 baseline/experimental section configurations, a finer
adaptive hour-pair bound, 35 selected original-solid queries and 33 matching
runtime witnesses. Independent controller point error is below 1.8e−15 mm;
runtime witness/CAD pose error is below 1.2e−13 mm. All 126 tracked app/authored
files remain byte-identical to `ac6e37c`. No new packets move; no phase is installed.
Local CAD and isolated runtime checks were explained before execution. No app
build, app test suite or browser automation was run. [Provenance](assets/source-manifest/reverse-mesh-diagnosis.json)
retains hashes and limitations; detailed outputs remain ignored.

Next: assess whether the nominal phase candidates warrant a separate complete
train/neighbor review, with the rear-hour precision limitation explicit. Maker
joint-state evidence remains outstanding. No push, PR, deployment or publication.

## Friction connection source follow-up

Research-only follow-up from clean `a62c820`: [the interface report](docs/FRICTION_CONNECTIONS.md)
compares four independently downloaded maker STEP components with the original
assembly. All four pairs have zero-volume Boolean differences in both directions
and valid inputs/results. The center interface has matching 0.375 mm radius
shaft lands and bore; the cross-face shaft has an analytic taper interfering
with pinion 217's bore. The standalone models reproduce both fits.

A same-world-direction 1:1 normal-running drive at each interface is supported
by the fitted geometry and display function, but **no explicit maker constraint
was found**. Center friction treatment and the cross-face fit's permanent versus
slipping character remain undocumented in the inspected sources. Missing torque
data alone does not make the sticking ratio unknown; it limits physical claims.
No source was found that clears either previously measured reverse mesh conflict;
the later diagnosis above separately investigates nominal phase alternatives.

The app and authored assets remain byte-identical to `a62c820`; no new packet
moves. Focused local CAD comparison was explained before execution. No app
tests, build or browser automation were run for this research-only pass.
[Provenance](assets/source-manifest/friction-connections.json) records primary
URLs/hashes, exact occurrences and evidence limits; downloads remain ignored.
Next: obtain an explicit maker drawing/instruction for each joint's normal and
setting states, then separately resolve the reverse running meshes. No maker
message, push, PR, deployment or publication.

## Motion-work extension investigation

Reviewed from clean `073a870` on `codex/escapement-clearance-study` after the balance
smoothing revert. [The new study](docs/MOTION_WORKS_STUDY.md) confirms all seven
candidate packets (13 leaves), tooth counts, axes and conditional signed ratios.
**No additional packets move.** The normal-running center/cannon friction link and
cross-face shaft fit are not source-confirmed constraints. Both reverse meshes
(183/216 and 217/187) penetrate during unchanged-phase coupled motion; original
solids and actual decoded runtime geometry independently corroborate the failures.

Each mesh was swept through its complete material orientation period: 32,261
source-section and 32,261 runtime-section configurations, plus 77 selected
whole-solid and runtime-triangle poses. The three front meshes pass conditionally;
freezing their meshed dependents also causes interference, so there is no verified
independently driven subset. Full-turn neighbor boxes are recorded; unresolved
neighbor candidates are not certified after the mesh rejection. Existing source
fit, invalid-solid and physical/continuous-clearance limits remain.

All nine focused movement tests and all 18 browser lifecycle checks pass on the
current-source local development server, with no application/shader errors.
Local CAD and lifecycle checks were explained
before execution because no push is authorized; app runtime, phases, timing and
motion assets remain byte-identical to `073a870`. The local evidence is ignored
under `artifacts/motion-works/`; [provenance](assets/source-manifest/motion-works-study.json)
records the decision and hashes. No push, PR, merge, deployment or publication.
The source follow-up above refines this next action: obtain explicit joint-state evidence and resolve both
reverse running contacts through a separately reviewed proposal before enabling
any dependent display packet. The existing prescribed movement remains available
locally for review; this milestone is an investigation, not a completed extension.

## Running movement implementation

Active branch: `codex/escapement-clearance-study`; nominal-speed work starts from
clean local milestone `bdf8259`. The assembled escapement, attached hairspring and
entire currently coupled train through barrel-II drum/lid now share the maker's
**3 Hz / 21,600 beats per hour** nominal speed (1/3 second per complete oscillation),
replacing the eight-second illustration. The maker's ML-01 specification independently
confirms the −2° seconds-shaft/cycle ratio derivation. Mean periods: escape 6⅔ s,
seconds 60 s, third 562.5 s, center 1 h, transfer 2 h 10 min, barrel II 6 h 40 min.

The [runtime record](docs/RUNNING_MOVEMENT.md) and
[nominal-speed provenance](assets/source-manifest/nominal-operating-speed.json)
record source evidence, timing, sampling and validation. Balance amplitude,
geometry, display phases, recoil, accumulated shaft ratios and pause/resume
policies remain intact. Hidden tabs and disassembly exclude time; reassembly
resumes the retained clock. Mainsprings, arbors, ratchets, barrel I, motion works
and hands remain static. This is prescribed kinematics, not self-sustaining motion.

All **8 focused movement tests**, typecheck, lint, production build and **18 browser
checks** pass locally. Checks cover varied frame rates, delayed frames, hidden
lifecycle, reassembly, Workshop completion/Undo, Bench flip and cleanup. A 25-second
Chrome interval delivers 1,501 frames, p95 16.7 ms, movement-update p95 0.8 ms,
and stable geometry/texture counts. At 60 FPS there are only 20 samples/cycle;
fast spokes and brief releases can strobe. This single desktop run and synthetic
visibility fixture do not qualify all devices or OS lifecycle behavior.

The 8,557 normalized runtime poses agree with the earlier verified path to less
than 3.2×10⁻¹³ degrees; the GPU spring export is identical. Existing CAD clearance
evidence remains historical and applicable to unchanged geometry; no CAD sweep
was rerun. Local validation was essential because no push is authorized and
higher-speed rendering required inspection. Evidence remains ignored under
`artifacts/nominal-movement/`; the original `artifacts/running-movement/` is preserved.

No push, PR, merge, deployment or publication. The motion-work investigation above
supersedes the next action; nominal-speed sampling limitations still apply.
The [clearance](docs/ESCAPEMENT_CLEARANCE_STUDY.md),
[interfaces/hairspring](docs/ESCAPEMENT_INTERFACES_AND_HAIRSPRING.md) and
[train](docs/TRAIN_COUPLING_STUDY.md) studies retain the supporting mechanical
evidence. Invalid original solids, continuous contacts, physical-device qualification,
expert acceptance and CAD redistribution permission remain unresolved. Earlier
`codex/escapement-foundation` and `codex/running-movement` branches are historical.

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
