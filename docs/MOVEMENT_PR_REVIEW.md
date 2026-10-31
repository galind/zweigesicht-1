# PR #35 implementation review — 31 October 2026

Review baseline: clean `0f7d1ea7f23d6bec34bf501675a83f38c099f9c3` on
`codex/escapement-clearance-study`, against fetched `develop`
`8c0a36779dc1818bc9b3c9c5c5568fbcbf489ad1`. The complete PR contains 21 commits
and 121 changed files, including the earlier investigations and the reverted
balance-smoothing experiment. The connected GitHub app reported no reviews,
inline threads or conversation comments at that baseline. PR:
<https://github.com/galind/zweigesicht-1/pull/35>.

## Actionable findings and resolutions

| Severity | Failure condition and location | Resolution |
| --- | --- | --- |
| P2 | `BenchViewer.load()` awaited the motion sidecar after transferring movement meshes, before assigning `assets`. Leaving during that wait disposed scene-owned meshes but the early return abandoned the other successful loads. A rejected sidecar also left transferred leaves outside the local `loaded` cleanup roots. | Load motion inside the existing `allSettled` transaction and unwrap it before transferring any mesh. CPU regressions execute the real load/release/dispose methods with delayed, rejected and superseded motion loads, counting disposal for every allocated fixture resource. |
| P2 | `tests/play-lifecycle.test.mjs` supplied a movement test double without `hands.configure()`. Every successful load threw inside the fixture; five tests failed and CI skipped inventory, typecheck, lint and both builds. | Complete the test double's contract. The next CI run exposed the stale rear-hour expectation behind that exception; derive all 20 phase expectations from recorded reviews, including the added cannon pair. Keep failure/retry and reload assertions intact. |
| P2 | `review-motion-works.mjs` and `review-reverse-mesh-transforms.mjs` append candidate packets to `MOVEMENT.packets`. On the current implementation those members already exist, so the diagnostic applies their motion twice and can start replacing historical output before failing. | Reject the incompatible current scope before any evidence read/write. The historical `review-display-phases.mjs --front` mode also rejects seven-packet scope instead of mislabeling it as the old four-packet result. Give historical revisions and the current installed-packet runner in the error; CPU regression covers all three guards. |
| P3 | Current architecture described idle-only rendering and 18 phase overrides; four research follow-up banners still called hands static. `PROGRESS.md` also retained superseded next actions, including an already merged PR #34. | Correct current summaries and reduce progress to current scope, verification and next action. Keep historical reports, source manifests and a pinned link to the prior progress record. |

No geometry, source transform, gear ratio, authored phase, mechanical connection
assumption, spring path or animation eligibility rule changes in this review.
The added hand/controller integration regression verifies repeated fitting and
wall-clock jumps while paused, followed by hand resynchronization with exactly
unchanged train time and matrices on the first resumed frame.

## Review coverage and retained implementation

- **Lifecycle:** traced Explorer's generation checks, optional catalog/configuration
  loading, restore-before-retarget and render ordering; Workshop's transactional
  preparation, completion, Undo and disposal; Bench's resource transfer, loading,
  visibility, context loss and parent flips. Corrected/source geometry ownership
  remains separate. The controller restores borrowed geometry before owner disposal.
- **Scheduling:** one route scheduler owns motion, with hidden/context suspension.
  Requested or displayed separation pauses active time; held transforms compose
  with presentation, and displayed zero gates resumption. Inventory and Workshop
  Undo deliberately use static endpoints. A delayed visible frame advances actual
  elapsed time; a hidden interval does not. Selection boxes use displayed meshes.
- **Kinematics:** retained all 41 rigid motion leaves, seven display packets,
  signed world axes and ratios, 3 Hz / 21,600 beats per hour, ±180° balance amplitude,
  source centers, escape advance/recoil and the existing hairspring interpolation.
  Slow ratios consume unwrapped escape phase before final angle reduction.
  `B A⁻¹ R A` carries motion with presentation without accumulating transforms.
- **Hands:** retained fitted source-tip references, opposite display signs,
  styles/bushings/materials, civil-time resynchronization and sub-beat residual.
  Hand time never writes the active movement clock. Unregistered catalog hands
  remain static; Bench's detached display remains outside running-hand registration.
- **Assets/build:** hash and byte-length rejection remain required; build pruning
  requires the sidecar. Authored policy stays separate from generated geometry.
  Bench collision BVHs deliberately retain internal reference geometry under the
  parent flip, not a changing spring mesh paired with a rest BVH. Diagnostic access
  is obtained by the browser harness; no production playback/debug API is added.
- **Tests:** retained independent tooth-count periods, source membership/axis
  checks, point-transform comparisons, source-tip hand angles, rigid relationships,
  spring topology and ownership checks. CPU facades do not qualify WebGL, browser
  navigation, visual appearance or real operating-system visibility behavior.

## Performance and cleanup decisions

No measured performance optimization is claimed. The dynamic spring already
reuses its buffers/topology; geometry bounds are conservative, not rebuilt each
frame. Per-frame shaft work covers only the explicitly registered leaves.
Diagnostic linear searches are small and outside ordinary rendering; replacing
them with cache infrastructure has no demonstrated benefit. Recomputing an
unchanged held spring during a presentation transition and allocating a `Date`
for wall time are bounded costs; no benchmark justifies changing those paths.
The Bench load rearrangement fixes ownership; it is not a measured loading-speed
claim. Prior desktop timings remain historical and are not a before/after comparison.

No CAD investigation script or provenance record is deleted. Their dependencies
include source-solid/cache reconstruction, phase diagnosis, independent runtime
transforms and the recorded evidence pipeline, beyond app imports. Preserve
exports used by these Node diagnostics. No scheduler abstraction, generalized
packet cache, geometry rewrite or speculative hot-loop refactor is introduced.

## Historical reproduction and evidence boundary

The original motion-work runner belongs to `a62c820`; the reverse-mesh runner
belongs to `00973a9`; `review-display-phases.mjs --front` belongs to `5fd50f0`. Reproduce those studies with the complete corresponding
revision and its hash-checked retained inputs, not a mixture of current code and
old cached results. Their old phase hypotheses and static-hand scope are material
to the reported failures. The guards added here do not revise those findings.
For installed gear transforms use `review-display-phases.mjs --installed`; current
hand interfaces have their separate `review-current-hands.mjs` workflow.
These CAD/mesh workflows still require the inputs documented in their reports.

Historical recorder scripts intentionally encode milestone-specific baselines,
allowed changed files and result counts. Do not rerun them on today's HEAD merely
to refresh hashes or turn historical browser/CAD checks into current validation.
Their recorded source-file hashes describe the measured revisions. This review
does not regenerate a sidecar, rewrite earlier provenance or run a new CAD sweep.

The 93/137 and 214/217 sticking assumptions remain explicit. Mainspring deformation,
attachments and intermediate arbor rates remain incomplete; the 62:62 connection
does not determine equal unwinding. No energy, torque, reserve, reset or physical
self-sustaining claim is added. Retained hand/marker, broad-lance, Lance/ring and
source-fit overlaps, invalid/non-solid exceptions and the roughly 45 nm rear-hour
margin remain unresolved. See [hands](CURRENT_TIME_HANDS.md),
[power source](POWER_SOURCE_STUDY.md), [rear display](REAR_DISPLAY_ANIMATION.md)
and [release gates](RELEASE_GATES.md).

## Validation

Baseline [CI run 41199357937](https://github.com/galind/zweigesicht-1/actions/runs/41199357937)
failed five Workshop fixture tests. Holder-assets CI passed. The review changes
are statically inspected with `git diff --check`; complete CPU tests, inventory,
typecheck, lint and production/Vercel packaging will run in GitHub CI after push.
No local tests, builds, CAD calculations or browser automation are run for this
review. Runtime assets and authored mechanical policy remain byte-identical to
the review baseline. Latest exact-head verification is maintained in
[PROGRESS.md](../PROGRESS.md).

The branch's Vercel Git deployment exclusion stays enabled. This review authorizes
neither merging nor deployment and clears no maker redistribution or mechanical
acceptance gate.
