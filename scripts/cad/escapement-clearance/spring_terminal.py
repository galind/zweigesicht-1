"""3D clearance of polygonal coil strip against the unchanged raised terminal."""
from spring import *
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakePolygon,BRepBuilderAPI_MakeFace
from OCP.BRepPrimAPI import BRepPrimAPI_MakePrism
from OCP.TopoDS import TopoDS_Compound
from OCP.gp import gp_Vec

def prism(poly):
 b=BRepBuilderAPI_MakePolygon()
 for x,y in list(poly.exterior.coords)[:-1]:b.Add(gp_Pnt(x,y,-3.3550000000000084))
 b.Close();face=BRepBuilderAPI_MakeFace(b.Wire())
 return BRepPrimAPI_MakePrism(face.Face(),gp_Vec(0,0,.215)).Shape()

def run():
 d=Data();faces=items(d.world(116),TopAbs_FACE,TopoDS.Face_s)
 terminal=TopoDS_Compound();builder=BRep_Builder();builder.MakeCompound(terminal)
 for i in range(61,72):builder.Add(terminal,faces[i])
 facebounds=[(faces[i],bounds(faces[i])) for i in range(61,72)]
 data=np.load(OUT/'spring-curves.npz');rows=[]
 for angle,points in zip(data['angles'],data['curves']):
  s=np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))]
  stop=np.where(s<s[-1]-.5)[0][-1];minimum=1e9;queries=0;collisions=[];boxlower=1e9
  # Full-polyline chunks, never replacing the curve by endpoint-only chords.
  for i in range(0,stop,20):
   j=min(i+20,stop);pts=points[i:j+1];p=ribbon(pts)
   bb=np.array([[p.bounds[0],p.bounds[1],-3.355],[p.bounds[2],p.bounds[3],-3.14]])
   sh=None
   for face,tb in facebounds:
    lower=float(np.linalg.norm(np.maximum(np.maximum(tb[0]-bb[1],bb[0]-tb[1]),0)))
    if lower>.05:boxlower=min(boxlower,lower);continue
    if sh is None:sh=prism(p);assert BRepCheck_Analyzer(sh).IsValid()
    gap=dist(sh,face);queries+=1;minimum=min(minimum,gap)
    if gap<1e-7:collisions.append([i,j])
  rows.append({'angleDegrees':float(angle),'minimumQueried3dGapMm':minimum if queries else None,
   'conservativeGapLowerBoundMm':min(minimum,boxlower),'exactDistanceQueries':queries,'intersectingChunks':collisions})
  print('terminal',angle,'gap',minimum,'queries',queries,'intersections',collisions,flush=True)
 save('spring-terminal.json',{'scope':'Original terminal faces 61–71 versus polygonal constant-width coil prisms, excluding unchanged final 0.5 mm attachment region; local chunk endpoint normals approximate the smooth strip; sampled 3D distance, not solid volume or dynamics',
  'curvesSha256':digest(OUT/'spring-curves.npz'),'samples':rows})

if __name__=='__main__':run()
