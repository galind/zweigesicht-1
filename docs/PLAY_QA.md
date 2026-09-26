# Play verification — 26 September 2026

This records the original `play-2` verification. The subsequent user-requested
dial-screw and camera-cohesion changes use `play-3`; see
[the follow-up review](PLAY_COHESION_REVIEW.md) for its revised 89/249-step results.

The version `play-2` implementation passes the complete Easy and Hard browser
traversals. Both finish with all 265 intended physical leaves rendered, including
the same 18 fitted-mainplate leaves. Inventory and sequence evidence is recorded
in [PLAY_INVENTORY.md](PLAY_INVENTORY.md).

## Actual verification

| Run | Result | Scope |
| --- | --- | --- |
| Production Easy | 87/87 placements; 1,094 assertions passed | 1440×900, sampled 320×844 stages, transition undo/replay, refresh, both final faces, idle rendering |
| Production Hard | 247/247 placements; 4,615 assertions passed | Every step at both 390×844 and 320×844, with real source geometry, transition undo/replay, refresh, both final faces, idle rendering |
| Production focused interactions | 51 assertions passed | Real mouse and CDP touch drags, misses, preview without commit, grab offset, cancellation/capture loss/resize, camera lock, keyboard orbit, wheel zoom, placement at changed zoom, tap alternative, hints, confirmations, persistence failure and recovery |
| Homepage regression | 5 wrapper checks including all 71 existing UX assertions passed | No game link; actual requested script bodies exclude game state, manifest and completion UI; no game module requests; unchanged source and reviewed screenshots |
| Development direct route | 11 assertions passed | Direct `/workshop?mode=easy`, actual first placement, automatic refresh/resume, exact next step and fitted-set restoration |

The focused run includes 320×844 at **200% document-root text size** with reduced
motion. Full header bounds, actual staged CAD alignment, separate staging and
destination hit areas, complete ring clearance from controls, and no horizontal
overflow passed. The scrolling dock retains its controls. Browser touch input
includes a valid drop, invalid drop, `touchCancel`, and tap selection/destination.
The wheel test changes zoom and then completes a real touch drop at that zoom.
Keyboard tests select the staged part and activate its destination with Enter.

Corrupt and incompatible saved sessions show an explicit restart message.
Unavailable storage shows an honest warning while play remains functional.
Blocking the required catalog prevents starting; Retry restores all 265 meshes.
WebGL context loss prevents placement, and restoration retains the exact fitted
set. Completion remains orbitable/flippable, and settled rendering adds no
unnecessary animation frames. Deliberately induced loading/context console
messages are expected; final runs contain no uncaught page errors.

The coordinator additionally verified TypeScript, lint, production build,
production SEO/HTTP (own `/workshop` canonical, `noindex`, homepage-only sitemap),
and 38 tests: 8 play-state, 13 play-lifecycle and 17 existing tests. The existing
CPU source/runtime suite passed; shared explorer implementation remains
unchanged. Lifecycle tests include resource disposal, asynchronous recovery and
unchanged-layout observer notifications not taking ownership of an orbit.

The exhaustive runs use the final manifest, geometry, source poses, framing and
responsive layout. A subsequent idempotency fix prevents repeated notifications
for unchanged layout bounds from resetting the camera; the complete focused
suite was rerun after that fix. The exhaustive sequences were not unnecessarily
repeated because their geometry and target framing did not change.

## Method and reproduction

`scripts/play/browser-check.mjs` drives production DOM pointer handlers and
accessible controls. Inspection data is read-only for placement: it supplies
screen-space staging/target positions, scene inventory and rendering diagnostics.
The runner never changes completed step IDs, calls a placement method directly,
or advances an index. Each committed action is checked against the actual next
manifest step and independently accumulated physical-leaf set.

Every step checks that the target is in the viewport, receives pointer input,
has no intervening visible geometry ray hits, is separate from staging and clear
of the dock, and that actual staged CAD is centered in its hit area. The completed
visible set must equal the full manifest. Mouse drags dominate both traversals;
selected steps use browser touch and keyboard paths. Side changes and prepared
assembly transitions exercise Undo followed by another real placement. Refresh
restores a committed prefix, never a half-finished drag.

Run against an already started preview, using a local Playwright installation
and browser. Neither is added as a project dependency:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node scripts/play/browser-check.mjs http://127.0.0.1:4187 all
```

Individual modes are `easy`, `hard`, `focused`, `home`, and `dev`. The latter was
run against the development server at port 4180. `PLAY_QA_OUTPUT` may override
the default ignored evidence directory. Verification used headless local Google
Chrome 154.0.8037.57, Playwright and CDP touch emulation.

## Local visual evidence

Reports and screenshots remain ignored under `artifacts/browser/play/`:

- `easy-report.json`, `hard-report.json`, `focused-report.json`,
  `home-report.json`, and `dev-report.json` contain the successful final runs.
- `homepage-before.png`, `homepage-after.png` and `homepage-before.json` record
  the visual baseline and 71-check baseline suite. The before capture includes
  the explicitly enabled Inspection tools trigger; the ordinary after capture
  does not. This is a visual review, not a claim of pixel-identical GPU output.
- `phone-320-enlarged-reduced.png` and `phone-390-first-part.png` record enlarged
  root text/reduced motion and the first fitted-mainplate placement.
- `easy-001-movement-1.png` and `easy-081-central-dial.png` show the real shared
  foundation, prepared barrel, and the final three-hands dial stage.
- `hard-026-leaf-p_0_1_1_1__0_1_1_1_4__0_1_1_83_62__0_1_1_232_3.png` shows the
  escape-wheel hub; `hard-101-leaf-p_0_1_1_1__0_1_1_1_4__0_1_1_83_29__0_1_1_145_28.png`
  shows a tiny pin in the shock-indicator close-up.
- `hard-narrow-247.png` shows the final skeleton minute hand at 320 px.
  `easy-complete.png`, `hard-complete.png` and their `-flipped` counterparts show
  both finished faces with source assets and controls available.

The above representative captures were visually inspected. Intermediate
screenshots also cover side changes, internal packets, fittings and the final
15 steps. Early exploratory runs exposed and led to fixes for hidden first-step
staging, incorrect face mapping, over-aggressive plate hiding, enlarged text
clipping, overlapping stage/target/dock regions and redundant layout reframing.
Runs interrupted by a local production rebuild were discarded; the successful
reports identify their own preview URL and timestamps.

## Limits

Desktop-browser viewport and CDP touch emulation do not certify physical-phone,
Safari/WebKit, GPU/thermal or representative accessibility behavior. No actual
phone was tested. Geometry rays and reviewed close-ups establish guided visual
reachability; they are not a collision proof or a certified watch-servicing
sequence. The source exceptions and mechanical/publication gates remain in
force. No push, deployment, PR or new asset redistribution was performed.
