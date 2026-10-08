import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { nitro } from 'nitro/vite';
import { defineConfig, type Plugin } from 'vite';
import { existsSync, createReadStream, statSync } from 'node:fs';
import { resolve } from 'node:path';
// Serve prepared, content-addressed CAD on loopback with real gzip transfer.
// This plugin has no remote storage, account, upload or publishing capability.
function localCad(): Plugin {
  const failedCases = new Set<string>();
  return {
    name: 'local-cad',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        if (
          !/^\/models\/(?:overview-[a-f0-9]{12}\.glb|catalog-[a-f0-9]{12}\.glb|diamond-[a-f0-9]{12}\.stl|finish-surfaces-[a-f0-9]{12}\.bin|(?:assembly-manifest|finish-surfaces)\.json)$/.test(
            pathname,
          )
        )
          return next();
        const path = resolve('public', '.' + pathname),
          referrer = new URL(req.headers.referer || '/', 'http://localhost'),
          delivery = referrer.searchParams.has('inspect')
            ? referrer.searchParams.get('delivery')
            : null,
          compressed =
            delivery !== 'slow' &&
            String(req.headers['accept-encoding']).includes('gzip') &&
            existsSync(path + '.gz');
        if (!existsSync(path)) return next();
        if (
          (delivery === 'failure' && pathname.includes('overview-')) ||
          (delivery === 'catalog-failure' && pathname.includes('catalog-')) ||
          (delivery === 'surface-failure' && pathname.endsWith('.bin')) ||
          (delivery === 'diamond-failure' && pathname.endsWith('.stl'))
        ) {
          const key = referrer.search;
          if (!failedCases.has(key)) {
            failedCases.add(key);
            res.statusCode = 503;
            res.end('Local inspection: first movement request fails');
            return;
          }
        }
        res.setHeader(
          'Content-Type',
          pathname.endsWith('.glb')
            ? 'model/gltf-binary'
            : /\.(bin|stl)$/.test(pathname)
              ? 'application/octet-stream'
              : 'application/json',
        );
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader(
          'Cache-Control',
          delivery
            ? 'no-store'
            : !pathname.endsWith('.json')
              ? 'private, max-age=31536000, immutable'
              : 'no-cache',
        );
        if (compressed) res.setHeader('Content-Encoding', 'gzip');
        // Opt-in loopback QA fixtures. Production requests keep the existing delivery.
        if (delivery === 'slow' && pathname.includes('overview-'))
          res.setHeader('Content-Length', statSync(path).size);
        const begin = () => {
          if (res.destroyed) return;
          const stream = createReadStream(path + (compressed ? '.gz' : ''), {
            highWaterMark: compressed ? 65536 : 131072,
          });
          let timer: ReturnType<typeof setTimeout>;
          res.on('close', () => {
            clearTimeout(timer);
            stream.destroy();
          });
          stream.on('error', () => res.destroy());
          if (
            ['slow', 'unknown'].includes(delivery ?? '') &&
            pathname.includes('overview-')
          ) {
            stream.on('data', (chunk) => {
              stream.pause();
              res.write(chunk);
              timer = setTimeout(() => stream.resume(), 180);
            });
            stream.on('end', () => res.end());
          } else stream.pipe(res);
        };
        if (
          (delivery === 'prepare' && pathname.endsWith('.bin')) ||
          (delivery === 'dial-slow' && pathname.includes('catalog-'))
        ) {
          const timer = setTimeout(begin, 6000);
          res.on('close', () => clearTimeout(timer));
        } else begin();
      });
    },
  };
}
export default defineConfig(() => ({
  // Workshop is discoverable in every build; deployment remains release-gated.
  // Vite supplies the same literal to the server and client.
  define: {
    __WORKSHOP_ENTRY_ENABLED__: JSON.stringify(true),
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    watch: { useFsEvents: false, usePolling: true },
  },
  plugins: [
    localCad(),
    vinext(),
    ...(process.env.NITRO_PRESET ? [nitro()] : []),
  ],
}));
