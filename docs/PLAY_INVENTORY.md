# Play inventory and sequence audit

Audited 25 September 2026 against the prepared source manifest and actual runtime GLB nodes. The authoritative runtime mapping is [`play-manifest.json`](../assets/authored/play-manifest.json), version `play-2`. It contains full stable source instance IDs, source/fitted endpoint matrices, bounds, ordered placement IDs, per-step contexts, explicit exclusions and exceptions. Labels are presentation only; neither labels nor runtime name matching determine membership.

## Scope and counts

| Measure | Count |
| --- | ---: |
| Source hierarchy instances, excluding root | 426 |
| Source physical leaves | 365 |
| Chosen movement leaves | 222 |
| Chosen dial/hand leaves | 43 |
| Final physical leaves, either level | 265 |
| Initially fitted mainplate leaves, either level | 18 |
| Excluded source leaves | 100 |
| Easy player placements | 87 |
| Hard player placements | 247 |

The final configuration reuses the existing authored defaults: central Fine hands, small Lance hands, original blue fitted appearances, and static 10:10:00 hand-display correction. There is no case. The movement-side mounting clamps and their screws remain: they are modeled movement components, while the entire independent case tree is excluded. The existing fitted setting spring is movement child 53; overlapping alternative child 66 is excluded. Every selected physical leaf appears exactly once in each level, either initially fitted or in one placement. No source solid is split.

## Shared foundation

The foundation is **only** `p_0_1_1_1__0_1_1_1_4__0_1_1_83_54`, source “Werkplatte verstiftet versteint”. Its 18 physical descendants include the plate, eight directly modeled jewels, two pins, two screws and all five Incabloc components. Mainplate child 13 is an assembly node, not an extra physical piece. Other movement children sharing parent 83 are not included initially.

| Relative source path under mainplate 83:54 | Source component |
| --- | --- |
| `0:1:1:194:1` | ml01 Grundplatine |
| `0:1:1:194:2` | 030-G_90x200x45 |
| `0:1:1:194:3` | 030-G_160x240x30 |
| `0:1:1:194:4` | 030-G_160x240x30 |
| `0:1:1:194:5` | 030-G_90x200x40 |
| `0:1:1:194:6` | 030-G_30x100x25 |
| `0:1:1:194:7` | 030-GO_10x100x22 |
| `0:1:1:194:8` | 020-40x135 ms |
| `0:1:1:194:9` | 020-40x135 ms |
| `0:1:1:194:10` | 030-BO_10x100x25 |
| `0:1:1:194:11` | 010-linsenk s70x120 k100x30 |
| `0:1:1:194:12` | 010-linsenk s70x120 k100x30 |
| `0:1:1:194:13/0:1:1:202:1` | incabloc_sous_937-21_Lochsteinschale |
| `0:1:1:194:13/0:1:1:202:2` | incabloc_sous_937-21_BO_9x90x14 |
| `0:1:1:194:13/0:1:1:202:3` | incabloc_sous_937-21_CPB_0x105x8 |
| `0:1:1:194:13/0:1:1:202:4` | incabloc_sous_937-21_Lyrafeder |
| `0:1:1:194:13/0:1:1:202:5` | incabloc_sous_937-21_Grundschale |
| `0:1:1:194:14` | 030-G_70x130x25 |

## Sequence and preparation

Easy uses one source-confirmed mechanical packet per placement where that packet represents a prepared assembly. All direct movement fasteners remain their own actions. Both dials are prepared dial structures, followed by separately placed hour/minute/seconds hand packets with their bushings. Bridges and their fittings are prepared, but each bridge still has a player placement.

Hard uses exactly one physical leaf per action, including every modeled jewel, screw, pin, hand bushing and dial marker outside the shared foundation. Source assembly packets define temporary close-up chapters; they do not add a counted “seat assembly” action or duplicate any leaf. The final component completes that packet, and the next chapter exposes the next target. This is a guided construction puzzle, not an expert-reviewed service sequence.

The deliberate movement chapter order below places train and escapement internals before the large covering bridges. Winding and display work then use the appropriate outward side with authored cutaway context. Barrels explicitly place drum, arbor and mainspring before their cover. Other fine-grained packets begin with their modeled body and add fitted components. Train-bridge cap jewels precede cap plates; balance-bridge housing and jewels precede the retaining spring; shock-indicator base and internal forks precede its cover. Source transforms never move to accommodate this presentation.

| Easy order | Source movement child | Prepared packet / component | Leaves | Guided side |
| ---: | ---: | --- | ---: | --- |
| 1 | 1 | Barrel assembly 2 | 4 | back |
| 2 | 2 | Barrel assembly 1 | 4 | front |
| 3 | 3 | Center-wheel assembly | 3 | back |
| 4 | 4 | Barrel-to-center wheel | 1 | front |
| 5 | 25 | Screw | 1 | front |
| 6 | 61 | Center-wheel bridge assembly | 4 | back |
| 7 | 10 | Screw | 1 | front |
| 8 | 36 | Screw | 1 | front |
| 9 | 63 | Third-wheel assembly | 2 | back |
| 10 | 65 | Seconds-wheel assembly | 2 | back |
| 11 | 62 | Escape-wheel assembly | 3 | back |
| 12 | 13 | Pallet assembly | 6 | front |
| 13 | 16 | Pallet bridge | 4 | front |
| 14 | 34 | Screw | 1 | front |
| 15 | 35 | Screw | 1 | front |
| 16 | 7 | Balance assembly | 12 | back |
| 17 | 32 | Stop-spring assembly | 5 | front |
| 18 | 68 | Screw | 1 | front |
| 19 | 59 | Balance bridge | 14 | back |
| 20 | 23 | Screw | 1 | back |
| 21 | 24 | Screw | 1 | back |
| 22 | 29 | Shock-indicator assembly | 39 | back |
| 23 | 6 | Train bridge | 12 | back |
| 24 | 18 | Screw | 1 | back |
| 25 | 22 | Screw | 1 | back |
| 26 | 60 | Barrel bridge | 7 | back |
| 27 | 17 | Screw | 1 | back |
| 28 | 19 | Screw | 1 | back |
| 29 | 21 | Screw | 1 | back |
| 30 | 27 | Winding stem | 1 | front |
| 31 | 28 | Sliding coupling | 1 | front |
| 32 | 5 | Coupling wheel | 1 | front |
| 33 | 12 | Pin | 1 | front |
| 34 | 70 | Setting lever | 2 | front |
| 35 | 33 | Screw | 1 | front |
| 36 | 31 | Coupling lever | 1 | front |
| 37 | 30 | Hand-setting wheel assembly | 2 | front |
| 38 | 47 | Hand-setting lever | 1 | front |
| 39 | 69 | Hand-setting spring | 3 | front |
| 40 | 53 | Setting-lever spring | 1 | front |
| 41 | 67 | Screw | 1 | front |
| 42 | 48 | Screw | 1 | front |
| 43 | 51 | Screw | 1 | front |
| 44 | 52 | Screw | 1 | front |
| 45 | 64 | Winding bridge | 3 | back |
| 46 | 73 | Screw | 1 | back |
| 47 | 79 | Screw | 1 | back |
| 48 | 74 | Crown wheel | 1 | back |
| 49 | 75 | Crown-wheel plate | 3 | back |
| 50 | 77 | Screw | 1 | back |
| 51 | 82 | Screw | 1 | back |
| 52 | 76 | Click spring | 1 | back |
| 53 | 78 | Screw | 1 | back |
| 54 | 80 | Click | 1 | back |
| 55 | 81 | Screw | 1 | back |
| 56 | 56 | Motion-works wheel 2 | 2 | front |
| 57 | 55 | Motion-works wheel 1 | 2 | front |
| 58 | 11 | Screw | 1 | front |
| 59 | 20 | Cannon pinion 1 | 1 | front |
| 60 | 26 | Hour wheel 1 | 2 | front |
| 61 | 9 | Thin washer | 1 | front |
| 62 | 14 | Ratchet wheel | 1 | front |
| 63 | 15 | Ratchet wheel | 1 | front |
| 64 | 49 | Screw | 1 | front |
| 65 | 50 | Screw | 1 | front |
| 66 | 37 | Cannon pinion 2 | 2 | back |
| 67 | 57 | Motion-works wheel 3 | 2 | back |
| 68 | 40 | Hour wheel 2 | 2 | back |
| 69 | 58 | Motion-works bridge assembly 2 | 4 | back |
| 70 | 42 | Screw | 1 | back |
| 71 | 46 | Screw | 1 | back |
| 72 | 8 | Jewel-set cap plate · WPL | 2 | front |
| 73 | 71 | Screw | 1 | front |
| 74 | 72 | Screw | 1 | front |
| 75 | 38 | Movement clamp | 1 | front |
| 76 | 39 | Movement clamp | 1 | front |
| 77 | 41 | Movement clamp | 1 | front |
| 78 | 43 | Screw | 1 | front |
| 79 | 44 | Screw | 1 | front |
| 80 | 45 | Screw | 1 | front |

The last seven Easy actions are: Three-hands dial (16 leaves), hour hand (2), minute hand (2), seconds hand (2), Skeleton dial (17), hour hand (2), minute hand (2). Hard places the same 43 leaves individually after 204 movement placements.

### Visibility and staging contract

All steps stage at the lower-left. The renderer frames the exact `focusLeafIds` and authored `side`: front is source +Z with +Y up; back is source -Z with -Y up. `contextLeafIds` is an explicit subset of leaves already fitted before that step. Easy and the first action of each Hard source packet retain the complete fitted movement context and frame the mainplate plus the current piece, giving a recognizable watch rather than floating or cropped foundation fittings.

Subsequent Hard actions in the same packet show only that packet's already fitted components, framed together with the new piece. This preserves a useful local assembly in close-up without unrelated mainplate jewels. Omitted packets are temporarily hidden, never removed from progress. At completion all 265 leaves return.

The first draft used conservative XY bounding-box overlap to hide context. Browser review showed that a perforated mainplate could disappear even though an actual seat was exposed through an opening. Version 2 retains meaningful authored contexts instead: the renderer checks actual geometry rays from the guided camera and temporarily removes genuine occluders. The inventory validator checks that whole views retain/frame the complete mainplate and local views contain only previously fitted components of their exact packet. This is no longer a static visibility proof; every step needs the renderer's actual geometry-ray and browser reachability checks. Arbitrary user orbit can obscure an assembly; reframe restores the authored view.

Temporary isolation and automatically restored context are presentation choices. They are not assertions that every intermediate combination could be physically held or serviced that way. Expert mechanical review remains open, especially for press/rivet fits, setting-lever assembly, Incabloc loading, the shock indicator and mainspring handling. No spring deformation, tools or collision simulation is claimed.

## Geometry and source exceptions

- Selected movement and dial leaves have actual mesh nodes in the prepared overview/catalog GLBs; source triangle counts alone are not used as availability proof.
- Diamond d225 has no STEP tessellation. Its existing original maker STL is required, hash checked, and positioned with the unchanged source matrix. Missing or failed recovery must block play and completion. It is not an invented replacement.
- Four balance eccentric d111 occurrences retain the known partial tessellation: three of 23 source faces are absent. They remain one physical component each; no claim of repaired source geometry is made.
- Inner dial d27 retains the existing recovered mesh of an invalid BRep. Existing near-degenerate triangles are retained and recorded in the source manifest.
- The hand endpoints reproduce `HandDisplayPose.ts` using the authored bore/tip landmarks and clock angles. Only the selected five hand blades have corrected matrices. The other 260 endpoints exactly equal their immutable source occurrence matrices.
- Case, strap, buckle, alternative lug/crystal configurations, unselected dial/hand alternatives and the regulation support are excluded by full leaf ID. No geometry or assets were newly redistributed. The source hashes and release gates remain in force.

## Reproduce the inventory verification

Run `node scripts/play/validate-inventory.mjs` from the repository root. It verifies source hash, exact foundation, selected configuration, explicit source-wide exclusions, physical IDs, available GLB nodes, required maker-STL hash, matrix validity, immutable non-hand endpoints, unique placement coverage, ordered prerequisites, context availability and whole/local framing and equal finished sets. The recorded result is 365 source leaves, 18 initial leaves, 265 final leaves, 100 exclusions, 87 Easy placements and 247 Hard placements.

Browser interaction/visual evidence belongs to the implementation verification record in `PROGRESS.md` and ignored `artifacts/`; this audit does not claim real-device testing, user testing or mechanical certification.
