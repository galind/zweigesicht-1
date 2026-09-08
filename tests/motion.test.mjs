import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePose,PlaybackClock} from '../explorer/src/motion/evaluate.ts';
test('source-count chain gives central seconds and minutes rates',()=>{
 const p=evaluatePose(60);assert.ok(Math.abs(p.seconds+2*Math.PI)<1e-12);
 assert.ok(Math.abs(p.minute+2*Math.PI/60)<1e-12);
 for(const t of [0,.01,.13,.17,.33,1,12.7,54]){const q=evaluatePose(t);assert.ok(Math.abs(q.seconds*81+q.escape*9)<1e-12);assert.ok(Math.abs(q.third*75+q.seconds*8)<1e-12);assert.ok(Math.abs(q.minute*64+q.third*10)<1e-12)}
});
test('escape dwells, advances half tooth each beat, and seeks deterministically',()=>{
 assert.equal(evaluatePose(.05).escape,0);assert.ok(Math.abs(evaluatePose(1/6).escape-Math.PI/20)<1e-12);
 const expected=evaluatePose(.158);evaluatePose(9000);assert.deepEqual(evaluatePose(.158),expected);
 for(const boundary of [1/6,2/6,1]) assert.ok(Math.abs(evaluatePose(boundary-1e-8).escape-evaluatePose(boundary+1e-8).escape)<1e-5);
 assert.throws(()=>evaluatePose(NaN));assert.throws(()=>evaluatePose(-1));
});
test('pause, speed, seek and hidden-tab freeze use a single clock',()=>{
 const c=new PlaybackClock();c.sample(1000);c.playing=true;c.speed=.5;c.sample(1100);assert.equal(c.time,.05);
 c.sample(1200,true);c.sample(100000);assert.equal(c.time,.05);c.sample(100100);assert.equal(c.time,.1);
 c.seek(12.3);c.sample(200000);assert.equal(c.time,12.3);assert.equal(c.playing,false);
});
