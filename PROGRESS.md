# Current project status

Updated 31 October 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Current review:
[PR #35 findings and evidence boundaries](docs/MOVEMENT_PR_REVIEW.md).

## Integration and next action

Fetched `develop` is `8c0a367`, which includes PR #34's staging cleanup and
optimized hosted Bench holders, following PRs #31 and #33.
[PR #35](https://github.com/galind/zweigesicht-1/pull/35) targets `develop` from
`codex/escapement-clearance-study`; review began at clean `0f7d1ea`.
The owner authorized review fixes and SSH pushes to this existing PR branch.
Its Vercel Git deployment remains disabled. Do not merge, deploy or publish.

Next: push the reviewed loading/verification fixes, inspect GitHub CI on that
exact head and address any failures. Baseline
[CI](https://github.com/galind/zweigesicht-1/actions/runs/41199357937) failed five
Workshop tests because its movement test double lacked `hands.configure()`;
Holder-assets CI passed. The new changes have static diff review only so far.
No local tests, builds, CAD calculations or browser automation were run for this
review. The new CPU regressions and complete checks are delegated to GitHub CI.

## Review changes

- Bench settles the motion sidecar with its other required assets before moving
  meshes into scene ownership. Route exit, failure and supersession regressions
  count disposal of every fixture resource and forbid late controller installation.
- Repair the Workshop movement fixture without weakening load/retry assertions.
- Guard two historical diagnostic runners against double-applying already installed
  display packets; report the historical revisions and current alternative.
- Add an integrated paused-train/hand-resynchronization regression, including
  repeated fitting and a wall-clock jump.
- Correct current documentation and condense this status. No mechanical data,
  generated geometry, phase, motion law or render scheduler is changed. No
  speculative performance optimization or new speed claim is made.

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
