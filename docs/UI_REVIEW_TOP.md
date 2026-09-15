# UI review — top

Reviewed 15 September 2026. Recommendations based on the desktop interface and a 390 px mobile viewport. This document records proposals; it does not authorize or claim their implementation.

Scope: watch identity, Learn about the watch, Settings, and the contextual information shown below the identity. Mechanism details belong here because they are opened from that context, although their current panel appears near the bottom. Bottom controls and component search are covered in [UI review — bottom](UI_REVIEW_BOTTOM.md).

## Summary

- Tighten the identity and mobile header to give the watch more space.
- Preserve Learn about the watch and Settings as equally weighted, visible text actions.
- Keep the learning panel as one continuous reading surface.
- Reorganize Settings around rendering quality, camera controls and concise instructions.
- Give mechanism explanations one home; keep the persistent context compact.

## 1. Header and identity

### Observation

The watch name and maker attribution occupy an approximately 85 px block. On a 390 px phone viewport, the second action row reaches 148 px down the screen. The content is short enough to support a tighter arrangement.

### Proposed changes

- Shorten “A watch by Marco Lang” to “By Marco Lang.”
- Bring the attribution closer to the watch title while preserving a comfortable link target.
- Align the desktop action row with the title.
- Use consistent outer margins: 24 px on desktop and 16 px on phones.
- Bring the mobile action row closer to the identity; target an overall header footprint of about 110–120 px at normal text size.
- Let the header grow naturally with enlarged text instead of enforcing that height.
- Retain the exact label “Learn about the watch.” Match Settings in font size, weight and color.

## 2. Learn about the watch

### Keep

- Watch name and Marco attribution.
- Two concise paragraphs about the reversible faces and optional shock indicator.
- Four visible facts: calibre, power reserve, frequency and barrels.
- One source line linking to Marco’s watch information and original CAD.
- A continuous reading layout without accordions.

### Proposed changes

- Keep the 420 px desktop width as the reading-panel reference.
- Reduce the excessive space between the maker attribution and first paragraph.
- Preserve a solid dark background and 15–16 px body text with comfortable line spacing.
- Keep the heading and close control accessible during scrolling.
- Retain the nearly full-height modal reading sheet on phones.

The current amount of content is appropriate. Further improvements should focus on spacing and readability.

## 3. Settings

### Observation

Two instruction paragraphs and six wide camera buttons dominate the panel. Rendering quality, its main preference, appears at the bottom. The model-description section has already been removed.

### Proposed structure

1. **Rendering quality:** existing Automatic, High and Lightweight choices.
2. **Camera controls:** compact directional controls with zoom controls alongside them.
3. **Gestures and shortcuts:** short action/instruction rows.

### Proposed changes

- Use a 360 px desktop panel, aligned below the header actions.
- Remove the generic subtitle “Camera controls and rendering quality.”
- Replace the instruction paragraphs with concise rows for orbit/pan, zoom, selection and reset.
- Explain the current mode: dragging and arrow keys pan in All parts and orbit in the assembled view.
- Preserve all keyboard-accessible camera actions, clear accessible labels and comfortable touch targets.
- Keep the phone panel scrollable with a reachable close control.

## 4. Context and mechanism details

### Observation

Selecting a mechanism shows its name and explanation at the top left. Opening About mechanism repeats both, followed by repeated source links, operating instructions and a component list.

### Proposed changes

- Reduce persistent mechanism context to its name and a “Details” action.
- Show the explanation once, inside a 420 px details panel.
- Position details in a predictable relationship to the context that opens them.
- Consolidate repeated Marco source links into one source line while retaining support for the displayed facts.
- Move disassembly instructions next to the relevant controls.
- Group repeated components under names such as “Barrel 1” and “Barrel 2,” avoiding repeated assembly labels on every row.
- For a selected component, prioritize its name, location and Isolate / Show context action.
- Keep the All parts context compact, with its existing Find a component entry.

## Shared visual rules

- Use consistent 20 px panel padding, corner radii and close-button placement.
- Use 14 px control text and 15–16 px explanatory text as starting sizes.
- Reserve serif headings for the watch and mechanisms; use sans serif headings for utility panels such as Settings.
- Use a reliably dark surface behind long text.
- Size panel height to content and available space, with one scrolling body where needed.
- Preserve visible keyboard focus, focus return and enlarged-text support.

## Priority and acceptance

1. Tighten header spacing and preserve equal action weight.
2. Reorder and shorten Settings.
3. Remove duplicated mechanism information.
4. Refine learning-panel spacing.

Check desktop and narrow phone layouts, enlarged text, long mechanism names, panel switching, scrolling and keyboard dismissal. The watch should retain useful visible space, and every control and source link should remain reachable.
