# Workshop review and Atelier redesign

8–9 October 2026. Scope: the private working application, its authored puzzle,
interaction code, local browser experience and automated checks. This is a
product/design assessment, not a user study or mechanical certification.

## Decision

Make Workshop an **Atelier journey**: a substantial object to build in small,
understandable chapters, with optional assistance and a satisfying view of the
result. Keep the existing free-placement puzzle and exact source geometry.

The differentiator is the watch itself. A successful session should move from
“I don't know what these parts are” to “I made that” without requiring someone
to already understand watchmaking or commit to hundreds of unexplained actions.
The interface should invite close looking as well as correct placement.

## Investigation

Reviewed the route/entry gating, first-use chooser, loading/recovery lifecycle,
session validation and persistence, dependency graph, action and physical-leaf
accounting, workbench transfers, camera ownership, drag/drop and exposed-seat
rules, keyboard controls, responsive layout, completion and existing tests.
Inspected the running interface before editing and exercised the replacement
through its public buttons. The existing inventory validator provides alternate
legal-order coverage separately from browser placement checks.

The baseline has 89 Easy placements and 284 Hard actions: 249 individual
placements plus 35 explicit transfers. Both retain 16 foundation leaves and
finish at 265 fitted leaves. The eight Workshop groups are distinct from the
explorer's six mechanism groups. This distinction matters when counting chapters.

### Findings, in priority order

| Finding | Evidence | Consequence | Response |
| --- | --- | --- | --- |
| The first decision is too large | Fresh Easy presents 19 ready pieces in one horizontal tray; Hard has 40 legal actions across benches | A novice must choose without knowing what a good start looks like | Optional first-fit guide plus a chapter introduction; free choices remain |
| There is no visible destination | Initial view is a bare mainplate; completion is many actions away | Visitors cannot judge whether the investment will be rewarding | Finished-movement preview available throughout the build |
| Progress is mostly a counter | Main rail says “0 of 89 fits”; system completion is a transient sentence | Long builds feel repetitive and intermediate accomplishments are easy to miss | Eight-chapter map, local progress, completion state and chapter-specific observations |
| Hard navigation is a second puzzle | User must locate a group, open a packet, finish it, leave the bench, find its transfer, select and reveal its seat | Navigation work competes with understanding the object | Guide routes to a legal bench action and explicitly offers the completed transfer next |
| Assistance is discoverable late | Show seat appears after selection; keyboard placement is described in Help | Users can assume precision dragging is mandatory | Guide reveals the seat; a named Fit part button exposes click/keyboard placement |
| Blocked pieces offer generic feedback | “Waiting for earlier work” omits actual dependencies | Users cannot tell what is missing | Selected blocked parts name their direct missing prerequisites; guide can follow the graph |
| Completion is underplayed | The same dock reports completion beside navigation buttons | The finished object has no dedicated moment | “You built this” completion and a full viewing mode with Flip, Reset and return |
| Production entry breaks discoverability | Homepage chooser and assemble query are compile-time disabled | Direct entry without a saved mode can bounce to a homepage without a chooser | Restore entry consistently in all builds; retain noindex and release gates |
| Resize and browser state need care | Camera state, selection, bench context and source membership are separately owned | UI embellishment could silently alter progress or move a user's camera | Preview has an explicit presentation-only lifecycle; graph and save schema remain unchanged |

### Research used as design input

[NN/g on recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/)
supports exposing meaningful choices and context instead of requiring remembered
instructions. [NN/g on visibility of system status](https://www.nngroup.com/articles/visibility-system-status/)
supports making ongoing progress understandable. These are general principles;
they are not evidence that this particular redesign will increase retention.

[W3C's explanation of dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
identifies the need for an alternative that does not require a dragging gesture.
The existing destination button already provided a route; making a named Fit part
control prominent improves its discoverability. This change alone does not
establish complete WCAG conformance or make spatial geometry nonvisual.

## Options considered

Scores are design judgments on a five-point scale, not measured user outcomes.
Higher is better; feasibility includes engineering and existing evidence limits.

| Direction | First-session clarity | Distinctive appeal | Depth | Feasibility | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Visual polish and richer placement effects only | 2 | 3 | 2 | 5 | Useful finishing work, insufficient as the core change |
| Timed challenges, scores and streaks | 3 | 3 | 3 | 4 | Repetition gains a metric but speed competes with close observation; no evidence of demand |
| Fully running mechanical simulation | 3 | 5 | 5 | 1 | Attractive, but separate mechanical scope with unresolved evidence/review requirements |
| Strict linear assembly tutorial | 5 | 3 | 2 | 4 | Good initial clarity, but removes valid alternate orders and turns the puzzle into a checklist |
| Atelier journey with optional guide and finished preview | 5 | 4 | 4 | 5 | Selected: improves entry, understanding, continuity and payoff while preserving free assembly |

A shorter standalone sample puzzle remains a promising future experiment, but
needs a carefully chosen self-contained leaf/dependency set and a separate save
policy. Automatically skipping 70 fits to fabricate a quick victory would weaken
ownership of the result. Accounts, leaderboards, audio, certificates and sharing
are not needed to validate this core experience and would add unrelated scope.

## Implemented experience

- The homepage introduces eight chapters and distinguishes prepared Easy fits
  from Hard workbench assemblies. The Workshop entry now compiles into every build.
- Desktop has a restrained editorial companion, visually separated from the CAD.
  A compact chapter strip remains on smaller screens. The map exposes all eight
  chapters, counts, readiness and a short invitation for each.
- Guide my first fit / Guide next fit selects an available action in the current
  chapter, stays with an active bench where possible, and prioritizes ready
  transfers. If the selected chapter is blocked, it follows its prerequisites.
  Once a chapter is complete, it finds remaining legal work. It never commits a
  placement, skips actions or substitutes display order for graph validity.
- Guide handles workspace and radial fitting-view changes, then reveals the seat.
  The visitor still commits by dragging, clicking the exposed destination, or
  pressing Fit part. Camera changes and placement still use existing access rules. Guidance defers redundant old-view seat checks; camera travel hides the target and verifies access at its settled endpoint.
- The chapter map is a navigation aid, not a new dependency restriction. Easy's
  open tray and Hard's group/bench inventory remain available for independent play.
- Completion notices are complemented by persistent chapter completion and
  observations about the visible construction. Editorial notes deliberately
  avoid unsupported claims about servicing, insertion clearance or running timing.
- Preview shows the full final geometry without writing progress. Returning
  restores the previous camera, bench and selected part. Preview and the final
  viewing mode expose an explicit return button and Escape exit.
- Existing saves are retained. Resume derives the chapter from the last action.
  Corrupt/incompatible saves still require explicit replacement; storage failures
  retain the current-tab warning. No new account or save migration is introduced.

## Acceptance and remaining evidence

The implementation must pass graph traversal from every preferred chapter in
both difficulties, exact action accounting, bench continuity/transfer priority,
Undo symmetry, existing regression checks, typecheck, lint, inventory validation
and a production build. Browser verification must cover real guided placement,
final edge fittings, preview/return, Hard benches, small viewports, recovery and
completion. Current results are recorded in PROGRESS.md.

The strongest product hypothesis is that visitors will reach their first fit and
first chapter completion more readily. It remains a hypothesis. A representative
review should ask first-time visitors to start without instruction, find a legal
fit, use both placement methods, explain the chapter map, leave/resume and return
from preview. Observe hesitation, errors and abandonment; do not treat screenshots
or automated completion as proof that everyone will love the feature.

Suggested evaluation measures: first successful placement, first chapter finished,
returning to a saved build, help/guide use, and self-reported understanding and
satisfaction. No new telemetry or tracking was added. Physical touch devices,
screen-reader usability, sustained mobile thermals and expert mechanical review
remain separate gates. Site deployment and CAD redistribution remain subject to
the existing release policy; enabling a local build's entry is not publication.
