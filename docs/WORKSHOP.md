# Be a watchmaker! — Workshop

`/workshop` now owns the former prototype experience. `/workshop/prototype` and
`/workshop/assembly` redirect to it. The homepage invitation continues to use the
canonical route. The previous 15-operation interface is deprecated and removed,
along with its renderer, styles, drag helper and browser workflow. Its last verified
implementation is recoverable at `d4b5bcf` in Git history; its lesson mapping,
validation, save schema and CPU regressions remain as reference and reusable logic.
Existing chapter and Easy/Hard storage keys are neither read, overwritten nor deleted.

## Current practice scope

There is one movement view, with no Separate stem screen, switch or placement
destination. To keep a meaningful task after removing the stem practice, the initial
fixture is chapter cursor 12: the prepared movement already includes the stem and
setting components. This is an explicit starting fixture, not a simulated insertion
or an automatic lesson operation. The user fits the winding bridge and its two
screws (workbook rows 17–19). Progress remains in memory and resets on reload.
The interface shows **0/3–3/3** and **Checkpoint complete**, meaning those three
placements only. It does not claim the full lesson or watch is finished.

Parts retains all nine real component groups, names, CAD-rendered previews, search
and Available/All/Installed filters, defaulting to Available. Search, filter, list
position survive reopening; ordinary reopening focuses the Parts heading without
raising the search keyboard. Invalid releases focus the same available handle. Installed names and
previews remain identifiable without drag handles, including after completion. Installed stem components remain visible in
the movement and browser, preserving their fitted ownership. Available screws
can be chosen before the bridge; invalid choices still reach the shared validator.
There are no hands/tweezers/screwdriver controls or prerequisites.

### Prepared fixture assumptions

Cursor 12 has the prepared plate, setting components and assembled stem already in
their original fitted positions. The fixture is stationary, movement side upward,
and supported for this checkpoint. Orientation/support are fixed assumptions, not
player setup operations or evidence of support fit/stability. No holder is rendered
or loaded. The adapter supplies the historical validator's movement-side support
and orientation values explicitly; it omits only the tool prerequisite. Historical
chapter defaults, operations, save schema and tests remain unchanged separately.
Bridge leaves and screw identities/order remain provisional: P73 then P79, pending
Marco's review. Nothing here validates insertion, tightening, torque or a mechanical
fit tolerance. Only these three placement actions are playable.

## Drag input and alternatives

Ordinary mouse/touch gameplay requires pulling a labelled **Drag** handle in Parts
and releasing over the movement workspace. Names/CAD previews only identify a part.
There is no ordinary placement button or clickable `+`. Names/previews permit native
vertical scrolling; only the separated handle has `touch-action: none`. A handle
tap or movement below 8 CSS pixels never closes Parts or submits a placement.
Pointer-down captures on the persistent workspace; crossing the intent threshold
starts the held preview and closes Parts. The same capture survives sheet dismissal.

A continuously visible, labelled CAD thumbnail follows the crosshair, including
outside the workspace. Its centre is the pickup anchor; it is an identification
preview at a fixed screen size, not an insertion/rotation simulation. For touch,
the crosshair and thumbnail centre sit 64 CSS pixels above the finger. Feedback,
workspace containment and final validation all use that same aim coordinate.
The aim must be inside the workspace, even if the finger itself is outside.

The camera fits the prepared cursor-12 fixture throughout all three placements.
Selection and dragging do not modify the rendered assembly. Reserved feedback and
selection space prevent movement resizing; Alternative controls overlays the view.
A successful release fits the original matrices. Undo removes only the last of
these three placements and is bounded at cursor 12; the historical chapter Undo
is not exposed. Reset is secondary in Parts and requires confirmation, initially
focusing Keep placements. Dismissing it preserves progress. An invalid inside release counts
one failed attempt and reopens Parts with the same available handle focused.
An outside release reopens Parts without an attempt. Escape, Cancel placement,
pointer cancellation, loss of capture, window blur, hidden document, graphics loss,
and coordinate-changing resize/scroll cancel without an attempt. Consuming the
pointer before releasing capture and consuming alternative selections before
submission prevent duplicate releases/activations from counting again.

Screw destination identity is resolved from the nearest of **both** projected hole
centres, including the already occupied hole; the selected screw does not choose
the destination. A screen-distance tie within 0.5 CSS pixel is ambiguous and rejected.
Only after identity matches does the retained 5 mm positioning assistance apply.
The old 44px selected-seat shortcut is removed. Thus the neighbouring hole (about
4.2 mm away) cannot be accepted merely because it is within that assistance radius.
These are input-disambiguation rules, not mechanical tolerances.

**Alternative controls** is always explicitly discoverable in the dock, independent
of device detection. Enabling it replaces drag handles with Choose controls; the
user chooses a part, selects Bridge seat / Screw hole 1 / Screw hole 2, and activates
Confirm placement. It provides exact-seat positioning assistance through the same
checkpoint validator and rejects wrong part/destination choices. The destination
select receives focus after Parts closes; success/cancellation returns focus to
Parts, and invalid attempts return to the available part. Status is announced via
an atomic polite live region. Turning the mode off restores ordinary drag gameplay.
These controls are implemented for non-drag access; accessibility qualification
still requires human keyboard/screen-reader review.

## Rendering and phones

`WorkshopViewer` retains source geometry, matrices, materials and finish annotations.
It shares Explorer's 33-degree perspective bounds fit, ACES exposure 1.05, studio
lighting/environment at intensity 0.9 and contact shading. The camera shows the
movement side using Explorer's back-face direction/up vector. The quiet green mat
is a CSS surface, without additional green lighting. No movement animation, new CAD,
holders or cushion models are loaded. Parts uses the existing Sheet; on phones it
is a bottom sheet. Its dismissal and feedback do not change workspace dimensions.

### Responsive layout and recovery

Portrait uses a flexible-height movement surface; short wide viewports put the
controls beside it. Essential controls retain 44px targets. Safe-area padding
protects the page and sheet; the Parts sheet follows visualViewport height and
pan during search keyboard changes. Filter/search and list state remain local.
Coordinate changes cancel a held part without submitting it. Feedback/selection
reserve fixed space, preserving the fixture frame throughout ordinary gestures.

Construction failures release whatever resources have been allocated, including
an attached canvas and observer. Failed loads release partial assets; late assets
from a disposed viewer are discarded. Interrupted graphics require explicit Retry.
Accepted cursor/attempt state remains in React memory across repeated failed or
successful Retry; the replacement viewer receives that cursor before becoming
interactive. Retry gets focus on failure; successful recovery returns focus to
Parts. No legacy storage API is used by the checkpoint adapter. Reload still starts
at the prepared checkpoint.

Rendering trace against `MovementViewer`: both use `configureRenderer`,
`createStudioEnvironment`, `addStudioLights`, `createMaterial`, source-surface
annotations, `SurfaceOcclusion` and `studioFrame` (33° perspective, exposure 1.05,
environment intensity 0.9). Workshop deliberately has a fixed rear-facing prepared
fixture, no OrbitControls or motion, a CSS green mat, and oblique thumbnails.
Those presentation differences are retained; no lighting/material compensation,
source geometry edits or mechanical inference is part of this refinement.

## Workbook discrepancies for discussion

Read original workbook on 2 November 2026:
`be a watchmaker - assembling of the Zweigesicht-1-1.xlsx`, Tabelle1.
SHA-256: `725b0035684799c95f4275909d4436fbaf37a6c6201225d97ed5e0349c6cd5a5`.

- Row 5 says **tool leather bench**, and row 6 places the mainplate on it.
  The historical chapter implementation substitutes a red movement-side support.
- Row 8 flips the mainplate on the leather bench; it does not request a red
  support exchange. The historical chapter requires an exchange.
- Row 15 returns the movement to the leather bench, Front2 upward. Requiring
  another red-support selection is an implementation interpretation.
- Row 21 introduces **movement holder 1**, after the first 15 operations in
  rows 5–19. It describes the movement rising, leather bench being set aside,
  holder arriving, and movement descending. None of that is simulated here.
- The workbook has part/action/target/upward-direction columns, without mandatory
  hands/tweezers/screwdriver choices. Tool assignments remain historical implementation interpretations; the
  current workshop does not require tools.

These are not Marco-approved changes. No lesson rewrite, cushion, support geometry,
insertion path or mechanical behaviour is introduced by this checkpoint.

## Verification and review boundary

The pre-existing core drag milestone `2c936ec` was verified through the connected
GitHub app before refinement. Current application/check revision
`7bb9fba37ffa54005055221f401773a9a27b447f` passed
[GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41531151867)
(169 tests, asset validation, TypeScript, lint and both builds) and all three
[Workshop browser profiles](https://github.com/galind/zweigesicht-1/actions/runs/41531151947).

The runner uses actual mouse drags at 1440 × 900 and 1024 × 540 and native Chromium
emulated-touch drags at 390 × 900, 320 × 568, 844 × 390, 667 × 375 and 568 × 320
for **all three** ordinary placements, independently projecting fitted geometry.
Alternative-control placements are checked separately, never as proof of ordinary
play. Coverage includes stable workspace bounds, preview/aim, native scrolling,
retained Parts search/filter/scroll, installed identification, visible controls,
orientation and synthetic visualViewport keyboard shrink/pan. It also covers wrong
parts/holes, ambiguous/imperfect drops, outside release, cancellation/duplicate
input, progression, Undo boundaries/refitting, Reset dismissal, partial constructor
and load failures, and graphics Retry after an accepted placement and further
failed load. Legacy routes/difficulty URLs and complete seeded localStorage bytes
remain unchanged; instrumentation asserts no project-save reads or storage writes/
clears, separately from the shared analytics SDK's own attribution-key read.

Workspace heights stayed 620, 476, 625.5, 277, 326, 302 and 230.5px respectively
through gestures, feedback, Undo and placements. No page errors or page overflow
were reported. CPU checks retain fitted matrices and exclusive component ownership
and cover bounded Undo/accounting and resource cleanup after constructor failure,
partial loading failure and late completion following disposal. Historical chapter
validation/save regressions remain independent. See [PROGRESS](../PROGRESS.md) for
the exact evidence and next review step.

Visual review is separate from those automated assertions. Inspected existing
ignored `artifacts/power-source/browser/fitted-back.png` (Explorer) and
`artifacts/power-source/browser/workshop-partial.png` (retired Easy interface),
last modified 31 October 2026. These show source finishes/framing in older
interfaces, not this prepared three-placement checkpoint. Prior Workshop CI has no
artifacts; suitable current rendered evidence remains unavailable. No current
visual pass is claimed. No new screenshots are generated/published by the runner,
and no local tests, builds or browser automation ran for this refinement.

Blur/hidden-document, duplicate delivery and keyboard-viewport changes include
supplemental injected events; native Chromium touch, resize and WebGL context-loss
checks do not emulate physical keyboard behaviour or phone OS suspension. Human
visual comparison against Explorer, keyboard/screen-reader review and actual iOS/
Android qualification remain separate activities. Marco's provisional P73/P79
mapping/order and fixture-assumption review remain open. This does not certify
mechanical fit, completion of the full chapter or any release gate. No merge,
deployment or site/CAD publication is part of this work.
