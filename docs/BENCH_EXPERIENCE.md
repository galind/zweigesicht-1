# Single-station walking experience

`/bench` presents **one movement at one station** on the approved oak workbench
and green mat. Press **F** to lift, turn and reseat the complete movement between
bridge-up and dial-side-up. The original matching holder is exchanged while the
movement is raised, as explicitly chosen by the owner. The former simultaneous
pair and its aisle are superseded. Explorer and Workshop retain separate resources.

## Current scene and resting poses — 25 October 2026

One assembly contains **215 movement leaves and four original crown leaves**.
Its source-relative matrices, all 18 reviewed phases, materials, crowns and
geometry remain unchanged. The uncased, undialed presentation continues to omit
three case clamps, their screws and two radial dial-retaining screws under the
[shared assembly rule](CAD_NOTES.md#conditional-assembly-fittings--24-october-2026).
The single station is at **(0, 0, −7) mm**. `atelier-layout.json` stores its position
and the two resting specifications; those specifications are not two instances.

| Resting side | Movement X rotation / local Y | Original holder |
| --- | --- | --- |
| Bridge-up | +90° / 12.2 mm | `movement.stl` |
| Dial-side-up | −90° / 16.3 mm | `dial.stl` |

Both intact holders retain source X −90° followed by world Y +90°, aligning the
source −Y stem relief with the crown. Only one is visible and colliding at rest.
Both local holder assets load before entry; a missing asset keeps loading recovery
available. The spare holder has no second visible station. No CAD is cut, morphed,
scaled, repaired or silently replaced with a universal holder.

The light wooden tabletop is a straight **270 × 160 mm rectangle**: X −115…155,
Z −85…75 mm, with surface Y−1 and underside Y−15. The 14 mm slab has
0.35 mm edge bevels; the rim has separate 0.25 mm bevels. A continuous 6 mm wide rim rises 5 mm along the back and
sides, ending at Z65; there is no front fence. The **240 × 130 × 1 mm** green mat
spans X−100…140, Z−65…65, leaving **10 mm of wood before the front edge**,
15 mm at either side and 20 mm behind. The surfaces are centered on the whole
parts arrangement; object positions and scale remain unchanged.
Arrival and explicit R reset remain at feet (0, 0.002, 54), facing −Z. The visitor
stays **1.65 mm tall**, radius **0.22 mm**, with eyes **1.48 mm above their feet**,
68° vertical FOV and no bob/roll.

## Oak parts stand and hold Shift to run — current local stage

The movement stays centered at (0, −7). The open steel case now sits to its left
at (−55, −7), directly on the mat, rotated 90° so its lugs run along Z in line
with the movement. Both dials and their matching hand sets share one low oak
stand to the right: X40…116, Z−47…29, top Y2 and bottom Y0 mm.
The compact 76 × 76 × 2 mm stand has 4 mm clipped corners and a 0.3 mm edge bevel.
It uses the tabletop's oak material and rebaked contact shading. Each bore mouth
has a 0.025 mm chamfer that removes wood without narrowing its fitted clearance. No boxes, glass,
labels or additional controls were added to the display.

The central dial is at (62, −25), with its Fine hands beside it at (98, −25).
The reverse dial is at (62, 12), with its Lance hands at (98, 12). Both
dial backs now contact the stand at Y2, with their original pins and screw ends
entering **ten genuine through-holes**: two central-dial pins, three reverse-dial
screws and five hand bushings. The central-dial pins extend 1.5 mm below the rear
support plane; the reverse-dial screw ends extend 0.568041 mm. Horizontal hand blades contact the
wood directly; the three curved blades receive rigid tilts of 1.421°, 1.155° and
4.103° so their original lower support points meet the wood. No blade is reshaped.

`prepare-parts.mjs` measures broad downward dial surfaces and lower blade support
planes from decoded CAD. It clips every protruding triangle at the stand surface
and groups connected projections, then fits through-bores with 0.12 mm radial
clearance. This is an authored display allowance. Hole centers, radii, contact
spans, support areas and tilts are recorded in `bench-parts-layout.json`.
Blender subtracts circumscribed 64-sided cylinders before UV projection and the
contact bake; the rendered and collision surfaces share those actual bores.
All pin and bushing tips remain above the mat; the deepest pins retain 0.5 mm clearance. The 78 detached leaves preserve
source geometry, finishes and bushing relationships. Both case crystals remain omitted. Actual CAD and stand triangles
collide; the case center opens to the mat. The stand, case and all parts clear
both holders and the continuous movement flip envelopes. The front approach
and paths on either side of the movement remain clear.

Hold either **Shift** while using WASD to run at **11 mm/s**, twice the ordinary
5.5 mm/s horizontal speed. Existing 22 mm/s² acceleration smoothly transitions
between speeds; diagonals are normalized. Shift also speeds horizontal travel in
air but never alters vertical thrust or gravity. Releasing Shift returns to walk;
menu, focus loss and reset clear the held input. The entry popup, pause menu and
walking hint show **Shift · Hold to run**. Physics substeps account for run speed.

Initial stand/running evidence: `artifacts/workshop-stand/`; fitted seating and
bore evidence: `artifacts/workshop-seating/`; compact stand and aligned case:
`artifacts/workshop-compact-stand/`; smaller tabletop and mat:
`artifacts/workshop-small-table/`. The finished surface pass is recorded in
`artifacts/workshop-polish/`; its environment has **6,240 visible/collision
triangles, 2 draws/pass and 6.67 MiB baked textures**. Verification includes
144 CPU tests, typecheck/lint/build, 10 parts checks, 65 environment checks and
32 flip checks. **10 real-keyboard run checks** cover both Shift keys, release, simultaneous
Shift keys, pause and resume. Overview and stand detail captures were reviewed.
The **5 seating checks** independently check all clipped source triangles against the
actual exported wood, verify separated contacts for all seven supported packets,
and probe every bore center and inner/outer rim. All 11,622 clipped triangle
points clear the wood with at least 0.12 mm nominal radial clearance. Exposed-bore
captures hide the CAD only for inspection; ordinary views retain every selected part.

## Finished materials and lighting — 25 October 2026

The compact footprint, source CAD, fitted seating, both original holders, arrival
and controls are unchanged. The slab is now 14 mm thick; its eased edges, the
rim and the 2 mm stand share restrained satin oak. The 1 mm mat retains its
exact extents and has 0.04 mm edge easing. Three-segment outer bevels and smooth
bore walls retain closed manifold collision geometry. A concealed 0.5 mm rim lap
is unioned into the slab, eliminating the exposed underside-bevel crevice. Area-weighted
normals keep large faces planar while the bevels catch light. The ten bore mouths receive
only a 0.025 mm chamfer; outside radius +0.04 mm the original Y2 seating plane
is intact, with 0.12 mm nominal pin clearance and 0.5 mm deepest-pin/mat clearance.

The existing Blender pipeline bakes low-contrast grain and local 5 mm contact
occlusion. `SurfaceFinish.ts` adds continuous world-space wood fibres/pores and
fine moulded mat grain, including roughness and derivative bump. It adds no
textures or displacement, has no repeating UV tile, and filters detail before
it becomes subpixel. Opaque environment maps use up to 8× anisotropic filtering.
Maker materials and CAD buffers are unchanged.

A softened overhead/right key and warm fill retain metal readability. One cached
4096² hardware-PCF depth map grounds actual CAD, holders, stand and mat. Only the
environment receives these shadows, avoiding new self-shadow artifacts on tiny
metal details. The map refreshes during flips, holder exchanges and lifecycle
settling, then is reused during walking/look. Bias follows the active reversed
or conventional depth mode. The additional shadow target is disposed exactly once;
it is separate from the 6.67 MiB baked-texture budget. No extra continuous
postprocessing or per-object render targets are introduced.

`surface-check.mjs` records external overview/detail/profile views and five
surface-verified visitor positions with the original 68° FOV and 1.48 mm eyes.
It checks shadow reuse, refresh for both rests, target disposal, shader errors
and an unobstructed mat sample against unshadowed rendering to catch shadow acne.
Run in both normal and forced fallback modes, alongside the existing seating,
parts, workshop, run, flip, atelier and lifecycle suites. Output remains local
under `artifacts/workshop-polish/`; generated assets and reference images stay
ignored. Source/output hashes include both runtime surface/lighting sources.

These are authored visual finishes and finite-resolution shadows, not measured
material properties or microscopic contact metrology. Existing device, human
mouse-feel/accessibility and mechanical release gates remain outstanding.

## Historical direct-mat arrangement — superseded by the oak stand

At the owner's request, both dial protectors, both hand boxes, their supports and
membranes are removed. Both case crystals (`d_0_1_1_67`, two occurrences) are
omitted from this bench view. The original catalog and other experiences retain them.
The case contains 35 leaves; the two dials and five intact blade/bushing packets
bring the detached total to **78 leaves**, or **297** with the working movement.

The balanced arrangement keeps the case at (0, −92), places the central/small
dials at (−62/+62, −12), and groups their hands immediately below at
(−62/+62, 24). Positions are bounding-box centers in mm; orientations are
unchanged. The front third of the mat stays clear. Each complete dial or hand
packet is lowered rigidly until its lowest original vertex meets mat Y0. No
source geometry is flattened or rescaled. This is a presentation arrangement,
not a servicing instruction. All exposed CAD triangles now participate in collision;
the open case center reaches the mat with no glass or invisible floor above it.

The Blender environment contains only tabletop, rim and mat. Contact shading is
rebaked without containers, and their transparency shaders and authoring module
are removed. Historical reference URLs and image hashes remain in the provenance
manifest; pose generation no longer requires those photographs. The small dial
retains its fitted enamel material and shared transmission rendering.

Environment: **340 visible/collision triangles, 2 draws/pass, 6.67 MiB textures,
172,216-byte GLB**. Detached CAD: **328,017 triangles**. Source/output hashes match.
The direct-mat baseline passed **141 CPU tests**, inventory, typecheck/lint/build, **64 environment**,
**10 detached-part**, **32 flip** checks, both CAD/holder rest audits and all
**16 source-surface drops**. No browser errors; full-table and detail captures
were reviewed. Production preview rebuilt/restarted at <http://127.0.0.1:4198/bench>.

Direct-mat evidence is in `artifacts/workshop-bare-parts/`; the closer balanced
arrangement is captured in `artifacts/workshop-arrangement/` and passes **7 focused
geometry tests**, typecheck/lint/build, **10 parts** and **64 environment checks**.
These include both complete flips, continuous clearance and walking between the
dial/hand pairs. The protected arrangement
below records the superseded `ef9c8fe` milestone and its measurements.

## Historical protected parts — superseded by direct mat placement

The 450 × 330 mm tabletop surrounds the unchanged 350 × 250 mm mat with 50 mm
wood borders at the sides, 70 mm behind it and 10 mm in front. The closed slab,
6 mm wide / 5 mm high back-and-side rim, light wood, warm background and lighting
are preserved. Rim coordinates derive from the desk bounds. Rectangular capsule
containment remains outward-only at every altitude; the vertical seam/ceiling
fix and 1 mm mat descent/jetpack return remain covered by regression tests.

Five stationary CAD groups now accompany the working movement. Coordinates are
plan-view bounding-box centers, in mm; no part is rescaled:

| Group | Center X / Z | Actual contents |
| --- | --- | --- |
| Detached steel case | 0 / −92 | 37 reviewed leaves, both complete attached lug packets, backs/crystals/seals, tube/corrector; recovered d54 face retained |
| Central protector | −105 / −35 | 16 central structure leaves, no hands |
| Central hand box | −105 / 35 | Fine hour, minute and seconds; each with its original bushing |
| Reverse protector | 105 / −35 | 17 small-dial structure leaves, fitted blue enamel, no hands |
| Reverse hand box | 105 / 35 | Lance hour and minute; each with its original bushing |

The four crown leaves remain on the working movement, giving 299 unique source
leaves across it and the detached groups. Alternate lug occurrences, straps and
buckle are explicitly excluded. `bench-parts-layout.json` records every included
ID, case exclusion and rigid storage transform. `prepare-parts.mjs` derives these
from decoded original vertices, the authoritative membership manifests and
reviewed fitted hand/bushing relationships. Blade fitting precedes a common rigid
packet transform; storage does not flatten or separate the bushings. Source poses,
geometry buffers, finishes, wheel phases and the known d27 defect remain intact.
The case footprint is 48.553 × 42.711 mm and its seated height is 12.456 mm.
All groups fit on the mat and independently clear the actual continuous per-part
flip envelopes and both holders by at least 2 mm. F changes only the working
movement and its original holder; the new groups remain visible and stationary
through both complete animations. No new controls or interactions were added.

### Protective container approximations

Both retailer pages and actual photographs were inspected on 25 October 2026.
URLs and local image hashes are in `assets/source-manifest/bench-parts.json`.
Original procedural geometry follows the Horotec black circular base, clear cover
and three curved internal supports, and the Bergeon rounded clear base/cover with
paired elastic films. Reference photographs are never embedded in runtime assets.

The Horotec listing establishes nominal Ø45 mm, not its internal engineering
clearances. This visual model uses a 45 mm outer diameter, 43.2 mm clear interior,
8 mm overall height, 1.2 mm floor and lid underside at Y7.5. These heights,
wall thicknesses and supports are inferred. The actual central dial is 33.4 mm
across and spans Y2…4.75, including its rear protrusions; the small dial spans
about 17.8 mm and Y2…3.468. Three small pins per protector contact measured rear
ring triangle centroids; curved arms remain below Y1.6, clear of the dials and
feet. Neither decorated face contacts a support or cover.

The Bergeon boxes retain the published **39 × 39 × 17.8 mm** dimensions. The
0.8 mm walls, 4 mm rounded corners and Y8.9 meeting seam are authored assumptions.
Each hand packet's thickness is centered at Y8.9. Two separately rendered thin
sheets deform in opposite directions around the complete packet bounds, returning
to Y8.89/Y8.91 away from the contents. This conservative envelope includes a
nominal 0.035 mm visual clearance; it is not an elasticity/contact simulation or
packaging certification. The actual triangle-interpolated films enclose all
10,543 hand/bushing vertices with minimum clearance 0.0349997 mm. They are
continuous sheets, not shelves or pads, and no contents touch the box floor.

All reachable case, container wall, base and lid triangles collide at their
visible locations. Actual case openings receive no proxy floors; retained source
crystals retain their own collision surfaces. Closed protectors make the internal
dials, hands, supports and membranes inaccessible, so those interiors are
explicitly noncolliding. Walking paths around the groups and between each pair
remain open; wall approaches, lid drops and original movement drops pass.

### Rendering, ownership and budgets

The existing Blender exporter now calls `scripts/bench/containers.py`. It keeps
all procedural containers separate from runtime maker CAD, saves the editable
Blender scene and regenerates the GLB and contact shading. Transparent pieces are
excluded from the opaque occlusion bake, preventing dark container-shaped blocks.
Alpha surfaces sort by container/half; both films are separate meshes. Bench-only
angle-dependent opacity reveals edges and film deformation while keeping contents
readable. Films use double-sided single-pass rendering; depth testing stays on.
No container uses transmission. The small dial reuses the authoritative fitted
enamel optics through the existing shared transmission infrastructure.

| Procedural environment metric | Measured | Target |
| --- | ---: | ---: |
| Visible triangles | 26,900 | ≤40,000 |
| Collision triangles | 6,708 | ≤8,000 |
| Draws per pass | 19 | ≤24 |
| Decoded textures including mipmaps | 6.67 MiB | ≤24 MiB |
| GLB download | 0.874 MiB | ≤8 MiB |

Reused CAD additions are **80 leaves / 344,845 triangles**, reported separately.
The bridge-rest whole scene has 319 active meshes / 1,172,198 geometry triangles;
the renderer reports 196 geometries and five textures. The overview submits
2,212,108 triangles and 590 draws across the main render and **one shared
720 × 450 offscreen target**. No per-container refraction captures are allocated.
Bench owns new groups and material instances, retains shared catalog geometry
until final cleanup, and includes the detached case in the collision world.
Exactly-once disposal, late loading cancellation, route re-entry and graphics
recovery were checked. Explorer/Workshop configuration and materials are unchanged.

Matched local headless Chrome measurements used Apple M4 / ANGLE Metal,
1440 × 900, fixed pixel ratio 1, half-resolution transmission, 30 warmup and
150 measured frames per fixture. The before run is commit `66c2952`:

| Fixture | Before / after p95 frame ms | Before / after p95 render CPU ms | Before / after draws |
| --- | --- | --- | --- |
| External overview | 16.7 / 16.8 | 5.1 / 5.8 | 415 / 590 |
| Bridge close-up | 16.7 / 16.8 | 5.2 / 5.8 | 415 / 489 |
| Dial close-up | 16.7 / 16.7 | 5.1 / 5.4 | 415 / 489 |

Added geometry increases submission cost. These short static fixtures do not
establish physical-device, sustained thermal or human mouse-feel qualification.
The local Vercel analytics script returns 404; all scene assets load successfully.

### Evidence and verification

Current evidence is local/ignored under `artifacts/workshop-parts-layout/`:
`before/after-profile.json`, matched comparison captures, `parts-report.json`,
`workshop-report.json`, `geometry-report.json`, `jetpack-report.json`,
`flip-report.json` and lifecycle/build/CPU logs. `external-*` captures are labelled
external inspection fixtures: complete table, top mat, case/lugs, both dials,
both hand sets from above/oblique/side, and an inaccessible inside-shell sorting
probe. `visitor-*`, arrival and landed captures retain the 1.48 mm eye offset;
they are not overview controls available to visitors. Visual review checked
transparent sorting, readable bores/finishes, support clearance and membrane
suspension against the product photographs. Prior rectangle captures remain
historical in `artifacts/workshop-rectangle/`.

Verified: **141 CPU tests**, inventory validation, typecheck, lint and production
build; **64 environment**, **67 jetpack/collision**, **32 flip**, **8 lifecycle**
and **10 detached-part audit checks**. The independent CAD/holder audit retains
both rests and **16 source-surface drops**, with maximum movement matrix error
5.56 × 10⁻¹⁷. Source-buffer hashing checks every added position/index array and
original normal buffer, including the exact permitted lug recovery. No mechanical or packaging
certification is claimed. Preview rebuilt and restarted at
<http://127.0.0.1:4198/bench>; no push, deployment or redistribution.

## Holder fit and the authorized exchange

[Corrected seating evidence](../assets/source-manifest/holder-seating.json) verifies
zero mainplate/holder solid overlap and seating distance, with 189 bridge and 48
dial distributed support witnesses. Their shoulders are Y12.8 and Y13.7. All four
crown leaves clear each matching holder: minimum 0.702108 mm bridge and 0.100000 mm
dial. This is nominal static fit, not tolerance or clamping certification.

The [new cross-fit audit](../assets/source-manifest/holder-crossfit.json) checks the
original STEP solids in the corrected stem alignment. Neither original holder
supports the opposite face at the tested poses without mainplate penetration:

| Wrong pairing | Existing face height: overlap | Shoulder-adjusted height: overlap |
| --- | --- | --- |
| Dial-up in bridge holder | Y16.3: 0.891236 mm³ | Y15.4: 1.980906 mm³ |
| Bridge-up in dial holder | Y12.2: 38.749129 mm³ | Y13.1: 0.330319 mm³ |

The matching controls reproduce zero overlap. Cross-fit is a mainplate-only
rejection of these poses, not an exhaustive search for alternate supports.
The owner chose **exchanging the two original holders at one station during the
lift**. The exchange is a discrete visual operation at the top of the lift;
it does not represent a maker-supplied mechanical turnover fixture or a certified
service procedure. No new physical holder mechanism is claimed.

Reproduce with `.venv-cad/bin/python scripts/bench/holder-crossfit-probe.py`.
Full reports stay in `artifacts/bench-flip/`; source URLs/hashes remain in
`assets/source-manifest/`. The existing STEP import shape-processing warning is
retained; audited plate, holder and Boolean result solids pass validity checks.
Other internal CAD limitations remain unchanged.

## Flip and player continuity

**F is provisional**, unused by the prior walking controls. Change `FLIP_KEY` in
`explorer/src/bench/bindings.ts` to update the input handler, homepage controls
popup, Escape menu and concise exploration hints together. No flight HUD,
settings panel, particles, camera shake or camera animation was added.

The four-second operation uses quintic easing: 1.05 seconds of vertical lift,
1.6 seconds of rigid X rotation, 0.2 seconds of dwell and 1.15 seconds of lowering.
The lift height is derived from the actual source/reviewed part bounds and the
holder top, leaving at least 1.5 mm below the turnover envelope. The matching
holder exchanges at mid-turn, fully clear of the movement. Resting heights and
rotations are assigned exactly at completion, with no accumulated transforms.

Safe visitors retain their position, look direction, held input and physical
momentum. Gravity and thrust continue normally. Flip never calls reset or sends
a visitor to spawn. Safety uses continuous conservative per-part lift columns
and X-axis turnover discs, expanded for the upright capsule. This is tighter than
the assembly's overall box; clear space near the crown and below the lift remains
available. These are safety envelopes, not claims of exact swept-solid clearance.

A visitor intersecting that envelope, obstructing the incoming holder, or standing
on outgoing holder support that disappears **blocks the flip**. The existing hint
surface says **“Move away from the movement to flip it.”** Position, view, velocity,
grounded state and held input are left untouched. The message clears once the
visitor moves clear; a fresh F press is required, with no automatic or queued flip.
This supersedes the earlier automatic nearby relocation behavior.

The incoming holder space is reserved by the per-substep guard throughout the
animation and checked again at exchange. An externally injected late obstruction
cancels to the original rest without relocating the visitor. Closed-holder
containment and capsule segments piercing triangle interiors remain included.

During the animation, every physics substep prevents entry into the reserved
sweep and incoming holder. The sweep boundary removes inward velocity while
retaining tangential travel; holder-only crossings stop along the attempted path.
Render and collision matrices update together before player simulation; fixed CAD
leaf matrices are explicitly dirtied after parent movement. The temporary constraint
is removed when the movement rests. There are no permanent proxy floors over
movement openings, and normal triangle collisions remain active throughout.

Repeated/held F presses during a flip are ignored, with no queued second flip.
Escape and ordinary focus loss clear input and release capture; a visible flip
continues to its rest. Hidden-document and graphics-loss events settle atomically
to the checked destination and remove the temporary constraint. Returning does
not capture the mouse automatically. Retry recreates a resting bridge-up scene.
Loading ignores F and cannot queue a flip; disposal cannot revive a late load.
R remains an explicit reset, including during a flip. T remains unused.

## Existing interface and physics

The homepage **Walk inside the movement** button opens the glass controls popup.
**Enter the movement** navigates to `/bench` and requests capture when ready;
direct visits/Back show the compact Enter button. Escape, blur or document hiding
while loading cancels automatic capture. Capture refusal, missing assets and
graphics errors retain the existing recovery actions. Popup and Escape menu keep
the homepage's typography, colors, rounded corners and glass blur. The Escape menu
is centered horizontally and vertically in the viewport, with bounded scrolling
on short screens. Exploration keeps the scene sharp with compact navigation and
one hint row; a rejected flip temporarily replaces that row with a message
centered horizontally and vertically in the viewport.

WASD moves on ground/in air; mouse look is unchanged. Space supplies continuous
26 mm/s² upward acceleration against 18 mm/s² gravity, with quadratic drag
`−0.18 × vy × |vy|`. Releasing thrust coasts then falls; thrust brakes descent
before climbing. Horizontal speed is 5.5 mm/s, or 11 mm/s while either Shift is held,
with 22 mm/s² acceleration. Stepping
is 0.22 mm and disabled while ascending. There is no hover, altitude lock, fuel,
flight toggle or descend key. Desk boundaries constrain only outward travel at
every altitude, leaving edge sliding available. Substeps remain at most 1/180 s,
adapt to high speed and clamp catch-up to 50 ms. The camera far plane still grows
for high flight. Idle scenes sleep; Auto/Low/High detail and loading/disposal
ownership remain unchanged. Narrow/enclosed CAD cavities can require explicit R.

## Local assets and reproduction

```sh
node scripts/bench/prepare-holder.mjs
# Only when re-deriving CAD storage poses:
node scripts/bench/prepare-parts.mjs
blender --background --python scripts/bench/export-environment.py
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4198
```

Original holder files must exist and match `holder.json`. Install the pinned
explorer dependencies before building. Blender 5.2.1 LTS was used
for this export; its CPU bake uses 64 samples. Editable Blender files and packed
GLB output remain ignored under `assets/generated/bench/` and
`explorer/public/bench-local/`. A hidden 1.65 mm authoring reference is excluded
from export. The loader uses `no-store`; rebuild and restart a production preview
after regenerating assets so its cached content-length metadata also updates.
`build:vercel` still excludes `bench-local`. No release gate is cleared; no push,
publication or redistribution is authorized.

## Verification

Set `PLAYWRIGHT_MODULE` to the installed Playwright `index.mjs` and `CHROME_PATH`
to Chrome, then use `PLAY_QA_OUTPUT=artifacts/workshop-parts-layout` for local reports/captures:

```sh
node --test tests/*.test.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
node scripts/bench/workshop-check.mjs http://127.0.0.1:4198
node scripts/bench/surface-check.mjs http://127.0.0.1:4198
WORKSHOP_DEPTH=fallback PLAY_QA_OUTPUT=artifacts/workshop-polish/fallback \
  node scripts/bench/surface-check.mjs http://127.0.0.1:4198
node scripts/bench/flip-check.mjs http://127.0.0.1:4198
node scripts/bench/atelier-check.mjs http://127.0.0.1:4198
node scripts/bench/jetpack-check.mjs http://127.0.0.1:4198
node scripts/bench/lifecycle-check.mjs http://127.0.0.1:4198
node scripts/bench/ui-check.mjs http://127.0.0.1:4198
```

The flip runner uses actual keyboard capture for both directions, repeat
suppression, Escape/resume, focus loss and before/during/after scene captures.
Explicitly labelled fixtures cover standing on CAD, safe/obstructed positions
beneath it, airborne visitors, late destination obstruction, per-substep entry
protection, rigid component matrices and sampled holder clearances during motion.
The independent atelier audit checks both rests sequentially: source matrices,
18 phases, render/collision agreement, holders/crowns, openings and 16 CAD drops.
The jetpack journey reaches and lands on both faces, flies clear before flipping,
and uses no reset; its fixtures retain all desk edges/corners, high-altitude stress,
sides/undersides, landings and ground circulation. Lifecycle checks include graphics loss during a
flip, retry and interrupted loading. UI checks cover four desktop sizes plus 200%
text, controls, navigation, entry, focus and loading/error recovery.

Current counts and remaining actions are in [PROGRESS.md](../PROGRESS.md).
Current tabletop screenshots and reports remain local in
`artifacts/workshop-rectangle/`. The previous open-space furniture review remains in
`artifacts/workshop-open-space/`; the previous bare-room review remains in
`artifacts/workshop-room-only/`. The earlier decorated revision 3 review remains
in `artifacts/workshop-implementation/`, with its suites in `regression/`.
Earlier flip captures remain in `artifacts/bench-flip-followup/` and
`artifacts/bench-flip/`. Headless checks do not replace physical-device/mouse-feel
or human accessibility review.
Previous paired-station captures, timings and performance claims are historical;
the remaining sections below describe older revisions.

## Historical decorated revision 3 verification and performance — 25 October 2026

These measurements describe the decorated scene before the owner requested the
room-only stage. Current verification is recorded in [PROGRESS.md](../PROGRESS.md).

The local production build passes **130 CPU tests**, inventory validation,
typecheck and lint. Browser suites pass **45 workshop checks**, **32 flip checks**,
**67 jetpack/collision checks**, **8 lifecycle checks**, **157 UI checks** and
**11 interaction/quality/idle checks**. The independent source audit retains all
219 leaves and 18 phases in both rests, with maximum local-matrix error
5.56 × 10⁻¹⁷, matching render/collision matrices and 16 source-surface drops.
A separately forced no-clip-control fixture passes **46 fallback checks**.
All 15 environment geometries, 13 materials and 13 textures dispose exactly once.

Actual keyboard journeys cover both movement faces, clear-and-retry F, mat
walking descent and jetpack return. Four desktop sizes plus 200% text retain the
existing interface. Actual room/desk, arrival, landed-face and high-flight captures
were reviewed against revision 3. Review caught and corrected regular-looking
wood grain, missing contact shading, decal shadowing and distant depth artifacts.
No original CAD, reviewed poses, shared materials, homepage or UI styling changed.

Fresh matched production measurements use the Mac mini M4 / ANGLE Metal,
Chrome 155.0.8059.86, **2400 × 1300 CSS**, device DPR 2, and the existing synthetic
125 Hz turning / walking workload. Each six-second sample follows 700 ms warmup;
there are six scenarios per mode, covering both faces and a wider approach view.
The preserved baseline build and final build use identical settings. All accepted
samples remain natively focused and visible, with zero GPU disjoint events.

| Mode | Baseline frame p95 range | Final frame p95 range | Final render ratio |
| --- | ---: | ---: | ---: |
| Auto | 18.1–18.6 ms | 18.1–18.5 ms | 1.0 throughout |
| High | 18.1–33.7 ms | 18.2–29.7 ms | 1.5 throughout |
| Low | 17.9–18.6 ms | 17.1–18.5 ms | 0.85 throughout |

The maximum paired p95 regression is **1.7%**, within the 10% target. Auto averages
**16.67 ms** over 2,153 measured frame intervals, retaining the reference 60 Hz
cadence without a resolution downgrade. One Auto interval exceeds 25 ms (maximum
30.2 ms); none exceeds 50 ms. Fixed High still misses 60 Hz in close-ups, as did
the baseline. High and Low each have one >50 ms outlier (82.1 / 149.3 ms), so these
p95 results do not claim universally smooth frames or input-to-photon latency.

Full multipass renderer counters are measured with `info.autoReset = false`.
Auto's per-scenario median draw counts range **121–435**, versus **113–415** before;
the wider view changes from 415 to 435. Auto render-submission CPU p95 ranges
**3.4–5.4 ms** (before 3.6–5.2); asynchronous GPU-query p95 ranges **6.3–16.2 ms**
(before 5.3–16.1). CPU submission, driver GPU elapsed and frame intervals are
separate measurements, not additive quantities or physical input latency.
The jewel transmission pass and resolution are retained.

The isolated foreground Chrome sessions declined pointer capture in both builds
(`WrongDocumentError` in the baseline probe). `PROFILE_CAPTURE=optional` records
that failure and permits only this synthetic rendering benchmark to continue;
the default profiler still requires capture. Real keyboard/mouse suites above
require and obtain capture in headless Chrome. This is not a completed native
mouse-feel or human accessibility qualification. Physical devices, sustained
thermal runs and real older-GPU fallback performance remain open. An initial
logarithmic-depth diagnostic regressed badly and was rejected; clip-control GPUs
therefore use reversed depth, with a tested functional fallback for older GPUs.

Evidence, paired JSON, the rejected diagnostic, source/build hashes and the local
review sheet stay under `artifacts/workshop-implementation/`. Reproduce the
foreground comparison against preserved baseline and final production servers:

```sh
PLAY_QA_OUTPUT=artifacts/workshop-implementation \
  BENCH_BROWSER=headed PROFILE_CAPTURE=optional PROFILE_MODES=Auto,High,Low \
  node scripts/bench/interaction-profile.mjs http://127.0.0.1:4198 after-review
# Functional fallback only, not older-device performance qualification:
WORKSHOP_DEPTH=fallback PLAY_QA_OUTPUT=artifacts/workshop-implementation/fallback \
  node scripts/bench/workshop-check.mjs http://127.0.0.1:4198
```

No push, deployment, publication or source/derived CAD redistribution occurred.

## Historical single-station evidence

The following dated results describe earlier revisions with one active
presentation and a T swap. Their controls, placements and timing are historical;
the current behavior and verification contract above supersede them.

## Initial verification (before responsiveness changes)

The browser runner uses actual capture and keyboard events for the journey;
independent forced-fall and geometry probes are labelled separately. It records
screenshots, frame intervals and results under ignored `artifacts/bench/`:

```sh
node --test tests/bench-physics.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH=/absolute/path/to/Chrome \
node scripts/bench/browser-check.mjs http://127.0.0.1:4176
```

Additional browser runners are `scripts/bench/collision-check.mjs`,
`presentation-check.mjs`, `lifecycle-check.mjs`, `home-entry-check.mjs` and
`performance-check.mjs`.
They use the same environment variables and local server URL. The lifecycle
runner checks browser tab focus loss; because headless Chrome reports inactive
tabs as visible, it separately injects a hidden-document event to check the
visibility handler and stopped frame scheduling. Collision and
presentation probes are independent fixtures, not substituted for the keyboard
journey. The performance runner alternates W/S for 60 seconds from a recorded
bridge fixture; its start placement is explicitly synthetic.

On the reference Mac mini (Apple M4, 10-core CPU, 24 GB RAM), macOS 26.6.2 and
Chrome 155.0.8059.86 using ANGLE Metal, the production journey recorded 1,476
active frame intervals at 1440 × 900 / pixel ratio 1: mean 16.666 ms, p95 16.7 ms,
p99 16.8 ms. The separate 60.196-second sample at the same viewport / pixel ratio
1.5 retained High detail: 3,600 recorded intervals, mean 16.666 ms, p95 16.7 ms,
p99 16.8 ms and p95 CPU update/submission time 5.4 ms. CPU timing is not GPU time;
these are headless desktop measurements, not broad device certification. The
ring buffer holds the latest 3,600 intervals, so startup compilation and earlier
frames are not part of that sustained sample.

Sixteen source-surface drop samples on both faces settled without falling through.
The source-matrix comparison was exact (maximum error zero); dial-side sampled
floor heights ranged from 9.2 to 18.11 mm, with 130 lower opening samples. These
samples and the swept-step unit tests support the implemented journey, not an
exhaustive proof over every source defect or possible route. Very narrow or deep
recesses may require R to return to the mat. Tiny details below the 0.44 mm visitor
width cannot all be entered. The inherited CAD exceptions in `CAD_NOTES.md`
remain; no source repair, measured material claim or mechanical certification is
implied. Auto and fixed Low detail provide lower-resolution options; weaker physical devices and
long thermal runs have not been qualified.

Final regression results and remaining actions are recorded in `PROGRESS.md`.
Browser measurements establish performance only on the recorded machine and
settings. Mobile navigation, expert mechanical review, physical-device coverage
and representative human accessibility/usability review remain outside this
local milestone.

## Responsiveness verification — 24 October 2026

Baseline: clean local `989bd6f`, on `codex/walk-inside-movement`. The old one-minute
headless result above did **not** reproduce the owner's large foreground view.
The new paired workload uses visible Chrome 155.0.8059.86 / ANGLE Metal on the
Mac mini M4 (10-core CPU/GPU, 24 GB), macOS 26.6.2. Main display: 2560 × 1440 logical pixels
at 60 Hz (5120 × 2880 backing); secondary display remains connected at 75 Hz.
Browser viewport: **2400 × 1300 CSS, device DPR 2**. No CPU/GPU throttling.

`interaction-profile.mjs` places the visitor at X −8, Z 0 on each face's actual
floor, looks downward, and alternates rapid yaw/pitch input. Each six-second
sample follows a 700 ms placement warmup. Walking adds alternating W/S intent.
These are synthetic 125 Hz DOM mouse events and key-state fixtures, not a human
walkthrough. Pointer capture is checked first, then released for the repeatable
workload. The menu is hidden. Every input checks document focus/visibility;
all accepted paired runs remained focused and visible throughout. The shared
`foreground-browser.mjs` launches an isolated normal Chrome process and connects
with Playwright 1.62.1, `noDefaults: true`, and its default context. This is essential: Playwright's
usual session emulates focus and visibility, and a second CDP session cannot
undo that first session's override. Native tests also verify actual minimization.
Earlier emulated-focus runs are exploratory evidence only. The old
automatic downgrade is suppressed **only in the benchmark** to keep baseline
High fixed. Early exploratory runs with capture loss or changed quality were
excluded from the paired results.

Intervals below are between actual render submissions, including scheduling
and back-pressure. They are not presentation timestamps or physical input latency.
Each cell lists **p50 / p95 / p99 in ms**; long frames mean over 25 ms.

| Close-up workload | Before High (1.5) | After Auto (1.0) | Long frames before → after |
| --- | --- | --- | --- |
| Bridge, stationary turning | 27.7 / 35.1 / 49.5 | 16.7 / 17.4 / 17.6 | 155/220 → 0/359 |
| Bridge, walking + turning | 27.6 / 34.3 / 36.9 | 16.7 / 17.6 / 17.7 | 150/218 → 0/359 |
| Dial, stationary turning | 26.5 / 32.5 / 33.4 | 16.7 / 17.3 / 17.6 | 146/224 → 0/359 |
| Dial, walking + turning | 27.9 / 36.6 / 37.9 | 16.7 / 17.2 / 17.5 | 171/209 → 0/360 |

Auto stayed at ratio 1 for every paired sample. Across those four runs it had
0 frames over 25 ms out of 1,437 (maximum 21.4 ms), versus 622/871 for baseline
High (maximum 67.4 ms). Baseline High had five frames over 50 ms; Auto had none.
This improves the measured workload substantially but does not guarantee every
foreground frame or establish human-perceived responsiveness.

At the **same High resolution**, reducing just the transmission pass to half
width/height lowered baseline p95 from 32.5–36.6 ms to 22.7–28.8 ms. Final manual
High measured p95 23.2–29.2 ms, p99 24.1–32.4 ms, 85/1,254 frames over 25 ms,
maximum 32.8 ms; it remains deliberately fixed and can be slower than Auto.
Baseline Low measured p95 17.7 ms, p99 17.8–18.0 ms, 0/1,437 over 25 ms.
Final Low measured p95 17.3–17.6 ms, p99 17.7–17.9 ms, 1/1,435 over 25 ms
(maximum 25.4 ms). Neither Low set had frames over 50 ms. Lower resolution alone
helped, and the transmission experiment independently established an expensive pass.

The renderer's full multi-pass counters showed median draw calls around 121–217
in baseline High. Disabling transmission in an exploratory emulated-focus diagnostic reduced
that to roughly 66–120 but removed intended jewel optics; that diagnostic was **not** adopted. Half-resolution transmission retains
the pass and its draw calls while cutting its target pixel count by 75%.
Brushed/frosted/blue finishes and all CAD topology/placements remain unchanged.
Static full/half-pass close-ups of both faces were inspected; openings and opaque
surface detail remain readable. No collision/physics change was made.

CPU and GPU measurements are separate:

- Baseline High p95 render-submission CPU was 6.9–8.5 ms; walking physics p95
  was 0.7–1.3 ms. Final Auto was 4.4–4.9 ms and 0.3–0.6 ms respectively.
- Asynchronous `EXT_disjoint_timer_query_webgl2` was available, with zero
  disjoint events. Driver-reported GPU elapsed p95 was 60.0–67.1 ms for baseline
  High, 41.6–52.5 ms for the isolated half-transmission experiment, and
  11.8–15.6 ms for final Auto. These queries bracket the render submission's GPU
  work; they can reflect pipeline scheduling/contention and are not added to CPU
  time or interpreted as input-to-photon latency. No synchronous `gl.finish` is used.
- The oldest pending synthetic input's handler-to-render p95 fell from
  26.7–29.7 ms to 14.3–15.3 ms. This excludes OS/device delivery, compositor and
  display scanout. It supports improved frame scheduling, not a measured physical
  mouse-latency claim.

A separate `first-use-profile.mjs` run used fresh Chrome processes with the
existing OS/driver cache. The original commit was rebuilt locally in an ignored
archive for the paired loading and side-switch probe. Navigation-to-ready polling
was 368 ms before and 457 ms after; initial render CPU was 233.7 ms before and
100.9 ms after. Precompilation moves work into loading but does **not** eliminate
first-paint uploads/program creation: 9 additional programs still appeared on
that first render after precompilation. During subsequent first close-up turns,
no additional programs appeared. Baseline bridge turning had six intervals over
50 ms (maximum 82.8 ms); after Auto had none (maximum 17.9 ms). Dial switch
fade/ready time was 413 ms before and 411 ms after, consistent with the authored
400 ms transition. First dial-turn p95 was 33.4 → 17.5 ms. These are single
first-use observations, not cold-driver or cache-independent guarantees.

Reproduce with the existing Playwright/Chrome environment variables:

```sh
# The server must be a production build of the revision under test.
PROFILE_MODES=High,Low,HalfTransmission \
  BENCH_BROWSER=headed node scripts/bench/interaction-profile.mjs http://127.0.0.1:4180 before-native
PROFILE_MODES=Auto,High,Low \
  BENCH_BROWSER=headed node scripts/bench/interaction-profile.mjs http://127.0.0.1:4178 after-native
BENCH_BROWSER=headed node scripts/bench/first-use-profile.mjs http://127.0.0.1:4180 before-native High
BENCH_BROWSER=headed node scripts/bench/first-use-profile.mjs http://127.0.0.1:4178 after-native Auto
node scripts/bench/interaction-check.mjs http://127.0.0.1:4178
HEADED=1 node scripts/bench/lifecycle-check.mjs http://127.0.0.1:4178
HEADED=1 node scripts/bench/browser-check.mjs http://127.0.0.1:4178
```

Evidence stays under ignored `artifacts/bench/`: `before-native.json` (accepted High samples), `before-native-other.json` (Low
and transmission comparison), `after-native.json`, `before-native-first-use.json`,
`after-native-first-use.json`, interaction/lifecycle/journey
reports and `finish-*.png`. The comparison is local foreground automation on
one machine. Physical mouse feel, other browsers/GPUs, prolonged thermal behavior
and high-refresh displays remain unverified. First paint still has measurable
CPU work, and a fixed High choice can miss 60 fps at this viewport. Publication
and redistribution gates remain unchanged.

### Regression results

All 107 CPU tests pass, including six new tests for coalescing, sparse look input,
idle/slow-frame separation, sustained quality transitions, cooldowns, bounds and
manual overrides. The visible-browser interaction runner passes 11 checks: its
browser-dispatched stationary look recorded 179 animation-frame samples with no
held keys, and a quiet captured interval kept render/sample counts unchanged.
A separately labelled 20-second injected CPU stress fixture reduced Auto from
1 to .85 to .7 with changes roughly eight seconds apart; this tests adaptation,
not normal device performance. Manual High and both side switches passed.

The complete visible journey passes 23 checks and records p95 17.6 ms at
1440 × 900 / render ratio 1. Seven lifecycle checks pass, including real focus
loss and hidden/minimized state, stopped hidden rendering, explicit recapture,
WebGL-context retry and late-load disposal. The helper suppresses browser startup
prompts and settles the native window before input; it does not emulate focus.
The explorer passes seven suites / 350 checks, and Workshop entry and focused
interaction pass 17 and 92 checks. Inventory, typecheck/lint, production and
Vercel packaging builds, and HTTP metadata checks pass. The local preview retains
`bench-local`; the Vercel package excludes it. No publication is authorized.
