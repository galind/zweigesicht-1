# Explore emphasis review — 11 September 2026

## Contract

One authored-finish view remains authoritative. Function/Finish controls were already retired; legacy treatment input remains discarded by state normalization. Selection does not introduce a second material treatment.

The previous controller multiplied base colors by 0.10/0.16 and replaced metalness/roughness with 0.05/0.95. Source-face shader overrides could escape that darkening, producing inconsistent patches. Reveal removed every nonmember/noncontext at 0.5, making connected mechanisms disappear abruptly.

The first emphasis milestone was rejected in user review. It retained too much visual competition, shrank the focused mechanism by framing the whole movement, and failed to retire child packets attached to lifted covers. Passing material-value tests did not establish a usable view.

The refinement keeps the final-lighting approach but distinguishes roles: active members retain full physical lighting; explicit explanatory context receives 85%, related parts in the same authored host receive 55%, the main plate receives 32%, and unrelated surroundings receive 20%. The plate's pressed jewels remain contextual. A small edge-only cue replaces the colored fill that washed out finishes. Individually selected parts take precedence. Base material color, roughness, metalness, grain, anisotropy and transmission remain authored.

`focusRole` derives related context from leaf membership in the authored host graph, including assembly descendants. Keyless setting springs and winding supports stay readable. Camera framing uses the selected mechanism plus 2.5 mm of context, rather than the complete assembly envelope. The visible movement can extend beyond a focused close-up; active parts must stay within the viewport at a useful size.

Uncover visibility now follows host ancestry. In particular, rear-display components inherit the barrel bridge's lift and visibility, preventing floating parts from obstructing the shock or balance view. Active members and explicitly selected parts still take precedence. The balance bridge and its two authored obstruction screws fade out together over 280 ms to expose the spring, and fade back from their current level on reversal. This is an explicitly described visual cutaway, not a mechanical disassembly. Lowering Uncover restores them. No other surrounding part is hidden by the former blanket 0.5 reveal cutoff.

Stable visible materials remain opaque with their authored depth settings. Only the short cover transition uses temporary alpha; its original opacity, transparency and depth-write values are restored at both endpoints. SurfaceOcclusion excludes transitioning covers from opaque contact depth, just as it already excludes fading dials. The local contact shading strength remains 24%.

## Six-group audit

| Group | Primary emphasis | Context retained and readable |
| --- | --- | --- |
| Balance & escapement | Balance, pallet and escape-wheel assemblies | Supports, main plate and adjoining train; named balance bridge and screws form a reversible cutaway |
| Twin barrels | Both barrel assemblies | Ratchets, plate and visible train; barrel bridge follows its reveal path |
| Wheels & pinions | Center, third, seconds and escape-wheel chain | Plate, surrounding barrels and supports; authored bridge/regulator reveal remains |
| Time display | Both motion-works chains | Main plate, motion-works support, adjacent winding and barrel components |
| Winding & setting / keyless | Stem, coupling, levers, winding gears and ratchets | Setting spring, winding support and plate; alternate spring excluded until explicitly selected |
| Shock indicator | Complete indicator assembly | Plate and adjoining movement retain depth and finishes; authored obstructing hosts retire after lifting |

All groups use the same hierarchy and preserve existing source-based membership data. No new mechanical relationship or correctness claim is introduced. The Explore menu identifies its selected section with a persistent inset marker and accessible pressed state.

## Verification

The source/runtime suite covers all six groups across reveal 0, 0.49, 0.51 and 1; role/material/depth/visibility restoration; selected-spring priority; plate/context contrast; inherited rear-display cover status; interrupted cutaway reversal; and exclusion of fading covers from contact depth.

The real-browser suite also measures projected focus size and viewport containment for every group before orbit/separation. It exercises interruption, Back, reset, isolation, reduced motion, reveal reversal, GPU resource stability and on-demand rendering. This closes the coverage gap in the previous milestone, whose tests could pass even with tiny mechanisms and floating occluders.

Visual evidence is kept in ignored `artifacts/browser/explore-focus-refinement/`, using desktop 1440×900 and mobile viewport 390×844. Mobile testing is viewport/handler emulation, not physical-device certification. Mechanical and human comprehension review gates remain open. No CAD assets were changed or published.
