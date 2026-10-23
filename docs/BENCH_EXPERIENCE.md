# Walk inside the movement

`/bench` is a separate, local desktop walking experience. The homepage button
loads its route; neither the explorer nor Workshop owns its renderer or input.
It uses the complete 223-leaf movement subtree (including recovered diamond),
without the catalog, fitted case, dials or optional hands. Nothing runs mechanically.

## Local assets and reproduction

Run the normal README setup, then prepare the local holder files and environment:

```sh
node scripts/bench/prepare-holder.mjs
blender --background --python scripts/bench/export-environment.py
npm --prefix explorer run dev
```

The first command expects the maker's two STL downloads at
`assets/source-originals/holder/movement.stl` and `dial.stl`. Obtain these directly
from the maker using the exact URLs in `assets/source-manifest/holder.json`.
The importer checks their SHA-256 values before copying. The source manifest
also records the two STEP models and two inspected reference images. Original
files and prepared payloads stay ignored; the command does not download them.
Missing/mismatched assets block entry and present Retry and a way home.

Blender 5.2.1 was available. The Python scene is the editable, versioned authored
source; regeneration also saves `assets/generated/bench/environment.blend`.
The bench, mat and access fixtures export to
`explorer/public/bench-local/environment.glb`. No maker geometry is baked into
that authored scene. Numeric GLB units remain millimetres. The mat is 160 × 120 mm
on a simple 180 × 140 mm bench; its faint grid is spaced at 5 mm.

The local production build retains these ignored local assets for verification.
`build:vercel` explicitly removes `bench-local` from its output. Neither the
holder download nor the existing public repository clears redistribution rights.
Publishing this experience remains subject to `RELEASE_GATES.md` and separate
permission; no publication or deployment is part of this task.

## Presentation evidence

The maker's `Werkhalter Montage.jpg` shows bridges facing up in the
`Werkplattenhalter Montage` holder. `Werkhalter ZB Seite.jpg` shows the opposite,
dial-facing surface in the `Werkhalter ZBseite Montage` holder. These are separate
fixtures, not evidence of a mechanical turnover mechanism.

Both holder STLs preserve their source dimensions: about 42 mm diameter and
15 mm high, with a nominal 17.1 mm pocket radius for the approximately 34 mm plate.
`inspect-holder.py`, run with `.venv-cad/bin/python`, checks the source hashes and
records STEP planes and cylinders in `artifacts/bench/holder-surfaces.json`.

| Presentation | Movement outer transform | Nominal seat |
| --- | --- | --- |
| Bridge | X rotation +90°, world Y translation +12.2 mm | Plate source Z −0.6 sits at holder Z 12.8 |
| Dial | X rotation −90°, world Y translation +16.3 mm | Plate source Z −2.6 sits at holder Z 13.7 |

Both holders rotate −90° about X from Z-up into scene Y-up. The crown relief
remains at +X. The dial holder's internal floor is at 9.2 mm, below the lowest
presented movement extent (9.64 mm). Original movement occurrence matrices,
meshes and scale remain unchanged. Nominal seating is an authored static
presentation informed by these measurements and images, not tolerance or
holding-force certification.

The separate red access fixture rises from X −56 to −21.2, outside the holder's
21 mm radius. Its thin cantilever crosses the rim to the bridge (Y 17.6) or plate
(Y 15.9); it does not fill the holder or introduce invisible walkable surfaces.
It is an authored exploration aid, not a certified printable mounting accessory.
Red plastic uses rough material and derivative-filtered normal shading at an
interpreted 0.12 mm print-layer pitch; this is not a measured maker finish.

## Walking, collision and lifetime

The visitor is 1.65 mm tall, with 1.48 mm eye height and 0.22 mm capsule radius.
Speed is 5.5 mm/s, gravity 18 mm/s² and jump impulse 7 mm/s (about 1.36 mm rise).
A 0.22 mm step allowance handles small seams without changing watch geometry.
The horizon stays level, with no bob or roll. Jump buffering and a brief edge
grace interval make jumping at small surface boundaries less timing-sensitive.

BVHs are built once per reusable source geometry, with indirect indexing so the
source triangles and finish annotations stay intact. Broad-phase world bounds
reject distant parts; capsule triangle queries use the currently visible
presentation only. Source openings remain openings. Physics substeps are at most
1/180 second with bounded fall speed and a 50 ms elapsed-time clamp, preventing
ordinary movement from crossing thin solids in a single step. Long pauses slow
simulation instead of teleporting through geometry. Automatic steps require an
actual nearby floor and capsule/head clearance.

Mouse capture requires pressing Enter. WASD walks, Space jumps, R resets, T
changes presentation and Escape releases capture. Blur, hidden documents and
capture loss clear keys and jump intent. T ignores repeats/busy input; a short
fade covers the fixture swap and reset to that side's safe mat entry. Falling
below Y −8 or outside the bench bounds also resets without reloading or penalty.

The renderer sleeps when grounded and stationary, wakes for input/resize, and
stops while hidden. It uses studio environment lighting with no live shadows or
reflections. Pixel ratio is capped at 1.5; sustained slow frames lower it to .85,
and the menu exposes a manual detail toggle. Route disposal removes all listeners,
observers, timers, BVHs and GPU resources. Late loads cannot resurrect a departed
scene. `?inspect=1` exposes the controller solely for local verification.

## Verification

The browser runner uses actual capture and keyboard events for the journey;
independent forced-fall and geometry probes are labelled separately. It records
screenshots, frame intervals and results under ignored `artifacts/bench/`:

```sh
node --test tests/bench-physics.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROME_PATH=/absolute/path/to/Chrome \
node scripts/bench/browser-check.mjs http://127.0.0.1:4176
```

Additional browser runners are `scripts/bench/collision-check.mjs`,
`presentation-check.mjs`, `lifecycle-check.mjs`, `home-entry-check.mjs` and
`performance-check.mjs`.
They use the same environment variables and local server URL. The lifecycle
runner checks browser tab focus loss; because headless Chrome reports inactive
tabs as visible, it separately injects a hidden-document event to check the
visibility handler and stopped frame scheduling. Collision and
presentation probes are independent fixtures, not substituted for the keyboard
journey. The performance runner alternates W/S for 60 seconds from a recorded
bridge fixture; its start placement is explicitly synthetic.

On the reference Mac mini (Apple M4, 10-core CPU, 24 GB RAM), macOS 26.6.2 and
Chrome 155.0.8059.86 using ANGLE Metal, the production journey recorded 1,476
active frame intervals at 1440 × 900 / pixel ratio 1: mean 16.666 ms, p95 16.7 ms,
p99 16.8 ms. The separate 60.196-second sample at the same viewport / pixel ratio
1.5 retained High detail: 3,600 recorded intervals, mean 16.666 ms, p95 16.7 ms,
p99 16.8 ms and p95 CPU update/submission time 5.4 ms. CPU timing is not GPU time;
these are headless desktop measurements, not broad device certification. The
ring buffer holds the latest 3,600 intervals, so startup compilation and earlier
frames are not part of that sustained sample.

Sixteen source-surface drop samples on both faces settled without falling through.
The source-matrix comparison was exact (maximum error zero); dial-side sampled
floor heights ranged from 9.2 to 18.11 mm, with 130 lower opening samples. These
samples and the swept-step unit tests support the implemented journey, not an
exhaustive proof over every source defect or possible route. Very narrow or deep
recesses may require R to return to the mat. Tiny details below the 0.44 mm visitor
width cannot all be entered. The inherited CAD exceptions in `CAD_NOTES.md`
remain; no source repair, measured material claim or mechanical certification is
implied. Adaptive Low detail has a manual fallback; weaker physical devices and
long thermal runs have not been qualified.

Final regression results and remaining actions are recorded in `PROGRESS.md`.
Browser measurements establish performance only on the recorded machine and
settings. Mobile navigation, expert mechanical review, physical-device coverage
and representative human accessibility/usability review remain outside this
local milestone.
