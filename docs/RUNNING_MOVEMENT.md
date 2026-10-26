# Prescribed running movement

Implemented locally on `codex/escapement-clearance-study`, from the verified
research milestone `4785cc2`. Updated 27 October 2026. This is an automatically
running **kinematic illustration**, not a physical escapement simulation.
Publication and mechanical acceptance remain subject to [release gates](RELEASE_GATES.md).

## Behavior and scope

The existing Explorer, completed Workshop and assembled Bench movement run without
another page or playback controls. A deliberately slowed **eight seconds per
complete balance oscillation** makes the motion readable. It is not an inferred
operating frequency. Balance amplitude remains the study's ±180°, around its
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

## Verification

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

After all local evidence is complete, `node scripts/movement/record-validation.mjs`
verifies the reports and records their hashes in the provenance manifest.
