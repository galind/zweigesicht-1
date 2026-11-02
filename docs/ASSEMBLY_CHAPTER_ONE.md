# Be a watchmaker! — chapter 1

> Deprecated interface. The previous 15-operation workshop was retired on 2 November
> 2026. `/workshop` now opens the movement practice described in [Workshop](WORKSHOP.md).
> This document records the previous chapter design, not the current live controls.
> Recover its verified implementation at `d4b5bcf`; existing saves remain untouched.


Review route: `/workshop`, reached directly from **Be a watchmaker!**.
The former `/workshop/assembly` URL redirects here; Easy/Hard have been retired.
The chapter implements Tabelle1 B5:E19 of Marco's supplied workbook, through
the winding bridge and its two screws. [Provenance](../assets/source-manifest/assembly-chapter-one.json)
records the workbook hash and existing asset evidence. No workbook, new CAD,
holder download or cushion is included.

## Occurrence mapping and interpretation

In the table, `P` expands exactly to
`p_0_1_1_1__0_1_1_1_4__0_1_1_83_`. The executable
[lesson definition](../explorer/src/assembly/lesson.ts) contains full IDs.
Mappings use source names, parentage and existing fitted transforms from
`explorer/public/models/assembly-manifest.json` and its `worldTransform` matrices. Before deleting the retired Easy/Hard manifest,
all 22 chapter transforms were verified identical to these source matrices.

| Action / workbook row | Source occurrences or operation |
| --- | --- |
| 1 / 5 | Existing `movement.glb` holder; separate STL source, no movement-CAD occurrence ID |
| 2 / 6 | `P54__0_1_1_194_{1,2,3,4,5,6,7,8,9,10,14}`: prepared plate, fixed jewels and pins |
| 3 / 7 | `P33`, definition `d_0_1_1_180`: setting-lever screw |
| 4 / 8 | Rigid turn of the currently installed plate leaves and `P33`; exchange `movement.glb` for existing `dial.glb` |
| 5 / 9 | `P70__0_1_1_247_{1,2}`: setting lever and its pin |
| 6 / 10 | Move the installed 14-leaf assembly and dial support to the left; no new components |
| 7 / 11 | `P27`, `ml01 Aufzugwelle`: winding stem |
| 8 / 12 | `P5`, `ml01 Kupplungsrad z17 m0,15`: coupling wheel |
| 9 / 13 | `P28`, `ml01 Kupplungstrieb`: sliding coupling |
| 10 / 14 | Move `P27`, `P5`, `P28` together to the right; no new components |
| 11 / 15 | Return the 14-leaf movement to centre, movement side up, with movement support |
| 12 / 16 | Transfer `P27`, `P5`, `P28` into the movement at unchanged fitted transforms |
| 13 / 17 | `P64__0_1_1_239_{1,2,3}`: winding bridge and two pins |
| 14 / 18 | `P73`, definition `d_0_1_1_122`: bridge screw 1 |
| 15 / 19 | `P79`, definition `d_0_1_1_122`: bridge screw 2 |

The screw labels in the CAD are generic. `P33` shares the setting lever's
X/Y axis at (15.75, 1.95) mm, with its head toward the movement side.
`P73` and `P79` are the existing winding-bridge fasteners in the authored
inventory, at X=12.8502356932679, Y=−2.1/+2.1 mm and identical Z, within
the bridge footprint. The numbered order **1 = P73, 2 = P79** is provisional:
Marco did not distinguish their occurrence IDs. The coupling-wheel name is
resolved to the unique `Kupplungsrad` at P5, coaxial with the P27 stem along X;
it is distinct from the hand-setting wheel at P30. The supplied order is wheel
then sliding coupling, overriding the opposite legacy dependency. These
identity/pose checks do not verify a collision-free physical insertion path.

The source foundation has more parts than a bare plate. This prototype keeps
the 11 fixed plate/jewel/pin leaves above as one prepared part. It defers
`P54__0_1_1_194_11`, `_12` (later cap-plate screws) and all five leaves beneath
`P54__0_1_1_194_13` (Incabloc). Marco's later row 47 installs Incabloc; the
retired Easy/Hard Workshop preinstalled it. This chapter does not. No deformation or
spring-opening animation is implied. Prepared pinned lever/bridge subtrees
are retained because their pin installation is not a chapter operation.
Chapter completion accounts for exactly **22 distinct leaves**, not the
complete movement. Transfers, turns and supports never increment that count.

## Supports and display

The holder runtime hashes are checked before play becomes available. Missing
or incorrect holder files fail clearly with Retry; there is no substitute
geometry. Local existing files live at ignored `explorer/public/bench-local/`.
The existing approved hosted asset preparation can supply the same URLs after
separate deployment authorization. This branch disables Vercel Git deployment.

The renderer reuses existing GLBs, source-surface finishing, materials, studio
lighting and fitted matrices. It uses a fixed orthographic camera with zoom,
and rigid, explicit orientation changes. Original STEP geometry is unmodified.
The movement side uses the recorded +90° X rotation and 12.2 mm seat; dial
side uses −90° and 16.3 mm. Both holders retain the recorded 90° Y rotation
after their source Z-up conversion. Cross-fit evidence records intersections
for the opposite holders, so the prototype exchanges them on turn/return.

Partial assemblies have not been physically qualified. The existing nominal
mainplate evidence does not establish stability, clamping, tool clearance or
insertion paths for the plate plus screw/lever or stem/bridge stages. Setting
aside the movement carries its support. The stem is built in the clear central
area using the existing relative fitted poses, without claiming it seats in a
movement holder. All arrangements remain on one visible surface. Turn/exchange
is an atomic visual operation, not an articulated servicing simulation.

## Session and interaction rules

`lesson.ts` defines tools, source IDs and all 15 operations. `session.ts` owns
sequence checks, scoring, Undo, validation and active-time accounting.
`AssemblyViewer.ts` owns only route-local rendering, drag preview, model-space
drop measurement and resource cleanup. It imports no first-person navigation,
collision system or running-movement controller.

The redesign is our proposed visual/interaction interpretation, not a
Marco-approved design. Select Hands, Tweezers or Screwdriver, then drag the
actual geometry. Transparent, geometry-attached hit targets provide at least
44 px for small parts, keyboard focus and touch naming without enlarging CAD.
Loose components are grouped around an empty centre; portrait screens rearrange
the same surface. The supported movement and separate stem remain visible when
parked. No separate assembly screen or free camera navigation is introduced.

Select the mainplate or movement and use **Turn over** to preview the opposite
side. For a movement turn or return, **Support** asks the player to select
one of the actual red supports, then place the movement in the central area.
These choices are not inferred from the next lesson answer. Turning is an
inspection preview until seating is committed; it is not a qualified handling
or insertion animation. The accepted frame uses the recorded exact seat. Dragging
a supported movement carries a visual copy of its existing support.

Inspection, Escape, pointer cancellation, capture loss, blur and releases
outside the surface do not score. Wrong committed attempts deduct 2 once;
successful operations award 10 once. Placement measures the dragged group's
centre at the target height, in X/Z millimetres. The default is still 5 mm;
10 mm and seat hints are available only through **Workshop menu → Development /
review**. Materials and local fitted matrices are unchanged; only rigid parent
presentation transforms and surface layout change.

The non-drag path is part of normal play: focus/select geometry, then activate
**Place…**, then one of the three destinations in the shared Explorer panel. The central action names the physical
receiver (work area, movement or loose stem); the two side areas remain available
for wrong destinations. It uses the same validator with exact seat distance,
without automatically choosing a part, tool, side or support. Tool assignments,
prepared boundaries and screw numbering remain provisional and documented here
and in the explicit review panel, rather than in normal player instructions.

Zoom and Show all parts preserve a stable orthographic camera and live in the
Workshop menu alongside score, time and restart. Tools and Undo share the compact
Explorer dock; pause, help and menu remain in the site header. The shared Sheet
component handles focus, dismissal and scrolling for destinations and blocking
pause/help/restart panels. One instruction stays above the green mat. Part names
and turning/support actions share one contextual row; there are no permanent
placement rings, floating part names or surface buttons. Destination names appear
only while dragging. The working geometry does not move when selection changes.

The separate key `zweigesicht:watchmaker:chapter-1:v1` preserves existing
`zweigesicht:play:session:v1` saves untouched. Those retired saves are not read or
migrated; old difficulty links now open this chapter. A run ID and revision reject stale releases;
an attempt ledger rejects duplicate events. Undo preserves the highest awarded
operation and all penalties, so replay/reload cannot farm points. Resume starts
paused. Restart explicitly replaces only this chapter. Malformed/incompatible
saves require an explicit restart; storage failures leave play in memory and
show a notice. Hidden/unfocused, paused, loading, graphics interruption and
suspended intervals are excluded; a long animation-frame gap is not counted.
Completion stops the clock and displays chapter completion only.

## Review and verification

`tests/assembly-chapter.test.mjs` covers source identities and component
accounting, all 15 operations, all error dimensions, support changes, separate
stem ownership, scoring/idempotency/Undo/reload, storage failures, active timing,
scene transforms and cancellation/repeated releases. Existing GitHub CI also
runs the full regression suite, chapter-asset validation, TypeScript, lint and both
production builds. The separate `Assembly chapter` GitHub workflow runs
`scripts/review/assembly-chapter.mjs` in Chromium on the runner. It reuses the
existing approved UAT holder GLBs, verifies their hashes, then checks direct
homepage entry, old difficulty links, the prototype URL redirect, all 15 operations
with real desktop pointer input, all 15 with Chromium-emulated touch input, and
all 15 through the keyboard/non-drag path. Drop locations are independently
projected from recorded CAD bounds and seats; no renderer shortcut performs the
drag tests. Cancellation, wrong parts/tools/orientations/supports/destinations and
distance, Undo, pause/reload/resume, restart confirmation/cancellation,
legacy-save isolation and missing-holder recovery remain covered. Viewport and
44 px target checks cover desktop and 390/320 px portrait layouts, including
selected-movement controls. The 320 px check also completes all 15 operations
through native taps and explicit destination choices. Checks cover contextual
control visibility, help discovery, placement cancellation and keyboard focus
restoration, and require at least half the viewport for working space. It uploads no
models or screenshots. These checks are distinct from human visual judgement
and actual-phone validation. See [PROGRESS](../PROGRESS.md) for exact results.

Next human review: play the chapter with Marco, confirm the screw numbering,
prepared-component boundary and tool assignments; review partial-assembly
holder contact/stability and insertion order. Then assess 5 versus 10 mm,
camera/zoom, pointer and keyboard usability on representative devices. No local
test, build or browser automation is required for implementation; CI and human
visual review remain distinct evidence. No remaining chapter, full disassembly,
running animation, spring deformation or screw-thread simulation is included.

### Human and physical-device review still required

- Assess the composition, part readability at normal zoom, discoverability of
  turning/support changes, and whether the single instruction/feedback area is easy to follow.
  Automated viewport checks do not establish visual quality.
- Play the full chapter on actual iOS and Android phones. Check finger occlusion,
  tap versus drag, contextual Place… discovery, page-scroll prevention, zoom/Show all, orientation changes,
  browser chrome resizing and background/resume. Chromium's 390 px touch
  emulation and 320 px containment checks do not qualify physical devices.
- Review screen-reader naming, focus order, modal focus and the complete
  keyboard/non-drag path with representative users.
- Marco reviews the tool assignments, screw numbering, prepared-component
  boundaries and the physical contact/stability and insertion paths of partial
  assemblies. The visual redesign does not clear any mechanical or release gate.
