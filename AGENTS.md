# Project working agreement

Use [PROGRESS.md](PROGRESS.md) for current status and [docs/README.md](docs/README.md) to find relevant technical evidence. Historical plans and review reports are context, not an execution backlog.

## Git

- Preserve unrelated work. Stage only task-owned files; inspect status and the staged diff before committing.
- Commit coherent, verified milestones with short descriptive messages. Update `PROGRESS.md` when the verified state or next action changes.
- Use `git` over the configured SSH remote. Push when authorized; never force-push.
- Use the connected GitHub app for PRs and API actions. Never use `gh`, including authentication or checks. If SSH or the app is unavailable, report that exact blocker.

## Project safeguards

- Keep secrets, dependencies, environments, caches and original CAD downloads out of Git.
- Preserve source URLs and hashes in `assets/source-manifest/`, and keep generated assets separate from hand-authored overrides.
- Support mechanical claims with recorded evidence and review.
- Publish the site or redistribute source/derived CAD only after the corresponding [release gates](docs/RELEASE_GATES.md) are cleared.
