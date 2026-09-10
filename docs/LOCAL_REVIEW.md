# Local engineering review — 9 September 2026

> Appearance update, 9 September 2026: [COMPONENT_APPEARANCE_AUDIT.md](COMPONENT_APPEARANCE_AUDIT.md) records the complete later audit and authentic maker STL diamond recovery. Original assembly STEP emptiness remains a source fact; statements below about missing viewer diamond geometry and prior material coverage are historical. Running/timing remains disabled.

> Historical checkpoint. The 9 September animation decision in [ANIMATION_REVIEW.md](ANIMATION_REVIEW.md) supersedes the playback recommendations and timing-feature status below. The current explorer is static; source evidence and material findings remain applicable.

**Working preview: http://127.0.0.1:4173/**. The local implementation is a real-CAD movement explorer with six authored static reveals and complete source addressing. Public release remains a separate, open gate.

## What is implemented

| Planned capability | Local implementation and evidence |
|---|---|
| Full assembled context | Actual source movement, both sides, orbit, zoom and reset; eight offline assembled reference renders. Maker-reference orientation and major placements compared. |
| Difficult reveal | Balance/escapement source inspection exposes the real overcoil, lever and escape wheel; interruptible lifting/hiding of covers. |
| Functional coverage | Regulation, twin barrels, going train, two-face display gearing, winding/setting and optional shock indicator. Exact source memberships and context/obstructions are authored separately. |
| Motion | Deterministic 3 Hz illustrative balance and 20-tooth escape timing; four source-count-linked train shafts, pause/play, 0.05×/0.1×/0.25×/1×, cycle seek and desktop beat step. Contact parts are omitted while moving. |
| Two-scale separation | Whole-movement layers and focused mechanism components; direction reversals and interruptions restore exact source placements. Separation pauses mechanical playback. Paths are presentations, not service instructions. |
| Component inspection | All 426 source instances are addressable. Search, mechanism lists, outline/bounds cue, isolation, source identity and contextual Back; optional full catalog contains 364 rendered leaves plus one documented empty leaf. |
| Materials | Shared real geometry in Finish and Function. Maker-reference-informed metallic palette, solid subdued context, no full-scene transparency. Finishes are authored interpretations. |
| Loading/recovery | Matching actual-CAD fallback, compressed hashed local assets, optional catalog retry, real WebGL context recovery including rebuilt reflections, renderer generation guards. |
| Responsive/accessibility | Portrait framing accounts for panels; horizontal mechanism picker, collapsible phone panel, semantic controls, keyboard sliders/playback, focus styling, text enlargement test. All motion starts paused. |
| Inspection/reproduction | Developer-only query controls, three validated local WebMCP tools, converter/cache, binary audits, lossless optimizer and test harnesses. No Sites account or cloud service needed. |

## Material correction after user review

The initial engineering handoff did not satisfy visual finishing. The user's assembled screenshot exposed a central classification error: `ml01 Grundplatine` missed the old `Grundplatte` name rule and appeared default gray. The correction uses exact source-definition assignments for the plate and reviewed components, distinguishes steel/brass pins from blue screw heads, and corrects balance, winding and exterior families. All 223 movement source leaves resolve to a profile; that is assignment coverage, not verified physical material identity. See `MATERIAL_REFERENCE_AUDIT.md`.

The current Finish treatment adds component-local straight bridge grain, circular wheel/barrel grain, a warm frosted plate and polished reflections on existing CAD chamfers. A live screen-space contact pass adds restrained depth shading after each pose; Function and Lightweight skip that pass. Numeric grain, reflectance, lighting and color remain authored interpretations of the cached maker references. No CAD geometry, transforms or original assets were changed.

Current validation, superseding the older renderer baseline below:

- **14 runtime checks and 7 pure tests pass**, plus TypeScript, authored lint and production build. New checks hash all 339 separately decoded geometry objects byte for byte and exercise the real SSAOPass lifecycle with an explicitly CPU-only renderer facade.
- **All 6 real-browser checks pass**, including interrupted reveals, exact reassembly and no idle redraw. Resources remain **138 GPU geometries / 7 textures** across switches. Real context-loss recovery restores appearance with those same counts and matrix error 0. Evidence: `materials-interactions.json`, `materials-context-restored.json/.png`.
- **A fresh 60-second desktop sequence** at 1440×900 browser viewport, DPR 1 (final canvas 1180×734), runs Finish with contact shading. Each phase has 1,200 samples: assembled orbit, timing study and separated orbit each have mean approximately **16.667 ms**, p95 **18.2 ms**, maximum **18.7 ms**. Resources finish at 138/7. Type/lint/build validation ran concurrently. Evidence: `materials-benchmark-60s.json`. The five-minute run below predates this material pass; it is not a sustained qualification of the new shading.
- **390×844 viewport emulation** renders the updated movement and accessible controls without horizontal document overflow. Lightweight retains materials while reporting contact shading off and exact assembly. Evidence: `materials-phone.png/.json`, `materials-lightweight.json`. No physical-phone performance claim follows from this desktop emulation.
- Screenshots `materials-assembled.png`, `materials-context-restored.png`, and `materials-function-check.png` preserve the inspected appearance. The final local preview returns to its ordinary viewport and clean URL. No captured console errors occurred in the final preview check.

Beauty-pass triangle/draw counters exclude the additional contact depth and fullscreen work; measured frame intervals above include it. Visual acceptance remains a user-review question. The refinements do not establish photographed or measured finish fidelity.

## Initial implementation checks (before material correction)

| Check | Result / evidence |
|---|---|
| Pure state/motion tests | 7 pass (`node --test tests/*.test.mjs`): signed ratios, escape dwell/step, clock seek/speed/hidden freeze, exact restoration and interrupted transitions. |
| Actual runtime controller review | Passing source/runtime harness checks using actual decoded Three.js geometry; see the verification commands below. |
| Real browser regression sequence | 6 checks pass: 20 interrupted reveals → exact matrix error 0; visibility reversal; source-pose restoration; separation pauses; stable GPU resources (137 geometries, 2 textures); zero additional renders in 500 ms at rest. `artifacts/browser/interaction-checks.json` and final post-cleanup `interaction-checks-final.json`. |
| Optional asset failure | Deliberate missing catalog URL leaves the overview intact. Visible Retry catalog succeeds, all 364 renderable leaves become available, error clears. `catalog-failure.png`, `webmcp-validation.json`. |
| Context loss | Actual `WEBGL_lose_context` loss/restoration. Initial test found missing PMREM reflections; fixed by rebuilding the environment. Retest restores full appearance and 2 textures, error clears, source assembly error 0. `context-restored.json/.png`. |
| Catalog/UI | Searched source “Spirale”, selected and isolated the real hairspring, returned to prior shock context. Selected case/strap assembly and verified large-bounds framing. `hairspring-isolated.png`, `catalog-case.png`. |
| Local WebMCP | Read/configure/select tools exercised. Invalid reveal range, unsupported study group and invalid speed reject before changing state. `webmcp-validation.json`. |
| Keyboard | Cycle slider ArrowRight and Enter on Play/Pause update the visible control and shared clock; part search and DOM relationships remain available. Not a screen-reader user study. |
| Phone layouts | Actual browser viewport overrides 390×844 and 320×667. No horizontal document overflow; narrow viewport scrolls vertically to controls. Portrait timing view keeps active geometry and controls visible. `phone-heartbeat.png`, `narrow-phone.png`. These are emulations, not phone measurements. |
| Text/fallback | `?text=200` sets 32 px root font at 390 px viewport; document width remains 390 px, controls reachable by scrolling. `?no3d=1` exercises accessible mechanism descriptions and prepared real-CAD still. Custom test modes, not proof of OS/browser settings or actual missing-WebGL hardware. |
| Build/types/dependencies | Production build and TypeScript check pass; authored-code lint passes. The generated Shadcn `components/ui/` and `hooks/use-mobile.ts` are excluded from lint because the prescribed scaffold conflicts with its bundled accessibility/compiler lint rules; they remain in the TypeScript/build checks. `artifacts/browser/build.log`; `artifacts/dependency-audit.json` reports zero advisories on 9 September. Build retains a large-Three-chunk warning; no publication was attempted. |

All binary/visual evidence lives in ignored local paths. The screenshots were visually inspected, not used to claim exact pixel parity across devices. The independent CAD audit compares binary source transforms and optimized geometry bytes, which is stronger evidence for those invariants.

## Initial performance measurements (before material correction)

Host: **Mac mini, Mac16,10, Apple M4 (10-core CPU/10-core GPU), 24 GB RAM**. In-app Chromium identifies as Chrome 152.0.0.0 on macOS. Browser viewport 1440×900, pixel ratio 1; canvas varies as the focused panel/playback controls reserve space. Automatic quality did not reduce pixel ratio below 1. Dev server and cached loopback network, not a production or cold-network test.

The 60-second real-frame sequence had 1,200 samples in each 20-second phase:

| Phase | Mean interval | p95 | Maximum |
|---|---:|---:|---:|
| Assembled orbit | 16.667 ms | 17.0 ms | 17.7 ms |
| Timing study | 16.667 ms | 17.1 ms | 17.7 ms |
| Separated orbit | 16.667 ms | 17.3 ms | 17.7 ms |

Evidence: `artifacts/browser/benchmark-60s.json`. Frame intervals are measured without clamping (only simulation integration clamps unusually long intervals). A production build ran concurrently during part of this first sequence; no heavy asset conversion ran. This meets the provisional desktop p95-under-20-ms target on this host. It does not establish that target for other devices.

The five-minute sustained sequence completed 300.011 seconds with 18,000 measured intervals and approximately 60 fps throughout. Each phase accumulated 6,000 samples over five repeats: assembled orbit p95 17.7 ms, timing study 17.6 ms, separated orbit 17.6 ms; maximum interval across the run 18.8 ms. GPU counters ended at the same 137 geometries and 2 textures, DPR 1. Evidence: `artifacts/browser/benchmark-5min.json`. There was no observed desktop frame-rate degradation in this session; temperature, power and physical phone thermal behavior were not measured.

Overview compressed body: **4,751,211 bytes**, decoded GLB 9,834,792 bytes; compact manifest gzip 54,086 bytes. Optional complete catalog gzip body: 9,501,474 bytes. Real browser ResourceTiming confirms content encoding, including a fresh catalog transfer of 9,501,774 bytes with HTTP overhead. These figures exclude app JavaScript and fallback imagery. The opening asset retains full difficult geometry (up to 748,422 triangles, default variant exclusion renders 745,186). No decimation or LOD is claimed. Shared geometry and lossless compression preserve fidelity; this exceeds the provisional overview triangle range and requires actual phone profiling before release.

## Limitations and open gates

1. **Mechanical contacts and deformation remain unvalidated.** The balance amplitude (±180°), absolute direction and release window are authored. The pallet, impulse jewel, double roller, hairspring and an unmodeled upstream wheel are hidden during timing study; Source inspection restores them. This is neither a connected full running watch nor an escapement/spring simulation. The four train shafts use evidence-backed tooth counts and pivots; phase/contact fidelity needs expert review and further authoring.
2. **Source defects remain visible/documented.** The diamond leaf is empty; the invalid eccentric misses three faces in four instances. Additional invalid BRep/omitted-face and tiny-triangle exceptions are in `CAD_AUDIT.md`. No invented replacement geometry was added.
3. **Variants remain unresolved.** One overlapping setting-spring option is hidden by default and separately selectable. The case, straps, alternative dial/hand designs and support remain in the catalog. “Two faces” reveals the display gearing; a reviewed finished dual-dial/hand configuration has not been selected or presented as final. Material colors/roughness are reference-informed approximations.
4. **Actual device and human qualification remain open.** Older iPhone/Safari, midrange Android, Firefox, real pinch/tap behavior, screen-reader review, OS reduced motion, cold 10 Mbps/100 ms loading, physical thermal behavior, input latency instrumentation and the planned five-person comprehension exercise were not performed. The desktop sustained run cannot substitute for them.
5. **Publication remains deferred.** CAD/image redistribution rights, expert signoff and release approval are unresolved. No Site was registered, saved, uploaded or deployed. Code/documentation/provenance checkpoints alone are authorized for the private SSH remote. Local gzip middleware is verified; deployed hosting/caching is untested.

General free section planes, winding/setting animation, shock response/reset animation and additional variants remain the later work described in the plan. The current reveal openings expose the actual mainsprings without fabricated capped sections.
