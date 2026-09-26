# Branching, staging and releases

The repository uses one production branch, one long-lived integration branch
and short-lived feature branches.

| Branch | Role | Vercel target |
| --- | --- | --- |
| `main` | Production source of truth | Production deployment and public domains |
| `develop` | Integrated, release-candidate state | Persistent branch-specific Preview deployment used as staging |
| `feature/*`, `fix/*`, `codex/*` | Isolated work | Per-branch and pull-request Preview deployments |

## Feature flow

1. Start a feature branch from the latest `develop`.
2. Open the pull request against `develop`, not `main`.
3. Review the feature's own Vercel Preview and required CI checks.
4. Merge the approved pull request into `develop`.
5. Review the updated `develop` branch deployment as the shared staging build.

The CI workflow runs tests, inventory validation, TypeScript, lint and the
production build for pull requests and pushes involving `develop` or `main`.
It rejects direct feature pull requests to `main`; only `develop` may be
promoted there.

## Release flow

Pushing or merging into `develop` never proposes or starts a production release.
When a release is actually wanted, manually run the **Prepare production
release** workflow and enter `release` as its confirmation. If unreleased
commits exist and no release pull request is open, it creates a draft
`develop` → `main` pull request. The release PR is deliberately not auto-merged:
staging, sustained rendering performance, applicable release gates and the
exact commit set must be reviewed first.

GitHub repository settings must allow Actions to create pull requests before
the manual workflow can open one. If that setting is intentionally disabled,
open the same draft pull request manually when release work begins.

Merge the release PR with a merge commit so the commits tested on `develop`
remain identifiable in `main`. Vercel's Git integration treats non-production
branches as Preview deployments and deploys the configured production branch
(`main`) to production after the merge. No workflow stores a Vercel token or
performs a second, competing deployment.

The generated Vercel branch URL for `develop` is the default staging URL. A
custom staging domain or separate staging environment variables can be assigned
to the `develop` Preview branch in Vercel Project Settings. That dashboard-only
configuration is optional; the branch deployment itself is automatic.

## Hotfixes

Urgent fixes still target `develop` first and use the same release PR. If a
production-only emergency forces a direct `main` change, immediately merge that
change back into `develop` before accepting more feature work. This exception
should remain rare and explicit.
