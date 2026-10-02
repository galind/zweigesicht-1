/** Interaction, camera, storage, rendering and responsive checks for nonlinear Play. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import manifest from '../../assets/authored/play-manifest.json' with {type:'json'};
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base=process.argv[2]??'http://127.0.0.1:4180',out=path.resolve(process.env.PLAY_QA_OUTPUT??'artifacts/browser/play-redesign');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
const page=await context.newPage();const report={base,checks:[],errors:[],camera:[]};page.on('pageerror',e=>report.errors.push(String(e)));
const check=(name,ok,details)=>{report.checks.push({name,pass:!!ok,details});assert.ok(ok,name)};
const inspect=()=>page.evaluate(()=>window.__playInspect());
const settle=()=>page.waitForFunction(()=>{const s=window.__playInspect?.();return s?.ready&&!s.busy&&!s.dragging&&!s.scheduledFrame;},null,{timeout:60000});
const pose=s=>[...s.camera,...s.cameraTarget,...s.cameraUp,...s.projection];
const preserved=(name,a,b)=>{const drift=Math.max(...pose(a).map((v,i)=>Math.abs(v-pose(b)[i])));report.camera.push({name,before:pose(a),after:pose(b),maxDrift:drift});check(name,drift<1e-8,{maxDrift:drift});};
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const card=id=>page.locator(`[data-action-id="${id}"]`);
const pick=async id=>{await card(id).click();await settle();};
const reveal=async()=>{await page.getByRole('button',{name:'Show seat',exact:true}).click();await settle();};
const drag=async(s,target=s.target,offset={x:0,y:0},finish=true)=>{await page.locator('.play-card-drag').scrollIntoViewIfNeeded();s={...s,stage:(await inspect()).stage};await page.mouse.move(s.stage.x+offset.x,s.stage.y+offset.y);await page.mouse.down();await page.mouse.move(target.x+offset.x,target.y+offset.y,{steps:6});if(finish){await page.mouse.up();await settle();}};
const touch=async(from,to,cancel=false)=>{const cdp=await context.newCDPSession(page),pts=p=>[{x:p.x,y:p.y,id:1}];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts(from)});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts({x:from.x+(to.x-from.x)*i/6,y:from.y+(to.y-from.y)*i/6})});await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await cdp.detach();await settle();};
const start=async level=>{await page.goto(`${base}/workshop?mode=${level}&inspect=1`,{waitUntil:'networkidle'});if(await page.locator('dialog[open]').count())await page.getByRole('button',{name:`Start ${level==='easy'?'Easy':'Hard'}`,exact:true}).click();await settle();};
try {
 await start('easy');const initial=await inspect();
 check('Ready now starts with 19 legal Easy choices',await page.locator('.play-card').count()===19&&await page.locator('.play-card:disabled').count()===0&&await page.locator('.play-card[data-unavailable=true]').count()===0);
 await page.getByText('All parts',{exact:true}).click();await settle();
 check('All parts keeps all 89 Easy actions inspectable',await page.locator('.play-card').count()===89);
 await pick('movement-60');preserved('Selecting unavailable bridge preserves camera',initial,await inspect());
 check('Unavailable work has no destination and cannot be dragged',await page.locator('.play-target').isHidden()&&await page.locator('.play-card-drag').isDisabled());
 let s=await inspect();check('Unavailable copy points back to Ready now',/waiting for earlier work/.test(await page.locator('.play-selection').innerText()));preserved('Unavailable selection preserves camera',s,await inspect());
 check('Unavailable inventory remains keyboard inspectable',await card('movement-60').isEnabled());
 await card('movement-60').focus();await page.keyboard.press('Enter');
 await page.screenshot({path:path.join(out,'phone-easy-all-parts.png')});
 await pick('movement-1');s=await inspect();
 check('Available selection has no cue until Show seat',await page.locator('.play-target').isHidden());
 await drag(s,{x:25,y:100});preserved('Missed destination preserves camera',s,await inspect());check('Missed drop leaves progress unchanged',!(await inspect()).session.actionIds.length);
 await drag(await inspect(),{x:250,y:180},{x:0,y:0},false);await page.keyboard.press('Escape');await page.mouse.up();await settle();check('Escape cancels mouse capture',!(await inspect()).dragging&&!(await inspect()).session.actionIds.length);
 s=await inspect();await touch(s.stage,{x:260,y:170},true);check('Touch cancellation leaves no placement',!(await inspect()).session.actionIds.length);preserved('Touch cancellation preserves camera',s,await inspect());
 s=await inspect();const scroll=await page.locator('.play-gallery').evaluate(e=>e.scrollLeft);await drag(s,s.target,{x:18,y:-12});check('Mouse drop with grab offset commits once',(await inspect()).session.actionIds.length===1);preserved('Successful placement preserves camera',s,await inspect());
 check('Placement preserves gallery position',Math.abs(await page.locator('.play-gallery').evaluate(e=>e.scrollLeft)-scroll)<1);
 check('Placement does not choose another item',!(await inspect()).stepId&&(await inspect()).selection==='movement-1');
 s=await inspect();await page.getByRole('button',{name:'Undo',exact:true}).click();await settle();preserved('Undo preserves camera',s,await inspect());
 const rect=await page.locator('.play-gallery').boundingBox();await touch({x:rect.x+rect.width-30,y:rect.y+40},{x:rect.x+30,y:rect.y+40});check('Gallery swipe browses without placing',await page.locator('.play-gallery').evaluate(e=>e.scrollLeft)>scroll&&!(await inspect()).session.actionIds.length);
 s=await inspect();await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByLabel('Find a part',{exact:true}).fill('Barrel');preserved('Search preserves camera',s,await inspect());check('Search filters labels without readiness',await page.locator('.play-card').count()>=3);await page.getByLabel('Find a part',{exact:true}).fill('');await page.keyboard.press('Escape');
 await pick('movement-2');await reveal();s=await inspect();await page.locator('.play-target').focus();await page.keyboard.press('Enter');await settle();check('Show seat permits keyboard placement',(await inspect()).session.actionIds.includes('movement-2'));preserved('Keyboard placement preserves camera',s,await inspect());
 await pick('movement-1');await reveal();s=await inspect();await touch(s.stage,s.target);check('Touch drop commits once',(await inspect()).session.actionIds.length===2);preserved('Touch placement preserves camera',s,await inspect());
 await pick('movement-60');check('Bridge becomes available after both barrels',await card('movement-60').getAttribute('data-unavailable')==='false');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await settle();check('Undo recomputes bridge availability',await card('movement-60').getAttribute('data-unavailable')==='true');
 // The canvas orbits freely; keyboard shortcuts and selection preserve that view.
 s=await inspect();await page.mouse.move(195,220);await page.mouse.down();await page.mouse.move(245,255,{steps:6});await page.mouse.up();await settle();const orbited=await inspect();check('Pointer drag freely orbits the movement',Math.max(...pose(s).map((v,i)=>Math.abs(v-pose(orbited)[i])))>.01);s=orbited;await page.locator('canvas').focus();await page.keyboard.press('ArrowRight');await settle();preserved('Arrow keys leave the orbit unchanged',s,await inspect());await page.keyboard.press('+');await settle();
 s=await inspect();await page.mouse.move(200,260);await page.mouse.down({button:'right'});await page.mouse.move(225,278,{steps:5});await page.mouse.up({button:'right'});await settle();preserved('Right dragging cannot pan the orbit view',s,await inspect());s=await inspect();
 await pick('movement-3');preserved('Selection preserves free orbit and zoom',s,await inspect());
 const fitted=await inspect();const materials=JSON.stringify(fitted.materials);
 for(let i=0;i<4;i++) {await page.getByRole('button',{name:'Flip movement',exact:true}).click();await settle();const orbit=await inspect();check(`Flip ${i+1}: fitted meshes and materials stable`,same(orbit.visible,fitted.fitted)&&JSON.stringify(orbit.materials)===materials);}
 await page.getByRole('button',{name:'Reset view',exact:true}).click();await settle();
 s=await inspect();check('Reset recentres immutable mainplate',Math.hypot(s.mainplateCenter.x-s.frameRegion.left-s.frameRegion.width/2,s.mainplateCenter.y-(s.frameRegion.top+s.frameRegion.bottom)/2)<.01);
 await page.getByRole('button',{name:'Flip movement',exact:true}).click();await settle();const flipped=await inspect();check('Flip preserves projected mainplate centre',Math.hypot(flipped.mainplateCenter.x-s.mainplateCenter.x,flipped.mainplateCenter.y-s.mainplateCenter.y)<.01);
 // Resume a nonlinear history without changing its committed action order.
 s=await inspect();await page.reload({waitUntil:'networkidle'});await settle();check('Nonlinear resume restores exact history',JSON.stringify((await inspect()).session)===JSON.stringify(s.session));
 await page.evaluate(()=>window.__playContext());await page.waitForFunction(()=>!window.__playInspect().ready);await page.evaluate(()=>window.__playContext(true));await settle();check('Renderer recovery preserves nonlinear session',JSON.stringify((await inspect()).session)===JSON.stringify(s.session));
 await start('hard');await page.locator('canvas').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('-');await settle();const main=await inspect();
 check('Hard watch level exposes three ready subassembly projects',await page.locator('[data-packet-id]').count()===3);
 await page.locator('[data-packet-id="movement-1"]').click();await settle();await pick(manifest.levels.hard.steps[0].id);check('Workbench is an explicit labelled view',(await inspect()).workspace==='movement-1'&&/Workbench/.test(await page.locator('.play-workspace').innerText()));
 await page.screenshot({path:path.join(out,'phone-hard-workbench.png')});
 await page.getByRole('button',{name:'Return to watch',exact:true}).first().click();await settle();preserved('Returning restores previous main camera exactly',main,await inspect());
 await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByLabel('Parts group',{exact:true}).selectOption('train');preserved('Hard group browsing preserves camera',main,await inspect());
 await page.getByLabel('Parts group',{exact:true}).selectOption('power');await page.keyboard.press('Escape');await page.screenshot({path:path.join(out,'phone-hard-inventory-on.png')});
 // Responsive visual/geometry review, including root text enlargement.
 for(const [width,height,text] of [[1440,900,100],[390,844,100],[320,568,100],[320,568,200],[568,320,100]]) {
   const resizeBefore=await inspect();
   await page.setViewportSize({width,height});await settle();
   const resizeAfter=await inspect();
   check(`${width}×${height} resize preserves camera direction, pan and distance`,Math.max(...[...resizeBefore.camera,...resizeBefore.cameraTarget,...resizeBefore.cameraUp].map((n,i)=>Math.abs(n-[...resizeAfter.camera,...resizeAfter.cameraTarget,...resizeAfter.cameraUp][i])))<1e-8);
   if(text===200)await page.goto(`${base}/workshop?inspect=1&text=200`,{waitUntil:'networkidle'});
   else if(page.url().includes('text=200'))await page.goto(`${base}/workshop?inspect=1`,{waitUntil:'networkidle'});
   await settle();
   await page.getByRole('button',{name:'Reset view',exact:true}).click();await settle();
   await page.locator('.play-dock').evaluate(e=>e.scrollTop=0);
   const view=await inspect();check(`${width}×${height}/${text}% mainplate centered`,Math.hypot(view.mainplateCenter.x-view.frameRegion.left-view.frameRegion.width/2,view.mainplateCenter.y-(view.frameRegion.top+view.frameRegion.bottom)/2)<.01);
   check(`${width}×${height}/${text}% no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   check(`${width}×${height}/${text}% header stays inside viewport`,await page.locator('.play-heading button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0})));
   const cardLayout=await page.locator('.play-card, .play-project').first().evaluate(e=>{const r=e.getBoundingClientRect(),content=[...e.children].map(child=>child.getBoundingClientRect());return {inside:content.every(child=>child.top>=r.top&&child.bottom<=r.bottom),cardBottom:r.bottom};});
   const detailTop=await page.locator('.play-selection').evaluate(e=>e.getBoundingClientRect().top);
   check(`${width}×${height}/${text}% card content stays inside gallery, above details`,cardLayout.inside&&cardLayout.cardBottom<=detailTop,{cardLayout,detailTop});
   const railLayout=await page.locator('.play-dock').evaluate(e=>{const dock=e.getBoundingClientRect(),footer=e.querySelector('.play-rail-footer').getBoundingClientRect(),selection=e.querySelector('.play-selection').getBoundingClientRect(),actions=e.querySelector('.play-actions').getBoundingClientRect(),buttons=[...e.querySelectorAll('.play-actions button')].map(button=>button.getBoundingClientRect()),compact=innerWidth<=420||(innerHeight<=600&&innerWidth/innerHeight>=4/3);return {horizontal:[footer,selection,actions,...buttons].every(r=>r.left>=dock.left-1&&r.right<=dock.right+1),stacked:!compact||(selection.width>=footer.width-1&&actions.width>=footer.width-1&&selection.bottom<=actions.top+1),buttonsInside:buttons.every(r=>r.top>=dock.top&&r.bottom<=dock.bottom)};});
   check(`${width}×${height}/${text}% rail details and actions stay readable`,railLayout.horizontal&&(text!==100||railLayout.stacked&&railLayout.buttonsInside),railLayout);
   await page.screenshot({path:path.join(out,`hard-${width}-${height}-text${text}.png`)});
   await page.getByRole('button',{name:'Reset view',exact:true}).focus();check(`${width}×${height}/${text}% keyboard reaches last dock control`,await page.getByRole('button',{name:'Reset view',exact:true}).evaluate(e=>e===document.activeElement));
 }
 await page.waitForTimeout(400);const count=(await inspect()).renderCount;await page.waitForTimeout(700);check('Settled renderer returns to idle',(await inspect()).renderCount===count);
 const old=JSON.stringify({manifestVersion:'play-3',level:'easy',completedStepIds:['movement-1']});await page.evaluate(raw=>localStorage.setItem('zweigesicht:play:session:v1',raw),old);
 await page.goto(`${base}/workshop?mode=easy&inspect=1`,{waitUntil:'networkidle'});check('Legacy save receives explicit incompatibility message',/incompatible/.test(await page.locator('.play-storage').innerText()));check('Legacy save remains intact before explicit replacement',await page.evaluate(()=>localStorage.getItem('zweigesicht:play:session:v1'))===old);
 check('Replacing old save requires explicit confirmation',await page.locator('dialog').isVisible());await page.getByRole('button',{name:'Return to chooser',exact:true}).click();await page.waitForURL(/assemble=1|\/$/);check('Cancelling replacement retains original save',await page.evaluate(()=>localStorage.getItem('zweigesicht:play:session:v1'))===old);
 await page.goto(`${base}/workshop?mode=easy&no3d=1`,{waitUntil:'networkidle'});check('No-3D failure offers retry',await page.getByRole('button',{name:'Retry 3D',exact:true}).isVisible());
 const loadingContext=await browser.newContext({viewport:{width:390,height:844}}),loadingPage=await loadingContext.newPage();await loadingPage.route('**/models/catalog-*.glb*',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.continue();});await loadingPage.goto(`${base}/workshop?mode=easy&text=200`,{waitUntil:'domcontentloaded'});await loadingPage.locator('.movement-loader').waitFor({state:'visible'});const loadingLayout=await loadingPage.locator('.movement-loader').evaluate(e=>{const mark=e.querySelector('.movement-loader-mark').getBoundingClientRect(),label=e.querySelector('.movement-loader-label').getBoundingClientRect();return {markBottom:mark.bottom,labelTop:label.top,gap:label.top-mark.bottom};});check('200% loading label stays clear of the gg mark',loadingLayout.gap>=4,loadingLayout);await loadingPage.screenshot({path:path.join(out,'loading-text200.png')});await loadingContext.close();
 // Required asset retry and unavailable storage use fresh contexts; never fake fitted progress.
 const retryContext=await browser.newContext({viewport:{width:390,height:844}});const retryPage=await retryContext.newPage();retryPage.on('pageerror',e=>report.errors.push(String(e)));
 let failAssets=true;await retryPage.route('**/models/catalog-*.glb*',route=>failAssets?route.abort():route.continue());
 await retryPage.goto(`${base}/workshop?mode=easy&inspect=1`);if(await retryPage.locator('dialog[open]').count())await retryPage.getByRole('button',{name:'Start Easy',exact:true}).click();await retryPage.getByRole('button',{name:'Retry 3D',exact:true}).waitFor({timeout:60000});
 check('Incomplete catalog disables assembly controls',await retryPage.locator('.play-actions button').evaluateAll(buttons=>buttons.length>0&&buttons.every(button=>button.disabled)));
 failAssets=false;await retryPage.getByRole('button',{name:'Retry 3D',exact:true}).click();await retryPage.waitForFunction(()=>window.__playInspect?.().ready,null,{timeout:60000});
 check('Asset retry prepares the full inventory',(await retryPage.evaluate(()=>window.__playInspect())).geometryCount===265);await retryContext.close();
 const blocked=await browser.newContext({viewport:{width:390,height:844}});await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked for QA')}}));
 const blockedPage=await blocked.newPage();await blockedPage.goto(`${base}/workshop?mode=easy&inspect=1`);await blockedPage.waitForFunction(()=>window.__playInspect?.().ready,null,{timeout:60000});
 check('Storage failure permits play with honest feedback',/unavailable/.test(await blockedPage.locator('.play-storage').innerText())&&blockedPage.url().includes('mode=easy'));await blocked.close();
 const corrupt=await browser.newContext({viewport:{width:390,height:844}});await corrupt.addInitScript(()=>localStorage.setItem('zweigesicht:play:session:v1','{broken'));const corruptPage=await corrupt.newPage();await corruptPage.goto(`${base}/workshop?mode=hard&inspect=1`);await corruptPage.locator('dialog[open]').waitFor();check('Corrupt save requires replacement confirmation',/damaged/.test(await corruptPage.locator('#play-confirm-description').innerText())&&await corruptPage.evaluate(()=>localStorage.getItem('zweigesicht:play:session:v1'))==='{broken');await corruptPage.getByRole('button',{name:'Start Hard',exact:true}).click();await corruptPage.waitForFunction(()=>window.__playInspect?.().ready,null,{timeout:60000});check('Confirmed corrupt replacement starts selected mode',(await corruptPage.evaluate(()=>window.__playInspect())).session.level==='hard');await corrupt.close();
 for(const suffix of ['', '?mode=expert']) {const direct=await browser.newContext({viewport:{width:390,height:844}}),directPage=await direct.newPage();await directPage.goto(`${base}/workshop${suffix}`);await directPage.waitForURL(url=>url.pathname==='/'&&!url.searchParams.has('assemble'));check(`${suffix?'Invalid mode':'Missing mode'} without a save returns to the homepage chooser`,await directPage.getByText('Choose how much of the movement you want to build.',{exact:true}).isVisible());await direct.close();}
 check('No uncaught browser errors',report.errors.length===0,report.errors);console.log(`${report.checks.length} focused checks passed`);
} catch(error){report.failure=String(error);console.error(error);await page.screenshot({path:path.join(out,'focused-failure.png')});process.exitCode=1;}
finally{await fs.writeFile(path.join(out,'focused-redesign-report.json'),JSON.stringify(report,null,2));await browser.close();}
