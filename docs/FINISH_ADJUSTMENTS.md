# Brushing and frosting adjustment

9 September 2026. This user-requested refinement supersedes the earlier subtle-grain guidance where described below. The attachments are visual CAD-render references, not instructions or measured manufacturing data. Their original SHA-256 hashes and provenance are in `assets/source-manifest/finish-adjustment-references.json`; no reference image was added to public assets.

| Surface | Source definitions | Adjustment |
|---|---|---|
| Main plate | 195 | Stronger shallow, irregular isotropic frosting, with several filtered detail scales and a more diffuse reflection. |
| Bridge feet/lower fields | Existing bridge and warmPlate definitions | Stronger frosting below the existing local-Z top boundary; existing face normals, chamfers and engraved regions retained. Upper bridge fields retain the prior fine straight grain frequency and bump depth. |
| Barrels and lids | 85, 86, 90, 91 | Irregular concentric satin around the unchanged local axle, stronger anisotropic reflection, roughness and shallow grain. |
| Warm wheels and steel ratchets | Existing brass family; 131 | Circular grain now spans several scales, so the entire finish does not filter away at assembly distance. |
| Setting/coupling wheels | 97, 172 | Plain steel changed to circular steel satin. |
| Keyless levers and springs | 174, 176, 178, 190, 193, 244, 246, 248 | Straight steel satin on both flat sides, independent of the bridge-specific Z boundary. Includes the alternate setting spring. Existing inclined edges remain bright and walls satin. |

Stem, sliding coupling, pins and screw identities retain their separate turned/polished/blued treatments. Crown wheel/cap and its blue cone retain the prior explicitly reviewed treatment. The new steel family does not use name-based blanket overrides. The ledger records the user’s reference alongside the source identity and retains inferred status where no physical finish is verified.

The shader uses source-local coordinates without new textures, UVs, tangents, geometry or annotation binaries. Derivative filtering fades unresolved grain levels individually. Numerical roughness, grain periods and height remain authored display parameters. The initial coarse candidate made the wheels too ringed; the accepted refinement increased the grain frequencies and reduced its height. The leather family is explicitly excluded from the added reflectance/roughness contrast.

Verification: 47 source/asset CPU checks, four state tests, TypeScript, targeted material lint, and production build pass. A new actual-geometry check covers all ten newly brushed definitions, real flat-face coverage, Function gating and retained shaft/pin assignments. Existing geometry tests confirm all decoded attributes/indices remain byte-exact across 339 geometry objects. The refreshed ledger still accounts for all 202 definitions and 365 leaf occurrences.

All 12 existing browser interaction checks pass: 24 interrupted sequences, exact reassembly, 216 visible spread members without settled overlap/clipping, stable 140 geometries/8 textures, and zero idle redraws. Reviewed 1280×720 views include movement opening, dial side, winding overview and close-up, plus an oblique angle. The final shader renders without console errors. This is desktop visual QA, not a physical-device or sustained performance qualification. The last edit only excludes optional leather from the new contrast; it leaves the movement appearance and interaction results unchanged.

Evidence is local in `artifacts/browser/finish-adjustments/`: `before-front.png` / `after-front.png`, `before-winding.png` / `after-winding.png`, `after-winding-close.png`, `after-dial-side.png`, `after-oblique.png`, `browser-checks.json`, `cpu-checks.json`, `state-checks.txt`, and `build.txt`. The files named `before-back.png` and `after-back.png` captured movement-side frames during the side transition and are not dial-side comparison evidence. The coarse rejected candidate is `candidate-winding.png`.

Preview: http://127.0.0.1:4173/. Local checkpoint only; no push or publication. Next action is user visual review.
