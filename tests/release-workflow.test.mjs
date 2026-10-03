import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const script = workflow.split("          script: |\n")[1].replace(/^            /gm, "");
const promote = new (Object.getPrototypeOf(async function () {}).constructor)(
  "context",
  "github",
  "core",
  script,
);
const target = "a".repeat(40);
const base = "b".repeat(40);

function fixture(options = {}) {
  const refs = { develop: target, main: base };
  const reads = { develop: 0, main: 0 };
  const updates = [];
  const context = {
    repo: { owner: "example", repo: "repo" },
    ref: "refs/heads/develop",
    sha: target,
    payload: { inputs: { commit: target, confirmation: "release" } },
    ...options.context,
  };
  const github = {
    rest: {
      git: {
        async getRef({ ref }) {
          const branch = ref.slice(6);
          reads[branch]++;
          if (options.change?.branch === branch && reads[branch] === options.change.read)
            refs[branch] = "c".repeat(40);
          return { data: { object: { sha: refs[branch] } } };
        },
        async updateRef(update) {
          if (options.rejectUpdate) throw new Error("Protected branch update rejected");
          updates.push(update);
          refs.main = update.sha;
        },
      },
      repos: {
        async compareCommits(args) {
          assert.equal(args.base, base);
          assert.equal(args.head, target);
          return { data: { status: options.status ?? "ahead" } };
        },
      },
    },
  };
  return { refs, updates, run: () => promote(context, github, { notice() {} }) };
}

test("release promotes the verified SHA without force and retains develop", async () => {
  const f = fixture();
  await f.run();
  assert.deepEqual(f.updates, [
    { owner: "example", repo: "repo", ref: "heads/main", sha: target, force: false },
  ]);
  assert.deepEqual(f.refs, { develop: target, main: target });
});

test("an already released commit does not mutate either branch", async () => {
  const f = fixture({ status: "identical" });
  await f.run();
  assert.equal(f.updates.length, 0);
});

for (const [label, context] of [
  ["wrong branch", { ref: "refs/heads/main" }],
  ["wrong workflow commit", { sha: base }],
  ["missing confirmation", { payload: { inputs: { commit: target } } }],
  ["invalid SHA", { payload: { inputs: { commit: "latest", confirmation: "release" } } }],
])
  test(`release refuses ${label}`, async () => {
    const f = fixture({ context });
    await assert.rejects(f.run(), /reviewed develop workflow commit/);
    assert.equal(f.updates.length, 0);
  });

for (const status of ["diverged", "behind"])
  test(`release refuses ${status} main history`, async () => {
    const f = fixture({ status });
    await assert.rejects(f.run(), /Reconcile and review/);
    assert.equal(f.updates.length, 0);
  });

for (const change of [
  { branch: "develop", read: 1 },
  { branch: "develop", read: 2 },
  { branch: "main", read: 2 },
])
  test(`release refuses ${change.branch} changing on read ${change.read}`, async () => {
    const f = fixture({ change });
    await assert.rejects(f.run(), /Review and rerun/);
    assert.equal(f.updates.length, 0);
  });

test("repository protection failure propagates without retry or bypass", async () => {
  const f = fixture({ rejectUpdate: true });
  await assert.rejects(f.run(), /Protected branch/);
  assert.equal(f.updates.length, 0);
});

test("dispatch preflight requires develop, its exact SHA and explicit confirmation", () => {
  const shell = workflow
    .split("        run: |\n")[1]
    .split("      - name:")[0]
    .replace(/^          /gm, "");
  const valid = {
    GITHUB_REF: "refs/heads/develop",
    GITHUB_SHA: target,
    REVIEWED_COMMIT: target,
    CONFIRMATION: "release",
  };
  for (const [override, expected] of [
    [{}, 0],
    [{ GITHUB_REF: "refs/heads/main" }, 1],
    [{ REVIEWED_COMMIT: base }, 1],
    [{ REVIEWED_COMMIT: "main" }, 1],
    [{ CONFIRMATION: "" }, 1],
  ])
    assert.equal(
      spawnSync("bash", ["-c", shell], { env: { ...process.env, ...valid, ...override } }).status,
      expected,
    );
});

test("write permission belongs only to promotion after verification", () => {
  const [before, promotion] = workflow.split("  promote:");
  assert.match(before, /permissions:\n  contents: read/);
  assert.doesNotMatch(before, /contents: write/);
  assert.match(before, /ref: \$\{\{ github.sha \}\}/);
  assert.match(before, /persist-credentials: false/);
  assert.match(promotion, /needs: verify/);
  assert.match(promotion, /contents: write/);
  assert.doesNotMatch(promotion, /actions\/checkout|run:|deleteRef/);
});
