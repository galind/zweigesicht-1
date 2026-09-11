# Independent dials — local implementation review

11 September 2026. This extends the accepted static explorer; it is not a mechanical simulation or service sequence.

## Controls and state

Three hands and Skeleton each have a persistent visibility preference and their own hand style. All four visibility combinations are valid. The simplified menu has two rows, each with an independent visibility switch and a native hand-style dropdown. Both remembered styles remain available when hidden. Controls have at least 44 px height, named select fields, pressed states and visible focus, within the existing dock popup.

The first opening remains back side with both dials hidden, Three hands Fine and Skeleton Lance. Reset view now reassembles and recenters the current side while retaining both visibility choices and both styles; it clears section, inventory, selection, isolation and separation. A retained display still loading is reconciled through the shared catalog request, with failure/retry remaining observable. Side switching, exploration, Uncover, separation and All parts preserve preferences. Deliberate menu choices now enable and turn toward the selected dial; choosing hands also enables that face. Hiding a dial leaves the camera alone. An unrelated section or isolated selection is cleared when necessary to show the requested face; Time display separation and whole separation are retained. All parts keeps its face-on inventory layout. The partner display and both styles remain independent. Menu intent commits before loading, so a late load cannot undo a subsequent side change or Reset. Raw `configureDials`/WebMCP configuration continues to preserve camera side. Section scopes can temporarily omit an unrelated display with its host; returning to Whole movement restores every enabled display. Selecting a fitted display part preserves its fitted pose and finish. Hiding that selected display or replacing its selected blade clears the outgoing selection.

Preferences commit when requested. Geometry readiness is separate: an incomplete face is withheld as a whole. One shared catalog load supplies geometry; completion reads current preferences and presentation state, rather than restoring the state captured at request time. Failure exposes Retry without clearing preferences. Reset/hide invalidate obsolete feedback; Back reconciles restored preferences with missing geometry. Dial visibility changes are immediate: all ready leaves appear together at their authored opacity, and hidden leaves disappear in the same update. Newly enabled leaves start at the current presentation target instead of travelling from a hidden stale pose. Geometry readiness still withholds an incomplete face as a whole. Section/Uncover transitions retain their existing scoped fades; dial toggles no longer create or capture temporary opacity/depth flags.

## Transform evidence and ownership

Source geometry, matrices, identities, face annotations and source manifest records are unchanged. Existing `handDisplayMatrix` poses remain the fitted base, including the central Lance seconds' reviewed XY correction. Presentation translations/rotations compose above this base. All parts packs the same effective base matrix that is rendered, preserving the selected style and avoiding packing/render disagreement.

| Display | Section host proxy | Section host translation (before leaf layers) |
| --- | --- | --- |
| Three hands | `p_0_1_1_1__0_1_1_1_4__0_1_1_83_20` (front-display cannon pinion) | +5 mm Z |
| Skeleton | `p_0_1_1_1__0_1_1_1_4__0_1_1_83_37__0_1_1_182_1` (rear-display cannon pinion) | −6 mm Z |

Following user review, each face separates into individual outward layers in assembly and Time display section separation. The original rigid packet behavior is superseded. Proxy identity is used for section placement, emphasis, Uncover ancestry and framing; source identity remains used for geometry, finishes, selection and provenance. In Time display, Uncover alone leaves both packets at their seats; the rear packet does not inherit the barrel bridge's cover-only displacement.

Complete separation computes base display offsets from the existing final movement envelope, dial structure bounds and the recorded 1 mm gap. The movement envelope is Z −47.245031… to +20.804085… mm. Three hands' fitted Z bounds are −2.1 to +1.92 mm; Skeleton's are −6.76 to −4.4319587… mm. The base translations are +23.904085… mm and −43.813072… mm; each leaf adds its outward layer offset. CPU checks independently compare the final transformed mesh envelopes and require at least 0.999 mm clearance (float tolerance). This proves presentation endpoint clearance, not collision-free motion or mechanical extraction ordering.

The illustrative layers are source-specific. Three hands separates toward +Z: outer ring C4 → inner disc C5 → transition ring C1 → logo C23 and the 12 indices → hour support → hour blade → minute support → minute blade → seconds support → seconds blade. Skeleton separates toward −Z: carrier S19 → enamel S28 → screws S11/S17/S22 → 12 indices → hour support → hour blade → minute support → minute blade. C/S shorthand identifies occurrences under the respective face roots in `dial-configurations.json`. Blade/support pairings use `hand-display-poses.json`, rather than sorting bent blades by bounding-box centers.

Layer spacing uses full source Z bounds across every supported style and the existing 1 mm gap. Thus changing styles never displaces unrelated leaves. Repeated indices and screws share axial layers because their original XY seats are disjoint; they remain separate source meshes. Translation preserves fitted XY alignment. Uncover alone adds no individual layer offset. CPU checks use actual decoded mesh bounds for every style pair, verify adjacent layer clearance and disjoint repeated seats, and restore exact fitted matrices after partial/reversed travel.

All parts presents the display surfaces toward the inventory camera (world −Z, with −Y up). Three hands leaves rotate π about world X; Skeleton leaves keep their fitted orientation. Fitted display parts skip the generic bounding-box orientation heuristic and tilt, which could turn a narrow bent blade edge-on. Packing uses these exact rotations above the fitted matrix. This is rigid presentation orientation, with no geometry, scale, material or source-matrix edits.

All parts contains 216 movement leaves plus 22 Three hands leaves and/or 21 Skeleton leaves: 216 / 238 / 237 / 259 parts. Only the selected variant's structures, hands and supports enter the layout. Each packed leaf retains source scale and authored fitted finish. Reassembly re-evaluates the immutable fitted/source matrices instead of accumulating inverse deltas.

## Verification and limitations

Current follow-up verification: seven state tests, 76 CPU source/runtime checks, lint, TypeScript and the production build pass. Desktop 1440×900 and mobile 390×844 each pass 64 real-renderer dial checks, including new actual layer-clearance and forward/upright orientation assertions. Manual visual checks cover both separated faces, inventory and reassembly. The preceding control milestone also passed 47 dock/interaction checks on each viewport; its manual review includes 320×568 at 200% text, keyboard scrolling, Space, arrow navigation, visible focus and Escape. Both style rows fit without scrolling at 390×844. Existing large-chunk and Node deprecation warnings remain.

Regression coverage lives in `tests/experience.test.mjs`, `scripts/cad/review-dials.mjs`, and the inspection panel's `Run dial checks`. It covers all four combinations, all styles, side changes, each section, Uncover, complete separation, exact reassembly, inventory bounds/selection, rapid changes, incomplete loading, failures/retries, Back, Reset, interrupted scope fades, manual camera ownership and graphics recovery.

Local browser reports and screenshots are kept in ignored `artifacts/browser/independent-dials/`, with the individual-parts follow-up in `artifacts/browser/dial-parts-followup/`. Desktop Chromium and mobile viewport emulation are distinct from physical-phone, screen-reader or cross-GPU certification. Expert mechanical review, human usability acceptance, CAD redistribution rights and publication approval remain open gates. No Site or CAD assets were uploaded, pushed or deployed in this milestone.


### Immediate visibility refinement

Later user review requested the complete dial to appear together. Per-mesh dial fades were removed; ready faces now become visible at authored opacity in one update, including their hands/supports. Newly enabled leaves do not animate from stale hidden transforms. Incomplete loading still withholds the full face. Verification passes: seven state tests, 77 CPU/runtime checks, lint, TypeScript, build and 68 desktop browser dial checks. Manual 390×844 mobile review covers both faces, rapid keyboard toggle reversal, side switching and exact fitted poses. Evidence is in ignored `artifacts/browser/dial-instant-reveal/`.


### Compact menu and automatic face choice

The latest menu uses two switch/dropdown rows instead of six style buttons and redundant status captions. Native selects support keyboard and touch input; enlarged text stacks each row. The header reserves space for Close without obscuring focus outlines. Menu choices enable and face the chosen display while retaining its partner, remembered styles and applicable separation. Hiding preserves side; All parts stays in its front-facing inventory. Obstructing isolation or unrelated section scope is cleared. Configuration from raw tooling preserves its existing side behavior.

Verification: seven state tests, 78 CPU/runtime checks, lint, TypeScript and build pass. Desktop/mobile dial checks each pass 73 assertions, and mobile dock UX checks pass all 47. Manual 390×844 and 320×568/200% text checks cover 44 px controls, native keyboard selection, focus, scrolling and absence of horizontal overflow. Final scope/isolation refinements were included in the mobile and CPU runs. Evidence: ignored `artifacts/browser/simple-dial-menu/`.


### Reset view keeps the configured displays

Reset now retains both visibility preferences, both hand styles and the current side. It clears exploration/layout/selection/separation and recenters the assembled view. The initial opening remains unchanged. Retained incomplete geometry reconciles through the shared catalog load, and failure stays retryable. Verification: eight state tests, 79 CPU/runtime checks, lint, TypeScript and build; 77 desktop browser dial checks; manual mobile reset with both non-default displays and exact reassembly. Evidence: ignored `artifacts/browser/reset-keeps-dials/`.
