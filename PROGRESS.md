# Current project status

Updated 14 September 2026. This file summarizes the checkout. Earlier milestone reports are recoverable from Git at `e5c890f`.

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

## Watch configuration — implementation in progress

Verified branch `codex/quiet-movement-redesign` and clean starting checkout. The fitted-case audit selects 41 physical leaves: source packets 1/2/3/6/7/8 and the matching d51 attachments under children 4/9; alternate attachments, all leather and buckles are excluded. Original occurrence matrices are recorded in `assets/authored/watch-configurations.json`. Maker references and hashes, material scope and compatibility decisions are in `assets/source-manifest/watch-configuration.json`.

The d54 probe identifies missing face 1 (28.357985 mm²). Independent tessellation of that original planar face at 0.03 mm yields 34 triangles and 28.227462 mm² (0.46% area difference), preserving original wires and surface. The local recovery sidecar is hash checked and remains ignored; source STEP and existing GLBs are unchanged. The probe and asset preparation reproduce it. Fine hands support blue and rose-gold appearances; Lance/Open lance retain blue, Skeleton remains unchanged. Case alloy choices are authored appearances of the SS geometry, not additional alloy models. Browser inspection of the first fitted steel and rose-gold rendering is complete; broader implementation verification remains underway. No push or deployment.

## Original prepared goal

Prepared [Watch configuration](docs/WATCH_CONFIGURATION_GOAL.md) at the user’s request. The next implementation would replace Dials & hands with Configure, adding a fitted case/crystal toggle, supported case materials and Three hands material choices. The user clarified that “sticks” means the hands, not hour markers. Source case geometry is present; fitted occurrence selection and material compatibility require the documented audit. This turn prepares the goal only; implementation has not started.

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
