# Release gates

These gates distinguish repository publication, site deployment and mechanical
claims. Tracked runtime assets support the existing private deployment; a build
does not establish public redistribution rights or mechanical certification.

| Gate                              | Evidence needed                                                                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source and redistribution         | Recorded source attribution, URLs and hashes; permission for public distribution of the source/derived CAD and imagery included in a release.                                                                   |
| Source fidelity and variants      | Documented geometry exceptions, reviewed variant choices, and traceability from runtime components to source instances.                                                                                         |
| Mechanical claims                 | Expert review supporting any claimed mechanical behavior. The accepted product is static construction exploration; running animation would be new scope. Separation paths are not certified service procedures. |
| Human usability and accessibility | Representative visitor and accessibility review of exploration, component identification and return to the assembly.                                                                                            |
| Physical devices                  | Actual-device browser, touch, loading, sustained performance and thermal evidence. Desktop viewport emulation does not substitute for this.                                                                     |
| Deployment qualification          | Verified deployed asset paths, compression, caching, failure recovery, direct navigation and domain/metadata configuration.                                                                                     |
| Publication approval              | Explicit authorization to publish the site and distribute the included assets, after the applicable gates above are cleared.                                                                                    |

See [current status](../PROGRESS.md) for outstanding actions and [CAD notes](CAD_NOTES.md) for source constraints and existing evidence.

## Public repository readiness — 3 October 2026

**Blocked. Keep this repository private.** Preparation, merging into `develop`
and promoting `develop` to `main` do not authorize public visibility. Visibility
exposes other branches, retained history and GitHub-hosted surfaces too.

### Verified remote state

SSH fetch with pruning and `ls-remote --heads --tags` found exactly these branches
and no tags. The connected GitHub app confirms private visibility, default branch
`main`, and PRs #1–#25 closed; all merged except #16 and #19. PR #25 is merged.
Local `main` is stale and is not the production-head evidence.

| Remote branch            | Reviewed head                              |
| ------------------------ | ------------------------------------------ |
| `develop`                | `90b606efe5337491319251343b9caeb1f6c77042` |
| `main`                   | `0037646e94e74cec184bdf8ddb2bec0c56971ec1` |
| `codex/running-movement` | `45fa9d30d9761cd71a9260cf6078f3026454cc43` |

The preparation branch starts at that `develop` SHA. Its Vercel Git deployment
is disabled in `vercel.json`. Refresh these refs and review intervening work
before any eventual publication decision. The preparation push will add its own
branch; the inventory records the audit baseline, not a continuously refreshed ref set.

### Asset redistribution scope

The [version inventory](../assets/source-manifest/publication-inventory.json)
records current paths per remote branch and every reachable version of the
runtime models, images, derived separation metadata and source-linked authored
JSON, with Git blob IDs, SHA-256 hashes, example commits and containing refs.
The initial inventory has 44 paths / 101 distinct path-version entries. Current
`main` and `develop` each include 24 such paths; running-movement includes 36.
Historical source/mechanical audit JSON is included alongside runtime assets.
No original STEP downloads, generated/reference-image directories or other
CAD model paths were found in those remote trees or their history.

Current runtime scope includes all 12 tracked files under
`explorer/public/models/`: overview/catalog GLB and gzip pairs, diamond STL,
assembly/asset manifests, case-lug recovery, finish annotations and binary/gzip
surface buffers. Also review `assets/derived/complete-separation.json`, all ten
current `assets/authored/` JSON files (source IDs, placements, fitting, puzzles,
labels and authored decisions), and both `explorer/public/images/` reconstruction
renders. Historical scope adds superseded finish buffers/manifests and
`assets/authored/shock-replacement.json`. CAD payload history starts at `5b0af33`.
Historical audit metadata such as `docs/appearance/cad-finishing-audit.json`
and `artifacts/preflight/assembly-inventory.json` also needs withholding or rights
review; the inventory's runtime/authored scope is not an exhaustive copyright
classification of every report or source-linked code constant.

The [maker CAD page](https://www.marcolangwatches.com/en/cad-2/zweigesicht-1/),
[assembly download page](https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/)
and [downloads page](https://www.marcolangwatches.com/en/downloads-2/) were
rechecked. They offer files without an explicit public redistribution grant.
The movement catalog and actual linked imprint at
`https://www.marcolangwatches.com/en/impressum-2/` timed out. No adequate permission
is recorded in the tracked manifests or rights documentation. This is an evidence
gap, not a determination that the maker would refuse permission. Public downloads,
attribution and private-deployment permission do not establish that grant.

Review the [unsent permission request](ASSET_PERMISSION_REQUEST.md). Obtain written
scope covering current and retained historical geometry, metadata, recoveries,
modifications, rendered images and recipient redistribution/forks. Confirm rights
holder, restrictions, attribution and evidence-publication consent. Original CAD
redistribution should be addressed separately if proposed. Standard MIT for
Guillem Galindo's own code/documentation and upstream notices remain intact;
third-party/design rights are not relicensed by adding MIT.

### Code-only alternative

The smallest viable public distribution is a new approved code snapshot with a
user-supplied asset bundle outside Git. Exclude `explorer/public/models/`,
`explorer/public/images/`, `assets/derived/` and source-derived authored JSON.
Review source-linked code constants and all provenance/report metadata; retain
maker URLs/hashes and original, independently authored instructions/decisions
where approved. Authored JSON is mixed content, so it cannot automatically be
classified as cleared code. Keep public setup instructions separate from private
bundle delivery; external storage itself does not grant redistribution rights.

Before that version is usable, add a local import/preflight command that accepts
a user-provided bundle, validates the recorded schema/hashes and copies required
files into the expected ignored paths. Do not automatically download/rehost CAD.
Alternatively, users may obtain original CAD from the maker and regenerate assets
with the documented locked pipeline and reviewed authored inputs; an uncached
clean-machine rebuild is still unverified and is not the smallest setup route.

`npm ci --prefix explorer` can install dependencies without assets. The viewer
and Workshop cannot function without models/manifests. The current production
and Vercel builds fail in `prune-build-output.mjs` without required models; inventory
validation and manifest-dependent tests also require the bundle. Image delivery
and social-preview checks require separately approved images or a code-only
metadata replacement. CI must receive a rights-cleared bundle or run a clearly
limited code-only job; it must not publish the private bundle as logs/artifacts.
This branch preserves essential assets. Bundle import, asset removal and CI
changes for code-only distribution are proposed work, not implemented or cleared.

### Historical exposure findings

Remote history is the union of the three reviewed branch ancestries, independent
of whether a path exists at HEAD. Evidence below is redacted; temporary execution
paths are distinguished from personal workstation paths.

| Content                                      | Path and example commit                                                                                                                                     | Surface / proposed treatment                                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Internal prompts / workstation location      | `GOAL_PROMPT.md` at `ebc5807`; `WEBSITE_POLISH_PROMPT.md` at `64df95b`; `WEBSITE_REDESIGN_PROMPT.md` at `36a2ca5`; `UX_UI_POLISH_GOAL.md` at `ff6b514`      | Remote history; paths include `/Users/[redacted]/…`. Withhold legacy briefs.                                                                                                   |
| Watch brief                                  | `docs/WATCH_CONFIGURATION_GOAL.md` at `8a6cdc0`                                                                                                             | `main`/`develop` history; workstation path also returned in PR #4, #5, #20 and #23 patches.                                                                                    |
| Preflight / dependency reports               | `PREFLIGHT_REPORT.md` and `artifacts/preflight/` at `a6600b4`; `artifacts/dependency-audit.json` at `ed04e13`                                               | All remote ancestries; private retention then remove historical reports.                                                                                                       |
| Source-linked audit / old environment script | `docs/appearance/cad-finishing-audit.json` at `23889a5`; `scripts/preflight/setup_cad_env.sh` at `a6600b4`                                                  | All remote ancestries; workstation paths. Withhold obsolete audit, replace old script path with a portable variable. Script path also appears in PR #20/#23.                   |
| Temporary work paths                         | `docs/WEBSITE_POLISH_REVIEW.md` at `1ec2f53`; `PROGRESS.md` at `548620a`; `docs/MECHANICAL_REVIEW.md` and `docs/running-movement/M2_REPORT.md` at `45fa9d3` | Remote history; `/tmp/[redacted]/…`, not personal-home paths. Remove obsolete reports after evidence retention; sanitize historical status entries. M2 is on running-movement. |
| Personal author/committer metadata           | `ebc5807`, also `06e05005b3d77145627c258ace066e33298f4ed7`                                                                                                  | 237 of 267 remote-reachable commits match the personal-email domains checked; redacted identity `g***@gmail.com`. Decide retention or actual metadata rewrite.                 |
| Historical icon with missing provenance      | `00fb905:explorer/public/favicon.svg`                                                                                                                       | All remote ancestries; absent from HEAD, historical original remains uncleared. Remove historical path or establish its license.                                               |
| Upstream license email                       | `explorer/public/third-party-notices.txt`; also PR #24 patch                                                                                                | An upstream copyright holder's email, not the repository author's private metadata. Retain the required notice verbatim.                                                       |

Six commits are reachable only from local branches relative to remote heads/tags:
`5b27e623`, `b9eec23c`, `93b65f39`, `5befd67a`, `b5b164d0`, `a88c0b21`.
The first two are also available through the closed, unmerged GitHub PR #19:
its source-linked fidelity JSON, ledger and comparison reports are hosted content,
not private merely because the feature branch was deleted. Two local historical
renders, `explorer/public/images/ml01-balance-assembly.webp` and
`explorer/public/images/zweigesicht-1-shock-indicator.webp` at `a88c0b2`, are absent
from remote branch/tag ancestry; do not push their local review branch.

Local `refs/codex/turn-diffs/` checkpoints/captures are not advertised remote
branches/tags and should never be mirror-pushed. At this snapshot they added no
commits beyond remote ancestry; local briefs remain ignored and untouched.
Old local branches are not evidence that their names still exist on GitHub.
For a rewritten public repository, explicitly decide whether to retain the
experimental running-movement branch; its source-linked evidence and any mechanical
claims require their own review. A fresh develop snapshot does not include it.

### Exact retention/removal proposal — not executed

Recommended route: create a separate public repository from an approved snapshot,
keep this original private, and do not transfer its refs or GitHub surfaces.
Before any implementation, choose asset scope and approve this plan:

1. Retain a private, access-controlled backup of all refs, source provenance,
   source/mechanical evidence and GitHub review records. Keep correspondence,
   credentials and personal metadata out of the public snapshot. Preserve current
   standard MIT, required notices, maker URLs/hashes and reviewed CAD caveats.
2. Withhold every exact historical path in
   [publication-removal-paths.txt](publication-removal-paths.txt), plus
   `explorer/public/favicon.svg`. The list intentionally covers obsolete prompts,
   reports and preflight output, including running-movement reports. Retain their
   mechanical/source evidence privately and distill useful findings into reviewed
   public documentation before removal. Inspect renames/copies and rerun the
   complete-tree scan; a single filename filter is insufficient for copied text.
3. For a rewrite only, sanitize old `PROGRESS.md` versions and old
   `scripts/preflight/setup_cad_env.sh` workstation-path literals without losing
   useful technical history. Review commit messages and source-linked reports.
   If asset permission is absent, additionally filter the inventory's entire
   model/image/derived/authored path scope and any copied source-derived metadata;
   first implement and verify the external-asset setup described above.
4. If author-email privacy is chosen, replace the author's personal email in both
   author and committer fields with `64312665+galind@users.noreply.github.com`
   (already used in this history), preserving name/dates and other people's
   attribution. Scan coauthor trailers too. A `.mailmap` or future Git config
   does not erase original metadata. This preparation commit uses the existing
   noreply identity; historical metadata is unchanged.
5. Validate the resulting approved snapshot/ref set: no disallowed paths or
   copied content, no personal-email metadata if selected, exact provenance and
   notices, rights-approved asset hashes, clean installs, builds and appropriate
   runtime checks. Review the generated commit/ref map and full diff before
   authorizing any published-ref replacement or new repository creation.
6. For this repository becoming public, independently resolve GitHub-hosted
   surfaces: PR refs/diffs (including #19 and path-bearing #4/#5/#20/#23), comment
   edit history/attachments, Actions logs/artifacts/caches, releases, forks and
   cached commit views. Inspect all older/push/manual runs in GitHub Actions.
   Delete or edit only specifically approved objects; a path-removal rewrite does
   not remove these surfaces. Request GitHub Support review if sensitive cached
   data requires it; support does not promise removal of non-sensitive material.
7. Coordinate collaborators and old clones before an authorized rewrite; prevent
   reintroduction from local backup/checkpoint refs. Keep the original private in
   the fresh-repository route. Then obtain separate explicit visibility approval.

| Option                                                           | Preserves                                                                                                               | Loses / additional remediation                                                                                                                                                                             |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coordinated rewrite of this repository                           | Repository URL, much technical commit topology, approved history and GitHub issue context                               | Affected commit IDs change; signatures and historical PR diffs may break. Needs authorized ref replacement, clone coordination and independent GitHub surface cleanup.                                     |
| Fresh public repository, original retained private (recommended) | Approved current code, provenance, licenses and optional cleared assets; original private technical history/PR evidence | Public commit lineage, old PRs/comments/check results, stars/issues/settings and branch topology are not automatically transferred. Audit any manually migrated content and configure protections/CI anew. |

GitHub documents the [rewrite and hosted-reference limits](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
and [commit-email behavior](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address).
A fresh repository avoids exposing these old hosted surfaces only while the
original remains private; it does not erase them or resolve any actual credential.

### Review coverage and limits

This review scanned 267 remote-reachable commits / 1,680 unique blobs and the
union of 273 local commits / 1,727 blobs, plus commit messages/identity metadata.
All bytes were checked for common GitHub/AWS/Slack/OpenAI credential and private-key
signatures; seven gzip asset versions were decoded and checked. Complete trees
were inventoried to include renamed/shared blobs. Current reconstruction images
were visually inspected; this is not OCR or forensic image-metadata certification.
No checked credential signatures matched. Personal-email matches in notices were
reviewed as upstream attribution. No credential rotation is justified by a
confirmed finding in this scan; absence of matches is not proof of no secrets.

The connected app returned PR #1–#25 metadata, discussions/reviews and paginated
file patches. Discussions had no checked workstation/email/credential matches.
Twenty jobs from ten PR-head runs were reviewed; ten Verify logs contain ordinary
`/home/runner/…` paths, no personal workstation paths or checked credentials.
Artifact listings for these ten runs were empty. Run IDs:
`36274292555`, `36274411393`, `37039431034`, `37045597189`, `37074192373`,
`37076034310`, `37079706032`, `37080426665`, `37110819087`, `37144076004`.

**Incomplete hosted coverage remains a blocker for making this original public.**
The app's run query is PR-only/first-page; job/artifact queries are first-page and
latest-attempt. No tool here enumerates every older, push or manual run. The review
does not establish absence of older artifacts, binary PR-only payloads, attachment
pixels, deleted/inaccessible content, edited-comment history, deployment-provider
logs, repository secrets/settings, forks or provider caches. Check those separately
or keep the original private and publish only a verified new snapshot.

Preparation verification is recorded in [PROGRESS.md](../PROGRESS.md). Applicable
mechanical/device/accessibility/deployment gates above remain outstanding and are
not substituted by repository privacy review. Server-side develop protection
against deletion/force-push and production deployment qualification remain
unverified. No visibility change, release, deployment, history rewrite, remote
branch deletion, credential rotation or permission-request sending is authorized
by this preparation PR.
