#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$project_dir"

exec .venv-cad/bin/python scripts/preflight/cad_probe.py \
  --assembly assets/source-originals/ml01-zweigesicht.stp \
  --component assets/source-originals/010-linsenk-s60x105-k90x25.stp \
  --inventory artifacts/preflight/assembly-inventory.json \
  --glb scripts/preflight/smoke/public/real-component.glb \
  --stats artifacts/preflight/component-mesh-stats.json
