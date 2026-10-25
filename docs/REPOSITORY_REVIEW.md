# Repository review

## Staging cleanup — 25 October 2026

Baseline: clean `develop` at `48ef8b3`, after PRs #31 and #33. The owner reports
staging release. This review covers tracked application code, Bench lifecycle and
profiling tools, dependencies/build checks, documentation and their consumers.
The cleanup branch targets `develop` and disables its own Vercel Git deployment.

### Findings and changes

| Area | Evidence and action |
| --- | --- |
| Graphics lifecycle | `load()` unconditionally restored its temporary render target after awaited shader compilation, even if route disposal had already finished. Skip that GL call after disposal, make disposal idempotent, clear readiness/frame state, and exercise navigation during held compilation in the lifecycle runner. |
| Asset loading | Eight positional settled results were repeatedly asserted to fulfilled types. Retain `allSettled` so failure cleanup owns every completed sibling, then unwrap into named, inferred asset types before building the scene. |
| Stale verification | The interaction runner searched for the removed cycling Detail button and required Auto=1 even on the supported logarithmic fallback. Use the current select and verify the appropriate starting ratio and reduction sequence. |
| Retired compatibility | Profilers still wrote nonexistent `slowFrames`, traversed the removed paired stations, and passed boolean quality flags. Update those callers and keep one `QualityMode` API. The wider profiling scenario is now named `approach`. Historical comparisons must use each revision's harness. |
| Unused artwork | Current Blender export has no consumer of the old Dresden print/wordmark PNGs. Remove their rasterizer, authored SVGs and direct `@resvg/resvg-wasm` dev dependency. A transitive resvg installation may remain because vinext uses it. |
| Redundant scripts | Remove `browser-check`, `collision-check` and `presentation-check` Bench aliases: they only imported `jetpack-check` or `atelier-check`. Document those actual suites. Offline source/fit probes remain supported. |
| Dependency patch | npm audit found fast-uri 3.1.8 via the webpack/Ajv peer tree. Update only that lockfile package to 3.1.9, within Ajv's existing range. The [upstream advisory](https://github.com/fastify/fast-uri/security/advisories/GHSA-w74x-v6f9-j3xg) identifies the patched version. No visitor-reachable exploit was demonstrated. |
| Documentation | Replace the 1,608-line progress log with current staging status, correct stale Workshop counts, trim superseded Bench variants, and remove four obsolete design briefs. Retain historical revision links below and the standalone mechanical/performance evidence. |
| Ongoing checks | Enable TypeScript's unused-local/parameter checks; the application already passes them. No framework or renderer upgrade accompanies this cleanup. |
| Shared material policy | Explorer, Workshop and Bench copied the fitted enamel setup. Centralize fitted/catalog optical transitions, preserve existing Color objects and shader hooks, and store fitted transmission consistently so finish restoration cannot fall back to raw catalog zero. |
| Partial Bench preparation | Detached-part clones entered the cleanup tree only after finish and pose setup. Track each clone immediately so either failure disposes all allocated materials while retaining shared catalog geometry. CPU fixtures exercise both failure points. |
| Asset integrity | Four loaders duplicated SHA-256 byte encoding. Share the encoder while preserving each loader's expected hash and rejection behavior. CPU fixtures check known digests and reject corrupt case, surface and diamond payloads before parsing. |
| Hosted Bench delivery | The owner's staging console confirms 404 for both holders and the environment. Those ignored assets were also pruned from Vercel output while the entry remained visible. Add an explicit build asset source with recorded-hash validation; omit the hosted entry when unconfigured. Vercel builds now run on integration PRs as well as release PRs. Storage/access setup and redeployment remain outstanding. |

Validation results and remaining actions are maintained in [PROGRESS.md](../PROGRESS.md).
Browser evidence stays in ignored `artifacts/staging-cleanup/`. This review does
not establish live deployment, physical-device performance, mechanical accuracy
or redistribution rights. Builds retain existing large-chunk/classification and
Nitro trace-include warnings. Deliberately aborted navigation fixtures emit
vinext premature-close diagnostics while browser assertions pass.
The deeper material/asset follow-up uses GitHub CI; the preceding browser evidence
does not constitute a visual rerun of that follow-up. Local testing/builds/browser
automation are avoided at the owner's request, now recorded in `AGENTS.md`.

## Ownership map

| Area | Maintenance boundary |
| --- | --- |
| Explorer | `app/page.tsx` → `src/experience/` → `MovementViewer`; shared controls/chooser use Base UI. Focus/layout and synchronous React refs couple UI to controllers. |
| Workshop | `app/workshop/page.tsx` → `Play.tsx` → graph/save state and `PlayViewer`. Preserve validated save migration and prerequisite replay. |
| Bench | `app/bench/page.tsx` → capability check → `Bench.tsx` → `BenchViewer`. `physics.ts` owns capsule/BVH queries, `flip.ts` owns turnover safety, `performance.ts` owns input sampling/quality. Scene resources and listeners belong to the route. |
| Assets | Authored JSON, generated separation offsets and hashed models/sidecars are distinct authorities. Source matrices, IDs, vertex order and hashes must stay aligned. Source manifests and offline probes are not dead frontend code. |
| Rendering | Controllers own immutable source matrices, presentation, camera, async generations and GPU lifetime. Shared graphics helpers cover renderer defaults and studio resources; Bench also owns image textures/shadows. |
| Build/release | Separate application and offline asset npm locks. vinext/Vite builds locally; Nitro packages Vercel; pruning validates build copies. Read-only PR CI and the main-only release controller retain separate responsibilities. |

Inspection modules are lazy `?inspect=1` entry points. Save-schema compatibility,
legacy dial aliases, CAD probes and retained source manifests have consumers
outside ordinary frontend imports and remain. Build outputs, dependencies and
original downloads stay ignored. The environment manifest's renderer-source hash
records `6dfdc04` (PR #31), not the current controller: it is retained as historical
provenance. Its seven other authored/generated file hashes still match locally;
this cleanup does not regenerate the environment.

## Historical evidence

Git preserves the full prior notes at the staging baseline:
[progress log](https://github.com/galind/zweigesicht-1/blob/48ef8b3/PROGRESS.md),
[Bench history](https://github.com/galind/zweigesicht-1/blob/48ef8b3/docs/BENCH_EXPERIENCE.md),
and [earlier repository audit](https://github.com/galind/zweigesicht-1/blob/48ef8b3/docs/REPOSITORY_REVIEW.md).
Use those dated records when interpreting old local screenshots and reports;
their pending approvals, ports and next actions are not current instructions.

| Milestone | Retained evidence / supersession |
| --- | --- |
| Publication audit, 3–5 October | [Release gates](RELEASE_GATES.md), publication inventory and removal-path list retain history exposure findings, permissions and remediation requirements. Old branch-rule/app-setup claims are dated snapshots, not a live settings audit. |
| Repository cleanup, 23 October; PR #30 | Fixed production Workshop entry, removed unused Hints/cutaway/animation arguments and overridden CSS, patched tooling dependencies, removed `/play`. Prior audit records 93 CPU tests, both builds, CAD fidelity/access checks and browser journeys. |
| Desk concepts, 24 October | [Desk review](https://github.com/galind/zweigesicht-1/blob/48ef8b3/docs/DESK_DESIGN_REVIEW.md), [stairs sketch](https://github.com/galind/zweigesicht-1/blob/48ef8b3/docs/DESK_STAIRS_SKETCH.md), [Stage 1](https://github.com/galind/zweigesicht-1/blob/48ef8b3/docs/WORKSHOP_DESIGN_STAGE1.md) and [D revision 3](https://github.com/galind/zweigesicht-1/blob/48ef8b3/docs/WORKSHOP_DESIGN_D.md) are superseded by the compact open-background desk. Their rooms, stairs, decorations, containers and paired stations are not active requirements. |
| Holder and wheel reviews, 24 October | Holder seating/cross-fit source manifests and the [wheel](WHEEL_CONTACT_REVIEW.md), [ratchet](RATCHET_CONTACT_REVIEW.md), [remaining pairs](REMAINING_WHEEL_CONTACT_REVIEW.md) reviews remain authoritative evidence for the documented static placement exceptions. |
| Desk/stand finishes, 25 October | Current dimensions and collision/finish contracts are in [Bench experience](BENCH_EXPERIENCE.md). Local evidence includes `artifacts/workshop-seating/`, `workshop-compact-stand/`, `workshop-centered/` and `workshop-wood-finish/`. Earlier protected/direct-mat arrangements are superseded. |
| Sustained performance, PR #31 | [Bench performance](BENCH_PERFORMANCE.md) retains Firefox/Chrome workload measurements, causes, Auto policy and limitations. It supersedes short stationary timing claims. |
| Entry/menu, PR #33 | Direct `/bench` introduction, explicit capture, desktop capability gating and simplified centered menus replace the homepage popup. Historical verification: 149 CPU tests, 159 UI checks, 22 entry/device journeys and eight lifecycle checks; local evidence includes `artifacts/bench-route-introduction/` and `bench-menu-simplified/`. |

To inspect or reproduce a removed historical script/design, use its matching Git
revision and dependency lock rather than restoring it into the current application.
The original CAD, source provenance and mechanical evidence are not removed.

## Deferred decisions

- Split large controller/loading/camera boundaries when a feature touches them,
  with behavioral coverage; file size alone does not justify a rewrite.
- Agree a loading budget and browser-CI provisioning before changing chunking
  or startup policy. Large-chunk/build classification warnings remain.
- Decide Workshop homepage promotion, supported CAD platforms and mechanical/
  appearance scope with representative device and expert evidence.
- Resolve maker permission versus external-asset/code-only distribution and
  outstanding hosted/publication gates before further publication.
