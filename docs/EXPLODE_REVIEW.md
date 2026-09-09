# Reviewed construction separation

9 September 2026. Local implementation of `EXPLODE_GOAL.md`; source geometry, finishes, lighting and all six fitted 10:10 hand poses are preserved. This is a static assembly illustration, not a running watch or service procedure.

## What changed

The former `(z + 2.8) × progress × 4` offset separated each leaf independently in world Z. It pulled pressed jewels out of bridges, opened complete barrels, and displaced side-entering screws across their seats. Focused separation added another unrelated Z/XY offset.

`assets/authored/explosion.json` now accounts for every one of the **223 source movement leaves** with an exact occurrence ID, host, rule, evidence/confidence, local direction, distance and stage. The **21 hosts** retain pressed jewels, pins, Incablocs, cap stones, riveted wheel/pinion packets, complete barrels and delicate spring assemblies. The main plate remains the fixed reference. The rear display bridge composes its own release with its barrel-bridge host once. Broader train, display and keyless packets are explicitly conservative explanatory groupings.

All **49 screws** release toward their larger heads along the actual mounted axes. Forty-six are world-Z mounted; the two radial dial screws and balance-stud clamp are the three exceptions. The two non-Z taper pins remain attached to their spring/stud hosts. The original-STEP probe, exact faces, receiving seats and rejected extraction paths are documented in [EXPLODE_CAD_FINDINGS.md](EXPLODE_CAD_FINDINGS.md).

## Progression and transform ownership

The whole-movement slider follows these overlapping but ordered stages:

- **0–20%:** screws withdraw 2.8 mm along their own mounted axes.
- **20–52%:** outer bridges and the intact regulator lift; the rear display releases before following the barrel bridge. Keyless parts lift by 40% to clear the stem groove.
- **42–72%:** the bare stem withdraws 8 mm along world +X; inner bridges finish clearing their bearings. Ratchets remain associated with their positive-Z screws while barrels stay on the other side.
- **72–100%:** complete barrels, riveted train and pallet packets lift into inspection spacing. The coupling wheel and clutch lift together through the opened split-bearing side after the stem and winding bridge clear.

Focused Uncover and Separate use the same host evaluator. Focused barrel/train sliders use their useful travel range immediately; the winding view retains its prerequisite order. No gear rotation, spring deformation, scale change or illustrative part rotation is introduced. Uncover removes distant opaque host covers, preserving the existing visual language.

Offsets are recomputed from immutable source matrices. Endpoint animation advances the authored progress parameter, so it traverses stages instead of moving all parts simultaneously toward final endpoints. Slider reversal starts at the displayed parameter; switching contexts blends from displayed matrices. Back, Reset, selection outlines and picking retain the existing controller. Manual camera input cancels automatic framing. Framing uses transformed per-part corners to avoid excess padding from one combined world box.

All parts retains its separate 216-member packing contract and exclusions. Separation enters bare Movement with remembered dial preferences; Back/direct dial return restores the exclusive display and fitted 10:10 poses. Original catalog poses and the fitted-only central Lance correction remain separate from explosion transforms.

## Evidence and limits

Reproduction commands:

- `.venv-cad/bin/python scripts/cad/explode_probe.py`
- `node scripts/cad/review-runtime.mjs`
- `node --test tests/experience.test.mjs`
- In `explorer/`: `npx tsc --noEmit`, targeted `npx oxlint` for the edited authored sources, and `npm run build`.

The original-source audit passes **106 analytic checks**, **55 authored checks**, and **90 winding part-pair/stage intersection samples**. The runtime suite passes **59 CPU checks** and the state suite passes **six tests**. The new tests cover exact leaf coverage, source-derived screw polarity, all authored stage boundaries plus 101 progress samples in both directions, host-relative positions, winding prerequisites, source-matrix immutability and displayed-pose continuity. Existing decoded geometry/material/hand/dial regressions remain intact.

The winding audit rejected moving the complete stem/gear packet through the small plate port and detected the setting lever intersecting an early stem withdrawal. The revised stages remove both detected defects. Initial nominal-thread overlap remains: each radial screw starts with about .15870 mm³ common volume against its simplified thread seat and clears at sampled 1 mm withdrawal. The stud clamp clears at .5 mm. This is geometric evidence for the chosen direction, not an unscrewing simulation.

The source coupling-axis residual (~.0071 mm), existing invalid/tiny geometry and duplicate stud placements remain unchanged. Discrete checks cover named pairs; they do not prove continuous swept clearance against every movement leaf. Retained train/display/keyless packets and movement of ratchets opposite complete barrels are explanatory compromises. No physical-device, human-comprehension or expert mechanical certification is claimed.

Local evidence is ignored under `artifacts/explode-cad/` and `artifacts/browser/explode/`. Final responsive and visual results follow. Preview: **http://127.0.0.1:4173/**. No push, merge, deployment or Site upload.


## Final live verification

At **1280×720** and **390×844**, all **7 explosion checks, 21 dial checks and 12 established movement checks pass**. The explosion suite samples both sides and stage/reversal positions, all six mechanisms, interrupted scrubbing, camera takeover, selection/isolation, reduced motion, resources and idle rendering. Target pose error is zero; the largest projected visible-part corner is **0.847458 NDC**, inside the viewport. Stable explosion cycles retain **140 geometries / 8 textures** on the fresh portrait run and the warmed desktop counts recorded in its JSON; both add **zero idle renders**. Other suites warm catalog/outline resources separately.

Direct review covers assembled, release/intermediate/full separation from both sides, a pointer-orbited side/oblique view, all six mechanisms, the three non-Z screws close up, complete barrels, regulator spring/bridge and shock packet, and all six fitted 10:10 styles. The final orbit makes the host layers and attached screws readable without additional guides or labels. Front-facing depth naturally overlaps in projection; free orbit and isolation provide the intended inspection views. Mechanism framing emphasizes its members, so the dim surrounding plate can extend outside the focused viewport.

At **320×740**, document width remains 320 px. The slider responds to arrow/End keys, the dial choice responds to Space, and Escape closes the sheet with focus returned to Dial & hands. A direct separation→Back sequence restores the remembered small Pear display at **10:10:00**, with **zero display-pose error**. Graphics loss/restoration at 52% separation preserves the state and camera, annotations, recovered diamond and finishes. Final browser error log is empty. Physical-device and screen-reader testing remain outside these browser observations.

TypeScript, authored lint and production build pass. The build retains the existing chunk-size notice; linting the broader pre-existing runtime test script also reports two existing regex-style warnings, with no errors. The CPU suite's intentionally unavailable annotation/diamond fixtures log expected errors while passing recovery assertions.

The ignored screenshot gallery is `artifacts/browser/explode/index.html`; numeric evidence includes desktop/portrait explosion, movement and dial reports, source probe output, stage intersection reports, keyboard/focus evidence, separated graphics recovery and exact dial Back restoration. The implementation checkpoint is **a8fbcc2**; this final review is a second local milestone. No push, merge, deployment, Site upload or unrelated `FINISHING_GOAL.md` edit was performed. The original loopback preview remains running.
