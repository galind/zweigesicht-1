# Current project status

Updated 3 October 2026. Setup is in the [README](README.md); implementation and
extended checks are in [architecture](docs/LOCAL_ARCHITECTURE.md).

## Current application

- Static CAD explorer at `/`: 426 source instances, six mechanism groups,
  inspection/isolation, separation and fitted case/dial/hand configurations.
- Workshop at `/workshop`: 89 Easy placements, or 249 Hard placements and 35
  workbench transfers. Both retain 16 foundation leaves and finish with 265.
  Free orbit, optional Show seat, dragging, Undo and local saves are available.
- The homepage Workshop entry and `?assemble=1` are compiled out of production
  and available in development/Vercel Preview. Direct Workshop access remains;
  `/play` redirects and Workshop retains noindex/nofollow and sitemap exclusion.
- Source geometry, authored decisions and social images remain unchanged.
  There is no favicon. Original contributions use MIT; upstream notices ship
  with both application build formats. CAD-derived assets are outside that grant.
- `develop` and `main` both pointed to `0037646` when this review began; PR #24
  is merged. The manual release workflow verifies the reviewed develop SHA,
  then fast-forwards main without deleting develop. See [release procedure](docs/BRANCHING_AND_RELEASES.md).

## Documentation review

[Draft PR #25](https://github.com/galind/zweigesicht-1/pull/25) targets `develop`.

- Shortened the README to purpose, setup, basic checks, deployment and licensing.
  Moved detailed browser/source verification instructions to the architecture
  guide. CAD measurements, caveats and provenance remain in their existing files.
- Removed stale draft-PR status, session narration and redundant verification
  detail. Updated the PR template and branching guide for workflow releases.
- Ignored local `docs/*_PROMPT.md` briefs without changing their contents.
  Historical prompts remain a publication decision; ignoring files does not
  remove committed history. This review branch has Git deployments disabled.

## Verification

- Prior implementation review: 82 automated tests, inventory/graph validation,
  TypeScript and lint passed. Clean tracked-checkout production/Preview app and
  Vercel builds passed; both locked npm projects had zero reported advisories.
- Prior local Chrome checks covered Easy/Hard completion, alternate orders,
  responsive controls, dragging, access, loading/recovery and explorer rendering.
  Production/Preview entry visibility, direct routes, redirects, social metadata,
  sitemap and tracked model/image delivery passed. Favicon delivery checks
  preceded its removal; the asset is now absent.
- The 14 release tests exercise the real script with mocked GitHub refs and shell
  preflight. This documentation review does not certify a live release/deployment.
- Follow-up checks pass: 82 tests, inventory validation, typecheck, lint,
  production and Vercel builds, 30 local Markdown links and changed-file formatting.
  Reviewed 525 historical Markdown blobs; additional workstation-path examples
  are recorded in the release gates. No current tracked-text path/credential
  signatures matched the checked patterns. Browser behavior was unchanged;
  browser/physical-device suites were not rerun for this documentation change.

## Before publication

Keep the repository private. [Release gates](docs/RELEASE_GATES.md) record the
specific affected assets, historical paths/commits and exposure-review coverage.

- Record maker permission for public redistribution of current/historical
  CAD-derived geometry, metadata and reconstruction images. Download availability
  does not establish that grant. A code-only distribution needs a separate asset
  delivery plan and history review; removing runtime models would break the app.
- Decide whether historical internal prompts/reports and personal author-email
  metadata may become public. Any history rewrite or remote-content removal needs
  coordinated authorization; no such change was made by this review.
- Verify server-side develop deletion/force-push protection and the deployed
  production result. The local release script alone does not enforce branch rules.
- Complete applicable physical-device, representative accessibility/usability and
  mechanical review. Clean-machine CAD reproduction remains unverified.
