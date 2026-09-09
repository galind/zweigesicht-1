# Static 10:10 hand presentation

9 September 2026. User follow-up sets all fitted styles to **10:10:00**, with central seconds at 12. Movement/Dial A/Dial B remain exclusive choices. No ticking, playback or time-setting control is introduced.

| Display | Supported styles |
| --- | --- |
| Dial A, central | Fine, Lance, Open lance |
| Dial B, small | Lance, Broad lance, Pear |

The hour angle is 305° clockwise from 12 (including ten minutes of progression); minutes are 60° and seconds 0°. Source hand angles are preserved in raw catalog inspection. Fitted choices use separate rigid presentation matrices around the original analytic bore axes, leaving source assets, geometry, immutable occurrence matrices, Z heights, bushings and all internal movement parts unchanged.

## Source evidence and Lance recovery

`scripts/cad/hand_pose_probe.py` verifies the original STEP SHA-256, reads its existing analytic cylinder evidence, and inspects original cached-mesh tip landmarks. The 15 blade tips establish local +X for hours/minutes and +Y for seconds. Some minute-hand bores are offset from their local origin, so rotating around an object origin would be incorrect. The runtime uses the recorded bore and actual tip instead.

All 15 BReps are valid; their blade bores and existing bushing seats have 0.16–0.20 mm axial overlap. The supplied central Lance C14/C18 blades fit the existing hour/minute supports. C9's original bore lies 14.301839 mm from the central arbor. Its 0.500 mm bore fits the existing 0.505 mm seconds seat with 0.18 mm axial overlap after a world translation of **(-12.4254391598701, -7.08174217766239, 0) mm**. No Z adjustment is required. This resolves the original-placement reason for excluding the complete style; it does not certify manufacturing clearances or collision-free mechanics.

`assets/authored/hand-display-poses.json` records the reviewed pivots, tip landmarks, seats and target time separately from generated CAD. The runtime applies `T(arbor XY) × Rz(target − source heading) × T(−source bore XY) × original occurrence`. The outward camera bases use +Y up for Dial A and −Y up for Dial B, with +X screen-right for both. Bounds use the same fitted matrices as rendering.

Only the selected fitted blades receive these transforms. Selecting a raw external part restores original poses, including the offset Lance seconds. Back restores the fitted 10:10 configuration. Reset and Movement restore exact original assembly matrices. Diagnostics retain actual source-matrix deviation and separately expose display-pose deviation, so an intentional display adjustment is not reported as source-exact assembly.

## Verification

The standalone probe verifies all 15 analytic bore axes, source tip directions, support fits, fitted arbor positions, target clock directions and unchanged world Z coordinates. The actual decoded-asset CPU suite independently checks rendered farthest-tip angles against 305°/60°/0°, original matrices, rigid scale and Z preservation. It also checks raw Lance inspection and Back restoration. Evidence and contact sheets are under ignored `artifacts/dial-time/`; live browser captures are under `artifacts/browser/hand-time/`.

Final results: **54 CPU checks, six state tests, 21 live dial checks and 12 existing movement checks pass**. TypeScript, targeted authored lint and production build pass, retaining the existing bundle-size/deprecation notices. Every style was visually inspected in the live renderer; the restored Lance set was additionally reviewed obliquely for centering, reflections and layer separation. The live run records zero display-pose error, correct source restoration on Reset, cached catalog reuse and zero settled idle redraws. These are local browser observations, not a new physical-device or thermal benchmark.

Other previously excluded duplicate loose blades and incompatible ring/enamel alternatives remain excluded from fitted presets. Existing material interpretations and public-release gates are unchanged. Work remains local, with the preview at **http://127.0.0.1:4173/**.
