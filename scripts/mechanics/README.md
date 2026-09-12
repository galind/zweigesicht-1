# Mechanical evidence scripts

These scripts preserve the bounded, source-specific analysis that produced the current files under `artifacts/mechanics/`. They do not simulate or certify the movement.

## Inputs and dependencies

All scripts assume the verified ml-01 STEP with SHA-256 `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b` remains at `assets/source-originals/ml01-zweigesicht.stp` and the matching XCAF inventory remains at `artifacts/preflight/assembly-inventory.json`. Use the existing `.venv-cad`, which supplies Python 3.12, NumPy, and OCP. `summarize.py` additionally requires Matplotlib from that environment.

The analysis hard-codes source definition labels, source-world pivots, a small angle grid, and two BRep edge indices for the hairspring terminals. Those assumptions apply only to the recorded source hash and importer ordering. Do not run these commands against a replacement STEP without reviewing and remapping them first.

## Invocation

From the repository root, the original result sequence was:

```sh
.venv-cad/bin/python scripts/mechanics/probe.py
.venv-cad/bin/python scripts/mechanics/summarize.py
.venv-cad/bin/python scripts/mechanics/contact_probe.py
```

`probe.py` is the expensive stage: it loads the STEP and samples unique BRep edges. Existing `artifacts/mechanics/source-geometry.json` should be reused unless the verified source or extraction logic changes. `summarize.py` reduces that sampled geometry into scalar tooth-count evidence, illustrative motion parameters, and a PNG evidence plot. `contact_probe.py` reloads the STEP and performs a sparse 10-by-3 pallet/escape distance grid; it is not a collision sweep or contact-cycle solver.

## Outputs and limits

The scripts write only under ignored `artifacts/mechanics/`:

- `source-geometry.json`: dense sampled edges, analytic cylinders, source bounds, and one matched instance per selected definition.
- `tooth-count-evidence.json`: radial-threshold tip-cluster counts.
- `motion-parameters.json`: source-coordinate shaft candidates, count-derived ratios, explicit illustrative timing, and hairspring cautions.
- `contact-probe.json`: sparse pallet/escape minimum distances and two spring terminal points.
- `source-mechanics-evidence.png`: local review plot for the escape wheel and hairspring geometry.

The outputs retain explicit warnings: tooth counts are geometric corroboration rather than expert tooth-by-tooth review; sparse zero distance can mean contact or overlap; source labels do not prove meshing; the escapement cycle and balance amplitude are illustrative; and the hairspring deformation proposal is not approved for connected motion.

## M0 extension — 12 September 2026

See [M0 evidence](../../docs/running-movement/M0_EVIDENCE.md) for the completed inventory, graph and limitations. `m0_probe.py` verifies the source hash and inspects 24 bounded definitions, writing only ignored `artifacts/mechanics/running-movement/m0/cad-probe.json`. `m0_summarize.py` writes scalar evidence to `docs/running-movement/probe-summary.json` and recomputes the eleven historical counts from the existing edge cache. It does not rewrite the retired motion parameters.

`m0_inventory.py` contains explicit source-specific coverage/graph mappings and generates the CSV, graph and coverage summary. `--check` detects stale outputs without writing them. `m0_verify.py` checks census, hashes, graph references, fitted style membership, independent path ratios and local links. Use the existing `.venv-cad/bin/python` for the probe/reduction and ordinary Python 3 for inventory/verification. No script implements M1 or edits viewer assets.
