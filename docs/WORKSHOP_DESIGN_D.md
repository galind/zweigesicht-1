# D — Main workbench

**Current owner direction, 25 October 2026:** simplify the local environment to
the room, one desk and a plain mat before adding objects individually. All
tabletop props, wall map/frame and mat lettering are removed. The window and
integrated drawers remain architectural/furniture elements. The working movement
and original holder remain for interaction testing. The revision 3 brief below
is retained as the historical approved design; its object list is not the current
implementation target.

Developed design and implementation brief, revision 3, 24 October 2026.
**Selected direction: D revision 3. Approved for local implementation on
24 October 2026. Implemented locally on 25 October 2026; see
[BENCH_EXPERIENCE.md](BENCH_EXPERIENCE.md) and [PROGRESS.md](../PROGRESS.md) for
verification and remaining qualifications.**

The owner selected D and requested a basic polished render, with less complexity
and no city view. The latest revision keeps only the main workbench, removes the
side return, wall cupboard, technical drawing and chair, and retains the Dresden
map as the only wall decoration. The map is now centered on the wall directly
ahead of the visitor, above the main bench, with the left wall plain.
This supersedes the earlier developed D proposals.
It prepares the work without changing application code, active authored data,
environment models or maker CAD. The owner subsequently said “let's start with
the implementation” and requested a prompt for another agent. That approves local
implementation of revision 3; it does not authorize publication, push or deployment.
The handoff prompt is `artifacts/workshop-design-d-v3/implementation-prompt.md`.
Historical approval-pending labels in review artifacts are superseded by this record.

## Review package

Current local files are in `artifacts/workshop-design-d-v3/`; v1/v2 remain historical:

- `render.png`: one consistent room, desk and miniature-arrival visualization.
- `layout.svg`: annotated, dimensioned plan and enlarged movement core.
- `proposed-layout.json`: precise proposed coordinates; not imported by the app.
- `review.html`: local visual review sheet, also served on port 4196.
- `prompts.json`: complete built-in ImageGen prompts and reference paths.

The render communicates appearance; layout data controls dimensions. ImageGen
cannot prove source fidelity or a calibrated 1.48 mm camera. Preserve the actual
CAD and verify the actual camera after approval. Soft focus in the illustration
is not a proposed runtime depth-of-field effect. Existing arrival and resting
captures were used as references. No new runtime performance or collision result
is claimed by this design review.

## Resolved visual direction

A modest oak bench in a plaster-walled corner, muted olive-grey integrated drawers
and a small oak-framed Dresden print centered above the workbench on the wall
directly ahead. The map centre is X0/Y420 on the back wall Z−500; its dimensions
remain 260 × 200 mm. The left wall is plain. An opaque frosted pane supplies
soft light from the right. It needs a frame and a lit surface, with no exterior
city, sky, vegetation, reflections of a city, or glass transmission pass.

The main workbench is the only furniture. There is no side return, wall cupboard,
technical drawing or chair/stool. Five screwdrivers in a compact stand and one
empty parts tray sit on the main bench's left wood area, outside the mat. The
left wall moves closer to the main desk, leaving 50 mm at its side rather than
retaining an empty space for the removed return.

The main desk has a weighted task lamp at rear-left, a black loupe and closed
tweezers to the right of the mat, and one closed notebook farther back-right.
No additional containers, loose screws, plants or decorative collections are
needed. The lamp uses the round weighted base shown in the developed render;
this supersedes the earlier clamp suggestion.

The simple flat green mat carries only **Guillem Galindo**, small and offwhite
near its front-right corner. Use original, quiet, name-only monoline humanist
lettering, approximately 25 × 2.2 mm, with no emblem, slogan or model number.
Prepare vector outlines during asset authoring; do not borrow the supplier mark
or use the image-generated text pixels as a runtime texture.

## Dimensions and placement

World units are millimetres, Y up. The arrival faces −Z. Mat top remains Y0.
Coordinates below and the local JSON define the approved implementation target.

| Element | Extents / position | Intent |
| --- | --- | --- |
| Main desk | X −550…550; Z −465…185; top Y−1; bottom Y−33 | 1100 × 650 × 32 mm; flat rectangular walking domain |
| Mat | X −175…175; Z −125…125; Y−1…0 | 350 × 250 × 1 mm; 60 mm wood margin at front |
| Station | (0,0,−7) | Unchanged root and both reviewed rests |
| Arrival | Feet (0,0.002,54), eye offset 1.48 mm | Unchanged approach, F workflow and visitor scale |
| Flip design reserve | X −50…50; Z −57…43; Y0…100 | No new props or overhead objects; actual sweep to be checked |
| Open core | X −70…70; Z −77…100 | Existing assembly plus clear front/side approaches; no new props |
| Lamp base / head | Base (−300,−1,−230), Ø105; head near (−190,350,−135) | Visible solid is collidable, including arm/head |
| Loupe | (210,−1,0), Ø30 × 28 high | On wood, clear of mat and right crown |
| Tweezers | Centre (225,−1,70), 115 long × 8 wide × 3 high | Aligned along Z, tips toward −Z; closed, no trapping cavity |
| Notebook | (350,−1,−170), 140 × 95 × 8 | Closed and collidable |
| Screwdriver stand | (−380,−1,−90), 130 × 65 footprint | Five simple instruments, main desk, collidable |
| Parts tray | (−380,−1,65), 150 × 90 × 12 | Empty, main desk, collidable |

The walls, map and frosted pane are outside the main desk's
X/Z domain. Keep frames and any sill outside it too. The local JSON provides
their proposed extents. The floor is 920 mm below the wood top, beneath the solid
desk. Use tall simple walls and a neutral background above them; omit ceiling
geometry so it cannot introduce a flight cap or a surface the visitor clips
through. Walls should not vanish at the current 250 mm camera limit.

## Materials and asset brief

All colours below are initial sRGB targets, tuned under the final scene lighting.
They are authored environment choices, not claims about maker materials.

| Surface | Target | Authoring approach |
| --- | --- | --- |
| Oak | `#A17D50`, roughness 0.68, nonmetal | Restrained directional grain; slight edge wear, no distressed marks |
| Painted storage | `#747467`, roughness 0.78, nonmetal | Flat olive-grey, subtle variation; closed integrated drawers |
| Plaster | `#D8D4C5`, roughness 0.95 | Very low contrast; avoid noisy macro bumps |
| Green mat | `#3D6252`, roughness 0.92, nonmetal | Fine matte surface; almost smooth at miniature height; texture is not collision relief |
| Printed name | `#C6C7B1` | Dedicated small alpha texture/decal; no raised geometry or collider |
| Tool steel / lamp | `#888982`, roughness 0.45–0.6, metal | Broad restrained highlights, no mirror chrome |
| Loupe body | `#303632`, roughness 0.7 | Simple black body; inexpensive opaque lens approximation |
| Frosted pane | Offwhite opaque material | Soft emission/lighting cue; no refraction or transmission |

Create the furniture, props, wall frames and simple graphics originally from
primitive meshes/vector artwork. No asset-pack purchase or external model
download is required. The Dresden print is an original stylized river-and-street
graphic, labelled as a schematic in its small footer; it is not navigational
cartography. No technical drawing or additional wall art is required.

Keep authored settings and artwork separate from generated Blender/GLB output.
Record authored provenance, inputs, generator version and output hashes in a new
`assets/source-manifest/workshop-environment.json` during implementation. Do not
modify existing maker source manifests or redistribute source CAD. If accurate
map data replaces the original schematic later, record its URL/licence/attribution
before use. Render images remain local review material, not runtime assets.

## Movement, traversal and collisions

- Preserve all 219 movement/crown leaves, local matrices, 18 reviewed phases,
  finishes, original holders, corrected holder rotations and both resting poses.
  Keep the spare holder hidden/collision-inactive except at the existing exchange.
- Keep lift/flip/exchange timing, F shortcut, move-clear refusal, fresh-key retry,
  mouse look, gravity jetpack, speed, visitor capsule and reset behaviour intact.
- Expand the existing rectangular bounds to the main desk extents only. Preserve
  capsule-radius inset, outward-only clipping and tangential sliding at every
  altitude. The floor remains outside the exploration domain. Do not
  add an invisible floor or rectangular collision slab above source openings.
- A 1 mm mat edge exceeds the current 0.22 mm step. Walking off the mat descends
  to wood; returning requires the existing jetpack. Keep the full edge visible
  and collidable. Do not hide a ramp, enlarge step height or raise the assembly.
- The movement-to-front-edge distance becomes 192 mm, roughly 35 seconds of
  straight walking at 5.5 mm/s; arrival-to-station remains 61 mm. Wider travel is
  optional exploration. Do not change speed or spawn to disguise the larger size.
- On the main desk, use the visible low-poly surfaces for collision: mat, desk,
  loupe, tweezers, notebook, stand/screwdrivers, tray and the entire lamp. The
  moved tools are now reachable, so their collision role changes from background
  decoration to colliding geometry. Do not flag reachable tools as
  `decor`. Merge by material/role, while preserving semantic identifiers for QA.
- Outside the bounded domain, mark walls and map `decor` (and the frosted pane).
  Keep them outside the reachable X/Z column; any intrusion
  by an overhang requires a visible colliding surface. The decorative floor is
  below the solid main desk and cannot be reached within the current boundaries.
- The 100 × 100 × 100 mm box is a design reservation, not certified sweep data.
  Check actual per-part lift columns/turnover discs and both holders against every
  new solid, including lamp arm/head. The current flip guard protects the visitor;
  it does not by itself certify clearance from newly authored static props.

## Lighting, visibility and performance

Keep the movement's reviewed material pipeline and existing studio reflection
environment. Adjust bench-only key/fill to match soft right daylight and a gentle
neutral-warm left task source. Check both movement faces and red holder recesses;
avoid gold colour casts, crushed dark details and clipped silver highlights.

The existing `BenchViewer` uses fog from 210 to 350 mm and a far plane starting at
250 mm. These are unsuitable for this room. Remove the short-range fog and derive
camera far distance from the static environment bounds and current camera position,
with a modest margin. Retain the 0.035 mm near plane and unbounded vertical flight.
Verify high ascent, all viewing directions, small CAD depth detail and decal
z-fighting. No arbitrary low ceiling/altitude lock should be introduced.

Initial environment budgets, excluding the unchanged maker CAD:

- At most 40,000 visible triangles and 8,000 collision triangles.
- At most 24 additional scene draws per render pass; merge by material/role.
  The existing jewel transmission path may draw these opaque objects again, so
  count the full multipass renderer workload as well.
- At most 24 MiB additional decoded texture memory including mipmaps, and an
  8 MiB environment download target. Prefer shared 1K textures and a small
  dedicated name/map atlas, no collection of 4K maps.
- Opaque environment materials only. Preserve jewel transmission and its existing
  half-resolution target. No environment refraction, postprocessing, depth blur,
  particles, animated daylight, real-time planar reflections or continuous loops.
- Bake restrained room contact shading into authored textures where useful. Start
  without extra shadow-map passes. A shadow map is a measured follow-up only if
  the visual gap warrants it; never trade away existing CAD appearance to pay for it.
- Preserve Auto/Low/High policy, sleeping idle scenes and complete resource disposal.
  Target no more than 10% p95 frame-time regression against a fresh paired baseline
  on the same device/viewport/mode, with the 60 Hz Auto target retained where the
  baseline supports it. These are acceptance targets, not achieved results.

## Approved implementation sequence

1. Capture a fresh local baseline for both faces, arrival, flips, mouse-look/flight
   performance and scene resource counts. Preserve the approved render/plan.
2. Add an authored environment specification and original artwork. Suggested new
   source paths: `assets/authored/workshop-environment.json` and a dedicated
   authored graphics directory. Keep the current movement layout/rest values
   unchanged; update only `deskBounds` in `assets/authored/atelier-layout.json`.
3. Extend `scripts/bench/export-environment.py` to build the approved desk, room
   and props, preserving the `atelierVersion: 1` / collision-role contract.
   Retain the hidden 1.65 mm scale reference. Write generated Blender output to
   `assets/generated/bench/` and runtime GLB to ignored `explorer/public/bench-local/`.
4. Adjust only bench environment lighting, fog and camera far-range handling in
   `explorer/src/bench/BenchViewer.ts`. Preserve loading/failure recovery and
   disposal. Do not edit shared CAD materials, homepage or interface styling.
   The rectangular bound change should use existing physics without new controls.
5. Validate the generated schema, asset budgets, environment/crown/holder clearance,
   flip sweep, stable seating, and actual mat/tool collision behaviour. Update
   relevant geometry assertions and desk-edge fixtures that encode the old layout;
   do not remove them simply because the new scene differs.
6. Run the checks below, inspect matched views against the design and resolve
   regressions. Record measured results and remaining limits in PROGRESS.md and
   BENCH_EXPERIENCE.md. Commit coherent local milestones. Push/deploy only if later
   authorized and the corresponding release gates are cleared.

## Verification checklist for implementation

Run existing CPU tests, typecheck, lint and local production build. Reuse
`atelier-check.mjs`, `flip-check.mjs`, `jetpack-check.mjs`, `lifecycle-check.mjs`
and `ui-check.mjs` with a fresh output directory and current local preview.
Use `interaction-profile.mjs` / existing foreground profiling for paired frame
measurements; preserve distinction between CPU submission, GPU and frame timing.

Add focused checks for:

- Original CAD membership/materials/matrices and both original holder seats.
- Lift, turnover, exchange and lowering clear every new static prop; no overhead
  lamp collision. F blocks inside the sweep, clears after moving away, and needs
  a new press. No visitor teleportation or automatic queued flip.
- Arrival genuinely at the unchanged eye offset; ground view does not cheat by
  lifting the camera to expose gears. Real keyboard flight reaches both faces.
- Mat-edge descent, jetpack return, collision on each reachable prop, including
  the moved stand/screwdrivers and empty tray, no snagging in closed tweezers,
  and no missing surface below the visitor.
- Every new desk edge/corner, grounded/airborne/high-flight/long-frame cases.
  No side-return boundary or chair collision is part of this revision.
- Room visibility in all directions/altitudes, no near-detail clipping, no
  short-range fog, stable wordmark edges and no texture shimmer at mat level.
- Loading failure, retry, Escape/focus/visibility, graphics loss during a flip,
  disposal and route re-entry. Interface/readability stays unchanged.
- A fresh actual-view visual check and foreground performance comparison at the
  existing representative viewports and quality modes; physical-device/human
  qualifications remain open until performed.

The original design-only step did not run application tests. It has since been
implemented and tested locally; current results are recorded in
[BENCH_EXPERIENCE.md](BENCH_EXPERIENCE.md) and [PROGRESS.md](../PROGRESS.md).
The frozen design artifacts remain historical approval references.
