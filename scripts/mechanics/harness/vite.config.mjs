import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "../../..");
export default {
  root,
  cacheDir: path.join(repo, "artifacts/mechanics/running-movement/m1/vite-cache"),
  publicDir: path.join(repo, "explorer/public"),
  resolve: {
    alias: [
      {
        find: /^three\/addons\/(.*)$/,
        replacement: path.join(repo, "explorer/node_modules/three/examples/jsm") + "/$1",
      },
      {
        find: /^three(\/.*)?$/,
        replacement: path.join(repo, "explorer/node_modules/three") + "$1",
      },
    ],
  },
  server: { host: "127.0.0.1", port: 4188, strictPort: true, fs: { allow: [repo] } },
  build: {
    outDir: path.join(repo, "artifacts/mechanics/running-movement/m1/harness-build"),
    emptyOutDir: true,
    copyPublicDir: false,
  },
};
