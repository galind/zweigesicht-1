/** User-reported discoverability regression: drag from the inventory itself. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import manifest from '../../assets/authored/play-manifest.json' with {type:'json'};
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base=process.argv[2]??'http://127.0.0.1:4180',out=path.resolve(process.env.PLAY_QA_OUTPUT??'artifacts/browser/play-drag');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const report={base,checks:[],errors:[]};
const check=(name,ok)=>{report.checks.push({name,pass:!!ok});assert.ok(ok,name);};
let page;
try {
 for(const width of [1440,390,320]) {
  const context=await browser.newContext({viewport:{width,height:width===320?568:900},hasTouch:true});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
  const inspect=()=>page.evaluate(()=>window.__playInspect());
  const settle=()=>page.waitForFunction(()=>{const s=window.__playInspect?.();return s?.ready&&!s.busy&&!s.dragging&&!s.scheduledFrame;},null,{timeout:60000});
  const card=id=>page.locator(`[data-action-id="${id}"]`);
  const center=async locator=>{await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2};};
  const pose=s=>JSON.stringify([s.camera,s.cameraTarget,s.cameraUp,s.projection]);
  const touch=async(from,to,cancel=false)=>{const cdp=await context.newCDPSession(page),pts=p=>[{x:p.x,y:p.y,id:1}];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts(from)});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts({x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8})});await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await cdp.detach();await settle();};
  await page.goto(`${base}/play?inspect=1`,{waitUntil:'networkidle'});await settle();
  await page.locator('.play-levels button').first().click();await settle();
  const camera=pose(await inspect());
  // No prior selection: the pointer press itself picks up the card.
  const from=await center(card('movement-2'));
  await page.mouse.move(from.x,from.y);await page.mouse.down();
  let s=await inspect();check(`${width}: mouse picks up unselected card`,s.dragging&&s.selection==='movement-2');
  await page.mouse.move(s.target.x,s.target.y,{steps:10});await page.mouse.up();await settle();
  s=await inspect();check(`${width}: direct hints-off card drop commits once`,s.session.actionIds.length===1&&s.session.actionIds[0]==='movement-2');
  check(`${width}: card drag preserves camera`,pose(s)===camera);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await settle();
  // Keep normal animation: the pointer-generated click must not cancel settling.
  await page.getByRole('button',{name:'Hints off',exact:true}).click();await settle();
  let p=await center(card('movement-2'));await page.mouse.move(p.x,p.y);await page.mouse.down();s=await inspect();await page.mouse.move(s.target.x,s.target.y,{steps:10});await page.mouse.up();await settle();
  check(`${width}: hints-on card drop commits once`,(await inspect()).session.actionIds.length===1);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await settle();
  await card('movement-60').click();await settle();
  check(`${width}: hints-on unavailable piece disables touch dragging`,await page.locator('.play-drag-control').isDisabled());
  check(`${width}: unavailable card stays inspectable`,await card('movement-60').isEnabled());
  await page.getByRole('button',{name:'Hints on',exact:true}).click();await settle();
  await card('movement-2').tap();await settle();
  const dragControl=page.locator('.play-drag-control');
  check(`${width}: selected piece exposes named drag control`,await dragControl.isVisible()&&await dragControl.isEnabled()&&/Drag part/.test(await dragControl.innerText()));
  p=await center(dragControl);s=await inspect();
  await touch(p,{x:s.target.x+20,y:s.target.y},true);
  check(`${width}: touch cancel releases capture without placement`,!(await inspect()).dragging&&!(await inspect()).session.actionIds.length);
  p=await center(card('movement-2'));await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(s.target.x,s.target.y,{steps:5});await page.keyboard.press('Escape');await page.mouse.up();await settle();
  check(`${width}: Escape cancels gallery drag`,!(await inspect()).session.actionIds.length&&!(await inspect()).dragging);
  p=await center(dragControl);s=await inspect();await touch(p,s.target);
  check(`${width}: labeled touch control places with hints off`,(await inspect()).session.actionIds.length===1);
  check(`${width}: touch drag preserves camera`,pose(await inspect())===camera);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await settle();
  await page.getByRole('button',{name:'Hints off',exact:true}).click();await settle();
  p=await center(dragControl);s=await inspect();await touch(p,s.target);
  check(`${width}: labeled touch control places with hints on`,(await inspect()).session.actionIds.length===1);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await settle();
  await page.locator('.play-gallery').scrollIntoViewIfNeeded();
  const r=await page.locator('.play-gallery').boundingBox(),scroll=await page.locator('.play-gallery').evaluate(e=>e.scrollLeft);
  await touch({x:r.x+r.width-20,y:r.y+35},{x:r.x+20,y:r.y+35});
  check(`${width}: gallery swipe still scrolls without dragging or placing`,await page.locator('.play-gallery').evaluate(e=>e.scrollLeft)>scroll&&!(await inspect()).session.actionIds.length&&!(await inspect()).dragging);
  await card('movement-2').tap();await settle();await page.locator('.play-drag-control').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`drag-control-${width}.png`)});
  // Hard deliberately requires entering the part's workspace; selection alone cannot move the camera.
  await page.getByRole('button',{name:'Choose difficulty',exact:true}).click();await page.getByRole('button',{name:'Choose level',exact:true}).click();await settle();await page.locator('.play-levels button').nth(1).click();if(await page.locator('dialog[open]').count())await page.getByRole('button',{name:'Start again',exact:true}).click();await settle();
  const hardCamera=pose(await inspect());await card(manifest.levels.hard.steps[0].id).tap();await settle();
  check(`${width}: Hard explains the required workbench`,/Open the workbench first/.test(await page.locator('.play-selection').innerText())&&await page.getByRole('button',{name:'Open workbench',exact:true}).isVisible()&&!(await page.locator('.play-drag-control').count())&&pose(await inspect())===hardCamera);
  await page.getByRole('button',{name:'Open workbench',exact:true}).click();await settle();
  check(`${width}: workbench exposes touch drag`,await page.locator('.play-drag-control').isVisible());
  p=await center(page.locator('.play-drag-control'));s=await inspect();await touch(p,s.target);
  check(`${width}: workbench part can be dragged without hints`,(await inspect()).session.actionIds.length===1);
  await context.close();
 }
 check('No uncaught browser errors',!report.errors.length);
 console.log(`${report.checks.length} inventory drag checks passed`);
} catch(error) {report.failure=String(error);console.error(error);if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure.png')});process.exitCode=1;}
finally {await fs.writeFile(path.join(out,'drag-report.json'),JSON.stringify(report,null,2));await browser.close();}
