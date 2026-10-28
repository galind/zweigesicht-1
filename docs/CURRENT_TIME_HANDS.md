# Current local time on both displays

28 October 2026, implemented from clean `79c234f` on
`codex/escapement-clearance-study`. This is prescribed kinematics. It does not
establish physically self-sustaining operation, a working setting mechanism or
collision-free manufacture. [Provenance](../assets/source-manifest/current-time-hands.json)
records exact occurrences, axes, reference phases, source/evidence hashes and overlaps.

## Source membership and dial alignment

The unchanged `hand-display-poses.json` supplies 15 measured bore/tip pairs and
static **10:10:00 reference poses**, not midnight poses. The retained source probe
uses analytic STEP bores, axial seat intervals and the farthest original mesh
vertices as tip landmarks. Hour/minute tips point along local +X; seconds tips
point along local +Y. The original occurrence rotations differ; the fitted
correction is applied first, including the existing XY-only recentering of central
Lance seconds. Geometry, Z coordinates, materials and style choices are unchanged.

In this table, C means `p_0_1_1_1__0_1_1_1_2__0_1_1_22_` and S means
`p_0_1_1_1__0_1_1_1_1__0_1_1_2_`. Numbers in parentheses are source definitions.
The exact local bore coordinates, world bore Z, source local-Z direction, source
tip direction and authored phase correction are in the provenance for every row.

| Face/style | Hour occurrence | Minute occurrence | Seconds occurrence |
| --- | --- | --- | --- |
| Central Fine | C6 (28) | C2 (24) | C10 (30) |
| Central Lance | C14 (31) | C18 (32) | C9 (29) |
| Central Open lance | C22__0_1_1_33_2 (35) | C24__0_1_1_37_2 (39) | C25__0_1_1_40_2 (42) |
| Small Lance | S16__0_1_1_10_1 (11) | S5__0_1_1_6_1 (7) | None |
| Small Broad lance | S26__0_1_1_20_1 (13) | S20__0_1_1_15_1 (16) | None |
| Small Pear | S23 (18) | S24 (19) | None |

The seven distinct fitted bushing occurrences rotate with their corresponding
blades: central C22__0_1_1_33_1 (34), C24__0_1_1_37_1 (38),
C25__0_1_1_40_1 (41); small S16__0_1_1_10_2 and S26__0_1_1_20_2 (12),
S5__0_1_1_6_2 and S20__0_1_1_15_2 (8). Only selected styles are registered:
five blades and five bushings in each fitted configuration, 22 possible leaves.
There is no small-dial seconds hand. Loose duplicate blades and excluded rings
remain excluded. Workshop uses its existing Fine/Lance endpoints; Bench has no
fitted hands on its running movement and retains its previous behavior.

The central arbor is world XY **(0,0)**, viewed outward along +Z with up +Y.
The small arbor is **(0,7.4)**, viewed outward along −Z with up −Y. Both have
screen-right +X. Independent source marker locations corroborate these frames:
central 12/3/6/9 are C3/C21/C13/C19 at (0,15.65), (15.65,0), (0,−15.65),
(−15.65,0); small 12/3/6/9 are S27/S13/S3/S6 at (0,−0.75), (8.15,7.4),
(0,15.55), (−8.15,7.4). The central Roman numerals and both upright rendered
faces were visually reviewed. The unnumbered small dial uses its established
upright reader frame; identical dots alone do not distinguish twelve from six.

At clockwise reader angle θ, a tip points along `(sin θ, cos θ)` centrally and
`(sin θ, −cos θ)` on the small face. Thus clockwise means negative world-Z
rotation centrally, positive world-Z on the small face, regardless of reversed
source-local axes. Relative to the fitted reference, midnight's world rotations
are +305°/+60°/0° centrally and −305°/−60° on the small face. These are equivalent
modulo full turns, and are applied about the measured fitted arbors.

## Wall time, movement time and illustrative setting

Let `C` be local civil seconds in the current twelve-hour interval, including
milliseconds, `a` the unchanged visible active movement seconds and `E(a)` its
unwrapped escape phase in degrees. On each eligible existing render frame:

```
T = C + (E(a) − 54a) / 54
reader angles = T × { hour: 1/120, minute: 1/10, seconds: 6 } degrees
world increment = faceSign × (reader angle − reference angle)
reference angles = { hour: 305, minute: 60, seconds: 0 }
faceSign = central −1; small +1
```

Hours include minutes, seconds and milliseconds; minutes include seconds and
milliseconds. The central seconds hand follows the existing 81:9 seconds train,
including dwell/advance/recoil at the maker-confirmed 3 Hz / 21,600 beats/hour.
It is not a new one-second tick or uniform sweep. All three hand roles inherit
the same sub-beat residual, so the ordinary uninterrupted increments match
`−E/9`, `−E/540`, `−E/6480` centrally and `+E/540`, `+E/6480` on the rear.
100,001 samples over a balance cycle put this residual between −0.083553 and
+0.083325 seconds; this is a sampled timing range, not a new continuous CAD bound.
The tests use a conservative 0.34-second residual allowance and 0.4 seconds for
browser observation including frame latency. Accuracy is to the device clock.

Equivalently, the additional hand offset relative to its shaft is
`faceSign × rate × (C − a) − faceSign × referenceAngle`. This offset aligns the
hands on load and changes after suspension, clock correction or timezone change.
**That is an illustrative time-setting adjustment.** It does not simulate physical
slipping, winding or a functioning setting train. No gear phase is reset to follow
wall time. The seven display packets, 93/137 and 214/217 connection assumptions,
balance amplitude, escapement path/recoil, gear ratios and barrel-II boundary
remain exactly as before, with their existing evidence limits.

Civil time is read afresh using `Date` local getters on each eligible frame;
there is no incremental wall-clock accumulator, cached timezone, second RAF loop
or timer-driven rendering. Dropped frames, midnight/noon and full turns do not
accumulate drift. Angle modulo is applied after each role's rate. An ordinary
wall-clock correction may visibly reposition the hands, which is intentional.

## Presentation and lifecycle

The existing movement scheduler and eligibility conditions are unchanged.
Focus/reveal, selection, isolation and flipping keep assembled hands and gears
running. Whole separation or focused part separation freezes the last hand time.
The transform is `B A⁻¹ R A`, where A is the fitted reference and B its current
presentation pose; the frozen shaft travels with its separated part. Reassembly
must reach displayed zero separation before wall time is read again. Hidden tabs
suspend rendering and immediately resynchronize on the next eligible frame.

All-parts inventory restores the established static presentation. Workshop
remains static until completion; Undo restores its static endpoints and stops
motion. Bench remains undialed. Raw/unfitted catalog hands are never registered
for time animation. Style/visibility changes register the loaded fitted instances
without changing geometry or material policy. Selection bounds use actual animated
meshes; presentation diagnostics include hands. Restore/disposal returns all
registered matrices and clears references; it allocates no new GPU geometry.

## Moving-hand clearance findings

The previous static-hand clearance results are **not reused for changed pairs**.
Fresh original-solid review checks all 22 possible rotating leaves against the
coexisting fitted styles, source movement and case neighbors. All nine style
combinations are represented; incompatible dial alternatives are excluded.
Arbitrary hand/gear phase offsets are considered because illustrative setting
can change their relative phases. Coaxial bodies reduce to a relative full turn;
blades and their own bushings retain a rigid relative pose.

Results: **7,282 full-turn box exclusions**, 70 continuous enclosing-cylinder
exclusions, 37 continuous annular bounds, 54 sampled nonpenetrating pairs and
58 overlapping pairs; 111 candidate pairs involve invalid/non-solid source
exceptions. There are **3,507 sampled configurations**, plus baseline queries.
Non-rigid remaining candidates use 10° relative-angle steps. The 54 sampled
results do not certify the intervals between samples. The original invalid
central dial and other source defects remain unqualified; neither tessellation
nor zero common volume establishes a positive clearance.

The 58 overlaps comprise 15 retained blade/bushing fits, five retained
bushing/shaft fits, 36 rear minute/marker pairs, one broad-lance hand pair and one
central Lance minute/outer-ring pair. Full occurrence-level baseline and worst
volumes are recorded in the provenance. In particular:

| Pair | Sampled finding |
| --- | --- |
| Small Lance minute d7 / all 12 d5 markers | Up to 0.001844644 mm³ common volume |
| Small Broad lance minute d16 / all 12 d5 markers | Up to 0.002217364 mm³ |
| Small Pear minute d19 / all 12 d5 markers | Up to 0.002042952 mm³ |
| Small Broad lance d16 minute / d13 hour | 0.000077737 mm³ at +240° relative to the fitted minute reference; equivalent displayed time about **10:53:38.182** (and +12 h), before the sub-beat residual |
| Central Lance d32 minute / d26 outer ring | Already overlaps about 0.000009714 mm³ at 10:10; sampled maximum 0.000009735 mm³. The tiny variation is not a tolerance-qualified increase. |

Each rear minute blade already overlaps the 2 o'clock marker S14 in the authored
10:10 reference; rotation exposes the other eleven marker encounters. These
marker and blade contacts were not reported by the earlier gear-neighbor audit.
The broad-lance blade/blade overlap is absent at the static reference. Runtime
triangle checks corroborate it at the simultaneous reachable hand time, as well
as the marker encounters. These findings are disclosed, not corrected by changing
geometry, shaft placement, materials or gear phases.

A fresh decoded-runtime replay checks **242 triangle witnesses across 112 sampled
or overlapping pairs**. Actual production hand transforms match the independent
source witnesses within 1.78×10⁻¹⁵ per matrix entry. Surface intersections are not
solid volumes or containment tests. Unchanged gear/gear evidence remains valid;
the ~45 nm rear-hour margin, fit assumptions and physical acceptance limits remain.
No collision-free assembly or mechanically operable watch is claimed.

## Validation and reproduction

Local checks were explained before execution because no push/CI run is authorized,
source solids are retained locally and the requested deliverable is a local app.
19 focused tests, typecheck, lint and production build pass. Browser checks cover
all nine style pairs at 12:00, 03:15, 06:30, 23:59:59.9 and midnight; live time,
dropped frames, clock jumps, timezone changes, hidden/separated resynchronization,
inspection/selection, Workshop completion/Undo, Bench and idempotent cleanup.
All 31 browser checks pass. Known-angle fixtures supply fixed civil time and zero
sub-beat residual; separate live checks and train-ratio tests verify the running
residual. Final observations are in provenance. Workshop completion
and visibility use synthetic fixtures, not a manual assembly journey or every OS
lifecycle. The sustained desktop run is not physical-device qualification.

```sh
node --test tests/current-time-hands.test.mjs tests/running-movement.test.mjs tests/wheel-display-pose.test.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/current_time_hands.py
node scripts/movement/review-current-hands.mjs
# With the existing Playwright/Chrome paths and local production server on 4178:
MOVEMENT_EVIDENCE_ROOT=artifacts/current-time/browser node scripts/movement/browser-check.mjs http://127.0.0.1:4178
python3 scripts/movement/record-current-hands.py
```

CAD reproduction requires retained hash-checked original solids, the dial fit/tip
probe outputs and prior study caches. It is not a clean-machine CAD recipe. The
focused application tests use tracked inputs only. Detailed evidence stays ignored
under `artifacts/current-time/`. No push, PR, merge, deployment or publication.
