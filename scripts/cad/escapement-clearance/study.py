"""Local-only escapement feasibility study. Never writes application/source assets."""
from pathlib import Path
import sys, json, hashlib, math, subprocess
import numpy as np
ROOT=next(p for p in Path(__file__).resolve().parents if (p/'AGENTS.md').is_file() and (p/'explorer').is_dir())
HERE=ROOT/'artifacts/escapement-clearance-20261026'
HERE.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(HERE/'deps'))
import shapely
import OCP
from shapely.geometry import LineString, Polygon
from shapely.ops import polygonize, unary_union
from shapely.affinity import rotate, translate
from OCP.BRep import BRep_Builder, BRep_Tool
from OCP.BRepTools import BRepTools
from OCP.TopoDS import TopoDS, TopoDS_Shape
from OCP.TopAbs import TopAbs_EDGE, TopAbs_FACE, TopAbs_VERTEX, TopAbs_SOLID
from OCP.TopExp import TopExp_Explorer
from OCP.gp import gp_Trsf,gp_Pnt,gp_Dir,gp_Ax1,gp_Pln
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.BRepAlgoAPI import BRepAlgoAPI_Section,BRepAlgoAPI_Common,BRepAlgoAPI_Cut
from OCP.BRepAdaptor import BRepAdaptor_Curve
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
from OCP.GProp import GProp_GProps
from OCP.BRepGProp import BRepGProp
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox
from OCP.TopTools import TopTools_ListOfShape
SOURCE_SHA='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
HISTORICAL_REF='e5726231760cbc734d77e571bae215b528242acc'
PIV={'balance':np.array([0.,-10.,-2.65]),'pallet':np.array([-.999949089450934,-7.0657025,-1.56]),'escape':np.array([-1.99989817890187,-4.131405,-4.14])}
CENTER={'balance':2.385806786849,'pallet':-7.105740009451,'escape':0.}
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(name,data): (HERE/name).write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')
def items(shape,kind,cast=lambda x:x):
 out=[]; exp=TopExp_Explorer(shape,kind)
 while exp.More():
  x=cast(exp.Current());exp.Next()
  if not any(x.IsSame(y) for y in out):out.append(x)
 return out
def xyz(p):return np.array([p.X(),p.Y(),p.Z()])
def vol(s):
 p=GProp_GProps();BRepGProp.VolumeProperties_s(s,p);return p.Mass()
def moved(s,m):
 t=gp_Trsf();t.SetValues(*np.asarray(m)[:3].ravel().tolist());return BRepBuilderAPI_Transform(s,t,True).Shape()
def matrix(pivot,deg):
 c,s=np.cos(np.deg2rad(deg)),np.sin(np.deg2rad(deg));r=np.array([[c,-s,0],[s,c,0],[0,0,1]]);m=np.eye(4);m[:3,:3]=r;m[:3,3]=pivot-r@pivot;return m
def turn(s,owner,deg):return moved(s,matrix(PIV[owner],deg))
def boolean(a,b,kind):
 op=kind();aa=TopTools_ListOfShape();aa.Append(a);bb=TopTools_ListOfShape();bb.Append(b)
 op.SetArguments(aa);op.SetTools(bb);op.SetNonDestructive(True);op.Build()
 if not op.IsDone():raise ValueError('Boolean failed')
 return op
def common(a,b):
 op=boolean(a,b,BRepAlgoAPI_Common)
 if not op.IsDone():raise ValueError('Common failed')
 return vol(op.Shape())
def dist(a,b):
 d=BRepExtrema_DistShapeShape(a,b);d.Perform()
 if not d.IsDone():raise ValueError('Distance failed')
 return d.Value()
class Data:
 def __init__(self):
  cache=ROOT/'artifacts/escapement/brep-cache';man=json.loads((cache/'manifest.json').read_text())
  assert digest(cache/'manifest.json')=='1b598a2e07594eacdc91df879ea0e1847a2442fafac5321291197b67c29fda27'
  assert man['key']['sourceSha256']==SOURCE_SHA
  assert OCP.__version__==man['key']['ocpVersion']
  assert digest(ROOT/'assets/source-originals/ml01-zweigesicht.stp')==SOURCE_SHA
  assert digest(ROOT/'explorer/public/models/assembly-manifest.json')==man['key']['catalogSha256']
  self.inv=json.loads((ROOT/'explorer/public/models/assembly-manifest.json').read_text())['instances'];self.shapes={}
  for name,h in man['files'].items():
   assert digest(cache/name)==h
   sh=TopoDS_Shape();assert BRepTools.Read_s(sh,str(cache/name),BRep_Builder());self.shapes[int(name.split('.')[0])]=sh
 def occ(self,n):return [i for i in self.inv if i['definitionId']==f'd_0_1_1_{n}']
 def world(self,n,index=0):return moved(self.shapes[n],self.occ(n)[index]['worldTransform'])
def section(shape,z,tol=.0001):
 op=BRepAlgoAPI_Section(shape,gp_Pln(gp_Pnt(0,0,z),gp_Dir(0,0,1)),False);op.Build();assert op.IsDone()
 lines=[]
 for e in items(op.Shape(),TopAbs_EDGE,TopoDS.Edge_s):
  c=BRepAdaptor_Curve(e)
  def subdiv(t0,t1,p0,p1,depth=0):
   tm=(t0+t1)/2;pm=xyz(c.Value(tm))
   # Quarter checks also catch symmetric/full-period curves.
   err=max(np.linalg.norm(xyz(c.Value(t0+(t1-t0)*f))-(p0+(p1-p0)*f)) for f in [.25,.5,.75])
   if err<tol or depth>18:return [p0,p1]
   return subdiv(t0,tm,p0,pm,depth+1)[:-1]+subdiv(tm,t1,pm,p1,depth+1)
  t0,t1=c.FirstParameter(),c.LastParameter();pts=subdiv(t0,t1,xyz(c.Value(t0)),xyz(c.Value(t1)))
  lines.append(LineString(np.round(np.array(pts)[:,:2],9)))
 polys=list(polygonize(unary_union(lines)))
 if not polys:raise ValueError('No section polygons')
 # Section rings polygonize into nested regions; classify each region against original solid.
 from OCP.BRepClass3d import BRepClass3d_SolidClassifier
 accepted=[]
 for p in polys:
  rp=p.representative_point();state=str(BRepClass3d_SolidClassifier(shape,gp_Pnt(rp.x,rp.y,z),1e-7).State())
  if state.endswith('TopAbs_IN') or state.endswith('TopAbs_ON'):accepted.append(p)
 return unary_union(accepted)
def rot(poly,owner,deg):return rotate(poly,deg,origin=tuple(PIV[owner][:2]))
def initialize():
 d=Data();out={}
 for n,i,z in [(112,0,-1.85),(126,0,-1.85),(233,0,-1.82),(128,0,-1.82),(128,1,-1.82),(114,0,-2.),(130,0,-2.)]:
  sh=d.world(n,i);verts=np.array([xyz(BRep_Tool.Pnt_s(v)) for v in items(sh,TopAbs_VERTEX,TopoDS.Vertex_s)])
  print(n,i,'zrange',verts[:,2].min(),verts[:,2].max(),flush=True)
  try:
   p=section(sh,z);out[f'{n}-{i}']={'z':z,'wkt':p.wkt,'area':p.area};print(' area',p.area,'type',p.geom_type,flush=True)
  except Exception as e:print(' section error',e,flush=True)
 write('sections.json',out)
if __name__=='__main__':initialize()
