"""Read-only original STEP crown/holder fit audit; no geometry changes."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'cad'))
import json
import hashlib
import numpy as np
from wheel_contact_probe import load_source, shape_at, contact, bbox, BRepCheck_Analyzer, count_solids, witnesses, SHA, ROOT
from OCP.STEPControl import STEPControl_Reader
out=ROOT/'artifacts/paired-atelier';out.mkdir(parents=True,exist_ok=True)
doc,records,shapes,definitions=load_source(all_leaves=True)
config=json.loads((ROOT/'assets/authored/watch-configurations.json').read_text())
holder_manifest=json.loads((ROOT/'assets/source-manifest/holder.json').read_text())
layout=json.loads((ROOT/'assets/authored/atelier-layout.json').read_text())
result={'sourceSha256':SHA,'coordinateFrame':'station-local Y-up millimetres','pairs':[]}
for st,name in zip(layout['stations'],['movement','dial']):
    path=ROOT/'assets/source-originals/holder'/f'{name}.stp'
    sha=hashlib.sha256(path.read_bytes()).hexdigest()
    assert sha==next(f['sha256'] for f in holder_manifest['files'] if f['path'].endswith(f'/{name}.stp'))
    reader=STEPControl_Reader();reader.ReadFile(str(path));reader.TransferRoots()
    holder_matrix=np.array([[1,0,0,0],[0,0,1,0],[0,-1,0,0],[0,0,0,1]])
    holder=shape_at(reader.OneShape(),holder_matrix)
    sign=1 if st['id']=='bridge' else -1
    presentation=np.array([[1,0,0,0],[0,0,-sign,st['seat']],[0,sign,0,0],[0,0,0,1]])
    for crown in [p for p in config['leaves'] if p['packet']=='crown']:
        shape=shape_at(shapes[crown['id']],presentation)
        measure,common=contact(shape,holder)
        row={'station':st['id'],'crownId':crown['id'],'holderSha256':sha,'crownValid':BRepCheck_Analyzer(shape).IsValid(),'holderValid':BRepCheck_Analyzer(holder).IsValid(),'crownSolids':count_solids(shape),'holderSolids':count_solids(holder),'crownBoundsMm':bbox(shape).tolist(),**measure,'interiorWitnesses':witnesses(common,shape,holder)}
        result['pairs'].append(row)
        print(st['id'],crown['definitionId'],measure['commonVolumeMm3'],flush=True)
        (out/'crown-holder-solids.json').write_text(json.dumps(result,indent=2)+'\n')
result['complete']=True
(out/'crown-holder-solids.json').write_text(json.dumps(result,indent=2)+'\n')
