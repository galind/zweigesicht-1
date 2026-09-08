# Independent implementation review — 9 September 2026

This review examines the actual local application and CAD artifacts. It is an engineering source review by a separate Codex worker, not watchmaker approval, browser acceptance or real-device testing. Application files were read-only to this worker. The lead implemented the corrections identified below.

Scope: `explorer/src/viewer/MovementViewer.ts`, `explorer/src/experience/state.ts`, `explorer/src/motion/evaluate.ts`, `explorer/src/experience/catalog.ts`, `explorer/app/page.tsx`, `assets/authored/mechanisms.json`, and the local optimized models. `docs/CAD_AUDIT.md` and `docs/MECHANICAL_REVIEW.md` supply the CAD and mechanical evidence.

## Findings and corrections

| Priority | Finding | Trigger and consequence | Correction and verification |
|---|---|---|---|
| P1 | One-way obstruction visibility | Fully uncover a mechanism, then return Uncover directly to zero. Visibility was set false from the current separated offset but never restored as the bridge returned. | The lead added symmetric per-frame visibility evaluation with render invalidation. The runtime harness verifies a hidden balance bridge returns visible and every assembled matrix returns exactly. |
| P2 | An unanimated upstream wheel appeared as an active timing member | Going-train membership included source direct child 4 while its meshing center pinion rotated. Its 2.85 mm axis spacing agrees with the source 26/12 teeth and module 0.15. | The upstream wheel is omitted during Timing study, preserving its static source inspection. The four supported train shafts remain animated. Verified by the harness. |
| P2 | Selecting the alternate setting spring restored overlapping geometry | Selecting direct child 66 made it visible while standard child 53 remained visible at the same source placement, recreating known z-fighting. | The standard spring is temporarily hidden when the alternative is selected. The harness verifies exclusivity and restores the standard on exit. |
| P2 | Catalog framing exceeded fixed orbit distance limits | The case/straps diagonal is 273.232 mm; the viewer requested a 601.110 mm camera distance while OrbitControls clamped to 200 mm. Travel could never finish and the assembly stayed cropped. | The lead expanded orbit limits and far clipping to match requested framing. Direct framing converges in the harness. Saved-camera Back and portrait resize are also covered because they can restore/scale a target without calling the original framing path. |
| P2 | Obsolete load failures could overwrite newer success | In a controlled two-request harness, request two completed successfully, then request one failed and installed a failure overlay over a ready viewer. | The lead added a generation guard to failure handling. The harness also checks obsolete progress events, which must not restore a loading toast after completion. |
| P2 | Renderer failure disabled promised mechanism descriptions | Mechanism choice delegated solely to the viewer, whose group method returned before readiness. A React-only fallback initially also lost its selection to the existing viewer's periodic snapshots. | The lead added renderer-independent React selection when no viewer exists and metadata-only persistent group selection before viewer readiness. The latter is exercised without creating WebGL. |
| P2 | Context recovery restored geometry but lost reflected lighting | The lead’s real-browser context-loss check recovered geometry with a stale PMREM environment, dark metal and one texture. | `onContextRestored` now disposes and regenerates the environment, reconnects `scene.environment`, releases temporary resources and requests rendering. The CPU handler regression passes; separate browser artifacts show reflected metal restored with two textures. |

Relevant implementation entry points are `MovementViewer.load` (request generation), `group`, `back`, `frameTo`, `resize` and `ensureFramingRange` (navigation/framing), `retarget` and `retargetVisibility` (visibility), `onContextRestored` (environment recovery), and `Home.chooseGroup` (fallback selection). Method references remain valid after formatting changes.

## Reproducible regression evidence

Run `node scripts/cad/review-runtime.mjs` after preparing the local application models and installing the application's pinned dependencies. The script loads the current TypeScript source through TypeScript's transpiler, then calls the actual viewer methods against Three.js and the optimized GLBs. It creates no browser, WebGL context or server and does not write generated artifacts. Network outcomes are replaced only for the controlled obsolete-request regression. The context-restoration check runs the actual handler with explicit CPU PMREM/room stubs; its handler is extracted through the TypeScript AST, so formatting does not affect the test. Model filenames are resolved from the application’s current `asset-paths.json`, including content hashes.

The harness covers:

- Original movement ingestion: 222 renderable instances, 138 shared geometry objects, exact world placement.
- Unsafe contact/spring/upstream-wheel visibility in Timing study and exact source-pose restoration afterward.
- Completed reveal reversal, including bridge reappearance and exact assembled matrices.
- Mutually exclusive setting-spring variants and restoration of the authored default.
- Catalog ingestion reaching 364 rendered source leaves while retaining the existing movement mesh objects.
- Large case/strap camera framing, Back from a small-part close-up, and portrait resizing of pending travel.
- Persistent metadata-only mechanism selection while the renderer is not ready.
- Obsolete loading progress and failure events following a newer successful request.
- Replacement of a lost environment texture, disposal of the old target and temporary PMREM/room resources, and correct render/status invalidation after context restoration.
- Snapshot exposure of catalog and benchmark state, including an absent benchmark result.

Final rerun against the corrected source: **all 12 runtime regression checks passed**, including Back, portrait resize and obsolete progress/failure guards. No P1/P2 issue identified in this review remains open after these corrections.

The existing `node --test tests/experience.test.mjs tests/motion.test.mjs` suite also passed all seven tests during this review. Those tests check pure state/motion invariants; the additional harness exercises source methods and real assets that those unit tests do not cover.

## Transform and geometry assessment

The renderer correctly reconstructs each leaf's `assembled` matrix from the manifest's row-major nested world transform, reparents the geometry directly to the common scene root, and disables local auto-updates. It does not multiply the imported hierarchy over that world placement again. Shared source definition geometry remains shared across repeated instances. The independent actual-loader harness measured assembled matrix error **0**, including after leaving a timing pose at `t = 0.172` seconds.

Motion composition is `presentationTranslation × T(pivot) × Rz(delta) × T(-pivot) × assembledWorld`. This agrees with the audited source-world axes and the mechanical review's world +Z convention. Moving rigid balance components are selected below the proper source subgroup; the entire spring/stud parent is not rotated wholesale. The independently imported source spring returns only when the illustrative mechanical deltas are removed. This avoids attaching a static spring to an arbitrarily rotated collet merely by pausing playback.

The application preserves source IDs and exposes source names, alternatives and the empty brilliant through the catalog. The empty source leaf is represented by metadata, not invented mesh geometry. The known incomplete balance eccentric and other CAD exceptions remain source-fidelity limitations. The default variant exclusion is reversible and documented.

## State, timing and resource assessment

The pure pose evaluator is deterministic, uses the source-supported 20-tooth escape wheel and reviewed count ratios, and makes all four train shafts share the same intermittent cadence. It is explicitly an illustrative timing study. Its amplitude, absolute direction and release window are authored; the omitted pallet, roller, impulse jewel and hairspring mean it is not a validated running escapement.

Separation pauses the shared clock without losing time. Source inspection removes motion deltas rather than mutating the immutable assembled transform. Manual orbit cancels camera travel. History records state, position and target; Back restores a paused context, and Reset clears history and seeks zero. The lead also corrected resizing so an in-progress camera destination is scaled rather than silently discarded. Actual pointer/touch interruption and focus behavior still belong to browser QA.

Catalog loading is shared through one pending promise and becomes a one-time loaded state. Existing movement meshes are not replaced when the full catalog arrives; the independent harness verifies object identity. The source geometry-sharing contract is preserved within each asset. This review does not claim cross-asset deduplication, GPU memory stability or successful context restoration from a CPU harness. Disposal paths cover controls, the resize observer, visibility listener, scene geometry/materials, selection helper, environment and renderer; the lead's browser loop remains the authority for GPU resource counts across navigation and remounts.

Paused rendering is demand-driven. The final implementation also gates pose updates on invalidation, active presentation movement or playback, while periodically publishing visibility/status snapshots. Performance samples now use uncapped wall-clock frame intervals separately from the capped simulation delta, correcting the earlier measurement limitation. The benchmark records assembled orbit, timing study and separated orbit phases, plus elapsed time, visible frame totals, viewport and pixel ratio. These instruments can support the lead’s browser evidence; their presence does not itself establish a sustained device or thermal pass.

## Scope and acceptance limits

The implemented local experience provides actual movement context, six source-based mechanism selections, authored reveals, layered/component separation, part inspection/isolation, two viewing directions, material treatments, a bounded timing study and catalog access. This is substantial local prototype coverage.

The original implementation plan's full mechanical and release outcomes remain incomplete: no validated pallet/roller contact cycle or hairspring deformation; no reviewed continuously operating barrel/winding/setting/shock graph; no accepted source variant or repair decision for every defective source component; no actual baseline phone/thermal qualification or five-person comprehension study; and no publication permission. The static source CAD and the illustrative motion must retain their distinct descriptions. No external expert mechanical approval is implied by this engineering review.

A passing harness supports proceeding with local review and browser testing. It does not close Gate A's source-fidelity exceptions, Gate B's human/device evidence or Gate C's release qualification.


## Final bounded re-review

The final pass re-read the current viewer, `src/viewer/validation.ts`, clock evaluator, page fallback/responsive hooks and stylesheet changes, then reran the source/asset harness. **All 12 runtime regressions and all seven pure state/motion tests passed again. No remaining material blocker to local review readiness was identified.** No application or asset files were edited in this final pass.

The latest clock patch applies an explicit seek before synchronizing the resolved play state, preventing clock/UI divergence when time and playback arrive together. Catalog cleanup disposes discarded geometry only when it is not retained by an accepted mesh; the real-asset regression still confirms the original 222 movement meshes and 138 shared geometries survive catalog ingestion. The final request-generation guards cover progress, success and failure.

Fallback descriptions remain selectable without a renderer and persist before renderer readiness. Text sizes now use relative units, mobile focus cards reserve stage space, and the page exposes explicit no-3D and 200% text test modes. The `?text=200` mode applies a dedicated layout class as well as font scaling; it is useful controlled QA, not proof of every browser zoom or operating-system text preference. The lead owns actual pointer/touch, narrow viewport, enlarged text, context-recovery and visual results.

The disposition is **local implementation ready for review**, subject to the lead’s current browser QA. It is not mechanical acceptance or permission to publish. Contact/spring validation, source-fidelity exceptions, expert/human review, actual baseline devices/thermal qualification and the source redistribution/public-release gate remain open as described above.


## Context recovery and final formatted-source follow-up

After the lead’s PMREM correction, formatting and lint/snapshot cleanup, the independent harness passed **12 of 12 checks** and the pure state/motion suite passed **seven of seven** again. The added PMREM check verifies the actual handler replaces the old texture, disposes the previous target and temporary generator/room, preserves environment intensity, clears the context/error state and invalidates rendering. These are control-flow/resource assertions with CPU stubs, not a WebGL rendering assertion.

The lead’s separate real-browser evidence is `artifacts/browser/context-restored.png` and `artifacts/browser/context-restored.json`. This reviewer opened both: the screenshot shows the reflected metal treatment restored, while the captured state reports `ready: true`, an empty error, one recorded context loss, two textures, 137 GPU geometries, 221 visible meshes and assembled matrix error zero. This browser evidence establishes recovery for that captured desktop context-loss test; it does not guarantee recovery on every GPU/browser.

`artifacts/browser/benchmark-5min.json` records the lead’s completed desktop run at a 1180 × 734 viewer viewport and pixel ratio 1: approximately 300 seconds, 18,000 sampled frames across three phases, p95 intervals 17.6–17.7 ms and maximum 18.8 ms. Its final resource snapshot contains 137 GPU geometries and two textures. These are the actual captured desktop results, distinct from the CPU harness and from actual-phone/thermal certification. The geometry count differs from the 138 loaded shared geometry objects because the authored default hides a source alternative.

The final snapshot fields `catalogLoaded` and `benchmarkResult` let the inspection panel render state without reading mutable viewer refs during React rendering. Source inspection of the queued initialization updates and semantic output/label cleanup identified no additional material local-review blocker. The disposition remains **local-ready for review**, with the mechanical, source-fidelity, baseline-device, human-comprehension and public-redistribution gates explicitly open.
