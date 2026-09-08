#!/usr/bin/env python3
"""Read-only STEP mechanics evidence probe; writes derived JSON to artifacts/mechanics."""
import sys,json,math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/preflight'))
from cad_probe import load_xcaf,label_entry,label_name
from OCP.TDF import TDF_Label,TDF_Tool
from OCP.XCAFDoc import XCAFDoc_ShapeTool
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_EDGE,TopAbs_FACE
from OCP.TopoDS import TopoDS
from OCP.BRepAdaptor import BRepAdaptor_Curve,BRepAdaptor_Surface
from OCP.GeomAbs import GeomAbs_Cylinder
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.BRepBndLib import BRepBndLib
from OCP.Bnd import Bnd_Box
out=ROOT/'artifacts/mechanics'
out.mkdir(parents=True,exist_ok=True)
inv=json.load(open(ROOT/'artifacts/preflight/assembly-inventory.json'))['instances']
doc,tool=load_xcaf(ROOT/'assets/source-originals/ml01-zweigesicht.stp')
result={}
for num in [85,90,93,94,96,110,113,114,115,116,126,127,128,129,130,233,234,237,238,242,243]:
 label=TDF_Label();TDF_Tool.Label_s(doc.GetData(),f'0:1:1:{num}',label,False)
 shape=XCAFDoc_ShapeTool.GetShape_s(label)
 edges=[]; seen=[];exp=TopExp_Explorer(shape,TopAbs_EDGE)
 while exp.More():
  edge=TopoDS.Edge_s(exp.Current());exp.Next()
  if any(edge.IsSame(x) for x in seen):continue
  seen.append(edge)
  a=BRepAdaptor_Curve(edge);lo,hi=a.FirstParameter(),a.LastParameter()
  props=GProp_GProps();BRepGProp.LinearProperties_s(edge,props)
  length=props.Mass();n=max(3,min(2500,int(length/.008)+2))
  pts=np.array([[p.X(),p.Y(),p.Z()] for t in np.linspace(lo,hi,n) for p in [a.Value(float(t))]])
  edges.append({'type':str(a.GetType()),'lengthMm':length,'points':pts.tolist()})
 cylinders=[];exp=TopExp_Explorer(shape,TopAbs_FACE)
 while exp.More():
  a=BRepAdaptor_Surface(TopoDS.Face_s(exp.Current()));exp.Next()
  if a.GetType()==GeomAbs_Cylinder:
   c=a.Cylinder();p=c.Location();d=c.Axis().Direction()
   cylinders.append({'origin':[p.X(),p.Y(),p.Z()],'axis':[d.X(),d.Y(),d.Z()],'radius':c.Radius()})
 b=Bnd_Box();BRepBndLib.AddOptimal_s(shape,b,False,False)
 instance=next((x for x in inv if x['definition_label']==f'0:1:1:{num}'),None)
 r={'name':label_name(label),'definitionLabel':f'0:1:1:{num}','instance':instance,'bounds':b.Get(),'cylinders':cylinders,'edges':edges}
 result[str(num)]=r
 print(num,r['name'],'bounds',r['bounds'],'edges',len(edges),'longest',sorted([round(e['lengthMm'],5) for e in edges],reverse=True)[:10],flush=True)
(out/'source-geometry.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
