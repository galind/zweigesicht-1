# Homepage assembly entry and Workshop plan

Revised 26 September 2026 on `codex/play-workshop-redesign`. This supersedes
the earlier proposal to redesign an entry screen inside `/play`.

## Decision

Make assembly a deliberate path from the homepage:

```text
Homepage
  → Assemble the movement
  → choose Easy or Hard
  → /workshop?mode=easy|hard
  → start or resume the assembly immediately
```

There should be no second difficulty screen after navigation. The homepage owns
discovery and mode choice. `/workshop` owns the assembly itself. The old `/play`
URL becomes a compatibility redirect rather than a second route.

This is substantially simpler than repairing the current large Play entry card.
It also solves the largest product mismatch: the visitor sees the existing watch
first, then intentionally enters an assembly mode using a control that already
belongs to the homepage.

## Homepage call to action

### Placement

Add one persistent call to action in the top header, beside the existing
information/settings group rather than inside the movement-control dock.

Recommended label:

> Assemble the movement

This location keeps route navigation separate from actions that manipulate the
current viewer (`Disassemble`, `Focus`, `Configure`, `Flip`, and `Reset`). It is
also visible before the visitor learns the bottom controls.

On phones, keep the action visible beside the menu using the shorter visible
label `Assemble`; its accessible name remains `Assemble the movement`. Do not
hide the only route entry inside the mobile menu.

### Visual weight

The action should have more weight than the other header links without creating
a new gold game brand:

- medium/semibold text;
- a slightly stronger neutral translucent fill than the existing header group;
- the same 44 px target, radius, blur and focus treatment as homepage controls;
- no gradient, glow, oversized icon or permanent brass fill;
- a subtle hover/pressed surface change using the homepage timing.

The intended order on desktop is:

```text
Zweigesicht-1 · by Marco Lang       Assemble the movement  Learn…  Acknowledgements  Settings
```

At 320 px the exact full label cannot coexist safely with the identity and menu,
so the responsive `Assemble` label is an intentional adaptation, not truncation.

## Mode popup

Clicking the call to action opens a small shared Sheet/popup on the homepage.
It should reuse the existing panel surface, close control, motion, Escape
behavior and trigger-focus restoration.

Recommended copy:

```text
Assemble the movement
Choose how much of the movement you want to build.

Easy
89 prepared fits · Best for a first build

Hard
249 individual parts · 35 subassemblies

Progress is saved on this device.
```

The two modes should be simple full-width rows with a label, one explanatory
line and a chevron. Avoid cards inside the popup, difficulty icons, feature
bullets and a separate Continue button.

The choice itself communicates enough:

- **Easy** uses prepared assemblies and teaches the structure in 89 fits.
- **Hard** exposes 249 individual parts and 35 subassemblies as a long build.

The persisted values remain `easy` and `hard`, which already match this copy.
The former user-facing names `Workshop` and `Master bench` should be removed
from the chooser and replaced with `Easy` and `Hard` throughout the Workshop UI
where they describe the current mode.

## Navigation and saved-session contract

Use an explicit mode query for a deterministic handoff:

- Easy → `/workshop?mode=easy`
- Hard → `/workshop?mode=hard`

Do not pass the choice through transient React state or a new local-storage key.
The URL survives a hard navigation, failed JavaScript boot and storage-disabled
browser. Once the selected session has been saved successfully, the route may
replace the visible URL with `/workshop`; if saving is unavailable, retain the
mode query so refresh can reconstruct the in-memory choice.

Expected behavior:

| Situation | Result |
| --- | --- |
| No saved session + selected mode | Create that mode and enter assembly. |
| Saved session in the selected mode | Resume it immediately. |
| Saved session in the other mode with no progress | Replace it and enter the selected mode. |
| Saved progress in the other mode | Show one protective confirmation in `/workshop`: start the selected mode or keep/resume the saved one. |
| Corrupt/incompatible save + selected mode | Explain that replacement is required, then start only after confirmation. |
| Direct `/workshop` with a valid save | Resume it immediately. |
| Direct `/workshop` without a save or mode | Return to `/?assemble=1`, which opens the homepage chooser. |
| `Change difficulty` from Workshop | Return to `/?assemble=1`; keep the current save until another mode is confirmed. |
| Storage unavailable | Allow the selected mode in the current tab and state clearly that leaving/reloading may lose progress. |

`?assemble=1` is a UI entry hint, not permanent homepage state. Open the chooser
after hydration, then remove that query with `history.replaceState` so closing
or reloading the homepage behaves normally.

The existing storage key `zweigesicht:play:session:v1` should remain unchanged.
Renaming it would silently discard compatible user progress for no product
benefit.

## Route rename

### Public route

- Move `explorer/app/play/page.tsx` to `explorer/app/workshop/page.tsx`.
- Change route metadata, canonical and Open Graph URL to `/workshop`.
- Add a permanent `/play` → `/workshop` redirect that preserves query
  parameters.
- Keep `/workshop` `noindex` and outside the sitemap until the feature clears
  the existing physical-device, accessibility and release gates.
- Update README, QA scripts and current documentation that describes live
  commands or route contracts. Historical reports can keep `/play` when they
  are clearly recording an earlier state.

### Internal naming

The public rename does not require a risky all-at-once rename of `src/play`,
`.play-*` CSS classes, `PlayViewer`, test environment variables or the storage
key. Those names are implementation details and changing them would produce a
large low-value diff around sensitive renderer and test code.

Recommended first implementation:

- rename the route and user-facing terminology;
- optionally rename the top-level React component from `Play` to `Workshop` if
  it remains a small contained diff;
- leave renderer/state module names and compatibility keys alone;
- perform any internal naming cleanup later as a separate no-behavior change.

## Workshop startup

Remove the current inactive choice state and `.play-choice` UI entirely.
`/workshop` should resolve mode/save state, prepare the viewer and become active
without asking the same question twice.

Startup must still be honest:

1. Resolve the requested mode and saved session.
2. Resolve any replacement confirmation before destroying saved progress.
3. Initialize or restore the session.
4. Load the required geometry.
5. Focus the first available part when the rail is ready.

While geometry is loading, show the existing concise loading status over the
neutral movement field. Do not temporarily show the old mode chooser.

The mode query must be validated strictly. Values other than `easy` or `hard`
behave like a missing mode; they must never flow into session creation.

## Workshop UI that still needs polish or rework

Moving the choice upstream removes the worst entry screen, but it does not fix
the active UI by itself. The following work remains necessary.

### 1. Match the homepage shell

- Use the exact homepage `#181818` field instead of the Play radial gradient.
- Use the same `Zweigesicht-1` / `by Marco Lang` identity and 24 px desktop /
  16 px phone edge grid.
- Put `Easy` or `Hard` in the workbench rail, not inside the brand lockup.
- Restyle Clues and Menu as homepage text controls instead of blurred pills.
- Reuse the shared Sheet for Help and menu content.
- Remove the separate gold-label, heavy-border, glow and 64 px shadow system.

### 2. Reduce the active workbench

At 1280×720 the current dock is 1040×318 px; at 390×844 it is 374×315 px and
consumes 37% of the screen. It should become one compact rail:

```text
Easy       Ready now   All parts                0 of 89 fits
[ part ]   [ part ]    [ part ]   [ part ]   →
Selected part or short status                  Undo Flip Reset
```

Targets:

- approximately 220–230 px maximum height at 1280×720;
- approximately 220–240 px at 390×844;
- one horizontal 88–100 px part row;
- at least 44 px controls;
- accessibility-safe growth or internal scrolling at 320×740 / 200% text.

### 3. Show one progress measure

Keep `n of 89 fits` or `n of 249 parts` as the single persistent progress value
for the selected mode. The current simultaneous physical-part, fit, systems,
progress-bar and eight-segment display reads like instrumentation.

Detailed physical/system progress can open in a shared Sheet. Completed systems
still receive a quiet transient acknowledgment; no score, streak or arcade
celebration is added.

### 4. Simplify gallery cards

- Keep the corrected authored material previews and display encoding.
- Remove default decorative card gradients and repeated status such as
  `Prepared assembly` when the Ready view already guarantees readiness.
- Make the image and readable part name primary.
- Reserve secondary text for a meaningful exception: project, blocked item or
  required workbench.
- Keep a restrained brass outline for the current selection only.
- Do not restore the removed visible `Drag` badge.

### 5. Move advanced controls out of the rail

- `Ready now` and `All parts` stay visible as quiet text tabs.
- All-parts search and grouping move to a shared filter Sheet; draggable results
  remain in the rail so cross-panel dragging is unnecessary.
- Help, detailed progress, restart and change difficulty live in Sheets/menu.
- Undo, Flip and Reset remain the only persistent action buttons.
- Selection instruction and status share one line instead of stacking.

### 6. Finish the route language

Replace remaining user-facing `Play`, `Workshop`-as-a-difficulty and `Master
bench` terminology with a consistent hierarchy:

- feature/route: **Workshop**;
- action: **Assemble the movement**;
- modes: **Easy** and **Hard**;
- Hard sub-context: **Workbench** or the named subassembly;
- menu: **Workshop menu**.

The word `workbench` remains useful for a focused Hard subassembly. It should
not be used as the name of the difficulty itself.

### 7. Clarify exit and completion

Add `Return to the movement viewer` to the Workshop menu. Browser Back should
also return naturally to the homepage after the normal entry flow.

Completion should leave the assembled movement dominant and offer:

- `Explore the movement` → homepage;
- `Build again` → restart the same mode after confirmation;
- `Change difficulty` → homepage chooser.

## Mechanics that must not change

- 16 foundation leaves, 89 Easy fits, 249 Hard parts and 265 final leaves.
- Dependency graph, named projects, workbench transfers and exact endpoints.
- Fixed faces, explicit edge views, centered zoom and camera ownership.
- Source-scale carrying, visible-seat validation and forgiving snap radius.
- Undo, clues, Show seat, keyboard/touch alternatives and recovery behavior.
- Versioned save validation and current compatible progress.
- Authored part finishes and linear-to-display thumbnail correction.
- No timer, lives, penalty, score, servicing claim or automatic answer.

Challenge remains spatial: choose a currently valid part and discover its seat.
The simplified navigation must not simplify away the puzzle.

## Implementation plan

### Phase 1 — homepage entry

- Add the weighted header action and responsive label.
- Add the shared mode Sheet with the final Easy/Hard copy.
- Open it from `?assemble=1` and clean that query after hydration.
- Navigate with `prefetch={false}` or an equivalent deliberate navigation so
  the ordinary homepage still does not download the Workshop manifest or code.

Exit condition: the call to action is visible at desktop, 390 px, 320 px and
200% text; the modal is keyboard/focus correct; the unopened homepage retains
its existing payload boundary.

### Phase 2 — route and boot contract

- Add `/workshop`, metadata and the `/play` redirect.
- Parse and validate `mode`.
- Start/resume directly using the saved-session table above.
- Protect cross-mode replacement and storage-unavailable behavior.
- Remove the query only when doing so remains refresh-safe.

Exit condition: every URL/save combination has one deterministic outcome and
no existing valid save is silently cleared.

### Phase 3 — remove duplicate choice UI

- Delete the inactive `.play-choice` screen and related styles/state.
- Change difficulty by returning to the homepage chooser.
- Update loading, confirmation, direct-entry and completion focus behavior.
- Replace former mode names with Easy/Hard user-facing copy.

Exit condition: selecting a mode on the homepage leads to a loading or active
Workshop state, never another mode screen.

### Phase 4 — visual cohesion and compact rail

- Apply homepage shell tokens and identity.
- Rebuild the dock as the compact active rail.
- Collapse progress and card metadata.
- Move detailed/filter controls into existing Sheets.
- Recalculate the assembly viewport from the rendered rail bounds; do not use a
  guessed fixed offset.

Exit condition: the movement is the dominant object, the first valid part is
usable without Help and the rail meets the desktop/phone targets.

### Phase 5 — verification and documentation

- Update route-aware browser scripts from `/play` to `/workshop` and pass mode
  in test setup instead of clicking the removed choice screen.
- Verify `/play` redirect and query preservation.
- Verify homepage CTA/modal without eager Workshop payload.
- Verify new, same-mode, cross-mode, corrupt, incompatible and unavailable-save
  startup paths.
- Run a normal Easy fit, unavailable All-parts attempt, clue/Show seat, Undo,
  Flip, Reset and a Hard workbench transfer.
- Run inventory, unit/lifecycle, TypeScript, lint and production build.
- Inspect matching desktop, 390×844, 320×740 and 200% text screenshots.
- Keep physical-phone, Safari and representative human testing explicit.

## Files likely to change

- `explorer/app/page.tsx` and `explorer/app/globals.css`: CTA and mode Sheet.
- `explorer/app/workshop/page.tsx`: renamed route and metadata.
- `explorer/next.config.ts`: `/play` compatibility redirect.
- `explorer/src/play/Play.tsx`: startup contract, removed choice screen and
  Workshop terminology.
- `explorer/src/play/play.css`: removed choice styles, shared shell and compact
  rail.
- Route/browser checks under `scripts/play/` and `scripts/review/`.
- README and current route/QA documentation.

The manifest, controller, renderer, authored assets and storage key should not
change for this work.

## Acceptance criteria

- The homepage visibly offers `Assemble the movement` without weakening the
  watch itself as the main subject.
- The chooser contains only Easy, Hard and the minimum copy required to choose.
- A mode selection reaches `/workshop` and enters loading/assembly directly.
- `/workshop` resumes a compatible saved session without another chooser.
- Switching modes never destroys progress without an explicit confirmation.
- `/play` redirects to `/workshop` and preserves query parameters.
- The ordinary homepage does not eagerly load Workshop code, manifest or CAD.
- `/workshop` uses the homepage identity, field, typography, controls, panels
  and motion.
- The movement remains visually dominant at desktop and phone sizes.
- Only one progress value and three persistent actions occupy the default rail.
- Gallery finishes remain authored and color-correct.
- Existing inventory counts, placements, camera behavior, saves, workbenches,
  inputs and recovery paths pass regression checks.
- No new browser errors or unexplained warnings.

## Details still worth confirming

1. **CTA location:** top header beside the information actions. Recommended over
   the bottom viewer-control dock.
2. **Exact label:** `Assemble the movement` on desktop and `Assemble` on narrow
   phones. Recommended.
3. **Difficulty names:** use the requested `Easy` and `Hard` everywhere the
   current mode is named; keep `Workbench` only for Hard subassemblies.
   Recommended.
4. **Saved progress:** selecting the saved mode resumes; switching modes asks
   before replacement. Recommended.
5. **Old URL:** permanent `/play` redirect, with the internal storage key and
   renderer module names retained for compatibility. Recommended.
6. **Indexing:** keep `/workshop` out of search and the sitemap until release
   gates are cleared. Recommended.
