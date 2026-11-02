/** GitHub-runner-only workshop interactions. No screenshot or CAD publication. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Use GitHub CI, not the owner’s computer.');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const server = spawn('npm', ['--prefix', 'explorer', 'run', 'dev'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', (chunk) => { logs = (logs + chunk).slice(-12000); });
let browser, activePage;
const saveKey = 'zweigesicht:watchmaker:chapter-1:v1';
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch('http://127.0.0.1:4173/workshop')).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 320 ? 740 : 900 }, hasTouch: width < 600, isMobile: width < 600 });
    const page = await context.newPage();
    activePage = page;
    await page.addInitScript(() => {
      window.__workshopInput = [];
      for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'gotpointercapture', 'lostpointercapture']) window.addEventListener(type, (event) => window.__workshopInput.push({ type, x: event.clientX, y: event.clientY, target: event.target?.closest('[data-item]')?.dataset.item ?? event.target?.className, pointerType: event.pointerType }), true);
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(({ key }) => localStorage.setItem(key, 'chapter-save-must-remain-byte-identical'), { key: saveKey });
    await page.goto('http://127.0.0.1:4173/workshop');
    const button = (name) => page.getByRole('button', { name, exact: true });
    const root = page.locator('.watchmaker-workshop');
    await button('Parts').waitFor();
    await page.waitForFunction(() => !document.querySelector('.workshop-actions button').disabled, null, { timeout: 90000 });
    const state = async () => ({ cursor: await root.getAttribute('data-cursor'), mistakes: await root.getAttribute('data-mistakes') });
    assert.deepEqual(await state(), { cursor: '12', mistakes: '0' });
    assert.equal(await button('Separate stem').count(), 0);
    assert.equal(await button('Place on stem').count(), 0);
    assert.equal(await button('Resume chapter').count(), 0);
    await button('Parts').click();
    await page.getByRole('searchbox', { name: 'Search parts' }).fill('winding-bridge screw');
    assert.equal(await page.locator('[data-item]').count(), 2);
    await page.getByRole('searchbox', { name: 'Search parts' }).fill('');
    assert.equal(await page.locator('[data-item]').count(), 9);
    await page.getByRole('navigation', { name: 'Part groups' }).getByRole('button', { name: 'available', exact: true }).click();
    assert.equal(await page.locator('[data-item]').count(), 3);
    await page.getByRole('navigation', { name: 'Part groups' }).getByRole('button', { name: 'installed', exact: true }).click();
    assert.equal(await page.locator('[data-item]').count(), 6);
    await button('All parts').click();
    assert.equal(await page.locator('[data-item="mainplate"]').isDisabled(), true);
    assert.ok(await page.locator('[data-item="bridge"] img').evaluate((image) => image.src.startsWith('data:image/png') && image.naturalWidth > 0));
    // Keyboard selection, cancellation, and keyboard destination all use real controls.
    await page.locator('[data-item="bridge"]').focus(); await page.keyboard.press('Enter');
    await button('Cancel placement').waitFor(); await page.keyboard.press('Escape');
    assert.deepEqual(await state(), { cursor: '12', mistakes: '0' });
    assert.equal(await page.getByRole('button', { name: /hands|tweezers|screwdriver|choose tool/i }).count(), 0);
    // Complete all three placements without opening setup or selecting any tool.
    const select = async (item) => {
      await button('Parts').click();
      await page.locator(`[data-item="${item}"]`).focus(); await page.keyboard.press('Enter');
      await button('Cancel placement').waitFor();
    };
    await select('bridge-screw-1'); await button('Place on movement').click();
    assert.deepEqual(await state(), { cursor: '12', mistakes: '1' }, 'Wrong selected part reaches validator');
    await button('Cancel placement').click();
    // Native pointer/touch cancellation and placement; never synthetic DOM events.
    const cdp = width < 600 ? await context.newCDPSession(page) : null;
    for (const cancelled of [true, false]) {
      await button('Parts').click();
      await page.locator('[data-item="bridge"]').scrollIntoViewIfNeeded();
      const box = await page.locator('[data-item="bridge"]').boundingBox();
      const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-item]')?.dataset.item, start), 'bridge', 'The real preview must receive the initial contact');
      if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
      else { await page.mouse.move(start.x, start.y); await page.mouse.down(); }
      await page.locator('.workshop-panel').waitFor({ state: 'hidden' });
      const target = await page.locator('.workshop-seat').boundingBox();
      const end = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
      const move = async (point) => cdp ? cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, id: 1 }] }) : page.mouse.move(point.x, point.y);
      await move({ x: start.x + 10, y: start.y - 20 }); await move(end);
      if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: cancelled ? 'touchCancel' : 'touchEnd', touchPoints: [] });
      else { if (cancelled) await page.keyboard.press('Escape'); await page.mouse.up(); }
      if (cancelled) {
        await button('Cancel placement').waitFor({ state: 'hidden' });
        assert.deepEqual(await state(), { cursor: '12', mistakes: '1' }, 'Cancelled drag never scores');
      } else await page.waitForFunction(() => document.querySelector('.watchmaker-workshop').dataset.cursor === '13');
    }
    await select('bridge-screw-1');
    if (width < 600) await button('Place on movement').tap();
    else { await button('Place on movement').focus(); await page.keyboard.press('Enter'); }
    await page.waitForFunction(() => document.querySelector('.watchmaker-workshop').dataset.cursor === '14');
    await select('bridge-screw-2');
    if (width < 600) await button('Place on movement').tap();
    else { await button('Place on movement').focus(); await page.keyboard.press('Enter'); }
    await page.waitForFunction(() => document.querySelector('.watchmaker-workshop').dataset.cursor === '15');
    assert.match(await page.getByRole('status').innerText(), /Practice complete/);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), saveKey), 'chapter-save-must-remain-byte-identical');
    const surface = await page.locator('.workshop-surface').boundingBox();
    assert.ok(surface.height >= 240, `Useful assembly height at ${width}: ${surface.height}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    assert.deepEqual(errors, []);
    await button('Reset practice').click();
    await page.waitForFunction(() => document.querySelector('.watchmaker-workshop')?.dataset.cursor === '12');
    for (const path of ['/workshop/prototype', '/workshop/assembly', '/workshop?mode=easy', '/workshop?mode=hard']) {
      await page.goto('http://127.0.0.1:4173' + path);
      await page.waitForFunction(() => document.querySelector('.watchmaker-workshop')?.dataset.cursor === '12');
      assert.equal(new URL(page.url()).pathname, '/workshop');
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), saveKey), 'chapter-save-must-remain-byte-identical');
    }
    console.log(JSON.stringify({ width, status: 'passed', surfaceHeight: surface.height, saveUnchanged: true }));
    await context.close();
  }
} catch (error) { console.error(logs); if (activePage && !activePage.isClosed()) { console.error(await activePage.locator('body').innerText()); console.error(await activePage.evaluate(() => window.__workshopInput)); } throw error; }
finally { await browser?.close(); try { process.kill(-server.pid, 'SIGTERM'); } catch {} }
