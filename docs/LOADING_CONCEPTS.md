# gg loading studies: stronger choreography

2 October 2026. The previous options were too subdued. This pass gives the original gg three more visible gestures, each with a resting interval. These remain development-only proposals; the production loader is unchanged.

## Compare locally

Run `npm --prefix explorer run dev` and open [the comparison](http://127.0.0.1:4173/__loading). All three options appear side by side on desktop. Switch between Homepage and Workshop, preview reduced motion, toggle transfer detail/error, or open a full view. System reduced motion always takes precedence.

Direct view: `/__loading?concept=exchange&surface=workshop`. Concepts: `exchange`, `turn`, `lock`. Optional parameters: `text=200`, `motion=reduce`, `state=error`, `detail=none`. Omit `concept` for the gallery.

The preview uses the existing header, status and retry components and both route shells, without CAD, navigation or docks. Homepage retains “Loading the movement” and “Movement file · 37%”; Workshop retains “Preparing the movement”. The percentage is a fixed specimen and never drives motion. Preview retry returns to loading; application asset retries remain unchanged.

## Options

| Concept | Rationale and loop | Strength | Tradeoff | Reduced motion |
| --- | --- | --- | --- | --- |
| **Exchange** | Letters trade positions along opposing arcs, pause, and trade again. 22px horizontal travel and 14px lift; 3.6 seconds. | A distinctive moving monogram with a visible ivory/champagne exchange. | The overlapping midpoint is dense and conspicuous. | Static gg in its original order. |
| **Turn** | Each letter makes a staggered 360° turn around its vertical axis, then both rest. 3.8 seconds. | The strongest depth gesture without moving the whole mark. | Letters become edge-on and briefly mirrored, interrupting legibility. | Both letters face forward. |
| **Lock** | Letters separate by 12px each and counter-rotate 18°, then close and straighten in two stages. They rest interlocked for half of the 3.2-second cycle. | Decisive assembly rhythm with a long readable rest. | Draws attention; its mechanical metaphor fits Workshop more directly than the homepage. | Completed, upright interlocked gg. |

**Start the review with Exchange.** It gives the two-letter identity a recognisable action, stays typographic and works in both contexts. Turn is the more theatrical direction; Lock makes the assembly reference most explicit. All remain unapproved.

## Screenshots and complete-loop captures

Local evidence is ignored by Git in `artifacts/browser/loading-gg-bold/`. GIFs capture one complete CSS loop at 10 fps; judge smoothness in the live preview. GIFs do not respect reduced-motion settings; the live preview does.

| Concept | Homepage | Workshop | One loop |
| --- | --- | --- | --- |
| Exchange | [Desktop](../artifacts/browser/loading-gg-bold/exchange-home-desktop.png) · [390px](../artifacts/browser/loading-gg-bold/exchange-home-mobile.png) | [Desktop](../artifacts/browser/loading-gg-bold/exchange-workshop-desktop.png) · [390px](../artifacts/browser/loading-gg-bold/exchange-workshop-mobile.png) | [Animation](../artifacts/browser/loading-gg-bold/exchange.gif) |
| Turn | [Desktop](../artifacts/browser/loading-gg-bold/turn-home-desktop.png) · [390px](../artifacts/browser/loading-gg-bold/turn-home-mobile.png) | [Desktop](../artifacts/browser/loading-gg-bold/turn-workshop-desktop.png) · [390px](../artifacts/browser/loading-gg-bold/turn-workshop-mobile.png) | [Animation](../artifacts/browser/loading-gg-bold/turn.gif) |
| Lock | [Desktop](../artifacts/browser/loading-gg-bold/lock-home-desktop.png) · [390px](../artifacts/browser/loading-gg-bold/lock-home-mobile.png) | [Desktop](../artifacts/browser/loading-gg-bold/lock-workshop-desktop.png) · [390px](../artifacts/browser/loading-gg-bold/lock-workshop-mobile.png) | [Animation](../artifacts/browser/loading-gg-bold/lock.gif) |

[Desktop comparison](../artifacts/browser/loading-gg-bold/comparison-desktop.png) · [Mobile comparison](../artifacts/browser/loading-gg-bold/comparison-mobile.png). Captures also cover 320px, short landscape and 200% text, including landscape combined with 200% text.

## Verification and boundaries

- Typecheck, lint and production build pass. Existing large-chunk and vinext route-classification notices remain.
- All **158 study checks** pass again with the new gg options: both surfaces, desktop/390px/320px/short landscape/200% text, reduced motion, polite status semantics, keyboard retry, transfer-detail reservation and animation-phase layout stability. No uncaught browser errors.
- All three concepts and styles remain under `explorer/dev/loading-concepts/`, served by a Vite-only `/__loading` entry. The new animation selectors and page content are absent from the production build. The first pass already verified production 404s and actual loader/retry behavior on both routes; the current pass changes only the development studies, their checks and documentation.
- The shared production loader, globals and application integrations are unchanged in this pass. The previous pass's optional decorative slot keeps status and recovery in one component. No new dependencies, JavaScript animation loops, images, filters or glow.
- Each gg uses a fixed 120×80px envelope. Transforms and opacity cannot shift the label. Homepage reserves the transfer-detail row. The preview retains the header-aware short-landscape placement from the first pass.

Reproduce with the README’s existing Playwright/Chrome setup:

```sh
node scripts/review/loading-concepts-check.mjs http://127.0.0.1:4173
```

Remaining review: approval of a direction, Safari/WebKit, physical devices, screen-reader announcement quality and sustained GPU/battery behavior. The unchanged homepage has both a hidden live status and the shared loader’s live output; check for duplicate announcements in screen-reader review. No accessibility certification or measured performance improvement is claimed.

When a concept is approved, adopt it in the shared production component along with the reviewed spacing, then remove the development comparison and unused variants. Nothing has been pushed or published.
