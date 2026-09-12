import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "../../..");
export default {
  root,
  plugins: [{name:"local-m2-recording",configureServer(server) {
    server.middlewares.use("/__m2-recording", (req,res) => {
      const url = new URL(req.url,"http://127.0.0.1:4188");
      const shaft = url.searchParams.get("shaft"), view = url.searchParams.get("view");
      if (req.method !== "POST" || req.headers["content-type"] !== "video/webm" ||
          !["balance","pallet","escape"].includes(shaft) ||
          !["regulation","impulse","bank","escape-contact","whole","central","small"].includes(view)) {
        res.statusCode=400;res.end("Invalid local recording");return;
      }
      const chunks=[];let size=0;
      req.on("data",chunk=>{size+=chunk.length;if(size>50_000_000) req.destroy();else chunks.push(chunk);});
      req.on("end",()=>{
        const directory=path.join(repo,"artifacts/mechanics/running-movement/m2");
        fs.mkdirSync(directory,{recursive:true});
        const filename=`sensitivity-${shaft}-${view}.webm`;
        fs.writeFileSync(path.join(directory,filename),Buffer.concat(chunks));
        res.end(`Saved artifacts/mechanics/running-movement/m2/${filename}`);
      });
    });
  }}],
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
