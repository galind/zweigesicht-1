# Front/transfer display animation

**Follow-up:** the [rear-display implementation](REAR_DISPLAY_ANIMATION.md) now
enables 216/217, 183/184 and 187/188 with a modeled sticking connection and two
reviewed rear phases. This report records the preceding four-packet milestone.


28 October 2026. Implemented from the verified clean `58c7e27` checkout on
`codex/escapement-clearance-study`. This is **prescribed kinematics**, not
physically self-sustaining motion. The user explicitly authorized normal-running
sticking at center shaft/cannon pinion **93/137**, transmitting same-world-direction
1:1 rotation. That is a modeling assumption, not maker-confirmed evidence; missing
manufacturing tolerances do not block this scoped illustration.

## Exact installed scope

The source manifest's XCAF occurrence membership and world matrices are checked
against the current assembly manifest. No adjacent coaxial leaves are included.
Source URLs, hashes, complete IDs/matrices and validation inputs are retained in
[front-display-animation.json](../assets/source-manifest/front-display-animation.json).
Occurrence suffixes below append to `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`.

| Packet | Definitions and occurrence suffixes | Teeth | Axis XY mm; local Z signs | Signed world increment | Mean period |
| --- | --- | --- | --- | --- | --- |
| Cannon pinion 1 | 137: `20` | 12 | (0,0); + | −E/540 | 1 hour |
| Motion works 1 | 210/211: `55__0_1_1_209_1`, `55__0_1_1_209_2` | 36/10 | (4.24287382474019,0.2460116); +,− | +E/1620 | 3 hours |
| Hour wheel 1 | 141/142: `26__0_1_1_140_1`, `26__0_1_1_140_2` | 40/hub | (0,0); +,+ | −E/6480 | 12 hours |
| Motion works 2 | 213/214: `56__0_1_1_212_1`, `56__0_1_1_212_2` | 36/shaft | (0,5); +,− | −E/1620 | 3 hours |

The exact full-precision source pivots are used. External meshes 12:36, 10:40,
and 36:36 reverse world direction. The authorized inlet gives −E/540; successive
ratios yield +E/1620, −E/6480 and −E/1620. At the existing +54°/s mean escape
rate these imply 3,600, 10,800, 43,200 and 10,800 active seconds per revolution.

`assets/authored/running-movement.json` supplies the four packets to the shared
`RunningMovement`; generated escapement assets remain unchanged. Ratios apply
to accumulated E **before** each final angle is reduced modulo 360°. Left
multiplication about world Z handles reversed definition-local axes and keeps
both leaves of each riveted packet rigid. Existing world display phases remain
+3.3°, +0.8°, −2.95° and 0° respectively.

Explorer, completed Workshop and assembled Bench automatically use the extended
controller. The existing active-time clock, maker-confirmed 3 Hz / 21,600 beats
per hour, balance amplitude, piecewise escapement path and recoil, main-train
ratios, barrel-II boundary and all lifecycle policies remain intact. There is
no extra clock, smoothing, playback control or geometry change.

All hands, cannon pinion 2 (183/184), motion works 3 (216/217) and hour wheel 2
(187/188) remain static. Winding/setting, ratchets, barrel I, arbors and mainspring
deformation remain excluded. Moving shaft **214 against static pinion 217** is
an explicitly incomplete illustration. It does not depict or establish physical
slipping, a clutch, disconnection or a complete power-transmitting mechanism.
The rear diagnostic phases are not installed; the rear-hour precision study
remains relevant to any future proposal to animate that train.

## Clearance evidence for this partial scope

The neighbor inventory is rebuilt from the original solids: seven moving leaves
against all 365 source leaves and 15 authored fitted-hand variants. It records
2,441 full-turn box exclusions, three internal rigid pairs, three separately
reviewed front meshes, 136 candidate neighbors and 49 invalid/non-solid exceptions.
All seven clear the inherited free-coil envelope; existing spring limitations remain.

Exactly **133 candidate pairs** inherit the previous connected review only after
matching both packet identities, rational angular multipliers, full material
period, invariant-pose classification and unchanged authored transforms. The
new script verifies the prior evidence hashes. It does not transfer a seven-packet
relative-motion conclusion across a newly static boundary.

Three changed pairs are recomputed on original solids, at 37 poses over the
complete 3-hour material period (10° shaft increments, including closure):

| Moving / static pair | Baseline common mm³ | Maximum sampled common mm³ | Result |
| --- | ---: | ---: | --- |
| 214 / 187 | 0 | 0 | Sampled nonpenetration |
| 214 / 216 | 0 | 0 | Sampled nonpenetration |
| 214 / 217 | 0.007245608847086339 | 0.007245608847086891 | Retained original taper/bore overlap |

These **111 fresh BRep sample queries** do not certify continuous swept-solid
clearance. No new/increased overlap was detected at those samples. The retained
214/217 interference is not accepted as a manufacturing fit or explained away
as physical slipping. No phase, tooth, geometry or shaft adjustment conceals it.

The 136 neighbors comprise 55 continuous enclosing-cylinder exclusions,
8 continuous radial bounds, 2 invariant nonpenetrating poses, **70 sampled-only
nonpenetration results** and that one retained overlap. Zero common volume is not
a positive clearance measurement. Invalid/non-solid original occurrences d27,
four d111 occurrences, d144 and d225 remain unqualified.

All three front meshes retain the earlier original-section continuous polygon
bounds (0.008920802, 0.011836883 and 0.001941985 mm) and 45 selected clear original
solid witnesses. These bounds are planar, not whole-solid certificates.
A fresh replay of the **installed controller and actual decoded runtime triangles**
checks 6,913 + 7,681 + 6,913 = **21,507 full-period configurations**, with no front
mesh intersection. A further **405 poses across all 136 neighbor pairs** retains
five triangle-contact pairs: 137/38, 137/93, 141/195, 142/34 and 214/217. Every one
also intersects in original and authored static runtime poses. The first four
have prior original-solid zero-common contact evidence; the last retains the
explicit overlap. This is not an intersection-free assembly claim.

Independent runtime point rotations agree within 9.83×10⁻¹¹ mm, including
1,000,000,000 active seconds. Packet relative matrices remain constant within
9.16×10⁻¹⁶. Runtime tessellation does not supersede source-solid fits or tolerance
limitations. Sampled checks are not continuous bounds or physical acceptance.

## Local validation and reproduction

Local tests, CAD calculations, build and browser review were explained before
execution: no push is authorized, the private original-solid cache is local,
and the implemented lifecycle needs inspection before committing the milestone.
Existing installed dependencies, review tools and evidence were reused.

The ten focused movement tests pass: exact memberships/pivots, signed ratios and
independent periods, rigid packet motion, reversed axes, long E before modulo,
recoil, delayed frames, retained time through suspension/reassembly, static rear
packets/hands, spring continuity and idempotent cleanup. Typecheck, lint and the
production build pass; the existing vinext route-classification notice remains.

All **22 production-browser checks pass**, with no application/shader errors.
A 25.016-second sample delivered 1,342 frames (p50/p95 16.7/33.3 ms), movement
update p95 1.3 ms, and stable 135 geometries / 8 textures. Results are recorded
in the accompanying provenance and current status.
The harness checks each route's actual four packets and shared-E matrices, plus
Explorer separation/reassembly, fitted views, hidden-tab suspension, completed
Workshop/Undo, Bench flip and cleanup. Visibility and Workshop completion are
synthetic fixtures using existing handlers; this is one desktop Chrome run,
not qualification of physical devices or every OS suspension policy.

```sh
node --test tests/running-movement.test.mjs
node scripts/movement/review-display-phases.mjs hands --front
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/front_display_review.py
node scripts/movement/review-display-phases.mjs --front
node scripts/movement/review-display-phases.mjs neighbors --front
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4178
# With existing PLAYWRIGHT_MODULE and CHROME_PATH:
MOVEMENT_EVIDENCE_ROOT=artifacts/front-display/browser node scripts/movement/browser-check.mjs http://127.0.0.1:4178
python3 scripts/cad/escapement-clearance/record_front_display.py
```

CAD reproduction needs retained hash-valid source solids and prior local evidence;
it is not a clean-machine recipe. Generated data/screenshots stay ignored under
`artifacts/front-display/`. No push, PR, merge, deployment or publication. The
existing release gates and mechanical-acceptance limits remain uncleared.
