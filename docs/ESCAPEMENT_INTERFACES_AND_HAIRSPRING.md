# Escapement interfaces and hairspring — 26 October 2026

**The support geometry and a deforming hairspring support an illustrative running
escapement. The visible assembly cannot run with the rest of the train frozen.**
The escape pinion intersects the stationary seconds wheel; coupling that wheel
clears this mesh but exposes the next stationary train boundary. Integration is
therefore still deferred. No further clearance removal or shaft relocation was
needed for the support and spring candidates examined here.

This follows the [fork clearance study](ESCAPEMENT_CLEARANCE_STUDY.md) on
`codex/escapement-clearance-study`. All application code, runtime models, original
CAD and authored display poses remain unchanged. Research scripts and evidence
records are local commits; nothing was pushed, deployed or published.

## Scope and evidence

The same hash-checked original STEP, historical escapement membership, separate
fork candidate and two-swing cycle are used. The original STEP was loaded to
extend the audit to **365 leaf occurrences**. Current wheel display phases were
applied to the comparison geometry. Case and hand placements in this audit are
source placements, not every fitted product preset.

The [provenance record](../assets/source-manifest/escapement-interfaces-study.json)
records source URLs/hashes, inputs, findings, script hashes and local evidence
hashes. CAD and previews remain ignored in
`artifacts/escapement-interfaces-20261026/`.

Focused local CAD calculations were necessary to examine the retained originals
and experimental geometry. No application tests, builds, browser automation or
public CI upload of CAD were performed.

## Rigid supports

The 14 valid moving leaves were screened against the other source leaves at
**39 cycle configurations**. This involved **1,937 unique closed-solid Boolean
common checks**, 185,486 bounding exclusions and 3,430 evaluated pair/pose
combinations after reusing repeated bank poses. Distances were additionally
measured at the bearing jewels. Zero volume is a computed solid-common result
here; the large support shapes were not all subjected to distance optimization.

No new positive solid overlap was found against the plates, bridges or other
valid fixed support bodies at these configurations. Nominal minimum bearing gaps:

| Interface | Minimum sampled distance |
| --- | ---: |
| Balance staff / bearing jewels | 4.833 µm |
| Pallet staff / bearing jewels | 5.000 µm |
| Escape staff / bearing jewels | 5.000 µm |

Three overlapping pair types remained, all investigated explicitly:

- **Balance staff / spring definition:** a separate tiny cylinder contained in
  d116 lies inside the staff. Its full volume, 0.000785398 mm³, accounts for this
  intersection. The actual spring solid is separate and clears the source staff.
- **Rotating collet / frozen spring:** leaving the spring rigid changes its
  original embedding in the collet. The deformation below preserves the source
  attachment region instead.
- **Escape pinion / frozen seconds wheel:** a real boundary of the proposed
  animation scope, addressed below.

The four original eccentric solids remain invalid and cannot receive an original
solid collision certificate. For their **cached rendered geometry**, the four
local mesh boxes were enclosed in a complete swept annulus: radii
4.149439–5.498495 mm, Z −3.2901 to −2.6699 mm. This covers all balance rotation,
not just the sampled balance angles. Its 43 Boolean candidates with valid fixed
solids and sampled moving pallet/escape solids have zero common volume. It also
clears the candidate spring's radial envelope by at least **0.573751 mm**.
This bounds the rendered meshes; it does not repair or qualify missing/invalid
source surfaces. The recovered diamond's rendered box is separately clear of
the full-rotation moving-part boxes, with a minimum bound of **0.251310 mm**.

## The first train boundary

The source escape pinion d234 has 9 teeth; the seconds wheel d243 has 81.
With current static phases retained, the investigated coupling is:

`seconds world-Z delta = −escape world-Z delta / 9`.

Consequently, an 18° escape advance per two-swing balance cycle requires a −2°
seconds-shaft advance. Its wheel and pinion must share that rotation.

The first boundary was checked at **745 section configurations**, covering one
escape revolution plus cycle-derived samples, and **14 selected original-solid
configurations**. The coupled pair had no sampled overlap; its minimum original
solid gap was **0.022511 mm**. Holding the seconds wheel fixed produced an overlap
within the first escapement cycle; the support audit measured up to
0.005239 mm³ there. The separate wider-angle boundary probe reaches 0.005359 mm³.

Rotating the seconds shaft while holding the third wheel d238 fixed then produces
an upstream collision (up to 0.006678 mm³ in the selected wider-angle samples).
It was clear over the sampled first escapement cycle, which would make a short
preview misleading: it fails as motion continues.

**The next investigation must propagate consistent motion through the train.**
This study does not qualify all 81 seconds-wheel teeth, all train phases or the
barrel boundary. Splitting a visibly rigid wheel/pinion packet, hiding teeth or
allowing penetration is not part of this candidate.

## Hairspring geometry and attachments

Original d116 contains a 1.390016 mm³ spring solid plus the separate tiny staff
cylinder mentioned above. Its planar coil comprises **14.383855 turns**, modeled
by paired original cylindrical faces. The strip is **0.035 mm wide and 0.215 mm
high**, with a sampled centerline length of **171.017339 mm**. Its raised outer
terminal is retained in its original position and shape.

The inner end is not simply attached at its endpoint: the source collet embeds
the strip around **0.231–0.500 mm of centerline arclength**. The model keeps the
first **0.60 mm** rigid with the balance/collet and the final **0.50 mm** of planar
coil fixed with the raised terminal. This preserves the existing attachment
overlap instead of treating it as a collision to remove.

The unchanged terminal intersects the bridge-mounted stud occurrence
`…83_59__0_1_1_221_4` and original pin d118. The other stud occurrence
`…83_7__0_1_1_108_4` is 0.010096 mm clear of the spring. Both placements are retained;
their source duplication is not resolved by this animation study. The geometry
supports using a fixed terminal, not a reviewed manufacturing/fastening claim.

## Deformation candidate

An offline planar strip model rotates the inner attachment, fixes the outer
attachment, and preserves every centerline segment's length. It adjusts 32 smooth
tangent-angle modes to satisfy the endpoint constraints while minimizing a
quadratic change-of-bending proxy. The remaining original raised terminal stays
fixed. This produces a breathing coil without stretching it radially as a whole.

This is an **authored geometric deformation**, not a solved physical spring.
There is no material model, stress calculation, restoring torque, measured
frequency, amplitude prediction or three-dimensional elastic equilibrium.
The ±180° amplitude remains the earlier diagnostic choice, offset by the
candidate balance center of +2.385807° from source.

Results from 38 configurations spanning both extrema, source zero and candidate
center:

- Every ribbon is valid and every centerline is simple. Minimum measured
  nonlocal strip gap is **0.094051 mm**; maximum coil centerline radius is
  **3.558189 mm**.
- Endpoint residual is below 8×10⁻¹³ mm and maximum segment-length error below
  2×10⁻¹⁵ mm in the discrete model. These are numerical constraints, not physical
  precision claims.
- Five original-solid sections through the strip height show no new overlap with
  the ring, train bridge, balance rim, staff or balance bridge. The free strip
  clears the collet; the attachment's maximum section overlap stays at its
  original **0.004689881 mm²**, varying by less than 2×10⁻¹⁵ mm² across the poses.
- A cylindrical envelope containing all sampled coil ribbons, padded by 0.1 µm,
  additionally has zero solid-common volume with those five non-collet bodies.
  Its radii are 0.479315–3.575789 mm. Because the envelope is axisymmetric, these
  balance-rim/staff results hold for any rotation of those two rigid parts; the
  coil deformation itself remains sampled.
- **284 local 3D distance checks** compare polygonal strip prisms against the
  unchanged raised-terminal faces. No intersection was found outside the fixed
  final attachment region. Together with per-face bounding exclusions, the
  conservative gap lower bound is **0.050219 mm**. Queried distances alone have
  a larger minimum, 0.119621 mm; that larger number is not a whole-terminal bound.
- Doubling arc sampling from 200 to 400 subdivisions at four diagnostic angles
  changes the centerline by at most **0.000005588 mm**, with valid ribbons and
  positive interturn gaps. This checks discretization sensitivity of this model,
  not its physical correctness.

The 80-frame looping `spring-preview.gif` solves each displayed pose offline;
it illustrates the spring and collet only. It uses a deliberately slowed eight
seconds per oscillation. It is not a new app page, operating-rate proposal or
performance benchmark. A runtime deformation implementation and interpolation
between stored poses still need their own acceptance checks.

## Reproduce and next action

Use the existing CAD environment, dependencies and hash-checked outputs from the
preceding clearance study. This relies on retained private originals/cache; it
is not a clean-machine reconstruction. Commands write ignored local evidence:

```sh
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/interfaces.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/spring.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/spring_interfaces.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/spring_terminal.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/spring_attachments.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/train_boundary.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/render_envelopes.py
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/spring_preview.py
.venv-cad/bin/python scripts/cad/escapement-clearance/record_interfaces.py
```

Before application integration: qualify the coupled train through its upstream
boundary, then implement and verify a separate spring deformation representation
and smooth timing in the existing view. Fitted-case/hand presets, separation and
other product states, continuous collision freedom and sustained rendering are
not established here. Original CAD tolerances prevent treating nominal gaps as
manufacturing settings. Existing [release gates](RELEASE_GATES.md) still apply.
