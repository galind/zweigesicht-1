# Agent working agreement

Read `PROGRESS.md`, `IMPLEMENTATION_PLAN.md`, and `UNATTENDED_RUN.md` before making changes.

## Git history

- Commit each coherent, verified milestone with a short descriptive message.
- Inspect `git status` and the staged diff before every commit.
- Stage only files owned by the current task. Never overwrite, discard, amend, rebase, or fold in another agent's unrelated work.
- Keep generated caches, virtual environments, dependency directories, secrets, and original CAD downloads out of Git.
- Update `PROGRESS.md` whenever a commit changes the project's verified state or next action.
- Do not force-push. Push completed checkpoints to the configured SSH remote when the active task authorizes it.

## Project safeguards

- Preserve source URLs and hashes in `assets/source-manifest/`.
- Keep generated assets separate from hand-authored overrides.
- Do not claim mechanical correctness without recorded evidence and review.
- Do not publish the site or redistribute source/derived CAD until the corresponding release gates are cleared.
