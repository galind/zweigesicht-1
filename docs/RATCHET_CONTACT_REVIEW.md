# Ratchet contact correction — 24 October 2026

Ratchet wheel **d131, occurrence 15**, and its **barrel II core d87** receive one
rigid **+1.8° rotation about their existing world-Z axis**. Ratchet occurrence 14
stays at its source pose. This clears the visible tooth penetration while keeping
the keyed wheel/core mounting exactly as supplied. The earlier d96 correction
remains unchanged; nine other confirmed tooth pairs remain unresolved.

## Identities and source

All occurrence suffixes below follow `p_0_1_1_1__0_1_1_1_4__0_1_1_83_`.

| Component | Definition | Occurrence suffix | Source world origin (mm) | Applied local-Z angle |
| --- | --- | --- | --- | ---: |
| Ratchet wheel, barrel I | d131 `ml01 Sperrrad z62 m0,20` | `14` | (6.203871824, 8.105916839, −1) | 0° |
| Ratchet wheel, barrel II | d131 `ml01 Sperrrad z62 m0,20` | `15` | (−6.2, 8.1, −1) | −1.8° |
| Barrel II core | d87 `ml01 Federkern1` | `1__0_1_1_84_3` | (−6.2, 8.1, −3.35) | +1.8° |

The core's local +Z points toward world +Z; the wheel's points toward world −Z.
Their opposite local angles therefore produce the **same world rotation**.
Each display matrix is `source × Rz(local angle)`, pivot local `(0,0,0)`.
The maximum change in their relative mounting matrix is 8.9e−16.
The small original XY offset of occurrence 14 is retained, not “straightened.”

The original assembly STEP, SHA-256
`f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`,
and download provenance are unchanged. Full original XCAF paths, source/local
matrices, corrected matrices and evidence hashes are in
[ratchet-contact.json](../assets/source-manifest/ratchet-contact.json) and the
local `artifacts/ratchet-contact/review.json`. Original definitions resolve to
STEP labels `0:1:1:131` and `0:1:1:87`.

## Diagnosis and rejected fixes

The [initial wheel survey](WHEEL_CONTACT_REVIEW.md) established original-solid
penetration between these two 62-tooth wheels: **0.0606927788 mm³**. Interior
witnesses persist in both 0.015 mm and 0.002 mm tessellations. Fresh XCAF
composition matches the stored matrices. Orthographic sections and BRep Boolean
measurements rule out perspective, import placement and tessellation as the cause.
This is incompatible rotational phase in the supplied static assembly, not a
claim that the manufactured mechanism or tooth profile is defective.

A 145-angle fine-section diagnostic over one tooth pitch proposes a +1.8° world-Z
turn of occurrence 15. The final decision uses original solids and all neighboring
interfaces, not section sampling alone. The wheel has a four-lobed key bore:
central cylindrical faces 323–326 use radius 0.725 mm and faces 331–334 use
0.65 mm about local X=Y=0. Rotating the wheel alone would disturb its core fit.

The reproducible rejected-options report includes:

- Wheel 15 alone at local −1.8°: teeth clear, but the keyed bore penetrates its core.
- Both wheels at local −0.8°: teeth clear, but wheel 14/core penetration increases
  to 0.000238226 mm³.
- A 90° reindex of wheel 15: the teeth still overlap by 0.022243455 mm³.
- At 90.8°, tooth penetration remains; at 90.82°, it clears but introduces
  0.000000320 mm³ of core penetration. This narrow tradeoff was rejected.

Rotating the wheel **and its keyed core together** preserves their rigid relation
without altering the bore, key, teeth, axes or barrel geometry. Neither the
mainspring nor the barrel drum or cover is rotated. This is a static assembly pose
choice, not a winding simulation or a claim about the maker's precise clocking.

## Before/after measurements and neighboring components

| Interface | Before | After |
| --- | ---: | ---: |
| d131/14 ↔ d131/15 solid common | 0.060692779 mm³ | 0 mm³ |
| Ratchet minimum original-solid distance | 0 mm | 0.031730939 mm |
| Ratchet decoded runtime triangles | intersect | disjoint, 0.032225302 mm gap |
| Wheel 15 ↔ core mounting | 0 mm³, nominal contact | same relative pose and 0 mm³ |
| Core ↔ barrel II drum / cover | 0.005 mm gaps | 0.005 mm gaps |
| Core ↔ modeled mainspring | 0.006985294 mm gap | 0.006985294 mm gap |
| Wheel 15 ↔ mainplate | 0.100 mm gap | 0.100 mm gap |
| Core ↔ mainplate | 0.250 mm gap | 0.250 mm gap |

For each of the two moved occurrences, all 364 other source leaves are considered:
32 exact before/after pair checks in total, 694 conservative broad-phase exclusions
and two checks against the hash-verified recovered diamond STL. All exact neighbors
are valid solids; none has increased common volume above the 1e−8 mm³ numerical
reporting threshold. This threshold is not a manufacturing tolerance.

The click d254, click spring d252 and crown wheel d249 are explicitly checked
against both moved parts. Their geometry and poses stay unchanged; the final
ratchet-to-click, spring and crown distances are 15.4984, 13.8522 and 9.3746 mm.
Their mutual interfaces are consequently unchanged. The existing core/screw d192
common (~0.153910292 mm³), nominal zero-distance fits and alternative case contacts
remain as supplied and are not certified by this correction.

The mainspring already has a nominal gap to the modeled core. The unchanged gap
and absence of new penetration do **not** establish hook attachment, spring
preload, elastic deformation, running contact or torque transmission. Those need
maker/mechanical review. This correction preserves the represented geometry and
keyed mounting, and resolves the static visible tooth collision only.

## Runtime, evidence and reproduction

The separate authored entries in
[wheel-display-poses.json](../assets/authored/wheel-display-poses.json) use the
existing shared helper in explorer, Workshop and walking. No runtime controller,
geometry buffer, material, visibility, UI, save format or base placement manifest
was changed. Workshop applies each reviewed endpoint when its part is installed;
walking collision uses the same posed meshes as rendering.

Local evidence under `artifacts/ratchet-contact/` includes:

- `ratchet-before-after.png`: matched orthographic tooth and keyed-bore sections.
- `browser-before/ratchet-closeup.png` and `browser-after/ratchet-closeup.png`:
  matched headless homepage close-ups, with the surrounding geometry visible.
- `review.json`, `phase.json`, `rejected-options.json`, `validation.json`:
  original-solid measurements, source transforms and the decision checks.
- `browser-before/report.json`, `browser-after/report.json`: independent live
  pose checks on all three routes, including the unchanged ratchet 14 and d96.
- Explorer, Workshop and walking functional/collision reports and logs; validation
  totals are recorded in [PROGRESS.md](../PROGRESS.md).

Use the existing CAD environment and cached fine meshes described in
[CAD notes](CAD_NOTES.md). No original or generated asset is overwritten.

```sh
.venv-cad/bin/python scripts/cad/ratchet_contact_probe.py phase
.venv-cad/bin/python scripts/cad/ratchet_contact_probe.py rejected
.venv-cad/bin/python scripts/cad/ratchet_contact_probe.py review
.venv-cad/bin/python scripts/cad/ratchet_contact_probe.py validate
.venv-cad/bin/python scripts/cad/ratchet_contact_probe.py views
node scripts/cad/review-wheel-contact.mjs
# Set PLAYWRIGHT_MODULE and CHROME_PATH to existing local installations:
node scripts/cad/review-ratchet-browser.mjs http://127.0.0.1:4179 after
```

The browser check always launches headless. Its `before` mode applies to the
preceding build at `f027338`; it does not undo the correction in a current build.
The close-up changes only the camera inside that isolated test browser. Visual
clearance is not mechanical certification; publication gates remain in force.
