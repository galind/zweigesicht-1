# Movement-side display animation

28 October 2026. Implemented from clean `5fd50f0` on
`codex/escapement-clearance-study`. This extends the existing prescribed motion
with the three requested movement-side packets. Hands, winding and setting remain
static. This is a kinematic illustration, not physically self-sustaining motion
or acceptance of the manufactured mechanism.

## Connection and exact scope

The [independent source comparison](FRICTION_CONNECTIONS.md) establishes the
214/217 mating geometry: shaft 214's taper interferes with pinion 217's circular
bore, and the independently downloaded components reproduce the assembly solids.
For this requested illustration, the connection is modeled as **sticking, 1:1
in world Z**. This is a supported modeling interpretation, not an explicit
maker-confirmed joint state, slip torque or manufacturing fit. No physical
slipping is modeled. Shaft 214 and pinion 217 now retain their relative pose.
The prior user-authorized center/cannon 93/137 assumption remains unchanged.

Exact source occurrence membership and axes are checked against both source
research and the current assembly manifest. Suffixes below append to
`p_0_1_1_1__0_1_1_1_4__0_1_1_83_`.

| Packet | Definitions and occurrence suffixes | Teeth | Axis XY mm; local Z signs | World increment | Mean period |
| --- | --- | --- | --- | --- | --- |
| Motion works 3 | 216/217: `57__0_1_1_215_1`, `57__0_1_1_215_2` | 24/8 | (0,5); +,− | −E/1620 | 3 hours |
| Cannon pinion 2 | 183/184: `37__0_1_1_182_1`, `37__0_1_1_182_2` | 8/shaft | (0,7.4); −,− | +E/540 | 1 hour |
| Hour wheel 2 | 187/188: `40__0_1_1_186_1`, `40__0_1_1_186_2` | 32/hub | (0,7.4); −,− | +E/6480 | 12 hours |

The shaft connection carries the existing −E/1620 to 216/217. External meshes
24:8 and 8:32 reverse direction and yield +E/540 and +E/6480. The existing
+54°/s mean escape advance gives periods of 10,800, 3,600 and 43,200 active seconds.
Exact full-precision source pivots and packet membership are retained in
[provenance](../assets/source-manifest/rear-display-animation.json).

The six leaves join `displayPackets` in the existing authored running policy.
They use the same accumulated E, active-time clock and controller. Ratios apply
before final shaft-angle modulo; world-Z multiplication handles reversed local
axes and preserves rigid packets. No clock, playback controls, balance smoothing,
geometry, shaft relocation or tooth editing is introduced. Maker-confirmed 3 Hz /
21,600 beats/hour, balance amplitude, escapement path/recoil, earlier train ratios
and the barrel-II boundary remain intact.

## Resolving the nominal mesh conflicts

The original rear phases produced running interference. The existing
[connected review](DISPLAY_PHASE_CLEARANCE_REVIEW.md) already evaluated a jointly
compatible alternative. This implementation installs exactly that reviewed pair:

| Packet | Previous world phase | Installed world phase | Installed local phase |
| --- | ---: | ---: | ---: |
| Motion works 3, 216/217 | 0° | 0° | No override |
| Cannon pinion 2, 183/184 | 0° | −0.9228515625° | +0.9228515625° on both leaves |
| Hour wheel 2, 187/188 | +0.25° | +0.27165787111074224° | −0.27165787111074224° on both leaves |

Only these four rear leaf overrides change. Both leaves of each packet receive
the same world phase; all other authored phases and immutable source/Workshop
endpoints remain unchanged. The newer microscopic phase refinement is not used:
it offers no meaningful extra margin and lacks the same complete neighbor review.

The [rear-hour limit study](REAR_HOUR_PHASE_LIMIT.md) remains decisive: phase
adjustment cannot open a materially larger gap at these fixed shaft locations.
The installed candidate has about **45 nm nominal original-solid clearance** at
its limiting witnesses. That does not establish manufactured clearance or robust
physical running. Imported tolerances, STEP uncertainty and original source-fit
limitations remain unresolved. This implementation accepts the candidate only
for a documented prescribed illustration.

## Clearance verification of the installed result

All 365 installed source-leaf transforms match the independently reconstructed
jointly reviewed poses within **5.56×10⁻¹⁷** per matrix entry; all 15 fitted-hand
poses are unchanged. The inventory is regenerated with all seven display packets
moving and hands fixed: **4,516 full-turn box exclusions, 231 candidate neighbor
pairs, 91 invalid/non-solid exceptions**. Every candidate's packet identities,
rational angular multipliers, complete material period and invariant-pose
classification match the hash-verified connected review. Its evidence transfers
on that demonstrated equivalence, not on the previous partial animation.

The inherited 231 candidates comprise 113 continuous enclosing-cylinder
exclusions, 8 continuous radial bounds, 3 invariant nonpenetrating relative poses,
**101 sampled-only nonpenetration results** and 6 retained original overlaps.
Planar mesh bounds remain planar; neither they nor selected solid samples certify
continuous whole-assembly clearance. Invalid/non-solid source occurrences and
previous hairspring-envelope limitations remain explicit.

A fresh replay uses the actual installed controller, with no injected packets or
phase replacements: **32,261 full-period triangle configurations** across all
five display meshes show no intersection. Twelve additional source-critical rear
poses also clear the runtime triangles. Fresh original-solid queries at those
same installed poses corroborate the rear minima: approximately **2.819566 µm**
for 183/216 and **45.141 nm** for 217/187. These selected whole-solid queries are
not continuous swept-solid certification; tessellation does not replace them.

A fresh **690-pose replay of all 231 neighbor pairs** retains the same eleven
pre-existing runtime contact/overlap pairs. Selected original-solid witnesses
recheck all six retained-fit pairs against their previously recorded maximum.
They retain shaft 214/pinion 217 overlap (~0.007245609 mm³), two occurrences each
of 188/12 and 184/8, and the 216/3 dial-ring overlap. These are disclosed source
fits/overlaps, not newly qualified clearances. No new/increased interference was
detected in the checked configurations. Zero solid common volume at the other
contact interfaces is not positive clearance.

The hands remain fixed while their supporting shafts/hubs rotate. This is now
the explicit incomplete display boundary, and does not assert slipping at those
fits. No hand-setting or winding interaction is inferred.

## Product validation and reproduction

Local CAD checks, focused tests, build and browser review were explained before
execution. They are necessary for this local-only implementation, retained private
source solids and route lifecycle verification. No push or publication is authorized.

**11 movement tests, 3 phase tests, typecheck, lint, production build and all
22 browser checks pass.** No application/shader errors were recorded. A
25.032-second Chrome interval delivered 1,296 frames (p50/p95 16.7/33.4 ms),
movement-update p95 0.6 ms, and stable 135 geometries / 8 textures.

The movement regressions cover source membership, signed ratios/periods, rigid
packets, reversed axes, long accumulated E, delayed frames, suspension/reassembly,
214/217 relative pose, static excluded leaves and cleanup. Phase regressions cover
reviewed occurrences, unchanged source/Workshop endpoints and rigid mounting.
The browser harness checks the actual seven packets in Explorer, completed
Workshop and assembled Bench, plus Undo, fitted views, visibility suspension,
Bench flip and disposal. Visibility and Workshop completion are synthetic fixtures;
this does not qualify every device or OS lifecycle. Current results and hashes
are in the provenance and `PROGRESS.md`.

```sh
node --test tests/running-movement.test.mjs tests/wheel-display-pose.test.mjs
node scripts/movement/review-display-phases.mjs hands --installed
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/rear_display_review.py
node scripts/movement/review-display-phases.mjs --installed
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/rear_display_review.py witnesses
node scripts/movement/review-display-phases.mjs neighbors --installed
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4178
# With existing PLAYWRIGHT_MODULE and CHROME_PATH:
MOVEMENT_EVIDENCE_ROOT=artifacts/rear-display/browser node scripts/movement/browser-check.mjs http://127.0.0.1:4178
python3 scripts/cad/escapement-clearance/record_rear_display.py
```

CAD reproduction requires retained hash-valid original solids and research evidence;
it is not a clean-machine recipe. Detailed outputs stay ignored under
`artifacts/rear-display/`. Original geometry is not regenerated. Release gates
and physical-acceptance limitations remain. No push, PR, merge, deployment or
publication is part of this milestone.
