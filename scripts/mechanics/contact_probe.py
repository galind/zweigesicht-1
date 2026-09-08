#!/usr/bin/env python3
"""Run the bounded sparse escapement-distance probe used for current evidence."""
import sys,json,math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'scripts/preflight'))
from cad_probe import load_xcaf
from OCP.TDF import TDF_Label,TDF_Tool
from OCP.XCAFDoc import XCAFDoc_ShapeTool
from OCP.gp import gp_Trsf,gp_Pnt,gp_Dir,gp_Ax1
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
out=ROOT/'artifacts/mechanics';out.mkdir(parents=True,exist_ok=True)
inv=json.load(open(ROOT/'artifacts/preflight/assembly-inventory.json'))['instances']
doc,tool=load_xcaf(ROOT/'assets/source-originals/ml01-zweigesicht.stp')
def shape(i):
 label=TDF_Label();TDF_Tool.Label_s(doc.GetData(),i['definition_label'],label,False)
 s=XCAFDoc_ShapeTool.GetShape_s(label);t=gp_Trsf();t.SetValues(*np.array(i['world_transform'])[:3].ravel().tolist())
 return BRepBuilderAPI_Transform(s,t,True).Shape()
def turn(s,center,degrees):
 t=gp_Trsf();t.SetRotation(gp_Ax1(gp_Pnt(*center),gp_Dir(0,0,1)),math.radians(degrees))
 return BRepBuilderAPI_Transform(s,t,True).Shape()
def dist(a,b):
 d=BRepExtrema_DistShapeShape(a,b);d.Perform();return d.Value()
es=shape(next(i for i in inv if i['definition_label']=='0:1:1:233'))
pals=[shape(i) for i in inv if i['definition_label']=='0:1:1:128']
res=[]
for pa in [-16,-14,-12,-10,-8,-6,-3,0,3,6]:
 for ea in [-9,0,9]:
  ep=turn(es,[-1.9998981789,-4.131405,0],ea)
  ds=[dist(turn(p,[-.99994908945,-7.0657025,0],pa),ep) for p in pals]
  r={'palletDegrees':pa,'escapeDegrees':ea,'minimumDistancesMm':ds};res.append(r);print(r,flush=True)
# Source spring ends compared to source hardware (points, not fitted contact constraints)
spring=next(i for i in inv if i['definition_label']=='0:1:1:116');mat=np.array(spring['world_transform'])
anchors={n:(mat@np.r_[p,1])[:3].tolist() for n,p in [('inner',[-.34816775,-.35454735,-.1075]),('outer',[.985,-1.706070,.3575])]}
(out/'contact-probe.json').write_text(json.dumps({'warning':'Distances are sparse geometric probes, not a contact cycle or collision proof. Zero distance may be contact or overlap.','grid':res,'springTerminalCentersWorldMm':anchors},indent=2)+'\n')
