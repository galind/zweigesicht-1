# Explorer UX/UI polish

9 September 2026. Local-only implementation on `codex/ux-ui-polish`.

## Audit and decisions

The initial real-browser audit covered movement, partial separation, focused balance/escapement, All parts, inventory group framing, selected/isolated components, part details, nested catalog/Options/About sheets and phone dial controls. Source review traced loading, retry, recovery, state normalization, pointer discrimination and camera/history ownership. Matched screenshots are under ignored `artifacts/browser/ux-ui-polish/`.

At 1280×720, entering the balance mechanism moved the side switch from y=580 to y=490 and reduced the canvas height from 530.328 to 440.328 px. The footer's global buttons happened to remain stable at that width, but its slider lost space to the longer section label. Back lived in the contextual strip, disappeared in bare dial views and reappeared inside the dial menu. Whole movement competed with Reset in the strip. Selection added another row of actions and resized the viewer. There was no empty-hit action or keyboard deselection.

| Mode | Final actions and placement | State, exits and disabled behavior |
|---|---|---|
| Every mode | Header: Back, Reset, Options. Footer first row: Explore, Dial & hands, All parts. | Back restores saved context/camera; disabled without history. Reset restores opening defaults. Graphics-dependent actions disable until ready. |
| Whole movement, either side | Footer second row: side switch, Separate, Reassemble. | Reassemble stays in its slot and disables at zero; clears separation/reveal, preserving camera ownership and other preferences. |
| Dial A / Dial B | Same controls; existing responsive dial popover/sheet selects the face and three independent hand styles. | Only the chosen display is visible. Side switch changes faces. Separation or mechanism inspection returns to movement. Global Back remains available. |
| Focused mechanism | Fixed contextual title/Details; same Separate slot and side control. Uncover remains in mechanism Details. | Separate affects the mechanism; its accessible label says Separate section. Explore → Whole movement exits the mechanism. Back preserves previous context. |
| Selected component | Fixed contextual title, Details, dismiss button; source context and Isolate part/Show context beneath. | Dismiss and Escape clear selection and isolation while keeping mode, separation, styles, inventory group and camera. Long titles truncate visually; full names remain in title/Details. |
| All parts / inventory group | Same primary slots. View row contains Fit all parts and Look closer. Side slot is hidden. | Existing 216-member packing and framing preserved. All parts toggles back to whole; Explore and Dial controls also exit. |
| Catalog / Details / Options / About | Existing sheets and searchable catalog. | Escape closes the top overlay first and restores focus. Catalog selection returns focus to canvas. Details closes when its subject changes. |
| Loading / optional loading / retry / recovery | Existing progress, catalog/dial error and retry surfaces. Header/footer keep their positions. | Pending selection is invalidated on background dismissal; even a late failure cannot resurrect its retry/error. Dial loading retains its independent intent. |

The visual hierarchy keeps the existing dark studio and accepted materials. A two-row grid anchors global/view actions. The contextual strip occupies a small fixed caption area without changing the canvas dimensions. Short landscape uses a side caption area. Removed the contextual Whole movement duplicate (retained in Explore), the dial-menu Back duplicate, repeated overview facts (retained in Details), and the redundant dial visibility sentence. Explore now uses the same disclosure chevron as Dial & hands. The one-option appearance selector and its explanatory copy are gone.

## Selection and materials

`MovementViewer.deselect()` invalidates pending selection/retry work, clears selection/isolation and error, stops any selection camera travel at its displayed position, and retargets the existing visibility/material policy. It neither saves nor pops history. No selection means no rendering work. Canvas raycast misses call it only after the existing primary-pointer, excursion, pinch and cancellation filters pass. DOM controls never enter that raycast handler. A visible dismiss button and Escape are equivalent; modal and popover state takes precedence over global Escape.

Appearance is removed from `ExperienceState`, diagnostics and WebMCP configuration. State normalization discards legacy `treatment` from patches and saved history. Renderer function-color/selected-color branches are deleted. Accepted finish parameters, context dimming, outline, fitted enamel, source annotations, recovered diamond, geometry and source matrices remain unchanged. Optical/anisotropic tests now assert that legacy appearance input preserves materials rather than expecting flat function colors.

## Verification

Verification in progress. Final measurements, responsive/gesture evidence and suite results will be recorded here before completion.

No physical-device, screen-reader, human usability or mechanical certification is claimed. CAD publication gates remain unchanged. Nothing is pushed, merged, registered, uploaded or deployed; `FINISHING_GOAL.md` remains untouched.
