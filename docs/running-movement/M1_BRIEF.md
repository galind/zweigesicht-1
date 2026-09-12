# M1 implementation brief and readiness — v1

**M1 completed 13 September 2026: [verification report](M1_REPORT.md).** The brief below records the M0-authored implementation boundary and acceptance criteria. M0 does not provide an accepted contact cycle, elastic solution or complete energy graph. M1 should make those future solutions testable without changing the accepted visitor experience.

Read [M0 evidence](M0_EVIDENCE.md), [unknowns](UNKNOWNS.md), [tolerances](TOLERANCES.md), the current project instructions and [M1 in the plan](../RUNNING_MOVEMENT_PLAN.md#m1--build-the-motion-foundation). Reconcile the working tree before editing. Preserve the current viewer, both independent display preferences, all styles, source identities and immutable fitted/source bases.

## Concrete implementation boundary

1. Add a pure, isolated pose-contract module and a local inspection harness, following existing repository test conventions. Suggested location: `scripts/mechanics/harness/` for development-only UI and `tests/` for independent numerical checks; decide the smallest setup after inspecting available tooling. Do not add playback fields or controls to the visitor state/UI yet.
2. Define `evaluate(timeSeconds, operatingState, parameterSet)` returning world-space rigid deltas per shaft and explicit unresolved/deformation statuses. Each parameter needs evidence ID, units/frame, confidence and review status. Unknown relationships must return an unresolved diagnostic, never an implicit zero-angle “pass.” Use a fresh foundation parameter file; never import `illustrativeCycle` as defaults.
3. Keep source-rest and operating-state selection distinct. `sourceRest` has identity mechanical deltas. An experimental fixture can exercise arbitrary shaft angles without pretending they form a running cycle. A balance amplitude/phase contract can remain unset until M2/M3 agree; unset parameters must prevent a connected playback claim.
4. Use one mechanical clock with pause, seek and phase inspection; UI easing is separate. Reject negative/nonfinite time explicitly. Seek to absolute time while preserving elapsed turns, not a slider that silently returns a long run to cycle zero. Freeze/rebase hidden-tab time in the harness.
5. Evaluate each leaf from its immutable source or reviewed fitted base: `presentation × T(pivot) × Rworld(delta) × T(−pivot) × base`. CAD hierarchy is metadata, not another transform layer. Apply each shaft delta exactly once to all assigned members, including impulse jewel/roller and both pallet jewels. Keep mixed assembly 108 out of rigid ownership. Preserve independent center/seconds axes and child-local flips.
6. For fitted blades use the existing fitted result as the base, then apply mechanical delta about the actual display arbor; the Lance seconds recentering is already in that base. Raw inspection restores the exact source matrix. Leaving raw inspection restores the saved paused fitted/operating state. Record deformation handles for 116 and both 88s without manufacturing an accepted breathing law.

## Acceptance evidence

- Same timestamp/state/parameter inputs produce identical output, including seeking backward and after 30/60/144 Hz sample histories, pause/resume and speed changes. These rates are proposed test inputs, not performance claims.
- Independent transformed landmarks verify world axes and rigid membership: off-axis points, opposite child-local Z directions, center/seconds separation, all rigid contacts present, and no parent/child double rotation. Use hand-calculated fixtures or independent matrix math, not a test that repeats the implementation formula verbatim.
- Source-rest round trips retain exact stored bases. Computed matrix, axis and angle comparisons meet the M0 numerical proposals. Every supported hand style retains the reviewed bore center and its unmodified fitted correction. Test 12-hour endpoints and invalid time handling; no full-power-reserve behavior is implied.
- Unresolved graph edges and deformations remain visible as diagnostics. A harness demonstration is labeled an experiment. It must not hide the hairspring or contact parts to suggest regulation feasibility; use source-rest context and clearly identified independent transform fixtures until connected geometry exists.
- Document harness invocation, deterministic evidence, current parameter status and remaining unknowns. Run the relevant existing CPU/source/hand checks if sharing any runtime utility; run lint/type checks for introduced code. Visitor integration remains M7.

## Readiness and next proof

Available now: complete coverage/identity census, immutable source matrices, six supported pivot lines, tooth-count candidates, fitted hand bases, source CAD, OCP environment, bounded probes and existing validation infrastructure. M1's numerical/ownership foundation has no missing external input.

Not ready: automatically executing the whole graph, a chosen operating amplitude, escapement event phases, terminal-frame deformation, series-barrel state, or proof of display shaft couplings. A typed unresolved state is a required M1 output, not an obstacle to beginning the foundation.

Planning estimate, explicitly an assumption: roughly **2–4 focused engineering days for M1**, including harness and transform/clock verification, if the existing tooling can be reused. This is not a calendar commitment. M2–M4 effort remains unbounded by current evidence because contact precision and constrained spring deformation may require repair or external input. M4 remains the first complete regulation feasibility proof; do not scale to full-chain implementation based only on a successful M1 harness. Reviewer waiting time is separate.

Recommended next authorized task: implement only this M1 foundation, commit locally after verification, then return its evidence and a revised M2/M3 experiment plan. The current M0 task stops before those changes, with no push.
