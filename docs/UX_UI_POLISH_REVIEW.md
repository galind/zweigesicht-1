# Explorer UX/UI polish

9 September 2026. Local-only implementation on `codex/ux-ui-polish`.

## Audit and decisions

The initial real-browser audit covered movement, partial separation, focused balance/escapement, All parts, inventory group framing, selected/isolated components, part details, nested catalog/Options/About sheets and phone dial controls. Source review traced loading, retry, recovery, state normalization, pointer discrimination and camera/history ownership. Matched screenshots are under ignored `artifacts/browser/ux-ui-polish/`.

At 1280×720, entering the balance mechanism moved the side switch from y=580 to y=490 and reduced the canvas height from 530.328 to 440.328 px. The footer's global buttons happened to remain stable at that width, but its slider lost space to the longer section label. Back lived in the contextual strip, disappeared in bare dial views and reappeared inside the dial menu. Whole movement competed with Reset in the strip. Selection added another row of actions and resized the viewer. There was no empty-hit action or keyboard deselection.

| Mode | Final actions and placement | State, exits and disabled behavior |
|---|---|---|
| Every mode | Header: Back, Options. Footer first row: Explore, Dial & hands, All parts. Reset view anchors the right of the second row. | Back restores saved context/camera; disabled without history. Reset restores opening defaults. Graphics-dependent actions disable until ready. |
| Whole movement, either side | Footer second row: side switch, Separate, Reset view. | Separate at zero reassembles while preserving the current face and context. Reset view restores the opening view and options. |
| Dial A / Dial B | Same controls; existing responsive dial popover/sheet selects the face and three independent hand styles. | Only the chosen display is visible. Side switch changes faces. Separation or mechanism inspection returns to movement. Global Back remains available. |
| Focused mechanism | Fixed contextual title/Details; same Separate slot and side control. Uncover remains in mechanism Details. | Separate affects the mechanism; its accessible label says Separate section. Explore → Whole movement exits the mechanism. Back preserves previous context. |
| Selected component | Fixed contextual title, Details, dismiss button; source context and Isolate part/Show context beneath. | Dismiss and Escape clear selection and isolation while keeping mode, separation, styles, inventory group and camera. Long titles truncate visually; full names remain in title/Details. |
| All parts / inventory group | Same primary slots. View row contains Fit all, Groups and Reset view. Side slot is hidden. | Existing 216-member packing and framing preserved. All parts toggles back to whole; Explore and Dial controls also exit. |
| Catalog / Details / Options / About | Existing sheets and searchable catalog. | Escape closes the top overlay first and restores focus. Catalog selection returns focus to canvas. Details closes when its subject changes. |
| Loading / optional loading / retry / recovery | Existing progress, catalog/dial error and retry surfaces. Header/footer keep their positions. | Pending selection is invalidated on background dismissal; even a late failure cannot resurrect its retry/error. Dial loading retains its independent intent. |

The visual hierarchy keeps the existing dark studio and accepted materials. A two-row grid anchors global/view actions. The contextual strip uses the left margin on desktop, a compact caption area on phones, and a right caption area in short landscape, without changing the canvas dimensions between modes. At 200% text, the view row keeps a fixed height and the side action uses its labeled icon. Removed the contextual Whole movement duplicate (retained in Explore), the dial-menu Back duplicate, repeated overview facts (retained in Details), and the redundant dial visibility sentence. Explore now uses the same disclosure chevron as Dial & hands. The one-option appearance selector and its explanatory copy are gone.

## Selection and materials

`MovementViewer.deselect()` invalidates pending selection/retry work, clears selection/isolation and error, stops any selection camera travel at its displayed position, and retargets the existing visibility/material policy. It neither saves nor pops history. No selection means no rendering work. Canvas raycast misses call it only after the existing primary-pointer, excursion, pinch and cancellation filters pass. DOM controls never enter that raycast handler. A visible dismiss button and Escape are equivalent; modal and popover state takes precedence over global Escape.

Appearance is removed from `ExperienceState`, diagnostics and WebMCP configuration. State normalization discards legacy `treatment` from patches and saved history. Renderer function-color/selected-color branches are deleted. Accepted finish parameters, context dimming, outline, fitted enamel, source annotations, recovered diamond, geometry and source matrices remain unchanged. Optical/anisotropic tests now assert that legacy appearance input preserves materials rather than expecting flat function colors.

## Verification

- **60 CPU/source checks**, **seven state tests**, TypeScript, authored lint and production build pass. No geometry, material definitions, source annotations, source hashes or separation assets changed.
- At **1280×720** and **390×844**, **27 UX checks** each pass. They cover empty-space hits in whole/separated/mechanism/inventory/inventory-group/dial contexts, both selected and isolated; camera/target/up, context and history preservation; gesture rejection; object replacement; Escape; pending optional selection cancellation; stable slots and zero idle renders.
- Existing live suites pass: **eight explosion** and **12 movement** checks at each size; **20 warm-catalog dial checks** on desktop and **21 cold-catalog checks** on portrait (plus a passing warm repeat). All six hand poses and exclusive displays were also visually reviewed. Complete separation coverage/clearance, exact reassembly, 216-member packing, manual camera ownership, reduced motion and resource reuse remain protected.
- Additional browser measurements at **1920×1080**, **320×740** and **844×390** show **0 px change** in all nine measured persistent-control/canvas rectangles between representative modes, with no horizontal overflow. At **320×740 and 1280×720 with 200% text**, whole/side/inventory transitions also measure **0 px change**. The enlarged view-row height is 62 px in all three modes. Controls retain at least 44 px height at ordinary text; full long names remain accessible in Details.
- Direct mouse/keyboard checks verify empty-space deselection with exact camera/target preservation and canvas focus, Details-first Escape, a second Escape dismissing selection, dialog focus return, catalog search/Enter selection, Options retaining selection, and dial-sheet Escape retaining selection. A visible first-frame failure recovers through Retry 3D; six-second optional dial delivery and visible optional failure/retry controls were reviewed.
- Final local evidence includes matched before/after screenshots, all six style images, large/narrow/landscape views, enlarged-text captures, numeric layout reports, CPU/state/build output and `index.html` under `artifacts/browser/ux-ui-polish/`. The live UX harness uses actual raycasts and viewer pointer handlers; separate real browser input covers mouse/keyboard. Pinch/cancel assertions are handler emulation, not physical touch-device tests.

An initial portrait run failed the existing strict camera-equality assertion after preparation retry. Added before/after state and camera diagnostics; subsequent cold and warm runs passed the unchanged assertion with **0 camera error**. The initial failure and diagnostic reruns are retained in the evidence directory; no camera assertion was weakened. Earlier development logs also contain intentional failure injections and a corrected synthetic-pointer test harness error; they are not presented as normal-session failures.

The final normal-preview console log is empty. Preview remains **http://127.0.0.1:4173/**. Existing loopback server is retained. Restart command if needed: `cd explorer && npm run dev -- --host 127.0.0.1 --port 4173`. Implementation checkpoint: **2b8e19c**, followed by the responsive polish/verification checkpoint recorded in Git and PROGRESS.md.

No physical-device, screen-reader, human usability or mechanical certification is claimed. CAD publication gates remain unchanged. Nothing is pushed, merged, registered, uploaded or deployed; `FINISHING_GOAL.md` remains untouched.

## Reset prominence follow-up — 10 September 2026

Replaced the small reassemble-only icon with a persistent, labeled **Reset view** beside Separate, and removed the header duplicate. The outlined button keeps a fixed width and position across assembly and inventory modes; its label wraps at enlarged text sizes. It retains the existing global reset behavior and also closes the dial picker. Moving Separate to zero remains the context-preserving reassembly path.

TypeScript, authored lint and production build pass. The existing **27 UX checks pass at 1280×720 and 320×740 with 200% text**, with zero control displacement across six contexts. Direct browser Reset clicks from a dial, separated movement, mechanism and All parts restore opening defaults. Keyboard Home on the section slider returns separation to zero while retaining the front face, mechanism and reveal. Ordinary 320px and enlarged-text layouts were visually reviewed. Results and screenshots: ignored `artifacts/browser/reset-control/`. This follow-up changes only the control markup/styling; viewer behavior and accepted geometry/materials remain unchanged.

User review rejected the outlined treatment. The subsequent styling correction removes Reset-specific fill, border, color and hover rules, using the shared text-button appearance. Its fixed slot, label, keyboard focus styling and behavior are preserved. Direct browser review of Movement and All parts confirms the match; the production build passes.

Follow-up: the bottom controls now use equal-width display choices, a shared active treatment and a separate view-tool row, with a full-width phone slider and visible side label. See [Movement axis and menu review](AXIS_AND_MENU_REVIEW.md) for the current layout and verification.
