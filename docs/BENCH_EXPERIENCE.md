# Single-station walking experience

`/bench` presents **one movement at one station** on the existing wooden desk
and green mat. Press **F** to lift, turn and reseat the complete movement between
bridge-up and dial-side-up. The original matching holder is exchanged while the
movement is raised, as explicitly chosen by the owner. The former simultaneous
pair and its aisle are superseded. Explorer and Workshop retain separate resources.

## Current scene and resting poses — 24 October 2026

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

The desk remains X −62…62, Z −42…62 mm, wood top Y−0.12, with the inset 0.12 mm
green mat at Y0. It still has two authored render/collision meshes, 24 triangles,
and no ramps, wells, rails or decorative props. Arrival and explicit R reset remain
at feet (0, 0.002, 54), facing −Z. The visitor stays **1.65 mm tall**, radius
**0.22 mm**, with eyes **1.48 mm above their feet**, 68° vertical FOV and no bob/roll.

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
on outgoing holder support that disappears is moved to a nearby verified clear
position beside the work. Grounded visitors are placed on the existing mat;
airborne visitors retain altitude and velocity. Both retain yaw/pitch and input.
Candidate points must satisfy desk bounds and current/incoming collision checks.
If no safe candidate exists, the flip does not start. The incoming holder is
checked again at exchange, so late arrivals cannot be trapped. Closed-holder
containment and capsule segments piercing triangle interiors are included.

During the animation, every physics substep prevents entry into the reserved
sweep and removes inward velocity while retaining tangential travel. Render and
collision matrices update together before player simulation; fixed CAD leaf
matrices are explicitly dirtied after parent movement. The temporary constraint
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
the homepage's typography, colors, rounded corners and glass blur; exploration
keeps the scene sharp with compact navigation and one hint row.

WASD moves on ground/in air; mouse look is unchanged. Space supplies continuous
26 mm/s² upward acceleration against 18 mm/s² gravity, with quadratic drag
`−0.18 × vy × |vy|`. Releasing thrust coasts then falls; thrust brakes descent
before climbing. Horizontal speed is 5.5 mm/s with 22 mm/s² acceleration, stepping
is 0.22 mm and disabled while ascending. There is no hover, altitude lock, fuel,
flight toggle or descend key. Desk boundaries constrain only outward travel at
every altitude, leaving edge sliding available. Substeps remain at most 1/180 s,
adapt to high speed and clamp catch-up to 50 ms. The camera far plane still grows
for high flight. Idle scenes sleep; Auto/Low/High detail and loading/disposal
ownership remain unchanged. Narrow/enclosed CAD cavities can require explicit R.

## Local assets and reproduction

```sh
node scripts/bench/prepare-holder.mjs
blender --background --python scripts/bench/export-environment.py
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4189
```

Original holder files must exist and match `holder.json`. The editable Blender
source and generated GLB remain local and ignored. The environment is unchanged:
`atelierVersion: 1`, `collisionRole: walkable`, walnut and green linoleum meshes,
packed albedo maps and a hidden authoring-only scale reference. Its loader uses
`no-store` to bypass stale environment caches. `build:vercel` still excludes
`bench-local`. No release gate is cleared; no push, publication or redistribution.

## Verification

Set `PLAYWRIGHT_MODULE` to the installed Playwright `index.mjs` and `CHROME_PATH`
to Chrome, then use `PLAY_QA_OUTPUT=artifacts/bench-flip` for local reports/captures:

```sh
node --test tests/*.test.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
node scripts/bench/flip-check.mjs http://127.0.0.1:4189
node scripts/bench/atelier-check.mjs http://127.0.0.1:4189
node scripts/bench/jetpack-check.mjs http://127.0.0.1:4189
node scripts/bench/lifecycle-check.mjs http://127.0.0.1:4189
node scripts/bench/ui-check.mjs http://127.0.0.1:4189
```

The flip runner uses actual keyboard capture for both directions, repeat
suppression, Escape/resume, focus loss and before/during/after scene captures.
Explicitly labelled fixtures cover standing on CAD, safe/obstructed positions
beneath it, airborne visitors, late destination obstruction, per-substep entry
protection, rigid component matrices and sampled holder clearances during motion.
The independent atelier audit checks both rests sequentially: source matrices,
18 phases, render/collision agreement, holders/crowns, openings and 16 CAD drops.
The jetpack journey reaches and lands on both faces with one flip and no reset;
its fixtures retain all desk edges/corners, high-altitude stress, sides/undersides,
landings and ground circulation. Lifecycle checks include graphics loss during a
flip, retry and interrupted loading. UI checks cover four desktop sizes plus 200%
text, controls, navigation, entry, focus and loading/error recovery.

Current counts and remaining actions are in [PROGRESS.md](../PROGRESS.md).
Actual screenshots and reports remain local in `artifacts/bench-flip/`. Headless
checks do not replace physical-device/mouse-feel or human accessibility review.
Previous paired-station captures, timings and performance claims are historical;
the remaining sections below describe older revisions.

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
