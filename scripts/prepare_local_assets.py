#!/usr/bin/env python3
"""Prepare content-addressed, local-only CAD payloads. Never uploads assets."""
from pathlib import Path
import gzip, hashlib, json, shutil
root=Path(__file__).resolve().parents[1]
source=root/'assets/generated'
target=root/'explorer/public/models'
target.mkdir(parents=True,exist_ok=True)
paths={}
case_recovery=root/'artifacts/case-cad/lug-recovery.json'
if not case_recovery.is_file():
    raise SystemExit('Run .venv-cad/bin/python scripts/cad/case_fit_probe.py before preparing case assets.')
shutil.copy2(case_recovery,target/'case-lug-recovery.json')
diamond=root/'assets/source-originals/appearance-audit/030-Brilliant_200.stl'
if diamond.is_file():
    data=diamond.read_bytes()
    assert hashlib.sha256(data).hexdigest()=='c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a'
    name='diamond-c74ee2731a1f.stl'
    (target/name).write_bytes(data)
    (target/(name+'.gz')).write_bytes(gzip.compress(data,compresslevel=9,mtime=0))
for role in ('overview','catalog'):
    path=source/'optimized'/f'{role}.glb'
    if not path.is_file():
        raise SystemExit(f'Missing {path}. Run scripts/cad/run_pipeline.sh then scripts/assets/optimize.mjs; no source reacquisition needed.')
    data=path.read_bytes();digest=hashlib.sha256(data).hexdigest()[:12]
    name=f'{role}-{digest}.glb';(target/name).write_bytes(data)
    (target/(name+'.gz')).write_bytes(gzip.compress(data,compresslevel=9,mtime=0))
    paths[role]='/models/'+name
manifest=json.loads((source/'assembly-manifest.json').read_text())
# Retain complete component identity; analytic audit details remain in local generated manifest.
runtime={k:manifest[k] for k in ('schemaVersion','source','coordinateSystem','summary','instances','exceptions')}
raw=json.dumps(runtime,separators=(',',':')).encode()
(target/'assembly-manifest.json').write_bytes(raw)
(target/'assembly-manifest.json.gz').write_bytes(gzip.compress(raw,compresslevel=9,mtime=0))
(target/'asset-paths.tmp').write_text(json.dumps(paths,separators=(',',':')))
(target/'asset-paths.tmp').replace(target/'asset-paths.json')
reference=root/'artifacts/cad/reference-renders/movement-back.png'
if reference.is_file():
    out=root/'explorer/public/reference';out.mkdir(parents=True,exist_ok=True);shutil.copy2(reference,out/'movement-back.png')
print(json.dumps({'localOnly':True,'paths':paths,'manifestBytes':len(raw),'manifestGzipBytes':(target/'assembly-manifest.json.gz').stat().st_size},indent=2))

# Source normals/face regions are a separate reversible local enhancement.
# The audit must exist; never regenerate/import upstream CAD as a side effect.
if (root/'artifacts/finishing-cad/sidecars').is_dir():
    import subprocess
    subprocess.run(['node', str(root/'scripts/assets/prepare-finishes.mjs')], cwd=root, check=True)
