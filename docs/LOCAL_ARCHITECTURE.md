# Local movement explorer

The application lives in `explorer/`. It uses React/TypeScript, vinext/Vite and a framework-independent Three.js scene controller. `explorer/vite.config.ts` configures local CAD middleware and enables Nitro when a build preset is supplied. The root `vercel.json` selects the Vercel build; current domain status is in [PROGRESS.md](../PROGRESS.md).

The [website review](WEBSITE_REVIEW.md) maps both routes and the ownership
decisions behind their shared modules. The homepage remains independent of the
Play manifest, session state and completion UI.

## Source and asset boundary

Original STEP files remain in ignored `assets/source-originals/`. The conversion pipeline writes ignored `assets/generated/`. Runtime files are copied into `explorer/public/models/`; `.gitignore` lists the explicitly approved deployment payloads that are tracked, with other generated files excluded. Screenshot/reference evidence is also local-only. Provenance, authored parameter files, source extraction scripts and textual audit reports can be versioned.

Stable source IDs use full XCAF paths. Runtime node IDs encode colons as underscores and path separators as double underscores, prefixed `p_`. Definitions are separately reusable. Source assembly transforms retain millimetres and source axes. The renderer does not infer transforms from part names or recenter individual geometry. Source placements are immutable; presentation translations are composed outside the unchanged source matrix.

The source has 426 hierarchy instances (365 leaf components, 61 assembly nodes). Its case tree includes alternate straps and dial/hand options. The default movement root is `p_0_1_1_1__0_1_1_1_4`; all imported instances remain catalog-addressable. The source regulation support is excluded from default framing. Variant exclusions must be visible in the catalog and documented rather than counted as missing geometry.

## Validation scope

A browser render proves runtime geometry and interaction, not finished-watch fidelity or mechanical correctness. Expert mechanical review, representative visitor studies, real mobile GPU/thermal benchmarks and publication/license approval remain independent gates. Browser viewport emulation is recorded as emulation.

## Local runtime structure

`MovementViewer` owns immutable source matrices, presentation offsets, cameras, shared geometries and resource lifetime. React receives periodic snapshots and sends discrete intent; it does not own per-frame mesh transforms. Source geometry remains millimetres throughout the offline and browser pipeline. The camera uses source negative Y as up for the default negative Z maker-reference view.

`assets/authored/mechanisms.json` owns groups, source membership, obstructions, focus and presentation parameters. Running/timing was removed by user decision: no clock, mechanical evaluator, timing state, controls or WebMCP timing settings remain. Each mesh receives `T(presentationOffset) × assembledWorld`; camera/reveal damping still runs when needed and returns exactly to the original pose. Unknown/obsolete state fields are discarded. `motion-evidence.json` retains historical research only and is not imported by the runtime. The inspection benchmark now covers assembled orbit, revealed mechanism orbit and separated orbit.

The canvas fills the viewport. The maker identity, Learn about the watch, Acknowledgements, Settings, and bottom Disassemble / Focus / All parts / Configure / Flip / Reset view controls float above it. Nonmodal panels preserve canvas dimensions. Focus lists functional groups in assembly mode and inventory framing in All parts. Component search defaults to displayed physical parts, with an explicit full-CAD option and source details. Renderer visibility supplies search status. Settings contains keyboard camera controls and quality. Hand shapes remain independently configurable; automatic Fine finishes follow case material.

`dialsVisible` is the shared display intent, initially false. The two legacy visibility snapshot fields are normalized to the same value. Legacy single-field actions toggle both; conflicting API visibility values are rejected before mutation, and conflicting historical face preferences restore with both hidden. Hand styles remain independent and style-only changes never enable a display. `configureDials`, generic state patches and the camera presets share this behavior; WebMCP advertises only the shared toggle. A complete pair of selected dial/hand packets is required before either is fitted. Optional loads coalesce, stale completions cannot restore old intent, and failure retains retryable preferences. Reset retains side and display preferences.

`watch-configurations.json` adds 41 fitted case leaves with source transforms and material scopes. `caseVisible`, `caseMaterial` and `centralFinish` are explicit preferences with legacy defaults. `configureWatch` validates before mutation; `configureDials` stays a compatible wrapper. Generic patches and WebMCP use the same route. Fine follows the case material through UI, API and restored state: steel uses blue, rose gold/platinum use gold. Other shapes normalize to blue. Live feedback explains normalization when applicable. Case visibility never enables dials. Hidden choices and Reset preserve configuration.

The shared catalog promise coalesces all optional requests and loads a hash-checked `case-lug-recovery.json` alongside the existing GLB. The recovery appends original d54 face 1 to a new shared geometry buffer, preserving original vertices and normals; four source occurrences reuse it. Failure disposes newly loaded scenes, retains existing rendering and exposes retry. Each dial pair and the complete case have independent completeness gates. Request generations make the latest intent authoritative; late geometry cannot restore old side, material, selection or visibility. No additional catalog GLB is downloaded for configuration.

Effective case visibility requires Whole movement, assembly layout, complete geometry and no raw external inspection or isolation. Focus/All parts hide it without clearing the preference; inventory still uses movement and fitted dial leaves only. Renderer visibility feeds component-search status. Selecting a fitted case leaf or ancestor keeps configured context and finishes; unfitted source selections retain raw inspection behavior. Explicit isolation remains a separate action; crystals are excluded from pointer raycasts but remain explicitly catalog-selectable. Scoped case finishes affect exterior d46/d48/d53/d54/d55/d56/d68/d70/d71 only (including the lug bars and their end screws). Fine hand recoloring targets the three blade IDs and their three source bushings (d34/d38/d41), with a per-instance shader uniform overriding source-white/blue colors and surface roughness to polished gold throughout; Skeleton supports, dial markers/logo, unfitted raw selections and movement retain their materials.

Both fitted crystals use a thin transparent reflection approximation (opacity 0.12, transmission off, no depth write, outward faces). This avoids opposing screen-space transmission layers obscuring the movement and works at reduced quality. Raw crystal inspection retains baseline transmission. Case packets use explicit presentation translations in the common explosion evaluator; zero/Reset restores the appropriate source endpoint exactly. The middle ring, lugs and crown move radially clear, while the two back/crystal packets move axially clear. These are illustrations, not service instructions or a collision proof. An explicit case toggle and Reset can fit the complete visible watch; material changes and opening Configure leave the camera alone.


`scripts/prepare_local_assets.py` writes a compact source manifest and content-hashed overview/catalog URLs. The loopback-only Vite middleware serves prepared gzip bodies; GLTFLoader uses the bundled Meshopt decoder, with no remote decoder dependency. The catalog coalesces optional loads, retains existing movement mesh identity, and frees discarded catalog geometry. Renderer context restoration recreates the PMREM environment in addition to normal geometry restoration.

`?inspect=1` dynamically loads the separate inspection panel and QA suites. The controller publishes snapshots during changes and once after the final frame, without polling React at rest. Source-only separation endpoints and display distances are cached by immutable manifest-array identity; each evaluated pose receives independent offsets. The optional WebMCP interface calls the same visible controller actions, validates input before mutation and unregisters on unmount. `?no3d=1` and `?text=200` are explicit controlled test modes. The viewer needs no database or visitor account.

Source exceptions, fitting and material evidence are summarized in [CAD_NOTES.md](CAD_NOTES.md).

`CasePose.ts` stages the maker’s face-changing sequence: upper attachment withdraws, lower withdraws, case turns about CAD X, lower reseats, upper reseats. Its inverse X transform and the observer frame share one phase clock, so attachments translate without rotating in the viewing frame and source case/movement matrices remain unchanged. Exact endpoints reuse original opposite-end occurrences, with identical definition IDs. Hidden-case flips use the same clock; reversals start from the displayed phase and reduced motion snaps camera and fitted poses together. Configuration loading does not restart the flip. Disassembly remains independent; fitted lug separation vectors rotate with their attachment frame at the current Flip phase, and camera bounds use the same transformed endpoints. Other packets retain watch-local offsets. Camera refits requested during turnover defer until it finishes. The four unresolved ring-mounted locking pins remain seated. Source correspondence and interpretation limits are recorded in `assets/authored/motion-evidence.json` and `assets/source-manifest/face-flip.json`.

Crown d46 compiles the existing frosting relief only for the recessed M background: original face 468, local X=3.4 mm with an X-facing normal. Relief uses the local YZ plane and matching tangent basis. Raised lettering at X=3.5 mm, rim and knurling remain unchanged.

## Assembly route and shared boundaries

`app/play/page.tsx` supplies separate canonical/noindex metadata. `Play.tsx`
owns inventory selection, group/search position, explicit workspace navigation,
validated action history and storage feedback. `state.ts` owns the dependency
checks, replay validation, physical accounting and Undo. Selection never determines
progress. `PlayViewer.ts` owns the source meshes, independent thumbnail render
targets, source-seat visibility checks, pointer capture and camera lifetime.
Dragged meshes retain source scale and are hidden between interactions. Gallery
cards supply the drag origin and failed-drop return point. Pickup is independent
of workspace membership; hints and placement validation retain their dependency
rules, and fitting/guidance additionally require the correct active workspace.
Fresh games begin on the negative-Z movement side.

The versioned `play-4` manifest retains all source endpoints and the 265-leaf
finished watch. It starts with 16 fitted leaves. Easy has 89 direct placements;
Hard has 249 individual placements and 35 explicit packet transfers. Hard leaves
assembled on the workbench remain separate from fitted leaves until transfer.
Transfers add no physical count. Undo reverses the action history, including
transfers; completion requires the exact fitted set and a valid graph history.
Legacy linear saves are explicitly incompatible and are retained until the
player confirms a fresh start. Hints persist with a nonlinear save; restart
sets them off. The [dependency ledger](PLAY_DEPENDENCIES.md) distinguishes source
evidence from conservative puzzle assumptions.

The mainplate gives a fixed framing reference. The orbit pivot stays on that
geometry; a camera projection offset reserves the measured inventory/header
space. Selection, placement, failed drops, hints and Undo never reframe. Explicit
workbench entry captures the main camera and return restores it. Resize updates
projection while preserving camera direction, distance and pan. Reset, Flip and
Show destination are explicit camera actions. No camera event hides fitted meshes
or changes their materials. Hint meshes have a separate material, and drops
require an actual source-surface sample with a clear ray past fitted opaque
geometry. This is visual validation, not swept-solid collision certification.

`GraphicsResources.ts` owns the identical renderer settings, studio lights,
temporary PMREM generation and deduplicated scene-resource disposal. Controllers
retain the resulting environment and scene lifetimes. Their loading policies
remain distinct: the explorer adds optional catalog geometry without losing
configuration intent; Play prepares every required piece before committing a
complete replacement scene, disposing successful siblings after a failed load.
Late metadata cannot start further loads after disposal.

Both controllers schedule frames when needed and settle after damping and
transitions. The explorer also sustains explicitly enabled inspection captures
and benchmarks; benchmark implementation comes from the lazy inspection chunk.
Visibility, context recovery, resizing and interaction wake rendering again.
An idle check must count scheduled callbacks as well as rendered frames.

`CameraFrame.ts`, the native viewer controls and Sheet remain the shared
interaction primitives. `useTextScalePreview` applies the explicit `?text=200`
mode at the document root, including portaled panels, and restores previous
styling on unmount. Play retains native confirmations with accessible names. Gallery cards remain
in stable slots after placement and unavailable cards stay inspectable. A selected
card contains a touch drag handle; swipes on the rest of the gallery browse.
There is no detached drag tray. Enlarged text grows within the bounded,
scrollable inventory; measured workspace controls stay clear of the assembly. The homepage phone dock continues
to wrap according to actual label width. Both routes share only the established
camera helpers, graphics resources, native buttons and Sheet components.
