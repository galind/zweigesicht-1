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

## One-click release

After staging review and the applicable [release gates](RELEASE_GATES.md), open
Actions → **Release to production**, select `main`, and click **Run workflow**.
No text input is required. The optional `commit` field pins an explicitly reviewed
`develop` SHA; otherwise the controller captures the current head when it starts.
Do not merge more work into either branch while a release is running.

The controller opens or reuses a `develop` → `main` PR, waits up to 20 minutes
for GitHub to report it clean/mergeable under the active rules, then merges with
an expected-head SHA and `merge` method. It does not enable auto-merge, approve
its own PR, push refs directly or bypass protection. A changed head/base, draft,
closed PR, conflict or rejected merge stops the run. CI verifies tests, inventory,
types, lint and both production builds on release PRs.

After promotion, Vercel's Git integration handles deployment. A second checked
`main` → `develop` PR synchronizes the merge commit back, preserving the ancestry
needed by the strict up-to-date rule for the next release. Both branches are
retained. If synchronization fails, the run explicitly reports that production
was already released; resolve the sync PR before trying another release. A
successful workflow establishes branch promotion, not deployment health: verify
Vercel's resulting production deployment separately.

## One-time release app setup

The app setup and initial adoption are required before the button is operational.
Use a private GitHub App installed only on `galind/zweigesicht-1`, with repository
**Contents: read/write**, **Pull requests: read/write**, and **Workflows: write**
(the latter lets releases include workflow changes). Metadata read access is
implicit. No administration, checks-write, webhooks or account permissions are
needed. Do not add the app to any ruleset bypass list.

Create a `release-automation` GitHub environment. Under deployment branches/tags,
select **Selected branches and tags**, add only the branch `main`, and no tags.
Keep reviewer approval unset for one-click operation. Set environment variable
`RELEASE_APP_ID` and environment secret `RELEASE_APP_PRIVATE_KEY` from the app.
Do not put the private key in a repository-wide secret, the source tree or logs.
The branch restriction is essential: it prevents PR/feature workflows from
obtaining the credential by naming this environment.

The release job checks out only the controller from its immutable `main` workflow
commit. It does not install dependencies or run build/PR code with the app key.
The pinned token action grants the requested permissions only for this repository,
creates a short-lived token and revokes it at job completion. The normal
`GITHUB_TOKEN` remains read-only. The app token lets PR CI and downstream Git
integrations receive normal events without a separate bot-workflow approval click.

Initially merge the hardening PR into `develop`, then review a bootstrap
`develop` → `main` PR with passing CI before merging it. That bootstrap merge
is a production promotion and requires release authorization. Sync `main` back
into `develop` through a PR afterwards. Do not run the old unpinned workflow or
add a bypass to bootstrap the new one. The workflow cannot be tested end-to-end
without intentionally updating production; automated tests use a mocked GitHub
API to exercise the success path, races, refusals and partial synchronization.

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

All workflow actions use full commit hashes. Review and update pins deliberately.
PR CI has no write token or secrets; only the main-only release job has an app token. CODEOWNERS requests review from
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
