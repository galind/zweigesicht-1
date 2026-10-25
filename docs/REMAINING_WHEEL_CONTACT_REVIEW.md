# Remaining wheel contact review — 24 October 2026

All nine remaining non-coaxial tooth pairs in the initial survey now have clear
static endpoints. Together with the transfer-wheel and ratchet corrections,
**all 12 originally confirmed tooth pairs are clear** in original solids and
actual decoded runtime triangles. This is the scope of “all”; it does not mean
all contacts in the entire CAD are defects or that the watch is mechanically certified.

The follow-up starts at local commit `b5bbfa9`. Only 15 additional occurrence
phases are installed in the existing shared [override](../assets/authored/wheel-display-poses.json).
The [provenance record](../assets/source-manifest/remaining-wheel-contact.json)
contains exact source/display matrices, definition and XCAF occurrence IDs,
analytic axis evidence, the immutable diagnostic input and evidence hashes.
Original STEP, GLBs, vertex/index/normal buffers, source matrices and Workshop
base target poses are unchanged. No tooth dimensions, counts, axes, axial seating,
materials, visibility, UI or runtime controllers were changed.

## Cause and interpretation

The original [survey](WHEEL_CONTACT_REVIEW.md) checked all 26 toothed occurrences
and 325 pairs. Fresh XCAF compositions matched all 223 movement source matrices;
there is no established import-placement error. The nine contacts below are
positive closed-solid Boolean commons at the supplied static phases. Interior
witnesses and both 0.015 mm and 0.002 mm mesh tessellations corroborate them.
The saved matched orthographic sections remove perspective as an explanation.
They show tooth material occupying tooth material, beyond ordinary overlapping
pitch/addendum envelopes. Existing coaxial fits were classified separately.

Rigid rotations about the source axes eliminate each tooth common without
changing the surfaces or their mounting locations. This supports a **static
phase incompatibility in the supplied assembly**, and a separate presentation
phase correction. It does not establish a maker design error, a factory clocking
specification or a continuous running solution. Rotational relationships inside
joined packets are preserved; relationships across meshing pairs are intentionally
changed at this static endpoint.

Definition shorthand `dN` means `d_0_1_1_N`, XCAF label `0:1:1:N` in the unchanged
complete assembly STEP. Append occurrence suffixes below to
`p_0_1_1_1__0_1_1_1_4__0_1_1_83_`. Source SHA-256 is
`f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`;
original URLs remain in the source manifests.

## Pairs and measurements

Every **after common volume is zero**. Distances are nominal mm, not tolerance
allowances. Before measurements are original-solid closed-volume integration;
after gaps are whole-solid minimum distances. The independent mesh column uses
the actual Meshopt-decoded runtime asset, not the finer diagnostic sections.

| Definitions | Occurrence suffixes | Before common (mm³) | After solid gap (mm) | After runtime gap (mm) |
| --- | --- | ---: | ---: | ---: |
| 90-249 | `2__0_1_1_89_1` / `74` | 0.0403148906 | 0.010380949 | 0.010658532 |
| 94-237 | `3__0_1_1_92_2` / `63__0_1_1_236_1` | 0.0100559188 | 0.021691736 | 0.022167711 |
| 97-249 | `5` / `74` | 0.0094493536 | 0.016567464 | 0.016750192 |
| 137-210 | `20` / `55__0_1_1_209_1` | 0.00894971604 | 0.013120182 | 0.013323358 |
| 141-211 | `26__0_1_1_140_1` / `55__0_1_1_209_2` | 0.015449548 | 0.020681567 | 0.021064151 |
| 187-217 | `40__0_1_1_186_1` / `57__0_1_1_215_2` | 1.03399566e-05 | 0.004478894 | 0.004802278 |
| 210-213 | `55__0_1_1_209_1` / `56__0_1_1_212_1` | 0.002357596 | 0.006023094 | 0.006566479 |
| 234-243 | `62__0_1_1_232_2` / `65__0_1_1_241_2` | 0.00520817779 | 0.023201605 | 0.023203905 |
| 238-242 | `63__0_1_1_236_2` / `65__0_1_1_241_1` | 0.00589281232 | 0.027173807 | 0.027175922 |

The pairs are barrel I/crown (90/249), center wheel/third pinion (94/237),
winding coupling pinion/crown (97/249), cannon pinion/motion wheel 1 (137/210),
hour wheel 1/motion pinion 1 (141/211), hour wheel 2/motion pinion 3 (187/217),
motion wheels 1/2 (210/213), escape pinion/seconds wheel (234/243), and third
wheel/seconds pinion (238/242). The winding pair has perpendicular axes; its
close-up uses a YZ section. Other close-ups use XY sections.

## Exact correction

Each display matrix is **source × Rz(local angle)** with local pivot `[0,0,0]`.
The source cylindrical faces independently establish that axis. Opposite local
Z directions explain opposite signs within some rigid packets.

| Definition | Occurrence suffix | Local Z phase | Rigid packet |
| --- | --- | ---: | --- |
| d90 | `2__0_1_1_89_1` | +1.45° | barrel-I-drum-cover-spring |
| d91 | `2__0_1_1_89_2` | +1.45° | barrel-I-drum-cover-spring |
| d88 | `2__0_1_1_89_4` | -1.45° | barrel-I-drum-cover-spring |
| d97 | `5` | +7.7° | winding-pinion |
| d137 | `20` | +3.3° | cannon-pinion-1 |
| d141 | `26__0_1_1_140_1` | -2.95° | hour-wheel-1 |
| d142 | `26__0_1_1_140_2` | -2.95° | hour-wheel-1 |
| d187 | `40__0_1_1_186_1` | -0.25° | hour-wheel-2 |
| d188 | `40__0_1_1_186_2` | -0.25° | hour-wheel-2 |
| d210 | `55__0_1_1_209_1` | +0.8° | motion-works-1 |
| d211 | `55__0_1_1_209_2` | -0.8° | motion-works-1 |
| d237 | `63__0_1_1_236_1` | -16.6° | third-wheel |
| d238 | `63__0_1_1_236_2` | +16.6° | third-wheel |
| d242 | `65__0_1_1_241_1` | -2.3° | seconds-wheel |
| d243 | `65__0_1_1_241_2` | -2.3° | seconds-wheel |

In world Z these are barrel I drum/cover/spring +1.45°, cannon pinion +3.3°,
hour 1 wheel/hub −2.95°, hour 2 wheel/hub +0.25°, motion 1 wheel/pinion +0.8°,
third wheel/pinion +16.6°, and seconds wheel/pinion +2.3°. The winding pinion
rotates +7.7° around its local Z, which points along world −X.

The center wheel/pinion, crown wheel, click and click spring, both ratchet poses,
barrel cores, motion works 2/3 and the complete escapement retain their previously
reviewed poses. d96 and the barrel II ratchet/core correction are unchanged.
The barrel I spring is carried with the drum and cover to preserve their complete
relative pose. Its modeled inner clearance to the fixed core is unchanged;
attachment/loading and elastic response are not represented by this phase model.

## Selection and rejected alternatives

Read-only runtime-triangle sweeps proposed candidates; original-solid and full
neighbor audits qualified the selected endpoints. A sampled clearance margin
was preferred over a phase barely outside collision. This is a small scoped
correction, not a proof of a globally minimum angular change.

- Rotating the crown +2.7° world Z cleared both tooth pairs but increased its
  original-solid common with the click from 0.007094860 to 0.025168342 mm³.
  Nearby tested crown phases also increased that contact. Rejected: the crown,
  click and spring stay fixed, while barrel I and the winding pinion are phased.
- Rotating motion works 1 alone did not clear all three coupled contacts in the
  sampled search. Holding hour wheel 1 fixed required approximately +60.8°
  of the motion packet plus a cannon-pinion adjustment. The chosen small
  hour-wheel, cannon-pinion and motion-packet rotations avoid that large turn.
- The third/seconds search held the center and escape pinions fixed and kept
  each wheel with its pinion. The selected +16.6°/+2.3° world phases clear all
  three interfaces. They leave escape wheel, pallet and balance phases untouched.
  A slightly larger sampled minimum gap was available at +15.6°/+11.2°, but
  required a substantially greater seconds-wheel rotation.
- Hour wheel 2 and its hub rotate together +0.25° world Z. Its approximately
  4.5 μm minimum nominal gap must not be read as a manufacturable clearance.

## Neighbors and limits

All 364 other source leaves are considered for each of the 15 moved leaves:
**251 directed before/after original-solid records**, 5,194 conservative AABB
exclusions (0.05 mm padding), and 15 separately hash-verified recovered-diamond
exclusions account for all 5,460 comparisons. Repeated directed records may refer
to the same unordered pair. The scan includes both endpoints of other moved
parts. All moved source shapes are valid solids. No common increases beyond the
1e−8 mm³ reporting threshold, which is a numerical reporting threshold, not a
manufacturing tolerance. Distance is explicitly unmeasured for ordinary
non-mechanism neighbors where only solid common was queried.

Eight relative-matrix comparisons preserve joined packets to below 1e−12.
All 15 fitted hand variants are independently checked against every moved part:
30 exact before/after checks and 195 broad-phase exclusions. The existing
10:10:00 hand display convention remains unchanged. Hand setting, friction fits
and a time-consistent driven train are not certified by those static checks.

The preexisting invalid d27 dial inner solid occurs in three neighbor records
(seconds pinion, cannon pinion and hour 1 hub); its Boolean commons are zero
before and after, but those three checks remain provisional because the source
shape is invalid. The d144 open shell and the original crown/click common are
retained findings. Existing pinion/wheel, key, screw and nominal surface contacts
are preserved rather than erased. Neither those existing contacts nor the entire
movement are mechanically certified.

## Reproduction and local evidence

The local review is `artifacts/remaining-wheel-contact/report.html` and the
nine-image overview is `all-nine-contact-sections.png` in the same directory.
Each `<pair>-before-after.png` is a matched fine-mesh section with original-solid
measurements. `browser-before/` and `browser-after/` contain homepage screenshots,
nine matching camera close-ups and live transform reports for all three routes.
Browser close-ups can contain normal occlusion; the isolated orthographic sections
and original-solid measurements are the contact evidence.

Use the retained CAD Python environment and local original downloads. Prepare
the initial survey/details and fine mesh cache as documented in
[the first audit](WHEEL_CONTACT_REVIEW.md). Then:

```sh
.venv-cad/bin/python scripts/cad/remaining_wheel_contact_probe.py prepare
.venv-cad/bin/python scripts/cad/remaining_wheel_contact_probe.py review --batch winding
.venv-cad/bin/python scripts/cad/remaining_wheel_contact_probe.py review --batch train
.venv-cad/bin/python scripts/cad/remaining_wheel_contact_probe.py review --batch motion
.venv-cad/bin/python scripts/cad/remaining_wheel_contact_probe.py validate
.venv-cad/bin/python scripts/cad/remaining_wheel_contact_probe.py rejected
.venv-cad/bin/python scripts/cad/remaining_wheel_contact_probe.py views
WHEEL_CONTACT_REPORT=artifacts/remaining-wheel-contact/mesh-pairs.json node scripts/cad/review-wheel-contact.mjs
```

`prepare` reconstructs the archived candidate and baseline inputs, never the
runtime override. The candidate's historical diagnostic-only label is retained
for byte reproducibility; the committed decision and separate authored override
record its later qualification. Each full report carries its candidate hash;
validation rejects partial or mismatched batches. Search can be repeated with
`node scripts/cad/search-remaining-wheel-phases.mjs train` (also `winding` and
`motion`). Search output is diagnostic, never automatically installed.

With `PLAYWRIGHT_MODULE` and `CHROME_PATH` set as in the architecture guide,
`node scripts/cad/review-remaining-wheels-browser.mjs http://127.0.0.1:4179 after`
launches only headless Chrome. Its `before` mode requires a server built from
`b5bbfa9`; it deliberately checks the absence of the 15 new phases. The final
server needs the current production build. No headed browser or user tab is used.

Verification results are recorded in the current PROGRESS entry and the hashed
local reports. Release gates remain unchanged; no assets were published.
