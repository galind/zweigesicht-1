# Finishing fidelity review

10 September 2026. Implementation branch: `codex/finishing-fidelity`, based on `main` at `61ea264`.

## Scope and evidence

The target remains the photographed No. 00/18 shock-indicator movement recorded in `FINISHING_REFERENCES.md`. CAD face colors identify regions but are not treated as proof of physical process. Original STEP/GLB geometry, transforms, identifiers and normals remain immutable; new roles are reversible shading annotations.

The implementation addresses the reviewed finish mismatches without inventing missing geometry:

- exact exposed bridge-base roles replace blanket lower-Z frosting;
- BRep chamfers and countersinks are separated from satin walls;
- bridge grain, plate frost, wheel satin and barrel snailing are finer and shallower;
- d219 joins the documented blue-black bridge-border set, while unsupported d230 is removed from it;
- the crown wheel is black-polished steel rather than circular brushed;
- ruby bearings gain depth and a polished surface;
- heat-blued components vary from blue-black to cobalt with view angle;
- Dial A silver carrier fields gain fine circular satin;
- fitted Dial B enamel becomes translucent cobalt over the separate silver carrier.

## Exact surface mapping

The packager adds three roles to the existing content-addressed sidecar:

| Role | Meaning | Scope |
|---|---|---|
| 8 | Reference-supported exposed bridge base | Exact faces on d99, d133, d147, d156, d165, d219, d222, d228, d230 and d240 |
| 9 | Modeled bridge chamfer/countersink | BRep cones and oblique planar bands on reviewed bridge definitions |
| 10 | Broad plate frost field | Axial d195 source planes above the conservative area threshold |

No unlisted underside, hole floor or mounting pad is frosted by position. Definitions without reviewed sidecars receive conservative top-field treatment and no inferred base frost.

## Verification

- TypeScript and authored lint pass.
- The production build passes.
- The complete source/asset suite passes, including all 58 hash-verified annotation definitions, exact base/recess roles, 339 byte-preserved decoded geometries and zero assembly error.
- Dial CPU/state checks pass with scoped raw-red/fitted-blue enamel restoration.
- Real WebGL review at 1280×720 passes 18 camera, 27 UX, 24 dial, 8 explosion and 12 interaction checks.
- Browser inspection reports no current source-surface or diamond error, stable GPU resources, exact final assembly and no idle redraws.
- Direct visual review covers the assembled movement, a macro movement view, an edge-on lower-surface view, Dial A and Dial B. The former coarse brown/gray lower-surface mottling is absent.

The initial browser compile caught an undeclared fragment-stage normal in the heat-blue calculation. It was corrected by passing a dedicated view-space finish normal; the successful reviewed reload has no new shader errors.

## Remaining limits

The ledger still records 84 verified, 264 inferred and 17 unresolved occurrences. Wheel-spoke grain remains a radial approximation where no face-specific spoke direction exists. The original maker diamond STL remains a simplified eight-fold cut. Numerical color, roughness, anisotropy, transmission and microtexture scale are authored visual values, not measured manufacturing specifications. No mechanical, physical-device or production-watch certification is claimed.
