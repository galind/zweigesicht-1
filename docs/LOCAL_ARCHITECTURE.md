# Local movement explorer

The application lives in `explorer/`, generated with the prescribed Sites 0.3.0 scaffold and Shadcn add-on. It uses React/TypeScript and a framework-independent Three.js scene controller. Local Vite configuration deliberately omits hosted bindings and account tooling. No Site is registered. Deployment is deferred.

## Source and asset boundary

Original STEP files remain in ignored `assets/source-originals/`. The conversion pipeline writes ignored `assets/generated/`. Runtime files are copied into ignored `explorer/public/models/`; no CAD binary belongs in a commit or checkpoint push. Screenshot/reference evidence is also local-only. Provenance, authored parameter files, source extraction scripts and textual audit reports can be versioned.

Stable source IDs use full XCAF paths. Runtime node IDs encode colons as underscores and path separators as double underscores, prefixed `p_`. Definitions are separately reusable. Source assembly transforms retain millimetres and source axes. The renderer does not infer transforms from part names or recenter individual geometry. Source placements are immutable; presentation and mechanical transforms must compose explicitly.

The source has 426 hierarchy instances (365 leaf components, 61 assembly nodes). Its case tree includes alternate straps and dial/hand options. The default movement root is `p_0_1_1_1__0_1_1_1_4`; all imported instances remain catalog-addressable. The source regulation support is excluded from default framing. Variant exclusions must be visible in the catalog and documented rather than counted as missing geometry.

## Validation scope

A browser render proves runtime geometry and interaction, not finished-watch fidelity or mechanical correctness. Expert mechanical review, representative visitor studies, real mobile GPU/thermal benchmarks and publication/license approval remain independent gates. Browser viewport emulation is recorded as emulation.

## Local runtime structure

`MovementViewer` owns immutable source matrices, evaluated mechanical poses, presentation offsets, cameras, shared geometries and resource lifetime. React receives periodic snapshots and sends discrete intent; it does not own per-frame mesh transforms. Source geometry remains millimetres throughout the offline and browser pipeline. The camera uses source negative Y as up for the default negative Z maker-reference view.

`assets/authored/mechanisms.json` owns groups, source membership, obstructions, focus and presentation parameters; `motion-evidence.json` records source/evidence and authored timing bounds separately. `evaluatePose(time)` drives four train shafts and the illustrative balance. `Source inspection` removes every mechanical delta, whereas Pause retains its current explanatory phase.

`scripts/prepare_local_assets.py` writes a compact source manifest and content-hashed overview/catalog URLs. The loopback-only Vite middleware serves prepared gzip bodies; GLTFLoader uses the bundled Meshopt decoder, with no remote decoder dependency. The catalog coalesces optional loads, retains existing movement mesh identity, and frees discarded catalog geometry. Renderer context restoration recreates the PMREM environment in addition to normal geometry restoration.

`?inspect=1` exposes local QA tools. The optional WebMCP interface calls the same visible controller actions, validates input before mutation and unregisters on unmount. `?no3d=1` and `?text=200` are explicit controlled test modes. No server database, account registration, publishing or Site cloud lifecycle is required.
