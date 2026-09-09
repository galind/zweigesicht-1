# Washer, winding bridge, eccentric and chaton corrections

9 September 2026, explicit user corrections:

- Thin washer d121 (`Flitter 200x400`) uses goldish color `#d8b572`, roughness .31 and circular satin grain.
- Winding bridge d240 uses local brush axis `(cos8deg,-sin8deg)`, cancelling its source placement's 8-degree tilt. Grain follows assembly X; the existing shader derives both grain coordinates and anisotropic frame from this axis.
- Timing eccentric d111 matches balance rim d110 color `#c69d83`. All four occurrences retain their prior polished roughness .16.
- Jewel-setting metal d100 (two train chatons), d224 (diamond chaton), and d203/207 (both Incabloc hole-stone/base shells) uses rose gold `#d9ab94` with retained polished roughness .16. The separate stones and lyre springs retain their own finishes.

The complete ledger records the changes and resolves earlier washer/shell appearance conflicts. All 50 source/asset CPU checks, TypeScript, targeted material lint and production build pass. The actual source matrix regression proves horizontal winding grain. All 365 ledger geometry/matrix records are unchanged; 12 occurrences change material assignment. Isolated live views were reviewed without browser errors; screenshots and checks are in `artifacts/browser/washer-chatons-grain/`. No broader interaction or device benchmark rerun is claimed. Numerical colors and surface parameters remain authored. Local-only checkpoint pending user review.

---

# Shock-indicator screw correction

9 September 2026. User reference `USER-FINISH-2026-09-09-05` shows neutral screws around the shock-indicator mechanism, with the central mounting screw blue. Exact source prefix `p_0_1_1_1__0_1_1_1_4__0_1_1_83_29__0_1_1_145_`: suffixes 9 (d123), 20/21 (d166), 24/27 (d168), and 32/33 (d170) now use steel throughout. Suffix30 (d169) stays blue. Shared definitions keep their default assignments elsewhere.

The attachment hash is recorded in the source manifest without copying the image into public assets. The full ledger is refreshed. All 50 source/asset CPU checks, TypeScript, targeted material lint and production build pass. A live before/after shock-indicator comparison shows the corrected steel screws and retained blue centre screw, with no browser errors. No broader browser interaction suite or device benchmark was rerun for this assignment-only change. Evidence: `artifacts/browser/shock-screw-steel/`. Local-only checkpoint pending user review.

---

# Matching snailing and steel attachment corrections

9 September 2026, following the user's review of the previous checkpoint.

- Both barrels now match the accepted left snailing direction. The left d85/86 source XY orientation has opposite parity to right d90/91. Keeping +1.15 curvature on the left and using -1.15 on the right produces matching world-space winding for all four lid/drum parts. Both procedural grain and anisotropic reflections use the corrected direction; source transforms are unchanged.
- Eleven screws fitted from the back now use steel throughout. With prefix `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`, these are suffixes `11, 25, 48, 49, 50, 51, 52, 67, 68, 71, 72`. Their original local +Z screw axes all face world +Z. The runtime regression independently inventories them from source names/orientations and checks their materials. Exact-instance overrides retain other shared-definition assignments.
- The hairspring stud/holder, d117 (`ml01 Klötzchen`), is steel in both source occurrences. Its horizontal clamping screw, suffix `59__0_1_1_221_7` (d226), is also steel. The nearby balance-cock mounting screws retain their existing blue finish. The user correction resolves the ledger's earlier hidden-stud warm/steel uncertainty.

Verification: 50 source/asset CPU checks, four state tests, TypeScript, targeted material lint and production build pass. Twelve live-browser interaction checks pass. Both assembled sides and a balance-cock attachment close-up were visually reviewed with no browser shader errors. All 365 ledger geometry/matrix records are unchanged; exactly 14 occurrences change material family (11 rear screws, one stud screw, two studs). Decoded geometry remains byte-exact across 339 objects.

Local evidence: `artifacts/browser/finish-handedness-steel/`. No new physical-device or performance qualification is claimed. This checkpoint is local-only, pending user visual review.

---

# Snailing, cap plate and dial-screw corrections

9 September 2026, following user confirmation. This section supersedes the earlier circular barrel finish, unchanged crown wheel, cap-grain direction and blanket lower-bridge frosting described below.

- Barrel/drum faces (d85/86/90/91) now carry curved snailing strokes. A radius-dependent angular field controls both shallow surface grain and the anisotropic reflection frame. Sampling around a closed circle avoids an angular seam; strokes curve through approximately 66 degrees from centre to rim. This is an authored visual interpretation of attachment 04, not a measured manufacturing path. Ordinary wheels retain their own circular brushing.
- Crown wheel d249 has explicit circular brushing. Its separately modeled cap d251 retains its existing blue cone and other finish regions.
- Cap plate d105 has parallel grain along local +Y. The original screw bores are centred at (+/-.75,-1.1) mm and the jewel at (0,0), so the axis runs from the screw-pair midpoint toward the jewel. Both texture coordinates and the reflection frame are rotated. The opposite cap d120 has a different screw layout and retains its own direction.
- Train bridge d99 face54, the unique flat plane at Z=-.3 mm, is smooth satin with no frosting bump or grain. An actual source-sidecar regression proves the narrow plane mask selects exactly its 263 vertices and no other face. Other lower bridge fields remain frosted.
- Plate and remaining frosted bridge fields have stronger granular contrast and slightly greater shallow relief. Main-plate roughness is .55; no geometry or lighting changed.
- The two radial outer-rim dial screws, source instances `p_0_1_1_1__0_1_1_1_4__0_1_1_83_54__0_1_1_194_11` and `..._194_12`, use neutral steel across their entire modeled surfaces. Both are d201, mounted at approximately 16 mm radius with outward radial axes. Exact-instance overrides preserve the default blue d201 assignment elsewhere.

The new attachments are hashed in `assets/source-manifest/finish-adjustment-references.json`: 03 is the cap-plate photograph, 04 the barrel CAD render. The FHH terminology source used in the preceding discussion is recorded there too. Images serve as visual evidence, not executable instructions, and are not copied into public assets. The complete ledger is regenerated with these corrections; geometry, placements and original annotation binaries remain unchanged.

Verification: 49 actual-source/asset CPU checks, four state tests, TypeScript, targeted material lint and production build pass. Twelve live-browser checks pass, with exact reassembly, stable 140 geometries/8 textures and zero idle redraws. No shader errors were observed.

Evidence is local in `artifacts/browser/snailing-corrections/`, including opening before/after, cap and crown close-ups, both isolated dial screws, browser/CPU results and build output. Numerical shader settings remain authored; this pass makes no mechanical certification or physical-device performance claim.

---

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
