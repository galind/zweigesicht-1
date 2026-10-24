# Wheel contact review — 24 October 2026

One static phase correction is justified: rotate transfer wheel **d96** by
**+6.25° about its original local Z bore axis**. This clears its contacts with
barrel II d85 and center pinion d93 without changing either neighbor. Ten other
non-coaxial solid contacts remain at their original poses. They are recorded
findings, not a conclusion that the maker's manufactured movement is defective.

The decision and source/evidence hashes are in
[wheel-contact.json](../assets/source-manifest/wheel-contact.json). The separate
[display override](../assets/authored/wheel-display-poses.json) is applied by
`WheelDisplayPose.ts` in explorer, Workshop and walking. Original STEP downloads,
GLBs, triangle buffers, source transforms and Workshop base target poses stay
unchanged. There is no source repair, mesh replacement, tooth reshaping, axis
movement, scaling, tooth-count change or visibility workaround.

## Source, identity and method

The input is the recorded `ml01-zweigesicht.stp`, SHA-256
`f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`.
Its original download URL remains in [sources.json](../assets/source-manifest/sources.json).
No new download or design variant was substituted.

`scripts/cad/wheel_contact_probe.py` resolves each XCAF definition directly from
the original STEP and independently recomposes the source occurrence chain.
All 223 movement leaf matrices match the runtime source manifest exactly.
The 26-occurrence survey selects source names declaring teeth plus the escape
wheel and coupling pinion. It considers 325 pairs, rejects 280 by original BRep
bounds, and performs common-solid/distance checks on 45. This is a gear survey,
not an exhaustive movement contact or escapement qualification.

All source and local matrices, XCAF paths, names, validity, solid counts and
common bounds are saved in `artifacts/wheel-contact/survey.json`. Definition
`d_0_1_1_N` resolves to original STEP label `0:1:1:N`. The source manifest retains
the complete hierarchy; row-major matrices multiply column vectors, in mm.

Positive **closed-solid** commons are checked for valid topology and measured
with adaptive surface integration (requested relative integration error 1e-9).
The reporting threshold, 1e-8 mm³, is numerical bookkeeping, not a physical
tolerance. Individual common-solid centroids are independently classified
inside both original solids; distances to both original boundaries give
interior-depth witnesses, not maximum penetration depths.

Every non-coaxial finding has interior witnesses in both the existing
0.015 mm / 0.25 rad meshes and independently tessellated 0.002 mm / 0.08 rad
meshes. Original-solid overlap therefore cannot be dismissed as coarse mesh
chords. Three orthographic close-ups per resolution remove perspective as an
explanation. The red overlays are the tessellated original-solid common, not
screen-space overlap. Refinement is diagnostic only and is not shipped.
Meshopt verification also confirms unchanged decoded geometry and placements.

## Confirmed pairs

The occurrence IDs below append the listed suffix to
`p_0_1_1_1__0_1_1_1_4__0_1_1_83_`. Thus `4` is the complete d96 occurrence
`p_0_1_1_1__0_1_1_1_4__0_1_1_83_4`. Full IDs, names and numerical results are
also in the source record; full transforms are in the local survey and original
runtime manifest. Each row has a local `<pair>.png` close-up and interior
witness measurements in `details.json`.

| Definitions / components                         | Occurrence suffixes                   | Source common (mm³) | Final decision                           |
| ------------------------------------------------ | ------------------------------------- | ------------------: | ---------------------------------------- |
| d85 barrel II / d96 transfer wheel               | `1__0_1_1_84_1` / `4`                 |         0.036083741 | Cleared by d96 phase                     |
| d90 barrel I / d249 crown wheel                  | `2__0_1_1_89_1` / `74`                |         0.040314891 | Source pose retained                     |
| d93 center pinion / d96 transfer wheel           | `3__0_1_1_92_1` / `4`                 |         0.010153667 | Cleared by d96 phase                     |
| d94 center wheel / d237 third pinion             | `3__0_1_1_92_2` / `63__0_1_1_236_1`   |         0.010055919 | Source pose retained                     |
| d97 coupling wheel / d249 crown wheel            | `5` / `74`                            |         0.009449354 | Source pose retained; perpendicular axes |
| d131 ratchet wheels                              | `14` / `15`                           |         0.060692779 | Source poses retained                    |
| d137 cannon pinion 1 / d210 motion-works wheel 1 | `20` / `55__0_1_1_209_1`              |         0.008949716 | Source pose retained                     |
| d141 hour wheel 1 / d211 motion-works pinion 1   | `26__0_1_1_140_1` / `55__0_1_1_209_2` |         0.015449548 | Source pose retained                     |
| d187 hour wheel 2 / d217 motion-works pinion 3   | `40__0_1_1_186_1` / `57__0_1_1_215_2` |         0.000010340 | Source pose retained; small contact      |
| d210 / d213 motion-works wheels 1 and 2          | `55__0_1_1_209_1` / `56__0_1_1_212_1` |         0.002357596 | Source pose retained                     |
| d234 escape pinion / d243 seconds wheel          | `62__0_1_1_232_2` / `65__0_1_1_241_2` |         0.005208178 | Source pose retained                     |
| d238 third wheel / d242 seconds pinion           | `63__0_1_1_236_2` / `65__0_1_1_241_1` |         0.005892812 | Source pose retained                     |

These are tooth-region solid penetrations at the supplied static poses, beyond
ordinary overlapping pitch/addendum envelopes. Their existence is established;
the manufacturing intent, loaded contact and correct coupled clocking are not.
For d187/d217, the verified interior depth is only about 0.000923 mm. Its positive
source common persists in both mesh resolutions, but no tolerance conclusion is
drawn from that small nominal-model result.

Five coaxial joints are deliberately separate: d93/d94, d210/d211, d216/d217,
d237/d238 and d242/d243. Their positive commons occur in assembled wheel/pinion
joints, not external tooth engagement. Do not rotate the wheel and pinion
independently to eliminate those joints or infer a defective fit from them.

**d144 is an open shell, with zero solids.** Its intersection with setting wheel
d172 has a nonzero raw surface volume integral (~0.0002684 mm³), but no common
solid. The probe records both quantities and does not label this a confirmed
solid penetration. Closing or replacing that shell needs separate source review.
Other apparent overlaps are disjoint in BRep: for example d85/d94 has a
0.067194 mm gap, d90/d94 0.065133 mm, and d183/d216 0.001482 mm. Projected overlap
or overlapping bounding boxes alone did not qualify a correction.

## Why this one correction is accepted

d96 is a single, independently mounted transfer wheel. Original bore face 140
has radius 0.2625 mm, centered at local X=Y=0. Its local +Z is world +Z. The source
matrix is a pure translation to
`[-2.6790503757237, 0.972208354384323, -2.070000000000007]` mm.
The corrected matrix is **source × Rz(+6.25°)**; the source record includes both
full matrices. The cylinder, bore axis, Z intervals, and every vertex's distance
to that axis are preserved.

The original center distances are 7.95 mm to d85 and 2.85 mm to d93, consistent
with the source names' declared z80/z26/z12 and module 0.15. This supports expected
engagement at those axes; the names alone are not an independently measured gear
specification. A 145-angle diagnostic sweep over one d96 tooth pitch selects a
phase inside a sampled clear interval. Original BRep tests, rather than the
section sampling, establish both final pair clearances:

| Pair      | Before common (mm³) | After common (mm³) | After minimum solid distance (mm) |
| --------- | ------------------: | -----------------: | --------------------------------: |
| d85 / d96 |         0.036083741 |                  0 |                       0.026970969 |
| d93 / d96 |         0.010153667 |                  0 |                       0.022584202 |

`review-wheel-contact.mjs` independently checks the actual Meshopt-decoded runtime
triangles with BVHs. Both source pairs intersect before; neither intersects
after. Their rendered mesh gaps are 0.027128 mm and 0.022821 mm respectively.
All ten unresolved pairs keep identical before/after mesh results, and all 222
overview mesh buffers retain their original position/normal/index bytes.

See `artifacts/wheel-contact/transfer-wheel-before-after.png`. This is a valid
unloaded static phase choice, not a reconstruction of the maker's precise
clocking or a simulated running position under torque. No wheel is moved along
its axis or between axes to manufacture clearance.

The before/after neighborhood review covers all 364 other source leaves:
349 are broad-phase exclusions using recorded mesh bounds padded by 0.05 mm;
14 nearby candidates receive original-solid Boolean/distance checks. The one
empty assembly diamond is checked separately using its hash-verified maker STL,
which is disjoint by over 7.9 mm along Y. The 14 exact neighbors are d26, d70,
d85, d88, d93, d99, d137, d139, d195, d196, d198, d213, d230 and d150.
No tested common volume increases. Mainplate d195 retains a 0.137886 mm gap;
center bridge d230 retains 0.030000 mm. d139's existing simplified screw-fit
overlap (~0.169872 mm³) and d196's zero-distance contact are preserved, not
certified. Missing/invalid source surfaces and broad-phase bounds remain explicit
limits; this is not an exhaustive physical clearance guarantee.

## Runtime behavior and evidence

The same helper applies the separate override exactly once from the immutable
base pose in each experience. Explorer keeps `assembled` and the manifest raw;
`displayMatrix` carries the phase through assembly, separation, All parts, resets
and catalog loading. Its raw-source error intentionally exposes the deviation;
the presentation error remains zero. Workshop keeps its base target manifest and
save/dependency format, and derives both seat mesh and bounds from the corrected
pose. Walking builds and synchronizes collision transforms from the same posed
mesh, including both holder sides.

The local evidence directory includes baseline/final browser reports, Workshop
and walking screenshots, source hashes, original-solid measurements, refined
meshes, phase samples, and before/after sections. None of these local generated
CAD/evidence files is committed or published. Validation results are recorded in
[PROGRESS.md](../PROGRESS.md).

## Reproduction and remaining decisions

Use the retained CAD environment and source/cache inputs described in
[CAD notes](CAD_NOTES.md). The plotting stages also use the existing local
Matplotlib 3.11.1 installation; no application dependency or CAD lock was changed.

```sh
.venv-cad/bin/python scripts/cad/wheel_contact_probe.py survey
.venv-cad/bin/python scripts/cad/wheel_contact_probe.py details
.venv-cad/bin/python scripts/cad/wheel_contact_probe.py phase --pairs 85-96
.venv-cad/bin/python scripts/cad/wheel_contact_probe.py candidate
.venv-cad/bin/python scripts/cad/wheel_contact_probe.py validate
.venv-cad/bin/python scripts/cad/wheel_contact_probe.py views
node --test tests/*.test.mjs
node scripts/cad/review-runtime.mjs
node scripts/cad/review-wheel-contact.mjs
node scripts/play/validate-inventory.mjs
node scripts/play/fixed-access-check.mjs
```

All probe outputs go to ignored `artifacts/wheel-contact/`. A complete survey is
distinguished from `.partial.json` checkpoints. Phase candidates never write
runtime overrides automatically. The optional `--pairs` selection can investigate
other confirmed parallel-axis pairs; it does not solve a coupled train or qualify
perpendicular crown-wheel contact. Use only headless browser runners for this
review; the bench collision runner accepts `PLAY_QA_OUTPUT` for local evidence.

The remaining ten pairs retain identical before/after geometry and poses, so
their measured commons are unchanged. Next options are to investigate coherent
wheel/pinion packet phases and all their neighbors, or seek maker/mechanical
review where clocking is constrained by ratchets, setting states or escapement
contact. In particular, review both crown-wheel interfaces together and keep the
ratchet/click relationship; do not apply isolated pair phases blindly. Closing
d144's shell, modifying tooth profiles or moving any axes is not justified by
this review. Static visual clearance is not mechanical certification, and the
existing release gates remain in force.
