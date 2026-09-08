#!/bin/sh
set -u

for executable in node npm pnpm python python3 git cmake brew uv blender freecad FreeCADCmd openscad assimp; do
  path=$(command -v "$executable" 2>/dev/null || true)
  if [ -n "$path" ]; then
    printf '%-12s %s\n' "$executable" "$path"
    "$executable" --version 2>&1 | head -n 3 || true
  else
    printf '%-12s NOT_FOUND\n' "$executable"
  fi
done

printf '\nCAD environment\n'
if [ -x .venv-cad/bin/python ]; then
  .venv-cad/bin/python -c 'import sys, OCP, trimesh; print(sys.version); print("OCP", OCP.__version__); print("trimesh", trimesh.__version__)'
else
  echo '.venv-cad NOT_FOUND'
fi

printf '\nGit workspace\n'
git status --short --branch 2>&1 || true
git remote -v 2>&1 || true

printf '\nPower settings\n'
pmset -g custom 2>&1 || true
pmset -g batt 2>&1 || true
