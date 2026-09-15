# UI review — bottom

Reviewed 15 September 2026. Recommendations based on the desktop interface and a 390 px mobile viewport, updated for the subsequent Disassemble naming and hand-material cleanup. This document records proposals; it does not authorize or claim their implementation.

Scope: bottom navigation, Disassemble, Focus, All parts and its component finder, Configure, Flip and Reset view. Header actions and contextual mechanism information are covered in [UI review — top](UI_REVIEW_TOP.md).

## Summary

- Preserve the six-action order and make active viewing modes clearer.
- Give short control panels smaller widths and information lists more room.
- Simplify Configure into Case and Dials & hands, with no hand-material field.
- Remove repeated labels and decorative numbering from Disassemble and Focus.
- Make component results readable by showing their name and location first.

## Already implemented after the review

- Separate has been renamed Disassemble in the navigation and related controls.
- The hand-material field and its material explanation have been removed entirely.
- The persistence note now reads “Your choices are kept when you reset the view.”

The Three hands shape selector remains absent. Fine, Lance and Open lance are still supported internally. Restoring that selector was recommended in the follow-up discussion and remains a proposal.

## 1. Bottom navigation

Keep this order:

**Disassemble · Focus · All parts · Configure · Flip · Reset view**

### Proposed changes

- Standardize label and icon sizes.
- Keep Reset secondary through color and spacing, using the same readable label size.
- Keep Disassemble first with regular visual weight.
- Use a consistent selected treatment for active modes.
- Keep Focus visibly active while a mechanism is selected, even when its menu is closed.
- Distinguish an open panel from an active viewing mode.
- Keep the mobile two-row arrangement with equal touch targets. The current dock occupies about 96 px at 390 px width.

### Resolve a behavior mismatch

In All parts, Disassemble currently opens an “Arrange parts” menu. Move those group-framing choices into Focus so navigation labels retain a predictable purpose. Define the resulting Disassemble behavior in All parts before implementing this change; preserve a clear route back to the assembled view.

## 2. Panel sizing

| Panel | Proposed desktop width | Content approach |
| --- | --- | --- |
| Disassemble | 320 px | Compact action and sliders |
| Focus | 320 px | Simple selection list |
| Configure | 360 px | Two continuous groups |
| Component finder | 420 px | Search and readable results |

Widths are starting points, constrained to the viewport. Let content determine height, with a scrollable body when needed. Use consistent 20 px padding, corner radii, close controls and spacing. Keep phone panels within safe margins and leave the active controls reachable.

## 3. Disassemble

### Observation

The same action is repeated in the panel title, main button and slider label. The rename has corrected terminology but has not yet simplified that repetition.

### Proposed structure

- Heading: **Disassemble**.
- Context when focused: the mechanism name, such as **Twin barrels**.
- Action: **Disassemble movement** or **Disassemble section**, changing to **Reassemble** when active.
- Main slider: **Spacing**.
- Focused-section cover slider: **Move covers aside**.
- Quiet, aligned percentage values beside sliders.

Keep the existing behavior and place any necessary operating explanation beside the relevant control.

## 4. Focus

- Keep Whole movement and the six mechanism choices in the assembled view.
- Remove decorative 01–06 numbering and the generic introductory sentence.
- Indicate the current choice with a checkmark.
- Remove chevrons from choices that immediately change the view.
- In All parts, provide the relevant group-framing choices here, including Fit all.
- Keep menu labels understandable without relying on numbering or icons.

## 5. Configure

### Proposed structure

**Case**

- Show case toggle.
- Case material selector.

**Dials & hands**

- Show both dials toggle.
- Skeleton hands style selector.
- Proposed restoration: Three hands style selector, offering Fine, Lance and Open lance.

### Proposed changes

- Rename “Skeleton” to “Skeleton hands.”
- Keep both groups continuously visible, with simple spacing between them.
- Keep hand material entirely absent as a field, selector or read-only value. This supersedes the original review’s suggestion to show an automatic material value.
- Preserve the existing automatic finish behavior.
- Replace the long case explanation with a short message only when the case is temporarily hidden by the viewing mode.
- Retain the short configuration-persistence note and actionable loading/error feedback.
- Use consistent control styling and preserve choices while dials or case are hidden.

## 6. All parts and component finder

### Observation

Each result currently repeats a component name, CAD ID, status and source name. The resulting four-line entries make scanning a large inventory difficult.

### Proposed changes

- Put search first, followed by the scope control and one result count.
- Present one filtered results list.
- Show a readable name and useful location, for example:

  **Barrel drum** — Twin barrels · Barrel 2

- Keep CAD IDs and original names searchable and available in selected-component details.
- Show status labels when they explain an exception, such as an entry not currently displayed.
- Preserve the distinction between physical parts and assemblies where it affects selection.
- Keep the expanded CAD scope available without letting its metadata dominate everyday browsing.

## 7. Flip and Reset view

- Retain direct actions with no additional panels.
- Keep clear labels and consistent touch targets.
- Preserve Reset’s existing configuration-retention behavior.
- Verify that the selected styling communicates any persistent flip state in All parts.

## Priority and acceptance

1. Simplify Configure and component-result content.
2. Standardize panel sizes and visual rules.
3. Clarify active navigation states and resolve the All parts / Disassemble mismatch.
4. Simplify Focus and slider labels.

Check narrow phones and enlarged text, panel scrolling, keyboard operation, selected-state clarity, hidden configuration choices, component search and the return to the assembled view. Verify the existing interaction behavior after structural changes.
