#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$project_dir"

cad_python=$(command -v "${CAD_PYTHON:-python3.12}" || true)
if [ -z "$cad_python" ] || [ ! -x "$cad_python" ]; then
  echo 'Python 3.12 is required. Set CAD_PYTHON to its executable path.' >&2
  exit 1
fi

cache_dir="$project_dir/.cache/uv"
UV_CACHE_DIR="$cache_dir" uv venv --python "$cad_python" .venv-cad
UV_CACHE_DIR="$cache_dir" uv pip sync \
  --python .venv-cad/bin/python \
  --require-hashes \
  scripts/preflight/requirements-cad.lock

.venv-cad/bin/python -c 'import OCP, trimesh; print("OCP", OCP.__version__, "trimesh", trimesh.__version__)'
