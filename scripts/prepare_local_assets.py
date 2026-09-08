#!/usr/bin/env python3
"""Copy generated, release-gated CAD into the ignored loopback application asset folder."""
from pathlib import Path
import shutil
import json
root=Path(__file__).resolve().parents[1]
source=root/'assets/generated'
target=root/'explorer/public/models'
target.mkdir(parents=True,exist_ok=True)
for name in ('zweigesicht.glb','assembly-manifest.json'):
    if not (source/name).is_file():
        raise SystemExit(f'Missing generated asset: {source/name}. Run scripts/cad exporter first; do not reacquire sources.')
    shutil.copy2(source/name,target/name)
print(json.dumps({'local_only':True,'files':[str(target/n) for n in ('zweigesicht.glb','assembly-manifest.json')]}))
