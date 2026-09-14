# Current project status

Updated 14 September 2026. This file summarizes the checkout. Earlier milestone reports are recoverable from Git at `e5c890f`.

## Implemented

The real-CAD static explorer includes all 426 source hierarchy instances, six functional groups, component inspection/isolation, complete separation, All parts, both independent dial/hand configurations and authored finishes. Running-watch simulation was removed by user decision. Reset preserves the current side and dial preferences.

Later refinements include straight-on opening/Reset, independent inventory flipping, upright screw and hand presentation, revised frosting and dial finishes, diamond internal-facet shading, stable loading layout, visible author/independence credit and minimal homepage SEO. Maintenance constraints are in [CAD notes](docs/CAD_NOTES.md) and [runtime architecture](docs/LOCAL_ARCHITECTURE.md).

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
