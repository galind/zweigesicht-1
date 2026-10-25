# Desk-level holders and stairs — design C, 24 October 2026

The owner now wants holder bases on the desk, no recesses or ramps, and permits
stairs and a jump into each movement. This supersedes the earlier preference for
level, jump-free entry. Design only; no application or runtime assets changed.

Local sketches: [first-person views](../artifacts/desk-stairs-concept/experience.png)
and [plan, cuts and stair sections](../artifacts/desk-stairs-concept/plan-and-sections.png).

## Proposed arrangement

One 116 × 92 mm muted worktop. The two stair toes are about 7.5 mm apart and
visible from the desk arrival. Bridge/dial centres are (−26, 0) / (24, −12) in
desk X/Z, with whole-station yaw 100° / 60°. Separate straight stairs lead to
small pads on the holder rims. No promenade, rails, props or supporting terraces.

| Dimension, mm | Bridge | Dial |
| --- | ---: | ---: |
| Remove original material below source height | 10.1 | 9.3 |
| New connecting base thickness (study value) | 1.0 | 1.0 |
| New holder height above desk | 5.9 | 6.7 |
| Preserved seat height above desk | 3.7 | 5.4 |
| Whole seated assembly vertical shift | −9.1 | −8.3 |
| Lowest movement point above desk | 1.290 | 1.340 |
| Nominal clearance above new base | 0.290 | 0.340 |
| Number of stair risers | 30 | 34 |
| Riser height | 0.1967 | 0.1971 |
| Stair run, excluding 3.8 mm top pad | 13.5 | 15.3 |
| Hop between selected foot positions | 1.876 | 2.074 |
| Landing height relative to rim | −0.2 | +0.7 |

Both stairs use 0.45 mm treads and 2.8 mm width. At the fixed visitor scale these
remain real flights of stairs, not a few oversized steps. The arrival shows that
the holder bodies still screen much of the mechanism until the visitor climbs.

## Holder and landing evidence

The actual seated CAD bounds permit a shallower floor than the original cavity
floors. Remove the old lower body and floor; retain the upper seating shoulders,
finger profiles and crown relief. A new flat base connects the separated fingers
and supplies the new cavity floor. The entire seated movement and crown translate
with the retained support profile. Original source files are preserved.

The 1 mm base and roughly 0.3 mm underside clearances are design-study values,
not manufacturing tolerances or a strength qualification. Finger flexibility,
fastening holes, stiffness and a valid connected derivative solid need mechanical
review. Existing crown/holder interference remains explicitly unresolved.

The bridge stair faces a lower perimeter plate patch, rather than the previous
high bridge entrance: station-local X/Z (−13.1, 9.4), original presentation Y14.8.
The dial target is (−15.8, −2), original Y15.7. Both support the unchanged capsule
in a one-second stationary check. Two synthetic jumps from original holder rim
Y15, radius 18 mm, land grounded within 0.013 mm horizontally of the selected
targets. They use the original jump/gravity/speed and release forward input after
the required travel. Whole-station rigid translations preserve these relative
upper-surface trajectories. These checks do not qualify new stair traversal,
human jump timing, subsequent movement exploration or mechanical support.

Evidence and reproducible local scripts are in `artifacts/desk-stairs-concept/`:
`surface-probe.json`, `landing-probe.json`, `standing-probe.json`, `hop-probe.json`,
`study.json`, and `source-integrity.json`. All 227 occurrence matrices per station
remain unchanged in the sketch, including reviewed phases and original crowns.
Three unaltered-height camera captures use the existing 68° vertical FOV and
0.035 mm near plane. Desk arrival is at feet Y0 / eyes Y1.48; stair-top eyes are
Y7.38 / Y8.18, always 1.48 mm above the standing surface. Visitor height is 1.65 mm.

Next: owner review of these sketches. Implementation, fabrication and publication
are outside this task.
