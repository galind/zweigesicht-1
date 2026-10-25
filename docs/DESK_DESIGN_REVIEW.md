# Desk concept review — 24 October 2026

Design only. No application, environment, collision or CAD changes were made.
Local drawings: [A](../artifacts/desk-concepts/concept-A.png),
[B](../artifacts/desk-concepts/concept-B.png). These are disposable sightline
studies, not an implemented or walking-tested environment.

## Current experience

Reviewed AGENTS.md, PROGRESS.md, BENCH_EXPERIENCE.md, the latest
`live-review/07-fixed-arrival-walking.png`, the overall capture, both maker holder
images and recorded STEP surfaces. The corrected spawn reaches CAD, but conceals
the other presentation and its route. The oversized worktop and ramps read better
from above than from a 1.48 mm eye. Removing decoration did not solve that layout.

## A — intact holders, level entrances (recommended)

One 112 × 92 mm muted worktop, with the bridge close to arrival and the dial
diagonally beside it. Both entrances face the shared approach. Whole stations
are rigidly placed at X/Z (−23, 0), (19, −20), with yaw 120° / 60°.
All movement-relative placements and original crowns stay intact.

With desk surface = 0 mm, support the original holder bases at −17.6 / −15.9 mm.
Their 12.8 / 13.7 mm seating shoulders become −4.8 / −2.2 mm; both established
CAD entrances become level with the desk. Keep the short 2.8 mm wide tongues
and their existing threshold easing. No approach ramps are needed.
The direct desk link between the two outer landings is about 26.2 mm; including
both tongues, entry-to-entry is about 46 mm. Normal routes require no jump,
presentation switch or reset. This is a proposed route, not a physics test.

Tradeoff: deep fitted pockets and a low presentation profile. The arrival favours
one close movement while retaining the second entrance in view; it does not
pretend to offer an aerial overview at visitor height. Preserve open movement
recesses and a separate crown-clearance lobe. Pocket fit and underside support
need detailed clearance verification before implementation.

## B — shorter derivative, small rises

Original shoulders are at source Z12.8 / Z13.7; cavity floors at Z7.8 / Z9.2.
The lower bodies also connect three slotted fingers. A read-only STEP cut probe
below Z6.3 / Z7.7 produced four solids per holder. The bridge cut additionally
failed the kernel validity check. These cuts are not fabrication-ready.

The sketch retains the upper seats, cavity floors, fingers and existing crown
relief, removes the lower 6.3 / 7.7 mm, and proposes a new 1.5 mm connecting base.
Resulting nominal holder heights: 10.2 / 8.8 mm. The drawn base is a structural
placeholder: finger flexibility, strength, fastening holes and load paths require
mechanical redesign. Even 1.5 mm retained floor thickness is only a study value.

At the same base datum, the **whole seated movement, crown and support profile**
would move down 4.8 / 6.2 mm. Cutting only the rim cannot lower the movement.
Unrecessed, entries would still be 12.8 / 9.7 mm above the desk. The sketch therefore
still recesses the new bases to −11.8 / −8.7 mm and uses two 6 mm ramps rising
1 mm at 1:6. This saves pocket depth but adds mechanical uncertainty and walking
geometry; it is not the simplest solution.

## Evidence and limits

`artifacts/desk-concepts/` contains both boards, unannotated arrivals, render and
section scripts, `camera-record.json`, `source-integrity.json`, and `cut-probe.json`.
All six original holder source hashes still match the manifest. Screenshot scenes
reuse the live reviewed CAD without changing occurrence matrices, and use 68°
vertical FOV, 0.035 mm near plane, 1.65 mm visitor / 1.48 mm eyes, and a stated
6° downward / 5° left look. Only complete station transforms differ. The current
application was inspected in a disposable headless browser; no live scene or
generated runtime asset was saved or replaced.

The known crown/holder interference remains explicitly unresolved in **both**
options. No relief, crown movement, support certification, publication or CAD
redistribution is implied. Any shortened holder would be a separately named
derivative, preserving the originals. Stop here for design review.
