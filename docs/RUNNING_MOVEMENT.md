# Prescribed running movement

Implemented locally on `codex/escapement-clearance-study`, from the verified
research milestone `4785cc2`. Updated 27 October 2026. This is an automatically
running **kinematic illustration**, not a physical escapement simulation.
Publication and mechanical acceptance remain subject to [release gates](RELEASE_GATES.md).

## Behavior and scope

The existing Explorer, completed Workshop and assembled Bench movement run without
another page or playback controls. The shared clock uses the maker-specified
**3 Hz: one complete balance oscillation every 1/3 second, two beats per
oscillation, 21,600 beats/hour**. This supersedes the initial eight-second
illustration (24 times slower). Balance amplitude remains the study's ±180°, around its
+2.385806786849° center. The pallet uses the recorded center-following law and
bank angles; piecewise linear interpolation follows the two studied escape paths,
including their recoil. Timing is sinusoidal in balance angle. This prescribes
positions, not contact force, impulse, torque, backlash or self-sustained motion.

The nine balance and six pallet leaves move as their recorded rigid packets.
The fork body alone uses the studied subtractive clearance correction. No shaft,
jewel or gear has been repositioned. A separate deforming hairspring retains the
original raised terminal and source's small staff cylinder. The original overview
and catalog files, source CAD, and display-phase overrides remain unchanged.

The 13 drive-train leaves use world +Z increments from the **accumulated** escape
angle E, after the existing display poses:

| Packet | Definitions | Angle/E |
| --- | --- | --- |
| Escape | 233, 234, 235 | 1 |
| Seconds | 242, 243 | −1/9 |
| Third | 237, 238 | 8/675 |
| Center | 93, 94, 95 | −1/540 |
| Transfer | 96 | 1/1170 |
| Barrel II drum/lid | 85, 86 | −1/3600 |

E is `18 * completedCycles + localEscape`. Only each final shaft angle is reduced
modulo 360°, after its ratio is applied. The −0.1° local start is retained rather
than re-zeroing the source display. Left multiplication around each recorded
world pivot handles reversed local axes. The third, seconds and transfer display
phases remain +16.6°, +2.3° and +6.25° in world coordinates.

Both mainsprings, arbors, ratchets, barrel I, motion works and hands remain in their
existing static representations. The barrel-II drum/lid rotates around its frozen
mainspring as the study's explicitly illustrative boundary. The studied source
fit clears those rotating surfaces, but this does not depict spring attachment,
unwinding, energy storage or load sharing. Static hands do not report elapsed
time. No unsupported coupling has been introduced to disguise these limitations.

## Nominal-frequency evidence and shaft periods

The maker's [Caliber ml-01 specification](https://www.marcolangwatches.com/en/watches/),
consulted 27 October 2026, explicitly states “frequency 3 Hertz (21.600 osz./ hour)”.
The 3 Hz figure counts complete balance cycles; the hourly figure counts the two
half-oscillations/beats per cycle. This is an independent manufacturer nominal
specification, not a frequency inferred solely from this animation or a measured
rate of the supplied CAD assembly. The CAD download page does not specify timing.
Source URL, local HTML snapshot hash and implementation/validation hashes are in
[nominal-operating-speed.json](../assets/source-manifest/nominal-operating-speed.json).

The recorded 20-tooth escape wheel advances one tooth (18°) per complete cycle.
Its 9-tooth pinion drives the 81-tooth seconds wheel: −18 × 9/81 = −2°/cycle.
A seconds-shaft revolution per minute therefore requires 360/2/60 = **3 Hz**.
That ratio-derived check agrees with the independent specification; on its own it
would depend on assuming a 60-second seconds-shaft revolution. The subsequent
8/75, 10/64, 12/26 and 26/80 meshes give these net mean rates:

| Shaft | Signed degrees/active second | Mean revolution period |
| --- | ---: | ---: |
| Escape | +54 | 6⅔ s |
| Seconds | −6 | 60 s |
| Third | +0.64 | 562.5 s (9 min 22.5 s) |
| Center | −0.1 | 3,600 s (1 h) |
| Transfer | +3/65 | 7,800 s (2 h 10 min) |
| Barrel II drum/lid | −0.015 | 24,000 s (6 h 40 min) |

These are accumulated net advances about world +Z, not constant instantaneous
velocities: the existing lock, release and recoil remain. Balance and pallet
repeat every 1/3 second; each half swing lasts 1/6 second. Hands and motion works
remain excluded. Every existing packet and the hairspring still consume the same
active-time clock. No amplitude, geometry, display phase, gear ratio or lifecycle
code changed.

## State and lifetime policy

Each loaded viewer owns one active-time clock. Frame intervals are accumulated
without an FPS-dependent clamp. Hidden-tab time is excluded explicitly, so resume
continues from the last phase without catching up or resetting slower shafts.
Navigation to a fresh viewer starts a fresh illustration.

- Explorer runs in settled assembly, including fitted watch configurations and
  camera orbit/zoom. Selection for part inspection, isolation, reveal, separation,
  inventory layout and presentation transitions suspend the whole mechanism.
- Those suspended states show the original static geometry and display poses.
  Reseating/reassembling resumes the retained active clock. This intentionally
  switches between a source-pose inspection and the authored running pose; it is
  not an animated winding, stopping or physical reassembly sequence.
- Workshop remains static until all final leaves are fitted, with no staged step,
  workspace, drag or placement animation. Completion runs automatically; Undo
  restores static source poses before pieces are removed. Thumbnail and ghost
  geometry remain static.
- Bench animates only the single assembled movement. Detached parts retain their
  source representations. The parent holder flip carries the whole animation.
  Visitor collisions retain the existing static internal reference geometry in
  the current station frame. They are not dynamic collision forces against the
  illustrated gears or deforming spring; no per-frame BVH rebuild is attempted.
- Disposal restores source geometry before the owning scene releases it, then
  releases the two owned generated geometries once. Late network completion is
  generation-checked, and corrupt/missing motion assets fail loading explicitly.
  Workshop prepares the animation before atomically replacing a complete scene.

`RunningMovement.ts` overlays matrices only after the owner's presentation update
and restores them before another update. Original materials are reused. Its
spring has fixed topology and reusable GPU position/normal buffers. There is no
per-frame solver, tessellation, new geometry, or shared mutation of source meshes.
The small dynamic ribbon's conservative bounds include all studied poses.

The spring atlas stores 38 constrained poses. Each centerline point is de-rotated
by its attachment weight before interpolation and re-rotated at the current angle.
The inner 0.60 mm thus follows the collet and the final 0.50 mm remains fixed.
This avoids shrinking the inner attachment along a chord between sampled poses.
The ribbon keeps the original 0.035 mm width and 0.215 mm height. Interpolation
is an approximation, with measured length/shape errors below; it is not an elastic
material solution.

## Nominal-speed validation — 27 October 2026

The separate [nominal-speed provenance](../assets/source-manifest/nominal-operating-speed.json)
records this milestone's source snapshot and hashes. New evidence is ignored under
`artifacts/nominal-movement/`; the earlier runtime/CAD evidence remains intact.
Local validation was explained before execution: no push is authorized, so CI
cannot check this local change, and rendering at the new speed needs a real GPU
browser check.

- All **8 focused movement tests**, typecheck, lint and the production build pass.
  The build retains its existing vinext route-classification notice. Timing checks
  cover 15/24/30/60/90/120/144 FPS at an off-cycle endpoint, multi-cycle delays,
  hidden suspension and reassembly. Controller checks compare every coupled matrix
  and the actual spring buffer after resume, as well as source restoration,
  recoil, long-running accumulation, display phases and independent shaft periods.
- **18 production-browser checks** pass across Explorer, Workshop and Bench,
  including separation/reassembly, fitted views, completion/Undo, Bench flip,
  suspension and cleanup. The visibility fixture invokes the real handler with a
  synthetic hidden document; this does not qualify actual OS/browser lifecycle
  behavior on every device. The existing local Vercel analytics 404 is excluded;
  application assets load and there are no runtime or shader errors.
- A deliberate visible 250 ms main-thread stall advances active time by 249.9 ms
  (measured wall interval 254.8 ms). It skips intermediate displayed poses without
  clamping elapsed time. Hidden time is excluded instead, as before.
- A **25.016-second** headless desktop Chrome interval delivers **1,501 frames**,
  with frame-spacing p50/p95 **16.7/16.7 ms** and movement-update CPU p50/p95
  **0.5/0.8 ms**. Renderer counts stay at **136 geometries / 8 textures**.
  This covers about 75 balance cycles. There is no per-cycle loop or extra render
  pass: increasing speed leaves per-frame work unchanged. These measurements do
  not establish GPU completion time, physical-device or sustained thermal limits.
- The nominal sampler still covers **8,557 normalized poses**. Against the retained
  eight-second export, maximum balance/pallet/escape differences are below
  **3.2×10⁻¹³ degrees**, and the 361-pose GPU spring export is byte-identical.
  Generated geometry and runtime-metadata hashes are unchanged. Therefore the
  previous geometry evidence applies to the same paths; no CAD sweep was rerun
  and no new continuous-solid or dynamic clearance claim is made.

Twenty consecutive 60 FPS macro poses were inspected. The spring remains attached
and the existing path is preserved, but instantaneous sampling cannot show every
brief release or recoil. At 15/30/60/120 FPS there are 5/10/20/40 samples per cycle;
the tested grid's largest balance steps are about 201/111/56/28 degrees. The
four-spoke symmetry can produce apparent reversals or strobing, particularly at
lower rates; polished highlights can also change abruptly. This is a rendering
limitation, not a slower clock or a new mechanical recoil law. No temporal blur,
amplitude reduction, geometry change or extra playback control was introduced.

Reproduce using the existing dependencies and local production server commands
below, with a separate evidence directory:

```sh
mkdir -p artifacts/nominal-movement
node --test tests/running-movement.test.mjs > artifacts/nominal-movement/focused-tests.txt 2>&1
npm --prefix explorer run typecheck > artifacts/nominal-movement/typecheck.txt 2>&1
npm --prefix explorer run lint > artifacts/nominal-movement/lint.txt 2>&1
npm --prefix explorer run build > artifacts/nominal-movement/build.txt 2>&1
# In a separate terminal:
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4178
# Then use the existing Playwright/Chrome paths:
MOVEMENT_EVIDENCE_ROOT=artifacts/nominal-movement \
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH=/absolute/path/to/Chrome \
node scripts/movement/browser-check.mjs http://127.0.0.1:4178
MOVEMENT_EVIDENCE_ROOT=artifacts/nominal-movement node scripts/movement/sample-runtime.mjs
node scripts/movement/record-nominal-validation.mjs
```

The recorder requires the retained maker HTML snapshot and reviewed frame contact
sheet as well as the earlier sample exports; it is an evidence recorder, not a
clean-machine downloader. The original broad CPU/Bench flip suites were not rerun
for this timing-only change. No push, PR, merge, deployment or publication.

## Verification of the initial eight-second implementation

The results in this section are the historical `bdf8259` baseline. Nominal-speed
validation is recorded separately above; these are not newly rerun CAD checks.

Evidence is retained locally in `artifacts/running-movement/`; the provenance
record is [running-movement.json](../assets/source-manifest/running-movement.json).
The three earlier research manifests remain historical records of their unchanged
application baseline, not claims about the new runtime.

- **171 CPU tests**, Workshop inventory validation, TypeScript checking, lint and
  the production build pass locally. The existing Bench flip browser suite passes
  all **32 checks**, including holder clearance and blocked visitor paths.
- Actual TypeScript transforms, ratios, membership, source phases, reversed axes,
  rigid relative transforms and geometry restoration are exercised in CPU tests.
  Tests include recoil, multiple cycles, escape-revolution boundaries and the
  2,808,000-cycle whole-train repeat. Clocks agree at 15/30/60/120 FPS; suspension,
  missing/corrupt assets and idempotent cleanup are covered.
- **8,557 actual timed runtime poses**, including every pallet-table midpoint on
  both swings, clear refined original sections. Minimum fork/jewel gap is
  **0.001994347 mm**, wheel/pallet-jewel gap **0.002969935 mm**. These tighter
  interpolation samples produce a slightly smaller fork minimum than the study.
- The same configurations clear sections of the **actual decoded runtime meshes**,
  including the sidecar fork: minimum gaps **0.001994297 mm** and
  **0.002965954 mm**. Sampling is not continuous whole-solid certification.
- **361 actual GPU ribbon poses** at 1° balance intervals are simple, valid and
  clear the free-strip/collet section. Minimum nonlocal strip gap is
  **0.094051332 mm**. Radial bounds **0.479414675–3.575688735 mm** remain inside the
  previously whole-solid-checked annulus, preserving its fixed-neighbor and
  train-envelope clearance evidence.
- Maximum attachment error is **0.000000528 mm** in exported GPU coordinates.
  Maximum total centerline length change is **0.000270272 mm** out of roughly
  171 mm. Five fresh constrained solves at intermediate atlas angles differ by
  at most **0.000091701 mm**. These are numerical/model checks, not physical
  precision or stress claims.
- The same 361 interpolated poses receive **2,695** local 3D distance queries
  against the original raised-terminal faces, excluding their fixed attachment
  region. No intersection was found; bounding exclusions plus queried distances
  give a conservative minimum clearance of **0.050044493 mm**.
- Production-browser checks cover automatic running, sustained rendering,
  separation/inventory/reassembly, fitted front/back configuration, part isolation,
  Workshop partial/completed/undone states, Bench flip, hidden-tab lifecycle and
  all three controllers' cleanup. Macro views of both spring extrema were
  visually inspected. On this local Chrome run, a 25-second interval delivered
  about 1,500 frames, with p50 ≈16.7 ms and p95 ≈16.7 ms and unchanged geometry and
  texture counts. This is one desktop run, not representative device/thermal
  qualification. Browser console checks report no application/shader errors;
  local Vercel analytics requests return the expected 404.

Remaining limits include invalid original eccentric solids (only their recorded
rendered envelopes are qualified), source tolerances, untested simultaneous
whole-assembly contacts, physical-device performance and mechanical review.
No force, torque, actual operating frequency or manufacturing-clearance claim
is made. The existing publication/redistribution gates remain uncleared.

## Reproduction

Normal application setup needs only the committed runtime assets:

```sh
npm ci --prefix explorer
npm --prefix explorer run dev
```

Open the existing movement view at `http://127.0.0.1:4173/`. For the focused
checks used here (local execution was necessary because no push was authorized):

```sh
node --test tests/*.test.mjs
node scripts/play/validate-inventory.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4176
# In another terminal, with an existing Playwright installation and Chrome:
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH=/absolute/path/to/Chrome \
node scripts/movement/browser-check.mjs http://127.0.0.1:4176
```

The browser audit uses test-only controller access for state fixtures and
measurements; it adds no production debug or playback API. Its Workshop final
inventory fixture is not evidence of a full manual assembly journey. Existing
inventory and lifecycle regressions separately protect assembly behavior.

Regeneration and source-clearance verification require the retained private,
hash-checked CAD/cache and study outputs; this is not yet clean-machine CAD
reproduction. These commands write ignored evidence, except the exporter, which
regenerates the generated runtime metadata, sidecar and provenance (reading the
separate authored policy file):

```sh
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/export_runtime.py
node scripts/movement/sample-runtime.mjs
node scripts/movement/export-meshes.mjs
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/check_runtime.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/check_runtime_meshes.py
```

The separate authored policy is `assets/authored/running-movement.json`. Generated
metadata is `explorer/public/models/movement-runtime.json`, with a content-addressed
binary alongside it. Both final runtime outputs are allowlisted for Git and build output.
Original CAD, study BReps, screenshots, caches and experimental geometry remain
ignored. No push, PR, merge, deployment or publication is part of this milestone.

The original `node scripts/movement/record-validation.mjs` records a complete
geometry/runtime audit. For the nominal-speed milestone, use
`node scripts/movement/record-nominal-validation.mjs`; it preserves the earlier
geometry evidence and records the separate speed validation.
