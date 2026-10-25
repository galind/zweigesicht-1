# Single-station walking experience

The current interaction-performance review, including visible Firefox evidence,
entry preparation, Auto policy and remaining limits, is recorded in
[Bench performance](BENCH_PERFORMANCE.md). Earlier static frame-time results
are historical spot-checks, not sustained interaction qualification; see the
[review history](REPOSITORY_REVIEW.md#historical-evidence).

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

The neutral warm oak tabletop is a straight **230 × 160 mm rectangle**:
X −115…115, Z −87…73 mm, surface Y−1 and underside Y−13. The 12 mm slab
has 0.35 mm edge bevels and a 1.2 mm underside chamfer; the rim has 0.25 mm bevels. A continuous 6 mm wide
rim rises 5 mm along the back and sides, ending at Z58; there is no front fence.
The **200 × 130 × 1 mm** muted green mat spans X−100…100, Z−72…58,
leaving **15 mm wood borders on all four sides**. Both rectangles are centered
exactly on the unchanged movement at (0, −7), following the owner's correction
to the earlier offset arrangement. The case and movement retain their positions;
only the right-hand display is packed closer. No watch CAD is rescaled.
Arrival and explicit R reset remain at feet (0, 0.002, 54), facing −Z. The visitor
stays **1.65 mm tall**, radius **0.22 mm**, with eyes **1.48 mm above their feet**,
68° vertical FOV and no bob/roll.

## Oak parts stand and hold Shift to run

The movement stays centered at (0, −7). The open steel case now sits to its left
at (−55, −7), directly on the mat, rotated 90° so its lugs run along Z in line
with the movement. Both dials and their matching hand sets share one low oak
stand to the right: X40…96, Z−45…20, top Y2 and bottom Y0 mm.
The compact 56 × 65 × 2 mm stand has 1.5 mm rounded corners and a 0.2 mm edge bevel.
Its lighter oak finish is distinct from the deeper oiled desk, with rebaked contact shading. Each bore mouth
has a 0.025 mm chamfer that removes wood without narrowing its fitted clearance. No boxes, glass,
labels or additional controls were added to the display.

The central dial is at (60, −25), with its Fine hands beside it at (86, −25).
The reverse dial is at (60, 7), with its Lance hands at (86, 7). Hand packet
centers are 5 mm apart. Both dial backs contact the stand at Y2, with their original pins and screw ends
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
menu, focus loss and reset clear the held input. The Bench introduction, pause menu and
walking hint show **Shift · Hold to run**. Physics substeps account for run speed.

Initial stand/running evidence: `artifacts/workshop-stand/`; fitted seating and
bore evidence: `artifacts/workshop-seating/`; compact stand and aligned case:
`artifacts/workshop-compact-stand/`; smaller tabletop and mat:
`artifacts/workshop-small-table/`. The finished surface pass is recorded in
`artifacts/workshop-polish/`; the centered layout and revised finish are in
`artifacts/workshop-centered/`. The deeper wood and edge pass is recorded in
`artifacts/workshop-wood-finish/`. The current environment has **7,196 visible/collision
triangles, 3 draws/pass and 12 MiB baked textures**. Verification includes
144 CPU tests, typecheck/lint/build, 10 parts checks, 65 environment checks and
32 flip checks. **10 real-keyboard run checks** cover both Shift keys, release, simultaneous
Shift keys, pause and resume. Overview and stand detail captures were reviewed.
The **5 seating checks** independently check all clipped source triangles against the
actual exported wood, verify separated contacts for all seven supported packets,
and probe every bore center and inner/outer rim. All 11,622 clipped triangle
points clear the wood with at least 0.12 mm nominal radial clearance. Exposed-bore
captures hide the CAD only for inspection; ordinary views retain every selected part.

## Finished materials and lighting — 25 October 2026

The desk and mat center the unchanged movement; the stand retains its compact
56 × 65 × 2 mm footprint. The slab is 12 mm thick, with a 1.2 mm underside
chamfer that reduces the visible mass. Its top and the rim retain 0.35/0.25 mm
edge easing. The stand has 1.5 mm plan radii (16 segments per quadrant) and
0.2 mm edge easing. The mat, CAD seating, holders, arrival and controls are unchanged.
All solids remain closed manifold. The concealed rim lap is unioned into the slab,
and weighted normals keep broad faces planar. All ten bore mouths retain their
0.025 mm chamfer, 0.12 mm nominal radial allowance and 0.5 mm deepest-pin clearance.

The desk uses deeper oiled oak and the stand a lighter, quieter oak finish.
Their separate materials use dry-satin roughness with restrained reflections.
Both wood atlases are 1024² with wider island spacing to prevent baked shading
from bleeding onto clear surfaces. Blender bakes base colour and local 5 mm
contact occlusion; wood grain no longer
comes from a low-resolution albedo image. An exported `_WOOD_COORD` attribute
stores physical millimetre coordinates for each component: desk/back rail along X,
side rails and stand along Z. The unioned rim is split at the slab and rail joints
without removing faces, so grain frames never interpolate across whole walls.

`SurfaceFinish.ts` evaluates an irregular warped radial field, fine fibres and
sparse, jittered vessel pores. Cut ends and bore interiors sample the same solid
wood field as the top. Derivative filtering suppresses subpixel detail; shallow
bump adds no displacement or collision change. The mat retains its existing
fine-grained finish. All maps remain opaque, with up to 8× anisotropic filtering;
maker materials and CAD buffers are unchanged.

A softened overhead/right key and warm fill retain metal readability. One cached
4096² hardware-PCF depth map grounds actual CAD, holders, stand and mat. Only the
environment receives these shadows, avoiding new self-shadow artifacts on tiny
metal details. The map refreshes during flips, holder exchanges and lifecycle
settling, then is reused during walking/look. Bias follows the active reversed
or conventional depth mode. The additional shadow target is disposed exactly once;
it is separate from the 12 MiB baked-texture budget. No extra continuous
postprocessing or per-object render targets are introduced.

`surface-check.mjs` records external overview/detail/profile views and six
surface-verified visitor positions with the original 68° FOV and 1.48 mm eyes.
It checks exported grain frames/directions, shadow reuse, refresh for both rests,
target disposal, shader errors
and an unobstructed mat sample against unshadowed rendering to catch shadow acne.
Run in both normal and forced fallback modes, alongside the existing seating,
parts, workshop, run, flip, atelier and lifecycle suites. Output remains local
under `artifacts/workshop-wood-finish/`; generated assets and reference images stay
ignored. Source/output hashes include both runtime surface/lighting sources.

These are authored visual finishes and finite-resolution shadows, not measured
material properties or microscopic contact metrology. Existing device, human
mouse-feel/accessibility and mechanical release gates remain outstanding.

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
`explorer/src/bench/bindings.ts` to update the input handler, Bench controls
introduction, Escape menu and concise exploration hints together. No flight HUD,
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

## Homepage invitation — 25 October 2026

The bottom-left **Explore it in first person** invitation uses a warm charcoal
surface, semibold text and a brass outline from the site palette. Its decorative
arrow is optional; hover, pressed and keyboard-focus states remain distinct.

On wide screens it aligns with the bottom of the movement dock. Below 1200 px,
or with enlarged text, it sits above the measured dock to avoid overlap. It
remains outside header measurement and yields to open panels and focused
part/group views. The preview-only Workshop action retains its existing location
and build policy.

The homepage invitation is now a direct link to `/bench`, with no popup and no
prefetch. The route owns an introduction titled **The workbench**: scene context,
shared controls, keyboard/mouse requirement and **Preparing the workbench…**.
The scene loads visibly behind it. Once ready, **Start exploring** requests mouse
capture from that user action. Loading completion, browser Back, reloads and
bookmarks never capture automatically. The old cross-route capture intent and
homepage popup were removed.

Initial focus goes to the introduction heading; loading completion does not move
focus. Tab reaches Start once available; the return link stays accessible.
The introduction is centered horizontally and vertically, with symmetric height
limits that keep the back link clear. It scrolls at short/narrow sizes and
enlarged text. The touch-only explanation uses the same centered placement.
After entry, Esc opens the matching pause menu with full controls and Resume.
Capture refusal, missing assets and graphics errors keep their recovery actions.

`useBenchAccess` checks any fine pointer, any hover capability and the standard
pointer-lock API. It listens for pointer/hover capability changes, supports hybrid
devices and does not classify by screen width or user-agent. Browsers cannot
reliably detect physical keyboards, so the requirement stays explicit. API
presence cannot guarantee capture permission; runtime refusal still has recovery.
Touch-only devices see a non-interactive **Explore on desktop** invitation with
**Keyboard and mouse required.** Direct `/bench` visits show the explanation and
a return link, without importing the viewer or requesting scene assets. Browsers
without the mouse-capture API get an additional browser-support explanation.

Visible review covers desktop, narrow windows, 200% text, native Chrome capture,
movement and Esc, and native touch emulation toggled in both directions. Automated
checks include phone/tablet touch emulation, API absence, keyboard navigation,
normal/reduced motion, explicit entry, loading/errors and lifecycle cleanup.
Evidence is local in `artifacts/bench-route-introduction/`; current results are in
`PROGRESS.md`. Emulation does not replace physical-device or release gates.

## Existing interface and physics

The homepage **Explore it in first person** link opens the Bench introduction.
**Start exploring** captures the mouse after loading; direct visits and Back use
the same introduction. Loading never captures automatically. The introduction
and Escape menu share a centered warm-charcoal panel with a restrained brass edge,
the homepage's typography and a prominent Start/Resume action. The compact panel
uses one title, a short first-use description and key badges without additional
visible section headings. Controls stack into a single column when the panel is
narrow or text is enlarged. The pause
menu's quieter footer contains Reset and an explicit **Detail: Auto / Low / High**
select; its Auto explanation remains available to screen readers. All actions have visible keyboard
focus, and scrolling brings them into view on short screens. Hover/pressed states
use color changes without movement. Exploration keeps the scene sharp with compact
navigation and one hint row; a rejected flip temporarily replaces that row with a message
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
`build:vercel` excludes `bench-local`, so the standard hosted build does not
include the holder/environment payloads. Staging integration does not resolve
the asset redistribution gates in [release gates](RELEASE_GATES.md).

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
node scripts/bench/interaction-check.mjs http://127.0.0.1:4198
WORKSHOP_DEPTH=fallback PLAY_QA_OUTPUT=artifacts/bench-fallback \
  node scripts/bench/interaction-check.mjs http://127.0.0.1:4198
node scripts/bench/home-entry-check.mjs http://127.0.0.1:4198
node scripts/bench/run-check.mjs http://127.0.0.1:4198
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
Current tabletop and surface evidence is in `artifacts/workshop-wood-finish/`;
current entry/menu evidence is in `artifacts/bench-menu-simplified/`.
Headless checks do not replace physical-device/mouse-feel
or human accessibility review.
Previous paired-station captures, timings and performance claims are historical;
the [review history](REPOSITORY_REVIEW.md#historical-evidence) identifies their revisions.
