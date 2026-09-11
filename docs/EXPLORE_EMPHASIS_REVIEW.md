# Explore emphasis review — 11 September 2026

## Contract

One authored-finish view remains authoritative. Function/Finish controls were already retired; legacy treatment input remains discarded by state normalization. Selection does not introduce a second material treatment.

Explore retains primary mechanism members and an explicit set of explanatory parts in `assets/authored/explore-scope.json`. Source subassemblies retain all their leaves. Sharing an explosion host alone no longer makes a part relevant: unrelated assemblies fade out over 280 ms on section entry, independently of Uncover. Individually selected parts take precedence. Whole movement, All parts and Reset restore their respective visibility contracts.

Active members retain full physical lighting, explanatory context receives 85%, connected parts and covers receive 55%, and the supporting main plate receives 32%. Its pressed jewels and pins stay readable. A small edge-only cue distinguishes active/selected parts without washing out their finish. Base material color, roughness, metalness, grain, anisotropy and transmission remain authored. Stable parts remain opaque; temporary transition alpha restores the original opacity, transparency and depth-write values. Restored fades release their state so later dial fades own their materials without interference. Contact shading excludes fading geometry from opaque depth.

Camera framing fits the selected mechanism plus 2.5 mm of context. The visible plate can extend beyond a focused close-up; primary parts must remain within the viewport at a useful size. Manual orbit owns the camera after interruption.

Uncover moves retained covers along their authored extraction paths and hides them after they clear the mechanism. Cover-mounted fasteners follow their own host. The static balance-bridge cutaway uses the actual bridge screws, source indices 23/24; 34/35 belong to the pallet bridge and follow that bridge's lift. Lowering Uncover restores the covers, while unrelated mechanisms remain hidden. Details explains this distinction.

A retained child mechanism no longer inherits a cover-only reveal displacement from its parent. Specifically, the rear display remains assembled when Time display uncovers the barrel bridge. Complete separation still composes the physical parent displacement. This corrects the floating display packet without changing source assembly matrices or geometry.

## Six-group audit

Indices below are direct-child suffixes in the source movement, not newly inferred mechanical relationships. Primary membership remains in `mechanisms.json`; the full supporting/cover indices are in `explore-scope.json`.

| Group | Primary emphasis | Context retained and readable | Removed from focus |
| --- | --- | --- | --- |
| Balance & escapement | Balance, pallet and escape wheel | Plate, adjoining third/seconds wheels; balance, pallet and train covers with their fasteners until uncovered | Barrels, winding/setting, display, shock assembly and unrelated covers |
| Twin barrels | Both barrel assemblies | Plate, ratchets and fasteners, center/output wheel pair; barrel bridge and screws until uncovered | Balance, keyless, display, shock and unrelated bridges |
| Wheels & pinions | Center, third, seconds and escape-wheel chain | Plate, input barrels, pallet and pallet support; train/center covers and screws until uncovered | Winding/setting, display, shock and unrelated bridges |
| Time display | Front and rear motion works | Plate, center/output wheel pair, display washer/fasteners and rear motion-works bridge; train/barrel covers until uncovered | Ratchets, keyless, balance and shock assembly |
| Winding & setting | Stem, coupling, levers, winding gears and ratchets | Setting spring, winding support, plate, matching screws, front cannon/hour wheel and adjoining setting-output wheel; train cover until uncovered | Balance, barrels, rear display, shock and unrelated supports |
| Shock indicator | Complete indicator subassembly | Main plate and pressed pins/jewels; obstructing train, balance and barrel covers with matching fasteners until uncovered | Gear trains, winding/setting, barrels and display |

The alternate setting spring remains excluded unless explicitly selected. Optional raw-catalog/dial geometry does not participate in movement scope fades. The Explore menu retains its selected-section marker and accessible pressed state.

## Regression coverage

The source/runtime suite covers all six scopes across Uncover 0, 0.49, 0.51 and 1; exact scoped visibility; primary-member precedence; authored materials/depth; keyless-spring contrast; interrupted fade reversal and cleanup; contact-depth exclusion; valid/disjoint source scope indices; correct balance fasteners; rear-display reveal offsets; and full-separation parent travel. Existing dial regressions protect crossfades following section selection.

The browser suite checks all six groups' screen-space size, containment, material and visibility contract after orbit/separation. It also exercises interrupted navigation, Back, Reset, isolation, reduced motion, cover restoration without restoring unrelated assemblies, fade cleanup, resource stability and on-demand rendering.

Final evidence is local in ignored `artifacts/browser/explore-section-scope/`, at desktop 1280×720 and mobile viewport 390×844. Mobile review is viewport/handler emulation, not physical-device certification. Mechanical and human comprehension review gates remain open. No CAD assets were changed or published.
