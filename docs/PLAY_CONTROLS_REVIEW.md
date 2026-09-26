# Play control semantics review — 26 September 2026

The review compared the homepage's actual handlers, accessible names, icons,
keyboard shortcuts and panels with `/play`. Sharing colors and the icon library
had left several controls with conflicting meanings. The homepage's handlers
remain unchanged; Play now distinguishes view controls from assembly actions.

| Control | Previous conflict | Current meaning |
| --- | --- | --- |
| Flip | Same label, different icon orientation and accessible name | Shared `FlipButton`: rotated icon, visible Flip, accessible Flip movement; turns the viewed face without changing assembly progress |
| Reset view / Home | Homepage restored the viewed face; Play's Home returned to the authored placement face | Shared `ResetViewButton` and matching Home behavior: straighten/reframe the currently viewed face, keeping configuration on home and assembly progress in Play |
| Show placement | ScanSearch means a Focus chooser on home but was an immediate Reframe action in Play | LocateFixed icon and explicit placement label; restore the current part's authored destination view, without placing it |
| Restart | RotateCcw meant nondestructive Reset view on home and destructive Restart in Play | ListRestart icon, accessible Restart assembly, explicit confirmation before resetting progress |
| Difficulty | Layers meant Disassemble on home and Levels in Play | Gauge icon, visible Difficulty, accessible Choose difficulty; the choice screen preserves the save, and replacing a started assembly requires confirmation |
| How to play | Custom aside had separate close/focus behavior | Existing shared Sheet, heading, scroll region and Close primitive; Escape and Close restore trigger focus |

`TextButton`, `FlipButton` and `ResetViewButton` are shared presentation
components. The homepage keeps its existing click handlers, state flags,
responsive labels and keyboard behavior. Show placement is only present while
there is a current part. Reset view and Flip remain useful on the complete watch.
The help copy explains the distinction between resetting the view and locating
the placement.

## Verification

Browser evidence is local and ignored under `artifacts/browser/play-controls/`.
The targeted `controls` mode tests Easy and Hard independently. Each run starts
fresh and commits a real drag placement before testing Flip, orbit, zoom,
Reset view, Home and Show placement. It compares exact progress/session state
and the actual camera positions, rather than inferring behavior from labels.
SVG comparisons normalize attribute order and CSS serialization before comparing
paths, attributes and computed orientation across server/client-rendered routes.

The production focused suite passed **61 assertions**, including real mouse and
browser touch input, keyboard/tap placement, miss/cancel/capture loss, zoom and
snap, hints, undo, save/restore, restart/difficulty, unavailable/corrupt storage,
asset retry, context restoration and enlarged controls. The homepage wrapper
passed **5 checks**, including all **71 existing UX assertions**, no `/play` link,
and no game data/state payload in the homepage's requested JavaScript. Both
reports have zero uncaught browser errors.

The final controls suite passed **99 assertions** across both levels, with zero
uncaught browser errors. It verifies distinct control icons and names, exact
state preservation, current-side Reset/Home versus authored-side Show placement,
restart confirmation, saved-progress protection when choosing another difficulty,
and shared Help focus behavior. All seven controls are reachable at 320 px /
200% text. Help fits the viewport, its content scrolls to the end while Close
stays available, and both Escape and Close restore trigger focus.

Visual review caught a 320 px / 200% text case that the initial hit-area tests
missed: the staged piece caption wrapped into two lines and overlapped the dock.
Layout now reserves the measured caption height, and overlapping grid labels
reserve the maximum height for both unselected and selected captions. Selecting
a piece therefore does not move staging during a drag. The final assertion
records **21 px caption-to-dock clearance** in both levels. Focused drag/recovery
checks were rerun after this correction. Enlarged confirmation headings retain
the intended 36 px size and 12 px vertical margins.

Visually reviewed evidence includes `controls-easy-desktop.png`,
`controls-hard-320-enlarged.png`, `controls-easy-help-320-enlarged.png`, and
`controls-final-320-enlarged-restart.png`. Help was captured after its entrance
transition; its translucency comes from the existing shared panel styling.
A final native-dialog centering correction was checked separately with **26
passing assertions**: Restart and Difficulty confirmations at desktop size and
320 px / 200% text are centered with at least 16 px viewport margins, both
actions are reachable, initial focus chooses Keep playing, and Escape returns
focus to the triggering control without changing progress. This final CSS-only
check followed the controls/focused runs. `controls-final-desktop.png` records
the final active scene; `controls-final-*-restart.png` and
`controls-final-*-difficulty.png` record the centered confirmations. There were
no uncaught errors in the final dialog run.

The full **89 Easy / 249 Hard** placement traversals are the prior successful
`play-3` runs documented in [PLAY_COHESION_REVIEW.md](PLAY_COHESION_REVIEW.md).
This follow-up does not change inventory, ordering or placement mechanics, and
those complete traversals were not repeated. The current targeted checks
exercise both levels' actual placement, camera and progress behavior.

## Reproduction and scope

```sh
PLAY_QA_OUTPUT=artifacts/browser/play-controls \
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
node scripts/play/browser-check.mjs http://127.0.0.1:4181 controls
```

Replace `controls` with `focused`, `home` or `dialogs` for the other suites. The scripts
read diagnostics but never alter step indices or invoke placement shortcuts.
Screenshots include desktop controls, enlarged phone controls, Help and restart
confirmation. Chrome and CDP touch emulation establish browser behavior;
physical phone, Safari/WebKit and assistive-technology certification remain
outside this review. No push, pull request or deployment occurred.
