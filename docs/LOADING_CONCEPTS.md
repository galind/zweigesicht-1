# Section loading refinement

2 October 2026. Section is the selected direction for further development. This pass refines one candidate and retains the previous Section beside it for comparison. It does not approve or install a production replacement.

## Review locally

Run `npm --prefix explorer run dev`, then open [previous versus refined](http://127.0.0.1:4173/__loading). Switch Homepage/Workshop, pause or resume motion, preview reduced motion, toggle transfer detail/error, or open a full view.

The refined version is `/__loading?concept=section`; the previous version is `?concept=section-original`. Add `surface=workshop`, `text=200`, `motion=reduce`, `state=error` or `detail=none` as needed. System reduced motion always takes precedence. Pause/resume is a gallery review control and does not affect the application.

## What changed

| | Previous Section | Refined Section |
| --- | --- | --- |
| Geometry | 52px gg with 0.9px contours | 56px gg with 1.2px contours; same fixed 120×80px envelope |
| Assembly | Upper and lower sections travel diagonally | Each section first aligns horizontally, then seats vertically; upper leads lower |
| Construction lines | Continuous lines cross the resolved letters | Cut lines fade as the pieces seat; small peripheral datums remain |
| Resolved state | Three clipped pieces remain visible | One unsliced contour replaces the fragments during the hold, avoiding clip seams and duplicate outlines |
| Timing | 4.8-second loop | 5.2-second loop with roughly 1.45 seconds fully assembled, followed by a staged vertical-then-horizontal release |
| Reduced motion | Aligned pieces and crossing guide lines | One complete gg, no moving or overlaid fragments, with quiet peripheral datums |

The stronger outline improves clarity while preserving the technical character. Moving along separate axes makes the registration sequence more deliberate. There is no rotation, bounce, glow, simulated telemetry or relationship between animation and transfer percentage.

The refinement is the recommended next review candidate. Its main tradeoff is a slightly larger, more deliberate presentation. The exploded state remains intentionally fragmented; the longer assembled rest provides a readable identity between cycles.

## Captures

Evidence is local and ignored by Git in `artifacts/browser/loading-section/`. GIFs contain a complete CSS loop sampled at 10 fps. Use the live preview for native-refresh smoothness and reduced-motion behavior; GIFs do not respond to motion preferences.

| Version | Homepage | Workshop | Complete loop |
| --- | --- | --- | --- |
| Previous | [Desktop](../artifacts/browser/loading-section/section-original-home-desktop.png) · [390px](../artifacts/browser/loading-section/section-original-home-mobile.png) | [Desktop](../artifacts/browser/loading-section/section-original-workshop-desktop.png) · [390px](../artifacts/browser/loading-section/section-original-workshop-mobile.png) | [Animation](../artifacts/browser/loading-section/section-original.gif) |
| Refined | [Desktop](../artifacts/browser/loading-section/section-home-desktop.png) · [390px](../artifacts/browser/loading-section/section-home-mobile.png) | [Desktop](../artifacts/browser/loading-section/section-workshop-desktop.png) · [390px](../artifacts/browser/loading-section/section-workshop-mobile.png) | [Animation](../artifacts/browser/loading-section/section.gif) |

[Desktop comparison](../artifacts/browser/loading-section/comparison-desktop.png) · [Mobile comparison](../artifacts/browser/loading-section/comparison-mobile.png). Additional captures cover 320px, short landscape, 200% text and landscape combined with 200% text.

## Verification and boundaries

- Typecheck, lint and production build pass. Existing large-client-chunk and vinext route-classification notices remain.
- **110 browser checks pass** across both versions and both surfaces at desktop, 390px, 320px, short landscape and 200% text. Coverage includes polite status semantics, decorative hiding, keyboard retry, stable transfer-detail spacing, animation-phase layout stability and reduced motion. Additional checks verify pause/resume by keyboard, a single resolved contour without crossing guides, and no overlaid fragments in reduced motion. No uncaught browser errors.
- Refined keyframes and comparison content are absent from the production build. The Vite-only preview remains outside the application route graph. The first pass verified production 404s and real asset-failure/retry behavior on both routes; this pass changes only development studies, their tests and documentation.
- The previous and refined versions use one drawing component, one glyph definition per instance and unique SVG references. Unused Datum and Fit code/styles are removed from the active preview. No new dependencies, raster runtime assets or JavaScript animation loops.
- Homepage and Workshop still share the existing status/retry component. Production copy, transfer details, errors, actions, accessibility semantics and the current production gg remain unchanged. The preview retains detail-space reservation and header-aware short-screen placement.

Reproduce with the README’s existing Playwright/Chrome setup:

```sh
PLAY_QA_OUTPUT=artifacts/browser/loading-section node scripts/review/loading-concepts-check.mjs http://127.0.0.1:4173
```

Remaining review: visual approval of the refined direction, physical-device outline readability, Safari/WebKit SVG clipping/animation, screen-reader announcement quality and sustained GPU/battery behavior. The unchanged homepage has both its hidden live status and the shared loader's live output; screen-reader review should check for duplicate announcements. No accessibility certification or measured performance improvement is claimed.

If approved for adoption, move the selected treatment and reviewed spacing into the existing shared production component and remove the development comparison and baseline. Nothing has been pushed or published.
