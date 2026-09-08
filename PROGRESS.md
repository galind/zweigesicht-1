# Zweigesicht — current execution state

Updated 9 September 2026. **Local implementation ready for engineering review.** **No Site has been registered, saved, uploaded or deployed.**

## Completed

- Reused verified original STEP files/provenance, `.venv-cad`, Blender, the 426-instance inventory and smoke tooling. No CAD installation or source reacquisition repeated.
- Astra High handled lead integration, difficult CAD/mechanical analysis and substantive independent runtime review. Sol Medium handled bounded source inventory/reference/provenance reports. Lead retained all application edits.
- Reproducible cached XCAF pipeline exports immutable source placements and shared geometry. Full source: 426 instances (365 leaves, 61 subassemblies); movement: 223 source leaves / 222 rendered. Eight assembled reference renders and maker-image comparison are recorded locally.
- Actual full movement preview, six mechanism reveals, both treatments/sides, orbit/zoom, two-scale separation, complete source catalog, isolation and contextual return implemented in `explorer/`.
- Regulation/going-train timing study uses geometry-corroborated tooth counts and maker 3 Hz rate. Deterministic pause/play/speed/seek/step controls work; unsafe contact/spring parts are explicitly omitted during illustrative motion and restored for source inspection.
- Lossless Meshopt + prepared gzip: movement body 4,751,211 B, catalog 9,501,474 B, exact decoded geometry/ID/matrix preservation. Real browser delivery and optional load retry verified. Full geometry retained; no LOD/decimation claimed.
- Responsive portrait panels, accessible DOM controls, keyboard seeking/playback, actual-CAD static fallback, WebGL context restoration including reflection regeneration, render-on-demand, quality hysteresis and local WebMCP controls implemented.
- 7 pure state/motion checks pass; 12 independent actual-controller regression checks pass (including explicitly stubbed PMREM lifecycle). Real browser six-check suite passes, including 20 interrupted reveals, exact reassembly, stable GPU counts and zero paused redraws. Screenshots cover all groups, components, context recovery and phone-sized layouts.
- Final TypeScript and production build pass; npm audit is zero. Authored-code lint passes; generated Shadcn scaffold lint conflicts are excluded explicitly, with TypeScript/build coverage retained.
- Desktop 60-second sequence on Mac mini M4/24 GB, Chromium152, 1440×900/DPR1: 16.667 ms mean, p95 17.0–17.3 ms across assembled orbit, timing and separation. Five-minute sequence completed with 18,000 intervals, p95 17.6–17.7 ms and maximum 18.8 ms; GPU counts stable at 137 geometries/2 textures. Real-device/thermal claims remain open.

## Evidence and limitations

Read `docs/LOCAL_REVIEW.md` for scope coverage, QA matrix, measured budgets and the limitations list; `docs/CAD_AUDIT.md`, `MECHANICAL_REVIEW.md`, `ASSET_REPORT.md`, `REFERENCE_COMPARISON.md` and `IMPLEMENTATION_REVIEW.md` contain detailed audits. Numeric/browser screenshots are in ignored `artifacts/browser/`; original/reference/CAD binaries remain ignored.

Source exceptions remain: one empty diamond, invalid eccentric with three missing tessellation faces in four instances, other invalid-BRep/tiny-triangle exceptions recorded by audit. Setting-spring and dial/hand variants need review. Material finishes, balance amplitude/direction/release window and reveal paths are authored interpretations. No expert mechanical contact approval, hairspring deformation, full faithful running watch, visitor study, physical phone/thermal or production network qualification is claimed. Deferred publication does not block local engineering.

## Services and checkpoints

- Preview: **http://127.0.0.1:4173/**; Vinext dev server session 76266, bound to loopback. Restart with `cd explorer && npm run dev`.
- `?inspect=1` offers regression, 60-second/five-minute performance and failure-recovery controls. `?no3d=1` and `?text=200` are explicit test modes.
- Private SSH remote: `git@github.com:galind/zweigesicht.git`. First coherent milestone `00fb905` committed and pushed. Final implementation/evidence checkpoint `ed04e13` committed and pushed successfully. No `gh` used.
- Source/derived CAD and source imagery excluded from Git and pushes. Code, documentation and provenance only are authorized.

## Review handoff and follow-up

The final post-cleanup browser suite (all six checks), 12 runtime regressions, seven state/motion tests, production build, TypeScript and authored lint passed. The local preview remains running, and reports/evidence are available. No required local engineering check remains pending for this review handoff.

Next review: inspect the six reveals, source catalog and clearly labeled timing study at the loopback preview. Further fidelity work needs reviewed pallet/roller contacts, spring deformation, variant choices and source-repair decisions. Qualify physical devices, cold networking and visitor comprehension before release. Publication and CAD redistribution remain deferred until explicitly approved.
