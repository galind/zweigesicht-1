import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../assets/authored/play-manifest.json' with {type:'json'};
import {PLAY_STORAGE_KEY, SNAP_RADIUS_PX, actions, createSession, canPlace, missingPrerequisites, assembledLeafIds, fittedLeafIds, workspaceLeafIds, isComplete, commitPlacement, undoPlacement, validateSession, getSavedSession, saveSession, clearSavedSession, dragCenter, snapDrop} from '../explorer/src/play/state.ts';
function memoryStorage() {const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
function complete(level, reverse=false) {
  let session=createSession(manifest,level);const snapshots=[session];
  while (!isComplete(manifest,session)) {
    const available=actions(manifest,level).filter(s=>canPlace(manifest,session,s.id));
    assert.ok(available.length,'No hidden dependency dead end');
    session=commitPlacement(manifest,session,available[reverse?available.length-1:0].id);snapshots.push(session);
  }
  return snapshots;
}
test('independent barrels and train branches can start freely; a premature bridge cannot close them',()=>{
  let s=createSession(manifest,'easy');
  for (const id of ['movement-1','movement-2','movement-3','movement-63','movement-65','movement-62','movement-27']) assert.ok(canPlace(manifest,s,id),id);
  assert.equal(canPlace(manifest,s,'movement-60'),false);
  assert.equal(commitPlacement(manifest,s,'movement-60'),s);
  s=commitPlacement(manifest,s,'movement-2');
  assert.equal(canPlace(manifest,s,'movement-60'),false);
  s=commitPlacement(manifest,s,'movement-1');
  assert.equal(canPlace(manifest,s,'movement-60'),true);
  assert.equal(commitPlacement(manifest,s,'movement-1'),s,'Duplicate release does nothing');
  const completed=commitPlacement(manifest,s,'movement-60');
  assert.equal(canPlace(manifest,completed,'movement-17'),true);
  assert.equal(canPlace(manifest,undoPlacement(manifest,completed),'movement-17'),false);
  assert.equal(canPlace(manifest,s,'central-dial'),false,'Dial cannot cover unfinished movement work');
});
test('the default bench offers meaningful legal choices without revealing their seats',()=>{
  const easy=createSession(manifest,'easy');
  const easyReady=actions(manifest,'easy').filter(step=>canPlace(manifest,easy,step.id));
  assert.equal(easyReady.length,19);
  assert.ok(easyReady.every(step=>!step.prerequisiteStepIds.length));
  assert.ok(!easyReady.some(step=>step.id==='movement-60'),'A premature cover is not put on the ready bench');

  const hard=createSession(manifest,'hard');
  const hardReady=actions(manifest,'hard').filter(step=>canPlace(manifest,hard,step.id));
  assert.equal(hardReady.length,40);
  const powerProjects=new Set(hardReady.filter(step=>step.groupId==='power'&&step.workspaceId).map(step=>step.workspaceId));
  assert.deepEqual(powerProjects,new Set(['movement-1','movement-2','movement-60']));
  assert.equal(hardReady.filter(step=>step.groupId==='power'&&!step.workspaceId).length,0);
});
test('hard internals cannot be placed unsupported, transferred early, double-counted or auto-transferred',()=>{
  const packet=manifest.packets.find(p=>p.id==='movement-1');
  const steps=manifest.levels.hard.steps.filter(s=>s.workspaceId===packet.id);
  const drum=steps.find(s=>s.label==='Barrel drum 2'),arbor=steps.find(s=>s.label==='Barrel arbor'),spring=steps.find(s=>s.label==='Mainspring'),cover=steps.find(s=>s.label==='Barrel cover 2');
  let s=createSession(manifest,'hard');
  assert.equal(canPlace(manifest,s,cover.id),false);assert.equal(canPlace(manifest,s,arbor.id),false);
  assert.equal(commitPlacement(manifest,s,packet.transferId),s);
  for (const step of [drum,arbor,spring,cover]) s=commitPlacement(manifest,s,step.id);
  assert.equal(assembledLeafIds(manifest,s).length,20);assert.equal(fittedLeafIds(manifest,s).length,16);
  assert.deepEqual(new Set(workspaceLeafIds(manifest,s,packet.id)),new Set(packet.leafIds));
  const seated=commitPlacement(manifest,s,packet.transferId);
  assert.equal(assembledLeafIds(manifest,seated).length,20);assert.equal(fittedLeafIds(manifest,seated).length,20);
  assert.deepEqual(workspaceLeafIds(manifest,seated,packet.id),[]);
  assert.equal(commitPlacement(manifest,seated,packet.transferId),seated);
  assert.deepEqual(undoPlacement(manifest,seated),s,'Undo transfer restores the complete loose assembly');
  assert.equal(canPlace(manifest,undoPlacement(manifest,s),packet.transferId),false,'Undo cover removes transfer availability');
});
test('both levels accept opposite legal orders, restore every action and undo all work with exact accounting',()=>{
  for(const level of ['easy','hard']) for(const reverse of [false,true]) {
    const history=complete(level,reverse),storage=memoryStorage();
    for(const state of history) {
      const s={...state,hints:true};assert.equal(saveSession(manifest,s,storage).status,'saved');
      assert.deepEqual(getSavedSession(manifest,storage),{status:'saved',session:s});
      assert.equal(new Set(assembledLeafIds(manifest,s)).size,assembledLeafIds(manifest,s).length);
      assert.equal(new Set(fittedLeafIds(manifest,s)).size,fittedLeafIds(manifest,s).length);
    }
    let s=history.at(-1);assert.deepEqual(new Set(fittedLeafIds(manifest,s)),new Set(manifest.finalLeafIds));
    for(let i=history.length-2;i>=0;i--) {s=undoPlacement(manifest,s);assert.deepEqual(s,history[i]);}
    assert.equal(s.hints,false);assert.equal(undoPlacement(manifest,s),s);
  }
});
test('invalid histories, foreign IDs, duplicate releases and legacy linear saves never reinterpret progress',()=>{
  const base=createSession(manifest,'easy');
  for(const data of [null,[],{}, {...base,hints:undefined},{...base,level:'other'},{...base,actionIds:['movement-60']},{...base,actionIds:['movement-1','movement-1']},{...base,actionIds:['seat:movement-1']},{...base,actionIds:new Array(1)},{...base,selection:'movement-1'}]) assert.equal(validateSession(manifest,data).status,'corrupt');
  const storage=memoryStorage();const old={manifestVersion:'play-3',level:'easy',completedStepIds:['movement-1']};
  storage.setItem(PLAY_STORAGE_KEY,JSON.stringify(old));
  assert.equal(getSavedSession(manifest,storage).status,'incompatible');assert.equal(saveSession(manifest,old,storage).status,'incompatible');
  assert.equal(storage.getItem(PLAY_STORAGE_KEY),JSON.stringify(old));
  assert.equal(commitPlacement(manifest,old,'movement-1'),old);
});
test('saved hints survive placements and undo; restart starts with hints off',()=>{
  const s={...createSession(manifest,'easy'),hints:true};
  assert.equal(commitPlacement(manifest,s,'movement-1').hints,true);
  assert.equal(undoPlacement(manifest,commitPlacement(manifest,s,'movement-1')).hints,true);
  assert.equal(createSession(manifest,'easy').hints,false);
  assert.deepEqual(missingPrerequisites(manifest,s,'movement-60').map(s=>s.id),['movement-1','movement-2']);
});
test('unavailable storage and corrupt JSON are reported without blocking play',()=>{
  const failure=()=>{throw Error('Storage blocked')},s=createSession(manifest,'easy');
  for(const storage of [failure,{getItem:failure,setItem:failure,removeItem:failure}]) {
    assert.equal(getSavedSession(manifest,storage).status,'unavailable');assert.equal(saveSession(manifest,s,storage).status,'unavailable');assert.equal(clearSavedSession(storage),false);
  }
  const storage=memoryStorage();storage.setItem(PLAY_STORAGE_KEY,'{broken');assert.equal(getSavedSession(manifest,storage).status,'corrupt');
  assert.equal(commitPlacement(manifest,s,'movement-1').actionIds.length,1);
});
test('snap validation respects grab offsets, generous CSS pixels and finite coordinates',()=>{
  const target={x:180,y:250},grabOffset={x:23,y:-18},pointer={x:203,y:232};
  assert.deepEqual(dragCenter(pointer,grabOffset),target);assert.equal(snapDrop({pointer,grabOffset,target}),true);
  assert.equal(snapDrop({pointer:{...pointer,x:pointer.x+SNAP_RADIUS_PX},grabOffset,target}),true);
  assert.equal(snapDrop({pointer:{...pointer,x:pointer.x+SNAP_RADIUS_PX+1},grabOffset,target}),false);
  for(const n of [NaN,Infinity,-Infinity]) assert.equal(snapDrop({pointer:{x:n,y:0},grabOffset,target}),false);
  for(const radius of [0,-1,Infinity]) assert.equal(snapDrop({pointer,grabOffset,target,radius}),false);
});

test('balance-bridge diamond fitting cannot close over unfinished shock-protection jewels',()=>{
 const steps=manifest.levels.hard.steps.filter(s=>s.workspaceId==='movement-59');
 const byLabel=label=>steps.find(s=>s.label===label);
 let s=commitPlacement(manifest,createSession(manifest,'hard'),byLabel('Balance bridge').id);
 const setting=byLabel('Diamond setting').id;
 assert.equal(canPlace(manifest,s,setting),false);
 for(const label of ['Shock-protection housing','Shock-protection jewel setting','Shock-protection jewel 1','Shock-protection jewel 2','Shock-protection retaining spring']) s=commitPlacement(manifest,s,byLabel(label).id);
 assert.equal(canPlace(manifest,s,setting),true);
 assert.equal(canPlace(manifest,undoPlacement(manifest,s),setting),false);
});
