#!/usr/bin/env python3
"""Bounded M0 analytic-axis/count evidence; no motion or runtime asset writes."""
import hashlib
import json
import math
import sys
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/preflight'))
from cad_probe import load_xcaf
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.XCAFDoc import XCAFDoc_ShapeTool
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_EDGE, TopAbs_FACE, TopAbs_VERTEX
from OCP.TopoDS import TopoDS
from OCP.BRep import BRep_Tool
from OCP.BRepAdaptor import BRepAdaptor_Curve, BRepAdaptor_Surface
from OCP.GeomAbs import GeomAbs_Cylinder
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps

source = ROOT / 'assets/source-originals/ml01-zweigesicht.stp'
sha = hashlib.sha256(source.read_bytes()).hexdigest()
assert sha == 'f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
inv = json.loads((ROOT / 'artifacts/preflight/assembly-inventory.json').read_text())['instances']
doc, tool = load_xcaf(source)
# Recheck old upstream counts and extend the two display trains; no contact sweep.
selected = [85, 86, 87, 88, 90, 91, 93, 96, 97, 116, 117, 118, 131, 137, 141, 183, 184, 187, 210, 211, 213, 214, 216, 217]
toothed = {85, 90, 93, 96, 97, 131, 137, 141, 183, 187, 210, 211, 213, 216, 217}
rows = []
for number in selected:
    label = TDF_Label()
    TDF_Tool.Label_s(doc.GetData(), f'0:1:1:{number}', label, False)
    shape = XCAFDoc_ShapeTool.GetShape_s(label)
    cylinders, tolerances = [], []
    exp = TopExp_Explorer(shape, TopAbs_FACE)
    while exp.More():
        face = TopoDS.Face_s(exp.Current()); exp.Next()
        tolerances.append(BRep_Tool.Tolerance_s(face))
        a = BRepAdaptor_Surface(face)
        if a.GetType() == GeomAbs_Cylinder:
            c = a.Cylinder(); p = c.Location(); d = c.Axis().Direction()
            cylinders.append({'originLocalMm': [p.X(),p.Y(),p.Z()], 'axisLocal': [d.X(),d.Y(),d.Z()], 'radiusMm': c.Radius()})
    for kind, cast in [(TopAbs_EDGE, TopoDS.Edge_s), (TopAbs_VERTEX, TopoDS.Vertex_s)]:
        exp = TopExp_Explorer(shape, kind)
        while exp.More():
            tolerances.append(BRep_Tool.Tolerance_s(cast(exp.Current()))); exp.Next()
    counts = []
    if number in toothed:
        points, seen = [], []
        exp = TopExp_Explorer(shape, TopAbs_EDGE)
        while exp.More():
            edge = TopoDS.Edge_s(exp.Current()); exp.Next()
            if any(edge.IsSame(e) for e in seen): continue
            seen.append(edge); a = BRepAdaptor_Curve(edge)
            prop = GProp_GProps(); BRepGProp.LinearProperties_s(edge,prop)
            n = max(3,min(2500,int(prop.Mass()/.008)+2))
            for t in np.linspace(a.FirstParameter(),a.LastParameter(),n):
                p = a.Value(float(t)); points.append([p.X(),p.Y(),p.Z()])
        p = np.array(points); radii = np.linalg.norm(p[:,:2],axis=1)
        for frac in [.985,.97,.95]:
            a = np.sort(np.mod(np.arctan2(p[radii>radii.max()*frac,1],p[radii>radii.max()*frac,0]),2*np.pi))
            gaps = np.diff(np.r_[a,a[0]+2*np.pi])
            counts.append({'radiusFraction':frac,'tipClusters':int(np.count_nonzero(gaps>gaps.max()*.5))})
    occurrences = []
    for i in inv:
        if i['definition_label'] != f'0:1:1:{number}': continue
        w = np.array(i['world_transform'])
        # Expose every analytic cylinder; choosing a bore/shaft remains an explicit interpretation.
        occurrences.append({'id':'p_'+i['instance_id'].replace(':','_').replace('/','__'),
            'placementOriginWorldMm':w[:3,3].tolist(), 'localZWorld':w[:3,2].tolist(),
            'cylinderAxesWorld':[{'pointMm':(w@np.r_[c['originLocalMm'],1])[:3].tolist(), 'direction':(w[:3,:3]@c['axisLocal']).tolist(), 'radiusMm':c['radiusMm']} for c in cylinders]})
    rows.append({'definition':number,'name':next(i['name'] for i in inv if i['definition_label']==f'0:1:1:{number}'), 'counts':counts,'cylindersLocal':cylinders,'occurrences':occurrences,'maxTopologyToleranceMm':max(tolerances,default=0)})
    print(number,[c['tipClusters'] for c in counts],flush=True)
out = ROOT / 'artifacts/mechanics/running-movement/m0'; out.mkdir(parents=True,exist_ok=True)
report = {'schemaVersion':1,'sourceSha256':sha,'method':'Analytic cylinders/XCAF; historical .008 mm edge-tip sampling with 2500 cap and three radial thresholds. Local-origin count assumes gear centered at local XY zero. Agreement nominates count, not mesh/contact.', 'reviewStatus':'Engineering geometry only; no expert acceptance','definitions':rows}
(out/'cad-probe.json').write_text(json.dumps(report,indent=2)+'\n')
