# Current project status

Updated 2 October 2026. The current application is the static CAD explorer at `/` and free-choice Workshop at `/workshop`; `/play` redirects. Setup and verification commands are in [README](README.md); implementation boundaries are in [architecture](docs/LOCAL_ARCHITECTURE.md).

## Current state

- Explorer: 426 source instances, six groups, source inspection/isolation, All parts, disassembly, shared dial visibility, independent hands and a 41-leaf fitted case. Source geometry, finishes and exact placements are retained.
- Workshop: free orbit, Ready now/All parts, optional Show seat, source-scale gallery dragging, explicit workbenches, Undo and local nonlinear saves. Easy has 89 fits; Hard has 249 parts and 35 transfers. Both retain 16 foundation leaves and finish with 265. There is no Hints toggle; its legacy save field remains compatible.
- Homepage and Workshop share typography, header/navigation geometry, glass surfaces, palette, controls, buttons, popovers, focus treatment and the movement-loading presentation. The Workshop retains its route-specific assembly rail, now with dedicated compact and short-landscape layouts.
- A refined Section loading study and its previous version are available locally at `/__loading` during development. [Comparison, captures and rationale](docs/LOADING_CONCEPTS.md). Section is the selected direction for refinement: stronger contours, two-axis seating and a clean assembled hold. Both production loaders remain unchanged.
- `develop` is integration/staging; `main` is production. The root Vercel configuration and existing CI/release workflows are authoritative. Canonical metadata uses `https://zweigesicht-1.guillemgalindo.com/`.
- The repository cleanup from PR #20 is incorporated. Historical reports, generated ledgers, abandoned timing/smoke experiments and obsolete review tools are removed. Current asset generation, source provenance, authored decisions and meaningful checks remain. PR #19 was not merged; its consequential findings are in [CAD notes](docs/CAD_NOTES.md).

## Verification

Verified on 2 October: 67 automated tests, Workshop inventory/graph validation, 114 prepared source/runtime checks and 1,119 sampled access checks pass. TypeScript, lint, production and Vercel builds pass; required packaged asset paths/hashes and documentation links pass. A tracked-only checkout also builds with freshly installed application dependencies.

Desktop Chrome checks pass for both routes: explorer controls, all 89 Easy and 284 Hard actions, focused/mobile-viewport interactions, dragging, access and homepage configuration. The sheet Close control matches the starting appearance and dismisses correctly. Tracked runtime geometry, finish buffers, recoveries and asset hashes are unchanged.

The homepage/Workshop UI follow-up passes 93 focused responsive checks across desktop, 390 px, 320 px, short landscape and 200% text; 87 inventory drag/touch checks; and the maintained homepage suite. Coverage includes compact progress/filter wrapping, card-content containment, footer/action geometry, keyboard reachability and separation between the enlarged loading label and `gg` mark. The loading animation itself is unchanged in this follow-up.

The Section refinement passes all 110 browser checks across the previous and refined versions and both contexts, including reduced motion, keyboard retry, fixed animation geometry, transfer-detail reservation and short landscape combined with 200% text. Typecheck, lint and production build pass. The initial study pass also verified the maintained 93-check focused suite, homepage suite and ten production loading/retry/isolation checks; production integrations have not changed since. Study code/styles are excluded from production output and the preview URL returns 404 there. Local screenshots and complete-loop GIFs remain ignored evidence.

The retained CAD pipeline, Meshopt verification and asset preparation pass in an isolated workspace with the reduced locked dependencies, recorded originals and copied prepared caches/face sidecars. Reproduced geometry/recovery/finish payload hashes match; this does not establish an uncached clean-machine CAD rebuild.

## Outstanding limitations and next actions

- Review the refined Section against its previous version and approve adoption before changing the production animation. Any adoption should include the study's detail reservation and header-aware short-screen placement, then remove the development comparison and unused concepts.
- Complete physical iPhone/Android, Safari/WebKit, sustained GPU/thermal and representative accessibility/usability review. Desktop viewport and synthetic-touch checks do not qualify those gates.
- CAD exceptions, uncertain alloys/finishes, middle-ring interference and unresolved lock actuation remain in [CAD notes](docs/CAD_NOTES.md). Separation and Workshop dependencies are illustrative; mechanical review remains required for mechanical claims.
- Clean-machine CAD reproduction is unverified; prepared source regression inputs remain local and ignored. Public redistribution/publication needs the applicable [release gates](docs/RELEASE_GATES.md).
- Existing build notices include large client chunks and vinext route/framework notices. No runtime performance improvement is claimed from repository cleanup.
- Next: review and merge the homepage/Workshop parity PR, then perform the device/human reviews before release decisions. No publication or production deployment is part of this work.
