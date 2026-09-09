#!/usr/bin/env python3
"""Extend reversible source-face annotations for the component appearance audit.

Reuses verified sidecars; remove a targeted generated sidecar to re-audit it.
Original STEP/GLB positions, normals, indices and placements are never changed.
"""
import sys,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/cad')); import finish_audit as fa
from cad_probe import load_xcaf,label_entry
from OCP.TDF import TDF_LabelSequence
from OCP.XCAFDoc import XCAFDoc_ShapeTool
root=ROOT
source=root/'assets/source-originals/ml01-zweigesicht.stp'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
doc,st=load_xcaf(source);labels=TDF_LabelSequence();st.GetShapes(labels)
a=json.loads((root/'artifacts/finishing-cad/audit.json').read_text()); records={d['id']:d for d in a['definitions']}
# Extend exact shading identities only for individually reviewed surface/fastener regions.
selected={3,8,12,14,17,21,24,26,27,28,34,38,41,105,120,189,9,107,122,123,136,138,139,166,168,169,170,180,181,191,192,201,226,253,255}
fa.SIDECARS=selected
for idx in range(1,labels.Length()+1):
 l=labels.Value(idx);did='d_'+label_entry(l).replace(':','_')
 if did in records and int(did.split('_')[-1]) in selected and not (fa.OUT/'sidecars'/f'{did}.json').exists():
  r=fa.audit_normals(XCAFDoc_ShapeTool.GetShape_s(l),did,records[did],root/'artifacts/cad/definition-cache/f34148903818-0.015-0.25'/f'{did}.npz')
  print(did, 'verified faces', len(r['faces']), flush=True)
