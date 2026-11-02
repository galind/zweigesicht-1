/** GitHub-runner-only prototype interactions. No screenshot or CAD publication. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Use GitHub CI, not the owner’s computer.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const server = spawn('npm', ['--prefix', 'explorer', 'run', 'dev'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', (chunk) => { logs = (logs + chunk).slice(-12000); });
let browser;
const saveKey = 'zweigesicht:watchmaker:chapter-1:v1';
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch('http://127.0.0.1:4173/workshop/prototype')).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 320 ? 740 : 900 }, hasTouch: width < 600, isMobile: width < 600 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(({ key }) => localStorage.setItem(key, 'chapter-save-must-remain-byte-identical'), { key: saveKey });
    await page.goto('http://127.0.0.1:4173/workshop/prototype');
    const button = (name) => page.getByRole('button', { name, exact: true });
    const root = page.locator('.watchmaker-prototype');
    await button('Parts').waitFor();
    await page.waitForFunction(() => !document.querySelector('.prototype-actions button').disabled, { timeout: 90000 });
    const state = async () => ({ cursor: await root.getAttribute('data-cursor'), mistakes: await root.getAttribute('data-mistakes') });
    assert.deepEqual(await state(), { cursor: '7', mistakes: '0' });
    await button('Separate stem').click(); await button('Movement').click();
    assert.deepEqual(await state(), { cursor: '7', mistakes: '0' }, 'View switching must not perform operations');
    await button('Parts').click();
    await page.getByRole('searchbox', { name: 'Search parts' }).fill('coupling');
    assert.equal(await page.locator('[data-item]').count(), 2);
    await page.getByRole('searchbox', { name: 'Search parts' }).fill('');
    assert.equal(await page.locator('[data-item]').count(), 9);
    assert.equal(await page.locator('[data-item="mainplate"]').isDisabled(), true);
    assert.ok(await page.locator('[data-item="wheel"] img').evaluate((image) => image.src.startsWith('data:image/png') && image.naturalWidth > 0));
    // Keyboard selection, cancellation, and keyboard destination all use real controls.
    await page.locator('[data-item="wheel"]').focus(); await page.keyboard.press('Enter');
    await button('Cancel placement').waitFor(); await page.keyboard.press('Escape');
    assert.deepEqual(await state(), { cursor: '7', mistakes: '0' });
    await button('Placement setup').click(); await button('tweezers').click(); await button('Done').click();
    const select = async (item) => {
      await button('Parts').click();
      await page.locator(`[data-item="${item}"]`).focus(); await page.keyboard.press('Enter');
      await button('Cancel placement').waitFor();
    };
    await select('bridge'); await button('Place on stem').click();
    assert.deepEqual(await state(), { cursor: '7', mistakes: '1' }, 'Wrong selected part reaches validator');
    await button('Cancel placement').click();
    await select('wheel'); await button('Place on movement').click();
    assert.deepEqual(await state(), { cursor: '7', mistakes: '2' }, 'Wrong explicit destination reaches validator');
    await button('Cancel placement').click(); await button('Separate stem').click();
    // Native pointer/touch drag, not DOM-dispatched pointer events.
    await button('Parts').click();
    const box = await page.locator('[data-item="wheel"]').boundingBox();
    const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const cdp = width < 600 ? await context.newCDPSession(page) : null;
    const down = async () => cdp ? cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] }) : (await page.mouse.move(start.x, start.y), page.mouse.down());
    const move = async (point) => cdp ? cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, id: 1 }] }) : page.mouse.move(point.x, point.y);
    const up = async () => cdp ? cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) : page.mouse.up();
    await down();
    await page.waitForFunction(() => !document.querySelector('.prototype-panel') || document.querySelector('.prototype-panel').hasAttribute('data-ending-style'));
    const target = await page.locator('.prototype-seat').boundingBox();
    const end = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    await move({ x: start.x + 10, y: start.y - 20 }); await move(end); await up();
    await page.waitForFunction(() => document.querySelector('.watchmaker-prototype').dataset.cursor === '8');
    await select('coupling');
    if (width < 600) await button('Place on stem').tap();
    else { await button('Place on stem').focus(); await page.keyboard.press('Enter'); }
    await page.waitForFunction(() => document.querySelector('.watchmaker-prototype').dataset.cursor === '9');
    assert.match(await page.getByRole('status').innerText(), /Prototype complete/);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), saveKey), 'chapter-save-must-remain-byte-identical');
    const surface = await page.locator('.prototype-surface').boundingBox();
    assert.ok(surface.height >= 240, `Useful assembly height at ${width}: ${surface.height}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    assert.deepEqual(errors, []);
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.watchmaker-prototype')?.dataset.cursor === '7');
    console.log(JSON.stringify({ width, status: 'passed', surfaceHeight: surface.height, saveUnchanged: true }));
    await context.close();
  }
} catch (error) { console.error(logs); throw error; }
finally { await browser?.close(); try { process.kill(-server.pid, 'SIGTERM'); } catch {} }
