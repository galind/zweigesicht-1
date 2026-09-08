#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$project_dir/scripts/preflight/smoke"
exec "$project_dir/.venv-cad/bin/python" -m http.server 4173 --bind 127.0.0.1
