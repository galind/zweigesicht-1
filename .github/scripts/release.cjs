// Executed only by the protected-main release workflow; never by PR code.
module.exports = async function release({
  github,
  context,
  core,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  attempts = 80,
}) {
  const { owner, repo } = context.repo;
  if (
    context.eventName !== "workflow_dispatch" ||
    context.ref !== "refs/heads/main" ||
    `${owner}/${repo}` !== "galind/zweigesicht-1"
  ) {
    throw new Error("Release must be manually dispatched from galind/zweigesicht-1 main.");
  }
  const read = async (branch) =>
    (await github.rest.git.getRef({ owner, repo, ref: `heads/${branch}` })).data.object.sha;
  const main = await read("main");
  if (main !== context.sha) throw new Error("main changed after dispatch. Run a new release.");
  const target = await read("develop");
  const reviewed = context.payload.inputs?.commit?.trim();
  if (reviewed && reviewed !== target)
    throw new Error("develop no longer matches the reviewed SHA.");
  const comparison = (
    await github.rest.repos.compareCommits({ owner, repo, base: main, head: target })
  ).data;
  if (
    comparison.status === "identical" ||
    (comparison.status === "ahead" && comparison.files?.length === 0)
  ) {
    core.notice("No changes to release.");
    return;
  }
  if (comparison.status !== "ahead")
    throw new Error("Merge main back into develop through a checked PR before releasing.");

  async function mergeCheckedPR({ head, base, headSHA, baseSHA, title, body }) {
    const assertRefs = async () => {
      if ((await read(head)) !== headSHA || (await read(base)) !== baseSHA) {
        throw new Error(
          `${head} or ${base} changed. Nothing further will be merged; review and rerun.`,
        );
      }
    };
    await assertRefs();
    const existing = (
      await github.rest.pulls.list({
        owner,
        repo,
        state: "open",
        head: `${owner}:${head}`,
        base,
        per_page: 100,
      })
    ).data;
    if (existing.length > 1) throw new Error("Multiple matching PRs; resolve them manually.");
    const pr =
      existing[0] ??
      (await github.rest.pulls.create({ owner, repo, head, base, title, body })).data;
    core.notice(`Waiting for protected PR #${pr.number}: ${head} → ${base}`);
    for (let attempt = 0; attempt < attempts; attempt++) {
      await assertRefs();
      const current = (await github.rest.pulls.get({ owner, repo, pull_number: pr.number })).data;
      if (
        current.state !== "open" ||
        current.draft ||
        current.head.sha !== headSHA ||
        current.base.sha !== baseSHA ||
        current.head.ref !== head ||
        current.base.ref !== base ||
        current.head.repo?.full_name !== `${owner}/${repo}` ||
        current.base.repo?.full_name !== `${owner}/${repo}` ||
        current.auto_merge
      ) {
        throw new Error(
          `PR #${pr.number} changed, is draft/closed, or has auto-merge enabled. Review it manually.`,
        );
      }
      if (current.mergeable === false || current.mergeable_state === "dirty")
        throw new Error(`PR #${pr.number} has conflicts.`);
      if (current.mergeable === true && current.mergeable_state === "clean") {
        await assertRefs();
        // No bypass and no auto-merge: GitHub enforces the rules at this call.
        // The SHA parameter atomically rejects a changed PR head.
        const result = (
          await github.rest.pulls.merge({
            owner,
            repo,
            pull_number: pr.number,
            sha: headSHA,
            merge_method: "merge",
          })
        ).data;
        if (!result.merged || !result.sha)
          throw new Error(`GitHub refused PR #${pr.number}; protections remain in place.`);
        core.notice(`Merged PR #${pr.number}: ${result.sha}`);
        return result.sha;
      }
      if (attempt + 1 < attempts) await sleep(15000);
    }
    throw new Error(
      `PR #${pr.number} did not become mergeable in time. Check CI and review requirements. No auto-merge was enabled.`,
    );
  }

  const released = await mergeCheckedPR({
    head: "develop",
    base: "main",
    headSHA: target,
    baseSHA: main,
    title: `Release ${target.slice(0, 12)} to main`,
    body: `Manually requested release of develop commit ${target}.\n\nThe release workflow will merge only this exact head after GitHub's required checks pass. No branch protection bypass is used.`,
  });
  await core.summary
    .addHeading("Production branch updated")
    .addRaw(
      `Released ${target} via merge commit ${released}. Vercel deployment must be verified separately.\n`,
    )
    .write();
  try {
    await mergeCheckedPR({
      head: "main",
      base: "develop",
      headSHA: released,
      baseSHA: target,
      title: `Sync release ${released.slice(0, 12)} back to develop`,
      body: `Retain the production merge commit in develop so the next release satisfies strict up-to-date checks.\n\nThis sync is subject to the same required CI and branch protections.`,
    });
  } catch (error) {
    throw new Error(
      `Production was already released at ${released}, but develop synchronization needs attention: ${error.message}`,
    );
  }
};
