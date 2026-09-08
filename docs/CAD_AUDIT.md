# CAD assembly audit — 9 September 2026

Proceed with local prototype development using the real movement subset. Source identity, reusable geometry, part addressing and placement are verified. Full source-fidelity acceptance remains open because the supplied file includes alternative designs, two invalid imported BReps, incomplete faces and an empty jewel definition. No mechanical or manufacturing correctness is claimed, and no source or derived CAD is authorized for publication.

## Reproduce

Run `scripts/cad/run_pipeline.sh` from this repository using the existing `.venv-cad`. The exporter reuses the XCAF importer in `scripts/preflight/cad_probe.py`; dependencies remain pinned by the preflight lockfile. It verifies the complete assembly SHA-256 `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b` before any conversion. Original CAD stays under ignored `assets/source-originals/`.

The exporter uses absolute 0.015 mm linear deflection and 0.25 rad angular deflection, with no global decimation. Per-definition caches under `artifacts/cad/definition-cache/` are keyed by source hash and tessellation settings. Delete that generated cache to force fresh tessellation. A successful cached rerun completed in 17.78 seconds and reproduced the identical full GLB SHA-256 `39099c55122c5231c12f78e3917b2256305ec45d06a81d58a89f53e00a0a4277`. This confirms cache-path output repeatability; it is not a clean-machine rebuild measurement.

For an early movement-only conversion, run `.venv-cad/bin/python scripts/cad/export_assembly.py --subset movement --output artifacts/cad/early-movement --audit artifacts/cad/early-audit`. Periodic checkpoint assets explicitly represent partial extraction. They are diagnostic artifacts; use the final assets below for the application.

For reference renders, run `/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/cad/render_references.py`. Blender 5.2.1 LTS completed eight 1400 × 1400 reference views in approximately 66 seconds. Rendering requires the same approved outside-sandbox Blender path established during preflight.

## Runtime assets and contract

| Asset | Nodes including root | Source leaf instances | Rendered leaf instances | Shared geometries | Unique triangles | Drawn triangles | GLB bytes |
|---|---:|---:|---:|---:|---:|---:|---:|
| `assets/generated/zweigesicht.glb` | 427 | 365 | 364 | 201 | 1,148,881 | 1,671,176 | 37,633,344 |
| `assets/generated/zweigesicht-movement.glb` | 260 | 223 | 222 | 138 | 621,922 | 748,422 | 21,142,992 |

The preflight's 426 component instances comprise **365 true leaves and 61 assembly instances**. There are 255 referenced definitions, including 202 leaf definitions. The single empty leaf definition has no mesh; every other leaf definition has its own reusable geometry, and repeated instances reference the same GLB mesh. Assembly nodes never render their aggregate shape over child meshes.

Gzip size estimates at level 9 are 13,924,121 bytes for the full asset and 7,322,106 for the movement subset. These are offline compression estimates, not measured HTTP transfer or decode performance. The movement remains above the initial overview transfer/triangle investigation budgets; optimization and actual device benchmarks remain open.

The complete machine-readable contract is `assets/generated/assembly-manifest.json`. It includes stable source paths, instance names, parent and definition IDs, nested 4×4 local/world matrices, world/local bounds, per-definition triangles, analytic cylinder evidence, source color hints and exceptions. Matrix convention is column-vector mathematics with row-major nested arrays; `world = parentWorld @ local`. GLB matrices are serialized in glTF column-major order.

Units and source X/Y/Z axes are retained. The STEP explicitly declares `SI_UNIT(.MILLI.,.METRE.)`. Numeric GLB positions remain millimetres, despite glTF's usual metre convention; apply normalization once at the viewer root. Never multiply part placements a second time. This is a documented local application asset convention, not an independently reusable metre-scale GLB.

Node names use `p_` plus the complete XCAF instance path, replacing `:` with `_` and `/` with `__`. Definition IDs use `d_` plus the XCAF label with `:` replaced by `_`. IDs are stable for the verified source hash; a different source assembly requires an explicit remapping review. Each node also carries `partId`, `sourceName`, `definitionId` and `isAssembly` extras. Instance names exactly match all 426 preflight records.

The movement root is `p_0_1_1_1__0_1_1_1_4`. Its source bounds span approximately 39.724 × 33.943 × 8.470 mm, including the protruding winding stem. The full-source Y span is 269.297 mm because straps are included; it is not the movement diameter. Default framing should use the movement subtree, not the full-source envelope.

## Geometric verification and exceptions

Independent binary validation in `scripts/cad/validate_assets.py` checks GLB structure, byte/accessor ranges, indices, finite vertices and normals, unique IDs, mesh references, every accumulated world transform, normal lengths and per-instance float32 bounds. Both assets pass. World matrices match the manifest exactly; the largest float32 world-bound deviation is below 0.000001 mm. All transform determinants lie between 0.9999999999999998 and 1.0000000000000007. Regenerated accumulated placements match preflight within 2.85 × 10⁻¹⁴, with identical source instance sets. No mirrored or double-applied placement was detected by these checks.

For 200 leaf definitions with usable analytic source bounds, the largest mesh-versus-source local bound difference is 0.007475 mm, below the 0.015 mm linear setting. This checks bounding envelopes, not a Hausdorff surface distance or contact correctness. The global source BRep bounding operation is unavailable: the defective eccentric causes Open Cascade's conservative fallback to return ±1e100. Those bounds are rejected rather than reported as a successful comparison.

| Source definition | Recorded issue | Treatment |
|---|---|---|
| `d_0_1_1_111`, `ml01 Unruhexcenter` | Invalid imported BRep; 3 of 23 faces have no tessellation; optimal bounding throws `NCollection_Array1::Value`; fallback is unbounded | Retained its 591 recovered triangles in all four instances, with explicit unresolved exceptions. No silent reconstruction. |
| `d_0_1_1_225`, `030-Brilliant_200` | Empty imported definition: no CAD faces, vertices or triangles | Retained its named hierarchy node without a mesh. One source leaf is excluded from rendered counts. |
| `d_0_1_1_27`, `ml01 ZB Innenteil V2` | Invalid imported BRep | Retained recovered dial geometry; source-fidelity review remains open. This lies outside the movement subset. |
| `d_0_1_1_54`, `ml01 Hörnchenbügel SS` | One face lacks tessellation | Retained recovered geometry and explicit exception. This lies outside the movement subset. |
| 75 definitions | 328 triangles have area below 1 × 10⁻¹⁴ mm² | Preserved and counted. These tiny/degenerate facets need a documented cleanup comparison before an optimized release asset. |

The import log also preserves the known nonfatal FixShape diagnostic (`gp_Dir2d() - input vector has zero norm`). No original source was changed, no missing part was replaced by invented geometry, and no invalid BRep was silently repaired.

## Variant and visual audit

`artifacts/cad/reference-renders/` contains front (+Z), back (−Z), oblique and side diagnostic views for the full source and movement subset, plus `views.json` recording camera and visibility settings. These labels describe coordinate directions, not the maker's naming of the two watch faces. Render materials retain source color hints with generic diagnostic shading; they do not establish finished material fidelity.

The movement back view is coherent and shows the actual bridges, wheel train, balance and hairspring. The source front view exposes overlapping spring alternatives with visible z-fighting: `ml01 Winkelhebelfeder` (`p_0_1_1_1__0_1_1_1_4__0_1_1_83_53`) and `ml01 Winkelhebelfeder 2 Positionen` (`p_0_1_1_1__0_1_1_1_4__0_1_1_83_66`) have identical world bounds and placement. Preserve both inventory nodes, and record any chosen viewer exclusion as an unreviewed variant decision.

The full source additionally contains multiple front/reverse hand designs, alternative reverse rings, multiple colored straps, the case and crystals, and a separate `Regulierunterlage` root component. Showing every source alternative simultaneously is not a validated assembled watch variant. Source/manufacturer photographic correspondence, alternate-design selection and exact variant approval remain open. No photographic comparison was completed by this worker.

## Mechanism evidence

`assets/generated/mechanism-candidates.json` maps exact named source subtrees for balance, escapement, energy storage, going train, shock indication, bridges, both displays and case/straps. It is a candidate functional map, not reviewed mechanical constraints.

The balance shaft's candidate axis passes through approximately `(0, −10, −2.65)` mm, parallel to source Z. Eight coaxial analytic cylinder faces support it. The pallet shaft axis passes through `(−0.99994908945, −7.0657025, −1.56)` mm, parallel to source Z, supported by five coaxial cylinder faces. The escape-wheel assembly origin is `(−1.99989817890, −4.131405, −2.57234849348)` mm; the named `ml01 Gangtrieb z9 m0,102` supplies additional analytic pinion-axis evidence in the candidate file.

Tooth-count numbers embedded in CAD labels are preserved as unverified source-name hints. No gear ratio, tooth engagement, release sequence, balance amplitude, spring deformation or phase is inferred as correct. The mechanical relationship list is deliberately empty until independent mechanical evidence and review establish connections. Actual hairspring geometry is present; its faithful animated deformation remains separate work.

## Gate status

Local geometry delivery and source-instance recovery are complete with the listed exceptions. Continue the browser prototype using the movement asset and explicit variant handling. Gate A remains partial pending source-fidelity/variant review and defective geometry decisions; Gate B/C, independent mechanical review, real-device performance, thermal behavior, human comprehension and publication permission remain open.
