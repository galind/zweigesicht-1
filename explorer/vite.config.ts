import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, type Plugin } from 'vite';
import { existsSync, createReadStream } from 'node:fs';
import { resolve } from 'node:path';
// Serve prepared, content-addressed CAD on loopback with real gzip transfer.
// This plugin has no remote storage, account, upload or publishing capability.
function localCad(): Plugin {
  return {
    name: 'local-cad',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        if (
          !/^\/models\/(?:overview-[a-f0-9]{12}\.glb|catalog-[a-f0-9]{12}\.glb|finish-surfaces-[a-f0-9]{12}\.bin|(?:assembly-manifest|finish-surfaces)\.json)$/.test(
            pathname,
          )
        )
          return next();
        const path = resolve('public', '.' + pathname),
          compressed =
            String(req.headers['accept-encoding']).includes('gzip') &&
            existsSync(path + '.gz');
        if (!existsSync(path)) return next();
        res.setHeader(
          'Content-Type',
          pathname.endsWith('.glb')
            ? 'model/gltf-binary'
            : pathname.endsWith('.bin')
              ? 'application/octet-stream'
              : 'application/json',
        );
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader(
          'Cache-Control',
          !pathname.endsWith('.json')
            ? 'private, max-age=31536000, immutable'
            : 'no-cache',
        );
        if (compressed) res.setHeader('Content-Encoding', 'gzip');
        createReadStream(path + (compressed ? '.gz' : '')).pipe(res);
      });
    },
  };
}
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    watch: { useFsEvents: false, usePolling: true },
  },
  plugins: [localCad(), vinext()],
});
