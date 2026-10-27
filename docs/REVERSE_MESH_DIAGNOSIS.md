# Reverse-face running contacts — 27 October 2026

Follow-up: the [connected phase and clearance review](DISPLAY_PHASE_CLEARANCE_REVIEW.md)
tests both candidates together across both display trains and their neighbors.
It finds no new phase-induced collision in the scoped checks, while retaining
source contacts, sampled-neighbor limits, the rear-hour precision limitation
and the unresolved joint states. No candidate is installed.

**No runtime transform fault was found. Both contacts are phase incompatibilities
in the current nominal source/display configuration.** Isolated phase changes
clear the reviewed planar profiles and selected original-solid poses without
changing teeth or axes. This is evidence against an unavoidable profile collision
in those checks, not full 3D running acceptance. The rear hour pair has only about
**45 nm** nominal clearance at the best examined phase, so it remains especially
sensitive to source precision and tolerances.

Research starts from clean `ac6e37c` on `codex/escapement-clearance-study`.
The app, source geometry, authored phases and moving/static boundaries remain
unchanged. All phase alternatives below exist only in ignored diagnostics.
The [motion-work study](MOTION_WORKS_STUDY.md) retains its current-phase failures;
the [friction report](FRICTION_CONNECTIONS.md) retains its joint-state limitations.
[Provenance](../assets/source-manifest/reverse-mesh-diagnosis.json) records inputs,
source URLs, hashes, exact measurements and validation.

## Separating the three possible causes

| Pair | Original source | Authored display phase | Runtime finding | Diagnosis within this review |
| --- | --- | --- | --- | --- |
| 183/216, cannon 2 / motion wheel 3 | Clear at rest, penetrates during 8:24 coupled rotation | Neither leaf has an override; source and display poses are identical | Reproduces the source failure; transforms agree independently | Source clocking is incompatible with the prescribed constant ratio. A diagnostic phase gives a positive planar bound and clear selected solids. |
| 217/187, motion pinion 3 / hour wheel 2 | Already penetrates at rest and during 8:32 coupled rotation | Hour packet +0.25° world Z removes the static overlap but leaves running overlap | Reproduces the residual failure; transforms agree independently | The static correction helps, but is insufficient for rotation. A slightly different phase clears the reviewed nominal profiles with an extremely small margin. |

The source tooth surfaces produce the measured overlaps at the existing phases;
they are not rendering artifacts. The phase experiments do not establish that
the manufactured profiles are defective, that any teeth need changing, or that
the experimental phases are factory clocking specifications.

## Occurrences, axes and signs

The source STEP SHA-256 remains
`f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`.
The earlier fresh XCAF occurrence composition matched the runtime catalog; this
review reuses that hash-verified evidence and original definition solids.
Append these suffixes to `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`:

| Definition | Occurrence suffix | Teeth / module mm | Axis XY mm | Local Z in world | Authored world phase |
| --- | --- | --- | --- | --- | ---: |
| 183 | `37__0_1_1_182_1` | 8 / 0.15 | (0,7.4) | −Z | 0° |
| 216 | `57__0_1_1_215_1` | 24 / 0.15 | (0,5) | +Z | 0° |
| 217 | `57__0_1_1_215_2` | 8 / 0.12 | (0,5) | −Z | 0° |
| 187 | `40__0_1_1_186_1` | 32 / 0.12 | (0,7.4) | −Z | +0.25° |

Both center distances are 2.4 mm, consistent with the named tooth counts and
modules. World increments obey `θ216 = −θ183/3` and `θ187 = −θ217/4`.
Because 183/216 have opposite local axes, their **local** increments have the
same sign. The 217/187 local increments have opposite signs. No extra reversal
is applied on top of the world rotation.

The complete material orientation periods are 1080°/−360° for 183/216 (3 h),
and 1440°/−360° for 217/187 (12 h), conditional on the documented drive. Either
time direction traverses the same closed orientation set. Recoil revisits that
set; no contact-force or backlash dynamics are inferred.

## Original versus display geometry

The existing source sections use 0.00002 mm chord sampling. Undoing the authored
hour phase and comparing with fresh sections of the original BReps gives maximum
Hausdorff discrepancy **1.19×10⁻⁹ mm**; the other three discrepancies are zero.
Thus the original/display comparison does not substitute an approximate mesh
for the original solids or silently change mounting positions.

| Pair and pose basis | Full-period configurations | Intersecting section configurations | Maximum sampled section overlap mm² | Maximum selected original-solid common mm³ |
| --- | ---: | ---: | ---: | ---: |
| 183/216 original | 4,609 | 2,736 | 0.000313034130 | 0.000062791950 |
| 183/216 display | 4,609 | 2,736 | 0.000313034130 | 0.000062791950 |
| 217/187 original | 6,145 | 5,569 | 0.000469352332 | 0.000094020161 |
| 217/187 display | 6,145 | 1,216 | 0.000009177566 | 0.000001881914 |

All common results used here are valid BReps. Positive whole-solid volumes
corroborate actual nominal penetration, rather than a failed conservative bound.
The 183/216 static source gap is 0.001481551 mm, explaining why a static review
missed this running problem. For 217/187, source static common is
0.000010339957 mm³; the display correction opens a 0.004478894 mm static gap.
That endpoint improvement does not clear its full rotation period.

## Isolated phase experiments — not installed

For each pair, hold the fast member's source phase at zero and add a world-Z
offset δ to the follower: `θb = −Na/Nb × θa + δ`. A 97-point phase search over
one follower pitch, each evaluated over the complete material period, followed
by 65 local refinements identified candidate windows. This is a finite search,
not proof of a unique or globally optimal phase. No physical fit is adjusted.

| Pair | Diagnostic δ relative to source | Sampled original-solid minimum gap | Continuous planar polygon lower bound | Scope |
| --- | ---: | ---: | ---: | --- |
| 183/216 | −0.3076171875° | 0.002819566 mm | 0.002453052 mm | 36,865 full-period section configurations; 5 selected whole-solid poses clear |
| 217/187 | +0.2716578711° | 0.000045141 mm | 0.0000010419 mm | Refined adaptive planar cover; 7 selected whole-solid poses clear, including both fine contact regions |

The hour candidate is only **+0.0216578711° beyond the current display phase**.
Its initial coarse section result was too close to the approximation scale to
accept. A fresh original-solid section at **0.0000002 mm** chord sampling and
a finer phase search resolved a nominal minimum near 0.0000452535 mm. Original
whole-solid distance checks at the two fine limiting orientations independently
give 0.0000451413 and 0.0000451522 mm, with zero common volume.

The finer hour-pair bound uses 2,422 evaluations and covers 2,421 adaptive
intervals over a tooth engagement. Each interval subtracts a maximum rigid-point
displacement from its endpoint clearance. To extend this to the complete
material period, every tooth-pitch copy of both exterior polygon rings is
matched by ordered vertices and edges; maximum edge-displacement errors are
1.23×10⁻⁹ and 1.35×10⁻⁹ mm and are subtracted from the bound. Interior holes are
outside the other body's full-turn reach. No identical-tooth assumption is used
without this explicit polygon check. These are **continuous polygon bounds**,
not continuous analytic-surface or swept-solid bounds. The chord sampling
parameter itself is not a certified analytic-curve error bound.

The two experiments can coexist algebraically while keeping motion works 3 at
its existing phase: rotate the complete cannon-2 packet 183/184 by
**−0.9228515625° world Z**, and the complete hour-2 packet 187/188 by
**+0.2716578711° world Z relative to source**. The corresponding local angles
are +0.9228515625° and −0.2716578711°. This transfers the first pair's relative
phase to its cannon packet instead of independently rotating wheel 216 away
from its riveted pinion 217. The isolated runtime diagnostic uses these complete
packets; none of these angles is written to authored assets.

## Runtime cross-check

The actual Meshopt-decoded overview is loaded in an isolated Node process.
Hypothetical packets and source/display/experimental phases exist only in that
process. Production `RunningMovement`, `movementPose` and the shared accumulated
escape angle supply the motion. Ratios precede final angle modulo reduction.

The renderer loads geometry in definition coordinates, sets each leaf's source
matrix, then reparents it under the common movement root. `wheelDisplayMatrix`
post-multiplies the local display phase; `RunningMovement` then pre-multiplies
the world shaft rotation. This avoids doubling the source assembly placement.
The source, local phase and world rotation are also evaluated independently on
points without calling the production shaft-matrix helper.

- At 0, 0.017, 1/3, 123.456, 10,800, 43,200 and 1,000,000,000 seconds, across
  all three diagnostic variants and six packet leaves, maximum independent
  point error is **1.78×10⁻¹⁵ mm**. Display base-matrix error is zero; maximum
  shaft-pivot drift is **3.19×10⁻¹⁵ mm**.
- All **33 selected runtime witness poses** also agree with the independently
  reconstructed CAD witness transforms, maximum point error
  **1.15×10⁻¹³ mm**. This checks that the queried runtime and BRep collisions
  refer to the same orientations, including reversed local axes.
- Actual runtime triangles intersect at 3/6 source and 3/6 display samples for
  183/216, and 4/5 source and 1/6 display samples for 217/187. All 5 experimental
  samples per pair are clear. These are selected witnesses, not complete
  runtime-mesh swept-volume certificates.

Tessellation changes tiny distances: the rear-hour diagnostic runtime minimum
is approximately 0.000286633 mm at these poses, versus roughly 0.000045 mm in
the original solid. The runtime therefore must not certify the narrow source
margin. It reproduces the present failures; it does not cause them.

## Limits and next action

Both nominal CAD phase experiments have positive planar evidence, but neither
has received all-phase neighboring-solid, fitted-hand or complete-train
qualification. The second pair's approximately **45 nm** source gap is only
about 4.5 times the imported edge/vertex tolerance (0.00001 mm). The STEP also
declares 0.005 mm length uncertainty; this is export metadata, not a specified
manufacturing tolerance. Such figures do not support a robust physical-running
claim. The experimental lower polygon bound is smaller still.

This investigation identifies phase compatibility as the demonstrated cause
at the tested nominal geometry. It does not prove all 3D tooth profiles are
conjugate, prescribe a manufacturing change, or clear the source-fit limitations.
The [two friction joint states](FRICTION_CONNECTIONS.md) remain unconfirmed by an
explicit maker specification. All seven candidate packets and all hands remain
static in the app; existing motion remains prescribed kinematics.

The next decision concerns whether these isolated nominal phase candidates
merit a separate full-train/neighbor review, especially given the rear-hour
margin. No phase correction or geometry change is authorized or installed by
this research milestone. No maker communication, push, PR, deployment or publication.

## Validation and reproduction

Local CAD calculations and the isolated runtime diagnostic were explained before
execution: the retained original solids and actual transforms were essential to
separate source, display and runtime causes, without a push. No app build, app
test suite or browser automation was needed. Existing lifecycle behavior was
not changed or re-qualified. All **126 tracked application/authored files** are
byte-identical to `ac6e37c`; source/download hashes remain intact.

With the existing ignored CAD environment and prior evidence:

```sh
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/reverse_mesh_diagnosis.py scan
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/reverse_mesh_fine.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/reverse_mesh_diagnosis.py compare
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/reverse_mesh_fine_bound.py
node scripts/movement/review-reverse-mesh-transforms.mjs
python3 scripts/cad/escapement-clearance/record_reverse_mesh.py
```

The comparison includes 107,526 baseline/experimental full-period section
configurations and **35 selected original-solid checks**, in addition to the
phase searches and adaptive fine bound. Evidence remains ignored under
`artifacts/reverse-mesh-diagnosis/`. No new geometry is distributed with this report.
