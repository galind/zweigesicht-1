# Zweigesicht — current execution state

## Dial configuration review — verified locally, 9 September 2026

Completed the original-STEP review for `DIAL_AND_HANDS_PLAN.md`: 50 analytic checks pass, with exact blade/bushing bores, depths, marker pins and fixing axes recorded. Reviewed unchanged-geometry contact sheet in `artifacts/dial-cad/source-contact.png`. The authored manifest supports central Fine/Open lance and small Lance/Broad lance/Pear, with 43 external leaves fitted across both faces. Central Lance has a seconds bore displaced 14.301839 mm; duplicate loose blades and ring alternatives with marker/fixing mismatches are excluded from fitting and retained in the catalog.

`docs/DIAL_CAD_FINDINGS.md` records the recovered d27 mesh, inherited small-bushing axial gap and carrier/enamel material-layer overlap. Source geometry, matrices and original hashes remain intact; static fit is not a mechanical certification. Next action: complete integration, exact fitted-blue interpretation, live visual/recovery QA and regressions. Preview is running at **http://127.0.0.1:4173/**. Local milestone only; no push, merge or deployment. `FINISHING_GOAL.md` remains untouched.


## Dial and hand-style implementation plan — 9 September 2026

Prepared `DIAL_AND_HANDS_PLAN.md` at the user's request for a separate goal run. It specifies a compact face/hand selector, independent style preferences, both physical displays fitted together, a preserved bare-movement opening, CAD-backed complete hand sets, shared visibility rules, loading/recovery behavior and verification criteria. Candidate mappings were checked against the current source manifest and viewer state/catalog paths; full fit and visual validation remain work for the executing agent.

This is documentation only: no application or asset changes, new goal/task, push, merge or deployment. The local preview remains the accepted finishing checkpoint. Next action: launch the separate implementation goal using the plan's suggested message. Unrelated `FINISHING_GOAL.md` remains untouched.

## Washer, winding grain, eccentric and chaton corrections — 9 September 2026

Thin washer d121 now has a goldish circular satin finish. Winding bridge d240 grain and reflection frame compensate for its 8-degree source rotation to follow assembly horizontal. All four d111 timing eccentrics match the balance rim d110 color while retaining their prior polished roughness. Jewel chatons/settings d100/203/207/224 now use rose gold. The appearance ledger resolves the prior washer and hole-stone-shell color conflicts and records the user corrections.

**Verification:** 50 source/asset CPU checks, TypeScript, targeted material lint and production build pass. A source-transform regression verifies the winding grain has zero assembly Y/Z component. The ledger confirms 12 material-assignment changes, identical rim/eccentric colors and unchanged geometry/matrices for all 365 occurrences. Live isolated washer, winding bridge, balance/eccentrics and balance setting were reviewed, with no browser errors. Evidence: `artifacts/browser/washer-chatons-grain/`. The broader browser interaction suite and device benchmarks were not rerun for these material changes.

Next action: user review at **http://127.0.0.1:4173/**. Local checkpoint on `codex/watch-polish-finishes`; no push or merge. Unrelated `FINISHING_GOAL.md` remains untouched.

## Hour-wheel hub 2 steel correction — 9 September 2026

Changed d188 (`ml01 Butzen Stundenrad2`, occurrence P40/186:2) to neutral steel per user instruction. The complete appearance ledger resolves its previous warm/steel uncertainty. Compared all 365 ledger occurrences: only this hub changes assignment; source geometry and matrices are unchanged.

**Verification:** 50 source/asset CPU checks, TypeScript and targeted material lint pass. Reviewed the isolated Hour-wheel hub 2 in the live browser with no errors; evidence in `artifacts/browser/hour-wheel-hub-steel/`. No new production build or broader browser interaction suite was run for this material assignment. Next action: user visual review at **http://127.0.0.1:4173/**. Local checkpoint only on `codex/watch-polish-finishes`; no push or merge. Unrelated `FINISHING_GOAL.md` remains untouched.

## Shock-indicator steel screws — 9 September 2026

Matched the user's additional CAD-render reference: seven screws in the shock-indicator assembly now use whole-screw steel through exact-instance overrides (P29/145 suffixes 9, 20, 21, 24, 27, 32, 33). The central mounting screw, suffix30, stays blue as shown. Recorded the reference hash and refreshed the complete appearance ledger.

**Verification:** all 50 source/asset CPU checks, TypeScript, targeted material lint and production build pass. Existing exact-instance checks cover the seven corrections and retained central blue screw. The local shock-indicator before/after view was reviewed with no browser errors. Geometry remains byte-exact in the CPU suite. This small assignment correction did not rerun the broader browser interaction suite or device benchmarks.

Evidence: `artifacts/browser/shock-screw-steel/`. Next action: user review at **http://127.0.0.1:4173/**. Local checkpoint on `codex/watch-polish-finishes`; no push or merge. Unrelated `FINISHING_GOAL.md` remains untouched.

## Matching snailing and steel attachments — 9 September 2026

Both barrel/lid pairs now share the accepted left snailing direction, compensating for their opposite source-local XY orientation in both grain and reflections. Eleven back-fitted screws, the horizontal hairspring-stud screw and both d117 stud/holder occurrences now use neutral steel. Exact screw-instance overrides preserve shared-definition assignments elsewhere. The complete appearance ledger resolves the prior stud-color uncertainty and records all corrected identities.

**Verification:** 50 actual-source/asset CPU checks, four state tests, TypeScript, targeted material lint and production build pass. Twelve live-browser checks pass; both assembled sides and the hairspring attachment close-up were reviewed without shader errors. Original decoded geometry remains byte-exact across 339 objects; all 365 ledger source geometry/matrix records remain unchanged, with exactly 14 material-family corrections. No new physical-device or sustained-performance benchmark is claimed.

Details: [FINISH_ADJUSTMENTS.md](docs/FINISH_ADJUSTMENTS.md). Local evidence: `artifacts/browser/finish-handedness-steel/`. Next action: user review at **http://127.0.0.1:4173/**. This checkpoint on `codex/watch-polish-finishes` is local-only; no push or merge. Unrelated `FINISHING_GOAL.md` remains untouched.

## Snailing, cap plate and dial-screw corrections — 9 September 2026

Implemented the user-confirmed follow-up on `codex/watch-polish-finishes`: curved snailing on all four barrel/drum definitions, explicitly brushed crown wheel d249, cap plate d105 grain/reflections aligned from the screw pair toward the jewel, stronger plate/lower-bridge frosting, and a smooth satin d99 cap-plate seat. Two radial outer-rim dial retaining screws (d201 occurrences P54/194:11 and :12) now use whole-screw neutral steel via exact-instance overrides. Other shared d201 assignments remain blue. The crown cap/blue cone, source geometry, annotations, placements and lighting are preserved.

**Verification:** 49 actual-source/asset CPU checks, four state tests, TypeScript, targeted material lint and production build pass. New regressions verify the dial screws’ source placement/orientation, the cap grain against actual screw bores, and the seat mask against all source-face vertices (exactly 263 on face54). Original decoded geometry buffers remain byte-exact across 339 objects. Twelve live-browser checks pass with exact reassembly, 216 spread members, stable 140 geometries/8 textures and zero idle redraws. Opening, cap/crown close-ups and each isolated neutral dial screw were visually reviewed; no shader errors. No new physical-device or sustained-performance benchmark is claimed.

Reference hashes and the updated appearance ledger are recorded. Details: [FINISH_ADJUSTMENTS.md](docs/FINISH_ADJUSTMENTS.md). Evidence: `artifacts/browser/snailing-corrections/`. Next action: user visual review at **http://127.0.0.1:4173/** on the existing local server. The prior branch checkpoint was pushed at the user’s request; this new finishing checkpoint is local-only and has not been pushed or merged. Unrelated `FINISHING_GOAL.md` is untouched.

## Brushing and frosting adjustment — 9 September 2026

Implemented the user’s two supplied CAD-render references: stronger irregular frosting on the main plate and lower bridge fields, readable circular satin on barrels/lids and wheels, and straight satin on eight keyless lever/spring definitions. Two previously plain-steel setting/coupling wheels now use circular satin. Existing chamfer contrast, source geometry/placements, whole-screw bluing, optics, interface and lighting remain intact. Both setting-spring variants are covered. Reference image hashes and attribution are recorded without copying the attachments into public assets; the complete appearance ledger is refreshed.

**Verification:** 47 actual-source/asset CPU checks, four state tests, TypeScript, targeted material lint and production build pass. Twelve live-browser checks pass, including exact reassembly, all 216 spread members, stable 140 geometries/8 textures and zero idle redraws. Visual review covers opening movement, dial side, winding overview/close-up and oblique view; no shader errors were reported. Source decoded attributes/indices remain byte-exact across 339 geometry objects. This pass does not claim a new physical-device or sustained performance benchmark.

Details and source IDs: [FINISH_ADJUSTMENTS.md](docs/FINISH_ADJUSTMENTS.md). Local screenshots/check output: `artifacts/browser/finish-adjustments/`. Next action: user visual review at **http://127.0.0.1:4173/**; existing preview server reused. This checkpoint is local-only, with no push or deployment. Unrelated user-owned `FINISHING_GOAL.md` remains untouched.

## Interface polish — complete locally, 9 September 2026

Implemented WEBSITE_POLISH_PROMPT.md and completed local visual/regression review. The accepted composition, model, materials, lighting and static mechanical behavior are preserved. Loading now reports real transfer/preparation/readiness stages and reveals a valid first frame; overview, annotation, diamond, rendering and optional-catalog failures have dependable retry. Context restoration preserves the inspection. Labels and search share readable English names with original names and unique source references. Copy, SVG icons, availability, focus restoration and narrow search layouts are refined; no visitor emojis.

Presentation uses coordinated 850 ms part/camera transitions, 75 ms slider response, camera arcs across sides, displayed-pose retargeting and explicit final-frame painting. Manual input owns the camera immediately. Portrait All parts uses a deterministic layout with a larger common inspection scale. All 216 eligible leaves, source geometry/scale/IDs/matrices, 58 annotations and recovered diamond remain intact. Reassembly is exact; no mechanical playback was added.

**Verification:** 46 actual-source/asset CPU checks, four state tests, 12 desktop and 12 portrait browser checks, original source hashes, both GLB integrity/placement checks, TypeScript, authored lint and production build pass. Browser checks include 24 mixed interrupted sequences, Back restoration, camera takeover, 216 visible spread members, zero settled projected overlap/clipping, stable 140 geometries/8 textures after selection warm-up and zero idle renders. Live loading/failure/retry/context tests, pointer orbit/pan and slider reversal, keyboard/focus, 200% text and reduced-motion renderer checks are recorded.

**Visual evidence:** 90 dimension-verified before/after screenshots cover nine states at five sizes. Six desktop/portrait timestamped motion comparisons were played at recorded speed and inspected at intermediate frames. All six sections were reviewed from both sides. Current copy table, motion decisions, requirement audit, measurements and limitations are in [WEBSITE_POLISH_REVIEW.md](docs/WEBSITE_POLISH_REVIEW.md); evidence is under `artifacts/browser/polish/`.

Matched 1280×720 DPR-1 benchmarks average about 16.67 ms per frame in the current browser session, with phase p95 16.8/18.1/16.8 ms before and 16.9/18.0/16.8 ms after. Encoded model resources remain 5,953,914 bytes. Median first prepared frame across three local visits is 254→269 ms uncached and 248→270 ms cached. Physical-device, screen-reader, prolonged thermal, human and expert mechanical review are not claimed; publication gates remain unchanged.

**Next action:** user visual review. Working preview: **http://127.0.0.1:4173/**. [Local comparison gallery](http://127.0.0.1:4173/reference/polish-review/index.html). Start with `cd explorer` then `npm run dev -- --host 127.0.0.1 --port 4173`. The temporary original baseline remains on 4174 in `/private/tmp/zweigesicht-polish-baseline/explorer`. Local implementation checkpoint: `1ebbaa3`; the final recovery/evidence checkpoint follows this record. Nothing was pushed, deployed, registered, saved/uploaded to Sites, or redistributed. User-owned `FINISHING_GOAL.md` remains untouched.

## Interface polish brief — 9 September 2026

Follow-up: the user also requested attention to explosion, the arranged parts layout, and especially their transitions. Extended the brief with a dedicated motion/composition pass: continuous slider response, related-part grouping, camera/part coordination, entry from existing exploration states, interruption/reversal, responsive layout, and motion evidence. Presentation layout and timing may now be refined; the 216-member membership, source scale/geometry/placements, accepted appearance, and exact reassembly remain protected. This extension inspected source behavior only and makes no new live motion-quality claim.

The user is happy with the current website and requested evaluation plus a prompt for a future goal. Prepared `WEBSITE_POLISH_PROMPT.md` covering a matching loading/fallback presentation, honest loading stages, clearer control and component labels, searchable readable catalog names, no emojis and consistent SVG icons, and focused interaction/accessibility polish. The accepted composition, model, materials, lighting, static behavior, and All parts layout are protected.

Preparation reviewed the live local opening, Options, source catalog, and forced no-3D fallback at 1280×720, observed loading status during navigation, and inspected related source. The fallback visibly uses an older gray render on a contrasting rectangular background; progress currently measures only the overview transfer. Mobile, throttled networking, recovery, performance, and the full regression suite were not re-run for this documentation-only task. No application or asset changes, goal creation, push, or deployment occurred. The user-owned `FINISHING_GOAL.md` remains untouched.

Restarted the existing preview on **http://127.0.0.1:4173/** with `cd explorer` then `npm run dev -- --host 127.0.0.1 --port 4173`. Next action: the user launches the polish goal using the prepared prompt.

## Immersive website redesign — complete locally, 9 September 2026

Implemented `WEBSITE_REDESIGN_PROMPT.md` around the accepted static model. The opening now occupies one viewport with a neutral charcoal environment, restrained attribution, a compact Explore / Separate / All parts / Reset deck and a discreet side switch. Removed the permanent sidebar and default explanation panel. Six focused mechanism views show source-verified facts; component selection, isolation, Back, reveal and the complete optional source catalog remain available through quieter secondary controls. Options retains Function, quality, keyboard guidance and alternative camera controls.

All parts deterministically arranges **216 physical movement leaves** at their original relative scale, including the recovered diamond. It excludes six case-mounting fittings and one incompatible setting-spring alternative, with all excluded/source entries reachable in the catalog. Actual rotated geometry bounds are packed into stable mechanism/structural/hardware groups. Pan, zoom and Look closer support phone inspection. Spread owns presentation transforms exclusively; reduced motion, interruption and exact source reassembly are covered. Geometry, source IDs/matrices, accepted materials/lighting, all 58 surface annotations and source provenance remain unchanged.

Verification: **35 actual-source/asset CPU regressions, four state tests and all 10 live-browser checks pass**. The browser suite covers 24 mixed interrupted spread/section/reveal/select/isolate/Back/Reset sequences, 216 visible spread members, zero settled projected overlaps/clipping, maximum scale error 4.44×10⁻¹⁶ and exact reassembly error 0. Resources stabilize at 140 geometries / 8 textures after selection warm-up; a 500 ms idle observation adds zero renders. Source SHA checks, both exported-GLB integrity/placement checks, TypeScript, authored lint and production build pass. Context recovery restores the spread, diamond and all annotations; optional catalog retry preserves the view. Escape restores Options focus. Direct mouse gestures, both sides, slider, selection/Back, isolated/catalog views and alternative zoom/Lightweight controls were exercised in the real in-app browser.

Before/after visual evidence covers 1280×720, 1600×1000, 390×844, 320×740 and 844×390, plus all six sections, spread overview/close-up, separation, Function, fallback and 200% text. Final document dimensions equal every tested viewport. Three independent read-only workers reviewed source copy, actual-asset layout/interaction and visual/regression evidence; concrete findings were resolved and the final independent review reports no remaining composition blocker. Physical-touch, screen-reader, notched-device and sustained phone/thermal review remain open; no human visitor or mechanical expert review is claimed.

Equivalent 60-second desktop orbit benchmarks (in-app Chromium 152/macOS, browser 1280×720, DPR 1) average 13.338 ms before and after. Phase p95 is 13.9 / 14.7 / 14.1 ms before and 13.9 / 14.8 / 14.1 ms after. Canvas dimensions differ with the layouts: 1020×554 versus 1232×530. The original landscape page overflows and its native screenshot raster is 829×383 at the same 844×390 browser viewport; this is disclosed, without resampling.

Review: [acceptance and sources](docs/WEBSITE_REDESIGN_REVIEW.md), [local visual gallery and numeric evidence](artifacts/browser/redesign/index.html). Preview: **http://127.0.0.1:4173/**, running on loopback; restart with `cd explorer` then `npm run dev -- --host 127.0.0.1 --port 4173`. Next action: user visual review of the local preview/gallery. This checkpoint is **local-only**: no push, deployment, Site registration/save/upload or additional CAD redistribution. The user-owned untracked `FINISHING_GOAL.md` remains untouched. Earlier redesign-preparation and release history below are historical.

## Whole-screw bluing correction — 9 September 2026

User correction supersedes the prior audit's head-only blue / neutral-shank interpretation: blued screws now keep blue metal across the head, slot, underside, shaft and any modeled thread. The shader bypasses the source-neutral color and roughness annotation for blue screw instances across the twenty reviewed screw definitions. All 44 currently blued occurrences are covered. Exact-instance steel fasteners, other steel screws and neutral blue-hand seats retain their assignments. Source annotations, geometry and placements are unchanged; no thread geometry is fabricated. The appearance ledger and audit record this correction.

Verification: all 30 actual-source/asset CPU regressions pass, including 13,386 annotated shaft/under-head vertices on the 44 blue screws, all twenty default screw definitions, eight explicit steel overrides and 934 neutral hand-seat vertices. Original decoded attributes/indices remain byte-exact across 339 geometry objects. TypeScript, targeted material lint and production build pass. No new browser/visual QA is claimed. This is a local material checkpoint for integration with the concurrent website redesign; no push or deployment. Next action: review exposed screws in the redesigned local explorer. Unrelated `FINISHING_GOAL.md` remains untouched.

## Website redesign brief — 9 September 2026

User review established a single-screen immersive direction: the accepted watch model is the focal point, with a neutral near-black background, direct touch manipulation, minimal progressively revealed controls, continuous separation, a new arranged All parts view, and cleaner section views with verified specifications. The objective is appreciation of beauty and engineering rather than rapid instruction.

The ready-to-use implementation brief is `WEBSITE_REDESIGN_PROMPT.md`. This checkpoint prepares the prompt only; no application, model, asset, or deployed-site changes have been made. Next action: launch the redesign using that brief when the user chooses. Its execution scope is local-only, with existing geometry/appearance protected and publication requiring a later instruction. The unrelated untracked `FINISHING_GOAL.md` remains untouched.

## Current outcome — complete component appearance audit, 9 September 2026

**All 365 source leaf instances are individually audited; the three reported mismatches are corrected locally.** DPL RBR d105 now has a warm straight-grained top and separately reviewed existing chamfers/underside. All three Werkhaltelasche screws (P43/P44/P45, d189) have exact-instance unblued-steel overrides. The maker’s authentic 1,640-facet diamond STL is recovered under the original empty STEP occurrence and unchanged matrix; no source mesh is recentered, scaled or reconstructed.

The complete ledger covers 202 definitions, 223 movement leaves and 142 optional catalog leaves: **55 verified, 287 inferred, 23 unresolved**. It traces original source paths, matrices, body/face/definition colors, export losses, runtime assignment, surface regions, evidence, confidence and disposition. Explicit assignment is not physical certification. Remaining conflicts include clamp bodies, concealed warm/steel components, pale gaskets, red enamel alternatives and regulation tooling. The diamond’s maker mesh has a simplified eightfold cut; authored optics do not reproduce photographic brilliant-cut dispersion or internal bounces.

Targeted catalog corrections include clear sapphire, blue metal hands with neutral seats, metal dial carriers and dark source markings. Exact face annotations now cover 58 definitions / 418,017 vertices. Twenty screw definitions preserve neutral shank/under-head faces while retaining reviewed head colors. Final macro review caught and corrected top-origin screw heads wrongly included by a shared Z0 assumption; explicit face lists and a spatial regression protect the two blue DPL screws and other affected heads. The clear-material shader also corrects Three r186’s white transmission backdrop without changing ruby shading. Existing finishing, source geometry/placements, static exploration and disabled timing remain intact.

Verification: **29 actual-source/asset CPU checks**, four state tests, production build, TypeScript and authored lint pass. Original decoded attributes/indices remain byte-exact across 339 geometry objects; recovered STL vertex floats are individually compared to the original bytes. Six real-browser checks pass, including 20 interrupted reveals, exact reassembly (matrix error 0), restored visibility, stable resources and zero idle redraws. Both assembled sides, all six reveals, each clamp screw, DPL, diamond/setting, oblique orbit/zoom, separation/reassembly, Function, catalog and 390×844 / 320×740 layouts were visually reviewed. Neither narrow viewport has horizontal document overflow. Graphics recovery restores the diamond, all 58 annotation definitions and exact assembly.

Detailed findings: [COMPONENT_APPEARANCE_AUDIT.md](docs/COMPONENT_APPEARANCE_AUDIT.md); complete [instance ledger](docs/appearance/LEDGER.md) and [structured source trace](docs/appearance/ledger.json). Before/after pairs, accepted views, rejected candidates and measured results are in the ignored [local evidence index](artifacts/browser/component-appearance-audit/index.html). Photographs and CAD renders are distinguished; the attachment directory contained goal text only, so no absent attached image is claimed as reviewed. New original downloads and maker pages have URLs, attribution and verified hashes in `assets/source-manifest/component-appearance-references.json`.

Preview: **http://127.0.0.1:4173/** on the existing loopback server; restart with `cd explorer && npm run dev`. Next action: user review of the static explorer and the explicitly listed uncertainties. This checkpoint is **local-only**: no push, publication, deployment, Site upload or asset redistribution. The unrelated untracked `FINISHING_GOAL.md` remains untouched.

## Previous outcome — animation removed, 9 September 2026

**The explorer is now a static source-CAD construction experience.** This section supersedes the running/timing status in historical entries below. The user explicitly accepted removal when a convincing complete working watch could not be supported, and prohibited publication/push.

Inspected the existing loopback website before edits and reviewed mechanics, transforms, component identities, timing, both sides and all mechanisms. The old evaluator drove 19 leaves on five shafts (17 potentially visible) and hid ten essential leaves, including the entire pallet, impulse jewel, roller, hairspring and barrel-to-center wheel. Barrels, both motion works and all catalog hands had no running drivers. Correct internal ratios did not establish engagement, spring deformation or a full energy-to-display chain. Slowing or labeling that animation could not meet the requested standard.

Removed timing controls, entry points, runtime clock/evaluator, timing state, rotations, omission branches and WebMCP timing inputs. Updated About and train copy, retired the historical timing recommendation, and adapted inspection checks/benchmark to static exploration. Refined materials, immutable source geometry/placements, source manifest/provenance, orbit/zoom, selection/isolation, catalog, both sides and authored reveal/separation transitions remain intact. No assets were rebuilt or redistributed.

Verification: 25 real-source/asset CPU regressions and four state/presentation tests pass; production build, TypeScript and authored lint pass. Browser inspection covers both sides, six reveals, oblique macro, Function, isolation/Back, catalog hands and About. Six browser checks pass: 20 interrupted reveals, exact source reassembly (matrix error 0), visibility reversal, ten essential parts present, stable 138 geometries / 8 textures, zero idle redraws. Narrow 390×844 and 320×740 browser layouts inspected; 390 px document has no horizontal overflow. This is emulation, not device/thermal qualification.

Decision and detailed evidence: `docs/ANIMATION_REVIEW.md`. Screenshots, original controller/evaluator snapshots, all 365 leaf classifications, numeric results and a hash ledger are local-only in ignored `artifacts/browser/animation-review/`. Prior review recommendations are explicitly historical. Source defects, overlapping dial/hand alternatives, authored optical approximations and extreme CAD faceting retain their documented limitations. No expert mechanical correctness or release readiness is claimed.

Preview: **http://127.0.0.1:4173/**, using the existing loopback server; restart with `cd explorer && npm run dev`. Next action: user review of the static explorer. Restoring playback requires a new full-chain evidence task, not completion of this outcome. This verified checkpoint is local-only; no push, Site registration, save, upload or deployment is authorized or performed. The unrelated `FINISHING_GOAL.md` remains untouched and untracked.

## Historical execution records

Updated 9 September 2026. **Local implementation ready for engineering review.** **No Site has been registered, saved, uploaded or deployed.**

## Completed

- Reused verified original STEP files/provenance, `.venv-cad`, Blender, the 426-instance inventory and smoke tooling. No CAD installation or source reacquisition repeated.
- Astra High handled lead integration, difficult CAD/mechanical analysis and substantive independent runtime review. Sol Medium handled bounded source inventory/reference/provenance reports. Lead retained all application edits.
- Reproducible cached XCAF pipeline exports immutable source placements and shared geometry. Full source: 426 instances (365 leaves, 61 subassemblies); movement: 223 source leaves / 222 rendered. Eight assembled reference renders and maker-image comparison are recorded locally.
- Actual full movement preview, six mechanism reveals, both treatments/sides, orbit/zoom, two-scale separation, complete source catalog, isolation and contextual return implemented in `explorer/`.
- Regulation/going-train timing study uses geometry-corroborated tooth counts and maker 3 Hz rate. Deterministic pause/play/speed/seek/step controls work; unsafe contact/spring parts are explicitly omitted during illustrative motion and restored for source inspection.
- Lossless Meshopt + prepared gzip: movement body 4,751,211 B, catalog 9,501,474 B, exact decoded geometry/ID/matrix preservation. Real browser delivery and optional load retry verified. Full geometry retained; no LOD/decimation claimed.
- Responsive portrait panels, accessible DOM controls, keyboard seeking/playback, actual-CAD static fallback, WebGL context restoration including reflection regeneration, render-on-demand, quality hysteresis and local WebMCP controls implemented.
- 7 pure state/motion checks pass; 14 independent actual-controller/material regression checks pass (including explicitly stubbed PMREM lifecycle and real SSAOPass with a CPU renderer facade). Real browser six-check suite passes, including 20 interrupted reveals, exact reassembly, stable GPU counts and zero paused redraws. Screenshots cover all groups, components, context recovery and phone-sized layouts.
- Final TypeScript and production build pass; npm audit is zero. Authored-code lint passes; generated Shadcn scaffold lint conflicts are excluded explicitly, with TypeScript/build coverage retained.
- Before the material refinement: desktop 60-second sequence on Mac mini M4/24 GB, Chromium152, 1440×900/DPR1: 16.667 ms mean, p95 17.0–17.3 ms across assembled orbit, timing and separation. Five-minute sequence completed with 18,000 intervals, p95 17.6–17.7 ms and maximum 18.8 ms; GPU counts stable at 137 geometries/2 textures. These are historical renderer measurements; real-device/thermal claims remain open.
- User visual review identified flat gray surfaces despite the initial engineering handoff. Fixed the `Grundplatine` main-plate mapping miss, overbroad blue-pin coloring, and balance/winding/exterior assignments using source definition IDs and existing maker references. Added component-local bridge grain, circular wheel/barrel finishes, frosted warm plate, differentiated existing CAD chamfers, and live modest contact shading. Function treatment and Lightweight quality skip contact shading. No CAD buffers or placements changed; no sources reacquired.

## Evidence and limitations

Read `docs/LOCAL_REVIEW.md` for scope coverage, QA matrix, measured budgets and the limitations list; `docs/CAD_AUDIT.md`, `MECHANICAL_REVIEW.md`, `ASSET_REPORT.md`, `REFERENCE_COMPARISON.md` and `IMPLEMENTATION_REVIEW.md` contain detailed audits. Numeric/browser screenshots are in ignored `artifacts/browser/`; original/reference/CAD binaries remain ignored.

Source exceptions remain: one empty diamond, invalid eccentric with three missing tessellation faces in four instances, other invalid-BRep/tiny-triangle exceptions recorded by audit. Setting-spring and dial/hand variants need review. Material finishes, balance amplitude/direction/release window and reveal paths are authored interpretations. No expert mechanical contact approval, hairspring deformation, full faithful running watch, visitor study, physical phone/thermal or production network qualification is claimed. Deferred publication does not block local engineering.

## Services and checkpoints

- Preview: **http://127.0.0.1:4173/**; Vinext dev server session 76266, bound to loopback. Restart with `cd explorer && npm run dev`.
- `?inspect=1` offers regression, 60-second/five-minute performance and failure-recovery controls. `?no3d=1` and `?text=200` are explicit test modes.
- Private SSH remote: `git@github.com:galind/zweigesicht.git`. First coherent milestone `00fb905` committed and pushed. Final implementation/evidence checkpoint `ed04e13` committed and pushed successfully. No `gh` used.
- Source/derived CAD and source imagery excluded from Git and pushes. Code, documentation and provenance only are authorized.

## Review handoff and follow-up

The material refinement passes all six browser interaction checks, 14 runtime regressions and seven state/motion tests. Geometry-buffer hashes remain identical across all 339 separately decoded geometry objects. GPU resources stay at 138 geometries/7 textures across switches; context-loss recovery restores the material/contact appearance and exact assembly. Reports: `docs/MATERIAL_REFERENCE_AUDIT.md` and `docs/MATERIAL_IMPLEMENTATION_REVIEW.md`. Local screenshots and numeric evidence use the `artifacts/browser/materials-*` prefix. Visual acceptance remains a user review, and shader grain/reflectance remain authored approximations.

Final material build, TypeScript and authored lint pass. The new 60-second desktop run with Finish/contact shading records 3,600 intervals, approximately 16.667 ms mean, 18.2 ms p95 and 18.7 ms maximum in all three phases, with stable 138/7 resources (1440×900 viewport, DPR 1). The 390×844 emulation has no horizontal document overflow; Lightweight disables contact shading and preserves exact assembly. Original five-minute performance remains historical. Preview restored to `/` with the temporary viewport override cleared.

Next review: inspect the six reveals, source catalog and clearly labeled timing study at the loopback preview. Further fidelity work needs reviewed pallet/roller contacts, spring deformation, variant choices and source-repair decisions. Qualify physical devices, cold networking and visitor comprehension before release. Publication and CAD redistribution remain deferred until explicitly approved.

## Finishing goal — 9 September 2026, ready for local visual review

The original engineering/material handoff above is historical. The broader `FINISHING_GOAL.md` refinement is now ready for local review. Reference-backed explicit source/instance assignments, physical directional reflections, filtered fine grain/frosting, selective blue/red existing faces, restrained contact shading, studio reflections and dielectric ruby optics replace the coarse prior finishing. Independent Astra macro review accepts the surface differentiation; jewel interior depth and extreme CAD faceting remain fidelity limits.

The STEP/XCAF audit traces face/body/definition/instance appearance and exporter losses, plus normals, tessellation and modeled chamfers. Separate hash-verified annotations cover 27 definitions / 258,602 vertices (793,024 gzip bytes); original GLBs, all source geometry buffers and matrices remain unchanged. The crown blue cone is 251 face 22; shock spring blue fields are 159 faces 1–4. Source imagery and all derived binaries remain local and ignored.

Evidence: `docs/FINISHING_CAD_AUDIT.md`, `FINISHING_REFERENCES.md`, `FINISHING_SHADER_REVIEW.md` and `FINISHING_REVIEW.md`. Open `artifacts/analysis/finishing-comparison.html` for matched before/after views on both sides, tight oblique macro and attributed photographic rationale. Its evidence hash ledger and all browser captures remain local.

Final verification: 25 runtime checks, seven state/motion tests, production build, TypeScript, authored lint and six live-browser checks pass. Original buffer hashes across 339 decoded geometry objects are preserved. Twenty interrupted reveals return exactly; resources stay at 138 geometries/8 textures with zero idle redraws. Final 60-second benchmark: 3,600 intervals, mean16.67 ms, phase p95 17.3/18.1/16.8 ms, maximum18.8 ms (1020×554 canvas, DPR1.5). Graphics context recovery restores all27 annotation definitions and exact assembly. Final visual sweep covers both sides, all six reveals, Function, selection and optional case catalog. Portrait390×844 has no horizontal overflow; it is emulation, not device/thermal certification.

Preview remains **http://127.0.0.1:4173/** on the reused loopback server, restored to the default view with viewport override cleared. Restart: `cd explorer && npm run dev`. No Site registration/save/upload/deployment or CAD/image redistribution occurred. This checkpoint contains code/docs/provenance only and is authorized for the configured private SSH remote.

Next action: user visual review of the local preview and comparison sheet. Measured reflectance, full manufacturing grain fields, multi-layer gem optics, source repairs/empty diamond, physical-device/cold-network qualification, mechanical expert approval and public-release gates remain open. These are documented limits beyond this local finishing handoff.

Checkpoint `28c6f3a` is committed locally. Automatic approval review rejected `git push origin main`, citing an unverified external remote/default branch and insufficient explicit trusted push authorization. No push occurred; explicit user confirmation is pending. The local finishing deliverable is complete and available for review. The user-owned `FINISHING_GOAL.md` remains untracked.

## Vercel deployment checkpoint — 9 September 2026

The user connected the private GitHub repository to the renamed Vercel project `zweigesicht` and explicitly authorized pushing. Repository-root `vercel.json` now runs the `explorer` install/build from the monorepo root. The Vercel asset-pruning step skips local-only CAD manifests when they are absent from the checkout, so the checked-in app shell can build without publishing ignored source or derived CAD.

Verification: local `npm run build:vercel` passes; commits `f1e68d8` and `a7e0cd0` are pushed to `origin/main`; Vercel production deployment `zweigesicht-3vls6e8sx-guillem-galindos-projects.vercel.app` is **READY** for commit `a7e0cd0`. The branch URL is [zweigesicht-git-main-guillem-galindos-projects.vercel.app](https://zweigesicht-git-main-guillem-galindos-projects.vercel.app). The deployment is private and redirects unauthenticated requests to Vercel login. CAD model binaries remain local-only and are not included in Git or the deployment.

The first READY deployment returned Vercel `NOT_FOUND` because its Build Output API was nested under the configured static directory. Commit `94c7b9d` copies Nitro’s `.vercel/output` to the repository-root Build Output API directory and removes the conflicting `outputDirectory` setting. Its production deployment is **READY**, and a read-only request to `https://zweigesicht.vercel.app/` returns HTTP 200 with the explorer HTML.

The user then explicitly authorized publishing the reviewed derived CAD payload to the private Vercel project so the 3D viewer could load remotely. Commit `5b0af33` includes only the content-addressed overview/catalog GLBs, assembly and asset manifests, finish-surface annotations, recovered maker diamond STL, and their prepared gzip companions; stale generated variants remain ignored. The resulting production deployment is **READY**, and retried read-only HEAD checks return HTTP 200 for all seven viewer resources under `/models/`. The private deployment serves the reviewed 3D asset set; source STEP files remain excluded.
