# CAD maintenance notes

This is a summary of constraints that still matter when changing assets. Detailed checkpoint reports are recoverable from commit `e5c890f` (`git show e5c890f:docs/<filename>`). Recorded measurements below are source-specific findings, not fresh certification.

## Source and conversion

The original assembly SHA-256 is `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. URLs, reference images and hashes are recorded under `assets/source-manifest/`. The source contains 426 hierarchy instances: 365 leaves and 61 assemblies, using 255 referenced definitions (202 leaf definitions).

The pipeline uses XCAF instance paths, immutable source placements and millimetres, including numeric GLB coordinates. Nested manifest matrices use row-major arrays with column-vector mathematics (`world = parentWorld × local`); glTF serializes matrices column-major. A changed source/importer needs explicit identity remapping. The full catalog includes straps and alternatives, so its bounds are unsuitable for movement framing.

`run_pipeline.sh` uses `.venv-cad` and source-hash/settings-keyed caches. Recorded tessellation is 0.015 mm linear / 0.25 rad angular deflection. Meshopt transport preserves decoded geometry bytes without quantization or decimation. Reproduction commands are in the [README](../README.md); a clean-machine rebuild has not been verified.

## Source exceptions and fitted presentation

| Item | Constraint or known exception |
| --- | --- |
| Eccentric d111 | Invalid BRep; three of 23 faces lack tessellation, affecting four occurrences. Conservative source bounds can be unbounded and are rejected. |
| Diamond d225 | Empty in the assembly STEP; recovered from the maker's separate STL at the original placement. Runtime internal-facet shading is an authored optical approximation. |
| Inner dial d27 | Invalid BRep; recovered mesh retained. No general source repair is claimed. |
| Case component d54 | Original mesh omits planar face 1 (28.357985 mm²). The local catalog appends a hash-checked original-face recovery: 34 triangles at 0.03 mm deflection, 28.227462 mm². Original surface/wires and existing mesh vertices are unchanged. |
| Tiny triangles | Original audit counted 328 near-degenerate triangles across 75 definitions; transport compression does not repair them. |
| Setting springs | Movement children 53 and 66 overlap as alternatives; retain source identities and explicit visibility choices. |
| Central Lance seconds | Source blade d29 is displaced 14.301839 mm from its arbor. Fitted presentation applies an XY-only correction; raw catalog retains the source pose. |
| Skeleton enamel | Carrier d14 and enamel d21 overlap by 3.477922 mm³ and share an outward plane. Scoped depth bias handles presentation; geometry remains unchanged. Alternative rings and loose duplicate blades are excluded from fitted presets. |
| Small minute-hand fit | Source shaft/bushing cylindrical intervals retain a nominal 0.02 mm axial gap; appearance does not certify tolerances. |

Fitted hands show static 10:10:00 around measured bore axes. Source transforms, fitted poses, inventory transforms and authored finishes are separate. Both displays retain independent preferences. Exact IDs, exclusions and corrections are in `assets/authored/dial-configurations.json` and `hand-display-poses.json`; probes are `scripts/cad/dial_fit_probe.py` and `hand_pose_probe.py`.

## Separation and mechanics

`assets/authored/explosion.json` records presentation paths. Source-local +Z identifies screw withdrawal only after applying the occurrence transform: three screws are radial, not world-Z fasteners. Pins, spring attachments and riveted packets retain their reviewed hosts. Balance-cover screws are source children 23/24; 34/35 belong to the pallet bridge.

The winding stem cannot withdraw together with the larger coupling wheels through the plate. Source sampling detected interference. The authored sequence lifts the keyless levers before withdrawing the bare stem, then moves the retained wheel/clutch pair through the open bearing side. `scripts/cad/explode_probe.py` records sampled overlaps under `artifacts/explode-cad/`; sampled clearance is not a continuous collision proof or service procedure.

Running-watch playback was removed because the timing study omitted the spring/contact mechanism and did not drive the full chain. Tooth counts and pivots do not establish tooth phase, escapement contact or elastic spring behavior. Historical mechanical data remains in `assets/authored/motion-evidence.json`; reproduction and limitations are in [scripts/mechanics/README.md](../scripts/mechanics/README.md).

## Appearance evidence

STEP colors identify source faces, not measured physical materials. Face mapping uses position and original normal, retaining hard boundaries and exact occurrence overrides. Ambiguous mappings need source-face evidence. Geometry and analytic shading normals remain separate; fitted-only color/depth corrections do not redefine raw catalog appearance.

The machine-readable [ledger](appearance/ledger.json) and [finishing audit](appearance/cad-finishing-audit.json) retain per-instance/source-face evidence, confidence, matrices and recorded decisions. They are dated audit snapshots, not an automatically current material specification. Their historical report references are recoverable from Git. Current assignments live in the runtime and authored data; reference provenance is in `assets/source-manifest/`. Numeric roughness, grain, color and optical parameters are authored interpretations.

## Fitted watch configuration

The [fitted case manifest](../assets/authored/watch-configurations.json) records 41 leaves, immutable occurrence matrices, bounds, packets and finish scopes. Case children 6/8 retain separate, opposite screw-back/crystal transforms. Children 4/9 supply one matching pair of d51 attachments with keys, screw bars, covers and screws; 5/10 are reverse-face alternatives. All leather and buckle leaves remain outside the fitted view. Source parts are neither recentered nor rescaled.

The [reference audit](../assets/source-manifest/watch-configuration.json) records the source hash, maker URLs, inspected image hashes and d54 measurements. Maker gallery labels support stainless steel, rose gold and platinum watch appearances. These are authored material presets on the SS CAD, not separately supplied alloy geometry or a complete orderable-combination matrix. Only exterior case definitions d46/d48/d54/d56/d68/d70/d71 change color. Fasteners, locking pieces, tube, corrector, seals and crystals retain baseline materials. Fine central hands are pictured in blue and rose gold; Lance/Open lance remain blue because rose-gold compatibility was not established. The hand override changes only blades, never hour markers or logo. Skeleton preferences and finishes remain unchanged.

Reproduce the omitted lug face with `.venv-cad/bin/python scripts/cad/case_fit_probe.py`, then `python3 scripts/prepare_local_assets.py`. Independent meshing of the original face at 0.03 mm succeeds where the original 0.015 mm assembly tessellation did not. Its mesh area differs by 0.130523 mm² (0.46%); no new CAD surface or wire is fabricated. The local 2,105-byte sidecar is SHA-256 checked before catalog ingestion. Browser inspection covers assembled/oblique and separated appearances; this is not a tolerance or mechanical certification. Original STEP and committed GLBs remain unchanged. The new sidecar stays ignored and needs its own release authorization before future publishing.
