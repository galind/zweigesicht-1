# M1 — Motion foundation verification

13 September 2026 (work began 12 September). **Complete as an isolated numerical/inspection foundation.** This is not a running-watch or regulation acceptance. M2 and M3 have not begun. Work started from clean `codex/running-movement` at `05e2882`; no other branch, push, merge, deployment, CAD redistribution or reviewer contact was performed.

## Deliverable and local launch

From the repository root, with the existing explorer dependencies and prepared local assets:

```sh
./explorer/node_modules/.bin/vite --config scripts/mechanics/harness/vite.config.mjs
```

Open **http://127.0.0.1:4188/**. The server binds loopback only and fails if the port is occupied. It is separate from the visitor server at port 4173. No visitor route, state field, control, material, asset, or independent dial preference was changed. The harness imports the existing `handDisplayMatrix` read-only. Its Vite cache and optional build output live under ignored `artifacts/mechanics/running-movement/m1/`; its build does not copy CAD assets.

The harness uses the current hash-named catalog GLB and Meshopt decoder. It loads 364 actual STEP-derived meshes and retains all 365 leaf bases, including the empty STEP diamond 225 metadata. It does not implement the viewer's separate maker-STL diamond recovery. All 222 renderable movement leaves remain present, including the original overlapping setting-spring alternatives. Selected hand sets add six Three hands and/or four Skeleton blades/supports; mutually exclusive styles are not shown together. Full dial surfaces, case/strap alternatives and visitor finish rendering are outside this hand/shaft fixture view. The diagnostic source shading is not an appearance replacement or mechanical contact measurement.

## Contract and ownership

- [`foundation.ts`](../../scripts/mechanics/harness/foundation.ts) is pure: `evaluate(timeSeconds, operatingState, parameterSet)` has no Three.js, scene, integration, wall-clock or graph-execution dependency. It returns one world-space rigid delta per shaft, elapsed signed turns, reduced phase, status, all relationship diagnostics, deformation handles and unset operating parameters. Same-input output is exactly repeatable in one JS runtime.
- [`parameters.ts`](../../scripts/mechanics/harness/parameters.ts) is a fresh M1 parameter adapter. Six E-MECH shaft axes/memberships come from M0's graph; five E-HANDS hand/support fixture axes come from reviewed fitted arbors. Every pivot, axis and fixture rate/phase carries units, frame, evidence ID, derivation, confidence and review status. Shaft membership has its own provenance. M0 graph data is read as evidence, never traversed as a driver network. The retired `motion-evidence.json` and `illustrativeCycle` are not runtime imports.
- Matrices are flat **row-major**, acting on column vectors. Lengths are STEP world **mm**, angles are **radians about right-handed world +Z**, clock time is **seconds**, wall anchors are monotonic **milliseconds**, fixture rate is **turn/s**, phase is **turns**, clock speed is dimensionless. Negative turns retain their sign; the displayed fractional phase is reduced to `[0,1)` only for trigonometry. Opposite local Z axes and viewing directions never change the world sign.
- The 11 shafts own 47 distinct leaves: balance 9, pallet 6, escape 3, seconds 2, third 2, center/minute 3; fitted blades/supports 22. CAD assembly nodes receive no transform. Mixed assembly 108 is excluded. Roller, impulse jewel, both pallet jewels, fork and safety member all retain rigid membership. Center and seconds are distinct despite coincident XY axes. Hand fixtures remain separate from their unproven upstream drive shafts.
- [`bases.ts`](../../scripts/mechanics/harness/bases.ts) copies and freezes all 365 original bases and invokes the existing fitted-hand calculation once per leaf at initialization. The C9 Lance seconds XY correction is therefore already inside its fitted base. It is never separately reapplied during evaluation, seeking, style changes or restoration.
- Each rendered leaf uses `presentation × T(pivot) × Rworld(delta) × T(−pivot) × base`. Flat scene parenting prevents inherited double rotation. Raw inspection returns the exact stored source base and bypasses presentation. Leaving raw restores the saved paused operating time and fitted base. Source-rest evaluation has identity mechanical deltas; fitted hand rest remains reviewed 10:10:00. Presentation cover lift (12 mm), cameras and orbit have separate ownership; no deformation is manufactured.

`sourceRest`, `fixture`, and `connected` are distinct operating states. A fixture drives **one explicitly selected shaft** at an arbitrary constant rate; the UI's initial 0.025 turn/s and zero phase are M1 experiment inputs, not a balance frequency/amplitude or accepted operating phase. Every other shaft is labeled unresolved/held at base. `connected` is non-executable: all shafts stay at bases, diagnostics remain open, and Play is rejected. R08 retains its rejected-candidate status; the other 36 edges expose their unresolved operating relationships and underlying M0 evidence. Balance amplitude, escapement phase, barrel couplings and spring law remain null. Spring 116 and both 88 occurrences have explicit unresolved handles and unchanged geometry.

The clock rebases only at play/pause, seek, speed or visibility events; sampling does not update its anchor. Hidden tabs freeze elapsed time and rebase on return. Raw inspection pauses and disables mechanical edits. The harness starts paused. Zero speed settles rendering; orbit/presentation can still request a frame. Rendering reads `performance.now()` at callback execution, avoiding an older queued animation-frame timestamp after a UI event.

Negative/nonfinite time and times beyond **43200 s** throw explicit errors. This is the M0 12-hour numerical qualification interval, not power-reserve behavior. Fixture output beyond **65536 turns** also throws rather than losing unbounded phase precision. Unsupported axes, duplicate ownership, invalid rates/phases, unknown states/shafts and nonmonotonic clock inputs fail explicitly. Reaching an invalid interval stops drawing with the error visible; seek back into the supported interval to recover. There is no silent time wrap or exhaustion simulation.

## Reproducible demonstration

1. Start at Source rest, Regulation close-up. Toggle **Lift covers 12 mm** and orbit to inspect source spring, roller/fork context and both pallet jewels. This lift is a presentation experiment, not a service sequence.
2. Choose **Independent shaft experiment**, shaft `balance`, rate `0.025`, initial phase `0`. Seek to **1 s**: the balance members have a +9° independent delta; the undeformed spring and adjacent contact parts remain present. Disconnection or overlap here is an expected limitation, not accepted operation.
3. Open **Pose evidence**, click **Capture pose evidence**. Capture pauses and records actual local/world mesh matrices. Seek to 120 s, then back to 1 s and capture again. The matrices must match exactly. Enter raw, capture exact source matrices, then leave raw and capture the same paused operating matrices. Mechanical edits are disabled while raw.
4. Enable Three hands blades/supports, select Lance, choose shaft `central-seconds`, camera Three hands and seek **10 s**. The blade/support fixture turns +90° about the central arbor, with hour/minute bases unchanged. Repeat with Fine/Open lance. Enable Skeleton and test Lance/Broad lance/Pear with `small-minute`. These are independent transform fixtures, not synchronized time displays.
5. Play, Pause, change clock speed to 0.25, resume and pause again. Seek −1 to see explicit rejection, then seek 43200 to inspect preserved elapsed turns. Choose Connected operation and try Play: it must refuse while retaining the unresolved diagnostics.

Browser evidence was captured using the visible controls via CUA in desktop Chrome **152.0.0.0** on macOS. Recorded viewport: **1197×1354 CSS pixels**; earlier visual inspection also used 1280×720. Reviewed regulation with lifted covers, fitted central Lance and Skeleton Pear, both camera directions, raw/operating return, and responsive camera framing. This is engineering visual review, not user appearance acceptance, real-phone, thermal, screen-reader or cross-GPU qualification.

## Acceptance evidence

| M1 criterion | Recorded result |
| --- | --- |
| Deterministic direct seeking, sample-rate independence | Nine test groups pass. Independent 30/60/144 Hz histories, backward/forward seeks, rational phase samples through 12 hours and endpoint elapsed turns. Real renderer repeated 1 → 120 → 1 s captures are exact. |
| Pause/resume, speed and hidden time | CPU event arithmetic independently verifies pause, 0.25×/2× speed, hidden freeze/rebase and resume; live browser play/pause and speed changes preserve increasing absolute time. Hidden-tab handler is wired; browser tab-suspension scheduling is not separately certified. |
| Invalid input | Negative, NaN, infinities, over-interval time, excessive turns, malformed ownership/axes and nonmonotonic clock inputs reject. Browser −1 rejects; 43200 succeeds; connected Play rejects. |
| World axes and once-only rigid ownership | Hand-calculated quarter-turn landmarks and an independent Three.js quaternion oracle cover all 47 owned leaves, including opposite child-local Z directions, all rigid contact members and separate center/seconds axes. Independent distance checks preserve rigidity; presentation rotation/translation is applied last. |
| Exact restoration | All 365 source/fitted arrays are frozen. CPU repeated round trips retain exact stored source and fitted bases. Real renderer raw matrices equal source matrices exactly; all 364 local/world matrices match flat ownership. Leaving raw restores saved operating matrices exactly within the same browser. |
| Every supported fitted hand style | All 15 blades and seven supports, six styles and all nine style pairs pass independent bore/tip/support checks at 0, 10 and 43200 s. C9 raw bore is `(12.4254391598701, 7.08174217766239)` mm; fitted bore remains at `(0,0)` under the fixture. Six real-renderer captures cover all six styles and contact/spring presence. |
| Numerical budgets | CPU independent matrix/landmark checks use ≤1e-10; cross-runtime fitted/computed matrix maximum was **3.3306690738754696e-16**. Exact same-runtime restoration is checked separately from computed comparisons. These are numerical checks, not M0 contact/anchor precision acceptance. |
| Unknowns are visible | 37 edge diagnostics, three spring handles, four unset operating parameters; no connected-ready claim. Essential movement components remain visible/present. Camera occlusion is possible, with orbit and cover lift available. |
| Existing viewer preserved | Zero code/asset diff under `explorer/`, `assets/authored/`, or `assets/source-manifest/`. All 88 existing source/runtime checks, 10 state tests, explorer lint, TypeScript and production build pass. |

Commands actually run from the repository root (all final checks pass):

```sh
node --test tests/m1-foundation.test.mjs
./explorer/node_modules/.bin/tsc -p scripts/mechanics/harness/tsconfig.json
./explorer/node_modules/.bin/oxlint scripts/mechanics/harness/*.ts scripts/mechanics/harness/*.mjs tests/m1-foundation.test.mjs
./explorer/node_modules/.bin/vite build --config scripts/mechanics/harness/vite.config.mjs
node --test tests/experience.test.mjs
node scripts/cad/review-runtime.mjs
python3 scripts/mechanics/m0_inventory.py --check
python3 scripts/mechanics/m0_verify.py
node scripts/mechanics/harness/check-captures.mjs
(cd explorer && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build)
git diff --check
```

The capture checker consumes local `renderer-poses.json` (poseOne/rawPose/restored plus repeat-seek result) and `all-styles-renderer.json` (three paired style captures), produced by step 3/4 using **Capture pose evidence**. It checks each rendered matrix against the evaluator/base contract, raw source exactness, world ownership, required component presence and all six styles. It is an integration check; the separate CPU tests supply independent geometric and timing oracles. On another machine, reproduce these capture files through the same visible workflow before running the checker. Missing evidence causes failure, not a skipped pass.

Ignored evidence directory: `artifacts/mechanics/running-movement/m1/`. It contains numerical/runtime/M0 logs, renderer captures and checker result, `browser-interactions.json`, and reviewed `regulation-experiment.png`, `lance-seconds-quarter-turn.png`, `skeleton-pear-quarter-turn.png`. Original STEP and existing catalog/probe caches were reused; M0 verification rechecked source/input hashes. No new CAD extraction or download was necessary.

Intermediate failures were resolved: addon alias paths in the standalone Vite config; sandbox loopback listen (authorized local-server escalation succeeded); the initial cover index list; queued rAF/event ordering; narrow-aspect camera framing; and an overly strict cross-runtime computed-matrix comparison (restoration remains exact; computed comparisons use the pre-existing 1e-10 proposal). Initial broad lint also read generated Vite dependencies; the cache now lives in ignored artifacts and final lint targets authored files. Build retains large-chunk warnings; the visitor build also retains its Node deprecation notice. Expected source/diamond loading fault injections in the existing CPU suite are passing negative tests. Final browser captures record no console warnings/errors.

## M2/M3 readiness and next recommended experiment

**M1 has no blocked acceptance criterion.** It enables inspection of future poses; it provides no new escapement contact or spring feasibility evidence.

**M2:** ready for a separately authorized source-rest contact/precision experiment, not for choosing a running cycle. Start with the existing actual escape wheel 233, both pallets 128, roller/impulse jewel 114/112, fork/safety 129/130 and audited shafts. Audit local BRep tolerances on the relevant contact faces; reconcile the source-rest contacts using normals/intersection evidence and distance convergence. Record intended contact versus penetration before selecting phase, banking or amplitude. The existing sparse 30-pose distances do not establish these inputs. Do not restore retired ±180°, 0/−12° or 42–58% defaults.

**M3:** the source spring and unresolved deformation handle are ready for investigation, but complete terminal frames, the exact fixed stud occurrence, converged centerline/rest geometry and a shared justified amplitude/phase remain missing. The spring's 0.008430963 mm maximum stored topology tolerance exceeds the proposed 0.001 mm budget; audit local terminal precision rather than relaxing that budget. No spring law or repair was attempted in M1.

Recommended next experiment: **source-rest escapement contact and local precision audit**, using existing probes and this harness only as visualization. M3 terminal-frame/centerline investigation can be separately scoped, but cannot accept a deformation over an invented amplitude. M4 remains the integrated regulation feasibility gate; external mechanical review, human review and release gates remain open.
