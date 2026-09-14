# Source appearance and surface fidelity audit

> Historical source audit. The Function-mode integration proposal below is retired; later appearance work is indexed in [README.md](README.md#appearance).

9 September 2026. Read-only audit of the verified original STEP, existing XCAF importer, tessellation cache, uncompressed GLBs, and the pre-refinement application material path. No source shapes, runtime geometry, placements, or original assets were changed. The source contains considerably more surface identity than the runtime manifest exposes, including modeled decorative grooves and lettering.

## Reproduce and evidence

From the repository root:

```sh
.venv-cad/bin/python -X faulthandler scripts/cad/finish_audit.py > artifacts/finishing-cad/audit.log 2>&1
```

The script checks assembly SHA-256 `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`, imports with the existing `.venv-cad`, reads existing definition caches, and independently re-tessellates 27 representative definitions at the existing 0.015 mm / 0.25 rad settings. It writes ignored local evidence:

- `artifacts/finishing-cad/audit.json`: complete appearance inventory and analytic-normal audit.
- `artifacts/finishing-cad/surface-summary.json`: representative face colors, XY plane levels, bounds, areas, cone angles, and original cylinder axes.
- `artifacts/finishing-cad/sidecars/`: separately generated finishing data for definitions 9, 85, 86, 90, 91, 99, 110, 111, 113, 131, 133, 136, 147, 155, 156, 159, 165, 169, 195, 219, 222, 226, 228, 230, 240, 249, 251.
- `artifacts/finishing-cad/sidecar-glb-validation.json`: exact float32 position/normal correspondence with original GLB buffers.
- `artifacts/finishing-cad/crown-regions.json`: exact installed radial/Z relationships for the crown wheel and its central plate.

The original nonfatal importer diagnostic about `gp_Dir2d()` remains recorded. An initial audit attempt hit an OCP binding segmentation fault while reading names from colored subshape labels. The final audit avoids that unnecessary name query; source face indices and label entries remain available. No importer replacement, repair, or dependency installation was needed.

## Source colors and materials

Counts distinguish reused definitions from placed occurrences. Faces/solids below are enumerated once per leaf definition, not multiplied by instances.

| Level | Total | Appearance result |
|---|---:|---|
| Referenced definitions, excluding assembly root | 255 | 131 have direct color; all 131 are leaves |
| Leaf definitions | 202 | 71 lack a definition-level color |
| Component occurrences | 426 | 0 direct component-label color assignments |
| Unique component labels | 377 | Reused subassemblies account for more occurrences than labels |
| Leaf occurrences | 365 | 224 occurrences return a color through `GetInstanceColor`; every result equals its definition color |
| Solids across leaf definitions | 203 | 136 return a shape color, including definition-level resolution |
| Faces across leaf definitions | 25,228 | 17,765 have face color; 60 leaf definitions contain more than one face color |
| Colored descendant labels of leaves | 17,771 | Includes 17,765 face labels and six additional subshape labels |
| XCAF color table | 26 | Original STEP: 24 RGB entries plus two predefined colors |
| XCAF physical-material table | 0 | No recovered material name, density, alloy or process assignment |
| XCAF visualization-material table | 0 | No recovered PBR material table |

`GetInstanceColor` results are **not evidence of 224 instance overrides**. The importer defaults to `GetSHUOMode() == false`, direct instance-label assignments are zero, and all resolved values equal the definition-level values. Raw STEP contains 17,898 `STYLED_ITEM` records and corresponding fill/style records, 39 `SURFACE_STYLE_RENDERING_WITH_PROPERTIES` records and 39 transparency properties, but no entity type containing `MATERIAL`. Its material-import mode defaults to enabled. This supports the narrower conclusion that this exchange file supplies display appearances, not manufacturing material evidence.

The RGBA audit recovers transparency that the RGB-only manifest misses: 15 definition-level colors have alpha below one, including sapphire glass 67 (0.30), ruby/jewel definitions such as 101/102/106/112/128 (0.60), and Incabloc stones 204/205 (0.808). Definition 156 has 20 directly colored transparent faces. These are display alpha values, not measured optical transmission or IOR.

Open Cascade exposes linear RGB here. For example, STEP gray `(0.64,0.67,0.69)` becomes approximately `(0.367246,0.406448,0.433880)` in `Quantity_Color`. The differences are consistent with sRGB transfer conversion, not evidence of different source colors. Sidecar RGBA is linear RGB plus alpha; do not apply an extra sRGB-to-linear transform.

Representative face assignments (numbers are exact face counts; color names describe appearance categories only):

| Definition | Definition color | Face colors |
|---|---|---|
| 9, small screw | None | 9 gray, 1 green |
| 85, barrel II drum | None | 19 orange, 3 brown, 797 lighter orange, 1 gold |
| 99, train bridge | None | 83 gray, 2 black, 166 purple |
| 110, balance rim | None | 34 brown, 121 warm orange |
| 195, main plate | None | 385 brown, 26 green, 137 orange |
| 222, balance bridge | None | 65 gray, 2 light gray, 18 purple, 3 green |
| 228, barrel bridge | None | 118 gray, 5 green, 1 light gray, 18 purple |
| 230, minute bridge | None | 46 gray, 30 purple |
| 240, winding bridge | None | 88 gray, 4 green |
| 251, crown-wheel plate | None | 23 gray, 1 purple |

The purple/green/orange categories should help identify surfaces, but must not be copied indiscriminately as photographic finishes. For example, source 155 `si HMzylinder` is gray, while the maker exploded reference depicts a pink/red mass. Source coloration is not authoritative proof of the finished variant or composition.

## What the pipeline preserves and loses

`scripts/cad/export_assembly.py` visits only the definition label for surface/general RGB. It misses all face colors on the principal plate and bridges listed above. Each definition becomes one GLB primitive and one generic PBR material, with metallic factor 0.65 and roughness 0.32; missing definition colors use `(0.63,0.65,0.67)`. The full GLB has 201 meshes/materials; the movement GLB has 138. Their only mesh attributes are POSITION and NORMAL. Neither has texture coordinates, vertex colors, tangents, face IDs, textures, images or material extensions. Alpha is always one. Face-local tessellation geometry survives, but its source face identity does not.

The existing `MovementViewer.ingest` discards and disposes imported materials, calling `createMaterial(name, definitionId, geometry)` instead. Thus even surviving definition colors are replaced by authored profiles. The preceding shader reads local position/normal, chooses the smallest bounding-box axis, and varies diffuse color, roughness and shading normals. It does not recover lost CAD face identity, and orientation alone cannot distinguish the broad front field from a parallel groove floor or back face.

Lossless Meshopt compression preserves the retained geometric data, but cannot restore appearance data already omitted. Sidecars provide an independent, reversible route to surface identity without modifying the original GLBs.

## Modeled bevels, grooves and lettering

The full imported leaf set contains 14,948 planar, 5,811 cylindrical, 2,911 conical, 169 spherical, 630 toroidal and 759 B-spline faces. Cone counts include hole countersinks and decorative surfaces; they must not all be called outer bevels.

The main bridge bevels are present as conical/planar geometry. Representative 45-degree outer bevels span 0.25 mm depth on 99, 0.15 mm on 230, and 0.20 mm on 240/251. Decorative groove walls include 25-degree cones spanning 0.10 mm. Shading can differentiate these existing surfaces; adding a generic bevel modifier would silently change geometry and could duplicate actual bevels.

| Definition | Source-local planar levels and identities |
|---|---|
| 99 | Gray main fields at Z=0; purple groove floors faces 79/108 at -0.10; text-sized purple floors at -0.07. Engraving walls include narrow cones and B-splines. |
| 195 | Broad surfaces include Z=0 and -2.0, with many functional recess levels. Orange reverse inscription faces at -1.90 sit within lettering around the -2.0 back field; preserve their actual orientation and relief. |
| 222 | Main face 1 at Z=0; purple groove floors 51/60 at -0.10; underside -0.90; feet -2.40; seats -1.20. |
| 228 | Main faces 5/63/73 at Z=0; purple groove floors 62/72 at -0.10; underside -0.55; feet -2.40; seats -1.20. |
| 230 | Main faces 1/2/18 at Z=0; purple groove floors 51/66 at -0.10; underside -0.39; feet -0.89. |
| 240 | Main face 33 at Z=0; underside face 3 at -0.99; local pockets at -0.69/-0.59. |
| 251 | Main face 1 at Z=0; rear shoulder -0.44; back -0.98. |

Some apparent missing decoration is therefore lost contrast, not absent geometry. The audit does not establish that every maker engraving or texture exists in this CAD variant. Broad satin/frosted/straight/circular finishing still requires reference-backed appearance authoring.

## Two-tone crown: exact source regions

Visual inspection of local `sjx-movement-detail-2.jpg` shows a polished central disc surrounded by a bright blue ring, inside the steel toothed annulus. The shared installed center is `(10.9202356932598, 0)` mm. The source corroborates a more precise assignment than making the whole crown wheel blue: **central plate 251 face 22 is its sole source-purple surface**, a continuous outer 45-degree cone. Its neighboring broad center, face 1, is gray. Crown wheel 249 has 775 gray faces and one gray-lilac face, with no source-purple region.

| Existing face | Local radial/Z extent (mm) | Installed world Z (mm) | Recommended interpretation |
|---|---|---|---|
| 251 face 1 | Broad center, radius ≤2.0, Z=0 | -4.57 | Polished steel center; retain its screw/pin openings |
| **251 face 22** | Radius 2.0–2.2, Z=-0.2…0 | -4.37…-4.57 | **Blue-ring candidate**, source-purple cone; 3.7261 mm², 104 vertices |
| 251 face 2 | Outer cylindrical skirt, radius 2.2, Z=-0.44…-0.2 | -4.13…-4.37 | Gray source; no evidence to extend blue over the whole skirt |
| 249 face 2 | Toothed annulus, radius 2.3–3.4608, Z=-0.7 | -4.42 | Visible steel annulus; circular/black-polished response as photographed |
| 249 face 10 | Inner chamfer, radius 2.25–2.3, Z=-0.7…-0.65 | -4.42…-4.37 | Narrow steel edge; separate from the plate's blue cone |
| 249 face 6 | Inner cylinder, radius 2.25, Z=-0.65…-0.4 | -4.37…-4.12 | Mostly hidden interior; retain gray/steel |

Definition 251's placement flips local Z. Its local front face 1 faces world -Z; crown 249's face 2 also faces world -Z. The center is 0.15 mm farther toward that viewing side than the annulus. The blue cone is therefore an existing visible sloped ring between the raised center and wheel edge, consistent with the photograph. No extra ring or geometric offset is needed. The source face boundary is exact; photographic identification and selected blue reflectance remain authored interpretation. Do not recolor all of 251 or classify it as rotating crown-wheel geometry.

The expanded small-part sidecars also identify existing shock-plate inlays: 156 `Klobenplatte` has 20 red transparent source faces, including planar floors 69/74/79/84 at local Z=-0.05 mm (about 0.205 mm² each). Top face 13 is at Z=0, rear face 23 at -0.4. Its red RGBA is `(0.341914,0,0,0.808)`. These are separate face regions within the steel plate, not separate invented jewel meshes. Definitions 133/219/165 have inherited definition colors and empty **direct** face-color dictionaries; an empty dictionary must not erase the definition/profile fallback. Maximum analytic normal disagreement stays below 4.94° for all five small bridge/shock definitions 133/219/147/156/165.

Definition 159 `si ZeigerhebelfederblockV3` has an exact mixed finish: faces 1–4 are source-purple, with 258 gray faces. All four colored faces are top planes at local Z=0, normal +Z; their installed orientation faces world -Z at -5.14 mm. Each has 149 vertices and approximately 1.1956 mm² area. Face 1 spans local XY `(1.032,1.533)` to `(4.057,4.491)` mm; face 2 spans `(1.533,1.032)` to `(4.491,4.057)`; faces 3/4 are mirrored across X=0. They form the four upper spring/hand fields. The subsequent user photograph `USER-FINISH-2026-09-10-01` shows the blue finish continuing inward to the retaining screw. Because the adjoining top is one broad face (262), the runtime extends blue only across its screw-end region through local Y 1.56 mm; the central spine, underside and sidewalls remain steel. The 159 sidecar has 7,018 vertices with no undefined analytic normals or ambiguous position/normal keys.

## Normal and tessellation defects

The exporter uses Trimesh triangle-derived vertex normals. Vertices are split across **every** CAD face, even tangent boundaries. They smooth within a face but do not use exact surface derivatives. The analytic audit evaluates source UV normals at all 258,602 vertices of 27 representative definitions and reproduces cached position and triangle arrays exactly. It does not estimate normals from screenshots.

| Definition | P95 analytic/export normal error | Maximum | Maximum mismatch at coincident tangent-boundary vertices |
|---|---:|---:|---:|
| 222, balance bridge | 2.23° | 4.51° | 8.47° |
| 228, barrel bridge | 2.50° | 4.24° | 8.47° |
| 230, minute bridge | 2.92° | 3.55° | 7.06° |
| 240, winding bridge | 0.96° | 4.40° | 8.19° |
| 251, crown-wheel plate | 0.80° | 3.90° | 7.79° |
| 99, train bridge | 3.52° | 173.08° | 41.91° |
| 195, main plate | 3.47° | 36.91° | 46.04° |
| 249, crown wheel | 3.46° | 178.44° | 9.44° |

P95/max exclude zero exported normals. Definition 99 contains six zero exported normals. Its major outliers concentrate on engraved sliver cones (roughly 0.0002–0.0007 mm²) and text-wall B-splines. Definition 249's large outliers occur on repeated tiny spherical patches around 0.000358 mm². These require careful triangle-facing/visual review; a normal replacement does not repair malformed or reversed tiny triangles. The known invalid eccentric 111 is especially unreliable, with missing source tessellation and zero/opposing normals; its repair remains outside this finishing change.

Five-to-eight-degree artificial tangent seams can noticeably break mirror reflections even where silhouettes remain acceptable. Source-derived shading normals can address those seams while keeping existing CAD positions/indices. They cannot recover a curved silhouette below the 0.015 mm tessellation bound, fix the documented invalid BReps, or produce absent ornamentation. A future finer tessellation would be a separately documented derived asset, not a material tweak.

## Sidecar contract and integration advice

Twenty-seven representative sidecars use little-endian float32 with 10 floats per vertex: local position XYZ, original exported normal XYZ, analytic normal XYZ, one-based source face index. Their JSON companions carry RGBA, bounds, type, area, plane normal and cone angle for every face. Original cached float64 positions and int64 triangle indices reproduce exactly; sidecar position and exported-normal float32 values match the original GLB byte values exactly for all 27 definitions. No analytic normal is undefined in these 27 sidecars.

Map optimized vertices using position **and original normal**, preserving hard face boundaries. Twenty-six definitions have no ambiguous keys. Train bridge 99 has three keys shared by gray field/purple engraved-wall pairs (faces 2/234, 216/219, 224/227), with different analytic normals. The JSON lists source vertex indices. If optimization welded such a key, exact per-vertex assignment cannot be recovered from that key alone; inspect triangle adjacency or leave a conservative original-normal/material fallback. Do not silently choose whichever face is encountered first.

Use explicit local axes and origins. Screws 9/136/169/226 have Z-aligned source cylinders centered at XY=(0,0), despite their smallest bounding-box dimension being X or Y. Bbox-center circular mapping also introduces a small offset from tessellation asymmetry. Wheel/barrel origins should follow corroborated source axes; irregular bridge 240's bounding-box center is not a meaningful machining center. Straight bridge grain can use local XY coordinates with separately authored direction.

Keep surface-category assignment and optional analytic shading-normal override separate from the original geometry attributes; make Function mode bypass decorative treatment. Source purple groove/text groups can become dark or recessed satin regions only where maker imagery supports that interpretation. Preserve sides, seats and countersinks rather than making every nonhorizontal surface mirror-polished. Filter procedural detail according to projected footprint and keep millimetre-scale coordinates explicit. Numeric roughness, metalness, color, grain spacing and anisotropy remain authored choices, not measured material properties.

This audit supplies source evidence and reversible data, not visual acceptance. Browser comparisons and runtime validation determine whether the integrated treatment improves actual close-ups and remains stable through both sides, reveals, selection and catalog loading.
