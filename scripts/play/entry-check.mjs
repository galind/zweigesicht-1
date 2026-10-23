/** Entry and save safety must work with the production homepage entry hidden. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:4176';
const mode = process.argv[3] || 'production';
assert.ok(['production', 'preview'].includes(mode));
const out = path.resolve(process.env.PLAY_QA_OUTPUT || 'artifacts/browser/workshop-entry');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const report = { mode, checks: [], errors: [] };
const check = (name, pass) => {
  report.checks.push({ name, pass });
  assert.ok(pass, name);
};
const chooser = page => page.getByText('Choose how much of the movement you want to build.', { exact: true });
const saved = page => page.evaluate(() => localStorage.getItem('zweigesicht:play:session:v1'));
const ready = page => page.waitForFunction(() => window.__playInspect?.().ready, null, { timeout: 60000 });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
context.on('page', page => page.on('pageerror', error => report.errors.push(String(error))));
try {
  const home = await context.newPage();
  await home.goto(`${base}/?assemble=1`, { waitUntil: 'networkidle' });
  check('Homepage entry follows build policy', await home.locator('.assemble-trigger').count() === (mode === 'preview' ? 1 : 0));
  check('Homepage assemble query follows build policy', await chooser(home).isVisible() === (mode === 'preview'));
  await home.close();

  for (const route of ['/workshop', '/workshop?mode=expert', '/play']) {
    const page = await context.newPage();
    const models = [];
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/models/')) models.push(request.url()); });
    await page.goto(`${base}${route}`);
    await chooser(page).waitFor();
    check(`${route}: opens Workshop chooser`, new URL(page.url()).pathname === '/workshop');
    check(`${route}: defers geometry until a mode is chosen`, models.length === 0);
    check(`${route}: has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`${route}: focuses Easy for keyboard entry`, await page.getByRole('button', { name: /^Easy/ }).evaluate(button => button === document.activeElement));
    await page.close();
  }

  const page = await context.newPage();
  await page.goto(`${base}/workshop?inspect=1`);
  await chooser(page).waitFor();
  await page.getByRole('button', { name: /^Easy/ }).click();
  await page.waitForURL(url => url.pathname === '/workshop' && !url.searchParams.has('mode'));
  check('Easy chooser starts and saves a session', JSON.parse(await saved(page)).level === 'easy');
  // Inspection is opt-in; navigate without mutating the saved session.
  await page.goto(`${base}/workshop?inspect=1`);
  await ready(page);
  await page.locator('.play-card').first().click();
  await page.getByRole('button', { name: 'Show seat', exact: true }).click();
  await page.locator('.play-target').click();
  await page.waitForFunction(() => window.__playInspect().session.actionIds.length === 1);
  const progress = await saved(page);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Change difficulty', exact: true }).click();
  await chooser(page).waitFor();
  await page.keyboard.press('Escape');
  await chooser(page).waitFor({ state: 'hidden' });
  check('Cancelling the chooser preserves progress and returns focus', await saved(page) === progress && await page.getByRole('button', { name: 'View Easy progress' }).evaluate(button => button === document.activeElement));
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Change difficulty', exact: true }).click();
  await page.getByRole('button', { name: /^Hard/ }).click();
  await page.locator('dialog[open]').waitFor();
  check('Changing a progressed mode still requires confirmation', await saved(page) === progress);
  await page.getByRole('button', { name: 'Start Hard', exact: true }).click();
  check('Confirmed difficulty change starts Hard', JSON.parse(await saved(page)).level === 'hard');

  await page.evaluate(() => localStorage.setItem('zweigesicht:play:session:v1', '{broken'));
  await page.goto(`${base}/workshop?mode=easy`);
  await page.locator('dialog[open]').waitFor();
  await page.getByRole('button', { name: 'Return to chooser', exact: true }).click();
  await chooser(page).waitFor();
  check('Corrupt-save cancellation keeps the original data on Workshop', await saved(page) === '{broken' && new URL(page.url()).pathname === '/workshop');
  await page.locator('.assembly-chooser[data-open]:not([data-starting-style])').waitFor();
  await page.screenshot({ path: path.join(out, `chooser-${mode}.png`) });
  await page.keyboard.press('Escape');
  await page.waitForURL(url => url.pathname === '/');
  check('Closing a fresh chooser returns to the viewer', new URL(page.url()).pathname === '/');
  check('No uncaught browser errors', report.errors.length === 0);
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  await fs.writeFile(path.join(out, `entry-${mode}.json`), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(`PASS ${mode}: ${report.checks.length} Workshop entry checks`);
