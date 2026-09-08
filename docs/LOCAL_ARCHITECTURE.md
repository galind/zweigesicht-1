# Local movement explorer

The application lives in `explorer/`, generated with the prescribed Sites 0.3.0 scaffold and Shadcn add-on. It uses React/TypeScript and a framework-independent Three.js scene controller. Local Vite configuration deliberately omits hosted bindings and account tooling. No Site is registered. Deployment is deferred.

## Source and asset boundary

Original STEP files remain in ignored `assets/source-originals/`. The conversion pipeline writes ignored `assets/generated/`. Runtime files are copied into ignored `explorer/public/models/`; no CAD binary belongs in a commit or checkpoint push. Screenshot/reference evidence is also local-only. Provenance, authored parameter files, source extraction scripts and textual audit reports can be versioned.

Stable source IDs use full XCAF paths. Runtime node IDs encode colons as underscores and path separators as double underscores, prefixed `p_`. Definitions are separately reusable. Source assembly transforms retain millimetres and source axes. The renderer does not infer transforms from part names or recenter individual geometry. Source placements are immutable; presentation and mechanical transforms must compose explicitly.

The source has 426 hierarchy instances (365 leaf components, 61 assembly nodes). Its case tree includes alternate straps and dial/hand options. The default movement root is `p_0_1_1_1__0_1_1_1_4`; all imported instances remain catalog-addressable. The source regulation support is excluded from default framing. Variant exclusions must be visible in the catalog and documented rather than counted as missing geometry.

## Validation scope

A browser render proves runtime geometry and interaction, not finished-watch fidelity or mechanical correctness. Expert mechanical review, representative visitor studies, real mobile GPU/thermal benchmarks and publication/license approval remain independent gates. Browser viewport emulation is recorded as emulation.
