# Authored mechanism-group validation

> Historical audit of the initial candidate groups, not an outstanding task list. Later membership and visibility evidence is in [EXPLORE_EMPHASIS_REVIEW.md](EXPLORE_EMPHASIS_REVIEW.md).

Validated 9 September 2026 against `assets/authored/mechanisms.json`, `artifacts/preflight/assembly-inventory.json`, `artifacts/analysis/mechanism-group-candidates.json`, and the stable-ID implementation in `scripts/cad/export_assembly.py`. This review changes no application or authored asset.

## Identity and reference integrity

The authored identity contract is correct.

- `movementRoot` `p_0_1_1_1__0_1_1_1_4` is the exact exporter form of source instance path `0:1:1:1/0:1:1:1:4` (`ml01 Werk montiert einbaufertig`).
- `directChildPrefix` `p_0_1_1_1__0_1_1_1_4__0_1_1_83_` matches the exporter's `p_` prefix plus `:` to `_` and `/` to `__` conversion.
- Every integer referenced by `members`, `context`, or `obstructions` resolves to an existing direct child `0:1:1:1/0:1:1:1:4/0:1:1:83:N`; there are no missing or out-of-prefix references.
- These integers address direct-child assembly nodes as intended. Selecting an assembly member must include descendants; otherwise barrels, balance, pallet, shock indicator, and compound wheels will highlight only an empty hierarchy node.
- No completed movement GLB or assembly manifest was present during this check, so exact runtime node preservation could be established from the deterministic exporter code and source inventory but not rechecked against a final generated asset.

## Group findings

| Group | Source membership result | Core/context assessment | Scope status |
|---|---|---|---|
| Regulation | Members `7` balance, `13` pallet, and `62` escape wheel exactly match the high-confidence source candidates. | `16` pallet bridge and `59` balance bridge are correct context. `6` train bridge and `54` baseplate are defensible scene context. | Complete for the named movement core; expert motion review remains open. |
| Energy | Members `1` and `2` are the two complete barrel subtrees. | Members `14` and `15` are two placed instances of `ml01 Sperrrad z62 m0,20` at the barrel centers. They belong to the winding input path or reveal context, not stored-energy core. `60` barrel bridge is correct context. | Complete after reclassifying `14`/`15`; spring behavior remains unverified. |
| Transmission | Members `3`, `4`, `63`, and `65` are supported wheel/train candidates. | Member `62` is explicitly the escape-wheel assembly and is already regulation core. Use it as transmission endpoint context unless deliberate cross-group core overlap is desired. Context `6` train bridge, `61` minute bridge, and `54` baseplate is well supported by names and placement. | Reasonable source-name subset; no mesh/contact graph proves the connected train. |
| Display | Members `20`, `26`, `37`, `40`, `55`, `56`, and `57` exactly match the internal two-face motion-work candidates. Context `58` is the second motion-works bridge. | Core/context classification is sound for the movement subtree. | Incomplete as a visitor-facing “Two faces” group because both dial/hand roots live outside the movement-only asset and contain overlapping alternatives. |
| Winding | `27`, `28`, `30`, `31`, `32`, `47`, `69`, `70`, `74`, `76`, and `80` are appropriately named core or conditional candidates. Member `5` (`ml01 Kupplungsrad z17 m0,15`) is spatially colocated with the crown/stem cluster at `[14.200, 0.000, -2.500]` mm and fits winding better than the earlier name-only transmission candidate. | `75` is `ml01 Kronradplatte verstiftet`, a structural plate, so move it from members to context. `64` winding bridge is already correct context. `53` and `66` are unresolved overlapping alternatives/state representations. | Broadly complete inside the movement; the visitor-visible crown lies in the excluded case subtree. |
| Shock | Member `29` is the complete `shock indication montiert` subtree and confirms this optional mechanism is present. | `54` baseplate is valid context. The reset corrector lies outside the movement-only asset. Obstruction `59` is weakly supported without rendered bounds and should be retained only if a reference render shows it obscuring the indicator. | Core assembly complete; reset input absent from the movement-only runtime scope. |

## Required factual corrections

1. In `energy.members`, move `14` and `15` to context, or to the winding group if the winding path is later verified. Their exact name is `ml01 Sperrrad z62 m0,20` and both reuse definition `0:1:1:131`; their source-world origins are `[6.204, 8.106, -1.000]` and `[-6.200, 8.100, -1.000]` mm. The barrel subtrees `1` and `2` already contain the stored-energy core.
2. In `winding.members`, move `75` (`ml01 Kronradplatte verstiftet`) to `winding.context`. It is a plate assembly at `[10.920, 0.000, -4.570]` mm rather than a driven control or wheel.
3. Do not show both `53` (`ml01 Winkelhebelfeder`) and `66` (`ml01 Winkelhebelfeder 2 Positionen`) as simultaneous core parts. They use different definitions (`0:1:1:193` and `0:1:1:244`) but have exactly the same source-world origin `[14.545373, -3.629766, -0.780000]` mm. Compare their bounds/meshes and source reference configuration, then select one variant or encode explicit mutually exclusive states.
4. In `transmission.members`, reclassify `62` (`ml01 Gangrad Niv20.5 vernietet`) as context/endpoint because it is the escape wheel and already the regulation group's core. Keeping it in both core lists is technically possible, but the current captions present two distinct visitor concepts and duplicate highlighting obscures that boundary.
5. Keep `5` in winding, as currently authored. Its source name “coupling wheel” was ambiguous during name-only grouping, but its `[14.200, 0.000, -2.500]` mm placement beside the stem/crown cluster supports the authored choice. Mechanical engagement still needs review.
6. The display caption promises “displays on both faces,” while the runtime root deliberately excludes source roots `0:1:1:1/0:1:1:1:1` (`Gruppe Zifferblatt dezentrisch 18`) and `0:1:1:1/0:1:1:1:2` (`ml01 Zifferblatt Front DM33,4 montiert`). Either load a reviewed dial/hand subset for this view or narrow the caption to the two internal motion works. Do not include whole dial subtrees until overlapping hand and dial-ring alternatives are resolved.
7. A complete shock-reset story requires case corrector source path `0:1:1:1/0:1:1:1:3/0:1:1:43:7/0:1:1:69:8` (`Korrektor montiert`). The current movement-only asset cannot show that input. Keep the current caption's validation caveat, or add the reviewed corrector separately later.

## Camera-target check

The camera targets use the declared `source-world-mm` coordinate space. Direct-child origins are useful pivot evidence but are not geometry centroids; assembly roots may have an origin far from visible descendants. Targets therefore need final rendered-bounds confirmation.

| Group | Authored target (mm) | Source-origin evidence | Assessment |
|---|---:|---|---|
| Regulation | `[0, -8, -2.8]` | Balance `[0, -10, -3.39]`, pallet `[-1.00, -7.07, -1.91]`, escape wheel `[-2.00, -4.13, -2.57]` | Good focus on balance/pallet contact area. |
| Energy | `[0, 8.1, -2.8]` | Barrels `[-6.2, 8.1, -4.29]` and `[6.2, 8.1, -2.10]` | Good midpoint; final bounds should confirm depth. |
| Transmission | `[0, -2.5, -3]` | Minute wheel `[0, 0, -2.98]`, wheel `4` `[-2.68, 0.97, -2.07]`, third wheel `[3.17, -3.62, -4.02]`, seconds wheel `[0, 0, -3.83]`, escape wheel `[-2.00, -4.13, -2.57]` | Plausible lower-train bias; render confirmation required. |
| Display | `[0, 4, -3]` | Side-1 parts cluster near `y=0`; side-2 parts cluster at `y=5.0–7.4` | Good midpoint for internal motion works. It cannot frame excluded dial/hands. |
| Winding | `[11, -3, -2]` | Named controls span roughly `x=5.3–15.8`, with the stem/coupling around `x=11–14` | Good core target; a wider frame may be needed for the full lever set. |
| Shock | `[-9, 0, -3]` | Forks/mass cluster near `[-9.98, -0.70, -3.8]`; ten named functional indicator parts span origins `x=-16.01…-9.56`, `y=-5.33…3.33`, `z=-5.17…-2.22`, with mean `[-11.92, -0.76, -4.05]` | Good for the mass/forks, incomplete for the complete indicator and reset/latch parts. |

For the shock view, choose the target from the intended story:

- Use approximately `[-10.0, -0.7, -3.9]` mm for a tight mass-and-forks view. This is the strongest match for the current caption's “records an impact” moment.
- Use approximately `[-11.9, -0.8, -4.1]` mm for the whole functional indicator. Increase framing enough to include reset/latch parts reaching `x=-16.0` and the stop frames extending to `y=-5.3…3.3`.

The current `[-9, 0, -3]` target is displaced about `+1.0, +0.7, +0.9` mm from the mass/forks cluster and about `+2.9, +0.8, +1.1` mm from the named functional-part mean. It should be corrected before judging obstruction choices. The assembly root's own `[0, 0, -3.55]` origin is not a usable target because most visible functional descendants sit on the negative-X side.

## Scope completeness

The six authored groups provide good movement-level coverage and all direct-child references are resolvable. Regulation is the cleanest evidence-backed core. Energy needs ratchet-wheel reclassification; winding needs its plate moved to context and overlapping spring alternatives resolved; transmission should treat the escape wheel as an endpoint; display and shock are intentionally incomplete while the runtime contains only the movement subtree.

Before the grouping can be called final, generate the assembly manifest/GLB, verify recursive selection against actual node names, compute aggregate bounds for each accepted member set, inspect all camera presets and obstructions in rendered front/back/oblique views, resolve the dial/hand and `53`/`66` alternatives, and record the chosen external crown/corrector strategy.
