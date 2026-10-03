# Current project status

Updated 3 October 2026. Static explorer at `/`, Workshop at `/workshop`, permanent
`/play` redirect. See [README](README.md) for setup/checks,
[architecture](docs/LOCAL_ARCHITECTURE.md) for implementation and
[CAD notes](docs/CAD_NOTES.md) for mechanical/source constraints.

## Verified product

- Explorer retains all 426 source instances, six functional groups, inspection,
  isolation, All parts, separation, fitted case/dials and independent hand shapes.
- Workshop retains 89 Easy fits, 249 Hard parts and 35 transfers; both start with
  16 foundation leaves and finish with 265. Free orbit, searchable inventory,
  Show seat, dragging, workbenches, Undo and local nonlinear saves remain.
- Shared responsive controls/loading mark, reduced motion and failure recovery
  remain. Explorer readiness requires two stable preparation frames.
- Two compiled code guards hide the homepage Workshop entry/chooser and
  `?assemble=1` in production, and show them in local development/Vercel Preview.
  No feature configuration override exists. Direct routes remain available;
  Workshop retains noindex/nofollow and sitemap exclusion.
- PR #21 social metadata and exact replacement JPEG are preserved, along with
  the legacy image URL. Source/runtime geometry, hashes and authored choices
  are unchanged by public-repository preparation.

## Public-repository preparation

- Standard MIT License: copyright 2026 Guillem Galindo, covering his original
  contributions. CAD/source-derived assets are excluded. Upstream UI, icon and
  library license notices ship in both builds at `/third-party-notices.txt`.
  Fonts use the system stack; no maker reference photographs/webfonts are bundled.
- Patched the one moderate npm advisory by changing only transitive `fast-uri`
  3.1.7 → 3.1.8 in the app lockfile. App and asset-tool npm audits report zero
  advisories. No framework migration or broad dependency upgrade.
- Replaced the unattributed scaffold favicon with an authored SVG gg monogram
  and recorded provenance. Historical icon rights remain a review item. Removed
  unused Select scroll-button exports (the internally used controls
  remain), consolidated obsolete verification/release history here, and corrected
  README's production browser commands. Existing meaningful tools remain; the
  CAD regression fixture now verifies the retained two-frame startup contract.
- PR CI has read-only permissions and drops checkout credentials. The `main`
  branch policy requires this repository's `develop`, rejecting a fork with that
  name. Manual release dispatch runs only from `develop`; untrusted PR code is
  never run with the release write token. Preparation-branch Git deployments
  are disabled in `vercel.json` to honor the instruction not to deploy.
- PR #23 is merged. Live SSH refs are `main` (`c7e8f23`) and
  `codex/running-movement` (`45fa9d3`); remote `develop` was deleted. The preparation
  branch starts at the last verified integration head `fe449ec`, which is PR #23's
  second parent and has the same tracked tree as current `main`. Restoring the
  missing PR base requires a delivery decision; no branch is silently recreated.
  Preparation changes are committed at `2cd8d06` and pushed over SSH on
  `codex/public-repository-preparation`. Draft PR creation is blocked by the
  absent `develop` base, not by SSH or the GitHub app; both connections work.

## Exposure review

- Scanned all 264 reachable local commits / 1,693 blobs (19 binary blobs), including
  local branches, stale remote refs and Codex checkpoints; current live remote
  heads reach 258 of those commits. No matches for the checked GitHub/AWS/service
  token, private-key, credential-URL or quoted secret-assignment patterns.
  This is a pattern scan, not proof that every possible secret is absent.
- Current tracked files exclude originals, local reference imagery, environments,
  caches and build/evidence output. Historical prompts and generated preflight
  reports remain reachable from `main`; personal author email metadata remains
  (redacted: `g***@gmail.com`). Historical runtime CAD and reconstruction images
  also require rights coverage. Paths/commits and remediation are in the existing
  [release gates](docs/RELEASE_GATES.md). The two untracked prompt files are untouched;
  copies in local Codex checkpoint refs are not remote publication refs.
- Read all 23 PR bodies and their accessible discussion/review timelines; no
  standalone issues were returned. Checked 16 job logs from eight latest
  PR-head CI runs; no checked credential patterns matched and no artifacts were
  listed. Vercel bot comments expose project/team IDs and Preview URLs, not
  identified credentials. Coverage excludes older run attempts, push/manual runs,
  unavailable/deleted content, external attachments/deployment logs, repository
  settings/secrets and provider caches. Recheck those surfaces before publication.

## Verification

- 68 automated tests, Workshop inventory/graph validation, 114 prepared CPU
  source/runtime checks and 1,119 sampled access checks pass.
- TypeScript, lint, app/docs/config formatting and diff whitespace checks pass.
  The legacy compact CAD runner has pre-existing whole-file formatter drift;
  its scoped fixture fix passes syntax and runtime checks without a broad rewrite.
- Fresh `npm ci`, tests, inventory, typecheck, lint, production application and
  Vercel builds pass in an exported staged tracked-only checkout, with no ignored
  CAD/reference inputs. An independent compiled Preview application/Vercel build
  also passes. npm audits for both locked JavaScript projects report zero advisories.
- Chrome: all 89 Easy / 284 Hard actions (538 / 1,708 checks), 92 focused responsive
  checks, 87 drag checks, 373 visible-seat access actions, 175 loading/recovery
  checks and the 15-check homepage suite (including 71 embedded UX checks) pass.
  Explorer suites pass 350 checks; real-frame capture and the 60-second desktop
  benchmark complete. These are local Chrome results, not device certification.
- Final tracked-only production and compiled Preview each pass 64 entry checks
  across desktop, 390 px, 320 px and landscape: initial HTML, hydration, alternate
  query behavior, direct Workshop routes and noindex metadata. Local development
  also passes 64 visible-entry checks. The SEO HTTP suite passes for both compiled
  builds, preserving `/play`, canonical/social tags, sitemap and the exact JPEG.
- 24 packaging/delivery checks pass for complete MIT/upstream notices, authored
  favicon, unchanged social image, exact tracked model inventories and reference
  exclusion across both application/Vercel build formats and local HTTP delivery.
  All 13 tracked model/image payload hashes match the integration baseline.
- Workflow branch policy passes four trusted/fork/target scenarios. No GitHub CI
  run for this feature can start until a PR base/delivery decision is resolved.

Prepared source/runtime and sampled access checks use ignored local source inputs;
an application build from tracked assets is a separate reproducibility claim.
Build notices still include large chunks, framework route classification and
Vercel transform timing warnings. No physical-device, Safari/WebKit, sustained
GPU/thermal, human accessibility or mechanical certification is claimed.

## Remaining blockers

- Public CAD/derived-model/metadata and reconstruction-image redistribution is
  unresolved after checking current maker download pages. Obtain written maker
  permission covering present assets and retained public history; private-site
  permission and download availability do not establish this right. If permission
  cannot be obtained, separately authorize a code-only distribution with external
  assets. Essential runtime assets have been preserved.
- Decide whether historical internal prompts/reports and personal author email
  metadata can become public. Any necessary history rewrite, old-ref removal or
  credential rotation needs separate authorization; none was performed.
- Decide how to restore or change the missing `develop` PR target without violating
  the no-deployment instruction. Repository visibility remains private. No merge,
  release, deployment or publication is part of this preparation.
- Applicable physical-device, representative accessibility/usability, deployment
  and mechanical claim gates remain. Clean-machine CAD reproduction is unverified.
