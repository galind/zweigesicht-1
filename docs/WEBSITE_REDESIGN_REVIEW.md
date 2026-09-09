# Immersive website redesign — local review

9 September 2026. Implements [WEBSITE_REDESIGN_PROMPT.md](../WEBSITE_REDESIGN_PROMPT.md). The local experience is ready for user visual review. No push, deployment, Site registration/save/upload, new CAD redistribution, or contact with others occurred.

Preview: **http://127.0.0.1:4173/**. Restart from `explorer/` with `npm run dev -- --host 127.0.0.1 --port 4173`. The [local evidence gallery](../artifacts/browser/redesign/index.html) contains before/after captures, all six sections, spread views, narrow layouts, fallback, and measured results. Generated evidence remains ignored by Git.

## Experience

The opening is one viewport with restrained attribution, a neutral charcoal environment, the complete assembled movement, a discreet side switch, and a compact Explore / Separate / All parts / Reset deck. Portrait controls occupy two comfortable rows. There is no permanent sidebar or introductory information panel. The accepted Finish treatment is the default, with no automatic orbit.

Explore opens a chooser and closes on selection. A focused mechanism receives a composed camera destination, a small title, verified facts, optional Details, and Whole movement. The continuous slider becomes Separate section; optional Uncover section remains in Details. Component inspection preserves surface appearance through the existing outline, gives a readable source-backed identity, and offers isolation and Back. Raw names, source IDs, alternatives and provenance remain in secondary sheets. Options houses Function, rendering quality, keyboard instructions, and alternative camera controls.

Reassemble clears reveal and separation transforms. Reset restores the complete default assembly, camera, side, selection and presentation. Back preserves preceding presentation and camera context, including stage size changes caused by focused content. Manual camera input takes ownership immediately. Spread mode substitutes Fit all parts / Look closer for the separation slider and uses drag-to-pan with zoom.

## All parts membership and layout

The source movement root is `p_0_1_1_1__0_1_1_1_4`. Membership uses physical leaf records under that root, without triangle-count or size filtering. The empty STEP diamond occurrence is included using the already accepted recovered maker STL.

| Population | Count | Treatment |
|---|---:|---|
| Source movement leaf instances | 223 | Starting inventory, including recovered diamond and alternative spring |
| Incompatible setting-spring alternative | 1 | Direct child 66; remains available in catalog |
| Case-mounting clamps and their screws | 6 | Direct children 38, 39, 41, 43, 44, 45; excluded from spread, retained in accepted assembly/catalog |
| **Active spread** | **216** | Every eligible leaf exactly once, at unchanged relative scale |
| Movement subassembly containers | 36 | Identity/navigation records, never additional physical pieces |
| External catalog leaves | 142 | Case, strap, display alternatives and source support; available on demand |

Direct-child suffixes above extend `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`. The accepted assembled view has 222 visible movement leaves: it retains the six mounting fittings and excludes alternative 66. [Structured membership evidence](../artifacts/browser/redesign/membership.json) lists every eligible and excluded movement leaf with its original name and ID.

Grouping reuses the established mechanism assignments. A leaf shared by two section definitions is assigned to the first matching group for the spread, without duplicating it. Counts: balance/escapement 21, barrels 8, train 8, display 13, winding 22, shock 39, plates/bridges 46, small fittings 59. Hardware within an established mechanism stays with that mechanism; otherwise hardware receives its own block.

The deterministic layout in `src/experience/spread.ts` sorts stable source IDs, evaluates actual geometry bounds through immutable source matrices, and applies rigid inspection orientations. Long shafts and thin parts are laid across the inspection plane with a small common oblique tilt. Whole transformed bounding boxes are shelf-packed with extent margins and fixed spacing, then arranged in eight groups across a three-column layout. Positions stay the same across viewports; Fit all parts gives an overview and Look closer frames a named group for phone inspection. Small hardware is intentionally grouped and requires zoom, rather than enlarged beyond its real scale.

Presentation is `T(center + offset) × R × T(−center) × assembled`. Original geometry, scale and assembly matrices are never rewritten. Spread owns its transforms exclusively; conflicting reveal/separation/group patches are normalized away. Smooth travel is a visual presentation, **not a validated disassembly procedure**. Reduced motion applies settled destinations directly. Exit uses the exact source-matrix path, avoiding cumulative drift.

## Specification and identity sources

The independent specification worker rechecked the [maker's current ml-01 specifications](https://www.marcolangwatches.com/en/watches/) on 9 September 2026. CAD-derived facts refer to the already recorded [assembly source](https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/), [source manifest](../assets/source-manifest/sources.json), [mechanism evidence](SOURCE_AND_MECHANISMS.md), and [geometric investigation](MECHANICAL_REVIEW.md). Copy is centralized in `src/experience/copy.ts`.

| Focus | Displayed facts | Source and scope |
|---|---|---|
| Balance & escapement | 3 Hz; Breguet hairspring; eccentric regulation | Maker's caliber ml-01 specifications |
| Twin barrels | Two barrels in series; 70 h movement power reserve | Maker; reserve belongs to the complete movement, not each barrel |
| Wheels & pinions | Center 64 teeth; third 75; seconds 81 | Existing independent source-CAD geometric counts, definitions 94/238/243; `assets/authored/motion-evidence.json` and MECHANICAL_REVIEW; attributed as CAD measurements |
| Time display | Face I hours/minutes/central seconds; Face II hours/minutes | Maker's finished-watch functions; does not assert that all catalog hand alternatives belong together |
| Winding & setting | Movement function: seconds stop; stem and sliding coupling | Seconds stop from maker; component identities from source names Aufzugwelle / Kupplungstrieb, movement children 27/28 |
| Shock indicator | Four directions X/Y; resettable; optional | Maker specification; source subtree 29 contains this mechanism |

Component names derive from explicit definitions or translated source names. Roles for balance, hairspring, staff, roller, pallet, escape/third/seconds/center wheel and diamond follow existing source-backed mechanism and appearance records. Ambiguous entries remain “Source component” or “Source assembly”, with their original identity in Details. No historical animation parameters, unverified contact behavior, shock threshold, detent count or per-barrel reserve is displayed as fact. Existing About limitations remain available.

## Acceptance evidence

| Brief criterion | Recorded result |
|---|---|
| 1. Quieter opening, dominant movement | Actual before/after images at 1280×720, 1600×1000, 390×844, 320×740 and 844×390; lead and independent AI visual review accept the composition for user review |
| 2. Neutral environment, protected appearance | Background changed independently; material, lighting, source geometry, surface annotation and diamond asset files have no redesign diff. Source/asset tests preserve decoded buffers and original matrices |
| 3. Connected inspection and alternatives | Both sides, direct orbit, tap selection, isolation, Back, catalog selection, Reset, keyboard Escape/focus restoration, Options camera buttons and Lightweight rendering exercised in the real in-app browser |
| 4. Separation and six focused views | Continuous scene and section separation, Uncover/reversal and Reassemble checked. Six final section screenshots; additional winding at 390/320 and a landscape section. Exact reassembly matrix error 0 |
| 5. Correct, reversible All parts | 216 eligible leaves, including diamond. Actual rendered projected bounds report zero overlaps/clipping; maximum scale error 4.44×10⁻¹⁶. CPU checks cover five overview aspect ratios, reverse-input determinism and 24 mixed interrupted spread/section/reveal/select/isolate/Back/Reset cycles |
| 6. Input, overflow and focus | Real CUA mouse orbit/slider drag did not select or move the scene behind controls; deliberate tap selected once; spread drag changed camera and target equally without rotation/selection. Handler tests cover out-and-back drags, both pinch release orders, pointer cancellation, and nonprimary buttons. Main document dimensions equal all final tested viewports. Options Escape closes and restores Options focus; catalog selection closes both sheets; contextual Back returns focus to canvas |
| 7. Existing and extended checks | 35 actual-source/asset CPU regressions, four state tests, 10 browser checks, original source SHA checks, both exported GLB placement/accessor checks, TypeScript, authored lint and production build pass. Real context recovery and optional catalog failure/retry pass |
| 8. Responsive motion and stable resources | Equivalent 60-second before/after browser benchmarks below. After selection warm-up, repeated switches remain 140 geometries / 8 textures before and after; static assembly adds zero idle renders |
| 9. Attributed claims and limits | Specification table above; no mechanical certification, human visitor study, physical-touch or phone GPU/thermal claim |

Before captures use the accepted original website; the larger desktop and landscape baseline were reproduced from local Git checkpoint `98917a0` with the same local assets. All browser viewport sizes match their after counterparts. The original landscape page overflows (document width 829, height 640 at an 844×390 browser viewport); its screenshot capture is 829×383 because of the original scrollbar/capture behavior. The redesign raster and document are 844×390. Images retain their native capture bytes; no padding or resampling disguises this baseline limitation.

The final gallery includes 200% text at 320×740 and disabled-3D fallback with metadata exploration and retry available. Optional sheets scroll internally. Safe-area CSS is implemented; physical notched-device review remains outstanding.

### Performance conditions

Both benchmark runs use the same host's real in-app Chromium 152 on macOS, browser viewport 1280×720, DPR 1, Finish/contact shading, locally served cached assets, and the same three 20-second orbit phases. Each records 4,498 frame intervals over approximately 60 seconds. The new layout gives the canvas a different shape: 1020×554 before, 1232×530 after. These are renderer-frame interval measurements, not cold-network, physical-phone, battery or thermal qualification.

| Phase | Before mean / p95 ms | After mean / p95 ms |
|---|---:|---:|
| Assembled orbit | 13.338 / 13.9 | 13.338 / 13.9 |
| Revealed mechanism orbit | 13.338 / 14.7 | 13.338 / 14.8 |
| Separated orbit | 13.338 / 14.1 | 13.338 / 14.1 |

Maximum frame interval is approximately 15.4 ms in both runs. Initial unselected resource count is 139 geometries / 8 textures; the first selection allocates the reusable outline, producing the 140 / 8 warmed baseline. The 24-cycle test proves stability after that allocation. Graphics restoration reloads GPU resources lazily; the recovery check verifies the live scene, clear error/status, 216 spread leaves, the recovered diamond and all 58 surface definitions, then Reset verifies 222 visible leaves with matrix error 0. Catalog retry preserves the spread and clears its error.

### Review ownership and resolved findings

One lead owned all application/viewer integration and edits. Three independent read-only workers supplied source/copy verification, actual-asset transform and interaction review, and visual/accessibility regression review. Their findings led to fixes for selection during spread travel (frame settled target bounds), duplicate Back history when leaving spread for a catalog item, Options remaining open after catalog selection, and Reassemble retaining reveal transforms. Visual review additionally prompted complete winding-member framing, portrait stem margins, correct slider hit-target CSS, and corrected large-desktop baseline capture dimensions. Final independent review found no remaining composition blocker; its pending resource evidence is now recorded as passing.

## Reproduction and remaining review

From repository root:

```sh
node --test tests/experience.test.mjs
node scripts/cad/review-runtime.mjs
.venv-cad/bin/python scripts/preflight/verify_sources.py
.venv-cad/bin/python scripts/cad/validate_assets.py
```

From `explorer/`:

```sh
npx tsc --noEmit
npx oxlint app/page.tsx src/experience src/viewer
npm run build
```

Use `?inspect=1` for the live interaction suite, 60-second benchmark, catalog failure/retry and context recovery. Use `?no3d=1` for static fallback and `?text=200` for text enlargement. Production build succeeds with the existing large Three.js chunk warning and Vinext's static route-classification notice.

The local redesign acceptance work is complete. Next is user visual review at the preview/gallery. Real touch hardware, screen-reader software, physical device safe areas and sustained phone performance still require device review; pointer-handler emulation does not substitute for them. Source CAD defects, authored optical approximations and mechanical review limits remain those of the accepted static model. The fixed spread overview deliberately relies on pan/zoom or Look closer for small components. No release or publication approval is inferred from this local result. `FINISHING_GOAL.md` remains untouched.
