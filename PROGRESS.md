# Current project status

Updated 1 November 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Current review:
[repository review and evidence boundaries](docs/REPOSITORY_REVIEW.md).

## Integration and next action

Started clean at fetched `develop` / HEAD `9f67bdb56218bd947b4ccff3c6a8a2a77032ded3`.
[PR #36](https://github.com/galind/zweigesicht-1/pull/36) is merged; its final head
`4bb4b8f` has the same tree. `main` remains `1139992a8e64078f2f62de2f7303bf2b118805d7`.
The previous collision, diagnostics and chooser fixes are present.

Current work is on `codex/deep-implementation-review`, based on that develop.
Its Vercel Git deployment is disabled. Push and a PR targeting develop are
authorized; merge, deployment and publication are not.

## Review changes and next action

- Explorer uses one active-panel value, one selection classification per pass,
  and a shared policy for raw poses, finishes, visibility and hand registration.
  Raw catalog subtree hands no longer animate as if they were fitted.
- Clock-only rendering no longer rebuilds React snapshots or diagnostic audits.
  Camera/presentation updates, explicit inspection/WebMCP and automatic quality
  remain live. No wall-clock performance gain has been measured.
- Workshop shares camera capture/restore across detail, workbench and Retry;
  UI inventory changes only after the controller accepts workspace navigation.
- Bench context loss invalidates unfinished loading/compilation, and late pointer
  capture after route exit releases the old canvas without touching another view.
- Focused CPU regressions cover the affected transitions. Mechanical inputs,
  source assets, motion laws and dependency locks are unchanged.

The second pass removes duplicate spread rebuilds, two test-only Workshop helpers,
and selection changes preceding refused workspace navigation. The first GitHub CI
run passed 197/198 tests; its one failure compared VM object prototypes instead of
camera values. That assertion now checks vectors, side and zoom bounds directly.
Static review and `git diff --check` pass. [PR #37](https://github.com/galind/zweigesicht-1/pull/37)
targets develop. Next: verify the final head in GitHub CI and review the PR.
No local tests, builds, CAD calculations or browser automation have run. Exact-head
CI results are recorded in the PR; browser focus/graphics behavior remains
unverified by this review. Prior evidence below is historical.

## Current illustration and retained limits

Explorer, completed Workshop and assembled Bench share prescribed **3 Hz /
21,600 beats per hour** escapement/train motion, all seven display packets and
[current-local-time fitted hands](docs/CURRENT_TIME_HANDS.md) on both displays.
The 93/137 and 214/217 sticking assumptions, balance amplitude, recoil, existing
hairspring path, authored phases, fittings and materials are retained.

Explorer separation holds the last train/barrel/hairspring and hand pose relative
to presentation, resuming only at displayed zero separation. Inventory and
Workshop Undo restore static endpoints. Hidden time is excluded; hand wall-clock
resynchronization never advances paused train time. Bench flips the whole parent
and retains reference internal geometry for visitor collisions.

The [power-source investigation](docs/POWER_SOURCE_STUDY.md) confirms the nominal
series connection. Barrel I's drum is held; barrel II retains `−E/3600` and its
24,000-active-second mean period. **Mainspring deformation, faithful attachments
and intermediate arbor motion remain incomplete.** No equal-unwinding law,
energy, torque, power reserve, reset or self-sustaining behavior is invented.

Hand/marker, broad-lance, central Lance/ring and source-fit overlaps remain
explicit, as do invalid/non-solid source exceptions and the approximately 45 nm
rear-hour margin. Sampled and planar clearance evidence is not continuous
whole-assembly or manufacturing certification. Source geometry is unchanged.

## Prior runtime and hosted evidence

At application milestone `5b8f26a`, 27 focused tests, typecheck, lint, production
build and 31 browser checks passed locally. Across 2,663 inspected frames,
including 595 paused frames, independent point transforms agreed within
2.85e-14 mm. A 25-second Chrome interval retained 135 geometries / 8 textures;
frame p95 was 16.7 ms and movement-update p95 0.6 ms. These are **historical**
results, not a rerun of this review or physical-device qualification.

PR #34's integration CI on `c127cc8` passed 162 tests, inventory, typecheck, lint
and both builds. Its hosted delivery checks verified the three approved optimized
Bench GLBs and removal of old public holder STL URLs. This review does not change
or re-verify UAT. Original holder files, downloads, caches and detailed local
CAD/browser evidence remain outside Git.

The full preceding progress record, exact run links and milestone measurements
are preserved at [the review baseline](https://github.com/galind/zweigesicht-1/blob/0f7d1ea7f23d6bec34bf501675a83f38c099f9c3/PROGRESS.md).
Mechanical reports and provenance remain in `docs/` and `assets/source-manifest/`;
use their recorded revisions when reproducing historical investigations.

## Outstanding release gates

Maker redistribution permission, mechanical/expert acceptance, representative
accessibility/usability review, physical-device qualification and clean-machine
CAD reproduction remain outstanding. Repository visibility is public; that does
not clear redistribution rights. The [release gates](docs/RELEASE_GATES.md) retain
history remediation decisions and the [permission request](docs/ASSET_PERMISSION_REQUEST.md)
remains unsent. Original code/documentation use MIT; maker design/CAD and derivatives do not.
