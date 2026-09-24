#!/usr/bin/env python3
"""Read original crown planes to scope the recessed M background finish."""
import sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/preflight'))
from cad_probe import load_xcaf
from OCP.TDF import TDF_Label,TDF_Tool
from OCP.XCAFDoc import XCAFDoc_ShapeTool
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE
from OCP.TopoDS import TopoDS
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.BRepBndLib import BRepBndLib
from OCP.Bnd import Bnd_Box
doc,_=load_xcaf(ROOT/'assets/source-originals/ml01-zweigesicht.stp')
l=TDF_Label();TDF_Tool.Label_s(doc.GetData(),'0:1:1:46',l,False)
e=TopExp_Explorer(XCAFDoc_ShapeTool.GetShape_s(l),TopAbs_FACE);rows=[];i=0
while e.More():
 i+=1;f=TopoDS.Face_s(e.Current());e.Next();s=BRepAdaptor_Surface(f);p=GProp_GProps();BRepGProp.SurfaceProperties_s(f,p);b=Bnd_Box();BRepBndLib.AddOptimal_s(f,b,False,False)
 if 'Plane' in str(s.GetType()):rows.append(dict(face=i,area=p.Mass(),bounds=b.Get(),normal=s.Plane().Axis().Direction().Coord()))
(ROOT/'artifacts/case-cad').mkdir(parents=True,exist_ok=True)
(ROOT/'artifacts/case-cad/crown-faces.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
