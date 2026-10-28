# Prescribed running movement

Implemented locally on `codex/escapement-clearance-study`, from the verified
research milestone `4785cc2`. Updated 28 October 2026. This is an automatically
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
and catalog files and source CAD remain unchanged. The rear display phase
overrides are documented below.

The 13 drive-train leaves and 13 display leaves use world +Z
increments from the **accumulated** escape angle E, after the existing display poses:

| Packet | Definitions | Angle/E |
| --- | --- | --- |
| Escape | 233, 234, 235 | 1 |
| Seconds | 242, 243 | −1/9 |
| Third | 237, 238 | 8/675 |
| Center | 93, 94, 95 | −1/540 |
| Transfer | 96 | 1/1170 |
| Barrel II drum/lid | 85, 86 | −1/3600 |
| Cannon pinion 1 | 137 | −1/540 |
| Motion works 1 | 210, 211 | +1/1620 |
| Hour wheel 1 | 141, 142 | −1/6480 |
| Motion works 2 | 213, 214 | −1/1620 |
| Motion works 3 | 216, 217 | −1/1620 |
| Cannon pinion 2 | 183, 184 | +1/540 |
| Hour wheel 2 | 187, 188 | +1/6480 |

E is `18 * completedCycles + localEscape`. Only each final shaft angle is reduced
modulo 360°, after its ratio is applied. The −0.1° local start is retained rather
than re-zeroing the source display. Each recorded world pivot defines the shaft
rotation, conjugated into the leaf's reference coordinates so inspection poses
carry that shaft with the part, including reversed local axes. The third, seconds and transfer display
phases remain +16.6°, +2.3° and +6.25° in world coordinates.

Both mainsprings, arbors, ratchets, barrel I and all hands remain in their
existing static representations. The barrel-II drum/lid rotates around its frozen
mainspring as the study's explicitly illustrative boundary. The studied source
fit clears those rotating surfaces, but this does not depict spring attachment,
unwinding, energy storage or load sharing. Static hands do not report elapsed
time. The front/transfer extension uses the user-authorized sticking assumption
at 93/137. The [rear extension](REAR_DISPLAY_ANIMATION.md) models 214/217 as
sticking 1:1 and installs the two jointly reviewed rear packet phases. Those
phases resolve sampled nominal mesh conflicts but retain the ~45 nm rear-hour
precision limit. Static hands are an incomplete display boundary; no physical
slipping is modeled or claimed.

## Historical motion-work extension review — 27 October 2026

The following research preceded the [28 October partial implementation](FRONT_DISPLAY_ANIMATION.md).
The subsequent [rear implementation](REAR_DISPLAY_ANIMATION.md) extends this to
all seven display packets with documented connection assumptions and two rear
phase installations. The historical research below retains its evidence limits.

The [seven-packet investigation](MOTION_WORKS_STUDY.md) confirms 13 exact source
leaves and derives conditional ratios for both displays. **No additional packet
is enabled.** Center/cannon and cross-face shaft sticking constraints remain
unresolved, and both reverse-face gear meshes develop source-solid and actual
runtime-mesh penetration during the full relative-period sweeps. Front meshes
clear conditionally, but no independently supported driven portion is established.
The existing clock, motion, phases, hands and barrel-II boundary remain unchanged.
See the study for 32,261 source and runtime configurations, sampled versus continuous
bounds, neighbor limitations and the precise evidence needed to proceed.

The subsequent [connected phase and clearance review](DISPLAY_PHASE_CLEARANCE_REVIEW.md)
evaluates simultaneous rear phase candidates only in offline diagnostics. The
nominal mesh/neighbor findings do not remove the source-precision, contact or
joint-state limitations, and do not enable any additional app packet.

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
| Cannon pinion 1 | −0.1 | 3,600 s (1 h) |
| Motion works 1 | +1/30 | 10,800 s (3 h) |
| Hour wheel 1 | −1/120 | 43,200 s (12 h) |
| Motion works 2 | −1/30 | 10,800 s (3 h) |
| Motion works 3 | −1/30 | 10,800 s (3 h) |
| Cannon pinion 2 | +0.1 | 3,600 s (1 h) |
| Hour wheel 2 | +1/120 | 43,200 s (12 h) |

These are accumulated net advances about world +Z, not constant instantaneous
velocities: the existing lock, release and recoil remain. Balance and pallet
repeat every 1/3 second; each half swing lasts 1/6 second. All hands remain
excluded. Every enabled packet and the hairspring still consume the same
active-time clock. No amplitude, geometry, display phase, gear ratio or lifecycle
code changed in the nominal-speed milestone. The later display extensions
use that same controller, with the rear phase changes documented separately.

## State and lifetime policy

Each loaded viewer owns one active-time clock. Frame intervals are accumulated
without an FPS-dependent clamp. Hidden-tab time is excluded explicitly, so resume
continues from the last phase without catching up or resetting slower shafts.
Navigation to a fresh viewer starts a fresh illustration.

- Explorer keeps running during focus/reveal, selection, isolation, camera moves,
  fitted watch flips and their transitions. Selection bounds update after the
  animated matrices. Whole-movement disassembly and focused part separation
  suspend the mechanism and active clock, showing static display poses. Reassembly
  resumes retained time only when displayed separation reaches zero, without
  resetting or catching up.
- All-parts inventory (`spread` layout) still suspends motion and shows static
  display poses. Returning to the movement resumes retained active time during
  the return transition. Hidden tabs and lost rendering contexts still suspend.
- Focus/reveal still carries shaft motion with each displayed part. Explicit
  disassembly takes precedence over focus, selection, isolation and flipping.
  Existing layouts, geometry and assembled phases remain unchanged; no physical
  running/disassembly or setting sequence is claimed.
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
and restores them before another update. With reference matrix A, current
unanimated presentation B and world-shaft increment R, the displayed leaf matrix
is B A⁻¹ R A. For an assembled leaf this is R A; for a displaced/tilted leaf it
carries the rotation with the presentation, instead of orbiting the old shaft.
Authored phase rotations share the shaft and commute with R, whether installed
before or after controller creation. Immutable references prevent accumulation.
Original materials are reused. The spring has fixed topology and reusable GPU position/normal buffers. There is no
per-frame solver, tessellation, new geometry, or shared mutation of source meshes.
The small dynamic ribbon's conservative bounds include all studied poses.

The spring atlas stores 38 constrained poses. Each centerline point is de-rotated
by its attachment weight before interpolation and re-rotated at the current angle.
The inner 0.60 mm thus follows the collet and the final 0.50 mm remains fixed.
This avoids shrinking the inner attachment along a chord between sampled poses.
The ribbon keeps the original 0.035 mm width and 0.215 mm height. Interpolation
is an approximation, with measured length/shape errors below; it is not an elastic
material solution.

## Disassembly pause revision — 28 October 2026

At the user's revised request, whole and focused disassembly now suspend motion.
Eligibility checks both requested and displayed separation, so setting the target
back to zero does not restart the gears while parts are still returning. Focus,
selection, isolation and flipping remain active when there is no disassembly.
Hands, Workshop/Bench policies, geometry, phases, kinematics and clock are unchanged.
[Revision provenance](../assets/source-manifest/disassembly-pause.json) records
validation and baseline `b5307a7`. The earlier inspection milestone below is
historical; its disassembly behavior is superseded by this revision.

All 19 focused movement/scheduling tests, typecheck, lint, production build and
25 browser checks pass. Whole and focused disassembly advance active time by
zero in the checked intervals; reassembly resumes without counting that pause.
Frame samples check static separated poses and running inspection poses, including
return transitions. Hidden suspension, hands, Workshop Undo, Bench and cleanup
retain their checks. Evidence is under `artifacts/disassembly-pause/`. These are
runtime checks, not new CAD clearance bounds.

## Continuous inspection animation — 28 October 2026

Implemented from clean `6d31677`. The existing 41 rigid leaves and deforming
hairspring continue through Explorer inspection and exploded presentation poses.
The only eligibility exclusion in a loaded, visible Explorer is the All-parts
inventory layout. Workshop and Bench eligibility remain unchanged. Disposal now
also clears the cancelled frame ID while restoring the animation resources.
[Provenance](../assets/source-manifest/inspection-movement.json) records the
baseline, protected assets, verification results and local evidence hashes.

Assembled transforms are algebraically equivalent to the previously reviewed
motion. Packet membership, teeth, ratios, periods, authored phases, geometry,
frequency, recoil, balance amplitude and source-shaft positions are unchanged.
The explicit 93/137 and 214/217 sticking assumptions and static-hand/power-source
boundaries still apply. There is no new clock, smoothing or playback control.

The existing assembled clearance evidence therefore remains applicable with its
sampled-versus-continuous distinctions, source overlaps and ~45 nm rear-hour
precision limit. No CAD clearance sweep was rerun for presentation movement.
Exploded layouts and their transitions are not mechanically assembled states;
this change does **not** certify collision-free or physically driven disassembly.
No geometry or phase was adjusted to conceal a presentation overlap.

Local validation was explained before execution because this milestone remains
local and the changed presentation needs actual browser verification. All **22
focused tests** (12 movement, 7 scheduling, 3 phase), typecheck, lint and production
build pass. The build retains the existing vinext route-classification notice.
All **25 browser checks** pass across Explorer, completed Workshop and assembled
Bench, including delayed frames, visibility suspension, completion/Undo and cleanup.

The browser sampled **1,429** assembly-layout frames across inspection, flips,
separation, inventory return and reassembly: no inactive frame, maximum independent
point-transform discrepancy **2.33×10⁻¹¹ mm**. **18,345 hand samples** agree with
unchanged presentation poses within **7.12×10⁻¹⁵ mm**, and selection bounds match
on **74** selected frames. CPU fixtures additionally cover arbitrary tilted axes,
rigid packet relationships, reversed axes, 10⁹ active seconds, repeated updates,
restoration and phase installation before/after controller construction.

A 25.016-second desktop interval delivered 886 frames (spacing p50/p95
33.3/33.4 ms), update CPU p95 0.7 ms, and stable 135 geometries / 8 textures.
A deliberate 250 ms visible stall advances the clock by 250 ms. These are local
headless-browser samples with the visible app also open, not a device-performance
qualification. Hidden visibility and completed/undone Workshop states use the
existing synthetic fixtures. No application/shader errors; the existing local
analytics 404 is excluded. Evidence stays ignored in `artifacts/inspection-movement/`.

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
