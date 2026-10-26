# Continuous train coupling investigation — 26 October 2026

**The existing gear geometry supports a continuously repeating illustrative
escapement with the drive train coupled back to barrel II, within the checks
below. No additional gear reshaping, shaft relocation or display-phase adjustment
was needed.** This extends the earlier fork-clearance and hairspring candidates;
it does not establish a self-powered mechanical simulation.

The app remains unchanged. This work adds research scripts, this report and a
[provenance record](../assets/source-manifest/train-coupling-study.json) on
`codex/escapement-clearance-study`, following `1f2a36f`. Experimental geometry and
measurements remain ignored under `artifacts/train-coupling-20261026/`. Nothing
was pushed, published or installed in the runtime.

## Drive path and membership

The original tooth counts and shaft locations give this path from the power
source toward the escapement:

```mermaid
flowchart LR
  B["Barrel II · 80 teeth"] --> T["Transfer · 26"]
  T --> C["Center · 12 pinion / 64 wheel"]
  C --> R["Third · 10 pinion / 75 wheel"]
  R --> S["Seconds · 8 pinion / 81 wheel"]
  S --> E["Escape · 9 pinion / 20 wheel"]
```

For a prescribed escape angle `E`, all increments below are about world +Z,
applied after the current authored display poses. The ratios reference the
displayed `E = 0` pose, rather than re-zeroing every shaft at the cycle's first
sample. The source uses reversed local axes on some components, so applying
these signs directly to every component's local Z would be wrong.

| Shaft / packet | Source definitions | Angle / E | Advance per complete balance oscillation |
| --- | --- | ---: | ---: |
| Escape | 233, 234, 235 | 1 | +18° |
| Seconds | 242, 243 | −1/9 | −2° |
| Third | 237, 238 | +8/675 | +0.213333…° |
| Center | 93, 94, 95 | −1/540 | −0.033333…° |
| Transfer | 96 | +1/1170 | +0.0153846…° |
| Barrel II drum and lid | 85, 86 | −1/3600 | −0.005° |

This is 13 rigid leaves, including the three escape leaves already studied.
Definition 95 is the seconds-shaft bearing carried with the center assembly;
the seconds shaft and center assembly remain separate coaxial packets.
Barrel arbors, ratchets, barrel I and both mainsprings are excluded from this
rigid coupling. The motion works and hands are also outside this minimal scope.

The existing +16.6° third, +2.3° seconds and +6.25° transfer world phases are
retained. The full pose file is hash recorded. No new phase correction is proposed.

## Continuous repetition

The earlier authored escapement cycle advances the escape wheel by 18° and
returns balance and pallet to their starting orientations. Use
`E(n, u) = 18*n + localEscape(u)`, where `n` is the completed oscillation count
and `u` is position within that cycle. All other shafts derive from that single
accumulated value. The measured local endpoints are approximately −0.1° and
+17.9°; multiplying their difference by each exact ratio verifies the seam.

Resetting the train after every oscillation, or after one escape-wheel revolution,
would produce jumps. The complete rigid train returns to all its original
material orientations only after **140,400 escape revolutions**, or **2,808,000
balance oscillations**. A runtime need not simulate or store that whole interval:
it can accumulate phase and reduce each final shaft angle modulo 360° independently.

This supports an automatic, continuously running movement in the existing view;
no separate page or play/pause controls are required. Frequency, time interpolation
and behavior while parts are separated or removed remain integration decisions.
The authored cycle contains small recoil intervals; exact ratio coupling transfers
those to every shaft. This is a kinematic convention, not a backlash/contact or
torque-transmission solution.

## Gear-mesh evidence

Each of the five interfaces was checked over its complete relative material
orientation period, using the actual source tooth profiles. This avoids assuming
that all teeth are identical. There are 48 subdivisions per tooth engagement,
including each period's closing configuration: **105,461 section configurations**
in total, with no section overlap.

| Meshing definitions | Teeth | Configurations | Minimum sampled section gap | Continuous polygon gap lower bound | Minimum selected whole-solid gap |
| --- | --- | ---: | ---: | ---: | ---: |
| 234 / 243 | 9 / 81 | 3,889 | 22.511 µm | 15.163 µm | 22.511 µm |
| 242 / 238 | 8 / 75 | 28,801 | 25.117 µm | 16.679 µm | 25.117 µm |
| 237 / 94 | 10 / 64 | 15,361 | 21.694 µm | 12.359 µm | 21.687 µm |
| 93 / 96 | 12 / 26 | 7,489 | 22.566 µm | 11.887 µm | 22.560 µm |
| 96 / 85 | 26 / 80 | 49,921 | 26.892 µm | 16.631 µm | 26.884 µm |

Source sections use a 0.02 µm chord-sampling tolerance, at world Z = −3.73,
−4.12, −2.82, −2.45 and −2.28 mm respectively. The barrel pair uses the upper
tooth layer: a section at −2.45 mm did not recover the complete barrel tooth
profile and was rejected for this measurement.

For speed, each rotated profile is clipped to a conservative interaction window.
Any cross-profile points less than 0.05 mm apart lie inside that window; the
clipped distance is capped at 0.05 mm. Subtracting the maximum rigid point
displacement to the nearest sample gives the continuous polygon lower bounds
above. They apply to these polygonal sections, not to the complete 3D bodies or
physical manufacturing tolerances.

**75 selected whole-solid configurations** corroborate the sections: 15 per
interface, covering first-pitch fractions, the worst sampled section phase,
fractions of the full pair period and its closure. All have positive distances
and zero solid-common volume. These are selected checks, not 105,461 whole-solid
queries or a continuous swept-solid certification. Positive gaps also do not
prove that contact forces would drive the prescribed motion.

## Surrounding parts and the hairspring

The ten newly driven leaves each receive a full-turn screen at 10° increments
against the other valid source leaves, held at the current displayed poses.
Same-packet pairs and the five meshes above are excluded. There are **6,052
pose Boolean queries**, plus source-pose comparisons, and **121,712 bounding
exclusions**. No screened pair develops more solid overlap than its original fit.

Two existing overlaps remain effectively constant: seconds pinion 242 with hand
bushing 41 (0.000342718 mm³), and transfer wheel 96 with screw 139
(0.169871571 mm³). These are retained source fits, not newly cleared interfaces.
The former does not establish how to animate the hand; the minimal train study
does not couple display components or infer frictional constraints.

The frozen-neighbor screen is not an all-phase simultaneous-motion proof for
every nonmeshing pair. Seven invalid/unbounded/non-solid source leaves are
excluded, including the four balance eccentrics previously examined using rendered
envelopes. Those original BReps remain unqualified. Source case/hand placements
were used, not every app preset.

Full-turn bounds for all ten new leaves clear the previously sampled deforming
hairspring coil envelope by at least **0.509225 mm**. Thus the newly added train
rotation does not invalidate that coil-envelope result. The raised terminal stays
fixed and is included through the original spring in the neighbor screen.
Full-turn boxes also separate the new leaves from valid balance/pallet leaves,
except four conservative box overlaps. Containing cylinders, verified by empty
original-solid subtraction, resolve those four with positive radial bounds
(minimum **0.160403 mm**). These results are recorded in `envelopes.json`; they
remain distinct from qualifying invalid original eccentrics or untested spring
interpolation.

## The power-source boundary

The barrel-II drum and lid can follow the gear ratio without a new sampled
collision. At the supplied pose, its mainspring touches the drum, clears the core
by **0.006985 mm**, and clears the lid by **0.1 mm**. Thirty-six rigid poses give
zero common volume for rotating drum/fixed spring, rotating lid/fixed spring,
rotating spring/fixed core, and rotating drum/fixed core.

Both a frozen spring and one carried rigidly with the drum therefore pass this
limited geometric screen. **Neither represents a solved unwinding spring.**
The supplied solids and these clearance checks do not establish an attachment
constraint, spring-energy law, arbor motion or load sharing between the two
barrels. Simply including the spring, arbors and ratchets in the barrel's rigid
packet would introduce unsupported mechanics.

For a minimal visual movement, the train can be prescribed from the escapement
clock and the barrel boundary kept explicitly illustrative. A faithful visible
power-source animation needs a separate mainspring/barrel study. No extra visible
gear modification has emerged from this investigation; the earlier local fork
relief and independent hairspring deformation are still the proposed changes.

## Reproduce and next action

Use the retained private source/cache and the preceding studies' environment.
This is not a clean-machine reconstruction. The commands write ignored evidence;
the final recording command updates only the tracked research manifest.

```sh
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/train_coupling.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/train_periods.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/train_solids.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/train_neighbors.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/train_kinematics.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/train_barrel.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/train_envelopes.py
.venv-cad/bin/python scripts/cad/escapement-clearance/record_train.py
```

Focused local CAD calculations were necessary to inspect the private solids and
were explained before execution. No app tests, builds or browser automation ran.
The source hash and unchanged app/authored assets are verified by the recorder.

The frozen train boundary is resolved for the scoped illustrative design. Before
integration, choose the mainspring representation and verify timed interpolation,
product states and sustained rendering. Continuous whole-assembly contact,
physical spring behavior and self-sustained dynamics remain unproven. Existing
[release gates](RELEASE_GATES.md) still apply.
