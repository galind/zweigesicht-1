# Running movement — future work blocks

Prepared 12 September 2026 at the user's request. Status: planning only; every implementation block below is not started. This document is the starting point for future running-movement work. It does not reopen the completed static-explorer scope or authorize implementation, publication, source redistribution, or contacting external reviewers today.

## Intended outcome

Extend the accepted explorer with a coherent running movement: the connected barrel-to-display chain, a visible working escapement, and a breathing hairspring. Essential moving components must remain present. Preserve the existing appearance, part inspection, independent dial choices, separation and source provenance.

The proposed method is deterministic, prescribed mechanical animation supported by geometry, references and review. Given time and an operating state, the application evaluates the pose directly. A physically predictive simulation of torque, friction, lubrication, elastic energy and timekeeping accuracy is outside this plan. Any authored approximation must be identified in the evidence and in relevant optional visitor details.

“Complete” means all parts have a motion classification and every required moving connection is implemented. It does not mean every component moves: plates and supports stay fixed; winding, setting and shock response have separate conditions.

## What we can reuse

- The real-CAD catalog, stable source IDs, source transforms, materials, both fitted displays and existing interaction/verification infrastructure.
- [Mechanical review](MECHANICAL_REVIEW.md) and [retired motion evidence](../assets/authored/motion-evidence.json): useful pivot, membership and tooth-count investigations, with explicit limits. These are historical engineering findings, not validated runtime parameters.
- [Animation review](ANIMATION_REVIEW.md): the previous implementation drove five shafts but hid contact parts and the hairspring, and left the upstream supply and displays undriven. Reintroducing it is not completion of this plan.
- [Hand pose review](HAND_TIME_REVIEW.md) and [independent dial review](INDEPENDENT_DIALS_REVIEW.md): fitted hand bases, bore axes, style corrections and current display semantics. The earlier exclusive-dial behavior is superseded by independent display preferences.
- Existing mechanical probes under `scripts/mechanics/`. Check their inputs and reproducibility before relying on old local output.

No new mechanical research has been performed for this planning document. Source findings below refer to the recorded project investigations; future work must verify their applicability to the current assets.

## Sequence and checkpoints

| Block | Reviewable output | Dependency | Current status |
| --- | --- | --- | --- |
| M0 — Evidence and coverage | Source-linked motion inventory, unknowns and agreed validation tolerances | Current repository and local CAD | Not started |
| M1 — Motion foundation | Deterministic evaluator and isolated inspection harness | M0 | Not started |
| M2 — Escapement cycle | Complete rigid-part cycle with contact evidence | M1 | Not started |
| M3 — Hairspring | Constrained deformation over the chosen amplitude | M1; shared amplitude/phase contract with M2 | Not started |
| M4 — Regulation proof | Balance, spring and escapement running together in context | M2 + M3 | Not started |
| M5 — Train and barrels | Connected energy-to-escapement motion | M4; M0 graph | Not started |
| M6 — Both displays | Both motion works and all supported hand styles synchronized | M5 | Not started |
| M7 — Explorer integration | Playback controls and predictable existing interactions | M6 | Not started |
| M8 — Whole-movement qualification | Coverage, mechanical review and sustained device evidence | M7 | Not started |
| X1 — Winding and setting | Explicit conditional operating demonstrations | M8, unless deliberately reprioritized | Deferred extension |
| X2 — Shock and reset | Explicit event-driven indicator demonstration | M8 and variant evidence | Deferred extension |

Recommended order: M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8. M2 and M3 can be developed independently after their common input contract is fixed; changing amplitude or phase requires both to be rechecked. Research on later blocks can continue while a review is pending, but a pending review must not be recorded as passed.

M4 is the decisive feasibility checkpoint. Review the hardest mechanism with all essential components present before investing in full-chain implementation. A failed checkpoint should identify a concrete geometry, reference or modeling problem and the next experiment to resolve it.

## M0 — Establish the mechanical evidence and coverage

**Work:** Reconcile the current source/catalog with the historical audit. Map each relevant instance to fixed, continuously driven, conditionally driven, deforming, or unresolved. Record shafts, rigid members, pivots, axis conventions, tooth counts, mesh types, couplings and operating conditions. Distinguish CAD hierarchy from mechanical connections. Include both barrels, their connecting transmission, both display trains, all supported hand variants and spring attachments.

**Deliverables:** A versioned coverage table and mechanical graph; a reference/unknowns register; a short review checklist identifying where external watchmaking judgment is needed. Each numerical parameter needs units, source IDs, derivation, confidence and review status. Preserve source URLs/hashes in `assets/source-manifest/`.

**Acceptance:** Every current instance is classified or explicitly unresolved. The intended energy-to-display paths are enumerated, with missing connections visible. Define geometric/contact/anchor tolerances from source precision and intended close-up scale before evaluating them; do not choose tolerances merely to pass an experiment. Separate supported measurements from guessed operating behavior.

**Resume prompt:** “Start M0 in docs/RUNNING_MOVEMENT_PLAN.md. Reuse the current CAD and audit, produce the coverage/unknowns records, and report readiness for M1.”

## M1 — Build the motion foundation

**Work:** Add a local development harness with one mechanical clock, direct timestamp evaluation, pause, seek and phase inspection. Preserve immutable source and fitted-display bases. Define composition of mechanical motion, deformation and presentation transforms, including the corrected Lance seconds-hand placement. Apply a shaft delta once to each rigid member.

**Deliverables:** A small evaluator/data contract, harness and meaningful transform/timing checks. Keep new parameters separate from the retired evidence file. Prototype controls do not need to enter the visitor UI yet.

**Acceptance:** Identical timestamps yield identical poses after seeking, frame-rate changes and pause/resume. No accumulated transform drift or doubled rotations. Source inspection restores exact source bases; fitted displays restore their reviewed fitted bases. Invalid time is handled explicitly. A harness demonstration is labeled an experiment, not a complete running watch.

## M2 — Solve the rigid escapement cycle

**Work:** Establish balance, roller/impulse jewel, fork, pallet jewels, safety parts and escape-wheel relationships. Determine running direction, banking limits, phase and the sequence of lock, unlocking, impulse and drop. Resolve source-pose alignment explicitly instead of applying an arbitrary initial balance jump.

**Deliverables:** A full-cycle pose model, annotated key events, contact/clearance measurements and a slow-motion recording from useful close-up angles. Record the limits of prescribed motion versus dynamic simulation.

**Acceptance:** Both half-cycles are checked, including event neighborhoods with sufficiently dense or adaptive sampling. Essential rigid contact parts remain visible. No known unintended overlap or unsupported passage through a locked pallet. Distance zero alone does not establish valid contact: distinguish intended contact from penetration. Escape advance, dwell and balance phase agree with the supported cycle; reviewer uncertainties remain explicit.

## M3 — Model the hairspring deformation

**Work:** Recover a usable ribbon centerline/cross-section representation from the actual source. Preserve the raised overcoil, rotating inner attachment and fixed outer attachment, including terminal orientations. Select a constrained deformation or offline-authored pose family with documented approximation limits. Use M2's intended balance amplitude and phase.

**Deliverables:** Reproducible deformation generation, anchor/length/clearance reports, pose extrema and a continuous close-up recording. Generated assets stay separate from authored constraints and original CAD.

**Acceptance:** Attachments track their hosts; ribbon-length error remains within the justified tolerance; overcoil shape and cross-section remain plausible; no known strip/strip or strip/hardware penetration over the cycle. Check interpolation between authored poses, not just endpoints. Uniform scaling, rigid rotation or the old analytical shear does not qualify as a validated breathing model.

## M4 — Review the complete regulation assembly

**Work:** Combine M2 and M3 in the current renderer, with the balance, spring, escapement and meaningful supporting context visible. Show source-rest and operating poses explicitly. Exercise slow motion, normal speed, seeking and pause at contact events.

**Deliverables:** A locally inspectable regulation prototype, repeatable recordings, an integrated evidence report and revised remaining-work estimate.

**Acceptance:** Spring terminals, rigid contacts and cycle timing remain coherent together. Source finishes remain readable in motion. Engineering checks and user visual review are recorded separately from external mechanical review. Do not pass the mechanical checkpoint by hiding unresolved parts. If external review is unavailable, label the prototype ready for review and continue only work that does not rely on the disputed relationships.

## M5 — Connect the train and twin barrels

**Work:** Extend the supported escapement cadence through every train shaft to the barrel output. Resolve the previously omitted upstream wheel. Establish the series-barrel operating graph, distinguishing drums, covers, arbors, ratchets and mainsprings. Record which components remain stationary in normal running. If springs can be exposed during running, implement and assess their changing winding state as part of this block.

**Deliverables:** Full normal-running transmission graph, evaluated poses and slow-motion plus accelerated inspection views. Define the supported wound-state/playback interval; distinguish a repeating teaching cycle from a claim about full power reserve or unwinding dynamics.

**Acceptance:** Signed ratios, shaft membership, tooth phases and visible engagement have evidence. The train respects escapement locking. No missing upstream link or self-driven moving island. Exposed barrel internals remain coherent throughout the supported interval. Unsupported exhaustion behavior is recorded rather than silently looping an impossible spring state.

## M6 — Drive both displays

**Work:** Implement both motion works and connect fitted hour/minute/seconds hands where present. Reuse reviewed bores, supports and style corrections. Define a display-time offset independently of elapsed playback time, with the existing 10:10:00 presentation as the proposed initial display. Resolve viewing-side direction and phase from the actual gear relationships.

**Deliverables:** Synchronized displays across all supported style combinations, with comparisons at known elapsed times and rollover boundaries.

**Acceptance:** Hours/minutes/seconds agree with the connected train and each other. Verify fractional hour progression, minute/hour/12-hour rollovers, both viewing sides and every fitted style. Switching style, hiding/showing a face or completing a late asset load preserves the same mechanical time. Hands and supports remain coaxial without applying the fitted correction twice.

## M7 — Integrate playback with the explorer

**Work:** Add compact play/pause, slow-motion and inspection controls using the existing dock/panels. Keep UI animation on a separate clock. Preserve current side, dial preferences, materials and selection semantics. Define the following behavior in state tests and visitor copy:

- Full or component separation pauses motion at its current phase; reassembly keeps it paused until Play.
- Uncover can retain playback only when it moves covers without disconnecting the operating mechanism.
- Reset view retains current display preferences and side; proposed playback behavior is to pause and preserve mechanical time. A separate restart action returns to the initial playback state.
- Raw source inspection restores source poses; leaving it restores the saved paused operating pose. Fitted display inspection retains the appropriate fitted operating pose.
- Hidden tabs freeze playback and rebase the clock on return. Reduced motion starts paused. Late loading, Back, recovery and mechanism changes do not silently reset time or restart motion.

**Deliverables:** Integrated local experience, concise controls and an interaction report. Confirm these proposed semantics against the current app when implementation starts; do not reinstate obsolete timing-footer behavior.

**Acceptance:** Keyboard/touch controls, interruptions, selection, independent dials, All parts, Uncover, Reset, Back and failure/recovery remain predictable. No disconnected moving gears in separated views. Paused and settled scenes retain on-demand rendering. Run the relevant existing source, dial, state and renderer checks alongside new playback checks.

## M8 — Qualify the whole movement

**Work:** Audit every M0 coverage entry against the final runtime; inspect all visible connections across their relevant phase combinations, not just one balance cycle. Use accelerated long-interval evaluation for slow shafts and spring states. Obtain mechanical review of the integrated result and user review of clarity. Measure sustained rendering on recorded real devices in addition to desktop and viewport emulation.

**Deliverables:** Final coverage/evidence matrix, review findings and resolutions, device/performance report, reproducible local demo and clearly bounded fidelity statement.

**Acceptance:** No unexplained moving-part omission; no known incorrect visible coupling or contact; deterministic long-time evaluation and reliable restoration; no growing resources during repeated navigation; acceptable sustained performance against explicitly agreed budgets. Record actual device/browser versions and thermal-session duration. Build/test success, user appearance acceptance and expert mechanical acceptance are distinct outcomes.

This finishes the normal-running scope only when its required evidence is recorded. Public deployment and source/derived-CAD redistribution remain subject to their separate existing gates.

## Later conditional demonstrations

**X1 — Winding and setting:** Define crown/stem modes, sliding engagement, ratchet/click behavior, barrel winding and hand-setting couplings. Verify transitions between modes, the behavior of any stopping mechanism actually present, and compatibility with the running state. Deliver each mode as its own demonstrable checkpoint. Normal playback must not continuously move winding/setting controls.

**X2 — Shock and reset:** Confirm the supported indicator variant, moving members, spring response and reset action. Use an explicit user-triggered demonstration with a repeatable starting state. Do not infer quantitative shock sensitivity from CAD or connect browser/device motion by default.

These extensions are outside M8's normal-running acceptance. Each requires a fresh bounded implementation task when wanted.

## Working method and future handoff

Implement one block per bounded task where practical. Before starting, read `AGENTS.md`, `PROGRESS.md`, `IMPLEMENTATION_PLAN.md`, `UNATTENDED_RUN.md`, this plan and the relevant evidence documents. Inspect the worktree and reconcile current app behavior before editing. Reuse existing assets and tools; do not restart source acquisition without a demonstrated need.

For every block, record: status, implemented scope, source IDs/parameters, commands and evidence locations, checks performed, unresolved questions, review status and next executable action. Store review documents under `docs/` and large generated reports/recordings under ignored `artifacts/mechanics/running-movement/<block>/`. Keep original CAD, environments and caches out of Git. If local evidence is missing on another machine, regenerate it using the recorded source hashes and commands.

Commit each coherent verified checkpoint after inspecting status and the staged diff. Update `PROGRESS.md` and this status table together. Push only when the active task authorizes it; use Git over SSH and the connected GitHub app for API work, never `gh`.

Do not attach firm calendar promises to these blocks yet. M0 should estimate the first proof; M4 should revise the remaining effort using actual contact/deformation results and reviewer availability. The earlier “several weeks” assessment is a rough planning judgment, not a delivery commitment. External review waiting time is separate from implementation effort.

**Next executable action, when the user resumes:** M0 only. Produce the evidence/coverage checkpoint and a concrete M1 brief. No implementation or recurring task is started by this document.
