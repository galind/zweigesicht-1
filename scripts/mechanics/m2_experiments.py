#!/usr/bin/env python3
"""Independent interior witnesses and bounded, source-centered sensitivity; not a cycle."""
import json
import math
import numpy as np
from m2_audit import (Source, ROOT, OUT, SHA, items, pair, distance, volume, tolerance, xyz,
    TopAbs_FACE, TopoDS, BRepGProp, GProp_GProps, BRepAlgoAPI_Common, BRepBuilderAPI_Transform)
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeVertex
from OCP.BRepClass3d import BRepClass3d_SolidClassifier
from OCP.gp import gp_Trsf, gp_Pnt, gp_Dir, gp_Ax1
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
from OCP.TopAbs import TopAbs_SOLID
from OCP.BRepCheck import BRepCheck_Analyzer

def interior(a,b):
    from OCP.TopTools import TopTools_ListOfShape
    aa=TopTools_ListOfShape();aa.Append(a);bb=TopTools_ListOfShape();bb.Append(b)
    op=BRepAlgoAPI_Common();op.SetArguments(aa);op.SetTools(bb);op.SetNonDestructive(True);op.Build()
    assert op.IsDone()
    c=op.Shape()
    prop=GProp_GProps();BRepGProp.VolumeProperties_s(c,prop);p=prop.CentreOfMass()
    rows=[]
    for s in [a,b]:
        v=BRepBuilderAPI_MakeVertex(p).Vertex()
        ds=[(j,f,distance(f,v)) for j,f in enumerate(items(s,TopAbs_FACE,TopoDS.Face_s),1)]
        j,f,d=min(ds,key=lambda x:x[2].Value())
        rows.append({'states':[str(BRepClass3d_SolidClassifier(s,p,e).State()) for e in [1e-5,1e-6,1e-7]],
            'boundaryDistanceMm':d.Value(),'nearestFace':j,'nearestFaceBoundaryToleranceMm':tolerance(f),
            'wholeShapeToleranceMm':tolerance(s),'boundaryWorldMm':xyz(d.PointOnShape1(1))})
    depth=min(r['boundaryDistanceMm'] for r in rows)
    reliable=all(all(x.endswith('TopAbs_IN') for x in r['states']) and r['boundaryDistanceMm']>r['wholeShapeToleranceMm']+.001 for r in rows)
    return {'interiorWorldMm':xyz(p),'insideChecks':rows,'interiorBallRadiusMm':depth,
        'meaning':'Interior ball radius is a lower bound on overlap thickness evidence, not global minimum translation to separate.',
        'classification':'penetration corroborated' if reliable else 'intersection detected; precision-inconclusive depth'}

def turn(s,p,angle):
    t=gp_Trsf();t.SetRotation(gp_Ax1(gp_Pnt(*p),gp_Dir(0,0,1)),angle)
    return BRepBuilderAPI_Transform(s,t,True).Shape()

def radius(s,p):
    box=Bnd_Box();BRepBndLib.AddOptimal_s(s,box,False,True)
    x0,y0,_,x1,y1,_=box.Get()
    return max(math.hypot(x-p[0],y-p[1]) for x in [x0,x1] for y in [y0,y1])

def main():
    source=Source();g=json.loads((ROOT/'docs/running-movement/graph.json').read_text())
    def one(n): return source.world(source.occurrences(n)[0])
    ss={n:one(n) for n in [112,114,126,129,130,233]}
    jewels=[source.world(i) for i in source.occurrences(128)]
    pins=[source.world(i) for i in source.occurrences(200)]
    penetration={'impulse-body':interior(ss[112],ss[126]),'body-pin9':interior(ss[126],pins[1])}
    print('INTERIOR',json.dumps(penetration),flush=True)
    # Deliberately bounded by 5 micrometres of monitored surface travel in either direction.
    # Not selected to produce a lock, release, bank, operating amplitude, or initial alignment.
    defs={'balance':[112,114],'pallet':[126,129,130],'escape':[233]}
    probes=[('escape-jewel3',233,jewels[0],'escape','pallet'),('escape-jewel4',233,jewels[1],'escape','pallet'),
        ('impulse-body',112,ss[126],'balance','pallet'),('roller-safety',114,ss[130],'balance','pallet'),
        ('body-pin8',126,pins[0],'pallet','frame'),('body-pin9',126,pins[1],'pallet','frame')]
    runs=[]
    for shaft in defs:
        pivot=g['shafts'][shaft]['pivotWorldMm']
        moving=[ss[n] for n in defs[shaft]]+(jewels if shaft=='pallet' else [])
        rad=max(radius(s,pivot) for s in moving);extent=.005/rad
        rows=[]
        for k in range(-40,41):
            angle=extent*k/40
            out={}
            for name,n,b,ownerA,ownerB in probes:
                if shaft not in [ownerA,ownerB]: continue
                a=turn(ss[n],pivot,angle) if ownerA==shaft else ss[n]
                bb=turn(b,pivot,angle) if ownerB==shaft else b
                out[name]=distance(a,bb).Value()
            rows.append({'angleRad':angle,'distancesMm':out})
        # Coarse points are a subset but rerun independently at different deflection.
        errors=[]
        for row in rows[::2]:
            angle=row['angleRad']
            for name,n,b,ownerA,ownerB in probes:
                if shaft not in [ownerA,ownerB]: continue
                a=turn(ss[n],pivot,angle) if ownerA==shaft else ss[n]
                bb=turn(b,pivot,angle) if ownerB==shaft else b
                errors.append(abs(distance(a,bb,1e-6).Value()-row['distancesMm'][name]))
        run={'shaft':shaft,'radiusBoundMm':rad,'extentRad':extent,'extentDerivation':'0.005 mm / monitored XY radius bound; symmetric independent source perturbation only',
            'maxSurfaceTravelPerFineIntervalMm':rad*extent/40,'maxCoarseRefinementDifferenceMm':max(errors),'samples':rows}
        runs.append(run);print('SWEEP',shaft,rad,extent,flush=True)
    report={'sourceSha256':SHA,'penetration':penetration,'runs':runs,'cycleAccepted':False,
        'limitations':'No operating time or half-cycle assignment. Pair distances are nonnegative; zero remains overlap/contact ambiguous. Lipschitz travel bounds limit missed separation changes only; no collision-free claim, contact-normal sweep or dynamic proof.'}
    (OUT/'experiments.json').write_text(json.dumps(report,indent=2)+'\n')

if __name__=='__main__': main()
