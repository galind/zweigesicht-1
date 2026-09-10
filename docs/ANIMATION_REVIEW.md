# Animation decision — retain the static explorer

> Appearance update, 9 September 2026: [COMPONENT_APPEARANCE_AUDIT.md](COMPONENT_APPEARANCE_AUDIT.md) records the complete later audit and authentic maker STL diamond recovery. Original assembly STEP emptiness remains a source fact; statements below about missing viewer diamond geometry and prior material coverage are historical. Running/timing remains disabled.

9 September 2026. **Running/timing is removed.** The local experience preserves the original movement at rest, the refined materials, both sides, orbit/zoom, selection/isolation, full source catalog and explanatory reveal/separation transitions. This satisfies the explicitly authorized static-explorer outcome. Nothing was published, deployed, uploaded or pushed.

The inspected baseline is commit `215be75c3a6fcdb29acaa1af2952b716d25ee7c7` with a clean tracked working tree. Earlier progress entries and reviews describe historical milestones; their acceptance of a bounded timing illustration does not satisfy this review's whole-watch criterion.

## Evidence and method

The actual existing `http://127.0.0.1:4173/` website was opened and inspected **before source edits**. Read AGENTS, PROGRESS, IMPLEMENTATION_PLAN, UNATTENDED_RUN, mechanical and implementation reviews, finishing/material implementation reviews and the local architecture. Traced the controller, clock/evaluator, state, UI, WebMCP, mechanism membership, source manifest and retained mechanical evidence. Reused the original source and prepared assets; no geometry generation or reacquisition.

All screenshots and machine evidence remain ignored/local under `artifacts/browser/animation-review/`. The original code snapshots and a 365-leaf inventory with full source IDs, original world matrices, animation assignments and timing omissions are preserved there. `evidence-manifest.json` records file hashes. This is engineering and browser evidence, not watchmaker certification.

| Evidence | What it establishes |
|---|---|
| `before-assembled.png`, `before-regulation-source.png` | Original finished movement and source-pose escapement before edits |
| `before-regulation-timing-zero.png`, `before-regulation-playing.png`, `before-regulation-1x.png`, `before-regulation-release.png` | Playback removes the spring and contact mechanism; source-versus-study and release-state comparisons |
| `before-train-release.png`, `before-assembled-timing-{0,60}.png`, `before-dial-timing-60.png` | Focused train and two-sided assembled geometry with a timing clock; the rest of the mechanism is not driven |
| `before-{energy,display,winding,shock}.png` | Remaining mechanism views inspected before removal |
| `before-separated.png`, `before-separation-state.json`, `before-restored-state.json` | Separation pauses the old clock; source return restores original matrices |
| `before-component-motion-inventory.json` | Exhaustive leaf classification, definitions, transforms and omission flags |
| `after-*.png`, `after-interactions.json` | Final browser visual sweep, layout and actual-controller acceptance |

These are screenshots at sampled states, not a continuous recording or collision sweep. The verdict does not depend on declaring an unmeasured tooth collision.

## What actually moved

The old `MovementViewer.applyPose` evaluated **19 source leaves on five shafts** whenever `study` was true. Two of those leaves were invisible, leaving 17 potentially visible moving leaves, further restricted by the current reveal. Every other source leaf had zero mechanical delta. This includes 346 leaves across the complete catalog, including the empty diamond metadata. No source assembly was dynamically constrained to another.

Below, `P` means `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`; definition numbers abbreviate `d_0_1_1_`. Matching a shaft suffix includes its descendants. World coordinates are original STEP millimetres, with every signed rotation about world +Z.

| Shaft / exact source suffix | Every assigned definition (multiplicity) | World pivot XYZ | Behavior |
|---|---|---|---|
| Balance: `P7__0_1_1_108_1`; collet: `P7__0_1_1_108_2` | Rim 110, eccentrics 111 ×4, impulse jewel 112, staff 113, double roller 114, collet 115 | `(0, -10, -2.65)` | Cosine oscillation ±180°. Jewel 112 and roller 114 receive transforms but are hidden. |
| Escape: `P62` | Wheel 233, pinion/staff 234, hub 235 | `(-1.99989817890187, -4.131405, -4.14)` | Intermittent positive advance |
| Seconds: `P65` | Pinion 242, wheel 243 | `(0, 0, -4.31)` | Negative delta, escape / −9 |
| Third: `P63` | Pinion 237, wheel 238 | `(3.17046045103862, -3.61722, -3.21)` | Positive delta, seconds × −8/75 |
| Minute: `P3` | Pinion 93, wheel 94, hub 95 | `(0, 0, -2.98)` | Negative delta, third × −10/64 |

The immutable manifest matrix is built with `Matrix4.set(...worldTransform.flat())`; imported leaves are reparented to a common scene root, without reapplying the source hierarchy. The mechanical composition was:

`T(presentationOffset) × T(pivotWorld) × Rz(deltaWorld) × T(-pivotWorld) × assembledWorld`

This transform order and the shaft axes have support in the retained cylinder/XCAF evidence. There is no evidence here of a general doubled-transform or wrong-center bug. Source local +Z maps to world −Z for the principal staffs, including the minute and third pinions. Some child geometries are flipped: minute hub 95, third wheel 238 and impulse jewel 112 have local +Z toward world +Z. Applying one world-space delta to each rigid member avoids reversing those individual pieces. The source-phase and absolute running direction remain unvalidated. Changing the viewing side reverses apparent screen direction without changing the signed world rotation.

## Missing motion and omissions

**Ten leaves were forcibly hidden whenever study mode was active, even when paused:** the entire six-leaf pallet assembly `P13` (126, 127, two 128 jewels, 129, 130), impulse jewel 112, roller 114, hairspring 116 and the upstream 26-tooth wheel 96 (`P4`). The omission exists in both `retarget` and `retargetVisibility` in the baseline. The pallet receives no animated angle at all; its audited pivot `(-0.999949089451, -7.0657025, -1.56)` and experimental endpoint proposal were never used by the runtime.

There was no replacement spring, substitute lever or generated gear. Real geometry was removed from visibility. Focused reveal additionally hides nonmembers/noncontext and translates obstructions up to 26 mm before hiding them beyond 24 mm; it darkens surrounding surfaces. This makes a few moving objects look detached, especially when the actual connection between balance and escape wheel is missing. These presentation rules remain useful for static construction inspection and are retained, with the timing-specific omission rules deleted.

The unanimated timekeeping chain comprises:

- Twin barrel drums 85/90, covers 86/91, arbors 87 ×2 and mainsprings 88 ×2 (`P1`, `P2`). Their series-barrel operating graph and spring deformation are not implemented. Counts alone do not establish how every drum/arbor should move.
- Upstream wheel 96: disappears precisely where it would connect the barrel output to the moving center pinion. The prior review records 2.85 mm axis spacing, consistent with 26/12 teeth at module .15. Hiding it removes the visible contradiction rather than establishing the missing transmission.
- Both motion works: `P20`, `P26`, `P37`, `P40`, `P55`, `P56`, `P57` (cannon-pinion/hour/intermediate wheel assemblies). All remain static. The “Two faces” reveal shows their construction, not functioning displays.
- All hands and dial variants, under source roots `p_0_1_1_1__0_1_1_1_1` and `p_0_1_1_1__0_1_1_1_2`, are catalog-only geometry and have no driver. Selecting them exits the old timing mode. Advancing the central **seconds shaft** is not the same as advancing a seconds **hand**. Neither display was synchronized to the study clock.
- Hairspring 116 needs nonrigid motion with an inner attachment following collet 115 and a fixed outer stud 117/pin 118. The source has a raised overcoil; radial weighting, uniform scaling or rigid rotation is not a supported breathing model. The earlier analytical shear preserves selected anchors but changes ribbon length and is not a validated elastic solution.

Fixed plates, bridges, jewels, screws, spring stud and pin appropriately stay fixed apart from presentation transitions. Winding/setting controls and shock indication must respond to their own operating conditions; their absence of continuous motion is **not** itself a fault. Their unverified conditional motion was not added. Existing catalog/variant exclusions (including setting spring 244 versus default 193) and the empty diamond remain unchanged.

## Directions, ratios, engagement and synchronization

The evaluator used the recorded 3 Hz full balance cycle, six half-swings per second and 20 escape teeth. Each beat advances π/20 radians (9°, half a tooth). A smoothstep release occurs from 42% to 58% of the beat; 84% of the beat is dwell. All four train shafts share this release/dwell clock:

`third = −minute × 64/10; seconds = −third × 75/8; escape = −seconds × 81/9`

Mean rates at 1× are escape +9 rpm, seconds −1 rpm, third +0.1066667 rpm and minute −1/60 rpm. The source geometry count study supports those ratios and the measured center distances (4.81, 4.81 and 4.59 mm). Alternating world signs are internally coherent for external meshes. The default 0.1× makes the balance 0.3 Hz and the seconds shaft one turn per ten real minutes; most of the train consequently looks nearly stationary beside a conspicuously rocking balance. The inspected 1× setting makes that isolated balance movement faster without restoring a power path.

Tooth counts and axis distances do **not** prove engaged tooth phase, backlash, clearance or contact over a cycle. The original source angular offsets are retained without a contact solution. Close-up inspection shows toothed wheels stepping around fixed shafts, but does not establish a particular flank slipping or penetrating. The sparse 30-configuration pallet/escape probe includes zero distances that may mean contact or overlap, not a continuous valid lock–unlock–impulse–drop path. Banking, safety, roller/fork transfer, recoil and spring dynamics remain absent. Slowing or relabeling this cannot convert cadence into mechanical evidence.

The odd impression has concrete causes: a balance oscillates without its spring; an escape wheel starts/stops without its controlling pallet; the upstream connection vanishes; energy storage and both motion works stay still; and close-up/context dimming makes those moving islands look self-driven. Entering study sets time to zero but immediately applies `cos(0) × π` to the balance, a 180° source-relative offset without a mechanical transition. Leaving restores zero offsets. Source geometry and study geometry therefore visibly change both membership and pose. The extra timing footer also reduces the stage height and crowded the lower-left caption/navigation at the inspected desktop size.

## Old controls, exercised before removal

Play/pause and speed changes used one clock. Actual 0.1× and 1× playback, 0.25× playback before separation, cycle Home/ArrowRight seeking and Step beat were exercised. The fourth offered value was 0.05×; its shared scalar path was source-reviewed. Pause freezes the current phase **with the essential omissions still hidden**. The cycle slider writes absolute `phase/3` seconds, so after a long run it jumps back to the first cycle rather than maintaining accumulated train turns. Step adds 1/6 second and pauses. Clock sampling caps a frame's elapsed time at .1 second and rebases hidden tabs; it is a teaching clock, not wall-clock watch time.

Changing mechanisms exits timing. Reassemble clears separation but retains the old paused mechanical phase until Source inspection is chosen; it is not automatically the original source pose. Separation was checked in the reverse assembled train view; the clock stopped and its current time was preserved. Source inspection then returned to matrix error zero. Original screenshot pairs and saved state record these distinctions. Keyboard access was through the controls/slider keys; no global playback shortcut was found.

## Decision and implementation

Keeping playback would require supported series-barrel operation, the upstream connection, phase/engagement evidence, a complete pallet/roller/safety cycle, constrained hairspring deformation and both display drivers/variant decisions. Those are substantive missing mechanics, not a small pivot or speed fix. The available local evidence cannot support the requested coherent working watch, so removal is the defensible completed outcome.

- Deleted the clock/evaluator module, time/speed/study/playing state, study toggling, mechanical rotations and both timing-only visibility branches.
- Removed entry buttons, play/pause, speed/cycle/step controls, event labels, related CSS and timing claims. About now describes static source-pose construction exploration. The train caption describes tracing geometry and ratios.
- Removed timing inputs from WebMCP schema and execution; unknown inputs are rejected before mutation. State normalization also drops obsolete playback fields. No hidden debug route or benchmark can restart watch timing.
- Retained the inspection tools, converting the middle benchmark phase to revealed-mechanism orbit. Frame samples now follow actual presentation redraws rather than a removed playback flag. Source/material handling, local asset paths, camera controls and authored reveal placements are unchanged.
- Replaced motion tests with a regression against obsolete timing inputs; retained the substantive geometry/material/controller checks. Historical research is preserved with an explicit retired status, and earlier reviews are marked as historical.

## Final verification and limits

The 25 actual-source/asset CPU checks pass, including byte-identical original buffers across 339 decoded geometry objects, 222 loaded movement meshes, stable source object identity after catalog ingest, exclusive setting-spring variants and exact source placement. Four current state/presentation tests pass. TypeScript, authored lint and production build pass; the existing large-chunk and Node deprecation warnings remain.

The real-browser six-check suite passes: twenty interrupted reveals return exactly; Uncover reversal restores 221 default visible movement meshes; combined layer/component separation returns matrix error **0**; all ten old omissions are visible; GPU counts remain **138 geometries / 8 textures**; idle adds **0 redraws**. These are browser acceptance checks, distinct from the CPU harness. Final graphics-context loss/recovery restores the reflected Finish view, 27 source annotation definitions, 138/8 resources and exact assembly, with an empty error field.

Visual inspection covers both assembled sides, all six reveals, oblique balance/hairspring/escape macro, Function treatment, component separation/reassembly, original hairspring isolation and Back, optional catalog and front dial/hand variants, and revised About content. Portrait 390×844 and narrow 320×740 are browser emulations; settled mechanism framing and controls are usable. The 390 px document has no horizontal overflow. Full-source dial alternatives can overlap when selecting their parent, as before; no variant is silently substituted.

No new continuous-running benchmark is needed or claimed because playback is removed. Earlier timing benchmarks are historical. No physical-phone/thermal qualification, watchmaker approval, elastic/contact correctness, CAD repair or release permission is claimed. The source's empty diamond, imperfect eccentric faces and variant questions remain; extreme CAD faceting and authored material optics retain their documented finishing limitations.

Preview: **http://127.0.0.1:4173/**. The existing loopback server stays available; restart with `cd explorer && npm run dev`. The next action is local user review of the static explorer. Restoring timing would be a new task requiring the missing full-chain evidence; it is not unfinished work in this outcome.
