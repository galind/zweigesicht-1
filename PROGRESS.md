# Current project status

Updated 2 November 2026. Setup: [README](README.md). Technical reference:
[architecture](docs/LOCAL_ARCHITECTURE.md). Current review:
[repository review and evidence boundaries](docs/REPOSITORY_REVIEW.md).

## Drag-only placement milestone — CI pending

Started clean at `05cd06423048603b04a811c8d746d6c4b0e499c8`, matching the fetched
SSH branch `codex/watchmaker-chapter-one` and open draft [PR #38](https://github.com/galind/zweigesicht-1/pull/38)
against `develop`. Connected GitHub checks at that exact head passed:
[CI](https://github.com/galind/zweigesicht-1/actions/runs/41517350135) and
[Workshop](https://github.com/galind/zweigesicht-1/actions/runs/41517350131).
Inspected the current implementation, shared Sheet and retained validation before
editing. No unrelated working-tree changes were present.

Ordinary placement now requires an intentional handle drag from Parts. Tap/preview
identification, native row scrolling and the explicit Alternative controls mode
are separate. Persistent capture, continuous CAD thumbnail/crosshair, shared touch
aim offset, reserved feedback space and fixed fixture framing preserve the gesture
and target. Inside-invalid, outside, accepted and cancelled outcomes are distinct;
invalid parts return ready for another drag. Screw-hole identity is resolved before
positioning assistance, without changing provisional P73/P79 identities/order.
Everyday orientation/support setup is removed; [Workshop](docs/WORKSHOP.md) records
the prepared fixture assumptions and historical compatibility boundary.

Runner coverage now requires all three placements through real mouse/native
emulated-touch drags, plus interruptions, destination ambiguity, imperfect input,
alternatives and unchanged saves. Source inspection and `git diff --check` pass;
First runner pass at `4f108f7` found a new projection assertion failure and a
synthetic pointer-cancellation target problem in the browser harness. Correcting
the harness exposed a real stale-world-matrix issue: fitted meshes disable local
automatic updates, and Three’s bounds walk does not force their world matrices.
Groups now explicitly refresh world matrices before bounds/seat projection, without
changing source local matrices. The independent runner projection does the same.
Revision `93752c1` passes [CI](https://github.com/galind/zweigesicht-1/actions/runs/41524666156)
(166 tests, asset validation, TypeScript, lint, both builds). The browser run reached
all three successful desktop drags and the cancellation/wrong-hole checks, then
exposed an ambiguous wrapped-select label in Alternative controls. The destination
now has an explicit label/control association; full browser verification is next. No local tests/builds/browser automation, model
changes/downloads, merge, deployment or publication. Human visual/accessibility,
physical-phone and Marco review remain pending. No release gate is cleared.

## Canonical movement-only Workshop

The user has promoted the presentation prototype to `/workshop` and retired the
previous chapter interface. The Separate stem view, switch and destination are
removed. `/workshop/prototype` and `/workshop/assembly` redirect to the canonical
route; the homepage entry is unchanged. Old difficulty queries open the same view.

Practice now starts at an explicit prepared-movement checkpoint (cursor 12) and
covers the winding bridge and its two screws. This replaces the stem-only fixture
with useful movement placements; it does not simulate insertion or preceding
operations. Source geometry/materials/fitted matrices remain unchanged. The UI
labels this as practice, with memory-only progress that resets on reload.

The old chapter UI, renderer, styles, drag helper and browser workflow are removed.
Lesson/session records and compatibility tests remain; existing saves are untouched.
The prior implementation is recoverable at verified `d4b5bcf`. The current viewer
has one active assembly, direct placement without hand tools, Parts search and
availability filters, and the existing phone-sheet/cancellation/tap/keyboard flow.
[Current scope and review limits](docs/WORKSHOP.md) supersede earlier entries below.

Application/check head `88397ca1275efdd8c29192d1f0899ea0ef93a8bd` passed:

- [GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41516629391):
  164 retained tests, chapter-asset validation, TypeScript, lint and both builds.
  Three retired-renderer tests were removed with the old implementation; the
  current renderer's fitted-matrix, membership and framing regressions passed.
- [Workshop interactions](https://github.com/galind/zweigesicht-1/actions/runs/41516629487):
  desktop, 390 px and 320 px; three placements, invalid part, native mouse/touch
  drag cancellation, keyboard/tap placement, search/availability filters, reset,
  both retired-path redirects, old difficulty links and byte-identical chapter
  storage. The Separate stem and old Resume chapter controls are absent.
- Source inspection and `git diff --check`. No local tests, builds or browser
  automation ran. No asset or screenshot publication.

Human visual/accessibility and physical-phone review remain pending. No merge,
deployment or publication. The following commit updates verification documentation
only; the tested application/check head is recorded above. Next: review `/workshop`.

## Prototype: direct placement without hand tools

The presentation prototype at `/workshop/prototype` no longer asks for hands,
tweezers or a screwdriver. Tool state, controls and the prerequisite are removed;
a chosen part can be dragged directly from Parts to the assembly. Tap/keyboard
placement and cancellation remain available. Placement options retain the existing
orientation/support choices. Tool checking is explicitly disabled only for the
prototype; no correct tool is silently selected. The full chapter's default
validation, lesson and compatible saves retain their previous behaviour.

Application/check head `dcf32acce183fa8209b5a2c8e7ca18f3332d5360` passed
[GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41514134689):
167 tests, chapter-asset validation, TypeScript, lint and both builds. The
[prototype walkthrough](https://github.com/galind/zweigesicht-1/actions/runs/41514134667)
passed desktop, 390 px and 320 px without opening setup or choosing tools,
including invalid choices, drag cancellation, tap/keyboard placement and save
isolation. A regression verifies that only the tool prerequisite is omitted;
all other placement checks and the chapter's default tool requirement remain.
The [retained chapter regression](https://github.com/galind/zweigesicht-1/actions/runs/41514134742)
passed all 15 operations with desktop, keyboard and native emulated touch.

Source inspection and `git diff --check` pass. No local tests, builds or browser
automation ran. Human visual/physical-phone review remains pending; no merge,
deployment or publication. The following commit updates this verification record
only; the tested application/check head is identified above.

## Assembly presentation prototype — review checkpoint

Started clean at `eba5243cdf0dc9590429922b6ce696234fcc753f`, matching SSH
`origin/codex/watchmaker-chapter-one` and open draft PR #38. Read the original
workbook and inspected homepage, Explorer/component browser, Sheet, rendering and
chapter implementation before editing. Workbook hash matches recorded provenance.

`/workshop/prototype` now isolates a two-placement, memory-only review checkpoint.
Large active movement/separate-stem views use Explorer's source-frame materials,
lighting, perspective bounds-fit and contact shading. Parts is a searchable,
grouped Sheet with real CAD previews and installed/available states. Preview drag,
explicit tap/keyboard destinations, cancellation, invalid-choice feedback and
phone bottom-sheet handoff use the existing validator. View switching preserves
ownership and progress. The full chapter, lesson/session schema and saves are
unchanged. No new CAD, animation, cushion or mechanical behaviour was added.

[Prototype notes](docs/ASSEMBLY_PRESENTATION_PROTOTYPE.md) distinguish Marco's
leather-bench instructions and later holder introduction from our early support
exchanges and mandatory-tool interpretations. Migration stops at this prototype.

Application/check head `c31800ecdcfb051595f03e20b13da912991c8768`:

- [GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41511482884)
  passed 166 tests, chapter-asset validation, TypeScript, lint, production and
  Vercel builds. New geometry regressions check exact fitted matrices, exclusive
  ownership, absence of loose scene inventory and useful projected framing.
- [Prototype interactions](https://github.com/galind/zweigesicht-1/actions/runs/41511482921)
  passed at 1440 × 900, 390 × 900 and 320 × 740: search/inventory,
  installed status, real previews, non-mutating assembly switching, keyboard
  selection/cancellation, invalid part/destination, menu-to-assembly mouse/native
  emulated touch drag and cancellation, keyboard/tap placement, checkpoint
  completion/reload and byte-identical existing chapter storage. The surface
  heights after placement were 616, 601.5 and 441.5 px respectively.
- [Retained chapter walkthrough](https://github.com/galind/zweigesicht-1/actions/runs/41511482987):
  all 15 operations passed through desktop, keyboard and native emulated touch,
  including invalid attempts, cancellation, Undo, timing, pause/reload/resume,
  completion, restart, required-holder failure/Retry and legacy compatibility.
- Source inspection and `git diff --check` passed. No local tests, builds or
  browser automation ran. The retained chapter implementation and existing asset files are unchanged
  from the starting revision. No model or screenshot artifacts were published.

Human visual comparison with Explorer, accessibility and physical iOS/Android
review remain pending, separately from automated evidence. Full migration is
explicitly deferred until this first milestone has been reviewed visually.
No merge, deployment, publication or release-gate clearance. The following
milestone changes review documentation only; the tested application/check revision
is identified above. Next: human prototype review at `/workshop/prototype`.

## Workshop interface simplification

Started clean at `c8559127e9abc6b93dd29873f6165a936af7b3d4`, matching the fetched
SSH branch `codex/watchmaker-chapter-one` and draft PR #38. Inspected the actual
homepage/Explorer, shared site chrome, Sheet component and global styles first.

The workshop now reuses the site's typography, neutral colours, glass surfaces,
text buttons, Lucide icons, menu rows and Sheet behaviour. The green mat is the
working surface within that frame. One instruction and one feedback area replace
repeated guidance; score/time are in the menu and progress is a quiet count.
A selected part has one compact action row with **Place…**, cancellation and,
for assemblies, turning/support choices. All three destinations remain explicit
in the contextual panel. Decorative captions, permanent placement rings/buttons,
floating part labels, the separate zoom strip and superseded CSS are removed.
Tools and Undo stay in the dock; pause/help/menu stay in the header. Restart,
zoom and technical review controls remain easy to find in the menu.

The 15-operation lesson, session/save schema, validator, scoring, timing and
geometry/materials/fitted transforms/supports are unchanged. The renderer change
is accessible instruction copy only. No choices are inferred from the next answer.

Part targets retain touch dragging and 44 px minimums. Loose parts take priority
over larger assembly/support hit rectangles; supports take priority during
explicit support selection. The action row reserves space so selecting or
dragging does not move the geometry.

Application/check head `60445c2114a76ae20832099886be26230d6c041f` passed:

- [GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41357741301):
  164 tests, chapter-asset validation, TypeScript, lint, production and Vercel builds.
- [Runner-hosted Chromium checks](https://github.com/galind/zweigesicht-1/actions/runs/41357741463):
  all 15 operations through desktop pointer input, keyboard placement, 390 px
  native emulated touch dragging, and a second complete chapter through native
  taps and explicit destinations at 320 px. Desktop rejects eight deliberate
  mistakes. Cancellation, Undo without repeated rewards, active timing,
  pause/reload/resume, completion, restart, required-holder failure/Retry and
  legacy URLs/saves passed. Contextual controls, help discovery, placement
  cancellation/focus restoration, actual drag-start hit identity, touch-action,
  44 px targets and viewport containment are checked. Mat height was 525 px at
  390 × 844 and 421 px at 320 × 740, with no scrolling control form.
- Source inspection and `git diff --check`. No local tests, builds or browser
  automation ran. Only existing hash-verified approved holder assets were reused
  on the runner; no models or screenshots were published.

Human visual/accessibility review, first-time-user assessment and actual iOS/
Android phone play remain pending, separately from the automated evidence.
Marco’s mechanical review and all release gates remain open. No merge,
deployment or publication was performed. The following milestone changes review
documentation only; the tested application/check head is identified above.

## Assembly surface redesign

Started clean at `4c1542a` on `codex/watchmaker-chapter-one`, matching the fetched
SSH remote and draft PR #38. The workbook was read again and matches the
recorded SHA-256. The design is our interpretation, not Marco-approved.

`/workshop` now presents one muted green bench with grouped, selectable CAD
geometry, an empty initial centre, a compact illustrated tool strip and one
instruction. The movement and separately assembled stem stay on the same
surface. Turn over, pick a support and seat/return are explicit player actions;
wrong parts, tools, orientations, supports and destinations remain possible.
Hover/focus/tap names, drag previews, near-action feedback and a visible spatial
non-drag path replace the inventory buttons and placement form. Pause, Undo,
restart and zoom remain available. Technical notes, radius and seat hints are
behind Workshop menu → Development / review.

The lesson, session/schema, all 15 operations, source geometry/materials/fitted
matrices, downloaded holders and seating records are unchanged. The prepared
plate, separate stem and deferred Incabloc boundaries are retained. Existing
chapter saves remain compatible. The title and homepage entry placement are
unchanged. No running-movement animation is loaded by the chapter.

Portrait geometry layout, 44 px part/tool targets, fixed action-strip height,
pointer capture and scrolling prevention support touch. Tool taps select on
native release because Chromium can suppress the compatibility click after a
drag; duplicate clicks are ignored and keyboard activation remains available.
Renderer callbacks update before paint and redraws coalesce to one frame.

Application/check head `966f1906debb65f0352600999633c7bd170e831a` passed
[GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41350761734):
164 tests, chapter asset validation, TypeScript, lint, production and Vercel builds.
The [runner-hosted browser checks](https://github.com/galind/zweigesicht-1/actions/runs/41350761693)
passed the complete desktop pointer chapter (including eight deliberately wrong
attempts), keyboard path, native 390 px touch chapter and 320 px completed/loose-part
layout checks.
The browser suite uses independently projected CAD bounds and real pointer input
for all 15 operations, plus wrong-attempt, cancellation, Undo, timing/save,
restart, missing-holder Retry and legacy-link checks. It publishes no assets or
screenshots. Source inspection and `git diff --check` pass. No local tests,
builds or browser automation were invoked for this work.

Responsive implementation and Chromium emulation are verified separately from
actual-phone qualification, which remains open. Human visual/accessibility
review and Marco's mechanical review remain outstanding; the detailed review
checklist is in [chapter notes](docs/ASSEMBLY_CHAPTER_ONE.md). No mechanical or
release gate is cleared. No merge, deployment or publication was performed.

## First playable assembly chapter

Started clean at fetched `develop` / HEAD
`d39213b1efd275d3aaa37259a4f3c826711c136e`; PR #37 was already merged.
The prior progress document lagged the checkout. Current branch:
`codex/watchmaker-chapter-one`; Vercel Git deployment is disabled for this branch.
No merge, deployment or publication is authorized by this work.

Workshop now opens Marco’s **Be a watchmaker!** directly at `/workshop`.
The homepage invitation sits directly above “Explore it in first person”, sharing
its card style and arrow; the old header placement and CSS are removed.
The entry, chapter heading and page metadata now use “Be a watchmaker!”.
This copy-only rename was checked by source inspection and `git diff --check`.
`/workshop/assembly` redirects there, and old
difficulty query parameters open the same chapter. Easy/Hard, their chooser,
renderer, dependency rules, migration code, pose manifest, CSS and obsolete
tests/browser scripts are removed. Historical evidence and reproduction scripts
remain tied to their recorded revisions. The 22 fitted matrices now come directly
from the CAD manifest; they were verified identical to the retired pose manifest.

The chapter covers exactly Tabelle1 rows 5–19, ending with
the winding bridge's second screw. It uses a separate lesson/session, an empty
central starting area, original movement geometry/materials/fitted transforms,
the existing two hash-checked holders, and one surface for the movement and
separately assembled stem. No first-person controller or running animation is
loaded by this route. Existing Easy/Hard browser saves are left untouched and
are not read or migrated by the chapter.

Sequence, tool, orientation, support, destination and 5 mm placement validation
are explicit. Wrong committed attempts cost −2 once; each operation earns +10
once. Undo keeps the reward ledger. Resume, restart, cancellation, interrupted
loading/graphics and active-only timing use the chapter session.
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

Cleanup application head `80cd1d63ffa93272ee151c33457acdb7a0f68b35` passed
[GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41342184271):
163 retained tests, chapter asset validation, TypeScript, lint, production and
Vercel builds. The [runner-hosted Chromium walkthrough](https://github.com/galind/zweigesicht-1/actions/runs/41342184268)
also passed: direct homepage entry, a real support drag and cancelled drag, all
15 operations through the keyboard placement path, wrong-tool feedback, Undo
without repeated reward, pause/reload/resume, completion, legacy-save isolation,
required-holder failure/Retry, old difficulty links and the prototype URL redirect.
The check reuses the existing approved UAT holder GLBs with recorded hash
verification; no new assets or screenshots were published.

The 12 added CPU regressions cover the full sequence, error dimensions,
component counts, holder/orientation changes, separate stem ownership,
scoring/Undo/duplicate releases, save/resume, timing and unchanged fitted matrices.
Static inspection and `git diff --check` pass. No local tests, builds or browser
automation ran; only source inspection and formatting ran on the owner's computer.
Human visual/usability, actual-device and Marco's mechanical review remain open.
Workshop has responsive phone layouts and pointer-based touch dragging; real-phone
playability is not yet validated. First-person Bench requires keyboard/mouse.
Homepage invitation head `90eb1cfcf81ade7e23380317ce5ce9e374e486a5` passed
[CI](https://github.com/galind/zweigesicht-1/actions/runs/41343703685) and the
[desktop Chromium chapter walkthrough](https://github.com/galind/zweigesicht-1/actions/runs/41343703680).
The updated multi-viewport loading/layout script was inspected but not rerun;
phone visual and touch review remains open.

[Draft PR #38](https://github.com/galind/zweigesicht-1/pull/38) targets `develop`.
Next: Marco reviews `/workshop` on this branch, especially tool
assignments, screw order, prepared components, partial-assembly holder
contact/stability and 5 versus 10 mm placement. No merge, deployment or
publication was performed. The PR records final-head check results; this
verification snapshot identifies the tested application head explicitly.

## Previous integration evidence

PR #37 simplified viewer state and guarded interrupted transitions. Application
head `602574a` passed [GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41326731178):
198 tests, inventory validation, typecheck, lint, production and Vercel builds;
[holder-assets validation](https://github.com/galind/zweigesicht-1/actions/runs/41326731213)
also passed. These are prior-review results, not chapter verification.

## Current illustration and retained limits

Explorer and assembled Bench share prescribed **3 Hz /
21,600 beats per hour** escapement/train motion, all seven display packets and
[current-local-time fitted hands](docs/CURRENT_TIME_HANDS.md) on both displays.
The 93/137 and 214/217 sticking assumptions, balance amplitude, recoil, existing
hairspring path, authored phases, fittings and materials are retained.

Explorer separation holds the last train/barrel/hairspring and hand pose relative
to presentation, resuming only at displayed zero separation. Inventory restores static endpoints; the assembly chapter is static throughout. Hidden time is excluded; hand wall-clock
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
