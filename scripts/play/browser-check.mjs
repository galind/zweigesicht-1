/** Route QA entry point. Each browser suite uses public DOM inputs. */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const base=process.argv[2]??'http://127.0.0.1:4185';
const mode=process.argv[3]??'all';
if(!['all','easy','hard','focused','home'].includes(mode)) throw Error('Use all, easy, hard, focused or home. Historical guided suites belong to play-3.');
for(const part of mode==='all'?['easy','hard','focused','home']:[mode]) {
  const script=part==='home'?'home-check.mjs':part==='focused'?'redesign-focused.mjs':'redesign-check.mjs';
  const result=spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),base,part],{stdio:'inherit',env:process.env});
  if(result.error) throw result.error;
  if(result.status!==0) process.exit(result.status??1);
}
