# ml-01 source and mechanism map

> Historical candidate map. Later source validation is in [CAD_AUDIT.md](CAD_AUDIT.md); running motion was removed in [ANIMATION_REVIEW.md](ANIMATION_REVIEW.md).

Prepared 9 September 2026 from the verified local STEP provenance and the XCAF inventory. This is a source-led candidate map, not a mechanically reviewed bill of motion. Source paths below are candidate identities; the exported manifest records runtime IDs.

## Evidence boundary

The source assembly is `assets/source-originals/ml01-zweigesicht.stp`, recorded with SHA-256 `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b` in `assets/source-manifest/sources.json`. Its maker page identifies the package as `ml01 zweigesicht`, dated 27 July 2023, and provides front images plus STEP/STL downloads: <https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/>.

The inventory at `artifacts/preflight/assembly-inventory.json` records one root (`0:1:1:1`, `ml01 zweigesicht`), 426 named component instances, 255 unique referenced definitions, and 388 non-identity placements. The root's five direct children are:

| Source path | Exact source name | Interpretation |
|---|---|---|
| `0:1:1:1/0:1:1:1:1` | `Gruppe Zifferblatt dezentrisch 18` | Off-centre dial group, including alternate dial/hand parts |
| `0:1:1:1/0:1:1:1:2` | `ml01 Zifferblatt Front DM33,4 montiert` | Assembled front dial, also including alternate hands |
| `0:1:1:1/0:1:1:1:3` | `ml01 Gehäuse SS montiert` | Case, crown, corrector, strap, and duplicated case/strap variants |
| `0:1:1:1/0:1:1:1:4` | `ml01 Werk montiert einbaufertig` | Ready-to-case movement; 82 direct children plus nested assemblies |
| `0:1:1:1/0:1:1:1:5` | `Regulierunterlage` | Separate regulating support/pad; function and intended visibility need review |

The maker describes the ml-01 as a 34 mm, 3 Hz movement with 70-hour reserve, two series-connected barrels, hours/minutes/central seconds on face 1, hours/minutes on face 2, seconds stop, and an optional four-direction resettable shock indicator: <https://www.marcolangwatches.com/en/watches/>. The same page identifies a lever escapement, free four-leg balance, eccentric regulation, and Breguet hairspring. These statements support visitor topics, but they do not provide pivots, phase, tooth-contact graph, or motion curves.

Marco Lang states that Solid Edge is the authoring system, STEP/STL are cross-platform exchange formats, and construction data may contain unfinished or less-emphasized details: <https://www.marcolangwatches.com/en/cad-2/>. Therefore names and hierarchy are evidence of identity, while mechanical relationships require geometry inspection and review.

## Candidate visitor groups

The authoritative machine-readable candidate set is `artifacts/analysis/mechanism-group-candidates.json`. A `subtree` selection means the named instance plus all descendants in the inventory. Confidence describes group membership from source naming, not mechanical correctness.

### Energy

**Caption:** Two compact barrels store the watch's power in series.

| Source path | Exact source name | Role / confidence | Reason |
|---|---|---|---|
| `0:1:1:1/0:1:1:1:4/0:1:1:83:1` | `ml01 Federhaus2 montiert` | Core / high | Assembled barrel 2; its subtree names drum II, cover, arbor, and mainspring. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:2` | `ml01 Federhaus1 montiert` | Core / high | Assembled barrel 1; its subtree names drum I, cover, arbor, and mainspring. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:60` | `ml01 Federhausbrücke verstiftet versteint` | Context / high | Named barrel bridge and likely reveal obstruction/support. |

Motion coverage: **unverified**. The maker confirms the barrels are connected in series, but the inventory alone does not establish the barrel-to-barrel coupling, winding path, output member, direction, angular ratio, slip behavior, or spring deformation. Keep this static until those are reviewed.

### Transmission

**Caption:** The wheel train carries stored energy toward the escapement.

| Source path | Exact source name | Role / confidence | Reason |
|---|---|---|---|
| `0:1:1:1/0:1:1:1:4/0:1:1:83:3` | `ml01 Minutenrad vernietet` | Candidate core / medium | Named minute-wheel assembly; descendants name a 12-tooth pinion and 64-tooth wheel. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:4` | `ml01 ÜFHMinRad z26 m0,15` | Candidate core / medium | Named 26-tooth wheel; abbreviation/contact partners unresolved. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:5` | `ml01 Kupplungsrad z17 m0,15` | Candidate core / medium | Named coupling wheel; operating role/contact partners unresolved. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:63` | `ml01 Kleinbodenrad vernietet` | Core / high | Train wheel assembly; descendants name a 10-tooth pinion and 75-tooth wheel. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:65` | `ml01 Sekundenrad vernietet` | Core / high | Seconds-wheel assembly; descendants name an 8-tooth pinion and 81-tooth wheel. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:6` | `ml01 Räderbrücke montiert` | Context / high | Named train bridge; retain as reference or lift as an authored obstruction. |

Motion coverage: **unverified**. Tooth counts embedded in names are evidence for individual parts, not proof that two chosen parts mesh. Do not derive ratios until the CAD audit establishes axes, center distances, modules, contact pairs, shared shafts, and output order.

### Regulation & escapement

**Caption:** The escapement meters the train while the 3 Hz balance sets the pace.

| Source path | Exact source name | Role / confidence | Reason |
|---|---|---|---|
| `0:1:1:1/0:1:1:1:4/0:1:1:83:7` | `ml01 Unruh montiert vorreguliert` | Core / high | Balance subtree includes the rim, four eccentric weights, staff, rollers, and hairspring. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:13` | `ml01 Anker montiert` | Core / high | Pallet assembly includes body, arbor, two pallet stones, horn, and knife. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:62` | `ml01 Gangrad Niv20.5 vernietet` | Core / high | Escape-wheel assembly includes the wheel, 9-tooth pinion, and hub. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:16` | `ml01 Ankerbrücke verstiftet versteint` | Context / high | Named pallet bridge. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:59` | `ml01 Unruhbrücke verstiftet versteint` | Context / high | Named balance bridge containing an Incabloc assembly and diamond setting. |

Motion coverage: **unverified**. The official 3 Hz rate establishes six beats per second, not the balance amplitude, unlock/impulse angles, pallet contact sequence, escape-wheel phase, hairspring deformation, or visible upstream stepping. Do not use uniform escape-wheel rotation or claim contact fidelity without reviewed evidence.

### Display

**Caption:** Two faces show the same movement from different sides.

| Source path | Exact source name | Role / confidence | Reason |
|---|---|---|---|
| `0:1:1:1/0:1:1:1:1` | `Gruppe Zifferblatt dezentrisch 18` | Variant set / high | Named off-centre dial group with several dial rings and hour/minute hand styles. |
| `0:1:1:1/0:1:1:1:2` | `ml01 Zifferblatt Front DM33,4 montiert` | Variant set / high | Named front dial with hour, minute, and seconds hand alternatives. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:20` | `ml01 Viertelrohr1 z12 m0,177` | Core / high | First-side cannon pinion. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:26` | `ml01 Stundenrad1 vernietet` | Core / high | First-side hour-wheel assembly. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:37` | `ml01 Viertelrohr2 vernietet` | Core / high | Second-side cannon-pinion assembly. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:40` | `ml01 Stundenrad2 vernietet` | Core / high | Second-side hour-wheel assembly. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:55` | `ml01 Wechselrad1 vernietet` | Candidate core / medium | First named intermediate motion-work wheel. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:56` | `ml01 Wechselrad2 vernietet` | Candidate core / medium | Second named intermediate motion-work wheel. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:57` | `ml01 Wechselrad3 vernietet` | Candidate core / medium | Third named intermediate motion-work wheel. |
| `0:1:1:1/0:1:1:1:4/0:1:1:83:58` | `ml01 ZW2 Brücke verstiftet versteint` | Context / high | Named second motion-works bridge. |

Motion coverage: **unverified**. Continuous time display is the intended operating mode, but the two motion-work paths and correct installed hand variants have not been established. The inventory appears to contain mutually alternative hands, so rendering every hand descendant would produce a false configuration.

### Winding & setting

**Caption:** The crown changes mode: wind the barrels, set the hands, or stop the seconds.

High-confidence named candidates are `0:1:1:1/0:1:1:1:3/0:1:1:43:2` (`ml01 Krone SS montiert`), movement children `.../0:1:1:83:27` (`ml01 Aufzugwelle`), `:28` (`ml01 Kupplungstrieb`), `:30` (`ml01 ZSTRad verpresst`), `:31` (`ml01 Kupplungshebel`), `:47` (`ml01 Zeigerstellhebel`), `:64` (`ml01 Aufzugsbrücke vestiftet`, context), `:69` (`ml01 Zeigerstellungsfeder verstiftet`), `:70` (`ml01 Winkelhebel vestiftet`), `:74` (`ml01 Kronrad z45 m0,15`), `:76` (`ml01 Sperrfeder`), and `:80` (`ml01 Sperrklinke`). Medium-confidence candidates are `:32` (`ml01 Stoppfeder vernietet`), `:53` (`ml01 Winkelhebelfeder`), and `:66` (`ml01 Winkelhebelfeder 2 Positionen`) because their exact state relationships or variants are unresolved. Full paths and reasons are in the JSON artifact.

Motion coverage: **conditional** and mechanically unverified. Winding, hand-setting, stem pull/push, and seconds-stop require distinct explicit modes. Nothing in the inventory proves lever travel, detents, engagement timing, crown/stem constraints, or which wheels are stationary in each state.

### Shock indication

**Caption:** A four-direction indicator records a shock and holds the reading until reset.

| Source path | Exact source name | Role / confidence | Reason |
|---|---|---|---|
| `0:1:1:1/0:1:1:1:4/0:1:1:83:29` | `shock indication montiert` | Core / high | Explicit assembled subtree; confirms the optional indicator is present in this CAD variant. |
| `0:1:1:1/0:1:1:1:3/0:1:1:43:7/0:1:1:69:8` | `Korrektor montiert` | Input context / medium | Case corrector is a plausible reset input; physical connection remains to be checked. |

The shock subtree explicitly names X/Y forks, X/Y underplates, a mass cylinder, hand-lever spring block, reset-slider stud, return spring, and stop frames. This agrees with the maker's description of a small weight deflecting two forks, each driving two hands held by fine locking teeth, with a user reset through a corrector.

Motion coverage: **conditional** and mechanically unverified. It should move only after an authored shock input and during reset. The CAD hierarchy does not establish displacement limits, direction mapping, latching tooth engagement, four hand pivots, reset travel, or spring response.

This indicator is separate from the two `incabloc_sous_937-21` assemblies nested under the baseplate and balance bridge. Those are balance shock-protection/support components, not evidence that they belong to the four-direction indicator animation.

## Hardest reveal recommendation

Use **regulation & escapement** as the hardest reveal target after geometry audit. It has the strongest visitor payoff and a compact, source-named core: balance, hairspring, pallet lever, pallet stones, and escape wheel. Reveal it in context by first muting the movement, then lifting the balance bridge and pallet bridge just enough to expose the contact zone while keeping their jewel centers as alignment references. Finish with a close oblique view that shows the pallet stones between the escape wheel and roller.

Treat the first implementation as a static, step-through reveal until pivots and contacts are reviewed. A faithful running sequence is harder than the reveal itself: it requires lock, unlock, impulse, drop, phase, amplitude, hairspring deformation, and intermittent upstream train motion. If the milestone requires reviewed motion immediately, the shock indicator may be a better second choice because the maker publishes a qualitative event sequence, but it still needs geometric state extraction.

## Unknowns blocking mechanically faithful connected motion

1. The inventory contains placements but no verified kinematic constraints, joint types, or mechanical relationship graph.
2. Rotational axes, pivot origins, axis signs, geometry-local corrections, and movable-vs-fixed boundaries are not recorded as reviewed runtime frames.
3. Meshing pairs, center distances, internal/external mesh classification, shared shafts, phase offsets, backlash, and tooth-contact validity have not been derived from geometry.
4. Several tooth counts and modules appear in source names, but not every wheel is named this way and names alone do not prove adjacency or engagement.
5. The two series-connected barrels' winding member, coupling, torque output, direction, relative travel, and mainspring end attachments are unknown.
6. Escapement lock, draw, drop, impulse faces, banking limits, balance amplitude, roller-jewel path, beat error, and initial phase are unknown. The 3 Hz specification supplies timing only.
7. The hairspring's active coils, fixed/mobile attachment frames, neutral shape, deformation envelope, and collision-free extrema have not been reviewed.
8. Motion-work routing from train to both faces is unresolved; the correct dial/hand configuration must be selected from apparent alternatives before motion is attached.
9. Winding/setting state transitions, stem positions, clutch engagement, lever travel, detents, click behavior, and seconds-stop contact are unknown.
10. Shock-indicator mass travel, X/Y mapping, fork-to-hand transfer, ratchet/latch increments, four hand pivots, return spring behavior, and corrector reset path are unknown.
11. The relationship between repeated definitions and each placed instance must survive export; definition IDs cannot replace instance paths where placement or selection differs.
12. CAD dimensions/units, accumulated transforms, visible omissions, variant correctness, and correspondence with the maker's two reference views still require the planned assembled render audit.
13. Source CAD is explicitly presented without a guarantee of complete correctness; any inferred connection needs recorded geometry evidence and mechanical review before being called faithful.

## Mapping evidence

Use the JSON artifact as a candidate functional graph layered over the source assembly tree. Do not turn these groups into runtime IDs by string rewriting alone. A validated mapping needs a source-path-to-runtime-ID table, visual confirmation and resolved alternatives. Any future motion edge needs an axis, pivot, ratio/curve, phase, operating mode, evidence and review status.
