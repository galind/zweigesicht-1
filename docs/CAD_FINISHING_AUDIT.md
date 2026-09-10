# CAD-to-runtime finishing audit

**Complete local audit; ready for user approval before implementation.** Production appearance is unchanged. All individual browser reviews and the programmatic coverage gates passed.

This investigation compares the actual maker STEP/XCAF with the existing production renderer. It proposes no immediate visual changes. The machine-readable [audit ledger](appearance/cad-finishing-audit.json) contains a definition record for every leaf definition and an individual occurrence record with its transform, assignment, observations, evidence and disposition. The [implementation plan](CAD_FINISHING_IMPLEMENTATION_PLAN.md) separates one factual color correction from unresolved optical/finish decisions and geometry work.

## Method and evidence hierarchy

Explicit user corrections and supplied images take precedence, followed by direct CAD definition/body/face metadata, mechanical identity and assembly relationships, exact-variant maker photographs/documentation, exact-variant third-party photographs, explicitly identified renders, and historical runtime interpretations. Disagreements remain recorded even when a stronger source determines the recommendation. No CAD RGB value certifies an alloy, heat treatment, plating, stone species, roughness, anisotropy or optical constant.

The fresh extraction opens `assets/source-originals/ml01-zweigesicht.stp` with the existing CAD environment. Its SHA-256 is `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. The original file and provenance manifests remain unchanged. A body means a solid or free shell; shells inside solids are counted without duplicating bodies. Face IDs are deterministic definition-local extraction IDs, not globally unique numbers. Every face retains its body membership, appearance group, surface type, area, bounds, orientation, analytic normal/caveat, tessellation counts and annotation roles. Explicit face colors override body colors, which override definition colors. Missing appearance is retained as absent, separately from neutral gray.

Every definition received a source/reference assessment; every occurrence received its own browser pixel note. Repeated parts share source geometry evidence but retain separate transforms, visibility limits, assignments and observations. The browser used the actual local production page at `http://127.0.0.1:4173/?inspect`, existing selection/isolation controls and keyboard orbit/zoom. Full movement views preceded individual review. Supplementary mechanism, catalog-parent and fitted-dial views provide context. Captures without substantive notes do not count as reviewed.

Local original screenshots, measurements and capture indexes are under `artifacts/browser/cad-finishing-audit/`. Source extraction, pipeline verification, reference review and checks are under `artifacts/cad-finishing-audit/`. These ignored files are not public assets. Contact sheets are review aids; their crops do not replace original screenshots. Browser front/back names are movement-relative; transverse parts require axial or pitch supplements. Occluded views are explicitly described as occluded. Small recesses and microscopic finish remain unresolved where current geometry, camera limits or pixels cannot establish them. Twenty-eight intermediate switch-side frames are explicitly not accepted as settled opposing views; replacement settled views were reviewed. Earlier macro-back filenames in one tranche can denote restored normal isolation framing, so filenames alone are not treated as proof of magnification. These caveats are preserved in the ledger and original capture indexes.

## Verified inventory

| Inventory | Count |
|---|---:|
| Source instances | 426 |
| Assembly nodes | 61 |
| Material-bearing leaf occurrences | 365 |
| Unique leaf definitions | 202 |
| Movement leaves | 223 |
| Optional catalog leaves | 142 |
| Bodies / solids / shells | 204 / 203 / 204 |
| Source faces / appearance groups | 25,228 / 276 |
| Source tessellation triangles / vertices, once per definition | 1,148,881 / 979,364 |
| Mixed-appearance definitions | 60 |
| Source-transparent definitions | 18 |
| Explicitly colored body labels / directly colored faces | 6 / 17,765 |
| Definitions missing some appearance | 7 |
| Physical / PBR visual material table entries | 0 / 0 |
| Direct occurrence color records / resolved SHUO color records | 0 / 224 |
| Repeated definitions / repeated definitions with different runtime families | 76 / 4 |
| Explicit runtime definition mappings / current name fallbacks | 202 / 0 |
| Exact steel occurrence overrides | 29 |
| Annotated definitions / annotated source faces / packed vertices | 58 / 16,849 / 418,017 |

Multiple bodies occur in d4, d21 and d116. The first two have two colored enamel solids; d116 has two explicitly blue solids, not a missing-color body. The warm collet is separate d115. The 18 transparent definitions are d4, d21, d67, d101, d102, d106, d112, d128, d134, d156, d196, d197, d198, d199, d204, d205, d208 and d231. Earlier counts of 15 missed body-level enamel and face-level gauge transparency. Missing appearance affects d107, d122, d123, d136, d138, d169 and d181; it is not evidence for steel.

Source d225 has no STEP body. Its visible runtime diamond is separately recovered maker STL with 1,640 triangles at the original placement. Invalid BReps are d27 and d111. Missing tessellation is d54 face 1 and d111 faces 8, 14 and 23. The fresh tessellation contains 328 degenerate triangles at the documented area threshold of `1e-14 mm²`. None of these facts certifies or repairs mechanical correctness.

## Where appearance information changes

The STEP contains colored definitions, bodies and faces, but no measured physical/PBR material table. Export creates generic per-definition materials and loses body/face color boundaries and alpha. The current overview GLB has 138 meshes; catalog has 201 and includes movement geometry, so these counts are not disjoint. Both optimized GLBs retain position/normal attributes, indices and transforms; neither carries source RGBA or source face IDs. The renderer disposes imported materials and replaces them with explicit authored profiles. This is an export loss followed by an intentional reconstruction, not faithful material transport.

The 58 annotated definitions recover selected geometric regions and analytic normals through independent sidecars. Every role 0–10 and every annotated face is reconciled in `pipelineVerification`. Role 0 remains conservatively unclassified; other roles select broad fields, screw/underside handling, blue engraving/lever regions, dial markings, optical/color regions and base/bevel processes according to their exact shader gates. Unannotated regions retain explicit source groups in this audit, even though the renderer cannot distinguish them. The ledger preserves each role's actual behavior instead of assuming that its descriptive label proves a physical process.

All 202 live definitions map explicitly; no current leaf takes a family-name fallback. Within the mapped enamel family, a separate name-based color choice still makes raw d21 red; these are different control paths. Thirteen synthetic probes cover all remaining fallback branches, including the final steel default. They are control-flow checks, not visual acceptance of imaginary parts. All material profiles have audit records. Reused definitions d9, d107, d123 and d181 differ across occurrences; their full IDs, transforms and families are enumerated. The 29 exact steel overrides remain protected.

Selection and mode gating matter. Mechanism emphasis dims surrounding parts, alters their metalness/roughness and can disable decorative/optical response. Function selection is not a universal finish bypass: an isolated ruby can retain transmission. Analytic shader normals may remain active when decorative finish is disabled; original NORMAL buffers remain unchanged. Annotation load failure is fail-closed, rather than graceful fallback as older prose claimed. These are traced behaviors, not proposed UI changes.

## Findings by mechanism

**Dials, enamel and hands.** d21 is the single high-confidence definite color mismatch. Both body labels `0:1:1:21:1` and `0:1:1:21:2`, all 32 faces, are blue RGBA `[.0048963102, 0, .4910208881, .7300000191]`. Its name says “Emaille rot”; the raw runtime follows that misleading name and renders red `0x6c2031`. Individual raw-catalog views confirm red on both bodies. The configured small dial already uses blue, which agrees with the source color. d4 genuinely has two red bodies, all 42 faces, RGBA `[.3419144452, 0, 0, .8080000281]`; it must stay separate. Correcting d21's raw family is implementation-ready after approval; deriving numerical transmission from source alpha is not.

Both fitted dial systems and all six supported hand-style states were viewed. Requests outside a dial's supported styles normalize to a default; the evidence records the effective style. Silver carriers, dark markings, separate blue hands and the fitted blue enamel retain their roles. Catalog parent assemblies contain overlapping alternatives at original placements and must not be mistaken for a single configured variant. Geometric guilloche/normal limitations of d27 remain distinct from its material mapping.

**Main plate, bridges and clamps.** Warm frosted d195, broad neutral bridge fields, modeled polished edges and blue recesses broadly agree with the retained photographs. Exact green/pale/purple CAD groups remain recorded rather than certified as physical coatings. d99, d222 and d228 have explicit regional treatments; their undersides must not receive blanket frosting or bluing. d230's source purple recessed faces 37–66, including planar floors 51/66 at local Z −0.1 mm, are omitted from blue annotation. This loss is factual, but the recent accepted fidelity pass deliberately removed the blue border and its test protects omission. Its primary disposition is **Intentional override**, with an unresolved source/variant conflict; no automatic reversal is proposed. d219 is in the etched-policy whitelist but has no role-3 faces, so its conditional treatment currently has no effect. Three concealed d185 clamps remain unresolved: neutral CAD conflicts with a blue-violet maker component render, which is not a photograph.

**Barrels and going train.** Both barrel assemblies were inspected independently, including drums, lids, arbors and repeated fasteners. Current snailing parity and handedness remain protected. Warm source subgroup distinctions on d85/d86/d90/d91 are flattened; their physical significance is unresolved, not silently dismissed. Warm wheel fields and neutral pinions/staffs remain separate. Transverse d97 received an opposing-axis supplement. Separately modeled d142/d188/d235 hubs remain steel under the user's correction. Green functional-looking bore/end-face colors are recorded as unresolved display/finish intent rather than literal green coating recommendations.

**Balance, escapement and shock setting.** The warm rim and all four d111 eccentric occurrences retain the user-matched hue; holes/slivers on invalid d111 are geometry limitations. d116's two bodies are explicitly blue by body inheritance, so the earlier direct-face-only suspicion is superseded. d117 remains steel. Jewels were inspected from both sides and at oblique angles; annular highlights, wine/magenta interiors and flatter reverse faces are recorded without restoring the rejected excessively crimson palette. Double roller d114 (neutral CAD, warm runtime), safety blade d130 (warm CAD, steel runtime), lyre d206 (neutral CAD, warm runtime) and d233 escapement material evidence retain their individual conflicts/history. Chatons d100/d203/d207/d224 remain rose gold by explicit correction. d225's simplified eightfold cut and approximate transmission cannot establish photographic diamond brilliance.

**Motion works, winding and keyless works.** d137/d183 cannon pinions and separately modeled hubs are steel; neighboring warm wheels do not justify recoloring them. Transverse winding stem d143 and clutch pinion d144 received axial supplements. d240 retains the local grain axis that cancels the approximately 8° assembly tilt, preserving horizontal assembled brushing. d249 currently uses a mirror/black-polished profile; an earlier explicit circular-brushing instruction and retained SJX detail photograph show circular grain. This history conflict is unresolved and requires a specific finish decision. Current appearance is preserved meanwhile. Ratchet circular satin and exact crown/clamp/radial steel screws remain independently scoped.

**Shock indicator.** Every plate, lever, pin, screw, spring, inlay and concealed mass is an individual row. d155 is unequivocally steel. d159's steel base retains blue source faces 1–4 plus the retaining-end subset of top face 262 at local Y < 1.56 mm; central spine, underside and sidewalls stay steel. The dark ruby-red d156 wedges are faces 65–84/role 7. The shader changes their diffuse color but retains metalness 1 and transmission 0 from the bridge; source alpha is approximately .808. Browser review confirms shallow opaque-looking wedges. This is a definite optical-information loss but an **unresolved physical interpretation**, not permission to make the entire plate ruby or to change the user's dark-red color. Regional optical work requires approval and stays separate from d21's factual color fix.

**Case, crown, crystal, seals, straps, buckle and tooling.** All optional leaves, repeated attachment hardware and alternatives are included. Steel exterior identity often agrees with names/placement while colored terminal or functional faces remain unresolved. d67 sapphire is visibly transmissive with neighboring movement behind it; a smoky isolated appearance is not evidence of opacity. d66 pale CAD versus dark rubber remains unresolved. Named leather tints are correctly applied; d63's 66 pale underside faces and d81's pale planar faces 85/86 are flattened. Their bounds and exact groups suggest underside marking/patch regions, but do not prove stitch, lining or leather composition. Any later correction must be regional. d256 orange tooling/support CAD versus steel runtime remains unresolved and outside the movement, not skipped as an irrelevant catalog item.

## Protected decisions and historical reconciliation

The ledger carries 18 explicit correction locks and a reconciliation entry for every one of the previous ledger's 365 rows. All 126 historical before/after mismatch records are reconciled; they are not automatically reopened as current defects. All 13 previous unresolved occurrence records receive an explicit retained or superseded assessment. Ten stale claims are preserved with corrective explanations, including d21's alleged red source, transparency undercount, global Function bypass and annotation graceful-fallback descriptions. Historical documents and tests have not been rewritten during this investigation.

No proposal reverses the steel mass, steel cannon pinions/hubs, less-crimson jewels, retaining-end blue extent or dark ruby gauge correction. Other explicit protections include matched barrel snailing, steel d117, warm matched balance eccentrics, rose-gold chatons, goldish circular-satin d121 washer, horizontal d240 grain, whole-blue screw shafts/undersides and all exact steel exceptions. A user-history conflict such as d249 is held for a decision rather than resolved by guessing chronology.

## Scope limits

Completeness means every source leaf, body, face group, runtime mapping and occurrence has been accounted for and reviewed with explicit uncertainty. It does not mean every physical material is known or that microscopic finish is observable. Faces whose semantic role cannot be established remain explicitly unclassified, with deterministic geometric descriptors and exact appearance IDs. Their colors have not been discarded. Source display alpha, synthetic shader probes and passing runtime tests are not measured optical evidence. CAD-derived render assets and recovered STL remain subject to their existing release gates. Nothing has been pushed, merged, deployed or redistributed.

## Verification and complete indexes

Verified with `python3 scripts/cad/assemble_cad_finishing_audit.py --verify`. The 64 existing source/asset checks also pass; they are not physical-finish certification.

<!-- GENERATED VERIFIED APPENDIX -->

Exact review: **202/202 definitions; 365/365 individually reviewed occurrences; 204 bodies; 25,228 faces; 276 exact face partitions; 3,115 indexed leaf screenshots**, plus separately indexed mechanism, parent and fitted-mode evidence.

| Disposition | Definitions | Occurrences |
|---|---:|---:|
| Match | 127 | 206 |
| Intentional override | 20 | 69 |
| Definite mismatch | 1 | 1 |
| Probable mismatch | 0 | 0 |
| Unresolved conflict | 50 | 79 |
| Technical limitation | 4 | 10 |
| Not renderable/excluded | 0 | 0 |

| Confidence | Definitions | Occurrences |
|---|---:|---:|
| high | 18 | 52 |
| medium | 184 | 313 |
| low | 0 | 0 |

Confidence is confidence in the recorded evidence comparison. Medium does not certify composition; the substantive reason and visible limits are retained in each row. A technical limitation can coexist with a correct material family. Inactive alternatives were deliberately selected and reviewed, so none was omitted as unrenderable. d225 was reviewed through its explicit separate recovery.

Preservation check: 59 baseline production/provenance/user files retain their SHA-256 hashes. The current source, model binaries, original attributes and runtime sidecars are unchanged. All 29 exact overrides, 58 annotated definitions, 11 roles, 13 synthetic fallback branches and four differing repeated definitions reconcile. All 18 correction locks and 365 prior-ledger reconciliation records are present.

### Every definition

Full IDs use prefix `d_0_1_1_`; each row below points to the equally numbered definition in the JSON. All occurrence IDs, matrices, current profiles, exact face groups and individual observations are in that record and its occurrence rows.

| Definition | Occurrences reviewed | Disposition | Source/reference assessment |
|---|---:|---|---|
| d_0_1_1_3 — ZB Ring 18 Emaille rot transluzid | 1/1 | Match | Silver carrier has its own 96 dark marking faces and separate d4 enamel; retain regional separation despite misleading whole-carrier Emaille name. |
| d_0_1_1_4 — ZB Ring 18 nur Emaille rot | 1/1 | Unresolved conflict | Two explicitly colored solids (body labels 0:1:1:4:1 and :2) are red RGBA [.3419144452,0,0,.8080000281], covering all 42 faces. Raw red family matches; lost source transparency versus opaque coating remains unresolved optical interpretation. |
| d_0_1_1_5 — Applik Punkt 80 | 12/12 | Match | Eight-face applique is a separately modeled cool neutral marker; steel-like polish agrees with gray source, not with the warm d25 index alternative. |
| d_0_1_1_7 — Min_Zeiger 8,5 Lanze | 1/1 | Match | 22-face short minute lance explicitly purple-blue at definition level; blued metal agrees with maker hand prose, optional style process unmeasured. |
| d_0_1_1_8 — Zeigerbuchse_28x100x70 | 2/2 | Match | Short-minute bushing has twelve blue faces and one gray seat; retain the seat exception independently of whole-screw bluing. |
| d_0_1_1_9 — 010-linsenk s60x105 k90x25 | 6/6 | Intentional override | Small countersunk screw has nine gray faces plus one green CAD face; user whole-screw bluing outranks this source partition except exact steel occurrences. |
| d_0_1_1_11 — St_Zeiger 5,0 Lanze | 1/1 | Match | 22-face short hour lance has its own blue definition color; retain blue metal and do not infer enamel from Zeiger name. |
| d_0_1_1_12 — Zeigerbuchse_67x135x91 | 2/2 | Match | Short-hour bushing has eight blue faces and one neutral seat; blue metal with the exact neutral seat is supported by its mixed source. |
| d_0_1_1_13 — St_Zeiger 5,0 Lanze massiver | 2/2 | Match | 24-face heavier short hour lance retains source blue; no separate enamel region supports a dielectric body. |
| d_0_1_1_14 — ZB Ring 18 4segmentig | 1/1 | Match | 210-face four-segment silver carrier and d21 coating are separate definitions; raw metal identity stays silver with fitted blue enamel only on d21. |
| d_0_1_1_16 — Min_Zeiger 8,5 Lanze massiver | 2/2 | Match | 26-face heavier short minute lance is blue at definition level; its loose and assembled reuse must keep the same material while placements differ. |
| d_0_1_1_17 — ZB Ring 18 gerade Schenkel | 1/1 | Match | Straight-spoke silver dial alternative has 144 pale and 96 dark faces; preserve marking set without claiming this optional ring matches fitted geometry. |
| d_0_1_1_18 — St_Zeiger 5,0 Birne | 1/1 | Match | 26-face pear hour hand is explicitly blue; its pear silhouette does not imply a different alloy or finish family from maker hand prose. |
| d_0_1_1_19 — Min_Zeiger 8,5 Birne | 1/1 | Match | 26-face pear minute hand is explicitly blue; retain polished blue and evaluate bore/underside without extending another hand's seat mask. |
| d_0_1_1_21 — ZB Ring 18 Emaille rot 4segmentig | 1/1 | Definite mismatch | Both explicitly colored solids (body labels 0:1:1:21:1 and :2), all 32 faces, are BLUE RGBA [.0048963102,0,.4910208881,.7300000191] despite the name Emaille rot. Raw red runtime follows a misleading name; fitted blue agrees source color. Prior red-source claim is false and should be superseded. Retain d4 as the genuinely red alternative. |
| d_0_1_1_23 — ml01 ZB ۢergangsring | 1/1 | Match | Nineteen-face transition ring has neutral source metal; keep distinct from silver carriers and enamel inserts until exact alloy evidence exists. |
| d_0_1_1_24 — Min_Zeiger 14,7 Faden | 1/1 | Match | Fine minute hand has fourteen blue and two gray faces; preserve both seat faces, not whole-definition blue across neutral material regions. |
| d_0_1_1_25 — ml01 5min Index | 12/12 | Match | Fourteen-face applied five-minute index has warm source color; gold family is an appearance interpretation, not an assay of its mounting pin. |
| d_0_1_1_26 — ml01 ZB Auޥnring V2 | 1/1 | Match | Outer Dial A ring has 300 pale and 527 dark faces; separate marking/background treatment is needed over its silver carrier field. |
| d_0_1_1_27 — ml01 ZB Innenteil V2 | 1/1 | Technical limitation | Inner dial has 9956 pale and134 dark faces with invalid BRep history; preserve guilloche geometry and mark recovered tessellation/normal limits explicitly. |
| d_0_1_1_28 — St_Zeiger 8,8 Faden | 1/1 | Match | Fine hour hand has eleven blue and one neutral face; its single gray seat must remain distinct from the blade. |
| d_0_1_1_29 — Sek_Zeiger 15,6 Lanze | 1/1 | Match | Central lance seconds is uniformly source blue; fitted XY alignment is a presentation correction, not material evidence or source geometry repair. |
| d_0_1_1_30 — Sek_Zeiger 15,6 Faden | 1/1 | Match | Fine central seconds has21 blue-inherited faces; no direct mixed seat color is recorded and no seat exception should be invented. |
| d_0_1_1_31 — St_Zeiger 8,8 Lanze | 1/1 | Match | Central hour lance is22-face blue; keep its independent identity from open-lance d35 and their different bushings. |
| d_0_1_1_32 — Min_Zeiger 14,8 Lanze | 1/1 | Match | Central minute lance is24-face blue; source hand-length variant does not justify enamel fallback. |
| d_0_1_1_34 — Zeigerbuchse_150x240x182 | 1/1 | Match | Large hour bushing has12 blue and1 gray face; fitted open-lance configuration must preserve the neutral seat. |
| d_0_1_1_35 — St_Zeiger 8,8 Lanze offen | 1/1 | Match | 46-face open hour lance has blue source definition; pierced geometry is retained and cannot be replaced by an opaque enamel fill. |
| d_0_1_1_36 — ml Logo | 1/1 | Match | 100-face maker logo is warm at definition level; warm metal is plausible but color does not certify rose/yellow-gold alloy. |
| d_0_1_1_38 — Zeigerbuchse_80x182x140 | 1/1 | Match | Minute open-lance bushing has12 blue and1 gray face; exact seat regional material survives independent of blade d39. |
| d_0_1_1_39 — Min_Zeiger 14,7 Lanze offen | 1/1 | Match | 52-face open minute lance is source blue; narrow pierced edges need optical/aliasing review without broadening the material mask. |
| d_0_1_1_41 — Zeigerbuchse_27x150x100 | 1/1 | Match | Seconds open-lance bushing has12 blue and1 gray face; its mounting seat is distinct from surrounding blued metal. |
| d_0_1_1_42 — Sek_Zeiger 15,6 Lanze offen | 1/1 | Match | 49-face open seconds lance is blue at definition level; source pierced blade remains metal in both loose catalog and fitted views. |
| d_0_1_1_44 — Dring ID36 f0,6 | 2/2 | Match | Single-face case O-ring is near-black in CAD; matte dark seal family agrees, composition and compression behavior unverified. |
| d_0_1_1_46 — ml01 Krone SS | 1/1 | Unresolved conflict | Crown SS has523 neutral faces andone green face; SS supports steel body, while colored face intent remains unresolved rather than silently certified as steel. |
| d_0_1_1_47 — Dring AD3,5 f0,65 | 2/2 | Match | Single-face crown O-ring is CAD near-black; retain rubber-like dielectric with each repeated seated occurrence reviewed. |
| d_0_1_1_48 — ml01 Krone Abdeckring | 1/1 | Match | Eight-face crown cover ring is uniform CAD neutral; steel-like assignment is plausible without evidence for another coating. |
| d_0_1_1_50 — Lederband 18mm M mittelbraun Schl.Seite | 2/2 | Intentional override | Brown buckle-side strap is named mittelbraun but CAD black; authored brown runtime honors explicit variant name, intentionally overriding display color. |
| d_0_1_1_52 — ml01 Hörnchenschlüssel | 8/8 | Unresolved conflict | Lug key has14 neutral and2 red faces; retain neutral hardware conservatively while the red-region intent remains unresolved. |
| d_0_1_1_53 — 010-linzylans s120x180 k230x160 a140x210 ss | 8/8 | Unresolved conflict | SS lug screw has12 gray and1 green face; steel family follows SS identity, colored face is likely functional marking but not proven manufacturing intent. |
| d_0_1_1_54 — ml01 Hörnchenbügel SS | 4/4 | Technical limitation | SS lug bracket has74 source faces andknown untessellated exterior face; material neutral agrees while missing surface is a geometry limitation. |
| d_0_1_1_55 — Schraubsteg 1,7x17,8 | 4/4 | Unresolved conflict | 17.8mm screw bar has15 neutral and2 green faces; steel bar identity remains separate from any colored end-face purpose. |
| d_0_1_1_56 — ml01 Hörnchenblende SS | 4/4 | Unresolved conflict | SS lug cover has107 neutral and2 green faces; preserve local ledger evidence for the colored faces even if current steel remains. |
| d_0_1_1_57 — 010-linsenk s100x120 k140x50 ss | 8/8 | Unresolved conflict | SS countersunk screw has9 neutral and1 green face; this exterior steel default is not covered by movement whole-blue correction. |
| d_0_1_1_59 — ml01 Schliesse SS 16mm | 2/2 | Match | 257-face SS buckle is neutral CAD; steel reflectance is plausible but no measured polish map across recesses and inner walls exists. |
| d_0_1_1_60 — Schraubsteg 1,7x15,9 | 2/2 | Unresolved conflict | 15.9mm screw bar has15 neutral and2 green faces; shorter buckle-side hardware must not be conflated with d55 geometry. |
| d_0_1_1_61 — 010-linzylans s120x160 k190x90 a140x120 | 4/4 | Unresolved conflict | Buckle screw has12 gray and1 green face; neutral exterior assignment is supported by placement but head-only functional color remains a conflict. |
| d_0_1_1_62 — ml01 Dorn SS 16mm | 2/2 | Match | 57-face SS buckle tongue hasneutral source color; retain steel and separately inspect contact tip, pivot and underside. |
| d_0_1_1_63 — Lederband 18mm M dunkelblau Schl.Seite | 2/2 | Unresolved conflict | Single solid has 158 black and 66 gray faces; gray set is 56 B-splines and 10 planes, area65.0176mm2, confined to center underside X[-2.2235,2.3742],Y[8.3329,38.7694],Z[.1237,.8752]. Blue tint intentionally follows name, but underside marking/patch distinction is flattened. Its physical material is unresolved. |
| d_0_1_1_64 — Lederband 18mm M schwarz Schl.Seite | 2/2 | Match | Black buckle-side leather has154faces with black definition color; dark rough dielectric agrees in family and hue, pore/stitched finish is authored. |
| d_0_1_1_66 — Glasdichtung AD35,6 ID34,86 H0,8 | 2/2 | Unresolved conflict | Eight-face glass gasket is pale gray CAD but dark rubber runtime; exact exposed production variant/composition unresolved, retain pending evidence. |
| d_0_1_1_67 — Saphirglas ֳ5x1,5x1 | 2/2 | Match | Six-face sapphire iswhite alpha.30 CAD; clear dielectric is a supported identity correction, alpha is not measured transmission or coating data. |
| d_0_1_1_68 — ml01 Schraubboden SS | 2/2 | Unresolved conflict | SS screwback has20neutral andone green face; steel main body supported while green functional region intent remains recorded. |
| d_0_1_1_70 — ml01 GMT Ring SS | 1/1 | Match | 115-face GMT steel ring is uniform neutral; no enamel or precious metal proof in this definition, retain steel interpretation. |
| d_0_1_1_71 — ml01 Kronenschutz | 1/1 | Match | 47-face crown guard is neutral; functional protective hardware supports steel but concealed finish is not photographically observed. |
| d_0_1_1_72 — ml01 Riegelstift fest | 4/4 | Match | Nine-face locking pin is neutral and repeated in case; preserve individual orientation/contact context without assigning blue screw material. |
| d_0_1_1_73 — ml01 Tubus | 1/1 | Match | Eleven-face case tube is neutral; retain smooth steel-like body with bore and sealing contact regions unmeasured. |
| d_0_1_1_75 — Korrektor Hülse | 1/1 | Match | Thirteen-face corrector sleeve is neutral; its separate foot/head/seal cannot justify whole-assembly recoloring. |
| d_0_1_1_76 — Korrektor Kopf | 1/1 | Match | Twenty-face corrector head is neutral; exterior steel plausibility comes from exact assembly context, not source alloy metadata. |
| d_0_1_1_77 — Korrektor Fu | 1/1 | Match | Eleven-face corrector foot is neutral; concealed pushing/contact end is not a red or blue decorative face. |
| d_0_1_1_78 — Dring Korrektor ID0,8 f0,3 | 1/1 | Match | Single-face corrector O-ring is near-black; retain dark seal dielectric distinct from its three neutral metal neighbors. |
| d_0_1_1_80 — Lederband 18mm M mittelbraun Lochseite | 2/2 | Intentional override | Brown hole-side strap is named brown butsource black; runtime brown follows variant name as an intentional display-color override. |
| d_0_1_1_81 — Lederband 18mm M dunkelblau Lochseite | 2/2 | Unresolved conflict | Single solid has 128 black faces and pale planar faces85/86, underside normal[0,.0087265,-.999962], areas8.8357/17.9428mm2. Runtime blue follows name but flattens these underside marking/patch candidates; body-wide recoloring would be wrong. |
| d_0_1_1_82 — Lederband 18mm M schwarz Lochseite | 2/2 | Match | Black hole-side strap has82faces andblack source; dark rough dielectric agrees in hue but holes and bend texture are not calibrated. |
| d_0_1_1_85 — ml01 Federhaustrommel II z80 m0,15 | 1/1 | Unresolved conflict | Barrel II drum hasfour warm face-color groups including797tooth-region faces; retain user handed snailing and explicitly record flattened warm subgroup distinctions. |
| d_0_1_1_86 — ml01 Federhausdeckel II | 1/1 | Unresolved conflict | Barrel II lid has11orange and1gold face; accepted left snailing follows its source orientation, small gold face intent remains documented. |
| d_0_1_1_87 — ml01 Federkern1 | 2/2 | Unresolved conflict | Barrel core has40neutral and1green face; steel shaft family agrees mechanical identity while green functional face is not a literal green coating claim. |
| d_0_1_1_88 — ml01 Zugfeder_h1,6_s0,145_l290 | 2/2 | Match | Eighteen-face mainspring is CAD neutral; polished steel plausibility is distinct from the separate blue hairspring, hidden coil finish unobserved. |
| d_0_1_1_90 — ml01 Federhaustrommel I z80 m0,15 | 1/1 | Unresolved conflict | Barrel I drum hasfour warm face-color groups; its opposite source parity needs retained negative snailing curvature to match barrel II in world view. |
| d_0_1_1_91 — ml01 Federhausdeckel | 1/1 | Unresolved conflict | Barrel I lid has11orange and1gold face; retain corrected snailing parity independently from the d86 lid. |
| d_0_1_1_93 — ml01 Minutentrieb z12 m0,15 | 1/1 | Match | 120-face minute pinion is neutral andseparate from d94wheel; retain steel on teeth/staff rather than warm wheel material. |
| d_0_1_1_94 — ml01 Minutenrad z64 m0,13 | 1/1 | Match | 405-face minute wheel is warm CAD; circular satin fits photographed wheel family, spoke-aligned grain remains approximate. |
| d_0_1_1_95 — ml01 Sekundenwellenlager | 1/1 | Match | Eight-face seconds-shaft bearing is neutral; keep smooth steel interpretation and distinguish actual bearing geometry from ruby jewels. |
| d_0_1_1_96 — ml01 ۆHMinRad z26 m0,15 | 1/1 | Unresolved conflict | Intermediate minute wheel haswarm groups plusone green face; warm satin remains plausible, green face is an unresolved functional display partition. |
| d_0_1_1_97 — ml01 Kupplungsrad z17 m0,15 | 1/1 | Match | 120-face coupling wheel is neutral; user circular-steel satin correction stays, separate from the sliding coupling pinion d144. |
| d_0_1_1_99 — ml01 Räderbrücke | 1/1 | Match | Train bridge has83gray,2black,166purplefaces; retain blue-black inset/text, exactface54 satin cap seat, frosted exposed bases and polished chamfers. |
| d_0_1_1_100 — ml01 Chaton RBR 149x210x60 | 2/2 | Intentional override | Eight-face train chaton haswarm CAD; userrose-gold metal correction outranks old yellow-gold interpretation and leaves separate stone untouched. |
| d_0_1_1_101 — 030-MG_30x160x30 | 2/2 | Match | Ten-face train jewel hasred-purple alpha.60 source; dielectric ruby family agrees, preserve user less-crimson hue and unmeasured optical depth. |
| d_0_1_1_102 — 030-BO_10x100x25 | 2/2 | Match | Nine-face small bearing jewel hasred-purple alpha.60; metal pivot is a different definition andmust not be colored ruby. |
| d_0_1_1_103 — 020-50x165 | 7/7 | Match | Three-face locating pin hasneutral CAD; steel pin family agrees andround end highlight differs from adjacent blue screw. |
| d_0_1_1_105 — ml01 DPL RBR | 1/1 | Intentional override | Capplate has33orange and1brownface; warm top and local+Y grain from screw-pair to jewel are user-supported, underside/chamfer stayregion-specific. |
| d_0_1_1_106 — 030-CB_100x25 | 2/2 | Match | Five-face cap jewel hasred-purple alpha.60; maintain transparent ruby response separate from warm d105capplate and blue screws. |
| d_0_1_1_107 — 010-linsenk s50x55 k80x25 | 4/4 | Intentional override | Ten-face small countersunk screw hasno direct colors in ledger; inherited evidence/user whole-blue correction supportsblue, missing metadata alone never provessteel. |
| d_0_1_1_110 — ml01 Unruhreif | 1/1 | Unresolved conflict | Balance rim has34brown and121warm-orangefaces; retain usermatched warm rim/eccentric hue and flag source subgroup finish as unmeasured. |
| d_0_1_1_111 — ml01 Unruhexcenter | 4/4 | Technical limitation | Timing eccentric iswarm CAD anduser-matched to rim; four copies inherit invalid BRep/missing-face limitation, no material change can restoremissingfaces. |
| d_0_1_1_112 — Ellipse 35 | 1/1 | Match | Four-face impulse ellipse isred-purple transparent CAD; ruby identity matches and remains separate from steel staff/double roller. |
| d_0_1_1_113 — ml01 Unruhwelle | 1/1 | Match | 22-face balance staff isneutral CAD; retain steel polished journals separate from warm rim andruby impulse stone. |
| d_0_1_1_114 — ml01 Doppelrolle | 1/1 | Unresolved conflict | Sixteen-face doubleroller isneutral CAD butruntime brass; no decisive exposed exact-part material evidence resolves the existing conflict. |
| d_0_1_1_115 — ml01 Spiralrolle | 1/1 | Match | Seventeen-face hairspring collet iswarm CAD; brass-like smooth metal agrees as separate part from blue hairspring assembly d116. |
| d_0_1_1_116 — ml01 Spirale mit Rolle | 1/1 | Match | Both explicitly colored solids are blue RGBA [.0219809469,0,.4910208881,1], covering faces1-72 and73-75. Blue hairspring family matches source and SJX photos. The tiny second solid does not supply a warm-collet color; separate d115 retains its own warm identity. |
| d_0_1_1_117 — ml01 Klötzchen | 2/2 | Intentional override | Eight-face stud occurs twice withneutral CAD; user explicitlysteel settles former warm inference, preserve bothstud occurrences. |
| d_0_1_1_118 — 020-30x80 kon ms | 1/1 | Match | Three-face taper pin namedms hasgold CAD; warm brass-like metal supported byname andsource, exactalloy unmeasured. |
| d_0_1_1_120 — ml01 DPL WPL | 1/1 | Intentional override | Opposite capplate has17brown and1orangeface; retain its own grain direction rather than copying d105 screw-axis rule. |
| d_0_1_1_121 — Flitter 200x400 | 1/1 | Intentional override | Four-face thinwasher iswarm CAD; usergoldish circular satin correction resolves formersteel/warm uncertainty. |
| d_0_1_1_122 — 010-zylsenk s80x120 k125x40 | 4/4 | Intentional override | Thirteen-face countersunk screw hasnodirect color; top-origin mask history means retain explicitwhole-blue treatment andreview exactinstance exceptions. |
| d_0_1_1_123 — 010-linzyl s50x75 k95x25 | 4/4 | Intentional override | Ten-face smallscrew hasnodirect color; shock suffix9 isexplicit whole-steel while otherdefaultblue occurrences remain independent. |
| d_0_1_1_124 — 020-50x100 | 5/5 | Match | Three-face 50x100pin isneutral CAD; retainsteel pin independently of similarlysized bluefasteners. |
| d_0_1_1_126 — ml01 Ankerkörper Niv20.5 | 1/1 | Match | 100-face palletbody isneutral CAD; retainsteel mechanical lever and keepseparate ruby pallets outof bodymaterial. |
| d_0_1_1_127 — ml01 Ankerwelle | 1/1 | Match | Fifteen-face palletstaff isneutral; smoothsteel journals are mechanicallyplausible without visible manufacturing-processproof. |
| d_0_1_1_128 — 030-27x100x57°x30 | 2/2 | Match | Ten-face palletjewel hasred-purple alpha.60; preserve ruby opticalfamily anddistinct functional contactfaces rather than warmmetal. |
| d_0_1_1_129 — ml01 Ankerhörnchen | 1/1 | Match | Seventeen-face palletfork horn isneutral; retainsteel and distinguishfrom warm-source safetyblade d130. |
| d_0_1_1_130 — ml01 Messer Niv20.5 | 1/1 | Unresolved conflict | Eleven-face safetyblade iswarm CAD butsteel runtime; unresolved identity conflict, functionalone doesnot justify discarding warm source. |
| d_0_1_1_131 — ml01 Sperrrad z62 m0,20 | 2/2 | Unresolved conflict | Ratchet wheel has333neutral and1gray-lilacface; steel circularsatin agrees broadly, coloredface couldencode process andmust berecorded. |
| d_0_1_1_133 — ml01 Ankerbrücke | 1/1 | Match | 53-face palletbridge hasneutral definitioncolor; separate top/base/chamfer masks requiregeometric evidence, absent facecolors do notprove uniformpolish. |
| d_0_1_1_134 — 030-GO_10x100x22 | 2/2 | Match | Nine-face palletbridge jewel isred-purple alpha.60; opticalfamily supported, retainless-crimson correction andseparate steelpin. |
| d_0_1_1_135 — 020-40x80 | 2/2 | Match | Three-face 40x80pin isneutral; small locatinghardware remainssteel without bluing. |
| d_0_1_1_136 — 010-zyl s80x220 k160x50 | 5/5 | Intentional override | Fourteen-face long80x220screw hasmissing directcolors; retain whole-blue user rule exceptverified rear mounting overrides. |
| d_0_1_1_137 — ml01 Viertelrohr1 z12 m0,177 | 1/1 | Match | 83-face cannonpinion1 isneutral CAD andexplicitusersteel; retain steel teeth,tube,bore independentfrom associatedwarmwheel. |
| d_0_1_1_138 — 010-zyl s80x190 k160x50 | 2/2 | Intentional override | Fourteen-face 80x190screw hasnodirectcolors; exact mountedinstances determine retainedblue/steel, not generic screw-name defaultalone. |
| d_0_1_1_139 — 010-zyl s70x110 k180x30 | 1/1 | Unresolved conflict | Fourteen-face 70x110screw has13gray and1greenface; userwholeblue treatment intentionallyoverrides source split forblue placements. |
| d_0_1_1_141 — ml01 Stundenrad1 z40 m0,17 | 1/1 | Match | 223-face hourwheel1 iswarm CAD; wheelplate remainswarm satin while separatehub142 andcannon137 staysteel. |
| d_0_1_1_142 — ml01 Butzen Stundenrad1 | 1/1 | Match | Thirteen-face hourwheel1hub isneutral CAD; explicitusersteel protects hub fromwarmwheel conflation. |
| d_0_1_1_143 — ml01 Aufzugwelle | 1/1 | Unresolved conflict | Windingstem has27gray and1greenface; smoothsteel shaft agreesfunction, green terminalface intent remainsunresolved displayannotation. |
| d_0_1_1_144 — ml01 Kupplungstrieb | 1/1 | Match | 170-face slidingcoupling pinion isneutral; steelteeth/flanks remainseparate fromwarmtrainwheels andcircular-steel couplingwheel97. |
| d_0_1_1_147 — ml01 si Grundplatte | 1/1 | Unresolved conflict | Shockbase has63gray and3greenfaces; steelstructural family plausible with exactexposed-base frosting, greenfacepurpose remainsrecorded. |
| d_0_1_1_148 — 020-50x220 | 2/2 | Match | Three-face 50x220shockpin isneutral; retainsteel anditsown seating/axis review incompoundmechanism. |
| d_0_1_1_149 — 020-50x200 | 3/3 | Match | Three-face 50x200shockpin isneutral; distinctlength andmatingposition mustkeep independent occurrence review. |
| d_0_1_1_150 — 020-50x130 | 3/3 | Match | Three-face 50x130shockpin isneutral; smoothsteel agrees source withoutclaiming measuredpolish. |
| d_0_1_1_151 — ml01 si GabelY | 1/1 | Match | 46-face Yfork isneutral; forksteel isseparate frombase152 andhiddenmass155, nojustification forblue wholefork. |
| d_0_1_1_152 — ml01 si GabelY UPlatte | 1/1 | Match | Nine-face Yforklowerplate isneutral; bridgeprofile top-fieldfinish isplausible butconcealed underside frosting isnot proven. |
| d_0_1_1_153 — ml01 si GabelX UPlatte | 1/1 | Match | Nine-face Xforklowerplate isneutral; retainitsown bridgeprofile andreview opposite mountedorientation separatelyfrom152. |
| d_0_1_1_154 — ml01 si GabelX | 1/1 | Match | 50-face Xfork isneutral; steel support/contactfork hasno redsource appearanceand isnot theinlayregion. |
| d_0_1_1_155 — si HMzylinder | 1/1 | Match | Five-face cylindricalshockmass isneutral CAD; explicitusersteel outranks pinkexplodedrender andhistoricalrubymapping. |
| d_0_1_1_156 — ml01 si Klobenplatte | 1/1 | Unresolved conflict | Shockgaugeplate has92gray,2green and20red alpha.808faces; keepdarkruby-red gaugeinlayfaces distinctfromsteelplate, opticalcoating nature unresolved. |
| d_0_1_1_157 — 020-50x130 a40x50 | 1/1 | Match | Five-face stepped50x130pin isneutral; separate polishedsteel pinmust notinherit blued159spring field. |
| d_0_1_1_158 — 020-50x165 a40x50 | 1/1 | Match | Five-face stepped50x165pin isneutral; keepsteel andreview longerstepped seating independentlyfrom157. |
| d_0_1_1_159 — ml01 si ZeigerhebelfederblockV3 | 1/1 | Match | Fourpurple topfaces and258grayfaces; userreference requiresblue extension onface262 at retaining-screwend whilecentralspine,underside,sidewalls staysteel. |
| d_0_1_1_160 — ml01 si Resetschieberbutzen | 1/1 | Unresolved conflict | Reset-sliderhub has11gray and1greenface; neutralsteel coreplausible butsinglecoloredface intent remainsunresolved. |
| d_0_1_1_161 — ml01 si Rückstellfeder | 1/1 | Match | 46-face resetspring isneutral CAD; retainsteel,smooth responsive metal withoutborrowing bluehairspring identity. |
| d_0_1_1_162 — 020-50x70 | 3/3 | Match | Three-face 50x70shockpin isneutral; retainsteel onitsactualshortseating geometry anddistinctfrombrass163. |
| d_0_1_1_163 — 020-12x60 kon ms | 6/6 | Match | Three-face tiny taperedpin namedms isgold CAD; retainwarmmetal anddo notrecolorwith neighboringsteel pins. |
| d_0_1_1_164 — ml01 si UScheibe 60_79 | 2/2 | Match | Four-face shockwasher isneutral; retainsteel ratherthan copyinggoldish d121usercorrection toallwashers. |
| d_0_1_1_165 — ml01 si Klobenfu | 1/1 | Match | 21-face shockcockfoot isneutral; exactexposedbase roles supportfrosting onlywhereannotated, undersidefinish remainsunmeasured. |
| d_0_1_1_166 — 010-zyl s60x58 k115x25 | 3/3 | Unresolved conflict | Fourteen-face shortscrew hasgray/greenCAD; bothshock20/21 occurrences areexplicitusersteel, notblue justbecause definitiondefaultisblue. |
| d_0_1_1_167 — ml01 si Anschlagrahmen | 2/2 | Match | 114-face stopframe isneutral; retainsteel structuralframe, distinguishfunctional slots andwalls fromdecorativeblue springtops. |
| d_0_1_1_168 — 010-zyl s60x140 k115x23 | 2/2 | Unresolved conflict | Fourteen-face shocklongscrew hasgray/greenCAD; shock24/27 instancesstaywhole-steel byuserreference. |
| d_0_1_1_169 — 010-zyl s80x220 k125x50 | 1/1 | Intentional override | Fourteen-face centralshockmountingscrew hasnodirectcolors; userreference explicitlyretainsblue central30, despite neighboringsteelfasteners. |
| d_0_1_1_170 — 010-zyl s80x180 k125x50 | 2/2 | Unresolved conflict | Fourteen-face shock80x180screw hasgray/greenCAD; shock32/33 usersteel overrides stayexact-instance scoped. |
| d_0_1_1_172 — ml01 Zeigerstellrad z19 m0,177 | 1/1 | Match | 196-face settingwheel isneutral; usercircularsteel satin correction staysdistinctfromwarmmotionworks wheels. |
| d_0_1_1_173 — 020-120x120 | 1/1 | Match | Four-face 120x120pin isneutral; keepsteel pinbody distinctfrom adjacentcircularsteel wheel finish. |
| d_0_1_1_174 — ml01 Kupplungshebel | 1/1 | Unresolved conflict | 69-face couplinglever has68neutral and1greenface; userstraight-satin broadfaces retained whilegreenfunctionalface purposeunresolved. |
| d_0_1_1_176 — ml01 Stoppfederplatte | 1/1 | Match | 25-face stopspringplate isneutral; userboth-side straightsteel satin appliedtoseparateplate, notspringcolumn177. |
| d_0_1_1_177 — ml01 Stoppfeders㴬e | 1/1 | Match | Eleven-face stopspringcolumn isneutral; retainturned/polished steelcolumn independentlyfromplanarbrushed neighbors. |
| d_0_1_1_178 — ml01 Stoppfeder | 1/1 | Match | 38-face stopspring isneutral; userstraightsteel satin retained onflatfaces, narrow springedge polishisnot separatelymeasured. |
| d_0_1_1_179 — 020-40x120 kon ms | 1/1 | Match | Three-face 40x120taperpin namedms isgold; warmbrasslike identity agrees andisnot bluefastener. |
| d_0_1_1_180 — 010-linzylans s70x90 k90x75 a125x25 ab98x93 | 1/1 | Unresolved conflict | Sixteen-face shoulderedscrew has15neutral and1greenface; outer33 exactsteel treatment independentfrom defaultwholeblue andtop-origin mask. |
| d_0_1_1_181 — 010-linsenk s60x80 k90x25 | 3/3 | Intentional override | Ten-face smallcountersunk screw hasmissingdirectcolors; mixedblue/steel occurrences includingcrown78 requireindividual override review. |
| d_0_1_1_183 — ml01 Viertelrohr2 z8 m0,15 | 1/1 | Match | 45-face cannonpinion2 isneutral CAD andexplicitusersteel; retainsteeltube/teeth independentfromhourwheel187. |
| d_0_1_1_184 — ml01 Welle Viertelrohr2 | 1/1 | Match | Fifteen-face cannon2shaft isneutral; retainsteel journal andshaft independentfromsteelcannon183 andwarmwheel187. |
| d_0_1_1_185 — ml01 Werkhaltelasche | 3/3 | Unresolved conflict | 23-face movementclamp isneutral CAD butmakercomponentrender hasblue-violet satin top/brightbevel; threehidden occurrences remainunresolved, no whole-bodyblue recommendation. |
| d_0_1_1_187 — ml01 Stundenrad2 z32 m0,12 | 1/1 | Match | 215-face hourwheel2 iswarm; retainwarmplate only, separatelymodeled hub188 isauthoritativelysteel. |
| d_0_1_1_188 — ml01 Butzen Stundenrad2 | 1/1 | Match | Thirteen-face hourwheel2hub isneutral andtwiceuserconfirmedsteel; formerwarmuncertainty explicitlysuperseded. |
| d_0_1_1_189 — 010-zyl s80x140 k160x40 | 3/3 | Unresolved conflict | Fourteen-face80x140screw hasgray/greenCAD; threeclampfasteners aresteel exactoverrides, otheruses keepownmountedfinish. |
| d_0_1_1_190 — ml01 Zeigerstellhebel | 1/1 | Match | 28-face settinglever isneutral; userstraightsteel satin broadfaces supported, pivothole/flank finishremainsauthored. |
| d_0_1_1_191 — 010-zyl s80x95 k110x18 | 3/3 | Unresolved conflict | Fourteen-face80x95screw hasgray/greenCAD; exactback-fittedsteelscope wins overdefaultblue, retainingotherinstances. |
| d_0_1_1_192 — 010-zyl s80x120 k220x35 | 2/2 | Unresolved conflict | Sixteen-face80x120screw hasgray/greenCAD; wholeblue semantics applyonlywhere currentexactinstance mapping leavesblue. |
| d_0_1_1_193 — ml01 Winkelhebelfeder | 1/1 | Match | 67-face settingspring isneutral; retainuserstraightsteel satin anddo notconfusewith inactive two-positionvariant244. |
| d_0_1_1_195 — ml01 Grundplatine | 1/1 | Unresolved conflict | Mainplate has385brown,26green,137orangefaces; warmfrosted fieldagreesphoto, preserveinscriptionfloors andrecordunexplainedgreen sourcegroups. |
| d_0_1_1_196 — 030-G_90x200x45 | 3/3 | Match | Nine-face90x200x45jewel isred-purple alpha.60; dielectricrubylike familyagrees anditsownthicknessisnot measuredshaderthickness. |
| d_0_1_1_197 — 030-G_160x240x30 | 2/2 | Match | Nine-face160x240x30jewel isred-purple alpha.60; retainruby ratherthanmetal notwithstandingbroadannular appearance. |
| d_0_1_1_198 — 030-G_90x200x40 | 1/1 | Match | Nine-face90x200x40jewel isred-purple alpha.60; separateactualsourceheight fromsharedauthoredopticaldepth. |
| d_0_1_1_199 — 030-G_30x100x25 | 3/3 | Match | Nine-face30x100x25jewel isred-purple alpha.60; tinybore/pivot regionrequiresmacro,but rubyidentitysupported. |
| d_0_1_1_200 — 020-40x135 ms | 2/2 | Match | Seven-face40x135pin namedms isgold; warmmetal pinisdistinctfromsurroundingruby andsteelsetting surfaces. |
| d_0_1_1_201 — 010-linsenk s70x120 k100x30 | 2/2 | Unresolved conflict | Eleven-face70x120screw has10gray and1greenface; radialdialretainers194:11/12 explicitlywhole-steel, otherblueuses preserved. |
| d_0_1_1_203 — incabloc_sous_937-21_Lochsteinschale | 2/2 | Intentional override | Eighteen-faceIncabloc hole-stoneshell isgrayCAD butuserrose-gold; intentionaloverride protectsmetalsetting separatefromruby204/205. |
| d_0_1_1_204 — incabloc_sous_937-21_BO_9x90x14 | 2/2 | Match | Nine-faceIncabloc piercedstone hasredalpha.808; rubyfamily supported, differentiatehigherdisplayalpha frommeasuredIOR/transmission. |
| d_0_1_1_205 — incabloc_sous_937-21_CPB_0x105x8 | 2/2 | Match | Five-faceIncabloc capstone hasredalpha.808; retaintransparentjewel distinctfromcoloredmetalsetting andlyrespring. |
| d_0_1_1_206 — incabloc_sous_937-21_Lyrafeder | 2/2 | Unresolved conflict | 150-faceIncabloc lyrespring isgrayCAD butwarmgoldruntime; existingconflict remainsunresolved, userrose-goldchaton instructiondoesnotinclude spring. |
| d_0_1_1_207 — incabloc_sous_937-21_Grundschale | 2/2 | Intentional override | 43-faceIncabloc baseshell iswarmCAD anduserrose-gold; retainpolishedsetting separatefromgray-source lyrespring206. |
| d_0_1_1_208 — 030-G_70x130x25 | 2/2 | Match | Nine-face70x130x25jewel isred-purple alpha.60; keepdielectricruby anduserless-crimson huewithout claimingopticalmeasurement. |
| d_0_1_1_210 — ml01 Wechselrad1 z36 m0,177 | 1/1 | Match | 239-facechange-wheel1 iswarm CAD; circularsatinplate agreesfamily butspokeorientation needsauthoredfuturefinishing review. |
| d_0_1_1_211 — ml01 Wechseltrieb1 z10 m0,17 | 1/1 | Match | 97-facechange-pinion1 isneutral; retainsteelpinion separatelyfromwarm210wheel. |
| d_0_1_1_213 — ml01 Wechselrad2 z36 m0,177 | 1/1 | Match | 239-facechange-wheel2 iswarm CAD; retainwarmwheel alongsideindependent neutralshaft214. |
| d_0_1_1_214 — ml01 Zeigerwerkswelle2 | 1/1 | Match | Thirteen-facemotionworksshaft2 isneutral; keepsteel anditsowntop/bore journalcontext. |
| d_0_1_1_216 — ml01 Wechselrad3 z 24 m0,15 | 1/1 | Match | 167-facechange-wheel3 iswarm CAD; circularsatin remainsapproximateacrossspokes, warmplate shouldnot colorsteelpinion217. |
| d_0_1_1_217 — ml01 Wechseltrieb3 z8 m0,12 | 1/1 | Match | 61-facechange-pinion3 isneutral; retainsteeltooth/pivot family separatedfrom216wheel. |
| d_0_1_1_219 — ml01 Zeigerwerksbrücke | 1/1 | Unresolved conflict | 54-face motionworksbridge isneutral withnoexplicitbluefacegroup; currentetched-policy flaghasno role3effect, photographdetail3 doesnotproveablueborder. |
| d_0_1_1_220 — 020-40x140 | 4/4 | Match | Three-face40x140pin isneutral; preserve steelpinidentity separatefromwarmsetting/ruby opticalresponses. |
| d_0_1_1_222 — ml01 Unruhbrücke | 1/1 | Unresolved conflict | Balancebridge hasgray,pale,purple,green facegroups; blue-blackrecessandpolishededge agreeSJX5, green/pale sourcefunctions needexplicitretentionrecord. |
| d_0_1_1_224 — ml01 Diamantchaton | 1/1 | Intentional override | Nine-facediamondchaton iswarm CAD anduserrose-gold; metalsetting remainsseparate fromemptySTEP/recoveredstone225. |
| d_0_1_1_225 — 030-Brilliant_200 | 1/1 | Technical limitation | AssemblyandstandaloneSTEP areaxis-only; maker1640triangleSTL recoveryisintentional,separate andsimplifiedeightfoldcut;photographicbrilliance cannotbeclaimed. |
| d_0_1_1_226 — 010-linzyl s40x70 k80x20 | 1/1 | Intentional override | Ten-face studclampscrew has9gray and1greenface; horizontal59/221:7 isexplicitusersteel, nearbybluebridge screws unaffected. |
| d_0_1_1_228 — ml01 Federhausbrücke | 1/1 | Unresolved conflict | Barrelbridge hasgray,green,pale,purplegroups; retainblue inset,precisebasefrostandmodeledbevel, no blanketundersidefrost. |
| d_0_1_1_230 — ml01 Minutenbrücke | 1/1 | Intentional override | Purple faces37-66 are28cones andplane floors51/66 atZ-.1 (each .1238633mm2), below gray primary top1/2/18 atZ0. They are modeled recessed decorative borders; runtime omits their blue regional role while an explicit test protects omission. Source distinction loss is definite, physical blue-process/variant recommendation unresolved. Current omission is an intentional approved finishing-fidelity policy protected by its regression; source/variant disagreement remains explicit. |
| d_0_1_1_231 — 030-G_70x160x30 | 1/1 | Match | Nine-face70x160x30jewel isred-purple alpha.60; retainrubyoptics andactualmetalpivot separation. |
| d_0_1_1_233 — ml01 Gangrad Niv20.5 | 1/1 | Unresolved conflict | 287-faceescapewheel Niv20.5 isgrayCAD butwarmbrassruntime; exactphysicalidentity unresolved andmustnotbe inferredfromotherwarmwheels. |
| d_0_1_1_234 — ml01 Gangtrieb z9 m0,102 | 1/1 | Match | 63-faceescapepinion isneutral; retainsteel distinctfromuncertainescape wheel233. |
| d_0_1_1_235 — ml01 Butzen Gangrad | 1/1 | Match | Ten-faceescapehub ispalegreen-neutral CAD; explicitusersteel rulesout warmhubor rubyinterpretation. |
| d_0_1_1_237 — ml01 Kleinbodentrieb z10 m0,13 | 1/1 | Match | 71-facefourth-wheelpinion isneutral; retainsteel separatelyfromwarm238wheelplate. |
| d_0_1_1_238 — ml01 Kleinbodenrad z75 m0,1159 | 1/1 | Match | 460-facefourthwheel iswarm CAD; warmcircularsatin plausible, toothflanks/spokeradial grains areauthored ratherthanmeasured. |
| d_0_1_1_240 — ml01 Aufzugsbrücke | 1/1 | Unresolved conflict | Windingbridge has88neutral and4greenfaces; preserveuserlocalcos8/-sin8grainaxis cancellingassemblytilt plusseparatebase/bevelroles. |
| d_0_1_1_242 — ml01 Sekundentrieb z8 m0,1159 | 1/1 | Match | 78-facesecondspinion isneutral; retainsteel separatelyfromwarm243secondswheel. |
| d_0_1_1_243 — ml01 Sekundenrad z81 m0,102 | 1/1 | Match | 490-facesecondswheel iswarm CAD; retainwarmplate withcircularsatin andflaguniformspokegrain approximation. |
| d_0_1_1_244 — ml01 Winkelhebelfeder 2 Positionen | 1/1 | Match | 62-facetwo-positionsettingspring isneutral; userbothvariantssatin correctionapplies althoughinactivevariant hiddenbydefault. |
| d_0_1_1_246 — ml01 Zeigerstellungsfeder | 1/1 | Match | 58-facehand-settingspring isneutral; retainuserstraightsteel satin onbothflats, no sourcebluefinish supportswholeblue. |
| d_0_1_1_248 — ml01 Winkelhebel | 1/1 | Unresolved conflict | 30-facesettinglever has29neutral and1greenface; retainusersteel satinwhile singlecoloredfunctionalface remainsunresolvedsourceintent. |
| d_0_1_1_249 — ml01 Kronrad z45 m0,15 | 1/1 | Unresolved conflict | Crownwheel has775neutral and1gray-lilacface; currentmirrorsteel reflectsblackpolish prose butSJX2 photograph showscirculargraintop, conflictwith earlieruserbrushing mustremainopen. |
| d_0_1_1_251 — ml01 Kronradplatte | 1/1 | Match | Crowncap has23neutral andonepurpleface22cone; retainsteelcenter,exactblueconeonly andreflectivecap; no all-blueannulus inference. |
| d_0_1_1_252 — ml01 Sperrfeder | 1/1 | Match | 36-faceclickspring isneutral; retainsteel polishedspring distinctfromblue screwfamilies andwarmbarrels. |
| d_0_1_1_253 — 010-zylsenk s60x150 k115x23 | 2/2 | Unresolved conflict | Fifteen-facecrownscrew has14gray and1greenface; crown77/82 exactsteelscope mustnot beoverriddenbydefaultblue. |
| d_0_1_1_254 — ml01 Sperrklinke | 1/1 | Match | 48-faceclick isneutral; steelreflectivelever agreesphotocrowncontext; finishwithincontacttooth remainsunmeasured. |
| d_0_1_1_255 — 010-zylans s80x90 k160x45 a96x50 | 1/1 | Unresolved conflict | Sixteen-faceclickscrew has15neutral and1greenface; crown81 exactsteeloverride supportedbyphoto andretainedindependently. |
| d_0_1_1_256 — Regulierunterlage | 1/1 | Unresolved conflict | Ten-faceregulation supportisorangeCAD source-tooling; neutralsteelruntime unsupportedphysicalidentity,retainpendingcomposition/useevidence andkeepoutside movement. |

### Coverage by actual source parent

| Actual parent name and ID | Leaf rows | Reviewed |
|---|---:|---:|
| Gruppe Zifferblatt dezentrisch 18 — p_0_1_1_1__0_1_1_1_1 | 24 | 24 |
| Min_Zeiger 8,0 Lanze verpresst — p_0_1_1_1__0_1_1_1_1__0_1_1_2_5 | 2 | 2 |
| St_Zeiger 5,0 Lanze verpresst — p_0_1_1_1__0_1_1_1_1__0_1_1_2_16 | 2 | 2 |
| Min_Zeiger 8,0 Lanze verpresst gold massiver — p_0_1_1_1__0_1_1_1_1__0_1_1_2_20 | 2 | 2 |
| St_Zeiger 5,0 Lanze verpresst gold massiver — p_0_1_1_1__0_1_1_1_1__0_1_1_2_26 | 2 | 2 |
| ml01 Zifferblatt Front DM33,4 montiert — p_0_1_1_1__0_1_1_1_2 | 22 | 22 |
| St_Zeiger 9,0 Lanze offen verpresst — p_0_1_1_1__0_1_1_1_2__0_1_1_22_22 | 2 | 2 |
| Min_Zeiger 14,7 Lanze offen verpresst — p_0_1_1_1__0_1_1_1_2__0_1_1_22_24 | 2 | 2 |
| Sek_Zeiger 15,6 Lanze offen verpresst — p_0_1_1_1__0_1_1_1_2__0_1_1_22_25 | 2 | 2 |
| ml01 Gehäuse SS montiert — p_0_1_1_1__0_1_1_1_3 | 2 | 2 |
| ml01 Krone SS montiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_2 | 4 | 4 |
| Band Schliessenseite M alle Farben — p_0_1_1_1__0_1_1_1_3__0_1_1_43_4 | 3 | 3 |
| ml01 Hörnchenbügel SS montiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_4__0_1_1_49_2 | 9 | 9 |
| ml01 Schliesse SS vormontiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_4__0_1_1_49_3 | 5 | 5 |
| Band Schliessenseite M alle Farben — p_0_1_1_1__0_1_1_1_3__0_1_1_43_5 | 3 | 3 |
| ml01 Hörnchenbügel SS montiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_5__0_1_1_49_2 | 9 | 9 |
| ml01 Schliesse SS vormontiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_5__0_1_1_49_3 | 5 | 5 |
| ml01 Schraubboden SS verpresst — p_0_1_1_1__0_1_1_1_3__0_1_1_43_6 | 3 | 3 |
| ml01 GMT Ring SS montiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_7 | 7 | 7 |
| Korrektor montiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_7__0_1_1_69_8 | 4 | 4 |
| ml01 Schraubboden SS verpresst — p_0_1_1_1__0_1_1_1_3__0_1_1_43_8 | 3 | 3 |
| Band Lochseite M alle Farben — p_0_1_1_1__0_1_1_1_3__0_1_1_43_9 | 3 | 3 |
| ml01 Hörnchenbügel SS montiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_9__0_1_1_79_2 | 9 | 9 |
| Band Lochseite M alle Farben — p_0_1_1_1__0_1_1_1_3__0_1_1_43_10 | 3 | 3 |
| ml01 Hörnchenbügel SS montiert — p_0_1_1_1__0_1_1_1_3__0_1_1_43_10__0_1_1_79_2 | 9 | 9 |
| ml01 Federhaus2 montiert — p_0_1_1_1__0_1_1_1_4__0_1_1_83_1 | 4 | 4 |
| ml01 Federhaus1 montiert — p_0_1_1_1__0_1_1_1_4__0_1_1_83_2 | 4 | 4 |
| ml01 Minutenrad vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_3 | 3 | 3 |
| ml01 Werk montiert einbaufertig — p_0_1_1_1__0_1_1_1_4 | 53 | 53 |
| ml01 Räderbrücke montiert — p_0_1_1_1__0_1_1_1_4__0_1_1_83_6 | 10 | 10 |
| ml01 Deckplättchen BR versteint — p_0_1_1_1__0_1_1_1_4__0_1_1_83_6__0_1_1_98_9 | 2 | 2 |
| ml01 Unruh ohne Spirale — p_0_1_1_1__0_1_1_1_4__0_1_1_83_7__0_1_1_108_1 | 8 | 8 |
| ml01 Unruh montiert vorreguliert — p_0_1_1_1__0_1_1_1_4__0_1_1_83_7 | 4 | 4 |
| ml01 Deckplättchen WPL versteint — p_0_1_1_1__0_1_1_1_4__0_1_1_83_8 | 2 | 2 |
| ml01 Anker montiert — p_0_1_1_1__0_1_1_1_4__0_1_1_83_13 | 6 | 6 |
| ml01 Ankerbrücke verstiftet versteint — p_0_1_1_1__0_1_1_1_4__0_1_1_83_16 | 4 | 4 |
| ml01 Stundenrad1 vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_26 | 2 | 2 |
| ml01 si Grundplatte verstiftet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_29__0_1_1_145_1 | 7 | 7 |
| shock indication montiert — p_0_1_1_1__0_1_1_1_4__0_1_1_83_29 | 32 | 32 |
| ml01 ZSTRad verpresst — p_0_1_1_1__0_1_1_1_4__0_1_1_83_30 | 2 | 2 |
| ml01 Stoppfeder vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_32 | 5 | 5 |
| ml01 Viertelrohr2 vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_37 | 2 | 2 |
| ml01 Stundenrad2 vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_40 | 2 | 2 |
| ml01 Werkplatte verstiftet versteint — p_0_1_1_1__0_1_1_1_4__0_1_1_83_54 | 13 | 13 |
| incabloc_sous_937-21 — p_0_1_1_1__0_1_1_1_4__0_1_1_83_54__0_1_1_194_13 | 5 | 5 |
| ml01 Wechselrad1 vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_55 | 2 | 2 |
| ml01 Wechselrad2 vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_56 | 2 | 2 |
| ml01 Wechselrad3 vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_57 | 2 | 2 |
| ml01 ZW2 Brücke verstiftet versteint — p_0_1_1_1__0_1_1_1_4__0_1_1_83_58 | 4 | 4 |
| ml01 Unruhbrücke verstiftet versteint — p_0_1_1_1__0_1_1_1_4__0_1_1_83_59 | 7 | 7 |
| incabloc_sous_937-21 — p_0_1_1_1__0_1_1_1_4__0_1_1_83_59__0_1_1_221_2 | 5 | 5 |
| ml01 Diamantchaton verpresst — p_0_1_1_1__0_1_1_1_4__0_1_1_83_59__0_1_1_221_3 | 2 | 2 |
| ml01 Federhausbrücke verstiftet versteint — p_0_1_1_1__0_1_1_1_4__0_1_1_83_60 | 7 | 7 |
| ml01 Min_Brücke versteint verstiftet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_61 | 4 | 4 |
| ml01 Gangrad Niv20.5 vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_62 | 3 | 3 |
| ml01 Kleinbodenrad vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_63 | 2 | 2 |
| ml01 Aufzugsbrücke vestiftet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_64 | 3 | 3 |
| ml01 Sekundenrad vernietet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_65 | 2 | 2 |
| ml01 Zeigerstellungsfeder verstiftet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_69 | 3 | 3 |
| ml01 Winkelhebel vestiftet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_70 | 2 | 2 |
| ml01 Kronradplatte verstiftet — p_0_1_1_1__0_1_1_1_4__0_1_1_83_75 | 3 | 3 |
| ml01 zweigesicht — p_0_1_1_1 | 1 | 1 |
