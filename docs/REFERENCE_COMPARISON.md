# Maker-reference comparison

Prepared 9 September 2026 from the local CAD diagnostics and three visible maker-hosted reference images. This is a visual identity and variant comparison only. It does not validate dimensions, tolerances, contact, assembly procedure, or mechanical correctness.

## References and access

The comparison uses two primary maker pages:

- Complete-assembly page: <https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/>
- Zweigesicht-1 watch and movement page: <https://www.marcolangwatches.com/en/watches/>

The pages exposed exact image URLs for `Front_2_Werk.png`, `shockindication5.png`, and the `ml01 zweigesicht Front1` thumbnail. The web fetcher returned `Cache miss` for each image body, so the same maker-hosted URLs were retrieved only into ignored `artifacts/analysis/source-references/` for local inspection. Exact URLs, byte counts, dimensions, and SHA-256 hashes are recorded in `artifacts/analysis/reference-provenance.json`. No image or CAD was uploaded or published.

The local comparison targets are `artifacts/cad/reference-renders/movement-front.png` and `movement-back.png`. Per `docs/CAD_AUDIT.md`, those names mean +Z and −Z source-axis views; they are not maker face names.

## Strong visual correspondence

The maker's `Front_2_Werk` reference is a clear match for the local **movement-back** (−Z) render. The following large-scale geometry and placement agree recognizably:

- The free balance sits at the top beneath a long, shallow-arched balance bridge.
- Two large barrels occupy the lower left and lower right, each partly covered by a separate sweeping bridge.
- The three-armed central train bridge, its three jewel positions, the open gold-colored train wheels, and the small lower escape-wheel bridge occupy the same relative positions.
- The large crown wheel is at the upper right, aligned with the stem exiting to the right.
- The shock-indicator assembly occupies the left edge opposite the crown wheel, matching the maker's written placement description.
- The peripheral `marco lang` and `zweigesicht-1` inscriptions, the central `No 00/18` cartouche, and the `ml` monogram occur on the same bridge regions.
- The movement outline, stem side, bridge apertures, screw pattern, jewel locations, and broad negative spaces agree well enough to identify the same ml-01 construction rather than only a generic movement.

The maker's exploded `shockindication5` reference also corresponds to the distinctive source subtree visible assembled at the left of `movement-back`: the bat-like upper bridge, paired fork structures, curved toothed/stop sectors, central cylindrical mass, intermediate plates, and lower base plate are recognizable. Because one image is exploded and the local image is assembled, this comparison supports component identity and approximate ordering, not final clearances or contact.

The local **movement-front** (+Z) render has a circular plate, twin large barrel/ratchet forms across the upper half, a central wheel cluster, winding/setting works at right, and a rightward stem. In the maker's `ml01 zweigesicht Front1` complete-watch thumbnail, this side is covered by the finished Roman-numeral dial and case. Only the circular alignment and crown/stem side can be compared directly; the thumbnail does not expose enough internal geometry to confirm the visible movement-front placements.

## Orientation finding

The source-axis labels and maker face labels differ: maker `Front_2_Werk` corresponds to local `movement-back` (−Z), not local `movement-front`. Product copy and camera controls should use maker-facing names only after this mapping is encoded. Retain +Z/−Z terminology in CAD diagnostics to avoid silently flipping transforms.

## Exact visible differences and ambiguities

| Area | Maker reference | Local movement render | Finding |
|---|---|---|---|
| Display on maker Front 2 | Large blue skeletonized dial/motion-work ring with blue hands overlays the center and lower half. | Movement-only render omits the external dial/hand roots. | Expected scope difference. The local movement geometry beneath it still aligns, but the visitor-facing second display is incomplete. |
| Face 1 display | Complete-watch thumbnail shows a white/silver Roman-numeral dial, applied markers, and purple/blue hands inside the case. | `movement-front` is a bare movement-side diagnostic. | No internal visual comparison is possible through the opaque dial. The source tree contains overlapping dial/hand choices, so the thumbnail does not by itself select every source variant. |
| Bridge and plate finish | `Front_2_Werk` shows bright/polished steel bridges over a rose-gold-colored plate and barrels. | Diagnostic shading is predominantly matte white/gray. | Finish mismatch is expected; source-color diagnostic materials are not a finish study. |
| Wheels | Maker reference shows warm hard-gold-colored wheels. | Selected train wheels are peach/copper; many other parts remain white/gray. | Broad warm-metal cue matches, exact alloy hue/roughness does not. |
| Screws and hands | Maker reference prominently uses heat-blue screw heads and blue display/shock hands. | Screws are largely white/gray and the movement-only view has no display hands; some source-color details appear dark or orange. | Finished bluing is absent or inconsistently represented. Do not treat diagnostic colors as authoritative. |
| Jewels | Maker reference shows saturated ruby/purple jewels and a bright central diamond setting. | Ruby positions are red/pink and the hierarchy retains an empty `030-Brilliant_200` mesh. | Jewel placement corresponds visually; the diamond geometry is known incomplete and brilliance/optics are not represented. |
| Engraving | Maker reference shows `marco lang`, `zweigesicht-1`, `No 00/18`, and the `ml` mark. | The same inscriptions are visible in the same areas. | Strong geometric match. `00/18` is a reference/CAD serial placeholder, not evidence for a production watch's unique number. |
| Shock option | Maker movement reference visibly installs the shock indicator at left. Maker text says it is optional and may be replaced by a personal engraving plate. | Local movement includes `shock indication montiert` at left. | The local CAD is the shock-indicator variant. It must not be presented as universal to all Zweigesicht-1 watches. |
| Shock finish/state | Maker exploded image uses polished steel, blue upper details, a red/pink mass, and separated components. | Local view shows an assembled, mostly white/gray cluster. | Geometry is recognizable; finish, separation path, and operating state remain unvalidated. |
| Balance details | Maker image shows a dark-blue hairspring, warm eccentric weights, polished bridge, and diamond cap. | Local render preserves the balance/hairspring silhouette and eccentric placements but uses generic pale materials; one eccentric definition has missing faces. | Placement matches; finish and complete surface fidelity remain open. |
| Winding spring alternatives | Maker `Front_2_Werk` does not expose the +Z overlapping setting-spring pair. | `movement-front` shows visible black/white interference at lower right where children 53 and 66 share placement/bounds. | This is a source-variant/z-fighting ambiguity, not a maker-reference feature. Choose a reviewed alternative before presentation. |

## What the comparison establishes

The local −Z movement render has strong visual correspondence to the maker's published `Front_2_Werk` in silhouette, major components, relative placement, bridge cutouts, engraving layout, and installed shock-indicator variant. The local +Z movement render cannot be comparably checked against the available complete-watch Front 1 thumbnail because the finished dial hides the movement side.

The comparison does not clear the source-fidelity gate by itself. Exact finish, production engraving, dial/hand selection, the empty diamond definition, incomplete eccentric faces, the overlapping winding-spring alternatives, and the optional shock-versus-engraving-plate configuration remain unresolved. Mechanical relationships and correctness remain outside this visual review.
