# Photo-led finishing corrections — 10 September 2026

Implemented locally after the completed audit checkpoint `23889a5`, following the user's subsequent explicit corrections. This supersedes the earlier steel instruction for d155, black-polished instruction for d249, top-only blue extent for d159 and omitted outline for d230. Other audit proposals remain pending; this is not blanket approval of that plan.

| Part | Applied scope | Evidence and appearance |
|---|---|---|
| Indicator mass cylinder d155 | Shared ruby profile: magenta-ruby dielectric, metalness 0, transmission .72, IOR 1.76 | User explicitly corrected steel to jewel. Browser front/oblique and assembled views show colored depth and bright surface reflections. Optical values are authored approximations, not measurements. |
| Crown wheel d249 | Shared circular satin steel profile, pattern 2, roughness .29 | User explicitly requests brushing. Browser macro shows concentric grain and directional reflection; cap d251 remains separate. |
| Train bridge d99 | New enamel role 11 on exactly 116 logo/number faces: 129–247 excluding steel counters 219/223/227 | The source has real lettering. These faces previously retained metallic response despite dark color. Enamel now has full dark blue color, metalness 0, final roughness .085 and no procedural grain relief. Existing border faces 59–108 retain their previous treatment. |
| Center-wheel bridge d230 | Enamel role 11 on exactly 30 recessed outline faces 37–66, including floors 51/66 | Source has two decorative outlines and **no modeled lettering**. Browser shows both outlines; no logo or number was fabricated. Other chamfers remain steel. |
| Indicator hand-lever spring block d159 | Four original blue arm footprints projected through thickness, with .04 mm allowance around their modeled edges; retaining-screw join blue on every side with smooth fade from local Y .65 to 1.05 mm | Interpreted “only right side as of now” as the existing defect: corresponding blue regions wrap tops, undersides and edges. Earlier hard termination at Y 1.56 is superseded. Exact fade dimensions are authored from the photo, not measured. The central steel spine and narrow steel connections remain distinct. |

Reference: `USER-FINISH-2026-09-10-02` in `assets/source-manifest/finish-adjustment-references.json`; original image is retained only in ignored local evidence. Existing red gauge inlays, neutral screws, cannon pinions, wheel hubs, other jewel/rose-gold profiles and all 29 exact steel-instance overrides remain unchanged.

## Verification

- All 65 CPU/source/asset checks pass, including exact per-vertex enamel face membership, blue upper/lower coverage on both branches and retained steel spine. Expected negative fixtures intentionally emit load-error messages.
- Authored lint, TypeScript and production build pass.
- Browser review: spring top, edge and underside; jewel front and oblique; crown-wheel macro; train-bridge logo and serial; center-wheel outlines; assembled shock mechanism. No browser warnings/errors, source-surface error or context loss.
- Both GLBs and the assembly manifest are byte-identical to the pre-change baseline. Original positions, normals, indices and transforms are therefore unchanged.
- Packed annotations change only d99, d159 and d230; every stored annotation normal and every definition byte range is unchanged. New annotation SHA-256: `53080b9766107cf7233e7fba91e82ed86a9562d30cd5f045036d0c56031497f1`.
- Current appearance ledger retains complete 202-definition/365-occurrence inventory. The exhaustive audit JSON remains the historical pre-implementation snapshot and was not presented as a new exhaustive browser audit.

Local evidence: `artifacts/browser/finish-photo-corrections/` contains nine reviewed captures, the user image, runtime report, build log, geometry/annotation verification and browser state/logs. `evidence-index.json` hashes these files. Derived model binaries remain ignored under the existing repository policy; regenerate annotations with `node scripts/assets/prepare-finishes.mjs` using verified local CAD sidecars.

No lighting, UI, geometry, original CAD or placement changes. No push, merge or deployment. Local preview: http://127.0.0.1:4173/?inspect&review=photo-corrections. Next action: user visual comparison of these five corrections.

## Follow-up: all arm faces and later fade

The user clarified that the entire four arms must be blue. The earlier projected top-footprint treatment missed parts of their narrow connections and edges. The d159 shader now evaluates the complete arm region per fragment, outside the source-local wedge `abs(X) < Y/2`, on every face including the shared bottom. Every vertex of 168 explicitly inventoried arm/connection faces is checked for full blue coverage; central spine sidewalls beyond the fade are checked to remain steel. The fade moves 0.4 mm toward the left of the reference view, from .65–1.05 to 1.05–1.45 mm in local Y, retaining the soft width. These values are authored visual adjustments.

All 66 CPU/source checks, lint, TypeScript and build pass. Browser `arms-full-top.jpg`, `arms-full-edge.jpg` and `arms-full-underside.jpg` confirm coverage and shifted fade. Blue metal retains bright reflected highlights. This follow-up changes no geometry, assets, annotations, lighting or UI. The previous screenshots and dimensions above are retained as history.

## Follow-up: satin bridge bottoms and steel double roller

The user rejected frosting on the lower bridge surfaces. The shared role-8 treatment now gives all ten affected definitions (99,133,147,156,165,219,222,228,230,240) smooth satin reflectance at authored roughness .24, with zero frost grain or relief. Polished bevels, brushed upper fields and the main plate's separate frosting remain intact. The user also resolves double roller d114 as steel with no brushing: shared steel profile, pattern 0, roughness .18.

All 67 CPU/source checks, lint, TypeScript and build pass. Browser captures `bridge-satin-base.jpg`, `bridge-satin-underside.jpg`, and `double-roller-steel.jpg` show the updated local appearance; no browser warnings/errors. Geometry, placements, annotation buffers and all other material assignments are unchanged. Earlier frosting and unresolved d114 statements are historical and superseded by this correction. No publication.

## Follow-up: more visible straight brushing

User requested stronger bridge grain and a gentler increase on keyless/other flat brushed parts; gear brushing was explicitly accepted. Shared `brushingDetail` controls in `materials.ts` now set bridges to 2.6 and brushed-steel flats/warm caps to 1.65. A wider 32-cycles/mm strand layer supplements the 90/230/520 layers, preserving derivative filtering while improving visibility at normal framing. Strength scales the straight grain's reflectance, roughness variation and optical relief together. Values are authored, not measured manufacturing parameters.

All 68 CPU/source checks, lint, TypeScript and build pass. Browser captures `bridge-stronger-brush.jpg`, `bridge-brush-oblique.jpg` and `keyless-brush-detail.jpg` show the stronger grain. Circular gear/barrel/dial calculations, smooth bridge bases, enamel, polished bevels and unbrushed double roller remain unchanged. No geometry, lighting, assets, annotation or UI changes; no publication.
