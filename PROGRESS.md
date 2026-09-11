# Zweigesicht — current state

## Accepted model

The model and experience are accepted on `main` at commit `548620a` (11 September 2026). The accepted appearance checkpoint is `d0132e2`. All 70 source/runtime checks, lint, TypeScript, and the production build passed at delivery. The hash-verified annotation payload `finish-surfaces-afd3394797bd.bin` and its gzip match the approved local preview; geometry is unchanged.

The repository contains the complete local real-CAD explorer: the 426-instance source catalog, six functional groups, finish/function inspection, component isolation, complete separation, both dial-and-hand configurations, and static construction reveals. Detailed audit and review evidence remains under `docs/`; source URLs and hashes remain under `assets/source-manifest/`.

## Boundaries

This is not a certified running-watch simulation or service procedure. Mechanical correctness beyond recorded evidence, physical-device review, redistribution of source/derived CAD, and public publication remain separate gates. Original CAD downloads, generated caches, local visual evidence, environments, and dependencies stay outside Git.

## Current release position

The local implementation is ready for user and engineering review. Public release remains blocked by source/CAD redistribution permission, final variant and source-fidelity decisions, expert mechanical review, real-device and human usability evidence, deployment qualification, and explicit publication approval. No Site or CAD asset has been uploaded or deployed.

## Current interaction refinement

Explore has been refined after the first emphasis milestone was rejected in user review. The current model restores mechanism-sized framing, separates explanatory context from the supporting plate, preserves authored finishes without a color wash, and fixes inherited cover visibility. See the focus refinement milestone below and `docs/EXPLORE_EMPHASIS_REVIEW.md`.

## Frosting stability — 11 September 2026

Frosting now uses restrained source-local color/roughness grain instead of cellular bump normals. Two smooth octaves fade before becoming subpixel; the plate and seven reviewed mounting pads retain separate grain scales. At the initial stability checkpoint, frost roughness stayed within 0.46–0.52, with no frost normal perturbation or directional anisotropy. Existing satin bases, brushing, polished bevels, source face masks, geometry buffers and asset identities are preserved.

Verified: lint, TypeScript (`tsc --noEmit`), production build, seven state tests and all 70 source/runtime checks pass. The focused shader regression protects filtering, bounded roughness and the exclusion of frosting from bump/anisotropy, alongside existing exact face-mask and geometry-byte checks. Build retains the existing large-chunk and Node deprecation warnings.

Browser review at 1440×900 and 390×844 covered assembled and close-up views, orbit angles, zoom, separation and mechanism selection. Frost remained subdued without observed sparkle; satin grain and polished edges remained distinct. All 18 real-renderer interaction checks passed in each viewport, including all six mechanism finish contracts, with no browser/shader errors. This is desktop Chromium with mobile viewport emulation, not physical-phone certification or a cross-GPU temporal guarantee.

Local screenshots and reports: `artifacts/browser/frost-stability/` (ignored). Preview: `http://127.0.0.1:4173/?inspect=1`; the pre-existing development server remains available. Next action: user appearance review; publication and mechanical/device release gates remain unchanged.


## Frosting visibility follow-up — 11 September 2026

User review found the first stable treatment too faint. The follow-up restores visible granulation with stronger color/roughness contrast and slightly coarser source-local grain. A rotated fine octave carries most close-up detail without emphasizing a square noise grid. Frost roughness is bounded at 0.43–0.57; the existing subpixel fade, no-bump and no-anisotropy safeguards remain intact. Satin/polished finishes, geometry, source identities and exact face masks are unchanged.

Lint, TypeScript, production build, seven state tests and all 70 source/runtime checks pass. Desktop (1440×900) and mobile-sized (390×844) browser review covered zoom/orbit, separation and mechanism selection, with more visible close-up grain and no observed sparkle. All 18 mobile-sized renderer interaction checks also pass, with no browser/shader errors. Screenshots and reports are local under `artifacts/browser/frost-presence/`. Appearance is ready for user review in the existing local preview; mobile review remains viewport emulation.

## Indicator spring-block blue coverage — 11 September 2026

The indicator hand-lever spring block (d159) had narrow steel patches where interpolated source roles crossed the neutral-seat role inside its blue arms. The neutral-role override now preserves the explicit shock-arm blue mask, including its transition into the steel spine. All four arms retain blue across their narrow connections; the central spine and neutral seats on other parts remain steel. Geometry and source annotations are unchanged.

The focused regression evaluates the actual shader assignment for blue arms, neutral steel and the transition. All 70 source/runtime checks, seven state tests, lint, TypeScript and the production build pass. Browser macro review checked the isolated part and assembly context across orbit angles; no browser/shader errors. Local evidence: `artifacts/browser/shock-arm-blue/`. The existing preview remains open on the corrected part for user review.


## Explore emphasis — 11 September 2026 (superseded after user review)

Replaced the 10–16% base-color / matte-material overrides with emphasis applied after physical lighting. Active parts retain full lighting with a depth-respecting edge accent; context retains 90% lighting and surroundings 68%. Selected components receive a stronger accent and the existing selection box. Source finishes, face masks, geometry and optical parameters remain unchanged. Function/Finish was already retired; the single authored-finish view remains authoritative.

Removed the blanket nonmember visibility cutoff at reveal 0.5. Only authored uncover hosts retire after moving clear; active members and explicitly selected parts remain visible. Camera framing now includes the assembled movement envelope, avoiding fragmented crops of retained surroundings. The Explore menu has an accessible, persistent selected-section marker. All six mechanism groups and contact shading were audited in `docs/EXPLORE_EMPHASIS_REVIEW.md`.

Verified: lint, TypeScript, production build, seven state tests and all 71 source/runtime checks pass. New regressions protect physical material values, opaque depth, all six roles and visibility across reveal 0/0.49/0.51/1, selected-part precedence, shader placement and reset. The existing expected missing-asset fault injections still pass; build retains its existing large-chunk and Node deprecation warnings.

Browser verification at 1440×900 and 390×844 covers all mechanisms, menu selection, orbit, section separation and reset. Each viewport passes 24 real-renderer checks, including interruption/Back, manual camera ownership, reduced motion, visibility restoration and resource stability. Mobile is desktop Chromium viewport/handler emulation, not physical-device certification. Evidence: `artifacts/browser/explore-emphasis/` (ignored). Local preview: `http://127.0.0.1:4173/?inspect=1`.

Next action: user appearance review. Publication, CAD redistribution, expert mechanical review and physical-device gates remain unchanged; no deployment or upload was performed.


## Explore focus refinement — 11 September 2026

User review rejected `4be987f`: full-movement framing made mechanisms too small, broad context competed with the selection, and some lifted child components remained visible as floating occluders. This milestone refines that implementation; it does not revert it.

Mechanism framing now fits active parts plus 2.5 mm of local context. A shared classifier distinguishes active members, explicit explanatory context, related host parts, the supporting plate and unrelated surroundings. Keyless setting springs and winding supports stay readable while the large plate is quieter. Removed the colored fill from highlights; retained only a small edge cue with physical finishes unchanged.

Uncover visibility now follows the authored host ancestry, so rear-display parts retire with the lifted barrel bridge in unrelated views. The balance bridge and its two named obstruction screws fade out together over 280 ms to expose the hairspring; reversal continues from the displayed level and restores material opacity/depth. Details explains the cutaway and how to restore it. Fading covers are excluded from opaque contact depth to avoid ghost shadows. Source geometry, assembly poses and finish annotations are unchanged.

Verification: lint, TypeScript, production build, seven state tests and 72 source/runtime checks pass. All 30 real-renderer checks pass at both 1440×900 and 390×844, with no browser/shader errors. Added screen-space focus-size/containment checks for all groups, explicit keyless/plate contrast checks, inherited-cover regression, cutaway reversal and contact-depth checks. Desktop focus spans 49–87% of the shorter stage dimension across the six groups. Visual review covers every group, manual orbit, section separation, cover restoration, selected-spring isolation and reset. Mobile remains viewport/handler emulation.

Evidence and reports: `artifacts/browser/explore-focus-refinement/` (ignored). Detailed audit: `docs/EXPLORE_EMPHASIS_REVIEW.md`. Preview remains at `http://127.0.0.1:4173/?inspect=1`, focused on Winding & setting. Next action is user visual review; test success is not user appearance acceptance. Publication, CAD redistribution, mechanical and physical-device gates remain unchanged.
