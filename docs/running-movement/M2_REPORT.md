# M2 — Source-rest escapement audit and bounded experiments

13 September 2026. **M2 remains incomplete.** The authorized fallback is delivered: verified source-rest audit, bounded sensitivity experiments, isolated harness inspection and recordings, and exact blockers. No full rigid operating cycle is accepted or implemented. Numerical engineering checks, AI visual inspection and external mechanical acceptance are separate; the latter has not occurred.

Started with a clean working tree on `codex/running-movement`, HEAD `d13654f` (M1), preceded by `05e2882` (M0). Read the project agreements/plans, M0 inventory/graph/probes/tolerances/unknowns, M1 brief/report, mechanical/animation and fitted-hand reviews; inspected the M1 evaluator, harness and tests. No branch change, push, merge, deployment, source redistribution, reviewer contact, M3 or M4 work. The visitor application, controls, materials, assets and independent dial behavior are unchanged.

## Findings that prevent an operating cycle

1. **Impulse jewel 112 penetrates pallet body 126 at the unchanged source pose.** Common volume is **0.004108035688 mm³**, identical at three Boolean refinements. The common-solid centroid is inside both original solids at three classification tolerances. Its nearest boundary distances are 0.1103883 mm to the jewel and **0.04954347 mm** to the body. Even the body's global stored topology maximum, 0.00440397 mm, is much smaller. This corroborates penetration independently of the zero minimum distance. The 0.04954 mm interior-ball radius is overlap evidence, **not** a measured minimum translation required to separate the parts or a physical manufacturing error.
2. **Body 126 intersects banking-candidate pin 200 occurrence 9**, with stable common volume **0.00002855072834 mm³**. Its interior witness is only 0.0021494 mm from body face 42; that face/boundary has approximately 0.002171 mm stored tolerance, and adjacent face 41 reaches 0.004206 mm. Depth is **numerically inconclusive at the unchanged 0.001 mm budget**. Neither this source pose nor a nearby distance-zero pose is an accepted banking limit.
3. **Escape wheel 233 / pallet jewel occurrence 4 has a source gap of 0.000967833553 mm**, inside M0's 0.001 mm ambiguity band. Refinement and opposing normals support a close, separated nominal BRep configuration; they do not establish an intended lock. Jewel occurrence 3 is separated by 0.09335439764 mm.

No amplitude, operating direction, phase, bank endpoints, initial alignment correction or release interval has been selected. Those fields remain null in [M2_EVIDENCE.json](M2_EVIDENCE.json). The retired illustrative parameters are not imported. Correcting the source by an arbitrary initial balance or pallet jump would conceal the first finding, not solve it.

## Identity, rigid membership and coordinate evidence

The original assembly SHA-256 remains `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`; maker URL and source hash remain in [the unchanged manifest](../../assets/source-manifest/sources.json). Every audited occurrence in [M2_EVIDENCE.json](M2_EVIDENCE.json) carries its complete source path, runtime ID, definition, source name, M0 ownership rationale, URL/hash and unchanged world matrix. The local audit covers **18 definitions / 24 occurrences**, including support comparisons. Full face records remain local in `artifacts/mechanics/running-movement/m2/source-rest.json`.

For readable suffixes below, `P` is `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`. Numbers after `/` denote descendant source labels, not a second runtime transform.

| Rigid set / context | Source occurrences and definitions | Evidence and limit |
| --- | --- | --- |
| Balance | P7/108:1/109:1–8: rim 110, four eccentrics 111, impulse jewel 112, staff 113, double roller 114; P7/108:2 collet 115 | M0/M1 shaft at `(0,-10,-2.65)` mm; nine leaves. Local face validity/tolerances rechecked. Eccentric 111 remains the previously documented invalid BRep; it is retained visually, not used as a reliable contact solid. |
| Pallet | P13/125:1–6: body 126, staff 127, two jewels 128, horn component 129, safety piece 130 | Shaft at `(-0.999949089451,-7.0657025,-1.56)` mm; six leaves. The source-rest impulse-jewel interaction is with **body 126**, not merely the separately named horn 129. Testing only 112/129 would miss the penetration. |
| Escape | P62/232:1–3: wheel 233, staff/pinion 234, hub 235 | Shaft at `(-1.999898178902,-4.131405,-4.14)` mm; three leaves. M0's independently corroborated 20 teeth retained. |
| Banking candidates | P54/194:8 and :9, both brass pin 200; fixed main-plate host | Analytic cylinders of radius 0.2/0.15 mm; XY axes `(-1.124326925459,-9.273853344918)` and `(0.446942058412,-8.738396735728)` mm. Only occurrence 9 intersects the body at rest. Intended bank angles and pin-setting interpretation remain unresolved. |
| Other support checks | Pallet bridge 133, both locating pins 135, main plate 195 | Compared to body 126, horn 129 and safety 130. Support comparison is not an exhaustive whole-movement collision audit. |
| Spring context | Actual 116, collet 115, both source stud 117 occurrences and pin 118 | M0 terminal-center evidence retained. Spring is undeformed; no rigid owner/deformation law added. Mixed assembly 108 never receives blanket motion. Exact fixed-stud choice and full attachment frames remain M3 questions. |

All lengths are **STEP world mm**, volumes mm³, angles radians about **right-handed world +Z**. Row-major matrices act on column vectors. Negative source-local Z directions do not reverse this convention. The existing M1 composition remains `presentation × T(pivot) × Rworld(delta) × T(-pivot) × immutableBase`; each rigid leaf moves once. Source-rest deltas are identity. No native kinematic constraints were recovered; named assemblies and analytic axes support ownership, not complete operation.

## Precision and source-rest contact method

[`m2_audit.py`](../../scripts/mechanics/m2_audit.py) reuses the existing hash-verified STEP/XCAF importer and local environment. A source-hash-keyed local BRep cache avoids repeated full import; its manifest records OCP version, importer hash and per-file hashes, checked before reuse. It does not repair, retessellate or export viewer assets. Face numbers are one-based unique `TopExp` traversal indices for this recorded importer/cache, not universal STEP entity IDs.

Each face records surface type, area, center, face tolerance and the maximum tolerance of its boundary edges/vertices. Every selected definition has a validity result. A globally valid BRep can still exceed the contact budget locally: 126, 129, 133 and 195 have such boundaries. The fork/body surfaces involved in the substantial jewel penetration include precise planar/cylindrical faces; bank faces 41/42 are specifically unreliable at 1 µm. Roller 114's relevant safety-cylinder boundary maximum is 0.00072138 mm, below the ambiguity budget but not negligible. The relevant escape/jewel tip and plane faces have 1e-7 mm boundary tolerances; the incident wheel cap can reach 1e-5 mm. These are stored CAD tolerances, not calibrated physical uncertainty distributions.

For **26 source-rest pairs**, trimmed BRep minimum distance was recomputed with deflection 1e-5, 1e-6 and 1e-7 mm. Final distance spread was zero for these pairs. Non-destructive solid common was repeated at fuzzy values 1e-7, 5e-8 and 1e-8 mm; common results are valid and volumes stable. At each witness the script finds incident **trimmed** faces, projects to their surfaces and records oriented normals, respecting reversed faces. Edge/corner witnesses retain multiple normals rather than inventing a unique normal. Maximum eight witnesses are inspected and two retained in the compact report; full witness counts/truncation flags remain explicit.

For penetration, a nearest-distance witness can lie inside one solid and therefore have no surface normal on that side. It is not treated as contact. [`m2_experiments.py`](../../scripts/mechanics/m2_experiments.py) separately classifies the common centroid against each original solid at 1e-5/1e-6/1e-7 mm and measures distance to every boundary face. This supplies the substantial overlap evidence above. Boolean, distance and classifier calculations share OCP; they are different geometric checks, not independent CAD kernels.

| Source-rest pair | Distance / mm | Classification |
| --- | ---: | --- |
| Escape 233 / jewel 128 occurrence 3 | 0.093354398 | Separation |
| Escape 233 / jewel 128 occurrence 4 | 0.000967834 | Numerically inconclusive within M0 ambiguity band; nominal positive gap, near-opposing face normals |
| Impulse 112 / body 126 | 0 | Corroborated penetration; no accepted moving contact |
| Impulse 112 / horn 129 | 2.011680532 | Separation |
| Impulse 112 / safety 130 | 0.090000000 | Separation |
| Roller 114 / body 126 | 0.120351784 | Numerically inconclusive under conservative local-boundary precision rule |
| Roller 114 / horn 129 | 1.843610588 | Separation |
| Roller 114 / safety 130 | 0.023020981 | Separation; opposed cylinder/plane normals |
| Body 126 / pin 200 occurrence 8 | 0.529280489 | Separation |
| Body 126 / pin 200 occurrence 9 | 0 | Intersection detected; local depth/precision inconclusive |

Remaining support comparisons and their precision flags are in the machine-readable report. **No pair is accepted as intended operating contact.** Even the analytic tangent-box method test remains “numerically inconclusive” without contact intent. No positive penetration budget was introduced. Large positive support gaps can conservatively remain inconclusive when incident boundary precision exceeds the specified rule; this does not assert that those large gaps are collisions.

## Bounded experiments and between-sample limits

Only after the rest audit, each shaft was perturbed independently in both signs about zero. The extent is **0.005 mm divided by a conservative monitored-surface XY radius bound**, not an operating amplitude or a search for convenient endpoints. The bounds use the corners of OCP optimal bounds with stored tolerance enabled. They cover the monitored contact surfaces, not every component on the shaft (in particular not the invalid eccentric BRep).

| Shaft | Monitored radius bound / mm | Symmetric extent / rad | Fine poses |
| --- | ---: | ---: | ---: |
| Balance (112/114) | 1.414227705 | ±0.003535498551 | 81 |
| Pallet (126/129/130 and both 128s) | 3.260961218 | ±0.001533290237 | 81 |
| Escape (233) | 3.673795621 | ±0.001360990244 | 81 |

All **243 poses** use ≤0.000125 mm monitored travel per interval. Independent coarse recalculation at twice the spacing and a different distance deflection agrees at common points (maximum difference zero). This is stricter than M0's 0.0005 mm proposed travel limit, without changing it. The checker also verifies observed distance changes against the radius × angular-travel bound.

Distance-to-set is Lipschitz under the bounded rigid displacement: for each monitored pair, a missed distance change between fine samples cannot exceed 0.000125 mm in the ideal represented geometry. This does **not** exclude small contacts inside the ambiguity band or establish continuous collision freedom. Source tolerance, finite sampling and unmonitored parts remain limitations. The source interior witness is sufficiently deep that these 5 µm independent perturbations cannot resolve the jewel/body penetration; all sampled jewel/body distances remain zero. Bank-9 distance also remains zero, with its original precision blocker unresolved.

The held-pallet escape experiment crosses a local tip/plane threshold. [`m2_event.py`](../../scripts/mechanics/m2_event.py) independently rotates the original escape tip as a point and evaluates its signed distance to jewel-4 plane/normal. Source signed gap agrees with the trimmed BRep gap to arithmetic precision. Bisection gives a zero bracket of **[0.0004119899763, 0.0004119925722] rad**, then checks finite BRep neighborhoods on both sides. The BRep 1e-7 mm distance threshold occurs slightly earlier, as expected. Brackets were halved from 1e-8 to 5e-9 rad. At ±0.0001 mm signed plane margin, the positive side has a gap and no common solid; the negative side has a stable positive common volume (~8.67e-8 mm³). The point/plane oracle does not certify the whole flank or a complete contact sequence.

This is an **experimental collision threshold against a held pallet**, not an accepted lock/unlock/drop event. There is no justified operating-time mapping; M0's ≤1e-5 s physical event-time criterion cannot be evaluated. Neither operating half-cycle has been solved or qualified. Escape advance/dwell, balance/pallet timing, recoil, impulse and drop remain unsupported. M0's 20 teeth and inherited 3 Hz reference are consistent with conditional count arithmetic, but do not justify a phase or two-sided cycle here.

## Harness, visual evidence and recording

Launch from the repository root:

```sh
./explorer/node_modules/.bin/vite --config scripts/mechanics/harness/vite.config.mjs
```

Open **http://127.0.0.1:4188/**. The existing server was reused; a duplicate launch correctly reported port occupied after loopback permission was granted. The server is development-only and binds loopback. The visitor remains separate. No generated CAD is copied by harness builds.

1. Choose **Start source-centered sensitivity**, then an Audit shaft. The start is exactly source rest. The three extents above remain fixed, labeled experimental bounds.
2. Choose **Impulse jewel / body macro**, **Body / banking pin macro**, or **Escape / pallet jewel macro**. The contact cutaway omits surrounding plates/trains from view and retains 24 source meshes: all 18 rigid balance/pallet/escape leaves, the actual hairspring, both studs/pin, and both banking pins. It does not move a contact component out of the way. Disable the cutaway for all 222 renderable movement leaves. Raw inspection bypasses the cutaway and restores exact bases.
3. Select an annotated key pose and **Inspect key pose**. The 16 s inspection path goes source → positive extent → source → negative extent → source, with no initial offset. These are two independent sensitivity excursions, **not operating half-cycles**. The extra escape tip/plane threshold key selects the escape experiment and its refined angle. Play/pause, speed and absolute seeking use the M1 clock; times beyond the inspection's 16 s limit reject, and playback stops at the final source return.
4. The annotation exposes the stationary hairspring's inner-center mismatch during balance experiments: approximately **0.00175684 mm** at either bound, exceeding the 0.001 mm proposed anchor budget. This is a center diagnostic derived from M0, not a full terminal-frame or deformation check. The spring's actual source geometry remains unchanged, and no regulation feasibility is implied.
5. **Record 16 s sensitivity to local artifacts** emits 481 prescribed samples at 1/30 s inspection-time spacing. Keep this tab foreground. It renders into a 1280×800 annotated recording canvas and saves via a restricted loopback endpoint to `artifacts/mechanics/running-movement/m2/sensitivity-{shaft}-{view}.webm`. Recording locks controls and cleans up its stream; interrupted recordings report failure. Wall duration includes rendering/encoding overhead and is not a calibrated real-time mechanical rate.

Recorded and decoded locally: `sensitivity-balance-impulse.webm` (**17.31 s wall duration**) and `sensitivity-escape-escape-contact.webm` (**17.34 s**). Both decode successfully to **480 video frames** from 481 submitted inspection samples; the encoder coalesced one frame. Their decoded last frames explicitly show t=16.000 s and zero source-relative angle. Both contain the full 16 s prescribed source-return sequence and persistent “not a running escapement” / known-penetration / undeformed-spring captions. Sampled chronological frame sheets were visually inspected. Motions are intentionally tiny at these bounds; they are not enlarged to appear like operation.

Eleven actual-renderer captures cover both signs for all three shafts, the refined escape threshold, repeated seeking, raw inspection and paused restoration. All rigid contact leaves and source spring remain visible in the cutaway; all 364 loaded catalog matrices have flat local/world ownership. Maximum CPU/renderer computed-matrix difference is **3.3306690738754696e-16**, below M0's 1e-10 budget; repeat seek/raw restoration is exact.

AI visual review used the Codex in-app browser (Chromium **152.0.0.0**, macOS) at **1280×720**. Screenshots: `source-impulse.png`, `source-bank.png`, `escape-threshold.png`, `regulation-spring-mismatch.png`; frame sheets: `balance-recording-frames.png`, `escape-recording-frames.png`. Camera positions/targets/FOV are in `renderer-captures.json`. Macro scales at the target are ~350.03 CSS px/mm for impulse/bank and ~221.21 for escape. A quarter pixel corresponds to ~0.000714/0.001130 mm respectively. Existing viewer tessellation is insufficient to certify those contact budgets; the 0.001 mm BRep band was not relaxed to match the mesh. These are desktop engineering views, not external mechanical, physical-device or user acceptance. No final browser warnings/errors were recorded.

## Verification commands and results

All final checks pass for their stated scope. Large outputs, BReps and recordings remain ignored under `artifacts/mechanics/running-movement/m2/`. The compact evidence retains hashes of its detailed inputs and scripts. Reproduce in this order with the existing `.venv-cad`, original STEP and M0 inputs:

```sh
.venv-cad/bin/python scripts/mechanics/m2_audit.py
.venv-cad/bin/python scripts/mechanics/m2_experiments.py
.venv-cad/bin/python scripts/mechanics/m2_event.py
python3 scripts/mechanics/m2_summarize.py
python3 scripts/mechanics/m2_verify.py
.venv-cad/bin/python tests/m2-contact.test.py
node --test tests/m1-foundation.test.mjs tests/m2-audit.test.mjs
node scripts/mechanics/harness/check-m2-captures.mjs
node --test tests/experience.test.mjs
node scripts/cad/review-runtime.mjs
python3 scripts/mechanics/m0_inventory.py --check
python3 scripts/mechanics/m0_verify.py
./explorer/node_modules/.bin/tsc -p scripts/mechanics/harness/tsconfig.json
./explorer/node_modules/.bin/oxlint scripts/mechanics/harness/*.ts scripts/mechanics/harness/*.mjs tests/m2-audit.test.mjs
./explorer/node_modules/.bin/vite build --config scripts/mechanics/harness/vite.config.mjs
git diff --check
```

The capture checker requires the local 11-capture workflow above; missing evidence fails rather than silently skipping. Four analytic-solid method tests cover positive separation, tangent contact that must not be accepted, known box overlap/interior depth, and a sub-budget gap. Twelve JS groups include nine existing M1 groups plus dense independent quaternion checks, exact sensitivity endpoint restoration, invalid intervals and the spring mismatch oracle. Existing ten state tests and all 88 source/runtime checks pass. M0 census/hash/graph checks pass. The harness TypeScript, lint and build pass; the build retains the existing large-chunk notice. Visitor-source preservation is checked separately by zero diff under `explorer/`, `assets/authored/` and `assets/source-manifest/`.

Video decoding reused `/private/tmp/frost-review-deps/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1`, already available from prior work. Example actual review command:

```sh
/private/tmp/frost-review-deps/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1 -i artifacts/mechanics/running-movement/m2/sensitivity-escape-escape-contact.webm -vf 'select=eq(n\,0)+eq(n\,120)+eq(n\,240)+eq(n\,360),scale=480:-1,tile=4x1' -frames:v 1 artifacts/mechanics/running-movement/m2/escape-recording-frames.png
```

The first cold source load reused the known nonfatal importer diagnostic; no source repair followed. Intermediate tooling issues were resolved: default Python has no OCP (use `.venv-cad`), a browser label locator was replaced by its actual combobox role, sandbox loopback listen required the existing authorized server, and interior Boolean corroboration was made non-destructive so it does not alter input tolerances. None changed M0's thresholds.

## Acceptance and M3/M4 readiness

| M2 deliverable / criterion | Result |
| --- | --- |
| Source-linked rigid identities, axes, membership and precision | Delivered, with invalid eccentric and local contact precision exceptions recorded |
| Source-rest contact/clearance distinctions | Delivered for 26 specified pairs; penetration, separation and inconclusive cases distinguished; intended operating contact remains unaccepted |
| Full-cycle rigid model and source-to-operating alignment | **Not met**: source jewel/body penetration, bank uncertainty and no evidenced alignment/operating parameters |
| Both operating half-cycles, event timing, escape advance/dwell | **Not met**: only bounded independent sensitivity and one geometric threshold; no physical time assignment |
| Essential parts, inspection and recording | Delivered for the bounded audit; no complete operating-cycle recording claimed |
| External mechanical acceptance | **Open**, distinct from passing numerical tests and AI visual inspection |

**M3 is not ready to adopt a shared operating amplitude/phase.** Its previously recorded missing full terminal frames, exact fixed stud, converged centerline and spring precision remain unresolved. The visible mismatch reinforces why the undeformed source spring cannot be presented as a working regulator. No spring deformation or terminal reconstruction was attempted.

**M4 cannot begin from an accepted M2/M3 solution.** It still needs a source-linked collision-free rigid cycle, banking/safety/impulse review, a constrained source-derived spring model and external mechanical judgment. No completion estimate is justified by this audit.

**Next recommended experiment:** reconcile the original assembly relationship between jewel 112/roller 114 and body 126 using the existing source occurrence matrices and local fork-slot/jewel mounting faces. Establish whether the source represents a displaced assembly state or incompatible placements, and obtain an evidenced source-to-operating alignment before applying any correction. In parallel only within a separately authorized scope, audit/reconstruct body bank faces 41/42 against the source surfaces and pin axes with independent residual checks below the existing 1 µm budget. Keep originals immutable and proposed repairs separate. Then re-run source-rest/contact checks before searching for either lock/unlock/impulse/drop half-cycle. External review needs the exact source-state interpretation, permissible banking geometry and supported amplitude/phase—not a visually plausible animation. No reviewer was contacted.
