# Current project status

Updated 24 October 2026. Setup is in the [README](README.md); extended checks are
in [architecture](docs/LOCAL_ARCHITECTURE.md). Repository visibility is public (changed by the owner).

## Remaining wheel pairs — 24 October 2026

Implemented from `b5bbfa9` on local `codex/wheel-contact-audit`. The production
review server is <http://127.0.0.1:4179/>; reload the homepage or walking tab.
See the [complete decision record](docs/REMAINING_WHEEL_CONTACT_REVIEW.md),
[provenance](assets/source-manifest/remaining-wheel-contact.json), and local
`artifacts/remaining-wheel-contact/report.html` with nine matched before/after sections.

- All nine remaining initial tooth pairs are clear: d90/d249, d97/d249,
  d94/d237, d238/d242, d234/d243, d137/d210, d141/d211, d210/d213 and d187/d217.
  Together with d96 and the ratchets, all 12 initially confirmed non-coaxial
  tooth contacts have zero original-solid common and disjoint runtime meshes.
- The evidence supports incompatible static source phases, not import errors,
  perspective or tessellation-only overlap. Added 15 rigid occurrence phases:
  barrel I drum/cover/spring +1.45° world Z; winding pinion +7.7° local Z;
  cannon pinion +3.3° world Z; hour 1 wheel/hub −2.95°; hour 2 wheel/hub +0.25°;
  motion 1 wheel/pinion +0.8°; third wheel/pinion +16.6°; seconds wheel/pinion +2.3°.
  Exact local signs, IDs and matrices are in the record. Crown/click and
  escapement stay fixed. Rejected a crown-only phase that increased click penetration.
- Qualified all 15 moved valid solids against all 364 other leaves: 251 directed
  before/after records, 5,194 AABB exclusions, 15 recovered-diamond exclusions;
  plus 30 exact fitted-hand checks / 195 exclusions. No common increase beyond
  1e−8 mm³. Eight packet-relative matrix checks pass. Three zero-common checks
  involve the already-invalid d27 dial solid and remain provisional.
- Original CAD downloads, 36 preexisting tracked assets, 222 overview buffers,
  axes, dimensions and base targets are unchanged. Only the shared authored
  override changes runtime placement, consistently across all three experiences;
  no controllers, UI, materials, visibility or dependency formats changed.
- Verified: 111 CPU tests, 115 runtime checks, inventory, 1,119 access checks,
  typecheck/lint/build, source hashes, Meshopt identity and HTTP metadata.
  Headless before/after checks verify 75 live transforms per stage. Explorer
  passes 350 checks; Workshop focused 92, Easy 89 actions / 538 checks, Hard
  284 actions / 1,708 checks; walking 23 checks and 16 collision landings.
  All 18 final phases agree with walking collision on both holder sides.
- New nominal solid gaps span 0.004479–0.027174 mm. Static clearance does not
  certify tolerances, loaded tooth engagement, spring attachment/loading,
  hand setting or a running escapement. d144 remains an open shell; d27 source
  validity and the retained crown/click common require separate mechanical review.
  Evidence stays local. No push, PR, deployment or asset publication.

Next: maker/mechanical review of those retained uncertainties before any design
or running-model changes. The initial static tooth-contact correction scope is complete.

## Ratchet tooth contact follow-up — 24 October 2026

Implemented from `f027338` on local `codex/wheel-contact-audit`. The production
review server remains at <http://127.0.0.1:4179/>; reload existing browser tabs.
See the [ratchet decision/evidence record](docs/RATCHET_CONTACT_REVIEW.md) and
[provenance](assets/source-manifest/ratchet-contact.json).

- Corrected d131 ratchet occurrence **15** together with its keyed barrel II
  core d87 (`1__0_1_1_84_3`) by **+1.8° world Z**: local angles −1.8° / +1.8°
  because their local axes point in opposite directions. Occurrence 14 stays
  unchanged. Their relative mounting matrix is preserved within 8.9e−16.
- Original ratchet common volume falls from 0.060692779 mm³ to zero, with
  0.031730939 mm minimum solid distance. Decoded runtime triangles are disjoint
  at 0.032225302 mm. Rejected isolated-wheel and quarter-turn alternatives are
  recorded: they either retain tooth overlap or introduce keyed-core penetration.
- All 364 other leaves are considered for each moved part: 32 exact before/after
  checks, 694 broad-phase exclusions and two recovered-diamond checks. No increased
  solid common; crown, click and click spring are explicitly checked. Barrel/cover
  gaps remain 0.005 mm and the modeled mainspring gap remains 0.006985294 mm.
  Existing core/screw common and nominal contacts remain; spring attachment,
  loading, running engagement and manufacturing tolerances are not certified.
- Added only two pose entries to the existing shared override. Original sources,
  36 preexisting tracked assets, 222 overview geometry buffers, all source/base
  target matrices and d96's earlier correction are preserved. Runtime controllers,
  UI, materials, visibility and save/dependency formats are unchanged.
- Verification passes: 111 CPU tests, 115 retained runtime checks, inventory,
  1,119 sampled access checks, typecheck/lint, production build, source hashes,
  Meshopt byte identity and HTTP metadata. Headless before/after live checks
  independently verify 12 transforms across the three routes. Final explorer
  suites pass 350 checks; Workshop focused 92, Easy 89 actions / 538 checks,
  Hard 284 actions / 1,708 checks; walking passes 23 journey checks and 16
  collision landings with matching render/collision poses on both holder sides.
- Reproducible original-solid measurements, orthographic tooth/bore sections,
  matched homepage close-ups, and browser reports are local under
  `artifacts/ratchet-contact/`. Scripts and evidence hashes are committed; images,
  original downloads and generated CAD remain local. No push, PR or publication.

The nine-pair follow-up above completes the next action from this milestone;
d144 remains an open-shell question. Static clearance is not mechanical certification.

## Wheel contact investigation and static phase — 24 October 2026

Implemented from clean `4e33275` on local `codex/wheel-contact-audit`.
See the [pair identities, measurements and decision record](docs/WHEEL_CONTACT_REVIEW.md)
and [provenance](assets/source-manifest/wheel-contact.json). Evidence remains local
under `artifacts/wheel-contact/`; production review server is on port 4179.

- Surveyed 26 toothed occurrences / 325 pairs, with 45 original-BRep candidates.
  All 223 movement source matrices match fresh XCAF composition exactly. Confirmed
  12 non-coaxial source-solid contacts, separated five coaxial joints and the d144
  open-shell volume signal. Orthographic close-ups, interior witnesses and finer
  tessellation distinguish these from perspective and mesh-only artifacts.
- Corrected only transfer wheel d96's static phase, +6.25° about its original
  local Z bore. Source common volumes with d85/d93 were 0.036083741/0.010153667
  mm³; both become zero with 0.026971/0.022584 mm minimum solid gaps. Actual decoded
  runtime meshes also stop intersecting (0.027128/0.022821 mm gaps). Fourteen
  nearby original-solid checks show no increased penetration; existing screw-fit
  and jewel contacts remain. The empty assembly diamond's recovered STL is disjoint.
- One reproducible authored override is shared by explorer, Workshop and walking.
  Source STEP/GLBs, geometry buffers, immutable matrices and Workshop base targets
  retain their hashes/values. No tooth, axis, scale, material, UI, visibility or
  performance changes. Explorer tracks the phase separately as a display pose;
  Workshop seat bounds and walking collision use the same corrected pose.
- Validation passes: 110 CPU tests, 115 retained-input runtime checks, inventory,
  1,119 sampled access checks, typecheck/lint, production build, source hashes and
  Meshopt byte identity. Headless browser checks pass before/after: seven explorer
  suites (350), Workshop focused (92), walking journey (23). Final complete Easy
  (89 actions / 538 checks), Hard (284 actions / 1,708 checks), 17 entry checks,
  HTTP metadata checks and 16 landings pass. Walking independently verifies the
  one phase exception, all other source poses and both collision presentation
  transforms. Original and corrected local screenshots/reports are retained.

Next: coupled phase/contact review for the other ten confirmed pairs; review d144
as an open shell before making any solid-interference claim. Their original poses
and measured overlaps remain unchanged. The accepted correction is an unloaded
static presentation, not maker clocking, dynamic contact or mechanical
certification. No push, PR, deployment or asset publication was performed.

## Local responsiveness follow-up — 24 October 2026

Implemented and verified from clean `989bd6f` on `codex/walk-inside-movement`.
See the [paired evidence and reproduction](docs/BENCH_EXPERIENCE.md#responsiveness-verification--24-october-2026).
Local production preview: <http://127.0.0.1:4178/bench>.

- Diagnosed GPU pixel/transmission cost at a larger visible viewport; collision
  was not the driver. Mouse deltas now coalesce per frame, and stationary turns
  participate in monitoring. A bounded scheduling-only tail handles sparse input
  without redrawing unchanged views or counting sleeping intervals.
- Auto starts at pixel ratio 1, reduces gradually through .85 and .7 using
  sustained windows and cooldowns, and avoids oscillating recovery probes.
  Explicit Low/High remain fixed within the viewer session, including side
  switches. Half-resolution transmission retains jewel optics and opaque finishes.
  Common material variants compile during loading. CAD geometry, source dimensions,
  placements, visible openings and collision code remain unchanged.
- Accepted visible Chrome/M4 comparisons at 2400 × 1300 CSS / device DPR 2:
  baseline High p95 **32.5–36.6 ms**, final Auto **17.2–17.6 ms**. Frames over
  25 ms fell from **622/871 to 0/1,437**; over 50 ms from five to zero. At the
  same High resolution, the isolated transmission change lowered p95 to
  22.7–28.8 ms. CPU, GPU timer and handler-to-render timings are reported separately.
  These automated workloads do not establish physical mouse feel or other devices.
- 107 CPU tests (six new activity/quality cases), inventory, types/lint, local
  production and Vercel packaging builds, and HTTP metadata checks pass. Vercel
  output still excludes local bench assets. All 23 visible walking-journey checks,
  11 focused interaction checks and seven lifecycle checks pass, including actual
  window hiding, stopped rendering, capture/Escape, side switching, retry and cleanup.
  Seven explorer suites pass 350 checks; Workshop entry/focused checks pass 17/92.
- The foreground helper uses isolated Chrome with Playwright 1.62.1's
  `noDefaults` connection, preserving actual focus/visibility. Focus-lost samples
  were rejected; earlier emulated-focus runs are exploratory only. Evidence and
  the baseline archive remain ignored under `artifacts/bench/`. No push, PR,
  deployment, publication or asset redistribution was performed.

Next: owner physical-mouse walkthrough and representative device/browser review.
The [feature decision record and testing strategy](docs/BENCH_EXPERIENCE.md#maintenance-and-decision-record)
now preserve the implementation rationale and headless-first testing direction.
The paired interaction and first-use profilers now default to headless Chrome;
`BENCH_BROWSER=headed` retains the native visible path. Reports distinguish
execution mode, GPU backend, host/browser settings and caller-supplied server
revision from the harness revision. Workloads retain their placements and timing.
All 12 headless interaction scenarios pass on M4/Metal; Auto p95 is 17.5–17.6 ms
with zero frames over 25 ms out of 1,436. Headless Auto/Low first-use probes pass,
as do 13 bench CPU tests and runner syntax/lint/format checks.
Two fresh visible first-use attempts lost native focus and were rejected; an
accepted fresh visible comparison remains outstanding. See the dated tooling
verification in the feature reference; no application behavior changed here.
Initial paint still measured about 101 ms CPU after precompilation; manual High
can miss 60 fps at the large viewport. Cold-driver startup, prolonged thermal
behavior and broader hardware support remain unverified. Publication still needs
separate authorization and the existing release gates.

## Local walking experience — 24 October 2026

Implemented from clean `develop` baseline `0233a5f` on local branch
`codex/walk-inside-movement`. The homepage’s
**Walk inside the movement** button opens `/bench`; explorer and Workshop remain
separate. See [bench setup and evidence](docs/BENCH_EXPERIENCE.md).

- A 1.65 mm first-person visitor walks and jumps on the actual 223-leaf movement.
  Source placements and dimensions are unchanged. Per-definition BVHs query the
  CAD triangles directly; the source-matrix comparison has zero error. Sixteen
  sampled drop/landing checks pass, including exposed plates and bridges; sampled
  holes retain lower visible support rather than invisible floors.
- Inspected both maker holder STLs, STEP models and assembled reference images.
  Recorded URLs/hashes and nominal seating in `assets/source-manifest/holder.json`.
  T fades between the separate valid presentations and resets to the mat; no
  mechanical turnover mechanism is claimed. The authored access fixture is a
  separate Blender scene with reproducible export and a local editable `.blend`.
- Explicit mouse capture, WASD, jump, reset, Escape/menu, repeated T, fall recovery,
  loading failure/retry and repeated entry/exit pass the 23-check production
  browser journey. Six additional lifecycle checks cover actual tab focus loss,
  synthetic hidden-document events, WebGL context loss/retry and late load disposal.
  Headless Chrome reports inactive tabs as visible, so hidden-document handling
  is tested with an explicit visibility fixture, not claimed as an OS-level test.
- On this Mac mini M4 / 24 GB, macOS 26.6.2, Chrome 155.0.8059.86 / ANGLE Metal,
  a 60.196-second bridge benchmark at 1440 × 900, pixel ratio 1.5, High detail
  recorded 3,600 active intervals: mean 16.666 ms (~60 fps), p95 16.7 ms,
  p99 16.8 ms, p95 CPU submission/update 5.4 ms. The full journey at pixel ratio
  1 also averaged ~60 fps. Rendering stops at rest and on hidden-document events.
  These are local headless measurements, not a broad device or thermal claim.
- Validation: 101 CPU tests, inventory, typecheck/lint, local production and
  Vercel packaging builds, five homepage viewport/text-size entry checks,
  HTTP metadata checks, seven explorer suites (350 checks), Workshop entry
  (17 checks), focused checks (92), complete Easy (89 actions / 538 checks)
  and complete Hard (284 actions / 1,708 checks) pass. Local browser evidence and
  representative screenshots are in ignored `artifacts/bench/`.
- Original holder downloads, prepared holder payloads, Blender outputs and browser
  evidence remain ignored. Vercel packaging explicitly excludes `bench-local`;
  the exclusion has an automated test and the built output was inspected.
  No remote push, PR, deployment or
  publication was performed. Source redistribution and other release gates remain.

Next: owner walkthrough of the local prototype and representative usability/device
review. Very narrow/deep CAD recesses can require R; mobile navigation is outside
this milestone. Maker finish and seating are static interpretations, not physical
mounting/printing certification. Publication needs separate permission and approval.

## Repository cleanup — 23 October 2026

[Draft PR #30](https://github.com/galind/zweigesicht-1/pull/30) targets `develop`
from baseline `33de8d1`; the initial working tree was clean. Its exact Vercel Git
deployment is disabled. The [review](docs/REPOSITORY_REVIEW.md) records the map,
findings, retained workflows and remaining decisions.

- Removed retired Workshop Hints/cutaway/callback code, ignored animation-scale
  bookkeeping, an unused camera argument, and 73 overridden CSS declarations
  plus four obsolete style rules. Save compatibility and CAD workflows remain.
- Fixed production Workshop entry without exposing its homepage action. Patched
  only Vite, source-map-js and tinypool; both npm audits report no known issues.
- Initial validation: 93 CPU tests, inventory, types/lint, both production builds,
  Preview build, 114 retained-input CAD checks, source hashes, Meshopt identity
  and 1,119 access checks passed. All 36 tracked asset/provenance/notice files
  match baseline. Browser checks covered complete Easy/Hard builds, 87 drag
  checks, 92 focused checks, nine explorer suites, production/Preview entry and
  enlarged-text loading/retry layouts. Original CI passed on `3109d06`.
- Follow-up passed 93 CPU tests, inventory, types/lint, both production builds,
  87 drag checks, 92 focused checks and 21 entry checks. Computed styles and
  element positions match before/after removal across 45 UI-state/viewport
  cases, including 200% text. Next action is draft review; no merge, release,
  deployment or publication is authorized.
- Removed the `/play` alias and its sole-purpose config at the owner's request.
  Rechecked 93 tests, inventory, types/lint, both production builds, HTTP metadata
  and removed-route checks, and 17 production Workshop entry checks; all pass.

## Public repository security — historical snapshot, 5 October 2026

The setup/next-action bullets below describe that date. At this review's fetched
baseline, PR #27 and the release/synchronization PRs #28/#29 are merged; their
merge commits are in `33de8d1`. This local review does not establish current app
credentials, environment settings or deployment health.

- Active [branch ruleset](https://github.com/galind/zweigesicht-1/rules/24522996)
  protects `main` and `develop`: PR required, resolved conversations, up-to-date
  branch and required `Verify` / `Branch policy` checks from GitHub Actions;
  deletion and force pushes blocked, no bypass actors.
- Zero collaborators and no deploy keys. Required approvals remain zero for the
  sole maintainer; automatic head-branch deletion is off. PR creation was already
  limited to collaborators and remains so.
- Actions require full commit SHAs, allow owner/GitHub-created actions, and require
  approval for every external contributor. Default token permissions remain
  read-only; workflow PR creation/approval remains disabled.
- [PR #27](https://github.com/galind/zweigesicht-1/pull/27) pins actions and adds a
  one-click **Release to production** workflow. It creates/reuses the release PR,
  waits for protected CI and merges only the captured head; then syncs main back
  through another checked PR. It aborts on branch changes and never bypasses rules.
- The release job runs only from `main`, using a private app token restricted to
  this repository and a `release-automation` environment restricted to main.
  PR CI remains read-only. The environment is created with only the `main` branch
  allowed (zero tags) and administrator protection bypass disabled. App creation,
  installation and credential provisioning are pending; no release app credentials
  have been created or added.
- Current validation: all 92 tests and lint pass. Prior inventory, typecheck and
  both production builds passed; app code and build configuration are unchanged.
  GitHub CI also passed for implementation commit `14f34b0` (run 37358264288).
  The one-click controller adds mocked GitHub tests for release/sync,
  branch races, forbidden invocations, blocked CI and failed/partial merges.
  Full integration validation requires the app setup and an authorized release.
- Next: complete app setup, merge PR #27 into develop, then perform a separately
  authorized bootstrap release PR to main and sync main back into develop.
  Old unpinned workflows remain blocked by the Actions policy until replaced.
  The preparation branch has Vercel Git deployment disabled; no production
  deployment or release was performed.

The publication preparation below is historical evidence from 3 October. Public
visibility does not resolve its outstanding asset/production release gates.

## Current application

- Static CAD explorer: 426 source instances, six mechanism groups, component
  inspection/isolation, separation and fitted case/dial/hand configurations.
- Workshop: 89 Easy placements, or 249 Hard placements and 35 transfers; 16
  foundation leaves remain and both finish with 265. Undo/local saves retained.
- Production hides the homepage Workshop entry and `?assemble=1`; direct
  `/workshop`, noindex and sitemap exclusion remain. Removed the `/play` redirect
  at the owner's request; Workshop is the only assembly URL.
- Original contributions use standard MIT; required upstream notices ship with
  builds. Maker CAD/design and derived assets remain outside that grant.

## Publication preparation — historical

`codex/publication-blockers` starts from refreshed `develop` at `90b606e`.
Remote `main` is `0037646`; `codex/running-movement` is `45fa9d3`; no remote tags.
PR #25 is merged. The preparation branch has Vercel Git deployment disabled.
[Draft PR #26](https://github.com/galind/zweigesicht-1/pull/26) targets `develop`;
the verified preparation milestone was committed and pushed over SSH.

- Recorded version hashes and branch reachability for runtime assets, source-linked
  decisions and audit metadata in the [publication inventory](assets/source-manifest/publication-inventory.json).
- Rechecked maker pages; no adequate public redistribution grant is recorded.
  Prepared an [unsent permission request](docs/ASSET_PERMISSION_REQUEST.md).
- [Release gates](docs/RELEASE_GATES.md) contain exact historical findings,
  proposed path removals, author-email treatment, hosted-surface coverage and a
  comparison of coordinated rewriting versus a fresh public snapshot.
- Essential assets, provenance and notices remain intact. No history rewrite,
  remote deletion, visibility change, release, deployment or permission-request sending occurred.
  Ignored local briefs and unrelated work remain untouched.

## Verification

Workspace cleanup: archived 1.47 GB of old local reviews, comparison downloads and
legacy briefs outside the checkout with per-file hashes. Removed 54 MB of generated
leftovers. Assets now occupy 145 MB; artifacts 175 MB. Tracked assets, provenance
and licenses are unchanged. Export removes completed checkpoints and avoids a
duplicate GLB write; optimization leaves gzip packaging to runtime preparation.
Cached CAD pipeline, Meshopt byte-identity verification, 114 retained-input runtime
checks, original-source hashes, 82 tests, inventory and production build passed.

Exposure review: 267 remote commits / 1,680 blobs; 273 local commits / 1,727 blobs;
seven decoded gzip versions; commit messages and email metadata; PR #1–#25
patches/discussions; 20 logs and empty artifact listings from 10 PR-head runs.
No checked credential signatures matched. Coverage gaps are explicit in the gates.

Preparation checks passed: 82 tests, inventory validation, typecheck/lint,
production build, 101 inventory path-version hashes, 22 local Markdown links,
JSON validity, preserved runtime/license/notice bytes and changed-file formatting.
Prior browser checks remain dated evidence; this documentation/configuration
change does not certify physical devices, mechanical behavior or live deployment.

## Outstanding publication decisions from the prior audit

1. Obtain maker permission for current and historical derived assets, or approve
   code-only distribution with externally supplied assets and revised setup/CI.
2. Choose a fresh public repository with this original retained private
   (recommended), or authorize a coordinated history rewrite and separate hosted
   cleanup. Decide internal-report retention and author-email privacy.
3. Review and authorize the concrete remediation, then verify the approved result
   before separately authorizing public visibility. Making this original public
   also requires completing the older/push/manual Actions and hosted-content review.

Server-side branch protection is now verified above; production qualification remains unverified.
Applicable physical-device, accessibility/usability, mechanical and clean-machine
CAD reproduction gates remain outstanding. Merging preparation or releasing
`develop` to `main` does not authorize publication.
