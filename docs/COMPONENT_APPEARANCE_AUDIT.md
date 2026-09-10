# Complete component appearance audit — 9 September 2026

The three reported problems are corrected locally: **DPL RBR is warm straight-grained metal, all three Werkhaltelasche screws are unblued steel, and the actual maker diamond STL is recovered at the original source placement.** The audit also corrects optional catalog material identities and preserves additional source face regions. Running/timing stays disabled. No push, publication, deployment or redistribution is authorized or performed.

## Coverage and confidence

The [complete ledger](appearance/LEDGER.md) contains every **365 source leaf occurrence**, individually identified even when it shares a definition: 223 movement and 142 optional catalog leaves, across 202 definitions. The [machine-readable ledger](appearance/ledger.json) records original source paths, matrices, geometry state, face/body/definition appearance, before/after material, intended finish, evidence, confidence, mismatch and disposition. All 202 definitions now have explicit material-family assignments; no current leaf relies on a name fallback. Explicit coverage does not prove physical correctness.

The current ledger distinguishes **88 verified, 264 inferred and 13 unresolved instance assignments**. “Verified” means the identified visible appearance family/region has reference support. It does not certify every concealed surface, alloy, roughness, grain scale, internal optical path or manufacturing process. The 264 inferences remain visible in the ledger rather than being promoted to verified by a passing test. The 13 conflicts are enumerated below. All 61 assembly occurrences are structural parents, not additional material-bearing leaves; the original hierarchy and 426 instance count remain unchanged.

Baseline: local commit `00ae9d3f3e441c1a7d2559e5b500b99ac4f5567b`. The actual existing preview at `http://127.0.0.1:4173/` was inspected and photographed before product edits. Original working notes and mechanical, CAD, material, finishing and animation reviews were read. The user-referenced attachment directory contained only the goal text, **no image attachment**. Existing maker photographs, macro references and seven narrowly targeted maker component downloads supplied the evidence instead; that missing attachment has not been pretended to have been inspected.

## DPL RBR: exact identification and correction

Definition **`d_0_1_1_105`, `ml01 DPL RBR`** is the small train-bridge endstone cap, not the broad dial plate. Its sole occurrence is:

`p_0_1_1_1__0_1_1_1_4__0_1_1_83_6__0_1_1_98_9__0_1_1_104_1`

Source evidence:34 faces, one valid solid, 2542 triangles, 2436 vertices. All faces carry warm source colors: 33 orange/gold-category faces and one darker warm top face. The missing definition color caused the exporter to discard that distinction; the existing runtime then explicitly assigned whole-part steel. Face13 is the top at local Z0; face12 is the underside at −0.35mm. Existing conical faces 15–18,20,22–33 supply modeled chamfers/countersinks. Face boundaries and source-derived normals now survive as separate, reversible annotations; original positions/indices/normals are unchanged.

The maker’s [DPL RBR component render](https://www.marcolangwatches.com/cad/ml01-dpl-rbr/) identifies the warm grained field and polished rim. More decisively, actual photographs `REF-SJX-04` and `REF-SJX-05` show the matching three-hole warm cap around the purple endstone, beside the train bridge’s serial inscription. It now has a warm straight-grained upper field, polished existing bevels/countersinks and rougher lower surfaces. The grain follows component-local X; neither its exact pitch nor alloy is measured. **No CAD RGB was sampled as a calibrated base color.** The opposite escape cap, d120 DPL WPL, also has18 warm source faces and now uses the warm cap family; that hidden-side correction is explicitly **inferred**, not photographically verified.

## Werkhaltelasche: every fastener, by location

`P` below is `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`. The clamp definition d185 has a source mounting-hole axis at local `(0,0.6)mm`. Applying each original matrix matches the listed screw axis within 1e−8mm XY. All three screws are d189 `010-zyl s80x140 k160x40`.

| Clamp instance | Screw instance | World XY/mm | Disposition |
|---|---|---|---|
| P38 | **P45** | 4.38263396,15.28406097 | Neutral steel head and body |
| P39 | **P44** | −13.90645334,−7.70847296 | Neutral steel head and body |
| P41 | **P43** | 13.90645334,−7.70847296 | Neutral steel head and body |

The maker whole-movement photo shows these three peripheral heads bright neutral, distinct from adjacent blue bridge screws. The [maker’s screw render](https://www.marcolangwatches.com/cad/010-zyl-s80x140-k160x40/) corroborates the source identity and neutral appearance. The fix is an **exact-instance override**, not a new definition-wide rule. Existing d181 crown-area overrides remain intact and other d181 placements stay blue. Current source d189 happens to occur at precisely these three clamp locations; a regression also verifies an unrelated d189 ID still receives the pre-existing blue-head family.

**Follow-up user correction, 9 September 2026:** bluing covers the entire screw, including the slot, underside, shaft and any modeled thread. The prior head-only interpretation in this audit is superseded. The material shader now bypasses neutral source face colors and roughness for blued screws across the twenty screw definitions; exact-instance steel assignments remain unblued. The immutable source face annotations are retained for provenance, including differing head origins. Neutral hand seats remain separate. This is a finish correction; no thread geometry is added and no manufacturing certification is claimed.

**The clamp body itself is unresolved:** d185 is source-gray, but its separate maker render uses a violet/blue broad top. The installed photograph exposes too little clamp surface to resolve that conflict. Its steel body is retained; the screw correction does not silently recolor the clamp.

## Diamond: upstream STEP loss, authentic STL recovery

The assembly STEP’s `#509351 SHAPE_REPRESENTATION('030-Brilliant_200',…)` refers only to `#509383 AXIS2_PLACEMENT_3D`. It has no face/solid representation. Its product/assembly relationships are present. The maker’s separate 2509-byte STEP is also axis-only. Thus the omission is already in the maker’s STEP exchange data, **not a GLB conversion, visibility or shading loss**. The exact reason the original Solid Edge export omitted the body cannot be established without the native authoring file.

The same [maker component page](https://www.marcolangwatches.com/cad/030-brilliant_200/) supplies an 82084-byte **original STL with 1640 facets**. SHA256:

`c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a`

The STL XY midpoint `(124.99695206,104.99903488)` cancels the source instance translation `(−124.99695322,−104.99903344)` within about 1.9e−6mm. Its original world matrix places it in d224’s gold chaton at the balance-bridge center. **No centering, scaling, shape repair, mesh smoothing or placement change is applied.** STL is unitless; companion STEP millimetres, exact component identity and the offset/seat match support the mm interpretation.

- Original STL bounds: `[124.01011658,104.01219940,0]` to `[125.98378754,105.98587036,1.25869012]`.
- Original-placement world bounds: `[−0.98683353,−10.98557041,−5.84999998]` to `[0.98228730,−9.01463233,−4.59130986]`.
- 822 unique vertices, 2460 edges each incident to2 facets, one connected closed component, Euler 2; no degenerate facet, directed-edge conflict or normal/winding disagreement. Volume 2.01676462mm³ is a mesh calculation, not a measured diamond volume.

The original assembly record still has zero triangles and null bounds. A separate hash-checked loader adds the maker mesh under that original ID and matrix. Selection, isolation, reveals and separation use the same existing controller; a separately calculated visible center avoids using the empty record’s distant origin for separation. Missing/corrupt recovery gracefully preserves the movement and reports the recovery error; About distinguishes loaded from unavailable recovery. The full source is now 365 renderable leaves, with 223 loaded in the movement subset and 222 visible by default because the alternate setting spring remains hidden.

**Optical and cut limitation:** the original maker STL is a simplified eightfold stone, visibly matching its component render. It does not reproduce the dense brilliant facets in the finished-watch macro. Clear dielectric IOR 2.417 and transmission are authored real-time approximations; the renderer lacks multiple internal bounces/dispersion. The stone therefore has broad light/dark facets rather than the photographed brilliance. No generic replacement, invented cut or reconstructed CAD has been substituted. Mechanical seating/contact accuracy is not certified.

## Whole-source appearance trace and additional corrections

The existing full XCAF inventory remains the source: 202 leaf definitions,203 solids,25228 faces,17765 face colors,131 definition colors, no direct occurrence-label overrides, no physical/PBR material table.224 leaf occurrences resolve inherited colors; these are not224 independent overrides. The original exporter retained only definition RGB, lost face/body appearance and alpha, and built generic GLB materials. The viewer disposes those imported materials in favor of explicit reviewed profiles. Source display colors are linear RGB after XCAF conversion; no extra color-space conversion or literal photographic sampling is applied.

Separate annotations now cover **58 definitions /418017 vertices**:45 movement definitions and 13 catalog-only definitions. Packaging checks every position and original normal against the unchanged decoded geometry before attaching analytic normals/region roles. Complete source color groups remain in the ledger for all 202 definitions; unannotated faces are explicitly conservative/inferred. The new payload is 6688272 bytes,1057460 gzip bytes. Original GLBs and all original buffers/matrices are preserved. Outlier analytic normals retain the existing conservative30° agreement rule; this is shading annotation, not tessellation repair.

Additional exact-identity corrections:

- **Two sapphire crystals d67:** opaque metal fallback→clear dielectric, with Function treatment disabling transmission. Optical thickness and coatings remain approximate. Browser inspection found that Three r186 clears the transmission target white/alpha 0.5 on the transparent canvas, creating a white-disc artifact. For sapphire and diamond only, the shader replaces the uncovered fraction with the dark studio backdrop and preserves opaque scene samples. This is a documented background approximation; ruby shading is unchanged.
- **Catalog hands and hand bushings:** enamel/brass fallbacks→blue metal. Seven mixed definitions preserve source-neutral seats separately. Maker prose supports blued-steel hands; individual optional variants remain inferred.
- **Metal dial carriers d3/d14/d17 and dial-I surfaces d26/d27:** separated from enamel; source-dark marking regions use a distinct nonmetallic surface role on d3/d17/d26/d27. Existing modeled engraving/guilloche is retained. Solid-silver construction is supported by maker dial-II prose, but exact carrier alloy/render values are not measured.
- **Separate red enamel inserts d4/d21 remain red** as explicitly named source alternatives. They are not silently changed to the blue photographed production variant. Enamel layer depth remains approximated.
- **d25 indices and d36 logo:** source-warm metal instead of neutral fallback. Family intent inferred from source and photographed display detail; exact alloy unverified.

96 instances differ in family from the historical baseline. The current finishing-fidelity pass preserves the warm plate, handed barrel snailing, straight-grained bridge tops, exact exposed-base frosting, polished BRep chamfers, blue recessed borders, d251 face22 crown cone, d159 faces 1–4 shock fields, d156 red inlays, ruby optics, studio lighting and contact shading. No broad lighting or hue adjustment is used to hide a mistaken component identity.

## Remaining uncertainty, precisely scoped

The 13 unresolved occurrences span 9 definitions:

- d114 double roller, d130 safety piece, d206 lyre spring and d233 escape wheel: source display colors disagree with inherited warm/steel interpretations. Exposed component-specific primary material evidence is missing; retained rather than guessed. The user has resolved d137/d183 cannon pinions and d142/d188/d235 wheel hubs as steel.
- d185×3 clamp bodies: gray source versus blue/violet component-render top; installed surface largely occluded.
- d66×2 glass gaskets: pale source versus dark rubber emulation; exposed production color/composition evidence missing.
- d4/d21 red enamel alternatives: source variant versus photographed blue production dial remains a choice, not a demonstrated source error.
- d256 regulation support: source tooling with orange display color; material/composition unverified.

The 264 inferred assignments additionally include concealed steel/pin/screw/wheel surfaces, leather and catalog alternatives. Their exact IDs, source colors, evidence and retained surface treatment are in the ledger. Grain direction for curved bridges and wheel spokes is still a local planar/circular approximation. Numeric roughness, frosting pitch, coating thickness and optics are authored. Original invalid d111 eccentric faces, d27 dial BRep, d54 untessellated exterior face, small source slivers and overlapping catalog alternatives remain recorded. No claim that every part is physically correct is made.

## Validation and reproduction

See [visual evidence index](../artifacts/browser/component-appearance-audit/index.html) for preserved before/after pairs, both sides, all six reveals, individual screws, DPL oblique, diamond/setting, catalog, responsive layout and graphics recovery. The screenshot set is sampled interactive browser evidence, not calibrated photography or temporal-AA/device certification. Machine evidence is local in `artifacts/finishing-cad/appearance-audit/` and the browser folder. Final results: 29 source/asset CPU regressions, four state tests, production build, TypeScript and lint pass. All six browser checks pass on the final annotation payload: 20 interrupted reveals, exact matrix return (error 0), default visibility, ten essential leaves, stable 139 geometries / 8 textures and zero idle redraws. Graphics recovery returns without error with the diamond and 58 annotation definitions present. Both 390×844 and 320×740 document widths equal their viewport widths. The catalog-loaded earlier run also held stable at 141 / 8 for its rendered subset; GPU counts reflect geometry actually drawn, not all catalog records. Final results are also recorded in PROGRESS.md.

Reproduce locally, retaining original source binaries and existing dependencies:

```sh
.venv-cad/bin/python scripts/cad/finish_audit.py
.venv-cad/bin/python scripts/cad/appearance_target_probe.py
python3 scripts/prepare_local_assets.py
node scripts/assets/prepare-finishes.mjs
node scripts/cad/appearance_ledger.mjs
node scripts/cad/review-runtime.mjs
python3 scripts/cad/appearance_evidence.py
node --test tests/*.test.mjs
(cd explorer && npm run build && npx tsc --noEmit && npm run lint)
```

The extra original diamond STL must exist at `assets/source-originals/appearance-audit/030-Brilliant_200.stl`; its exact maker URL/hash and all new reference attributions are in [component-appearance-references.json](../assets/source-manifest/component-appearance-references.json). The source assembly, standalone STEP/STL, photographs, generated binaries and screenshots stay ignored/local. Local preview: **http://127.0.0.1:4173/**; restart with `cd explorer && npm run dev`. No asset redistribution or release readiness is implied.
