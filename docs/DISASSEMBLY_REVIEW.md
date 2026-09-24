# Disassembly review — 24 September 2026

Review baseline: `5402e93` (fetched `origin/main`, merged PR #8), branch `codex/disassembly-review`. The connected GitHub app confirms #6, #7 and #8 are merged and found no open repository PRs. Existing uncommitted domain-history edits in `PROGRESS.md` are excluded. No publication is authorized.

## Disposition

| Priority | Finding | Decision |
| --- | --- | --- |
| P1 | Flipped attachments disassemble inward through the watch | Fixed: offset follows the continuous attachment frame. |
| P2 | Outer case packets clip during separated Flip in landscape | Fixed: shorten four axial vectors; retain timing and camera behavior. |
| P2 | Middle ring crosses the fixed main plate early in separation | Retained and documented: the simple axial alternative introduces tube/stem interference. |
| P3 | Opposite-face Focus can put the contextual plate in front of the mechanism | Retained: default faces expose the sections; reversing real extraction directions would be wrong. |

Bare movement and dial-only directions remain unchanged. The complete watch is clearer after these corrections, but the retained ring path prevents calling the whole presentation mechanically coherent as a physical disassembly sequence.

## Findings before implementation

### P1 — fitted lug offsets ignore the current attachment frame

High confidence; case-only and complete configurations, especially the default Skeleton (`back`) face. Enable Case, choose Skeleton, set Disassemble to 5%, 20%, 40%, 70%, then 100%. Both nine-leaf attachments head inward, cross the watch and emerge at the opposite end. Flip while separated also rotates the attachment placement without rotating its separation displacement. The same error reverses during reassembly.

Stable packet roots are `p_0_1_1_1__0_1_1_1_3__0_1_1_43_4__0_1_1_49_2` and `p_0_1_1_1__0_1_1_1_3__0_1_1_43_9__0_1_1_79_2`; all 18 leaves, including d52 keys, d53/d57 screws, d54 lug bodies, d55 bars and d56 covers, are affected. Ring-mounted d72 locking pins are not part of these packets.

`experience/watch.ts` gives them ±40 mm along source Y. `CasePose.ts` turns their immutable source placements about CAD X, but `MovementViewer.applyPose` adds the unturned offset afterward. For the upper-source d54, the opposite placement has negative Y: at 40% separation the translation is +16 mm, toward the movement. This is a watch-coordinate error, independent of camera orientation. Original-solid sampling against fixed plate d195 returns 58.5672 mm³ at 40%, with a sampled maximum of 61.6962 mm³ at 30%. Original assembly is zero for this pair; simply reversing Y at the completed flip yields zero at all ten sampled positions. The initial browser sweep independently fails 14 outward-direction checks across the two fitted configurations and passes the corresponding bare/dial checks.

Proposed correction: express the separation vector in the same continuously turning frame as its lug packet. Reuse the existing phase, preserve exact front/back source endpoints, rotate the vector continuously during interrupted turns, and use the same vector in rendering and camera bounds. A side-only sign switch is insufficient: it would jump during Flip. Changing the camera would only hide the defect. Do not alter the verified hidden/visible-case Flip timing, source geometry or other packets.

### P2 — middle case packet crosses the fixed plate

High confidence for the named original-solid pairs; case-only and complete configurations, either face. With Case visible, scrub from 0 through 2.5%, 5% and 10%, inspect from an oblique angle. Middle-ring d70 (`p_0_1_1_1__0_1_1_1_3__0_1_1_43_7__0_1_1_69_1`) and its tube, corrector, guards and locking pins translate −55 mm on source X while the main plate stays fixed. The enclosing ring crosses the plate: sampled common volumes are 23.6664, 43.3161 and 48.8581 mm³. The side-view capture `pose-1440-900-back-5-oblique.png` shows this early configuration. This is solid Boolean evidence, not bounding-box inference. The near-zero assembled Boolean residual is −0.00715 mm³; the large positive motion intersections greatly exceed it.

Compared alternatives: a +Z 90 mm middle-packet route clears the plate in the ten samples, but introduces tube d73/stem d143 intersections of 1.10088 and 1.91076 mm³ already at 0.5% and 1%. Keeping the ring fixed loses its existing construction separation and still does not resolve whole-view stem withdrawal. A proper staged case/stem/keyless extraction requires revisiting the whole-view layout and its configuration transitions; the existing Focus winding sequence is a different evaluator. No tested replacement establishes a coherent complete path. Leave this path unchanged in this narrow correction and retain the finding explicitly; do not describe current or candidate motion as a service procedure.

### Working behavior to retain

Bare movement and dial-only whole separation use stable source-coordinate directions on both faces. Camera rotation does not reverse their local motion. Both display packets move outward (central +Z, Skeleton −Z) and keep their XY seats. Hand-style alternatives share layout bounds, avoiding shifts of the surrounding layers. Case material changes affect appearance and automatic Fine finishes, not motion. Whole separation intentionally separates individual pressed/riveted elements as a construction illustration; Focus retains reviewed host packets. These two presentations must not be conflated.

Evidence is local under `artifacts/disassembly-cad/` and `artifacts/browser/disassembly-review/`. The original STEP remains ignored and untouched. `scripts/cad/disassembly_probe.py` samples named solid pairs. Browser evidence and verification details follow after the correction and final review.

## What the implementation does

Axes remain the original CAD millimetre frame. X runs from 9 to 3/crown; ±Y runs between attachments; central/Three hands faces +Z and Skeleton faces −Z. The opening camera looks from −Z with −Y up. Camera navigation changes the observer, never the stored source matrices. Matrices compose outside immutable source placement (and fitted hand/case presentation matrices).

| Motion | Implemented assignment and ordering |
| --- | --- |
| Whole movement | `experience/explosion.ts` reads `assets/derived/complete-separation.json`, built by `scripts/cad/build-complete-separation.py`. Source body-depth anchors plus projected-XY/full-Z bounds and screw-seat precedence produce 1 mm final gaps. Every part advances simultaneously, linearly in separation progress; it does **not** execute `explosion.json` host stages. Plate d195 is fixed. Three radial screws retain seat-layer Z plus 4 mm on their transformed withdrawal axes. Other movement leaves have individual Z translations, including pressed elements and spring packets. The final movement envelope is Z = −47.245…20.804 mm. Bounds establish a readable final arrangement, not intermediate solid clearance. |
| Fitted dials/hands | Central layers extend +Z beyond the movement; Skeleton extends −Z. `DISPLAY_LAYERS` orders structure, supports and blades; all supported shapes contribute to fixed bounds. Complete face envelopes are approximately +21.804…40.164 mm and −60.594…−48.813 mm. XY remains source/fitted, including the documented Lance correction. Supports and blades intentionally become separate illustrative layers, while repeated markers share a layer and retain distinct XY seats. In Focus they inherit the corresponding movement display host; only Two faces adds their individual layer spread. |
| Fitted case | `experience/watch.ts` assigns rigid packet vectors: front back/crystal +60 Z, seal +50 Z; rear −75/−65 Z (baseline: ±120/±110 Z); middle −55 X; crown +45 X; attachments ±40 Y before composing Flip. The crystal, gasket and screw-back components within each back packet stay together. Middle-ring pins/tube/corrector stay with the middle packet. All advance with the same whole-view progress. Packet rigidity is intentional; no unscrewing or lock-release procedure is simulated. |
| Focus | `assets/authored/explosion.json` maps each movement leaf to a host, optional independent fastener release, local direction and stage. Occurrence rotations transform local directions into watch coordinates. Parent offsets compose once; active child mechanisms can suppress an ancestor's cover-only lift. `separation`, `partSpread` and `reveal` take the maximum applicable progress/distance rather than adding duplicate deltas. |
| Cover reveal | Uncover moves designated hosts up to 28 mm on their reviewed extraction axis using smoothstep over reveal .2…1. Host ancestry makes attached children follow. Distant nonmember covers retire past 24 mm. Separate 240 ms cutaway fades remove surrounding parts; explicitly listed covers target hidden above reveal .8. Because visibility follows target intent, entering Focus is a presentation transition, not a guarantee that every cover is seen travelling its whole path. Selected parts remain inspectable. |
| Timing | One-click open is 1.25 s, close 1.05 s; partial changes use `full × (.45 + .55 × distance)`. Quintic easing is bounded and monotonic. Scrubs settle over 75 ms with cubic ease-out. Within a stable Focus, the evaluator samples staged paths every frame. Switching group/layout uses per-part interpolation from the displayed pose instead. Reduced motion snaps to requested endpoints. |
| Camera | Automatic whole framing gradually moves from face-on toward an oblique direction as separation grows and fits target geometry. Focus uses its authored preferred face and then fits selected members. Explicit selection changes framing to that part. Manual orbit preserves camera ownership through later scrubs. Camera fits defer during Flip. This can make small initial axial separation look unchanged face-on; an oblique inspection distinguishes occlusion from clearance. |
| Flip | `CasePose.ts` retains the existing maker-based withdraw/turn/reseat phase (1.8 s when case is effectively visible; .85 s rotation-only when hidden). The observer and attachments share an inverse X rotation about Z=−2.5000161761 mm. Side-independent movement/dial offsets remain in the watch frame. The correction rotates only attachment separation with the continuous attachment pose. Ring locking pins stay with the middle ring. |
| Selection, inventory, loading | Selection/isolation changes emphasis, visibility and framing, not the authored separation evaluator. Raw external catalog inspection suppresses fitted overlays. All parts uses an independent packing layout and per-part inventory Flip, temporarily hiding the case; the All parts toggle exits to Whole movement assembled, while history Back restores the saved separation. Inventory Flip itself adds a history entry (so Back first undoes that turn). Configuration changes retain separation and side; newly enabled packets appear at the current presentation rather than flying from stale hidden poses. A shared catalog request and generation tokens retain latest intent; complete-case and complete-dial-pair gates prevent half-fitted displays. |

The statement in older CAD notes that the winding stem withdraws +X with staged levers applies to **Focus winding**, not whole separation. Whole separation instead assigns that stem `[0, 0, −9.85248]` mm at full spread. Similarly, Focus retains reviewed pressed/riveted hosts, while the whole view deliberately shows individual leaves. Neither is a mechanically certified service order.

## Focus assessment

All six sections were sampled on both faces with covers at 0/.4/1 and part spread at .15/.5/1/0, including fitted displays. The case preference survives but the case is effectively hidden in every Focus. Entering a section chooses its authored preferred face; Flip then permits inspection from the other face.

| Section | Retained construction and section order | Assessment |
| --- | --- | --- |
| The heartbeat / regulation | Train/barrel/center/pallet bridges uncover toward −Z; regulator packet separates 14 mm over .2… .6, then pallet 4 mm and train wheels 5.5 mm over .6…1. | Balance, spring and anchorage remain coherent; opposite view changes screen direction only. Retain. |
| Stored energy | Barrel bridge and rear display uncover toward −Z (the child's cover lift may compose with its parent); both barrels separate 6 mm toward −Z throughout spread. | Barrel hosts remain coherent. Listed lids retire as cutaways, rather than depicting spring release. Retain. |
| The going train | Train/center bridges and regulator uncover −Z; center wheel 4 mm and train-wheel packets 5.5 mm separate over 0…1. | Parallel axial presentation exposes retained wheel/pinion relationships. Retain. |
| Two faces | Train/barrel bridges uncover −Z; front display moves +5 Z over 0…1; rear display −6 Z over .2…1. Active rear display suppresses its parent's cover-only offset. | Both dial/hand packets move outward on their own sides, with additional layer separation. This is the clearest focused comparison of opposite faces. Retain. |
| Winding & setting | Train bridge uncovers −Z. Keyless +3.5 Z over .2… .4; stem +8 X over .42… .7; winding bridge −8 Z over .3… .7; ratchets +5 Z over .3… .65; wheel/clutch pair −4 Z over .72…1. | Existing source-based staging is more mechanically informative than whole spread. Reviewed radial screws and attached pins retain their hosts. Retain; release/contact mechanics still unresolved. |
| A trace of impact | Train bridge, regulator and barrel bridge uncover −Z; complete shock host separates −8 Z over .2…1; listed obstructing pieces fade. | Delicate internal springs/linkages remain associated. No running impact/reset motion is inferred. Retain. |

## Configuration assessment

| Configuration, both faces | Assembled / early / intermediate / full / reassembly |
| --- | --- |
| Bare movement | Exact source assembly; early axial layers remain visually superposed from straight-on, becoming legible as the camera turns. Full spread exposes individual CAD leaves; it is deliberately much less packet-oriented than Focus. Reassembly is exact. No direction change justified. |
| Both dials/hands, case hidden | Same movement motion plus outward face layers. Both directions and stable hand-style bounds are coherent. Both visible dial packets and selected hand shapes restore their fitted endpoints. No direction change justified. |
| Fitted case, dials hidden | Assembled endpoints are correct. Baseline Skeleton attachments move inward at every nonzero sample; corrected packets move outward continuously on either face. Middle-ring early interference remains as P2. Shorter back/seal travel retains the outer layer order, improves central scale, and clears the reproduced landscape Flip clipping. Reassembly is exact. |
| Complete watch | Same corrected lug behavior, with central and Skeleton display layers between the movement and their corresponding outer case packets. Fine/Lance/Open lance and Lance/Broad lance/Pear options retain stable surrounding layers. The remaining middle-ring issue is unchanged by displays or alloy appearance. Exact fitted reassembly. |

The initial review flagged the large ±120 mm outer-case travel as a readability tradeoff. Later landscape motion evidence upgraded this to the concrete clipping finding below. The accepted correction shortens those four axial packet distances only; the camera and middle-ring path remain unchanged.

### P3 — opposite-face Focus can be obscured by its plate context

High confidence as a presentation observation, not evidence of wrong part directions. Reproduce: Focus → The heartbeat (also Going train or A trace of impact), Flip to Three hands/front, then separate the section fully. The active parts move −Z, behind the fixed contextual plate from this viewpoint. `after-focus-regulation-front.png`, `after-focus-transmission-front.png` and `after-focus-shock-front.png` show a close plate view; their back counterparts expose the mechanisms. The fixed plate can extend outside the tight member framing. The section's default face is deliberately the readable one; rotating to the opposite face does not justify reversing extraction or moving the plate through the section. Retain the direction and existing Focus scope. A future context-visibility/framing decision would need a separate presentation review. This limitation applies to all configurations because Focus temporarily hides the fitted case.

### P2 — excessive outer case travel clips a separated Flip in landscape

Found during final responsive review, before changing case spacing. At 844×390, complete watch, fully separate, Flip, reverse at about 750 ms, then partially reassemble. Both original baseline and lug-only correction reach the same maximum projected corner extent, 1.19070571 (viewport edge = 1). Actual sampled images confirm a back/crystal packet is clipped at the top/bottom around 750–900 ms; this is not merely an oversized empty bounding-box corner. The original ±120 mm back and ±110 mm seal paths place outer packets much farther from the fixed movement than the fitted displays require. Desktop and portrait remain within frame, masking this landscape defect.

Candidate correction: retain all axes, rigid packets, simultaneous progression, Flip timing and camera behavior, but shorten front back/seal travel to +60/+50 Z and rear back/seal travel to −75/−65 Z. The asymmetric distances reflect the measured asymmetric display envelope, not the viewed face. All supported dial/hand alternatives contribute to the envelope, keeping distances invariant under configuration changes. At full spread the conservative gaps are at least 8.7 mm between each seal and its outer back packet, and 8.9 mm between a seal and its display envelope. This is substantially more than the movement's 1 mm layer gap. A swept-camera enlargement would also avoid clipping but make already-small movement details smaller; phase-dependent camera dollying adds reversal/loading complexity. Validate the shorter paths through intermediate source-order checks and the same live-frame landscape test before accepting them. The separate middle-ring finding is unaffected.


## Accepted changes and solid checks

Implemented the continuously rotated attachment offset in `CasePose.ts`, composed by `MovementViewer.applyPose` and both target-bounds paths. The canonical authored offset remains unchanged, so the current Flip phase, rather than target side, governs interrupted poses. All 18 leaves stay together; other packet vectors are unaffected by this frame transform. Exact front/back special cases avoid accumulated endpoint error.

Accepted the shorter axial back/seal vectors in `experience/watch.ts` after the landscape regression passed (maximum projected extent 1.19070571 → 0.96435272). This changes four constants, with no new state, staging, controls or camera motion. The CPU interval test covers all source hand alternatives at 0, .005, .01, .025, .05, .1, .2, .4, .7 and 1. Six named original-solid pairs (front/rear back vs outer dial, seal vs outer dial, back vs seal) were checked at nine progress values, 54 samples total. No sampled pair increases common volume above its original fit. Original back/seal solids overlap by 4.62879 mm³ at assembly, fall to 2.12068 at .5%, .33251 at 1%, and zero from 2.5%; that original seal fit is not described as a newly introduced collision. Back/dial and seal/dial pairs remain zero. These samples complement the conservative layer-order bounds; they are not an all-part or continuous service-path certification.

Retained the middle-ring interference finding and opposite-face Focus occlusion. The rejected axial-ring candidate is recorded with its tube/stem intersections. No source geometry, hand fit, finish, source transforms, case preference, selection rule, release mechanism, ring locking-pin rule or Flip timing was changed.

Reproduce local numeric evidence from a prepared checkout:

```sh
node scripts/cad/sample-disassembly.mjs
.venv-cad/bin/python scripts/cad/disassembly_probe.py
```

The exporter evaluates the real TypeScript offsets into ignored `artifacts/disassembly-cad/offsets.json`. The solid probe verifies the original STEP hash, uses original occurrence matrices, and writes sampled volumes and the offset-evidence hash alongside it. `artifacts/disassembly-cad/` is explicitly ignored. Browser inspection adds Run disassembly review and Run disassembly transitions only in `?inspect=1`; ordinary controls are unchanged.

## Verification and evidence

Baseline and final configuration sweeps use the same 1440×900 viewport and platinum/Fine/Lance choices for matched images. For each of the four configurations and both faces, the sweep records assembled, .05, .2, .4, .7, 1, .7, .2 and zero separation, then all six Focus sections, cover controls, all nine hand-shape pairs at partial separation, all case appearances, explicit isolation, inventory history, rapid scrubs, Flip interruption and reduced motion. Baseline: 128/142 checks pass; the 14 failed outward checks reproduce the fitted Skeleton lug defect. Final: 142/142 pass. A first draft of the history test was corrected to account for inventory Flip adding its own history entry; this was a test expectation error, not a product change.

The live-frame suite samples opening/reversal, fully separated Flip/reversal and interrupted partial scrubbing on both faces. It then changes all four visibility combinations while separated and restores exact fitted endpoints. The real cold-catalog fixture delays loading by six seconds while changing face, separation, hand shape and material; it retains latest intent and fits complete packets on arrival. Desktop viewport emulation and synthetic reduced-motion/pointer handlers are browser evidence, not physical-device testing.

Local evidence inventory:

- `artifacts/browser/disassembly-review/comparison.jpg`: matched baseline/final complete-watch poses at 20%, 40% and 100%, Skeleton face. The final watch exposes the attachments outward and keeps the outer case layers closer.
- `landscape-comparison.jpg`: actual rendered Flip frames around 750 ms, before/after the outer-case spacing correction. The original clipping is reproduced with the untouched baseline, independently of the lug fix.
- `baseline-*.png` and `final-matrix-*.png`: four configurations, both faces, assembled/intermediate/full poses and all twelve Focus/face views. Captures are made inside the actual rendered-frame callback; preliminary empty captures outside that callback were replaced.
- `pose-1440-900-*-100-straight.png`: straight-on separated faces; `pose-1440-900-back-5-oblique.png`: early case-ring side view. Perspective occlusion is considered separately from the named solid intersections.
- `*-transitions.json`: real sampled frame PNGs, timestamps, viewport and numeric checks. `baseline-landscape-transitions.json` retains the original inward-lug and clipping failures; `compact-landscape-transitions.json` records both corrections passing. The initial lug-only landscape failure is retained as `landscape-transitions.json`.
- `baseline-tests.log`, `baseline-runtime.json`, `final-state-tests.log`, `final-runtime.json` and `final-*.json`: state/CPU and browser suite results. Expected fault-injection errors are distinguished from real test failures.
- `artifacts/disassembly-cad/solid-samples.json`: ten samples each for original ring/plate, original flipped lug/plate, corrected flipped lug/plate and rejected axial ring/plate (40 total).
- `ring-candidates.json`: 28 named tube/stem and ring/stem comparisons explaining why the axial middle-ring proposal was rejected.
- `case-spacing-samples.json`: 54 named back/seal/dial samples, source hash and evaluated-offset hash for the accepted shorter outer paths.

CPU coverage now checks all 18 attachment leaves at 54 combinations of separation and Flip phase, exact source/display endpoints, both target-framing paths, interrupted reversal plus scrubbing, and monotone case/display ordering with a measured minimum final gap of 8.73014 mm. It evaluates actual runtime code and decoded CAD, including the established source-byte preservation checks. The solid study remains discrete and pair-specific; invalid/source-fit geometry and unresolved locking/release mechanics prevent a service-path claim. Physical iPhone/Android, Safari/WebKit, representative accessibility/usability and expert mechanical review remain outstanding under the existing release gates.

### Final check results

| Check | Result |
| --- | --- |
| State/motion/packaging tests | 17 passed |
| CPU source/runtime checks | 113 passed |
| Configuration and Focus matrix | 142 passed |
| Existing browser suites | Watch 198, explosion 8, dial 55, inventory 20, camera 19, UX 65 passed (365 total) |
| Live transitions | 12 passed at each of 1440×900, 390×844 and 844×390 (36 total) |
| Fresh production browser smoke | 12 passed; cold catalog, 605 sampled motion frames, no captured console warnings/errors |
| TypeScript, lint, production build | Passed |
| Production SEO/HTTP checks | Passed |

The browser regression total is 543 assertions across the matrix, existing suites and three viewport runs, plus the fresh production smoke. The watch suite used a warm catalog, so its two cold failure/retry cases were skipped; the real delayed cold-load transition fixture and fresh production cold completion were checked separately. Watch, explosion and camera suites were repeated after the final spacing correction; the unaffected dial, inventory and UX suites were retained from the lug correction. Existing build notices concern large chunks and vinext route classification.

The final live-frame maximum projected corner extent is 0.96435 at desktop and landscape sizes and 0.90300 in portrait (viewport edge = 1). The landscape baseline was 1.19071. Production attachment-frame error remained below 4.3e-14 mm and the final fitted presentation error was zero. These results verify the sampled illustrative motions, not a certified mechanical service sequence.

No push, PR, merge or deployment was performed. Next review: the two before/after comparisons, the retained ring finding, then physical-device and expert mechanical checks under the existing release gates.
