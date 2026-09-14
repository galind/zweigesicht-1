import test from 'node:test';
import assert from 'node:assert/strict';
import { motionEase } from '../explorer/src/experience/motion.ts';

test('motion stays monotonic, bounded and exact at both endpoints', () => {
  for (const direct of [false, true]) {
    assert.equal(motionEase(-1, direct), 0);
    assert.equal(motionEase(2, direct), 1);
    let previous = 0;
    for (let i = 0; i <= 1000; i++) {
      const value = motionEase(i / 1000, direct);
      assert.ok(value >= previous && value <= 1);
      previous = value;
    }
  }
});

test('cinematic motion has gentle acceleration and braking; dragging responds immediately', () => {
  const h = 0.0001;
  const startSpeed = motionEase(h) / h;
  const endSpeed = (1 - motionEase(1 - h)) / h;
  const startAcceleration = (motionEase(2 * h) - 2 * motionEase(h)) / h ** 2;
  assert.ok(startSpeed < 0.001 && endSpeed < 0.001);
  assert.ok(Math.abs(startAcceleration) < 0.01);
  assert.ok(motionEase(h, true) / h > 2.9);
  assert.ok((1 - motionEase(1 - h, true)) / h < 0.001);
});
