# Zweigesicht-1

Local real-CAD explorer for Marco Lang's ml–01 movement. Open **http://127.0.0.1:4173/** while the local development server is running.

The movement opens fully assembled. Reveal six functional groups, configure a fitted case in stainless steel, rose-gold or platinum appearances, show or hide both dials together and choose their hands independently, inspect and isolate components, separate layers or mechanism parts, flip the movement, and return to the original assembly. Fine Three hands follow the case: blue for steel, gold for rose gold and platinum; other shapes retain blue. Flip withdraws the fitted attachments, turns the case about the CAD X/crown axis, then reseats them following the maker animation. Selecting a fitted case part keeps the configured watch visible. Reset preserves configuration. Focus and All parts temporarily hide the case. The catalog addresses all 426 source instances. The accepted experience is a static construction explorer; it does not present a running-watch simulation.

See [current status](PROGRESS.md), [runtime architecture](docs/LOCAL_ARCHITECTURE.md), [CAD maintenance notes](docs/CAD_NOTES.md), and [release gates](docs/RELEASE_GATES.md).

`/workshop` is the separate free-choice assembly feature, entered from the
homepage through **Assemble the movement**. Easy offers 89 prepared fits; Hard
exposes 249 individual parts through 35 focused subassembly projects. The
primary Ready now tray contains constructible choices without
revealing their seats; All parts keeps the complete searchable inventory and
dependency clues available. Both experiences retain the same 16-leaf foundation
and finish with 265 physical leaves. Nonlinear progress and the clue preference
save locally. Earlier guided saves require an explicit fresh start. See the
[experience review](docs/PLAY_EXPERIENCE_REVIEW.md),
[dependency ledger](docs/PLAY_DEPENDENCIES.md) and [source inventory](docs/PLAY_INVENTORY.md).
It is a puzzle, not a servicing procedure.

Current local production preview: **http://127.0.0.1:4187/workshop**.

## Run the prepared checkout

For a prepared checkout with dependencies and generated assets:

```sh
cd explorer
npm run dev
```

The server binds to `127.0.0.1:4173`. The local middleware serves prepared gzip assets with content-hashed URLs.

## Reproduce local assets when needed

For an existing prepared checkout adding watch configuration, first run `.venv-cad/bin/python scripts/cad/case_fit_probe.py` and `python3 scripts/prepare_local_assets.py`. The case recovery sidecar is generated from the original STEP; its verified runtime copy is tracked under the existing deployment authorization. Regeneration requires the local original source.

Preserve the original STEP files and the URLs and hashes in `assets/source-manifest/`. CAD tooling uses the existing `.venv-cad` environment and Blender installation; the exporter reuses its geometry cache unless source files or conversion settings require regeneration.

```sh
scripts/cad/run_pipeline.sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/cad/render_references.py
node scripts/assets/optimize.mjs
node scripts/assets/verify-three.mjs
python3 scripts/prepare_local_assets.py
```

A new checkout needs the pinned `explorer/` and `scripts/assets/` dependencies, the recorded original sources, and the preflight CAD environment before those commands can run. Clean-machine reproduction has not been claimed. See [CAD maintenance notes](docs/CAD_NOTES.md) for optimization details.

## Verify

```sh
node --test tests/*.test.mjs
node scripts/cad/review-runtime.mjs
node scripts/play/validate-inventory.mjs
cd explorer
npm run typecheck
npm run lint
npm run build
npm start -- --hostname 127.0.0.1 --port 4176
# In another terminal: node explorer/scripts/check-seo.mjs http://127.0.0.1:4176 (from repository root)
```

`http://127.0.0.1:4173/?inspect=1` exposes browser regression, benchmark, optional-asset failure and WebGL recovery checks. `?no3d=1` exercises the static fallback; `?text=200` exercises a 200% root-font layout. These are explicit test modes, not real-device certification. Screenshots and numeric traces remain local in ignored `artifacts/` paths. The CPU source/runtime suite also requires the prepared ignored CAD audit inputs documented in [cleanup review](docs/CLEANUP_REVIEW.md); it is not a clean-clone test. The inspection UI and browser regression modules load only with `?inspect=1`.

The [website review](docs/WEBSITE_REVIEW.md) maps both routes and records the
regression commands, measured comparisons and remaining verification limits.
`scripts/play/browser-check.mjs` runs both levels and focused checks through real DOM inputs;
`scripts/review/explorer-check.mjs` runs the opt-in homepage suites. Both accept
an existing local Playwright installation through `PLAYWRIGHT_MODULE` and Chrome
through `CHROME_PATH`; they do not add runtime or project dependencies.

For the Workshop flow, run `node scripts/play/browser-check.mjs
http://127.0.0.1:4187 all` with those environment variables. Individual modes are
`easy`, `hard`, `focused` and `home`. `PLAY_QA_OUTPUT` selects the ignored evidence
directory; `PLAY_ORDER=reverse` and `PLAY_WIDTH=320` exercise alternative legal
orders and narrow Hard viewports. The older guided browser reports describe
historical `play-2`/`play-3` code, not the current free-choice interaction.
`node scripts/play/drag-check.mjs http://127.0.0.1:4187` uses the same environment
variables to check actual-scale card dragging, the selected touch affordance,
gallery swiping at desktop, 390 px and 320 px widths, the Hard workbench project
boundary and the barrel cover's workspace/support requirements.

## Hosting and source boundaries

The repository has a Vercel build configuration (`vercel.json`, `npm run build:vercel` in `explorer/`). Domain cutover status is recorded in [PROGRESS.md](PROGRESS.md).

Original CAD, source imagery, caches and environments remain outside Git. Most generated assets are local; explicitly approved runtime payloads are tracked through the exceptions in `.gitignore`. Source provenance is under `assets/source-manifest/`; hand-authored overrides are under `assets/authored/`. Publication and redistribution remain subject to the [release gates](docs/RELEASE_GATES.md).

Both build targets prune their output to the current runtime manifests, reject missing required assets and exclude local reference imagery. Local originals/generated evidence are never pruned. `npm start` serves the standard build; `build:vercel` only creates deployment output. For audit scope, removals and measured improvements, see [cleanup review](docs/CLEANUP_REVIEW.md).


Workshop uses two fixed faces with Flip and centered zoom. The shock-indicator
workbench has a fixed angled pair; radial dial screws expose a fixed edge view.
`node scripts/play/fixed-access-check.mjs` checks source-surface access for all
373 actions at three sampled distances using the prepared local runtime assets.
