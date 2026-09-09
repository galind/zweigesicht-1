# Zweigesicht — final interface polish

Implement this brief in `/Users/guillemgalindo/projects/marco-lang` when the user launches the next goal. Read `AGENTS.md`, `PROGRESS.md`, `IMPLEMENTATION_PLAN.md`, and `UNATTENDED_RUN.md` first. Follow the latest static-explorer state; older animation and redesign ambitions are historical.

## Outcome

The user is very happy with the current website. Refine its loading experience, wording, labels, icons, and interaction details while preserving the accepted composition and model. Give explosion, the All parts arrangement, and especially their transitions a dedicated review and refinement pass. Keep the single-screen experience, neutral charcoal background, restrained typography, prominent movement, compact controls, and optional exploration. The user hates emojis: use none anywhere in the visitor interface.

Complete and verify the local implementation. Make routine design decisions autonomously within this direction. Avoid expanding this task into another redesign or a new feature programme.

## Evaluation informing this brief

Reviewed on 9 September 2026: the local 1280×720 opening, Options, source catalog, and forced no-3D fallback in the real browser; loading/status logic, control copy, component naming, and styles in source. The loading accessibility state was also observed during navigation. This preparation did not repeat mobile, throttled-network, recovery, or performance qualification.

- The opening composition is already calm and effective. Preserve it.
- Loading and failure share an older gray CAD still on a conspicuous rectangular gray background. Its appearance and framing differ from the accepted live model. A large message card covers part of the subject.
- Download percentage tracks the overview GLB only. Surface annotations, decoding, diamond recovery, scene setup, and first rendering are not represented by that number. It can therefore reach 100% before the experience is ready.
- Options opens under “Make yourself comfortable”; “Finish” / “Function” are terse and the latter can suggest working-watch behavior. “Crown controls” names a mechanism view as though it were a control panel.
- The catalog leads with raw names such as “Werk montiert einbaufertig” and “010-zylsenk s80x120 k125x40”. Search uses source names and IDs, while selection and section lists use a separate readable-label mapping. Generic names and repeated hardware need better context.
- The interface mixes text arrows, a circular arrow, a full-width plus, a return-arrow glyph, and existing SVG controls. Several internal actions use the same outward arrow as external source links. Most observed symbols are text glyphs rather than colorful emoji, but they still need consistent rendering and meaning.
- Generic part descriptions such as “An individual component of the source construction” add little. Some specification fragments, for example “Movement function · seconds stop”, need more natural phrasing.

Follow-up source inspection: All parts currently packs rotated geometry bounds into mechanism/structural/hardware blocks on a fixed three-column arrangement. Entry retargets component positions and orientations while the camera moves toward the final spread framing. Whole-movement explosion uses layer offsets; section separation adds depth and radial offsets. These are starting mechanisms to evaluate in motion, not newly verified visual defects. Existing endpoint and interruption regressions do not establish whether the journey feels coherent or beautiful.

Starting points: `explorer/app/page.tsx`, `explorer/app/globals.css`, `explorer/src/experience/catalog.ts`, `explorer/src/experience/copy.ts`, `explorer/src/experience/spread.ts`, `explorer/src/viewer/MovementViewer.ts`, and authored mechanism copy in `assets/authored/mechanisms.json`.

## 1. Loading and recovery

Design a restrained loading state that belongs to this website: the same background, naming, typography, and deliberate spacing, with one quiet progress treatment. Keep it inside the existing experience. Do not add an Enter button, compulsory introduction, arbitrary minimum wait, automatic rotation, or theatrical loader.

Use a lightweight still of the accepted current movement if it improves continuity. Capture it from the actual viewer; match the initial camera, scale, background, and materials, including phone framing. Do not use generated watch imagery or change the model to make the still match. Keep generated stills separate from source CAD and retain a reproducible capture record. A text-led state is preferable to an obviously mismatched image.

Represent actual stages: loading the movement, preparing the view, and ready. Show percentages only for a measurable transfer and identify their scope. Handle missing content length with an indeterminate indicator. Never fake progress or leave a misleading overall 100% while work remains. Reveal the viewer after a valid first frame, without a blank flash, composition jump, or unnecessary delay on cached visits. Respect reduced motion.

Distinguish initial loading, optional catalog loading, graphics recovery, and failure. Catalog work must preserve the current scene and inspection context. Keep error copy short, useful, and separate from normal progress. Provide dependable retry and a useful static fallback with mechanism descriptions. Handle failure of the still itself gracefully. Controls must accurately reflect availability; no enabled control should silently do nothing during loading or recovery. Keep appropriate reading/navigation actions available.

Use accessible status announcements and progress semantics without announcing every byte update or stealing focus. Verify repeated retry, stale requests, disposal, and context restoration if loading lifecycle changes.

## 2. Wording and component labels

Audit all visitor-facing text: opening controls, menus, six mechanisms, both sides, selected parts, All parts, Options, source catalog, search, tooltips, accessible names, statuses, failures, and About. Use concise, calm English with consistent terminology, capitalization, punctuation, and units. Keep useful text readable instead of shrinking it to preserve a layout.

Prepare a compact before/after copy table, then implement it consistently. Suggested directions to evaluate in context:

| Current | Direction |
|---|---|
| Make yourself comfortable | View options |
| Crown controls | Winding & setting |
| Finish / Function | Names that clearly distinguish material appearance from mechanism colors |
| Dial side / Movement side | Explicit destination wording such as Show dial side / Show movement side |
| Every source component | Source catalog, with a short scope explanation |
| Movement function · seconds stop | A natural, source-supported description of the seconds-stop function |

Keep established short labels such as Explore, All parts, Back, and Reset where they work. Make Separate, Uncover section, Reassemble, Whole movement, and Reset distinguishable by their actual behavior. Add brief secondary help only where it resolves real ambiguity. Do not imply that the static explorer runs, winds, or simulates the watch.

Use readable component names consistently across selection, mechanism lists, catalog entries, and search results. Preserve original names and stable source IDs in secondary source information, and keep them searchable alongside English labels. Disambiguate repeated parts and assemblies with reliable context or a discreet stable identifier. Do not turn every screw into a long technical headline, falsely identify ambiguous components, or rewrite the generated source manifest. Extend the authored label layer using existing verified evidence.

Replace repetitive filler descriptions with a useful supported role; omit a redundant sentence when no further reliable detail exists. Retain technical uncertainty and attribution in the appropriate details/source area. Preserve the verified scope of specifications, particularly movement-level power reserve and optional mechanisms. Additional research is needed only for genuinely new claims.

## 3. No emojis; consistent icons

Remove every emoji from visitor-facing copy, controls, loading/error states, and accessible labels. Audit text glyphs used as icons as well. Prefer plain text where it is sufficient; use the existing SVG icon library when a symbol improves recognition. Use a consistent size, stroke, alignment, and spacing.

Give internal navigation, external links, side switching, reassembly, expansion, and closing distinct, appropriate affordances. Avoid platform-dependent Unicode symbols as button artwork. Decorative icons should be hidden from assistive technology; icon-only buttons need meaningful names and sufficient target sizes. Preserve ordinary punctuation, mathematical signs, and useful keyboard notation.

## 4. Small interaction and visual details

Polish spacing, text wrapping, control alignment, hover/pressed/disabled states, keyboard focus, slider affordances, and sheet/menu rhythm where inspection finds inconsistencies. Keep the subject unobstructed and essential controls discoverable.

Check Options-to-catalog/About nesting, Escape, close actions, and focus restoration. Ensure source search has clear results and empty states. Inspect long component names and repeated hardware. Make labels accurate in assembled, separated, section, selected, isolated, and All parts states. Preserve direct manipulation and accessible alternatives. Make only local layout adjustments needed to support the polish.

## 5. Explosion, All parts composition, and transitions

Treat this as a central part of the polish. Review how the movement comes apart, how individual pieces arrive in their arranged positions, and how the assembly comes back together. Inspect the entire journey in the live browser before deciding what to change. Preserve effective behavior and improve concrete weaknesses in clarity, responsiveness, and visual rhythm.

For continuous explosion, examine whole-movement layers and each section's separation from several camera angles and both sides. Check slow scrubbing, fast dragging, immediate reversal, and intermediate positions. Assess whether the slider feels directly connected to the movement, whether related pieces remain visually connected, and whether spacing exposes useful construction detail. Refine offsets, framing, and interpolation where needed. Avoid lagging motion, unnecessary travel, sudden visibility changes, or a camera that keeps readjusting against user input.

For the All parts composition, assess group hierarchy, spacing, orientations, balance between major components and tiny hardware, and the usefulness of overview and close-up views. Investigate whether the fixed three-column arrangement serves narrow portrait and landscape screens. Layout changes are allowed when they demonstrably improve inspection. Preserve all 216 eligible physical leaves, original relative scale, reliable identity, deterministic placement, and no unintended settled overlap. Never enlarge tiny parts independently or omit awkward pieces to improve the composition.

For entry and return, evaluate timing, easing, translation, rotation, and camera travel together. Visitors should be able to follow representative pieces from their assembled position to their place in the spread and back. Watch for crossing trajectories that become visually chaotic, excessive spins, abrupt zoom-outs, clipping during travel, and an overly long easing tail. Consider restrained staging by related groups or coordinated camera/part timing only if it improves the observed result; do not require a cinematic sequence or impose delays on direct manipulation. These are authored presentation paths, not validated physical disassembly or collision-free service procedures.

Start every retarget from the current displayed pose. Exercise All parts from a partially exploded movement, an oblique camera, either side, a focused section, and selected/isolated states. Reverse or change destination midway. Back must restore its prior context, Reassemble its defined assembled state, and Reset the complete default. Switching between orbit and pan must feel predictable. Manual camera input must immediately take control without a later snap to an obsolete destination. Keep selection, visibility, and labels synchronized with the visible transition.

Keep one owner of presentation transforms so explosion, reveal, and arranged layout never compete. Preserve immutable source placements and exact restoration after repeated interruption. Respect reduced motion with a clear immediate or minimal-motion state change. Do not introduce mechanical playback, elastic bouncing, gratuitous staggering, or extra 3D effects.

Record matched before/after short clips when supported, or timestamped frame sequences, for explosion scrubbing and reversal, assembly-to-All-parts-and-back, and interrupted transitions. Include representative large components, long shafts, and tiny fittings. Compare candidate motion at normal viewing speed as well as intermediate frames; endpoint screenshots alone are insufficient. Record concrete reasons for the accepted timing/layout choices.

## Protected baseline and scope

Preserve source geometry, scale, IDs, immutable assembly matrices, accepted materials and lighting, all surface annotations, the recovered diamond, provenance, and verified 216-member All parts membership. Presentation offsets, arranged positions/orientations, camera paths, and transition timing may be refined under section 5, with regression evidence. Keep the watch mechanically static. Preserve all six mechanisms, both sides, continuous separation, reveal, selection/isolation, Back, Reset, optional catalog, and exact reassembly. Reuse the current architecture and validation tools.

No CAD re-export, retessellation, appearance re-audit, new mechanism simulation, or unrelated dependency migration. Keep the user-owned `FINISHING_GOAL.md` untouched.

This run is local-only. Do not push, deploy, register/save/upload a Site, or redistribute additional CAD or images. Follow `AGENTS.md` for verified milestone commits, task-only staging, staged-diff inspection, and `PROGRESS.md` updates. Any later GitHub publishing uses SSH git and the connected GitHub app; never `gh`.

## Acceptance and handoff

Capture matched before/after views at desktop 1280×720 and a larger desktop size, 390×844, 320×740, and phone landscape. Include loading, ready, fallback/error, Options, mechanism details, selected component, catalog/search, and All parts. Inspect 200% text and reduced motion. Keep screenshot evidence local under the existing ignored artifacts convention.

Verify cold and cached entry, slow delivery, absent transfer totals, initial asset failure/retry, optional catalog failure/retry, and graphics loss/recovery using supported tooling. Record the test conditions; do not claim physical-device or screen-reader testing unless performed. Verify keyboard operation, focus restoration, touch-sized targets, no document overflow, and no loading-to-ready layout jump.

Run the existing applicable state, actual-asset/runtime, and browser regression checks plus TypeScript, authored lint, and production build. Add focused regression coverage for substantive loading/state or label-search failures introduced or fixed here; avoid tests that merely mirror literal copy. Confirm exact reassembly, stable resource counts, and idle rendering after any lifecycle change. Record whether loading bytes and time changed under equivalent conditions.

For changed layouts or motion, extend the existing actual-asset and browser checks to cover at least 20 mixed interrupted explosion/reveal/All parts/selection/Back/Reset sequences. Confirm exact restoration, membership, scale, settled projected overlap/clipping, stable resources, and zero idle rendering. Compare responsiveness and frame timing under equivalent conditions. Inspect transition continuity separately from numeric endpoint checks, including phone viewports and reduced motion.

Finish with the working local preview, a concise account of improvements, the before/after copy table, motion/layout decisions and evidence, visual evidence, verification results, and honest remaining limitations. Complete the polish rather than stopping at an audit. Do not create another goal, task, or schedule automatically.
