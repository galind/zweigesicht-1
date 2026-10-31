import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('historical display diagnostics reject installed packets before reading or overwriting evidence', () => {
  for (const [script, revision] of [
    ['review-motion-works.mjs', 'a62c820'],
    ['review-reverse-mesh-transforms.mjs', '00973a9'],
  ]) {
    const result = spawnSync(process.execPath, ['scripts/movement/' + script], { encoding: 'utf8' });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp('Historical .* audit: use revision ' + revision));
    assert.doesNotMatch(result.stderr, /ENOENT/);
  }
});
