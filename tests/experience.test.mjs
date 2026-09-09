import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,resolveState,damp} from '../explorer/src/experience/state.ts';
test('obsolete playback input cannot enter the static explorer state',()=>{
 const s=resolveState(initialState,{study:true,playing:true,time:12,speed:1});
 for(const key of ['study','playing','time','speed'])assert.equal(key in s,false);
 assert.deepEqual(s,initialState);
});
test('separation endpoints normalize without changing accepted dial preferences',()=>{
 for(const separation of [0,.2,.52,.72,1,.72,.2,0]) { const s=resolveState(initialState,{separation}); assert.equal(s.separation,separation);assert.equal(s.centralStyle,'fine'); }
});
test('interrupted reveal starts from current state and converges',()=>{
 let x=damp(0,10,.1);const interrupted=x;assert.equal(damp(x,-5,0),interrupted);
 for(let i=0;i<200;i++)x=damp(x,-5,1/60);assert.ok(Math.abs(x+5)<1e-8);assert.equal(damp(4,0,.1,true),0);
});
test('invalid states are normalized and isolation needs a selected part',()=>{
 const s=resolveState(initialState,{separation:Infinity,reveal:4,isolated:true});assert.equal(s.separation,0);assert.equal(s.reveal,1);assert.equal(s.isolated,false);
});
test('dial defaults and independent preferences normalize unknown style IDs',()=>{
 const s=resolveState(initialState,{presentation:'dials',phase:'whole',side:'front',centralStyle:'open-lance',smallStyle:'pear'});
 assert.equal(s.presentation,'dials');assert.equal(s.centralStyle,'open-lance');assert.equal(s.smallStyle,'pear');
 const small=resolveState(s,{side:'back',smallStyle:'broad-lance'});assert.equal(small.centralStyle,'open-lance');
 const invalid=resolveState(small,{centralStyle:'obsolete',smallStyle:'obsolete'});assert.equal(invalid.centralStyle,'fine');assert.equal(invalid.smallStyle,'lance');
});
test('movement inspection temporarily hides dials and retains preferences',()=>{
 const s=resolveState(initialState,{presentation:'dials',centralStyle:'open-lance',smallStyle:'pear'});
 for(const patch of [{layout:'spread'},{group:'energy'},{separation:.1},{partSpread:.1},{reveal:.3}]){
 const next=resolveState(s,patch);assert.equal(next.presentation,'movement');assert.equal(next.centralStyle,'open-lance');assert.equal(next.smallStyle,'pear');
 }
 assert.equal(resolveState(s,{part:'catalog-part',isolated:true}).presentation,'dials');
 assert.equal(initialState.presentation,'movement');assert.equal(initialState.centralStyle,'fine');assert.equal(initialState.smallStyle,'lance');
});
