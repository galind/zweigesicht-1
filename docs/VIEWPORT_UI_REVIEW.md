# Movement-first explorer UI — 11 September 2026

## Information architecture

The movement owns a stable, full-width canvas between a single-line identity/history area and a compact action dock. There is no permanent footer, affiliation block, separation slider, or empty selection region. Attribution and the independence statement are in About & sources.

- **Explore:** the whole movement and six mechanisms.
- **All parts:** a standalone dock toggle for the parts spread; pressing it again returns to the whole movement.
- **Dial & hands:** a standalone dock button for display and hand-style choices.
- **Separate:** assembly or section separation, a visible percentage, and contextual Uncover. In All parts this becomes Arrange, with Fit all and group framing.
- **Switch side / Reset:** always in the dock; compact labelled icons on portrait phones, text on larger screens. Reset closes panels and restores the opening movement state.
- **Selection:** a compact heading and Details near the top; component selection adds Isolate/Show context and Deselect.
- **Options:** keyboard-equivalent camera controls, quality, source catalog, and About.

Only one edge panel opens at a time. All panels open above the bottom dock. Explore, Dial & hands and Separate align with their own trigger; reading/options panels align with the dock. Horizontal clamping keeps them inside the safe edges, and measured dock bounds maintain a 12-pixel gap after resizing or text enlargement. Long descriptions scroll with their content, and Close stays visible. Portrait tablets use a two-column mechanism list. On portrait phones up to 430 pixels wide the dock uses two rows; at 200% text it uses three rows; enlarged text panels have more reading height.

Panels are nonmodal: no full-screen backdrop, canvas remains available, and opening/closing UI does not resize the stage, move the camera, alter selection, or add history. Explicit scene actions (mechanism, side, separation, Reset) retain the existing framing behavior. A compact panel can overlap geometry at some zoom/orbit positions; closing it restores the unobstructed view immediately without undoing that framing.

## Responsive comparison

Measured CSS-pixel stage bounds in Chromium viewport emulation (zero hardware safe-area insets):

| Viewport | Stage | Height available to movement |
| --- | --- | --- |
| Desktop 1440 × 900 | 1440 × 782 | 86.9% |
| Desktop 1280 × 720 | 1280 × 602 | 83.6% |
| Tablet portrait 768 × 1024 | 768 × 906 | 88.5% |
| Tablet landscape 1024 × 768 | 1024 × 650 | 84.6% |
| Phone portrait 390 × 844 | 390 × 680 | 80.6% |
| Small phone 375 × 667 | 375 × 503 | 75.4% |
| Compact phone 320 × 568 | 320 × 404 | 71.1% |
| Phone landscape 844 × 390 | 844 × 272 | 69.7% |

The captured previous 390 × 844 layout had a 378 × 458.53 stage (54.3% of viewport height). The new stage gains 48.3% height and 53.0% area. The circular movement remains width-constrained in portrait; the extra height provides inspection/orbit space and room for optional panels rather than changing the authored camera fit.

Safe-area padding uses `env(safe-area-inset-*)` on all four edges, with `viewport-fit=cover` and dynamic viewport height. Browser text enlargement, portrait/landscape resizing, and keyboard access are part of this local review; physical iPhone/Android safe-area, touch, GPU, and screen-reader certification remain open release checks.

## Verification

Local evidence is in ignored `artifacts/browser/viewport-redesign/`. Browser and numeric review covers whole movement, all six mechanisms, selection/isolation, separation/uncover, both sides, dials, All parts, Reset, loading, and recoverable errors. Renderer regressions include manual camera takeover, reduced-motion destinations, exact restore, and resource stability. UI regressions exercise real React panel triggers, invariant stage/camera/state/history, and focus restoration. All 33 UX and 31 mechanism/rendering checks pass on desktop and mobile. Manual UI checks cover keyboard slider Home/End, visible focus, Escape without selection loss, selection focus, display styles, spread grouping, slow loading, section descriptions after a first-frame failure, and successful Retry.

Lint, TypeScript, production build, seven state tests, and 73 source/runtime checks pass. Production build retains the pre-existing large-chunk warning. Expected missing-asset fault injections in the CPU suite are recorded separately from unexpected browser errors.

This is a local UI milestone, ready for user review. It does not grant CAD redistribution, public publication, mechanical correctness, human usability acceptance, or physical-device approval.

## Follow-up after user review

Popups now sit above the bottom dock and Dial & hands is standalone. The updated mobile suite passes 35 checks, including the new dial panel; desktop/phone/tablet placement checks confirm safe horizontal bounds and a 12 px dock gap. The 320 px layout uses two rows and its stage measurement above has been updated. Other original milestone verification remains recorded in the prior evidence, while follow-up screenshots and reports are under `artifacts/browser/viewport-redesign/dock-followup/`.

All parts is now a standalone dock toggle alongside Explore and Dial & hands. The follow-up passes lint, TypeScript, production build and all 35 mobile UX checks, with All parts included in stable control-bound checks. Direct spread/whole toggling and Reset were exercised in the browser. Seven responsive measurements (including 701 px and landscape) show no horizontal overflow or offscreen dock buttons. Narrow portrait phones now use two rows; the current stage table above reflects that tradeoff. Evidence: `artifacts/browser/viewport-redesign/all-parts-followup/`.
