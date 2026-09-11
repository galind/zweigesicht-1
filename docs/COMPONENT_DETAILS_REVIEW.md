# Component details — 11 September 2026

The balance bridge’s `0:1:1:221:1` is an assembly-instance address. It identifies a source occurrence, not a visitor-facing role, dimension or part number. It belongs in provenance rather than the main explanation.

Selection now leads with the existing human-readable name and a concise role explanation, without opening a popup or moving keyboard focus. Existing definition-specific explanations take priority; other descriptions follow readable component families. Unknown roles remain explicitly undocumented, including the regulation support’s unresolved intended visibility. These captions describe construction, not a validated running simulation.

The extra action is contextual: **About part** for selection and **About mechanism** for a mechanism, absent in the unselected whole view. The essential explanation is already inline. The optional nonmodal bottom panel adds assembly context or mechanism facts and its keyboard-accessible component list. Source names and instance addresses are inside a native, initially collapsed **Technical provenance** disclosure. Reopening or selecting another part collapses it again. Technical search and unique references remain in the explicitly named Source catalog under Options.

The existing dock, panel anchoring, single-panel ownership, close button, focus return and canvas keyboard controls are reused. No camera framing, geometry, source manifests or assembly identity is changed. Mechanism component rows show readable parent context rather than source addresses.

Regression coverage checks every catalog entry’s name and explanation for internal identifiers and verifies an explicit unknown-role fallback. The browser UX suite exercises balance bridge, third wheel, setting lever, dial ring, screw and regulation support through actual selection and React panel controls: inline copy, initially hidden provenance, disclosure, close/focus return, collapsed reopening and unchanged camera/stage bounds. Existing navigation, selection and dock checks remain in the same suite.

Release gates and independent mechanical, human-usability and physical-device review remain as recorded in PROGRESS.md.

Verification: all 74 CPU source/runtime checks, seven state tests, lint, TypeScript and production build pass. Desktop Chromium (1280×720) passes all 59 UX checks, including 24 new detail checks. An initial background-browser run hit the suite’s camera-settling timeout; the complete visible-preview rerun passed. Existing build warnings concern the large client chunk and Node module-registration deprecation.

Mobile Chromium viewport emulation (390×844) also passes all 59 UX checks. Manual browser checks cover Enter/Space disclosure, Escape and close/focus return, the mechanism component list, visitor mode without inspection tools, and 320×568 at 200% text. The enlarged selection summary and panel scroll; keyboard navigation reaches isolation and disclosure, and Close stays onscreen. No horizontal overflow was measured. This is not physical-phone or screen-reader certification. Reports and screenshots are local under `artifacts/browser/component-details/` (ignored).
