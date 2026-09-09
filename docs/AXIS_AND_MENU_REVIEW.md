# Movement axis and bottom menu

10 September 2026. Local user-requested correction to movement centering and refinement of the bottom controls.

## Framing

The assembled bounds included the protruding stem, shifting the camera target away from the movement center. The immutable framing envelope is now symmetric about the central hand arbor recorded in `assets/authored/dial-configurations.json` (world XY: 0, 0). The stem remains within the fitted envelope. Depth still uses the envelope midpoint; the assembled target is **[0, 0, -2.425] mm**.

Movement, both dials, Reset and reassembly share that anchor. Full separation retains the same XY axis while adapting depth and distance to the expanded geometry. Focused mechanisms/components and All parts keep their dedicated framing. Manual camera ownership and Back remain protected. No model geometry, materials, hand poses or separation transforms changed.

## Menu

Three equal-width choices occupy the first row: **Explore**, **Dial & hands**, **All parts**. A restrained shared highlight indicates the current mode. A subtle divider separates these choices from the view controls; the permanent white Explore fill is removed. Controls use the established muted text and quiet hover treatment.

Desktop places Switch side, Separate and Reset view beneath the choices. On phones, Switch side and Reset view remain visibly labeled, and Separate gets its own full-width row. Inventory replaces the slider with Fit all / Groups in the same area. At doubled text size on narrow screens, the main choices wrap into two rows so labels fit without shrinking. The bottom menu has a descriptive accessible name and the main choices use a fieldset. Existing selection, popover/sheet and reset handlers are preserved.

## Verification

All **64 CPU/source checks**, **seven state tests**, TypeScript, authored lint and production build pass. The framing regression now asserts that the movement anchor is on the central hand axis at four aspect ratios, retaining equal scale on both sides, prior-orbit independence and optional-load stability.

All **18 camera browser checks** pass at **1280×720 and 390×844**. Complete opening/closing separation journeys stay within **.852 desktop / .848 phone NDC**, with exact reassembly, consistent dial destinations, manual ownership and Back.

All **27 UX checks** pass at **390×844** and **320×740 with 200% text**, including unchanged canvas/control rectangles across six contexts, safe deselection, gesture rejection and idle behavior. Normal 320px and enlarged layouts were visually reviewed; enlarged text has no horizontal page overflow. Direct phone clicks open the dial sheet, select Dial A and Open lance, and return focus through Close.

The **24 desktop dial checks** also pass, preserving all six hand styles, exclusive faces, fades, turnover and renderer resources. Direct measurements across opening, complete separation, mechanism, Dial A, Dial B and All parts show **0 px displacement** for every measured persistent control and canvas rectangle. The full-separation target retains world XY **[0, 0]**.

Evidence: ignored `artifacts/browser/axis-menu/`. Preview remains **http://127.0.0.1:4173/**. Local only; no push, merge, deployment or `FINISHING_GOAL.md` edit.
