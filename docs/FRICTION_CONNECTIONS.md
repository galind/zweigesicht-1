# Display-train friction connections — 27 October 2026

**28 October implementation follow-up:** [both display trains now move](REAR_DISPLAY_ANIMATION.md)
under documented sticking assumptions at 93/137 and 214/217, with the two reviewed
rear packet phases installed. Hands remain static. The research below is
historical; its source-fit, sampled/continuous and physical-acceptance limits remain.


This source-only follow-up to [the motion-work study](MOTION_WORKS_STUDY.md)
investigates the center-to-cannon interface and cross-face shaft interface.
**The mating geometry is confirmed; a normal-running 1:1 drive at both interfaces
is a supported interpretation, not an explicit maker-confirmed constraint.**
The available source does not settle their friction/setting behavior. In
particular, calling the second interface a slipping friction clutch would go
beyond the evidence: it may instead be a permanent interference fit.

The app, geometry, phases and all moving/static boundaries are unchanged from
`a62c820`. No setting simulation or motion is added. The two reverse running-mesh
conflicts in the earlier study remain independently unresolved. This report
does not certify loaded operation or physically self-sustaining motion.
The later [reverse-mesh diagnosis](REVERSE_MESH_DIAGNOSIS.md) investigates phase
alternatives separately; the joint-state evidence limits here are unchanged.

## Primary evidence inspected

The maker's [model description](https://www.marcolangwatches.com/de/uhren/)
describes hours/minutes on both faces and a second additional motion works.
That confirms the intended display functions, not a particular joint constraint.
The inspected [downloads page](https://www.marcolangwatches.com/en/downloads-2/)
and five component pages provide images, models and general presentation
material; no interface-specific assembly/fit instruction was found there.
This is a statement about those inspected sources, not all maker documentation.

The independently downloaded component STEP solids were compared with the
original assembly's corresponding definition solids, without placement or
geometry edits. Both Boolean differences are zero-volume for each pair and all
eight input solids and eight difference results pass the BRep validity check.
Face counts, volumes and bounds agree to numerical precision. This corroborates
the assembly geometry at the CAD kernel's resolution; it is not a manufacturing
tolerance or proof of byte-identical STEP files.

| Definition | Maker component source | Faces in both solids | Source minus separate / separate minus source, mm³ |
| --- | --- | ---: | ---: |
| 93 | [Minutentrieb z12 m0,15](https://www.marcolangwatches.com/cad/ml01-minutentrieb-z12-m015/) | 120 | 0 / 0 |
| 137 | [Viertelrohr1 z12 m0,177](https://www.marcolangwatches.com/cad/ml01-viertelrohr1-z12-m0177/) | 83 | 0 / 0 |
| 214 | [Zeigerwerkswelle2](https://www.marcolangwatches.com/cad/ml01-zeigerwerkswelle2/) | 13 | 0 / 0 |
| 217 | [Wechseltrieb3 z8 m0,12](https://www.marcolangwatches.com/cad/ml01-wechseltrieb3-z8-m012/) | 61 | 0 / 0 |

The four accompanying JPGs are CAD renders, not dimensioned manufacturing
drawings. The separate [alt Viertelrohr1](https://www.marcolangwatches.com/cad/alt-ml01-viertelrohr1/)
has a smooth, toothless body and a 24-face solid. Its name and different geometry
do not authorize substituting it for definition 137; it was not installed.

The STEP files identify Solid Edge and Marco Lang. The four component exports
explicitly record zero PMI annotations and zero PMI views. Entity-type inspection
found no encoded kinematic pair, friction, torque or dimensional-tolerance
entities. The assembly's only matching draughting entities are predefined
colours, not joint or dimension data. The geometry export therefore cannot be
treated as the native CAD's complete mechanical constraint model.

Source URLs, SHA-256 hashes, exact occurrences, numerical results and local
evidence hashes are in [the provenance](../assets/source-manifest/friction-connections.json).
Original downloads and detailed CAD output remain ignored locally.

## Center shaft 93 → cannon pinion 137

The exact original occurrences have the shared prefix
`p_0_1_1_1__0_1_1_1_4__0_1_1_83_`:

| Part | Occurrence suffix | Parent membership | Local Z in world |
| --- | --- | --- | --- |
| Center pinion/shaft 93 | `3__0_1_1_92_1` | Center assembly 92, with 94/95 | −Z |
| Cannon pinion 137 | `20` | Individual leaf under movement 83 | +Z |

At world XY (0,0), the cannon's bore (face 63) has radius **0.375 mm** and extends
from Z −1.44 to +0.33 mm. The shaft has two matching cylindrical lands (faces
79/83), separated by a reduced circular waist and transitions. Their shared
axial intervals are approximately −1.44…−0.34736215 and
−0.003280405…+0.146719595 mm: **1.24263785 mm total nominal cylindrical contact
length**. These are analytic surface endpoints, not tolerance-expanded bounds.
The previous whole-solid query found contact to numerical precision and zero
common volume; nearby center wheel 94 and washer 95 are separated from 137.

The exact mating surfaces, cannon identity, outer annular groove and display
train support a friction-drive interpretation. The exported bore is circular,
however; it does not encode a pinched/lanterned bore, a key, preload, fit
tolerance or slip torque. An annular groove is not itself proof of a particular
friction treatment. The separate maker file reproduces this same geometry.

If this interface sticks during normal running, **Δθ137 = Δθ93 in world Z**,
and cannon 1 completes a revolution in one hour. In their definition-local
coordinates, the increments have opposite signs because their local axes are
reversed. A shared axis or static contact alone would not establish this rule;
the intended drive interpretation also uses the component identity and connected
display function. Explicit confirmation of the normal-running/setting states
is still missing from the inspected maker sources.

## Cross-face shaft 214 → pinion 217

| Part | Occurrence suffix, same prefix | Parent membership | Local Z in world |
| --- | --- | --- | --- |
| Motion-work shaft 214 | `56__0_1_1_212_2` | Motion works 2: 213/214 | −Z |
| Motion-work pinion 217 | `57__0_1_1_215_2` | Motion works 3: 216/217 | −Z |

The two source assemblies are separately named riveted packets; they are not
declared one rigid assembly. At world XY (0,5), shaft face 6 is an analytic cone:
radius **0.140 → 0.145 mm** over Z **−5.73 → −4.95 mm**, with semi-angle
0.00641016861 radians. Pinion bore face 59 has radius **0.130 mm**, over Z
**−5.66 → −5.00 mm**, with end chamfers. Across that cylindrical bore, the shaft
radius is **0.140448718 → 0.144679487 mm**: nominal radial interference
**0.010448718 → 0.014679487 mm** (diametral 0.020897436 → 0.029358974 mm).
The calculation evaluates the cone at the bore's analytic endpoints; it is not
a section sample or an elastic deformation result.

The earlier source-solid common volume is **0.007245609 mm³**. Shaft 214 clears
wheel 216 by **0.251085 mm**, so the actual fitted candidate is pinion 217's bore,
not the neighboring wheel. The independently downloaded shaft and pinion
reproduce the same interference, ruling out a different standalone component
variant as an explanation at this resolution.

This is stronger evidence for an intended fitted connection than coaxial
placement alone. It supports **Δθ217 = Δθ214 in world Z** during normal running;
both local axes are −Z, so their local angle increments also agree. With the
upstream drive engaged, both packets have a three-hour revolution period.
It does **not** determine whether the fit is permanent, adjustable during
assembly, intentionally slipping during setting, or a simplified nominal CAD
fit. The interference magnitude is recorded as source evidence, not endorsed as
a manufacturable fit. Letting this connection slip continuously to freeze the
reverse train remains unsupported.

## Decision and remaining confirmation

| Interface | Directly confirmed | Supported normal-running interpretation | Still unresolved |
| --- | --- | --- | --- |
| 93/137 | Exact mating lands/bore, separate occurrences, independent solid agreement | Friction drive; world ratio +1; 1 h output | Maker's sticking/setting rule and friction treatment |
| 214/217 | Taper/bore interference, exact fitted leaves, independent solid agreement | Fitted drive; world ratio +1; 3 h output if upstream engaged | Permanent press fit versus adjustable/slipping fit; maker's joint specification |

Missing torque values do not by themselves imply an unknown *kinematic ratio*:
a sticking circular fit gives 1:1. They prevent claims about load capacity or
physical self-sustaining operation. The remaining evidence gap for prescribed
kinematics is whether the maker intends that sticking state at each interface
during normal running; the geometry supports that inference but does not
explicitly declare it. This refines the earlier blocker wording without
promoting an inference to source-confirmed coupling.

An unequivocal answer needs a maker drawing, assembly/service instruction or
maker statement identifying (1) whether 93 drives 137 without slip in normal
running and where setting slip occurs, and (2) how shaft 214 is secured in 217
and whether that fit is intended ever to slip. No message has been sent.
Even confirmation of both would leave the independently observed 183/216 and
217/187 running-mesh conflicts to resolve. App implementation remains paused
at the user's requested research boundary.

## Reproduction and validation scope

The focused local CAD calculation was explained before execution because exact
source fit identification and comparison cannot be obtained from a browser pose
or CI without the retained ignored originals. It reuses the existing OCP
environment and original-solid cache. With the source/cache files from the
motion-work study and downloaded inputs at the paths recorded in provenance:

```sh
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/friction_connections.py
```

The script verifies source/download/cache hashes, cache kernel version and
occurrence matrices, then performs the four two-way Boolean comparisons and
records analytic surfaces and STEP metadata. Its output is
`artifacts/friction-connections/comparison.json`. The assertions passed.
This is fit/source validation, not a new running-clearance or lifecycle test.
Earlier running-clearance limitations remain unchanged. No app test, build,
browser automation, source alteration or new animation was needed for this
research-only follow-up. Git review confirms no application or authored-pose
changes relative to the starting milestone. No push or publication.
