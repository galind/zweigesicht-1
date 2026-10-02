# Current project status

Updated 3 October 2026. The current application is the static CAD explorer at `/` and free-choice Workshop at `/workshop`; `/play` redirects. Setup and verification commands are in [README](README.md); implementation boundaries are in [architecture](docs/LOCAL_ARCHITECTURE.md).

## Current state

- Explorer: 426 source instances, six groups, source inspection/isolation, All parts, disassembly, shared dial visibility, independent hands and a 41-leaf fitted case. Source geometry, finishes and exact placements are retained.
- Workshop: free orbit, Ready now/All parts, optional Show seat, source-scale gallery dragging, explicit workbenches, Undo and local nonlinear saves. Easy has 89 fits; Hard has 249 parts and 35 transfers. Both retain 16 foundation leaves and finish with 265. There is no Hints toggle; its legacy save field remains compatible.
- Homepage and Workshop share typography, header/navigation geometry, glass surfaces, palette, controls, buttons, popovers, focus treatment and the movement-loading presentation. The Workshop retains its route-specific assembly rail, now with dedicated compact and short-landscape layouts.
- Homepage and Workshop now use the approved Section loading animation: the outlined gg starts closed for about 1.25 seconds, then its sections separate and realign on two axes. The loading phrase is visually hidden and retained for screen readers; transfer details and recovery messages remain visible. The 5.2-second CSS loop is independent of transfer progress; reduced motion shows the complete static mark. Workshop assembly controls remain hidden during loading and recovery to keep the status readable. The development comparison, unused variants and study-only documentation/evidence have been removed.
- The homepage header centers “Be a watchmaker”; compact layouts preserve the full label and use a second row when needed. The shared loader anchors its visible letterforms to the viewport center from first paint, independently of header/dock measurements and transfer detail. Its SVG view box compensates for the letterforms’ offset within the font line box.
- Homepage startup waits for two prepared draws at stable dimensions before revealing the watch. A viewport change during preparation refits immediately while hidden, preventing an initial size correction after reveal.
- `develop` is integration/staging; `main` is production. The root Vercel configuration and existing CI/release workflows are authoritative. Canonical metadata uses `https://zweigesicht-1.guillemgalindo.com/`.
- The repository cleanup from PR #20 is incorporated. Historical reports, generated ledgers, abandoned timing/smoke experiments and obsolete review tools are removed. Current asset generation, source provenance, authored decisions and meaningful checks remain. PR #19 was not merged; its consequential findings are in [CAD notes](docs/CAD_NOTES.md).

## Verification

Verified on 3 October: 68 automated tests, typecheck, lint, changed-file formatting and production build pass after the final PR cleanup. The real-renderer timing probe forces a viewport change between preparation frames and records zero camera drift after reveal. A separate measurement confirms the homepage watch’s projected central axis is exactly at the viewport center over its first 30 visible frames at five desktop/mobile sizes. All 175 loading/header checks and the homepage suite (15 checks including 71 embedded UX checks) pass.

Verified on 2 October: 67 automated tests, Workshop inventory/graph validation, 114 prepared source/runtime checks and 1,119 sampled access checks pass. TypeScript, lint, production and Vercel builds pass; required packaged asset paths/hashes and documentation links pass. A tracked-only checkout also builds with freshly installed application dependencies.

Desktop Chrome checks pass for both routes: explorer controls, all 89 Easy and 284 Hard actions, focused/mobile-viewport interactions, dragging, access and homepage configuration. The sheet Close control matches the starting appearance and dismisses correctly. Tracked runtime geometry, finish buffers, recoveries and asset hashes are unchanged.

The homepage/Workshop UI follow-up passes 93 focused responsive checks across desktop, 390 px, 320 px, short landscape and 200% text; 87 inventory drag/touch checks; and the maintained homepage suite. Coverage includes compact progress/filter wrapping, card-content containment, footer/action geometry, keyboard reachability and fixed loading-mark geometry with visually hidden status at enlarged text sizes. The separate Section animation adoption is verified below.

The integrated loader and centered header pass 175 production browser checks across both routes at desktop, 390px, 320px, short landscape and 200% text (including combined landscape/enlargement). Checks cover actual held/failed asset requests, keyboard retry through to readiness, position stability from the first visible frame, exact visible-letter centering on cold and warm reloads, centered watchmaker entry, closed initial/repeated holds, longer-load motion, fixed animation geometry, reduced motion, screen-reader status, assembly controls returning after recovery, and removal of development routes. The maintained 92-check Workshop suite passes after cleanup (its duplicate loading probe is covered by the dedicated loading suite); the homepage suite (15 checks including 71 embedded UX checks) passes with the renamed watchmaker entry. Typecheck, lint and production build pass. Current local evidence is ignored under `artifacts/browser/movement-loading/`.

The retained CAD pipeline, Meshopt verification and asset preparation pass in an isolated workspace with the reduced locked dependencies, recorded originals and copied prepared caches/face sidecars. Reproduced geometry/recovery/finish payload hashes match; this does not establish an uncached clean-machine CAD rebuild.

The final PR audit against `develop` retains only shared UI parity, the approved loader, centered watchmaker entry, startup framing, regression coverage and current documentation. Obsolete flex header declarations and unused Workshop class aliases are removed. No concept previews, study assets, dependencies, CAD changes or deployment configuration are included. Existing untracked prompt documents remain untouched.

## Outstanding limitations and next actions

- Complete physical iPhone/Android, Safari/WebKit, sustained GPU/thermal and representative accessibility/usability review. Desktop viewport and synthetic-touch checks do not qualify those gates.
- CAD exceptions, uncertain alloys/finishes, middle-ring interference and unresolved lock actuation remain in [CAD notes](docs/CAD_NOTES.md). Separation and Workshop dependencies are illustrative; mechanical review remains required for mechanical claims.
- Clean-machine CAD reproduction is unverified; prepared source regression inputs remain local and ignored. Public redistribution/publication needs the applicable [release gates](docs/RELEASE_GATES.md).
- Existing build notices include large client chunks and vinext route/framework notices. No runtime performance improvement is claimed from repository cleanup.
- Next: review and merge the homepage/Workshop parity PR, then perform the device/human reviews before release decisions. No publication or production deployment is part of this work.
