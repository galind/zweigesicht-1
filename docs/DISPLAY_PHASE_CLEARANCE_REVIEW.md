# Connected display-train phase and clearance review

27 October 2026. Research baseline: `35c7835` on
`codex/escapement-clearance-study`.

**The two diagnostic phase candidates coexist across the complete conditional
display train without a newly demonstrated collision in this review. This is
not authorization or mechanical acceptance to install them.** The rear hour
mesh still has only about 45 nm nominal sampled original-solid clearance. Some
neighbor results remain sampled, original overlaps/contact fits remain, and the
two joint states still lack explicit maker confirmation.

All seven display packets and the hands remain static in the app. All **126
tracked app/authored files** are byte-identical to the baseline. No phase, gear,
clock, display geometry, tooth profile, shaft position or lifecycle behavior was
changed. This is a review of prescribed kinematics, not self-sustaining motion.
[Provenance](../assets/source-manifest/display-phase-review.json) records source
identities, hashes, pair-level findings and limitations. Detailed generated
evidence stays ignored under `artifacts/display-phase-review/`.

## Jointly applied candidate phases

The [source occurrence review](MOTION_WORKS_STUDY.md#source-identity-and-exact-packets)
and its hash-verified XCAF evidence establish the exact 13 leaves in seven
packets. The source SHA-256 remains
`f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`.
No neighboring or merely coaxial component is incorporated into a packet.

The phases below are world-Z offsets relative to the original source, before
the shared accumulated escape angle E is applied. They exist only in diagnostic
process memory. All periods and downstream drive are conditional on sticking
at the two interfaces described in [the friction report](FRICTION_CONNECTIONS.md).

| Packet | Source definitions | Teeth | Diagnostic world phase | Angle / E | Mean revolution period |
| --- | --- | --- | ---: | ---: | ---: |
| Cannon pinion 1 | 137 | 12 | +3.3° unchanged | −1/540 | 1 h |
| Motion works 1 | 210, 211 | 36 / 10 | +0.8° unchanged | +1/1620 | 3 h |
| Hour wheel 1 and hub | 141, 142 | 40 / hub | −2.95° unchanged | −1/6480 | 12 h |
| Motion works 2 and shaft | 213, 214 | 36 / shaft | 0° unchanged | −1/1620 | 3 h |
| Motion works 3 | 216, 217 | 24 / 8 | 0° unchanged | −1/1620 | 3 h |
| Cannon pinion 2 and shaft | 183, 184 | 8 / shaft | **−0.9228515625°** | +1/540 | 1 h |
| Hour wheel 2 and hub | 187, 188 | 32 / hub | **+0.27165787111074224°** | +1/6480 | 12 h |

The source/local axes and exact occurrence IDs are retained in the provenance
and preceding study. For the last two packets, local Z is reversed: their local
phase increments are +0.9228515625° and −0.27165787111074224°. The hour candidate
is +0.02165787111074224° beyond its current world display phase.

The inlet remains center 93 → cannon 137 (conditional 1:1); then external meshes
137/210, 211/141 and 210/213. The second conditional 1:1 interface joins shaft
214 to pinion 217. The two rear meshes are 183/216 and 217/187. All external
meshes reverse world angular direction. The three front interfaces retain their
existing phases. No slip is invented to detach one train from the other.

For 183/216 the invariant follower phase is
`phase216 + (8/24) * phase183 = −0.3076171875°`. For 217/187 it is
`phase187 + (8/32) * phase217 = +0.27165787111074224°`.
These exactly recover the two previously reviewed isolated candidates while
keeping the riveted 216/217 packet intact. Their complete material-orientation
periods are 3 h and 12 h. The other three mesh periods are 3 h, 12 h and 3 h.
The complete conditional display subsystem repeats its material orientations
in 12 h; that is not the repeat period of the entire main train.

## Mesh evidence and actual runtime transforms

The original-solid geometry, axes and relevant phases remain hash-identical to
the preceding reviews. Thus the three front full-period polygon reviews and the
two rear candidate polygon covers remain applicable under the phase invariants
above. They were checked against their recorded hashes, not represented as new
CAD sweeps. The reverse evidence retains a 0.002453052 mm continuous polygon
lower bound for 183/216 and approximately 0.0000010419 mm for 217/187.
These bounds apply to planar polygons, not whole analytic solids or manufactured
teeth. Selected original solids retain minima of 0.002819566 and 0.000045141 mm.

A new isolated Node review decodes the actual overview/catalog geometry and
instantiates the production `RunningMovement` with all seven hypothetical
packets, alongside the existing main train. It uses the production active-time
pose and accumulated escape angle, applies ratios before final modulo, preserves
recoil and changes no application metadata. Both meshes in each query receive
BVHs without changing vertex buffers. Complete relative-period triangle samples:

| Interface | Triangle-intersection configurations | Intersections |
| --- | ---: | ---: |
| 137 / 210 | 6,913 | 0 |
| 211 / 141 | 7,681 | 0 |
| 210 / 213 | 6,913 | 0 |
| 183 / 216 | 4,609 | 0 |
| 217 / 187 | 6,145 | 0 |
| **Total** | **32,261** | **0** |

These are sampled full-triangle tests, not continuous swept-volume certificates.
Distance is queried at nine separate period samples per mesh, plus **12 explicit
rear source-critical witnesses**, including both fine rear-hour limiting poses.
All 12 witnesses are triangle-intersection-free. Their smallest runtime gap is
0.000286633 mm; tessellation does not resolve or supersede the much smaller
45 nm original-solid margin.

Independent point rotations at 0, 0.017, 1/3, 123.456, 10,800, 43,200 and
1,000,000,000 active seconds agree with the actual controller within
**1.30×10⁻¹⁰ mm**. Within-packet relative matrices remain constant to
**1.34×10⁻¹⁵**. Reversed local axes and long accumulated angles therefore do
not introduce a new relative-phase error in these checks.

## Complete neighbor inventory and its limits

The review considers every one of the 13 candidate leaves against all **365
source leaf occurrences**, plus all **15 authored fitted-hand poses**. Hand
transforms come from the production `handDisplayMatrix`; each variant is a
separate fixed obstacle, not an assertion that alternative hand styles coexist.
Source case/dial placements are included. Existing rotating train members use
their actual ratios, rather than being frozen as neighbors. Same-packet pairs
are handled by rigidity and the five gear meshes by the mesh reviews above.

Full-turn boxes exclude **4,516 pairs**. **231 remaining candidate pairs** receive
the following treatment:

| Result | Pairs | What the evidence establishes |
| --- | ---: | --- |
| Full-turn cylinder enclosure | 113 | Empty nominal BRep intersection between a conservative moving enclosure and the fixed neighbor; not a measured positive clearance |
| Annular radial bound | 8 | Positive separation for every orientation, including long-period main-train neighbors |
| Constant relative pose | 3 | No solid common at the invariant conditional relative transform; contact may remain |
| Sampled nonpenetration | 101 | No solid common at checked poses through the complete relative period; no continuous clearance claim |
| Retained original overlaps | 6 | Pre-existing common volume does not increase in checked poses; these are not mechanically accepted fits |

There are **9,578 neighbor configurations**, including **9,434 sampled BRep
common-volume queries**, in addition to baseline and enclosing-bound operations.
The fastest member advances by at most 10° between neighbor samples. Sampling
periods use exact rational ratios and the complete pair material repeat; no
long-period pair is truncated. Long-period contacts that would require up to
233,280 intervals instead clear by continuous annular bounds. The smallest such
radial bound is **0.062852 mm**.

Enclosures use unsliced full-body, tolerance-expanded BRep boxes with a 1 µm
guard; empty enclosing intersections are corroborated by original-body common
queries. Refined annular bounds use original faces whose bounds reach the common
Z interval, capped by containing cylinders verified by original-solid subtraction.
Inner face-axis distances are used only after confirming that the complete solid
clears the axis. These remain nominal CAD-kernel statements, not
manufacturing tolerance guarantees. A zero recorded separation lower bound is
not a measured zero clearance. Whole-body positive distances were not computed
for every sampled neighbor configuration.

A preliminary slab-clipping shortcut returned misleading empty shapes for two
shaft/bushing overlaps exposed by the runtime cross-check. **All 154 preliminary
slab-based enclosure/radial exclusions were discarded and recomputed.** No final
bound relies on clipped source solids. Rejected preliminary output is retained
separately for provenance; it is not accepted evidence.

All candidates clear the prior reviewed moving free-coil envelope by full-turn
boxes, minimum **2.633156 mm**. Full-turn boxes also separate them from the valid
balance and pallet leaves. The raised spring terminal retains the source-neighbor
screen. This inherits the existing spring-envelope limitations; it does not add
a new elastic or continuously solved spring model.

**91 pair entries remain unqualified** because of invalid/non-solid source
occurrences: d27, four d111 occurrences, d144 and the empty source diamond d225.
Meshes do not repair or qualify those BReps. Existing rendered eccentric/diamond
recovery evidence remains separate. Product transitions, case-lug travel and
Bench visitor collision behavior are not newly certified by this internal-gear
review; unchanged lifecycle evidence remains in [RUNNING_MOVEMENT.md](RUNNING_MOVEMENT.md).

## Original overlaps and runtime surface contacts

No sampled neighbor develops more solid common than its authored baseline.
Six occurrence pairs retain overlap:

| Pair | Maximum common volume, mm³ | Interpretation |
| --- | ---: | --- |
| Hour hub 188 / hand component 12, two source occurrences | 0.003737971659 each | Existing hand/hub source overlap; not proof of intended fit or permission to drive hands |
| Cannon shaft 184 / hand bushing 8, two source occurrences | 0.000857458139 each | Existing shaft/bushing overlap, confirmed by direct whole-body checks after rejecting slab-based exclusions |
| Shaft 214 / motion pinion 217 | 0.007245608847 | Previously measured taper/bore interference; conditional relative transform stays fixed |
| Motion wheel 216 / rear dial ring 3 | 0.000627509204 | Existing source overlap retained during sampled rotation; no manufacturing or clearance acceptance |

A separate **690-pose runtime replay covers all 231 candidate neighbor pairs**,
including the actual fitted-hand matrices. Eleven occurrence pairs report
triangle-surface intersection. All eleven also intersect in the original source
and current authored static runtime poses; none is newly introduced solely by
the diagnostic phase candidates in these witnesses.

Six correspond to the original overlaps above. The other five are 137/38,
137/93, 141/195, 142/34 and 184/188. Fresh original-solid queries at the candidate
static phase give **zero common volume** and distances
from zero to **9.99×10⁻¹⁶ mm**: these are contact/tolerance interfaces, not positive
clearances. A triangle-surface intersection alone cannot establish positive-volume
penetration, and is not erased from the evidence. These results prevent describing
the entire rendered assembly as intersection-free.

## Decision and next evidence needed

The combined candidates survive the scoped connected-train review. No new
phase-induced interference was demonstrated, but **the app must remain unchanged
under this milestone**. In particular:

1. The rear-hour 45 nm nominal sampled gap is only about 4.5 times the imported
   10 nm edge/vertex tolerance. The export also declares 5 µm length uncertainty,
   which is not a manufacturing tolerance. The positive polygon bound is smaller
   still. This does not establish robust physical running.
2. 101 neighbor pairs have sampled rather than continuous whole-solid
   evidence; original overlaps, contacts and invalid solids remain explicit.
3. The intended normal-running states of center/cannon 93/137 and shaft/pinion
   214/217 remain supported interpretations, not explicit maker-confirmed joints.

Further acceptance needs maker joint/fit evidence and a source-precision or
tolerance basis for the rear-hour interface. More nominal phase tuning alone
does not resolve those limitations. No geometry repair, extra phase installation,
hand motion, winding/setting interaction, barrel-boundary change or separate
clock is proposed here. Nothing was pushed, published or deployed.

## Reproduction and validation

Local CAD and isolated runtime calculations were explained before execution:
the retained private solids and exact runtime transforms were necessary for this
review, without a push. Existing tools, cached source solids and installed
dependencies were reused. No app build, app test suite or browser automation was
needed because the application stayed byte-identical.

```sh
node scripts/movement/review-display-phases.mjs hands
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/display_phase_review.py neighbors
node scripts/movement/review-display-phases.mjs
node scripts/movement/review-display-phases.mjs neighbors
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/display_phase_review.py contacts
python3 scripts/cad/escapement-clearance/record_display_phase_review.py
```

Neighbor work checkpoints per pair. The original solids/cache and preceding
evidence must be present and hash-valid; this is not a clean-machine CAD recipe.
The recorder verifies complete pair coverage, unchanged app/authored files,
source/evidence hashes and runtime transform errors. Generated geometry and
detailed numeric output remain ignored; the report, research tools and provenance
form the local milestone.
