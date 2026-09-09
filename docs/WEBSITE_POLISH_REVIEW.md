# Interface polish review

Status: implementation in local verification. The full goal remains open until the browser, motion and acceptance evidence below is complete.

Preview: http://127.0.0.1:4173/. Start with `cd explorer` and `npm run dev -- --host 127.0.0.1 --port 4173`. Nothing has been pushed, registered, uploaded or deployed during this task.

## Copy changes

| Before | After |
|---|---|
| Make yourself comfortable | View options |
| Finish / Function | Materials / Mechanism colors |
| Crown controls | Winding & setting |
| Dial side / Movement side | Show dial side / Show movement side |
| Every source component | Source catalog |
| Movement function · seconds stop | Seconds-stop function |
| Loading movement · 100% while preparing | Loading the movement → Preparing the view → Movement ready |
| Raw German names as catalog headlines | Shared English labels, with original names and unique source references beneath |
| An individual component of the source construction | Supported role where available; otherwise source context and reference |
| Uncover section without explanation | Moves covering parts aside; Separate section spaces its own components |

Explore, All parts, Back and Reset retain their established names. Whole movement restores the complete assembly while retaining appearance/quality preferences. Reassemble clears separation and uncovering within the current context. Reset restores the full opening state and options. No running-watch controls or claims were introduced.

Readable names come from the existing manifest, source/mechanism review and appearance ledger. `assets/authored/component-labels.json` adds exact definition overrides for ambiguous substring matches and previously generic entries. Wheel hubs, a cannon-pinion arbor, fork underplates and the crown guard no longer inherit the wrong labels. Original names, complete instance IDs and definition IDs remain searchable. Repeated occurrences receive the shortest unique source-path suffix plus readable parent context. The generated manifest is unchanged.

## Loading and recovery

The text-led loading and fallback states use the existing charcoal environment and typography. They request no still image. Progress represents only a measurable movement-file transfer; unknown totals and view preparation are indeterminate. One polite announcement reports each stage, independently of byte updates. The viewer becomes available only after the beauty and contact passes render a valid prepared scene. No minimum display time is imposed.

Unavailable 3D controls are disabled, while Options, About and available source/section reading remain accessible. Graphics recovery retains the inspection state and provides Reload 3D. Optional catalog selection waits for geometry before changing the current scene. Retry completes the requested selection only if subsequent navigation has not superseded it.

Local delivery fixtures are opt-in on `?inspect=1&delivery=MODE&case=UNIQUE`: `slow` sends a measured uncompressed movement stream; `unknown` sends a compressed stream without a total; `prepare` delays the annotation buffer; `failure` fails the first movement request; `catalog-failure` fails the first catalog request. The Vite-only middleware serves local files, clears timers on disconnect and changes no production delivery. Explicit fixture requests use query suffixes to avoid reusing cached assets.

## Motion and layout decisions

Baseline motion was captured from the committed application at `a806295` in `/private/tmp/zweigesicht-polish-baseline`, served on loopback port 4174. Only inspection capture hooks, a first-frame timestamp and matching delivery fixtures were added to that temporary copy. The same prepared manifest gzip was supplied to both servers for equivalent delivery measurements. Early baseline observations without that gzip are not equivalent timing evidence.

The baseline spread completed much of its outward travel in the first 200 ms, followed by a long convergence tail. The candidate uses an 850 ms smoothstep transition for both camera and part poses. Each retarget begins with the displayed position and orientation. Quaternion interpolation takes the short rotation path; camera direction follows an arc while camera distance interpolates, avoiding a pass through the object when changing sides. Direct slider updates use a 75 ms response and do not retake a manually controlled camera. The terminal pose is explicitly rendered before idling.

Desktop group arrangement is retained. Portrait views compare deterministic one-, two- and three-column block layouts and choose the best common inspection scale. Parts are never individually enlarged. All 216 eligible leaves, including the recovered diamond, retain source geometry, original relative scale and identity. Source assembly matrices, materials, lighting and annotations remain protected. Presentation paths are not physical disassembly procedures.

`explorer/src/viewer/capture.ts` samples real rendered canvas frames at approximately 100 ms intervals. The inspection controls record four-second sequences for explosion scrubbing/reversal, All parts entry/Back, and interrupted destinations. Sampling timestamps are stored with each frame; recording overhead is separate from performance benchmarks.

## Evidence and remaining verification

Local evidence is under `artifacts/browser/polish/`. It currently includes baseline desktop/phone ready and spread views; original Options/catalog/fallback; original and candidate motion frame sequences; slow/unknown/preparing-state samples; and two initial failure/retry cycles. Both retries restored all 58 source annotation definitions and the recovered diamond.

Current checks: 42 actual-source/asset CPU regressions, four state tests and 12 real-browser checks pass. New checks cover searchable identities, unique occurrence references, loading percentages, readiness after rendering, final-pose painting, catalog failure/stale selection/retry/disposal, camera side-change radius, resize during camera travel, short slider response and bounded exact reassembly. Browser checks include 24 mixed interrupted sequences, Back context restoration, manual camera takeover, 216 visible spread members, zero settled projected overlaps/clipping, stable resources and idle rendering. TypeScript, authored lint and a production build have passed; final verification will be repeated after any remaining fixes.

Still to complete: final live regression and resource/idle checks; final motion comparison at desktop and phone sizes; complete responsive/focus/keyboard/text/reduced-motion review; equivalent loading/performance measurements; evidence gallery and final acceptance audit. Physical-device, screen-reader, sustained thermal and expert mechanical review are outside the performed checks and must not be represented as completed.
