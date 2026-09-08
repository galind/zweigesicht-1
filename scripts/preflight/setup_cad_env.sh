#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$project_dir"

bundled_python='/Users/guillemgalindo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'
cad_python=${CAD_PYTHON:-$bundled_python}
if [ ! -x "$cad_python" ]; then
  cad_python=$(command -v python3.12 || true)
fi
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
