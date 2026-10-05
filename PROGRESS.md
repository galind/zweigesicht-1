# Current project status

Updated 5 October 2026. Setup is in the [README](README.md); extended checks are
in [architecture](docs/LOCAL_ARCHITECTURE.md). Repository visibility is public (changed by the owner).

## Public repository security — 5 October 2026

- Active [branch ruleset](https://github.com/galind/zweigesicht-1/rules/24522996)
  protects `main` and `develop`: PR required, resolved conversations, up-to-date
  branch and required `Verify` / `Branch policy` checks from GitHub Actions;
  deletion and force pushes blocked, no bypass actors.
- Zero collaborators and no deploy keys. Required approvals remain zero for the
  sole maintainer; automatic head-branch deletion is off. PR creation was already
  limited to collaborators and remains so.
- Actions require full commit SHAs, allow owner/GitHub-created actions, and require
  approval for every external contributor. Default token permissions remain
  read-only; workflow PR creation/approval remains disabled.
- [PR #27](https://github.com/galind/zweigesicht-1/pull/27) pins actions and adds a
  one-click **Release to production** workflow. It creates/reuses the release PR,
  waits for protected CI and merges only the captured head; then syncs main back
  through another checked PR. It aborts on branch changes and never bypasses rules.
- The release job runs only from `main`, using a private app token restricted to
  this repository and a `release-automation` environment restricted to main.
  PR CI remains read-only. App/environment credential provisioning is pending;
  no release app credentials have been created or added.
- Current validation: all 92 tests and lint pass. Prior inventory, typecheck and
  both production builds passed; app code and build configuration are unchanged.
  The one-click controller adds mocked GitHub tests for release/sync,
  branch races, forbidden invocations, blocked CI and failed/partial merges.
  Full integration validation requires the app setup and an authorized release.
- Next: complete app setup, merge PR #27 into develop, then perform a separately
  authorized bootstrap release PR to main and sync main back into develop.
  Old unpinned workflows remain blocked by the Actions policy until replaced.
  The preparation branch has Vercel Git deployment disabled; no production
  deployment or release was performed.

The publication preparation below is historical evidence from 3 October. Public
visibility does not resolve its outstanding asset/production release gates.

## Current application

- Static CAD explorer: 426 source instances, six mechanism groups, component
  inspection/isolation, separation and fitted case/dial/hand configurations.
- Workshop: 89 Easy placements, or 249 Hard placements and 35 transfers; 16
  foundation leaves remain and both finish with 265. Undo/local saves retained.
- Production hides the homepage Workshop entry and `?assemble=1`; direct
  `/workshop`, `/play` redirect, noindex and sitemap exclusion remain.
- Original contributions use standard MIT; required upstream notices ship with
  builds. Maker CAD/design and derived assets remain outside that grant.

## Publication preparation — historical

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

## Outstanding publication decisions from the prior audit

1. Obtain maker permission for current and historical derived assets, or approve
   code-only distribution with externally supplied assets and revised setup/CI.
2. Choose a fresh public repository with this original retained private
   (recommended), or authorize a coordinated history rewrite and separate hosted
   cleanup. Decide internal-report retention and author-email privacy.
3. Review and authorize the concrete remediation, then verify the approved result
   before separately authorizing public visibility. Making this original public
   also requires completing the older/push/manual Actions and hosted-content review.

Server-side branch protection is now verified above; production qualification remains unverified.
Applicable physical-device, accessibility/usability, mechanical and clean-machine
CAD reproduction gates remain outstanding. Merging preparation or releasing
`develop` to `main` does not authorize publication.
