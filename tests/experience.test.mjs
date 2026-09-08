import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,resolveState,layerOffset,damp} from '../explorer/src/experience/state.ts';
test('separation pauses playback without changing phase time',()=>{
 const s=resolveState({...initialState,time:12,study:true,playing:true},{separation:.3});assert.equal(s.playing,false);assert.equal(s.time,12);
 assert.equal(resolveState({...s,separation:0,playing:true},{partSpread:.1}).playing,false);
});
test('restoring assembly is exact and independent of history',()=>{
 for(const z of [-6,-2.8,0,5]){assert.equal(Math.abs(layerOffset(z,0)),0);const a=layerOffset(z,.7);layerOffset(z,.9);assert.equal(layerOffset(z,.7),a)}
});
test('interrupted reveal starts from current state and converges',()=>{
 let x=damp(0,10,.1);const interrupted=x;assert.equal(damp(x,-5,0),interrupted);
 for(let i=0;i<200;i++)x=damp(x,-5,1/60);assert.ok(Math.abs(x+5)<1e-8);assert.equal(damp(4,0,.1,true),0);
});
test('invalid states are normalized and isolation needs a selected part',()=>{
 const s=resolveState(initialState,{separation:Infinity,reveal:4,speed:-1,time:NaN,isolated:true});assert.equal(s.separation,0);assert.equal(s.reveal,1);assert.equal(s.speed,.1);assert.equal(s.time,0);assert.equal(s.isolated,false);
});
