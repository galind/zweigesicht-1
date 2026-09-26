# Goal: deeply review and improve the website and its code

Review the complete Zweigesicht-1 website, implement worthwhile improvements,
and verify the result end to end. Improve maintainability, consistency,
accessibility, reliability and measured performance. Investigate duplication
rather than assuming every similar implementation should be shared. Continue
through implementation and verification; an audit report alone is not completion.

## Starting point and boundaries

- Read `AGENTS.md`, `README.md`, `PROGRESS.md`, `docs/LOCAL_ARCHITECTURE.md`,
  `docs/RELEASE_GATES.md` and the Play inventory/verification reports.
- Check the actual Git and PR state before starting. PR #12 contains the new
  `/play` experience and its refinements. Preserve that work and unrelated local
  changes, including the untracked `docs/PLAY_AGENT_PROMPT.md`. Use a separate
  local branch for the review; do not assume PR #12 has merged.
- Preserve the homepage's established interaction logic, configuration semantics,
  camera behavior and visual identity. Shared abstractions may replace internals
  when behavioral equivalence is demonstrated. Fix reproducible UI defects and
  inconsistencies; avoid an unsolicited redesign or new product features.
- Preserve source geometry, source IDs, fitted transforms, material decisions,
  provenance and release boundaries. Do not regenerate CAD assets merely to
  support code cleanup. The product remains a static construction explorer and
  guided assembly puzzle, not a watch simulation or servicing procedure.
- Keep the current Play inventory and ordered sequences unless a concrete defect
  requires correction. Preserve compatible saved sessions; any necessary schema
  change must have an explicit, tested migration or incompatibility path.
- Work locally and commit verified milestones. Do not push, merge, publish or
  deploy without a new instruction. Use SSH Git and the connected GitHub app;
  never use `gh`.

## Review and implementation

1. **Establish a baseline.** Record existing test/build results, representative
   screenshots, route payloads and relevant performance measurements before
   editing. Distinguish pre-existing defects from regressions. Use the same
   browser, assets and viewport conditions for before/after comparisons.

2. **Map architecture and duplication.** Trace both routes through UI controls,
   state, viewer controllers, camera math, rendering, assets, persistence and
   recovery. Identify repeated behavior, competing sources of truth, oversized
   modules, tangled ownership, dead code, stale CSS and unnecessary dependencies.
   Record concrete locations, consequences and a prioritized disposition for
   each finding. Measure duplication in useful units such as repeated handlers,
   lifecycle paths and style rules; line count alone is not a success metric.

3. **Make sharing follow meaning.** Compare every visible action's label, icon,
   keyboard shortcut, state, disabled behavior and effect. Reuse suitable existing
   controls, panels and utilities. Extract small shared modules where ownership
   and semantics agree. Keep explorer-specific configuration and Play-specific
   assembly rules explicit. Avoid a universal viewer with conditionals for every
   route, cosmetic wrapper layers, and premature generalization.

4. **Review rendering and resource ownership.** Examine loading, caching,
   geometry/material/environment setup, camera transitions, resize observers,
   render scheduling, event listeners, disposal, context loss and retry. Fix
   duplicated lifecycle code where safe, stale callbacks, races, leaks and
   unnecessary idle work. Preserve correct cancellation during dragging and
   transitions. Measure bundle/network/rendering impacts of relevant changes.

5. **Review the actual experience.** Use both routes, not just source inspection.
   Cover loading, normal use, modal/panel switching, keyboard navigation, focus
   restoration, selection, camera manipulation, errors, recovery and completion.
   Check responsive layouts, short screens, landscape, safe areas, 200% text and
   reduced motion. Fix clipped controls, overlapping captions, misleading states,
   inconsistent semantics and unnecessary friction with evidence from the UI.

6. **Strengthen useful verification.** Prefer behavior tests at stable boundaries
   over tests that mirror implementation details. Keep diagnostics opt-in and
   out of ordinary route payloads. Improve brittle test helpers when needed,
   without weakening assertions to hide failures. Add regression coverage for
   significant defects found in the review.

7. **Work in coherent increments.** Delegate independent audits and verification
   to subagents where useful, with explicit file ownership. Integrate findings
   centrally, inspect diffs, test changed behavior and commit verified milestones.
   Continue autonomously on routine implementation decisions. Escalate only a
   genuine missing requirement or material change to the protected behavior.

## Completion criteria

- A repository review report maps the architecture, prioritizes concrete
  findings, records changes and explains what remains separate and why. Every
  high-impact finding is resolved or has an evidenced external blocker; optional
  opportunities are clearly distinguished from required work.
- Identified unnecessary duplication and competing sources of truth have been
  reduced through exercised shared code. Obsolete code and styles made redundant
  by the changes are removed. No new route coupling, circular ownership or
  unnecessary abstraction is introduced.
- The homepage retains its established behavior for configuration, selection,
  Focus, All parts, disassembly, Flip and Reset. Existing homepage checks pass,
  augmented for changed boundaries. It continues to load no Play manifest,
  session state or game-specific payload.
- Both Play levels complete through real DOM interaction paths, including the
  dial screws, with the exact intended final fitted set. Verify undo, resume,
  restart/difficulty confirmations, hints, view controls, drag/touch/keyboard
  alternatives, interrupted capture and completion. Diagnostics may read state
  but must not substitute for gameplay by setting progress.
- Representative desktop, 390 px and 320 px phone widths, short portrait and
  landscape views, 200% text and reduced motion have visible, reachable controls
  and readable content. Help, dialogs, focus return and staging/target/caption
  clearance are checked in actual browser renders. Clearly distinguish browser
  emulation from physical-device and assistive-technology verification.
- Required asset failures, unavailable/corrupt storage, WebGL context loss,
  retry, resize, unmount and idle rendering behave correctly. No unexplained
  uncaught browser errors, retained resources or continuing idle render loops
  are introduced.
- Inventory validation, relevant state/lifecycle tests, the available CPU
  source/runtime suite, TypeScript, lint, production build and SEO/HTTP checks
  pass. Record unavailable prerequisites and existing build notices accurately.
  Repeat checks when changes invalidate their evidence, not solely to increase
  assertion counts.
- Performance-sensitive changes have comparable before/after evidence for the
  affected metrics: route payload, requests, loading, frame behavior or memory.
  Material regressions are resolved or explicitly justified. Do not claim a
  speedup or reduced memory use without measurement.
- Update architecture/setup documentation and `PROGRESS.md`. Keep raw screenshots
  and traces in ignored artifact directories, with reproducible commands and
  concise tracked summaries. Leave working local `/` and `/play` previews and
  provide their URLs, verified outcomes, remaining limitations and local commits.

Finish with a reviewable, working implementation and a concise account of what
became simpler, what improved for visitors, and the evidence that existing
behavior was preserved.
