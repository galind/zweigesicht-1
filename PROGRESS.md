# Current project status

Updated 15 September 2026. This file summarizes the checkout. Earlier milestone reports are recoverable from Git at `e5c890f`.

## Implemented

The real-CAD static explorer includes all 426 source hierarchy instances, six functional groups, component inspection/isolation, complete separation, All parts, shared dial visibility with independent hand configurations and authored finishes. Running-watch simulation was removed by user decision. Reset preserves the current side and dial preferences.

Later refinements include straight-on opening/Reset, independent inventory flipping, upright screw and hand presentation, revised frosting and dial finishes, diamond internal-facet shading, stable loading layout, visible author/independence credit and minimal homepage SEO. Maintenance constraints are in [CAD notes](docs/CAD_NOTES.md) and [runtime architecture](docs/LOCAL_ARCHITECTURE.md).

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

At the user's request, connected `zweigesicht-1.com`, `thesevenspheres.com` and both `www` variants to that project and published a dashboard CDN routing rule, `Redirect watch domains to Marco Lang` (`01e4b6ab-ca8b-4eda-a001-adf5f2d20dda`). It matches path `^/.*$` only when the host matches `^(www\.)?(zweigesicht-1\.com|thesevenspheres\.com)$`, returning 301 to `https://www.marcolangwatches.com/`. This rule lives in Vercel's dashboard, not the repository configuration; the explorer hostname is excluded.

Zweigesicht retains its Vercel nameservers. Seven Spheres retains Namecheap BasicDNS: changed its parking CNAME `www` to `4e9bb417d6b08f83.vercel-dns-017.com.` and replaced the apex parking redirect with A `@` → `216.198.79.1`, both TTL 30 minutes. Mail settings were retained.

Verification around 18:38 UTC: all four redirect hostnames show Valid Configuration in Vercel. Both Zweigesicht addresses returned HTTPS 301 to the destination using ordinary DNS. Both Seven Spheres addresses passed certificate validation and returned the same 301 using curl `--resolve` to the configured Vercel IP; ordinary local DNS still reached the old endpoint or timed out. Next domain action: recheck Seven Spheres through ordinary DNS after propagation. No site build or CAD deployment was performed for these redirects.

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
