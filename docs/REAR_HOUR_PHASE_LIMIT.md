# Rear-hour phase and precision limit

**28 October implementation follow-up:** [both display trains now move](REAR_DISPLAY_ANIMATION.md)
under documented sticking assumptions at 93/137 and 214/217, with the two reviewed
rear packet phases installed. Hands remain static. The research below is
historical; its source-fit, sampled/continuous and physical-acceptance limits remain.


28 October 2026. Research from clean `09f5469` on
`codex/escapement-clearance-study`.

**Further phase tuning cannot create a materially larger running gap in the
reviewed nominal rear-hour section geometry.** A continuous phase cover places
its maximum possible minimum running clearance below **45.654 nm**. Selected
original-solid calculations and an independent circular-support calculation
agree on approximately **45.145 nm** near the existing candidate. The small
margin is supported by the nominal CAD geometry; it is not explained by the
earlier finite phase search or ordinary distance-solver settings. This does not
establish the clearance of the manufactured watch.

The app remains unchanged. No gear, phase, shaft, tooth, clock, hand or lifecycle
behavior was changed. All 126 tracked app/authored files match the baseline.
This research concerns conditional prescribed kinematics. The two fitted-joint
states and the [connected review's](DISPLAY_PHASE_CLEARANCE_REVIEW.md) neighbor
and source-fit limitations remain in force.

## Source and permitted phase freedom

The original maker assembly SHA-256 is
`f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`.
[Provenance](../assets/source-manifest/rear-hour-phase-limit.json) retains the
source URLs, exact occurrences, input/tool hashes and results. Original solids
and generated numeric evidence remain ignored locally.

| Member | Source definition | Teeth | Shaft XY, mm | World angular increment |
| --- | --- | ---: | --- | --- |
| Motion-work 3 pinion | 217 | 8 | (0, 5) | θ |
| Reverse hour wheel | 187 | 32 | (0, 7.4) | −θ/4 |

The rigid packets remain 216/217 and 187/188; their membership is not changed.
The axes remain 2.4 mm apart. Both inspected leaves have reversed local Z;
reported phases are world-Z rotations. With constant packet offsets α and β,
the invariant relative phase is **δ = β + α/4**. Changing both offsets therefore
does not supply another independent way to improve full-period mesh clearance:
it changes δ and the starting point along the same running cycle.

The previous diagnostic candidate is δ = +0.27165787111074224°. The app still
uses its existing static hour phase, +0.25° world Z. No diagnostic phase is
installed. The complete material orientation cycle remains 1440° of pinion
rotation and −360° of hour-wheel rotation, conditionally 12 hours.

## Complete phase cover, rather than another finite scan

At any chosen phase, the minimum clearance over a complete running cycle
cannot exceed the clearance at either of two fixed pinion orientations. Local
optimization finds opposing limiting orientations near **11.194225384°** and
**33.760446961°**. Equalizing those two section gaps gives a research candidate
δ = **+0.2716580184397788°**. This is a candidate refinement, not a claim that
these are the only minima or a new continuously clear running solution.

The new calculation covers every phase in [−5.625°, +5.625°], one complete
11.25° hour-tooth pitch. Explicit ordered-vertex/edge comparisons check all
31 other tooth copies: maximum edge displacement is 1.351×10⁻⁹ mm. Hour-wheel
holes cannot reach the pinion (maximum hole radius 1.5 mm versus minimum pinion
reach 1.7808 mm), so this extends the result to the full 360° phase range.

For each phase interval, the maximum motion of any hour-section point from its
midpoint is bounded by `2 R sin(width / 4)` with width in radians. The algorithm
either:

- Finds a point inside both polygons whose distance to the moving polygon's
  boundary exceeds that motion plus symmetry/numerical allowances. That point
  remains an intersection witness throughout the interval.
- Adds that motion and the allowances to a midpoint distance, giving an upper
  bound on clearance throughout the interval at one fixed pinion orientation.

Unresolved intervals are subdivided. The final **37 contiguous intervals**
cover the entire pitch without gaps: **28 persistent-intersection intervals**
and **9 distance-bound intervals**, using **129 phase queries**. The largest
accepted upper bound is **0.0000456532660311 mm = 45.653266 nm**. No phase can
provide a micrometre-scale running gap in these polygons.

Clipping is used only to accelerate polygon queries. Distances between clipped
subsets upper-bound distances between the original sets; an interior ball in
a clipped polygon is also inside the original polygon. This does not reuse the
rejected Boolean solid-slab method from the neighbor review. A 10⁻⁹ mm numeric
guard is included, but floating-point results are not interval-arithmetic proofs.

This is a **continuous phase upper bound for polygons**, not a continuous
whole-solid clearance certificate. The previously recorded positive running
lower bound belongs to the previous candidate; it is not silently transferred
to this newly refined candidate.

## Precision and original-solid checks

Fresh original-solid sections at Z = −5.48 mm use progressively smaller
subdivision parameters. All results below use the same refined phase and two
fixed witness angles; no geometry or shaft position changes.

| Section sampling parameter | Pinion / hour exterior vertices | First witness gap | Second witness gap |
| --- | ---: | ---: | ---: |
| 0.2 nm | 16,401 / 66,113 | 45.257855 nm | 45.257855 nm |
| 0.02 nm | 49,169 / 264,257 | 45.154797 nm | 45.154234 nm |
| 0.002 nm | 196,625 / 528,449 | 45.146606 nm | 45.145895 nm |
| Original whole solids | — | **45.145160 nm** | **45.145227 nm** |

The section sampler checks quarter points recursively and rounds coordinates
to 10⁻⁹ mm. Its input parameter is not a certified analytic-curve Hausdorff
error. The convergence check therefore corroborates the result without turning
the polygon phase ceiling into an analytic-solid theorem.

Eight original-solid configurations cover the previous candidate, the refined
candidate and ±0.001° perturbations at both witnesses. All have valid, zero-volume
Boolean common results. Each receives distance queries at deflections 10⁻⁷,
10⁻⁹ and 10⁻¹¹ mm: **24 queries**, with unchanged reported distances across
settings. These solver parameters are not manufacturing tolerances.

An independent check identifies the closest supports as a pinion cylindrical
face of radius **0.22272 mm** and an hour-wheel circular edge of radius
**0.24384 mm**, with axes parallel to Z. At the two witnesses, their XY center
distances are **0.4666051451596381 mm** and **0.4666051452273275 mm**. Subtracting
the two radii reproduces the original-solid gaps within **3.74×10⁻¹⁶ mm**.
Agreement with the trimmed-solid query confirms applicability at these selected
points; it does not certify every orientation.

This gives a geometric explanation for the small gap independent of polygon
tessellation and the CAD distance optimizer. It does not establish that the
exported nominal surfaces match manufactured tooth profiles at that precision.

## Phase sensitivity and decision

| Diagnostic phase | First original-solid witness | Second original-solid witness |
| --- | ---: | ---: |
| Previous candidate | 45.149536 nm | 45.140851 nm |
| Refined candidate | 45.145160 nm | 45.145227 nm |
| Refined −0.001° | 74.852658 nm | 15.438433 nm |
| Refined +0.001° | 15.438360 nm | 74.852721 nm |

Phase tuning trades clearance at one limiting flank against the other. The
refinement improves the worse of these two original-solid witnesses by only
about **0.0043 nm**, which has no practical significance at the source precision.
It is not a reason to change the app or repeat the complete connected review.

The imported edge/vertex tolerance is 10 nm. The STEP export declares 5 µm
length uncertainty; that is neither a manufacturing tolerance nor a statistical
error estimate. The 45 nm gap cannot establish robust physical running from
these data. The finding concerns this nominal model at fixed shaft locations,
not a defect diagnosis of the real mechanism or a recommendation to alter teeth.

**Next work without maker confirmation:** strengthen the 101 sampled-only
neighbor checks with continuous bounds where possible. That can reduce the
remaining validation work, but cannot resolve the rear-hour source/tolerance
qualification or explicitly establish the two joint states. Further phase
search alone is no longer a useful route to a materially larger nominal gap.
Source precision, design clearance or manufacturing evidence is needed for
physical acceptance. No additional gears are enabled by this milestone.

## Reproduction and validation

The need for local CAD work was explained before execution: retained source
solids and their numerical precision were essential, without a push. Existing
CAD dependencies and section/transform helpers were reused. No app test suite,
build or browser automation was run because the app remained unchanged.

```sh
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/rear_hour_phase_limit.py cover
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/rear_hour_phase_limit.py precision
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/rear_hour_phase_limit.py analytic
python3 scripts/cad/escapement-clearance/record_rear_hour_phase_limit.py
```

The recorder checks phase coverage, source and inherited-evidence hashes,
precision-query agreement, analytic witnesses and byte-identical app/authored
files. This requires the retained private source cache and prior local evidence.
Reports, research scripts and provenance form a local milestone; original CAD,
generated sections and detailed local evidence remain ignored. Nothing was
pushed, published or deployed.
