**Marco Lang — unattended execution brief**

Prepared 8 September 2026; readiness reconciled 9 September 2026. Companion to IMPLEMENTATION_PLAN.md. This document prepares a future run; it does not start Goal mode, configure models, enable a schedule, or grant permissions. Use GOAL_PROMPT.md for the current launch instruction and PROGRESS.md/PREFLIGHT_REPORT.md for verified state.

**Outcome**

Implement the planned movement explorer with the actual CAD, emphasizing clear views, excellent interactions, and minimal text. Reach a useful real-model preview early, then extend it through the planned scope. Keep missing geometry and unverified mechanics explicit.

The first milestone is the assembled movement in a browser with working camera controls and identifiable components. The next is one dense mechanism revealed in context, with reviewed motion, pause/slow controls, and a reliable return to the assembled view. These milestones do not replace the full implementation objective.

Current execution scope is a local implementation ready for review. Do not register, save, upload, or deploy a Site, or redistribute CAD assets, while the documented publication gate remains uncleared. The implementation plan's deployment phase is deferred. Continue independent engineering while human, physical-device, or external mechanical review is pending; keep those acceptance gates explicitly open.

**Model policy — recommendation, not an applied setting**

Subagents normally inherit their parent’s model and reasoning effort unless an applicable configuration or explicit launch overrides them. In this session, model overrides require an explicit user request or applicable project/skill instruction. Full-history forks inherit; use a bounded brief for a worker with different settings. [Official subagent guidance](https://learn.chatgpt.com/docs/agent-configuration/subagents)

| Work | Proposed model and effort | Reason |
|---|---|---|
| Lead implementation, architecture, visual decisions, integration | Astra High | Keep the central product decisions coherent |
| Difficult STEP recovery, coordinate/pivot analysis, mechanical interpretation | Astra High | Errors here propagate throughout the experience |
| Independent review of mechanics and difficult defects | Astra High | Assess evidence and challenge implementation assumptions |
| Bounded asset inventories, documentation extraction, routine validation reports | Sol Medium | Clear inputs and outputs that the lead can verify |

These assignments are an engineering recommendation, not a measured cost comparison. Model usage does not map to a guaranteed number of account percentage points or development hours. Extra workers consume additional usage.

Do not downgrade the main 3D experience to save usage by default. Do not escalate every task to maximum reasoning. If routine work exposes ambiguity, return it to the lead for a new assignment. Reassign models explicitly; do not imply that a running worker changes models automatically.

Until the user selects a model policy, preserve inherited settings. No account-wide configuration has been changed.

**Ownership and delegation**

Keep one lead responsible for the website, integration, and product quality. This session currently provides four concurrent slots including the lead. Use fewer when work is sequential. Check available slots again when execution starts.

Delegate bounded CAD/assets, mechanical research, and read-only review tasks. Respect the Sites skill’s ownership rules: the lead owns the Site checkout, application edits, registration, and hosting. Asset workers return files from separately assigned staging directories; the lead imports accepted results. A role name is not proof of watchmaking expertise.

Each assignment must state:

- Objective and prerequisite inputs.
- Files or staging directory the worker may write; all other paths are read-only.
- Required output format, stable identifiers, units, and coordinate conventions.
- Acceptance evidence and known uncertainties.
- When to return a blocker and what independent work remains useful.

The lead continues independent implementation while workers run. Wait only for results needed for the next dependent action. Do not let workers wait on one another in a cycle. Use the lead to resolve dependencies and conflicting evidence.

**Dependency sequence**

1. Reuse the verified source downloads and working STEP importer. Run a brief integrity check rather than repeat setup.
2. Reuse the instance inventory; audit units, full geometry, assembled reference views, and transform correctness.
3. Agree on the asset/manifest contract before dependent UI and animation work.
4. Import real geometry into the viewer and measure initial rendering behavior.
5. Author one difficult reveal and its mechanical motion.
6. Evaluate the real browser result, refine it, and expand through the plan.

Mechanical research can accompany source preparation. Accessibility controls and loading behavior can accompany asset work once the viewer foundation is established. Exact animation waits for reviewed axes and relationships.

**Preparation checks before leaving the run unattended**

| Check | Proof required | Current result |
|---|---|---|
| Project instructions and implementation scope | Read implementation plan and GitHub publishing policy | Prepared |
| Code runtime | Executable Node/package manager/Python | Isolated Python 3.12 CAD environment and pinned Three.js smoke dependencies verified |
| Source connectivity | Successful download of actual STEP bytes | Assembly and two components downloaded; all three hashes independently reverified |
| CAD conversion | Load STEP, extract separate instances, export a small runtime sample | Fresh probe reproduces 426 instances, 255 definitions, 388 non-identity placements and a valid component GLB |
| Graphics authoring | Working required authoring tool or a documented viable alternative | Preflight verified Blender; FreeCAD remains optional with the working OCP path |
| First browser render | Actual converted part or assembly visible and interactive | Real screw render, pause, orbit and zoom independently rechecked in the lead task; full assembly rendering remains implementation work |
| Work preservation | Progress file and reproducible asset source records | Git repository, provenance manifest, progress file and reproducible probes present |
| Long-running host availability | Mac powered, online, app running; prevent-sleep setting enabled | User confirmed persistent settings in preflight; lead task rechecked active ChatGPT no-idle-sleep assertion |

Use `.venv-cad/bin/python` for CAD work. The original default-Python tooling inventory is historical and does not describe the provisioned environment. Exact versions and rerun commands are in PREFLIGHT_REPORT.md.

Resolve CAD support through a suitable isolated environment or an available application. Keep installation reproducible and scoped where practical. Do not assume CAD packages support the current default Python version. A lightweight STEP-to-mesh conversion may be enough for the first render; Blender need not block that if another route works.

Use standard permission review for network access and installation. Do not weaken sandbox settings merely to avoid interruptions. Where a request is rejected, preserve the exact error and continue unaffected work.

**Iteration and evidence**

Work in vertical slices: change one behavior, inspect it in the browser, run relevant checks, and record the result. A successful build proves compilation, not visual quality.

For every meaningful milestone, preserve a screenshot or short recording, relevant validation results, and the exact preview/start instructions. Fix clipping, incorrect transforms, unreadable materials, and confusing interaction before broadening the feature set.

Use the implementation plan’s performance budgets as provisional targets. Desktop testing and mobile emulation must be reported separately from actual phone measurements. A simulated viewport cannot certify phone GPU performance or thermal behavior.

Human comprehension testing and expert mechanical review cannot be completed by relabeling an AI review. Record these as outstanding when unavailable. Continue independent engineering; describe the deliverable as implementation-ready-for-review if those gates remain open.

**Recovery and persistence**

The lead maintains PROGRESS.md at milestones and before ending a run. Capture the current state, modified artifacts, tests performed, exact blockers, next executable action, and running services. Write one authoritative progress record rather than competing worker summaries in the same file.

On resume, read the progress file, inspect actual files, and reconcile any mismatch before continuing. Reuse existing Site registration, running services where appropriate, and downloaded assets. Do not recreate the project or restart the audit without evidence that prior results are invalid.

When a tool fails, distinguish missing software, access failure, unsupported input, and defective output. Try a materially different supported approach where useful. Do not spend repeated runs issuing the same failing request without new evidence.

If one task is blocked, continue tasks that do not require its result. If nothing useful remains, record the exact external dependency and required action. Do not declare success because usage, time, or patience is running short.

**Boundaries and reporting**

Preserve user changes and use the GitHub policy: local git operations over the configured SSH remote; connected GitHub app for PR/API work; no gh fallback. The configured remote is `git@github.com:galind/zweigesicht.git`; the lead task verified SSH read access and connector access to this private repository. Follow AGENTS.md for milestone commits. Push only when the active task authorizes it, and keep gated CAD assets out of pushed checkpoints.

Do not contact Marco or other people, purchase services, or redeem usage-reset credits without explicit authorization. Preserve applicable publication rules and the implementation plan’s source-fidelity requirements.

Report concrete milestones, failures that need action, and completion. Keep progress updates concise. At handoff, provide the working preview, screenshots, completed capabilities, known limitations, and next steps. No schedule is created by this document.

**Suggested launch instruction**

Use GOAL_PROMPT.md with Goal mode when ready. It incorporates the completed preflight, model assignments, milestone commit policy, and current local-only scope. Its model selections become instructions only when the user actually adopts them.
