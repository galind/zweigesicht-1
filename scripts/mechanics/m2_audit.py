#!/usr/bin/env python3
"""Source-rest M2 BRep audit. No source repair, operating defaults or mesh export."""
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
import OCP
from OCP.BRep import BRep_Tool, BRep_Builder
from OCP.BRepTools import BRepTools
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
from OCP.BRepAlgoAPI import BRepAlgoAPI_Common
from OCP.BRepGProp import BRepGProp
from OCP.BRepLProp import BRepLProp_SLProps
from OCP.GeomAPI import GeomAPI_ProjectPointOnSurf
from OCP.GProp import GProp_GProps
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE, TopAbs_EDGE, TopAbs_VERTEX, TopAbs_SOLID, TopAbs_REVERSED
from OCP.TopoDS import TopoDS, TopoDS_Shape
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.XCAFDoc import XCAFDoc_ShapeTool
from OCP.gp import gp_Trsf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/mechanics/running-movement/m2'
SHA = 'f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
SELECTED = [110,111,112,113,114,115,126,127,128,129,130,133,135,195,200,233,234,235]

def items(s, kind, cast=lambda x:x):
    exp = TopExp_Explorer(s, kind)
    out = []
    while exp.More():
        item = cast(exp.Current()); exp.Next()
        if not any(item.IsSame(old) for old in out): out.append(item)
    return out

def tolerance(s):
    vals = []
    if s.ShapeType() == TopAbs_FACE: vals.append(BRep_Tool.Tolerance_s(TopoDS.Face_s(s)))
    for kind, cast in [(TopAbs_FACE,TopoDS.Face_s),(TopAbs_EDGE,TopoDS.Edge_s),(TopAbs_VERTEX,TopoDS.Vertex_s)]:
        vals.extend(BRep_Tool.Tolerance_s(x) for x in items(s,kind,cast))
    return max(vals, default=0)

def volume(s):
    p = GProp_GProps(); BRepGProp.VolumeProperties_s(s,p); return p.Mass()

def xyz(p): return [p.X(),p.Y(),p.Z()]

def distance(a,b,eps=1e-7):
    d=BRepExtrema_DistShapeShape(); d.LoadS1(a); d.LoadS2(b); d.SetDeflection(eps); d.Perform()
    if not d.IsDone(): raise RuntimeError('Distance did not converge')
    return d

def normal_evidence(s, point):
    """All incident faces within 1e-6 of witness, including edge/corner normal cones."""
    result=[]
    for index, face in enumerate(items(s,TopAbs_FACE,TopoDS.Face_s),1):
        projection=GeomAPI_ProjectPointOnSurf(point,BRep_Tool.Surface_s(face))
        if not projection.NbPoints() or projection.LowerDistance()>1e-6: continue
        # Projection onto the untrimmed support is insufficient: require trimmed-face proximity.
        from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeVertex
        if distance(face,BRepBuilderAPI_MakeVertex(point).Vertex()).Value()>1e-6: continue
        u,v=projection.LowerDistanceParameters()
        prop=BRepLProp_SLProps(BRepAdaptor_Surface(face),u,v,1,1e-9)
        n=xyz(prop.Normal()) if prop.IsNormalDefined() else None
        if n and face.Orientation()==TopAbs_REVERSED: n=[-x for x in n]
        result.append({'face':index,'type':str(BRepAdaptor_Surface(face).GetType()),'normalWorld':n,'faceAndBoundaryToleranceMm':tolerance(face)})
    return result

class Source:
    def __init__(self):
        source=ROOT/'assets/source-originals/ml01-zweigesicht.stp'
        assert hashlib.sha256(source.read_bytes()).hexdigest()==SHA
        self.inv=json.loads((ROOT/'artifacts/preflight/assembly-inventory.json').read_text())['instances']
        self.cache=OUT/'brep-cache'; self.cache.mkdir(parents=True,exist_ok=True)
        self.shapes={}
        manifest_path=self.cache/'manifest.json'
        if manifest_path.exists():
            cached=json.loads(manifest_path.read_text())
            assert cached['ocpVersion']==OCP.__version__
            assert cached['importerSha256']==hashlib.sha256((ROOT/'scripts/preflight/cad_probe.py').read_bytes()).hexdigest()
            for name, sha in cached['files'].items():
                assert hashlib.sha256((self.cache/name).read_bytes()).hexdigest()==sha, 'BRep cache changed'
        missing=[n for n in SELECTED if not (self.cache/f'{SHA}-{n}.brep').exists()]
        if missing:
            sys.path.insert(0,str(ROOT/'scripts/preflight'))
            from cad_probe import load_xcaf
            doc,_=load_xcaf(source)
            for n in missing:
                label=TDF_Label();TDF_Tool.Label_s(doc.GetData(),f'0:1:1:{n}',label,False)
                s=XCAFDoc_ShapeTool.GetShape_s(label)
                assert BRepTools.Write_s(s,str(self.cache/f'{SHA}-{n}.brep'))
        manifest_path.write_text(json.dumps({'ocpVersion':OCP.__version__,'importerSha256':hashlib.sha256((ROOT/'scripts/preflight/cad_probe.py').read_bytes()).hexdigest(),'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(self.cache.glob('*.brep'))}},indent=2)+'\n')
        for n in SELECTED:
            s=TopoDS_Shape();assert BRepTools.Read_s(s,str(self.cache/f'{SHA}-{n}.brep'),BRep_Builder())
            self.shapes[n]=s
    def occurrences(self,n): return [i for i in self.inv if i['definition_label']==f'0:1:1:{n}']
    def world(self,i):
        t=gp_Trsf();t.SetValues(*np.array(i['world_transform'])[:3].ravel().tolist())
        return BRepBuilderAPI_Transform(self.shapes[int(i['definition_label'].split(':')[-1])],t,True).Shape()

def pair(a,b):
    ds=[distance(a,b,e) for e in [1e-5,1e-6,1e-7]]
    d=ds[-1]; common=[]
    for fuzzy in [1e-7,5e-8,1e-8]:
        op=BRepAlgoAPI_Common();from OCP.TopTools import TopTools_ListOfShape
        aa=TopTools_ListOfShape();aa.Append(a);bb=TopTools_ListOfShape();bb.Append(b)
        op.SetArguments(aa);op.SetTools(bb);op.SetFuzzyValue(fuzzy);op.SetNonDestructive(True);op.Build()
        if not op.IsDone(): raise RuntimeError('Common failed')
        c=op.Shape()
        common.append({'fuzzyMm':fuzzy,'volumeMm3':volume(c),'solids':len(items(c,TopAbs_SOLID)),'valid':BRepCheck_Analyzer(c).IsValid()})
    witnesses=[]
    for k in range(1,min(d.NbSolution(),8)+1):
        pa,pb=d.PointOnShape1(k),d.PointOnShape2(k)
        witnesses.append({'aWorldMm':xyz(pa),'bWorldMm':xyz(pb),'aFaces':normal_evidence(a,pa),'bFaces':normal_evidence(b,pb)})
    spread=max(x.Value() for x in ds)-min(x.Value() for x in ds)
    # Conservative screening; boundary tolerances on the actual incident faces, not global maxima.
    local=max((f['faceAndBoundaryToleranceMm'] for w in witnesses for side in ['aFaces','bFaces'] for f in w[side]),default=None)
    positive=all(c['volumeMm3']>0 and c['solids']>0 and c['valid'] for c in common)
    cls='numerically inconclusive'
    if local is not None and all(w[side] for w in witnesses for side in ['aFaces','bFaces']) and local<=.001 and spread<=.0002 and all(BRepCheck_Analyzer(s).IsValid() for s in [a,b]):
        if positive: cls='intersection detected; depth corroboration required'
        elif d.Value()>.001 and all(c['solids']==0 for c in common): cls='separation'
    return {'distanceRefinementMm':[x.Value() for x in ds],'distanceSpreadMm':spread,'common':common,'witnesses':witnesses,'witnessCount':d.NbSolution(),'witnessesTruncated':d.NbSolution()>8,'localToleranceMm':local,'classification':cls}

def main():
    source=Source(); definitions=[]; occurrences=[]
    import csv
    coverage={r['source_instance_id']:r for r in csv.DictReader((ROOT/'docs/running-movement/coverage.csv').open())}
    for n,s in source.shapes.items():
        faces=[]
        for j,f in enumerate(items(s,TopAbs_FACE,TopoDS.Face_s),1):
            p=GProp_GProps();BRepGProp.SurfaceProperties_s(f,p)
            faces.append({'face':j,'type':str(BRepAdaptor_Surface(f).GetType()),'toleranceMm':BRep_Tool.Tolerance_s(f),'boundaryMaxToleranceMm':tolerance(f),'areaMm2':p.Mass(),'centerLocalMm':xyz(p.CentreOfMass())})
        definitions.append({'definition':n,'valid':BRepCheck_Analyzer(s).IsValid(),'maxTopologyToleranceMm':tolerance(s),'faces':faces})
        for i in source.occurrences(n):
            occurrences.append({**coverage[i['instance_id']],'worldTransform':i['world_transform']})
        print('precision',n,definitions[-1]['valid'],definitions[-1]['maxTopologyToleranceMm'],flush=True)
    def one(n): return source.occurrences(n)[0]
    pairs=[]
    specifications=[(one(233),i,'escape / pallet jewel') for i in source.occurrences(128)]
    specifications += [(one(a),one(b),'roller / fork / safety') for a,b in [(112,126),(114,126),(112,129),(112,130),(114,129),(114,130)]]
    specifications += [(one(a),i,'fixed support / banking candidate') for a in [126,129,130] for n in [200,133,135,195] for i in source.occurrences(n)]
    for a,b,role in specifications:
        r={'a':coverage[a['instance_id']]['instance_id'],'b':coverage[b['instance_id']]['instance_id'],'role':role,**pair(source.world(a),source.world(b))};pairs.append(r)
        print('pair',a['definition_label'],b['instance_id'],r['classification'],r['distanceRefinementMm'][-1],r['common'][-1]['volumeMm3'],flush=True)
        (OUT/'source-rest.json').write_text(json.dumps({'sourceSha256':SHA,'definitions':definitions,'occurrences':occurrences,'pairs':pairs},indent=2,allow_nan=False)+'\n')

if __name__=='__main__': main()
