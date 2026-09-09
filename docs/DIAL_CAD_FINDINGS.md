# Dial configuration CAD findings

Reviewed 9 September 2026 for the local dial-and-hands implementation. The authoritative fitted occurrence list is `assets/authored/dial-configurations.json`. Geometry, original STEP, generated GLB and every source transform remain unchanged. These are static presentation configurations, not certified manufacturing configurations or synchronized time indications.

The original assembly SHA-256 is `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. Analytic evidence is reproduced with `.venv-cad/bin/python scripts/cad/dial_fit_probe.py` and written to ignored `artifacts/dial-cad/source-fit.json`. The current run passes all **50 analytic checks**. The probe imports the original STEP, reads analytic cylindrical faces, applies the preserved occurrence matrices and measures actual face boundary Z ranges; it does not infer an axle from a bounding-box center. The known nonfatal STEP FixShape warning remains present.

## Reviewed configurations

For compact source references below, **C** means `p_0_1_1_1__0_1_1_1_2__0_1_1_22_`; **S** means `p_0_1_1_1__0_1_1_1_1__0_1_1_2_`. Every abbreviated assembly child below is expanded into exact leaf IDs in the configuration JSON. No assembly geometry or duplicate blade is added twice.

| Face/style | Hour, minute, seconds blades | Supporting leaves | Total fitted leaves including structure |
| --- | --- | --- | --- |
| Central / Fine (default) | C6 d28, C2 d24, C10 d30 | C22/33:1 d34, C24/37:1 d38, C25/40:1 d41 | 22 |
| Central / Lance | C14 d31, C18 d32, C9 d29 | Same three modeled bushings; C9 XY alignment in fitted view | 22 |
| Central / Open lance | C22/33:2 d35, C24/37:2 d39, C25/40:2 d42 | Same three modeled bushings | 22 |
| Small / Lance (default) | S16/10:1 d11, S5/6:1 d7; no seconds | S16/10:2 d12, S5/6:2 d8 | 21 |
| Small / Broad lance | S26/20:1 d13, S20/15:1 d16; no seconds | S26/20:2 d12, S20/15:2 d8 | 21 |
| Small / Pear | S23 d18, S24 d19; no seconds | S16/10:2 d12, S5/6:2 d8 | 21 |

The central structure consists of C1 transition ring, C4 outer dial, C5 inner dial, C23 logo and the twelve d25 markers at C3/7/8/11/12/13/15/16/17/19/20/21. Both pins of each marker align with the outer dial's modeled holes. The logo's source footprint matches the recessed lettering in the inner dial; its original Z extent is -0.25 to +0.3001 mm.

The small structure is S19/d14 four-segment carrier, S28/d21 enamel, all twelve d5 markers at S3/4/6/7/8/9/10/12/13/14/15/27 and all three d9 screws at S11/17/22. The twelve marker pin axes match the carrier's twelve mounting bores at radius 8.15 mm about (0, 7.4). Source pin radius is 0.105 mm and carrier bore radius is 0.100 mm, a modeled press-fit overlap. The three screw axes match the three 0.300 mm carrier bores at world XY (-4, 6.6), (4, 6.6), (0, 11.2) mm. Screws retain their distinct original source Z placements.

User follow-up chooses only one display at a time (Movement, Dial A or Dial B). The central face points +Z (`side: front`), and the small face points -Z (`side: back`). All internal motion-work occurrences remain in the movement. Movement presentation merely hides these added external assemblies.

## Axles and supports

All approved central blade bores and bushings lie on world XY (0, 0) mm; all approved small blade bores and bushings lie on (0, 7.4) mm, aligned with their respective existing motion-work arbors. Raw source hand poses differ between styles and remain unchanged. Fitted hand poses now indicate 10:10:00; see [HAND_TIME_REVIEW.md](HAND_TIME_REVIEW.md).

| Support fit | Blade bore radius | Bushing seat radius | Blade bore Z interval | Seat Z interval |
| --- | --- | --- | --- | --- |
| Central hour | 0.900 | 0.905 | +0.45 to +0.65 | +0.47 to +0.65 |
| Central minute Fine | 0.700 | 0.705 | +1.07 to +1.23 | +1.07 to +1.25 |
| Central seconds | 0.500 | 0.505 | +1.57 to +1.77 | +1.59 to +1.77 |
| Small hour Pear | 0.495 | 0.500 | -6.30 to -6.10 | -6.30 to -6.07 |
| Small minute Pear | 0.345 | 0.350 | -6.66 to -6.46 | -6.66 to -6.48 |

These matching analytic bores, overlapping seat depths and identical seat dimensions to the source's explicitly pressed assemblies support sharing the existing bushing occurrences with Fine and Pear. A naked blade is not presented as a complete hand. The central hour bushing's 0.750 mm internal radius mates to the existing d142 hub radius, and central minute bushing's 0.400 mm internal radius matches the existing d137 cannon pinion seat. The source small-hour bushing radius 0.335 mm versus hub radius 0.345 mm also includes an interference allowance.

The existing small-minute bushing/shaft geometry has a nominal 0.02 mm axial end gap between the analytic cylindrical intervals (shaft d184 reaches -6.36 mm; the bushing d8 bore interval ends at -6.38 mm). Chamfered ends and source tolerances are not a demonstrated working press fit. This tiny inherited detail is preserved across all three styles and disclosed; no geometry is stretched, moved or invented to conceal it. Static visual placement does not certify assembly tolerances, time synchronization or working mechanics.

## Default enamel and source overlap

The [maker's description](https://www.marcolangwatches.com/en/watches/) specifies a silver central dial, blue translucent enamel on the skeletonized reverse dial and hours/minutes on that side. It also explains that both displays coexist and that strap attachment determines the outward face. The [assembly download](https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/) supplies the source assembly and reference renders. These pages were checked during this review.

The existing high-resolution `REF-MAKER-01` local photo (`assets/reference/finishing/maker-Front_2_Werk-6000x4496.jpg`, original provenance in `assets/source-manifest/finishing-references.json`) was visually inspected. It shows the four curved segments, twelve applied markers, three central fixings and blue enamel. The source hand silhouettes are labeled Fine, Open lance, Lance, Broad lance and Pear from their actual shapes and names; the maker's generic Cathedral terminology is not substituted for a different CAD shape.

**The source is not a clean nonintersecting enamel/carrier solid assembly.** Original d14 and d21 have a Boolean common volume of **3.477922 mm³** (carrier volume 66.519743 mm³, enamel volume 16.896254 mm³) and share the outward plane Z=-5.7 mm. This is an existing material-layer modeling overlap. An exact-instance fitted-enamel material depth bias is required to prevent coplanar flicker, while preserving geometry and transforms. Treat the result as an authored enamel coating presentation; it does not repair or validate those source volumes. Live front/oblique review must confirm stable layering.

Only S28/d21 receives the blue presentation when fitted. Its original red name/source interpretation remains intact in the raw catalog. S2/d4 and unrelated enamel remain red. Numeric color/translucency settings are authored visual approximations, not measured enamel optics. The appearance ledger must record this scope separately from its raw source record.

## Alternative dispositions after user review

- **Central Lance — now enabled with a fitted-only correction:** C9/d29 is actually displaced. The original analytic seconds-hand bore is at local XY (0, 0), transformed to world (12.425439, 7.081742) mm — **14.301839 mm from the central arbor**. It is not merely an off-axis source origin. There is no centered occurrence of this definition. C14 hour and C18 minute are centered, but there is no complete placeable Lance trio at the supplied transforms. The subsequent user-requested pose review verifies all three bore/seat fits and enables the complete trio with XY-only translation of C9 to the arbor. No Z change or mixed-family replacement is used. See [HAND_TIME_REVIEW.md](HAND_TIME_REVIEW.md).
- **Loose Broad lance blades S18 and S25:** duplicate shapes supplied inside the complete S26/S20 assemblies. Retain the complete assemblies' blade and bushing leaves once; exclude the loose copies from fitting.
- **Curved ring S1/d3 plus S2/d4 enamel:** source center Y=7.5 mm, whereas the supplied hands and screws use Y=7.4 mm. Each fixing misses its source screw axis by 0.1 mm; its marker-hole radius is 8.25 mm rather than the placed markers' 8.15 mm. Do not translate the old ring or stack it over the selected one.
- **Straight-spoke ring S21/d17:** centered on the movement axle and screw positions, but its marker bores still use radius 8.25 mm, and no complete matching enamel occurrence was established. It is a distinct alternative, not a structural layer of d14.

All excluded source objects remain individually reachable in the raw catalog. No CAD alternatives are deleted.

## Central inner-dial defect and visual evidence

Original d27 is an invalid imported BRep. Re-import confirms **10,090 faces**, matching the generated record. The already recovered catalog mesh contains **33,194 triangles**, **zero missing triangulated faces**, **zero degenerate triangles** and finite bounds within approximately 0.00743 mm of the recorded source bounds. All existing mesh vertices and source placements are retained. The analytic central bore is radius 1.05 mm; the original top surface is Z=+0.20 mm, below the hour blade's +0.45 mm hub plane.

A local CAD projection contact sheet at `artifacts/dial-cad/source-contact.png` was generated directly from the unchanged cached meshes and inspected. It covers all five approved styles on their selected dial and the excluded displaced Lance set. The five shapes are distinct and complete in projection; the displaced seconds alternative is visibly disconnected. The inner dial's recovered surface and silhouette are present without a gross hole or missing sector. This flat CAD projection is supplementary evidence, not a substitute for the lead task's real-renderer material, depth, oblique and interaction review under `artifacts/browser/dial-and-hands/`.

No BRep repair, geometry normalization, mechanical animation, source redistribution or publication is performed by this audit. Expert mechanical, human and physical-device review remain outside this recorded evidence.
