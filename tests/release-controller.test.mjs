import assert from "node:assert/strict";
import test from "node:test";
import release from "../.github/scripts/release.cjs";

const base = "a".repeat(40);
const target = "b".repeat(40);
const released = "c".repeat(40);
const synced = "d".repeat(40);
function fixture(options = {}) {
  const refs = { main: base, develop: target };
  const prs = [];
  const merges = [];
  const messages = [];
  const sleeps = [];
  const context = {
    eventName: "workflow_dispatch",
    ref: "refs/heads/main",
    sha: base,
    repo: { owner: "galind", repo: "zweigesicht-1" },
    payload: { inputs: {} },
    ...options.context,
  };
  const summary = {
    addHeading() {
      return this;
    },
    addRaw(text) {
      messages.push(text);
      return this;
    },
    async write() {},
  };
  const core = {
    notice(text) {
      messages.push(text);
    },
    summary,
  };
  let polls = 0;
  const github = {
    rest: {
      git: {
        async getRef({ ref }) {
          return { data: { object: { sha: refs[ref.slice(6)] } } };
        },
      },
      repos: {
        async compareCommits() {
          return {
            data: {
              status: options.comparison ?? "ahead",
              files: options.files ?? [{ filename: "app.ts" }],
            },
          };
        },
      },
      pulls: {
        async list({ head, base: baseBranch }) {
          return {
            data:
              options.existing ??
              prs.filter((pr) => pr.head.ref === head.split(":")[1] && pr.base.ref === baseBranch),
          };
        },
        async create({ head, base: baseBranch }) {
          const pr = {
            number: prs.length + 1,
            state: "open",
            draft: false,
            head: { ref: head, sha: refs[head], repo: { full_name: "galind/zweigesicht-1" } },
            base: {
              ref: baseBranch,
              sha: refs[baseBranch],
              repo: { full_name: "galind/zweigesicht-1" },
            },
            mergeable: true,
            mergeable_state: "clean",
            ...options.pr,
          };
          prs.push(pr);
          return { data: pr };
        },
        async get({ pull_number }) {
          polls++;
          const pr = prs.find((pr) => pr.number === pull_number) ?? options.existing?.[0];
          return {
            data:
              options.pending && polls <= options.pending
                ? { ...pr, mergeable_state: "blocked" }
                : pr,
          };
        },
        async merge(args) {
          if (options.rejectMerge) throw new Error("Protected branch update rejected");
          const pr = prs.find((pr) => pr.number === args.pull_number) ?? options.existing?.[0];
          assert.equal(args.sha, pr.head.sha);
          assert.equal(args.merge_method, "merge");
          merges.push(args);
          const sha = pr.base.ref === "main" ? released : synced;
          refs[pr.base.ref] = sha;
          if (options.moveAfterRelease && pr.base.ref === "main") refs.develop = "e".repeat(40);
          return { data: options.refused ? { merged: false } : { merged: true, sha } };
        },
      },
    },
  };
  const sleep = async (ms) => {
    sleeps.push(ms);
    options.onSleep?.(refs);
  };
  return {
    refs,
    prs,
    merges,
    messages,
    sleeps,
    run: () => release({ github, context, core, sleep, attempts: 3 }),
  };
}

test("one dispatch waits for protected checks, merges exact release and syncs main back", async () => {
  const f = fixture({ pending: 1 });
  await f.run();
  assert.equal(f.prs.length, 2);
  assert.deepEqual(
    f.merges.map((x) => x.sha),
    [target, released],
  );
  assert.deepEqual(f.refs, { main: released, develop: synced });
  assert.deepEqual(f.sleeps, [15000]);
});
for (const context of [
  { eventName: "pull_request" },
  { ref: "refs/heads/develop" },
  { repo: { owner: "outsider", repo: "zweigesicht-1" } },
  { sha: target },
  { payload: { inputs: { commit: base } } },
])
  test(`rejects unauthorized or stale invocation ${JSON.stringify(context)}`, async () => {
    const f = fixture({ context });
    await assert.rejects(f.run());
    assert.equal(f.prs.length, 0);
  });
for (const comparison of ["behind", "diverged"])
  test(`refuses ${comparison} history`, async () => {
    const f = fixture({ comparison });
    await assert.rejects(f.run(), /Merge main back/);
    assert.equal(f.merges.length, 0);
  });
for (const options of [{ comparison: "identical" }, { files: [] }])
  test(`no release for ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    await f.run();
    assert.equal(f.prs.length, 0);
  });
for (const branch of ["main", "develop"])
  test(`stops when ${branch} changes while CI runs`, async () => {
    const f = fixture({
      pending: 2,
      onSleep(refs) {
        refs[branch] = "f".repeat(40);
      },
    });
    await assert.rejects(f.run(), /changed/);
    assert.equal(f.merges.length, 0);
  });
for (const pr of [
  { draft: true },
  { state: "closed" },
  { auto_merge: {} },
  { mergeable: false },
  { head: { sha: target, ref: "develop", repo: { full_name: "outsider/zweigesicht-1" } } },
  { base: { sha: base, ref: "other", repo: { full_name: "galind/zweigesicht-1" } } },
])
  test(`rejects changed or unsafe PR ${JSON.stringify(pr)}`, async () => {
    const f = fixture({ pr });
    await assert.rejects(f.run());
    assert.equal(f.merges.length, 0);
  });
test("blocked/failed CI times out without any merge or auto-merge", async () => {
  const f = fixture({ pending: 10 });
  await assert.rejects(f.run(), /did not become mergeable/);
  assert.equal(f.merges.length, 0);
  assert.equal(f.sleeps.length, 2);
});
test("GitHub protection or head SHA race rejection is not retried or bypassed", async () => {
  const f = fixture({ rejectMerge: true });
  await assert.rejects(f.run(), /Protected branch/);
  assert.equal(f.merges.length, 0);
});
test("false merge result stops release", async () => {
  const f = fixture({ refused: true });
  await assert.rejects(f.run(), /GitHub refused/);
  assert.equal(f.merges.length, 1);
});
test("reports partial success if develop advances after production was released", async () => {
  const f = fixture({ moveAfterRelease: true });
  await assert.rejects(f.run(), /Production was already released.*synchronization needs attention/);
  assert.equal(f.merges.length, 1);
  assert.equal(f.refs.main, released);
});
