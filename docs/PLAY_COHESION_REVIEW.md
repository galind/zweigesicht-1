# Play / explorer cohesion review — 26 September 2026

The review reproduced a real front-face camera reversal and brought `/play`
back into line with the homepage's controls, motion and visual language. The
homepage's appearance, navigation and game-payload boundary remain unchanged.
The active manifest is now `play-3`: 16 shared foundation leaves, 89 Easy
placements, 249 Hard placements, and the same 265 final physical leaves.

This report supersedes the counts in the historical [play-2 QA record](PLAY_QA.md).
Source membership and mechanical limits remain in [PLAY_INVENTORY.md](PLAY_INVENTORY.md).
Evidence is local and ignored under `artifacts/browser/play-cohesion/`.

## What was wrong

Play constructed Three.js OrbitControls with a negative-Y camera up vector,
then changed the camera to positive Y for the front face without updating the
controls' cached rotation basis. The homepage already synchronized that basis
during framing and turnover. This made the front look correctly oriented while
responding to mouse drags in the opposite direction.

The browser baseline confirmed it. An 80 px rightward drag from the front view
moved the homepage camera by −40.002 mm in X but Play by +73.429 mm. The vertical
sign also opposed the homepage; the back-face signs agreed. Distances differ
because the experiences frame differently: the meaningful failure is the sign,
not their raw world-space magnitudes.

Other independent differences were found:

- Play omitted the homepage's orbit damping and jumped immediately for Flip and
  Reframe. Recorded Play camera samples were identical immediately after a flip
  and after 100, 450 and 2,150 ms; the homepage visibly progressed through a turn.
- Keyboard orbit used 0.12 radians rather than 0.2; zoom used 0.9/1.1 rather than
  0.83/1.2.
- Play used a navy gradient, blue outlined controls and prominent serif headings
  instead of the existing neutral background, sans-serif controls and glass.
- Source materials, lights and environment were shared, but contact shading was
  omitted, changing depth/readability of the same fitted geometry.
- The displayed face caption followed the step's intended side even after a
  manual Flip showed the other face.

Two follow-up defects were caught by visual review after the first revision.
Large action labels overflowed neighboring buttons at 320 px / 200% text, and
Flip inverted the presentation offset, moving the assembly down into the dock.
The final changes give action labels their natural minimum width and rotate
both camera position and camera target around the assembly's framing center.

## Reuse and intentional differences

The two routes now use `CameraFrame.ts` for the established orbit-basis update,
keyboard movement and zoom. Play uses the same OrbitControls damping convention,
the existing `MOTION.navigate` / `motionEase` behavior for eased navigation, and
`SurfaceOcclusion` for contact shading. Play styling uses the existing global
neutral colors, sans-serif typography, `.text-button` controls and icon language.
Computed backgrounds, foregrounds, base font families and 18 px heading families
match in the browser comparison. The face caption reflects the actual camera side.

Play still owns its camera framing region, stage, target cue, discrete assembly
state and cutaway context. Those are necessary for reachable guided placements;
the watch does not need identical screen-space size on the two routes. A source
solid is neither moved nor rescaled to repair the controls. Staging enlargement
and temporary cutaways remain presentation-only operations.

The inventory review identified two dial-retaining screws under the source
mainplate parent. They are now explicit placements after the three-hands dial,
rather than already fitted at the start. Both levels share the corrected 16-leaf
foundation. Existing source geometry and final membership remain unchanged.
Old saves receive an explicit earlier-sequence message; progress is not silently
mapped onto the revised order.

## Verified behavior

| Run | Actual result |
| --- | --- |
| Easy production traversal | 89/89 real placements; 1,114 assertions passed |
| Hard production traversal | 249/249 real placements; 4,651 assertions passed; every target checked at both 390×844 and 320×844 |
| Final focused production run | 60 assertions passed, including 320 px / 200% root text and keyboard-scroll access to every enlarged dock control |
| Homepage regression | All 71 existing UX assertions plus payload/link checks passed; no uncaught page errors |
| Final camera differential / framing | 30 comparisons passed: 12 directions, 12 orbit-angle / zoom-ratio comparisons, and 6 desktop/phone Flip framing checks |

The revised directional and magnitude measurements agree on both faces.
Keyboard arrows turn both cameras by 0.2 radians. Keyboard zoom-in produces a
0.83 distance ratio on both. A 120-unit outward wheel event produces a
1.06348574665 ratio on both. Mouse-drag angular differences are under 0.001
radians in the sampled settled frames; both have a damped tail. Flip and framing
now have sampled intermediate poses instead of instantaneous jumps.

The final focused run also checks real mouse/touch placement, misses, hover
without commit, grab offsets, pointer cancellation, lost capture, browser
`touchCancel`, resizing, camera suppression during dragging, zoom followed by a
valid drop, keyboard/tap alternatives, hints, undo, resume, restart/level
confirmations, corrupt/incompatible/unavailable storage, asset retry, WebGL
context restoration and idle rendering. Every completed level renders the full
265-leaf set.

Both new oblique screw stages were inspected. Easy steps 82/83 show legible
staged screws and exposed outer-rim targets. Hard steps 221/222 have identical
leaf/focus sets, authored view vectors and context sets; the complete Hard run
independently checked actual geometry, no target occluders, separate hit areas
and successful committed drops at both phone widths. At 390 px the target
centers were (243.55, 301.23) and (175.62, 167.58), with staging at (85.80, 511.91).
The second view explicitly indicates its temporary assembly close-up.

The coordinator also verified TypeScript, lint, production build, production
SEO/HTTP and 49 automated tests, including shared-camera basis/direction,
resource lifetime and flip-projection invariance. The complete placement runs
preceded the final label minimum-width and Flip framing corrections; those
changes do not alter guided placement endpoints or inventory. Focused checks
and the final camera differential were rerun after both corrections. The final
run recorded zero projected-focus drift on both desktop faces and both flip
directions at 390 and 320 px. This independent check projects the authored
focus center through the actual before/after camera poses. Final desktop and
phone screenshots confirm that the assembly stays above the staging/dock area,
with the correctly named displayed face. There are no uncaught browser errors
in the final reports.

## Evidence and reproduction

`review-cohesion.mjs` uses real browser gestures and visible controls. It reads
Play camera diagnostics and the homepage's existing inspection output; it never
changes progress or invokes placement methods. Final comparisons explicitly use
Reset on the homepage before each action. The original baseline used reference
views, which preserve user orbit after the first action; the decisive initial
horizontal-reversal measurement starts straight on. Raw baseline magnitudes
from later cumulative poses are not used as sensitivity comparisons.

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node scripts/play/review-cohesion.mjs http://127.0.0.1:4181 final
```

Complete placement/recovery runs use `browser-check.mjs`, with
`PLAY_QA_OUTPUT=artifacts/browser/play-cohesion`. Their modes are `easy`, `hard`,
`focused`, and `home`. All placement checks use the production DOM interaction
path, with actual mouse, browser touch or keyboard input; no progress-index
shortcut is used.

Useful local evidence:

- `baseline-report.json`, `after-report.json`, `final-report.json` and the phase-prefixed route/face
  screenshots preserve the original reversal and the corrected control/style
  comparison. `final-play-front.png`, `final-play-390-front.png` and
  `final-play-320-front.png` show the corrected post-Flip framing.
- `easy-report.json`, `hard-report.json`, `focused-report.json` and
  `home-report.json` contain the successful production suites.
- `easy-082-central-dial-screw-1.png` and
  `easy-083-central-dial-screw-2.png` show both oblique dial-retaining seats.
- `phone-320-enlarged-reduced.png` and
  `phone-320-enlarged-controls-scrolled.png` show separated enlarged controls and
  scrolling access to the last row. `phone-390-first-part.png` shows the corrected
  16-leaf foundation and current staged component.
- The level completion and `-flipped` images show both fully assembled faces.
  Representative foundation, internal-packet, screw, phone and enlarged-text
  captures were visually reviewed by both the QA agent and coordinator.

Chrome 154.0.8037.57 and CDP touch emulation provide browser evidence, not
physical-phone, Safari/WebKit, GPU/thermal or representative accessibility
certification. The geometry checks and close-ups establish guided visual
reachability, not collision-free assembly, tolerances or a servicing procedure.
Mechanical and publication gates remain open. No push, PR or deployment occurred.
