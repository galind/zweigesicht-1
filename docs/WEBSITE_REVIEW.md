# Website implementation review — 26 September 2026

Review scope and acceptance criteria: [WEBSITE_REVIEW_GOAL.md](WEBSITE_REVIEW_GOAL.md).
The starting point is `4211193`, on a separate local `codex/website-review`
branch. The connected GitHub app confirmed PR #12 was open and unmerged, with
head `7f124c0` and base `db8a664`. Its implementation and the unrelated untracked
`docs/PLAY_AGENT_PROMPT.md` are preserved. No push or publication is part of this
review.

Verified implementation commit: `1888891` — `Improve viewer lifecycle and
responsive accessibility`. Working local production previews:
<http://127.0.0.1:4183/> and <http://127.0.0.1:4183/play>.

## Architecture and ownership

| Boundary | Explorer `/` | Assembly `/play` | Disposition |
| --- | --- | --- | --- |
| React intent and presentation | `app/page.tsx`, configuration/information panels; UI dispatches viewer actions and renders snapshots | `src/play/Play.tsx`; ordered session prefix, persistence, selection and confirmations | Keep route ownership explicit; native text/Flip/Reset controls and Sheet already shared |
| State | `experience/state.ts`, `watch.ts`, `dials.ts`; configuration normalization, history and visibility | `play/state.ts`; exact ordered-prefix validation, guarded commits, undo and storage failures | Different contracts; do not combine or change saved schema |
| Scene and camera | `MovementViewer.ts`; source matrices, optional catalog, selection, reveal, case and inventory transitions | `PlayViewer.ts`; mandatory assets, fitted set, current staged piece, target projection and capture | Separate controllers; share graphics operations with identical ownership |
| Camera math | `CameraFrame.ts`, `CasePose.ts`, `HandDisplayPose.ts` | Same basis/orbit/zoom helpers; authored guided framing and source target poses | Keep common camera math; route framing and case movement remain distinct |
| Appearance and assets | Shared materials, source-surface annotations, recovered diamond, contact shading and studio environment; case recovery is explorer-only | Same movement appearance and original source instances | No CAD regeneration or changed materials, transforms, membership or provenance |
| Loading and recovery | Required overview and optional coalesced catalog; retain latest configuration intent | Required complete geometry; no partial assembly or completion after failures | Share cleanup primitives, not loading policy |
| Diagnostics | Lazy `InspectionPanel` and browser suites under `?inspect=1` | Read-only inspection for DOM gameplay verification | Ordinary home must contain neither Play data nor benchmark implementation |
| Styling and adaptation | Global design tokens, native controls, Sheet and responsive explorer navigation | Route CSS for staging, choice, progress and confirmation | Shared primitives stay shared; route-specific layout stays local |

The two largest controllers are large because they own different scene
invariants. Splitting either into an all-purpose viewer would move these
invariants across conditionals without simplifying them. The review measures
duplicated lifecycle paths and competing behavior, rather than declaring lower
line count a success. Existing dependencies were traced to actual imports:
Base UI owns focus/popups/selects/sliders, Lucide owns icons, Three owns rendering,
and the class utilities support these primitives. No unnecessary dependency was
identified that justified a package migration.

### Control meanings

| Action | Meaning, state and keyboard behavior |
| --- | --- |
| Shared Flip / Flip movement (`FlipHorizontal2`) | Change viewed face; retain configuration or assembly progress. Disabled during unavailable/busy Play rendering; homepage retains its existing availability. |
| Shared Reset / Reset view (`RotateCcw`), canvas Home | Restore the current face's framing. Homepage also restores its established assembled view while retaining preferences; Play retains all placed pieces. Phone's shorter caption retains the full accessible name. |
| Home Disassemble (`Layers`), Focus (`ScanSearch`), All parts | Separate current content, frame a functional section, or toggle inventory. These are intentionally distinct from Play's placement rules; availability and selected state remain controller-derived. |
| Home Configure | Independent case/dial preferences and remembered hand choices; asynchronous loading does not overwrite newer intent. No equivalent Play control is introduced. |
| Home Menu / More / Learn / Acknowledgements / Settings / Find a component | Responsive navigation and shared Sheet panels; existing panel exclusivity, dismissal and visible-trigger focus return retained. Selection/isolation remain explicit explorer actions. |
| Play Show placement (`LocateFixed`) | Restore the current step's authored side and camera, including oblique dial screws. Hidden after completion; never clears progress. |
| Play Undo (`Undo2`) | Remove precisely the previous committed step; disabled at the foundation or while unavailable/busy. |
| Play Hint (`Lightbulb`) | Toggle stronger visual guidance with `aria-pressed`; only shown for a current piece. |
| Play Restart / Play again (`ListRestart`) and Difficulty (`Gauge`) | Confirm destructive restart; choosing difficulty preserves the save until another game starts. Cancel restores the trigger; leaving gameplay focuses the choice heading. |
| Play Select piece / Place at destination | Real drag/touch path plus native Enter/Space selection and destination activation. Target disabled until selected. Keyboard completion moves focus to the next piece, or completion heading. |
| Play How to play / shared Close | Shared nonmodal Sheet, Escape dismissal, scrolling body and trigger focus return. Root text scaling now includes its portal. |
| Canvas arrows, plus/minus, Escape | Shared 0.2-radian orbit and 0.83/1.2 zoom factors. Explorer inventory arrows retain panning. Escape deselects explorer content or cancels Play capture; dialogs/panels retain their dismissal semantics. |

No global keyboard shortcut was added. Native buttons retain native keyboard
activation, rather than introducing a second synthetic action path.

## Findings and disposition

| Priority | Concrete finding and consequence | Implementation / verification boundary |
| --- | --- | --- |
| Required, high | `MovementViewer.tick` unconditionally scheduled another RAF. Draw-count checks passed while idle CPU callbacks continued at display refresh rate. | Demand scheduling must stop callbacks as well as draws, wake on intent/resize/visibility/recovery and preserve damping, transitions and opt-in capture. |
| Required, high | `PlayViewer.load` could insert some pieces before a later material/surface setup exception; successful source resources were then disposed underneath partial scene clones. | Transactional scene preparation and injected failure after the first prepared piece; exact cleanup and successful retry. |
| Required | Play metadata finishing after unmount could launch the remaining heavy asset requests. | Check request generation and disposed state before launching geometry loads. |
| Required | Two renderer/light setups, three environment creation paths, and two disposal traversals repeated the same ownership decisions. | Small exercised graphics/resource helpers, retaining optional versus mandatory loading policies. |
| Required | `MovementViewer` statically imported benchmark implementation although inspection is opt-in. | Type-only runtime dependency and callback supplied by the lazy diagnostics module; inspect requested ordinary script bodies. |
| Required | Play confirmation had no accessible name/description; choosing Difficulty removed the return-focus trigger. | Label the native dialog and define focus destinations for cancel, level choice, start/resume and keyboard placement. |
| Required | Independent `?text=200` implementations disagreed: Play scaled only its main element, leaving portaled Help at normal size. Home did not restore root styling on exit. | One root text-preview hook with cleanup, exercised by both routes and portaled panels. |
| Required | Fixed footer spacing did not follow multiline storage warnings; Play omitted bottom/side safe-area reservation. | Measure the rendered storage message, reserve its height and safe-area offsets, test enlarged short screens. |
| Cleanup | Play duplicated screen-reader-only and reduced-motion rules already supplied globally. | Remove redundant rules while retaining their shared behavior. |
| Required | Short enlarged portrait could invert the available assembly region and put a destination ring under Help; a narrow landscape caption extended beyond the viewport. | Measure scene/chrome clearance, use a compact side-by-side presentation only when vertical room is insufficient, and keep captions within the visible edge. |
| Required | Homepage phone dock relied on the test-only `text-enlarged` class for wrapping; ordinary root text enlargement broke labels into fragments. | Content-sized flex wrapping preserves five normal-size actions and gives enlarged labels their full width without a test-mode dependency. |
| Optional | Remaining large React/controller modules and comprehensive generated UI primitive variants. | Defer broad decomposition: no demonstrated behavior or ownership gain from cosmetic wrappers or pruning supported primitive variants. |

Measured sharing units are two renderer setup bodies → one, two light rigs →
one, three PMREM allocation/cleanup bodies → one, and two scene-resource disposal
traversals → one. Two conflicting text-preview implementations now use one hook.
Seven obsolete global style blocks/eight selector occurrences for removed
input-group, combobox and toggle-group components are removed. Active primitive
variants and responsive cascade rules remain.

The resource helper disposes each geometry/material once within an owned scene;
it does not assume it owns arbitrary external texture maps. The prepared overview
and catalog have 138 and 201 materials respectively, but zero textures/images in
their GLB headers. Authored finishes are procedural; controllers separately own
their PMREM render target, and contact shading owns its pass/noise texture.
Play retains decoded source scenes to own geometry shared by its clones. Pruning
unused source leaves may be a future measured memory optimization, but is not an
unresolved leak or a claimed memory saving here.

## Verification and evidence

Raw logs, screenshots and comparable browser measurements are ignored under
`artifacts/browser/website-review/`. Baseline production build: 51 automated
tests, inventory validation, available CPU runtime suite, TypeScript and lint
pass. Baseline browser: all 71 explorer UX assertions and 61 focused Play
assertions pass, with no uncaught page errors. These existing checks did not
detect perpetual idle callbacks or the dialog naming/focus gaps above.

The CPU baseline contains 114 checks. Correctly scaled baseline screenshots
also expose a 20.6 × 25.8 px ring/Help overlap at 320 × 568 with 200% root text,
a staging caption extending about 3 px beyond the left edge at 568 × 320, and
an unavailable-storage warning overlapping the dock by 38 px at 320 × 740.
Early experimental screenshots that combined Play's old query scaling with
root scaling were effectively 400%; they are superseded and do not support
200% claims.

The new lifecycle regressions execute actual controller methods with deterministic
RAF and network/resource facades. They verify coalesced work, real OrbitControls
inertia, exact camera/pose completion, final snapshots before sleep, visibility
and context suspension, rendering failure/retry, and diagnostics wakeup. Loading
tests inject surface, pose and finish failures after preparation begins and
assert that old complete resources survive while new resources are released
exactly once. A pending metadata/unmount test asserts that no geometry request
starts. Compact-layout coverage includes wrapped captions and a 44 px inset.
These tests observe ownership and behavior; they do not replace browser WebGL
or user-input verification.

Build notices remain the existing Node `module.register()` deprecation, a
minified chunk over 500 kB, and vinext's unknown route classification. They do
not represent new failed checks. Expected injected asset failures print console
messages in the CPU/browser harnesses; uncaught browser errors are tracked
separately.

| Verification | Result |
| --- | --- |
| Automated state, camera, build and lifecycle tests | 59 passed |
| Prepared CPU source/runtime suite | 114 passed; prepared ignored prerequisites available |
| Inventory/source validation | 16 foundation leaves, 89/249 actions, exact common 265-leaf final set; unchanged `play-3` |
| Complete production DOM run | Easy 89/89 and Hard 249/249; 6,458 top-level assertions passed, zero uncaught errors |
| Homepage UX within the complete run | All 71 existing assertions passed; ordinary homepage requests exclude Play payload |
| Additional explorer production suites | 350 assertions: watch 200, dial 57, inventory 22, camera 19, interaction 32, explosion 8, disassembly transitions 12 |
| Opt-in diagnostics | Real Flip capture and all three phases of the 60-second benchmark complete |
| Final-build Play checks | 99 controls, 26 dialogs and 61 focused interaction/recovery assertions; all pass |
| Final browser review | 197 layout/accessibility/recovery checks pass, zero uncaught errors |
| TypeScript, lint, build, SEO/HTTP | Pass with existing build notices |

The complete Play run exercises real mouse, browser touch and keyboard placement,
misses, capture interruption, transition undo/replay and refresh/resume. Every
Hard target is checked at both 390 × 844 and 320 × 844, including both oblique
dial-retaining screws. Both final renders contain exactly 265 fitted, visible
and geometry-backed leaves. The focused part also verifies corrupt/incompatible
and unavailable storage, required-asset retry, WebGL context restoration and
idle rendering. The deeper explorer run covers configuration combinations,
selection, isolation, Focus, All parts, disassembly, Flip, Reset, resource reuse
and recovery.

The final inset-only changes followed the exhaustive runs: zero-inset placement
regions, inventory, source transforms, progress and camera math are unchanged.
The final production build receives fresh controls/dialog/focused, responsive,
safe-area, required-asset recovery and payload checks. This distinction avoids
claiming every assertion was repeated after an unrelated margin correction.

The responsive matrix includes 1440 × 900, 390 × 844, 320 × 740,
320 × 568, 568 × 320 and 844 × 390, with actual 200% root text,
reduced motion and explicit query-preview checks. Each scrolling Play dock's
controls are reached by focus/scroll and hit tested; complete stage, target and
caption rectangles clear the header and controls. Chrome resolves injected
portrait top/bottom 44/34 px and landscape left/right/bottom 44/44/21 px safe
insets, and both routes’ controls stay within them. Help, confirmations and level changes
have tested focus destinations. The homepage's no-3D description/keyboard path
and required-overview failure both recover through the visible Retry action.

Reviewed screenshots include ordinary desktop/phone routes, enlarged short
portrait and landscape layouts, Help and dialogs, storage failure, nonzero safe
areas, both Easy and Hard dial-retaining screws, and both completed faces.
Browser emulation establishes these observations, not physical-phone/Safari or
representative assistive-technology certification. No required implementation
finding remains open; the optional decomposition and memory opportunities above
are deliberately deferred. The existing human, device, mechanical and publication
release gates remain outstanding.

### Comparable performance measurements

Same Chrome, assets, cold context, 1440 × 900 viewport and reduced-motion setting;
the detailed report records the browser version and each resource. Resource
totals exclude the main document, whose navigation entry is recorded separately.
Request counts include the existing analytics attempt. These are local HTTP
encoded-body bytes, not a claim about deployed compression.

| Metric | Baseline | Final |
| --- | ---: | ---: |
| Home requested JS | 1,643,261 B | 1,643,148 B |
| Play requested JS | 3,129,694 B | 3,131,571 B |
| Home all resource bodies / requests | 7,621,844 B / 17 | 7,621,002 B / 17 |
| Play all resource bodies / requests | 18,611,411 B / 19 | 18,613,575 B / 19 |
| Home RAF callbacks during 1,000 ms settled observation | 60 | 0 |
| Play RAF callbacks during 1,000 ms settled observation | 0 | 0 |
| Homepage build JS gzip sum | 437,804 B | 437,653 B |
| Build CSS raw / gzip sum | 73,831 B / 14,512 B | 74,118 B / 14,551 B |

Play's additional 1,877 requested JS bytes (about 0.06%) implement transaction
cleanup, accessibility and constrained-layout behavior. Request counts and CAD
assets are unchanged. Home idle *callbacks* stop; the old implementation already
avoided unnecessary GPU draws, so this is not a claim of 60 saved rendered frames
per second. Post-idle keyboard orbit, Flip and Reset visibly change the canvas,
then return to zero callbacks. Ordinary home scripts contain neither Play data
nor the optional benchmark implementation. Timing samples include navigation,
network idle and start interaction; they are not load-to-interactive benchmarks.
No loading-speed or memory-reduction claim is made.

## Reproduction

```sh
node --test tests/*.test.mjs
node scripts/play/validate-inventory.mjs
node scripts/cad/review-runtime.mjs
cd explorer
npm run typecheck
npm run lint
npm run build
npm start -- --hostname 127.0.0.1 --port 4183
```

From the repository root, set `PLAYWRIGHT_MODULE` to the existing local
Playwright `index.mjs` and `CHROME_PATH` to an installed Chrome executable.
Set `PLAY_QA_OUTPUT=artifacts/browser/website-review/final` for the runners:

```sh
node scripts/play/browser-check.mjs http://127.0.0.1:4183 all
node scripts/play/browser-check.mjs http://127.0.0.1:4183 controls
node scripts/play/browser-check.mjs http://127.0.0.1:4183 dialogs
node scripts/review/explorer-check.mjs http://127.0.0.1:4183
node scripts/review/website-browser.mjs http://127.0.0.1:4183 final
node explorer/scripts/check-seo.mjs http://127.0.0.1:4183
```

The website runner stores its baseline/final comparison at
`artifacts/browser/website-review/` (override with `WEBSITE_QA_OUTPUT`), uses cold
browser contexts with the same desktop viewport/reduced-motion setting for route
measurements, and records raw resource timing alongside screenshots. Its safe-area
checks use Chrome's actual CDP inset override and verify resolved CSS `env()`
values; they remain browser emulation.

Play traversal reads diagnostics but commits every placement through actual DOM
mouse/touch/keyboard handlers, independently accumulating the expected fitted
set. Neither inventory nor progress is changed to accelerate traversal. The CPU
suite needs the prepared ignored source/audit inputs; this is not clean-machine
reproduction. Browser viewport, reduced-motion, enlarged root text and touch
emulation are not physical-device, Safari, representative assistive-technology,
mechanical or redistribution certification. Those release gates remain separate.
