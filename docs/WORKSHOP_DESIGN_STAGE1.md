# Workshop environment — Stage 1

24 October 2026. Four exploratory concepts; **no direction selected and no
implementation approved**. Local review boards and complete built-in ImageGen
prompts are in `artifacts/workshop-design-stage1/`. These are design studies, not
CAD drawings, measured renders or mechanical evidence. Nothing was published.

## Context inspected

Read AGENTS.md, current PROGRESS.md, README.md, BENCH_EXPERIENCE.md,
RELEASE_GATES.md and BRANCHING_AND_RELEASES.md. Inspected the running homepage
and `/bench` at port 4189, including the entry popup and loaded arrival view.
The in-app browser declined pointer capture; no new walking/physics validation
is claimed. Existing arrival and bridge-rest inspection captures supplied the
visual scale references. The user's mat attachment was not present in the chat;
the rectangular green mat follows the written reference description.

The homepage's dark neutral surfaces, quiet sans typography and glass controls
remain context. This proposal concerns the physical environment only.

## Four concepts

| Concept / local board | Strongest ideas | Practical tradeoff |
| --- | --- | --- |
| A — North-light maple / `concept-a.png` | Pale maple drawer bench, cream plaster, left daylight, ivory task lamp, tools concentrated left, simple maple-framed Dresden street/river map. Open right approach and generous empty mat. | Bright wood and wall need restrained exposure so silver bridges retain definition. Window composition must not dominate the tiny movement. |
| B — Walnut repair studio / `concept-b.png` | Freestanding walnut/steel desk, right-hand tool cluster, warm task light with cool window fill, black-framed Dresden map on a rear shelf, glass storage. The richest light/material contrast. | Dark wood and warm lighting can obscure holder relief and distort perceived metal colour. Needs broad neutral fill; avoid a spotlight look. |
| C — Pale precision workshop / `concept-c.png` | Birch worktop, grey painted drawers, tools along the back, broad linear light, ribbed-glass cabinet, pale Dresden diagram with green river. Clearest uncluttered backdrop at mat level. | Can feel impersonal. Keep a working drawing and modest wear; prevent the light and bright metal trays from becoming glare sources. |
| D — Oak corner atelier / `concept-d.png` | Oak worktop, muted painted drawers, storage-only left return, right daylight, side-wall map and small glass-front cabinet. Most convincing compact personal room. | More surrounding geometry and tool silhouettes; keep the return decorative unless explicitly approved for traversal. Side-wall map is discovered by looking around. |

Each board has a room/desk overview, low mat-eye sketch and annotated desk plan.
Ground views follow the current arrival at X0/Z54, facing the station at X0/Z−7,
with 1.48 mm eye height and 1.65 mm visitor height. They intentionally show the
original holder wall hiding much of the upper mechanism. Upper-face exploration
still depends on the existing gravity jetpack. Image generation does not enforce
metric perspective; these views establish design intent, not calibrated camera
proof. Background blur is sketch shorthand, not a proposed depth-of-field effect.

## Shared design intent and geometry changes requiring review

- Full-size **1100 × 650 mm main workbench**, compared with today's 124 × 104 mm
  desk. D adds an undimensioned storage-only return. The illustrated dimension
  lines are schematic; the stated main-desk size excludes that return.
- **350 × 250 mm flat green mat**, fine matte texture, restrained offwhite
  “Guillem Galindo” wordmark at the front-right. Original simple lettering will
  be resolved in Stage 2; no supplier logo or model number. No grooves or grid.
- Explore **1 mm mat thickness** while preserving mat-top Y0 and lowering the
  wood beneath it. Current thickness is 0.12 mm. A 1 mm edge exceeds the current
  0.22 mm step capability, so it becomes a jetpack obstacle. Do not silently add
  a ramp, enlarge step height, or change movement/holder seating to accommodate it.
- Keep the station at (0,0,−7), arrival at (0,0.002,54), and the source-relative
  movement/crowns/materials/reviewed assembly, original holders and corrected
  resting poses intact. Sketch gears and technical drawings are symbolic.
- The orange **100 × 100 mm** square is a provisional prop-free design reserve
  centred on the station. Keep at least 100 mm above mat level free of overhead
  fixtures there. It is **not** the current exact flip envelope or a proposed
  permanent collision fence. Validate both holder footprints, lift, full rigid
  half-turn and exchange against actual runtime bounds before implementation.
- Preserve an empty forward arrival corridor and routes around both sides of
  the reserve. Props stay outside this core; tweezers and tray rims must not form
  accidental barriers across it. Mat microtexture should not become collision
  geometry; nearby tools need honest visible collision surfaces if reachable.
- Larger desk/mat boundaries require an explicit later implementation decision.
  Candidate: expand the existing bounded domain to the main desktop while
  retaining the same outward-only constraint and edge sliding at every altitude.
  This would substantially increase travel distances at the unchanged 5.5 mm/s
  walking speed. D's side return and the room are background, not an implied
  expansion of traversal. Do not retain invisible old boundaries across the new
  mat without resolving the resulting visible/physical mismatch.
- Preserve walking, mouse look, gravity jetpack, collisions, F, fresh-key retry
  after moving clear, and all existing interface and recovery behaviour.

Map graphics are placement/style explorations, not geographically checked
cartography. Final map data, typography, and any external asset sources need
provenance/licence review. Use original authored props where practical. No new
source CAD was downloaded or changed. Existing release gates remain unchanged.

## Next step

Stop for the owner's A–D selection and combinations. Stage 2 will resolve one
direction, including proportions, lighting, original wordmark and prop locations.
Stage 3 will present a consistent final room/desk/visitor/layout set with material,
asset, collision and performance constraints. **Explicit final-design approval is
required before changing application code, environment models or CAD.**
