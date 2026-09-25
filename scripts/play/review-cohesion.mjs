/** Browser differential evidence. Gestures go through each route's real handlers. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.argv[2]||'http://127.0.0.1:4181';
const phase=process.argv[3]||'baseline';
const out=path.resolve('artifacts/browser/play-cohesion');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const report={base,phase,browser:browser.version(),started:new Date().toISOString(),routes:{},checks:[],errors:[]};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const manifest=JSON.parse(await fs.readFile(new URL('../../assets/authored/play-manifest.json',import.meta.url),'utf8'));
const first=manifest.levels.easy.steps[0];
const boxes=[...new Set([...first.focusLeafIds,...first.leafIds])].map(id=>manifest.targetBoundsWorldMm[id]);
const focus=Array.from({length:3},(_,axis)=>(Math.min(...boxes.map(b=>b[0][axis]))+Math.max(...boxes.map(b=>b[1][axis])))/2);
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const n=Math.hypot(...a);return a.map(x=>x/n);};
function projectFocus(s,width=1440,height=900){const f=norm(s.cameraTarget.map((x,i)=>x-s.camera[i])),r=norm(cross(f,s.cameraUp)),u=cross(r,f),v=focus.map((x,i)=>x-s.camera[i]),depth=dot(v,f),h=Math.tan(33*Math.PI/360);return {x:(1+dot(v,r)/(depth*h*width/height))*width/2,y:(1-dot(v,u)/(depth*h))*height/2};}
function checkFlipFraming(before,after,width=1440,height=900,label='desktop'){const a=projectFocus(before,width,height),b=projectFocus(after,width,height),drift=Math.hypot(a.x-b.x,a.y-b.y);report.checks.push({label,check:'Flip preserves projected assembly focus',before:a,after:b,drift});assert.ok(drift<2,`${label} flip moved assembly focus ${drift}px`);}

async function snapshot(page,route){return route==='play'?page.evaluate(()=>window.__playInspect()):JSON.parse(await page.locator('#benchmark-report').textContent());}
async function reset(page,route,side){
 if(route==='play'){
  await page.getByRole('button',{name:'Reframe',exact:true}).click();await wait(300);
  if((await snapshot(page,route)).side!==side)await page.getByRole('button',{name:'Flip',exact:true}).click();
 }else{
  await page.getByText('Inspection tools',{exact:true}).click();
  await page.getByRole('button',{name:side==='front'?'Front reference':'Back reference',exact:true}).click();
  await page.getByText('Inspection tools',{exact:true}).click();
 }
 await wait(2300);
 if(route==='home'){await page.getByRole('button',{name:'Reset view',exact:true}).click();await wait(1200);}
}
try{
 for(const route of ['home','play']){
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push({route,error:String(e)}));
  await page.goto(`${base}/${route==='play'?'play':''}?inspect=1`,{waitUntil:'networkidle'});
  if(route==='play'){await page.getByRole('button',{name:/^Easy\b/}).click();await page.waitForFunction(()=>window.__playInspect()?.ready);}
  else await page.locator('#benchmark-report').waitFor({state:'attached'});
  const rows=[];report.routes[route]={rows};
  for(const side of ['back','front']){
   await reset(page,route,side);
   await page.screenshot({path:path.join(out,`${phase}-${route}-${side}.png`)});
   const style=await page.evaluate(()=>{const app=document.querySelector('.play-app')||document.body;const s=getComputedStyle(app),heading=document.querySelector('.play-dock h1')||document.querySelector('.identity h1'),h=heading?getComputedStyle(heading):null;return {font:s.fontFamily,fontSize:s.fontSize,background:s.background,color:s.color,headingFont:h?.fontFamily,headingSize:h?.fontSize};});
   report.routes[route].style=style;
   for(const action of ['drag-right','drag-down','ArrowRight','ArrowDown','zoom-in','wheel-out','flip']){
    await reset(page,route,side);const before=await snapshot(page,route);
    if(action.startsWith('drag')){await page.mouse.move(1100,400);await page.mouse.down();await page.mouse.move(action==='drag-right'?1180:1100,action==='drag-down'?480:400,{steps:8});await page.mouse.up();}
    else if(action==='wheel-out'){await page.mouse.move(1100,400);await page.mouse.wheel(0,120);}
    else if(action==='flip')await page.getByRole('button',{name:route==='home'?'Flip movement':'Flip',exact:true}).click();
    else {await page.locator('canvas').first().focus();await page.keyboard.press(action==='zoom-in'?'+':action);}
    const samples=[];
    for(const ms of [0,100,350,1700]){if(ms)await wait(ms);samples.push(await snapshot(page,route));}
    const after=samples.at(-1),delta=after.camera.map((n,i)=>n-before.camera[i]);
    rows.push({side,action,before,after,delta,samples});
    if(route==='play'&&action==='flip'&&phase==='final')checkFlipFraming(before,after,1440,900,side);
    if(action==='drag-right'||action==='flip')await page.screenshot({path:path.join(out,`${phase}-${route}-${side}-${action}.png`)});
   }
  }
  await context.close();await fs.writeFile(path.join(out,`${phase}-report.json`),JSON.stringify(report,null,2));
 }
 if(phase==='final')for(const width of [390,320]){
  const page=await browser.newPage({viewport:{width,height:844}});await page.goto(`${base}/play?inspect=1`,{waitUntil:'networkidle'});await page.getByRole('button',{name:/^Easy\b/}).click();await wait(2300);
  for(const side of ['front','back']){const before=await snapshot(page,'play');await page.getByRole('button',{name:'Flip',exact:true}).click();await wait(1800);const after=await snapshot(page,'play');checkFlipFraming(before,after,width,844,`${width}px to ${side}`);await page.screenshot({path:path.join(out,`${phase}-play-${width}-${side}.png`)});}
  await page.close();
 }
 for(const side of ['back','front'])for(const action of ['drag-right','drag-down','ArrowRight','ArrowDown','zoom-in','wheel-out']){
  const home=report.routes.home.rows.find(r=>r.side===side&&r.action===action),play=report.routes.play.rows.find(r=>r.side===side&&r.action===action);
  const axis=action.includes('right')||action==='ArrowRight'?0:action.includes('down')||action==='ArrowDown'?1:2;
  const sameDirection=Math.sign(home.delta[axis])===Math.sign(play.delta[axis]);
  report.checks.push({side,action,axis,homeDelta:home.delta[axis],playDelta:play.delta[axis],sameDirection});
  if(phase!=='baseline')assert.ok(sameDirection,`${side} ${action} direction differs between routes`);
  if(phase!=='baseline'){
   const metrics=row=>{const target=s=>s.cameraTarget||s.target;const offset=s=>s.camera.map((x,i)=>x-target(s)[i]);const b=offset(row.before),a=offset(row.after),br=Math.hypot(...b),ar=Math.hypot(...a);return {ratio:ar/br,angle:Math.acos(Math.max(-1,Math.min(1,b.reduce((n,x,i)=>n+x*a[i],0)/(br*ar))))};};
   const h=metrics(home),p=metrics(play);report.checks.push({side,action,homeMetrics:h,playMetrics:p});
   if(action==='zoom-in'||action==='wheel-out')assert.ok(Math.abs(h.ratio-p.ratio)<0.015,`${side} ${action} zoom ratio differs`);
   if(action.startsWith('Arrow')||action.startsWith('drag'))assert.ok(Math.abs(h.angle-p.angle)<0.015,`${side} ${action} orbit angle differs`);
  }
 }
}catch(e){report.failure=String(e);throw e;}
finally{report.finished=new Date().toISOString();await fs.writeFile(path.join(out,`${phase}-report.json`),JSON.stringify(report,null,2));await browser.close();}
