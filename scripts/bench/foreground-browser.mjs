/** Isolated Chrome process, no Playwright focus/visibility emulation.
 * A separate CDP session cannot disable overrides owned by Playwright's session.
 * Connect to a locally launched browser with noDefaults and use its default context.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
export async function launchBenchBrowser(
  chromium,
  { width = 1440, height = 900, dpr = 2, headless = false } = {},
) {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'bench-chrome-'));
  const child = spawn(
    process.env.CHROME_PATH || chromium.executablePath(),
    [
      ...(headless ? ['--headless=new'] : []),
      '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1',
      '--user-data-dir=' + profile,
      '--no-first-run',
      '--enable-automation',
      '--no-default-browser-check',
      '--window-position=0,0',
      `--window-size=${width},${height + 90}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  let launchError;
  child.on('error', (error) => {
    launchError = error;
  });
  let browser;
  const close = async () => {
    await browser?.close().catch(() => {});
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      const exited = new Promise((resolve) => child.once('exit', resolve));
      child.kill('SIGTERM');
      await exited;
    }
    await fs.rm(profile, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  };
  try {
    let port;
    for (let i = 0; i < 150; i++) {
      if (launchError) throw launchError;
      if (child.exitCode !== null)
        throw Error('Chrome exited before CDP was ready');
      try {
        port = (
          await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')
        ).split('\n')[0];
      } catch {
        /* startup */
      }
      if (port) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!port) throw Error('Chrome CDP startup timed out');
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, {
      noDefaults: true,
    });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());
    await page.setViewportSize({ width, height });
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: false,
    });
    // Keep startup settling identical in both modes; headed Chrome may show UI.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.bringToFront();
    return { browser, context, page, close };
  } catch (error) {
    await close();
    throw error;
  }
}

// Existing native interaction/lifecycle runners continue to open a real window.
export function launchForeground(chromium, options = {}) {
  return launchBenchBrowser(chromium, { ...options, headless: false });
}
