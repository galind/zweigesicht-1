# Current project status

Updated 24 October 2026. Setup is in the [README](README.md); extended checks are
in [architecture](docs/LOCAL_ARCHITECTURE.md). Repository visibility is public (changed by the owner).

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
