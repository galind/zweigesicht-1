# Explore emphasis review — 11 September 2026

## Contract

One authored-finish view remains authoritative. Function/Finish controls were already retired; legacy treatment input remains discarded by state normalization. Selection does not introduce a second material treatment.

The previous controller multiplied base colors by 0.10/0.16 and replaced metalness/roughness with 0.05/0.95. Source-face shader overrides could escape that darkening, producing inconsistent patches. Reveal removed every nonmember/noncontext at 0.5, making connected mechanisms disappear abruptly.

Emphasis now acts on final physical lighting after source surface masks: active members retain full lighting with a colored edge light; individually selected parts get a stronger cue and the existing selection box. Authored context retains 90% lighting, other surroundings 68%. Base color, roughness, metalness, grain, anisotropy, transmission, opacity and depth remain authored. Reset restores neutral emphasis. The accent follows visible surface normals and respects depth, never drawing hidden geometry through foreground parts.

Only authored uncover hosts can disappear after moving clear by 24 mm; active members and explicitly selected parts remain visible. The unrelated-part reveal threshold is removed. The alternate setting spring remains exclusive. Fitted displays and isolation keep their explicit visibility rules. Camera destinations include the assembled movement envelope so retained surroundings are not cropped into fragments; manual orbit still cancels travel.

SurfaceOcclusion updates depth/camera uniforms after pose changes, limits contact darkening to 24%, excludes fading dials from opaque depth, and restores render state. It remains unchanged: this is local contact shading, not selection-wide darkening.

## Six-group audit

| Group | Primary emphasis | Context retained and readable |
| --- | --- | --- |
| Balance & escapement | Balance, pallet and escape-wheel assemblies | Supports, main plate, adjoining train; authored lifted covers retire |
| Twin barrels | Both barrel assemblies | Ratchets, plate and visible train; barrel bridge follows its reveal path |
| Wheels & pinions | Center, third, seconds and escape-wheel chain | Plate, surrounding barrels and supports; authored bridge/regulator reveal remains |
| Time display | Both motion-works chains | Main plate, motion-works support, adjacent winding and barrel components |
| Winding & setting / keyless | Stem, coupling, levers, winding gears and ratchets | Setting spring, winding support and plate; alternate spring excluded until explicitly selected |
| Shock indicator | Complete indicator assembly | Plate and adjoining movement retain depth and finishes; authored obstructing hosts retire after lifting |

All groups use the same hierarchy and preserve existing source-based membership data. No new mechanical relationship or correctness claim is introduced. The Explore menu identifies its selected section with a persistent inset marker and accessible pressed state.

## Verification

Source/runtime regression covers all six groups at reveal 0, 0.49, 0.51 and 1: physical material values, emphasis roles, opaque depth, retained visibility, selected-spring priority, shader placement and reset. Browser regression covers all six after orbit and section separation, plus interruption, Back, reset, isolation, reduced motion, visibility reversal, GPU resource stability and on-demand rendering.

Visual review uses desktop 1440×900 and mobile viewport 390×844, including Explore menu, all groups, orbit, separation and reset. Local evidence resides in ignored `artifacts/browser/explore-emphasis/`. Mobile testing is viewport/handler emulation, not physical-device certification. Mechanical and human comprehension review gates remain open. No CAD assets were changed or published.
