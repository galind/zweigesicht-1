# Current project status

Updated 25 October 2026. Setup is in the [README](README.md); extended checks are
in [architecture](docs/LOCAL_ARCHITECTURE.md). Repository visibility is public (changed by the owner).

## Bench introduction and Esc menu redesign — 25 October 2026

Redesigned both centered panels around one prominent **Start / Resume exploring**
action, with a warm charcoal surface, restrained brass edge and small state label.
Grouped key badges into **Move around** and **At the bench**; controls stack at
narrow widths and enlarged text. Reset sits in a quieter settings row, alongside
an explicit **Auto / Low / High** Detail selector replacing the cycling button.
The introduction, loading, error recovery and pause states share the same visual
language. Existing capture, movement, scene and CAD behavior is preserved.

Verified typecheck, lint, production build, **159 Bench UI checks**,
**22 homepage/input journeys** and **32 flip checks**. Coverage includes centered layouts, keyboard focus,
scrolling, direct Detail selection, contrast, actual capture/movement/resume,
loading and recovery. Added primary-action hover/pressed checks under normal and
reduced motion, plus an icon-independent label assertion. Visible browser review
covers 1440 × 900, 390 × 844 and 320 × 640 at 200% text; native Chrome confirms
Start → Esc, focus through Reset/Detail, and the native Detail options.

Screenshots and reports: `artifacts/bench-menu-redesign/`. Updated interface docs.
Preview: <http://127.0.0.1:4198/bench>. Local commit only; no push or publication.

## Centered Bench introduction — 25 October 2026

Centered the first-use Bench panel horizontally and vertically, as requested.
The loading and touch-only explanation panels share this placement. Symmetric
height limits keep the back link clear; overflowing content remains scrollable.
The existing centered pause menu is unchanged.

Verified lint, production build and **137 Bench UI checks**, including explicit
center measurements at five viewport/text configurations. Visible review confirms
1440 × 900, 390 × 844 and 320 × 640 at 200% text; Tab scrolls Start into view while
the panel stays centered. Screenshots/report: `artifacts/bench-centered-introduction/`.
Updated Bench documentation. Preview: <http://127.0.0.1:4198/bench>.
Local commit only; no push or publication.

## Bench introduction and input support — 25 October 2026

The homepage **Explore it in first person** invitation now links directly to
`/bench`. The route shows scene context and shared controls while loading, then
**Start exploring** captures the mouse only on user action. Direct links, reloads
and Back use the same introduction. Removed the homepage popup and cross-route
automatic capture intent. Heading focus preserves the beginning of the scrollable
introduction; loading completion does not steal focus. Esc still opens the
existing controls, Resume, Reset and Detail menu.

A shared capability check uses any fine pointer, any hover and pointer-lock API
availability, with live input-capability updates. It does not use viewport width
or user-agent. Touch-only visitors see **Explore on desktop — Keyboard and mouse
required.** Direct `/bench` visits explain the limitation and offer a return link
without loading scene assets. API absence has a separate browser explanation;
capture refusal keeps recovery. Physical keyboard presence cannot be reliably
detected, so the requirement stays visible. Homepage Bench prefetch is disabled.

Verified **149 CPU tests**, typecheck, lint, production build, **22 entry/device
journeys**, **132 Bench UI checks** and **8 lifecycle checks**. Coverage includes
phone/tablet emulation, 320 px with 200% text, normal/reduced motion, missing capture
API, no scene requests on touch-only devices, direct/Back entry, actual capture,
walking/look/thrust, pause/resume, slow loads, failed capture/assets, graphics
retry, focus loss and disposal during loading. Removed obsolete popup assertions
and updated existing runners to the new entry label. Production CSS verification
also caught and fixed backdrop-filter declaration ordering after removing the
homepage CSS import.

Visible browser review confirms desktop and narrow/enlarged layouts. Native
Chrome verifies homepage → introduction → explicit capture → movement → Esc,
and live desktop/touch switching in DevTools. Emulation was reset afterward.
Evidence: `artifacts/bench-route-introduction/` (desktop introduction, native
pause/touch views, phone/tablet states and reports). Scene, CAD, physics and
bindings are unchanged. Preview: <http://127.0.0.1:4198/>. Local commit only;
no push or publication. Physical-device/release gates remain unchanged.

## Balanced invitation contrast — 25 October 2026

Refined the bottom-left first-person invitation with a brighter warm charcoal
fill, semibold text, a restrained brass border and a warm arrow. Colors derive
from the existing site accent and neutral palette. The compact wording, position,
shape and entry flow remain intact. Hover brightens the surface; pressed/expanded
states deepen it, with the existing visible keyboard focus ring.

Verified lint, production build and **18 homepage journeys**, including narrow
and enlarged text layouts, keyboard/focus return, hover/pressed states, reduced
motion and no-icon clarity. Visible browser review covers desktop, 390 px and
320 px at 200% text. Evidence: `artifacts/bench-entry-balanced/`. Only invitation
CSS and documentation changed. Preview: <http://127.0.0.1:4198/>. Local commit
only; no push or publication.

## First-person invitation refinement — 25 October 2026

Changed the bottom-left label to the owner's suggested **Explore it in first
person**. Removed the secondary line and restored the page's dark glass,
regular-weight text and a subtle outline. This keeps the invitation compact and
consistent with the movement controls. The keyboard-and-mouse requirement now
appears in the existing introduction; no additional step was added.

Verified typecheck, lint, production build, **157 Bench UI checks** and **18
homepage journeys** (responsive placement, keyboard/focus, hover/pressed states,
200% text, reduced motion and no-icon clarity). The dialog-bounds check now waits
for the opening transition to settle before asserting visibility. Visible review
covers desktop, 390 px and 320 px at 200% text, including keyboard opening and
focus return. Evidence: `artifacts/bench-entry-first-person/`. Updated README,
Bench design notes and browser selectors. Controls, scene and CAD are unchanged.
Preview: <http://127.0.0.1:4198/>. Local commit only; no push or publication.

## Bottom-left workbench invitation revision — 25 October 2026

Following owner feedback, moved **Explore the workbench** to the bottom left,
removed its descriptive paragraph and replaced dark glass with a solid warm light
surface and dark text. The short **First-person · Keyboard & mouse** line retains
the essential expectation. The smaller button has stronger contrast without
animation. It aligns with the dock on wide screens and lifts above it below
1200 px or with enlarged text. Existing panel/inspection hiding remains intact.

Verified typecheck, lint, production build, **157 Bench UI checks** and **18
homepage journeys**, covering
the 1200 px placement boundary, narrow/landscape views, 200% text, reduced motion,
keyboard entry/focus return, hover/pressed states, menu access and no-icon clarity.
Visible browser review confirms desktop, 390 px, and 320 px with 200% text.
Screenshots and reports are in `artifacts/bench-entry-bottom-left/`. The controls
introduction, loading, arrival, scene and CAD are unchanged. Preview:
<http://127.0.0.1:4198/>. Local commit only; no push or publication.

## Initial homepage workbench invitation — 25 October 2026

Replaced the centered **Walk inside the movement** button with **Explore the
workbench**, a restrained glass invitation beneath the watch identity. Supporting
copy sets the miniature first-person expectation, names the movement, holders
and detached parts, and states **Keyboard & mouse**. A decorative static arrow
suggests navigation; the text stands on its own. Compared a renamed header link,
this contextual invitation and a dock-adjacent prompt; the choice and tradeoffs
are recorded in [Bench experience](docs/BENCH_EXPERIENCE.md#homepage-invitation--25-october-2026).

The invitation yields to inspection views and open panels, and stays outside the
header's size measurement. This fixes the cramped existing menu found during
320 px / 200% text review. The shared controls popup now says **Before you begin**,
with one Escape/pointer-release explanation, then **Enter workbench**. Loading says
**Preparing the workbench…** and leads to the existing captured arrival without
another introduction. Overflowing controls focus the heading first so the
introduction stays visible; Tab reaches Enter, and Escape restores the invitation.
Hover, pressed/expanded and focus states are distinct. README, route metadata,
canvas description and existing browser selectors use the updated terminology.

Reviewed the actual visible homepage and old entry sequence before editing.
Final visible in-app review covers 1440 × 900, 390 × 844 and 320 × 640, including
200% text, keyboard opening, focus containment/return and the existing menu.
Native Chrome on macOS independently verifies keyboard entry, automatic mouse
capture, arrival, movement and Escape. Its DevTools reduced-motion emulation was
visibly checked and reset. The in-app browser rejects mouse capture; its existing
recovery is intact, with native Chrome and automated capture checks passing.

Verified **149 CPU tests**, inventory, typecheck, lint and production build;
**157 Bench UI checks**, **350 explorer checks** across seven suites, and **14
homepage journeys** across seven viewport/text combinations with normal and
reduced motion. The entry checks cover a short landscape view, 200% text down to
320 px, hover/pressed states, keyboard focus, menu access and an explicitly hidden
arrow. Final screenshot/report evidence is local in
`artifacts/bench-entry-redesign/` (desktop, narrow focus, controls and enlarged
controls, native reduced motion, UI/explorer reports and input-state fixtures).

Bench bindings, scene, materials, CAD, physics and arrival are unchanged; no
assets were regenerated. Preview remains <http://127.0.0.1:4198/>. Local commit
only; no push, publication or redistribution. Existing release and physical-device
qualification gates remain. Next action: owner review of the invitation and entry
sequence in the local preview.

## Bench pull-request preparation — 25 October 2026

Prepared the complete Bench/workshop branch for review against `develop`, including
the sustained performance fixes below. The working tree is clean and the fetched
`develop` is an ancestor. Existing local verification remains applicable; Workshop
inventory was checked again. Generated CAD assets and raw profiling evidence stay
ignored/local. Disabled Vercel Git deployment for `codex/workshop-environment`
before the authorized PR push. This is code review, with no site deployment or
change to the mechanical, usability, device or redistribution release gates.

## Sustained Bench performance and entry cleanup — 25 October 2026

Reviewed the actual visible Firefox 158 window on M4/macOS at **1280 × 1327 CSS
pixels / DPR 2**, starting from `6a8ae7e`, before changing the preview. Reproduced
recurring close-CAD stutter that the earlier short stationary profile missed.
The full CAD draws about 1.4 million triangles across main/transmission passes;
the environment-only budget did not describe this workload. Render CPU p95 was
about 5 ms and collision/physics 1–2 ms. Separate Chrome GPU/CPU evidence supports
rendering pressure, with no evidence of collision or GC as the recurring cause.

Fixed three issues: Auto used p75 and ignored recurring missed frames in the
slowest 7–20%; precompilation used a different program cache key from the actual
transmission pass and left uploads/new shaders until after entry was enabled;
and route disposal left a live GL context with internal render targets. Auto now
uses sustained p95 windows, with measured headroom and additional bounded steps
for logarithmic depth. Entry renders/uploads while loading and waits on an
asynchronous GPU fence. Disposal explicitly releases the route-owned context.
The context-retention finding is a verified cleanup defect, not a proven cause
of a particular historical stall.

Matched two-circuit synthetic workloads in the **actual visible Firefox window**
cover look, walk/run, flight, close wood/stand/CAD, both flips and pause/resume.
Before/after Auto starts at 1/.85 and settles at .85/.7; this is a quality-policy
comparison, not equal resolution. Repeated close CAD improves from **17 / 33–34 /
35 ms p50/p95/p99 to 17 / 18 / 18 ms**. Across approximately three minutes,
intervals >25 ms fall **212/9,974 → 25/10,159**, with >50 ms **1 → 0**. First
bridge approach retains 23 slow frames during adaptation. Three native link/Back
entries previously spent **642–666 ms** in the first ready render; preparation
moves that work into loading, leaving **4–5 ms** first-ready renders and **40 → 29**
shader programs. Warm entry still takes about one second overall.

Native OS keyboard/capture, flight, both flips and pause/resume were separately
verified. Native automation did not deliver relative pointer deltas, so mouse
measurements use explicitly synthetic DOM input; **human mouse feel is not
qualified**. A separate headless Chrome forced-fallback workload passes two
circuits and three entry/cleanup checks. Its repeated bridge/dial p95 is
18.2/23.9 ms after adaptation, with residual dial stutter; see the full
[performance evidence, reproduction and limitations](docs/BENCH_PERFORMANCE.md).
Raw reports and traces remain ignored in `artifacts/bench-performance/`.

The procedural wood/grain, contact atlases, lighting, 230 × 160 mm centered desk,
compact stand, original CAD scale/poses, fitted seating, holders, mat, arrival
and controls are unchanged. Only the runtime-source hash was refreshed; all
15 recorded source/output hashes and the production environment GLB match.
Generated assets remain local. No push, publication or redistribution.

Verified **149 CPU tests**, typecheck, lint and production build. Browser
regressions pass: **26 surfaces** across normal/fallback depth, **5 seating**,
**10 parts**, **65 environment**, **10 running**, **32 flips**, **67 flight/collision**,
**8 lifecycle**, **11 interaction**, **157 UI** and **5 homepage entries**. The
independent audit passes both original 219-leaf CAD/holder rests and 16 drop
fixtures (maximum source-relative matrix error 5.55 × 10⁻¹⁷). All mat edges and
table boundaries pass. Reviewed final overview, visitor wood and stand-edge
images. The new focused workload retains transition evidence, checks completed
flips, post-ready shader stability and released contexts, and can enforce a
repeated-circuit p95 budget; five CPU regressions cover the missed-frame policy.

Remaining qualification: human pointer feel, other physical GPUs/high-refresh
displays, cold-driver startup and prolonged thermal use. Auto's assessment takes
time; fixed High can remain GPU-bound and warm initial uploads still block the
main thread during loading. Existing mechanical/accessibility/release gates
remain. Next action is physical-user/device qualification using the sustained
probe, rather than treating the historical static 16.7–16.8 ms profile as proof.

## Deeper desk and stand finish — 25 October 2026

Reworked the wood and edge treatment after the owner's request for a deeper
improvement. The centered **230 × 160 mm desk**, **200 × 130 mm mat** and
**56 × 65 × 2 mm stand** retain their footprint and arrangement. The desk slab
is now **12 mm thick**, with a **1.2 mm underside chamfer**. The stand has
**1.5 mm rounded corners**, sampled at 16 segments per quadrant, and its existing
0.2 mm edge easing. The mat, movement, case, fitted dial/hand poses, holders,
arrival and controls are unchanged; `bench-parts-layout.json` is byte-identical.

The desk now uses deeper oiled oak; the stand has a separate, lighter neutral oak
finish. Replaced blurred albedo grain with a continuous procedural wood field:
irregular growth bands, fine fibres and sparse vessel pores. Authored millimetre
grain coordinates follow the slab/back rail along X and side rails/stand along Z;
cut ends and bore interiors sample that same field. Contrast, pore size, shallow
bump and derivative filtering were corrected after close-up review to remove
regular stripes and coarse end grain. Contact atlases, dry-satin roughness,
restrained reflections and smooth edge highlights provide material separation.

Reviewed overview, detail, profile, exposed bores and six visitor-scale surface
views, including a new close stand-edge fixture. The seating rays now include
both separate wood meshes, preserving the existing through-bore assertion to
the actual tabletop. All ten holes retain measured seating and clearance.
Evidence stays local in `artifacts/workshop-wood-finish/`.

Verified **144 CPU tests**, inventory, typecheck, lint and production build;
**26 surface checks** across normal/fallback depth, **5 seating**, **10 parts**, **65 environment**,
**10 running**, **32 flip**, **67 flight/collision** and **8 lifecycle checks**,
with no runtime/shader errors. The new surface checks verify actual exported
grain attributes and directions. Both flips, all mat edges and table boundaries pass.
The independent CAD/holder audit passes both rests with 219 leaves and maximum
source-relative matrix error 5.55 × 10⁻¹⁷.

In the final image audit, faint atlas bleed on the stand was traced to the baked
map, then corrected with a 1024² stand atlas and wider UV island spacing.
The rebuilt surface, seating, parts and environment suites pass again; the spots
are absent in the final reviewed close-up. Five static profiling fixtures (overview,
both movement rests, visitor wood and visitor stand) record **16.7–16.8 ms p95**
and **16.7–16.8 ms p99**, CPU submission p95 **4.1–6.1 ms**, on local M4
headless Chrome at 1440 × 900 and ratio 1 (150 measured frames each). These
stationary samples do not qualify sustained device or human-input performance.

The final environment has **7,196 visible/collision triangles**, **3 draws/pass**,
**12 MiB baked textures** and a **519,892-byte GLB**, within existing budgets.
All **15 source/output hashes** match, and the production GLB matches the generated
asset. Preview rebuilt at <http://127.0.0.1:4198/bench>. Generated assets remain
local/ignored; no push, publication or redistribution. Existing physical-device,
human input/accessibility and mechanical/release gates remain; these procedural
finishes and finite-resolution contact shadows are visual approximations.

## Centered movement and smaller stand — 25 October 2026

Revised the previous surface pass after owner review. The movement is now at
**the exact center of both desk and mat**, at its unchanged (0, −7) mm position.
The desk is **230 × 160 mm** (X−115…115, Z−87…73); the mat is
**200 × 130 × 1 mm** (X−100…100, Z−72…58). All four wood borders are 15 mm.
Case position/orientation, movement, holders, arrival, visitor scale and controls
are unchanged. Only the right-hand display parts receive tighter rigid placement.

The stand is **56 × 65 × 2 mm**, down from 76 × 76 mm (**37% less area**),
with 2 mm clipped corners and a 0.2 mm edge bevel. Dial centers are at X60,
rows Z−25 and Z7; hand sets are at X86 with 5 mm packet spacing. All ten bores
were regenerated from the original pins, screw ends and bushings. The existing
measured support planes, 0.12 mm nominal radial allowance and 0.5 mm deepest-pin
clearance above the mat are retained. No CAD geometry or scale changed.

Changed the yellow wood to neutral warm oak and the mat to a quieter green.
Removed the broad blurred grain from the baked albedo, reduced runtime grain
contrast/bump and raised wood roughness. The existing lighting/contact-shadow
pass remains. Reviewed overview, detail, profile, exposed bores and all five
visitor-scale surface fixtures. Evidence is local in `artifacts/workshop-centered/`.

Verified **144 CPU tests**, inventory, typecheck, lint and production build;
**20 surface checks** across normal/fallback depth, **5 seating**, **10 parts**,
**65 environment**, **10 real-keyboard running**, **32 flip**, **67 flight/collision**
and **8 lifecycle checks**, with no runtime/shader errors. Updated the geometry
and traversal fixtures for the new borders, packed rows and 4 mm mat aisle beside
the stand. This includes both full flips, all mat edges and table boundaries.
The independent CAD/holder audit passes both rests and all 16 source-surface
drops, retaining 219 movement/crown leaves and all 18 phases; maximum source
matrix error remains 5.55 × 10⁻¹⁷.

The rebuilt environment has **6,244 visible/collision triangles**, **2 draws/pass**,
**6.67 MiB baked textures** and a **397,012-byte GLB**. All **15 source/output
hashes** across the parts/environment manifests match; the production asset
matches the generated GLB. Preview rebuilt and restarted at
<http://127.0.0.1:4198/bench>. Generated assets remain local/ignored; no push,
publication or redistribution. Next: owner walkthrough of this revised design.
Physical-device, human input/accessibility and mechanical/release qualification
remain outside these automated checks; contact shadows remain finite-resolution
visual approximations.

## Finished bench surfaces — 25 October 2026

Polished the **270 × 160 mm desk**, **240 × 130 × 1 mm green mat** and
**76 × 76 × 2 mm oak stand**. The desk slab is now a lighter 14 mm thick,
with 0.35 mm edges; the rim has 0.25 mm edges and a concealed union into the
slab, removing the crevice visible at miniature eye height. Weighted normals
keep broad faces flat. The mat has 0.04 mm eased edges. All ten fitted stand
bores retain their measured clearance, with smooth interiors and 0.025 mm mouths.

Rebaked restrained wood grain and local contact shading, added nonrepeating
world-space fibres/pores and fine matte grain with subpixel filtering, and tuned
the key/fill lighting. One cached soft shadow map grounds the actual parts and
updates through both flips. Fixed a reversed-depth shadow-bias artifact found
in the first visual pass; a clear-mat rendering comparison now guards against it.
The case-left/movement-center/dials-and-hands-right arrangement, CAD geometry,
poses, scale, holders, arrival and controls are unchanged.

Overview, profile, exposed bores, seated parts and visitor-scale views reviewed;
all five surface fixtures retain the original 1.48 mm eyes and 68° FOV.
Evidence and before/after captures remain in `artifacts/workshop-polish/`.
The flight circuit fixture now follows the current clear aisles; its old X−55
route ran through the case moved there in the earlier compact-layout milestone.

Verified **144 CPU tests**, inventory, typecheck, lint and production build;
**20 surface checks** across normal/fallback depth, **5 seating**, **10 parts**,
**65 environment**, **10 running**, **32 flip**, **67 flight/collision** and
**8 lifecycle checks**. Independent source/holder audit retains both rests and
all **16 source-surface drops**. No runtime/shader errors. An intermediate
focus-loss flip timeout during concurrent validation cleared in the isolated
final run; all 32 checks passed without changing timing thresholds.

Final overview and both close-up profiling fixtures record **16.7 ms p95** and
**16.8 ms p99** on local M4 headless Chrome at 1440 × 900, ratio 1 (150 measured
frames each). CPU submission p95 is 5.4–6.3 ms. These stationary samples are not
human-input, sustained-device or flip-performance qualification.

The environment has **6,240 visible/collision triangles**, **2 draws/pass**,
**6.67 MiB baked textures** and a **551,212-byte GLB**. The cached 4096² shadow
render target is additional GPU storage. All eight recorded source/output hashes
match, and the production asset matches the generated GLB. Preview rebuilt and
restarted at <http://127.0.0.1:4198/bench>. The local prototype is finished;
next action is owner walkthrough. Generated assets remain local/ignored.
No push, publication or redistribution. Remaining qualification limits are the
existing physical-device, human mouse-feel/accessibility and mechanical/release
gates; finite-resolution contact shadows are a visual approximation.

## Smaller tabletop and mat — 25 October 2026

Reduced the table from 450 × 330 to **270 × 160 mm**, and the mat from
350 × 250 to **240 × 130 mm**. The table spans X−115…155, Z−85…75; the
mat spans X−100…140, Z−65…65. Wood borders are 15 mm at either side,
20 mm behind and 10 mm in front. The rim and walking boundaries follow the
new footprint. All objects, the fitted stand, movement, holders and arrival
retain their positions and scale.

Rebuilt and rebaked the environment; reviewed front and oblique renders.
Verified **144 CPU tests**, typecheck/lint/build, **10 parts**, **5 seating**
and **65 environment checks**, with no browser errors. All four mat edges,
the rim, high-speed table containment and both full movement flips pass.
The running-wall fixture now checks both the blocked running position and
stable grounded rest after releasing movement, avoiding a transient contact frame.
All source/output hashes match. Environment: **3,160 visible/collision triangles**,
**2 draws/pass**, 6.67 MiB textures and 386,476-byte GLB. Evidence:
`artifacts/workshop-small-table/`. Preview rebuilt/restarted at
<http://127.0.0.1:4198/bench>. Next: owner review of the smaller work surface.
Local only; no push or publication.

## Lower, compact stand and aligned case — 25 October 2026

Reduced the oak stand from 83 × 105 × 4.5 mm to **76 × 76 × 2 mm**, with a
0.3 mm edge bevel. Moved its left edge inward from X65 to X40, tightened the
rows from 53 to 37 mm apart and moved the case from X−85 to X−55. The case
rotates 90° so its lugs run along Z, matching the movement orientation.
The movement, holders and arrival remain unchanged.

Recomputed all ten fitted through-bores at the new positions and rebaked the
wood. Both dial backs and the original hand support points still contact the
stand; the deepest pins retain **0.5 mm clearance above the mat**. Actual CAD,
stand and case clear both holders and continuous flip envelopes. Close-up,
exposed-bore and full-table renders reviewed.

Verified **144 CPU tests**, typecheck/lint/build, **5 seating**, **10 parts**
(including both full flips) and **65 environment checks**, without browser errors.
All source/output hashes match. Environment: **3,160 visible/collision triangles**,
**2 draws/pass**, 6.67 MiB textures and 387,072-byte GLB. Evidence:
`artifacts/workshop-compact-stand/`. Production preview rebuilt/restarted at
<http://127.0.0.1:4198/bench>. Next: owner review of the compact arrangement.
Local only; no push or publication.

## Fitted stand holes and seated dials/hands — 25 October 2026

Cut ten actual through-bores in the oak stand for the two central-dial pins,
three reverse-dial screw ends and five hand bushings. Both dial backs now contact
the wood; the central dial lowers 1.5 mm and the reverse dial 0.568041 mm.
Three curved hand packets receive rigid 1.421°, 1.155° and 4.103° tilts to rest
on their original lower blade support points. Original shapes, relative bushing
poses, plan arrangement, case and movement remain intact.

Seating is measured from decoded CAD, with authored 0.12 mm radial clearance.
Hole centers/radii and contact evidence are recorded in `bench-parts-layout.json`.
The independent runtime audit checks **11,622 clipped triangle points**, finds
zero wood overlap, confirms separated wood contacts for all seven packets and
verifies all ten actual bores are open. Pins stay above the mat. Boolean cutter UVs
are removed before atlas baking to prevent texture-channel artifacts; final close-up
and exposed-bore captures were reviewed.

Verified **144 CPU tests**, typecheck/lint/build, **5 seating**, **10 parts**
(including both full flips) and **65 environment checks**, without browser errors.
Source/output hashes match. Environment: **3,160 visible/collision triangles**,
**2 draws/pass**, 6.67 MiB textures and 400,276-byte GLB. Evidence:
`artifacts/workshop-seating/`. Preview rebuilt/restarted at
<http://127.0.0.1:4198/bench>. Next: owner review of fitted seating.
Local only; no push or publication.

## Oak parts stand and hold Shift to run — 25 October 2026

Added **hold either Shift to run** at 11 mm/s (ordinary speed 5.5), with existing
smooth acceleration and normalized diagonal travel. Releasing Shift returns to
walking; pause/reset clears held input. Horizontal flight uses the same speed
choice; vertical thrust and gravity stay unchanged. Entry/pause controls and the
walking hint explain the shortcut. Speed-aware collision substeps prevent tunneling.

Rearranged the mat: **case left, movement center, oak display stand right**.
The solid 83 × 105 × 4.5 mm stand has clipped, softened corners, the existing oak
finish and rebaked contact shading. Central and reverse dials occupy separate
rows, with their Fine/Lance hands beside them. All source geometry, original
bushings and the open case are preserved. Visible stand/CAD triangles collide;
all groups clear both holders and movement flips. The front approach stays open.

Verified **144 CPU tests**, typecheck/lint/build, **10 real-keyboard run checks**,
**10 parts**, **65 environment/collision** and **32 flip checks**. Reviewed overview,
stand detail and controls captures. No browser errors; all provenance hashes match.
Environment: **560 visible/collision triangles, 2 draws/pass, 6.67 MiB textures**,
191,380-byte GLB. Local evidence: `artifacts/workshop-stand/`.
Production preview rebuilt/restarted at <http://127.0.0.1:4198/bench>.
Next: owner walkthrough of the stand and running speed. No push or publication.

## Balanced tabletop arrangement — 25 October 2026

Grouped the dials and matching hands closer to the central movement, following
the approved balanced layout. Dial centers are X−62/+62, Z−12; hand sets are
X−62/+62, Z24. The case stays at (0, −92). This moves each pair 43 mm inward
and reduces row separation from 70 to 36 mm, leaving the front third clear.
Heights, orientations, source geometry, working movement and controls are unchanged.

Verified **7 focused geometry tests**, typecheck, lint, production build,
**10 parts checks** (including both complete flips and continuous clearance),
and **64 environment checks**, including walking between each dial/hand pair
and through both approach aisles. Reviewed overview and detail captures; no
browser errors. Provenance hashes match. Evidence: `artifacts/workshop-arrangement/`.
Preview rebuilt/restarted at <http://127.0.0.1:4198/bench>.
Next: owner review of the closer arrangement. Local only; no push or publication.

## Dials and hands directly on the mat — 25 October 2026

Removed both dial protectors and both hand boxes, including supports, membranes,
transparency shaders and baked container shadows. Each intact dial and hand/bushing
packet now rests at mat Y0. Removed both case crystals from the bench presentation;
the open center reaches the mat. The original catalog is unchanged. All 78 remaining
detached leaves now collide using their visible source geometry; the 219-leaf
working movement, layout, holders and controls remain unchanged.

Regenerated local Blender/GLB and verified provenance hashes. Environment returns
to **340 visible/collision triangles, 2 draws/pass, 6.67 MiB textures**, with a
175,336-byte GLB. Detached CAD totals **328,017 triangles**. Reviewed full-table,
case, dial and hand captures. Verified **141 CPU tests**, inventory, typecheck,
lint, production build, **64 environment**, **10 detached-part**, **32 flip**
checks and both independent CAD/holder rest audits with **16 source-surface drops**.
No browser errors. Evidence: `artifacts/workshop-bare-parts/`.

Preview rebuilt/restarted at <http://127.0.0.1:4198/bench> and the open tab refreshed.
Next: owner walkthrough of the simplified arrangement. Local only; no push or
publication. The protected layout below is historical, superseded by this change.

## Compact tabletop with protected watch components — 25 October 2026

Implemented the local handoff from `66c2952`: **450 × 330 mm** tabletop, unchanged
mat and 10 mm front border, working movement/holders and visitor controls. Added
one steel case with both attached lug packets, central and small dials in separate
45 mm protectors, and Fine/Lance hands in separate 39 × 39 × 17.8 mm membrane
boxes. All 80 added CAD leaves retain their original geometry and appropriate
finishes; crowns remain only on the working movement. Five stationary groups
clear the actual continuous flip envelopes and both holders by at least 2 mm.

Original procedural containers follow inspected Horotec/Bergeon photographs.
Unknown construction details and support/film clearances are documented visual
approximations. Both transparent films surround the actual hand/bushing packets
near mid-height, independently verified against all 10,543 vertices. Outer shells
collide; sealed interiors are noncolliding. Reviewed full-table, part detail,
membrane side/top/oblique, arrival and both movement-side captures.

Regenerated Blender/GLB and contact shading; provenance hashes match. Environment:
**26,900 visible / 6,708 collision triangles, 19 draws/pass, 6.67 MiB textures,
0.874 MiB GLB**. Added CAD: **344,845 triangles**. Full overview: **590 draws /
2.21M submitted triangles**, one existing shared transmission target. Matched M4
headless fixtures stayed at **16.7–16.8 ms p95**; overview render CPU rose
5.1 → 5.8 ms. Device/human qualification remains outstanding.

Verified **141 CPU tests**, inventory, typecheck/lint, production build,
**64 environment**, **67 jetpack/collision**, **32 flip**, **8 lifecycle** and
**10 detached-part checks**. Independent CAD/holder audit passes both rests and
all **16 source-surface drops**. All bench GPU resources dispose exactly once;
loading cancellation, graphics recovery and re-entry pass.

Evidence: `artifacts/workshop-parts-layout/`; detailed assumptions, selection,
budgets and comparison results are in [walking documentation](docs/BENCH_EXPERIENCE.md).
Production preview rebuilt/restarted at <http://127.0.0.1:4198/bench>.
Next: owner walkthrough of the compact arrangement. No push, deployment or CAD
redistribution; generated assets and reference images remain local and ignored.

## Rectangular tabletop and closer mat border — 25 October 2026

Simplified the tabletop to a straight **1100 × 600 mm rectangle** at the owner's
request. The front edge is now Z135, leaving **10 mm** beyond the existing mat
at Z125 (previously 60 mm at the center). Light wood, the low back/side rim, mat,
watch, original holders, station, arrival and controls remain in place. No lower
furniture was reintroduced. This supersedes the curved-front design below.

Removed the nonconvex traversal projection and restored the simpler rectangular
capsule inset with outward-only containment. During validation, a vertical rim's
internal triangle seam incorrectly stopped ascent as if it were a ceiling. A focused
surface-normal check fixes that case; the new failing-then-passing regression and
existing real-ceiling tests cover it. Geometry, Blender scene and contact shading
were regenerated; source/output hashes match. New budgets: **340 visible/collision
triangles**, **2 draws/pass**, **6.67 MiB textures**, **0.16 MiB GLB**.

Verified **134 CPU tests**, typecheck, lint, production build, **60 environment**,
**67 jetpack/collision** and **32 flip** browser checks. Independent CAD/holder
audit passes both rests and **16 source-surface drops**. Visual review confirms
the straight front and narrow mat border. Existing device/human qualification
limits remain unchanged. Next: owner review of the simplified tabletop.

Current evidence is local in `artifacts/workshop-rectangle/`, including front,
profile and miniature visitor captures. Production preview was rebuilt and restarted
at <http://127.0.0.1:4198/bench>. No push, deployment or redistribution.

## Reference-inspired tabletop — 25 October 2026

Implemented the owner's upper-photo reference as a light natural wooden tabletop
in the existing open warm-neutral background. Removed drawer pedestals, pulls,
apron, stretcher and all lower furniture from the generated scene. The solid
32 mm slab has two broad 370 mm wide / 75 mm deep +Z recesses, a 220 mm central
projection, softened corners and a continuous 6 mm wide / 5 mm high back/side rim.
The original green mat, watch, both holders, station, arrival, visitor dimensions,
lighting and controls remain unchanged.

The authored 134-point outline drives both export and the capsule boundary.
Outward-only containment now follows the nonconvex silhouette at every flight
height; the visible rim triangles collide, and the 1 mm mat descent/jetpack return
is retained. Regenerated the Blender scene, GLB and contact shading, verified
closed manifold surfaces, and recorded source/output hashes. Environment budgets:
**2,156 visible/collision triangles**, **2 draws/pass**, **6.67 MiB decoded textures**,
**0.23 MiB GLB**. Generated files and reference imagery remain ignored/local.

Verified: **133 CPU tests** (including every outline edge/corner, free tangency and
inward motion, and fast recess crossings), inventory, typecheck, lint and production
build; **319 environment**, **67 jetpack/collision**, **32 flip**, **8 lifecycle** and
**11 interaction/quality/idle** browser checks. Independent CAD/holder audit passes
both rests and **16 source-surface drops**, retaining 219 leaves with maximum
source-matrix error 5.56 × 10⁻¹⁷. Continuous flip/holder envelopes clear the new
geometry; resource disposal/re-entry and high flight pass.

Reviewed actual front/profile/underside overview fixtures against the upper
reference, plus arrival, rim/recess/mat edges and both landed movement sides at
normal visitor scale. Refined curved-side shading after the first visual pass.
Evidence and the before/reference/after review sheet are in
`artifacts/workshop-tabletop/`; implementation details are in
[walking documentation](docs/BENCH_EXPERIENCE.md). Restarted production preview:
<http://127.0.0.1:4198/bench>.

Next: owner walkthrough. Existing physical-device, human mouse-feel/accessibility
and mechanical qualification limits remain; no new certification is claimed.
No push, deployment, publication or CAD redistribution.

## Standalone desk in open space — 25 October 2026

Owner requested removing the surrounding room. Removed all walls, the window,
frame/sill, skirting and floor, leaving the desk and plain mat against the existing
warm neutral background. The working movement, original holder, desk dimensions,
lighting and controls remain unchanged. Regenerated contact shading and the
source/output manifest; the environment now has **1,872 visible/collision
triangles**, **4 draws/pass**, **8.33 MiB decoded textures** and a **0.53 MiB GLB**.

Production build and all **46 environment checks** pass, including desk edges,
mat descent/jetpack return, continuous flip/holder clearance, high-flight range
and disposal/re-entry. The independent CAD/holder audit also passes both rests
and 16 source-surface drops. Reviewed the full desk and arrival captures and
refreshed the local preview at <http://127.0.0.1:4198/bench>.
Next: owner review of the desk in open space.

Current evidence: `artifacts/workshop-open-space/`. Previous room-only and
decorated revision 3 entries below are historical. No push or deployment.

## Room and desk/mat only — 25 October 2026

Owner requested a plain base scene before adding objects individually. Removed
all tabletop props (lamp, screwdriver stand/drivers, tray, loupe, tweezers and
notebook), the Dresden map/frame and mat lettering. Kept the room/window, one
desk with integrated drawers, and a plain green mat. The working movement,
original holder, camera and controls remain unchanged for testing. This direction
supersedes the decorated revision 3 object list below.

Regenerated the Blender/GLB and contact shading, with updated authored settings
and source/output hashes. The current environment has **2,628 visible / 1,872
collision triangles**, **8 draws/pass**, **10.0 MiB decoded textures** and a
**0.76 MiB GLB**. All remain within budget; generated assets remain local/ignored.

Verified: **130 CPU tests**, inventory, typecheck, lint and production build;
**46 environment**, **67 jetpack/collision** and **32 flip** browser checks, plus
the independent two-rest CAD/holder audit and **16 CAD drops**. Actual room/desk,
plain wall, arrival and flight captures reviewed; existing in-app preview refreshed.
Removed props leave neither colliders nor baked shadows. Resource disposal and
re-entry pass. Earlier decorated-scene performance measurements below remain
historical; the renderer and lighting code are unchanged.

Next: owner review of the bare room and furniture before adding objects one by one.
Preview: <http://127.0.0.1:4198/bench>; current evidence is saved in
`artifacts/workshop-room-only/`. No push or deployment.

## Approved workshop revision 3 implemented locally — 25 October 2026

Implemented on `codex/workshop-environment` from the current local `codex/bench-ui`
handoff. One 1100 × 650 mm oak bench with olive-grey drawers, a 350 × 250 × 1 mm
mat, the Dresden schematic directly ahead and the approved small tool set replace
the bare environment. No return, cupboard, technical drawing, chair or exterior.
Original artwork, authored settings, Blender generation and output provenance are
separate. Generated Blender/GLB assets remain ignored and local.

- Preserved the station, arrival, 1.65 mm visitor / 1.48 mm eye offset, speed,
  controls, move-clear/fresh-F workflow, original holders, 219 CAD leaves and
  all reviewed poses/materials. Desk bounds expand using the existing physics.
  Every reachable prop collides with its visible triangles; all four mat edges
  require the existing jetpack to return from the wood.
- Room-scale far range follows the loaded bounds without fog or an altitude cap.
  Reversed depth preserves CAD/room precision on clip-control GPUs; a functional
  logarithmic fallback covers older GPUs. Soft right daylight, warm left fill,
  original textures and baked contact shading add no shadow/transmission passes.
- Verified: **130 CPU tests**, inventory, typecheck, lint and production build;
  **45 workshop**, **32 flip**, **67 jetpack/collision**, **8 lifecycle**,
  **157 UI** and **11 interaction/quality/idle** browser checks, plus the independent
  two-rest source/phase/holder audit and **16 CAD drops**. A forced fallback passes
  **46 checks**. Continuous per-part sweep bounds and both holder bounds clear
  every new solid. All eight desk edges/corners stay supported. Disposal/re-entry,
  graphics-loss retry, four desktop sizes and 200% text pass.
- Actual visual review against revision 3 includes room/desk inspection, unchanged
  arrival, real keyboard flight to both faces, mat return, lettering and high
  ascent. Fixed regular grain, contact shading, decal shadowing and depth artifacts.
  Asset budgets: **7,808 visible / 6,616 collision triangles**, **15 draws/pass**,
  **16.2 MiB decoded textures**, **1.35 MiB GLB** — all within targets.
- Fresh matched foreground performance on M4 / Chrome 155 at 2400 × 1300 / DPR 2:
  maximum paired p95 regression **1.7%** across 18 workloads. Auto remains ratio 1,
  averages **16.67 ms**, and records p95 **18.1–18.5 ms** versus **18.1–18.6 ms**
  before. Full multipass, CPU and GPU measurements are recorded separately in
  [walking documentation](docs/BENCH_EXPERIENCE.md). Fixed High still has slower
  close-ups; isolated long frames remain. The initial logarithmic path was
  rejected for performance in favor of reversed depth on this GPU.

Preview: <http://127.0.0.1:4198/bench>. Actual screenshots, review sheet, paired
measurements and reports are local in `artifacts/workshop-implementation/`.
The foreground benchmark's native capture probe was declined on both baseline
and final builds, explicitly recorded; real headless keyboard/mouse capture passes.
Next: owner walkthrough, native mouse-feel/human accessibility and physical-device
qualification, including older-GPU fallback performance. Existing mechanical and
publication gates remain open. **No push, deployment, publication or CAD
redistribution.** Earlier handoff/design-only status entries below are historical.

## Workshop implementation approved and handed off — 24 October 2026

Owner approved starting implementation of D revision 3 and requested a prompt
for another agent. The [brief](docs/WORKSHOP_DESIGN_D.md) records that approval;
the complete local handoff prompt is
`artifacts/workshop-design-d-v3/implementation-prompt.md`. Use the v3 render and
layout: one main desk, no side furniture/drawing/chair, Dresden map directly ahead.
Earlier approval-pending records and review labels are historical.

The handoff covers the local baseline, approved scope, source/interaction
invariants, environment pipeline, collisions, performance, visual QA and delivery.
No agent was dispatched and no application/CAD implementation has started in this
chat. Next: receiving agent implements and verifies locally. No push, deployment,
publication or redistribution is authorized.

## Workshop environment — map ahead, 24 October 2026

Moved the Dresden map to the wall directly ahead of the visitor, centered above
the main bench; the left wall is now plain. Revised render, layout and proposed
coordinates are in `artifacts/workshop-design-d-v3/`, with local review on port
4196. The [implementation brief](docs/WORKSHOP_DESIGN_D.md) reflects this placement.
All other proposed geometry is unchanged. Final approval remains pending; no
application/CAD changes, push, deployment, publication or redistribution.

## Workshop environment — main bench only, 24 October 2026

Simplified the D design at the owner's request: one main workbench, no side
return, wall cupboard, technical drawing or chair. The Dresden map is the only
wall decoration. The stand and empty parts tray move to the left wood area of
the main bench and therefore need visible colliding geometry during implementation.
The movement, mat, clear approach and existing controls remain unchanged.

Updated the [implementation brief](docs/WORKSHOP_DESIGN_D.md). Revised render,
annotated layout, coordinate data and complete prompts are local in
`artifacts/workshop-design-d-v2/`; v1 remains historical. Local review is at
<http://127.0.0.1:4195/review.html> while its server runs. Final design approval
is still pending. No application code, active data, runtime assets or CAD changes;
no push, deployment, publication or redistribution.

## Workshop environment — D developed, 24 October 2026

Owner selected D and requested a simpler polished render without a city view.
Prepared a consistent room/desk/miniature-view visualization, dimensioned layout,
proposed coordinate data and [implementation brief](docs/WORKSHOP_DESIGN_D.md).
The room uses oak, olive-grey storage, an opaque frosted pane, a lower separated
storage return and a small deliberate tool set. Review package and complete
ImageGen prompts remain local in `artifacts/workshop-design-d-v1/`; local visual
review is served at <http://127.0.0.1:4194/review.html> while that server is running.

The brief identifies larger rectangular desk bounds, the 1 mm mat edge, reachable
prop collisions, flip clearance, room-scale camera/fog changes, material/asset
budgets and targeted verification. Existing movement, holders, materials, reviewed
poses and controls remain implementation invariants. Render perspective is
illustrative, not calibrated camera or mechanical evidence.

Next: explicit owner approval of this developed final proposal before implementation.
Application code, active authored data, runtime assets and CAD are untouched.
No push, deployment, publication or redistribution; release gates remain unchanged.

## Workshop environment design — Stage 1, 24 October 2026

Prepared four local exploratory sketch boards: A north-light maple, B walnut
repair studio, C pale precision workshop and D oak corner atelier. Each includes
a room overview, mat-eye view and annotated plan. Inspected the current homepage,
entry controls and loaded `/bench` arrival. Used existing arrival/holder captures
as visual references; these sketches are not measured renders or clearance proof.

Boards and complete built-in ImageGen prompts are local in
`artifacts/workshop-design-stage1/`. The [design review](docs/WORKSHOP_DESIGN_STAGE1.md)
records concept tradeoffs, preserved assembly/interaction requirements and the
proposed larger desk, mat and 1 mm edge requiring later geometry review.
Application code, runtime assets and CAD are untouched. No tests were needed for
this design-only milestone; no new runtime qualification is claimed.

Next: owner selects/combines A–D before Stage 2. Stage 3 final-design approval is
required before implementation. No direction selected, push, deployment,
publication or redistribution; release gates remain unchanged.

## Centered move-away message — 24 October 2026

The blocked-flip message now appears at the center of the viewport while exploring,
using the existing glass surface. Normal hints return to the bottom once clear.
Verified actual F activation and centered placement at 1440 × 900, 800 × 600 and
1024 × 768 with 200% text, plus hint restoration. Typecheck, lint and production
build pass. Captures remain local in `artifacts/bench-centered-notice/`; preview
remains <http://127.0.0.1:4189/bench>. No push or deployment.

## Centered menu and visitor-controlled flip clearance — 24 October 2026

Updated locally on `codex/bench-ui` after owner feedback. The Escape menu is
centered in the viewport, retaining its glass styling and scroll limits. Pressing
**F** inside the sweep, in the incoming holder, or on support that will disappear
now leaves the visitor and movement untouched and shows **“Move away from the
movement to flip it.”** The message clears after moving clear; a fresh F press is
required. No automatic relocation or queued flip remains. The animation still
reserves its sweep and incoming holder every physics substep; an externally
injected late obstruction cancels without moving the visitor.

- Verified: **130 CPU tests** (including rejected standing/airborne flips,
  both directions, outgoing support and late obstruction), **32 flip/browser
  checks**, **157 desktop UI checks**, **67 flight/collision checks**, **8 lifecycle
  checks**, typecheck, lint and production build. Actual message, Escape/resume,
  clear-and-retry, both flip directions and centered menus at four desktop sizes
  plus 200% text pass. Real keyboard flight lands on both faces and flies clear
  before flipping, without a reset. Focus loss, graphics interruption and loading
  recovery pass.
- Captures and reports stay local in `artifacts/bench-flip-followup/`. The preview
  remains <http://127.0.0.1:4189/bench>. Updated walking documentation records the
  behavior; the prior milestone's automatic relocation is superseded.

No push, deployment, publication or CAD redistribution. Existing physical-device,
human-accessibility and internal CAD qualifications remain open.

## One movement, one station, controlled flip — 24 October 2026

Implemented locally on `codex/bench-ui`. `/bench` now has one 219-leaf assembly
at (0, 0, −7), with a four-second lift, rigid half-turn and reseating. **F** is the
provisional unused shortcut, centralized in `bindings.ts` and shown in the
homepage popup, Escape menu and compact exploration hints. Repeated/held presses
do not queue flips. Both original holders load, but only the matching holder is
visible/colliding; it exchanges while the movement is fully raised.

- Original-solid cross-fit tests reject using either holder for both orientations:
  even at shoulder-adjusted heights the wrong pairings intersect the mainplate
  by 1.980906 / 0.330319 mm³. The owner explicitly chose exchanging the two intact
  original holders at one station. [Cross-fit evidence](assets/source-manifest/holder-crossfit.json)
  preserves source hashes and the reproducible probe. Matching corrected seats
  retain zero plate overlap and the previously verified crown clearances. The
  exchange is a visual exploration operation, not a maker-supplied mechanism.
- Safe visitors retain position, view, input and momentum; physics continues.
  Continuous per-part lift/turn safety envelopes exclude entrants each substep.
  Only visitors in that envelope, obstructing the incoming holder or losing
  holder support are moved to nearby checked clear space. Grounded visitors
  land on the existing mat; airborne visitors keep altitude and momentum. No
  reset-to-spawn or camera animation. Hidden tabs/graphics loss settle atomically;
  visible Escape/focus loss lets the flip finish. Loading cannot queue a flip.
- Collision transforms now explicitly update fixed CAD leaves after parent
  motion, before player simulation. Destination queries cover triangle-interior
  crossings and capsules wholly inside the closed incoming holder. Independent
  checks retain all original/reviewed local matrices, 18 phases, materials and
  four crowns. Desk, holder shapes, jetpack, bounds, 1.65 mm visitor and 1.48 mm
  eye height remain unchanged. Homepage glass styling and entry/recovery remain.
- Verified: **127 CPU tests**, **29 flip/browser checks**, **152 desktop UI checks**,
  **63 jetpack/boundary checks**, **8 lifecycle checks**, **11 isolated interaction/
  quality checks**, and the independent two-rest source/phase/render/collision/
  holder audit with **16 CAD drops**.
  Inventory validation, typecheck, lint and local production build pass. Real
  keyboard flight reaches and lands on both faces with one flip and no reset.
  Fixtures cover standing on/beneath CAD, safe and at-risk airborne visitors,
  destination/late obstructions, repeat presses, Escape/resume, focus/visibility,
  context loss during a flip, retry and late-load disposal. Four desktop sizes
  and 200% text retain readable controls and layout.
- Actual before/during/after captures in both directions, arrival, landed views,
  static seating inspections and reports remain local in `artifacts/bench-flip/`.
  The updated [walking documentation](docs/BENCH_EXPERIENCE.md) records behavior,
  limits and reproduction. Local production preview: <http://127.0.0.1:4189/bench>.

Remaining: owner visual/mouse-feel walkthrough and existing physical-device,
human-accessibility and internal CAD qualifications. Safety envelopes are
conservative, not exact swept-solid certification; narrow existing CAD cavities
can still need explicit R recovery. No push, deployment, publication or CAD
redistribution. Prior paired-station milestones below are historical.

## Shared walking glass styling — 24 October 2026

Updated locally on `codex/bench-ui` after owner feedback. The homepage controls
popup now uses the existing blurred dialog backdrop. Popup and Escape menu share
homepage panel colors, 16 px corners and 20 px glass blur; the Escape menu blurs
the scene behind it. Navigation, direct-entry/loading and exploration hints use
compact 12 px glass surfaces with the shared panel opacity for readable contrast
over the bright desk. Typography, button/focus treatment and close targets match
the homepage. The scene stays sharp while exploring.

- 152 desktop UI checks and five homepage viewport/text-size entry checks pass:
  actual capture/look, entry, Escape/resume, focus, hints, navigation, loading and
  error recovery, four desktop sizes and 200% text. Translucent surface contrast
  is checked against white behind the glass (≥4.5:1). Typecheck, lint and local
  production build pass. Actual homepage, popup, exploration, menu and error
  captures/reports stay in `artifacts/bench-glass/`; preview remains port 4187.
- Only interface presentation changed. Desk, original holders, corrected seating,
  materials, controls, gravity, collisions, boundaries, camera and 1.65 mm visitor /
  1.48 mm eye height are unchanged. No new issues found; prior physical-device
  qualification and browser pointer-lock limitations remain.

Next: owner visual walkthrough. No push, deployment, publication or CAD redistribution.
The earlier no-blur styling below is superseded by this requested glass treatment.

## Homepage walking popup — 24 October 2026

Updated locally on `codex/bench-ui` after owner feedback. **Walk inside the
movement** now opens the brief controls on the homepage. **Enter the movement**
then navigates to `/bench` and captures the mouse when ready, without repeating
the instruction card. The popup reuses the existing dialog/focus infrastructure
with neutral styling and no added blur or decoration. Escape/resume and all
movement, camera, scene, material, corrected seating and scale settings remain.

- Entry intent is one-use and memory-only. Direct visits/Back show a small Enter
  button over the scene. Escape, blur and hidden-document events during loading
  cancel automatic capture; declined capture and failed loading retain clear
  error/retry controls. No persistent auto-entry preference was added.
- **137 UI checks** verify popup → route → actual capture, cancellation/focus restoration,
  focus containment, direct visits/Back, mouse look, movement/thrust,
  Escape/resume, loading cancellation and error recovery across four desktop
  sizes plus 200% text. Five homepage entry checks also cover small viewports.
  Six lifecycle checks, all 63 jetpack checks, 118 CPU tests, typecheck, lint and
  production build pass. Actual captures/reports stay in `artifacts/bench-popup/`.
- Local preview starts at <http://127.0.0.1:4187/>. The full uninterrupted flow
  passes in local Chrome. Browsers that decline pointer lock may require the
  compact Enter action; physical-device/human-feel qualification remains open.

Next: owner walkthrough of the revised entry flow. No push, deployment,
publication or CAD redistribution. The previous entry-card milestone below is
historical; its visual simplification remains, with first-use instructions now
on the homepage.

## Quiet walking UI — 24 October 2026

Implemented locally on `codex/bench-ui`. `/bench` now uses the homepage's
sans-serif typography, neutral color tokens, compact spacing and button treatment.
A small entry/menu replaces the large serif card; removed the scale/station badge,
reticle, duplicate navigation, kicker and explanatory copy. Entry is explicit,
Escape offers **Resume exploring**, and exploration retains one concise hint row
and the homepage link. Existing reset/detail actions remain in the Escape menu.
Loading, retry, capture errors and visible keyboard focus remain available.

- **97 browser UI checks** pass at 800 × 600, 1024 × 640, 1440 × 900,
  2400 × 1300 and 1024 × 768 with 200% text. Verified keyboard entry, actual
  mouse capture/look, movement/thrust, Escape/resume, hints, navigation, focus,
  contrast ≥4.5:1, pending loading, asset/capture/graphics failures and recovery.
  Screenshot review caught and fixed enlarged-text menu clipping/header crowding.
- **63 jetpack checks**, six lifecycle checks, the independent source/phase/
  render/collision/holder audit and 16 CAD drops pass. Desk, original holders,
  corrected seating, materials, movement controls, gravity, collisions and desk
  boundaries are unchanged. Visitor height remains 1.65 mm; eyes stay 1.48 mm
  above feet. All 118 CPU tests, typecheck, lint and production build pass.
- Actual homepage, before/after entry, exploration and Escape-menu captures,
  error states and reports remain local under `artifacts/bench-ui/`; the visual
  comparison is `review.html`. Reproduce UI checks with `scripts/bench/ui-check.mjs`
  and the existing Playwright/Chrome environment variables. Local production
  preview: <http://127.0.0.1:4186/bench>.

No new scene/physics issues found. Physical-device/human-feel qualification and
previous CAD limitations remain. The in-app browser declined pointer lock;
actual capture/resume passed in local headless Chrome. Next: owner walkthrough.
No push, deployment, publication or CAD redistribution; release gates unchanged.

## Correct original-holder seating — 24 October 2026

Implemented locally on `codex/holder-seating`. Both original holders were a
quarter-turn out of alignment. A +90° world-Y rotation aligns their actual
source −Y stem reliefs and shaped underside pockets with the movements. The
mainplate seating heights were already correct. No movement geometry, internal
placement, reviewed phase, finish, crown assembly or holder shape changed.

- Original STEP solids confirm zero plate/holder penetration and zero seating
  distance, with 189 bridge / 48 dial distributed support witnesses at the
  Y12.8 / Y13.7 shoulders. All eight crown/holder solid pairs are clear; minimum
  distances are 0.702108 mm bridge / 0.100000 mm dial. The previously unresolved
  crown interference is resolved at this corrected static pose; its old
  measurements remain explicitly historical. This is not tolerance or clamping
  certification. [Evidence and hashes](assets/source-manifest/holder-seating.json).
- Independent runtime audit verifies both 219-leaf presentations, all 18 phases,
  holder and movement render/collision matrices, underside surface contacts,
  environment clearance, openings and 16 CAD drops. All **63 jetpack checks**
  pass: thrust/coast/fall/braking/landing/relaunch, both movements reached without
  reset, tops/undersides/sides, and every desk edge/corner grounded and airborne.
  Six lifecycle checks, 118 CPU tests, typecheck, lint and production build pass.
- Fresh real arrival, flight approaches and landed views were captured and
  inspected at the unchanged 1.48 mm eye offset. Reports and images are local in
  `artifacts/holder-fit/`; preview remains <http://127.0.0.1:4185/bench>.

Other internal CAD uncertainties, narrow-cavity recovery and physical-device/
human-feel qualification remain as previously recorded. No push, deployment,
publication or source/derived CAD redistribution. Next: owner walkthrough.

## Host-dependent case clamps and dial screws — 24 October 2026

Implemented locally on `codex/assembly-fittings`. Identified exact source
occurrences in [assembly-fittings.json](assets/authored/assembly-fittings.json):
three d185 `Werkhaltelasche` clamps (38/39/41), their three d189 screws
(45/44/43 respectively), and the two radial d201 dial-retaining screws
(mainplate 11/12). Shared definitions are not blanket-hidden.

- Explorer assemblies show clamps/fasteners only with the actual loaded case,
  and dial retainers only with fitted dials. Whole-movement selection, missing
  optional assets, configuration toggles and inventory respect membership.
  Explicit individual source-part inspection remains available. Source geometry,
  matrices, materials and all reviewed phases are unchanged.
- Both walking presentations omit all eight leaves from rendering and collision:
  **215 movement leaves + 4 original crown leaves = 219 per station**. This
  supersedes the preceding milestone's 227-leaf station count. Original red
  holders, layout, jetpack, eye height and desk boundaries remain unchanged.
- Workshop's uncased assembly omits the six case-fitting actions. Existing
  central-dial prerequisites already correctly defer its two retaining screws.
  Final inventory is 259 leaves; Easy has 83 placements, Hard 243 placements
  plus 35 transfers. Version `play-5` preserves useful `play-4` save progress by
  removing only the six retired actions and validating the remaining history.
  Counts, completion text and inventory labels now match that assembly.
- Verified: 118 CPU tests, source/runtime regression, exact inventory/40 legal
  graph orders per level, typecheck, lint and production build. Fourteen targeted
  browser checks cover all host combinations, selected-part toggles, inventory,
  both walking render/collision sets and old-save restoration in both Workshop
  levels. All 92 focused Workshop checks and 311 explorer watch/dial/inventory/
  interaction checks pass. Independent bench source/phase,
  clearance, openings and 16 CAD-landing checks pass with the reduced membership.
  Evidence is local under `artifacts/assembly-fittings/`.

Local preview remains <http://127.0.0.1:4185/bench> (reload the existing tab).
No mechanical redesign or new mechanical certification is claimed. Known
crown/holder interference and prior CAD uncertainties remain unresolved.
No push, deployment, publication or source/derived CAD redistribution.

## Plain desk and gravity jetpack — 24 October 2026

Implemented locally on `codex/desk-jetpack`. All prior ramps, recessed desks,
terraces and stair concepts below are superseded. Current behavior and
reproduction are in [BENCH_EXPERIENCE.md](docs/BENCH_EXPERIENCE.md).

- One 124 × 104 mm wooden desk and one thin green mat, with two intact original
  red holders resting directly on it. Bridge-up and dial-side-up stations sit
  side by side, 54 mm apart. Only complete-station translations changed;
  movement geometry, reviewed phases, finishes and original crowns are preserved.
  Environment is two visible/colliding meshes, 24 triangles; no access structures,
  wells, rails, props or hidden floors over movement openings.
- Actual arrival is on the mat, feet (0, 0.000001, 54), eyes Y1.480001, facing both
  holders and their aisle. Visitor remains 1.65 mm tall with 1.48 mm eye offset.
  Full-height holder walls obscure most top details at ground level; flight
  reveals them. Before/after actual entry views were visually inspected.
- Hold Space applies continuous upward acceleration against unchanged 18 mm/s²
  gravity. Release coasts then falls; thrust during a fall brakes before climbing.
  Quadratic air resistance and gradual horizontal acceleration allow precision.
  WASD works in air/on ground; landing and relaunch need no mode switch. No hover,
  altitude lock, flight toggle, descend control, fuel or flight HUD. High-flight
  clipping is extended while retaining eye height and the existing mouse look.
- Capsule-radius desk bounds constrain only outward travel on every substep,
  at every altitude, including corners and fast/long frames. Edge sliding stays
  available. No automatic repositioning/recovery, wall meshes or rails; R remains
  an explicit return to arrival. Escape, blur and hidden-tab transitions clear
  held controls/thrust; momentum persists and visible gravity continues.
- Verified: **116 CPU tests**, typecheck, lint, production build, runtime source
  regression, inventory and original-holder preparation/hash checks. Independent
  source-pose audit retains both sets of 227 leaves and all 18 reviewed phases;
  world/collision matrix error ≤1.43e−14. Sixteen real-CAD drop samples, source
  openings and environment clearances pass. **63 live journey/fixture checks**
  cover takeoff, held thrust, release, coast/fall, descent braking, landing and
  relaunch; both movements reached/landed without reset or swap; every edge and
  corner grounded/airborne (including 50/500 mm altitude and a 100 mm/s,
  10-second-frame stress fixture), edge sliding, tops/undersides/sides, ground
  circulation and real-mat falls. Six lifecycle checks cover focus loss,
  visibility, graphics retry and late-load disposal. Eleven interaction/quality
  checks also pass, including captured mouse look, idle sleep and Auto adaptation.
- Local production review: <http://127.0.0.1:4185/bench>. Actual first-person
  arrival, flight approaches and landed views plus camera/feet records are in
  `artifacts/jetpack/review.html` and `jetpack-report.json`. Geometry and high-flight
  reports accompany them. Captures/generated assets/editable Blender stay ignored.

**Crown/holder interference remains explicitly unresolved.** Original source
contacts and other previously recorded CAD/mechanical uncertainties are unchanged.
Very narrow or enclosed CAD cavities can require explicit R recovery. Headless
local tests do not qualify physical mouse feel, other devices, accessibility or
sustained performance; earlier performance measurements are historical. Next:
owner walkthrough and representative-device review; mechanical fit needs a
separate maker/reviewer decision. No push, PR, deployment, publication or CAD
redistribution was performed; release gates remain closed.

## Design C — exposed holders, stairs and hops — 24 October 2026

The owner now prefers holder bases on the desk, with no recesses or ramps, and
permits stairs and a hop into each movement. New [design-only sketches and evidence](docs/DESK_STAIRS_SKETCH.md)
show candidate 5.9 / 6.7 mm derivative holders on a single worktop, with 30 / 34
small risers and two short hops. The bridge uses a lower perimeter plate landing.
Both selected landings and synthetic hops pass read-only checks against existing
CAD collision geometry. New stair traversal and holder mechanics are unqualified.

The 1.65 mm visitor, 1.48 mm eye height, movement geometry, reviewed internal
placements and original crowns remain unchanged. The candidate base requires
mechanical review; crown/holder interference remains unresolved. No application,
runtime asset, original CAD, push or publication changes. Next: owner sketch
review; no implementation is authorized by this design task.

## Earlier design-only desk review — 24 October 2026

Reviewed the actual first-person arrival, holder references and seating evidence.
Two local concept boards compare recessed intact holders with a shortened-holder
derivative: [review and dimensions](docs/DESK_DESIGN_REVIEW.md).
Recommend intact holders with level entrances on one compact desk. Candidate
underside cuts separate each holder into four solids; a shorter version needs a
new connecting base and mechanical review. Crown/holder interference remains
unresolved. Original source hashes and reviewed occurrence matrices are unchanged.

Sketches retain the 1.65 mm visitor and 1.48 mm eye height. They are sightline and
section studies, not an implemented or walking-verified redesign. No application,
runtime asset, source CAD, push or publication changes. Next: owner design review;
implementation is explicitly outside this task.

## First-use review correction — 24 October 2026

Reviewing the real entry view after owner feedback exposed a missed usability
fault: the simplified desk's old spawn faced beside the bridge ramp, and holding
W could enter the holder well. The previous scripted journey supplied its own
headings, so its passing result did not qualify the default first-use route.

- Arrival/reset now uses the existing level west landing (−49, 17.602, 12),
  facing +X into the bridge movement. Geometry, holders, crowns, camera
  proportions and movement physics remain unchanged.
- The local environment's stable URL was served with a one-hour browser cache.
  Its loader now uses a fresh `no-store` fetch before GLB parsing. A proxy-backed
  browser fixture first proved that a stale response was cached, then confirmed
  bench entry bypassed it and loaded the current scene. The owner's existing
  browser cache was not inspected; this fixes a demonstrated possible stale view.
- The revised journey passes 36 checks, starting with actual W input and no
  heading injection; it reaches real CAD without falling or resetting. Six
  lifecycle checks, source/phase/clearance audits, typecheck, lint and build pass.
  New first-person before/after captures and cache evidence are under
  `artifacts/paired-atelier/live-review/`. Local server: <http://127.0.0.1:4183/bench>.

The original crown/holder fit remains unresolved. No push or publication.

## Simpler paired desk — 24 October 2026

The owner requested a much simpler experience after reviewing the paired atelier.
Replaced the terraced landscape with one open green worktop at Y13.5, a narrow
walnut border and two straight 1:6 access ramps. Removed the upper promenade,
pause terraces, guards, backdrop wall and tool props. Both movements and original
crowns remain simultaneous; every CAD pose, reviewed phase and holder is unchanged.
The known crown/holder fit stays unresolved by the owner's explicit decision.

- Blender source and editable scene retained. Environment reduced from 12 meshes /
  5,074 triangles to 8 meshes / 2,164 triangles (220,208-byte GLB).
- Independent pose, render/collision, 16 CAD landing and opening checks pass.
  Authored geometry clears the crowns by at least 1.849 mm / 1.720 mm
  (bridge/dial). Three probes verify open circulation and visible edge drops.
- All 39 keyboard journey checks pass: both ramps and real CAD entries in both
  directions, no required jump, swap or reset; capture, recovery, retry and
  disposal remain working. All 113 CPU tests, typecheck, lint and production
  build pass.
- Six fresh Auto turning/walking samples (bridge, dial, pair), headless Chrome
  155 / M4 Metal at 2400 × 1300 CSS / DPR2, retain render ratio 1. Frame p95
  16.8–17.4 ms; 2/2,153 intervals over 25 ms, none over 50 ms. This is a local
  regression spot-check, not a physical-device or fixed-High qualification.
  Report: `artifacts/bench/simple-atelier.json`; source/asset hashes accompany
  the review. The application camera and renderer are unchanged.
- Local review: <http://127.0.0.1:4183/bench>.
- New headless captures and reports: `artifacts/paired-atelier/simple/`.
  The previous terraced captures and performance figures below are historical.

No push, deployment, publication or source-asset redistribution.

## Previous terraced atelier — locally verified, 24 October 2026

Implemented from clean `01860fa` on local `codex/paired-atelier`. Production
review: <http://127.0.0.1:4183/bench>. The selected paired atelier is now one
continuous walnut/green desk with two simultaneous stations, 64.56 mm apart.
See [current behavior, source contract and reproduction](docs/BENCH_EXPERIENCE.md).

- Each station has all 223 reviewed movement leaves, its original maker holder
  and four original external crown leaves. Shared geometry/materials/BVHs retain
  separate instance poses. All 18 reviewed phases, source matrices, dimensions,
  finishes and openings are preserved. Independent world-pose error is at most
  1.43e−14; render/collision agreement and 16 CAD landings pass.
- A Y12.4 forecourt, two gentle rises, pause bay and supported 6 mm clear promenade
  reach both established west interfaces. T/swap/fade are removed. Both stations
  stay physical; nearby status and fall checkpoints follow location. Authored
  threshold noses ease return stepping while preserving original underside heights.
- **Crown/holder fit remains unresolved by explicit owner decision.** Original
  STEP confirms body, inner-seal and cover-ring intersections on both holders.
  Body common volumes are 2.297096359 / 3.874614059 mm³ (bridge/dial). The owner
  chose to keep the originals; no source repair, relief or pose change was made.
  [Measured evidence and decision](assets/source-manifest/atelier-crown-fit.json)
  distinguish this retained conflict from clear authored-environment geometry.
- Background Blender builds a reproducible editable scene with walnut, linoleum,
  steel and ivory. Explicit glTF extras preserve materials and distinguish actual
  walkable/boundary triangles from decoration. Twelve render meshes, 5,074
  triangles; generated assets and captures remain local/ignored. Headless
  grayscale and finished captures cover the whole pair, circulation, arrival,
  promenade, actual eye-height CAD entrances and both crowns.
- Verified: 113 CPU tests, 115 runtime checks, inventory, typecheck/lint, local
  production and release-gated packaging builds, HTTP metadata; 35 production
  keyboard-journey checks, six lifecycle checks, two visible-guard probes,
  explorer watch/inventory/interaction (254 checks), Workshop focused (92 checks).
  The round trip uses keyboard physics, no forced jump or automatic reset.
  Retry, capture/Escape, idle sleep, both nearby recoveries and disposal pass.
  Vercel output excludes `bench-local`. No foreground browser was opened.

- Production profiling of `ef2a14d`: all 18 headless samples pass at 2400 × 1300
  CSS / DPR2, Chrome 155 / M4 Metal. Auto retained ratio 1, p95 17.9–18.5 ms,
  2/2,154 intervals over 25 ms and none over 50 ms. High retained 1.5 and reached
  p95 27.6 ms; Low retained .85, p95 16.8–17.3 ms. First-render CPU remains
  111.8 ms. These qualify the recorded headless workloads, not physical mouse
  feel, cold-driver startup, representative devices or sustained thermal behavior.
  Eleven interaction/quality checks pass. The updated profiler verifies DPR and
  manual ratios; screenshot-induced DPR-reset samples were explicitly excluded.
- Final local captures and source hashes are indexed in
  `artifacts/paired-atelier/review.html` and `build-manifest.json`. The production
  review server remains on port 4183. The editable Blender scene and all generated
  assets stay ignored. Application implementation is committed as `ef2a14d`;
  final evidence/tooling is recorded in the following local milestone.

Next: owner walkthrough and representative device review; crown/holder
compatibility requires a separate maker/mechanical decision. No further local
implementation is pending under this task. No push, PR, deployment, publication
or source-asset redistribution was performed.

## Performance and CAD fidelity — done for now, 24 October 2026

Accepted for the current static website at local commit `d235cee`. Both workstreams
are **done for now**; further optimization or geometry polishing is not scheduled.

- **Performance:** the measured responsiveness problems are resolved and the
  retained regression checks pass. Representative physical-device/browser testing,
  physical mouse feel, cold-driver startup and sustained thermal behavior remain
  unverified. Initial paint still measured about 101 ms CPU after precompilation,
  and manual High quality can miss 60 fps at large viewports. These limitations
  remain recorded in the [performance review](docs/BENCH_EXPERIENCE.md#responsiveness-verification--24-october-2026).
- **CAD fidelity:** original geometry and provenance are preserved; all 12
  identified tooth contacts have reviewed static phase corrections, with consistent
  placement across explorer, Workshop and walking. The d144 open shell, invalid
  d27 dial solid and retained crown/click contact remain documented uncertainties.
  Static clearance does not certify running engagement, spring behavior, hand
  setting or manufacturing tolerances. See the
  [CAD decision record](docs/REMAINING_WHEEL_CONTACT_REVIEW.md).

Reopen either workstream for a reproducible visual defect, a measured performance
regression, or new evidence from device testing or the maker. Mechanical review
is required before design or running-model changes. Existing
[release gates](docs/RELEASE_GATES.md) remain unchanged; this status does not
authorize publication or deployment. Earlier milestone results and limitations
below are retained as the evidence history.

## Remaining wheel pairs — 24 October 2026

Implemented from `b5bbfa9` on local `codex/wheel-contact-audit`. The production
review server is <http://127.0.0.1:4179/>; reload the homepage or walking tab.
See the [complete decision record](docs/REMAINING_WHEEL_CONTACT_REVIEW.md),
[provenance](assets/source-manifest/remaining-wheel-contact.json), and local
`artifacts/remaining-wheel-contact/report.html` with nine matched before/after sections.

- All nine remaining initial tooth pairs are clear: d90/d249, d97/d249,
  d94/d237, d238/d242, d234/d243, d137/d210, d141/d211, d210/d213 and d187/d217.
  Together with d96 and the ratchets, all 12 initially confirmed non-coaxial
  tooth contacts have zero original-solid common and disjoint runtime meshes.
- The evidence supports incompatible static source phases, not import errors,
  perspective or tessellation-only overlap. Added 15 rigid occurrence phases:
  barrel I drum/cover/spring +1.45° world Z; winding pinion +7.7° local Z;
  cannon pinion +3.3° world Z; hour 1 wheel/hub −2.95°; hour 2 wheel/hub +0.25°;
  motion 1 wheel/pinion +0.8°; third wheel/pinion +16.6°; seconds wheel/pinion +2.3°.
  Exact local signs, IDs and matrices are in the record. Crown/click and
  escapement stay fixed. Rejected a crown-only phase that increased click penetration.
- Qualified all 15 moved valid solids against all 364 other leaves: 251 directed
  before/after records, 5,194 AABB exclusions, 15 recovered-diamond exclusions;
  plus 30 exact fitted-hand checks / 195 exclusions. No common increase beyond
  1e−8 mm³. Eight packet-relative matrix checks pass. Three zero-common checks
  involve the already-invalid d27 dial solid and remain provisional.
- Original CAD downloads, 36 preexisting tracked assets, 222 overview buffers,
  axes, dimensions and base targets are unchanged. Only the shared authored
  override changes runtime placement, consistently across all three experiences;
  no controllers, UI, materials, visibility or dependency formats changed.
- Verified: 111 CPU tests, 115 runtime checks, inventory, 1,119 access checks,
  typecheck/lint/build, source hashes, Meshopt identity and HTTP metadata.
  Headless before/after checks verify 75 live transforms per stage. Explorer
  passes 350 checks; Workshop focused 92, Easy 89 actions / 538 checks, Hard
  284 actions / 1,708 checks; walking 23 checks and 16 collision landings.
  All 18 final phases agree with walking collision on both holder sides.
- New nominal solid gaps span 0.004479–0.027174 mm. Static clearance does not
  certify tolerances, loaded tooth engagement, spring attachment/loading,
  hand setting or a running escapement. d144 remains an open shell; d27 source
  validity and the retained crown/click common require separate mechanical review.
  Evidence stays local. No push, PR, deployment or asset publication.

Next: maker/mechanical review of those retained uncertainties before any design
or running-model changes. The initial static tooth-contact correction scope is complete.

## Ratchet tooth contact follow-up — 24 October 2026

Implemented from `f027338` on local `codex/wheel-contact-audit`. The production
review server remains at <http://127.0.0.1:4179/>; reload existing browser tabs.
See the [ratchet decision/evidence record](docs/RATCHET_CONTACT_REVIEW.md) and
[provenance](assets/source-manifest/ratchet-contact.json).

- Corrected d131 ratchet occurrence **15** together with its keyed barrel II
  core d87 (`1__0_1_1_84_3`) by **+1.8° world Z**: local angles −1.8° / +1.8°
  because their local axes point in opposite directions. Occurrence 14 stays
  unchanged. Their relative mounting matrix is preserved within 8.9e−16.
- Original ratchet common volume falls from 0.060692779 mm³ to zero, with
  0.031730939 mm minimum solid distance. Decoded runtime triangles are disjoint
  at 0.032225302 mm. Rejected isolated-wheel and quarter-turn alternatives are
  recorded: they either retain tooth overlap or introduce keyed-core penetration.
- All 364 other leaves are considered for each moved part: 32 exact before/after
  checks, 694 broad-phase exclusions and two recovered-diamond checks. No increased
  solid common; crown, click and click spring are explicitly checked. Barrel/cover
  gaps remain 0.005 mm and the modeled mainspring gap remains 0.006985294 mm.
  Existing core/screw common and nominal contacts remain; spring attachment,
  loading, running engagement and manufacturing tolerances are not certified.
- Added only two pose entries to the existing shared override. Original sources,
  36 preexisting tracked assets, 222 overview geometry buffers, all source/base
  target matrices and d96's earlier correction are preserved. Runtime controllers,
  UI, materials, visibility and save/dependency formats are unchanged.
- Verification passes: 111 CPU tests, 115 retained runtime checks, inventory,
  1,119 sampled access checks, typecheck/lint, production build, source hashes,
  Meshopt byte identity and HTTP metadata. Headless before/after live checks
  independently verify 12 transforms across the three routes. Final explorer
  suites pass 350 checks; Workshop focused 92, Easy 89 actions / 538 checks,
  Hard 284 actions / 1,708 checks; walking passes 23 journey checks and 16
  collision landings with matching render/collision poses on both holder sides.
- Reproducible original-solid measurements, orthographic tooth/bore sections,
  matched homepage close-ups, and browser reports are local under
  `artifacts/ratchet-contact/`. Scripts and evidence hashes are committed; images,
  original downloads and generated CAD remain local. No push, PR or publication.

The nine-pair follow-up above completes the next action from this milestone;
d144 remains an open-shell question. Static clearance is not mechanical certification.

## Wheel contact investigation and static phase — 24 October 2026

Implemented from clean `4e33275` on local `codex/wheel-contact-audit`.
See the [pair identities, measurements and decision record](docs/WHEEL_CONTACT_REVIEW.md)
and [provenance](assets/source-manifest/wheel-contact.json). Evidence remains local
under `artifacts/wheel-contact/`; production review server is on port 4179.

- Surveyed 26 toothed occurrences / 325 pairs, with 45 original-BRep candidates.
  All 223 movement source matrices match fresh XCAF composition exactly. Confirmed
  12 non-coaxial source-solid contacts, separated five coaxial joints and the d144
  open-shell volume signal. Orthographic close-ups, interior witnesses and finer
  tessellation distinguish these from perspective and mesh-only artifacts.
- Corrected only transfer wheel d96's static phase, +6.25° about its original
  local Z bore. Source common volumes with d85/d93 were 0.036083741/0.010153667
  mm³; both become zero with 0.026971/0.022584 mm minimum solid gaps. Actual decoded
  runtime meshes also stop intersecting (0.027128/0.022821 mm gaps). Fourteen
  nearby original-solid checks show no increased penetration; existing screw-fit
  and jewel contacts remain. The empty assembly diamond's recovered STL is disjoint.
- One reproducible authored override is shared by explorer, Workshop and walking.
  Source STEP/GLBs, geometry buffers, immutable matrices and Workshop base targets
  retain their hashes/values. No tooth, axis, scale, material, UI, visibility or
  performance changes. Explorer tracks the phase separately as a display pose;
  Workshop seat bounds and walking collision use the same corrected pose.
- Validation passes: 110 CPU tests, 115 retained-input runtime checks, inventory,
  1,119 sampled access checks, typecheck/lint, production build, source hashes and
  Meshopt byte identity. Headless browser checks pass before/after: seven explorer
  suites (350), Workshop focused (92), walking journey (23). Final complete Easy
  (89 actions / 538 checks), Hard (284 actions / 1,708 checks), 17 entry checks,
  HTTP metadata checks and 16 landings pass. Walking independently verifies the
  one phase exception, all other source poses and both collision presentation
  transforms. Original and corrected local screenshots/reports are retained.

Next: coupled phase/contact review for the other ten confirmed pairs; review d144
as an open shell before making any solid-interference claim. Their original poses
and measured overlaps remain unchanged. The accepted correction is an unloaded
static presentation, not maker clocking, dynamic contact or mechanical
certification. No push, PR, deployment or asset publication was performed.

## Local responsiveness follow-up — 24 October 2026

Implemented and verified from clean `989bd6f` on `codex/walk-inside-movement`.
See the [paired evidence and reproduction](docs/BENCH_EXPERIENCE.md#responsiveness-verification--24-october-2026).
Local production preview: <http://127.0.0.1:4178/bench>.

- Diagnosed GPU pixel/transmission cost at a larger visible viewport; collision
  was not the driver. Mouse deltas now coalesce per frame, and stationary turns
  participate in monitoring. A bounded scheduling-only tail handles sparse input
  without redrawing unchanged views or counting sleeping intervals.
- Auto starts at pixel ratio 1, reduces gradually through .85 and .7 using
  sustained windows and cooldowns, and avoids oscillating recovery probes.
  Explicit Low/High remain fixed within the viewer session, including side
  switches. Half-resolution transmission retains jewel optics and opaque finishes.
  Common material variants compile during loading. CAD geometry, source dimensions,
  placements, visible openings and collision code remain unchanged.
- Accepted visible Chrome/M4 comparisons at 2400 × 1300 CSS / device DPR 2:
  baseline High p95 **32.5–36.6 ms**, final Auto **17.2–17.6 ms**. Frames over
  25 ms fell from **622/871 to 0/1,437**; over 50 ms from five to zero. At the
  same High resolution, the isolated transmission change lowered p95 to
  22.7–28.8 ms. CPU, GPU timer and handler-to-render timings are reported separately.
  These automated workloads do not establish physical mouse feel or other devices.
- 107 CPU tests (six new activity/quality cases), inventory, types/lint, local
  production and Vercel packaging builds, and HTTP metadata checks pass. Vercel
  output still excludes local bench assets. All 23 visible walking-journey checks,
  11 focused interaction checks and seven lifecycle checks pass, including actual
  window hiding, stopped rendering, capture/Escape, side switching, retry and cleanup.
  Seven explorer suites pass 350 checks; Workshop entry/focused checks pass 17/92.
- The foreground helper uses isolated Chrome with Playwright 1.62.1's
  `noDefaults` connection, preserving actual focus/visibility. Focus-lost samples
  were rejected; earlier emulated-focus runs are exploratory only. Evidence and
  the baseline archive remain ignored under `artifacts/bench/`. No push, PR,
  deployment, publication or asset redistribution was performed.

Next: owner physical-mouse walkthrough and representative device/browser review.
The [feature decision record and testing strategy](docs/BENCH_EXPERIENCE.md#maintenance-and-decision-record)
now preserve the implementation rationale and headless-first testing direction.
The paired interaction and first-use profilers now default to headless Chrome;
`BENCH_BROWSER=headed` retains the native visible path. Reports distinguish
execution mode, GPU backend, host/browser settings and caller-supplied server
revision from the harness revision. Workloads retain their placements and timing.
All 12 headless interaction scenarios pass on M4/Metal; Auto p95 is 17.5–17.6 ms
with zero frames over 25 ms out of 1,436. Headless Auto/Low first-use probes pass,
as do 13 bench CPU tests and runner syntax/lint/format checks.
Two fresh visible first-use attempts lost native focus and were rejected; an
accepted fresh visible comparison remains outstanding. See the dated tooling
verification in the feature reference; no application behavior changed here.
Initial paint still measured about 101 ms CPU after precompilation; manual High
can miss 60 fps at the large viewport. Cold-driver startup, prolonged thermal
behavior and broader hardware support remain unverified. Publication still needs
separate authorization and the existing release gates.

## Local walking experience — 24 October 2026

Implemented from clean `develop` baseline `0233a5f` on local branch
`codex/walk-inside-movement`. The homepage’s
**Walk inside the movement** button opens `/bench`; explorer and Workshop remain
separate. See [bench setup and evidence](docs/BENCH_EXPERIENCE.md).

- A 1.65 mm first-person visitor walks and jumps on the actual 223-leaf movement.
  Source placements and dimensions are unchanged. Per-definition BVHs query the
  CAD triangles directly; the source-matrix comparison has zero error. Sixteen
  sampled drop/landing checks pass, including exposed plates and bridges; sampled
  holes retain lower visible support rather than invisible floors.
- Inspected both maker holder STLs, STEP models and assembled reference images.
  Recorded URLs/hashes and nominal seating in `assets/source-manifest/holder.json`.
  T fades between the separate valid presentations and resets to the mat; no
  mechanical turnover mechanism is claimed. The authored access fixture is a
  separate Blender scene with reproducible export and a local editable `.blend`.
- Explicit mouse capture, WASD, jump, reset, Escape/menu, repeated T, fall recovery,
  loading failure/retry and repeated entry/exit pass the 23-check production
  browser journey. Six additional lifecycle checks cover actual tab focus loss,
  synthetic hidden-document events, WebGL context loss/retry and late load disposal.
  Headless Chrome reports inactive tabs as visible, so hidden-document handling
  is tested with an explicit visibility fixture, not claimed as an OS-level test.
- On this Mac mini M4 / 24 GB, macOS 26.6.2, Chrome 155.0.8059.86 / ANGLE Metal,
  a 60.196-second bridge benchmark at 1440 × 900, pixel ratio 1.5, High detail
  recorded 3,600 active intervals: mean 16.666 ms (~60 fps), p95 16.7 ms,
  p99 16.8 ms, p95 CPU submission/update 5.4 ms. The full journey at pixel ratio
  1 also averaged ~60 fps. Rendering stops at rest and on hidden-document events.
  These are local headless measurements, not a broad device or thermal claim.
- Validation: 101 CPU tests, inventory, typecheck/lint, local production and
  Vercel packaging builds, five homepage viewport/text-size entry checks,
  HTTP metadata checks, seven explorer suites (350 checks), Workshop entry
  (17 checks), focused checks (92), complete Easy (89 actions / 538 checks)
  and complete Hard (284 actions / 1,708 checks) pass. Local browser evidence and
  representative screenshots are in ignored `artifacts/bench/`.
- Original holder downloads, prepared holder payloads, Blender outputs and browser
  evidence remain ignored. Vercel packaging explicitly excludes `bench-local`;
  the exclusion has an automated test and the built output was inspected.
  No remote push, PR, deployment or
  publication was performed. Source redistribution and other release gates remain.

Next: owner walkthrough of the local prototype and representative usability/device
review. Very narrow/deep CAD recesses can require R; mobile navigation is outside
this milestone. Maker finish and seating are static interpretations, not physical
mounting/printing certification. Publication needs separate permission and approval.

## Repository cleanup — 23 October 2026

[Draft PR #30](https://github.com/galind/zweigesicht-1/pull/30) targets `develop`
from baseline `33de8d1`; the initial working tree was clean. Its exact Vercel Git
deployment is disabled. The [review](docs/REPOSITORY_REVIEW.md) records the map,
findings, retained workflows and remaining decisions.

- Removed retired Workshop Hints/cutaway/callback code, ignored animation-scale
  bookkeeping, an unused camera argument, and 73 overridden CSS declarations
  plus four obsolete style rules. Save compatibility and CAD workflows remain.
- Fixed production Workshop entry without exposing its homepage action. Patched
  only Vite, source-map-js and tinypool; both npm audits report no known issues.
- Initial validation: 93 CPU tests, inventory, types/lint, both production builds,
  Preview build, 114 retained-input CAD checks, source hashes, Meshopt identity
  and 1,119 access checks passed. All 36 tracked asset/provenance/notice files
  match baseline. Browser checks covered complete Easy/Hard builds, 87 drag
  checks, 92 focused checks, nine explorer suites, production/Preview entry and
  enlarged-text loading/retry layouts. Original CI passed on `3109d06`.
- Follow-up passed 93 CPU tests, inventory, types/lint, both production builds,
  87 drag checks, 92 focused checks and 21 entry checks. Computed styles and
  element positions match before/after removal across 45 UI-state/viewport
  cases, including 200% text. Next action is draft review; no merge, release,
  deployment or publication is authorized.
- Removed the `/play` alias and its sole-purpose config at the owner's request.
  Rechecked 93 tests, inventory, types/lint, both production builds, HTTP metadata
  and removed-route checks, and 17 production Workshop entry checks; all pass.

## Public repository security — historical snapshot, 5 October 2026

The setup/next-action bullets below describe that date. At this review's fetched
baseline, PR #27 and the release/synchronization PRs #28/#29 are merged; their
merge commits are in `33de8d1`. This local review does not establish current app
credentials, environment settings or deployment health.

- Active [branch ruleset](https://github.com/galind/zweigesicht-1/rules/24522996)
  protects `main` and `develop`: PR required, resolved conversations, up-to-date
  branch and required `Verify` / `Branch policy` checks from GitHub Actions;
  deletion and force pushes blocked, no bypass actors.
- Zero collaborators and no deploy keys. Required approvals remain zero for the
  sole maintainer; automatic head-branch deletion is off. PR creation was already
  limited to collaborators and remains so.
- Actions require full commit SHAs, allow owner/GitHub-created actions, and require
  approval for every external contributor. Default token permissions remain
  read-only; workflow PR creation/approval remains disabled.
- [PR #27](https://github.com/galind/zweigesicht-1/pull/27) pins actions and adds a
  one-click **Release to production** workflow. It creates/reuses the release PR,
  waits for protected CI and merges only the captured head; then syncs main back
  through another checked PR. It aborts on branch changes and never bypasses rules.
- The release job runs only from `main`, using a private app token restricted to
  this repository and a `release-automation` environment restricted to main.
  PR CI remains read-only. The environment is created with only the `main` branch
  allowed (zero tags) and administrator protection bypass disabled. App creation,
  installation and credential provisioning are pending; no release app credentials
  have been created or added.
- Current validation: all 92 tests and lint pass. Prior inventory, typecheck and
  both production builds passed; app code and build configuration are unchanged.
  GitHub CI also passed for implementation commit `14f34b0` (run 37358264288).
  The one-click controller adds mocked GitHub tests for release/sync,
  branch races, forbidden invocations, blocked CI and failed/partial merges.
  Full integration validation requires the app setup and an authorized release.
- Next: complete app setup, merge PR #27 into develop, then perform a separately
  authorized bootstrap release PR to main and sync main back into develop.
  Old unpinned workflows remain blocked by the Actions policy until replaced.
  The preparation branch has Vercel Git deployment disabled; no production
  deployment or release was performed.

The publication preparation below is historical evidence from 3 October. Public
visibility does not resolve its outstanding asset/production release gates.

## Current application

- Static CAD explorer: 426 source instances, six mechanism groups, component
  inspection/isolation, separation and fitted case/dial/hand configurations.
- Workshop: 89 Easy placements, or 249 Hard placements and 35 transfers; 16
  foundation leaves remain and both finish with 265. Undo/local saves retained.
- Production hides the homepage Workshop entry and `?assemble=1`; direct
  `/workshop`, noindex and sitemap exclusion remain. Removed the `/play` redirect
  at the owner's request; Workshop is the only assembly URL.
- Original contributions use standard MIT; required upstream notices ship with
  builds. Maker CAD/design and derived assets remain outside that grant.

## Publication preparation — historical

`codex/publication-blockers` starts from refreshed `develop` at `90b606e`.
Remote `main` is `0037646`; `codex/running-movement` is `45fa9d3`; no remote tags.
PR #25 is merged. The preparation branch has Vercel Git deployment disabled.
[Draft PR #26](https://github.com/galind/zweigesicht-1/pull/26) targets `develop`;
the verified preparation milestone was committed and pushed over SSH.

- Recorded version hashes and branch reachability for runtime assets, source-linked
  decisions and audit metadata in the [publication inventory](assets/source-manifest/publication-inventory.json).
- Rechecked maker pages; no adequate public redistribution grant is recorded.
  Prepared an [unsent permission request](docs/ASSET_PERMISSION_REQUEST.md).
- [Release gates](docs/RELEASE_GATES.md) contain exact historical findings,
  proposed path removals, author-email treatment, hosted-surface coverage and a
  comparison of coordinated rewriting versus a fresh public snapshot.
- Essential assets, provenance and notices remain intact. No history rewrite,
  remote deletion, visibility change, release, deployment or permission-request sending occurred.
  Ignored local briefs and unrelated work remain untouched.

## Verification

Workspace cleanup: archived 1.47 GB of old local reviews, comparison downloads and
legacy briefs outside the checkout with per-file hashes. Removed 54 MB of generated
leftovers. Assets now occupy 145 MB; artifacts 175 MB. Tracked assets, provenance
and licenses are unchanged. Export removes completed checkpoints and avoids a
duplicate GLB write; optimization leaves gzip packaging to runtime preparation.
Cached CAD pipeline, Meshopt byte-identity verification, 114 retained-input runtime
checks, original-source hashes, 82 tests, inventory and production build passed.

Exposure review: 267 remote commits / 1,680 blobs; 273 local commits / 1,727 blobs;
seven decoded gzip versions; commit messages and email metadata; PR #1–#25
patches/discussions; 20 logs and empty artifact listings from 10 PR-head runs.
No checked credential signatures matched. Coverage gaps are explicit in the gates.

Preparation checks passed: 82 tests, inventory validation, typecheck/lint,
production build, 101 inventory path-version hashes, 22 local Markdown links,
JSON validity, preserved runtime/license/notice bytes and changed-file formatting.
Prior browser checks remain dated evidence; this documentation/configuration
change does not certify physical devices, mechanical behavior or live deployment.

## Outstanding publication decisions from the prior audit

1. Obtain maker permission for current and historical derived assets, or approve
   code-only distribution with externally supplied assets and revised setup/CI.
2. Choose a fresh public repository with this original retained private
   (recommended), or authorize a coordinated history rewrite and separate hosted
   cleanup. Decide internal-report retention and author-email privacy.
3. Review and authorize the concrete remediation, then verify the approved result
   before separately authorizing public visibility. Making this original public
   also requires completing the older/push/manual Actions and hosted-content review.

Server-side branch protection is now verified above; production qualification remains unverified.
Applicable physical-device, accessibility/usability, mechanical and clean-machine
CAD reproduction gates remain outstanding. Merging preparation or releasing
`develop` to `main` does not authorize publication.
