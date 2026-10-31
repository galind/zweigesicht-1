# Normal-running power source — 31 October 2026

Investigated from clean `d29820e` on `codex/escapement-clearance-study`.
**No additional power-source motion is justified by the available evidence.**
Barrel II retains its reviewed drum/lid motion. Barrel I's drum/lid and the
winding train remain held. The two coupled arbors, their wheels and screws,
and both mainsprings remain explicitly incomplete, rather than being described
as correctly stationary during normal running. The inspection view now explains
this boundary. [Provenance](../assets/source-manifest/power-source.json) records
exact membership, matrices, measured interfaces and evidence hashes.

A separate runtime correction implements the requested separation behavior:
the last active barrel/train/hairspring pose is held relative to each part's
presentation pose. Previously separation stopped time but restored reference
angles. No gear ratio, authored phase, geometry or assembled trajectory changes.

## Primary evidence and connection

The maker's [ML-01 description](https://www.marcolangwatches.com/en/watches/),
downloaded 31 October, explicitly identifies the barrels as series-connected.
Its 3 Hz / 21,600 beats per hour and 70-hour reserve describe the actual watch;
they do not establish a spring-state law for this illustration. The fresh HTML
snapshot is retained privately with its hash. No maker statement specifying an
arbor speed split or spring operating configurations was found in that page or
the inspected component download. This is a bounded source review, not a claim
that such information cannot exist elsewhere.

The original assembly is hash checked against
`f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`.
Original occurrence transforms, valid cached BReps and existing authored phases
are composed by the retained CAD investigation utilities. The geometry supports:

```text
held crown wheel (249) ↔ barrel I drum (90)
                         spring I (88)
                         arbor I (87) + wheel I (131) + screw I (192)
                                         ↕ 62:62 external gear connection
                         arbor II (87) + wheel II (131) + screw II (192)
                         spring II (88)
                         barrel II drum (85) → transfer (96) → going train
```

This identifies the nominal path, not a solved force or contact model. The two
80-tooth drums are **not** meshed to each other: their original-solid gap is
0.392849 mm, and their tooth levels differ. Barrel I's 80-tooth drum meshes with
the 45-tooth crown wheel; barrel II's 80-tooth drum meshes with the 26-tooth
transfer. The crown wheel is acted on by click 254 and click spring 252.
The normal-running, engaged-click interpretation holds the crown wheel and
barrel I drum. It does not hold the intermediate 62-tooth wheels merely because
their names translate as ratchet wheels. Those wheels have keyed arbor bores.
The corresponding retaining screws belong with their arbors if that motion is
eventually implemented. No crown/winding/setting interaction is added.

### Exact occurrences and phases

All suffixes below follow `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`.
Angles are existing **world +Z** phase offsets, separate from running increments.
Full source and displayed matrices, source paths, solid validity and bounds are
recorded in the provenance. Z directions below are source-local +Z in world.

| Component | Definition | Occurrence suffix | World XY shaft / mm | Z direction | Existing phase |
| --- | --- | --- | --- | --- | --- |
| II drum / lid | 85 / 86 | `1__0_1_1_84_1` / `_2` | −6.2, 8.1 | −Z / −Z | 0° |
| II arbor | 87 | `1__0_1_1_84_3` | −6.2, 8.1 | +Z | +1.8° |
| II spring | 88 | `1__0_1_1_84_4` | −6.2, 8.1 | −Z | 0° |
| I drum / lid | 90 / 91 | `2__0_1_1_89_1` / `_2` | +6.2, 8.1 | +Z / +Z | +1.45° |
| I arbor | 87 | `2__0_1_1_89_3` | +6.2, 8.1 | +Z | 0° |
| I spring | 88 | `2__0_1_1_89_4` | +6.2, 8.1 | −Z | +1.45° |
| I wheel | 131, 62 teeth | `14` | 6.203871824, 8.105916839 | −Z | 0° |
| II wheel | 131, 62 teeth | `15` | −6.2, 8.1 | −Z | +1.8° |
| II / I arbor screws | 192 | `49` / `50` | −6.2 / +6.2, 8.1 | +Z | 0° |
| Crown wheel | 249, 45 teeth | `74` | 10.920235693, 0 | +Z | 0° |
| Transfer | 96, 26 teeth | `4` | −2.679050376, 0.972208354 | +Z | +6.25° |

The source wheel-I axis is displaced about 0.007071 mm from arbor I's axis.
The static keyed fit has zero common volume, but that does not prove a rotating
fit with two independently fixed axes. Any future rigid packet must preserve
its supplied relative mounting and reassess the resulting eccentric gear mesh.
No shaft is recentered here. The current +1.8° II arbor/wheel phase is retained;
its screw and spring are not silently reindexed.

Other recorded winding occurrences are coupling wheel 97 (`5`, existing −7.7°
world-X phase from its reversed local Z), stem 143 (`27`), clutch 144 (`28`),
click spring 252 (`76`) and click 254 (`80`). They remain static in the supported
no-winding condition. The clutch is a valid shell with **zero solids**, not a
qualified solid. Fixed bridge, plate, bearings and fasteners keep their poses.

## Why an arbor ratio cannot be assigned

Let `B = (E(t) − E(0))/3600` be the output barrel's accumulated clockwise
progress, measured from the initial displayed pose, and let `q(t)` be arbor I's
world-positive increment. The nominal external 62:62 connection gives:

```text
drum I = 0                  drum II = −B
arbor I = q                 arbor II = −q
relative spring releases = q and B − q
```

This uses the compatible winding sense of the two supplied occurrences; it is
an ideal geared constraint, not a dynamic qualification of the eccentric source
fit. The tooth counts alone leave `q` undetermined. For net forward progress,
splits such as `q=B/4` and `q=3B/4` both satisfy the same nominal constraints.
Neither is selected. In particular, **`q=B/2` is an extra equal-unwinding
assumption**, not a result of series connection or equal tooth counts.

Even equal transmitted torques would not determine angular rates without
compatible constitutive laws and initial spring states. Reusing the same CAD
definition twice does not supply those laws. The static drawing has no
kinematic pairs, joint constraints, torque law or operating state annotations
in its inspected STEP entity types. The existing 93/137 and 214/217 sticking
assumptions apply only to the display train and do not resolve this degree of
freedom. Both remain unchanged, as does the ~45 nm rear-hour evidence limit.

## Spring geometry and attachments

Both occurrences use definition 88, named `ml01 Zugfeder_h1,6_s0,145_l290`.
The [standalone maker spring](https://www.marcolangwatches.com/cad/ml01-zugfeder_h16_s0145_l290/)
was downloaded independently. It has one valid solid, volume 6.773266918 mm³;
Boolean subtraction in both directions against assembly definition 88 is zero.
It supplies the same configuration, not a second wound/unwound state.

The model is a short schematic curved strip with terminal detail, not a
represented 290 mm strip. Height is 1.6 mm. Paired analytic side-cylinder radii
differ by about **0.121324 mm**, whereas the name specifies 0.145 mm. Its planar
face area is **4.233292 mm²**, compared with `290 × .145 = 42.05 mm²` for that
nominal strip length and thickness. The sampled mid-height section has perimeter
68.138507 mm and no interior rings. These measurements establish a geometric
mismatch with the nominal dimensions, not the manufactured spring's properties.

Both complete spring solids clear their arbors by **0.006985294 mm**, and their
inner terminal face 7 clears by **0.156985294 mm**. There is no geometrically
closed inner hook connection in the supplied pose. The outer terminal detail
also does not close a side-wall attachment: at mid-height the entire spring
clears the drum wall by approximately **0.061830 mm (I)** and **0.190032 mm (II)**.
These latter numbers are polygon-section measurements at 0.00002 mm chord
sampling tolerance, not exact whole-solid distances. The closest whole-solid
spring/drum distance is zero because an axial spring face meets the drum's
floor; that contact must not be misread as an outer hook attachment.
Both springs clear their lids by 0.1 mm. All four planar vertical faces and their
distances are recorded rather than guessing endpoint identity from filenames.

Available radial and axial space is shown by the retained source sections and
analytic faces, but space alone does not define a valid deformation. A new
290 mm coil, hook reshaping, artificial bridge across the gaps, rigid rotation
of a spring, or equal sharing would each introduce unsupported mechanics.
No replacement mesh, deformation atlas or new moving packet is installed.

### State and represented range

The springs remain at their supplied static illustration shapes. They have
**no assigned winding state and no represented unwinding range**. There is no
spring-state reset, loop, rewind, torque, energy or power-reserve calculation.
The train continues as prescribed kinematics; it is not an inexhaustible spring.
Barrel II still rotates around the frozen source spring, with the incomplete
attachment boundary disclosed in the barrel view and details. Its absolute
running law remains `−E/3600`, including the initial −0.1° escape phase and
recoil, with a 24,000-active-second mean period.

To finish the missing animation requires an agreed initial spring state,
actual inner/outer attachment frames and topology, a faithful strip/configuration
description, and either a supported intermediate-arbor trajectory or a separate
spring/contact model that determines it. A proposed deformation then needs
self-intersection, attachment, lid/core/wall and surrounding-solid checks across
its explicitly finite operating range. The intermediate wheel/key eccentricity
also needs review. A repeatable demonstration would need an explicit, disclosed
reset policy; none is invented here.

## Interfaces, validation and limits

The fresh source audit makes **24 original-solid pair measurements**. Both
arbor/drum and arbor/lid gaps are 0.005 mm; the phased 62-tooth pair gap is
0.031730939 mm. Retained overlaps include each arbor/screw fit (~0.153910292
mm³), crown wheel/click (0.007094860 mm³, previously documented), and
click/click spring (0.000917627 mm³, freshly recorded here). These are existing
source overlaps, not newly introduced interference. No geometry is altered.

There is **no newly moving or deforming assembled interface**. No prior static
spring clearance is transferred to a deforming spring. Existing barrel-II
36-pose sampling remains sampling; its meshing section bounds and selected
whole-solid checks retain the limits in [the train study](TRAIN_COUPLING_STUDY.md).
The two fresh spring sections are valid simple polygons at the supplied pose,
not continuous deformation bounds. The original invalid eccentric solids and
non-solid clutch remain unqualified. Separation trajectories are presentation
poses, not collision-qualified mechanical disassembly.

The controller distinguishes an applied pose from an advancing clock. Explorer
holds all 41 rigid motion leaves and the existing hairspring during requested
or displayed separation, including the already-used corrected fork geometry.
The mainsprings remain the original static meshes. It returns false while held,
so it adds no render loop.
Resume waits for displayed separation zero. Inventory restores references;
hidden time is suspended; Workshop remains static until completion and restores
on Undo; Bench keeps its assembled behavior. Fitted hands retain their existing
independent wall-clock resynchronization, without advancing active barrel time.
Bounds use the same held presentation matrices and disposal restores resources.

Validation results and exact evidence hashes are recorded in provenance and
[current status](../PROGRESS.md). Focused CPU checks cover multi-turn barrel
poses, signed axes/ratios, recoil, long sessions, delayed frames, held tilted
presentation poses, no catch-up on resume, hand time and cleanup. The browser
audit exercises actual Explorer, Workshop and Bench controllers, selection
bounds, hidden return, disassembly/reassembly, all hand styles, and sustained
resource counts. Synthetic lifecycle fixtures and one desktop do not qualify
other devices. No new whole-assembly clearance claim is made.

The 36 rear minute/marker overlaps, broad-lance hand overlap, central Lance
minute/ring overlap and retained fitted-hand interfaces from
[the hand review](CURRENT_TIME_HANDS.md) remain unchanged and unresolved.

## Reproduction

Local calculations were necessary for private source inspection; focused local
runtime validation was necessary because no push is authorized and the requested
pause behavior and refreshed local view must be checked. Original downloads,
images, sections and outputs remain ignored under `artifacts/power-source/`.
The retained source/cache is required; this is not clean-machine reproduction.

```sh
OPENBLAS_NUM_THREADS=1 .venv-cad/bin/python scripts/cad/escapement-clearance/power_source.py
node --test tests/running-movement.test.mjs tests/current-time-hands.test.mjs tests/viewer-scheduling.test.mjs tests/wheel-display-pose.test.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4178
# With the retained PLAYWRIGHT_MODULE and CHROME_PATH:
MOVEMENT_EVIDENCE_ROOT=artifacts/power-source/browser node scripts/movement/browser-check.mjs http://127.0.0.1:4178
python3 scripts/movement/record-power-source.py
```

No push, PR, merge, deployment, publication or redistribution. Release gates
remain uncleared. This milestone completes the available-evidence investigation
and pause correction; it does **not** complete the missing power-source animation.
