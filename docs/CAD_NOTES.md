# CAD maintenance notes

Constraints for maintaining the current assets. Recorded measurements are source-specific findings, not fresh mechanical certification. Historical reviews are recoverable from Git.

Current material decisions live in [material-review.json](../assets/authored/material-review.json); runtime assignments and exact occurrence overrides live in `explorer/src/viewer/materials.ts`. Source-face mapping lives in the tracked finish buffer and its manifest. Generated appearance ledgers are not additional specifications.

## Source and conversion

The original assembly SHA-256 is `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. URLs, reference images and hashes are recorded under `assets/source-manifest/`. The source contains 426 hierarchy instances: 365 leaves and 61 assemblies, using 255 referenced definitions (202 leaf definitions).

The pipeline uses XCAF instance paths, immutable source placements and millimetres, including numeric GLB coordinates. Nested manifest matrices use row-major arrays with column-vector mathematics (`world = parentWorld × local`); glTF serializes matrices column-major. A changed source/importer needs explicit identity remapping. The full catalog includes straps and alternatives, so its bounds are unsuitable for movement framing.

`run_pipeline.sh` uses `.venv-cad` and source-hash/settings-keyed caches. The exporter checks fresh source identities and placements against the reviewed runtime manifest; its placement baseline is not a second generated inventory. Recorded tessellation is 0.015 mm linear / 0.25 rad angular deflection. Meshopt transport preserves decoded geometry bytes without quantization or decimation. Reproduction commands are below; a clean-machine rebuild has not been verified.

## Source exceptions and fitted presentation

| Item                  | Constraint or known exception                                                                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eccentric d111        | Invalid BRep; three of 23 faces lack tessellation, affecting four occurrences. Conservative source bounds can be unbounded and are rejected.                                                                                            |
| Diamond d225          | Empty in the assembly STEP; recovered from the maker's separate STL at the original placement. Runtime internal-facet shading is an authored optical approximation.                                                                     |
| Inner dial d27        | Invalid BRep; recovered mesh retained. No general source repair is claimed.                                                                                                                                                             |
| Case component d54    | Original mesh omits planar face 1 (28.357985 mm²). The local catalog appends a hash-checked original-face recovery: 34 triangles at 0.03 mm deflection, 28.227462 mm². Original surface/wires and existing mesh vertices are unchanged. |
| Tiny triangles        | Original audit counted 328 near-degenerate triangles across 75 definitions; transport compression does not repair them.                                                                                                                 |
| Setting springs       | Movement children 53 and 66 overlap as alternatives; retain source identities and explicit visibility choices.                                                                                                                          |
| Central Lance seconds | Source blade d29 is displaced 14.301839 mm from its arbor. Fitted presentation applies an XY-only correction; raw catalog retains the source pose.                                                                                      |
| Skeleton enamel       | Carrier d14 and enamel d21 overlap by 3.477922 mm³ and share an outward plane. Scoped depth bias handles presentation; geometry remains unchanged. Alternative rings and loose duplicate blades are excluded from fitted presets.       |
| Small minute-hand fit | Source shaft/bushing cylindrical intervals retain a nominal 0.02 mm axial gap; appearance does not certify tolerances.                                                                                                                  |

Fitted hands show static 10:10:00 around measured bore axes. Source transforms, fitted poses, inventory transforms and authored finishes are separate. Both displays retain independent preferences. Exact IDs, exclusions and corrections are in `assets/authored/dial-configurations.json` and `hand-display-poses.json`; probes are `scripts/cad/dial_fit_probe.py` and `hand_pose_probe.py`.

## Separation and mechanics

`assets/authored/explosion.json` records focused-section host/release paths. Whole-movement disassembly instead interpolates the individual layer offsets in `assets/derived/complete-separation.json`; it does not execute the focused winding sequence described below. Lug offsets follow the current attachment frame through Flip. Middle-ring/plate interference remains: a simple axial alternative introduced tube/stem interference, so changing that path needs mechanical review. Opposite-face Focus can remain obscured by its contextual plate. Source-local +Z identifies screw withdrawal only after applying the occurrence transform: three screws are radial, not world-Z fasteners. Pins, spring attachments and riveted packets retain their reviewed hosts. Balance-cover screws are source children 23/24; 34/35 belong to the pallet bridge.

The winding stem cannot withdraw together with the larger coupling wheels through the plate. Source sampling detected interference. The authored sequence lifts the keyless levers before withdrawing the bare stem, then moves the retained wheel/clutch pair through the open bearing side. `scripts/cad/explode_probe.py` records sampled overlaps under `artifacts/explode-cad/`; sampled clearance is not a continuous collision proof or service procedure.

Running-watch playback was removed because the timing study omitted the spring/contact mechanism and did not drive the full chain. Tooth counts and pivots do not establish tooth phase, escapement contact or elastic spring behavior. The abandoned timing experiments remain in Git; `assets/authored/motion-evidence.json` now records only the static-product decision and current face-flip evidence.

## Appearance evidence

STEP colors identify source faces, not measured physical materials. Face mapping uses position and original normal, retaining hard boundaries and exact occurrence overrides. Ambiguous mappings need source-face evidence. Geometry and analytic shading normals remain separate; fitted-only color/depth corrections do not redefine raw catalog appearance.

Current authored decisions and unresolved finish choices are in `assets/authored/material-review.json`; reference provenance is in `assets/source-manifest/`. The old finishing audit is recoverable with `git show 4566341:docs/appearance/cad-finishing-audit.json`. Its earlier steel shock cylinder, coupled eccentric/rim color and red-only ruby claims were superseded. The current shock cylinder is ruby; eccentrics are independent rose gold; the escape wheel is steel and d121 is brass. Crown-wheel brushing versus mirror polish, balance-rim alloy and collet alloy remain unresolved. Numeric optical values remain authored interpretations.

## Fitted watch configuration

The [fitted case manifest](../assets/authored/watch-configurations.json) records 41 leaves, immutable occurrence matrices, bounds, packets and finish scopes. Case children 6/8 retain separate, opposite screw-back/crystal transforms. Children 4/9 supply one matching pair of d51 attachments with keys, screw bars, covers and screws; 5/10 provide reverse-face source transforms (4→10 and 9→5 for the same watch end). All leather and buckle leaves remain outside the fitted view. Source parts are neither recentered nor rescaled.

The [reference audit](../assets/source-manifest/watch-configuration.json) records the source hash, maker URLs, inspected image hashes and d54 measurements. Maker gallery labels support stainless steel, rose gold and platinum watch appearances. These are authored material presets on the SS CAD, not separately supplied alloy geometry or a complete orderable-combination matrix. Exterior case definitions d46/d48/d53/d54/d55/d56/d68/d70/d71 change color, including the authored d55 lug-bar and d53 end-screw finishes. Remaining fasteners, locking pieces, tube, corrector, seals and crystals retain baseline materials. Fine central hands are pictured in blue and rose gold. The authored presets make Fine blue for steel and gold for rose gold/platinum; Lance/Open lance remain blue because rose-gold compatibility was not established. The hand override changes Fine blades and the three fitted central Zeigerbuchse bushings (d34/d38/d41); hour markers and logo are unchanged. Skeleton preferences and finishes remain unchanged.

Reproduce the omitted lug face with `.venv-cad/bin/python scripts/cad/case_fit_probe.py`, then `python3 scripts/prepare_local_assets.py`. Independent meshing of the original face at 0.03 mm succeeds where the original 0.015 mm assembly tessellation did not. Its mesh area differs by 0.130523 mm² (0.46%); no new CAD surface or wire is fabricated. The local 2,105-byte sidecar is SHA-256 checked before catalog ingestion. Browser inspection covers assembled/oblique and separated appearances; this is not a tolerance or mechanical certification. Original STEP and committed GLBs remain unchanged. The verified runtime sidecar is tracked for the application; the original STEP, recovery probe output and reference evidence stay ignored. Further publication remains subject to the release gates.

Maker motion correction (24 September): the official download animation establishes withdrawal of the upper then lower attachment, complete case turnover about CAD X, then lower and upper reseating. X runs across the crown/9–3 axis; ±Y runs between the lugs. All 18 leaves under Rx(π) about Z=-2.5000161761 mm match original opposite-end occurrences within 9.4e-12; exact audited matrices supply endpoints. The assembled visible set is unchanged. The renderer expresses the case turn in the stationary-attachment viewing frame by applying the same inverse X rotation to observer and lug poses, preserving source geometry and case matrices. The 8 mm clearance and 1.8 s duration remain authored. See [motion evidence](../assets/authored/motion-evidence.json) and [source record](../assets/source-manifest/face-flip.json). Recorded original-source measurements identify face 468 (5.828602 mm², local X=3.4) as the recessed field, distinct from raised M faces 469–471 at X=3.5. Frosting is applied only to that original recess. Authored appearance decisions and source measurements are recorded in the watch reference manifest.

Further appearance/flip correction: the gold Fine packet is polished throughout, overriding the original white seconds counterweight and other source color roles only while fitted gold is active. Original geometry/face annotations remain available for blue/raw views. Lug d55 screw bars and d53 end screws match case material. The four d72 locking pins are under the middle-ring subtree. The maker animation does not resolve their release: the 24 September correction removes the unsupported outward arc and leaves them seated in the turning case. This does not certify a physical locking sequence.

## Independent component comparison

The historical [PR #19 audit](https://github.com/galind/zweigesicht-1/pull/19), head `5b27e623b5c779daafdafbeb09a5b4f205e9bd3f`, justified no new geometry replacement. Twelve matched independent screw STEP files reproduce the same smooth surfaces; denser STLs add tessellation, not threads. Do not infer thread specifications from names or substitute a similar catalog screw.

Two consequential exclusions remain: independent main plate d195 narrows the setting slot from Y=±1.30 to ±1.15 mm (0.30 mm total), and the d61 buckle-screw candidate has a 2.2 mm head instead of 1.9 mm, with different shoulders/axial extent. Minimal candidate URLs/hashes are in [source provenance](../assets/source-manifest/sources.json). Retain the assembly variants pending maker/mechanical review. Closed independent d111 and d27 STLs do not establish valid equivalent interfaces: the eccentric comparison failed on invalid source geometry and the inner dial remains unresolved. Existing recoveries and face mappings stay authoritative.

## Workshop membership and dependencies

[play-manifest.json](../assets/authored/play-manifest.json), version `play-4`, is the sole membership/dependency representation. The 265-leaf finish contains 222 selected movement and 43 dial/hand leaves; 100 source leaves are explicitly excluded. It uses Fine central and Lance small hands at static 10:10:00, without the case. Only five blade endpoints differ from original source matrices, through the recorded hand-display correction; the other 260 are exact source endpoints.

The shared mainplate subtree has 18 leaves: 16 remain fitted (plate, eight direct jewels, two pins and five Incabloc leaves), while radial d201 screws `194_11`/`194_12` are player placements. They wait for the complete central dial and precede its hands. Their source-local +Z withdrawal axes transform into radial XY directions; the original head/shank and mainplate seat faces are recorded in `explosion.json`. Guided edge cameras are presentation choices, not screw-turn simulation.

Easy places prepared packets directly. Hard builds 35 multi-leaf packets on an unmodeled fixture and explicitly transfers them; the fixture adds no inventory. All prerequisites are stable IDs in the manifest. Main-watch host/cover relations use source geometry; broader meshing/setting dependencies and requiring all movement work before either dial are conservative puzzle assumptions. Barrel arbors and springs precede covers. The balance-bridge diamond setting waits for the shock-protection retaining spring: installing it sooner blocked the cap jewel from both sides in the recorded reverse-order run (cap jewel Z −4.430…−4.350 mm; diamond setting −5.600…−4.600 mm). This guard does not impose order on independent studs/pins.

The inventory validator checks exact membership, geometry availability, hashes, endpoints, deferrals and 40 legal graph traversals per level. Browser and sampled surface-ray checks establish visible access only, not swept-solid clearance, spring loading, tolerance, holding feasibility or servicing safety. Diamond recovery is mandatory; d111 partial tessellation and d27 invalid-BRep recovery remain explicit exceptions.

## Reproduce and verify assets

The application runs from tracked payloads without a CAD environment. Source reproduction requires the recorded originals at `assets/source-originals/`, Python 3.12, `uv`, and the locked offline packages. The CAD lock targets Apple Silicon macOS; other platforms and clean-machine reproduction are unverified. `setup_cad_env.sh` is for a new environment; preserve existing environments and caches.

```sh
# One-time setup; CAD_PYTHON may specify an absolute Python 3.12 executable:
scripts/preflight/setup_cad_env.sh
npm ci --prefix scripts/assets
python3 scripts/preflight/verify_sources.py

# Reuses source-hash/settings-keyed geometry caches:
scripts/cad/run_pipeline.sh
node scripts/assets/optimize.mjs
node scripts/assets/verify-three.mjs

# Regenerate the source-normal/face annotations when needed:
.venv-cad/bin/python scripts/cad/finish_audit.py
.venv-cad/bin/python scripts/cad/appearance_target_probe.py
python3 scripts/prepare_local_assets.py
```

`finish_audit.py` and `appearance_target_probe.py` produce the 59 source-sidecar definitions consumed by `prepare-finishes.mjs`; preparation packs their analytic normals and exact face roles. Keep both despite their historical names. `case_fit_probe.py`, called by the pipeline, regenerates the required original-face lug recovery. `verify-three.mjs` compares raw and Meshopt-decoded position/normal/index bytes and identities. Preparation does not delete local originals or evidence. A hash change requires investigation and review before updating runtime manifests or `.gitignore` exceptions.

Successful exports remove their partial checkpoint files after writing the final
manifest and audit. Optimization retains the two optimized GLBs; runtime preparation
creates gzip copies directly in `explorer/public/models/`. Old screenshots and
comparison audits can be archived separately. Preserve current source files,
definition caches, source-sidecar annotations and the regression inputs below.

The prepared CPU regression suite also reads ignored dial/hand and mounting evidence. Recreate that evidence with:

```sh
.venv-cad/bin/python scripts/cad/dial_fit_probe.py
.venv-cad/bin/python scripts/cad/hand_pose_probe.py
.venv-cad/bin/python scripts/cad/explode_probe.py
node scripts/cad/review-runtime.mjs
```

These source probes remain necessary inputs to the regression suite. It reads `assets/generated/assembly-manifest.json`, `artifacts/finishing-cad/sidecars/`, its `runtime-sidecar-report.json`, `artifacts/dial-cad/source-fit.json`, `artifacts/dial-time/hand-pose-source-review.json` and `artifacts/explode-cad/screw-directions.json`; it is not the clean-checkout CI test suite.

To reproduce whole-movement offsets after preparing the mounting evidence, run `.venv-cad/bin/python scripts/cad/separation-depth-probe.py`, then `.venv-cad/bin/python scripts/cad/build-complete-separation.py`. This preserves authored depth overrides and generates only `assets/derived/complete-separation.json`; compare its output before accepting changes. It is separate from the focused extraction evaluator and is not a service-sequence generator.
