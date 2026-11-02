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
There are no hands/tweezers/screwdriver controls or prerequisites. Orientation and
support remain explicit in Placement options with fixed movement-side fixture
defaults. The single movement surface is the explicit destination for both dragging
and the labelled tap/keyboard action. Cancellation never submits an attempt.

## Rendering and phones

`WorkshopViewer` retains source geometry, matrices, materials and finish annotations.
It shares Explorer's 33-degree perspective bounds fit, ACES exposure 1.05, studio
lighting/environment at intensity 0.9 and contact shading. The camera shows the
movement side using Explorer's back-face direction/up vector and frames only the
active assembly. The quiet green mat is a CSS surface, without additional green
lighting. No movement animation, new CAD, holders or cushion models are loaded.

The parts panel uses the existing Sheet and catalog patterns. On phones it is a
bottom sheet; picking up a preview closes it while the persistent surface owns
pointer capture. The selected name and preview remain identifiable, with a drag
label and explicit cancellation. Tap/keyboard placement is retained. A 44px target
assists screen precision for the chosen part, with the shared 5mm tolerance for
other drops. The active movement is never fitted around the loose inventory.

## Workbook discrepancies for discussion

Read original workbook on 2 November 2026:
`be a watchmaker - assembling of the Zweigesicht-1-1.xlsx`, Tabelle1.
SHA-256: `725b0035684799c95f4275909d4436fbaf37a6c6201225d97ed5e0349c6cd5a5`.

- Row 5 says **tool leather bench**, and row 6 places the mainplate on it.
  The implementation substitutes a red movement-side support.
- Row 8 flips the mainplate on the leather bench; it does not request a red
  support exchange. The implementation requires an exchange.
- Row 15 returns the movement to the leather bench, Front2 upward. Requiring
  another red-support selection is an implementation interpretation.
- Row 21 introduces **movement holder 1**, after the first 15 operations in
  rows 5–19. It describes the movement rising, leather bench being set aside,
  holder arriving, and movement descending. None of that is simulated here.
- The workbook has part/action/target/upward-direction columns, without mandatory
  hands/tweezers/screwdriver choices. Tool assignments remain historical implementation interpretations; the
  current workshop does not require tools.

These are not Marco-approved changes. No lesson rewrite, cushion, support geometry,
insertion path or mechanical behaviour is introduced by this prototype.

## Verification and review boundary

The Workshop GitHub workflow covers desktop and native emulated touch at 390/320px:
three placements, wrong-part feedback, cancellation, tap/keyboard placement,
search/availability, restart, canonical/legacy URLs and unchanged chapter storage.
CPU checks cover source-fitted matrices, installed membership, no loose scene
inventory and projected camera framing. The old renderer-specific tests were
removed with that renderer; retained lesson/session tests still protect provenance
and save compatibility.

Automated checks do not establish visual quality, accessibility or physical-phone
usability. Human comparison against Explorer and actual iOS/Android review remain
pending. Promoting the prototype to `/workshop` is a route/interface decision, not
mechanical approval, completion of the full chapter or clearance of release gates.
No merge, deployment or site/CAD publication is part of this change.
