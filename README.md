# Zweigesicht-1

A real-CAD construction explorer for Marco Lang’s ml–01 movement, with a separate assembly puzzle at `/workshop`. This is static exploration, not a running-watch simulation or servicing procedure.

The explorer addresses all 426 source instances. It supports six functional groups, inspection/isolation, All parts, disassembly/reassembly, fitted case appearances, shared dial visibility and independent hand shapes. Fine hands follow the case material. Reset preserves side and configuration.

Workshop starts through **Assemble the movement** on the homepage. Easy offers 89 prepared fits; Hard has 249 individual parts and 35 explicit workbench transfers. Both start with 16 fitted leaves and finish with the same 265 leaves. Ready now offers constructible choices; All parts is searchable and keeps unavailable parts inspectable. Show seat is optional assistance. Free orbit, source-scale gallery dragging, Flip, Reset, Undo and local nonlinear saves are supported. `/play` redirects permanently to `/workshop`.

See [current status](PROGRESS.md), [architecture](docs/LOCAL_ARCHITECTURE.md), [CAD constraints and reproduction](docs/CAD_NOTES.md), and [release gates](docs/RELEASE_GATES.md).

## Setup and run

Use Node.js 24 (CI’s version; minimum 22.13). The tracked runtime assets are sufficient to run and build the application; original CAD and Python are needed only for source reproduction.

```sh
npm ci --prefix explorer
npm --prefix explorer run dev
```

Development binds to **http://127.0.0.1:4173/**. The local middleware serves the prepared gzip CAD with content-hashed URLs. Production preview:

```sh
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4176
```

## Verification

Run from the repository root:

```sh
node --test tests/*.test.mjs
node scripts/play/validate-inventory.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
# With the production server above running:
node explorer/scripts/check-seo.mjs http://127.0.0.1:4176
```

The HTTP metadata check covers homepage and Workshop social cards in the initial
HTML for X, Facebook and LinkedIn crawler user agents, clean canonical URLs for
query-string links, the `/play` redirect, and delivery of the preview image.
Actual platform preview rendering and cache refreshes still need a deployed check.

The source/runtime regression suite additionally needs the ignored CAD inputs described in [CAD notes](docs/CAD_NOTES.md):

```sh
node scripts/cad/review-runtime.mjs
node scripts/play/fixed-access-check.mjs
```

Browser runners use an existing Playwright installation and Chrome. Set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` path and `CHROME_PATH` to the Chrome executable when they are not available through the defaults. No browser dependency is required by the application.

```sh
node scripts/play/browser-check.mjs http://127.0.0.1:4176 all
node scripts/play/drag-check.mjs http://127.0.0.1:4176
node scripts/play/access-check.mjs http://127.0.0.1:4176
node scripts/review/explorer-check.mjs http://127.0.0.1:4176
node scripts/review/loading-check.mjs http://127.0.0.1:4176
node explorer/scripts/measure-build.mjs
```

Workshop runner modes are `easy`, `hard`, `focused`, `home` and `all`. `PLAY_ORDER=reverse` and `PLAY_WIDTH=320` exercise alternate legal orders and narrow Hard layouts; `PLAY_QA_OUTPUT` sets the ignored browser-evidence directory. The fixed-access check verifies the retained face/edge guidance presets at three sampled distances, not a restriction on free orbit or proof of physical insertion clearance.

`/?inspect=1` exposes lazy browser regression/benchmark tools and local delivery-failure fixtures. `?no3d=1` exercises fallback and `?text=200` enlarges root text. Browser viewport and synthetic touch checks do not establish physical-device or accessibility certification.

## Deployment and source boundaries

The root `vercel.json` is the deployment configuration. `npm --prefix explorer run build:vercel` produces `explorer/.vercel/output`; the root build command copies it to `.vercel/output`. Standard and Vercel builds use the same manifest-driven asset pruner, reject missing required assets and exclude local reference imagery. Build output pruning never deletes original/generated inputs.

Feature branches start from and target `develop`; its Vercel Preview is staging. Reviewed `develop` → `main` releases use the existing Git integration. See [branching and releases](docs/BRANCHING_AND_RELEASES.md). Building locally does not authorize publishing.

Source URLs/hashes stay under `assets/source-manifest/`; authored membership, placements and decisions stay under `assets/authored/`. Original CAD, reference imagery, evidence, caches and environments remain ignored. Only the reviewed runtime payloads allowed by `.gitignore` are tracked. Public redistribution and publication remain subject to the [release gates](docs/RELEASE_GATES.md).
