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

## Public repository preparation — 3 October 2026

The standard MIT license covers Guillem Galindo's own contributions only.
Upstream UI/library notices are shipped at `/third-party-notices.txt`.
The [source rights review](../assets/source-manifest/sources.json) still records
no explicit public redistribution grant. Current maker CAD/catalog/download
pages offer downloads without establishing that grant; the imprint timed out.
Private deployment and merging code do not clear this gate.

The smallest resolution is written maker permission covering the retained
Git history when made public, current CAD-derived models/recoveries/metadata and reconstruction
images, and their modification and redistribution. Preserve that evidence with
source provenance. If permission is unavailable, separately authorize a code-only
repository whose required assets are supplied outside Git; simply deleting them
at HEAD would break the app and leave historical copies accessible.

Publication review must also decide whether to retain historical internal prompts
(`GOAL_PROMPT.md` at `ebc5807`, `WEBSITE_POLISH_PROMPT.md` at `64df95b`,
`WEBSITE_REDESIGN_PROMPT.md` at `36a2ca5`), generated reports under
`artifacts/preflight/` at `a6600b4` and `artifacts/dependency-audit.json` at
`ed04e13`, and personal commit-author email metadata (redacted: `g***@gmail.com`,
for example `ebc5807`). These prompts contain local workstation paths. They are
absent from current `develop` but remain in reachable history/local branches.
Historical CAD is present from `5b0af33`. The former scaffold favicon at
`00fb905:explorer/public/favicon.svg` has no recorded origin/license; the favicon
asset has been removed from the current tree. Historical images on local review branches include
`explorer/public/images/ml01-balance-assembly.webp` and
`zweigesicht-1-shock-indicator.webp` at `a88c0b2`.

If any historical material must be withheld, authorize a coordinated history
rewrite or a fresh reviewed repository before visibility changes: back up refs,
filter every affected path and author identity across retained refs, rescan the
result, then coordinate replacement refs and old-clone handling. GitHub PR
references, comments, logs and attachments need a separate removal/support review;
a rewritten branch alone cannot clear those surfaces. The preparation review
did not rewrite history, delete remote branches, rotate credentials or change
visibility. Its pattern scan found no credential requiring
rotation; that is not proof that every possible secret is absent.

## Exposure review coverage

The initial 3 October review scanned 264 reachable local commits and 1,693 blobs,
including local branches and checkpoint refs, for common credential patterns.
It read PRs #1–#23 and accessible discussion/review content, plus 16 job logs from
eight latest PR-head runs; no checked credential patterns matched. PR #24 was
reviewed in the documentation follow-up. These are dated checks, not a continuous
security guarantee.

Before changing visibility, review intervening commits and GitHub surfaces again.
Earlier checks exclude older/push/manual run logs, unavailable or deleted content,
external attachments, deployment logs, repository secrets/settings and provider
caches. Decide whether public author-email metadata and historical internal
material are acceptable, and obtain the asset rights evidence above. Deleting
current files does not remove historical or GitHub-hosted copies.

The follow-up examined 525 unique reachable Markdown blobs for workstation paths.
Additional examples, absent from the current tree, need the same history decision:

| Historical path                      | Example commit | Reachability at review          |
| ------------------------------------ | -------------- | ------------------------------- |
| `docs/WATCH_CONFIGURATION_GOAL.md`   | `8a6cdc0`      | `main` history                  |
| `docs/WEBSITE_POLISH_REVIEW.md`      | `1ec2f53`      | `main` history                  |
| `PREFLIGHT_REPORT.md`                | `ebc5807`      | `main` history                  |
| `UX_UI_POLISH_GOAL.md`               | `ff6b514`      | `main` history                  |
| Earlier `PROGRESS.md`                | `548620a`      | `main` history                  |
| `docs/running-movement/M2_REPORT.md` | `45fa9d3`      | Running-movement branch history |

The current tracked-text scan found no workstation-path or checked GitHub/AWS
credential/private-key signatures. It did not repeat every earlier binary/log
check. Two local prompt briefs remain untouched and are now ignored; that does
not remove their copies from local checkpoint history.
