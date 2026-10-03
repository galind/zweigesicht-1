/** Run the opt-in explorer suites against a prepared production preview. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:4183';
const suites = process.argv.slice(3);
if (!suites.length) suites.push('watch', 'dial', 'inventory', 'camera', 'interaction', 'explosion', 'disassembly transitions', 'capture', 'benchmark');
const labels = {
  watch: 'Run watch checks', dial: 'Run dial checks', inventory: 'Run inventory checks',
  camera: 'Run camera checks', interaction: 'Run interaction checks', explosion: 'Run explosion checks',
  'disassembly transitions': 'Run disassembly transitions', disassembly: 'Run disassembly review',
  capture: 'Record flip', benchmark: 'Benchmark 60 seconds',
};
const out = path.resolve(process.env.PLAY_QA_OUTPUT || 'artifacts/browser/website-review/final');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const report = { base, started: new Date().toISOString(), suites: [], errors: [] };
try {
  for (const suite of suites) {
    assert.ok(labels[suite], `Unknown suite: ${suite}`);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', error => report.errors.push(String(error)));
    await page.goto(`${base}/?inspect=1`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Disassemble', exact: true }).waitFor();
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Disassemble');
      return button && !button.disabled;
    });
    await page.getByText('Inspection tools', { exact: true }).click();
    await page.getByRole('button', { name: labels[suite], exact: true }).click();
    if (suite === 'capture' || suite === 'benchmark') {
      const selector = suite === 'capture' ? '#motion-report' : '#benchmark-report';
      await page.waitForFunction(({ selector, suite }) => {
        const text = document.querySelector(selector)?.textContent;
        if (!text) return false;
        const value = JSON.parse(text);
        return suite === 'capture' ? value?.frames?.length > 0 : value?.elapsedMs >= 60000;
      }, { selector, suite }, { timeout: 90000 });
      const result = JSON.parse(await page.locator(selector).textContent());
      if (suite === 'capture') result.frames = result.frames.map(({ ms }) => ({ ms }));
      assert.ok(suite === 'capture' ? result.frames.length > 10 : result.phases.every(phase => phase.samples > 0), `${suite} sampled actual animation frames`);
      report.suites.push({ suite, result });
      console.log(`${suite}: completed with actual frame samples`);
      await page.close();
      continue;
    }
    await page.waitForFunction(() => {
      const text = document.querySelector('#qa-report')?.textContent;
      if (!text) return false;
      const value = JSON.parse(text);
      return value && !value.running;
    }, null, { timeout: 300000 });
    const result = JSON.parse(await page.locator('#qa-report').innerText());
    const checks = Array.isArray(result) ? result : result.checks;
    report.suites.push({ suite, result });
    assert.ok(checks?.length && checks.every(check => check.pass), `${suite}: ${JSON.stringify(result)}`);
    console.log(`${suite}: ${checks.length} checks passed`);
    await page.close();
  }
  assert.deepEqual(report.errors, [], 'No uncaught browser errors');
} finally {
  await fs.writeFile(path.join(out, 'explorer-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
