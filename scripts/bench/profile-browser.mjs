/** Shared profiler settings and evidence metadata; never enables focus emulation. */
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchBenchBrowser } from './foreground-browser.mjs';

export function profileBrowserMode(env = process.env) {
  const mode = env.BENCH_BROWSER || 'headless';
  if (!['headless', 'headed'].includes(mode))
    throw Error('BENCH_BROWSER must be headless or headed');
  return mode;
}

export async function launchProfileBrowser(chromium) {
  const executionMode = profileBrowserMode();
  const session = await launchBenchBrowser(chromium, {
    width: 2400,
    height: 1300,
    dpr: 2,
    headless: executionMode === 'headless',
  });
  return { ...session, executionMode };
}

export async function profileEnvironment(page, browser, executionMode, base) {
  const git = (...args) => {
    try {
      return execFileSync('git', args, {
        cwd: fileURLToPath(new URL('../../', import.meta.url)),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return null;
    }
  };
  return {
    recordedAt: new Date().toISOString(),
    executionMode,
    browserVersion: browser.version(),
    focusEmulation: false,
    focusMeaning:
      executionMode === 'headed'
        ? 'Native window focus/visibility; rejected if lost during sampling.'
        : 'Headless document state only; not native foreground or display evidence.',
    host: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      memoryBytes: os.totalmem(),
    },
    harnessRevision: git('rev-parse', 'HEAD'),
    harnessDirty: ((status) => (status === null ? null : status !== ''))(
      git('status', '--porcelain'),
    ),
    server: {
      url: base,
      // A different revision/server may be under test. Never infer it from harness HEAD.
      revision: process.env.PROFILE_REVISION || null,
      build: process.env.PROFILE_BUILD || 'unspecified',
      provenance:
        'Server revision/build are supplied by the caller, not detected.',
    },
    cache: 'Fresh browser profile/process; existing OS/driver cache.',
    throttling: 'No CPU/GPU throttling requested by this runner.',
    ...(await page.evaluate(() => {
      const b = window.bench;
      const gl = b.renderer.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
      return {
        userAgent: navigator.userAgent,
        viewport: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
        gpu,
        gpuVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
        softwareRendererDetected: gpu
          ? /swiftshader|llvmpipe|softpipe|software/i.test(gpu)
          : null,
        webglVersion: gl.getParameter(gl.VERSION),
        gpuTimerAvailable: !!gl.getExtension('EXT_disjoint_timer_query_webgl2'),
        initialQuality: b.status.quality,
        initialRenderRatio: b.renderer.getPixelRatio(),
        transmissionScale: b.renderer.transmissionResolutionScale,
        programsAfterReady: b.renderer.info.programs?.length,
        focused: document.hasFocus(),
        hidden: document.hidden,
      };
    })),
  };
}
