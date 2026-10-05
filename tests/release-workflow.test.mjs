import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const ci = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

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

test("PR CI stays read-only and release credentials are isolated to protected main", () => {
  for (const content of [workflow, ci]) {
    assert.match(content, /permissions:\n  contents: read/);
    assert.doesNotMatch(
      content,
      /write-all|pull_request_target|workflow_run|updateRef|self-hosted/,
    );
    for (const [, action] of content.matchAll(/uses:\s*(\S+)/g))
      assert.match(action, /^[\w-]+\/[\w-]+@[0-9a-f]{40}$/);
    assert.match(content, /persist-credentials: false/);
  }
  assert.doesNotMatch(ci, /:\s*write\b|secrets\./);
  assert.match(workflow, /environment: release-automation/);
  assert.match(workflow, /github.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/);
  assert.doesNotMatch(workflow, /npm ci|npm .*build|skip-token-revoke/);
  assert.match(
    ci,
    /if: github.event_name == 'pull_request' && github.base_ref == 'main'\n        run: npm --prefix explorer run build:vercel/,
  );
});
