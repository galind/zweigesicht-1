/** Read-only maximal-obstruction audit. Run on a local /workshop?mode=easy&inspect=1 preview. */
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.argv[2]??'http://127.0.0.1:4185';
const output=path.resolve(process.env.PLAY_QA_OUTPUT??'artifacts/browser/play-redesign');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
 const page=await browser.newPage();await page.goto(`${base}/workshop?mode=easy&inspect=1`);
 await page.waitForFunction(()=>window.__playInspect?.().ready,null,{timeout:60000});
 const results=await page.evaluate(()=>window.__playAccessAudit());
 await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'access-audit.json'),JSON.stringify(results,null,2));
 const failed=results.filter(r=>!r.pass);console.log(JSON.stringify({actions:results.length,failed},null,2));if(failed.length)process.exitCode=1;
} finally {await browser.close();}
