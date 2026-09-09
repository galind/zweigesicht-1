# Evaluate and polish the explorer UX and UI

## Execution instruction

Implement this goal in `/Users/guillemgalindo/projects/marco-lang` when the user launches it with the executing agent. This document is a handoff brief only; its preparation does not authorize the preparing agent to implement the website changes.

Evaluate the current website in the real browser, improve its UX/UI, and continue through implementation, verification and local milestone commits. Do not stop at an audit or another proposal. Make routine design decisions autonomously within the scope below.

## User intent

The controls currently feel inconsistent: buttons can change places when switching modes, some choices may be unnecessary, and others could be clearer or easier to use. Make the existing explorer coherent and predictable while retaining the accepted watch presentation.

Three explicit requirements:

1. Stabilize control positions and behavior across modes. Simplify or consolidate redundant controls where the audit supports it.
2. Remove **Mechanism colors**. The accepted **Materials** appearance is the only appearance; do not leave a redundant one-option appearance selector.
3. Clicking or tapping empty space outside the selected object should deselect it.

Preserve the restrained visual identity, prominent model, compact controls and single-screen exploration. Improve the working interface itself; do not add a landing page, introductory flow, design-style selector, new features or decorative choreography. No emojis in the visitor interface.

## Starting state and safeguards

Read `AGENTS.md`, `PROGRESS.md`, `IMPLEMENTATION_PLAN.md`, and `UNATTENDED_RUN.md` before changes. Follow the latest user decisions in this brief and the current progress record; older planning ambitions and rejected experiments are historical.

At preparation, local `main` is **584c400**, fast-forwarded from `codex/watch-polish-finishes`. Inspect the actual branch, status and any later changes; do not reset to this hash or overwrite another agent's work. Create an appropriate `codex/` branch for the implementation if needed. The unrelated, untracked `FINISHING_GOAL.md` belongs to the user: do not edit, stage or discard it.

The accepted Separate behavior is a complete simultaneous expansion covering all 223 movement leaves, with corrected source-depth ordering, screw-seat precedence and full-part clearance. It is not the rejected staged/grouped explosion or the Axial layers / Assembly islands / Guided reveal comparison. Preserve this behavior and its generated layout. This goal concerns the interface around it, not another separation redesign.

Preserve:

- Accepted materials, finish details, lighting, source surface annotations and recovered diamond.
- Original geometry, scale, occurrence IDs, immutable source matrices and source URLs/hashes.
- Exclusive Movement / Dial A / Dial B presentations, independent hand-style preferences and all six fitted styles at **10:10:00**. Retain the fitted-only central Lance correction and original raw catalog poses.
- Whole separation and exact reassembly; focused mechanism exploration; both sides; picking, isolation, catalog/search and loading/recovery.
- All parts' independent **216-member** inventory packing, membership and relative scale.
- Manual camera ownership, predictable Back/Reset semantics, reduced motion, resource reuse and rendering on demand.

Review `docs/EXPLODE_REVIEW.md`, `docs/HAND_TIME_REVIEW.md`, `docs/DIAL_AND_HANDS_REVIEW.md`, and `docs/FINISH_ADJUSTMENTS.md`. Do not reopen settled CAD/material decisions, add mechanical playback, regenerate source assets or migrate dependencies without a concrete requirement.

Local only: keep the preview at **http://127.0.0.1:4173/** running. Do not push, merge, deploy, register/save/upload a Site, or redistribute assets. Follow repository Git policy; never use `gh`. Commit coherent verified milestones locally, inspect status and staged diffs before every commit, and update `PROGRESS.md` with verified state and next action.

## 1. Audit the interface across states

Inspect the current application before choosing a solution. Browser inspection, interaction testing, screenshots and responsive testing are explicitly part of this goal. Reuse the existing preview and supported browser tools.

Trace the complete control surface in:

- Bare movement, either side, assembled and partially/fully separated.
- Dial A and Dial B, including hand-style switching.
- Focused mechanism, with Uncover and Separate at intermediate positions.
- Selected part and isolated part, including selection within a focused mechanism.
- All parts overview, focused inventory group and selected/isolated inventory component.
- Catalog/search, part details, Options and About overlays.
- Loading, optional asset loading, failure/retry and graphics recovery.

Record a compact mode/control matrix: visible actions, their position and meaning, disabled states, available exits, and what happens to selection, camera and history. Identify concrete sources of movement, duplication, unclear labels or surprising behavior. Inspect layout conditionals and responsive overrides as well as screenshots.

Useful starting points:

- `explorer/app/page.tsx` and `explorer/app/globals.css`: conditional controls, footer, side switch, contextual panels, overlays and breakpoint rules.
- `explorer/components/DialControls.tsx`: dial/style controls and focus behavior.
- `explorer/src/experience/state.ts` and `webmcp.ts`: normalization and programmatic entry points.
- `explorer/src/viewer/MovementViewer.ts`: selection, pointer gestures, history, isolation, camera, material treatment and recovery.
- Existing CPU/state/browser validation in `scripts/cad/review-runtime.mjs`, `tests/experience.test.mjs`, and `explorer/src/viewer/*Validation.ts` / `validation.ts`.

## 2. Make control placement and meaning predictable

Establish a stable hierarchy for global navigation, model/view controls and contextual part actions. Keep the same action in the same spatial location at a given viewport size whenever its meaning remains the same. Entering a mode or selecting a part should not unnecessarily recenter or reshuffle neighboring controls. Responsive changes may rearrange the layout deliberately at breakpoints; mode changes should not cause arbitrary movement within a breakpoint.

Use a consistent, compact place for contextual actions. Decide deliberately when an action should be disabled, replaced in a fixed slot, or moved into a secondary menu. Do not reserve large empty panels or keep meaningless controls just to prevent movement. Preserve useful model space and readable touch targets.

Audit overlapping routes and actions such as Explore, All parts, side switching, Dial & hands, Back, Reset, Reassemble, isolation and detail controls. Consolidate genuine duplication without removing useful capabilities or hiding primary actions behind unnecessary steps. Keep Back (previous context), Reset (opening defaults), deselect, exit isolation and reassembly conceptually clear. The precise final arrangement should follow the observed problems, not a mandated new toolbar design.

Polish labels, icon consistency, selected/disabled/hover/focus states, alignment, spacing, long-name handling and overlay rhythm. Use existing components and established styling. Keyboard and touch behavior should agree with the visual hierarchy. Avoid explaining confusing controls with extra paragraphs when the controls themselves can be made clearer.

## 3. Make materials the only appearance

Remove the Materials / Mechanism colors appearance choice and its explanatory copy. Remove obsolete function-color branches and alternate-color state where appropriate, rather than merely hiding the toggle.

Trace the current `treatment: 'finish' | 'function'` handling through state normalization, viewer materials, history/Back, Reset, loading/recovery, diagnostics, WebMCP schemas/validation and tests. Legacy or unexpected `function` input must not reactivate mechanism colors. Keep APIs consistent with the single supported appearance and adjust only obsolete appearance-specific assertions.

Always preserve the accepted material interpretation, including the fitted dial enamel override and raw catalog appearance. Retain effective selection outlines or other existing selection cues. Evaluate any contextual dimming for clarity, but do not replace materials with flat mechanism/category colors or change the finish values as part of this task. Removing the color mode must not remove mechanism exploration itself.

## 4. Deselect on an empty-space click or tap

A deliberate primary click/tap on empty **viewer space** should clear the selected object. Clear its highlight/outline and stale part details. If it was isolated, leave isolation and restore the surrounding parts appropriate to the current mode.

Preserve the current mode, mechanism, separation values, dial preferences, inventory context and camera. Deselect is not Reset, reassembly, or a generic history Back. Clicking another object should select that object directly. Clicking empty space when nothing is selected should do nothing.

Distinguish a background click from gestures and interface interactions:

- Orbit/pan drags, out-and-back drags, pinch/zoom gestures, cancelled pointers, non-primary clicks and right/middle clicks must not accidentally deselect.
- Clicking controls, sliders, menus, sheets, catalog entries or part details must not be treated as a background click.
- Empty-space clicks during or after an asynchronous selection must invalidate stale selection work so the object does not reappear later.
- Reuse the existing gesture discrimination and selection-generation/cancellation paths. Do not attach an indiscriminate global document-click reset handler.

Provide a clear keyboard equivalent for dismissing selection, consistent with existing Escape behavior. Escape should dismiss an active overlay first and should not trigger multiple unrelated exits. Retain sensible focus when selected-part UI disappears. Preserve existing Back/history behavior without introducing duplicate entries or unexpected mode jumps.

At preparation, `MovementViewer.pointerUp()` performs a visible-mesh raycast and calls `select()` only on a hit; empty hits have no action. Trace the full selection and pending-load lifecycle before implementing the empty-hit path.

## 5. Verify the finished experience

Capture matched before/after views and a concise audit-to-change record. Test the final controls in all audited modes, including transitions between them, at **1280×720**, a larger desktop, **390×844**, **320×740** and phone landscape. Check 200% text, reduced motion, no horizontal overflow, readable focus indicators, touch targets, long part names and the absence of unnecessary toolbar jumps. Measure key control rectangles across mode switches where that makes the stability claim reproducible.

Add meaningful behavioral regressions for the changes:

- Empty-space deselection in assembly, separated, focused mechanism, isolated and All parts states, with context/camera preserved.
- Object-to-object selection, clicks on UI, drag/pinch/cancel rejection, and stale asynchronous selection cancellation.
- Keyboard dismissal and overlay/focus precedence.
- Single-material behavior through normal UI, legacy input, history, Reset and recovery.
- Stable placement of persistent controls across representative mode switches at desktop and phone widths.

Run the existing applicable checks: `node scripts/cad/review-runtime.mjs`, `node --test tests/experience.test.mjs`, TypeScript, lint for edited authored sources, and the production build in `explorer/`. Run and adapt the live explosion, dial and movement checks to the final UI; preserve unrelated protections rather than weakening them to make changed labels or removed coloring pass.

Exercise rapid mode changes, loading/failure/retry, graphics recovery, all six 10:10 styles, exact reassembly, complete separation coverage/clearance and inventory packing. Confirm stable GPU resources and zero unnecessary idle redraws. This goal does not require a fresh CAD audit: use the existing actual-source protections. Do not claim physical-device, screen-reader or human usability testing from emulation alone.

## Completion and handoff

Finish when the interface is implemented and visibly coherent across modes, the unnecessary appearance mode is removed end to end, empty-space deselection works without gesture/history regressions, and verification passes.

Write `docs/UX_UI_POLISH_REVIEW.md` with the concrete UX findings, final control hierarchy, removed/consolidated actions, selection semantics, verification evidence and any remaining limits. Keep screenshots and numeric evidence local under an ignored directory such as `artifacts/browser/ux-ui-polish/`. Update `PROGRESS.md`, commit verified local milestones, and leave the preview running for user review.

Report the main improvements, local checkpoint(s), verification outcome and preview URL concisely. Do not automatically start another goal, task or schedule.

## Suggested launch message

```text
/goal Implement UX_UI_POLISH_GOAL.md. Continue from the current project state through UX/UI evaluation, implementation and verification. Stabilize controls across modes, keep materials as the only appearance, and add safe click-outside deselection. Preserve accepted finishes, dial controls, 10:10 poses and complete separation. Commit verified milestones locally and keep the preview running. Do not push, merge or deploy.
```
