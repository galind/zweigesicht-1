#!/usr/bin/env python3
"""Supplement the paired STEP audit with maker STL for source exceptions.

Samples establish evidence, not mechanical certification or replacement approval.
"""
import json,sys
from pathlib import Path
import numpy as np
import trimesh
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeVertex
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
from OCP.TDF import TDF_LabelSequence
from OCP.gp import gp_Pnt
ROOT=Path(__file__).resolve().parents[2]
sys.path[:0]=[str(ROOT/'scripts/cad'),str(ROOT/'scripts/preflight')]
from cad_probe import load_xcaf
from compare_component_sources import sha, OUT


def main():
    sources=json.loads((ROOT/'assets/source-manifest/component-fidelity-sources.json').read_text())['files']
    records=[]
    for number,name in [(111,'ml01 Unruhexcenter'),(27,'ml01 ZB Innenteil V2'),(54,'ml01 Hörnchenbügel SS'),(55,'Schraubsteg 1,7x17,8'),(60,'Schraubsteg 1,7x15,9')]:
        step=next(f for f in sources if f['filename']==name+'.stp');stl=next(f for f in sources if f['filename']==name+'.stl')
        for f in [step,stl]:
            if sha(ROOT/f['path'])!=f['sha256']:raise RuntimeError('Source hash mismatch')
        doc,tool=load_xcaf(ROOT/step['path']);roots=TDF_LabelSequence();tool.GetFreeShapes(roots);shape=tool.GetShape_s(roots.Value(1))
        mesh=trimesh.load(ROOT/stl['path'],force='mesh');vertices=np.unique(mesh.vertices,axis=0)
        # Deterministic evenly distributed vertex samples; full test for small meshes.
        points=vertices[np.linspace(0,len(vertices)-1,min(1500,len(vertices)),dtype=int)]
        errors=[]; failures=[]
        for p in points:
            try:
                query=BRepExtrema_DistShapeShape(BRepBuilderAPI_MakeVertex(gp_Pnt(*p)).Vertex(),shape)
                if not query.IsDone():raise RuntimeError('Surface distance failed')
                errors.append(query.Value())
            except Exception as error:
                failures.append(str(error))
                break
        record=dict(definitionId='d_0_1_1_'+str(number),step=step,stl=stl,triangles=len(mesh.faces),watertight=bool(mesh.is_watertight),volumeMm3=float(mesh.volume),areaMm2=float(mesh.area),boundsMm=mesh.bounds.tolist(),testedVertices=len(points),totalUniqueVertices=len(vertices),maxSampleVertexToStepMm=max(errors) if errors else None,distanceFailures=failures,completedVertexQueries=len(errors),alignmentTransform=np.eye(4).tolist(),limits='Vertex sampling is not a full surface/topology or interface equivalence proof; invalid BRep distance can itself be unreliable')
        records.append(record);print(number,len(mesh.faces),max(errors) if errors else failures,flush=True)
        (OUT/'supplemental-stl.json').write_text(json.dumps(records,indent=2)+'\n')

if __name__=='__main__':main()
