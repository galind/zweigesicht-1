import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BenchQuality,
  LookActivity,
} from '../explorer/src/bench/performance.ts';

test('stationary look coalesces events; sparse input samples frame cadence without redraw', () => {
  const activity = new LookActivity();
  activity.add(12, 3, 1);
  activity.add(-2, 4, 2);
  assert.deepEqual(activity.consume(16, false), {
    x: 10,
    y: 7,
    looked: true,
    active: true,
    elapsed: null,
  });
  assert.deepEqual(activity.consume(32, false), {
    x: 0,
    y: 0,
    looked: false,
    active: true,
    elapsed: 16,
  });
  activity.add(5, -1, 35);
  assert.deepEqual(activity.consume(48, false), {
    x: 5,
    y: -1,
    looked: true,
    active: true,
    elapsed: 16,
  });
  assert.equal(activity.consume(128, false).active, false);
});
test('idle intervals, zero input and pause never become slow-frame evidence or stale look', () => {
  const activity = new LookActivity();
  activity.add(5, 5, 1);
  activity.consume(16, false);
  activity.consume(100, false); // scheduling-only tail expires
  activity.add(0, 0, 3000);
  assert.equal(activity.pending, false);
  activity.add(3, 4, 5000);
  assert.equal(activity.consume(5010, false).elapsed, null);
  activity.add(4, 8, 5015);
  activity.clear();
  assert.equal(activity.consume(5020, false).active, false);
  assert.equal(activity.consume(5036, true).elapsed, null);
  assert.equal(activity.consume(5052, true).elapsed, 16);
});
function feed(q, ms, frames) {
  let changes = 0;
  for (let i = 0; i < frames; i++) changes += Number(q.sample(ms));
  return changes;
}
test('Auto starts at native CSS resolution, ignores isolated stalls and requires sustained slow windows', () => {
  const q = new BenchQuality(2);
  assert.equal(q.ratio, 1);
  feed(q, 16.67, 120);
  q.sample(200);
  feed(q, 16.67, 120);
  assert.equal(q.ratio, 1);
  q.resetSamples();
  assert.equal(feed(q, 30, 50), 0);
  assert.equal(feed(q, 30, 50), 1);
  assert.equal(q.ratio, 0.85);
  assert.equal(feed(q, 30, 100), 0); // cooldown
  feed(q, 30, 200);
  assert.equal(q.ratio, 0.7);
  assert.equal(feed(q, 30, 1000), 0); // floor
  assert.equal(feed(q, 16.67, 10000), 0); // no oscillating recovery probes
});
test('a healthy window or suspension clears slow history; manual choices cannot be overridden', () => {
  const q = new BenchQuality(2);
  feed(q, 30, 50);
  feed(q, 16.67, 90);
  feed(q, 30, 50);
  assert.equal(q.ratio, 1);
  q.resetSamples();
  feed(q, 30, 50);
  assert.equal(q.ratio, 1);
  q.select('High', 2);
  assert.equal(feed(q, 50, 1000), 0);
  assert.equal(q.ratio, 1.5);
  q.select('Low', 2);
  assert.equal(feed(q, 50, 1000), 0);
  assert.equal(q.ratio, 0.85);
  q.select('Auto', 2);
  assert.equal(q.ratio, 1);
  assert.equal(feed(q, 30, 100), 1);
});
test('low DPR never gets supersampled and invalid samples do not drive adaptation', () => {
  const q = new BenchQuality(0.6);
  for (const mode of ['Auto', 'Low', 'High'])
    assert.equal(q.select(mode, 0.6), 0.6);
  q.select('Auto', 0.6);
  assert.equal(feed(q, 30, 1000), 0);
  for (const n of [NaN, Infinity, -1, 0]) assert.equal(q.sample(n), false);
});

test('very slow continuous look frames remain performance evidence', () => {
  const activity = new LookActivity();
  activity.add(1, 0, 1);
  activity.consume(16, false);
  activity.add(1, 0, 200);
  assert.equal(activity.consume(216, false).elapsed, 200);
  activity.consume(300, false);
  activity.add(1, 0, 9999);
  assert.equal(activity.consume(10000, false).elapsed, null);
});

test('Auto responds to recurring missed frames even when most frames meet refresh', () => {
  const q = new BenchQuality(2);
  // A close CAD view repeatedly misses one in five refreshes. Median and p75
  // remain 16.7 ms, but p95 is 33.3 ms: the reported foreground failure.
  for (let i = 0; i < 180; i++) q.sample(i % 5 === 0 ? 33.3 : 16.7);
  assert.equal(q.ratio, 0.85);
});
test('infrequent scheduling outliers do not downgrade a healthy scene', () => {
  const q = new BenchQuality(2);
  for (let i = 0; i < 1000; i++) q.sample(i % 50 === 0 ? 55 : 16.7);
  assert.equal(q.ratio, 1);
});

test('Auto also catches the residual seven-percent CAD stutter after its first reduction', () => {
  const q = new BenchQuality(2);
  feed(q, 30, 100);
  assert.equal(q.ratio, 0.85);
  for (let i = 0; i < 600; i++) q.sample(i % 14 === 0 ? 33.3 : 16.7);
  assert.equal(q.ratio, 0.7);
});

test('fallback Auto starts with headroom and preserves explicit quality choices', () => {
  const q = new BenchQuality(2, 0.85);
  assert.equal(q.ratio, 0.85);
  assert.equal(q.select('High', 2), 1.5);
  assert.equal(q.select('Low', 2), 0.85);
  assert.equal(q.select('Auto', 2), 0.85);
  for (let i = 0; i < 200; i++) q.sample(i % 14 === 0 ? 33.3 : 16.7);
  assert.equal(q.ratio, 0.7);
  assert.equal(new BenchQuality(0.6, 0.85).ratio, 0.6);
});

test('fallback Auto can recover sustained GPU overload below the old .7 floor', () => {
  const q = new BenchQuality(2, 0.85, 0.5);
  feed(q, 30, 1200);
  assert.equal(q.ratio, 0.5);
  assert.equal(feed(q, 30, 1000), 0);
  assert.equal(q.select('High', 2), 1.5);
  assert.equal(feed(q, 30, 1000), 0);
});
