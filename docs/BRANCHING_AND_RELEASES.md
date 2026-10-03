# Branching, staging and releases

The repository uses one production branch, one long-lived integration branch
and short-lived feature branches.

| Branch                          | Role                                | Vercel target                                                 |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `main`                          | Production source of truth          | Production deployment and public domains                      |
| `develop`                       | Integrated, release-candidate state | Persistent branch-specific Preview deployment used as staging |
| `feature/*`, `fix/*`, `codex/*` | Isolated work                       | Per-branch and pull-request Preview deployments               |

## Feature flow

1. Start a feature branch from the latest `develop`.
2. Open the pull request against `develop`, not `main`.
3. Review the feature's own Vercel Preview and required CI checks.
4. Merge the approved pull request into `develop`.
5. Review the updated `develop` branch deployment as the shared staging build.

The CI workflow runs tests, inventory validation, TypeScript, lint and the
production build for pull requests and pushes involving `develop` or `main`.
It rejects direct feature pull requests to `main`; only this repository’s
`develop` may be promoted there, including when a fork names its branch `develop`.
PR CI uses read-only permissions and does not persist checkout credentials.
Never run untrusted PR code with repository secrets or `pull_request_target`.

## Release flow

Pushing or merging into `develop` never starts a production release.
When a release is wanted, review staging, the exact commit set and applicable
[release gates](RELEASE_GATES.md). Manually run `release.yml` (**Release verified
develop**) from `develop`, enter that reviewed commit's full 40-character SHA and
confirm with `release`.

The workflow installs and verifies the pinned commit with read-only permissions:
tests, inventory, TypeScript, lint, production and Vercel production builds.
Only after that job succeeds does a separate job receive `contents: write`.
It checks both branch heads again and fast-forwards `main` to the exact verified
SHA without force. It refuses stale reviews, changed branches and divergent
`main` history. No PR or merge commit is created and `develop` is never deleted.
Feature PRs still target `develop`; this changes only production promotion.

Vercel's existing Git integration is responsible for production delivery from
`main`; no Vercel token or deploy command is added. Do not promote a Preview
artifact. GitHub's `GITHUB_TOKEN` updates do not trigger another push CI run,
so the release workflow performs its own production verification before updating
`main`. Verify the resulting Vercel production deployment after promotion.
Branch protection that requires a PR can reject this direct update; do not bypass protections or force-push to work around it.

## Retaining develop

Workflow promotion updates `main` without creating a release PR or deleting
`develop`. Protect the long-lived `develop` branch with an active rule that
blocks deletion and force pushes. This repository setting also guards against
other deletion paths; the workflow alone cannot enforce it. Its current setting
has not been verified by this review.

The generated Vercel branch URL for `develop` is the default staging URL. A
custom staging domain or separate staging environment variables can be assigned
to the `develop` Preview branch in Vercel Project Settings. That dashboard-only
configuration is optional; the branch deployment itself is automatic.

## Workshop entry

Workshop's homepage entry is code-controlled: visible in local development and
Vercel Preview (`VERCEL_ENV=preview`), hidden in production. No feature setting
is needed. Release via the normal `develop` → `main` build; do not promote a
Preview artifact whose visible entry is already compiled in. Enabling the entry
later requires a code release. Direct `/workshop` access remains available.

## Hotfixes

Urgent fixes still target `develop` first and use the same manual release workflow. If a
production-only emergency forces a direct `main` change, immediately merge that
change back into `develop` before accepting more feature work. This exception
should remain rare and explicit.

## Reviews without deployment

A push or PR can trigger Vercel Preview deployment. For preparation work that
must stay local, disable Git deployment for its exact branch in `vercel.json`
before pushing. Current preparation branch exceptions are listed in that file.
See [Vercel's branch deployment setting](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled).
