# Dial and hand-style explorer — implementation goal

Prepared 9 September 2026. This is a plan for a separate implementation run. No application changes, goal, new task, push or deployment are performed by preparing this document.

## Accepted follow-up — 9 September 2026

The user superseded simultaneous fitting after local review: the choices are **Movement**, **Dial A** (central) and **Dial B** (small). Show only the selected dial and its hands; Movement hides both. Independent style memory, Reset, history and recovery remain required. Requirements below for both displays to coexist or remain visible on reverse orbit are historical and superseded.

## Goal and starting point

Extend the accepted static Zweigesicht explorer so visitors can view the central dial or the small movement-side dial and choose a compatible hand style for each face. Deliver a polished local implementation with verified CAD membership, reliable transitions and browser evidence. Continue through implementation and verification, rather than stopping at another proposal.

Start from the current working tree and read `AGENTS.md`, `PROGRESS.md`, `IMPLEMENTATION_PLAN.md` and `UNATTENDED_RUN.md`. Current verified implementation checkpoint at preparation: `cf3eb72` on `codex/watch-polish-finishes`, following all accepted material corrections. Check actual Git state before work; do not reset to that commit or lose later changes. The branch is ahead of its remote. Leave user-owned `FINISHING_GOAL.md` untouched.

This goal is local-only. Follow the project milestone commit policy, update `PROGRESS.md`, use Git over the configured SSH remote when separately authorized, and never use `gh`. Do not push, merge, register/upload/deploy a Site, or redistribute CAD for this goal. Do not start from historical playback ambitions in older planning documents: mechanical animation remains removed. Use applicable skills under the executing session's instructions. This plan specifies no model overrides or required delegation.

## Product behavior

Preserve the accepted opening bare-movement view, lighting, finishes, typography and compact controls. Add a discreet **Dial & hands** control near the existing exploration controls, opening a small popover on desktop and a reachable sheet on narrow screens. Avoid a permanent configurator sidebar or a second navigation system.

Provide three clearly named view choices:

- **Movement**: the current bare-movement experience.
- **Central dial**: full-size dial with central hours, minutes and seconds, viewed from its outward face.
- **Small dial**: the skeletonized movement-side dial at 6, with hours and minutes, viewed from its outward face.

The real watch has both displays simultaneously. In either dial view, fit one coherent dial/hand configuration on each side and orient the camera toward the requested face. Switching sides changes the viewpoint, not the underlying movement construction. The selected reverse display should still exist when the visitor orbits around the watch. Movement view hides the added dial/hand assemblies as an inspection aid. Do not imply that movement components are removed to manufacture different watch variants.

Within a dial view, offer a short **Hands** style chooser for that face, preferably with small accurate silhouette previews derived from the actual geometry. Remember each face's choice independently for the current session. Style changes update in place without moving the camera. Do not add a hand-color, dial-design, case, strap or time-setting configurator in this scope. Retain static hand poses; do not introduce a clock, ticking, gear motion or cosmetic time animation.

Use source-backed names such as **Fine**, **Lance**, **Open lance**, **Broad lance** and **Pear** only after the corresponding geometry is inspected. Do not infer a cathedral shape from marketing photographs when the CAD label and mesh describe a different hand. Expose every distinct, complete and placeable hand family verified in the supplied source; exclude duplicate instances and incomplete alternatives. If a candidate cannot be validated, explain that in the implementation report rather than presenting a broken option.

Use one coherent default dial design per face. Prefer the central silver dial and the small skeletonized ring with blue translucent enamel matching the maker's photographed presentation. The CAD includes explicitly red enamel variants; any blue presentation override must be exact to the chosen visible dial configuration, documented against maker references, and leave the original source and raw catalog interpretation intact. Do not recolor unrelated parts or offer overlapping ring alternatives together. If the source ring/enamel pairing cannot be verified, resolve that before exposing the preset.

The existing side-switch control must agree with the new selector. In Movement view it keeps its existing meaning. In a dial view it switches between Central dial and Small dial and preserves each hand choice. Map labels explicitly: current runtime `side: 'front'` faces +Z (central dial), `side: 'back'` faces -Z (movement/small dial). Do not trust front/back naming in older diagnostic renders.

## Verified source inventory and candidate mappings

Use exact occurrence IDs from `assets/generated/assembly-manifest.json`, not definition IDs alone or broad name regexes. The complete STEP source is `assets/source-originals/ml01-zweigesicht.stp`, SHA-256 `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. Preserve original source geometry, placements, units, names and provenance.

Two external dial roots are already in the full catalog asset:

| Face | Exact root | Source identity |
|---|---|---|
| Small movement-side dial | `p_0_1_1_1__0_1_1_1_1` | d2, `Gruppe Zifferblatt dezentrisch 18` |
| Central dial | `p_0_1_1_1__0_1_1_1_2` | d22, `ml01 Zifferblatt Front DM33,4 montiert` |

For the following tables, **C** means `p_0_1_1_1__0_1_1_1_2__0_1_1_22_` and **S** means `p_0_1_1_1__0_1_1_1_1__0_1_1_2_`. A suffix identifies a source child or a complete child assembly; expand assemblies to original leaf occurrences once, with no duplicate geometry.

### Central dial candidates

| Candidate | Source children | Required review |
|---|---|---|
| Fine hands | C2 minute d24, C6 hour d28, C10 seconds d30 | Verify hand bores, Z stack and complete mounted set. |
| Lance hands | C18 minute d32, C14 hour d31, C9 seconds d29 | C9 has a translated source origin around (12.425,7.082,1.77) mm. Inspect its actual geometry/bore; this is not proof of a misplaced hand and must not be fixed by recentering. |
| Open lance hands | C24 minute assembly d37, C22 hour assembly d33, C25 seconds assembly d40 | Include their modeled bushings exactly once; preserve child transforms. |
| Dial structure | C1 transition ring d23, C4 outer ring d26, C5 inner dial d27, C23 logo d36; C3/7/8/11/12/13/15/16/17/19/20/21 applied markers d25 | Verify full coherent dial and logo placement. d27 has a previously recorded invalid BRep; inspect recovered geometry before exposing the preset. |

### Small dial candidates

| Candidate | Source children | Required review |
|---|---|---|
| Lance hands | S5 minute assembly d6, S16 hour assembly d10 | Includes minute bushing d8 and hour bushing d12. |
| Broad lance hands | S20 minute assembly d15, S26 hour assembly d20 | S18 and S25 are loose alternatives duplicating some shapes. Do not include both loose and assembled versions. Source name containing gold does not alone authorize changing accepted material colors. |
| Pear hands | S24 minute d19, S23 hour d18 | Determine whether compatible existing bushings are required. Use only source-supported occurrence/fit evidence; do not invent supports. |
| Ring alternatives | S1 metal carrier d3 + S2 enamel d4; S19 segmented carrier d14 + S28 enamel d21; S21 straight-spoke ring d17 | Inspect and select one coherent carrier/enamel design, with its compatible markers and fixings. They are alternatives, not three stacked layers. |
| Markers and fixings | Markers d5 at S3/4/6/7/8/9/10/12/13/14/15/27; screws d9 at S11/17/22 | Audit which belong to the selected ring using actual holes and source reference renders. Do not assume all screws belong to every design. |

These are candidate style groupings derived from source names and hierarchy, not approved manufacturing configurations. Determine axle positions from bore geometry and source transforms, not mesh bounding-box centres. Some blade origins are off-axis by design. The small display's motion works are centred near (0,7.4) mm, while one ring assembly origin is (0,7.5) mm: inspect, document and preserve source offsets rather than silently translating them.

Both internal motion works already exist inside the movement: central cannon pinion d137 and hour-wheel assembly d140; small-display cannon-pinion assembly d182, hour-wheel assembly d186, additional motion works d209/212/215 and bridge d218. No internal removal list was found in the exported STEP. Keep these parts present in every dial preset.

Sources to consult for visual fit and default styling:

- Maker description: https://www.marcolangwatches.com/en/watches/ — both faces coexist, and the strap attachment determines the outward face.
- Complete assembly download: https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/ — one STEP/STL assembly plus Front1 and Front2 reference images.
- Existing local reference manifests in `assets/source-manifest/`, and `docs/CAD_AUDIT.md`, `docs/COMPONENT_APPEARANCE_AUDIT.md`, `docs/FINISHING_REFERENCES.md` and `docs/FINISH_ADJUSTMENTS.md`.

## Implementation sequence

### 1. Validate and record the configurations

Inspect each candidate style and dial combination in the actual renderer or source geometry tools. Record complete leaf memberships, supporting bushings/fixings, original poses, evidence and unresolved exceptions in a small hand-authored configuration manifest under `assets/authored/`. Keep generated assets separate. Make readable labels and preview associations derive from this reviewed manifest.

Produce a contact sheet of each candidate set on its matching dial. Confirm one hour hand and one minute hand per face, and exactly one seconds hand on the central face. Check depth ordering, bore alignment, markers, carrier/enamel fit and absence of duplicate overlays or z-fighting. Source hand angles can remain different between style variants; do not normalize to a common indicated time without actual pivot evidence. Do not certify synchronization or mechanical correctness from static fit.

Reuse the existing optional catalog GLB first. Do not rebuild/repackage or download the entire source library unless a concrete missing asset or payload problem requires it. If a separate dial asset becomes necessary, record provenance, measured benefit, exact membership and integrity checks; never bundle the original CAD into public files.

### 2. Add state and a single visibility policy

Inspect `explorer/src/experience/state.ts`, `catalog.ts`, `webmcp.ts`, `explorer/src/viewer/MovementViewer.ts`, and the current React viewer/control entry points. Find the real UI files rather than creating a parallel application.

Add typed presentation state for Movement versus Dials and independent style choices for the two faces, with explicit validated defaults. Reuse the existing `side` as camera-side truth; avoid maintaining conflicting selector and camera values. Invalid/obsolete style IDs must resolve to a safe valid preset. The new state must participate in snapshots, history, Back, Reset, renderer recovery and any existing debug tools.

`MovementViewer.loadCatalog()` already caches the optional asset. Extend its use for dial requests without hijacking part selection. Keep the accepted movement visible while loading; show concise loading/retry feedback in the dial controls. Commit the requested configuration only when its geometry is ready. If the user changes face/style, returns to Movement or resets during loading, stale completion must not overwrite the newer intent. A failed load must leave a usable movement and retry the current request only. Dispose obsolete loads and preserve the existing catalog selection retry behavior.

External catalog parts are currently visible mainly when selected. Both `retarget()` and `retargetVisibility()` contain visibility rules; introduce one shared policy so a render tick cannot hide the newly enabled dial or re-show excluded alternatives. Limit fitted external leaves to the reviewed configuration. Merely loading the full catalog must not show case, straps, unused dials or tooling. Preserve selection and isolated inspection of arbitrary raw catalog parts; exiting that inspection restores the fitted configuration.

### 3. Integrate camera, exploration and controls

Use existing transitions and responsive controls. Entering a dial view from separation, a section or All parts returns to an assembled whole before framing the requested face. Frame the dial plus movement comfortably, including the small dial in context. Do not frame only a tiny hand or the full strap/catalog bounds. Side transitions remain continuous; manual orbit/pan/zoom cancels camera travel immediately.

Switch styles atomically so two alternatives never occupy the same surfaces during a crossfade. Avoid reloading assets, re-creating the viewer or recompiling materials on every switch. Fit both sides consistently and refresh contact shading when visible geometry changes. Bounds and quality calculations must account for the added meshes.

Entering a mechanism, using Separate or entering All parts temporarily returns to bare-movement inspection, while retaining style preferences. Back restores the prior dial view and choices when that action is in history. A direct return to a dial view restores remembered choices. Reset restores the accepted opening bare movement and documented default style choices. All parts retains its existing 216-member movement layout and exclusions; added display components remain individually inspectable through the catalog. Do not add them to the spread implicitly or change its packing contract.

The panel must support keyboard navigation, visible focus, Escape and focus return, clear selected states, touch targets and reduced motion. Keep visitor copy concise; source IDs, loading internals and audit notes belong in diagnostics/documentation. Use the existing icon style and no emoji labels.

### 4. Verify behavior and visual quality

Run relevant existing checks: `node scripts/cad/review-runtime.mjs`, `node --test tests/experience.test.mjs`, TypeScript, lint for edited authored files, and the production build in `explorer/`. Extend tests where they protect new behavior, especially independent actual-source placement/membership checks and asynchronous state races; avoid tests that merely copy the configuration table back to itself.

Required coverage:

- Complete supported hand sets on both faces, unique active leaves, no mutually exclusive duplicates, correct support hardware and preserved geometry/source matrices.
- Independent style memory, synchronized face selector/side switch, safe invalid IDs, consistent Reset and Back.
- Rapid face/style changes, entry during camera travel, manual camera takeover, separation/section/spread entry and return.
- First catalog load, failure/retry, reset or newer choice during load, raw catalog selection before/after fitting dials, graphics context restoration and disposal.
- Stable resource counts after warm-up; no extra asset transfers on repeated changes and no idle redraws after settling. Record the added draw calls/triangles and any first-use load cost without claiming a new device benchmark.
- Existing exact reassembly, 216-member spread, selection/isolation, source annotations, recovered diamond and accepted finishes remain intact.

Use the live browser to review every exposed style, both sides and oblique views. Check at least desktop 1280×720 and narrow portrait 390×844, plus 320px width for control overflow. Inspect actual transitions, labels, selected states, focus and screenshots. In a dial view, orbit to the reverse side to confirm the second display is also fitted. Verify central seconds exists only on the central face. Review dial legibility, layering, clipping, reflections, enamel and all hand silhouettes. Revisit any style whose source defect materially spoils the result; do not conceal failures with framing.

Store evidence under an ignored local directory such as `artifacts/browser/dial-and-hands/`. Create a concise `docs/DIAL_AND_HANDS_REVIEW.md` with verified preset membership, rejected/unsupported candidates and reasons, state behavior, source evidence, test results and limitations. Update the appearance ledger if any configuration-specific material interpretation is added, preserving the raw source record.

## Completion criteria and handoff

The goal is complete when a visitor can open Dial & hands, choose either face, select every supported hand style without duplicates or bad fits, orbit the assembled two-sided display, and return naturally to the accepted movement explorer. Loading failures and interrupted actions must recover predictably. Existing movement features and finishing corrections must still work.

Commit each coherent verified milestone, inspect status and staged diffs before each commit, and update `PROGRESS.md`. End with the working local URL, a concise description of the new controls, supported styles by face, verification evidence and any specifically excluded CAD candidates. Do not claim human, physical-device or mechanical review that did not happen. Keep changes local for the user's review.

## Suggested launch message

> Implement `DIAL_AND_HANDS_PLAN.md` as the goal. Continue from the current project state and preserve all accepted finishing and interaction work. Complete the CAD configuration review, implementation, live visual QA and regression checks, then commit the verified milestones locally. Keep the site running for review. Do not push, merge or deploy.
