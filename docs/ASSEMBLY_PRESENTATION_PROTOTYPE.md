# Assembly presentation prototype

Review `/workshop/prototype` before migrating the chapter. `/workshop` remains
recoverable and unchanged. This is a two-placement presentation checkpoint, not
a completed chapter. It starts at existing chapter cursor 7: the movement has
been set aside and the separate winding stem is in the work area. The player
fits the coupling wheel and sliding coupling, using the unchanged validator.
State is memory-only; the prototype neither reads nor writes chapter saves.
Reload/reset returns to the explicitly prepared checkpoint, with zero prototype
mistakes. Existing reward bookkeeping is internal to the review fixture.

## Presentation and interactions

The original source coordinate frame, geometry, fitted matrices, finish annotations
and material factory are retained. Explorer and this prototype share `StudioFrame`
(the extracted, unchanged perspective bounds-fit calculation), a 33-degree camera,
ACES exposure 1.05, environment intensity 0.9, the studio lights/environment and
`SurfaceOcclusion`. The legacy workshop had an orthographic inventory-wide camera,
rotated geometry relative to world-space lighting, an extra green hemisphere light
and no contact shading. Those treatments are not used by this route. Movement
uses Explorer's front face view (dial side at this checkpoint); the separate stem
uses its oblique component view. A quiet green CSS mat does not alter illumination.

Only the active assembly and a dragged selection enter the scene. The movement
contains the checkpoint's prepared mainplate, screw and pinned lever, not later
chapter components. The separate stem has its own camera fit; switching views
never calls the validator or changes ownership, set-aside, return or insertion.
Full-chapter migration must keep those physical operations explicit; view selection
must remain a presentation choice.

Parts uses the existing Sheet, catalog search matching and catalog row patterns.
All nine real part groups remain browsable, including installed/available state,
name search, movement/stem grouping and CAD-rendered previews (not icon substitutes).
Drag the preview; the adjacent name is a tap target and scroll-safe area. On phones
the sheet collapses immediately, with pointer capture on the persistent surface.
Tap/keyboard selection offers both explicit destinations and a 44px in-view target.
The selected name/preview stays in the dock; a name follows a drag. A 44px target
assists only screen precision for the already chosen part and active destination.
The unchanged 5mm validator handles other drops. Tool, side and support stay
player-controlled in Placement setup; defaults are fixed, not derived from the next
answer. Escape, Cancel, release outside the mat, pointer cancellation and interrupted
drags do not score. Invalid committed choices retain the selection and explain why.

The prototype contains no legacy inventory layout, scattered loose-part hit targets,
zoom strip, hint rings, chapter timing or save/resume interface. The older interface
is deliberately retained only on the full chapter route until visual approval.

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
  hands/tweezers/screwdriver choices. Current tool validation is provisional.

These are not Marco-approved changes. No lesson rewrite, cushion, support geometry,
insertion path or mechanical behaviour is introduced by this prototype.

## Review boundary

Runner interaction checks cover search, installed status, real thumbnails, explicit
view switching without mutation, keyboard cancellation, wrong part and destination,
menu-to-assembly mouse/native emulated touch dragging, explicit keyboard/tap placement,
completion, reload isolation and byte-identical pre-existing chapter save storage.
The retained chapter workflow still checks the original 15 operations independently.

Automated checks cannot establish visual equivalence or actual-phone usability.
Before full migration, a human must compare the checkpoint parts against Explorer
at the same face/view and inspect finish, contact shading, scale, framing and mat
contrast; then use actual iOS/Android devices for picking, sheet dismissal, capture,
scrolling, cancellation, target reachability and keyboard/accessibility review.
No merge, deployment, source/derived CAD publication or release gate is authorized.
