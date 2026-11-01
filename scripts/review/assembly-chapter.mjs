/** GitHub-runner-only integration check. No assets/screenshots are uploaded or published. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import * as THREE from '../../explorer/node_modules/three/build/three.module.js';
import holders from '../../assets/source-manifest/holder-runtime.json' with { type: 'json' };

assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Run this check on GitHub CI, not the owner’s computer.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const directory = new URL('../../explorer/public/bench-local/', import.meta.url);
await fs.mkdir(directory, { recursive: true });
for (const file of holders.files) {
  // Reuse only the previously approved runtime delivery; no new original CAD downloads.
  const response = await fetch(`https://zweigesicht-uat.vercel.app/bench-local/${file.name}`, {
    redirect: 'error', signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${file.name} unavailable from existing UAT delivery`);
  const data = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(data).digest('hex'), file.sha256);
  await fs.writeFile(new URL(file.name, directory), data);
}
const server = spawn('npm', ['--prefix', 'explorer', 'run', 'dev'], { stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { log = (log + chunk).slice(-15000); });
let browser;
try {
  const base = 'http://127.0.0.1:4173';
  let online = false;
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(base, { signal: AbortSignal.timeout(2000) })).ok) { online = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(online, log);
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text())) errors.push(message.text()); });
  await page.goto(`${base}/workshop/assembly`);
  await page.getByRole('button', { name: 'Start chapter', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('zweigesicht:play:session:v1', 'legacy sentinel'));
  const key = 'zweigesicht:watchmaker:chapter-1:v1';
  const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  const waitCursor = cursor => page.waitForFunction(({ key, cursor }) => JSON.parse(localStorage.getItem(key))?.cursor === cursor, { key, cursor });
  const part = name => page.locator('.assembly-part').filter({ has: page.locator('span', { hasText: new RegExp(`^${name}$`) }) });

  // First action is a real pointer drag. Cancelled preview is free.
  await page.getByRole('button', { name: 'Hands', exact: true }).click();
  const support = part('Movement-side support');
  const box = await support.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + 30, box.y - 20, { steps: 5 });
  await page.keyboard.press('Escape'); await page.mouse.up();
  assert.equal((await saved()).cursor, 0);
  assert.equal((await saved()).mistakes, 0);
  const surface = await page.locator('.assembly-surface').boundingBox();
  const halfWidth = Math.max(78, 54 * surface.width / surface.height);
  const halfHeight = halfWidth * surface.height / surface.width;
  const camera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, .1, 500);
  camera.position.set(0, 150, 58); camera.lookAt(0, 5, 0); camera.updateMatrixWorld(true);
  const target = new THREE.Vector3(0, 0, 0).project(camera);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(surface.x + (target.x + 1) * surface.width / 2, surface.y + (1 - target.y) * surface.height / 2, { steps: 15 });
  await page.mouse.up(); await waitCursor(1);
  console.log('Real support drag, cancelled drag and 5 mm world-space seat passed.');

  await page.locator('.assembly-review summary').click();
  const place = async (name, tool, destination, side = 'movement', support = 'movement') => {
    await part(name).click();
    await page.getByRole('button', { name: tool, exact: true }).click();
    await page.getByLabel('Placement / turn side').selectOption(side);
    await page.locator(`input[name="assembly-support"]`).nth(support === 'movement' ? 0 : 1).check();
    await page.getByLabel('Destination', { exact: true }).selectOption(destination);
    await page.getByRole('button', { name: 'Place selected part at seat', exact: true }).click();
  };
  await place('Prepared mainplate', 'Hands', 'work'); await waitCursor(2);
  await place('Setting-lever screw', 'Hands', 'movement');
  await page.getByRole('status').filter({ hasText: 'Use screwdriver' }).waitFor();
  assert.equal((await saved()).mistakes, 1);
  await place('Setting-lever screw', 'Screwdriver', 'movement'); await waitCursor(3);
  await page.getByRole('button', { name: 'Undo', exact: true }).click(); await waitCursor(2);
  await place('Setting-lever screw', 'Screwdriver', 'movement'); await waitCursor(3);
  assert.equal((await saved()).awarded, 3);
  await page.getByRole('button', { name: 'Hands', exact: true }).click();
  await page.getByLabel('Placement / turn side').selectOption('dial');
  await page.locator('input[name="assembly-support"]').nth(1).check();
  await page.getByRole('button', { name: 'Turn & exchange support', exact: true }).click(); await waitCursor(4);
  await place('Pinned setting lever', 'Tweezers', 'movement', 'dial', 'dial'); await waitCursor(5);
  await place('Movement assembly', 'Hands', 'movement-rest', 'dial', 'dial'); await waitCursor(6);
  await place('Winding stem', 'Tweezers', 'work'); await waitCursor(7);
  await place('Coupling wheel', 'Tweezers', 'stem'); await waitCursor(8);
  await place('Sliding coupling', 'Tweezers', 'stem'); await waitCursor(9);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const beforePause = (await saved()).elapsedMs;
  await page.waitForTimeout(1250);
  assert.equal((await saved()).elapsedMs, beforePause);
  await page.reload();
  await page.getByRole('button', { name: 'Resume chapter', exact: true }).click();
  await page.locator('.assembly-review summary').click();
  assert.equal((await saved()).cursor, 9);
  await place('Stem assembly', 'Tweezers', 'stem-rest'); await waitCursor(10);
  await place('Movement assembly', 'Hands', 'work'); await waitCursor(11);
  await place('Stem assembly', 'Tweezers', 'movement'); await waitCursor(12);
  await place('Pinned winding bridge', 'Tweezers', 'movement'); await waitCursor(13);
  await place('Winding-bridge screw 1', 'Screwdriver', 'movement'); await waitCursor(14);
  await place('Winding-bridge screw 2', 'Screwdriver', 'movement'); await waitCursor(15);
  await page.getByRole('heading', { name: 'The winding bridge is installed.', exact: true }).waitFor();
  const final = await saved();
  assert.equal(final.awarded * 10 - final.mistakes * 2, 148);
  assert.equal(await page.evaluate(() => localStorage.getItem('zweigesicht:play:session:v1')), 'legacy sentinel');
  assert.deepEqual(errors, []);
  await page.waitForTimeout(1250);
  assert.equal((await saved()).elapsedMs, final.elapsedMs);
  console.log('All 15 operations, wrong-tool feedback, Undo without repeated reward, pause/reload/resume, completion and legacy-save isolation passed.');

  // Missing holder must fail closed, retain the completed save, and recover on retry.
  await page.route('**/bench-local/dial.glb', route => route.fulfill({ status: 404, body: '' }));
  await page.reload();
  await page.getByText('The surface could not load', { exact: true }).waitFor();
  assert.equal((await saved()).cursor, 15);
  await page.unroute('**/bench-local/dial.glb');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByText('The surface could not load', { exact: true }).waitFor({ state: 'hidden' });
  console.log('Required-holder failure and Retry preserve chapter completion.');
} catch (error) {
  console.error(log);
  throw error;
} finally {
  await browser?.close(); server.kill('SIGTERM');
}
