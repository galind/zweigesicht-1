import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const ci = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const target = "a".repeat(40);
const base = "b".repeat(40);

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

test("production branch policy rejects feature branches and forks named develop", () => {
  const shell = ci
    .split("        run: |\n")[1]
    .split("  verify:")[0]
    .replace(/^          /gm, "");
  for (const [branch, head, repo, expected] of [
    ["main", "develop", "galind/zweigesicht-1", 0],
    ["main", "develop", "outsider/zweigesicht-1", 1],
    ["main", "feature/change", "galind/zweigesicht-1", 1],
    ["develop", "feature/change", "outsider/zweigesicht-1", 0],
  ]) {
    assert.equal(
      spawnSync("bash", ["-c", shell], {
        env: {
          ...process.env,
          BASE_BRANCH: branch,
          HEAD_BRANCH: head,
          HEAD_REPOSITORY: repo,
          BASE_REPOSITORY: "galind/zweigesicht-1",
        },
      }).status,
      expected,
    );
  }
});

test("workflows cannot write to the repository or run privileged fork events", () => {
  for (const content of [workflow, ci]) {
    assert.match(content, /permissions:\n  contents: read/);
    assert.doesNotMatch(
      content,
      /:\s*write\b|write-all|pull_request_target|workflow_run|secrets\.|updateRef|self-hosted/,
    );
    for (const [, action] of content.matchAll(/uses:\s*(\S+)/g))
      assert.match(action, /^[\w-]+\/[\w-]+@[0-9a-f]{40}$/);
    assert.match(content, /persist-credentials: false/);
  }
  assert.match(
    ci,
    /if: github.event_name == 'pull_request' && github.base_ref == 'main'\n        run: npm --prefix explorer run build:vercel/,
  );
});
