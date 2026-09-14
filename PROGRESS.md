# Current project status

Updated 14 September 2026. This file summarizes the checkout. Earlier milestone reports are recoverable from Git at `e5c890f`.

## Implemented

The real-CAD static explorer includes all 426 source hierarchy instances, six functional groups, component inspection/isolation, complete separation, All parts, both independent dial/hand configurations and authored finishes. Running-watch simulation was removed by user decision. Reset preserves the current side and dial preferences.

Later refinements include straight-on opening/Reset, independent inventory flipping, upright screw and hand presentation, revised frosting and dial finishes, diamond internal-facet shading, stable loading layout, visible author/independence credit and minimal homepage SEO. Maintenance constraints are in [CAD notes](docs/CAD_NOTES.md) and [runtime architecture](docs/LOCAL_ARCHITECTURE.md).

## Domain and repository checkpoint

The checkout includes merged PRs #1 (homepage SEO), #2 (loading layout) and #3 (custom domain), through `3a889f4`. Canonical and social metadata use `https://zweigesicht-1.guillemgalindo.com/`.

The last recorded domain check on 14 September confirmed attachment and ownership verification on Vercel project `zweigesicht-1` (`prj_Z2S8IQ88PypFXHg6JktpE2CJMoju`), with external DNS still pending. Required record: CNAME host `zweigesicht-1`, value `4e9bb417d6b08f83.vercel-dns-017.com.`. Existing domains were retained. Live DNS and deployment state have not been rechecked during this documentation cleanup.

Next domain action: verify the external DNS record and Vercel cutover status, then complete any remaining authorized metadata deployment. The repository contains Vercel configuration; older blanket statements that nothing has ever been deployed are not a reliable current status.

## Verification and limits

Previously recorded checks include lint, TypeScript, production and Vercel builds, SEO HTTP checks, 10 state tests and 88 CPU source/runtime checks across the relevant milestones. Their exact scope and dates are in Git history; these are not fresh test results for every subsequent commit. Browser evidence includes desktop Chromium and mobile viewport emulation, not physical-phone certification.

Mechanical contact/deformation fidelity, remaining source/variant exceptions, physical-device and human usability review, redistribution rights and publication approval remain subject to the [release gates](docs/RELEASE_GATES.md). Authored finishes and separation paths are visual interpretations, not measured materials or service instructions.

## Documentation consolidation — 14 September 2026

Reduced `docs/` from 24 Markdown files to three: runtime architecture, CAD maintenance notes and release gates. Removed completed reviews, the duplicate generated ledger, the documentation index and the archived progress copy; Git preserves them at `e5c890f`. Source manifests, authored data and detailed JSON evidence are retained. The ledger generator now emits only its JSON record; evidence-page links point to retained files.

Validation: local documentation/evidence links, script syntax and staged diff checked. No viewer behavior or assets changed; runtime suites were not rerun.
