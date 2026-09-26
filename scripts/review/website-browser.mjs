/** Comparable production route/layout evidence. Diagnostics are never used to advance play.
 * readyMsIncludingNetworkIdle is a navigation/network-idle/start observation,
 * not a load-to-interactive benchmark. RAF counts measure callback scheduling,
 * not GPU draws. Each route metric uses a fresh browser context.
 * WEBSITE_QA_VIEWS optionally reruns comma-separated layouts into an existing report.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:4183';
const phase = process.argv[3] || 'baseline';
if (!['baseline', 'final'].includes(phase)) throw new Error('Expected baseline or final');
const out = path.resolve(process.env.WEBSITE_QA_OUTPUT || 'artifacts/browser/website-review');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({headless: true, ...(process.env.CHROME_PATH ? {executablePath: process.env.CHROME_PATH} : {})});
const previous = process.env.WEBSITE_QA_VIEWS ? JSON.parse(await fs.readFile(path.join(out, `${phase}-website-report.json`), 'utf8')) : null;
const report = previous || {base, phase, browser: browser.version(), started: new Date().toISOString(), metrics: [], layouts: [], checks: [], errors: []};
const check = (name, pass, detail) => {report.checks=report.checks.filter(c=>c.name!==name);report.checks.push({name, pass: Boolean(pass), detail});};
const save = () => fs.writeFile(path.join(out, `${phase}-website-report.json`), JSON.stringify(report, null, 2));
const pause = (page, ms=1800) => page.waitForTimeout(ms);
const overlaps = (a,b) => a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
async function pageFor(viewport, storage=false) {
  const context = await browser.newContext({viewport, reducedMotion:'reduce', hasTouch:true});
  await context.addInitScript(({storage}) => {
    window.__reviewRafCallbacks = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => raf(time => { window.__reviewRafCallbacks++; callback(time); });
    if (storage) Object.defineProperty(Storage.prototype, 'setItem', {value() {throw new DOMException('Review unavailable storage', 'QuotaExceededError');}});
  }, {storage});
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(String(error)));
  return {context,page};
}
async function geometry(page) {
  return page.evaluate(() => {
    const rect = el => {if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const stage=document.querySelector('.play-stage'), target=document.querySelector('.play-target');
    return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,url:location.href,rootFont:getComputedStyle(document.documentElement).fontSize,appFont:document.querySelector('.play-app')?getComputedStyle(document.querySelector('.play-app')).fontSize:null,
      dock:rect(document.querySelector('.play-dock')),storage:rect(document.querySelector('.play-storage')),caption:rect(document.querySelector('.play-stage-caption')),stage:rect(stage),target:rect(target),headerItems:[...document.querySelectorAll('.play-heading > *')].filter(el=>el.getClientRects().length).map(rect),
      stageHit:stage?document.elementFromPoint(rect(stage).left+rect(stage).width/2,rect(stage).top+rect(stage).height/2)?.closest('.play-stage')===stage:null,
      targetHit:target?document.elementFromPoint(rect(target).left+rect(target).width/2,rect(target).top+rect(target).height/2)?.closest('.play-target')===target:null,
      focus:{tag:document.activeElement?.tagName,label:document.activeElement?.getAttribute('aria-label'),text:document.activeElement?.textContent?.slice(0,100)},
      buttons:[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>({label:b.getAttribute('aria-label')||b.textContent?.trim(),...rect(b)}))};
  });
}
async function start(page, route, suffix='') {
  const routeSuffix = route==='play'
    ? `/workshop?mode=easy${suffix ? `&${suffix.replace(/^\?/, '')}` : ''}`
    : `/${suffix}`;
  await page.goto(`${base}${routeSuffix}`, {waitUntil:'networkidle'});
  if(route==='home') await page.getByRole('button',{name:'Disassemble',exact:true}).waitFor();
  await pause(page,2500);
}
try {
  for(const route of process.env.WEBSITE_QA_VIEWS ? [] : ['home','play']) {
    const {context,page}=await pageFor({width:1440,height:900});
    const bodies=[]; const requested=[];
    page.on('request',r=>requested.push({url:r.url(),type:r.resourceType()}));
    page.on('response',r=>{if(r.request().resourceType()==='script')bodies.push(r.text().catch(()=>''));});
    const began=Date.now();await start(page,route); const readyMs=Date.now()-began-2500;
    const before=await page.evaluate(()=>window.__reviewRafCallbacks);await pause(page,1000);
    const metric=await page.evaluate(()=>({rafCallbacks:window.__reviewRafCallbacks,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,initiator:r.initiatorType,transfer:r.transferSize,encoded:r.encodedBodySize,decoded:r.decodedBodySize,duration:r.duration})),navigation:performance.getEntriesByType('navigation').map(n=>({domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd,transfer:n.transferSize,encoded:n.encodedBodySize}))}));
    metric.route=route;metric.readyMsIncludingNetworkIdle=readyMs;metric.idleRafCallbacks=metric.rafCallbacks-before;metric.requestCount=requested.length;metric.encodedBytes=metric.resources.reduce((s,r)=>s+r.encoded,0);metric.transferBytes=metric.resources.reduce((s,r)=>s+r.transfer,0);metric.jsEncodedBytes=metric.resources.filter(r=>/\.js(?:[?#]|$)/.test(r.url)).reduce((s,r)=>s+r.encoded,0);report.metrics.push(metric);
    const scripts=await Promise.all(bodies);
    check(`${route} ordinary route has no diagnostics function`,await page.evaluate(()=>!window.__playInspect));
    check(`${route} has no idle RAF callbacks`,metric.idleRafCallbacks===0,metric.idleRafCallbacks);
    if(route==='home'){check('Home scripts exclude Play payload',!scripts.some(b=>b.includes('zweigesicht:play:session:v1')||b.includes('foundationRootId')));check('Home scripts exclude optional benchmark',!scripts.some(b=>b.includes('visibleFrameTimeMs')||b.includes('Desktop in-app browser, real rendered frames')));}
    await page.screenshot({path:path.join(out,`${phase}-${route}-desktop.png`)});
    if(phase==='final'&&route==='home') {
      const canvas=page.locator('canvas').first();let previous=await canvas.screenshot();
      for(const action of ['orbit','flip','reset']) {
        if(action==='reset'){await canvas.focus();await page.keyboard.press('ArrowLeft');await pause(page,500);previous=await canvas.screenshot();}
        const frameBefore=await page.evaluate(()=>window.__reviewRafCallbacks);
        if(action==='orbit'){await canvas.focus();await page.keyboard.press('ArrowRight');}
        else await page.getByRole('button',{name:action==='flip'?'Flip movement':'Reset view',exact:true}).click();
        await pause(page,1500);const frameAfter=await page.evaluate(()=>window.__reviewRafCallbacks),current=await canvas.screenshot();
        check(`Home ${action} wakes rendering and changes canvas`,frameAfter>frameBefore&&!current.equals(previous),{frameBefore,frameAfter});previous=current;
        await page.screenshot({path:path.join(out,`final-home-wake-${action}.png`)});
        await pause(page,1000);check(`Home ${action} settles without RAF callbacks`,await page.evaluate(()=>window.__reviewRafCallbacks)===frameAfter);
      }
    }
    await context.close();await save();
  }
  if(phase==='final') {
    const {context,page}=await pageFor({width:1440,height:900});
    await page.goto(`${base}/?no3d=1`,{waitUntil:'networkidle'});
    check('No3D fallback explains section descriptions and retry',await page.getByText('Explore the section descriptions, or retry the interactive view.',{exact:true}).isVisible());
    const focus=page.getByRole('button',{name:'Focus',exact:true});await focus.focus();await page.keyboard.press('Enter');
    const group=page.locator('.explore-menu .menu-link').nth(1);await group.focus();await page.keyboard.press('Enter');
    const details=page.getByRole('button',{name:'Details',exact:true});await details.focus();await page.keyboard.press('Enter');await pause(page,250);
    check('No3D section description remains available through keyboard',await page.locator('#component-details').isVisible()&&(await page.locator('#component-details').innerText()).length>80);
    await page.screenshot({path:path.join(out,'final-home-no3d-description.png')});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.textContent==='Details',null,{timeout:1000});check('No3D description dismissal returns focus',await details.evaluate(el=>el===document.activeElement));
    await page.getByRole('button',{name:'Retry 3D',exact:true}).click();await page.waitForURL(url=>!url.searchParams.has('no3d'));await page.locator('.fallback').waitFor({state:'hidden'});check('No3D Retry loads interactive canvas',await page.locator('canvas').count()===1);
    await context.close();
  }
  if(phase==='final') {
    const {context,page}=await pageFor({width:1440,height:900});
    const asset='**/models/overview-*.glb';await page.route(asset,route=>route.fulfill({status:503,body:'Expected review required-asset failure'}));
    await page.goto(`${base}/`,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Retry 3D',exact:true}).waitFor();
    check('Required homepage asset failure offers visible retry',await page.getByRole('button',{name:'Retry 3D',exact:true}).isVisible());
    await page.screenshot({path:path.join(out,'final-home-required-asset-failure.png')});
    await page.unroute(asset);await page.getByRole('button',{name:'Retry 3D',exact:true}).click();await page.locator('.fallback').waitFor({state:'hidden'});await pause(page,1500);
    check('Required homepage asset retry restores controls',await page.getByRole('button',{name:'Disassemble',exact:true}).isEnabled());
    const callbacks=await page.evaluate(()=>window.__reviewRafCallbacks);await pause(page,1000);check('Required homepage asset recovery returns to idle',callbacks===await page.evaluate(()=>window.__reviewRafCallbacks));
    await page.screenshot({path:path.join(out,'final-home-required-asset-recovered.png')});await context.close();
  }
  const views=[{name:'390',width:390,height:844},{name:'320',width:320,height:740},{name:'short',width:320,height:568},{name:'short-text200',width:320,height:568,text:true},{name:'small-landscape',width:568,height:320},{name:'small-landscape-text200',width:568,height:320,text:true},{name:'landscape',width:844,height:390},{name:'320-text200',width:320,height:740,text:true},{name:'landscape-text200',width:844,height:390,text:true}];
  for(const route of ['home','play'])for(const view of views.filter(v=>!process.env.WEBSITE_QA_VIEWS||process.env.WEBSITE_QA_VIEWS.split(',').includes(v.name))) {
    const {context,page}=await pageFor({width:view.width,height:view.height});await start(page,route);
    if(view.text) {await page.evaluate(()=>document.documentElement.style.fontSize='200%');await pause(page,500);}
    const layout=await geometry(page);report.layouts=report.layouts.filter(l=>!(l.route===route&&l.view===view.name));report.layouts.push({route,view:view.name,...layout});check(`${route} ${view.name} no horizontal overflow`,layout.scrollWidth<=layout.width);
    const fragmentedWords=await page.evaluate(()=>[...document.querySelectorAll('button')].flatMap(button=>{const words=[],walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))for(const match of node.textContent.matchAll(/\S+/g)){const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);if([...range.getClientRects()].filter(r=>r.width&&r.height).length>1)words.push(match[0]);}return words;}));
    check(`${route} ${view.name} control words stay readable`,fragmentedWords.length===0,fragmentedWords);
    if(route==='play') {check(`Play ${view.name} stage and target hit accessible`,layout.stageHit&&layout.targetHit,layout);check(`Play ${view.name} caption clears dock`,layout.caption?.bottom<=layout.dock?.top||layout.caption?.right<=layout.dock?.left||layout.caption?.left>=layout.dock?.right,layout);}
    if(route==='play') {
      check(`Play ${view.name} stage target and caption inside viewport`,[layout.stage,layout.target,layout.caption].every(r=>r.left>=0&&r.top>=0&&r.right<=layout.width&&r.bottom<=layout.height),layout);
      check(`Play ${view.name} placement regions clear header`,[layout.stage,layout.target,layout.caption].every(r=>layout.headerItems.every(h=>!overlaps(r,h))),layout);
      check(`Play ${view.name} storage text clears dock`,!overlaps(layout.storage,layout.dock),layout);
    }
    await page.screenshot({path:path.join(out,`${phase}-${route}-${view.name}.png`)});
    if(route==='play')for(const button of await page.locator('.play-actions button').all()) {
      await button.scrollIntoViewIfNeeded();
      const accessible=await button.evaluate(b=>{const r=b.getBoundingClientRect(),d=document.querySelector('.play-dock').getBoundingClientRect();return {label:b.getAttribute('aria-label')||b.textContent,visible:r.left>=d.left&&r.right<=d.right&&r.top>=d.top&&r.bottom<=d.bottom+1,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('button')===b};});
      check(`Play ${view.name} ${accessible.label} reachable by scroll`,accessible.visible&&accessible.hit,accessible);
    }
    if(route==='play'&&view.name==='landscape-text200') {try {await page.getByRole('button',{name:'How to play',exact:true}).click({timeout:1500});check('Landscape enlarged Help receives pointer input',true);}catch(error){check('Landscape enlarged Help receives pointer input',false,String(error));await page.getByRole('button',{name:'How to play',exact:true}).focus();await page.keyboard.press('Enter');}await pause(page,500);await page.screenshot({path:path.join(out,`${phase}-play-help-landscape-text200.png`)});await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.textContent==='How to play',{},{timeout:1000}).catch(()=>{});check('Landscape help Escape restores trigger',await page.getByRole('button',{name:'How to play',exact:true}).evaluate(el=>el===document.activeElement));}
    await context.close();await save();
  }
  {
    const {context,page}=await pageFor({width:320,height:740},true);await start(page,'play');await page.evaluate(()=>document.documentElement.style.fontSize='200%');await pause(page,500);
    const layout=await geometry(page);report.layouts=report.layouts.filter(l=>!(l.route==='play'&&l.view==='storage-text200'));report.layouts.push({route:'play',view:'storage-text200',...layout});check('Storage warning clears dock',layout.storage.top>=layout.dock.bottom,layout);await page.screenshot({path:path.join(out,`${phase}-play-storage-text200.png`)});await context.close();
  }
  {
    const {context,page}=await pageFor({width:1440,height:900});await start(page,'play');
    await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Change difficulty',exact:true}).click();await pause(page,300);
    check('Change difficulty returns to the homepage chooser',new URL(page.url()).pathname==='/'&&await page.getByText('Choose how much of the movement you want to build.',{exact:true}).isVisible());await context.close();
  }
  {
    const {context,page}=await pageFor({width:390,height:844});
    await page.goto(`${base}/workshop?mode=easy&text=200`,{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'How to play',exact:true}).click();await pause(page,300);
    const fonts=await page.evaluate(()=>({url:location.href,root:getComputedStyle(document.documentElement).fontSize,app:getComputedStyle(document.querySelector('.play-app')).fontSize,help:getComputedStyle(document.querySelector('.play-help-copy')).fontSize}));
    await page.goto(`${base}/workshop`,{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'How to play',exact:true}).click();await pause(page,300);
    const normal=await page.evaluate(()=>({root:getComputedStyle(document.documentElement).fontSize,app:getComputedStyle(document.querySelector('.play-app')).fontSize,help:getComputedStyle(document.querySelector('.play-help-copy')).fontSize}));
    check('Text query scales app and portal consistently',['root','app','help'].every(k=>parseFloat(fonts[k])===2*parseFloat(normal[k])),{enlarged:fonts,normal});
    await context.close();
  }
  if(phase==='final') {
    const {context,page}=await pageFor({width:320,height:740});await start(page,'home','?text=200');
    const layout=await geometry(page);check('Homepage text query sets 200% root size',layout.rootFont==='32px',layout.rootFont);
    const controls=await page.locator('.action-dock button').evaluateAll(buttons=>buttons.filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect();return {label:b.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,overflow:b.scrollWidth>b.clientWidth};}));
    check('Homepage text query controls fit and remain full-sized',controls.every(c=>c.left>=0&&c.right<=320&&c.top>=0&&c.bottom<=740&&c.width>=44&&c.height>=44&&!c.overflow),controls);
    await page.screenshot({path:path.join(out,'final-home-query-text200.png')});await context.close();
  }
  {
    const {context,page}=await pageFor({width:390,height:844});await start(page,'play');
    check('Starting assembly focuses staged part',await page.locator('.play-stage').evaluate(el=>el===document.activeElement));
    await page.locator('.play-stage').focus();await page.keyboard.press('Enter');await page.locator('.play-target').focus();await page.keyboard.press('Enter');await pause(page,700);
    check('Keyboard placement focuses next staged part',await page.locator('.play-stage').evaluate(el=>el===document.activeElement));
    await page.reload({waitUntil:'networkidle'});await pause(page,1800);
    check('Saved Workshop resumes without an entry chooser',await page.locator('.play-choice').count()===0);
    await context.close();
  }
  if(phase==='final')for(const route of ['home','play'])for(const view of [{name:'portrait',width:390,height:844,insets:{top:44,bottom:34,left:0,right:0}},{name:'landscape',width:844,height:390,insets:{top:0,bottom:21,left:44,right:44}}]) {
    const {context,page}=await pageFor({width:view.width,height:view.height});
    const cdp=await context.newCDPSession(page);
    await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:view.insets});
    await start(page,route);
    const evidence=await page.evaluate(()=>{const probe=document.createElement('div');probe.style.cssText='position:fixed;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';document.body.append(probe);const c=getComputedStyle(probe),result={top:parseFloat(c.paddingTop),right:parseFloat(c.paddingRight),bottom:parseFloat(c.paddingBottom),left:parseFloat(c.paddingLeft)};probe.remove();return result;});
    check(`${route} ${view.name} safe-area environment overridden`,Object.entries(view.insets).every(([k,v])=>evidence[k]===v),evidence);
    const layout=await geometry(page);report.layouts=report.layouts.filter(l=>!(l.route===route&&l.view===`safe-${view.name}`));report.layouts.push({route,view:`safe-${view.name}`,insets:view.insets,...layout});
    const relevant=route==='play'?[...layout.headerItems,layout.dock,layout.storage,layout.stage,layout.target,layout.caption]:layout.buttons;
    check(`${route} ${view.name} visible regions clear safe area`,relevant.every(r=>r.left>=view.insets.left&&r.right<=view.width-view.insets.right&&r.top>=view.insets.top&&r.bottom<=view.height-view.insets.bottom),layout);
    await page.screenshot({path:path.join(out,`${phase}-${route}-safe-${view.name}.png`)});
    if(route==='play')for(const button of await page.locator('.play-actions button').all()) {
      await button.scrollIntoViewIfNeeded();
      const bounds=await button.evaluate(b=>{const r=b.getBoundingClientRect(),d=document.querySelector('.play-dock').getBoundingClientRect();return {label:b.getAttribute('aria-label')||b.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,visible:r.top>=d.top&&r.bottom<=d.bottom+1,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('button')===b};});
      check(`Play safe ${view.name} ${bounds.label} scroll-reachable within insets`,bounds.visible&&bounds.hit&&bounds.left>=view.insets.left&&bounds.right<=view.width-view.insets.right&&bounds.top>=view.insets.top&&bounds.bottom<=view.height-view.insets.bottom,bounds);
    }
    await context.close();
  }
  check('No uncaught browser errors',report.errors.length===0,report.errors);
} finally {await save();await browser.close();}
console.log(JSON.stringify({phase,metrics:report.metrics.map(({resources,...m})=>m),checks:report.checks.length,failures:report.checks.filter(c=>!c.pass),errors:report.errors},null,2));
if(phase==='final'&&report.checks.some(c=>!c.pass))process.exitCode=1;
