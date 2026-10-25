# Bench interaction performance — 25 October 2026

This review starts from `6a8ae7e`. Evidence is local/ignored in
`artifacts/bench-performance/`; no assets were published or redistributed.
The existing browser was Firefox 158 on macOS 26.6.2 / Apple M4. Its actual
window provided **1280 × 1327 CSS pixels, device DPR 2**. Firefox masks the
WebGL renderer as “Apple M1, or similar”, does not expose GPU timer queries here,
and uses the logarithmic-depth fallback because clip control is unavailable.

## Causes and changes

**Recurring CAD stutter:** close views repeatedly missed refresh, even when the
median stayed near 17 ms. The former Auto policy tested p75, so a scene missing
7–20% of frames could remain at an overloaded resolution. The full CAD submits
about 1.4 million triangles and 264–323 draws in the sampled close views, across
main/transmission passes. The environment's 7,196 triangles / three draws alone
were not a useful whole-scene budget. Wood/stand views, walking/running and flips
were mostly at 18 ms p95 in the native browser.

Render submission p95 was about 5 ms and physics 1–2 ms during the native CAD
failure. A separate headless Chrome/ANGLE Metal run at the same dimensions,
with clip control deliberately disabled, recorded CAD GPU-query p95 of
67–72 ms, versus render CPU 5.9–6.1 ms and physics 0.4–1.5 ms. The driver timings
include GPU scheduling/backpressure; they are not presentation latency and must
not be added to CPU time. This supports rendering pressure, rather than expensive
collision queries, as the main cause. The CPU trace spent most time idle; GC
accounted for 119 ms of an 88.8-second trace, without evidence that it caused the
recurring cadence failure.

Auto now evaluates p95 over two sustained windows, retaining isolated-stall
rejection, cooldown, idle exclusion and manual overrides. The logarithmic path
starts at ratio .85 instead of 1; the normal reversed-depth path still starts at
1. Fallback alone can take additional .6/.5 steps if .7 remains overloaded, as
observed in the forced Chrome fallback diagnostic. Explicit Low (.85) and High
(1.5, each capped by device DPR) remain fixed. This trades render resolution for
responsiveness; it does not simplify, move or remove any CAD or environment mesh.

**Entry stalls:** precompilation changed `renderer.outputColorSpace` to imitate
the transmission pass. Three r186 includes that property in program cache keys,
whereas its actual transmission pass leaves it unchanged and renders to a linear
target. The mismatch compiled unused variants and created 12 more programs on
first paint, after `ready` had already enabled capture. Three native Firefox
re-entries took 642–666 ms CPU on that first ready frame.

Precompilation now uses an actual temporary render target. The arrival camera
renders once while loading, initializing shadow/transmission targets and uploading
buffers/textures. A nonblocking WebGL fence is polled before enabling entry;
there is no synchronous `finish` or GPU readback. Cancellation and context loss
exit the wait and delete the fence. The ready flag no longer invalidates an
otherwise unchanged shadow pose. Fresh entries use 29 programs instead of 40.
The remaining initial upload is still substantial work, explicitly inside loading.

**Lifetime:** the new re-entry check found zero retained geometry but two internal
render-target textures still accounted for after `renderer.dispose()`, with a
live WebGL context. Three's private render-state cleanup drops references rather
than explicitly disposing all those targets. Bench now loses its exclusively
owned context after listener/resource disposal. This makes GPU release on route
exit deterministic rather than relying on browser canvas/context GC. It does not
prove that context retention caused a particular observed long frame. The new
check requires cleared collision structures, a dead viewer and a lost context.

The wood shader, per-component grain attributes, contact atlases, cached 4096²
shadow map, materials, transmission scale .5, CAD scale/poses, seating, stand,
mat, boundaries, holders, arrival and controls remain unchanged. A focused native
A/B/A/B diagnostic at fixed main ratio 1 reduced transmission scale .5 → .25:
missed-frame counts fell, but p95 remained 35 ms. That visual tradeoff was not
adopted. Other shader/shadow disablement probes were exploratory and are excluded
from the matched result table.

## Measurement contract

`workload-probe.js` instruments the actual viewer loop, with asynchronous GPU
queries where available, render/physics/flip CPU timings, draw/triangle totals,
program/resource counts, input-handler-to-submission age, viewport, focus and
visibility. It retains initial and transition frames. Two repeated circuits run
for roughly three minutes: arrival/look, walking, running, flight, close wood,
close stand, both close CAD faces, both full flips and pause/resume. Placements
and 125 Hz DOM input are synthetic and explicitly labeled. Both matched native
runs remain focused and visible throughout. Intervals are between render
submissions, not display presentation timestamps. Firefox rounds these timings
to milliseconds. Each phase's first sample retains its CPU/GPU data but has no
interval; intentional pause and fixture-placement gaps are not frame intervals.

Separate native OS keyboard sequences in the visible Firefox window verify
capture, walking/running, flight, both flips, reset and Escape/resume. The native
automation's pointer drags did **not** generate relative look deltas in Firefox;
therefore they do not qualify native mouse feel. Mouse-look timing here comes
from synthetic events in that same visible browser. Existing browser-dispatched
mouse/capture tests supplement it. No human or physical input-to-photon latency
claim is made.

`parts-profile.mjs` is retained as a static visual-cost spot-check. Its fixed
1440 × 900 / ratio 1, direct rendering outside the simulation loop, discarded
30-frame warmup and 150-frame stationary samples miss the failure above. The new
runner preserves raw samples, records quality changes and supports an optional
p95 budget on the **second** circuit, while retaining first-circuit stalls in its
report. Native re-entry measurements use actual link/Back navigation three times.
Chrome's separate loading/cleanup runner also repeats navigation three times.

## Visible-browser results

Matched synthetic circuits in the actual Firefox window, with Auto selected in
both builds. This is a policy comparison, **not equal render resolution**:
before started at 1 and settled at .85; final started at .85 and settled at .7.
All 10,181 final samples retained the same viewport/DPR and native focus/visibility.
The earlier diagnostic-session baseline retained some inactive shader variants;
three fresh native re-entries separately establish the 40 → 29 program count.

| CAD workload | Before p50 / p95 / p99 (ms) | Final p50 / p95 / p99 (ms) | Frames >25 ms before → final |
| --- | --- | --- | --- |
| First bridge approach | 17 / 34 / 35 | 17 / 18 / 35 | 79/521 → 23/577 |
| First dial approach | 17 / 34 / 34 | 17 / 18 / 18 | 46/553 → 0/599 |
| Repeated bridge approach | 17 / 34 / 35 | 17 / 18 / 18 | 38/562 → 0/599 |
| Repeated dial approach | 17 / 33 / 35 | 17 / 18 / 18 | 43/556 → 0/599 |

Across all workloads, intervals >25 ms fall from **212/9,974 to 25/10,159**;
intervals >50 ms fall from **1 to 0**. Wood, stand, walk/run, flight and both flips
retain approximately 17–18 ms p95. Close-CAD input-handler-to-render p95 falls
from 28–30 ms to 14–16 ms; this excludes OS delivery and display scanout. The
first bridge approach retains 23 slow frames while Auto assesses the scene and
steps down. No such misses occur in either repeated CAD view. The unchanged
shadow refresh submits about 742 draws / 2.93 million triangles during flips;
flip-transform CPU p95 remains about 1 ms in Firefox.

Three native link/Back entries before the fix reported ready in 518–531 ms but
then spent **642–666 ms** submitting the first frame, adding 12 programs. After
the preparation fix, the first ready frame takes **4–5 ms**, adds no programs, and
loading includes the substantial first upload before readiness (about one second
total in this warm-session probe). This is not a cold-browser/driver guarantee.
The separate final Chrome readiness/cleanup check passes all three entries:
ready after 875 / 690 / 677 ms, stable post-ready programs, cleared collision
structures, and each retired context confirmed lost.

The raw native keyboard recordings are separate from the controlled comparison:
`firefox-native-before.json` and `firefox-native-after.json`. They verify real
capture and keyboard actions, with 17–18 ms p95 during the sustained key holds.
They do not substitute for the matched CAD fixtures or a human mouse review.

## Separate automated GPU evidence

Chrome 155 / ANGLE Metal on the same M4, headless at 1280 × 1327 / DPR 2,
with clip control forcibly disabled. This is a diagnostic backend comparison,
not a measurement of Firefox's GPU or an older physical device. Auto is enabled
in both builds; the final policy is allowed to reduce resolution farther.

| CAD view / circuit | Before p50 / p95 / p99 (ms) | Final p50 / p95 / p99 (ms) | GPU-query p95 before → final (ms) |
| --- | --- | --- | --- |
| Bridge / first | 27.1 / 37.8 / 40.6 | 19.8 / 29.0 / 32.0 | 72.04 → 54.82 |
| Dial / first | 27.5 / 35.6 / 39.2 | 21.6 / 28.5 / 32.1 | 67.39 → 52.59 |
| Bridge / repeated | Not sampled | 16.7 / 18.2 / 18.9 | — → 32.38 |
| Dial / repeated | Not sampled | 17.0 / 23.9 / 26.6 | — → 42.76 |

First-circuit CAD intervals >25 ms fall from 266/354 → 85/475 (bridge) and
258/359 → 86/462 (dial); each view retains one >50 ms interval in both builds.
The final repeated bridge has 0/599 >25 ms; repeated dial has 18/562, including
one >50 ms interval. Final first-circuit ratios move .85 → .7 → .6; the second
circuit reaches .5. Repeated CAD render CPU p95 is 4.3–5.0 ms and physics
0.3–1.2 ms. GPU queries report zero disjoint events. The optional ≤25 ms p95
assertion passes for every repeated phase, alongside three readiness/cleanup
cycles. These numbers still show residual fallback pressure and adaptation time;
they are not a universal 60 fps claim. Raw evidence is `chrome-fallback-before`
and `chrome-fallback-final` JSON/CPU traces.

## Validation

All 149 CPU tests, typecheck, lint and production build pass. Existing browser
suites pass 26 surface checks (13 each normal/fallback), 5 seating, 10 parts,
65 environment, 10 running, 32 flips, 67 flight/collision, 8 lifecycle,
11 interaction, 157 UI and 5 homepage entry checks. These are automated browser
regressions, separate from the actual visible Firefox comparison above.
The independent audit verifies both 219-leaf original CAD/holder rests and
16 collision drops, with maximum matrix error 5.55 × 10⁻¹⁷. Mat edges and table
boundaries pass. Final overview, visitor wood and stand-edge images were reviewed.
Reports are in `artifacts/bench-performance/regression/` (the legacy homepage
runner writes `artifacts/bench/home-entry-report.json`).

Five focused CPU regressions exercise recurring 20% and 7% missed-frame tails,
isolated-outlier rejection, fallback headroom/manual choices and the lower
fallback floor. The sustained runner checks flip completion, first-ready shader
stability, cleared collision structures and lost route contexts; its optional
second-circuit p95 budget passed on the final forced-fallback run. A collector
smoke check verifies serving the current probe and rejecting invalid report paths.

## Remaining limits

Auto needs sustained evidence before reducing resolution: the first native CAD
approach still has 23 intervals >25 ms. Slower fallback rendering can take the
second circuit to reach its floor and still stutter occasionally. Fixed High can
remain GPU-bound. The initial upload still blocks the main thread for roughly
450–470 ms in the warm native entry samples, now before entry is enabled; total
loading remains about one second. Cold caches/drivers can take longer.

Native keyboard/capture and synthetic look in a real visible window were checked;
human mouse feel, other physical GPUs, high-refresh displays and prolonged
thermal behavior remain unqualified. Context release is verified, but its effect
on a particular historical stutter is not established. Mechanical, accessibility,
publication and CAD redistribution gates remain unchanged.

## Reproduction

Use the existing local Playwright and Chrome installations described in
[architecture](LOCAL_ARCHITECTURE.md). Keep other rendering tests/builds out of
performance sampling. Default runner dimensions match this review; explicitly
set `PROFILE_WIDTH` / `PROFILE_HEIGHT` for another reference window.

```sh
# Real visible Firefox: open /bench?inspect=1 in its existing window.
node scripts/bench/probe-server.mjs
# In its console, fetch/evaluate http://127.0.0.1:4201/probe.js, then schedule
# runBenchWorkload('label') with enough delay to close DevTools and restore focus.
# recordNativeBench('label') observes native input; recordBenchReentries('label')
# observes three subsequent client-side link/Back entries.

# Automated browser workload (default headless; headed uses an isolated window):
PROFILE_EXPECT_PREPARED=1 PROFILE_MAX_P95=25 \
  node scripts/bench/workload-check.mjs http://127.0.0.1:4198 after
# Loading, readiness/program stability and context cleanup only:
PROFILE_EXPECT_PREPARED=1 PROFILE_LOADING_ONLY=1 \
  node scripts/bench/workload-check.mjs http://127.0.0.1:4198 loading
# Diagnostic fallback, not an older physical GPU:
WORKSHOP_DEPTH=fallback PROFILE_EXPECT_PREPARED=1 PROFILE_CPU_TRACE=1 \
  node scripts/bench/workload-check.mjs http://127.0.0.1:4198 fallback
node scripts/bench/summarize-workload.mjs artifacts/bench-performance/after.json
```

The collector binds only loopback and writes bounded, validated report names into
ignored evidence storage. It is not part of the application or production build.
Generated assets were not regenerated because no asset changed; the existing
runtime-source hash in the environment manifest was refreshed and all 15 recorded
source/output hashes were verified.
