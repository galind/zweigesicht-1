# Dial & hands implementation review

9 September 2026. Local-only implementation of `DIAL_AND_HANDS_PLAN.md`, extending the accepted static explorer. Preview: **http://127.0.0.1:4173/**.

## Dial crossfade — 10 September 2026

Follow-up user feedback requested a fade instead of instantly hiding the unselected display. Dial and hand-style changes now ease opacity over **420 ms** during the existing turnover. Outgoing hands retain their reviewed 10:10 fitted matrices and enamel retains its fitted appearance until hidden. Incoming leaves fade in; unchanged leaves stay opaque. Rapid reversal begins at the current opacity, and the fade completes independently of interrupted camera travel. Reduced motion skips it. Raw selection, mechanisms, All parts and Reset cancel it and restore the original opacity, transparency and depth-writing properties.

Both displays can briefly be visible during this transition; settled visibility remains exclusive. Outgoing leaves cannot be picked. Fading leaves are omitted from the contact-depth override so transparent dials cannot cast a solid ghost silhouette, and beauty visibility is restored even if that pass fails. No material profiles, source transforms or hand poses are edited. Actual rendered captures are under ignored `artifacts/browser/dial-fade/`, repeatable via `?inspect` → **Record dials**.

Verified **63 CPU/source checks**, seven state tests, TypeScript, authored lint and production build. Browser suites pass **25 cold desktop / 24 warm portrait dial checks** at **1280×720 / 390×844**, including partial outgoing/incoming opacity on real rendered frames, exclusive settled leaves, exact material restoration, all six hand styles, Back/Reset, recovery, camera ownership, stable resources and zero idle redraws. CPU checks cover midpoint opacity, unchanged outgoing fitted matrices, rapid reversal continuity, camera-independent completion, All parts cancellation, reduced motion and contact-pass failure cleanup.

All eight complete-separation browser checks also pass in the portrait viewport.

## Calmer dial turnover — 10 September 2026

User feedback requested a calmer transition that still makes the reversed faces obvious. The camera now interpolates its viewing frame as one rotation when its up direction changes, replacing the independent view/up arcs that produced a sideways tumble. Dial framing takes 1.05 seconds with eased starts and stops; the two endpoints and their framing remain unchanged. The watch passes through a level edge-on view. Radius remains safe, interrupted turns start from the displayed orientation, resizing rebases the up vector too, and reduced motion still lands immediately. Ordinary travel with an unchanged up vector retains its existing path.

Verified 61 CPU/source checks (including the actual frame callback with real OrbitControls), seven state tests, TypeScript, authored lint and production build. Browser dial suites pass **22 warm desktop / 23 cold portrait** checks at **1280×720 / 390×844**, including all six styles, Back/Reset, camera ownership, recovery and resources. Every rendered frame in each direction stays inside the viewport: maximum bounds **.821 desktop / .914 portrait** NDC. Each turn covers **3.022 radians**, with screen-right drift under **.080 radians**; the camera no longer tumbles sideways. Desktop's eight complete-separation checks pass. Local `?inspect` → **Record dials** records both directions for repeatable visual review; recordings and results are under ignored `artifacts/browser/dial-turnover/`.

The portrait movement suite also passes all **12 interaction checks**. A real pointer drag during the flip interrupts camera travel and retains the visitor's oblique view. The previously intermittent preparation-retry assertion reproduced with only **6.30e-13 mm** Cartesian roundoff after OrbitControls recovery. Its camera tolerance now matches the existing style-change check (**1e-9 mm**), with additional target (**1e-9 mm**) and up-vector (**1e-12**) checks. The original failure and passing cold repeat are retained in the evidence directory. Accepted finishes, exclusive faces, all six 10:10 poses, source geometry, complete separation and All parts are unchanged. Local preview only; no push or deployment.

## Accepted hand-time correction

All six fitted styles now show **10:10:00**. Dial A supports Fine, Lance and Open lance; Dial B supports Lance, Broad lance and Pear. Central Lance has been enabled after verifying bore/seat compatibility and correcting only its seconds-hand XY placement in the fitted view. Every original source occurrence and raw catalog pose remains intact. This supersedes historical statements below about unchanged fitted hand angles or excluded central Lance. See [HAND_TIME_REVIEW.md](HAND_TIME_REVIEW.md) for the exact adjustment and verification.

## Accepted visibility correction

After reviewing the implementation, the user requested **Movement, Dial A, Dial B** as mutually exclusive presentations. Dial A shows only the central dial and hands (22 external leaves); Dial B shows only the small dial and hands (21); Movement shows neither. Side switching swaps the displayed configuration. Orbiting around a chosen dial does not fit the opposite one. Independent hand preferences, source placements, accepted finishes, Back/Reset and recovery remain unchanged.

The original two-display implementation and its measurements below are historical. The correction supersedes its simultaneous-fitting statements. Updated verification and captures are in ignored `artifacts/browser/dial-exclusive/`.

Correction verification: 53 CPU checks, six state tests, all 20 live dial checks and 12 existing movement checks pass, along with TypeScript, targeted lint and production build. Every supported style has exactly its own face's 22 or 21 external leaves; no opposite-face occurrences appear. Central rendering is 459 beauty draw calls / 1,577,434–1,579,368 triangles; small rendering is 456 calls / 1,484,938–1,485,950 triangles. Loading/retry, interrupted input, Back, Reset, resource reuse and graphics/preparation restoration remain covered.

## Original implementation — presets and provenance

| Face | Supported hand styles | Default | Fitted leaves |
| --- | --- | --- | --- |
| Central (+Z) | Fine, Open lance | Fine | 22 |
| Small movement-side (−Z) | Lance, Broad lance, Pear | Lance | 21 |

Both displays coexist in every dial view: 43 unique external leaves, five blades (one central seconds) and five modeled bushings. The central silver dial includes its logo and applied markers. The small display uses the segmented carrier/enamel pair, twelve markers and three fixings. Exact memberships and defaults derive from [dial-configurations.json](../assets/authored/dial-configurations.json).

The original STEP SHA-256 remains `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. The existing optional catalog GLB is reused unchanged; no CAD repackaging, recentering, geometry edits or pose normalization was needed. Analytic bore, support, marker and fixing evidence, source-reference links and inherited defects are detailed in [DIAL_CAD_FINDINGS.md](DIAL_CAD_FINDINGS.md).

Excluded from fitted presets, retained in the raw catalog:

- Central Lance: the actual seconds bore is displaced **14.301839 mm** from the arbor; there is no centered occurrence for a complete trio.
- Loose Broad lance duplicates S18/S25: the selected S20/S26 assemblies already contain those shapes and their bushings.
- Curved carrier/enamel S1/S2: fixing axes miss the placed screws by **0.1 mm**, and marker radius is **8.25 versus 8.15 mm**.
- Straight-spoke S21: the same marker-radius mismatch, without a verified matching enamel occurrence.

The recovered central d27 mesh retains all 33,194 triangles, no missing triangulated faces and no degenerate triangles despite its invalid imported BRep. The small display retains a nominal 0.02 mm shaft/bushing axial gap and source press-fit overlaps. These are recorded source limitations, not repaired or certified mechanics.

Only fitted S28/d21 enamel receives the maker-referenced blue interpretation: color `#143a69`, transmission .3, IOR 1.5 and authored .1 mm optical thickness. The carrier/enamel source solids overlap by 3.477922 mm³ and share an outward plane; exact-instance polygon depth bias prevents coplanar flicker without moving either surface. Raw catalog red is restored during external inspection. The complete appearance ledger records this scoped interpretation separately; all 365 existing raw instance appearance/geometry/matrix records remain intact.

## Interaction and recovery

The compact **Dial & hands** popover becomes a bottom sheet at 700 px and below. It provides Movement/Central dial/Small dial and a face-specific Hands selector. Labels are short, with explicit selected states; no speculative hand icons or color/time configurator are added. Preferences are independent in memory for this viewer session. Reset returns to bare movement, Fine/Lance and the original camera.

Existing `side` remains the committed camera-side truth; the panel and side button agree with pending intent while the catalog loads. Central framing turns upright through the existing camera transition, and synchronizes Three r186's cached OrbitControls basis. Manual gestures cancel camera travel, including gestures during first-use loading. Style changes preserve camera position, target and up within floating-point rounding (portrait position residual 8.56×10⁻¹⁴ mm) and swap visibility atomically.

Mechanism, Separate and All parts return to bare movement while retaining styles. Back restores the fitted configuration and camera; raw catalog selection temporarily suppresses the fitted overlays and Back restores them. The 216-member spread contract is unchanged. One shared visibility method handles retargeting and render ticks, so excluded displays, case, straps and tooling cannot leak into fitted presets.

Catalog geometry is loaded once and cached. Both complete displays commit only after readiness; the accepted movement stays usable during loading. Latest face/style intent wins, Movement/Reset/navigation cancel obsolete intent, and failed requests retry only the current choice. Quality and treatment updates do not cancel a pending display. Source-catalog selection retains its existing retry flow. Context restoration and preparation retry preserve the active dial inspection and camera; disposed loads release their scene.

## Verification and local evidence

Evidence is under ignored `artifacts/browser/dial-and-hands/`; analytic results and the all-candidate source contact sheet are under `artifacts/dial-cad/`. Automated browser checks run through the same viewer methods used by the visible controls, with separate direct UI review.

Commands:

- `.venv-cad/bin/python scripts/cad/dial_fit_probe.py` — 50 original-source analytic checks.
- `node scripts/cad/review-runtime.mjs` — actual decoded assets, materials, state/controller, asynchronous races and source-matrix regressions.
- `node --test tests/experience.test.mjs` — defaults, invalid IDs, independent memory and movement inspection rules.
- In `explorer/`: TypeScript, targeted authored lint and production build.

The completed desktop and portrait suites each pass **20 dial checks and 12 established movement checks**. They cover all supported sets, independent preferences, rapid interrupted input, history, raw catalog isolation, graphics restoration, preparation retry, camera takeover, idle rendering and the unchanged 216-part layout. The CPU suite passes **53 checks**, state suite **six**, and both asset integrity/placement comparisons pass. TypeScript, authored lint and production build pass; the existing build-size and Node deprecation notices remain.

At desktop DPR 1, bare movement is 415 beauty draw calls / 1,405,290 triangles. Fitting both displays is 500 calls / 1,657,082–1,660,028 triangles across recorded styles: **+85 calls**, about **252–255k triangles**. All-style geometry warm-up reaches 165 (166 after outline selection), with eight textures. Repeated style changes share one catalog request and the settled view adds zero idle renders. Context recovery releases and reuploads GPU resources; it does not reload the catalog.

The reused catalog payload is **17,901,308 decoded bytes / 9,501,474 gzip bytes**. In the recorded cached local first use it loads in roughly 47–73 ms; preparation plus the camera transition settles in about 0.9 seconds. This is one local browser-session observation, not a device/network benchmark. Delayed delivery is separately tested with the development-only `dial-slow` fixture; it is not a claimed production latency.

Direct visual QA covers all five styles, both sides, oblique reflections/layering, complete reverse display via pointer orbit, desktop 1280×720, portrait 390×844 and narrow 320 px controls. No extra hand-color or time control was introduced. The Three r186 orbit-basis synchronization is covered by source tests and direct pointer review; recheck that adapter when upgrading Three. No physical-device, sustained thermal, human, screen-reader or expert mechanical review is claimed. Publication gates remain unchanged; no push, merge, upload or deployment is performed.

The local evidence gallery indexes 21 screenshots. Direct keyboard review confirms arrow/Space selection, visible focus, Escape dismissal and focus return to the trigger. At 320×740 the document width stays 320 px and the bottom sheet fits. During six-second catalog delivery, the side button changes pending Central to Small and completion respects it; Reset instead leaves bare movement after the catalog finishes. A visible 503 failure recovers through Retry dials. Loading copy describes pending fitting until both displays are ready.

`warm-resources.json` records two complete style cycles at 165 geometries, eight textures and one catalog transfer. The final build log and desktop/portrait result files sit beside the screenshots. The cumulative browser log retains resolved development/HMR errors and deliberate failure-injection events; it is not a zero-error claim for the whole development session. The final normal preview is open with the viewport override cleared. `PROGRESS.md` records completion; the unrelated `FINISHING_GOAL.md` is untouched.
