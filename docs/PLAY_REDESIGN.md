# Choosing and assembling parts

Implemented and reviewed locally, 26 September 2026. This records puzzle rules, not a
certified servicing procedure. The original inventory, immutable source poses,
16-leaf foundation and 265-leaf finished configuration remain authoritative.

## Interaction design

Easy has a horizontal gallery of the existing 89 prepared assemblies and parts.
Hard has mechanism groups, remaining counts, search and a gallery of individual
components. Navigation never follows readiness. Cards keep their positions when
fitted, so scroll and keyboard focus remain predictable. Repeated labels receive
occurrence numbers within their group. Thumbnails render the actual source CAD.

Tap/click a card to inspect and pick up a piece. Swipe the gallery to browse;
drag the separate, clearly labelled picked-up piece into the view. The separate drag handle keeps touch browsing unambiguous.
Placement clears the held piece without choosing a successor. A persistent Hints
toggle starts off and is saved with the session. Continue restores that choice;
Restart and a new difficulty start with hints off.

Hints off presents no readiness styling, target or prerequisite explanation.
Failed drops calmly distinguish an unavailable assembly from a missed/obscured
seat. Hints on marks unavailable cards without removing keyboard inspection and
disables their drag handle. Selected available pieces show their real seat.
Reveal placement is an explicit camera action; no selection or hint toggle moves
the camera. The labelled Show destination action enables a keyboard/tap placement
alternative, explicitly revealing assistance even when the global hints are off.
All input paths share dependency and visible-seat validation.

## Dependency and physical-state model

The former `prerequisiteStepIds = previous step` chain is discarded. An authored
directed acyclic graph records supports and cover guards. Mainplate-supported
branches can proceed independently. Bridges wait for the internals they cover;
fasteners wait for their hosts. Dials close the corresponding face only after
its underlying work. Independent branches and equivalent fittings have no
artificial ordering. Source hierarchy establishes membership; host/cover evidence
comes from the inventory audit and source geometry. Remaining edges are labelled
conservative puzzle assumptions and require mechanical review.

Hard's multi-component packets use an explicit **workbench**. Tiny jewels,
bushings, barrel internals and nested shock-indicator parts justify a separate
close view: assembling them in the movement would hide their supports behind
the mainplate or surrounding bridges. Every leaf is individually placed. Each
complete packet is explicitly returned and seated in the movement; this transfer
adds no physical leaf to the count. No fitting is installed automatically.
Single components outside packets are placed directly in the movement.

Internal dependencies use the specific host, with covers waiting for their
contents. An unfinished packet can be left on the workbench while other branches
are explored. The main camera is saved on entry and restored on return. A
workbench has its own camera and labelled workspace; visibility changes only on
this explicit workspace transition. A complete packet can be transferred only
once and only when its external supports and cover guards are satisfied.

Sessions store committed action IDs and the hint preference. Physical membership
is derived separately from completed component actions and packet transfers.
Undo reverses the last action, including a transfer, without changing inventory
selection or moving the camera. Validation replays every action through the graph
and checks exact final membership. Earlier linear saves remain stored until the
player explicitly starts over; the level screen explains their incompatibility.

## Camera and rendering

Initial framing and Reset use only the immutable mainplate geometry (the packet
bounds in a workbench), centred in the measured usable viewport. The orbit target
is the actual geometry centre; camera projection offsets reserve the controls.
User orbit, zoom and pan survive all ordinary state changes. Resize adjusts
projection without taking camera ownership. Only Reset, Flip, explicit Reveal
and explicit workbench entry/return control the camera.

The old `presentContext` hides sightline intersections on every camera change.
Remove that path. Installed meshes retain their visibility and source materials
within their explicit workspace. Hint meshes use separate overlay materials.
Drops require a visible sample on the actual selected geometry; opacity is never
changed to make a blocked seat accessible. Explicit Reveal searches viewpoints
without hiding an obstruction. Mechanical dependencies and workspace preparation
must prevent inaccessible late internals, rather than accepting through covers.

## Review sequence

First exercise two independent barrels, an unavailable bridge, gallery browsing,
hint inspection, workbench entry, physical accounting and stable camera behavior.
Review real interaction and screenshots before extending the authored graph over
all packets. Then verify alternate legal orders, early covers, all input methods,
camera snapshots, phone centering, orbit visibility/material identity, exact
completion, nonlinear resume/undo and homepage isolation. Record actual results
and remaining limits below; local preview and commits only.

## Implemented review and evidence

The first representative browser slice selected Barrel assembly 1 before Barrel
assembly 2, inspected an unavailable barrel bridge with hints on, and placed a
chosen barrel without changing the camera or choosing its successor. Actual
screenshots were reviewed before the full inventory traversals. Follow-up review
caught overlapping labels at 200% text; the final gallery uses text-aware card
sizes and a bounded dock that supports both horizontal and vertical browsing.
Repeated Easy screws have globally distinct occurrence numbers. Hard cards name
their packet, and group counts distinguish parts to assemble from assemblies
still to seat.

The original visibility bug was confirmed in code: `presentContext()` both limited
fitted parts to historical step context and hid ray intersections on camera change.
Both paths are removed. Only explicit workspace entry changes the physical set
being viewed. Camera projection reserves inventory space while the orbit target
stays fixed on the mainplate geometry. Retry preserves the current camera and
workspace; context restoration retains committed progress.

| Verification | Actual result |
| --- | --- |
| Production Easy, desktop | 89 placements; 538 checks; exact 265 fitted leaves |
| Production Hard, reverse legal order, 320×844 | 249 individual placements + 35 explicit transfers; 1,708 checks; exact 265 fitted leaves |
| Earlier alternate traversals | Easy reverse order: 538 checks; Hard forward order at 390×844: 1,708 checks |
| Final production focused review | 111 checks: mouse/touch/keyboard, grab offsets, failed drops, capture cancellation, hints, availability/Undo, group/search scrolling, camera/pan/zoom, full orbit visibility/materials, workspace return, resume, old-save confirmation, context recovery, asset retry and storage failure |
| Responsive review | 1440×900, 390×844, 320×568, 320×568 at 200% root text, and 568×320; mainplate centering, text containment, scrolling and keyboard access |
| Dependency/state/geometry checks | 59 automated tests and 40 alternate graph traversals per level; immutable source endpoints, 16-leaf foundation, 265 included and 100 excluded leaves |
| Homepage | All 71 existing UX assertions, no Play payload requested, unchanged homepage source |
| Build and static checks | TypeScript, lint, production build, existing CPU source/runtime suite and local SEO/HTTP checks pass |

Camera evidence records position, orbit target, up vector and projection before
and after placement, failure, selection, hints, Undo and workbench return. Focused
ordinary actions measured zero drift; exhaustive traversal accepts only numerical
roundoff below 1e−9. Resize separately preserves camera pose and pan while updating
projection. Initial/Reset geometry centers differ from the measured viewport center
by less than 0.01 CSS px in the checked layouts. The 32-sample orbit covers more
than a full revolution and retains the exact visible-ID set and material identity,
opacity and transparency. Natural occlusion by other fitted geometry is expected.

### Cover guard discovered by reverse-order review

The first reverse Hard run correctly rejected a cap-jewel drop after an outer
diamond fitting had already closed its seat. The graph now makes that fitting
wait for the completed shock protection. The source bounds, failed artifact and
regression test are recorded in [the dependency ledger](PLAY_DEPENDENCIES.md).
The full corrected reverse-order run completes.

A further read-only audit checks **all 373 actions** (89 Easy, 249 Hard component
placements, 35 Hard transfers) in the most obstructed construction state their
DAG permits. Every non-descendant action is treated as complete; hypothetical
meshes use the original geometry, matrices and opacity without changing the game.
For each action, the audit finds an exposed source-surface sample from a sampled
viewpoint. All 373 pass. As opaque blockers are removed, such a clear ray remains
clear, so this checks every less-complete valid state for that sampled seat. It
supports visual reachability across the permitted graph, not physical insertion
paths, collision tolerances or service certification. The audit loads only when
explicitly invoked in inspect mode and does not enter the ordinary homepage or
ordinary Play request stream.

### Reproduction and artifacts

Production preview: http://127.0.0.1:4185/play (homepage at the same origin).
Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` to existing local installations as in the
README. No browser dependency was added to the project.

```sh
node scripts/play/validate-inventory.mjs
node --test tests/*.test.mjs
node scripts/play/browser-check.mjs http://127.0.0.1:4185 all
PLAY_ORDER=reverse PLAY_WIDTH=320 node scripts/play/redesign-check.mjs http://127.0.0.1:4185 hard
node scripts/play/access-check.mjs http://127.0.0.1:4185
```

Screenshots and numeric reports remain ignored in
`artifacts/browser/play-redesign/`. `production/` contains the final complete
traversals, focused report and homepage report. The root contains the earlier
forward/alternate-order comparisons and the maximal-obstruction `access-audit.json`.
The failed cover-guard evidence is retained separately, not reported as a pass.

Representative reviewed screenshots in `production/`:

- `easy-inventory-off.png` — Easy's full browseable inventory, hints off.
- `phone-easy-hints-on.png` — inspectable unavailable bridge and prerequisites.
- `hard-inventory-off.png` — Hard grouped inventory on a 320 px phone.
- `phone-hard-inventory-on.png` — Hard hint availability and remaining counts.
- `phone-hard-workbench-off.png` / `phone-hard-workbench-on.png` — explicit workspace and hint states.
- `hard-320-568-text200.png` / `hard-568-320-text100.png` — enlarged text and landscape.
- `easy-complete.png` / `hard-complete.png` — the identical audited finished set.

The last build after these complete traversals adds the lazy read-only access
audit hook/module and removes a duplicate live announcement. It does not change gameplay, graph rules, source geometry,
materials or layout. Its build/type/lint checks and targeted browser checks are
recorded with the final progress entry.

## Remaining limits

This is local implementation and browser review, not a visitor enjoyment study,
physical-phone/Safari review or accessibility certification. Workbench fixtures,
support dependencies and conservative dial closure remain documented puzzle
choices requiring mechanical review before any servicing claim. The source CAD
exceptions and publication/redistribution gates remain unchanged. No push, PR,
merge or deployment is authorized or performed under this brief.
