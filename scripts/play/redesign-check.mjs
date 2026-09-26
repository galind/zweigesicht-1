/** Free-assembly browser verification. Read-only diagnostics; all placements use DOM input. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import manifest from '../../assets/authored/play-manifest.json' with {type:'json'};
import {actions, canPlace, createSession, fittedLeafIds, workspaceLeafIds, isComplete} from '../../explorer/src/play/state.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base=process.argv[2]??'http://127.0.0.1:4180',level=process.argv[3]??'easy';
const out=path.resolve(process.env.PLAY_QA_OUTPUT??'artifacts/browser/play-redesign');await fs.mkdir(out,{recursive:true});
const report={base,level,checks:[],steps:[],errors:[]};
const check=(name,ok,details)=>{report.checks.push({name,pass:!!ok,details});assert.ok(ok,name)};
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const context=await browser.newContext({viewport:level==='hard'?{width:Number(process.env.PLAY_WIDTH)||390,height:844}:{width:1440,height:900},hasTouch:true,reducedMotion:'reduce'});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
const inspect=()=>page.evaluate(()=>window.__playInspect());
const settle=()=>page.waitForFunction(()=>{const s=window.__playInspect?.();return s?.ready&&!s.busy&&!s.dragging&&!s.scheduledFrame;},null,{timeout:60000});
const camera=s=>JSON.stringify([s.camera,s.cameraTarget,s.cameraUp,s.projection]);
const drift=(a,b)=>Math.max(...JSON.parse(a).flat().map((n,i)=>Math.abs(n-JSON.parse(b).flat()[i])));
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
try {
 await page.goto(`${base}/play?inspect=1`,{waitUntil:'networkidle'});await settle();
 await page.locator('.play-levels button').nth(level==='easy'?0:1).click();await settle();
 check('Hints start off',(await inspect()).session.hints===false);
 const initial=await inspect();check('Mainplate centred in usable viewport',Math.hypot(initial.mainplateCenter.x-initial.frameRegion.left-initial.frameRegion.width/2,initial.mainplateCenter.y-(initial.frameRegion.top+initial.frameRegion.bottom)/2)<.01,initial.mainplateCenter);
 await page.screenshot({path:path.join(out,`${level}-inventory-off.png`)});
 const all=actions(manifest,level);
 let expected=createSession(manifest,level),i=0;
 while(!isComplete(manifest,expected)) {
  const ready=all.filter(s=>canPlace(manifest,expected,s.id));
  const selected=process.env.PLAY_ORDER==='reverse' ? ready.at(-1) : ready.find(s=>s.kind==='transfer')??ready[0];assert.ok(selected,'No graph dead end');
  if(level==='hard')await page.getByLabel('Parts group',{exact:true}).selectOption(selected.groupId);
  await page.locator(`[data-action-id="${selected.id}"]`).click();await settle();
  let s=await inspect();
  if(s.workspace!==selected.workspaceId) {
   await page.locator('.play-selection').getByRole('button',{name:selected.workspaceId?'Open workbench':'Return to watch',exact:true}).click();await settle();
  }
  await page.getByRole('button',{name:'Show destination',exact:true}).click();await settle();
  await page.locator('.play-card-drag').scrollIntoViewIfNeeded();
  s=await inspect();
  check(`${i+1} ${selected.label}: actual seat exposed`,s.seatVisible,{id:selected.id,workspace:s.workspace,occluders:s.occluders});
  check(`${i+1}: source fitted visibility exact`,same(s.visible,s.fitted));
  const before=camera(s),oldCount=s.session.actionIds.length;
  if(i%11===4) {
    await page.locator('.play-target').focus();await page.keyboard.press('Enter');
  } else if(i%13===7) {
    const cdp=await context.newCDPSession(page);const points=(x,y)=>[{x,y,id:1}];
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(s.stage.x,s.stage.y)});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(s.target.x,s.target.y)});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  } else {
    await page.mouse.move(s.stage.x,s.stage.y);await page.mouse.down();await page.mouse.move(s.target.x,s.target.y,{steps:4});await page.mouse.up();
  }
  await settle();const after=await inspect();
  check(`${i+1}: single committed placement`,after.session.actionIds.length===oldCount+1,{id:selected.id,notice:await page.locator('.play-selection').innerText()});
  check(`${i+1}: camera preserved through placement`,drift(camera(after),before)<1e-9,{before:JSON.parse(before),after:JSON.parse(camera(after)),maxDrift:drift(camera(after),before)});
  check(`${i+1}: no next selected piece`,!after.stepId);
  expected=after.session;
  const physical=selected.workspaceId?workspaceLeafIds(manifest,expected,selected.workspaceId):fittedLeafIds(manifest,expected);
  check(`${i+1}: exact physical membership`,same(after.fitted,physical));
  report.steps.push({index:++i,id:selected.id,label:selected.label,workspace:selected.workspaceId,fitted:after.fitted.length,camera:JSON.parse(before)});
  if(i%20===0){await fs.writeFile(path.join(out,`${level}-redesign-report.json`),JSON.stringify(report,null,2));console.log(`${level} ${i}/${all.length}: ${selected.label}`);}
  if(i===1||i===10||selected.packetId==='movement-29'&&i%7===0)await page.screenshot({path:path.join(out,`${level}-${String(i).padStart(3,'0')}.png`)});
 }
 if((await inspect()).workspace) {await page.getByRole('button',{name:'Return to watch',exact:true}).first().click();await settle();}
 const end=await inspect();check('Exact 265 fitted and visible leaves',same(end.fitted,manifest.finalLeafIds)&&same(end.visible,manifest.finalLeafIds));
 await page.screenshot({path:path.join(out,`${level}-complete.png`)});
 check('No uncaught browser errors',report.errors.length===0,report.errors);
 console.log(`${level}: ${report.steps.length} actions, ${report.checks.length} checks passed`);
} catch(error) {report.failure=String(error);await page.screenshot({path:path.join(out,`${level}-failure.png`)});console.error(error);process.exitCode=1;}
finally {await fs.writeFile(path.join(out,`${level}-redesign-report.json`),JSON.stringify(report,null,2));await browser.close();}
