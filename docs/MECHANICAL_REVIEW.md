# Mechanical evidence and implementation boundary

Reviewed 9 September 2026 by a Codex engineering worker. This is a reproducible geometry investigation, **not expert watchmaker review, contact validation, or proof of mechanical correctness**. The source is the local STEP with SHA-256 `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b`. The original source, sampled geometry and geometry illustration remain local behind the redistribution gate.

A useful source-count-linked timing study can be implemented now using the actual balance, escape wheel and three preceding train shafts, with pallet/roller contact elements and the hairspring omitted during playback. The pivot locations and gear-count relationships have numerical support. The cycle's amplitude, absolute direction, phase, release duration and contact behavior remain authored approximations. Therefore present it explicitly as **Timing study — source gear counts, illustrative cadence** and explain the omitted contact and spring elements. A running-watch mechanical acceptance gate remains open.

## Evidence and outputs

- `artifacts/mechanics/motion-parameters.json`: stable source instance IDs, world pivots, signed shaft graph, deterministic illustrative evaluator, spring terminals and restrictions.
- `artifacts/mechanics/tooth-count-evidence.json`: independent geometric count results at three radial thresholds for eleven gear definitions.
- `artifacts/mechanics/contact-probe.json`: 30 sparse pallet/escape angular configurations and distances to both pallet jewels. Zero distance is contact or overlap; it does not distinguish them.
- `artifacts/mechanics/source-mechanics-evidence.png`: local-only visual comparison of the escape wheel and spring topology; inspected after generation.
- Reproduce from the repository root with `.venv-cad/bin/python artifacts/mechanics/probe.py`, `.venv-cad/bin/python artifacts/mechanics/contact_probe.py`, then `MPLCONFIGDIR=/tmp/zweigesicht-mechanics-mpl .venv-cad/bin/python artifacts/mechanics/summarize.py`. Existing OCP/CadQuery environment only; no additional CAD acquisition or installation.

The known non-fatal `FixShape ... gp_Dir2d() - input vector has zero norm` diagnostic recurred during STEP import. Imported geometry was retained; this investigation did not repair the source. The full CAD audit owns BRep validity and tessellation acceptance.

The manufacturer specifies 3 Hz, a Breguet hairspring and a lever escapement. Three full cycles per second corresponds to six half-swings per second. The source's 20 escape-wheel teeth and 81:9 seconds-to-escape ratio are consistent with a one-minute central-seconds revolution when the escape wheel advances one tooth per full balance oscillation. [Manufacturer specifications](https://www.marcolangwatches.com/en/watches/), [watchmaking workshop explanation of one tooth per oscillation](https://initium.swiss/en/blog/how-a-manual-watch-movement-works/).

Generic lever operation includes a locked train, unlocking, impulse and renewed lock. The current illustration intentionally omits geometric/dynamic recoil and does not purport to reproduce those contacts. [Horopedia's original escapement explanation](https://horopedia.org/distribution-mechanism-swiss-lever-escapement/).

## Pivots and rigid membership

All numbers below use unchanged right-handed STEP world coordinates in millimeters. Adopt **world +Z** for every signed angle. Source balance, pallet, escape and seconds local +Z directions map approximately to world -Z; silently using local rotations would reverse signs. Any Z coordinate on a shaft's axis defines the same rigid rotational line.

| Shaft | World pivot XYZ / mm | Source rigid subassembly definition | Evidence |
|---|---|---|---|
| Balance | `(0, -10, -2.65)` | `0:1:1:109` | Shaft 113 has eight coaxial cylinders; their local XY centers are zero. XCAF placement maps them to this axis. |
| Pallet | `(-0.999949089451, -7.0657025, -1.56)` | `0:1:1:125` | Shaft 127 has five coaxial cylindrical faces, all local XY zero. |
| Escape | `(-1.999898178902, -4.131405, -4.14)` | `0:1:1:232` | Pinion/staff 234 has coaxial shaft faces at local XY zero, distinct from tooth-flank cylinders. |
| Seconds | `(0, 0, -4.31)` | `0:1:1:241` | Pinion/staff 242 and wheel 243 share source axis and rigid assembly. |
| Third | `(3.170460451039, -3.61722, -3.21)` | `0:1:1:236` | Pinion 237 and wheel 238 share source axis and rigid assembly. |
| Minute/center | `(0, 0, -2.98)` | `0:1:1:92` | Pinion 93 and wheel 94 share source axis and named riveted assembly. |

Balance group 109 includes rim 110, four excenters 111, impulse jewel 112, shaft 113 and double roller 114. The separate collet 115 also follows balance rotation. **Do not rotate parent group 108 wholesale**: spring 116, stud 117 and pin 118 occur under that source grouping but do not constitute one rigid rotating body. The spring needs deformation; its outer attachment stays fixed. For the focused teaching view, retain the stud and pin in the assembled frame.

Pallet group 125 includes body 126, shaft 127, both pallet jewels 128, horn/fork component 129 and safety piece 130. Escape group 232 includes wheel 233, pinion/staff 234 and hub 235. Keep each of these respective groups rigid. Source names and co-location support these memberships; native kinematic constraints were not recovered.

Apply deltas to immutable assembled transforms: `T(pivot) * Rz(delta) * T(-pivot) * assembledWorld`. Put presentation/reveal transforms outside this operation. Avoid assigning the same delta to both a group and its children. Keep minute and seconds shafts separate despite coincident XY pivots.

## Geometric tooth counts and train relationships

Counts were computed from unique BRep edge samples without reading `zNN` name tokens. For each definition, the algorithm isolates outer tip samples at 98.5%, 97% and 95% of maximum radius, sorts azimuths, and separates clusters using half the maximum angular gap. All three thresholds agree for every row below. The labels provide a useful independent cross-check where they contain tooth numbers; the escape-wheel label does not encode its count.

| Definition | Part | Geometric teeth |
|---|---|---:|
| 85 / 90 | Barrel drums II / I | 80 / 80 |
| 93 | Center pinion | 12 |
| 94 | Center wheel | 64 |
| 96 | Intermediate barrel/center wheel | 26 |
| 233 | Escape wheel | **20** |
| 234 | Escape pinion | 9 |
| 237 | Third pinion | 10 |
| 238 | Third wheel | 75 |
| 242 | Seconds pinion | 8 |
| 243 | Seconds wheel | 81 |

Do not substitute a common 15-tooth escape-wheel assumption. Its measured outer radius is approximately 2.622795 mm and the 20 tips are evenly spaced at 18°. The inspection image corroborates the numerical result.

For a common world +Z convention, external meshes give:

```text
third   = -minute  × 64/10
seconds = -third   × 75/8
escape  = -seconds × 81/9

Equivalently, driving the illustration from escape E:
seconds = -E/9
third   =  E × 8/(9×75)
minute  = -E × 8×10/(9×75×64)
```

These are **angular deltas** from the original assembly pose, not replacements for the source phase. The source model does not prove running direction, tooth-contact phase, backlash or elastic behavior.

| External pair | Measured axis spacing / mm | Module × sum of teeth / 2 / mm |
|---|---:|---:|
| Center 64 → third 10 | 4.810000 | 4.810000 |
| Third 75 → seconds 8 | 4.810000 | 4.809850 |
| Seconds 81 → escape 9 | 4.590000 | 4.590000 |

The third/seconds difference is 0.000150 mm, consistent with the limited precision of the source label's module value; no pitch-curve fit was performed. This is a dimensional cross-check rather than a clearance certificate.

The barrel and intermediate counts are available for further engineering, but do not rotate entire barrel subassemblies automatically. Drum, cover, arbor, ratchet and mainspring have distinct roles, especially in series-connected barrels and during winding. That operating-mode graph is not established by their tooth counts. Keep winding, setting, shock indication and these barrel motions outside this continuously driven teaching cycle.

## Source spring topology and anchors

The actual spring 116 is a thin solid ribbon, with a 0.035 mm local transverse width and 0.215 mm height at its terminal faces. Most coils occupy local Z `[-0.215, 0]`; the raised overcoil occupies Z `[0.25, 0.465]`, with a curved joining rise at approximately radius 3.3 mm. The total imported Z extent is approximately 0.6800002 mm. It is **not a flat planar spiral**.

Terminal face centers, computed from source edges (the whole terminal faces, not merely their centers, must follow the corresponding attachment):

| Terminal | Spring-local XYZ / mm | Source-world XYZ / mm |
|---|---|---|
| Inner, attached to rotating collet | `(-0.348167761, -0.354547370, -0.1075)` | `(0.416687421, -10.270732748, -3.2475)` |
| Outer, attached to fixed stud | `(0.985, -1.706070045, 0.3575)` | `(-0.592150813, -11.878897926, -3.7125)` |

These are geometric terminal centers, not independently validated glue/clamp contact constraints. The inner terminal radius is approximately 0.497 mm; the outer terminal is approximately 1.97 mm from the axis even though the spring reaches radius approximately 3.31 mm. Consequently a generic `rotationWeight = 1 - radius/maxRadius` would move the outer stud attachment. Uniform scaling also moves both anchors. Rigidly rotating the entire spring moves the outer attachment.

For the first connected illustrative implementation, **hide the source spring during teaching motion, and explicitly say it is omitted**. Keep it available in a separate Source inspection mode that restores original assembled mechanical transforms before revealing it. Pausing at an arbitrary illustrative phase is insufficient to restore a stationary source spring: its inner attachment would no longer match the rotated collet. Pause should preserve illustrative phase and continue to hide the spring.

An analytical experiment is available if a limited deformation study is useful. In spring-local cylindrical coordinates use `(r, phi, z) → (r, phi + angleLocal*w(r,z), z)`, with:

```text
S(u) = clamp(u,0,1)^2 * (3 - 2*clamp(u,0,1))
w(r,z) = [1-S((r-0.53)/(3.25-0.53))] * [1-S(z/0.25)]
angleLocal = -balanceWorldAngle
```

This preserves the entire inner terminal's rigid rotation (`r<0.53`) and fixes the entire raised outer terminal (`z>0.25`). It also fixes the outer main-coil bend at `r>=3.25`. The continuous map preserves r and z and is invertible, so it cannot create self-intersection in an initially nonintersecting continuous volume. **That does not certify a tessellated mesh or hardware clearance.** More importantly, it shears the strip and changes centerline length; it is not a physically plausible breathing law. Do not promote this to the 220° full-amplitude teaching cycle without visible validation and a better constrained model. Recompute normals and bounds if evaluating it on the CPU.

Meaningful next work is to recover a ribbon centerline with cross sections, preserve the original raised overcoil, constrain terminal positions/orientations and ribbon length, author or solve displacement modes, then check strip/strip and strip/hardware clearance over the whole intended amplitude. Elastic constants, rest geometry, operating amplitude and attachment compliance remain unknown.

## Deterministic timing study and contact-cycle candidate

The JSON contains a concrete timing evaluator so the application can progress while contact review remains open. The lead evaluator inspected at `explorer/src/motion/evaluate.ts` uses the same 42–58% release interval and an authored ±180° balance amplitude. It does not evaluate the pallet. The recommended timing study hides pallet assembly 125, impulse jewel 112, double roller 114 and spring 116; rim 110, four excenters 111, shaft 113 and collet 115 remain rigid balance components. Fixed stud 117 and pin 118 may remain as context. This is the preferred bounded presentation because it does not display contacts already known to be unresolved. Use a single nonnegative teaching time `t` in seconds. Let `n=floor(6t)`, `q=fract(6t)`, `s=S((q-0.42)/0.16)`.

```text
escape E = (n+s) × π/20
balance B = 180° × cos(6πt)
# Future contact-cycle candidate only; hidden/not evaluated in timing study:
pallet P = -12° × (n even ? s : 1-s)
```

The release interval spans 16% of each beat and is centered on the balance's zero crossing. The escape wheel dwells for the rest of the beat and advances 9° per half-swing. The train shares those dwells via the signed ratios above; it must not run uniformly while the escape wheel locks. This gives mean rates of escape +9 rpm, seconds -1 rpm, third +0.1066667 rpm, and center -1/60 rpm. Scaling the one shared clock produces consistent slow motion and arbitrary-time seeking. The formula is continuous across beat boundaries and directly evaluable without integration.

The 180° balance amplitude, initial balance phase, positive escape direction, pallet travel and 42–58% window are **authored display parameters**, not values measured from the watch. The first illustrative pose differs from the assembled source pose; enter it through an explicit mode transition. The implementation should expose this as an illustrative mechanism relationship, not evidence of correct lock/release/impulse contact.

Pallet 0° was selected as one endpoint because it retains the source pose. At source angles, the nearest distance between escape wheel and the second pallet jewel is 0.000967834 mm. At pallet -12° and escape +9°, the first jewel is 0.006123814 mm away. These make `0 → -12°` a more informed source-relative visual candidate than a centered sinusoid, but **neither endpoint is a validated lock angle**. The 30-point probe contains many zero distances, which may be overlap. It did not solve a continuous collision-free path, bank positions, roller/fork synchronization or correct impulse transfer. Avoid close-up wording that claims a specific tooth is physically delivering an impulse at the illustrated instant.

## Coverage and open acceptance gates

| Presented group | Current defensible status |
|---|---|
| Assembled source geometry | Inspectable static CAD; fidelity owned by CAD audit |
| Balance rigid components and collet | Verified axis, illustrative amplitude/phase |
| Escape | Verified axis; illustrated intermittent cadence linked to source counts |
| Pallet, impulse jewel and double roller | Static source inspection only; omitted from timing study pending contact validation |
| Seconds / third / center train | Geometrically supported counts and signed delta ratios; phase/contact unverified |
| Hairspring | Original geometry and terminal evidence; omitted during teaching playback; constrained deformation pending |
| Bridges, jewels, fixed stud/pin | Static context or presentation reveal only |
| Barrels, winding, setting, shock indicator | Operating-mode mechanics unverified; no automatic running motion |

Before calling the mechanism mechanically validated: review actual running direction and the source pose; solve and inspect lock, unlocking, impulse and drop at both pallets; verify roller/fork/safety and banking clearances; validate spring deformation and realistic amplitude; inspect all visible chain phases; obtain external expert review. Mechanical correctness cannot be established by this AI report alone.

Independent engineering can continue now: exact-ID reveal authoring, source inspection, deterministic scrubbing, connected gear deltas, consistent freeze/resume, part labels, mobile controls, browser performance, and local visual QA. Those deliverables remain useful while the named acceptance gates are open.

## Lead evaluator read-only review

The inspected `evaluatePose` correctly rejects negative/nonfinite time, uses six beats per second, advances 9° per beat, applies signed source-count ratios, and centers its release interval on the balance zero crossings. The implementation has 84% dwell and 16% release (not 78% / 22%). Its ±180° amplitude is authored. Algebraic checks passed for 119 beat boundaries and the minute/seconds mean rates; these checks establish evaluator consistency, not watch mechanics. The current visibility strategy is a stronger bounded result than animating an unvalidated pallet against the escape wheel. Continue visual QA of source/timing transitions, hidden-part selection and caption consistency.
