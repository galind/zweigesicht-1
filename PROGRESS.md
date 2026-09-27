# Current project status

Updated 27 September 2026. This file summarizes the checkout. Earlier milestone reports are recoverable from Git at `e5c890f`.

## Implemented

The real-CAD static explorer includes all 426 source hierarchy instances, six functional groups, component inspection/isolation, complete separation, All parts, shared dial visibility with independent hand configurations and authored finishes. Running-watch simulation was removed by user decision. Reset preserves the current side and dial preferences.

Later refinements include straight-on opening/Reset, independent inventory flipping, upright screw and hand presentation, revised frosting and dial finishes, diamond internal-facet shading, stable loading layout, visible author/independence credit and minimal homepage SEO. Maintenance constraints are in [CAD notes](docs/CAD_NOTES.md) and [runtime architecture](docs/LOCAL_ARCHITECTURE.md).

## Homepage and Workshop visual parity — 27 September 2026

The Workshop now uses the homepage's typography, header geometry, responsive menu treatment, glass surfaces, neutral/warm palette, button radii, control sizing, popup chrome and focus language. Its larger assembly tray remains route-specific, but no longer carries a separate visual system. Shared site tokens now own the overlay, panel, rule and active-state colors used by both routes.

Both movement-loading paths replace the progress-bar treatment with a shared animated `gg` mark, retain concise loading/transfer status and present a static mark when reduced motion is requested. Error and retry paths remain unchanged.

Verification: 67 automated state/lifecycle/packaging tests and inventory validation pass; TypeScript, lint and production build pass. A focused browser matrix passes 35 visual parity/loading checks across desktop, 390 px, 320 px, landscape and 200% text, including matched header, identity, navigation-control, dock and popup styles, no horizontal overflow, 44 px targets, animated loaders and reduced motion. All 87 current inventory drag/touch/workbench checks and 15 homepage navigation/viewer checks pass with no uncaught browser errors. Evidence remains ignored under `artifacts/browser/home-workshop-parity/`. No push or publication has been performed.

## Quiet interface redesign — 14 September 2026

Implemented the approved glass-rail sketch around the existing 3D viewer. Small identity, four maker/information links, compact bottom controls and on-demand watch/specification panels replace the prominent controls and footer. Phones use About; Explore retains All parts, source catalog, history, keyboard camera controls and quality. Author credit, source links, independence and source-geometry limitations remain discoverable in About.

Both dials open hidden and share one toggle throughout UI, controller, restored state and WebMCP. Hand choices remain independent and remembered while hidden. Complete-pair geometry gating prevents a persistent half-shown display after partial loading or failure. Reset still preserves side and dial preferences. No geometry, authored finishes, static construction behavior or deployment assets changed.

Fresh verification: 11 state tests, 89 CPU source/runtime checks, TypeScript, lint, production build and SEO/HTTP checks pass. Browser suites pass 129 checks: 57 dial checks (including loading failure/retry, rapid changes, separation, Reset and WebGL recovery), 22 inventory checks and 50 interface checks (including component selection/isolation, stable framing and contextual-panel focus). Desktop (1440×900) and phone (390×844 and 320×740) browser checks cover quiet navigation, keyboard dismissal/focus, 200% text, touch targets, hidden style changes, visible dial failure/retry, WebMCP and no-3D descriptions/retry. Local screenshots and numeric evidence are in ignored `artifacts/browser/quiet-redesign/`.

Watch copy reuses the project's maker-attributed facts; the maker's CAD and main pages were checked. The watch specification page timed out during this work, so no new dimensions or unverified sketch values were added. Physical-device and representative accessibility review remain outstanding. Next implementation action: user review of the local redesign. No push or deployment is authorized or performed.

Layout correction after user feedback: the canvas now fills the entire viewport, with the identity, side navigation and bottom controls floating over it. Removed reserved layout space, surface borders and shadows; the translucent tint matches the empty background and reveals its blur over geometry. Keyboard focus indicators remain visible. Fresh checks for this CSS revision: lint and production build pass; browser inspection confirms a 1440×900 desktop canvas and 390×844 mobile canvas both start at (0, 0), About does not resize the canvas, and mobile controls remain within the viewport without horizontal overflow at normal and 200% text. Updated desktop/mobile captures are `overlay-desktop.png` and `overlay-mobile.png` in the existing ignored evidence directory. Awaiting local user review; no push or deployment.

## Control hierarchy refinement — 14 September 2026

Separate now leads the bottom controls with stronger text/icon emphasis, followed by Focus, a standalone All parts toggle, Dials & hands and Flip; Reset stays secondary. Focus contains section choices and Previous view. About is available at every width; its Using the viewer section opens Viewer settings for camera controls and rendering quality.

All parts exposes Find a component. Search defaults to physical components included in the current view (including occluded components), using renderer visibility from the snapshot. Include all CAD entries expands to the full hierarchy. Results distinguish parts, assemblies containing displayed parts, and entries not shown, while retaining source names, IDs and exception categories. Selecting an entry retains existing loading, inspection and isolation behavior.

Verification for this revision: 11 state tests, 89 CPU runtime checks, TypeScript, lint and production build pass. All 53 browser UX checks pass, including new scope/filter and focus-return checks. Manual desktop/mobile verification covers the direct All parts action, component search and assembly selection, About/settings, and 200% text without horizontal overflow. Desktop/mobile captures are `controls-desktop.png` and `controls-mobile.png` in the existing ignored evidence directory. Physical-device review remains outstanding. Ready for local user review; no push or deployment.

Follow-up simplification: removed Previous view from Focus and restored Separate’s original regular text and icon styling. Its first position supplies priority without extra visual weight. Updated the existing UX expectation; TypeScript, lint and targeted browser inspection pass (seven Focus choices, matching control text weight/color, and visual review).

## Watch configuration — 14 September 2026

Implemented [the configuration goal](docs/WATCH_CONFIGURATION_GOAL.md) on `codex/quiet-movement-redesign`. Configure replaces Dials & hands while preserving the full-viewport canvas, quiet controls, Separate-first order, standalone All parts and seven-choice Focus menu. Case and shared dial visibility start off and remain independent. Case appearances are stainless steel, rose gold and platinum; Three hands keeps stable Fine/Lance/Open lance shape IDs and adds a separate finish selector. Fine supports blue and rose gold; other shapes normalize to blue with visible feedback. Skeleton styles/finishes remain unchanged. Reset preserves side and all configuration preferences.

The fitted-case audit selects 41 physical leaves: source packets 1/2/3/6/7/8 plus matching d51 attachments under children 4/9. It includes both original crystal/back occurrences, seals, crown and required attachment hardware, excluding alternate lugs, leather and buckles. Original matrices, material scopes and exclusions are recorded in `assets/authored/watch-configurations.json`; maker URLs, image hashes and compatibility decisions are in `assets/source-manifest/watch-configuration.json`.

Original d54 face 1 was missing (28.357985 mm²). Independent meshing of that original face at 0.03 mm yields 34 triangles and 28.227462 mm² (0.46% area difference), without changing source wires/surfaces. The generated 2,105-byte recovery sidecar is hash checked and shared by the four source occurrences; only two belong to the fitted case. It remains ignored and requires local generation on another checkout. Source STEP and committed GLBs are unchanged.

The existing asynchronous catalog loader coalesces case and dial requests, retains current rendering on failure and exposes retry. Complete-case and complete-dial-pair gates prevent partial fitted assemblies. Scoped per-instance materials preserve movement, markers/logo, supports and raw-catalog appearance. The case temporarily hides in Focus, All parts, raw external inspection and isolation, then restores its retained preference. Case pieces separate clear of the movement along illustrative paths and return to exact source matrices at zero/Reset. Both crystals remain transparent and allow underlying pointer selection; explicit catalog selection still works.

Verification: 13 state tests, 95 CPU source/runtime checks, TypeScript, lint and production build pass. Browser suites pass 301 checks: 173 watch checks (including 144 enabled case/dial/hand combinations on both faces), 55 dial, 20 inventory and 53 interface checks. Coverage includes failure/retry, last-intent loading races, six Focus groups, raw crystal/lug selection, isolation, separation/reversal, Reset, resource reuse/idle rendering, shader scoping and WebGL recovery. A real six-second catalog-delay check retains the latest hidden-case/platinum intent and uses one catalog request. Unmount disposal and corrupt recovery are checked in CPU fixtures. Browser dimensions were 1280×720 on desktop; exact-size embedded frames provided 390×844 and 320×740 phone CSS viewports after the browser viewport override did not apply. Checks confirm full-viewport canvas, no horizontal overflow, >=44 px controls, 200% text, scrollable options, Escape/focus return and no-3D fallback. This is viewport emulation, not physical-device review. One focus-return assertion failed during concurrent interaction with another tab; the isolated rerun passed all 53 interface checks, and both traces are retained. Local asset preparation reproduced the recovery hash without changing committed CAD payloads.

Screenshots and reports are local in ignored `artifacts/browser/watch-configuration/`; source recovery and CPU reports are in ignored `artifacts/case-cad/`. Remaining limits: alloy appearances reuse the SS geometry and authored optical values; a full maker ordering/compatibility matrix was not established, and the detailed watch page timed out. Transparent crystal reflections and separation paths are presentation approximations. Physical-device, representative accessibility/human usability, mechanical review and publication/redistribution release gates remain outstanding. Ready for local user review. No push, merge or deployment was performed.

## Watch refinement — 15 September 2026

Addressed the follow-up review on `codex/quiet-movement-redesign`. Skeleton stays the default main face, now with the lugs turned toward the opposite face. Flip reconfigures both complete attachment packets along an eased outward turn and lands at the exact opposite source occurrences. All 18 mappings use the same definition IDs; no new geometry or alternate duplicates are displayed. Rapid reversals continue from the displayed pose, reduced motion snaps, and separation remains independent. The clearing arc is illustrative, not a service sequence.

Fine hands now follow the case material even while hidden: blue for steel, gold for rose gold/platinum. UI, API, history and Reset use the same normalization. The material field explains its case-dependent value. This rule follows explicit user direction, recorded separately from manufacturer evidence. Selecting a fitted case part retains the complete configured watch and its finishes; isolation remains an explicit action. Unfitted CAD entries retain source inspection behavior.

The crown's M background is frosted on original d46 face 468 (5.828602 mm² at local X=3.4). Raised M faces at X=3.5, rim and knurling remain smooth. A reproducible source probe and recorded scope accompany the shader change.

Verification: 14 state tests, 96 CPU source/runtime checks, TypeScript, lint and production build pass. All 307 browser checks pass: 179 watch, 55 dial, 20 inventory and 53 interface checks. Reports and screenshots are recorded in ignored `artifacts/browser/watch-refinement/`. Desktop visual review covers both fitted faces, the turn, steel/rose-gold/platinum Fine hands and the crown close-up. A 320×740 CSS viewport at 200% text has no horizontal overflow; the linked finish and live announcement are correct, and Escape restores Configure focus after dismissal. Existing physical-device, mechanical and release-gate limitations remain. No push, merge or deployment.

Bushing follow-up: the three fitted central Zeigerbuchse parts (d34/d38/d41) now share the Fine blades’ gold override on rose-gold/platinum configurations. Source names confirm the scope. Switching to steel or another shape restores their original blue finish, and hidden displays stay hidden. Fresh verification: 96 CPU checks (including all case/shape/visibility bushing combinations), TypeScript, lint and build pass; browser visual review covers rose gold, platinum and steel restoration. Updated screenshots are `platinum-matched-bushings.png` and `rose-matched-bushings.png` in the refinement evidence directory.

Polish and lug-hardware follow-up: fitted gold hands and bushings now use polished gold throughout (authored roughness 0.075), overriding the source-white seconds counterweight and other surface color roles. Lug screw bars d55 and their d53 end screws match the selected case material. All d53/d57 lug screws already followed their attachments; the four ring-mounted d72 locking pins now accompany the outward flip arc and return to their immutable source seats. Fresh verification: 97 CPU checks, 184 browser watch checks, TypeScript, lint and production build pass. Coverage includes complete gold surface override, scoped bar finishes, pin motion and reversal continuity, exact endpoints, loading/retry and resource reuse. Visual captures and `polish-hardware-checks.json` are in the existing refinement evidence directory. The motion remains illustrative; no source geometry, push or deployment changes.

Menu simplification: removed the Three hands shape selector from Configure and gave the Skeleton selector its own row. Existing configuration state and API support remain available. Updated the panel description. TypeScript, lint and targeted browser inspection pass.

## Motion refinement — 15 September 2026

Separate now includes a one-click Separate movement / Reassemble action beside the retained precision slider; focused sections have the same control. The one-click action dismisses the panel and returns focus to Separate so the full animation stays visible; slider adjustments keep the panel open. Full opening takes 1.25 seconds and closing 1.05 seconds, with proportionally shorter partial moves. Camera and parts share the same easing and duration. A bounded quintic curve softens acceleration and braking across separation, camera navigation, Flip/lug turns, All parts and cutaway fades. Direct slider input uses an immediate-response ease-out and retains its 75 ms settling window. Panels use a 6 px lift with 180 ms entrance / 120 ms exit; hover feedback is restrained. No looping or overshooting motion was added.

Fixed cancellation before the first separation frame and made interpolated state land exactly on its requested endpoint. Reduced-motion preference changes are observed live and snap active movement to its destination; the listener is removed on disposal. Original geometry, separation paths, authored finishes and source transforms remain unchanged.

Verification: 16 state/motion tests, 98 CPU runtime checks, TypeScript, lint and production build pass. New CPU coverage checks monotonic motion at 30/60/120 Hz, exact endpoints, immediate cancellation and interrupted reversal. Browser separation checks pass all 8 assertions (both faces, intermediate poses, six Focus sections, viewport containment, reduced motion, camera ownership, resource reuse and idle rendering); watch checks pass all 184 assertions, inventory checks pass all 20 and interface checks pass all 53. Visual review includes sampled real opening/closing frames, a 390×844 phone viewport and 320×740 at 200% text. The new action and keyboard slider remain reachable in the scrolling panel with no horizontal overflow. One watch run was interrupted by hot reload during development; the subsequent stable run passed all 184 checks. Physical-device and human motion-preference review remain outstanding. Ready for local user review. No push or deployment.

## Information simplification — 15 September 2026

Removed the middle-right link rail. A single About the watch action opens directly to the existing maker-attributed watch features, with a short introduction and expandable movement specifications. Original CAD, watch sources, independent-viewer credit and geometry limitations, and Viewer settings remain accessible in the panel footer. The identity now includes a linked A watch by Marco Lang credit. The obsolete menu/specification page state and rail styles are removed; the component is now InformationPanel.

The reading panel remains scrollable and leaves the full-viewport canvas in place. Header and contextual-panel spacing accommodates the maker credit, phone widths and enlarged text. Escape restores About focus; opening Viewer settings gives its scroll area focus without the outgoing panel stealing it.

Verification: 16 state/motion tests, CPU source/runtime checks, TypeScript, lint and production build pass. All 53 existing browser interface checks pass. Targeted browser review covers desktop, 390×844 and 320×740 at 200% text, specifications expansion, keyboard dismissal, settings handoff and no horizontal overflow. Phone checks are viewport emulation; physical-device and representative accessibility review remain outstanding. Ready for local review; no push or publication. Existing release gates remain applicable.

### Learning entry and content review — 15 September 2026

Renamed the trigger to Learn about the watch. Increased reading-panel clearance for the longer label, including the 320×740 enlarged-text layout. TypeScript, lint and production build pass; targeted browser review confirms the exact label and no header/panel overlap or horizontal overflow at 200% text.

Content review recommendation (not yet implemented): lead with how the two faces can be worn by changing strap attachments, merge the repeated two-face introduction, retain concise explanations of the twin barrels and optional shock indicator, and connect those explanations to existing viewer actions. Keep technical specifications collapsed. Consolidate source links and viewer attribution, move operating instructions to viewer help, and retain detailed geometry exceptions in a secondary model-notes disclosure. On phones, a taller reading sheet would offer more useful reading space than the current panel above the visible controls. Maker facts were checked against https://www.marcolangwatches.com/en/watches/ on this date. No publication.

### Marco-focused attribution — 15 September 2026

Removed the personal creator credit and personal-site link from the reading panel, and removed the WebApplication creator entry from structured metadata. Marco Lang’s watch/CAD attribution and the independent-viewer explanation remain. The configured canonical hostname is unchanged. Updated the existing SEO check to match the absent creator and the reading-panel entry introduced by the earlier rail removal.

Verification: TypeScript, lint, production build and SEO/HTTP checks pass. Browser inspection of the expanded viewer information confirms no personal name or personal-site link, with Marco’s attribution retained. Committed locally; no push or publication. The proposed continuous reading layout is still a recommendation, not an implemented change.

## Continuous watch reading panel — 15 September 2026

Implemented the approved cleanup, superseding the earlier content-review recommendations. Learn about the watch now opens one Marco-focused reading surface: the watch name and maker, two concise paragraphs about the reversible faces and optional shock indicator, four always-visible facts, and one source line. Both accordions, repeated headings, extra specification rows and the in-panel settings link are removed. Copy follows the maker watch page checked earlier on this date; source links remain available and no personal credit returns.

The panel has a solid dark background, 16 px body text, aligned spacing and one divider. Its header and close button remain in place during scrolling. Desktop uses a 420 px side panel; phones use a nearly full-height modal sheet covering the controls, with keyboard focus contained until dismissal. Enlarged phone text stacks fact labels above values. Opening and closing the reading surface preserves canvas dimensions and watch state.

Settings now sits beside Reset in the bottom controls. It contains the existing camera and rendering controls followed by plain model-note sections, retaining independence, source attribution and geometry limitations without nested disclosures. Closing it returns focus to Settings. Phone controls arrange the five primary actions above the secondary Reset/Settings row.

Verification: 16 state/motion tests, 98 CPU source/runtime checks, TypeScript, lint, production build and SEO/HTTP checks pass. All 53 browser interface checks pass after updating their Settings entry/focus expectations. Visual and keyboard review covers 1440×900 desktop, 390×844 phone, and 320×740 at 200% text: no reading-area horizontal overflow, reachable sources, fixed close control, mobile focus containment, Escape/focus return, four visible fact rows and no accordion elements. Phone checks use viewport emulation; physical-device and representative accessibility review remain outstanding. Ready for local review; no push or publication.

### Settings in the header — 15 September 2026

Moved Settings next to Learn about the watch in a shared top-right navigation group. Its panel now opens below that group; phone and enlarged-text layouts place both actions below the identity with clearance above Settings and contextual information. The bottom dock returns to Separate, Focus, All parts, Configure, Flip and Reset, with the original compact phone grid. Switching between the two header panels transfers keyboard focus into the new panel; dismissal returns it to the corresponding trigger.

Verification: TypeScript, lint, production build and all 53 browser interface checks pass. Targeted keyboard and DOM layout checks cover desktop, 390×844 phone and 320×740 at 200% text, including panel clearance, no horizontal overflow, settings scrolling and focus restoration. Browser pointer/screenshot coordinates were inconsistent with the emulated viewport during this run, so interactions used the supported keyboard API and geometry assertions. No push or publication.

Settings emphasis follow-up: removed its muted-color override so both header actions share the same color, 13 px font size and 400 font weight. Computed browser styles confirm the match; lint and production build pass. Saved locally; no publication.

Settings copy follow-up: removed the entire About the model section and its heading, source link and unused styling from Settings. The panel now contains camera instructions/controls and rendering quality. Source and geometry records remain in the repository; structured metadata retains the independent-viewer description. TypeScript, lint, production build and targeted browser inspection pass. No publication.

## Domain and repository checkpoint

The checkout includes merged PRs #1 (homepage SEO), #2 (loading layout) and #3 (custom domain), through `3a889f4`. Canonical and social metadata use `https://zweigesicht-1.guillemgalindo.com/`.

On 14 September, Vercel confirmed valid configuration for `zweigesicht-1.guillemgalindo.com` on project `zweigesicht-1` (`prj_Z2S8IQ88PypFXHg6JktpE2CJMoju`); a fresh HTTPS check returned 200.

At the user's request, the four redirect hostnames were later removed from the Vercel project. Only the canonical `zweigesicht-1.guillemgalindo.com` remains attached there; the dashboard CDN routing rule, `Redirect watch domains to Marco Lang` (`01e4b6ab-ca8b-4eda-a001-adf5f2d20dda`), remains in place but has no attached watch domains.

Both domains now use Namecheap BasicDNS. Namecheap Domain-tab forwarding is configured for `zweigesicht-1.com`, `www.zweigesicht-1.com`, `thesevenspheres.com` and `www.thesevenspheres.com`, each targeting `https://www.marcolangwatches.com/`. The obsolete Vercel A records and Seven Spheres `www` CNAME were removed; mail settings and the locked SPF record were retained.

Configuration was visibly confirmed in Namecheap on 15 September. Immediate browser checks still reached cached Vercel 404 responses for all four hosts, so public redirect behavior remains pending DNS/forwarding propagation. No site build or CAD deployment was performed for these redirects.

## Verification and limits

Previously recorded checks include lint, TypeScript, production and Vercel builds, SEO HTTP checks, 10 state tests and 88 CPU source/runtime checks across the relevant milestones. Their exact scope and dates are in Git history; these are not fresh test results for every subsequent commit. Browser evidence includes desktop Chromium and mobile viewport emulation, not physical-phone certification.

Mechanical contact/deformation fidelity, remaining source/variant exceptions, physical-device and human usability review, redistribution rights and publication approval remain subject to the [release gates](docs/RELEASE_GATES.md). Authored finishes and separation paths are visual interpretations, not measured materials or service instructions.

## Documentation consolidation — 14 September 2026

Reduced `docs/` from 24 Markdown files to three: runtime architecture, CAD maintenance notes and release gates. Removed completed reviews, the duplicate generated ledger, the documentation index and the archived progress copy; Git preserves them at `e5c890f`. Source manifests, authored data and detailed JSON evidence are retained. The ledger generator now emits only its JSON record; evidence-page links point to retained files.

Validation: local documentation/evidence links, script syntax and staged diff checked. No viewer behavior or assets changed; runtime suites were not rerun.

### Disassemble naming and hand-material cleanup — 15 September 2026

Renamed the Separate entry and its related panel/action/slider copy to Disassemble, retaining Reassemble and the existing behavior. Removed the hand-material field entirely and reduced its explanatory note to configuration persistence. The Skeleton style selector remains; Three hands still supports Fine, Lance and Open lance internally, but its previously removed shape selector has not been restored.

Verification: TypeScript, lint and production build pass. Targeted browser inspection confirms the renamed controls and absence of the material field; the bottom controls fit at 320×740 without horizontal overflow. No push or publication.

### UI review split — 15 September 2026

Recorded the general UI analysis in [top UI review](docs/UI_REVIEW_TOP.md) and [bottom UI review](docs/UI_REVIEW_BOTTOM.md), each with a summary, detailed recommendations and priorities. The bottom review incorporates the completed Disassemble rename and removal of the material field; restoring the Three hands shape selector remains a proposal. Documentation only; links and diff checked, with no UI changes or runtime tests required.

## Top interface improvements — 15 September 2026

Implemented the approved [top UI review](docs/UI_REVIEW_TOP.md). The header now uses “By Marco Lang,” aligned desktop actions and content-driven positioning. Learn about the watch and Settings share 14 px text, weight and color. Desktop margins are 24 px; phone margins are 16 px. The 390×844 phone header ends at approximately 112 px, and enlarged text expands it naturally. Header/context measurements position portaled panels without reserving canvas space.

Settings is a 360 px desktop panel with rendering quality first, a keyboard-accessible directional pad and adjacent zoom controls, followed by concise gesture/shortcut rows. Labels and instructions switch between orbit and All parts pan. Mechanism context shows its name and Details; the 420 px details surface opens directly below it with one explanation, consolidated source links and components grouped by parent assembly (including Barrel 1 and Barrel 2). Component selection shows its name, assembly location and isolation action. Disassembly instructions now accompany the section controls. The continuous watch reading panel retains its content and phone modal behavior with tighter attribution-to-body spacing. Top reading surfaces use fixed close controls, sticky headings and one scrolling body.

Verification: 16 state/motion tests, CPU source/runtime checks, TypeScript, lint, production build and SEO/HTTP checks pass. All 53 existing browser interface checks pass. Targeted browser review covers 1280×720 desktop, 390×844 phone and 320×740 at 200% text: matching header-action styles, full-viewport canvas, no horizontal overflow, panel switching, Escape/focus restoration, reachable reading sources, long mechanism names, contextual panel placement, grouped component selection, and all six 44×44 px camera controls in All parts. Phone checks use viewport emulation; physical-device and representative accessibility review remain outstanding. Ready for local user review; no push or publication.

Top-left follow-up: watch name and Marco Lang credit now share one row inside the restored translucent identity background (40% dark tint, 12 px blur, 9 px corners). The maker link keeps its 44 px target; the identity wraps naturally with enlarged text. The phone header now ends at 96 px at 390×844. Lint and production build pass; browser review verifies desktop/phone alignment, restored background styles, and 320×740 at 200% text without horizontal overflow or Settings overlap. Local change only; no push or publication.

Identity hierarchy follow-up: the watch name now uses bold 20 px serif text, with a clearer 13 px maker credit. The identity, credit and desktop header actions align on their text baselines; phone rows share text padding and wrapped action text stays left-aligned. The restored glass background remains. Desktop and 320 px phone checks, including 200% text, confirm readable alignment and no horizontal overflow. Lint and production build pass. Local only; no push or publication.

Identity typography correction after screenshot review: replaced the heavy Georgia title with an 18 px semibold Arial title and a 14 px credit, matching the interface font family. Both texts use centered alignment and matching line-height proportions; measured desktop text centers are equal (37.75 px), with the right-side actions within 0.21 px. The glass surface and 44 px maker link remain. Lint/build pass; 320 px phone and enlarged-text checks confirm wrapping without horizontal overflow. Local only; no push or publication.

Acknowledgements entry: changed the identity credit to lowercase “by Marco Lang” and added Acknowledgements between Learn about the watch and Settings. Its placeholder panel says “Coming soon.”; the personal thanks will be supplied later. It participates in panel switching, Escape handling and focus restoration. Header actions wrap on narrower desktops, use two rows on phones, and stack at enlarged phone text. TypeScript, lint and production build pass. Targeted browser checks verify the new trigger/panel, switching both ways with Settings, Escape returning focus, and 390 px / 320 px at 200% text without horizontal overflow or header/panel overlap. No push or publication.

## Bottom interface improvements — 15 September 2026

Implemented the approved [bottom UI review](docs/UI_REVIEW_BOTTOM.md). The six-action order remains Disassemble, Focus, All parts, Configure, Flip and Reset view. Flip and camera rotation retain their existing behavior. Dock labels share a readable size; active modes use a persistent highlight and an independent underline identifies an open panel. Focus stays selected after closing, and All parts flip state is visible. The 390 px dock retains two equal 44 px rows (96 px overall); enlarged text uses two columns with equal targets.

Disassemble and Focus now use 320 px desktop panels, Configure 360 px and the component finder 420 px. Bottom panels use consistent 20 px padding, 16 px minimum side margins, sticky headings, fixed close controls and one scrolling body. Disassemble has a single heading, mechanism context, Spacing and Move covers aside sliders with aligned percentages and adjacent instructions. Focus uses checkmarks without decorative numbers or action chevrons. In All parts it contains Fit all and the existing inventory group-framing choices. Disassemble in All parts now offers Reassemble, returning to the whole assembled movement while retaining watch configuration and assembly side; the All parts toggle and Reset remain alternative exits. Inventory framing immediately emits its selected state so the menu and dock agree.

Configure presents continuous Case and Dials & hands groups and restores the Three hands selector (Fine, Lance, Open lance). Skeleton is labeled Skeleton hands. Hand material remains absent, with automatic finishes and hidden preferences preserved. The short hidden-case message appears only when a requested case is temporarily suppressed, with existing loading/error/retry feedback retained.

The component finder now has search, scope, one filtered count and one results list. Entries show readable names and locations such as Twin barrels · Barrel 2; exception statuses and assembly distinctions remain. Original names, CAD references and readable locations are searchable. A selected component’s Details action exposes original name, source instance, definition, viewer ID and type while retaining isolation and focus restoration.

Verification: 16 state/motion tests, CPU source/runtime checks, TypeScript, lint, production build and SEO/HTTP checks pass. Browser suites pass 59 interface checks (including the relocated Focus choices, persistent active states and Reassemble return) and 182 watch checks, covering configuration combinations, automatic finishes, lug flipping, recovery and geometry/resource preservation. The watch suite used an already-loaded catalog; a separate cold browser check verifies visible dial failure and successful Retry dials. Targeted browser review covers 1280×720 desktop, 390×844 phone, and 320×740 at 200% text: no horizontal overflow, equal dock targets, scrollable controls, reachable close buttons, keyboard slider changes, hidden configuration choices retained through Reset, CAD-name/ID search, empty results, selected source details, inventory flip styling and no-3D mechanism descriptions. Final spacing/copy refinements passed lint/build and targeted enlarged-text review. Evidence is local in ignored `artifacts/browser/bottom-review/`.

Ready for local user review. Phone checks use viewport emulation; physical-device and representative accessibility review remain outstanding. No push or publication.


### Branch deployment — 15 September 2026

At the user’s request, pushed `codex/quiet-movement-redesign` over SSH; GitHub reported a pending Vercel deployment for `57a098d`. Deployment packaging review found that the required 2,105-byte case recovery sidecar was still ignored and omitted from Vercel’s asset allowlist. Included that existing runtime sidecar and retained it during output pruning, with its SHA-256 verified against the loader and source record (`c45e91a76b2182d2dfb184d797be44c21dc63466a3b042d59a8cf2625959a9d2`). Original CAD downloads remain excluded. The requested deployment does not establish mechanical certification or physical-device review.

Validation: `build:vercel` passes and the pruned deployment output retains the recovery sidecar with its exact recorded hash. Pushing the packaging correction triggers a replacement branch preview.


## Material reconciliation — 22 September 2026

Implemented the approved material review: fitted dial II now uses translucent blue vitreous enamel (dielectric, transmission 0.58); nine train/display wheel definitions use a dedicated restrained 14 ct hard-gold appearance with retained circular brushing; four balance eccentric weights use polished gold independently of the unchanged rim. Ruby base and absorption colors shift slightly toward pink-magenta while retaining polish, IOR and transmission. Bridge borders, bridge frosting, crown-wheel finish, the unresolved escape-wheel/collet appearances, and source geometry remain unchanged.

Current physical-material evidence, finishes and rendering approximations are separated in `assets/authored/material-review.json`, with reference URLs in `assets/source-manifest/material-review.json`. The appearance ledger is regenerated from current runtime assignments and shares the fitted enamel constants with the renderer. The historical CAD audit remains a clearly identified snapshot, with explicit supersessions for the ruby shock mass, eccentric color coupling and ruby hue. Raw d21 keeps its existing red catalog appearance; records now distinguish that appearance and its red source name from the later fresh XCAF audit's blue body colors. No raw-catalog recolor was authorized.

Verification: all 100 CPU source/runtime checks, TypeScript, lint and production build pass. Added scope/restoration checks cover gold wheel vs. steel hub assignments, independent eccentrics, retained uncertain alloys, ruby optics and fitted-enamel hide/show plus raw-catalog round trips. Existing browser dial suite passes 55 checks, including both faces, hand styles, separation, All parts, loading races and WebGL recovery; desktop visual review confirms the revised materials and final fitted dial. No browser warning/error logs were present before the recovery suite. Material-record IDs and source-manifest linkage were checked. Numerical optical values remain authored approximations. Ready for user visual review; saved locally, with no push or deployment.


## Maker-confirmed material corrections — 24 September 2026

Applied the obvious corrections authorized after Marco's feedback: nine hard-gold wheel definitions, four balance eccentrics and existing polished/satin gold profiles now use rose-gold hue. The escape wheel (d233) now uses neutral steel with its circular brushing, roughness and anisotropy preserved. Case, fitted hands and previously rose-colored profiles already used rose appearances. Balance-rim and collet alloys remain unresolved and their appearances are retained.

Updated the authored material review, recorded the user-supplied maker correspondence and reference-image SHA-256 in the source manifest, and regenerated the appearance ledger. Solid rose gold is claimed only for identified wheels/eccentrics; other corrected gold-colored parts retain their unresolved solid/plated distinction. The cover-plate statement is recorded without inventing a CAD identity. Original image and CAD remain outside this change.

Verification: 100 CPU source/runtime checks, 16 state/motion tests, TypeScript, lint and production build pass. Desktop browser review confirms the assembled rose-gold appearances and isolated steel escape wheel with retained grain; no browser warning/error logs. Preview uses http://127.0.0.1:4175/ because another project occupies 4173. No new broad browser-suite or physical-device run. Flip/lug mechanics and coarser finishing/less-milky steel still need a dedicated reference and visual pass. Saved locally; no push or deployment.

## Maker motion and finish refinement — 24 September 2026

Refined the viewer against Marco’s feedback while preserving the rose-gold and steel escape-wheel corrections in `a17d341`. The official download-page animation was retrieved and inspected as a full contact sheet plus exact half-second frames. Its hash matches the previously recorded maker animation. The upper attachment withdraws, then the lower; the complete case turns across the crown/9–3 axis; the lower attachment reseats before the upper. The crown at CAD +X, lugs along ±Y and faces normal to ±Z establish CAD X. All 18 X-turned lug matrices match original opposite-end occurrences within 9.4e-12. Their visible assembled set and every original source matrix remain unchanged.

The renderer preserves the CAD frame by applying the same inverse X rotation to the observer and attachments: the resulting view shows the case turning between attachments that translate without turning. A shared staged phase supports interrupted reversals with the case visible or hidden. Configuration loading and preferences remain independent; disassembly refits defer until turnover finishes. Reduced motion snaps the complete pose, including live preference changes. History cancels an unfinished observer frame before restoring its saved camera. The four ring-mounted locking pins remain seated: the video does not resolve their release, so the previous invented outward pin arc was removed. Clearance (8 mm), timing (1.8 seconds), source-derived midpoint and the combined disassembly presentation remain interpretations, not a validated service sequence or collision/tolerance certification. Evidence: `assets/source-manifest/face-flip.json` and the new face-flip section of `assets/authored/motion-evidence.json`.

Finish scale and optical response were tuned separately. Frosting now uses 10 rather than 24 cells/mm; straight and circular grain have wider authored scales. Lower relief amplitude avoids craggy frosting. Steel/bridge roughness and the studio’s dark reflection intervals restore metallic contrast. Rose-gold hues and material assignments, the steel escape wheel’s roughness/anisotropy, source finish masks and polished edges remain intact. The supplied maker render and existing maker movement photograph were inspected as qualitative references, not calibrated color or reflectance data. Numerical changes are recorded in `assets/authored/material-review.json`; the appearance ledger is regenerated.

Verification: 16 state/motion tests, 102 CPU source/runtime checks, TypeScript, lint and production build pass. Browser/GPU suites pass 305 checks: 196 watch, 55 dial, 20 inventory, 19 camera, 8 explosion and 7 frosting. The expanded watch suite covers both faces/case visibility states, interrupted reversals, configuration retention, disassembly during turnover and live reduced motion. A separate browser check verifies history during turnover. An initial explosion-suite run inherited visible dials and failed two raw-source-pose assertions; its trace is retained, and the intended bare-movement rerun passes all eight checks. Existing build warnings concern chunk size and vinext route classification.

Matched before/after desktop captures (1275×1354) cover both faces at Reset overview and two zoom steps, using committed `a17d341` finish modules for the baseline. Real rendered turnover frames show withdrawal, edge-on case rotation, reseating and return. A 390×844 phone viewport covers both faces, case visible/hidden and disassembly/reassembly: no horizontal overflow, all six dock controls 44 px high, exact restored poses and no warning/error logs in the clean phone run. Screenshots, sampled frames and numeric reports remain ignored under `artifacts/browser/maker-refinement/`; original animation and reference imagery are not committed. Phone testing is viewport emulation, not physical-device review.

Ready for user visual review of the local refinement. Physical locking details, measured finishing values, physical-device review and existing release gates remain outstanding. Changes committed locally only; no push or deployment. The unrelated domain-status edit in this file remains outside this commit.

## Finer steel brushing — 24 September 2026

Following user review of `aa2493a`, narrowed steel brushing with a 1.8× frequency multiplier: across straight strokes on bridge/keyless fields and radially on circular steel/ratchet fields. Stroke length, optical amplitudes, roughness, anisotropy and studio lighting stay unchanged. Frosting, polished edges, warm-metal grain, silver dials, source geometry and the verified flip sequence are preserved, including the material corrections from `a17d341`. The result has finer hairlines while retaining metallic reflection contrast. This is an authored visual preference, not measured manufacturing pitch; changed frequency also affects derivative filtering and relief slopes.

Updated the material evidence/source record and regenerated the appearance ledger. Matched before/after renders cover both faces at normal distance and two zoom steps; original-pixel detail comparisons and 390×844 phone views are in ignored `artifacts/browser/steel-grain-refinement/`. Both phone faces render correctly, with no horizontal overflow and six 44 px dock controls; browser warning/error logs are empty. Phone review remains viewport emulation.

Verification: 16 state/motion tests, 102 CPU source/runtime checks, 196 browser watch checks, TypeScript, lint and production build pass. Existing build notices concern Node module registration, large chunks and vinext route classification. No new mechanical behavior or evidence claim. Ready for local visual review; no push or deployment. Unrelated domain-history edits in this file remain unstaged.

## Softer steel hairlines — 24 September 2026

After comparison with the supplied SJX-watermarked photograph, reduced broad straight-brush layer weights from [0.35, 0.30, 0.23, 0.12] to [0.12, 0.22, 0.23, 0.12] on bridge and keyless steel fields. The two finest layers and all frequencies remain unchanged; weights are not renormalized. A separate 0.7 relief multiplier softens steel grain height. Matched renders show less continuous banding while retaining visible fine lines. Circular finishes, frosting, polished edges, alloy colors, base roughness, lighting, source geometry and the verified flip sequence remain unchanged.

Recorded the supplied image hash and qualitative interpretation in material evidence/source records and regenerated the appearance ledger. Photography lighting and processing are not matched or treated as calibrated values; observed dial, frosting and edge differences remain outside this scoped adjustment. Before/after normal and close-up views of both faces, original-pixel comparisons, fitted oblique inspection and phone captures remain ignored under `artifacts/browser/steel-hairline-refinement/`.

Verification: 16 state/motion tests, 102 CPU source/runtime checks, 196 browser watch checks, TypeScript, lint and production build pass. Both faces inspected at 390×844: no horizontal overflow, six 44 px dock controls, no browser warning/error logs. Existing build notices remain unchanged. Phone review is viewport emulation. Committed locally for visual review; no push or deployment. Unrelated domain-history edits remain unstaged.

## Flat-view lighting refinement — 24 September 2026

At the user's explicit preference, kept the flat default camera and refined only the studio reflection environment. Broader off-axis keys now serve both faces; unequal edge/fill cards add directional contrast. Card radiance feathers into a slightly raised surround, replacing bright rectangular boundaries. The lower bridge has a more gradual light-to-dark reflection, and the case's bright outline is less uniform. Material definitions, fine brushing, frosting, exposure, direct lights, source geometry and face-flip behavior remain unchanged.

Recorded exact panel settings and trial rationale in `assets/authored/material-review.json` and the user's flat-view preference in its source record. Matched before/after renders cover both faces at normal distance and close-up. Additional fitted-dial, two-angle orbit and 390×844 phone views are in ignored `artifacts/browser/lighting-refinement/`. Reset camera was measured at effectively X=Y=0, looking along Z with unchanged up/target. Lighting affects reflections on all materials; it is an authored presentation, not a measured photographic reconstruction.

Verification: 16 state/motion tests, 102 CPU source/runtime checks, 196 browser watch checks, TypeScript, lint and production build pass. The existing HDR test initially assumed radiance lived only in the material color; it now checks combined vertex/material radiance, finite colors, card-edge continuity and resource disposal. Both phone faces render correctly, with six 44 px dock controls, no horizontal overflow and no browser warning/error logs. Existing build notices remain. Phone review is viewport emulation. Committed locally for user review; no push or deployment. Unrelated domain-history edits remain unstaged.

## Brass dial washer and PR preparation — 24 September 2026

Applied the user's explicit correction to dial washer d121 (`Flitter 200x400`): dedicated satin-brass appearance, authored #c6a45a, retaining metalness 1, roughness .31, no procedural brushing and no anisotropy. Source geometry, other gold appearances, confirmed steel escape wheel, finish refinements, flat-view lighting and flip behavior remain unchanged. Updated material evidence and regenerated the appearance ledger; the prior broad rose-gold assignment is explicitly superseded for this washer only.

Verification: 102 CPU source/runtime checks, TypeScript, lint and production build pass. Targeted browser inspection covers both washer faces, isolation and return to assembly, with no warning/error logs. Screenshots are ignored under `artifacts/browser/dial-washer-brass/`. The existing build notices remain.

The user authorized pushing all accumulated task changes to a PR. The GitHub connector confirms no open PR for this repository/branch, so the verified branch will be pushed over its configured SSH remote and a PR opened against main. No original CAD/reference media is added. The unrelated domain-history edit remains unstaged.


PR publication: pushed the accumulated branch over SSH and opened [PR #4](https://github.com/galind/zweigesicht-1/pull/4) against `main`, including the verified brass-washer correction `7f9128e`. GitHub confirmed the PR head matches the pushed commit. No merge or manual deployment was performed; the existing branch CI/deployment integration may run on push. The unrelated domain-history edit remains outside the PR.


## Codebase cleanup — 24 September 2026

Updated `main` from the configured SSH remote (`89d9fca`) and created `codex/codebase-cleanup`. Baseline passed 16 state/motion tests, 102 CPU checks, TypeScript, lint, build and 196 cold-catalog browser watch checks; both flat-face references were captured. The unrelated local domain-history edit remains excluded.

Repository audit and implementation are recorded in [cleanup review](docs/CLEANUP_REVIEW.md). Removed unreachable UI scaffold/dependencies and stale runtime finish copies; isolated inspection tools, cached immutable separation inputs, stopped idle React snapshots, tightened resource/listener disposal and unified safe build-output pruning. Source geometry, authored finishes/lighting, attribution, hashes and historical evidence are preserved. Fresh offline install, typecheck, lint, standard/Vercel builds and production SEO checks pass. Final regressions and visual/phone comparison are in progress; next action is complete validation, inspect the diff and publish the requested PR through SSH/GitHub connector. No merge or manual deployment.

Failure-path follow-up: initialization now disposes partially created resources, and WebGL environment restoration always releases temporary PMREM/studio objects while preserving Reload 3D on failure. Added real-handler/constructor fault-injection checks; all 107 CPU checks, 17 state/motion/packaging tests, TypeScript and lint pass. Camera browser checks pass 19 assertions; remaining final suites continue. A stale material-comment link was corrected and only the corresponding appearance-ledger source hash changed.


Final cleanup verification: all 17 state/motion/packaging tests, 107 CPU checks and 400 browser assertions pass across eight suites. TypeScript, lint, standard/Vercel builds, decoded-geometry checks and production start/SEO checks pass. Both flat-face comparisons preserve accepted appearance; 390×844 fitted-phone controls, flip, configuration retention and reassembly pass. An existing fallback/header overlap found at 320×740 / 200% text was corrected and production retry verified. Browser screenshots/reports remain ignored.

Measured against the clean baseline: application JavaScript gzip 451,191 → 434,054 bytes; CSS gzip 31,546 → 11,292; lockfile entries 723 → 300; 23,238,795 bytes of superseded runtime buffers removed. Warm complete-separation CPU median 142.76 → 11.27 ms per 500 evaluations (not a device FPS claim). Remaining large modules/chunks, idle RAF callbacks, physical-device/thermal review and CAD/release-gate limits are documented in the cleanup review. Final diff reviewed; next action is SSH push and GitHub-connector PR against main, with unrelated domain-history edits excluded. No merge or manual deployment.


Cleanup publication: pushed the verified branch through the configured SSH remote and opened [PR #5](https://github.com/galind/zweigesicht-1/pull/5) against main using the GitHub connector. No merge or manual deployment was performed. The original local domain-history edits remain outside the PR. Next action: review the PR; deferred work and release-gate limits are recorded in the cleanup review.


## Popup refinement — 24 September 2026

Refined the existing interface on `codex/popup-refinement`. Popups now share a translucent dark surface, soft blur, consistent corners, fixed headings and 44 px close controls. Configure exposes labeled material swatches and native radio choices for both hand sets, with accessible visibility switches and case/dial feedback beside the relevant controls. Choices remain editable while hidden, apply immediately and persist through Reset. Focus has a clearer current selection, Disassemble identifies whole-movement versus section scope, and open-popup styling is distinct from the warm applied-mode indicator.

The shared sheet keeps its heading outside the scrolling body and suppresses outgoing focus restoration during panel handoff. Component search and its scope filter remain above the scrolling results; keyboard opening focuses search without forcing the touch keyboard. Phone panels use the available space above the dock; reading retains its modal sheet. Choices stack as text grows. Fixed popup overflow clipping prevents keyboard navigation from scrolling the close control out of view. Removed obsolete configuration dropdown styles. Viewer motion, geometry, finishes and configuration rules are unchanged.

Verification: 17 state/motion/packaging tests, CPU source/runtime regression suite, TypeScript, lint and production build pass. All 63 browser UX checks pass, including four new checks for hidden preference changes, native control groups, fixed popup headings and focus handoff. Targeted browser review covers desktop, 390×844 and 320×740 with 200% text, reachable controls, no horizontal overflow, Escape/focus return, nested quality-menu dismissal, section actions, component search and real catalog failure/retry. Enlarged-text review caught and corrected narrow choice wrapping, insufficient search result space and an old Settings height override. Review measurements are in ignored `artifacts/browser/popup-refinement/review.json`; visual checks were performed in the in-app browser. Phone checks are viewport emulation, not physical-device review. Existing build notices concern large chunks and vinext route classification.

Ready for local user review at the running development server, http://127.0.0.1:4175/. No push or deployment. The unrelated domain-history edits remain excluded from this milestone.


Configure copy follow-up: removed routine case/dial visibility messages and their empty spacing at the user's request. The only persistent helper text is “Your choices are kept when you reset the view.” Loading/error feedback and retry remain contextual; hand-finish notices remain available to screen readers without adding visible copy. TypeScript, lint and targeted browser visual review pass. Local change only; unrelated domain-history edits remain excluded.


## Immediate hidden-case flip and UI PR — 24 September 2026

When the fitted case is not actually visible, Flip now traverses only the rotation phase over 0.85 seconds, starting on the first rendered frame instead of waiting through roughly 0.64 seconds of invisible attachment withdrawal. Visible-case flips retain their authored 1.8-second withdrawal/turn/reseat sequence. The timing choice is fixed for each active turn; showing/hiding the case does not jump the camera, and a reversal uses current effective visibility. Both paths share the same canonical pose and exact endpoints. Focus-hidden cases also use the shorter path. Source geometry, finishes and All parts behavior are unchanged.

Verification: 17 state/motion/packaging tests, 109 CPU source/runtime checks, TypeScript, lint and production build pass. CPU coverage verifies first-frame rotation and monotonic 0.85-second endpoints on both faces at 30/60/120 Hz, visible-case withdrawal, mid-turn visibility changes, reversals and Focus. All 200 browser watch checks and all 63 browser UX checks pass, including four new visible/hidden initial-rotation checks. Local evidence summaries are in ignored `artifacts/browser/popup-refinement/flip-runtime.json` and `flip-browser-summary.json`. Existing build notices and physical-device/release-gate limits remain.

The user authorized a PR containing the popup refinement, Configure copy simplification and hidden-case flip fix. The branch is based on current `origin/main` (`50c55ea`), and the GitHub connector confirms no existing open PR for it. Next action: SSH push and connected-GitHub PR creation. Unrelated local domain-history edits stay excluded. No merge or manual deployment.


UI PR publication: pushed the verified branch over SSH and opened [PR #6](https://github.com/galind/zweigesicht-1/pull/6) against `main` through the GitHub connector. It includes the glass-popup refinement, Configure copy simplification and immediate hidden-case flip. GitHub confirmed the verified implementation head `8bc515b` and a mergeable open PR. No merge or manual deployment. Next action: review the PR. The unrelated domain-history edits remain unstaged.


## Touch interaction pass — 24 September 2026

PR #6 is merged; this work starts from `origin/main` at `95e4691` on `codex/touch-interactions`. Touch/stylus holds longer than 500 ms no longer select or deselect parts, and lost pointer capture clears pending selection so an interrupted gesture does not poison the next tap. Existing drag and multi-touch rejection remain; mouse hold behavior is preserved. Slider thumbs keep their 18 px appearance with a measured 44 × 44 px hit area. Popup positioning observes visual viewport resize/scroll to account for a phone keyboard, including viewport panning, while leaving native pinch zoom alone. Catalog inputs use at least 16 px text on coarse pointers to avoid iOS focus zoom.

Verification: 17 state/motion/packaging tests, 109 CPU source/runtime checks, 65 browser UX checks, TypeScript, lint and production build pass. Added regression coverage for touch/stylus holds, capture-loss recovery, listener disposal and preserved mouse behavior. Browser review at 390×844 verifies the 44 px thumb target and dragging from outside the visible thumb; catalog search at 390×500 retains reachable search/close controls, 188 px of results space and no horizontal overflow. Evidence summaries are in ignored `artifacts/browser/touch-interactions/`. These are desktop-browser viewport and synthetic-pointer checks, not physical touch-device validation. The visual viewport keyboard handling and iOS focus-zoom behavior still need a real iPhone/Android check. Slider scroll-versus-drag arbitration is unchanged. Existing build notices remain.

Local implementation ready for review at http://127.0.0.1:4175/. No push or PR requested for this pass. Next action: physical-phone review of orbit/pinch, finger taps versus holds, slider dragging and search with the keyboard open. Unrelated domain-history edits remain unstaged.


Touch PR publication: at the user's request, pushed `codex/touch-interactions` over SSH and opened [PR #7](https://github.com/galind/zweigesicht-1/pull/7) against `main` through the connected GitHub app. Implementation commit `f9458bf` includes current main at `95e4691`. Next action: review the PR and verify keyboard/touch behavior on physical phones. No merge or manual deployment. Unrelated domain-history edits remain unstaged.


## Website finishing pass — 24 September 2026

Started from fetched `origin/main` at `2003198` on `codex/website-polish`. The GitHub connector confirms PR #7 is merged, including PR #6's popup and hidden-case flip work. The touch changes are retained without duplication.

Browser review found collapsed finder results in phone landscape, unreachable Disassemble controls at 200% text, selected-part actions overflowing sideways, and a zero-height no-3D fallback in short enlarged windows. The finder keeps search and Close fixed while its scope filter scrolls with results; short windows use a compact search heading. Disassemble's existing scope description now scrolls with its controls. Long popup headings are bounded, selected actions wrap, and the header, selected-part area and recovery copy stay within usable scrolling regions above the dock. Landscape uses fewer dock rows where width permits. Closing popups release pointer input during their fade. The translucent surfaces, watch configuration, camera/movement behavior, CAD and mechanical presentation are unchanged; no copy rewrite or new navigation.

Verification: 17 state/motion/packaging tests, 109 CPU source/runtime checks, TypeScript, lint, production build and production SEO/HTTP checks pass. Final production browser suites pass 200 cold-catalog watch checks and 65 interface checks, including optional-asset failure/retry, WebGL recovery, configuration/flip continuity, the live reduced-motion handler, camera stability and focus return. Targeted keyboard checks cover nested quality-menu Escape, visible focus, scrolling to the slider, component search/selection and Retry 3D. Six repeated close-and-switch checks pass. Production console warning/error capture was empty during the layout review; deliberate failure checks remain intentional test errors. Existing build notices concern module registration, large chunks and vinext route classification.

Chromium review covers 1440×900, 390×844, 320×568, 568×320 and 844×390 CSS viewports. At 200% root text, all four control panels at 320×568, 568×320 and 844×390 retain at least 82 px of scrolling body, reachable Close controls, no horizontal page overflow and clearance above the dock. The compact finder retains 86 px of scrolling content at 568×320 / 200%; recovery retains 74 px and Retry succeeds. Selected-part actions wrap without horizontal overflow. Firefox desktop configuration/Escape and responsive visual captures at 402×874 and 568×320 were also reviewed. Firefox's existing mobile user-agent preset is still Firefox, not Safari verification. Local evidence is ignored under `artifacts/browser/website-polish/`.

The local refinement pass is complete. Next action: physical iPhone/Android verification of orbit/pinch, taps versus holds, interrupted capture, sliders and search with the keyboard open, followed by representative accessibility/usability review. These browser resizes and regression events do not certify real touch behavior; slider scroll-versus-drag arbitration is unchanged. Safari/WebKit remains unverified, and existing mechanical and publication/redistribution release gates remain outstanding. Changes are committed locally only; no push, PR, merge or deployment. Unrelated local domain-history edits in this file remain unstaged.


PR publication: at the user's request, pushed `codex/website-polish` over SSH and opened [PR #8](https://github.com/galind/zweigesicht-1/pull/8) against `main` through the connected GitHub app. It contains the verified refinement commit `bcc8e00`. Next action: PR review and the outstanding physical-phone/accessibility checks. No merge or manual deployment was performed; existing branch integrations may run on push. Unrelated local domain-history edits remain excluded.


## Disassembly direction and sequence review — 24 September 2026

Started from fetched `origin/main` at `5402e93` on `codex/disassembly-review`; the connected GitHub app confirms PRs #6, #7 and #8 merged. The [disassembly review](docs/DISASSEMBLY_REVIEW.md) records implemented coordinates/order, four configurations on both faces, six Focus sections, source-solid evidence, interrupted motion and before/after comparisons.

Corrected all 18 lug-packet offsets to follow the continuous attachment frame through Flip, including target framing, so the Skeleton attachments separate outward rather than through the movement. Shortened four case-back/seal axial distances after reproducing landscape clipping in the unchanged baseline; the sampled maximum projected extent falls from 1.19071 to 0.96435 (edge = 1). Source geometry, finishes, fitted assembly endpoints, preferences, selection behavior and existing visible/hidden-case Flip timing are preserved.

Verification: 17 state/motion/packaging tests, 113 CPU source/runtime checks, 543 browser assertions across the configuration matrix, existing suites and three viewport transition runs, plus 12 fresh-production checks pass. TypeScript, lint, production build and SEO/HTTP checks pass. Source-solid evidence includes 40 lug/ring samples, 28 rejected-ring comparisons and 54 back/seal/dial samples; no named outer-case pair increases overlap above its original fit. Local ignored evidence is in `artifacts/browser/disassembly-review/` and `artifacts/disassembly-cad/`. The report records the warm-catalog skips, repeated affected suites, existing build notices and evidence limits.

Middle-ring/plate interference remains: the simple axial alternative introduces tube/stem interference, so a broader staged extraction needs mechanical review. Opposite-face Focus can remain obscured by its contextual plate. This is an illustrative construction view, not a service procedure. Physical iPhone/Android, Safari/WebKit and representative accessibility/usability review remain outstanding. Next action: local review of the report and comparisons, followed by mechanical/device review. Changes are committed locally only; no push, PR, merge or deployment. Unrelated domain-history edits remain unstaged and excluded.


PR publication: at the user's request, pushed `codex/disassembly-review` over SSH and opened [PR #9](https://github.com/galind/zweigesicht-1/pull/9) against `main`. The user subsequently authorized including the existing domain-history corrections above; they are now included in this PR. Next action: PR review and the outstanding mechanical/device checks. No merge or manual deployment.


## Acknowledgements copy — 24 September 2026

Replaced the placeholder with three personal thank-you paragraphs: Marco Lang sharing his CAD files so others can explore and learn about his watches; his feedback, advice and encouragement throughout the project; and everyone who uses and enjoys the website. The copy uses the panel's scrolling body beneath its fixed heading. TypeScript and lint pass. Next action: review the wording locally. No push or publication.

## Watch reading list — 24 September 2026

Replaced the Learn about the watch description and specifications with links to Marco Lang's official Zweigesicht page and coverage from SJX Watches (2023), Monochrome (2020), and Time and Watches (2021). Verified the destinations, titles and years against the live pages. Each reading entry shows its publisher, title and an external-link arrow; the original CAD link remains. Removed the unused descriptive copy and specification styles.

TypeScript, lint and production build pass, with the existing build notices. Browser review covers desktop, 390×844, and 320×568 at 200% text: links wrap within the panel, keyboard focus is visible, all links are reachable through the scrolling body, and Escape returns focus to the trigger. Next action: local review of the reading list. No push or publication.

Reading panel follow-up: restored a concise watch description verified against Marco Lang's official page, followed by a dedicated link to his site and a Press coverage heading above the three articles. The CAD link remains at the end. TypeScript, lint and desktop/390×844 visual review pass; the longer content scrolls with all links reachable. Next action: local copy/layout review. No push or publication.

## Header panel consistency — 24 September 2026

Aligned Learn about the watch, Acknowledgements and Settings with shared 420 px desktop widths, 18 px sans-serif headings, 15 px reading text, 20 px body padding, section-heading styles and close-button offsets. Removed the extra right gutter and muted description styling from the acknowledgement paragraphs. Learn's redundant subtitle is now screen-reader-only, and the Settings heading matches its trigger. Existing glass surfaces, responsive panel behavior and controls remain.

TypeScript, lint and production build pass with existing build notices. Fresh production browser review confirms matching computed styles across all three panels, desktop and 390×844 visual layouts, and no horizontal content overflow at 320×568 and 568×320 with 200% text. The shortest enlarged landscape bodies retain 82 px of scroll space. Verified panel switching, Escape focus return and nested quality-menu dismissal. Local production preview is available at http://127.0.0.1:4177/; the older development preview served stale CSS during review. Next action: local visual review. No push or publication.

PR publication — 25 September 2026: at the user's request, pushed `codex/acknowledgements` over SSH and opened [PR #10](https://github.com/galind/zweigesicht-1/pull/10) against `main` through the connected GitHub app. It includes the acknowledgements, watch description and reading links, and consistent header-panel styling. The verified implementation head is `f7b1050`, based on current main at `f49d87d`. Next action: PR review. No merge or manual deployment.

Acknowledgements wording follow-up — 25 September 2026: removed the final sentence of the personal thank-you paragraph at the user's request. Copy-only change; diff checked. Commit and push authorized to the existing PR branch. Next action: PR review.

## Compact phone navigation — 25 September 2026

Implemented the agreed phone hierarchy on `codex/compact-phone-controls`, based on main after PR #10. At widths up to 600 px, the header shows the watch name and Menu; the maker credit, Learn about the watch, Acknowledgements and Settings are available inside Menu. The dock keeps Disassemble, Configure, Flip and More; More contains Focus, All parts and Reset view. Existing actions share their handlers across both layouts, panels replace one another, and closing secondary panels restores focus to a visible Menu/More trigger. Crossing the breakpoint dismisses phone navigation. Desktop retains its existing controls and order.

Normal phone chrome measures 44 px for the header and 52 px for the dock. All four dock actions retain at least 44 × 44 px targets, including at 320 px width. At 200% text the dock reflows into two rows without reducing text size. Menus and existing panels keep their scrolling bodies and close controls.

Verification: TypeScript, lint and production build pass (existing module-registration, chunk-size and route-classification notices remain). All 65 desktop browser UX checks pass. Chromium viewport review covers 390×844, 320×568, 320×568 at 200% text, 568×320 and desktop 1440×900. Targeted interaction checks cover Menu → Settings/Acknowledgements/Learn, More → Focus/All parts/Reset, Configure at enlarged text, one active panel, Escape/focus return, tap-target sizes, no horizontal overflow, landscape menu scrolling and the no-3D Focus fallback. At 320×568 / 200%, the acknowledgement body retained 180 px of scrolling space in the reviewed layout. This is browser viewport validation; real iPhone/Android and Safari checks remain outstanding.

Local preview: http://127.0.0.1:4175/. Next action: user review on a phone. No push, PR, merge or deployment.

PR publication: at the user's request, pushed `codex/compact-phone-controls` over SSH and opened [PR #11](https://github.com/galind/zweigesicht-1/pull/11) against `main` through the connected GitHub app. It contains verified implementation commit `3479cd0`, based on main at `15610fa`. Next action: PR and physical-phone review. No merge or manual deployment.

Main-menu Reset follow-up: added Reset view to the phone Menu as well as More, using the shared reset handler and availability rules. TypeScript and lint pass; targeted 390×844 browser interaction confirms it restores the assembled view from All parts and dismisses the menu. Included in PR #11 at the user's request.

Reset placement correction: removed Reset from both phone menus and made it a permanent dock action immediately after Flip. The phone row is now Disassemble, Configure, Flip, Reset, More; More contains only Focus and All parts. Reset retains its full accessible name and existing behavior. At 320×568, the dock remains 52 px high with five targets at least 44 × 44 px; at 200% text, the primary pair occupies the first row and Flip/Reset/More share the second. TypeScript, lint and targeted browser checks pass, including resetting All parts, both menu contents and no horizontal overflow. This supersedes the main-menu Reset addition and updates PR #11.

## Reset emphasis follows the current view — 25 September 2026

Reset now uses the same text color, size and weight as its neighboring buttons whenever it can change the visible view, across desktop and phone layouts. Only the already-reset view keeps the muted color. The availability comparison reuses Reset's framing calculation for the current side, configuration and viewport; camera position, target and up vector detect orbit/zoom/pan/roll without relying on a sticky interaction/history flag. Focus, selection/isolation, separation and All parts also activate the emphasis. Returning the camera to its default pose clears the emphasis even without a Reset click. Existing loading/recovery disabling and Reset behavior remain.

Verification: TypeScript, lint, production build, 114 CPU source/runtime checks and all 71 browser UX checks pass. New regression coverage includes no-op gestures, orbit, zoom, exact return to the default camera, completed Reset, both sides, fitted/bare case configurations, view modes and desktop/phone aspects. Targeted 390×844 browser inspection confirms muted default color, normal button color/size after orbit and muted color after Reset completes. Existing build notices and physical-device/Safari review limits remain. Next action: review this refinement in PR #11; no merge or manual deployment.

## Guided assembly at /play — 25–26 September 2026

Implemented the complete route-specific assembly game on `codex/play-assembly`: mouse/touch dragging with forgiving screen-space snapping, close-up internal assembly, keyboard/tap placement, hints, undo, reframe/flip, confirmed restart/level changes, completion, and validated local resume. The homepage files, controls and navigation remain unchanged, and it loads no game payload. The versioned source-ID manifest accounts for 265 included physical leaves and 100 exclusions. Both levels retain exactly the 18 fitted leaves under the mainplate subtree. Easy has 87 prepared/individual placements; Hard has 247 individual-leaf placements. Both end with the same movement, default dials and fitted hands, without the case. [Inventory and sequence evidence](docs/PLAY_INVENTORY.md) records membership, source exceptions, preparation, target poses and mechanical limits.

Verification passes: inventory/geometry/sequence validation; 38 state, lifecycle and existing tests; the existing CPU source/runtime suite; TypeScript; lint; production build; and SEO/HTTP checks. Production browser runs complete every Easy and Hard placement through real DOM drag/touch/keyboard paths (1,094 Easy and 4,615 Hard assertions), plus 51 focused interaction/recovery assertions. Hard targets are checked at both 390×844 and 320×844. Visual review covers desktop, both phone widths, 200% text, reduced motion, difficult internals, tiny fittings and both dial/hand stages. All 71 homepage UX checks pass; requested homepage scripts contain no game payload. `/play` has its own canonical/noindex metadata and is absent from the sitemap. Renderer cleanup, context restoration, required-asset retry, unavailable storage and idle rendering are verified. [Verification details](docs/PLAY_QA.md) distinguish actual checks from limits; ignored screenshots/reports are in `artifacts/browser/play/`.

The local production preview is running at http://127.0.0.1:4181/play. Next action: user review, followed by physical-phone/Safari and representative accessibility review before any release decision. Touch results are browser emulation, not physical-device certification. Assembly order remains a guided source-based puzzle with recorded geometry exceptions, not certified servicing instructions. Existing build notices and release gates remain. Changes are committed locally only; no push, PR or deployment.

## Play camera cohesion and removable dial screws — 26 September 2026

At the user's request, the two source-confirmed dial-retaining screws are removed from the initial mainplate and become individual placements after the central dial, before its hands. Manifest `play-3` starts with 16 fitted leaves and provides 89 Easy / 249 Hard actions; both levels retain the same 265-leaf finished movement. Source endpoints are unchanged. Each radial screw has an authored oblique view of its seat. Earlier saves require an explicit fresh start because the fitted foundation and sequence changed.

The in-depth comparison reproduced reversed front-face orbit in Play: its controls retained a cached negative-Y basis after the camera changed to positive Y. Both viewers now call the homepage's extracted camera-basis, keyboard-orbit and zoom helpers. Homepage behavior and UI are preserved. Play additionally reuses the existing easing/timing, contact shading, neutral theme, typography, text-button treatment and icon library; orbit now damps to rest and Flip preserves the user's framing through a bounded turn. Guided transitions, capture cancellation, reduced motion, renderer recovery and idle rendering retain explicit lifecycle handling. Enlarged-text controls wrap at their content width.

Both complete production placement runs pass: Easy 89/89 (1,114 assertions) and Hard 249/249 (4,651 assertions), including every Hard target at 390 and 320 px. All 71 homepage UX checks pass and the homepage loads no game payload. Inventory validation, 49 tests, the CPU source/runtime suite, TypeScript, lint and production build pass. A visual review also caught a Flip framing offset; rotating the camera and its target around the assembly center now preserves its projected position, with regression coverage through both faces, double flips and reduced motion. The final build passes 60 focused interaction/layout/recovery assertions and 30 camera comparisons, including six desktop/phone flips with zero projected-center drift. [The cohesion review](docs/PLAY_COHESION_REVIEW.md) records the measured comparisons, screenshots and rerun scope. The working local preview remains at http://127.0.0.1:4181/play. Next action: user review, with physical-phone/Safari and mechanical limits unchanged. Committed locally only; no push or deployment.

## Shared control meanings and presentation — 26 September 2026

Compared each Play action against the homepage and removed misleading icon reuse. Play now uses LocateFixed for Show placement, ListRestart for Restart assembly, and Gauge for Difficulty; the homepage retains ScanSearch for Focus, RotateCcw for Reset view, and Layers for Disassemble. Both routes consume the same native TextButton, FlipButton and ResetViewButton components. The homepage's handlers, flags, labels, responsive captions and icon rotation are preserved; its viewer/state logic is untouched. Play shares the existing Sheet help panel, Close button, focus restoration, scroll region and popup styling, plus the existing hover and pressed treatments.

Play's new Reset view and Home shortcut preserve assembly progress and the viewed face while restoring a straight-on camera. Show placement separately restores the current step's authored face and oblique camera where needed. Restart still requires confirmation. Difficulty keeps the saved session available until another assembly starts. The inventory and 89/249-step sequences are unchanged. Fifty-one automated tests pass, including Reset/Home/Show placement across 16 face and reduced-motion combinations and measured caption clearance. Production browser checks pass 99 control assertions across both levels, 61 focused interaction/recovery assertions, and all 71 homepage UX assertions with payload isolation. Wrapped staging captions now reserve their measured height, with stable space during selection; confirmation dialogs are centered and scroll within the viewport. TypeScript, lint, build and local SEO/HTTP checks pass. [The controls review](docs/PLAY_CONTROLS_REVIEW.md) records scope and evidence; the earlier complete 89/249 placement runs remain valid, and the sequence is unchanged. Local preview: http://127.0.0.1:4181/play. Next action: user review. Changes are committed locally only; no push or deployment.

PR publication — 26 September 2026: at the user's request, pushed `codex/play-assembly` over SSH and opened [PR #12](https://github.com/galind/zweigesicht-1/pull/12) against `main` through the connected GitHub app. The verified implementation head is `bb7ab6b`, based on `db8a664`. It includes the complete assembly game, revised dial-screw sequence and shared control refinements. Next action: PR review and the outstanding physical-device/accessibility checks. No merge or manual deployment. The untracked agent prompt remains local and excluded.

Website review goal prepared: [WEBSITE_REVIEW_GOAL.md](docs/WEBSITE_REVIEW_GOAL.md) defines an implementation-focused audit of architecture, duplication, UI semantics, accessibility, resource lifecycle and measured performance. It preserves homepage behavior and requires complete verification of both Play levels, documented findings and working previews. This is a prepared execution brief; the review/refactor has not started. Next action: invoke the goal when ready. Documentation is local only; PR #12 is unchanged.

## Website review implemented — 26 September 2026

Completed [the review goal](docs/WEBSITE_REVIEW_GOAL.md) on separate local branch `codex/website-review`, preserving unmerged PR #12 and the untracked agent prompt. [The review report](docs/WEBSITE_REVIEW.md) maps both routes, prioritizes findings, records sharing decisions, before/after measurements, reproduction commands and remaining limits.

Both viewers now share renderer settings, studio lighting, environment allocation and resource disposal. Homepage rendering sleeps completely at rest (measured RAF callbacks per idle second: 60 → 0) and still wakes for interaction, resize, recovery and opt-in diagnostics. Play prepares required assets transactionally and prevents metadata finishing after unmount from starting heavy loads. Optional explorer loading and Play's mandatory assembly rules remain separate. Ordinary home contains neither Play payload nor the optional benchmark implementation.

Named confirmation dialogs, explicit keyboard focus destinations, shared root text-preview behavior and measured storage/caption clearance improve Play access. Short screens use clear space beside staging when vertical room is insufficient. Homepage phone labels wrap at their actual content width, and both routes respect emulated safe-area insets. Removed obsolete and duplicated style rules. Inventory `play-3`, source geometry/transforms, materials, configuration behavior and compatible saved sessions are unchanged.

Verification passes: 59 automated tests, 114 prepared CPU source/runtime checks, inventory validation, TypeScript, lint, production build and SEO/HTTP. Both complete DOM traversals pass all 89 Easy and 249 Hard placements, including both dial screws and every Hard target at 390/320 px, with exactly 265 fitted/visible leaves at completion. The combined run passes 6,458 checks, including the 71-check homepage UX wrapper and focused recovery paths. A further 350 explorer assertions, actual motion capture and a 60-second benchmark pass. The final safe-area build passes 99 control, 26 dialog, 61 focused and 197 responsive/accessibility/recovery checks with no uncaught errors. Exhaustive traversals preceded the final inset-only correction; targeted final-build checks verify that changed boundary. Raw artifacts are ignored under `artifacts/browser/website-review/`.

Cold-context request counts remain 17 home / 19 Play. Home requested JavaScript changes by −113 bytes; Play adds 1,877 bytes (about 0.06%) for lifecycle/accessibility/layout behavior. No loading-speed or memory reduction is claimed. Existing module-registration, large-chunk and route-classification build notices remain. Physical-device/Safari, representative accessibility, mechanical and publication gates remain outstanding; no new CAD or source redistribution was performed.

Working production previews: http://127.0.0.1:4183/ and http://127.0.0.1:4183/play. Next action: local user review and the separate real-device/accessibility release reviews. No push, merge or deployment was performed.

Verified implementation committed locally as `1888891` (`Improve viewer lifecycle and responsive accessibility`); the accompanying review report and setup/status documentation record its evidence and remaining release limits.

## Free-choice Play redesign — 26 September 2026

Implemented the supplied `docs/PLAY_REDESIGN_PROMPT.md` on local branch
`codex/play-free-assembly`, based on the merged website review at `affaa9d`.
Easy has a stable thumbnail gallery of 89 prepared assemblies/parts. Hard has
249 individually placed parts grouped by mechanism, search, remaining counts,
and 35 explicitly entered workbenches with explicit transfers back into the
watch. Transfers add no physical count. Both levels retain the same 16-leaf
foundation, deferred dial screws, immutable source endpoints and 265-leaf finish.
No next piece or group is selected automatically.

The `play-4` dependency graph replaces the ordered prefix. Supports and cover
constraints permit independent paths; replay validation, last-action Undo and
separate assembled/fitted accounting preserve nonlinear progress. Hints start
off, persist through actions and resume, and expose inspectable unavailable
parts only when enabled. Show destination is explicit assistance for camera
reveal and keyboard/tap placement. Earlier linear saves stay intact until an
explicit fresh-start confirmation. Camera pose, orbit target, zoom and pan
survive ordinary actions; workbench return restores the main camera. Removed
camera-driven mesh hiding and all automatic selection/placement reframing.
Source-surface rays reject drops through opaque fitted geometry, and hint
materials are separate from authored finishes.

The [redesign report](docs/PLAY_REDESIGN.md) and
[dependency ledger](docs/PLAY_DEPENDENCIES.md) record the design, evidence,
puzzle assumptions and reproduction commands. A real reverse-order failure
exposed the diamond fitting closing a balance-bridge jewel seat too early;
the missing guard is fixed and covered by a regression test. A further read-only
maximal-obstruction audit passes all 373 Easy/Hard placement/transfer actions,
checking each with every independently placeable obstruction present. This
supports visual reachability across the graph, not collision-free insertion or
certified servicing. All existing mechanical/publication gates remain.

Verification: 59 automated tests, 40 graph traversals per level, source/geometry
inventory validation, the existing CPU source/runtime suite, TypeScript, lint
and production build pass. Production Easy completes 89 placements (538 checks);
production Hard completes 284 actions in the opposite legal order at 320×844
(1,708 checks). Earlier reverse Easy and forward Hard/390 traversals also pass.
The focused production suite passes 111 interaction, camera, responsive,
accessibility-layout, resume and recovery checks. It includes a full orbit with
stable visibility/material identity, exact main-camera workbench return,
measured initial/Reset centering, resize without pose changes, 200% text,
asset retry and unavailable storage. Both complete with exactly 265 fitted leaves.
The final build adds only the opt-in read-only access-audit module and removes a
duplicate live announcement; final focused checks, all 71 homepage UX assertions,
no-Play-payload checks, build/type/lint and local SEO/HTTP checks pass.

Reviewed screenshots and numeric evidence are ignored under
`artifacts/browser/play-redesign/`, with production runs in `production/`.
Visual review corrected overlapping enlarged-text labels; cards and captions
now remain contained and the bounded inventory supports horizontal and vertical
scrolling. The gallery does not change order or scroll position on placement.
Physical phones/Safari, representative accessibility and enjoyment review remain
outstanding; browser emulation is identified as such.

Working local production preview: http://127.0.0.1:4185/play (homepage at the
same origin). Next action: user review of the local experience. Changes are
committed locally only; no push, PR, merge or deployment. The two pre-existing
untracked prompt files remain local and excluded from the commit.

## Play drag discoverability follow-up — 26 September 2026

User review found that selecting a gallery card did not make the separate loose
piece's drag handle discoverable. Mouse users can now drag directly from a card,
including an unselected card. The selected-part details expose a gold **Drag
part** button for mouse and touch; native gallery swipes still browse. Hard
parts requiring a workbench explicitly explain that entry step. Show destination
remains an explicit keyboard/tap alternative in the action row. All drag origins
share placement rules, camera preservation, cancellation and capture cleanup.
The click generated after a card drop cannot cancel its settling animation.

Verification: all 60 unit tests pass, including new temporary-listener lifecycle
coverage; TypeScript, lint and production build pass. The new browser drag suite
passes 49 checks at 1440 px, 390 px and 320 px, including hints off/on, direct
unselected-card pickup, touch placement, unavailable inspection, Escape/touch
cancellation, native gallery scrolling, Hard workbench entry and unchanged
camera pose. The existing focused suite also passes all 111 interaction,
responsive, resume and renderer-recovery checks on the final production build.
Screenshots and reports are ignored under `artifacts/browser/play-drag/final/`.
An earlier focused run overlapped a rebuild and timed out at the asset-retry
check; the complete run passes after restarting the preview against the final
bundle. No runtime failure remains reproduced.

Local preview remains http://127.0.0.1:4185/play; reload to use the new controls.
Next action: user review of the more discoverable gesture. Physical-device/Safari
review remains outstanding. No push, PR or deployment; the two original untracked
prompt files remain excluded.

## Gallery-only dragging at source scale — 26 September 2026

Implemented the next user review: carried parts now retain actual source scale
relative to the watch throughout pickup, movement and settling. New games start
on the movement side (negative Z). Removed the left-side loose piece and its DOM
control completely. Mouse dragging starts on gallery cards; a selected card
contains the gold touch Drag handle. Between interactions the carried mesh is
hidden; failed drops return to the gallery and cancellation leaves no loose copy.

Hard-mode pickup previously required the selected leaf's workspace to match the
current view. That prevented even trying a barrel cover from the watch view.
With hints off, every unfitted leaf can now be picked up without switching the
camera or workspace. Placement and destination guidance still require the right
workspace and supports. Wrong-workspace drops explain Open workbench/Return to
watch. With hints on, missing prerequisites still disable dragging and remain
inspectable. Both barrel covers require their arbor and mainspring; no dependency,
source geometry, physical count or saved-session format changed.

Verification: 61 unit tests, typecheck, lint and production build pass. The
production drag suite passes 331 checks, including real mouse pickup of all 249
Hard leaves, source scale of each carried mesh, startup side, no detached tray,
hints off/on, mouse/touch and cancellation at 1440/390/320 px. The barrel cover
can be carried from the gallery before workspace entry, is rejected in the wrong
view, explains missing supports with hints on, and fits after its internals on
its workbench. The existing focused suite passes all 111 camera, interaction,
responsive, enlarged-text, resume and recovery checks. Screenshots were reviewed,
including the carried cover at actual scale. Evidence is ignored under
`artifacts/browser/play-gallery-only/production/`.

The updated production preview is http://127.0.0.1:4185/play. Reload for the new
controls; saves remain compatible. Next action: user review. Physical-device
and Safari review remain outstanding. Local commit only; no push, PR or deployment.
The two original untracked prompt files remain excluded.

## Remove the Drag label — 26 September 2026

Removed the visible Drag text, arrow and gold button from gallery cards at the
user's request. The selected part's existing thumbnail is now the touch drag
surface. Selected cards retain their full-size thumbnail and assembly context.
Accessible naming and keyboard placement remain available. Updated help copy,
architecture notes and the regression assertion to match.

TypeScript and production build pass. A targeted production browser check passes
mouse placement at 1440 px and touch placement at 390 px from the thumbnail,
with no visible Drag label. Preview refreshed at http://127.0.0.1:4185/play.
Next action: user review; local commit only, no publication.

## Consistent visible-seat placement — 26 September 2026

Investigated the reported difficulty fitting pieces. The existing user session
was inspected read-only; its progress was left intact. Identified an inconsistency
in the controller: drag validation accepted any exposed source sample inside the
assembly viewport, while final placement selected the sample closest to the
part's center and could reject it as offscreen. The two paths also used different
horizontal margins. A partly visible or panned part could therefore reject an
otherwise valid drop.

Seat selection now prefers an exposed sample within the assembly viewport and
uses exactly the same viewport boundaries as snapping. Opaque occlusion and
support/workspace rules remain enforced. Failed drops distinguish missing
supports, an obscured/offscreen fitting point, and a missed fitting point, with
explicit hints/reveal options instead of one generic rejection message.

All 62 unit tests pass. The new controller regression covers an offscreen
center-nearest sample plus a visible valid sample, including both horizontal
viewport boundaries, through final placement. TypeScript, lint and production
build pass. The exact original rejected gesture has not been identified; this
records the concrete code-level inconsistency found during investigation.
Preview refreshed at http://127.0.0.1:4185/play; user reload preserves saved actions.
Next action: retry the reported placement and identify any remaining rejection.
Local commit only; no publishing.


## Fixed Play views — 26 September 2026

Replaced free orbit and pan in Play with two prescribed faces, Flip/F and bounded
centered scroll/pinch or keyboard zoom. The movement side remains the default;
selection, hints and ordinary placements preserve the view. Workbench return and
renderer recovery preserve the camera and its zoom limits. Help and canvas
accessibility text describe the new controls. The homepage controls are unchanged.

Straight-on views alone leave four physical parts inaccessible in maximal legal
assemblies: two radial dial screws and two shock-indicator washers. The screws
now expose an explicit View dial edge action using the existing authored vectors;
Return to faces restores the prior normal camera. The shock-indicator workbench
uses a fixed tilted pair. Guidance checks only the two current presets and never
hides fitted geometry or enters an edge view automatically. No source geometry,
dependency, physical count or save format changed.

Verification: all 65 CPU tests, typecheck, lint and production build pass. The
new fixed-access geometry script checks all 373 Easy/Hard actions against every
legal opaque predecessor at three sampled distances: all 1,119 checks pass.
An isolated production browser session confirmed that empty-space drag plus
arrow input leaves the rendered view identical, centered zoom and Flip work,
a barrel can be dragged from its gallery thumbnail into place, and explicit edge
view entry/return works. All 39 shock-indicator parts were placed through visible
UI controls, including both washers, and the completed packet was transferred
into the watch. The browser completion scripts were updated for fixed views but
not rerun in full; mobile touch and Safari remain unverified for this change.
The CPU ray-access audit is not physical collision certification.

Preview refreshed at http://127.0.0.1:4185/play; reload to receive the new controls.
The user's existing save was not touched; browser review used port 4186.
Next action: user review of fixed views and fitting. Local commit only, no push,
PR or deployment. Original untracked prompt files remain excluded.

## Play opening orientation — 26 September 2026

Initialized the Play camera on negative Z before constructing OrbitControls,
matching the movement-side preset and negative-Y up vector used when a game
starts. Previously, the unpositioned camera could trigger a controls change
before first framing and replace the intended back-side default with front.
The difficulty-selection screen now starts with the same movement-side
orientation as gameplay. Production build passes; no additional tests run.
Preview refreshed on port 4185. Local change only; no publishing.

## Play redesign pull request — 26 September 2026

Pushed `codex/play-free-assembly` over SSH and opened
[PR #14](https://github.com/galind/zweigesicht-1/pull/14), targeting
`codex/play-assembly` because the original Play PR #12 remains open.
The PR describes the redesign, gallery dragging, fixed views, opening orientation,
verification evidence and remaining review limits. No merge or manual deployment.
Next action: review PR #14. Original prompt files remain untracked.

## Play workshop experience redesign — 26 September 2026

Completed an experience-led review of the current free-assembly branch. The
[review and plan](docs/PLAY_EXPERIENCE_REVIEW.md) identifies the main product
failure: exact mechanics and exhaustive inventory were presented as a CAD-style
database before the player reached a satisfying fit. Existing production logs
remain useful regression evidence but were explicitly rejected as evidence of
enjoyment or comprehension.

The new primary loop is **Ready now**: it offers only unplaced actions whose
authored prerequisites pass, without revealing their seats. **All parts** keeps
the full searchable dependency puzzle. Workshop retains 89 prepared fits.
Master bench still contains all 249 individual parts and 35 transfers, but the
watch-level tray now presents named subassembly projects; child leaves appear
only inside their focused workbench. Empty workbenches show an intentional
fixture cue rather than a blank canvas. Source endpoints, the dependency graph,
snap validation, fixed views, save schema and finished 265-leaf movement are
unchanged.

The interface now sets honest mode expectations, gives the watch priority, uses
a warmer workshop hierarchy, shows physical-part / fit / mechanism progress,
marks selected thumbnails as draggable, acknowledges clue-free fits, calls out
subassembly and mechanism milestones, and provides a dedicated completion
state. Undo, Flip and Reset remain in the fitting path. Help, clue preference,
restart and challenge selection live in a compact labeled menu. Successful
saves no longer occupy a permanent footer; storage failures remain visible.

Verification on the final build: inventory validation passes with 16 foundation,
89 Workshop, 249 Master-bench and 265 final leaves; the maximal-obstruction
access audit passes all 373 actions / 1,119 camera checks; all 66 unit and
lifecycle tests, TypeScript, lint and production build pass. Browser review on
the local production build covered entry/resume, Ready now, All parts, menu,
Master-bench projects, an empty workbench, explicit Show seat, a successful fit
and advancing prerequisite tray at 1440×900 and 390×844. The 320×740 / 200% text
layout has zero horizontal overflow, an in-viewport dock and icon-only labelled
header controls. No browser warnings or errors were recorded. The maintained
Play browser scripts were updated for project cards and the renamed controls;
their full Playwright traversals were not rerun because this checkout has no
Playwright runtime.

Physical-phone, Safari and representative human enjoyment/accessibility review
remain outstanding. The fixed-view surface audit is not collision or servicing
certification. Final production preview: http://127.0.0.1:4187/play. This work
is on `codex/play-workshop-redesign`, based directly on `codex/play-assembly`.

PR publication: pushed the branch over the configured SSH remote and opened
[PR #15](https://github.com/galind/zweigesicht-1/pull/15) against
`codex/play-assembly` through the connected GitHub app. No merge or deployment
was performed. Next action: human play review, followed by the outstanding
physical-device and Safari checks.

### Gallery finish correction — 26 September 2026

User review identified the gallery parts as visually unpleasant. The previews
were materially faithful but colorimetrically wrong: WebGL render-target bytes
are in linear-sRGB, while the generated PNG was interpreted by the browser as
display-sRGB. That crushed metallic midtones toward black and left isolated
warm highlights, producing the dark orange silhouettes seen in the tray.

Thumbnail pixels now receive the missing display encoding before PNG export.
The fix keeps the shared authored materials, source geometry, environment,
camera, layout and drag behavior unchanged; it does not introduce a separate
game-only finish. Desktop review across the full Ready-now tray and a 390×844
phone review confirm legible steel, brass, rose-gold, blued and ruby parts.
Browser warning/error logs remain empty. Existing build notices about chunk
size and route classification are unrelated to this visual defect and remain
documented rather than treated as feature-health evidence.

Verification: all 67 tests, inventory validation, TypeScript, lint and the
production build pass. The new regression check covers linear-to-display color
encoding and unchanged alpha. Commit `07e48cd` was pushed over SSH and PR #15's
summary/verification were updated through the GitHub connector. The production
preview at http://127.0.0.1:4187/play was rebuilt and left on the corrected
gallery. Next action is user review; physical-device, Safari and representative
enjoyment/accessibility review remain outstanding.

## Play and homepage cohesion plan — 26 September 2026

Completed a matching-size desktop and phone comparison of the homepage and the
current Play production build. User feedback simplified the resulting
[cohesion plan](docs/PLAY_HOMEPAGE_COHESION_PLAN.md): the homepage receives one
weighted `Assemble the movement` action, its shared popup chooses Easy or Hard,
and the selected mode opens directly at `/workshop`. The large route-level
choice screen is removed rather than redesigned. `/play` becomes a compatibility
redirect.

The plan defines deterministic new/resume/cross-mode/corrupt/unavailable-save
behavior, retains the current storage key, keeps the ordinary homepage free of
Workshop payload, and avoids an all-at-once rename of renderer internals. A
direct `/workshop` visit resumes a valid save; a visit without a save or mode
returns to the homepage chooser. Switching away from a progressed mode remains
explicitly confirmed.

The active assembly UI still needs the measured cohesion work: homepage shell
and identity, a compact 220–240 px part rail, one persistent progress value,
simpler cards and on-demand filter/progress Sheets. Ready-now logic, exact
endpoints, source-scale dragging, fixed views, workbenches, saves, recovery and
the corrected authored gallery finishes remain unchanged. No product UI was
changed; this revised plan is awaiting feedback before implementation.

## Homepage entry and Workshop implementation — 26 September 2026

Implemented the approved cohesion plan on `codex/play-workshop-redesign`.
The homepage header now keeps a restrained **Assemble the movement** action
visible at desktop and an accessible **Assemble** adaptation on narrow phones.
Its shared Sheet contains only Easy, Hard and the final scope/save copy. The
ordinary homepage still requests no Workshop component, manifest or CAD. The
one-shot `/?assemble=1` hint opens the chooser after hydration and removes
itself with history replacement.

The public assembly route is now `/workshop`, with updated noindex metadata,
canonical and Open Graph URL. `/play` returns a permanent 308 redirect and
preserves query parameters. Easy and Hard links boot the assembly directly.
Valid saves resume without another chooser; no-progress cross-mode saves are
replaced directly; progressed cross-mode saves offer the requested and saved
modes; corrupt/incompatible saves require confirmation before replacement;
direct entry without a valid mode/save returns to the homepage chooser. Change
difficulty preserves the save. Unavailable storage permits the current-tab
build, keeps the mode query and warns that leaving or reloading may lose work.
The storage key remains `zweigesicht:play:session:v1`.

Workshop now uses the homepage's neutral field and identity. Easy/Hard context,
Ready now, All parts and one mode-specific progress value occupy the compact
rail; detailed progress and All-parts search/grouping use shared Sheets. Default
cards prioritize their authored thumbnail and name without repeated ready-state
metadata. Undo, Flip and Reset are the only persistent actions. Desktop rail
height is 226 px; normal phone height is 232 px. Enlarged narrow layouts wrap
and scroll vertically without rail-wide horizontal overflow. The menu includes
Return to the movement viewer, and completion offers Explore the movement,
Build again and Change difficulty while leaving the assembled movement visible.

Final verification passes: 67 automated state/lifecycle/build tests; inventory
validation at 16 foundation leaves, 89 Easy fits, 249 Hard parts and the exact
265-leaf final set; fixed-view access at 373 actions / 1,119 camera checks;
TypeScript; lint; production build; and production SEO/HTTP. Isolated Chrome
passes 15 homepage-entry/payload/focus/navigation checks, 91 focused startup,
storage, responsive, recovery and interaction checks, and 93 desktop/390/320
drag/workbench checks, with no uncaught errors. Complete real-DOM traversals
pass all 89 Easy actions / 538 checks and all 284 Hard actions / 1,708 checks
in reverse order at 320 px. Visual review covers matching homepage/Workshop
desktop and phone captures plus 320×568 at 200% text; the enlarged rail issue
found during review was corrected and rerun.

The production build retains the existing Node module-registration deprecation,
large-chunk and vinext route-classification notices. Physical-phone, Safari,
representative assistive-technology/human usability, mechanical certification
and publication/redistribution release gates remain outstanding. The final
local production preview is http://127.0.0.1:4187/workshop. No merge or manual
deployment was performed.

## Workshop interaction refinement — 26 September 2026

Refined the homepage entry and Workshop after hands-on review. The Easy/Hard
chooser is now a true centered modal decision with a dimmed, blurred backdrop,
clear option cards, direct initial focus and consistent desktop/phone margins;
it no longer borrows the informational edge-panel placement. Gallery thumbnails
now use one straight-on watch-axis camera and a final transparent-pixel centering
pass, so neighboring parts share a stable orientation and visual center.

Removed the Hints/Clues toggle from both the header and menu. Ready now remains
the actionable tray; All parts keeps unavailable work inspectable but prevents
premature dragging and directs players back to Ready now. Show seat remains the
single optional placement aid. The saved-session shape stays compatible, while
the removed preference no longer affects Workshop presentation or placement.

Workshop OrbitControls now match the homepage movement view: mouse or one-finger
drag rotates freely, pinch/wheel zoom remains available, and Flip/Reset stay as
quick camera actions. Help and feedback copy describe the new behavior. Updated
browser runners cover readiness, disabled unavailable work, Show seat and free
orbit instead of the removed hint states.

Verification passes TypeScript, lint, all 67 automated tests, production build
and targeted production Chrome checks. The chooser is mathematically centered
at 1440×900 and 390×844 with 16 px phone margins; eight sampled visible
thumbnails have identical rendered centers; a real canvas drag changes the
camera while Show seat remains available. The maintained homepage, focused and
drag/workbench suites pass 15, 87 and 87 checks respectively, with no uncaught
browser errors. The rebuilt preview remains at
http://127.0.0.1:4187/workshop.

## Develop/staging release workflow — 26 September 2026

Established `develop` as the long-lived integration branch and Vercel Preview
source for staging, while `main` remains the production branch. Feature, fix and
Codex branches now target `develop`; only a `develop` → `main` release PR is an
ordinary production path. The branch policy is documented in
`docs/BRANCHING_AND_RELEASES.md` and reinforced by the pull-request template.

Added GitHub Actions CI for pull requests and pushes involving `develop` or
`main`: automated tests, Workshop inventory validation, TypeScript, lint and the
production build. A separate, manually dispatched Prepare production release
workflow can open one draft release PR to `main` only after an explicit
confirmation; pushes to `develop` never initiate production promotion. The
actual merge remains manual behind staging, performance and publication checks.
Vercel's existing Git integration remains the sole deployer: feature/develop
pushes create Preview deployments, while a reviewed merge to `main` creates
production. No Vercel token or parallel deployment path was introduced.

## Homepage/Workshop shared UI consolidation — 27 September 2026

Consolidated the homepage and Workshop after a second duplication audit. Both
routes now render one shared site header, identity and header-actions structure;
use one glass-surface utility and the same site control/muted tokens; and share
the complete movement loading/error/retry treatment. Workshop-only aliases for
the same colors and glass recipe were removed, its duplicated dock rules were
merged, and responsive identity typography now has one source of truth.

Layout effects now use one resize-observer utility that performs the initial
measurement and owns observer/window cleanup. Shared text controls use the
existing class-name helper instead of a second class-merging implementation.
The distinct homepage viewer and Workshop assembly/session controllers remain
separate because their state and lifecycle contracts differ.

Verification passes all 67 automated tests, Workshop inventory validation,
TypeScript, lint and the production build. Headless Chrome passes all 15
homepage checks, 87 Workshop drag/touch/workbench checks and 35 cross-route
desktop, phone, narrow, landscape, 200% text, popup and animated-loader parity
checks with no browser errors. Generated desktop, phone, enlarged-text and
loader captures were visually reviewed. The build retains the existing Vinext
module-registration, chunk-size and route-classification notices.
