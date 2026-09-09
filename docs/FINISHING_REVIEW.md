# Finishing refinement — local review record

> Historical checkpoint. The 9 September animation decision in [ANIMATION_REVIEW.md](ANIMATION_REVIEW.md) supersedes the playback recommendations and timing-feature status below. The current explorer is static; source evidence and material findings remain applicable.

9 September 2026. Local-only implementation of `FINISHING_GOAL.md`. The materials have passed independent macro review; final qualification evidence is recorded below. No Site registration, upload, deployment or CAD/image redistribution occurred.

## Reference rationale and scope

The finish target is the photographed `00/18` movement with optional shock indicator. The maker's 6000×4496 studio photograph and SJX's original macro photographs distinguish straight-grained steel fields, frosted bridge feet, polished bevels, blue recessed borders, pink-gilt plate, warm wheels, selective blue screws and transparent ruby bearings. Source URLs, hashes, attribution, classifications, individual observations and variant limitations are in `assets/source-manifest/finishing-references.json` and `FINISHING_REFERENCES.md`. Source imagery remains ignored and local.

Source appearance is evidence of identity, not a calibrated physical material: 17,765 of 25,228 CAD faces carry colors; the prior exporter retained only definition RGB and lost face/body assignments and alpha. There is no source PBR/physical material table. `FINISHING_CAD_AUDIT.md` records original STEP/XCAF/GLB/renderer survival, instance inheritance, solids, normals, smoothing, tessellation, modeled bevels and source defects.

## Implemented

- Every movement leaf definition has an explicit family assignment. Five photographed crown/click screw placements have steel instance overrides, keeping a shared screw definition blue elsewhere. Catalog-only fallback remains conservative and is identified as such by `finishFor`.
- Reviewed local Z axes and XY origins replace shortest-bounds-axis selection. Rotational surface detail is centered at the source origin. Straight grain follows local X. Irregular and curved pieces use an authored planar direction; a traced manufacturing grain field is not claimed.
- Physical anisotropic reflection replaces broad base-color stripes and periodic concentric sine grooves. Filtered stochastic microtexture varies roughness and shallow shading normals at authored millimetre scales. Broad faces and existing inclined bevels have different roughness; lower bridge surfaces use finer isotropic frosting. Vertical walls are no longer all polished by a face-mask complement.
- A six-panel studio reflection environment replaces the generic room. Both hemispheres support metal inspection. Ambient contact overlay is reduced from 0.48 to 0.24, with a 0.4 mm kernel and 0.65 mm depth range. It remains a restrained screen-space composite, not an indirect-light-only physical occlusion model.
- Ruby bearings and the separately named ruby shock mass use dielectric IOR/transmission/attenuation. These parameters and the constant thickness are authored approximations. Gold chatons and pins are separate from satin wheels; the warm balance-rim interpretation has medium confidence, with no alloy claim.
- Existing bridge grooves/text are assigned from source face identities. The crown's blue ring is precisely **definition 251 face 22**, its source-purple outer cone; the main plate/cap and 249 toothed annulus remain polished steel. Definition 156's 20 source-red faces receive the gauge-inlay appearance. Definition 159 uses blue on source faces 1–4 only; the other 258 faces remain steel. No substitute ring, text, diamond, bevel or missing face was fabricated.
- Finish selection preserves the actual appearance, with the existing selection box as the cue, so isolation supports material inspection. Function selection retains its explanatory highlight. All original part/reveal/catalog/motion controls remain available.

## Separate source shading annotations

`finish_audit.py` reproduces source face-order tessellation and verifies positions and triangle indices against existing caches. Its 27 sidecars also match position and original-normal float32 values in existing GLBs. `prepare-finishes.mjs` compares every corresponding decoded runtime position and normal before packaging the extra annotations.

The runtime sidecar is 4,137,632 bytes, served as 793,024 prepared gzip bytes. It annotates 258,602 source vertices with an analytic normal and surface-region role. Original positions, normals, indices, IDs, world matrices, GLBs and compression remain unchanged. The renderer adds only `sourceFinishNormal` and `sourceFinishRole` attributes. It uses analytic normals only within 30° of the original normal, retaining 718 conservative outliers. Zero original normals use the source analytic unit normal. This is a reversible shading correction, not BRep repair. Original triangle silhouettes, missing faces and the empty diamond remain unchanged.

The sidecar manifest ties annotations to the content-addressed overview and binary SHA-256. Runtime validates offsets/counts, finite unit normals and role values. An invalid annotation falls back to original shading and records `sourceSurfaceError`, without losing the movement. `?sourcefinish=0` disables annotation loading for comparison. `?inspect=1` exposes loaded-definition count and errors.

## Verification and evidence

| Requirement | Current evidence |
|---|---|
| Before-state visual evidence | `artifacts/browser/finishing-before/live-assembled.png`, `live-macro.png`, `live-dial-macro.png`; historical screenshots preserved separately in the same directory |
| Reference discovery and identity map | Validated provenance JSON; 110 cited source definitions resolve; maker photo/animation and independent macros classified; source-image hashes retained |
| Color/material and geometry audit | Reproducible `scripts/cad/finish_audit.py`; ignored `artifacts/finishing-cad/` machine reports and sidecars |
| Original geometry/transform invariants | 25/25 actual-controller/material CPU checks; original hashes across 339 separately decoded geometry objects preserved, only two specifically named added attributes excluded; unexpected additions remain detectable |
| Interruption/reassembly/resource stability | Six live-browser checks pass; 20 interrupted reveals, exact matrices, visibility reversal, separation pause, stable 138 geometries / 8 textures and zero idle redraws: `artifacts/browser/finishing-interactions.json` |
| State/motion | Seven pure tests pass via `node --test tests/*.test.mjs` |
| Compilation | Production build, TypeScript and authored lint pass; expected existing large-chunk build warning remains |
| Final-render performance | Final 3,600-frame run: mean 16.67 ms, phase p95 17.3 / 18.1 / 16.8 ms, max 18.8 ms; 1020×554 canvas, DPR 1.5, stable 138/8 resources. `artifacts/browser/finishing-benchmark-60s.json` |
| Both-side macro/zoom/orbit acceptance | Matched assembled and two-step macro captures on both sides; tight oblique jewel/bridge review accepted independently. `artifacts/analysis/finishing-comparison.html` links original, final and attributed reference images. Orbit/zoom steps and sustained orbit show no renewed broad banding; this is not temporal AA certification. |
| Function, catalog, selection, all reveals | CPU/live checks and final visual sweep of all six reveals, Function mode, selection and optional case catalog pass. `finishing-{energy,function,display,winding,shock,catalog}.png` under `artifacts/browser/`. |
| Context restoration, narrow viewports | Final context-loss recovery: 27 annotation definitions, no annotation error, exact reassembly and stable 138/8 resources. Final 390×844 regulation capture: document width 390, controls usable. Earlier same-shader Lightweight/Function portrait checks disable contact shading; physical devices untested. |

A real browser caught a PhysicalMaterial define-overwrite error missed by CPU template inspection. It was fixed by preserving inherited `STANDARD` and `PHYSICAL` defines, with a regression added. Old error entries remain in that browser's historical console; the final console inspection found only the historical 00:42:33.322Z entry, with no new warnings/errors from the final reload, catalog or recovery.

The comparison uses the same initial camera and two zoom steps as the baseline. Clean final screenshots omit the small inspection-tools label. An ignored SHA-256 evidence ledger is at `artifacts/analysis/finishing-evidence-manifest.json`. All original captures are retained. The local review sheet embeds third-party photographs solely from ignored local files; they are excluded from the private code push.

## Reproduction and remaining limits

Existing source files, `.venv-cad`, caches, installed dependencies and loopback server were reused. No package reinstall or CAD reacquisition occurred. From the repository root:

```sh
.venv-cad/bin/python scripts/cad/finish_audit.py
node scripts/assets/prepare-finishes.mjs
node scripts/cad/review-runtime.mjs
node --test tests/*.test.mjs
(cd explorer && npm run build && npx tsc --noEmit && npm run lint)
```

`python3 scripts/prepare_local_assets.py` also repackages annotations if the audit directory exists. The preview is `http://127.0.0.1:4173/`, served by the existing loopback-only Vinext process (PID 50482 at initial recheck; configuration reload may change descendants). Restart using `cd explorer && npm run dev`.

No measured reflectance, texture pitch, coating/alloy assay, expert approval, reconstructed missing geometry, physical-phone/thermal testing or cold-network qualification is claimed. The 27 annotated definitions cover the prominent finish surfaces, not every analytic normal in the full CAD catalog. Rare source slivers retain their original shading. Wheel spokes use the circular family approximation; nonuniform manufacturing grain directions and deep multi-layer gemstone optics remain limitations. Independent macro review accepts the differentiated surfaces for local review while identifying a still fairly uniform raspberry jewel interior and visible CAD faceting at extreme magnification. The absent diamond, invalid eccentric/missing faces and setting-spring/dial variants remain the documented source exceptions. Human visual approval and public-release gates remain open.
