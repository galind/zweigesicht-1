# Local movement explorer

The application lives in `explorer/`. It uses React/TypeScript, vinext/Vite and a framework-independent Three.js scene controller. `explorer/vite.config.ts` configures local CAD middleware and enables Nitro when a build preset is supplied. The root `vercel.json` selects the Vercel build; current domain status is in [PROGRESS.md](../PROGRESS.md).

## Source and asset boundary

Original STEP files remain in ignored `assets/source-originals/`. The conversion pipeline writes ignored `assets/generated/`. Runtime files are copied into `explorer/public/models/`; `.gitignore` lists the explicitly approved deployment payloads that are tracked, with other generated files excluded. Screenshot/reference evidence is also local-only. Provenance, authored parameter files, source extraction scripts and textual audit reports can be versioned.

Stable source IDs use full XCAF paths. Runtime node IDs encode colons as underscores and path separators as double underscores, prefixed `p_`. Definitions are separately reusable. Source assembly transforms retain millimetres and source axes. The renderer does not infer transforms from part names or recenter individual geometry. Source placements are immutable; presentation translations are composed outside the unchanged source matrix.

The source has 426 hierarchy instances (365 leaf components, 61 assembly nodes). Its case tree includes alternate straps and dial/hand options. The default movement root is `p_0_1_1_1__0_1_1_1_4`; all imported instances remain catalog-addressable. The source regulation support is excluded from default framing. Variant exclusions must be visible in the catalog and documented rather than counted as missing geometry.

## Validation scope

A browser render proves runtime geometry and interaction, not finished-watch fidelity or mechanical correctness. Expert mechanical review, representative visitor studies, real mobile GPU/thermal benchmarks and publication/license approval remain independent gates. Browser viewport emulation is recorded as emulation.

## Local runtime structure

`MovementViewer` owns immutable source matrices, presentation offsets, cameras, shared geometries and resource lifetime. React receives periodic snapshots and sends discrete intent; it does not own per-frame mesh transforms. Source geometry remains millimetres throughout the offline and browser pipeline. The camera uses source negative Y as up for the default negative Z maker-reference view.

`assets/authored/mechanisms.json` owns groups, source membership, obstructions, focus and presentation parameters. Running/timing was removed by user decision: no clock, mechanical evaluator, timing state, controls or WebMCP timing settings remain. Each mesh receives `T(presentationOffset) × assembledWorld`; camera/reveal damping still runs when needed and returns exactly to the original pose. Unknown/obsolete state fields are discarded. `motion-evidence.json` retains historical research only and is not imported by the runtime. The inspection benchmark now covers assembled orbit, revealed mechanism orbit and separated orbit.

The interface keeps the real movement beside a quiet information rail (an About control on narrow screens), with nonmodal, dismissible panels and a bottom Explore / Separate / Dials & hands / Flip dock. Explore retains All parts, history, the source catalog and camera/quality options. Attribution and source/independence details live in About; there is no footer.

`dialsVisible` is the shared display intent, initially false. The two legacy visibility snapshot fields are normalized to the same value. Legacy single-field actions toggle both; conflicting API visibility values are rejected before mutation, and conflicting historical face preferences restore with both hidden. Hand styles remain independent and style-only changes never enable a display. `configureDials`, generic state patches and the camera presets share this behavior; WebMCP advertises only the shared toggle. A complete pair of selected dial/hand packets is required before either is fitted. Optional loads coalesce, stale completions cannot restore old intent, and failure retains retryable preferences. Reset retains side and display preferences.


`scripts/prepare_local_assets.py` writes a compact source manifest and content-hashed overview/catalog URLs. The loopback-only Vite middleware serves prepared gzip bodies; GLTFLoader uses the bundled Meshopt decoder, with no remote decoder dependency. The catalog coalesces optional loads, retains existing movement mesh identity, and frees discarded catalog geometry. Renderer context restoration recreates the PMREM environment in addition to normal geometry restoration.

`?inspect=1` exposes local QA tools. The optional WebMCP interface calls the same visible controller actions, validates input before mutation and unregisters on unmount. `?no3d=1` and `?text=200` are explicit controlled test modes. The viewer needs no database or visitor account.

Source exceptions, fitting and material evidence are summarized in [CAD_NOTES.md](CAD_NOTES.md).
