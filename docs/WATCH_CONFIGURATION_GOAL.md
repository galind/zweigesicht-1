# Goal: configure the watch around the real movement

Implement watch configuration in `/Users/guillemgalindo/projects/zweigesicht-1`, replacing the current **Dials & hands** control. Read `AGENTS.md`, `README.md`, `PROGRESS.md`, `docs/LOCAL_ARCHITECTURE.md` and `docs/CAD_NOTES.md` first. Implementation completed locally on 14 September 2026 under the user’s subsequent authorization. See [PROGRESS.md](../PROGRESS.md) for verification and remaining limits. This document does not authorize publishing.

## User intent

Let visitors switch between a cased watch and the exposed movement, choose supported case materials, and configure the existing dials and hands. The user explicitly clarified that the Three hands side’s “sticks” means **the hands themselves**, not the hour-marker batons. Separate remains the site’s primary feature.

Preserve the accepted full-viewport, borderless viewer and quiet floating controls. Keep Separate first with its original regular text/icon styling. Keep Focus limited to whole-movement and functional-group choices; do not restore Previous view. Retain standalone All parts and Find a component.

## Evidence already checked on 14 September 2026

- The local assembly manifest includes case root `p_0_1_1_1__0_1_1_1_3`, definition `d_0_1_1_43`, named `ml01 Gehäuse SS montiert`. It includes a crown, gaskets, a middle-ring assembly, two screw-back assemblies and sapphire crystals. Geometry presence is established; a clean fitted watch configuration still needs verification.
- Relevant definitions include crown d46/d48, gasket d44/d47/d66/d78, sapphire d67, screw-back d68 and middle ring d70. Case root children 6 and 8 are separate placed occurrences of screw-back assembly d65. Preserve the occurrence transforms on both sides.
- The case tree also includes duplicate/alternative strap assemblies, multiple leather colors, buckles and attachment hardware. Do not turn on the whole subtree blindly. Resolve occurrence selection and physical attachments explicitly.
- The source audit records one untessellated face in case component d54 (lug/attachment bracket). Inspect its visible impact before accepting the fitted case. Use existing source geometry or a documented source recovery; do not silently fabricate a repair.
- The recorded original STEP hash is `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. See `assets/source-manifest/sources.json` and `assets/generated/assembly-manifest.json`.
- The maker’s [CAD index](https://www.marcolangwatches.com/en/cad-2/zweigesicht-1/) includes case/buckle and dial/hand sections. The maker’s [download gallery](https://www.marcolangwatches.com/en/downloads-2/) labels stainless-steel, rose-gold and platinum watches. Its Three hands image identifiers distinguish blue and rose-colored hands. This supports investigating those finish choices, not assuming every style/material combination is offered. The detailed watch page timed out during planning.
- Existing runtime mappings make central hand definitions d24/d28/d30 (Fine), d29/d31/d32 (Lance) and d35/d39/d42 (Open lance) blue. Existing dial-marker/logo definitions d25/d36 are rose gold. A new hand-material choice must not accidentally recolor those markers or the movement.
- CAD colors and names are evidence inputs, not measured optical materials. No separate rose-gold/platinum case geometry or complete hand-material compatibility matrix was established in this planning pass.

## Intended interface and behavior

Replace the dock label with **Configure** and use **Watch configuration** as the panel title. Keep the panel compact, dismissible, keyboard accessible and consistent with the existing translucent design.

1. **Case:** Show case toggle. Include the selected case body, crown, both crystals, seals and necessary attachment hardware as a coherent fitted assembly. Keep straps, leather-color selection and buckle configuration outside this first implementation; they remain accessible through all CAD entries.
2. **Case material:** offer only evidence-supported presets. Stainless steel, rose gold and platinum are candidates confirmed as watch versions; verify applicability to this geometry and affected surfaces before enabling them. If only one material can be supported, omit a redundant selector and explain the limitation in delivery notes.
3. **Dials:** preserve the one shared Show both dials toggle.
4. **Three hands:** preserve the hand-shape selector and add a distinct hand-material/finish selector for supported combinations. Verify blued-steel and rose-gold appearances against maker references. Keep shape IDs stable; do not represent a mere recoloring as new CAD geometry.
5. **Skeleton:** preserve its independent hand-shape choice and current reviewed finishes. Add material options only where evidence supports them; do not infer symmetry with the Three hands side.

Open with the existing exposed movement: case off, both dials hidden. Case and dial visibility are independent; enabling the case must not silently enable the dials. Remember material and shape choices when their geometry is hidden. Changing case material does not implicitly recolor hands, markers, logo or movement parts. Do not automatically couple case and hand choices unless a verified compatibility constraint requires it; unsupported combinations must be explained and normalized visibly rather than silently substituted.

Reset view restores the assembled camera/presentation while preserving side and configuration preferences. Flip continues to work from either face, with or without case/crystals. Opening the panel must not reframe the model. Fit the complete visible watch on an explicit case toggle or Reset where needed, without continuously fighting the user’s camera.

## Keep inspection and separation effective

Separate must remain available with the case on. Establish a reviewed presentation in which case pieces and crystals move clear enough to reveal the movement, then the existing movement separation remains usable. Preserve exact assembled transforms at zero and after Reset. Do not imply a service procedure or collision-free mechanical disassembly.

Focus and All parts should continue to expose the movement. Recommended presentation policy: temporarily hide the case/crystals in those modes while retaining the Show case preference, and restore the configured case when returning to Whole movement or Reset. Explain that temporary hiding in the configuration panel. Keep All parts scoped to the active movement’s physical components for this iteration; full CAD search still includes the case.

Transparent crystals must not become opaque covers, disappear from one face, produce severe sorting artifacts, or block ordinary picking of underlying components. Retain explicit crystal selection through Find a component. Verify transparency while orbiting, flipping and separating, including on mobile and reduced-quality settings.

## Implementation sequence

1. **Audit and map:** inspect source occurrences, transforms, bounds, tessellation exceptions and maker references. Record a fitted case manifest with included IDs, exclusions, material scopes and evidence. Verify hand-style/material compatibility. Preserve URLs and hashes under `assets/source-manifest/`; distinguish existing CAD, recovered geometry and authored finish presets.
2. **State and loading:** add explicit configuration preferences, validation, legacy-state defaults and effective visibility. Extend the existing shared asynchronous loader rather than duplicating case geometry. Coalesce requests, preserve last-known-good rendering, handle failures/retry and make latest intent win during rapid toggles. No persistent partial case or mixed-material state after failed/stale loads.
3. **Rendering:** integrate fitted case placement, crystal rendering, scoped material overrides, framing and separation. Reuse shared geometry safely; clone or parameterize materials per fitted instance so changing case/hands cannot alter unrelated components or raw catalog source appearance. Preserve existing authored finishes and CAD positions.
4. **Interface/API:** replace DialControls with configuration controls, retaining existing functionality and feedback. Keep legacy dial interactions working; update WebMCP/state APIs, snapshot visibility, component-search status and restored state consistently.
5. **Verify and document:** complete checks below, update existing status/architecture notes and commit coherent milestones. Do not push, deploy or redistribute CAD without the corresponding authorization and release gates.

Likely starting points: `explorer/app/page.tsx`, `explorer/app/globals.css`, `explorer/components/DialControls.tsx`, `explorer/src/experience/{state,dials,webmcp}.ts`, `explorer/src/viewer/{MovementViewer,materials}.ts`, `assets/authored/dial-configurations.json`, and the existing loading, dial, inventory and UX validation suites.

## Acceptance criteria

- Case off/on and every enabled material work from both faces, with dials hidden/visible and all supported hand shapes. Hand-finish changes affect only the intended hands; hidden choices remain hidden and reappear correctly.
- Verify complete case composition, original scale/placement, no duplicate strap variants, no persistent clipping or missing visible case surfaces. Record the d54 exception outcome.
- Exercise separation at start, intermediate and full values; rapid reversal; Focus; All parts; raw component selection; isolation; Flip; Reset; and restoration of retained case preferences.
- Test slow/failing case assets, retry, rapid case/material/hand changes, unmount during loading and WebGL recovery. Repeated configuration changes must not leak materials, geometries or textures or add idle redraws.
- Run relevant state tests, CPU runtime checks, TypeScript, lint and production build; extend focused tests for configuration normalization, material isolation, visibility/loading races and effective-mode behavior. Re-run affected dial, inventory and browser UX suites.
- Inspect desktop and mobile layouts, 200% text, keyboard focus/dismissal, touch targets, static fallback and quality settings. Compare case/crystal/hand appearance with maker references; preserve the quiet overlay layout.
- Deliver a concise result, screenshots of case off/on and verified material/hand variations, tests run and remaining evidence/source limitations. No running-watch simulation, invented material claims or unrelated redesign.

## Accepted refinement — 14 September 2026

Skeleton remains the main opening face, with the fitted lugs pointing toward the opposite face. Flip animates both attachment packets to the opposite source placements. Fine hands follow case material: blue for steel, gold for rose gold and platinum. Frost only the recessed background behind the crown M. Ordinary fitted case selection retains the configured watch and its finishes; isolation is explicit. These later user instructions supersede independent Fine finish selection and raw behavior for fitted case selections above.
