/** Rasterize original authored vector paths; no system fonts or external imagery. */
import fs from "node:fs/promises";
import { Resvg, initWasm } from "../../explorer/node_modules/@resvg/resvg-wasm/index.mjs";
await initWasm(
  await fs.readFile(
    new URL("../../explorer/node_modules/@resvg/resvg-wasm/index_bg.wasm", import.meta.url),
  ),
);
const output = new URL("../../assets/generated/bench/", import.meta.url);
await fs.mkdir(output, { recursive: true });
for (const name of ["wordmark", "dresden"]) {
  const svg = await fs.readFile(
    new URL(`../../assets/authored/workshop-graphics/${name}.svg`, import.meta.url),
  );
  const renderer = new Resvg(svg);
  const rendered = renderer.render();
  await fs.writeFile(new URL(`${name}.png`, output), rendered.asPng());
  rendered.free();
  renderer.free();
}
