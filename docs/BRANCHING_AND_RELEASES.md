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

Pushing or merging into `develop` never starts a production release. Review
staging, the exact commit set and applicable [release gates](RELEASE_GATES.md).
Optionally run `release.yml` (**Verify release candidate**) from `develop`, enter
its reviewed full SHA and confirm with `release`. This read-only workflow runs
both production builds and records the verified SHA; it cannot promote branches,
create GitHub Releases or deploy.

Open a PR from this repository's `develop` to `main`. CI rejects other source
branches/repositories and runs tests, inventory validation, TypeScript, lint,
the production build and the Vercel production build on the PR merge result.
Review the exact head SHA in staging again if `develop` changes. Merge only after
required checks and applicable release gates pass. Use a merge commit to retain
the shared branch history, and retain `develop` after merging.

Vercel's existing Git integration delivers production changes from `main`.
Verify the resulting deployment after an authorized release. Do not promote a
Preview artifact or bypass branch protection. The candidate workflow is advisory;
the required PR checks are the enforceable gate at merge time.

## GitHub protections

These are server-side settings; workflow files and CODEOWNERS alone do not
activate them. On 5 October 2026, the active
[Protect main and develop ruleset](https://github.com/galind/zweigesicht-1/rules/24522996)
was configured and verified with no bypass actors. Both branches require a PR,
resolved conversations, an up-to-date branch, and `Branch policy` and `Verify`
checks from GitHub Actions. Deletion and force pushes are blocked. Required
approvals are zero because the owner is the sole collaborator; code-owner
approval is not enforced. Automatic head-branch deletion is off.

Actions require full commit SHAs and allow only this owner’s actions and actions
created by GitHub. All external contributors require workflow approval. Default
token permissions are read-only, and Actions cannot create or approve PRs.
There are no repository deploy keys. Keep these settings when maintaining the repo:

- Create active rules for `main` and `develop`: restrict deletion, block force
  pushes, require a PR, require resolved conversations, and require `Branch policy`
  and `Verify` from the GitHub Actions app. Require the branch to be up to date.
- Require code-owner approval and dismiss stale approvals when another trusted
  reviewer is available. GitHub does not let an author approve their own PR;
  requiring one approval with only a single collaborator blocks self-authored
  changes. Do not silently add a bypass to compensate.
- Keep automatic branch deletion off to retain `develop` after release PRs.
- Actions → General: default to read repository contents/packages; disable
  Actions creating/approving PRs; require approval for all outside contributors.
- Review collaborators, pending invitations, installed apps and write-enabled
  deploy keys. Retain only explicitly trusted access. Public visibility grants
  reading/forking, not writing or release-management permission.

All workflow actions use full commit hashes. Review and update pins deliberately;
no workflow needs repository write permissions. CODEOWNERS requests review from
`@galind` for all files; server-side rules determine whether approval is required.

The generated Vercel branch URL for `develop` is the default staging URL. A
custom staging domain or separate staging environment variables can be assigned
to the `develop` Preview branch in Vercel Project Settings. That dashboard-only
configuration is optional; the branch deployment itself is automatic.

## Workshop entry

Workshop's homepage entry is code-controlled: visible in local development and
Vercel Preview (`VERCEL_ENV=preview`), hidden in production. No feature setting
is needed. Release via the reviewed `develop` → `main` PR; do not promote a
Preview artifact whose visible entry is already compiled in. Enabling the entry
later requires a code release. Direct `/workshop` access remains available.

## Hotfixes

Urgent fixes target `develop` first and use the same reviewed release PR flow.
Keep the required checks and branch protections in place during hotfixes.

## Reviews without deployment

A push or PR can trigger Vercel Preview deployment. For preparation work that
must stay local, disable Git deployment for its exact branch in `vercel.json`
before pushing. Current preparation branch exceptions are listed in that file.
See [Vercel's branch deployment setting](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled).
