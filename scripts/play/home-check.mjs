/** Local browser QA. No state/step mutation shortcuts. Set PLAYWRIGHT_MODULE if
 * Playwright is not installed locally; CHROME_PATH selects an existing browser. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const supplied = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(supplied ? pathToFileURL(supplied).href : 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:4180';
const mode = 'home';
assert.ok(['all','easy','hard','focused','home','dev','controls','dialogs'].includes(mode), 'Unknown browser-check mode');
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
  const trigger=page.getByRole('button',{name:'Be a watchmaker',exact:true});
  check('Homepage exposes the assembly action',await trigger.isVisible());
  await trigger.click();
  check('Mode popup has final copy',await page.getByText('Choose how much of the movement you want to build.',{exact:true}).isVisible()&&await page.getByText('89 prepared fits · Best for a first build',{exact:true}).isVisible()&&await page.getByText('249 individual parts · 35 subassemblies',{exact:true}).isVisible()&&await page.getByText('Progress is saved on this device.',{exact:true}).isVisible());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  check('Escape closes chooser and restores trigger focus',await trigger.evaluate(element=>element===document.activeElement));
  for(const width of [390,320]) {
    await page.setViewportSize({width,height:width===390?844:740});
    check(`${width}px homepage keeps the watchmaker label`,await trigger.isVisible()&&await trigger.innerText()==='Be a watchmaker');
    check(`${width}px homepage has no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.goto(`${base}/?assemble=1`,{waitUntil:'networkidle'});
  check('assemble query opens chooser and is removed',await page.getByText('Choose how much of the movement you want to build.',{exact:true}).isVisible()&&!new URL(page.url()).searchParams.has('assemble'));
  await page.screenshot({ path: path.join(out, 'homepage-after.png') });
  for(const level of ['easy','hard']) {
    const navigation=await browser.newPage({viewport:{width:1440,height:900}});
    await navigation.goto(`${base}/`,{waitUntil:'networkidle'});
    await navigation.getByRole('button',{name:'Be a watchmaker',exact:true}).click();
    await navigation.getByRole('button',{name:new RegExp(`^${level==='easy'?'Easy':'Hard'}`)}).click();
    await navigation.waitForURL(new RegExp(`/workshop(?:\\?|$)`));
    check(`${level} chooser navigates to Workshop`,navigation.url().includes(`/workshop?mode=${level}`)||navigation.url().endsWith('/workshop'));
    await navigation.close();
  }
  await page.goto(`${base}/?inspect=1`, { waitUntil:'networkidle' });
  await page.getByText('Inspection tools', {exact:true}).click();
  await page.getByRole('button',{name:'Run UX checks',exact:true}).click();
  await page.waitForFunction(() => {const s=document.querySelector('#qa-report')?.textContent; return s && s !== 'null' && !s.includes('"running": true');}, null, {timeout:180000});
  const qa=JSON.parse(await page.locator('#qa-report').innerText());
  check('Existing homepage UX suite', Array.isArray(qa) && qa.length > 0 && qa.every(c=>c.pass), qa);
  await page.close();
}

try { await home(); check('No uncaught browser errors', report.errors.length===0, report.errors); }
catch(error) { report.failure=String(error); throw error; }
finally { report.finished=new Date().toISOString(); await save(); await browser.close(); }
