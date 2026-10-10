# Current project status

Updated 10 October 2026. Setup is in the [README](README.md); extended checks are
in [architecture](docs/LOCAL_ARCHITECTURE.md). Repository visibility remains private.

## Current application

- Static CAD explorer: 426 source instances, six mechanism groups, component
  inspection/isolation, separation and fitted case/dial/hand configurations.
- Workshop: 89 Easy placements, or 249 Hard placements and 35 transfers; 16
  foundation leaves remain and both finish with 265. Undo/local saves retained.
- Workshop entry and `?assemble=1` are enabled in source for all builds. Direct
  `/workshop`, `/play` redirect, noindex and sitemap exclusion remain. The Atelier
  redesign below is local and has not been deployed.
- Original contributions use standard MIT; required upstream notices ship with
  builds. Maker CAD/design and derived assets remain outside that grant.

## Workshop Atelier — 9 October 2026

Branch `codex/workshop-atelier` starts from local `develop` at `6a092c0`
(PR #26's merge). The [in-depth review](docs/WORKSHOP_REVIEW.md) records the
baseline findings, five options, selected direction and human-validation plan.

- Eight chapter summaries, context, readiness and persistent completion feedback;
  desktop reading companion and compact phone chapter strip.
- Optional next-fit guide follows real dependencies, keeps bench work together,
  prioritizes transfers and opens the appropriate workspace/fitting view.
- Named click/keyboard placement, missing-prerequisite names, keyboard focus
  recovery, preserved free selection, Undo and existing compatible saves.
- Reversible finished-movement preview and completed-build viewing mode. Return
  restores camera, bench and selection without changing saved progress.
- Redundant old-view seat checks are deferred for guidance; animated camera travel
  hides the destination and checks source-surface access at the final viewpoint.
- Source geometry, authored dependency/membership manifests and licensing unchanged.

Verified: 86 automated tests; recommendations traverse both modes from each of
8 preferred chapters; inventory validation; typecheck/lint; production build and
production HTTP/SEO checks. In-app browser completed all 89 Easy fits and all 284
Hard actions (249 placements + 35 transfers), using public controls. Also checked
transfer Undo, preview return from an active bench, both final faces, mode-switch
confirmation, saved progress after reload, independent selection with assistance,
keyboard focus after placement, direct mouse dragging, 320 × 568 and 390 × 844 layouts, 200% text,
landscape preview, and the explicit no-3D failure route followed by recovery.
Browser evidence is local/ignored in `artifacts/browser/atelier/`. No session
seeding or skipped placements were used in the full builds. Guidance changes
were verified functionally; no timing benchmark or physical-device claim is made.

A broken ignored `explorer/public/reference/polish-review` symlink prevented the
first production build. Preserved it in `artifacts/local-reference-backup/`;
tracked assets and original reference files were untouched.

The user authorized an SSH branch push on 10 October, with no PR. The branch
is based on the refreshed `origin/develop` at `6a092c0`; automatic Vercel Git
deployment is disabled for this exact branch before pushing.

Next: review the implementation with representative visitors and actual touch
devices. No PR, deployment, redistribution, permission-request sending or
visibility change is authorized by the branch push.
Existing physical-device, human-accessibility and publication gates still apply.

## Prior publication preparation — 3 October 2026

The following records the earlier preparation snapshot; remote state was not
refreshed during the Workshop redesign.

`codex/publication-blockers` starts from refreshed `develop` at `90b606e`.
Remote `main` is `0037646`; `codex/running-movement` is `45fa9d3`; no remote tags.
PR #25 is merged. The preparation branch has Vercel Git deployment disabled.
[Draft PR #26](https://github.com/galind/zweigesicht-1/pull/26) targets `develop`;
the verified preparation milestone was committed and pushed over SSH.

- Recorded version hashes and branch reachability for runtime assets, source-linked
  decisions and audit metadata in the [publication inventory](assets/source-manifest/publication-inventory.json).
- Rechecked maker pages; no adequate public redistribution grant is recorded.
  Prepared an [unsent permission request](docs/ASSET_PERMISSION_REQUEST.md).
- [Release gates](docs/RELEASE_GATES.md) contain exact historical findings,
  proposed path removals, author-email treatment, hosted-surface coverage and a
  comparison of coordinated rewriting versus a fresh public snapshot.
- Essential assets, provenance and notices remain intact. No history rewrite,
  remote deletion, visibility change, release, deployment or permission-request sending occurred.
  Ignored local briefs and unrelated work remain untouched.

## Verification

Workspace cleanup: archived 1.47 GB of old local reviews, comparison downloads and
legacy briefs outside the checkout with per-file hashes. Removed 54 MB of generated
leftovers. Assets now occupy 145 MB; artifacts 175 MB. Tracked assets, provenance
and licenses are unchanged. Export removes completed checkpoints and avoids a
duplicate GLB write; optimization leaves gzip packaging to runtime preparation.
Cached CAD pipeline, Meshopt byte-identity verification, 114 retained-input runtime
checks, original-source hashes, 82 tests, inventory and production build passed.

Exposure review: 267 remote commits / 1,680 blobs; 273 local commits / 1,727 blobs;
seven decoded gzip versions; commit messages and email metadata; PR #1–#25
patches/discussions; 20 logs and empty artifact listings from 10 PR-head runs.
No checked credential signatures matched. Coverage gaps are explicit in the gates.

Preparation checks passed: 82 tests, inventory validation, typecheck/lint,
production build, 101 inventory path-version hashes, 22 local Markdown links,
JSON validity, preserved runtime/license/notice bytes and changed-file formatting.
Prior browser checks remain dated evidence; this documentation/configuration
change does not certify physical devices, mechanical behavior or live deployment.

## Decisions before public visibility

1. Obtain maker permission for current and historical derived assets, or approve
   code-only distribution with externally supplied assets and revised setup/CI.
2. Choose a fresh public repository with this original retained private
   (recommended), or authorize a coordinated history rewrite and separate hosted
   cleanup. Decide internal-report retention and author-email privacy.
3. Review and authorize the concrete remediation, then verify the approved result
   before separately authorizing public visibility. Making this original public
   also requires completing the older/push/manual Actions and hosted-content review.

Server-side develop protection and production qualification remain unverified.
Applicable physical-device, accessibility/usability, mechanical and clean-machine
CAD reproduction gates remain outstanding. Merging preparation or releasing
`develop` to `main` does not authorize publication.
