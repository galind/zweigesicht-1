# Paired atelier walking experience

`/bench` is a local desktop walk across two simultaneous static copies of the
same movement: bridge-up in the foreground and dial-side-up farther back. One
walnut desk with an open green worktop and two straight ramps connects
their west entrances. There is no presentation switch, fade or travel reset.
The explorer and Workshop retain separate controllers and resources.

## Current behavior — 24 October 2026

Each station contains all **223 movement leaves plus the four original external
crown leaves**, and its matching original maker holder. No case, glass, numeral
dial or optional hands are added. Source geometry, dimensions and openings stay
intact. The 18 reviewed phases remain separate from the original matrices; see
[wheel review](WHEEL_CONTACT_REVIEW.md), [ratchets](RATCHET_CONTACT_REVIEW.md) and
[remaining contacts](REMAINING_WHEEL_CONTACT_REVIEW.md).

The crown uses the existing catalog GLB, filtered by the `crown` packet in
`assets/authored/watch-configurations.json`. This is the smallest existing asset
path; there is no new CAD payload or case recovery/visibility dependency. Other
catalog meshes are discarded after ingestion. Source material creation and
available source-surface annotations use the explorer's existing functions.
The existing annotation file has no entries for the three crown definitions;
their normal catalog finish handling remains intact.

| Station | Parent placement (X, Y, Z), mm | Unchanged movement presentation | Holder |
| --- | --- | --- | --- |
| Bridge | (−24, 0, 12) | X +90°, Y +12.2 | `movement.stl`, X −90° |
| Dial | (38, 0, −6) | X −90°, Y +16.3 | `dial.stl`, X −90° |

The centres are 64.56 mm apart. Parent translations are the only station changes;
source and reviewed occurrence matrices are identical in each copy. Render and
collision instances keep `partId`, plus distinct `stationId` and `instanceId`.
Geometry, finishes and per-geometry BVHs are shared; transforms and bounds are
per instance. Neither station becomes hidden or non-colliding when looking away.

The owner requested a much simpler environment after reviewing the initial
terraced version. The desk is now one 180 × 140 mm worktop at Y13.5, with a
1 mm walnut border and no upper promenade, pause terraces, guards, tools or
backdrop wall. The ivory scene background stays. Spawn is (−64, 13.502, 40),
facing the movements. The open surface provides continuous circulation around
both stations, rather than a prescribed narrow path.

Two 6 mm wide straight ramps rise at 1:6 to the unchanged west interfaces:
bridge X−73.6 → −49 at Y17.6, dial X−1.4 → 13 at Y15.9. Short level landings
join the existing thresholds. Both ramps have solid support. The intact red
holders remain partly inset in actual 22.8 mm radius wells, with east relief
out to station X+27 / Z±5 for each crown. Wells and outer desk edges are visible
open drops, without invisible guards. Recovery still uses the safe landings.

The final interfaces retain the original west endpoints (local X−14 / −16.2),
2.8 mm width, original approach heights and original undersides. Keyboard return
testing found the former bridge edge 0.2601 mm above its CAD support, beyond the
0.22 mm step allowance; the dial's abrupt 0.2 mm edge also blocked return.
Only the last 1.2 mm of each authored top is eased down: 0.12 mm bridge, 0.08 mm
dial. The bottom stays Y17.4 / Y15.7, so this does not lower architecture into
source geometry or add a floor over an opening. Both directions are verified
with keyboard walking and no jump.

## Known unresolved crown/holder fit

The owner explicitly chose **keep original holders; record fit as unresolved**
on 24 October 2026 after reviewing the measured conflict. Both crowns remain
in their exact source poses, including this visible conflict. The stations are
not certified as physically compatible crown/holder assemblies.

Independent original-STEP Boolean and distance checks confirm the runtime
triangle intersections. All tested crown and holder shapes are valid solids:

| Crown leaf | Bridge holder common, mm³ | Dial holder common, mm³ |
| --- | ---: | ---: |
| Body, d46 / occurrence 1 | 2.297096359 | 3.874614059 |
| Outer seal, d47 / occurrence 2 | 0 | 0 |
| Inner seal, d47 / occurrence 3 | 0.227774309 | 1.190860040 |
| Cover ring, d48 / occurrence 4 | 0.145336305 | 0.553091454 |

[Provenance and decision](../assets/source-manifest/atelier-crown-fit.json)
record full IDs, original hashes, common bounds and evidence hash. Reproduce
with `.venv-cad/bin/python scripts/bench/crown-holder-probe.py`; complete reports
and interior witnesses stay in `artifacts/paired-atelier/crown-holder-solids.json`.
The broader source import emits its existing shape-processing warning, but each
of these eight checked inputs is independently verified valid. No relief,
rotation, displacement or source repair was made. Future resolution requires a
separate maker/mechanical decision. This known fit failure is reported separately
from the passing authored-environment clearances and walking tests.

## Controls, collision and lifetime

Enter explicitly captures the mouse; Escape opens the menu and releases capture.
WASD walks, mouse looks, Space jumps and R returns to the shared forecourt.
T has no action. Nearby station status is derived from position. Accidental falls
below Y−8 or outside the desk bounds recover to the nearer safe west approach;
normal station-to-station travel never changes position except through physics.

The visitor stays 1.65 mm tall with 1.48 mm eyes, 0.22 mm radius and 68° vertical
FOV. Speed 5.5 mm/s, gravity 18 mm/s², jump impulse 7 mm/s and 0.22 mm stepping
are unchanged. No bob or roll. Source triangles, indirect BVHs, bounded 1/180 s
physics substeps, jump buffering and edge grace remain. Narrow/deep CAD recesses
can still require explicit recovery. Floor samples retain lower visible support
through actual holes; the architecture does not bridge them.

Blur, capture loss and hidden-document events clear held input. Resting scenes
sleep; hidden documents stop rendering. Retry replaces the whole route-owned
controller. Shared resources are disposed once per owner, including packed
Blender albedo textures; late loads cannot revive a departed scene. `?inspect=1`
exposes station-aware diagnostics only for local verification.

Auto still starts at ratio min(DPR,1) and reduces only after sustained slow
windows, through .85 and .7, with cooldowns. Manual Low (.85) and High (up to 1.5)
remain fixed. Coalesced look input and the 80 ms scheduling-only tail preserve
idle behavior. Jewel transmission stays at half target dimensions, and material
variants compile during loading. There are no new realtime shadows, reflections,
depth-of-field or transmission effects. Two stations require fresh profiling;
historical one-station measurements below do not qualify this scene.

## Blender source and renderer contract

```sh
node scripts/bench/prepare-holder.mjs
blender --background --python scripts/bench/export-environment.py
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4183
```

Original holder downloads must already exist and match `holder.json`. The
Python file is reproducible authored source. It saves the editable
`assets/generated/bench/environment.blend` and exports
`explorer/public/bench-local/environment.glb`. Add `-- --blockout` for neutral
materials. The simpler finished scene was inspected headlessly at actual
eye height. No foreground browser or desktop takeover was used.

`assets/authored/atelier-layout.json` records station transforms, arrival,
checkpoints, worktop height and a sample external route. Blender models numeric
millimetres using
(world X, −world Z, world Y); glTF Y-up export restores the runtime convention.
Maker CAD is not embedded in the authored scene or editable environment export.

Every exported mesh carries glTF extras `atelierVersion: 1` and
`collisionRole: walkable | boundary | decor`. The loader validates these fields
and rejects unknown/missing roles. Names and collections alone do not control
collision. Walkable and boundary objects use exactly their visible triangles;
decor objects never enter the collision world. Imported materials and packed
albedo maps survive intact. No invisible proxy floors or walls are generated.

Collections are `ENV_WALKABLE`, `ENV_BOUNDARY`, `ENV_DECOR`,
`INTERFACE_BRIDGE` and `INTERFACE_DIAL`. Meshes merge by material and role inside
each collection. Three opaque materials provide walnut, green linoleum and dark
steel; two small albedo maps are authored and packed by Blender. The simpler
environment has 8 meshes and 2,164 triangles (220,208 bytes). Empty boundary
and decoration collections remain available, but export no geometry. Boolean
cutters retain a single material per mesh so glTF extras remain on each render
mesh. Blender 5.2 uses `use_renderable` to exclude the hidden scale reference.
A hidden `QA_SCALE_REFERENCE_1.65mm` collection in the editable blend provides a
temporary size reference; renderable-only export excludes it from the runtime.

Generated GLB, editable blend, original downloads and screenshots remain ignored.
`build:vercel` continues to remove `bench-local`; no release gate has been cleared.
No push, PR, deployment, publication or source redistribution is authorized.

## Verification and reproduction

Headless Chrome is the default. Set `PLAYWRIGHT_MODULE` to an installed Playwright
`index.mjs` and `CHROME_PATH` to Chrome; no browser package was added to the app.
Use a production server for performance measurement.

```sh
node --test tests/*.test.mjs
node scripts/cad/review-runtime.mjs
node scripts/play/validate-inventory.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
node scripts/bench/atelier-check.mjs http://127.0.0.1:4183
node scripts/bench/browser-check.mjs http://127.0.0.1:4183
node scripts/bench/lifecycle-check.mjs http://127.0.0.1:4183
node scripts/bench/interaction-check.mjs http://127.0.0.1:4183
PROFILE_REVISION='<served revision>' PROFILE_BUILD=production \
  node scripts/bench/interaction-profile.mjs http://127.0.0.1:4183 paired-atelier
node scripts/bench/first-use-profile.mjs http://127.0.0.1:4183 paired-atelier Auto
```

`atelier-check` independently composes all source and phase matrices, station
presentations, render/collision agreement, 16 CAD landings, source openings,
shared-resource identities and the environment role contract. It measures actual
crown/holder/environment triangle distances and retains the six known source-fit
failures as explicit evidence. Other intersections fail the runner. Legacy
`collision-check` and `presentation-check` entry points run this same consolidated
audit rather than keeping obsolete active-side assumptions.

`browser-check` uses actual pointer capture and keyboard translation with fixed
automated look headings. Every step of the round trip is physics-driven; forced
fall fixtures are separate. It checks optional jumping after the no-jump round
trip, Escape, ignored T, rest, blur, explicit reset, both nearby recoveries,
disposal, repeated entry and asset failure/retry. `lifecycle-check` additionally
checks hidden-document handling, WebGL context failure and late-load disposal.
Headless hiding is an explicit document-state fixture, not an OS visibility claim.

The interaction profiler covers both CAD close-ups and a forecourt view of the
pair, each with turning and walking-plus-turning. Reports retain browser/GPU,
viewport/DPR, quality/actual ratio, server revision and harness state, timing and
synthetic input conditions. `first-use-profile` visits both existing stations by
labelled placement fixtures; it no longer measures a swap. Native confirmation
is available separately through profiler `BENCH_BROWSER=headed` and lifecycle
`HEADED=1`, but was not used for this task. Physical mouse feel, representative
GPUs/browsers and sustained thermal behavior remain unverified.

Current verification and measured performance are recorded in
`PROGRESS.md`. Local evidence is under `artifacts/paired-atelier/` (including the
retained grayscale `blockout/`), with profiler/lifecycle reports in
`artifacts/bench/`. The simpler overall, top-down, arrival, approach, worktop,
bridge/dial entry and crown captures in `artifacts/paired-atelier/simple/` are
synthetic review cameras, distinct from the keyboard journey screenshots.
Aerial review cameras use a 0.5 mm near plane for distant depth precision;
eye-height captures and the runtime retain the original 0.035 mm near plane. Crown fit remains unresolved by the owner's
explicit decision.

## Simpler desk verification — 24 October 2026

The simpler environment passes 39 keyboard journey checks, independent source
and phase pose checks, render/collision agreement, 16 CAD landings, retained
openings and three open-floor/outer-edge probes. All 113 CPU tests, typecheck,
lint and production build pass. Both crown/holder conflicts remain explicitly
unresolved. Actual authored-environment triangle clearance is at least 1.849 mm
bridge / 1.720 mm dial. Generated assets and evidence remain local.

Six Auto workloads repeat turning and walking-plus-turning at each station and
with both visible: headless Chrome 155 / M4 Metal, 2400 × 1300 CSS, DPR2, 700 ms
warmup and six seconds per sample. Ratio stays 1; frame p95 is 16.8–17.4 ms,
with 2/2,153 intervals over 25 ms and none over 50 ms. No focus loss or GPU
disjoint event occurred. This is a regression spot-check for the simpler scene;
High, Low, physical devices and first-paint costs were not requalified here.
Evidence: `artifacts/bench/simple-atelier.json` and source/asset hashes in
`artifacts/paired-atelier/simple/build-manifest.json`. The walking camera,
renderer, source poses, materials and physics implementation remain unchanged.

## Original terraced layout results — 24 October 2026

The following measurements and counts precede the owner-requested simplification.
They describe `ef2a14d`, not the current environment.

Application revision **`ef2a14d`**, production server on port 4183. Chrome
155.0.8059.86, headless, ANGLE Metal / Apple M4, 10 logical cores and 24 GB RAM;
Darwin 25.6.0. Viewport **2400 × 1300 CSS**, device DPR **2**, no requested
CPU/GPU throttling, existing OS/driver cache. The 18 accepted samples combine
three quality choices, bridge/dial close-ups and a forecourt view of the pair,
each stationary-turning and walking-plus-turning. Each has 700 ms warmup and
six seconds of synthetic 125 Hz mouse input; walking alternates W/S every 500 ms.
The pair fixture uses a smaller yaw/pitch sweep to retain both stations in view.
No focus/visibility loss or GPU-disjoint events occurred. GPU timers were available.

Frame intervals below are between render submissions, not display presentation
or physical input-to-photon latency. Table entries are **p95 milliseconds**.

| Workload | Auto, ratio 1 | High, ratio 1.5 | Low, ratio .85 |
| --- | ---: | ---: | ---: |
| Bridge turning | 18.5 | 23.3 | 17.1 |
| Bridge walking + turning | 18.4 | 23.8 | 17.3 |
| Dial turning | 18.5 | 22.3 | 16.9 |
| Dial walking + turning | 18.3 | 27.6 | 17.0 |
| Pair turning | 18.1 | 17.4 | 16.9 |
| Pair walking + turning | 17.9 | 17.4 | 16.8 |

Auto retained ratio 1 in every sample: 2 intervals over 25 ms out of 2,154,
none over 50 ms; p99 18.6–18.7 ms. High retained 1.5: 56/2,006 over 25 ms,
none over 50 ms. Low retained .85: 2/2,152 over 25 ms, none over 50 ms.
The pair workload recorded about 878 median multipass draw calls. This larger
scene stays responsive in these headless samples, but fixed High still misses
60 fps in close-ups; these are not physical-device or long thermal guarantees.

For Auto, render-submission CPU p95 is 5.2–5.5 ms; physics CPU p95 is
0.3–0.6 ms in sampled movement. GPU elapsed p95 is 8.4–14.9 ms and synthetic
handler-to-render p95 is 13.3–15.9 ms. GPU durations are separate driver query
measurements and are not added to CPU time or interpreted as display latency.
The report retains every p50/p95/p99, count, quality and ratio.

A separate fresh-process first-use probe reached readiness in 583 ms. First
render CPU was **111.8 ms**, with 11 additional programs appearing then despite
precompilation. Subsequent first turns on bridge/dial had p95 17.5/17.6 ms,
zero intervals over 25 ms and no shader growth. Cold-driver startup, physical
mouse feel and broader hardware remain unverified.

The quality/interaction runner passes 11 checks, including captured stationary
look, sleep, idle sampling, manual choices and both station contexts. Its injected
27 ms render delay produced Auto reductions 1 → .85 → .7, 8.05 seconds apart.
The old fixed 20-second deadline observed only the first reduction; the headless
state-machine check now waits for the expected bounded state, with a 35-second
limit, and passed after 23.3 seconds. This is synthetic adaptation evidence, not
normal performance. An earlier profiler capture between scenarios reset the
custom CDP DPR and invalidated its High samples. Captures now run only after all
measurements, and new assertions reject changed DPR or manual render ratios.

Accepted evidence: `artifacts/bench/paired-atelier.json`,
`paired-atelier-first-use.json` and `interaction-check.json`. Excluded runs remain
under `artifacts/paired-atelier/exploratory-wide-sweep.json`,
`rejected-dpr-reset.json` and `initial-stress-timeout.json`. The local
`artifacts/paired-atelier/review.html` links representative captures and reports;
`build-manifest.json` records the application revision and generated/source hashes.

Final verification also passes 113 CPU tests, 115 retained runtime checks,
inventory, typecheck/lint, production build, packaging exclusion, HTTP metadata,
35 keyboard-journey checks, six lifecycle checks, two visible-guard probes,
16 CAD landings, 254 explorer smoke assertions and 92 focused Workshop checks.
The authored crown clearance is at least 3.1133 mm (bridge) / 2.5809 mm (dial)
in measured runtime triangles. Winding-stem/environment checks are disjoint.
The six source crown/holder intersections remain explicitly unresolved by owner
choice; no physical compatibility claim is made. No push or publication occurred.

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
