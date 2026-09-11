# All parts orientation and in-place flipping — 11 September 2026

## Presentation contract

All parts opens forward, independently of the current assembly side. Its camera always looks along world +Z from -Z with -Y up. Flip movement retains the dock's existing outline icon, label, native keyboard button, and minimum 44 px target. Its pressed state means the inventory back is selected. In assembly it retains the existing side-switching behavior.

Inventory Flip uses one shared 850 ms smoothstep angle from 0 to π about world Y through **each component's own displayed geometry-bounds center**. It composes a proper rigid rotation on the original/fitted presentation matrix; it never mirrors geometry. Repeated clicks retarget the scalar from its displayed angle. Forward is reconstructed from the original baseline, so a settled double flip restores bit-identical matrices rather than accumulating quaternion error. Reduced motion reaches the target in one pose update.

Flip does not rebuild the layout, alter selection/isolation, change assembly side, or modify camera position, target, zoom, pan, or camera ownership. An inventory turn requested during entry waits for the existing slot travel and camera framing to finish, then turns in place; repeated clicks update the queued target. This prevents an early click from freezing an assembly-scale camera and clipping the inventory. After entry, inspection framing travel stops at its displayed position when flipping. Responsive layout travel retains its existing destinations; flipping does not invent new ones.

Leaving All parts folds each actually displayed flip into the departing pose before the ordinary assembly transition starts. This avoids a snap to forward during an interrupted exit. Assembly then restores the exact source/fitted transforms. A fresh All parts entry is forward. Back restores its saved inventory target and camera context; it retargets continuously from the displayed pose. Reset exits All parts, clears its turn and selection, and restores the agreed straight-on assembly view on the retained assembly side, with both independent visibility/style preferences unchanged.

Resizing uses the existing responsive slot arrangement and camera-ownership policy, retaining the target and current flip angle. Dial visibility and hand-style changes use the existing deterministic layout for the new membership/configuration; they do not change the inventory side. A newly complete dial packet appears at full authored opacity in its current slot and receives the shared displayed angle immediately. Missing geometry remains behind the existing complete-packet readiness gate; retry respects the latest layout, visibility, style, and orientation intent.

## Preserving the accepted arrangement

`makeSpreadSlots` retains the prior layout calculation unchanged: source membership, exclusions, functional grouping, sort order, shelf sizes, 16% plus 1.6 mm padding, group spacing, and responsive column choice. Its historical size-based rotations and tilt are used **only to reproduce those accepted measurements**, never to orient the new presentation.

The new forward rotations align each source/fitted bounds center with that exact prior slot center. Source identities, vertices/indices, occurrence transforms, unit scale, and authored finishes are unchanged. The frame envelope includes a symmetric Y-turn sweep, so initial framing accommodates both sides and Flip requires no refit. Actual geometry and even conservative swept bounds fit their old padded slots. User-selected close-ups or manual zoom/pan can intentionally crop the inventory; the no-clipping checks refer to the fitted inventory overview.

## Source geometry review and decisions

The review decoded the existing local overview and catalog GLBs and inspected paired ±Z triangle contact sheets for all 138 movement definitions and the dial/hand definitions. Numerical occurrence checks covered all 215 GLB movement leaves; the integrated runtime suite also covers the separately recovered diamond, bringing the inventory to 216 movement leaves. With both displays enabled, all 259 leaves are covered.

| Source family / definition | Forward decision and evidence |
| --- | --- |
| Broad plates, bridges, flat wheels, springs and forks | Remove arbitrary tilt; retain source world XY roll. Paired source-mesh views establish broad recognizable faces, without asserting a universal mechanical front. |
| `010-` screws, including horizontal d201/d226 | Map source local +Z to inventory -Y: stand the whole screw vertically with its head above the shaft, including the three Skeleton dial screws. Cancel occurrence roll and use a source-local X quarter-turn to show the full side profile. The source head/slot geometry establishes the positive axial end in all 20 reviewed definitions; size does not decide orientation. This supersedes the earlier head-on slot alignment, which misunderstood the user’s request. Source shanks that are smooth remain smooth; no thread geometry is invented. |
| Coupling wheel d97 | World Y rotation -π/2 exposes its toothed face; identity showed the thin edge because the source axis is world X. |
| Toothed pinions d93/d137/d234/d237/d242 | Retain face-on identity despite long shafts; recognizable teeth take precedence over the old size-based side view. |
| Winding stem d143 and sliding clutch d144 | Retain the existing world XY profile, exposing stepped source geometry. |
| Plain axial profiles d87/d103/d112/d113/d117/d124/d127/d135/d148/d149/d150/d157/d158/d160/d162/d163/d177/d184/d200/d214/d220 | Explicit world Y rotation π/2 presents informative pin/staff/arbor profiles. These parts have no uniquely established visual front. |
| Three hands dial and all fitted hands/supports | World X rotation π. Actual d27 guilloché lies on source world +Z; the same convention keeps the logo and numeral orientation upright. |
| Skeleton dial and all fitted hands/supports | Identity, except the explicitly upright screws above. Actual d14/d21 outward ring/enamel geometry faces world -Z. |
| All hand styles | Retain the existing fitted 10:10:00 bearings and source-specific corrections. Upright means the display face convention, not rotating every blade to twelve o'clock. Thin/bent hands never inherit a bounding-size quarter-turn. |

Symmetric wheels, washers, jewels, bearings and structural counterbores can be ambiguous. The chosen forward view is an inspection convention. No expert mechanical front classification is claimed.

## Verification and evidence

The CPU runtime suite reads the real source geometry and protects the original geometry-byte and finish annotation contracts. New inventory checks cover all nine hand-style pairs at desktop and portrait aspects: legacy slot centers/order, forward poses, old padded slot containment for the full turn, 17 intermediate rendered-matrix samples, proper 180° endpoints, exact double restoration, rapid reversal, selection/camera stability, visibility/style changes, readiness/failure/retry, resize, Back, Reset, and continuous exact reassembly.

The projection audit first checks conservative world AABBs. Suspected overlaps/clipping are then checked against actual source vertices projected through the current matrices. This prevents rotated empty AABB corners from being mistaken for visible intersections. The refinement is confined to the opt-in QA path; it does not add per-frame rendering work.

Verified: lint, TypeScript, production build, 10 state tests and all 84 source/runtime checks. Both desktop (1440×900) and mobile (390×844) pass all 24 inventory browser checks, alongside 19 desktop camera checks and 75 warm-catalog mobile dial checks. Manual Enter/Space, 844×390 landscape resize, both inventory endpoints and zero-error reassembly were checked. Existing large-chunk and Node deprecation warnings remain.

Browser verification and screenshots are local under `artifacts/browser/inventory-flip/` (ignored), including forward/back inventories with both dials, correct reassembly, and source review contact sheets in `source-review/`. Run the local `?inspect=1` preview's **Run inventory checks** for the actual-renderer suite. CPU checks run with `node scripts/cad/review-runtime.mjs`; state tests with `node --test tests/experience.test.mjs`.

Mobile browser evidence uses Chromium viewport emulation, not a physical phone or cross-GPU certification. Presentation clearance is not a collision-free mechanical disassembly claim. Human appearance acceptance, expert mechanical review, source/CAD redistribution permission, physical-device qualification and publication remain open gates. No site or CAD asset was uploaded, published or redistributed.
