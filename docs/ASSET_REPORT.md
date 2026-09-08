# Local runtime asset optimization

Measured 9 September 2026. Integrated into the local viewer; publication, real-device performance and visual acceptance remain separate gates. No source/derived CAD was pushed or uploaded by this task.

The movement overview now occupies **9.83 MB as Meshopt GLB, 4.75 MB with gzip**, retaining all 222 renderable part IDs and every source geometry byte after decoding. The full catalog is optional and occupies 17.90 MB, or 9.50 MB with gzip. This is lossless transport compression; it preserves the complete existing mesh detail and does not reduce GPU triangle counts.

## Deliverables and measured payload

Output files are under ignored `assets/generated/optimized/`. The movement is `overview.glb`; the complete source assembly, including exterior parts, is `catalog.glb`. Corresponding `.glb.gz` files are supplied for a server configured to send `Content-Encoding: gzip`. These files retain unchanged source millimeter coordinates.

| Measure | Movement overview | Optional full catalog |
|---|---:|---:|
| Source GLB bytes | 21,142,992 | 37,633,344 |
| Source GLB gzip bytes | 7,322,106 | 13,924,121 |
| Meshopt GLB bytes | 9,834,792 | 17,901,308 |
| Meshopt + gzip bytes | 4,751,211 | 9,501,474 |
| Meshopt + Brotli bytes, measured | 3,744,627 | 7,047,888 |
| GLB reduction | 53.48% | 52.43% |
| Gzip reduction versus gzip source | 35.11% | 31.76% |
| All source nodes | 260 | 427 |
| Renderable stable part IDs | 222 | 364 |
| Unique meshes | 138 | 201 |
| Unique triangles | 621,922 | 1,148,881 |
| Triangles including repeated instances | 748,422 | 1,671,176 |
| Primitive draws before application culling | 222 | 364 |
| Added position quantization error | **0 mm** | **0 mm** |
| Maximum decoded world-matrix difference | **0** | **0** |

Gzip used level 9 and Brotli quality 11. Brotli sizes are measurements; `.br` output files are not supplied. Neither gzip nor Brotli is implied by a `.glb` extension. A plain local static server serving the GLB will transfer the Meshopt GLB byte count. The 4.75 MB overview figure is conditional on correctly configured content encoding and excludes app JavaScript, decoder and reference imagery.

## Method and preservation evidence

Meshopt was the first compression candidate. The accepted pipeline compresses each existing buffer view with Meshopt's glTF-compatible version 0: `ATTRIBUTES` for raw float geometry, `INDICES` for index sequences, and `NONE` filters. There is **no quantization, lossy filter, global decimation, reordering, joining, hierarchy flattening or material replacement**. This deliberately preserves both geometry and transform contracts. Unlike the usual glTF Transform `meshopt()` convenience transform, the pipeline does not run its quantization preprocessing. [glTF Transform meshopt documentation](https://gltf-transform.dev/modules/functions/functions/meshopt), [Meshopt extension configuration](https://gltf-transform.dev/modules/extensions/classes/EXTMeshoptCompression).

`INDICES` preserves index bytes exactly; a triangle-specific codec can cyclically rotate a triangle's index sequence. The output requires `EXT_meshopt_compression` and uses a marked, nonmaterialized fallback buffer, avoiding a duplicate uncompressed payload. No new runtime meshes or parent nodes are introduced.

Verification performed:

- Every compressed buffer view decoded using the **actual Three.js 0.186.0 bundled Meshopt decoder**, with byte-for-byte equality to source positions, normals and index arrays.
- Source `nodes`, `meshes`, `accessors`, `materials`, `scenes`, root scene and asset metadata preserved exactly as JSON. Stable `partId`, source names, definition IDs and hierarchy extras are unchanged.
- Independent glTF Transform `NodeIO` decoded each optimized GLB and recovered the same node/mesh counts and exactly matching world matrices.
- The actual Three.js `GLTFLoader.parseAsync` loaded both raw and optimized files. All node `userData`, every renderable position/normal/index array, world matrices and complete world bounds matched exactly.
- Source STEP hash remains `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. Each report records input and output GLB hashes; optimization rejects an unreviewed source-manifest STEP hash.

These checks prove preservation relative to the raw GLBs. They do not repair or certify the original STEP, resolve existing tessellation/source-BRep exceptions, validate mechanical contact, or prove browser visual quality.

One Node process parse measured approximately 22 ms raw and 22 ms Meshopt for the overview, and 30 ms raw and 31 ms Meshopt for the catalog. These are local CPU compatibility observations, **not browser startup, device, network or GPU performance benchmarks**. No throughput or frame-rate claim is based on them.

## Viewer integration

The local viewer now uses the existing Three dependency and bundled Meshopt decoder; it needs no additional package or remote decoder URL. The implemented loader follows this pattern:

```ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
// Load /models/overview.glb initially; load /models/catalog.glb only on demand.
```

Load the supplied `.glb` URL. Do not point GLTFLoader at `.gz` unless the server supplies the appropriate content-encoding header. The decoder is asynchronous; GLTFLoader handles its readiness during normal loading. Current source part bindings, assembled transforms, millimeter-to-viewer normalization and mechanical world pivots remain unchanged.

Browser integration evidence is recorded in `artifacts/browser/interaction-checks.json`, `context-restored.json`, and `webmcp-validation.json`. The real GLTFLoader loaded the hashed overview route with a **4,751,211-byte gzip-encoded body**, then loaded the optional catalog route with a **9,501,474-byte gzip-encoded body** after an intentionally missing catalog request exercised the visible failure and retry path. The overview loaded 222 renderable movement leaves; the successful optional catalog load raised the resolved source set to **all 364 renderable leaves**. The same checks recorded exact assembly restoration after interrupted reveals, no transform drift, stable GPU resource counts across mechanism switches, and successful rendering after a forced WebGL context loss.

These are local in-app browser integration checks, not a cold-network or complete startup benchmark. The reported encoded GLB bodies exclude application JavaScript, the bundled decoder, manifest/routes, fonts, CSS, reference imagery, HTTP overhead and cache effects. The browser evidence used a desktop Chrome user agent on this Mac and does not establish phone GPU, sustained thermal, memory, bandwidth or latency performance. Its short timing samples are retained as diagnostics only; `benchmark` is still null in the cited artifacts.

The catalog contains the complete exterior envelope: its decoded world bounds are approximately `[-26.2723,-134.7297,-10.5505]` to `[26.2791,134.7297,5.5505]` mm. Keep it optional and do not use its strap-sized bounds for initial movement framing. The overview's complete bounds remain exactly those of the raw movement. Reuse the lead's authored movement camera and exclusions.

## Reproduction and remaining gates

The scoped `scripts/assets/package.json` and lockfile pin `@gltf-transform/core`, `extensions` and `functions` to 4.5.0 and `meshoptimizer` to 1.2.0. Dependency directories remain ignored. Run from the repository root:

```sh
npm ci --prefix scripts/assets --ignore-scripts --no-audit --no-fund
node scripts/assets/optimize.mjs
node scripts/assets/verify-three.mjs
```

The optimizer supports `--movement-only` and `--catalog-only` for bounded iteration. It reads only the generated source GLBs/manifest and writes optimized binaries under `assets/generated/optimized/` plus scalar reports under `artifacts/assets/`. Existing provenance stays in `assets/source-manifest/`. Original CAD is not required for this stage.

Evidence is in `artifacts/assets/optimization-report.json`, the per-asset optimization reports, and `three-loader-verification.json`. No binary geometry is placed in those reports.

Open gates: a controlled cold-cache network test that measures the complete application payload and HTTP overhead; the planned representative desktop frame-time sequence; actual phone GPU, memory and sustained thermal measurements; repeated catalog load/dispose/reload cycles with heap and GPU accounting; explicit missing-decoder failure coverage; human comprehension; visual acceptance; and publication rights. The overview still draws up to 748,422 triangles and 222 primitives, above the original provisional 250k–600k overview triangle range. Compression alone cannot improve those counts. Preserve difficult teeth and spring detail when later profiling guides selective LOD or identity-preserving instance batching. [Meshopt documentation on transport compression versus runtime performance](https://gltf-transform.dev/modules/extensions/classes/EXTMeshoptCompression).

## Final local acceptance update

The lead completed the desktop 60-second and five-minute browser sequences, all six reveal views, portrait/text/fallback checks and reflection-restoring context recovery. See `docs/LOCAL_REVIEW.md` and ignored `artifacts/browser/benchmark-60s.json` / `benchmark-5min.json` for measured scope and limitations. These close the corresponding local integration checks listed above; actual device, full cold-network payload, thermal, human and publication gates remain open.
