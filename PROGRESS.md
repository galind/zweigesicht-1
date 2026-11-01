# Current project status

Updated 1 November 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Current review:
[repository review and evidence boundaries](docs/REPOSITORY_REVIEW.md).

## First playable assembly chapter

Started clean at fetched `develop` / HEAD
`d39213b1efd275d3aaa37259a4f3c826711c136e`; PR #37 was already merged.
The prior progress document lagged the checkout. Current branch:
`codex/watchmaker-chapter-one`; Vercel Git deployment is disabled for this branch.
No merge, deployment or publication is authorized by this work.

Implemented `/workshop/assembly`, entered as **Be a watchmaker: Assembly** in
Workshop's chooser. The chapter covers exactly Tabelle1 rows 5–19, ending with
the winding bridge's second screw. It uses a separate lesson/session, an empty
central starting area, original movement geometry/materials/fitted transforms,
the existing two hash-checked holders, and one surface for the movement and
separately assembled stem. No first-person controller or running animation is
loaded by this route. Existing Easy/Hard saves and dependencies are unchanged.

Sequence, tool, orientation, support, destination and 5 mm placement validation
are explicit. Wrong committed attempts cost −2 once; each operation earns +10
once. Undo keeps the reward ledger. Resume, restart, cancellation, interrupted
loading/graphics and active-only timing are handled separately from Workshop.
The review radius can be changed to 10 mm. Keyboard exact-seat placement uses
the same lesson validator. Completion means chapter completion only.

[Chapter notes](docs/ASSEMBLY_CHAPTER_ONE.md) record the exact mappings and
[reference provenance](assets/source-manifest/assembly-chapter-one.json).
Prepared plate: 11 fixed plate/pin/jewel leaves; all five Incabloc leaves and two
later cap-plate screws are deferred. Final chapter: 22 distinct movement leaves.
Tool assignments, prepared subtree boundaries and bridge-screw numbering
(P73 then P79) remain provisional. The stem order follows Marco (wheel before
sliding coupling), independently of the old DAG. Holder orientation uses recorded
12.2/16.3 mm seats and exchanged intact supports; fit/stability of these partial
assemblies and insertion paths remain unverified. No geometry is changed to
conceal uncertainty.

Verification in progress: regression coverage added for the full sequence,
error dimensions, component counts, holder/orientation changes, separate stem,
scoring/Undo/duplicate releases, save/resume, timing and scene ownership.
Static inspection and `git diff --check` are the local checks. No local tests,
builds or browser automation have run. GitHub CI will provide executable
verification; results will be recorded before handoff. Human visual/usability
and Marco's mechanical review remain required.

Next: GitHub CI, then Marco's review of the playable chapter, tool assignments,
screw order, prepared components, holder contact/stability and placement radius.

## Previous integration evidence

PR #37 simplified viewer state and guarded interrupted transitions. Application
head `602574a` passed [GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41326731178):
198 tests, inventory validation, typecheck, lint, production and Vercel builds;
[holder-assets validation](https://github.com/galind/zweigesicht-1/actions/runs/41326731213)
also passed. These are prior-review results, not chapter verification.

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
