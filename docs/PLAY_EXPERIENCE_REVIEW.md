# Play experience review and improvement plan

Reviewed 26 September 2026 from `codex/play-assembly` at `6f7ced9`, including
the current `/play` UI, state and renderer code, authored manifest, prior design
reports, browser screenshots, production reports and Git history.

## Conclusion

Play is technically careful but product-wise upside down. It asks the player to
operate an inventory system before it gives them a satisfying assembly loop.
The exact CAD endpoints, nonlinear dependency graph, forgiving snap, fixed
views, save/resume and workbench model are valuable. The primary presentation
of 89 or 249 items, however, turns that depth into visual and cognitive load.

The strongest version of the feature is a calm workshop puzzle:

1. choose among pieces that can be fitted now;
2. recognize the part and find its seat without an automatic answer;
3. use an explicit clue only when wanted;
4. receive immediate, quiet feedback and visible mechanism progress;
5. enter a focused subassembly bench only when the chosen project requires it.

Challenge should come from spatial recognition and construction relationships,
not from invisible prerequisites, tiny hit targets, or searching a database.

## What was reviewed

- Both 89-fit Workshop/Easy and 249-part Hard flows.
- Start, resume, level change, restart and completion states.
- Mouse, touch and keyboard placement paths.
- Part selection, drag, snap, undo, flip, reset, clues and explicit reveal.
- Main watch, dial-edge view and 35 Hard subassembly workbenches.
- Responsive screenshots at desktop, 390 px, 320 px and enlarged text.
- State validation, persistence, camera ownership and renderer lifecycle.
- Prior production reports and error logs under `artifacts/browser/play-*`.

## Findings

### P0 — the core loop is buried under inventory management

The first active screen presents a progress counter, group selector, search,
horizontal card strip, selected-part explanation and five persistent utility
actions. In Hard, the player sees individual leaves that actually belong on one
of 35 separate benches. Selecting a leaf, learning that it belongs elsewhere,
opening that bench, returning, picking up the assembly and finally seating it
creates several administrative steps around one physical idea.

This is the main reason the feature feels annoying. The workbench dependency
model is useful; exposing its storage schema as the primary navigation is not.

Decision: make currently usable work the default surface. In Hard, represent a
subassembly as one named bench project at watch level. Show its individual
pieces only inside that workbench.

### P0 — difficulty is often frustration rather than understanding

With hints off, every remaining item looks equivalent even when its hidden
prerequisites make it impossible to fit. A failed attempt can therefore mean
either “wrong seat” or “not constructible yet.” With hints on, the interface
reveals dependency status and destination, removing much of the puzzle. The
result is an awkward choice between opacity and instruction.

Decision: the default Ready now tray contains only constructible choices but
does not reveal their seats. The puzzle remains “where does this valid part
belong?” All parts remains available for experts and dependency inspection.
Clues and Show seat stay explicit.

### P1 — scale is impressive but the commitment is demotivating

“0 / 249 parts assembled” is technically honest but emotionally flat. It gives
no nearby goal, no mechanism milestone and no sense of what changed. Easy also
shows 249 physical leaves even though the player's actual interaction is 89
prepared fits. Hard has 284 actions after transfers despite being sold as 249
parts.

Decision: show both physical-part and fit progress, plus eight mechanism
segments. Celebrate a completed subassembly or system in the existing live
feedback instead of adding points, timers or disruptive animation.

### P1 — the visual hierarchy resembles a CAD utility panel

The baseline uses a large, uniform grey panel with small labels, low-contrast
metadata, rectangular form controls and six equal-weight actions. The watch is
large but the active decision is visually weak. Selection is mainly a thin gold
border. On narrow phones, captions truncate and the action row becomes a strip
of icon-label abbreviations.

Decision: use a restrained dark workshop surface with warm brass emphasis,
stronger type hierarchy, larger part previews, a compact segmented inventory
switch and one selected-part instruction. Keep Undo, Flip and Reset in the
primary row; move restart, challenge selection and help into a labeled menu.

### P1 — touch requires learning an implementation detail

Mouse can drag a card directly. Touch must first select a card and then drag the
image-sized overlay. The prior follow-ups improved discoverability, but the
selected overlay remains an invisible control made visible only by a small
label. The long help copy is carrying knowledge the interface should convey.

Decision: retain gallery swiping and the two-step touch gesture, because they
prevent accidental drags, but make the selected preview visibly say Drag and
keep the instruction adjacent. Preserve the keyboard Show seat alternative.

### P1 — Hard workbenches lack a satisfying transition and first state

A workbench opens as an empty canvas until its first foundation piece is fitted.
That is mechanically accurate but visually reads as a rendering failure.

Decision: show a quiet fixture marker and “fit the first bench piece” cue until
the first component is present. The cue does not reveal the part's final seat.

### P2 — mode names and entry copy do not set expectations

Easy/Hard suggests the same game with a difficulty multiplier. In reality they
are different commitments: 89 prepared fits versus 249 individual parts and 35
subassemblies. The original entry screen does not explain that the full build
is deliberately long.

Decision: rename the experiences Workshop and Master bench in the UI, explain
their granularity before start and say explicitly that the long build saves.
The persisted state values remain `easy` and `hard` for compatibility.

### P2 — accessibility is mechanically strong but cognitively dense

The feature has labeled controls, focus handling, live announcements, reduced
motion, non-drag placement and responsive checks. Those are real strengths.
They do not solve the cognitive cost of hundreds of equivalent controls,
repeated tiny metadata or a live region that has to explain context changes.

Decision: reduce the number of controls in the default tab order, use semantic
progress, retain a complete all-parts view, and preserve the existing input,
focus, reduced-motion and recovery behavior.

## Mechanics to preserve

- Immutable source geometry and exact authored assembly endpoints.
- Nonlinear dependency validation and cover guards.
- A forgiving CSS-pixel snap radius independent of camera zoom.
- Fixed faces, centered zoom, explicit edge views and stable camera ownership.
- Explicit subassembly workbenches and transfers with exact part accounting.
- Undo, versioned local resume, corruption handling and asset retry.
- No timer, penalties, lives, failure color or servicing claims.

## Logs and prior evidence

The reviewed production reports contain no browser errors and their recorded
checks pass. Git history also shows repeated fixes for camera direction, drag
discoverability, source scale, fixed views and opening orientation. This is good
evidence for runtime care.

It is not evidence that Play is enjoyable. The reports optimize for successful
completion, exact leaf counts, reachable targets and layout containment. They
do not include human completion time, abandonment, repeated failed selections,
comprehension, delight or preference. The very large assertion totals can make
the feature appear healthier than the user experience is. For this review they
are treated as regression protection, not product validation.

The earlier failed browser run caused by a build overlap is also dismissed: the
stable rerun passed and it says nothing useful about the present interaction.
Mechanical audit logs remain relevant to source claims but do not decide UI.

## Implementation plan

### Phase 1 — repair the core loop

- Default to Ready now: unplaced actions whose explicit prerequisites pass.
- Keep All parts as an intentional secondary inventory with search.
- Preserve hidden-seat challenge; keep Clues and Show seat optional.
- In Master bench, replace watch-level child leaves with named project cards.
- Restrict an open workbench to that subassembly's own pieces.

### Phase 2 — establish a workshop hierarchy

- Redesign the entry screen with honest mode scope and resume status.
- Give the watch the dominant visual field.
- Add physical-part, fit and system progress without turning the experience into
  an arcade score.
- Reduce persistent controls to the actions used during almost every fit.
- Move restart, challenge selection and instructions into a clear menu.

### Phase 3 — add rhythm and feedback

- Announce successful fits succinctly.
- Call out completed subassemblies and mechanisms.
- Acknowledge a clue-free fit privately without turning it into a persistent
  score or streak.
- Give completion a dedicated state with the assembled movement still visible.
- Represent an empty subassembly bench as an intentional fixture.

### Phase 4 — verify the experience

- Preserve unit, inventory, runtime, type, lint and production-build checks.
- Update browser checks to understand Ready now and project cards.
- Verify both a normal fit and an unavailable All parts attempt.
- Verify a Master bench project, return and transfer.
- Inspect desktop, 390 px, 320 px, 200% text and reduced motion.
- Keep physical-device/Safari and representative usability review explicitly
  outstanding until they occur.

## Success criteria

- A first-time player can begin a valid fit without search or documentation.
- The default tray never asks the player to guess an invisible prerequisite.
- The seat remains a puzzle until the player explicitly requests a clue.
- Hard exposes a comprehensible set of projects at watch level, not 249 leaves.
- The user can always inspect the complete inventory and dependency explanation.
- Watch, tray, selected instruction and essential actions remain legible at 390
  and 320 px without page overflow.
- Existing progress, geometry, materials, camera, recovery and homepage
  isolation remain intact.

## Deliberate non-goals

- No simulated tools, torque, collision physics or servicing certification.
- No points economy, countdown, lives, daily streak or public score.
- No source-geometry, material or manifest dependency rewrite in this pass.
- No homepage link or publication before the existing release gates clear.
