# gg loading studies

2 October 2026. The first four non-gg directions were rejected. This second pass returns to the original gg letterforms. These remain development-only proposals; the production loader is unchanged.

## Compare locally

Run `npm --prefix explorer run dev` and open [the comparison](http://127.0.0.1:4173/__loading). Switch between Homepage and Workshop, preview reduced motion, toggle transfer detail/error, or open a full view. System reduced motion always takes precedence.

Direct view: `/__loading?concept=poise&surface=workshop`. Concepts: `poise`, `breath`, `converge`, `engraved`. Optional parameters: `text=200`, `motion=reduce`, `state=error`, `detail=none`. Omit `concept` for the gallery.

The preview uses the existing header, status and retry components and both route shells, without CAD, navigation or docks. Homepage retains “Loading the movement” and “Movement file · 37%”; Workshop retains “Preparing the movement”. The percentage is a fixed specimen and never drives motion. Preview retry returns to loading; application asset retries remain unchanged.

## Options

| Concept | Rationale and loop | Strength | Tradeoff | Reduced motion |
| --- | --- | --- | --- | --- |
| **Poise** | Refine the original counter-motion: opposing 2° tilts and 1px vertical shifts, then a shared rest. 4.8 seconds. | Closest to the original character, with less activity. | Retains some rocking; may still feel too buoyant. | Upright, interlocked, fully visible gg. |
| **Breath** | A settled monogram fades gently between 65% and full opacity over 4.4 seconds. No translation, scaling or glow. | Quietest option with a completely stable silhouette. | Can look static during a brief load; lower visual weight at its darkest phase. | Fully opaque gg. |
| **Converge** | Each letter moves 4px inward, holds in the interlocked position, then releases. 5.6 seconds. | Suggests bringing components together while retaining gg. | Changing spacing attracts more attention. | Interlocked letters. |
| **Engraved** | Fine ivory/champagne contours alternate between 55% and full opacity over 5.2 seconds. No positional motion. | The lightest visual treatment without a new symbol or typeface. | Outline legibility needs physical-device review. | Both outlines fully visible. |

**Recommendation: Poise.** It keeps the distinctive original gesture and palette while reducing travel, rotation and frequency. **Breath** is the alternative if the priority is maximum stillness.

## Screenshots and complete-loop captures

These local files are intentionally ignored by Git in `artifacts/browser/loading-gg/`. GIFs sample the actual CSS animation at 10 fps; judge smoothness in the live preview. GIFs do not respond to reduced-motion settings; the live preview does.

| Concept | Homepage | Workshop | One loop |
| --- | --- | --- | --- |
| Poise | [Desktop](../artifacts/browser/loading-gg/poise-home-desktop.png) · [390px](../artifacts/browser/loading-gg/poise-home-mobile.png) | [Desktop](../artifacts/browser/loading-gg/poise-workshop-desktop.png) · [390px](../artifacts/browser/loading-gg/poise-workshop-mobile.png) | [Animation](../artifacts/browser/loading-gg/poise.gif) |
| Breath | [Desktop](../artifacts/browser/loading-gg/breath-home-desktop.png) · [390px](../artifacts/browser/loading-gg/breath-home-mobile.png) | [Desktop](../artifacts/browser/loading-gg/breath-workshop-desktop.png) · [390px](../artifacts/browser/loading-gg/breath-workshop-mobile.png) | [Animation](../artifacts/browser/loading-gg/breath.gif) |
| Converge | [Desktop](../artifacts/browser/loading-gg/converge-home-desktop.png) · [390px](../artifacts/browser/loading-gg/converge-home-mobile.png) | [Desktop](../artifacts/browser/loading-gg/converge-workshop-desktop.png) · [390px](../artifacts/browser/loading-gg/converge-workshop-mobile.png) | [Animation](../artifacts/browser/loading-gg/converge.gif) |
| Engraved | [Desktop](../artifacts/browser/loading-gg/engraved-home-desktop.png) · [390px](../artifacts/browser/loading-gg/engraved-home-mobile.png) | [Desktop](../artifacts/browser/loading-gg/engraved-workshop-desktop.png) · [390px](../artifacts/browser/loading-gg/engraved-workshop-mobile.png) | [Animation](../artifacts/browser/loading-gg/engraved.gif) |

[Desktop comparison](../artifacts/browser/loading-gg/comparison-desktop.png) · [Mobile comparison](../artifacts/browser/loading-gg/comparison-mobile.png). Additional captures cover 320px, short landscape and 200% text, including landscape combined with 200% text.

## Verification and boundaries

- Typecheck, lint and production build pass. Existing large-chunk and vinext route-classification notices remain.
- All **210 study checks** pass again with the new gg options: both surfaces, desktop/390px/320px/short landscape/200% text, reduced motion, polite status semantics, keyboard retry, transfer-detail reservation and animation-phase layout stability. No uncaught browser errors.
- All concepts and styles remain under `explorer/dev/loading-concepts/`, served by a Vite-only `/__loading` entry. The new animation selectors and page content are absent from the production build. The first pass already verified production 404s and actual loader/retry behavior on both routes; this pass changes only the development studies, their checks and documentation.
- The shared production loader, globals and application integrations are unchanged in this pass. The previous pass's optional decorative slot keeps status and recovery in one component. No new dependencies, JavaScript animation loops, images, filters or glow.
- Each gg uses a fixed 120×80px envelope. Transforms and opacity cannot shift the label. Homepage reserves the transfer-detail row. The preview retains the header-aware short-landscape placement from the first pass.

Reproduce with the README’s existing Playwright/Chrome setup:

```sh
node scripts/review/loading-concepts-check.mjs http://127.0.0.1:4173
```

Remaining review: approval of a direction, Safari/WebKit, physical devices, screen-reader announcement quality and sustained GPU/battery behavior. The unchanged homepage has both a hidden live status and the shared loader’s live output; check for duplicate announcements in screen-reader review. No accessibility certification or measured performance improvement is claimed.

When a concept is approved, adopt it in the shared production component along with the reviewed spacing, then remove the development comparison and unused variants. Nothing has been pushed or published.
