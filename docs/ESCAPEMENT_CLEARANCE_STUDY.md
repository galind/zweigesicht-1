# Escapement clearance feasibility — 26 October 2026

**A candidate complete two-swing rigid animation is feasible with a small,
separate fork-body modification. It is an authored kinematic illustration, not
a solved force-driven escapement or a mechanically accepted operating cycle.**
The application, runtime models, authored display poses and original CAD are
unchanged. Nothing has been pushed, deployed or published by this investigation.

The subsequent [interfaces and hairspring investigation](ESCAPEMENT_INTERFACES_AND_HAIRSPRING.md)
extends the support checks and establishes a separate geometric spring candidate.
It also finds that the escape pinion cannot run indefinitely against a frozen
train. Integration remains deferred pending train coupling qualification.

Continue investigation on `codex/escapement-clearance-study`. The earlier
`codex/escapement-foundation` and `codex/running-movement` branches are deprecated
for new work and retained for historical evidence and reproduction. This study
supersedes their illustrative-animation feasibility status; it does not invalidate
their source-geometry obstruction evidence or resolve force-driven operation.

The study starts at `8c0a36779dc1818bc9b3c9c5c5568fbcbf489ad1` and uses the
source-hashed evidence/cache retained from `codex/escapement-foundation`, commit
`e5726231760cbc734d77e571bae215b528242acc`. All 55 historical component identities
and placements still match. The current wheel phase overrides affect none of them.
The [provenance record](../assets/source-manifest/escapement-clearance-study.json)
contains original URLs/hashes, candidate measurements and retained evidence hashes.

## Geometry decision

The unchanged source jewel/fork centerline is locally obstructed. A sampled
search allowing up to 50 µm of **slot-floor-only** relief did not connect the
prescribed banked endpoints: the jewel also encounters the entrance edges.
The successful candidate removes material from three regions of **d126 only**:
the slot floor and the two inner entrance edges. It preserves the jewel, its
roller mounting, all shaft axes, pallet jewels, escape wheel and banking pins.

| Measurement | Result |
| --- | ---: |
| Maximum floor recession in the sampled section | 0.024782974 mm (24.8 µm) |
| Maximum sampled local removal depth from the original section boundary | 0.030653086 mm (30.7 µm) |
| Original fork-body volume | 0.448447217 mm³ |
| Material removed from original BRep | 0.000817549 mm³ (0.182307%) |
| Candidate topology | One valid solid |
| Candidate material outside the original | Zero volume, zero solids |

The modification is the swept envelope of the original jewel along an authored
center-following path, with a 2 µm nominal clearance. A 0.02 µm polygon
simplification and additional 0.1 µm buffer produce the experimental BRep cutter.
The cutter acts through the fork thickness; its intersections with the original
material are localized to those three regions. The original faces elsewhere,
mounting positions and other components are not replaced or moved to make room.

This is a small measured correction, **not proof of a globally minimum change**.
It is not a machining instruction or a claim about the maker's actual geometry.
It can be visible in a macro view; whole-application visual acceptance was not run.

## Candidate cycle

Balance and pallet angles below are relative to the historical centered candidate:
balance +2.385806786849°, pallet −7.105740009451° from source, about world +Z.
Within engagement, the jewel-center-following law is

`p = -atan2(0.695 sin(b), 3.100 - 0.695 cos(b))`, clipped at ±6.95°.

Those dimensions are the recorded jewel-seat orbit and shaft spacing, in mm.
Outside engagement the pallet remains on its respective bank. The diagnostic
balance amplitude is ±180°, an authored search/preview choice, not a measured
operating amplitude. All nine balance, six pallet and three escape members retain
their established rigid membership; only the fork body's shape differs.

The original wheel and both original pallet jewels admit a connected two-swing
path through the sampled configuration space. Continuation uses a nominal 3 µm
section gap, includes small recoil on unlocking, and advances the escape shaft
**18° per complete balance oscillation**, one of its 20 tooth pitches. The
diagnostic data uses absolute shaft angles, not a reset at the end of every tooth.
The preview uses sinusoidal balance timing over a slowed 12-second pass. Neither
that duration nor the prescribed motion is an inferred physical rate or torque law.

The retained path deliberately maintains small positive gaps. Thus it demonstrates
geometric compatibility of an illustrative animation; it does **not** establish
physical locking, force transfer, draw, impulse energy or self-sustained motion.
The original source pose is not an accepted start state for this candidate.

## Verification and limits

Focused local geometry calculations were necessary to investigate the new
clearance proposal using retained private originals. No application tests, builds,
browser automation or public CI upload of experimental CAD was performed.

- **308 original-solid configurations**, covering both swings and the full
  authored balance amplitude, check ten core pairs. All have positive nominal
  minimum distances at the sampled positions; no intersecting configuration was
  found. Zero common volume is inferred from positive separation where a Boolean
  common was unnecessary, not reported as thousands of executed Booleans.
- Minimum original-solid distances: corrected fork/jewel **2.080617 µm**;
  wheel/jewels **2.961495 µm**; roller/safety **8.461538 µm**; fork/banking pins
  **1.083010 µm**. These are nominal values, not manufacturing tolerances.
- Finer source sections (0.02 µm chord sampling tolerance) and 0.125° balance
  sampling check **5,762 fork/jewel** and **962 wheel/jewel** configurations with
  no overlap. Their minimum gaps are 2.080562 and 2.966855 µm respectively.
- Six representative tight/drop/bank configurations are checked against all
  **20 actual escape-wheel tooth offsets**, using 240 original-solid distance
  queries. The minimum remains 2.961495 µm.
- The **55 remaining cross-shaft pairs** among 14 valid rigid leaves receive a
  supplementary 38-configuration check: 1,909 conservative bounding exclusions
  and 181 exact distance checks, with no overlaps. The other eight cross-shaft
  pairs are covered by the denser core check. Four invalid eccentric BReps remain
  explicitly unqualified; they are not removed from proposed rigid membership.
- Candidate-minus-source BRep subtraction is empty; the candidate is one valid
  solid. Original CAD/cache hashes remain checked and runtime files are unchanged.

Sampling and tighter sections are **not a continuous swept-solid proof**. The
source's retained representation tolerances limit physical interpretation of
micrometre gaps. In particular, bank gaps must not be promoted to reviewed physical
settings. Static bridges/bearings and the rest of the movement are not exhaustively
audited over this cycle. Coupling to the train, all later shaft phases, invalid
eccentrics, hairspring attachment/deformation, contact forces and operating timing
remain outside this qualification. The undeformed hairspring cannot simply be
left attached to a rotating collet in a faithful final animation.

## Inspect and reproduce

Local-only results are in `artifacts/escapement-clearance-20261026/`:

- `cycle-preview.gif`: slowed, two-dimensional diagnostic of both swings; no app
  integration, spring or full train. `cycle-preview.png` is a still.
- `passage-correction.png`: original material and the initial swept correction;
  final cutter adds the documented 0.1 µm buffer.
- `candidate-fork.brep`, `candidate-solid.json`, `cycle.json`: experimental solid,
  measurements and explicit candidate angles.
- `solid-summary.json`, `cross-summary.json`, `refined-sections.json`,
  `tooth-repetition.json`, `material-change-check.json`: scoped validation results.

Scripts are in `scripts/cad/escapement-clearance/`. They require the existing CAD
environment, original source, and hash-checked `artifacts/escapement/brep-cache`;
this is not a qualified clean-machine reconstruction. The additional Shapely
dependency installs only inside ignored study output, not the application or
existing CAD environment. Reproduction writes the named local study outputs:

```sh
uv pip install --python .venv-cad/bin/python \
  --target artifacts/escapement-clearance-20261026/deps --no-deps \
  -r scripts/cad/escapement-clearance/requirements.txt
.venv-cad/bin/python scripts/cad/escapement-clearance/study.py
.venv-cad/bin/python scripts/cad/escapement-clearance/search_cycle.py fork
.venv-cad/bin/python scripts/cad/escapement-clearance/search_cycle.py wheel
.venv-cad/bin/python scripts/cad/escapement-clearance/passage.py
.venv-cad/bin/python scripts/cad/escapement-clearance/cycle.py
.venv-cad/bin/python scripts/cad/escapement-clearance/solid_check.py
.venv-cad/bin/python scripts/cad/escapement-clearance/cross_check.py
.venv-cad/bin/python scripts/cad/escapement-clearance/refine.py
.venv-cad/bin/python scripts/cad/escapement-clearance/preview.py
.venv-cad/bin/python scripts/cad/escapement-clearance/record.py
```

The final command refreshes the tracked provenance record after checking the
completed reports. It does not copy candidate geometry into runtime assets.

The next useful decision is whether this separate, measured illustration is an
acceptable basis for the always-running view. Before application integration,
qualify hairspring presentation, the remaining assembly interfaces, smooth timing
and sustained rendering. Existing [release gates](RELEASE_GATES.md) still apply;
this study does not authorize installation or publication of the modified CAD.
