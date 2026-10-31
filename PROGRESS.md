# Current project status

Updated 31 October 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Current review:
[repository review and evidence boundaries](docs/REPOSITORY_REVIEW.md).

## Integration and next action

Fetched `develop` is `e9fe2355afd96c1a49dff7ad2f0a3589f142b3db`, including merged
[PR #35](https://github.com/galind/zweigesicht-1/pull/35) and all its review fixes.
Its tree exactly matches PR #35's final head `068cbdabfcc337d2eba6b355f52bb12175027ca8`.
`main` and the common ancestor are both `1139992a8e64078f2f62de2f7303bf2b118805d7`;
develop is 14 commits ahead with no main-only commits.

PR #35's final head passed [GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41200195761)
(187 CPU tests, inventory, typecheck, lint and both builds) and
[holder-assets CI](https://github.com/galind/zweigesicht-1/actions/runs/41200195856).
This is baseline evidence, not validation of the current cleanup.

Current work is on `codex/codebase-cleanup-2026-10-31`, based on fetched develop;
its Vercel Git deployment is disabled in configuration. The owner authorized the
SSH push and [PR #36](https://github.com/galind/zweigesicht-1/pull/36), targeting
`develop`. Static review and diff checks are complete; current exact-head CI
results are recorded in that PR. The added CPU regression is part of GitHub CI.
No local tests, builds, CAD calculations or browser automation were run. Prior
browser/CAD evidence below remains historical.

Next: human review of PR #36 after passing exact-head CI. Changed browser runners
remain **unverified at runtime** and need a separate authorized runtime check;
current CI does not execute them. Do not merge, deploy or publish.

## Review changes

- Bench now uses the retained collision frame in both query directions, repairing
  floor hits, capsule corrections and contact normals near animated internals.
  A regression compares moving internals against an independent static fixture
  through parent turnover and rendered geometry replacement.
- Update stale diagnostic assumptions: assembled movement keeps rendering;
  separated movement sleeps with frozen train time; reassembly compares against
  the current presentation rather than an earlier moving frame.
- Correct the Workshop chooser to 83 prepared fits / 243 individual parts, remove
  the unused `HAND_TIME` export and share one raw-selection predicate within
  Explorer retargeting. No source manifest or authored static pose is removed.
- Preserve PR #35's loading, cancellation, disposal, phase and pause regressions;
  its review remains in [MOVEMENT_PR_REVIEW.md](docs/MOVEMENT_PR_REVIEW.md).
  No mechanical data, generated geometry, phase, motion law or render scheduler
  is changed. No performance measurement or new speed claim is made.

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
