# Improve the exploded movement view

Implement this document as your goal. Continue through CAD review, implementation, live visual verification and local milestone commits. Do not stop at another proposal.

## Outcome

Replace the current position-based separation with a deliberate exploded view that explains how the movement is assembled. Parts should travel in directions justified by their actual mounting geometry, remain associated with their host assemblies, and separate in a readable order. The current radial dial screws illustrate the problem: they enter from the side and should withdraw along their own axes, rather than float vertically with unrelated parts.

Keep the accepted visual design and compact controls. Make **Separate** feel like a coherent view of construction, with useful intermediate positions and a natural, exact return. The movement remains static; this is an authored assembly illustration, not a running watch or a simulated service procedure.

## Starting point and boundaries

Read `AGENTS.md`, `PROGRESS.md`, `IMPLEMENTATION_PLAN.md` and `UNATTENDED_RUN.md`. Inspect the actual working tree and running preview before changing anything. At preparation, the latest implementation checkpoint is `3a54c9a` on `codex/watch-polish-finishes`; do not reset to that commit or overwrite later work.

Preserve all accepted finishes, lighting, geometry, source provenance, selection/isolation, mechanism exploration, camera control, loading/recovery and responsive UI. Preserve the exclusive **Movement / Dial A / Dial B** presentations and all six hand styles at **10:10:00**, including the fitted-only correction for central Lance seconds. Keep raw catalog geometry and original occurrence poses intact. Read `docs/HAND_TIME_REVIEW.md`, `docs/DIAL_AND_HANDS_REVIEW.md` and `docs/FINISH_ADJUSTMENTS.md` for these accepted corrections.

This task is local only. Update `PROGRESS.md` and commit each coherent verified milestone locally. Inspect status and staged diffs before every commit; stage only task-owned files. Do not push, merge, deploy, upload a Site, redistribute CAD, or modify unrelated `FINISHING_GOAL.md`. Never use `gh`. Reuse the running preview at **http://127.0.0.1:4173/** and keep it running for review.

## Inspect the actual separation system

The current whole-movement separation uses `layerOffset(z, progress) = (z + 2.8) * progress * 4` in `explorer/src/experience/state.ts`. `MovementViewer.retarget()` applies that along world Z to every part. Mechanism component separation adds further Z displacement and XY displacement from a group target. Those are visualization heuristics, not verified extraction paths.

Review `explorer/src/viewer/MovementViewer.ts`, `explorer/src/experience/state.ts`, `catalog.ts`, `spread.ts`, `assets/authored/mechanisms.json` and the actual React controls. Trace Separate, mechanism Uncover/component separation, retargeting, pose interpolation, bounds/framing, picking, history and recovery. Fix their shared transform ownership rather than adding a competing explosion layer.

**All parts is a separate inventory layout:** preserve its 216-member packing contract, exclusions and interactions. Do not turn this task into a redesign of that layout. Preserve the rule that separation enters bare Movement while remembering dial preferences; Back/direct dial return must restore the correct exclusive dial and 10:10 poses.

## Audit mounting directions and meaningful groups

Reuse the original STEP, cached geometry, assembly manifest, existing analytic probes and `.venv-cad`. Do not reinstall tools, reacquire the whole source library or regenerate assets without a concrete need. Preserve source hashes and keep generated evidence separate from hand-authored rules.

Create an explicit review of every movement leaf affected by separation. Assign each a host assembly, motion rule, evidence and confidence, or a documented reason to remain attached. Use exact occurrence IDs, not broad name matching. Shared definitions can have different mounted directions.

Start with these exact radial dial screws, both d201:

- `p_0_1_1_1__0_1_1_1_4__0_1_1_83_54__0_1_1_194_11`
- `p_0_1_1_1__0_1_1_1_4__0_1_1_83_54__0_1_1_194_12`

Verify their cylindrical/thread/shank axes and outward extraction sign from actual geometry and surrounding seats. Check all other non-Z fasteners and fittings as well; this is not just a two-screw patch. A source local axis or bounding-box center alone does not establish the correct direction. Use analytic geometry transformed by the original occurrence matrix, supported by source views and mating geometry.

Distinguish removable fasteners, plates/bridges, wheels and arbors, pressed jewels/bushings/pins, delicate springs, complete barrel units and other coherent subassemblies. Keep pressed or inseparable elements with their host unless there is evidence and a clear explanatory reason to separate them. Avoid scattering every CAD leaf independently. Do not infer that a CAD hierarchy is necessarily a service disassembly order.

Record the reviewed rules in a hand-authored manifest under `assets/authored/`, with stable memberships, coordinate spaces, local extraction direction, host relationship, distances/stages and evidence. Unknown connections should stay coherently attached or use a clearly documented conservative rule—not an arbitrary radial fallback. Do not claim mechanical certification.

## Implement coherent motion

Use a deterministic, reversible staged progression from the existing slider:

- Release fasteners along their mounted axes, including radial or tilted ones. Where useful, release them relative to their host before that host lifts, then keep them associated with it.
- Separate supported plates/bridges and coherent mechanism units in a comprehensible order. Show which components belong together; avoid confusing stacks and unrelated parts crossing through each other.
- Add only the clearance and spacing needed for inspection. Preserve real scale and orientation unless a specific reviewed illustrative rotation is necessary. Do not simulate unscrewing helices or animate gears/springs.

Derive transforms from immutable source matrices and reviewed assembly relationships; never accumulate deltas between frames. Compose host motion and local extraction correctly so attached components follow their host without double translation. Keep fitted hand presentation transforms separate from source and explosion transforms.

Progress zero must restore the exact source assembly. Intermediate positions must remain usable, stable under reversal, and continuous when a slider is grabbed or a mechanism is changed mid-transition. Manual orbit/pan/zoom must retain camera ownership. Fit the actual resulting bounds without sudden jumps or clipping. Picking, outlines and isolation must follow displayed geometry. Respect reduced motion and render on demand.

Use the existing interface and visual language. Add guides or labels only if visual review demonstrates they help; avoid a permanent sidebar, large amounts of copy, or exposing audit details in visitor controls.

## Verification and completion

Add meaningful actual-source tests for extraction axes/signs, exact occurrence coverage, host-relative movement, stage ordering and source-matrix preservation. Protect the two radial screws explicitly. Sample the whole progression and reversals; test stage boundaries rather than just endpoints. Inspect potential intersections during extraction using geometry evidence, and report any remaining illustrative compromises without calling an unproven path collision-free.

Run `node scripts/cad/review-runtime.mjs`, `node --test tests/experience.test.mjs`, TypeScript, lint for edited authored files and the production build in `explorer/`. Update previous heuristic-specific assertions to the new verified contract; do not weaken unrelated regressions to make the checks pass.

In the live browser, review the assembled view and multiple intermediate/full separation positions from both sides and oblique angles. Inspect radial screws close up, other non-axial fasteners, host assemblies, delicate parts, and each affected mechanism. Exercise rapid scrubbing/reversal, mechanism switches, selection/isolation, Back/Reset, All parts, dial return and graphics recovery. Confirm all six 10:10 styles and accepted finishes remain intact.

Check desktop 1280×720, portrait 390×844 and 320px controls, keyboard/focus and reduced motion. Record bounds/framing, exact reassembly, stable resources and no idle redraws. Do not claim physical-device, human or expert mechanical review from browser emulation.

Store before/after screenshots, intermediate sequences and numeric evidence in an ignored local directory. Write a concise `docs/EXPLODE_REVIEW.md` explaining the former defects, reviewed directions/grouping, implemented stages, test results and any unresolved source limitations. Update `PROGRESS.md` and commit verified milestones locally.

Finish only when the exploded view is implemented and visually reviewed as a coherent construction view, the side-entering screws and other audited exceptions behave sensibly, reversal restores the exact assembly, and regressions pass. Report the principal improvements, any explicitly retained compromises, local commits and the running preview URL. Do not leave merely a design proposal or a generic direction change as the deliverable.
