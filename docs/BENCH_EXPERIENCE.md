# Walk inside the movement

`/bench` is a separate, local desktop walking experience. The homepage button
loads its route; neither the explorer nor Workshop owns its renderer or input.
It uses the complete 223-leaf movement subtree (including recovered diamond),
without the catalog, fitted case, dials or optional hands. Nothing runs mechanically.

## Local assets and reproduction

Run the normal README setup, then prepare the local holder files and environment:

```sh
node scripts/bench/prepare-holder.mjs
blender --background --python scripts/bench/export-environment.py
npm --prefix explorer run dev
```

The first command expects the maker's two STL downloads at
`assets/source-originals/holder/movement.stl` and `dial.stl`. Obtain these directly
from the maker using the exact URLs in `assets/source-manifest/holder.json`.
The importer checks their SHA-256 values before copying. The source manifest
also records the two STEP models and two inspected reference images. Original
files and prepared payloads stay ignored; the command does not download them.
Missing/mismatched assets block entry and present Retry and a way home.

Blender 5.2.1 was available. The Python scene is the editable, versioned authored
source; regeneration also saves `assets/generated/bench/environment.blend`.
The bench, mat and access fixtures export to
`explorer/public/bench-local/environment.glb`. No maker geometry is baked into
that authored scene. Numeric GLB units remain millimetres. The mat is 160 × 120 mm
on a simple 180 × 140 mm bench; its faint grid is spaced at 5 mm.

The local production build retains these ignored local assets for verification.
`build:vercel` explicitly removes `bench-local` from its output. Neither the
holder download nor the existing public repository clears redistribution rights.
Publishing this experience remains subject to `RELEASE_GATES.md` and separate
permission; no publication or deployment is part of this task.

## Presentation evidence

The maker's `Werkhalter Montage.jpg` shows bridges facing up in the
`Werkplattenhalter Montage` holder. `Werkhalter ZB Seite.jpg` shows the opposite,
dial-facing surface in the `Werkhalter ZBseite Montage` holder. These are separate
fixtures, not evidence of a mechanical turnover mechanism.

Both holder STLs preserve their source dimensions: about 42 mm diameter and
15 mm high, with a nominal 17.1 mm pocket radius for the approximately 34 mm plate.
`inspect-holder.py`, run with `.venv-cad/bin/python`, checks the source hashes and
records STEP planes and cylinders in `artifacts/bench/holder-surfaces.json`.

| Presentation | Movement outer transform | Nominal seat |
| --- | --- | --- |
| Bridge | X rotation +90°, world Y translation +12.2 mm | Plate source Z −0.6 sits at holder Z 12.8 |
| Dial | X rotation −90°, world Y translation +16.3 mm | Plate source Z −2.6 sits at holder Z 13.7 |

Both holders rotate −90° about X from Z-up into scene Y-up. The crown relief
remains at +X. The dial holder's internal floor is at 9.2 mm, below the lowest
presented movement extent (9.64 mm). Original movement occurrence matrices,
meshes and scale remain unchanged. Nominal seating is an authored static
presentation informed by these measurements and images, not tolerance or
holding-force certification.

The separate red access fixture rises from X −56 to −21.2, outside the holder's
21 mm radius. Its thin cantilever crosses the rim to the bridge (Y 17.6) or plate
(Y 15.9); it does not fill the holder or introduce invisible walkable surfaces.
It is an authored exploration aid, not a certified printable mounting accessory.
Red plastic uses rough material and derivative-filtered normal shading at an
interpreted 0.12 mm print-layer pitch; this is not a measured maker finish.

## Walking, collision and lifetime

The visitor is 1.65 mm tall, with 1.48 mm eye height and 0.22 mm capsule radius.
Speed is 5.5 mm/s, gravity 18 mm/s² and jump impulse 7 mm/s (about 1.36 mm rise).
A 0.22 mm step allowance handles small seams without changing watch geometry.
The horizon stays level, with no bob or roll. Jump buffering and a brief edge
grace interval make jumping at small surface boundaries less timing-sensitive.

BVHs are built once per reusable source geometry, with indirect indexing so the
source triangles and finish annotations stay intact. Broad-phase world bounds
reject distant parts; capsule triangle queries use the currently visible
presentation only. Source openings remain openings. Physics substeps are at most
1/180 second with bounded fall speed and a 50 ms elapsed-time clamp, preventing
ordinary movement from crossing thin solids in a single step. Long pauses slow
simulation instead of teleporting through geometry. Automatic steps require an
actual nearby floor and capsule/head clearance.

Mouse capture requires pressing Enter. WASD walks, Space jumps, R resets, T
changes presentation and Escape releases capture. Blur, hidden documents and
capture loss clear keys and jump intent. T ignores repeats/busy input; a short
fade covers the fixture swap and reset to that side's safe mat entry. Falling
below Y −8 or outside the bench bounds also resets without reloading or penalty.

The renderer sleeps when grounded and stationary, wakes for input/resize, and
stops while hidden. Mouse deltas accumulate and are consumed once per animation
frame. During a look burst, an 80 ms scheduling-only tail measures frame cadence
between sparse input events without drawing unchanged views; then scheduling
stops and the next burst starts fresh. Pause, capture loss, reset and side changes
clear pending input and sampling history. Long continuous frames remain measurable.

Detail starts in **Auto** at pixel ratio `min(devicePixelRatio, 1)`. Two consecutive
active windows (at least 1.5 seconds and 40 samples each) with p75 over 22 ms
reduce resolution one step, through 1, .85 and .7. A healthy window clears the
slow-window streak. Each reduction has a five-second active-time cooldown. Auto
only steps down during a session, avoiding distracting recovery probes and
oscillation. Cycle the menu's Detail button through **Auto → Low → High → Auto**
to reassess from the starting resolution. **Low** (.85) and **High** (up to 1.5)
are fixed choices and are never overridden automatically within that viewer session.
A new route entry or Retry starts a fresh Auto session. An automatic reduction
can be softer than manual Low.

Studio lighting uses no live shadows or reflections. Jewel transmission remains
at its authored strength, with its offscreen pass at half the main render width
and height. Opaque finishes, geometry, movement dimensions, assembly placements
and openings are unchanged. Both tone-mapped and transmission-pass material
variants are compiled during loading, before Enter becomes available. Driver
uploads and presentation/compositor stalls can still occur.

Route disposal removes listeners, observers, timers, BVHs and GPU resources.
Late loads cannot resurrect a departed scene. `?inspect=1` exposes the controller
and bounded frame/CPU sample arrays solely for local verification; normal use
keeps only the small adaptation window. GPU timer queries and detailed profiling
exist only in the external browser runner.

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
  node scripts/bench/interaction-profile.mjs http://127.0.0.1:4180 before-native
PROFILE_MODES=Auto,High,Low \
  node scripts/bench/interaction-profile.mjs http://127.0.0.1:4178 after-native
node scripts/bench/first-use-profile.mjs http://127.0.0.1:4180 before-native High
node scripts/bench/first-use-profile.mjs http://127.0.0.1:4178 after-native Auto
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
