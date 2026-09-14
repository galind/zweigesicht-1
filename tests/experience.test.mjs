import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,resolveState,resetViewState,damp} from '../explorer/src/experience/state.ts';
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
 const s=resolveState(initialState,{centralVisible:true,smallVisible:true,phase:'whole',side:'front',centralStyle:'open-lance',smallStyle:'pear'});
 assert.equal(s.presentation,'dials');assert.equal(s.centralStyle,'open-lance');assert.equal(s.smallStyle,'pear');
 const small=resolveState(s,{side:'back',smallStyle:'broad-lance'});assert.equal(small.centralStyle,'open-lance');
 const invalid=resolveState(small,{centralStyle:'obsolete',smallStyle:'obsolete'});assert.equal(invalid.centralStyle,'fine');assert.equal(invalid.smallStyle,'lance');
});
test('legacy combinations normalize to shared visibility through navigation',()=>{
 for(const centralVisible of [false,true]) for(const smallVisible of [false,true]) {
  const s=resolveState(initialState,{centralVisible,smallVisible,centralStyle:'open-lance',smallStyle:'pear'});
  for(const patch of [{side:'front'},{side:'back'},{layout:'spread'},{group:'display'},{group:'energy'},{separation:1},{partSpread:1},{reveal:1},{separation:0},{part:'catalog-part',isolated:true}]) {
   const next=resolveState(s,patch);assert.equal(next.dialsVisible,centralVisible && smallVisible);assert.equal(next.centralVisible,next.dialsVisible);assert.equal(next.smallVisible,next.dialsVisible);
   assert.equal(next.centralStyle,'open-lance');assert.equal(next.smallStyle,'pear');
  }
 }
 assert.equal(initialState.centralVisible,false);assert.equal(initialState.smallVisible,false);
 assert.equal(initialState.centralStyle,'fine');assert.equal(initialState.smallStyle,'lance');
});

test('obsolete appearance input is discarded from patches and historical state',()=>{
 for(const treatment of ['function','finish','unexpected',null]) {
  assert.equal('treatment' in resolveState(initialState,{treatment}),false);
  assert.equal('treatment' in resolveState({...initialState,treatment},{}),false);
 }
});

test('Reset view preserves all dial combinations, styles and current side while clearing exploration',()=>{
 for(const centralVisible of [false,true]) for(const smallVisible of [false,true]) for(const side of ['front','back']) {
  const before=resolveState(initialState,{centralVisible,smallVisible,centralStyle:'open-lance',smallStyle:'pear',side,viewAngle:'face',group:'display',part:'part',isolated:true,separation:1,partSpread:.8,reveal:1});
  for(const layout of ['assembly','spread']) {
   const reset=resetViewState({...before,layout});
   for(const key of ['centralVisible','smallVisible','centralStyle','smallStyle','side'])assert.equal(reset[key],before[key]);
   assert.equal(reset.viewAngle,'overview');assert.equal(reset.layout,'assembly');assert.equal(reset.group,null);assert.equal(reset.part,null);assert.equal(reset.isolated,false);
   assert.equal(reset.separation,0);assert.equal(reset.partSpread,0);assert.equal(reset.reveal,0);
  }
 }
});

test('camera intent normalizes and survives unrelated state changes',()=>{
 assert.equal(initialState.viewAngle,'overview');
 assert.equal(resolveState(initialState,{viewAngle:'unknown'}).viewAngle,'overview');
 const face=resolveState(initialState,{viewAngle:'face'});
 for(const patch of [{side:'front'},{side:'back'},{centralVisible:true},{smallStyle:'pear'}])assert.equal(resolveState(face,patch).viewAngle,'face');
});


test('inventory flip state is independent of assembly side and clears on exit/Reset',()=>{
 for(const side of ['front','back']) {
  const forward=resolveState(initialState,{layout:'spread',side});
  const back=resolveState(forward,{inventoryBack:true});
  assert.equal(back.side,side);assert.equal(back.inventoryBack,true);
  assert.equal(resolveState(back,{smallVisible:true,smallStyle:'pear'}).inventoryBack,true);
  assert.equal(resolveState(back,{inventoryBack:false}).side,side);
  assert.equal(resolveState(back,{layout:'assembly'}).inventoryBack,false);
  assert.equal(resetViewState(back).inventoryBack,false);assert.equal(resetViewState(back).side,side);
 }
});


test('shared toggle wins over legacy snapshots and hidden styles stay hidden',()=>{
 let state=resolveState(initialState,{centralStyle:'open-lance',smallStyle:'pear'});
 assert.equal(state.dialsVisible,false);
 state=resolveState(state,{dialsVisible:true});
 assert.equal(state.centralVisible,true);assert.equal(state.smallVisible,true);
 state=resolveState(state,{dialsVisible:false});
 assert.equal(state.centralStyle,'open-lance');assert.equal(state.smallStyle,'pear');
 assert.equal(state.centralVisible,false);assert.equal(state.smallVisible,false);
 for(const centralVisible of [true,false]) for(const smallVisible of [true,false]) {
  const restored=resolveState({...state,centralVisible,smallVisible},{});
  assert.equal(restored.dialsVisible,centralVisible&&smallVisible);
 }
});

test('watch defaults migrate old state and preserve configuration on Reset',()=>{
 const legacy={...initialState};delete legacy.caseVisible;delete legacy.caseMaterial;delete legacy.centralFinish;
 const migrated=resolveState(legacy,{});assert.equal(migrated.caseVisible,false);assert.equal(migrated.caseMaterial,'steel');assert.equal(migrated.centralFinish,'blued-steel');
 for(const caseVisible of [false,true]) for(const caseMaterial of ['steel','rose-gold','platinum']) {
  const s=resolveState(initialState,{caseVisible,caseMaterial,centralStyle:'fine',centralFinish:'rose-gold',side:'front',group:'energy',layout:'spread'});
  const reset=resetViewState(s);for(const key of ['caseVisible','caseMaterial','centralFinish','side'])assert.equal(reset[key],s[key]);
  assert.equal(reset.dialsVisible,false);assert.equal(reset.group,null);assert.equal(reset.layout,'assembly');
 }
});
test('unsupported hand combinations and malformed configuration normalize deterministically',()=>{
 const rose=resolveState(initialState,{caseMaterial:'rose-gold',centralFinish:'rose-gold'});assert.equal(rose.centralFinish,'rose-gold');
 for(const centralStyle of ['lance','open-lance']) {
  const s=resolveState(rose,{centralStyle});assert.equal(s.centralFinish,'blued-steel');assert.equal(s.centralStyle,centralStyle);assert.equal(s.dialsVisible,false);
 }
 const invalid=resolveState(initialState,{caseVisible:'yes',caseMaterial:'unknown',centralFinish:'unknown'});assert.equal(invalid.caseVisible,false);assert.equal(invalid.caseMaterial,'steel');assert.equal(invalid.centralFinish,'blued-steel');
});

test('Fine hand finish follows case through hidden choices, overrides and restoration',()=>{
 for(const caseMaterial of ['steel','rose-gold','platinum']) for(const caseVisible of [true,false]) {
  const expected=caseMaterial==='steel'?'blued-steel':'rose-gold';
  for(const centralFinish of ['blued-steel','rose-gold']) {
   const s=resolveState(initialState,{caseMaterial,caseVisible,centralFinish,centralStyle:'fine'});
   assert.equal(s.centralFinish,expected);assert.equal(resetViewState(s).centralFinish,expected);
   const lance=resolveState(s,{centralStyle:'lance'});assert.equal(lance.centralFinish,'blued-steel');
   assert.equal(resolveState(lance,{centralStyle:'fine'}).centralFinish,expected);
  }
 }
});
