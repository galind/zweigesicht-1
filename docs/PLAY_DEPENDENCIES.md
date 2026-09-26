# Free-assembly dependency ledger

26 September 2026. Authoritative rules are in `play-manifest.json`, version
`play-4`. This is a puzzle construction graph, not a certified service sequence.
The graph is deliberately monotone: accepted actions add supports; a cover
cannot be fitted before the contents guarded by its prerequisites. Undo removes
the last committed action and therefore cannot strand a later dependent action.

## Evidence and assumptions

- Exact physical membership and immutable endpoints: [inventory audit](PLAY_INVENTORY.md), the source hierarchy and `targetPoses`.
- The earlier inventory validator independently checked the bridge/host pairs marked **audited host/cover** below. This establishes the project’s recorded source interpretation, not external mechanical certification.
- Other movement edges are **puzzle assumptions** based on named source roles and their assembled geometry. These edges conservatively require the associated host, meshing assembly or spring mechanism. They are explicit and reviewable; former list position is not used.
- Both dials wait for all movement work. This is a **conservative face-closure rule**, deliberately broader than a claim that every underlying fastener obstructs each dial. The two dial paths and their retaining screws are independent after that guard.
- The retained mainplate, jewels and shock protection are one fixed foundation. No leaf was added, removed or silently fitted.

## Main-watch rules, shared by both levels

Easy installs each listed packet directly. Hard first completes each packet’s
individual components and explicitly transfers the packet. Main-watch dependencies
refer to completed transfers for packets, or direct placements for single leaves.
A transfer counts no new physical parts.

| Packet or part | Required packets / parts | Evidence class |
| --- | --- | --- |
| Barrel assembly 2 (`movement-1`) | Retained mainplate | Foundation support |
| Barrel assembly 1 (`movement-2`) | Retained mainplate | Foundation support |
| Center-wheel assembly (`movement-3`) | Retained mainplate | Foundation support |
| Barrel-to-center wheel (`movement-4`) | Barrel assembly 1 (`movement-2`), Center-wheel assembly (`movement-3`) | Explicit puzzle assumption |
| Screw 1 (`movement-25`) | Barrel-to-center wheel (`movement-4`) | Explicit puzzle assumption |
| Center-wheel bridge assembly (`movement-61`) | Center-wheel assembly (`movement-3`) | Audited host/cover |
| Screw 2 (`movement-10`) | Center-wheel bridge assembly (`movement-61`) | Audited host/cover |
| Screw 3 (`movement-36`) | Center-wheel bridge assembly (`movement-61`) | Audited host/cover |
| Third-wheel assembly (`movement-63`) | Retained mainplate | Foundation support |
| Seconds-wheel assembly (`movement-65`) | Retained mainplate | Foundation support |
| Escape-wheel assembly (`movement-62`) | Retained mainplate | Foundation support |
| Pallet assembly (`movement-13`) | Retained mainplate | Foundation support |
| Pallet bridge (`movement-16`) | Pallet assembly (`movement-13`) | Audited host/cover |
| Screw 4 (`movement-34`) | Pallet bridge (`movement-16`) | Audited host/cover |
| Screw 5 (`movement-35`) | Pallet bridge (`movement-16`) | Audited host/cover |
| Balance assembly (`movement-7`) | Retained mainplate | Foundation support |
| Stop-spring assembly (`movement-32`) | Retained mainplate | Foundation support |
| Screw 6 (`movement-68`) | Stop-spring assembly (`movement-32`) | Explicit puzzle assumption |
| Balance bridge (`movement-59`) | Balance assembly (`movement-7`), Stop-spring assembly (`movement-32`), Screw 6 (`movement-68`) | Explicit puzzle assumption |
| Screw 7 (`movement-23`) | Balance bridge (`movement-59`) | Audited host/cover |
| Screw 8 (`movement-24`) | Balance bridge (`movement-59`) | Audited host/cover |
| Shock-indicator assembly (`movement-29`) | Retained mainplate | Foundation support |
| Train bridge (`movement-6`) | Third-wheel assembly (`movement-63`), Seconds-wheel assembly (`movement-65`), Escape-wheel assembly (`movement-62`), Shock-indicator assembly (`movement-29`) | Explicit puzzle assumption |
| Screw 9 (`movement-18`) | Train bridge (`movement-6`) | Audited host/cover |
| Screw 10 (`movement-22`) | Train bridge (`movement-6`) | Audited host/cover |
| Barrel bridge (`movement-60`) | Barrel assembly 2 (`movement-1`), Barrel assembly 1 (`movement-2`) | Audited host/cover |
| Screw 11 (`movement-17`) | Barrel bridge (`movement-60`) | Audited host/cover |
| Screw 12 (`movement-19`) | Barrel bridge (`movement-60`) | Audited host/cover |
| Screw 13 (`movement-21`) | Barrel bridge (`movement-60`) | Audited host/cover |
| Winding stem (`movement-27`) | Retained mainplate | Foundation support |
| Sliding coupling (`movement-28`) | Winding stem (`movement-27`) | Explicit puzzle assumption |
| Coupling wheel (`movement-5`) | Sliding coupling (`movement-28`) | Explicit puzzle assumption |
| Pin (`movement-12`) | Retained mainplate | Foundation support |
| Setting lever (`movement-70`) | Pin (`movement-12`), Winding stem (`movement-27`) | Explicit puzzle assumption |
| Screw 14 (`movement-33`) | Setting lever (`movement-70`) | Explicit puzzle assumption |
| Coupling lever (`movement-31`) | Sliding coupling (`movement-28`), Setting lever (`movement-70`) | Explicit puzzle assumption |
| Hand-setting wheel assembly (`movement-30`) | Retained mainplate | Foundation support |
| Hand-setting lever (`movement-47`) | Hand-setting wheel assembly (`movement-30`), Coupling lever (`movement-31`) | Explicit puzzle assumption |
| Hand-setting spring (`movement-69`) | Hand-setting lever (`movement-47`) | Explicit puzzle assumption |
| Setting-lever spring (`movement-53`) | Setting lever (`movement-70`), Coupling lever (`movement-31`) | Explicit puzzle assumption |
| Screw 15 (`movement-67`) | Setting-lever spring (`movement-53`) | Explicit puzzle assumption |
| Screw 16 (`movement-48`) | Hand-setting lever (`movement-47`) | Explicit puzzle assumption |
| Screw 17 (`movement-51`) | Hand-setting spring (`movement-69`) | Explicit puzzle assumption |
| Screw 18 (`movement-52`) | Hand-setting spring (`movement-69`) | Explicit puzzle assumption |
| Winding bridge (`movement-64`) | Coupling wheel (`movement-5`), Winding stem (`movement-27`), Sliding coupling (`movement-28`) | Explicit puzzle assumption |
| Screw 19 (`movement-73`) | Winding bridge (`movement-64`) | Explicit puzzle assumption |
| Screw 20 (`movement-79`) | Winding bridge (`movement-64`) | Explicit puzzle assumption |
| Crown wheel (`movement-74`) | Winding bridge (`movement-64`) | Explicit puzzle assumption |
| Crown-wheel plate (`movement-75`) | Crown wheel (`movement-74`) | Explicit puzzle assumption |
| Screw 21 (`movement-77`) | Crown-wheel plate (`movement-75`) | Explicit puzzle assumption |
| Screw 22 (`movement-82`) | Crown-wheel plate (`movement-75`) | Explicit puzzle assumption |
| Click spring (`movement-76`) | Winding bridge (`movement-64`) | Explicit puzzle assumption |
| Screw 23 (`movement-78`) | Click spring (`movement-76`) | Explicit puzzle assumption |
| Click (`movement-80`) | Winding bridge (`movement-64`) | Explicit puzzle assumption |
| Screw 24 (`movement-81`) | Click (`movement-80`) | Explicit puzzle assumption |
| Motion-works wheel 2 (`movement-56`) | Retained mainplate | Foundation support |
| Motion-works wheel 1 (`movement-55`) | Motion-works wheel 2 (`movement-56`) | Explicit puzzle assumption |
| Screw 25 (`movement-11`) | Motion-works wheel 1 (`movement-55`) | Explicit puzzle assumption |
| Cannon pinion 1 (`movement-20`) | Center-wheel assembly (`movement-3`) | Explicit puzzle assumption |
| Hour wheel 1 (`movement-26`) | Cannon pinion 1 (`movement-20`), Motion-works wheel 1 (`movement-55`) | Explicit puzzle assumption |
| Thin washer (`movement-9`) | Hour wheel 1 (`movement-26`) | Explicit puzzle assumption |
| Ratchet wheel 1 (`movement-14`) | Barrel assembly 2 (`movement-1`) | Explicit puzzle assumption |
| Ratchet wheel 2 (`movement-15`) | Barrel assembly 1 (`movement-2`) | Explicit puzzle assumption |
| Screw 26 (`movement-49`) | Ratchet wheel 1 (`movement-14`) | Explicit puzzle assumption |
| Screw 27 (`movement-50`) | Ratchet wheel 2 (`movement-15`) | Explicit puzzle assumption |
| Cannon pinion 2 (`movement-37`) | Center-wheel assembly (`movement-3`) | Explicit puzzle assumption |
| Motion-works wheel 3 (`movement-57`) | Retained mainplate | Foundation support |
| Hour wheel 2 (`movement-40`) | Cannon pinion 2 (`movement-37`), Motion-works wheel 3 (`movement-57`) | Explicit puzzle assumption |
| Motion-works bridge assembly 2 (`movement-58`) | Cannon pinion 2 (`movement-37`), Motion-works wheel 3 (`movement-57`), Hour wheel 2 (`movement-40`) | Explicit puzzle assumption |
| Screw 28 (`movement-42`) | Motion-works bridge assembly 2 (`movement-58`) | Explicit puzzle assumption |
| Screw 29 (`movement-46`) | Motion-works bridge assembly 2 (`movement-58`) | Explicit puzzle assumption |
| Jewel-set cap plate · WPL (`movement-8`) | Retained mainplate | Foundation support |
| Screw 30 (`movement-71`) | Jewel-set cap plate · WPL (`movement-8`) | Explicit puzzle assumption |
| Screw 31 (`movement-72`) | Jewel-set cap plate · WPL (`movement-8`) | Explicit puzzle assumption |
| Movement clamp 1 (`movement-38`) | Retained mainplate | Foundation support |
| Movement clamp 2 (`movement-39`) | Retained mainplate | Foundation support |
| Movement clamp 3 (`movement-41`) | Retained mainplate | Foundation support |
| Screw 32 (`movement-43`) | Movement clamp 1 (`movement-38`) | Explicit puzzle assumption |
| Screw 33 (`movement-44`) | Movement clamp 2 (`movement-39`) | Explicit puzzle assumption |
| Screw 34 (`movement-45`) | Movement clamp 3 (`movement-41`) | Explicit puzzle assumption |
| Three-hands dial (`central-dial`) | All movement work | Conservative face closure |
| Dial retaining screw 1 (`central-dial-screw-1`) | Three-hands dial (`central-dial`) | Explicit puzzle assumption |
| Dial retaining screw 2 (`central-dial-screw-2`) | Three-hands dial (`central-dial`) | Explicit puzzle assumption |
| Three-hands hour hand (`central-hour`) | Three-hands dial (`central-dial`), Dial retaining screw 1 (`central-dial-screw-1`), Dial retaining screw 2 (`central-dial-screw-2`) | Explicit puzzle assumption |
| Three-hands minute hand (`central-minute`) | Three-hands hour hand (`central-hour`) | Explicit puzzle assumption |
| Three-hands seconds hand (`central-seconds`) | Three-hands minute hand (`central-minute`) | Explicit puzzle assumption |
| Skeleton dial (`small-dial`) | All movement work | Conservative face closure |
| Skeleton hour hand (`small-hour`) | Skeleton dial (`small-dial`) | Explicit puzzle assumption |
| Skeleton minute hand (`small-minute`) | Skeleton hour hand (`small-hour`) | Explicit puzzle assumption |

## Workbench choice and internal rules

The geometry audit found source packets with enclosed contents (barrels), nested
supports and covers (balance, shock indicator, train/balance bridges), small press
fittings on both faces of a body (wheels and jewel-set plates), and many separate
markers/bushings in the authored dial and hand packets. These benefit from a
separate fixture where the packet can be turned without a mainplate blocking
its reverse face. The workbench deliberately covers the 35 existing multi-leaf
packets, including simple two-piece press fittings. This is a consistent puzzle
design choice; the source does not prove that every one requires a separate
bench during real assembly. Single outside-foundation leaves stay in the watch.

The table records source sizes to make that decision reviewable. The smallest
component span is its largest world-axis extent, derived from recorded bounds;
it is not a tolerance, shaft diameter or clearance measurement. A few packets
span the whole movement but contain very small separate details.

| Workbench packet | Individually placed leaves | Smallest component span (mm) |
| --- | ---: | ---: |
| Barrel assembly 2 | 4 | 3.890 |
| Barrel assembly 1 | 4 | 3.890 |
| Center-wheel assembly | 3 | 0.460 |
| Center-wheel bridge assembly | 4 | 1.300 |
| Third-wheel assembly | 2 | 3.330 |
| Seconds-wheel assembly | 2 | 6.520 |
| Escape-wheel assembly | 3 | 1.380 |
| Pallet assembly | 6 | 0.984 |
| Pallet bridge | 4 | 0.800 |
| Balance assembly | 12 | 0.480 |
| Stop-spring assembly | 5 | 0.700 |
| Balance bridge | 14 | 0.898 |
| Shock-indicator assembly | 39 | 0.600 |
| Train bridge | 12 | 0.850 |
| Barrel bridge | 7 | 1.000 |
| Setting lever | 2 | 1.000 |
| Hand-setting wheel assembly | 2 | 1.386 |
| Hand-setting spring | 3 | 1.000 |
| Winding bridge | 3 | 1.650 |
| Crown-wheel plate | 3 | 1.400 |
| Motion-works wheel 2 | 2 | 4.650 |
| Motion-works wheel 1 | 2 | 2.416 |
| Hour wheel 1 | 2 | 1.799 |
| Cannon pinion 2 | 2 | 1.869 |
| Motion-works wheel 3 | 2 | 1.495 |
| Hour wheel 2 | 2 | 1.437 |
| Motion-works bridge assembly 2 | 4 | 1.400 |
| Jewel-set cap plate · WPL | 2 | 0.960 |
| Three-hands dial | 16 | 0.900 |
| Three-hands hour hand | 2 | 3.350 |
| Three-hands minute hand | 2 | 2.546 |
| Three-hands seconds hand | 2 | 2.106 |
| Skeleton dial | 17 | 0.818 |
| Skeleton hour hand | 2 | 1.664 |
| Skeleton minute hand | 2 | 1.368 |

Each first body is held by an unmodeled workbench fixture. It adds no inventory
leaf. Sibling attachments share their body prerequisite, so pins, jewels and
dial markers can be fitted in different orders. The following overrides replace
any generic body-to-attachment relation:

- Barrel arbor and mainspring precede the cover; the spring requires the arbor.
- Wheel blades, pinions and hubs use their explicit source supports. The escape wheel fits on its pinion, with the hub after both.
- The pallet safety component requires the staff and horns; its two jewels remain independent attachments.
- Balance eccentrics attach independently to the rim; staff → roller → impulse jewel and staff → collet → hairspring → stud → pin form separate internal relationships.
- Balance-bridge shock protection follows housing → setting → lower jewel → cap jewel → retaining spring. The diamond setting closes the same axial seat and therefore waits for the retaining spring; the diamond then requires its setting. Closing screws wait for the retained fittings.
- Train-bridge jewels require their own settings; cap plate waits for its jewel, and the two screws wait for that plate.
- The shock indicator has independent X/Y fork branches and reset spring support; its bridge waits for both forks, mass, stepped pins, return spring and bridge foot. Outer pins, stops and screws follow their respective hosts.
- Central dial outer ring and centre share the transition ring; the logo needs the centre and the twelve indices need the outer ring. Skeleton markers need both rings.
- Each hand bushing precedes its blade. The prepared hand packet still requires the underlying dial/hour/minute installation before being transferred to the watch.

All internal edges are spelled out as stable IDs in the manifest. None are
computed from label text, display sort order, readiness or the previous action.

## Mechanical and visibility limits

Visible-seat validation samples the incoming source surface and rejects camera
rays intercepted by fitted opaque geometry. It does not hide fitted meshes,
recolor materials or accept a target through a cover. Reveal explicitly searches
a clear viewpoint. This is a visual placement check, not swept-solid collision
detection or proof of a physically possible insertion path. The recorded source
exceptions and expert-review gate remain in force.

The state validator replays each saved action against prerequisites. It rejects
unknown, duplicate and out-of-order dependencies. CPU validation completes 40
different choices of ready actions per level. Browser traversals additionally
check actual source seats, real pointer/touch/keyboard releases, material/visibility
stability and exact 265-leaf completion. Results and remaining review limits are
recorded in [the redesign report](PLAY_REDESIGN.md).

### Geometry-discovered cover guard

The first reverse-order Hard browser run stopped at the balance-bridge cap jewel
(`221:2 / 202:3`), with the diamond setting and diamond already present. Their
source bounds overlap the jewel in XY and lie outside it toward negative Z:
cap jewel Z = −4.430…−4.350 mm; diamond setting Z = −5.600…−4.600 mm.
The bridge/jewel setting blocks the other side. The exposed-surface check found
no usable sample through the installed outer fitting, so the placement was
correctly rejected. This was a real construction-state gap in the initial DAG.

The diamond setting (`221:3 / 223:1`) now requires the shock-protection retaining
spring (`221:2 / 202:4`). This closes the outer seat only after both jewels and
the spring are complete. The stud and the two locating pins remain independent;
the observation does not justify imposing their historical ordering. The failed
report is retained locally under `artifacts/browser/play-redesign/production/`
as `hard-initial-cover-failure.json` with its screenshot. Final reruns verify the
corrected guard and complete watch. This is recorded visual/source evidence,
not an expert mechanical certification.
