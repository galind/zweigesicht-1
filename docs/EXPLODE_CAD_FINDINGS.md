# Exploded-view source mounting review

9 September 2026. This is an analytic CAD and static construction-illustration review, not mechanical certification or a service procedure. The original STEP SHA-256 remains `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. No source geometry, finishes, occurrence matrices or fitted hand poses are edited by the probe.

Reproduce with `.venv-cad/bin/python scripts/cad/explode_probe.py`. It reuses the original STEP and existing mesh cache. Ignored `artifacts/explode-cad/` contains `source-mounts.json` (all 223 source movement leaves, 139 definitions, 7,173 cylinder/cone faces), `screw-directions.json`, `extraction-overlap.json`, `stem-overlap.json`, `authored-validation.json` and `source-mounting-contact.png`. The known nonfatal STEP FixShape warning remains present. The 223-leaf review includes the missing d225 diamond occurrence; this is coverage of source identities, not a claim that all 223 render. Existing movement/catalog exclusions remain separate.

All evidence coordinates are unchanged STEP world millimetres, unless explicitly labeled local. Analytic axes and face endpoints are transformed using each occurrence's original matrix. Cylinder axes can also describe tooth surfaces or cross bores; their mere presence never automatically determines a host or extraction sign. The contact sheet was visually inspected against the analytical head/shank and tapered-pin records.

For concise references, **P** below means the exact prefix `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`. Concatenate it directly with each suffix shown. Generated evidence contains every fully expanded ID and original matrix.

## All fasteners, including non-Z exceptions

The source movement contains **49 screws** named `010…`. Each has a larger head cylinder whose axial midpoint lies beyond its narrower shank cylinder toward **source-local +Z**. All 49 were measured separately using their occurrence transforms, including repeated definitions. There are exactly three screws whose mounted axes are not world Z. The other 46 face world +Z or −Z according to their original placement; there is no additional tilted screw exception.

| Exact occurrence suffix | Analytic source faces | World outward direction | Receiving geometry |
| --- | --- | --- | --- |
| `54__0_1_1_194_11` (d201) | Shank face2 radius .350; head face11 radius .500 | `(0.4067366431, -0.9135454576, 0)` | P`54__0_1_1_194_1`, d195 faces376/377: concentric head clearance .550 and nominal threaded bore .2625 |
| `54__0_1_1_194_12` (d201) | Same source-local faces, distinct occurrence | `(-0.1391731010, 0.9902680687, 0)` | Same plate, faces382/384: .550 clearance and .2625 nominal bore |
| `59__0_1_1_221_7` (d226) | Shank face3 radius .200; head face4 radius .400 | `(0, -1, 0)` | P`59__0_1_1_221_1`, d222 face61 nominal threaded bore .150 and face62 entry cone |

The first radial shank centerline runs from `(6.11240, -13.72868, -1.40000)` to `(6.50779, -14.61673, -1.40000)`; its head cylinder continues outward through `(6.54846, -14.70808, -1.40000)` to `(6.59491, -14.81242, -1.40000)`. The second shank runs from `(-2.11624, 14.87818, -1.40000)` to `(-2.25153, 15.84081, -1.40000)`; its head continues from `(-2.26544, 15.93984, -1.40000)` to `(-2.28134, 16.05294, -1.40000)`. These paired shank/head and receiving-seat measurements establish outward sign independently of a bounding-box center.

The clamp shank runs from `(0, -12.45359, -4.45000)` to `(0, -13.10000, -4.45000)`; its head cylinder reaches Y=−13.23137. Its seat is in the balance bridge. Consequently its local release must precede and then compose with the retained regulator/bridge's world −Z motion.

The 42 `020…` source pins include exactly two non-Z pins. Both are retained with their delicate hosts:

| Exact suffix | Mounting evidence | Disposition |
| --- | --- | --- |
| `7__0_1_1_108_5`, d118 | Cone face3, local +Z axis → world `(0.9998425562, 0.0177443767, 0)`; end radii .125/.1418195; coaxial .150 bore face8 in stud P`7__0_1_1_108_4` | Keep taper pin, stud, hairspring and balance together. Its wider end is local +Z; no independent pin removal is illustrated. |
| `32__0_1_1_175_4`, d179 | Cone face3, local +Z → world `(-0.7980359432, 0.6026098517, 0)`; radii .170/.1897731; coaxial .175 bore face11 in column P`32__0_1_1_175_2` | Keep pin with the complete stop-spring column/plate/spring. |

These are tapered press/clamping elements, not overlooked screws. The remaining 40 pins have Z-oriented analytic axes and stay attached to their reviewed plate, bridge or mechanism packet.

## Host evidence and retained packets

`screw-directions.json` records every screw's exact head/shank faces and coaxial receiving/clearance candidates. A receiving thread in the base and a clearance hole in the carried bridge are different relationships. The authored host follows the carried component while its thread-seat evidence remains recorded.

Direct screw/host examples proven by coaxial seats: P10/36 → minute bridge P61; P17/19/21 → barrel bridge P60; P18/22 → train bridge P6; P23/24 → balance bridge P59; P34/35 → pallet bridge P16; P42/46 → rear display bridge P58, with threads in barrel bridge P60; P43/44/45 → clamps P41/39/38; P73/79 → winding bridge P64; P77/82 → crown cap P75 with threads in P64; P71/72 → front cap P8; P68 → stop-spring plate P32 with thread in P31. P49/50 thread into barrel arbors and secure the positive-Z ratchets; the illustration releases them with the ratchets before whole barrels move toward the other side.

Nested jewels, Incabloc parts, chatons, riveted wheels/pinions, complete barrels and their mainsprings retain their internal source relationships. Keeping both source studs and the hairspring with the balance bridge avoids tearing its modeled anchorage. The entire shock assembly retains its delicate forks, pins and return elements. Broader train/display/keyless packets are explicitly conservative explanatory groups; matching CAD hierarchy alone is not evidence of service order.

## Intersections and the horizontal winding assembly

For each radial screw, the original BRep already overlaps the plate by about **.15870 mm³**, because a simplified .350-radius threaded shank intersects the nominal .2625 threaded bore. Along the reviewed outward axis, the measured common volume decreases to .11737 at .25 mm and .07528 at .50 mm, then is zero at sampled distances 1, 1.5, 2 and 3 mm. At .50 mm inward it instead increases to about .1975; at .50 mm world +Z it grows to about .406. The clamp similarly decreases from .02260 to .00907 at .25 mm and zero at .50 mm onward. This supports axial withdrawal and rejects the former world-Z displacement for the radial screws. It does not model an unscrewing helix or certify a threaded fit.

P27's winding stem axis is world +X, near `(Y=0, Z=-2.50002)`. Its .690-radius outer land fits the .700 cylindrical seats in main plate d195 faces72/77 and winding bridge d240 face34. P5's coupling wheel bore is radius .505 on the same nominal axis. P28's sliding coupling has a source center offset of approximately .0071 mm from the stem and an outside radius up to 1.1505; this inherited placement is preserved.

**The complete P5/P27/P28 packet must not slide outward together through the plate.** Original BRep sampling found zero assembled overlap but .651358 mm³ overlap for P5 at +X1 mm and .764403 mm³ for P28 at +X3 mm. P27 alone has zero plate overlap at +X1/3/6 mm. The .700 passage establishes bare-stem withdrawal, not clearance for the larger wheels. This is a concrete detected interference, not merely an unverified hypothetical. A revised authored sequence must withdraw the bare stem first and retain the wheels or extract them through the opened split-bearing side; the runtime's final choice belongs in `EXPLODE_REVIEW.md`.

Follow-up source samples support the latter route: P5 and P28 each have **zero plate common volume** at world −Z displacements .25/.50/1/2/4 mm. Their axes remain horizontal; moving them through the open lower half of the split bearing is justified after removing the stem, not by pretending they are Z-axis arbors. The bare stem's inner end is X=8.300005 mm and P5's outside end is X=14.850236 mm, so a stem withdrawal greater than **6.550231 mm** clears both retained wheels before they begin that lower-side motion. The winding bridge and keyless forks must also move clear first. These plate-pair results do not independently certify those additional pairwise paths.

The first revised timing moved the bare stem at progress .20–.50 while the keyless layer waited until .55. A separate 90-pair stage audit detected new stem/setting-lever overlap of **.0076085 mm³ at progress .275** and **.0053072 mm³ at .35**, compared with zero assembled. The retained rejected evidence is `rejected-winding-stage-overlap.json`. This establishes that the setting lever must lift before the stem groove slides. The corrected, implemented sequence is keyless +Z3.5 at .20–.40, bare stem +X8 at .42–.70, and the retained wheel/clutch pair −Z4 at .72–1; the winding bridge lifts −Z8 at .30–.70. The current 90 pair/stage samples have **zero common volume**, including assembled baselines. The probe samples progress 0/.2/.275/.35/.425/.5/.6/.72/.8/1 against both keyless levers and the winding bridge, and writes its manifest hash and exact host stages to `winding-stage-overlap.json` so evidence cannot silently refer to different timing. A regression asserts Boolean completion and no sampled increase above the source baseline.

The probe passes **106 original-source screw/seat checks** and **55 authored coverage/direction/pin-retention checks** at this review. Discrete Boolean checks are limited to the named part/plate or screw/host pairs. They do not prove continuously swept clearance against every other movement leaf. The distances and construction order remain illustrative; expert mechanical review remains open.
