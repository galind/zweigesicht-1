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
  await page.screenshot({ path: path.join(out, 'homepage-after.png') });
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
