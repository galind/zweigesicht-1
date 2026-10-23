"""Record holder STEP seating planes/cylinders without altering source geometry.
Run with .venv-cad/bin/python scripts/bench/inspect-holder.py.
"""
import hashlib, json
from pathlib import Path
from OCP.STEPControl import STEPControl_Reader
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE
from OCP.TopoDS import TopoDS
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.GeomAbs import GeomAbs_Plane, GeomAbs_Cylinder
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'assets/source-manifest/holder.json').read_text())
result={}
for name in ['movement','dial']:
 path=ROOT/'assets/source-originals/holder'/f'{name}.stp'
 expected=next(e for e in manifest['files'] if e['path'].endswith(f'/{name}.stp'))
 assert hashlib.sha256(path.read_bytes()).hexdigest()==expected['sha256']
 reader=STEPControl_Reader();reader.ReadFile(str(path));reader.TransferRoots()
 explorer=TopExp_Explorer(reader.OneShape(),TopAbs_FACE);rows=[]
 while explorer.More():
  face=TopoDS.Face_s(explorer.Current());explorer.Next()
  surface=BRepAdaptor_Surface(face);bounds=Bnd_Box();BRepBndLib.AddOptimal_s(face,bounds,False,False)
  entry={'boundsMm':[round(v,6) for v in bounds.Get()]}
  if surface.GetType()==GeomAbs_Plane and abs(surface.Plane().Axis().Direction().Z())>.99:
   entry['type']='horizontal plane'
  elif surface.GetType()==GeomAbs_Cylinder and abs(surface.Cylinder().Axis().Direction().Z())>.99:
   entry.update(type='axial cylinder',radiusMm=round(surface.Cylinder().Radius(),6))
  else:continue
  rows.append(entry)
 result[name]={'sourceSha256':expected['sha256'],'surfaces':rows}
output=ROOT/'artifacts/bench/holder-surfaces.json';output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(result,indent=2)+'\n');print(output.relative_to(ROOT))
