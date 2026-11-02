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
The interface says **Practice checkpoint** and completion means those three
placements only. It does not claim the full lesson or watch is finished.

Parts retains all nine real component groups, names, CAD-rendered previews, search
and All/Available/Installed filters. Installed stem components remain visible in
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
A successful release fits the original matrices. An invalid inside release counts
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

Application/check revision `2c936ec874ca2393c0f1bcea56ef8a2b159da488` passed
[GitHub CI](https://github.com/galind/zweigesicht-1/actions/runs/41525837478)
(166 tests, asset validation, TypeScript, lint and both builds) and the
[Workshop runner suite](https://github.com/galind/zweigesicht-1/actions/runs/41525837426).
The suite uses actual mouse drags at
1440px and native Chromium emulated-touch drags at 390/320px for **all three**
placements, with independent projection from fitted geometry. Alternative-control
placements are checked separately and are never used as proof of ordinary gameplay.
The suite covers stable workspace bounds, preview/aim coordinates, native row
scrolling versus handle pickup, wrong part/hole, ambiguous and imperfect drops,
outside release, cancellation, repeated release delivery, graphics loss/retry,
legacy routes and byte-identical complete localStorage across resets/reloads.
Blur, hidden-document, mouse pointercancel and duplicate delivery use supplemental
injected lifecycle events; touch cancellation, pointer capture loss, resize and
WebGL context loss use browser input/APIs. This does not emulate an OS suspending a
physical phone. CPU checks preserve fitted matrices and exclusive component ownership
and add fixed-camera/screw-identity regressions. Historical chapter validation and
save compatibility tests remain. Shared viewer, catalog/loading, Sheet/styles,
model metadata and package/config dependencies trigger the Workshop workflow.

Workspace heights remained 592px at 1440 × 900, 616.5px at 390 × 900 and 432.5px
at 320 × 740 across pickup, feedback and placements. No page errors or horizontal
overflow were reported. Bounds/seat queries explicitly refresh world matrices of
fitted meshes before projection; original fitted matrices remain unchanged.
No local tests, builds or browser automation ran for this milestone. See
[PROGRESS.md](../PROGRESS.md) for the exact evidence and next review step.

Automated checks do not establish visual quality, accessibility or physical-phone
usability. Human comparison against Explorer and actual iOS/Android review remain
pending. Promoting the prototype to `/workshop` is a route/interface decision, not
mechanical approval, completion of the full chapter or clearance of release gates.
No merge, deployment or site/CAD publication is part of this change.
