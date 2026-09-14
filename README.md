# Zweigesicht-1

Local real-CAD explorer for Marco Lang's ml–01 movement. Open **http://127.0.0.1:4173/** while the local development server is running.

The movement opens fully assembled. Reveal six functional groups, configure both dials and their hands, inspect and isolate components, separate layers or mechanism parts, flip the movement, and return to the original assembly. The catalog addresses all 426 source instances. The accepted experience is a static construction explorer; it does not present a running-watch simulation.

See [current status](PROGRESS.md), [architecture and technical evidence](docs/README.md), and [release gates](docs/RELEASE_GATES.md).

## Run the prepared checkout

For a prepared checkout with dependencies and generated assets:

```sh
cd explorer
npm run dev
```

The server binds to `127.0.0.1:4173`. The local middleware serves prepared gzip assets with content-hashed URLs.

## Reproduce local assets when needed

Preserve the original STEP files and the URLs and hashes in `assets/source-manifest/`. CAD tooling uses the existing `.venv-cad` environment and Blender installation; the exporter reuses its geometry cache unless source files or conversion settings require regeneration.

```sh
scripts/cad/run_pipeline.sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/cad/render_references.py
node scripts/assets/optimize.mjs
node scripts/assets/verify-three.mjs
python3 scripts/prepare_local_assets.py
```

A new checkout needs the pinned `explorer/` and `scripts/assets/` dependencies, the recorded original sources, and the preflight CAD environment before those commands can run. Clean-machine reproduction has not been claimed. See [asset report](docs/ASSET_REPORT.md) for optimization details.

## Verify

```sh
node --test tests/*.test.mjs
node scripts/cad/review-runtime.mjs
cd explorer
./node_modules/.bin/tsc --noEmit
npm run lint
npm run build
```

`http://127.0.0.1:4173/?inspect=1` exposes browser regression, benchmark, optional-asset failure and WebGL recovery checks. `?no3d=1` exercises the static fallback; `?text=200` exercises a 200% root-font layout. These are explicit test modes, not real-device certification. Screenshots, numeric traces and generated assets remain local in ignored `artifacts/` and `assets/generated/` paths.

## Hosting and source boundaries

The repository has a Vercel build configuration (`vercel.json`, `npm run build:vercel` in `explorer/`). Domain cutover status is recorded in [PROGRESS.md](PROGRESS.md).

Original CAD, generated runtime models, source imagery, caches and environments remain outside Git. Source provenance is under `assets/source-manifest/`; hand-authored overrides are under `assets/authored/`. Publication and redistribution remain subject to the [release gates](docs/RELEASE_GATES.md).
