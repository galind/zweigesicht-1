#!/usr/bin/env python3
"""Exhaustive, read-only STEP/XCAF finishing evidence; writes ignored audit files only.

Run .venv-cad/bin/python scripts/cad/cad_finishing_source_audit.py
Face/body IDs are one-based TopExp explorer order, matching existing finish sidecars.
No source or generated runtime assets are rewritten. CAD color does not prove alloy.
"""
from __future__ import annotations
import collections, hashlib, json, re, sys
from pathlib import Path
import numpy as np
from OCP.Bnd import Bnd_Box
from OCP.BRep import BRep_Tool
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepBndLib import BRepBndLib
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepGProp import BRepGProp
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.GProp import GProp_GProps
from OCP.GeomLProp import GeomLProp_SLProps
from OCP.Quantity import Quantity_ColorRGBA
from OCP.TDF import TDF_Label,TDF_LabelSequence,TDF_ChildIterator
from OCP.TopAbs import TopAbs_SOLID,TopAbs_SHELL,TopAbs_FACE,TopAbs_EDGE,TopAbs_VERTEX,TopAbs_REVERSED
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_DocumentTool,XCAFDoc_ShapeTool,XCAFDoc_ColorTool,XCAFDoc_ColorGen,XCAFDoc_ColorSurf,XCAFDoc_ColorCurv,XCAFDoc_VisMaterialTool
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/preflight'))
from cad_probe import load_xcaf,label_entry,label_name,matrix
OUT=ROOT/'artifacts/cad-finishing-audit/source'
KINDS={'general':XCAFDoc_ColorGen,'surface':XCAFDoc_ColorSurf,'curve':XCAFDoc_ColorCurv}

def seq(s):return [s.Value(i) for i in range(1,s.Length()+1)]
def shapes(shape,kind):
    e=TopExp_Explorer(shape,kind);r=[]
    while e.More():r.append(e.Current());e.Next()
    return r

def bounds(shape):
    b=Bnd_Box()
    try:BRepBndLib.AddOptimal_s(shape,b,False,False)
    except Exception:return None
    if b.IsVoid():return None
    v=b.Get()
    return [list(v[:3]),list(v[3:])] if np.isfinite(v).all() and max(abs(x) for x in v)<1e6 else None

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    source=ROOT/'assets/source-originals/ml01-zweigesicht.stp';raw=source.read_bytes();digest=hashlib.sha256(raw).hexdigest()
    assert digest=='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
    manifest=json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text())
    current={d['id']:d for d in manifest['definitions'] if not d['isAssembly']}
    occurrence_map=collections.defaultdict(list)
    for i in manifest['instances']:
        if not i['isAssembly']:occurrence_map[i['definitionId']].append(i)
    doc,tool=load_xcaf(source);ct=XCAFDoc_DocumentTool.ColorTool_s(doc.Main())
    mt=XCAFDoc_DocumentTool.MaterialTool_s(doc.Main());vt=XCAFDoc_DocumentTool.VisMaterialTool_s(doc.Main())
    def colors(obj,instance=False):
        r={}
        for name,kind in KINDS.items():
            c=Quantity_ColorRGBA()
            found=ct.GetInstanceColor(obj,kind,c) if instance else XCAFDoc_ColorTool.GetColor_s(obj,kind,c) if isinstance(obj,TDF_Label) else ct.GetColor(obj,kind,c)
            if found:
                rgb=c.GetRGB();r[name]=[rgb.Red(),rgb.Green(),rgb.Blue(),c.Alpha()]
        return r
    def material(label):
        out=TDF_Label();found=XCAFDoc_VisMaterialTool.GetShapeMaterial_s(label,out)
        return {'visualMaterialLabel':label_entry(out) if found else None,'physicalMaterialMetadata':'absent: source physical-material table empty' if not tables['physicalMaterials'] else 'table present; requires relationship inspection'}
    tables={}
    for k,method in [('colors',ct.GetColors),('physicalMaterials',mt.GetMaterialLabels),('visualMaterials',vt.GetMaterials)]:
        s=TDF_LabelSequence();method(s);tables[k]=[{'label':label_entry(l),'name':label_name(l)} for l in seq(s)]
    roots=TDF_LabelSequence();tool.GetFreeShapes(roots);definitions={};occurrences=[]
    def walk(label,path):
        ref=TDF_Label();has=XCAFDoc_ShapeTool.GetReferredShape_s(label,ref);d=ref if has else label
        did='d_'+label_entry(d).replace(':','_');p=path+[label_entry(label)];iid='p_'+'/'.join(p).replace(':','_').replace('/','__')
        if not XCAFDoc_ShapeTool.IsAssembly_s(d):
            definitions[did]=d
            occurrences.append({'id':iid,'definitionId':did,'sourcePath':'/'.join(p),'sourceComponentLabel':label_entry(label),'directColors':colors(label),'shuoColors':colors(XCAFDoc_ShapeTool.GetShape_s(label),True),'material':material(label),'localTransform':matrix(XCAFDoc_ShapeTool.GetLocation_s(label))})
        children=TDF_LabelSequence();XCAFDoc_ShapeTool.GetComponents_s(d,children,False)
        for child in seq(children):walk(child,p)
    for root in seq(roots):walk(root,[])
    assert set(definitions)==set(current)
    assert {x['id'] for x in occurrences}=={x['id'] for v in occurrence_map.values() for x in v}
    results=[]
    for did,label in definitions.items():
        shape=XCAFDoc_ShapeTool.GetShape_s(label);faces=shapes(shape,TopAbs_FACE);solids=shapes(shape,TopAbs_SOLID);shells=shapes(shape,TopAbs_SHELL)
        body_shapes=list(solids);body_kinds=['solid']*len(solids)
        for shell in shells:
            if not any(any(shell.IsSame(s) for s in shapes(solid,TopAbs_SHELL)) for solid in solids):body_shapes.append(shell);body_kinds.append('free-shell')
        if faces and not body_shapes:body_shapes=[shape];body_kinds=['face-bearing-root']
        record={'id':did,'sourceLabel':label_entry(label),'name':label_name(label),'occurrenceIds':[i['id'] for i in occurrence_map[did]],'occurrenceCount':len(occurrence_map[did]),'directColors':colors(label),'material':material(label),'valid':bool(BRepCheck_Analyzer(shape).IsValid()),'boundsLocalMm':bounds(shape),'solids':len(solids),'shells':len(shells),'topologicalVertexOccurrences':len(shapes(shape,TopAbs_VERTEX)),'subshapeLabels':[],'bodies':[],'faces':[],'limitations':[]}
        it=TDF_ChildIterator(label,True)
        while it.More():
            child=it.Value();c=colors(child)
            if c:record['subshapeLabels'].append({'label':label_entry(child),'directColors':c,'material':material(child)})
            it.Next()
        face_bodies=collections.defaultdict(list)
        for n,(body,kind) in enumerate(zip(body_shapes,body_kinds),1):
            fs=shapes(body,TopAbs_FACE);ids=[i for i,f in enumerate(faces,1) if any(f.IsSame(sf) for sf in fs)]
            for i in ids:face_bodies[i].append(n)
            lab=TDF_Label();found=tool.FindSubShape(label,body,lab)
            record['bodies'].append({'id':n,'kind':kind,'label':label_entry(lab) if found else None,'directColors':colors(lab) if found else {},'shapeResolvedColors':colors(body),'colorResolutionNote':'Explicit labeled-body colors only; shapeResolvedColors can alias the definition when no subshape label exists.','faceIds':ids,'boundsLocalMm':bounds(body),'valid':bool(BRepCheck_Analyzer(body).IsValid()),'material':material(lab) if found else {'visualMaterialLabel':None,'physicalMaterialMetadata':'absent at unlabeled body'}})
        BRepMesh_IncrementalMesh(shape,.015,False,.25,True).Perform()
        vertex_count=triangle_count=degenerate_count=0
        groups={}
        for index,f in enumerate(faces,1):
            face=TopoDS.Face_s(f);a=BRepAdaptor_Surface(face);typ=str(a.GetType()).split('.')[-1];props=GProp_GProps();BRepGProp.SurfaceProperties_s(face,props)
            center=props.CentreOfMass();lab=TDF_Label();found=tool.FindSubShape(label,face,lab)
            direct=colors(face);chain=[{'level':'face','colors':direct}]+[{'level':'body','id':i,'colors':record['bodies'][i-1]['directColors']} for i in face_bodies[index]]+[{'level':'definition','colors':record['directColors']}]
            effective=next(({'level':c['level'],'bodyId':c.get('id'),'kind':k,'rgba':c['colors'][k]} for c in chain for k in ['surface','general'] if k in c['colors']),None)
            entry={'id':index,'label':label_entry(lab) if found else None,'bodyIds':face_bodies[index],'surfaceType':typ,'orientation':str(face.Orientation()).split('.')[-1],'directColors':direct,'effectiveSurfaceAppearance':effective,'inheritanceChain':chain,'material':material(lab) if found else {'visualMaterialLabel':None,'physicalMaterialMetadata':'absent at unlabeled face'},'areaMm2':props.Mass(),'centroidLocalMm':[center.X(),center.Y(),center.Z()],'boundsLocalMm':bounds(face),'normalLocal':None,'normalEvaluation':'analytic surface at finite UV-domain midpoint; orientation applied, not asserted to lie in trimmed face','regionClassification':'unclassified: topology alone does not establish visible or mechanical role'}
            try:
                u=(a.FirstUParameter()+a.LastUParameter())/2;v=(a.FirstVParameter()+a.LastVParameter())/2
                p=GeomLProp_SLProps(BRep_Tool.Surface_s(face),u,v,1,1e-9)
                if p.IsNormalDefined():
                    n=p.Normal();sgn=-1 if face.Orientation()==TopAbs_REVERSED else 1;entry['normalLocal']=[sgn*n.X(),sgn*n.Y(),sgn*n.Z()]
                if typ=='GeomAbs_Plane':entry['geometricRoleCandidate']='planar field/underside/recess floor; placement and face boundaries decide'
                elif typ=='GeomAbs_Cylinder':entry['geometricRoleCandidate']='cylindrical wall/bore/pivot/seat; concavity and assembly decide'
                elif typ=='GeomAbs_Cone':entry['geometricRoleCandidate']='conical bevel/countersink/seat; assembly decides'
                else:entry['geometricRoleCandidate']='curved or sculpted surface; requires visual region review'
            except Exception as e:entry['normalFailure']=str(e)
            loc=TopLoc_Location();poly=BRep_Tool.Triangulation_s(face,loc)
            if poly is None:entry.update(vertices=0,triangles=0,missingTriangulation=True,degenerateTriangles=0)
            else:
                p=np.asarray([[q.X(),q.Y(),q.Z()] for q in [poly.Node(i).Transformed(loc.Transformation()) for i in range(1,poly.NbNodes()+1)]])
                t=np.asarray([[tri.Value(i)-1 for i in [1,2,3]] for tri in poly.Triangles()],dtype=int).reshape(-1,3)
                areas=np.linalg.norm(np.cross(p[t[:,1]]-p[t[:,0]],p[t[:,2]]-p[t[:,0]]),axis=1)/2
                deg=int((areas<=1e-14).sum());entry.update(vertices=len(p),triangles=len(t),missingTriangulation=False,degenerateTriangles=deg,vertexStart=vertex_count,tessellatedAreaMm2=float(areas.sum()))
                vertex_count+=len(p);triangle_count+=len(t);degenerate_count+=deg
            key=json.dumps({'directColors':direct,'effective':effective},sort_keys=True);groups.setdefault(key,[]).append(index)
            record['faces'].append(entry)
        record.update(vertices=vertex_count,triangles=triangle_count,degenerateTriangles=degenerate_count,missingTessellationFaceIds=[f['id'] for f in record['faces'] if f['missingTriangulation']],faceAppearanceGroups=[{'id':n,**json.loads(k),'faceIds':ids} for n,(k,ids) in enumerate(groups.items(),1)])
        cache=ROOT/'artifacts/cad/definition-cache/f34148903818-0.015-0.25'/f'{did}.npz'
        if cache.exists():
            with np.load(cache,allow_pickle=False) as c:record['cachedExport']={'file':str(cache.relative_to(ROOT)),'sha256':hashlib.sha256(cache.read_bytes()).hexdigest(),'vertices':len(c['vertices']),'triangles':len(c['faces']),'vertexTriangleCountsMatch':len(c['vertices'])==vertex_count and len(c['faces'])==triangle_count}
        rgba={tuple(f['effectiveSurfaceAppearance']['rgba']) for f in record['faces'] if f['effectiveSurfaceAppearance']}
        record['mixedSourceAppearance']=len(rgba)>1;record['sourceTransparent']=any(c[3]<1 for c in rgba) or any(c[3]<1 for c in record['directColors'].values())
        record['missingSourceAppearanceFaceIds']=[f['id'] for f in record['faces'] if not f['effectiveSurfaceAppearance']]
        if not faces:record['limitations'].append('No original STEP faces; recovered/substituted runtime geometry must be audited separately.')
        if any(f['normalLocal'] is None for f in record['faces']):record['limitations'].append('Some analytic midpoint normals undefined; preserve exact face IDs for local reinspection.')
        results.append(record);(OUT/f'{did}.json').write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
        print(did,record['name'],len(faces),'faces',triangle_count,'triangles',flush=True)
    entities=collections.Counter(re.findall(rb'#[0-9]+\s*=\s*([A-Z][A-Z0-9_]*)\s*\(',raw))
    summary={'sourceSha256':digest,'definitions':len(results),'occurrences':len(occurrences),'bodies':sum(len(d['bodies']) for d in results),'solids':sum(d['solids'] for d in results),'shells':sum(d['shells'] for d in results),'faces':sum(len(d['faces']) for d in results),'triangles':sum(d['triangles'] for d in results),'vertices':sum(d['vertices'] for d in results),'faceAppearanceGroups':sum(len(d['faceAppearanceGroups']) for d in results),'mixedDefinitionIds':[d['id'] for d in results if d['mixedSourceAppearance']],'transparentDefinitionIds':[d['id'] for d in results if d['sourceTransparent']],'multipleBodyDefinitionIds':[d['id'] for d in results if len(d['bodies'])>1],'emptyDefinitionIds':[d['id'] for d in results if not d['faces']],'invalidDefinitionIds':[d['id'] for d in results if not d['valid']],'missingAppearanceDefinitionIds':[d['id'] for d in results if d['missingSourceAppearanceFaceIds']],'occurrenceDirectColorCount':sum(bool(i['directColors']) for i in occurrences),'occurrenceShuoColorCount':sum(bool(i['shuoColors']) for i in occurrences),'materialTableCounts':{k:len(v) for k,v in tables.items()},'degenerateTriangleAreaThresholdMm2':1e-14,'degenerateTriangles':sum(d['degenerateTriangles'] for d in results),'coloredFaceCount':sum(bool(f['directColors']) for d in results for f in d['faces']),'explicitColoredBodyCount':sum(bool(b['directColors']) for d in results for b in d['bodies']),'stepAppearanceEntities':{k.decode():v for k,v in entities.items() if any(s in k for s in [b'MATERIAL',b'COLOUR',b'STYLE',b'SURFACE_SIDE'])}}
    result={'schemaVersion':1,'method':'Fresh original STEP/XCAF import; exhaustive TopExp bodies/faces; source tessellation in memory only at existing .015 mm / .25 rad settings. Effective appearance explicitly chooses face then body then definition surface/general; absence is not gray/steel. Color floats are OCP RGB, alpha retained.','source':str(source.relative_to(ROOT)),'summary':summary,'tables':tables,'definitions':results,'occurrences':occurrences,'limitations':['Body denotes each solid plus free shell, with face-bearing root fallback; shells inside solids are counted separately but are not duplicated as bodies.','Face UV-midpoint normal is representative analytic orientation, not exhaustive normal field or a certified point inside the trimmed face.','Geometric role candidates intentionally leave semantic face roles unclassified for per-part browser/source review.','This extraction supplies source evidence only; source colors do not prove physical material or process.']}
    (OUT/'source-audit.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n');(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    for d in results:
        assert len(d['faces'])==current[d['id']].get('cadFaces',0)
        assert sorted(i for g in d['faceAppearanceGroups'] for i in g['faceIds'])==list(range(1,len(d['faces'])+1))
        assert all(f['bodyIds'] for f in d['faces'])
        assert d.get('cachedExport',{}).get('vertexTriangleCountsMatch',True)
    validation={'definitionCount':len(results),'occurrenceCount':len(occurrences),'faceCount':summary['faces'],'allManifestFaceCountsMatch':True,'allFaceGroupsPartitionFaces':True,'allFacesHaveBodyMembership':True,'allCachedTessellationCountsMatch':True}
    (OUT/'validation.json').write_text(json.dumps(validation,indent=2)+'\n')
    print(json.dumps(summary,indent=2))
if __name__=='__main__':main()
