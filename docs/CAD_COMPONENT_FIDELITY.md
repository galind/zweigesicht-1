# Assembly versus individual maker CAD — 30 September 2026

The individual screw files do **not** contain better thread geometry. No new
geometry replacement was justified, so all runtime CAD, finishes, occurrence
placements, separation paths and Workshop mappings remain unchanged. The audit
also found a non-interchangeable main-plate slot variant and a different buckle
screw. No push, publishing, deployment or new CAD redistribution was performed.

The [ledger](cad-component-ledger.json) covers all **202 physical definitions / 365
leaf occurrences**, including alternatives and repeated placements. It records
source names/IDs, complete occurrence paths/matrices, source hashes, measurements,
confidence, evidence and final disposition. The 61 hierarchy assembly occurrences
are containers; they are not counted as physical components.

| Final classification | Unique definitions |
| --- | ---: |
| Equivalent | 139 |
| Individual source more detailed; existing diamond recovery retained | 1 |
| Incompatible variant; excluded | 2 |
| Missing exact independent source | 49 |
| Unresolved; unchanged | 11 |
| New implemented geometry changes | **0** |

All movement, dial/hands and case/buckle catalog pages were checked: **162 packages,
324 STEP/STL files**, zero retrieval failures. Earlier screw, jewel and diamond
originals were reused and hash checked. URLs, retrieval dates and SHA-256 hashes
are in [source provenance](../assets/source-manifest/component-fidelity-sources.json).
Originals and bulky generated evidence remain ignored. Explicit decisions are
separate in [authored review](../assets/authored/component-fidelity-review.json);
its geometry override list is empty.

## Screws and potential threaded interfaces

There are **23 screw definitions / 72 occurrences**. Twelve exact independent STEP
matches cover 41 occurrences. Ten definitions / 27 occurrences lack an exact
individual file. The remaining definition, d61 / four occurrences, has an
incompatible catalog candidate. No merely similar screw was substituted.

Every matched screw has identical analytic-face measurements and identical
triangles/vertices in its original millimetre frame. All 23 assembly screw
geometries have smooth shafts, rather than modeled helical thread surfaces.
For the starting d9 screw, both STEP files contain 10 faces and produce 641
triangles at 0.015 mm / 0.25 rad. Its independent STL has 2,014 triangles on the
same surfaces. Across the 12 screw STLs, every vertex was measured against the
independent STEP: maximum distance **0.000006393 mm**; triangle-centroid sag is
at most **0.000884 mm**. This is finer curved-surface tessellation, not threads.
The text scans found no cosmetic thread annotation or explicit thread metadata
in the matched screw STEP files. Assembly `DRAUGHTING_PRE_DEFINED_COLOUR` entities
are color declarations, not thread representations. Names are not thread specs.

The prepared assembly meshes agree with fresh source tessellation for these
screws. Meshopt decoding preserves position, normal and index bytes exactly.
Comparable isolated and assembled renders expose the same smooth geometry:
conversion has not discarded threads, and lighting/occlusion does not explain
missing modeled threads. Higher STL triangle counts alone did not justify
replacing the analytic-source meshes or changing their face/material maps.

Other possible threaded interfaces were inspected without inferring thread
specifications: both screw bars (d55/d60), winding stem (d143), tube (d73),
screw-back (d68), crown (d46), crown cover (d48) and corrector sleeve (d75).
The bars' independent STLs also follow the STEP surfaces (all vertices checked).
These STEP comparisons are equivalent except the crown's unresolved numerical/
tessellation differences. Existing smooth source limitations remain explicit.

## Proposals and unresolved items

- **Main plate d195 — major, incompatible variant.** The independent source adds
  0.9585 mm³ in the setting-region slot: its boundaries move from Y=±1.30 to
  ±1.15 mm, narrowing the slot by 0.30 mm. Difference volume lies at
  X=10.5502356933–14.1002356933 and Z=−2.0–−1.1 mm. Symmetric BRep cuts confirm
  no removed assembly volume and exactly this added volume. Confirm with the
  maker/mechanical reviewer which slot belongs with this assembly's setting
  mechanism before considering replacement. Outer bounds alone would miss it.
- **Buckle screw d61 — excluded variant.** Catalog head diameter is 2.2 mm versus
  assembly 1.9 mm; its bottom is Z=−3.3 versus −3.7 mm, with differing shoulders.
  Both symmetric differences are nonempty. Preserve all four assembly screws.
- **Balance eccentric d111 — functionally critical small part, report only.** Both
  STEP files share invalid geometry and three untessellated faces. The maker STL
  is closed (932 triangles versus 591), but distance checking failed after
  160/466 vertices. Verify the missing surfaces, weight/shaft interfaces and
  material correspondence before any substitution. Its closed-mesh volume differs
  from the invalid BRep mass; neither difference establishes physical mass.
- **Inner dial d27 — major, unresolved.** Both imported STEP shapes are invalid.
  Face signatures and mass/area agree within numeric rounding, but tessellations
  differ. The closed independent STL's sampled surface discrepancy reaches
  0.004943 mm. Validate its topology and interfaces before considering a conversion
  change; retain the current recovered dial mesh.

The remaining unresolved definitions are logo d36, crown d46, lug cover d56,
buckle d59, tongue d62, blue strap halves d63/d81, crown guard d71 and wheel bridge
d99. Numerical face/tessellation differences are not established detail upgrades;
retain them pending geometric equivalence review. Missing sources include pins,
Incabloc leaves and unlisted hand/dial/strap/screw variants. Each is individually
recorded, rather than silently mapped to an alternative. The existing d54 face
recovery, diamond STL, dial recovery and other source exceptions remain intact.

## Verification and performance

Fresh checks pass: **67 automated tests, 114 CPU source/runtime checks**, Workshop
inventory (16 foundation leaves, 89 Easy fits, 249 Hard parts, exact 265-leaf
finish), TypeScript, lint, production build, SEO/HTTP, CAD asset validation and
Three.js raw/Meshopt byte/identity comparisons. Browser checks pass **311 explorer
assertions** (22 inventory, 200 watch, 57 dial, 32 interaction) and **87 Workshop
focused assertions**, with no uncaught errors. They cover inspection/isolation,
repeated geometry, source seats, configurations, separation/Reset, readiness,
interaction, saves and recovery. No exhaustive Workshop traversal was needed for
this unchanged runtime; inventory graph validation still runs 40 orders per level.

All tracked runtime payloads and authored movement/Workshop manifests match their
Git baseline. Added triangles, payload bytes and runtime resource cost are **zero**.
A local 60-second 1440×900 headless-Chrome diagnostic reports p95 frame time around
16.7–16.8 ms and overview load around 299 ms. CAD/rendering jobs were also active;
this is not an isolated comparative speed measurement or a phone/thermal result.
Source precision, face boundaries, finishes and immutable matrices stay intact.

Labeled visual pairs are local under `artifacts/cad/component-fidelity/visuals/`:
`d_0_1_1_9-paired.png`, `d_0_1_1_180-paired.png`, both `d9-context-…-paired.png`
occurrences, screw bar/back pairs and the plate/slot pairs. Camera coordinates,
scale and matrices are recorded in `views.json` and `context-views.json`. They are
neutral CAD diagnostics; live application behavior is verified separately.
There is no fabricated before/after improvement image because geometry is unchanged.

## Reproduction

With the existing prepared CAD/Blender environment and unchanged hashed originals:

```sh
python3 scripts/cad/fetch_component_sources.py
.venv-cad/bin/python scripts/cad/compare_component_sources.py
.venv-cad/bin/python scripts/cad/probe_component_stl.py
.venv-cad/bin/python scripts/cad/review_component_differences.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/cad/render_component_comparison.py
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/cad/render_component_context.py
python3 scripts/cad/label_component_evidence.py
python3 scripts/cad/finalize_component_audit.py
```

The targeted Boolean review uses cached source-hash-specific evidence for the
clutch/plate; the initial broad sweep was stopped before using invalid-dial
booleans. STL vertex sampling and visual agreement do not certify interfaces or
mechanics. A clean-machine CAD rebuild, expert mechanical review, physical-device
and representative accessibility review and redistribution/publication release
gates remain outstanding. Local production preview: http://127.0.0.1:4191/.
