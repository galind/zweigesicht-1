# CAD finishing implementation plan — approval required

This is a plan only. No production materials, shaders, geometry, assets, lighting, assignments or UI were changed by the audit. Each milestone below requires approval before implementation. Keep commits local unless separately authorized. Retain all 18 correction locks in `docs/appearance/cad-finishing-audit.json`.

## A1 — factual raw d21 color correction

**Scope:** definition `d_0_1_1_21`, occurrence `p_0_1_1_1__0_1_1_1_1__0_1_1_2_28`, body IDs 1 and 2 (source labels `0:1:1:21:1` and `:2`), all source face IDs 1–32. Verify the exact occurrence against the ledger before editing.

**Current → proposed:** raw opaque red enamel `0x6c2031` → blue color family consistent with both blue source bodies. The source RGBA is `[.0048963102,0,.4910208881,.7300000191]`; these linear CAD values are evidence for the blue family, not calibrated display/shader constants. The fitted small dial is already cobalt and must remain visually unchanged. Genuinely red d4 is unaffected. No other definition or occurrence should inherit the correction by name regex.

**Evidence/confidence:** fresh XCAF body/face extraction and individual raw front/back/oblique browser review; high confidence that raw red disagrees with source blue. Source name “rot” and stale prose are weaker contrary evidence. Numerical optical tuning is excluded from this milestone.

**Ownership:** `explorer/src/viewer/materials.ts` for an exact d21 color choice using the existing profile system; existing `scripts/cad/review-runtime.mjs` assertions for raw/fitted identity; narrowly update `docs/COMPONENT_APPEARANCE_AUDIT.md`, `docs/DIAL_CAD_FINDINGS.md`, `docs/FINISHING_FIDELITY_REVIEW.md` and the historical appearance ledger through its existing generation workflow. Update progress. No geometry, annotation, lighting or UI files are needed. Check current file contents before implementation because this plan is not a patch.

**Verification:** exact raw d21 and red d4 on both sides, edge and two reflection angles; full small-dial parent and fitted small dial for every supported hand style; no color leak into silver carrier d14. Check all 202 definition mappings/365 occurrences and the 29 steel exceptions. Run existing runtime tests and appropriate type/lint/build checks after an actual typed change. Snapshot source/GLB/annotation hashes and compare unchanged. Tests must protect the source body interpretation, not repeat the misleading name.

**Risk/rollback:** a broad enamel/name change could recolor d4 or fitted output. Use one isolated commit for the exact raw definition and associated documentation/tests. Revert that commit to restore baseline; no asset rebuild is expected. Existing shader/material machinery is sufficient. Do not introduce transmission, shader recompilation features or depth-bias changes as part of A1.

## A2 — documentation and evidence corrections

After approval, correct the ten stale claims enumerated in `staleHistoricalClaims`: source-body enamel colors, source-transparent inventory, actual Function/selection behavior, fail-closed annotation loading, no-op d219 etched gating and any superseded source-family descriptions. Preserve historical changes as history where appropriate. Numeric shader values remain labeled authored. This is a separate documentation commit with links to exact audit evidence; no current tests or visual behavior should be changed merely to silence an audit conflict.

## B — evidence-dependent finish and optical decisions

These items are **not implementation-ready factual fixes**. Approve the physical/variant interpretation first. For every row below the full affected occurrence IDs are the named definition's `occurrenceIds` in the audit JSON; exact body/group/face membership is stored in its `source` record. That machine-readable scope is authoritative and avoids ambiguous names.

| Decision | Exact region and current behavior | Conditional later work and evidence needed |
|---|---|---|
| B1 d156 gauge optics | Faces 65–84, existing role 7; dark-red diffuse, metalness 1, transmission 0 | Determine whether the intended dark-ruby region is stone, enamel/coating or presentation color. Preserve dark red and steel plate. If dielectric response is approved, modify the existing regional shader gate only; annotation already identifies the 20 faces. Test both gauges' exposed/hidden sides, boundaries and transmission cost. |
| B2 enamel depth | d4 bodies 1/2, faces 1–42; d21 bodies 1/2, faces 1–32; raw alpha flattened | Decide coating versus volumetric optical presentation. Source alpha .808/.73 is not physical transmission. Existing enamel profile can host a scoped experiment; depth bias and underlying carrier must be checked. Keep this separate from A1. |
| B3 d249 crown-wheel process | Whole definition with exact source groups; current `blackPolished` | Resolve earlier circular-brushing instruction/photographic grain against later mirror treatment. If circular satin is approved, scope the broad annulus by existing source/analytic regions, retain tooth flanks and bore, and verify d251 and adjacent ratchets are unaffected. Existing shader likely sufficient; do not assume a whole-wheel process without region review. |
| B4 d230 recessed border | Source faces 37–66, floors 51/66 at local Z −.1; blue annotation intentionally omitted | Current accepted omission stays. Only explicit variant approval permits annotation regeneration for these exact recessed faces. Preserve gray fields 1/2/18 and underside. If approved, update the intentional test, source annotation generator and packed annotation through existing tooling in one separate commit. |
| B5 leather underside distinctions | d63 exact 66 pale faces; d81 faces 85/86; whole-body named leather tint | Obtain exact-variant underside material/marking evidence. A body-wide recolor is wrong. A new regional annotation may be required; existing dielectric family likely sufficient, but grain/normal treatment needs a controlled macro comparison. |
| B6 concealed identity conflicts | d114 double roller, d130 safety, d185 three clamps, d206 lyre, d66 two seals, d256 tooling; retained ledger histories including d233 | Use exact-part maker evidence or explicit user direction. Each gets an isolated definition/occurrence commit only after identity/extent is resolved; do not infer composition from neighboring parts or CAD hue. |
| B7 remaining mixed CAD groups | All unresolved definitions and exact appearance groups enumerated in the audit appendix/JSON | Determine whether green, pale, orange or purple partitions encode physical finish or CAD function. Preserve current appearance while unresolved. No blanket recoloring, invented physical constants or silent omission. |

For B1/B2, proposed optical values are deliberately unspecified: no measured source justifies them. A controlled visual experiment after approval should compare macro front/back, light/dark reflection, assembled and isolated geometry, internal depth, edge continuity, aliasing and frame/resource cost. A successful CPU assertion does not accept the optical result. If regional optical changes need more than the existing shader supports, report that new scope before implementation.

## C — geometry and export limitations, last

Keep geometry work separate from material decisions. d27 invalid inner-dial BRep/normal and guilloche issues, d54 missing face 1, d111 missing faces 8/14/23 across four eccentric occurrences, 328 near-zero-area triangles, analytic-normal fallback/outliers and recovered d225 diamond are technical investigations. Preserve original downloads, hashes, placements and source face identities. Maker diamond STL is an authentic separate recovery, not original STEP geometry; do not invent a brilliant cut and label it CAD-derived.

Future ownership may include `scripts/cad/export_assembly.py`, source-surface extraction/packaging scripts, generated model/annotation assets and corresponding runtime checks. Inspect the exact existing workflow first. A geometry proposal needs before/after topology, count, coordinate, normal, index and assembly-matrix evidence, deterministic provenance, review of face-ID changes and explicit visual acceptance. Use one definition/recovery per rollback boundary. No geometry regeneration belongs in A1 or B tuning. Release/distribution gates remain closed until separately cleared.

## Common verification and rollback contract

Before each approved milestone, save the current hashes and exact affected IDs. Preserve source URLs/hashes, all unrelated work and all user correction locks. Afterward verify d155/d137/d183/d142/d188/d235 steel; ruby palette; d159's retaining-end blue with steel spine/underside/walls; d156 dark red; matched eccentric hue; rose-gold chatons; steel d117; d121 washer; d240 grain; matching barrel snailing; whole-blue screws and all 29 steel exceptions. Compare affected assemblies from both sides, oblique and edge-on, normal and macro framing, assembled and isolated, with separation for concealment. Check browser errors, context losses, annotation failures, resources and restored assembly coordinates.

Commit only the verified milestone after inspecting status and staged diff. A failed visual comparison blocks that milestone even if tests pass. Rollback means reverting its isolated commit, including associated sidecars/assets when applicable; never reset unrelated work or rewrite source provenance. Approval of this plan does not authorize publishing, pushing, merging or deployment.
