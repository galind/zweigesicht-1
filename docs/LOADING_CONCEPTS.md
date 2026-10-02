# Technical movement-loading studies

2 October 2026. The current direction is a more engineering-oriented loading animation. Two studies retain gg as drawing geometry; the third explores a pure assembly schematic. All remain development-only proposals, with the production loader unchanged.

## Compare locally

Run `npm --prefix explorer run dev` and open [the comparison](http://127.0.0.1:4173/__loading). Switch Homepage/Workshop, preview reduced motion, toggle transfer detail/error, or open a full view. System reduced motion always takes precedence.

Direct view: `/__loading?concept=datum&surface=workshop`. Concepts: `datum`, `section`, `fit`. Optional parameters: `text=200`, `motion=reduce`, `state=error`, `detail=none`. Omit `concept` for the gallery.

The preview uses the existing header, status and retry components and both route shells, without CAD, navigation or docks. Homepage retains “Loading the movement” and “Movement file · 37%”; Workshop retains “Preparing the movement”. The percentage is a fixed specimen and never drives motion. Preview retry returns to loading; application asset retries remain unchanged.

## Options

| Concept | Rationale and loop | Strength | Tradeoff | Reduced motion |
| --- | --- | --- | --- | --- |
| **Datum** | Outlined gg registers against drawing axes. The champagne letter corrects an 8px horizontal offset, then a 6px vertical offset, and holds. 4.2 seconds. | Gives the familiar identity a clear geometric purpose. | Fine lines and outlines are lighter than solid typography. | Both letters registered, with datums visible. |
| **Section** | Three horizontal drawing sections of gg align around a fixed middle section; the upper and lower contours travel 8px horizontally and vertically. 4.8 seconds with an assembled rest. | Distinctive link between typography and an exploded CAD view. | Temporarily fragments the letters. | Complete aligned gg. |
| **Fit** | Two hatched collars slide 18px along a shaft toward its central shoulder, seat in sequence, hold, then withdraw. 4.4 seconds. | Most explicitly technical; a legible assembly action. | Drops gg and introduces a generic schematic rather than a verified part of the watch. | Both collars seated, centreline and hatching visible. |

**Recommendation for this direction: Datum** if gg should remain part of the identity. It makes the graphic itself behave like drawing geometry. **Fit** goes furthest toward a purely engineering-led loading experience. Section is the middle ground between a monogram and an exploded drawing.

The drawing conventions are illustrative. There are no fabricated measurements, live diagnostics, progress estimates or claims about the ml–01 mechanism.

## Screenshots and complete-loop captures

Local evidence is ignored by Git in `artifacts/browser/loading-technical/`. GIFs capture one complete CSS loop at 10 fps; use the live preview for native-refresh smoothness. GIF files do not respond to reduced motion; the preview does.

| Concept | Homepage | Workshop | One loop |
| --- | --- | --- | --- |
| Datum | [Desktop](../artifacts/browser/loading-technical/datum-home-desktop.png) · [390px](../artifacts/browser/loading-technical/datum-home-mobile.png) | [Desktop](../artifacts/browser/loading-technical/datum-workshop-desktop.png) · [390px](../artifacts/browser/loading-technical/datum-workshop-mobile.png) | [Animation](../artifacts/browser/loading-technical/datum.gif) |
| Section | [Desktop](../artifacts/browser/loading-technical/section-home-desktop.png) · [390px](../artifacts/browser/loading-technical/section-home-mobile.png) | [Desktop](../artifacts/browser/loading-technical/section-workshop-desktop.png) · [390px](../artifacts/browser/loading-technical/section-workshop-mobile.png) | [Animation](../artifacts/browser/loading-technical/section.gif) |
| Fit | [Desktop](../artifacts/browser/loading-technical/fit-home-desktop.png) · [390px](../artifacts/browser/loading-technical/fit-home-mobile.png) | [Desktop](../artifacts/browser/loading-technical/fit-workshop-desktop.png) · [390px](../artifacts/browser/loading-technical/fit-workshop-mobile.png) | [Animation](../artifacts/browser/loading-technical/fit.gif) |

[Desktop comparison](../artifacts/browser/loading-technical/comparison-desktop.png) · [Mobile comparison](../artifacts/browser/loading-technical/comparison-mobile.png). Additional captures cover 320px, short landscape, 200% text and landscape combined with 200% text.

## Verification and boundaries

- Typecheck, lint and production build pass. Existing large-chunk and vinext route-classification notices remain.
- All **158 study checks** pass again with the technical options: both surfaces, desktop/390px/320px/short landscape/200% text, reduced motion, polite status semantics, keyboard retry, transfer-detail reservation and animation-phase layout stability. No uncaught browser errors. The transfer-detail stability check now compares document coordinates so automatic scrolling to its gallery control does not falsely count as a layout shift.
- All three concepts and styles remain under `explorer/dev/loading-concepts/`, served by a Vite-only `/__loading` entry. The new animation selectors and page content are absent from the production build. The first pass already verified production 404s and actual loader/retry behavior on both routes; the current pass changes only the development studies, their checks and documentation.
- The shared production loader, globals and application integrations are unchanged in this pass. The previous pass's optional decorative slot keeps status and recovery in one component. No new dependencies, JavaScript animation loops, images, filters or glow.
- Each study uses a fixed 120×80px envelope. Transforms and opacity cannot shift the label. Homepage reserves the transfer-detail row. The preview retains the header-aware short-landscape placement from the first pass.

Reproduce with the README’s existing Playwright/Chrome setup:

```sh
PLAY_QA_OUTPUT=artifacts/browser/loading-technical node scripts/review/loading-concepts-check.mjs http://127.0.0.1:4173
```

Remaining review: approval of a direction, Safari/WebKit, physical devices, screen-reader announcement quality and sustained GPU/battery behavior. The unchanged homepage has both a hidden live status and the shared loader’s live output; check for duplicate announcements in screen-reader review. No accessibility certification or measured performance improvement is claimed.

When a concept is approved, adopt it in the shared production component along with the reviewed spacing, then remove the development comparison and unused variants. Nothing has been pushed or published.
