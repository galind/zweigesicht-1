# Default view consistency

10 September 2026. Local user-requested review of loading, Movement, both dials, separation and return paths.

## Findings and resulting behavior

The opening camera used fixed coordinates and a portrait-specific distance; dial framing used display-specific bounds; returning to Movement and reassembling used a different oblique preset. Bounds fitting also used the current camera's up vector before changing it, so a prior orbit could affect the next default. Movement return retained the previously selected face.

| Action | Default behavior |
| --- | --- |
| Page load, Reset, choose Movement, choose Whole movement | Same rear-facing assembled view, center, scale and slight tilt |
| Choose Dial A | Opposite face at the same center and distance |
| Choose Dial B | Same framing as the rear Movement view |
| Switch bare-movement side | Matching front/rear framing; records history and takes explicit camera ownership |
| Separate | Preserve the chosen face, gradually introduce the oblique angle, and fit the expanding bounds |
| Reassemble | Return to the exact assembled view of that face |
| Manually orbit/zoom, then separate | Retain the visitor's camera |
| Back | Restore the previous camera, side, separation and manual ownership |

All assembled presentations use one immutable envelope from the source manifest's movement and dial structures, with 0.75 mm clearance for fitted hands. It is available before optional catalog meshes load and is independent of hand style. Framing uses the destination face's up direction, keeping both faces upright and removing dependence on an earlier rolled camera. Separation starts continuously from the same assembled angle and includes the common envelope in its fitting bounds. Focused mechanisms and inventory retain their dedicated framing.

The accepted 1.05-second coordinated turnover and 420 ms dial crossfade are preserved; choosing Movement uses the same 1.05-second travel timing as choosing a dial. Source geometry, finishes, six 10:10 poses, complete separation and All parts packing are unchanged.

## Verification

New `?inspect` → **Run camera checks** exercises the full navigation journey and samples every rendered frame during separation. All **17 checks pass at 1280×720 and 390×844**: matching assembled centers/radii, route-independent Movement return, repeated dial destinations, prior-orbit independence, direct Dial A separation without a roll, both-side reassembly, manual ownership and Back. Maximum separation-frame extent is **.853 desktop / .848 portrait NDC**, inside the viewport.

**64 CPU/source checks**, seven state tests, TypeScript, authored lint and production build pass. The CPU framing regression checks four aspect ratios with real OrbitControls and source metadata, including cold/warm catalog independence and rolled starting cameras. The existing desktop dial suite passes **24 checks**, preserving all six styles, fades, turnover, recovery and resources. Portrait also passes **eight explosion and 12 movement-interaction checks**. A fresh phone page load matches Reset with **zero camera/target error**.

Evidence is under ignored `artifacts/browser/default-views/`: before/after screenshots, exact settled camera journeys and validation reports. The initial `before.json` used periodically emitted UI diagnostics and may contain intermediate samples; final route equality is checked directly against the actual viewer in the new suite. The preview process stopped during final verification and was restored on **127.0.0.1:4173**; fresh-page checks use the restarted server. Restart command: `cd explorer` then `npm run dev -- --host 127.0.0.1 --port 4173`. Local only; no push, merge, deployment, CAD redistribution or `FINISHING_GOAL.md` edit.

Follow-up: the stem-biased envelope center is now anchored to the central hand axis. See [Movement axis and menu review](AXIS_AND_MENU_REVIEW.md) for the framing correction and repeat verification.
