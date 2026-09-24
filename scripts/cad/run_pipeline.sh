#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
mkdir -p artifacts/cad
.venv-cad/bin/python scripts/cad/export_assembly.py > artifacts/cad/conversion.log 2>&1
.venv-cad/bin/python scripts/cad/case_fit_probe.py
.venv-cad/bin/python scripts/cad/extract_movement.py
.venv-cad/bin/python scripts/cad/audit_mechanisms.py > artifacts/cad/mechanism-audit.log
.venv-cad/bin/python scripts/cad/validate_assets.py
