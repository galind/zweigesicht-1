# Movement loading studies

2 October 2026. Started from the latest `codex/workshop-homepage-parity` (`d18c373`, PR #18). These are proposals for review, not an approved replacement. No push, PR creation or publication is part of this work.

## Compare locally

Run `npm --prefix explorer run dev`, then open [the comparison](http://127.0.0.1:4173/__loading). Switch between Homepage and Workshop, preview reduced motion, toggle transfer detail or error, and use **Open full view** for viewport review. The system reduced-motion preference always takes precedence.

Direct view: `/__loading?concept=balance&surface=workshop`. Concept values: `balance`, `register`, `calibre`, `impulse`. Optional parameters: `text=200`, `motion=reduce`, `state=error`, `detail=none`. Omit `concept` for the comparison gallery. The Retry 3D button in this isolated fixture returns to its loading state; real asset retry is covered separately on the actual application routes.

The preview uses the existing `SiteHeader`, loading/error/retry component, status typography and route shell styles. It omits interactive navigation, docks and CAD. It is a loading-context study, not a duplicate of either application. Homepage uses its existing “Loading the movement” and “Movement file · 37%” copy; Workshop uses “Preparing the movement”. The percentage is a fixed specimen, never a motion input.

## Proposals

| Concept | Rationale and loop | Strengths | Tradeoffs | Reduced motion |
| --- | --- | --- | --- | --- |
| **Balance** | A fine wheel, spokes and fixed banking marks suggest regulation and engraved watchmaking drawings. ±18° oscillation, soft reversals, 4.8 seconds; no complete rotation. | Best connection to a mechanical watch; compact and legible; appropriate to both routes without adding a new typographic identity. | The circular outline may initially suggest a spinner. The slow oscillation is deliberately illustrative, not a claim about the ml–01 mechanism or frequency. | Upright, fully visible wheel with axle and banking marks. |
| **Register** | Three plates find a common centre. Outer plates move 7px in opposing directions, align, dwell, then part in a six-second loop. | Very quiet; directly echoes precision assembly and Workshop’s fitting activity. | More generic: can resemble layers or a database. Slightly less evocative on the homepage. | Three aligned plates and a central pin. |
| **Calibre** | An editorial “ml — 01” inscription. Two-pixel baseline changes and a restrained exchange of emphasis; a long aligned rest in a 6.4-second loop. | Most discreet; identifies the subject without a separate icon. | Adds a serif voice alongside the interface’s Arial and another identity line beneath the brand. Long rests are less obvious activity cues. | Complete, aligned inscription at full opacity. |
| **Impulse** | Two abstract levers exchange a small impulse around a fixed jewel. Sequential 7° movements and a long rest in a 5.6-second loop. | Distinctive open silhouette; no circling form; movement remains very local. | Can read as calipers; less immediately understandable. This is an abstract mechanical motif, not an escapement diagram. | Symmetric levers with the jewel visible. |

**Recommendation: Balance.** Its fine strokes and muted champagne accents fit the existing surfaces and technical subject. It works equally well while exploring the movement or preparing an assembly session. It needs neither another brand-like inscription nor a progress metaphor. Register is the alternative if the circular silhouette feels too familiar in review.

## Captures

Evidence is local and intentionally ignored by Git under `artifacts/browser/loading-concepts/`. GIFs are browser captures of one full CSS cycle, sampled at 10 fps; they are review evidence, not application assets. Use the live preview to judge the smoothness at native refresh rate. The GIF files themselves do not respond to reduced motion; use the live reduced-motion preview for that state.

| Concept | Homepage | Workshop | One loop |
| --- | --- | --- | --- |
| Balance | [Desktop](../artifacts/browser/loading-concepts/balance-home-desktop.png) · [390px](../artifacts/browser/loading-concepts/balance-home-mobile.png) | [Desktop](../artifacts/browser/loading-concepts/balance-workshop-desktop.png) · [390px](../artifacts/browser/loading-concepts/balance-workshop-mobile.png) | [Animation](../artifacts/browser/loading-concepts/balance.gif) |
| Register | [Desktop](../artifacts/browser/loading-concepts/register-home-desktop.png) · [390px](../artifacts/browser/loading-concepts/register-home-mobile.png) | [Desktop](../artifacts/browser/loading-concepts/register-workshop-desktop.png) · [390px](../artifacts/browser/loading-concepts/register-workshop-mobile.png) | [Animation](../artifacts/browser/loading-concepts/register.gif) |
| Calibre | [Desktop](../artifacts/browser/loading-concepts/calibre-home-desktop.png) · [390px](../artifacts/browser/loading-concepts/calibre-home-mobile.png) | [Desktop](../artifacts/browser/loading-concepts/calibre-workshop-desktop.png) · [390px](../artifacts/browser/loading-concepts/calibre-workshop-mobile.png) | [Animation](../artifacts/browser/loading-concepts/calibre.gif) |
| Impulse | [Desktop](../artifacts/browser/loading-concepts/impulse-home-desktop.png) · [390px](../artifacts/browser/loading-concepts/impulse-home-mobile.png) | [Desktop](../artifacts/browser/loading-concepts/impulse-workshop-desktop.png) · [390px](../artifacts/browser/loading-concepts/impulse-workshop-mobile.png) | [Animation](../artifacts/browser/loading-concepts/impulse.gif) |

Additional screenshots cover 320px, 568×320 landscape, and 200% text, including the combined landscape/200% case. [Desktop comparison](../artifacts/browser/loading-concepts/comparison-desktop.png), [homepage mobile contact sheet](../artifacts/browser/loading-concepts/home-mobile-contact-sheet.png), [Workshop mobile contact sheet](../artifacts/browser/loading-concepts/workshop-mobile-contact-sheet.png).

## Boundaries and verification

- A single optional decorative `mark` slot in `MovementLoadingMark.tsx` keeps status copy, `output`, polite announcements and retry in the shared component. Existing callers, their error handling, transfer updates and default `gg` markup are unchanged. No edits to the production loading integrations or `globals.css` were needed.
- All concepts and their CSS are under `explorer/dev/loading-concepts/`. Vite serves `/__loading` only in development, outside the application route graph. Production output contains none of the study animation selectors, keyframes or page content. The study URL and source URLs return 404 in the production preview.
- Every motif has a 120×80px envelope. Only transforms and opacity animate; there are no image requests, new dependencies, JavaScript animation loops, filters or glow. Transfer detail space is reserved in the homepage study so its arrival does not move the label. SVG sizing explicitly overrides Workshop’s general 16px icon rule.
- The study proposes a header-aware loading placement below 400px height. The existing Workshop `top: 34%` position was too high for the new motif in short landscape. This adjustment remains preview-only and needs to accompany any approved adoption. The actual production layout is unchanged.
- Typecheck, lint and production build pass. Existing notices remain: large client chunks and vinext’s route-classification notice.
- The new `scripts/review/loading-concepts-check.mjs` passes **210 checks** across four concepts, both surfaces, desktop/390px/320px/short landscape/200% text, static reduced motion, status semantics, keyboard retry, transfer-detail stability and animation-phase layout stability. No uncaught browser errors.
- The maintained Workshop focused suite passes **93 checks**, including responsive layout, the existing loader, asset failure/retry, storage recovery and interactions. The maintained homepage suite also passes all 15 top-level checks, including 71 embedded UX checks.
- Ten additional checks confirm real failure/retry on both routes and development isolation against the production preview; local evidence is `production-report.json` in the capture directory.

Reproduce the study checks with the README’s `PLAYWRIGHT_MODULE` and `CHROME_PATH` setup:

```sh
node scripts/review/loading-concepts-check.mjs http://127.0.0.1:4173
node scripts/play/browser-check.mjs http://127.0.0.1:4176 focused
node scripts/play/browser-check.mjs http://127.0.0.1:4176 home
```

## Remaining review

Approval is needed before choosing and adopting a replacement. The selected motif, its envelope/detail reservation and short-screen placement should then move into the existing shared loader; remove the development study and unused proposals together.

Browser evidence is desktop Chrome, including viewport and root-text emulation. Physical mobile devices, Safari/WebKit, screen-reader announcement quality and sustained GPU/battery performance remain unverified. The unchanged homepage currently has both its separate hidden live status and the shared loader’s live output; a screen-reader review should check for duplicate announcements. DOM semantics checks do not establish that experience. No accessibility certification or measured performance improvement is claimed.
