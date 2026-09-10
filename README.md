# Zweigesicht

Local real-CAD explorer for Marco Lang's ml–01 movement. Open **http://127.0.0.1:4173/** while the local development server is running.

The movement opens fully assembled. Reveal six functional groups, switch Finish/Function, inspect and isolate components, separate layers or mechanism parts, flip the movement, and return to the original assembly. The catalog addresses all 426 source instances. The accepted experience is a static construction explorer; it does not present a running-watch simulation.

This is ready for **local engineering review**, not a certified mechanical simulation or a public release. See [local review and limitations](docs/LOCAL_REVIEW.md), [CAD audit](docs/CAD_AUDIT.md), [mechanical review](docs/MECHANICAL_REVIEW.md), and [current progress](PROGRESS.md).

## Run the prepared checkout

Dependencies and generated assets already exist in this workspace. Do not reinstall or reacquire source CAD for an ordinary restart.

```sh
cd explorer
npm run dev
```

The server binds to `127.0.0.1:4173`. The local middleware serves prepared gzip assets with content-hashed URLs. Nothing is registered, saved or deployed to Sites.

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
npm run build
npm audit
```

`http://127.0.0.1:4173/?inspect=1` exposes browser regression, benchmark, optional-asset failure and WebGL recovery checks. `?no3d=1` exercises the static fallback; `?text=200` exercises a 200% root-font layout. These are explicit test modes, not real-device certification. Screenshots, numeric traces and generated assets remain local in ignored `artifacts/` and `assets/generated/` paths.

## Source and publication boundary

Source/derived CAD, source imagery, caches, environments and dependencies are excluded from Git. The private SSH checkpoint contains project code, documentation and provenance only. Redistribution rights, human mechanical review, visitor comprehension, physical devices, thermal behavior and publication approval remain separate gates. No Site or CAD asset has been uploaded or deployed.
