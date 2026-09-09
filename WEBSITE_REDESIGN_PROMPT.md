# Zweigesicht — immersive website redesign

Implement this redesign in `/Users/guillemgalindo/projects/marco-lang`. Read `AGENTS.md`, `PROGRESS.md`, `IMPLEMENTATION_PLAN.md`, and `UNATTENDED_RUN.md` first. Reconcile historical instructions against the latest verified state. This brief supersedes the earlier website layout and rapid-comprehension objectives; the accepted static model remains the foundation.

## Outcome and design intent

Redesign the website as a quiet, immersive presentation of the Zweigesicht movement on a single screen. The watch must be the unmistakable focal point. The user is happy with the current model and wants a substantial improvement to the surrounding website and interaction design.

The purpose is to appreciate beauty, craftsmanship, and engineering through voluntary exploration. Visitors do not need to understand how the watch works within 30 seconds. Let them linger, change their viewpoint, uncover the construction, and discover details at their own pace.

Deliver a complete local implementation ready for visual review. Do not stop at a proposal, wireframe, or cosmetic reduction in button sizes. Rethink composition, control hierarchy, and when information appears.

## Accepted product decisions

- One immersive screen throughout, with no scroll-driven storytelling, marketing landing page, or required introductory sequence. Internal scrolling in optional content is acceptable; the main experience must fit the viewport.
- A neutral near-black/dark-gray environment with minimal borders and interface chrome. Remove the current blue-gray cast. Tune the background so dark components retain their edges and polished metals remain legible.
- The accepted model dominates the composition, with generous breathing room and deliberate camera framing.
- Direct manipulation is primary: drag to orbit, pinch to zoom, tap to select; provide corresponding mouse and trackpad interactions. Remove the permanent visible orbit/tilt/zoom button cluster. Preserve accessible keyboard and alternative controls in a discreet, discoverable place.
- Keep a readily available Reset action. It must restore the complete assembled movement, default camera and side, cleared selection, and default presentation state from every view.
- Preserve and prominently integrate the continuous explosion/separation slider. Its gradual reveal of construction is a central feature.
- Add an All parts view that lays components next to one another, with smooth transitions and an easy return to the assembly.
- Preserve section/mechanism exploration with a much quieter selection flow and relevant, verified specifications in the focused view.
- No automatic rotation by default. Respect stillness and the user's chosen viewpoint.

## Opening composition and control hierarchy

Start directly on the assembled movement. Show only restrained naming/attribution and a compact control area containing Explore, the separation slider, All parts, and Reset. A single discreet side-switch control may sit near the watch. Treat this as a hierarchy, not a requirement to force five labels into one cramped mobile row.

Remove the permanent mechanism sidebar and default information panels. Avoid an overlay blocking the opening view. Keep Finish as the default; retain Function and quality/accessibility options within secondary controls. Avoid technical counters, source IDs, triangle counts, release notes, and CAD exceptions in the main visitor flow. Retain accurate provenance and limitations in an optional About/source area.

Use typography, spacing, scale, and placement to create a distinctive, restrained presentation. A generic dark dashboard with gold accents is insufficient. Keep naming readable and controls usable on phones; visual quiet must not come from tiny labels or touch targets.

Secondary controls may recede during manipulation and return after release or deliberate interaction. Essential actions must remain discoverable. Do not hide focused controls, introduce arbitrary disappearance timers, or rely on hover for access on touch devices.

## Connected views and behavior

### Assembled and exploded movement

Retain free orbit, zoom, both sides, existing reveal capabilities, and continuous separation. Design the default framing and control placement together. Keep the entire intended subject clear of UI and screen edges at rest.

The slider should feel immediate and reversible. In a focused section it may separate that section's components, with an unambiguous contextual label. Reassemble returns presentation transforms to the immutable source assembly; Reset additionally restores the complete default experience.

### Section exploration

Explore opens a compact chooser for the existing sections. Selecting one closes the chooser and moves to a carefully composed view of that mechanism. Preserve contextual understanding through the transition without requiring instructional steps.

Show a quiet section name and two or three relevant facts where reliable information exists. Examples include balance/escapement frequency and barrel power reserve. Verify exact values, units, variant applicability, and attribution against maker documentation or existing source-backed project evidence. Do not invent values or pad every section to an arbitrary quota. Clearly distinguish movement-level specifications from component properties.

Keep optional explanations short and secondary. A small Whole movement action provides a contextual return. Preserve a sensible Back path for component inspection and restore the preceding camera/presentation context where appropriate.

Tapping a visible component should offer a readable name and concise role or relevant detail when supported. Use restrained selection feedback that preserves material appearance; consider a subtle outline or anchored label. Avoid a broad bright overlay obscuring the finishes. Raw source names and IDs remain available deeper in the interface. Do not invent a component identity when the source is ambiguous.

### All parts

Create a visually composed spread of the active movement's physical leaf components, separated from one another and grouped by related mechanism where feasible. Keep real relative scale. Arrange small hardware intentionally so a sea of screws does not dominate the composition. Provide pan and zoom for close inspection and a useful overview; do not require all hundreds of pieces to remain legible at once.

Define and document membership explicitly. The default spread should represent the active movement, excluding duplicate subassembly containers, case/support items, and incompatible catalog alternatives. Keep all other source entries reachable through the optional catalog. Do not silently drop eligible tiny parts or count assemblies as additional physical pieces.

Use stable source IDs and deterministic layout positions. Prevent unintended overlap in the settled spread, including long shafts, thin springs, and unusually shaped parts. Choose inspection-friendly orientations without changing geometry or physical proportions. Preserve selection and component-to-assembly identity.

Animate the movement into the spread so visitors can follow its decomposition. Layout travel is an authored presentation, not a mechanically validated disassembly procedure. Support reduced motion. Repeated entry, exit, interruption, and Reset must never accumulate transform drift or leave parts hidden. Returning must recover the exact accepted assembled placements and appearance.

In this view, expose appropriate touch pan/zoom and make the camera behavior predictable. Do not allow the normal explosion slider and spread layout to compete for transform ownership. Give the slider a clear inactive state or replace it contextually while the spread is active.

## Touch, motion, and accessibility

Distinguish a tap from an orbit drag and a pinch; dragging must not accidentally select parts. UI gestures must not move the scene behind the control. Test sliders and drawers with touch-sized targets. Keep deliberate selection stable when gestures end.

Author camera destinations as compositions that reveal depth, finishing, and relationships. Transitions should be gentle, interruptible, and responsive. Manual camera input immediately takes control. Avoid gratuitous motion, camera fights, and clipped subjects at settled destinations.

Design the phone experience directly. Optional information may use a compact expandable sheet, but must not permanently consume the space needed to appreciate the model. Avoid reproducing the current horizontal mechanism strip plus large scrolling information panel. Respect safe areas, landscape layouts, browser viewport changes, and reduced motion.

Maintain meaningful accessible names, visible focus, keyboard operation, sensible focus restoration, and alternatives to gestures. Preserve loading, asset retry, static fallback, and graphics-context recovery. Rewrite visible status copy to match the new experience.

## Protect the accepted work

- Preserve source geometry, scale, source IDs, assembly matrices, verified component assignments, materials, surface annotations, recovered diamond, and provenance. Do not retessellate, rebuild assets, or restart the appearance audit for this UI task.
- Treat current finishing and lighting as the visual baseline. Adjust the environment background independently. Do not silently change the accepted material or lighting system to compensate for layout choices.
- Keep the movement static mechanically. Presentation/camera transitions are allowed; restoring running-watch animation is outside this task.
- Reuse the current viewer, state contracts, assets, and validation infrastructure wherever practical. Changes to presentation transforms and framing are expected; isolate them from immutable source placement and appearance.
- Preserve all existing inspection capabilities through the cleaner hierarchy, including both sides, mechanisms, selection/isolation, optional source catalog, and contextual return.
- Keep unrelated work, especially the user-owned `FINISHING_GOAL.md`, untouched.

## Execution and agent ownership

Keep one lead responsible for visual direction, application/viewer edits, state integration, and final quality. Delegate bounded independent work where useful: source-backed specification/copy research, read-only interaction/accessibility review, and independent visual/regression review. Give each worker explicit file ownership, inputs, deliverables, and acceptance evidence; do not have multiple agents independently redesign the interface. Preserve inherited model settings unless separately instructed.

Begin by reviewing the actual current website and capturing baseline views. Inspect current separation, reveal, selection, catalog membership, and transform ownership before implementing All parts. Establish the visual hierarchy first, then integrate the connected views and finish the touch and accessibility behavior.

Make routine reversible implementation decisions autonomously within this brief. Use local previews and repeat visual inspection after meaningful changes. If a detail is underspecified, choose the solution that gives the watch more prominence while keeping exploration dependable. Only ask when a material decision cannot be resolved from the agreed direction or existing evidence.

## Acceptance evidence

Record before/after screenshots at matching viewport sizes, including desktop, 390×844, 320×740, and a phone landscape viewport. Use larger desktop sizes as well as the initial review's 1280×720. Inspect actual rendered output, not only source code or successful builds.

The completed experience must demonstrate:

1. The opening screen is visibly quieter, with the movement as the dominant subject, no permanent sidebar, and no default explanatory panel.
2. The neutral near-black environment preserves the accepted model's visual qualities and readable silhouettes.
3. Direct manipulation, both-side views, selection, isolation, Reset, and accessible alternatives work across the redesigned hierarchy. Claim real-touch validation only if actually performed; otherwise identify emulation and remaining device review.
4. Continuous separation remains useful, with reliable reversal and exact reassembly. All six section views have intentional framing and unobtrusive relevant content.
5. All parts has verified membership, preserved relative scale, no unintended settled-layout overlap, useful pan/zoom, and exact return. Test at least 20 interrupted view/layout/reveal changes, including switching sections, selecting a part, and resetting mid-transition.
6. No accidental gesture selection, control/scene gesture conflicts, document overflow, trapped focus, or persistent obstruction of the focal subject in representative desktop and phone states.
7. Existing appropriate source/asset, state, runtime, and recovery checks pass, alongside production build, TypeScript, and authored lint. Extend tests for real new failure modes, particularly spread transforms, membership, interruption, and restoration.
8. Resource counts stabilize across repeated transitions, idle rendering remains quiescent, and motion remains responsive. Compare equivalent interactions against the current baseline; disclose device and measurement conditions.
9. Every displayed technical specification has a recorded source and correct scope. No fabricated mechanical correctness, expert review, visitor study, or physical-device performance claim.

Do not treat compilation or lack of overflow as visual acceptance. Inspect whether the watch actually feels central and the controls secondary. Have an independent reviewer challenge the final composition and interaction behavior; resolve concrete findings before handoff.

## Scope, checkpoints, and handoff

This implementation run is local-only. Existing deployment history does not authorize publishing this redesign. Do not push, deploy, register/save/upload a Site, redistribute additional CAD, contact people, purchase services, or redeem usage credits. A later explicit publishing instruction is separate.

Follow `AGENTS.md` for coherent verified commits, staged-diff inspection, task-only staging, and `PROGRESS.md` updates. Preserve generated artifacts and original downloads according to project exclusions. If GitHub actions later become authorized, use the configured SSH remote for git and the connected GitHub app for API/PR work; never use `gh`.

Finish with a working local preview, a concise account of the redesign, the All parts membership/layout decisions, specification sources, visual and functional evidence, and honest remaining limitations. Keep the final report focused on the experience and reviewable results. Do not start a separate goal, schedule, or task automatically; this prompt defines the work when the user launches it.
