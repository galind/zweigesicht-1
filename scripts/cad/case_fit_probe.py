#!/usr/bin/env python3
"""Inspect fitted-case occurrence choices and the d54 missing face; no repair."""
import hashlib, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/preflight'))
from cad_probe import load_xcaf
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.XCAFDoc import XCAFDoc_ShapeTool
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.BRep import BRep_Tool
from OCP.BRepGProp import BRepGProp
from OCP.BRepBndLib import BRepBndLib
from OCP.Bnd import Bnd_Box
from OCP.GProp import GProp_GProps
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE
from OCP.TopoDS import TopoDS
from OCP.TopLoc import TopLoc_Location
source=ROOT/'assets/source-originals/ml01-zweigesicht.stp'
sha=hashlib.sha256(source.read_bytes()).hexdigest()
assert sha=='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
doc,_=load_xcaf(source)
label=TDF_Label();TDF_Tool.Label_s(doc.GetData(),'0:1:1:54',label,False)
shape=XCAFDoc_ShapeTool.GetShape_s(label)
BRepMesh_IncrementalMesh(shape,.015,False,.25,True).Perform()
exp=TopExp_Explorer(shape,TopAbs_FACE);faces=[];i=0
while exp.More():
 i+=1;face=TopoDS.Face_s(exp.Current());exp.Next()
 if BRep_Tool.Triangulation_s(face,TopLoc_Location()) is not None:continue
 props=GProp_GProps();BRepGProp.SurfaceProperties_s(face,props)
 b=Bnd_Box();BRepBndLib.AddOptimal_s(face,b,False,False)
 faces.append({'face':i,'areaMm2':props.Mass(),'boundsLocalMm':list(b.Get()),'centerLocalMm':list(props.CentreOfMass().Coord())})
result={'sourceSha256':sha,'definition':'d_0_1_1_54','faceCount':i,'missingFaces':faces,'repairPerformed':False}
path=ROOT/'artifacts/case-cad/d54.json';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
# Re-tessellate only the missing source face, without changing its wires/surface.
from OCP.BRepBuilderAPI import BRepBuilderAPI_Copy
from OCP.BRepTools import BRepTools
from OCP.TopAbs import TopAbs_REVERSED
import numpy as np
exp=TopExp_Explorer(shape,TopAbs_FACE)
original=TopoDS.Face_s(exp.Current())
copy=TopoDS.Face_s(BRepBuilderAPI_Copy(original).Shape())
BRepTools.Clean_s(copy)
BRepMesh_IncrementalMesh(copy,.03,False,.25,True).Perform()
loc=TopLoc_Location();tri=BRep_Tool.Triangulation_s(copy,loc)
assert tri is not None
vertices=[list(tri.Node(n).Transformed(loc.Transformation()).Coord()) for n in range(1,tri.NbNodes()+1)]
triangles=[]
for t in tri.Triangles():
 a,b,c=[t.Value(k)-1 for k in (1,2,3)]
 triangles.append([a,c,b] if copy.Orientation()==TopAbs_REVERSED else [a,b,c])
v=np.array(vertices);faces=np.array(triangles)
area=float(np.linalg.norm(np.cross(v[faces[:,1]]-v[faces[:,0]],v[faces[:,2]]-v[faces[:,0]]),axis=1).sum()/2)
assert abs(area-result['missingFaces'][0]['areaMm2']) < .15
recovery={'sourceSha256':sha,'definitionId':'d_0_1_1_54','sourceFace':1,'linearDeflectionMm':.03,'angularDeflectionRad':.25,'vertices':vertices,'triangles':triangles}
recovery_path=ROOT/'artifacts/case-cad/lug-recovery.json';recovery_path.write_text(json.dumps(recovery,separators=(',',':'))+'\n')
result['recovery']={'method':'Independent meshing of a copy of original face 1; unchanged source wires and surface.','linearDeflectionMm':.03,'triangles':len(triangles),'meshAreaMm2':area,'areaErrorMm2':area-result['missingFaces'][0]['areaMm2'],'sha256':hashlib.sha256(recovery_path.read_bytes()).hexdigest()}
path.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result['recovery'],indent=2))
