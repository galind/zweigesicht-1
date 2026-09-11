# Independent dials — local implementation review

11 September 2026. This extends the accepted static explorer; it is not a mechanical simulation or service sequence.

## Controls and state

Three hands and Skeleton each have a persistent visibility preference and their own hand style. All four visibility combinations are valid. The menu keeps both style rows available when hidden, uses 44 px controls, exposes pressed states, and retains the existing popup, focus and keyboard behavior. Visibility controls do not switch the camera side.

Reset restores the existing opening: back side, whole assembled movement, both dials hidden, Three hands Fine and Skeleton Lance. Side switching, exploration, Uncover, separation and All parts preserve preferences. Section scopes can temporarily omit an unrelated display with its host; returning to Whole movement restores every enabled display. Selecting a fitted display part preserves its fitted pose and finish. Hiding that selected display or replacing its selected blade clears the outgoing selection.

Preferences commit when requested. Geometry readiness is separate: an incomplete face is withheld as a whole. One shared catalog load supplies geometry; completion reads current preferences and presentation state, rather than restoring the state captured at request time. Failure exposes Retry without clearing preferences. Reset/hide invalidate obsolete feedback; Back reconciles restored preferences with missing geometry. A section fade owns material opacity until it finishes, so an interrupting dial change cannot capture temporary material flags.

## Transform evidence and ownership

Source geometry, matrices, identities, face annotations and source manifest records are unchanged. Existing `handDisplayMatrix` poses remain the fitted base, including the central Lance seconds' reviewed XY correction. Presentation translations/rotations compose above this base. All parts packs the same effective base matrix that is rendered, preserving the selected style and avoiding packing/render disagreement.

| Display | Section host proxy | Section separation endpoint |
| --- | --- | --- |
| Three hands | `p_0_1_1_1__0_1_1_1_4__0_1_1_83_20` (front-display cannon pinion) | +5 mm Z |
| Skeleton | `p_0_1_1_1__0_1_1_1_4__0_1_1_83_37__0_1_1_182_1` (rear-display cannon pinion) | −6 mm Z |

Each face travels as one aligned packet in assembly/section separation. Proxy identity is used for section placement, emphasis, Uncover ancestry and framing; source identity remains used for geometry, finishes, selection and provenance. In Time display, Uncover alone leaves both packets at their seats; the rear packet does not inherit the barrel bridge's cover-only displacement.

Complete separation computes packet offsets from the existing final movement envelope, dial structure bounds and the recorded 1 mm gap. The movement envelope is Z −47.245031… to +20.804085… mm. Three hands' fitted Z bounds are −2.1 to +1.92 mm; Skeleton's are −6.76 to −4.4319587… mm. The resulting translations are +23.904085… mm and −43.813072… mm. CPU checks independently compare the final transformed mesh envelopes and require at least 0.999 mm clearance (float tolerance). This proves presentation endpoint clearance, not collision-free motion or mechanical extraction ordering.

All parts contains 216 movement leaves plus 22 Three hands leaves and/or 21 Skeleton leaves: 216 / 238 / 237 / 259 parts. Only the selected variant's structures, hands and supports enter the layout. Each packed leaf retains source scale and authored fitted finish. Reassembly re-evaluates the immutable fitted/source matrices instead of accumulating inverse deltas.

## Verification and limitations

Verification: seven state tests, 75 CPU source/runtime checks, lint, TypeScript and the production build pass. Desktop 1440×900 and mobile 390×844 each pass 60 real-renderer dial checks and 47 dock/interaction checks. Manual review includes 320×568 at 200% text, keyboard scrolling, Space, arrow navigation, visible focus and Escape. Both style rows fit without scrolling at 390×844. Existing large-chunk and Node deprecation warnings remain.

Regression coverage lives in `tests/experience.test.mjs`, `scripts/cad/review-dials.mjs`, and the inspection panel's `Run dial checks`. It covers all four combinations, all styles, side changes, each section, Uncover, complete separation, exact reassembly, inventory bounds/selection, rapid changes, incomplete loading, failures/retries, Back, Reset, interrupted scope fades, manual camera ownership and graphics recovery.

Local browser reports and screenshots are kept in ignored `artifacts/browser/independent-dials/`. Desktop Chromium and mobile viewport emulation are distinct from physical-phone, screen-reader or cross-GPU certification. Expert mechanical review, human usability acceptance, CAD redistribution rights and publication approval remain open gates. No Site or CAD assets were uploaded, pushed or deployed in this milestone.
