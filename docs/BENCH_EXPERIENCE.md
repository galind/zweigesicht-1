# Paired atelier walking experience

`/bench` is a local desktop experience with two simultaneous exposed movement
presentations on one plain wooden desk and one green mat. Bridge-up is on the
left and dial-side-up on the right. Hold Space to fly between them; land to walk
on their actual surfaces. Previous ramps, recesses, terraces and stair concepts
are superseded. The explorer and Workshop retain separate controllers/resources.

## Current behavior — 24 October 2026

Each station contains **215 movement leaves plus four original external crown
leaves**, and its intact original red maker holder. The uncased, undialed
presentation omits three case clamps, their three fastening screws and two radial
dial-retaining screws under the [shared assembly rule](CAD_NOTES.md#conditional-assembly-fittings--24-october-2026). The complete stations
retain their parent translations; the original holders now turn +90° about world
Y to align their stem reliefs and underside pockets. No source geometry,
internal pose, material, crown,
opening or holder design changes. All 18 reviewed phases remain separate from
original matrices; see [wheel review](WHEEL_CONTACT_REVIEW.md),
[ratchets](RATCHET_CONTACT_REVIEW.md) and [remaining contacts](REMAINING_WHEEL_CONTACT_REVIEW.md).

| Station | Parent placement (X, Y, Z), mm | Unchanged movement presentation | Holder |
| --- | --- | --- | --- |
| Bridge | (−27, 0, −7) | X +90°, Y +12.2 | `movement.stl`, X −90° then world Y +90° |
| Dial | (27, 0, −7) | X −90°, Y +16.3 | `dial.stl`, X −90° then world Y +90° |

The stations are 54 mm apart, with a 12 mm gap between the 42 mm holder envelopes.
The desk occupies X −62…62, Z −42…62 (124 × 104 mm). Its wood top is Y−0.12;
one 0.12 mm green mat, inset 1 mm from each edge, has its top at Y0. Both intact
holders rest directly on that mat. There are exactly two authored render/collision
meshes (24 triangles): desk and mat. No wells, ramps, stairs, thresholds, rails,
props or decorative architecture. The real surface below the holders catches
falls; no extra surfaces cover openings in either movement.

Spawn and explicit R reset place feet at (0, 0.002, 54), facing −Z toward both
stations and the central aisle. After settling, eyes are Y1.480001. Both holders
and open mat are evident in the actual entry view; their full-height walls
naturally obscure much of the movement tops from this tiny visitor's ground
perspective. Flight reveals the exposed tops without changing visitor scale.

Render/collision instances keep `partId`, distinct `stationId`/`instanceId`, and
shared geometry, materials and per-geometry BVHs. Both stations remain visible
and colliding. Original external crowns retain catalog geometry and finishes.

## Corrected original-holder seating — 24 October 2026

The previous X-only holder orientation was a quarter-turn out of alignment.
The maker's actual stem relief faces source −Y, not +X. Both original holders
now use X −90° followed by world Y +90°. Mainplate heights remain correct:
bridge seats on Y12.8, dial on Y13.7. Original geometry, crowns, source-relative
poses and the 18 reviewed wheel phases are unchanged.

Original-STEP Boolean/distance checks find **zero mainplate/holder overlap**
and zero seating distance for both stations. Independent grid classification
finds 189 bridge and 48 dial support witnesses with holder immediately below
and plate immediately above the shoulder. These samples establish distributed
nominal seating, not full contact area or a holding-force calculation.

All eight original crown/holder pairs have zero common solid volume. Minimum
crown clearance is **0.702108 mm bridge** and **0.100000 mm dial**. The previously
recorded crown conflict was caused by holder orientation; its historical
measurements remain in [atelier-crown-fit.json](../assets/source-manifest/atelier-crown-fit.json).
They do not describe the corrected pose. No holder relief or crown displacement
was necessary.

[Current evidence and hashes](../assets/source-manifest/holder-seating.json)
record the placements and exact-solid results. Reproduce with
`.venv-cad/bin/python scripts/bench/holder-seating-probe.py` and
`.venv-cad/bin/python scripts/bench/crown-holder-probe.py`. Reports stay local
under `artifacts/holder-fit/`. The source import retains its existing shape
processing warning; the audited solids/commons pass validity checks. This is
static nominal fit, not certification of manufacturing tolerances or clamping.
Other internal CAD uncertainties remain unchanged.

## Walking interface

The homepage's **Walk inside the movement** button opens a compact controls popup.
**Enter the movement** then navigates client-side to `/bench` and requests mouse
capture when the scene is ready. There is no second instruction screen. The popup
and Escape menu share one controls component and the homepage's typography,
translucent panel surface, rounded corners and glass blur. Both blur the scene
behind their controls; exploration keeps the scene sharp with small glass
navigation/hint surfaces. Text retains contrast over bright scene areas.
Escape or Close dismisses the popup and restores focus to its homepage button.

Entry intent is consumed once and is not stored across reloads. Escape, blur or
hiding the document while loading cancels automatic capture. Direct visits and
browser Back show the scene with a compact Enter button; denied capture also
retains that button and a clear error. Loading and retry use the same small status
area. Browser restrictions can require an additional click; capture must never
be forced after cancellation or focus loss.

After capture, Escape opens the existing menu with **Resume exploring**, brief
controls, Reset and Auto/Low/High detail. Exploration retains only the homepage
link and WASD/Space/R/Escape hints. Scene geometry, movement/camera controls and
visitor dimensions are unchanged; no badge, reticle or flight HUD is shown.

`scripts/bench/ui-check.mjs` verifies the complete homepage-popup transition,
cancellation, keyboard focus, browser Back, direct entry, capture/look, movement,
loading/error recovery and desktop layouts including 200% text. The homepage
entry runner also checks small viewports. Actual popup, arrival, direct-visit,
menu and error captures of the current glass styling are local under
`artifacts/bench-glass/` (earlier popup captures: `artifacts/bench-popup/`). Run with the
same Playwright/Chrome environment variables as the browser runners below.
The older `artifacts/bench-ui/` captures record the superseded entry card.

## Controls, collision and lifetime

Enter explicitly captures the mouse; Escape opens the menu and releases capture.
WASD moves horizontally both on the ground and in the air. Hold Space for upward
thrust; release it to stop thrust. Mouse look is unchanged. R explicitly returns
to arrival; T has no action. There is no automatic reset, hover, altitude lock,
flight toggle, descend key, fuel or flight HUD.

The visitor stays **1.65 mm tall**, eyes **1.48 mm above feet**, radius **0.22 mm**,
with 68° vertical FOV. Gravity remains **18 mm/s²**. Held thrust supplies
26 mm/s² upward acceleration; quadratic vertical drag is `−0.18 × vy × |vy|`.
This smoothly approaches about 6.67 mm/s ascent and 10 mm/s descent. Releasing
Space preserves upward momentum for a brief coast; pressing it during a fall
first brakes the descent, then reverses it. Landing cancels downward velocity
through collision and permits immediate lift-off with Space. Horizontal speed
is 5.5 mm/s with 22 mm/s² acceleration/deceleration for precise control. Ground
stepping remains 0.22 mm and is disabled during upward flight. No bob or roll.

Every substep constrains the capsule centre to desk bounds inset by its radius,
before and after collision resolution. Only outward displacement/velocity is
blocked; tangential movement and altitude remain free, including at corners.
This is a movement constraint, with no visible or collision-mesh walls/rails.
Substeps are at most 1/180 s, adapt to unusually high speed to keep travel below
one third of the radius, and clamp long-frame catch-up to 50 ms. The camera far
plane grows for high flight so the desk remains rendered; eye height never changes.

Source-triangle BVH collisions remain active above, below and beside geometry.
Narrow passages smaller than the 0.44 mm visitor width cannot be entered; enclosed
CAD cavities can still require explicit R recovery. These are static visual
exploration constraints, not mechanical clearance certification.

Escape, blur, pointer-capture loss and hidden-tab events clear all held keys,
including thrust. Physical momentum is preserved; visible scenes keep simulating
gravity/deceleration until rest. Hidden documents stop scheduling frames and
resume with cleared input. Resting scenes sleep. Retry and route disposal retain
shared-resource ownership. `?inspect=1` exposes diagnostics for local verification.

Auto still starts at ratio min(DPR,1) and reduces only after sustained slow
windows, through .85 and .7, with cooldowns. Manual Low (.85) and High (up to 1.5)
remain fixed. Coalesced look input and the 80 ms scheduling-only tail preserve
idle behavior. Jewel transmission stays at half target dimensions, and material
variants compile during loading. There are no new realtime shadows, reflections,
depth-of-field or transmission effects. Prior profiling below predates the jetpack; it is historical evidence, not a new
performance qualification of this revision.

## Blender source and renderer contract

```sh
node scripts/bench/prepare-holder.mjs
blender --background --python scripts/bench/export-environment.py
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4185
```

Original holder downloads must already exist and match `holder.json`.
The Python script is reproducible authored source, saving the editable
`assets/generated/bench/environment.blend` and exporting
`explorer/public/bench-local/environment.glb`. Add `-- --blockout` for neutral
materials. `assets/authored/atelier-layout.json` is shared by environment export
and the controller for desk dimensions, arrival and whole-station placements.
Blender uses numeric millimetres and (world X, −world Z, world Y); glTF Y-up
restores runtime coordinates. Maker CAD is not embedded in the environment.

The two meshes carry `atelierVersion: 1` and `collisionRole: walkable` extras;
the loader continues validating roles, preserving materials and packed albedo
maps. The `ENV_WALKABLE` collection contains walnut and green linoleum meshes.
A hidden editable 1.65 mm scale reference is excluded from runtime export.
Environment fetching bypasses stale browser cache with `no-store`.

Generated GLB, editable blend, original downloads and screenshots remain ignored.
`build:vercel` continues excluding `bench-local`; no release gate is cleared.
No push, PR, deployment, publication or source redistribution is authorized.

## Verification and reproduction

Headless Chrome is the default. Set `PLAYWRIGHT_MODULE` to an existing Playwright
`index.mjs` and `CHROME_PATH` to Chrome; no browser dependency was added.

```sh
node --test tests/*.test.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
PLAY_QA_OUTPUT=artifacts/jetpack node scripts/bench/atelier-check.mjs http://127.0.0.1:4185
node scripts/bench/browser-check.mjs http://127.0.0.1:4185
node scripts/bench/lifecycle-check.mjs http://127.0.0.1:4185
```

`browser-check` delegates to `jetpack-check`, superseding the old ramp journey.
Its real keyboard route starts from default arrival, checks takeoff/sustained
thrust/coast/fall/braking/landing/relaunch, reaches both movements, and lands on
real CAD without swapping, resetting or injecting positions. Automated headings
and timed Space presses drive the test; there is no runtime altitude controller.
It captures the unmodified arrival, both flight approaches and both landed views
with camera/feet records. Eye offset remains 1.48 mm throughout.

Separate labelled fixtures exercise every edge and corner at ground level and
50/500 mm altitude, 100 mm/s horizontal velocity with a 10-second input frame,
tangential edge travel, holder sides, movement tops/undersides, mat landings and
a continuous ground circuit around both holders and through the aisle. CPU tests
also cover thin walls/ceilings, actual openings and 30/60/144 Hz jetpack behavior.
Escape, blur and hidden-document fixtures verify thrust clears alongside WASD.
The lifecycle runner checks actual headless focus loss, explicit hidden-document
handling, graphics retry and late-load disposal. This is automated headless
verification, not physical mouse feel or OS minimization qualification.

`atelier-check` independently composes all original/reviewed matrices with the
new station translations, checks render/collision agreement, 16 CAD landings,
source openings, shared resources, holder/crown/environment clearances and the
two-mesh environment contract. The holder world/collision matrices and all
movement/holder surface pairs are also checked. Bridge mainplate surface contact is expected; the independent
solid/support probe distinguishes this from penetration. Crown/environment
intersections fail the audit.

Accepted current captures/reports are local under `artifacts/holder-fit/`.
Earlier first-use, ramp/terrace and profiling evidence remains historical under
`artifacts/paired-atelier/` and `artifacts/bench/`. Physical-device/browser coverage,
human usability, narrow CAD cavities and the mechanical issues above remain
limitations. The following older results do not qualify this jetpack revision.

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
