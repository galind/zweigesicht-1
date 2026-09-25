/** Local browser QA. No state/step mutation shortcuts. Set PLAYWRIGHT_MODULE if
 * Playwright is not installed locally; CHROME_PATH selects an existing browser. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const supplied = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(supplied ? pathToFileURL(supplied).href : 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:4180';
const mode = process.argv[3] || 'all';
assert.ok(['all','easy','hard','focused','home','dev'].includes(mode), 'Unknown browser-check mode');
const out = path.resolve(process.env.PLAY_QA_OUTPUT || 'artifacts/browser/play');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const report = { base, started: new Date().toISOString(), checks: [], steps: [], errors: [] };
const check = (name, condition, details) => {
  report.checks.push({ name, pass: Boolean(condition), ...(details ? { details } : {}) });
  assert.ok(condition, name);
};
async function save() { await fs.writeFile(path.join(out, `${mode}-report.json`), JSON.stringify(report, null, 2)); }
async function home() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const requests=[],scriptBodies=[]; page.on('request', r => requests.push(r.url()));
  page.on('response',r=>{if(r.request().resourceType()==='script')scriptBodies.push(r.text().catch(()=>''));});
  page.on('pageerror', e => report.errors.push(String(e)));
  await page.goto(`${base}/`, { waitUntil:'networkidle' });
  await page.getByRole('button', {name:'Disassemble', exact:true}).waitFor();
  await page.waitForTimeout(1000);
  check('Homepage has no /play link', await page.locator('a[href="/play"]').count() === 0);
  check('Homepage does not request play modules/data', !requests.some(url => /\/src\/play\/|\/app\/play\/|play-manifest/.test(url)), requests);
  check('Homepage JavaScript excludes game state, manifest and completion UI',!(await Promise.all(scriptBodies)).some(body=>body.includes('zweigesicht:play:session:v1')||body.includes('Every piece in place.')||body.includes('foundationRootId')));
  await page.screenshot({ path: path.join(out, 'homepage-after.png') });
  await page.goto(`${base}/?inspect=1`, { waitUntil:'networkidle' });
  await page.getByText('Inspection tools', {exact:true}).click();
  await page.getByRole('button',{name:'Run UX checks',exact:true}).click();
  await page.waitForFunction(() => {const s=document.querySelector('#qa-report')?.textContent; return s && s !== 'null' && !s.includes('"running": true');}, null, {timeout:180000});
  const qa=JSON.parse(await page.locator('#qa-report').innerText());
  check('Existing homepage UX suite', Array.isArray(qa) && qa.length > 0 && qa.every(c=>c.pass), qa);
  await page.close();
}
const manifest = JSON.parse(await fs.readFile(new URL('../../assets/authored/play-manifest.json', import.meta.url), 'utf8'));
const storageKey = 'zweigesicht:play:session:v1';
const inspect = page => page.evaluate(() => window.__playInspect?.());
const settle = async page => { await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))); await page.waitForFunction(() => { const s=window.__playInspect?.(); return s?.ready && !s.busy && !s.dragging && !s.scheduledFrame; }, null, { timeout: 120000 }); };
const setEquals = (a,b) => a.length===b.length && [...a].sort().every((id,i)=>id===[...b].sort()[i]);
async function targetEvidence(page, label) {
  const s = await inspect(page);
  const e = await page.evaluate(({target,stage}) => {
    const topAt=p=>{const e=document.elementFromPoint(p.x,p.y);return {tag:e?.tagName,className:(e?.closest('button')||e)?.className,aria:e?.getAttribute('aria-label')};};
    const rect=q=>{const r=document.querySelector(q)?.getBoundingClientRect();return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null;};
    return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,targetElement:topAt(target),stageElement:topAt(stage),targetRect:rect('.play-target'),stageRect:rect('.play-stage'),dockRect:rect('.play-dock'),headerRects:[...document.querySelectorAll('.play-heading>*')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};})};
  },s);
  check(`${label}: target and stage remain in viewport`, [s.target,s.stage].every(p=>p.x>=28&&p.x<=e.width-28&&p.y>=28&&p.y<=e.height-28), {target:s.target,stage:s.stage,viewport:e});
  check(`${label}: destination is exposed to pointer input`, e.targetElement.className?.includes('play-target'), e.targetElement);
  check(`${label}: stage is exposed to pointer input`, e.stageElement.className?.includes('play-stage'), e.stageElement);
  check(`${label}: no horizontal overflow or clipped header`, e.scrollWidth<=e.width&&e.headerRects.every(r=>r.left>=0&&r.right<=e.width&&r.top>=0),e);
  check(`${label}: stage and destination do not overlap controls`,(!e.dockRect||[e.targetRect,e.stageRect].every(r=>r.bottom<=e.dockRect.top||r.right<=e.dockRect.left||r.left>=e.dockRect.right)),e);
  check(`${label}: stage and destination have separate hit areas`,Math.hypot(s.target.x-s.stage.x,s.target.y-s.stage.y)>=(e.stageRect.width+e.targetRect.width)/2+8,{target:s.target,stage:s.stage});
  check(`${label}: target not behind fitted geometry`, Array.isArray(s.occluders)&&s.occluders.length===0,s.occluders);
  check(`${label}: actual staged CAD is centered in the hit area`, s.stageCount>0&&Math.hypot(s.stage.x-s.stageRendered.x,s.stage.y-s.stageRendered.y)<1,{stage:s.stage,rendered:s.stageRendered,count:s.stageCount});
  return s;
}
async function mouseDrag(page,s,{miss=false,offset={x:0,y:0},preview=false}={}) {
  await page.mouse.move(s.stage.x+offset.x,s.stage.y+offset.y);
  await page.mouse.down();
  await page.mouse.move((miss?30:s.target.x)+offset.x,(miss?160:s.target.y)+offset.y,{steps:8});
  if(preview) return;
  await page.mouse.up(); await settle(page);
}
async function touchDrag(page,s,miss=false) {
  const cdp=await page.context().newCDPSession(page);
  const point=(x,y)=>[{x,y,id:1,radiusX:8,radiusY:8,force:1}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:point(s.stage.x,s.stage.y)});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:point(s.stage.x+((miss?30:s.target.x)-s.stage.x)*i/8,s.stage.y+((miss?160:s.target.y)-s.stage.y)*i/8)});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await cdp.detach(); await settle(page);
}
async function start(page,level) {
  await page.goto(`${base}/play?inspect=1`, {waitUntil:'networkidle'});
  const metadata=await page.evaluate(()=>({robots:document.querySelector('meta[name=robots]')?.content,canonical:document.querySelector('link[rel=canonical]')?.href}));
  check('Play metadata is noindex with its own canonical',metadata.robots?.includes('noindex')&&metadata.canonical?.endsWith('/play'),metadata);
  await page.getByRole('button',{name:new RegExp(`^${level === 'easy'?'Easy':'Hard'}\\b`)}).click();
  await settle(page);
}
async function traverse(level,viewport) {
  const context=await browser.newContext({viewport,hasTouch:true});
  const page=await context.newPage(); page.on('pageerror',e=>report.errors.push(String(e)));
  await start(page,level);
  const steps=manifest.levels[level].steps;
  let expected=[...manifest.initialLeafIds];
  for(let index=0;index<steps.length;index++) {
    const step=steps[index],label=`${level} ${index+1}/${steps.length} ${step.id}`;
    let s=await targetEvidence(page,label);
    if(index>0 && (step.side!==steps[index-1].side || index===3)) {
      await page.getByRole('button',{name:'Undo',exact:true}).click(); await settle(page);
      const undone=await inspect(page);
      check(`${label}: undo restores previous step across transition`,undone.stepId===steps[index-1].id&&undone.side===steps[index-1].side&&undone.fitted.length===expected.length-steps[index-1].leafIds.length);
      await mouseDrag(page,undone); s=await targetEvidence(page,`${label} after undo/replay`);
    }
    if(index===12) {
      await page.reload({waitUntil:'networkidle'}); await settle(page);
      await page.getByRole('button',{name:/^Continue /}).click(); await settle(page);
      s=await targetEvidence(page,`${label} restored`);
      check(`${label}: refresh restores exact fitted set and next step`,s.stepId===step.id&&setEquals(s.fitted,expected));
    }
    if(level==='hard' || index<2 || index%30===0 || index>=steps.length-4) {
      await page.setViewportSize({width:320,height:844}); await settle(page);
      await targetEvidence(page,`${label} narrow 320px`);
      if(index<2 || index>=steps.length-2)await page.screenshot({path:path.join(out,`${level}-narrow-${index+1}.png`)});
      await page.setViewportSize(viewport); await settle(page); s=await inspect(page);
    }
    check(`${label}: expected step/fitted set`,s.stepId===step.id&&setEquals(s.fitted,expected),{actual:s.stepId,expected:step.id,count:s.fitted.length});
    const capture=index<3 || index%25===0 || index>=steps.length-15 || (index>0&&step.side!==steps[index-1].side);
    if(capture)await page.screenshot({path:path.join(out,`${level}-${String(index+1).padStart(3,'0')}-${step.id}.png`)});
    if(index===0) {
      await mouseDrag(page,s,{miss:true});
      check(`${label}: invalid release returns without placement`,(await inspect(page)).stepId===step.id);
      await mouseDrag(page,s,{preview:true,offset:{x:15,y:12}});
      const near=await inspect(page);
      check(`${label}: target preview does not commit and owns gestures`,near.stepId===step.id&&near.dragging&&!near.controlsEnabled);
      await page.mouse.up(); await settle(page);
    } else if(index%21===0) await touchDrag(page,s);
    else if(index%23===0) {
      await page.locator('.play-stage').focus(); await page.keyboard.press('Enter');
      await page.locator('.play-target').focus(); await page.keyboard.press('Enter'); await settle(page);
    } else await mouseDrag(page,s);
    expected.push(...step.leafIds);
    const after=await inspect(page);
    check(`${label}: committed exactly this placement`,setEquals(after.fitted,expected)&&(after.stepId??null)===(steps[index+1]?.id??null),{next:after.stepId,fitted:after.fitted.length});
    report.steps.push({level,index,stepId:step.id,label:step.label,side:step.side,leafCount:step.leafIds.length,target:s.target,stage:s.stage,visible:s.visible,cutaway:s.cutaway,occluders:s.occluders,stageRendered:s.stageRendered,stageCount:s.stageCount});
    if(index%20===0)await save();
  }
  await page.screenshot({path:path.join(out,`${level}-complete.png`)});
  const complete=await inspect(page);
  check(`${level}: completion renders every intended physical leaf`,setEquals(complete.fitted,manifest.finalLeafIds)&&setEquals(complete.visible,manifest.finalLeafIds)&&complete.geometryCount===manifest.finalLeafIds.length,{fitted:complete.fitted.length,visible:complete.visible.length,geometries:complete.geometryCount});
  await page.getByRole('button',{name:'Flip',exact:true}).click(); await settle(page);
  await page.screenshot({path:path.join(out,`${level}-complete-flipped.png`)});
  check(`${level}: completed watch remains available to flip`,setEquals((await inspect(page)).fitted,manifest.finalLeafIds));
  const idle=await inspect(page); await page.waitForTimeout(600);const resting=await inspect(page);
  check(`${level}: idle scene has no perpetual frame loop`,idle.renderCount===resting.renderCount&&!resting.scheduledFrame,{before:idle.renderCount,after:resting.renderCount});
  await context.close();
}
async function focused() {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  const page=await context.newPage(); page.on('pageerror',e=>report.errors.push(String(e)));
  await start(page,'hard'); let s=await targetEvidence(page,'focused first Hard part');
  await mouseDrag(page,s,{preview:true});
  const camera=(await inspect(page)).camera;
  await page.mouse.wheel(0,200);
  check('Camera does not zoom during drag',JSON.stringify((await inspect(page)).camera)===JSON.stringify(camera));
  await page.locator('.play-stage').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse'});
  await page.mouse.up(); await settle(page);
  check('Pointer cancellation restores controls without placement',(await inspect(page)).stepId===s.stepId&&(await inspect(page)).controlsEnabled);
  await mouseDrag(page,s,{preview:true});
  await page.locator('.play-stage').evaluate(el=>{for(let id=0;id<20;id++)if(el.hasPointerCapture(id))el.releasePointerCapture(id);});
  await page.mouse.up(); await settle(page);
  check('Lost pointer capture cancels without placement',(await inspect(page)).stepId===s.stepId);
  await mouseDrag(page,s,{preview:true}); await page.setViewportSize({width:320,height:844});await page.waitForFunction(()=>!window.__playInspect().dragging);await page.mouse.up();await settle(page);
  check('Resize cancels incomplete drag',(await inspect(page)).stepId===s.stepId&&(await inspect(page)).controlsEnabled);
  await targetEvidence(page,'focused resize');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await page.waitForTimeout(250); // Allow ResizeObserver and root-font reflow to settle before the user's next action.
  await page.getByRole('button',{name:'Reframe',exact:true}).click();await settle(page);
  await targetEvidence(page,'320px 200% text reduced motion');
  await page.screenshot({path:path.join(out,'phone-320-enlarged-reduced.png')});
  await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));
  await page.waitForTimeout(250); // Font-size restoration also triggers observer-driven reframing.
  await page.setViewportSize({width:390,height:844});await settle(page);
  await page.getByRole('button',{name:'Hint',exact:true}).click();
  check('Optional stronger hint is enabled',await page.getByRole('button',{name:'Hint',exact:true}).getAttribute('aria-pressed')==='true');
  await page.getByRole('button',{name:'Hint',exact:true}).click();await settle(page);await page.waitForTimeout(150);
  const canvas=page.locator('.play-canvas canvas'); await canvas.focus();
  const beforeOrbit=(await inspect(page)).camera;await page.keyboard.press('ArrowRight');await settle(page);
  check('Keyboard camera orbit remains useful',JSON.stringify((await inspect(page)).camera)!==JSON.stringify(beforeOrbit),{before:beforeOrbit,after:(await inspect(page)).camera,focus:await page.evaluate(()=>document.activeElement?.tagName)});
  await page.getByRole('button',{name:'Reframe',exact:true}).click();await settle(page);
  s=await inspect(page);
  const zoomBefore=s.camera;await page.mouse.move(370,180);await page.mouse.wheel(0,-100);await settle(page);
  check('Wheel zoom outside drag remains useful',JSON.stringify((await inspect(page)).camera)!==JSON.stringify(zoomBefore));
  await touchDrag(page,await inspect(page));
  check('Same forgiving snap succeeds at changed zoom',(await inspect(page)).session.completedStepIds.length===1);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await settle(page);
  s=await inspect(page);
  const touch=await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:s.stage.x,y:s.stage.y,id:1}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:s.target.x,y:s.target.y,id:1}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await touch.detach();await settle(page);
  check('Browser touch cancellation restores controls without placement',(await inspect(page)).stepId===s.stepId&&(await inspect(page)).controlsEnabled);
  await touchDrag(page,s,true);
  check('Touch invalid drop preserves progress',(await inspect(page)).stepId===s.stepId);
  await touchDrag(page,s);const placed=await inspect(page);
  await page.locator('.play-stage').dispatchEvent('pointerup',{pointerId:1,pointerType:'touch'});await settle(page);
  check('Repeated release cannot place a second part',(await inspect(page)).stepId===placed.stepId);
  await page.locator('.play-stage').tap();await page.locator('.play-target').tap();await settle(page);
  check('Tap-select and tap-destination accessible path', (await inspect(page)).session.completedStepIds.length===2);
  const kept=await inspect(page);
  await page.getByRole('button',{name:'Restart',exact:true}).click();
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();
  check('Restart confirmation cancellation preserves fitted set',setEquals((await inspect(page)).fitted,kept.fitted));
  await page.evaluate(()=>window.__playContext());
  await page.getByRole('button',{name:'Retry 3D',exact:true}).waitFor();
  check('Context loss disables placement',!(await inspect(page)).ready);
  await page.evaluate(()=>window.__playContext(true));await settle(page);
  check('Context restore preserves exact fitted set',setEquals((await inspect(page)).fitted,kept.fitted));
  await page.getByRole('button',{name:'Restart',exact:true}).click();
  await page.getByRole('button',{name:'Start again',exact:true}).click();await settle(page);
  check('Confirmed restart restores shared foundation',setEquals((await inspect(page)).fitted,manifest.initialLeafIds));
  await page.screenshot({path:path.join(out,'phone-390-first-part.png')});
  await page.getByRole('button',{name:'Levels',exact:true}).click();
  await page.getByRole('button',{name:'Choose level',exact:true}).click();
  await page.getByRole('button',{name:/^Easy\b/}).click();await settle(page);
  check('Changing level starts Easy with same shared foundation',(await inspect(page)).session.level==='easy'&&setEquals((await inspect(page)).fitted,manifest.initialLeafIds));
  await context.close();
  for(const variant of ['corrupt','incompatible','unavailable','assets']) {
    const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();
    if(variant==='corrupt'||variant==='incompatible')await c.addInitScript(({key,variant})=>localStorage.setItem(key,variant==='corrupt'?'bad-json':JSON.stringify({manifestVersion:'unknown',level:'easy',completedStepIds:[]})),{key:storageKey,variant});
    if(variant==='unavailable')await c.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Unavailable','SecurityError');}}));
    if(variant==='assets')await p.route('**/models/*catalog*',r=>r.abort());
    await p.goto(`${base}/play?inspect=1`,{waitUntil:'networkidle'});
    if(variant==='assets') {
      await p.getByRole('button',{name:'Retry 3D',exact:true}).waitFor({timeout:120000});
      check('Required catalog failure cannot start or complete play',await p.getByRole('button',{name:/^Easy\b/}).isDisabled());
      await p.unroute('**/models/*catalog*');await p.getByRole('button',{name:'Retry 3D',exact:true}).click();await settle(p);
      check('Required catalog retry restores all intended assets',(await inspect(p)).geometryCount===manifest.finalLeafIds.length);
    } else {
      await settle(p);
      check(`${variant} storage receives an honest message`,await p.getByText(variant==='unavailable'?/Saving is unavailable/:/previous session cannot be restored/).isVisible());
      await p.getByRole('button',{name:/^Easy\b/}).click();await settle(p);await mouseDrag(p,await inspect(p));
      check(`${variant} storage does not prevent play`,(await inspect(p)).session.completedStepIds.length===1);
    }
    await c.close();
  }
}
async function developmentSmoke() {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(String(e)));
  await start(page,'easy');await targetEvidence(page,'development direct route');
  await mouseDrag(page,await inspect(page));const before=await inspect(page);
  await page.reload({waitUntil:'networkidle'});await settle(page);
  await page.getByRole('button',{name:/^Continue /}).click();await settle(page);
  const after=await inspect(page);
  check('Development direct /play and refresh restore exact next step',after.stepId===before.stepId&&setEquals(after.fitted,before.fitted));
  await page.close();
}
try {
  if (mode === 'dev') await developmentSmoke();
  if (mode === 'home' || mode === 'all') await home();
  if (mode === 'easy' || mode === 'all') await traverse('easy',{width:1440,height:900});
  if (mode === 'hard' || mode === 'all') await traverse('hard',{width:390,height:844});
  if (mode === 'focused' || mode === 'all') await focused();
  check('No uncaught browser errors', report.errors.length===0, report.errors);
} catch (error) { report.failure=String(error); throw error; }
finally { report.finished=new Date().toISOString(); await save(); await browser.close(); }
