#!/usr/bin/env python3
"""Read-only source appearance/analytic-normal audit; outputs local evidence only.

Run: .venv-cad/bin/python scripts/cad/finish_audit.py
Uses existing XCAF importer, tessellation settings and cache. No assets changed.
"""
from __future__ import annotations
import collections, hashlib, json, re, struct, sys
from pathlib import Path
import numpy as np
import trimesh
from OCP.BRep import BRep_Tool
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.GeomLProp import GeomLProp_SLProps
from OCP.Quantity import Quantity_Color, Quantity_ColorRGBA
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TDF import TDF_Label, TDF_LabelSequence, TDF_ChildIterator
from OCP.TopAbs import TopAbs_FACE, TopAbs_SOLID, TopAbs_REVERSED
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import (XCAFDoc_DocumentTool, XCAFDoc_ShapeTool,
    XCAFDoc_ColorTool, XCAFDoc_ColorGen, XCAFDoc_ColorSurf, XCAFDoc_ColorCurv)

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/preflight'))
from cad_probe import load_xcaf, label_entry, label_name
OUT=ROOT/'artifacts/finishing-cad'
KINDS={'general':XCAFDoc_ColorGen,'surface':XCAFDoc_ColorSurf,'curve':XCAFDoc_ColorCurv}
SELECTED={9,85,86,90,91,99,110,111,113,131,133,136,147,155,156,159,165,169,195,219,222,226,228,230,240,249,251}
SIDECARS=SELECTED

def sequence(seq):
    return [seq.Value(i) for i in range(1,seq.Length()+1)]

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    source=ROOT/'assets/source-originals/ml01-zweigesicht.stp'
    digest=hashlib.sha256(source.read_bytes()).hexdigest()
    assert digest=='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
    raw=source.read_bytes().decode('latin1')
    entities=collections.Counter(re.findall(r'#[0-9]+\s*=\s*([A-Z][A-Z0-9_]*)\s*\(',raw))
    doc,shape_tool=load_xcaf(source)
    color_tool=XCAFDoc_DocumentTool.ColorTool_s(doc.Main())
    mat_tool=XCAFDoc_DocumentTool.MaterialTool_s(doc.Main())
    vis_tool=XCAFDoc_DocumentTool.VisMaterialTool_s(doc.Main())
    def colors(obj,instance=False):
        result={}
        for name,kind in KINDS.items():
            color=Quantity_ColorRGBA()
            found=(color_tool.GetInstanceColor(obj,kind,color) if instance else
                   XCAFDoc_ColorTool.GetColor_s(obj,kind,color) if isinstance(obj,TDF_Label)
                   else color_tool.GetColor(obj,kind,color))
            if found:
                rgb=color.GetRGB()
                result[name]=[rgb.Red(),rgb.Green(),rgb.Blue(),color.Alpha()]
        return result
    roots=TDF_LabelSequence();shape_tool.GetFreeShapes(roots)
    definitions={};instances=[]
    def walk(label,path):
        ref=TDF_Label();has_ref=XCAFDoc_ShapeTool.GetReferredShape_s(label,ref)
        definition=ref if has_ref else label
        entry=label_entry(definition);path=path+[label_entry(label)]
        definitions[entry]=definition
        if has_ref:
            instances.append({'path':'/'.join(path),'componentLabel':label_entry(label),
                'definitionLabel':entry,'name':label_name(label),
                'isAssembly':bool(XCAFDoc_ShapeTool.IsAssembly_s(definition)),
                'directColors':colors(label),
                'shuoColors':colors(XCAFDoc_ShapeTool.GetShape_s(label),True)})
        children=TDF_LabelSequence();XCAFDoc_ShapeTool.GetComponents_s(definition,children,False)
        for child in sequence(children):walk(child,path)
    for root in sequence(roots):walk(root,[])
    tables={}
    for key,method in [('colors',color_tool.GetColors),('physicalMaterials',mat_tool.GetMaterialLabels),('visualMaterials',vis_tool.GetMaterials)]:
        seq=TDF_LabelSequence();method(seq)
        tables[key]=[{'label':label_entry(l),'name':label_name(l),'colors':colors(l)} for l in sequence(seq)]
    records=[];normal_records=[]
    cache=ROOT/'artifacts/cad/definition-cache/f34148903818-0.015-0.25'
    for entry,label in definitions.items():
        did='d_'+entry.replace(':','_');assembly=bool(XCAFDoc_ShapeTool.IsAssembly_s(label))
        record={'id':did,'label':entry,'name':label_name(label),'isAssembly':assembly,'directColors':colors(label),'subshapeLabels':[],'bodies':[],'faces':[]}
        it=TDF_ChildIterator(label,True)
        while it.More():
            child=it.Value();cs=colors(child)
            if cs:record['subshapeLabels'].append({'label':label_entry(child),'colors':cs})
            it.Next()
        if not assembly:
            shape=XCAFDoc_ShapeTool.GetShape_s(label)
            for kind,key in [(TopAbs_SOLID,'bodies'),(TopAbs_FACE,'faces')]:
                exp=TopExp_Explorer(shape,kind);index=0
                while exp.More():
                    sub=exp.Current();index+=1;sub_label=TDF_Label()
                    found=shape_tool.FindSubShape(label,sub,sub_label)
                    info={'index':index,'label':label_entry(sub_label) if found else None,'directColors':colors(sub)}
                    if key=='faces':info['surfaceType']=str(BRepAdaptor_Surface(TopoDS.Face_s(sub)).GetType()).split('.')[-1]
                    record[key].append(info);exp.Next()
            if int(entry.split(':')[-1]) in SELECTED and (cache/f'{did}.npz').exists():
                print('NORMAL AUDIT',did,record['name'],flush=True)
                normal_records.append(audit_normals(shape,did,record,cache/f'{did}.npz'))
        records.append(record)
    all_faces=[f for d in records for f in d['faces']];all_bodies=[b for d in records for b in d['bodies']]
    leaf=[d for d in records if not d['isAssembly']]
    summary={'sourceSha256':digest,'referencedDefinitionsExcludingRoot':len(definitions)-len(sequence(roots)),
        'leafDefinitions':len(leaf),'instanceOccurrences':len(instances),'uniqueComponentLabels':len({i['componentLabel'] for i in instances}),
        'leafInstanceOccurrences':sum(not i['isAssembly'] for i in instances),
        'definitionLabelsWithDirectColor':sum(bool(d['directColors']) for d in records),
        'leafDefinitionLabelsWithDirectColor':sum(bool(d['directColors']) for d in leaf),
        'instanceOccurrencesWithDirectColor':sum(bool(i['directColors']) for i in instances),
        'instanceOccurrencesWithShuoColor':sum(bool(i['shuoColors']) for i in instances),
        'uniqueBodies':len(all_bodies),'bodiesWithDirectColor':sum(bool(b['directColors']) for b in all_bodies),
        'uniqueFaces':len(all_faces),'facesWithDirectColor':sum(bool(f['directColors']) for f in all_faces),
        'coloredSubshapeLabels':sum(len(d['subshapeLabels']) for d in leaf),
        'tableCounts':{k:len(v) for k,v in tables.items()},
        'stepAppearanceEntities':{k:v for k,v in entities.items() if any(x in k for x in ['MATERIAL','COLOUR','STYLE','SURFACE_SIDE'])},
        'readerDefaultMaterialMode':STEPCAFControl_Reader().GetMatMode(),
        'readerDefaultShuoMode':STEPCAFControl_Reader().GetSHUOMode(),
        'surfaceTypes':dict(collections.Counter(f['surfaceType'] for f in all_faces))}
    result={'summary':summary,'tables':tables,'definitions':records,'instances':instances,'normalAudit':normal_records,'glb':audit_glb()}
    (OUT/'audit.json').write_text(json.dumps(result,indent=2)+'\n')
    write_surface_summary(result)
    write_crown_regions()
    print(json.dumps(summary,indent=2))

def write_surface_summary(result):
    definitions={d['id']:d for d in result['definitions']}
    manifest=json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text())
    original={d['id']:d for d in manifest['definitions']}
    compact=[]
    for n in result['normalAudit']:
        d=definitions[n['id']];src=original[n['id']]
        compact.append({'id':d['id'],'name':d['name'],'definitionColors':d['directColors'],
            'faceColorCounts':dict(collections.Counter(json.dumps(f['directColors'],sort_keys=True) for f in d['faces'])),
            'surfaceTypeCounts':dict(collections.Counter(f['surfaceType'] for f in d['faces'])),
            'xyPlanes':[f for f in n['faces'] if abs(f.get('planeNormal',[0,0,0])[2])>.999],
            'cones':[f for f in n['faces'] if f['type']=='GeomAbs_Cone'],
            'sourceCylinders':src.get('cylinders',[]),'boundsLocalMm':src.get('boundsLocalMm')})
    (OUT/'surface-summary.json').write_text(json.dumps(compact,indent=2)+'\n')

def write_crown_regions():
    """Relate real crown/central-plate faces in their installed coordinates."""
    manifest=json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text())
    records=[]
    for number,faces in [(249,[1,2,3,4,5,6,7,8,9,10]),(251,[1,2,3,4,5,22])]:
        did=f'd_0_1_1_{number}'
        instance=next(i for i in manifest['instances'] if i['definitionId']==did)
        packed=np.fromfile(OUT/'sidecars'/f'{did}.bin',dtype='<f4').reshape(-1,10)
        metadata=json.loads((OUT/'sidecars'/f'{did}.json').read_text())
        world=np.asarray(instance['worldTransform'])
        for face_index in faces:
            rows=packed[packed[:,9]==face_index];vertices=rows[:,:3].astype(float)
            placed=vertices@world[:3,:3].T+world[:3,3]
            face=next(f for f in metadata['faces'] if f['index']==face_index)
            radius=np.linalg.norm(vertices[:,:2],axis=1)
            records.append({'definitionId':did,'faceIndex':face_index,'sourceFaceColors':face['directColors'],
                'sourceType':face['type'],'localRadiusRangeMm':[float(radius.min()),float(radius.max())],
                'localZRangeMm':[float(vertices[:,2].min()),float(vertices[:,2].max())],
                'worldZRangeMm':[float(placed[:,2].min()),float(placed[:,2].max())],
                'meanOrientedAnalyticNormalLocal':rows[:,6:9].mean(axis=0).tolist(),
                'meanOrientedAnalyticNormalWorld':(rows[:,6:9].mean(axis=0)@world[:3,:3].T).tolist(),
                'areaMm2':face['areaMm2']})
    (OUT/'crown-regions.json').write_text(json.dumps({'interpretation':
        'Photograph-supported blue-ring candidate: d251 face22 only (source-purple outer 45-degree cone), surrounding d251 steel face1. d249 face2 is the broad steel toothed annulus. Do not recolor the entire central plate or invent an extra ring.',
        'confidence':'High source topology/placements; photographic correspondence is authored interpretation, not physical material measurement.',
        'faces':records},indent=2)+'\n')

def audit_normals(shape,did,record,cache_path):
    with np.load(cache_path,allow_pickle=False) as cache:
        vertices=cache['vertices'];triangles=cache['faces']
    mesh=trimesh.Trimesh(vertices=vertices,faces=triangles,process=False)
    exported=mesh.vertex_normals
    BRepMesh_IncrementalMesh(shape,.015,False,.25,True).Perform()
    offset=0;errors=[];face_records=[];analytic=np.full(vertices.shape,np.nan)
    reconstructed_triangles=[];face_ids=np.zeros(len(vertices),dtype=np.float32)
    exp=TopExp_Explorer(shape,TopAbs_FACE);face_index=0
    max_position_error=0.
    while exp.More():
        face=TopoDS.Face_s(exp.Current());face_index+=1
        loc=TopLoc_Location();poly=BRep_Tool.Triangulation_s(face,loc)
        adaptor=BRepAdaptor_Surface(face)
        f={'index':face_index,'type':str(adaptor.GetType()).split('.')[-1]}
        if poly is not None:
            # UV coordinates correspond exactly to vertices used by the exporter.
            surf=BRep_Tool.Surface_s(face);props=GeomLProp_SLProps(surf,1,1e-9)
            points=[];angles=[]
            for i in range(1,poly.NbNodes()+1):
                p=poly.Node(i).Transformed(loc.Transformation());points.append([p.X(),p.Y(),p.Z()])
                if poly.HasUVNodes():
                    uv=poly.UVNode(i);props.SetParameters(uv.X(),uv.Y())
                    if props.IsNormalDefined():
                        n=props.Normal()
                        # Surface_s(face) already applies the face location.
                        vector=np.array([n.X(),n.Y(),n.Z()])*(-1 if face.Orientation()==TopAbs_REVERSED else 1)
                        j=offset+i-1;analytic[j]=vector
                        angle=float(np.degrees(np.arccos(np.clip(np.dot(vector,exported[j]),-1,1))))
                        angles.append(angle);errors.append(angle)
            p=np.asarray(points);diff=float(np.max(np.abs(p-vertices[offset:offset+len(p)])))
            max_position_error=max(max_position_error,diff)
            inds=np.array([[t.Value(k)-1 for k in (1,2,3)] for t in poly.Triangles()])
            source_inds=inds[:,[0,2,1]] if face.Orientation()==TopAbs_REVERSED else inds
            reconstructed_triangles.extend((source_inds+offset).tolist())
            face_ids[offset:offset+len(p)]=face_index
            tri=p[inds]
            area=float((np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)*.5).sum())
            f.update(vertices=len(p),vertexStart=offset,areaMm2=area,normalErrorsDeg=stats(angles),boundsLocalMm=[p.min(axis=0).tolist(),p.max(axis=0).tolist()],directColors=record['faces'][face_index-1]['directColors'])
            if f['type']=='GeomAbs_Plane':
                n=adaptor.Plane().Axis().Direction();f['planeNormal']=[n.X(),n.Y(),n.Z()]
            if f['type']=='GeomAbs_Cone':
                cone=adaptor.Cone();f['coneSemiAngleDegrees']=float(np.degrees(cone.SemiAngle()))
            offset+=len(p)
        else:f['missingTriangulation']=True
        face_records.append(f);exp.Next()
    assert offset==len(vertices) and max_position_error<1e-10,(did,offset,len(vertices),max_position_error)
    assert np.array_equal(np.asarray(reconstructed_triangles),triangles),did+' triangle ordering mismatch'
    sidecar=None
    if int(did.split('_')[-1]) in SIDECARS:
        folder=OUT/'sidecars';folder.mkdir(exist_ok=True)
        packed=np.column_stack([vertices,exported,analytic,face_ids]).astype('<f4')
        path=folder/f'{did}.bin';path.write_bytes(packed.tobytes())
        keys=collections.defaultdict(list)
        for i,row in enumerate(packed):keys[row[:6].tobytes()].append(i)
        ambiguities=[]
        for ids in keys.values():
            if len(ids)>1 and len({int(face_ids[i]) for i in ids})>1:
                ambiguities.append({'vertexIndices':ids,'faceIndices':sorted({int(face_ids[i]) for i in ids})})
        sidecar={'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'vertexCount':len(vertices),'format':'little-endian float32; stride 10 floats: position xyz, exportedNormal xyz, analyticNormal xyz, one-based source face index',
            'coordinateSystem':'unchanged component-local CAD millimetres',
            'cachedFloat64VerticesSha256':hashlib.sha256(vertices.tobytes()).hexdigest(),
            'cachedInt64TrianglesSha256':hashlib.sha256(triangles.tobytes()).hexdigest(),
            'cachedPositionsAndIndicesExactlyReproduced':True,
            'undefinedAnalyticNormals':int((~np.isfinite(analytic).all(axis=1)).sum()),
            'ambiguousPositionExportNormalKeys':ambiguities,'faces':face_records}
        (folder/f'{did}.json').write_text(json.dumps(sidecar,indent=2)+'\n')
    # At equal-position boundary nodes, compare normals only when analytic CAD
    # normals agree (<0.1 deg). This isolates artificial tangent-boundary seams.
    groups=collections.defaultdict(list)
    for i,p in enumerate(np.round(vertices,7)):groups[tuple(p)].append(i)
    seam_angles=[]
    for indices in groups.values():
        if len(indices)<2:continue
        for a in range(len(indices)):
            for b in range(a+1,len(indices)):
                i,j=indices[a],indices[b]
                if not np.isfinite(analytic[[i,j]]).all():continue
                if np.dot(analytic[i],analytic[j])>np.cos(np.radians(.1)):
                    seam_angles.append(float(np.degrees(np.arccos(np.clip(np.dot(exported[i],exported[j]),-1,1)))))
    valid=(np.linalg.norm(exported,axis=1)>.5)&np.isfinite(analytic).all(axis=1)
    valid_errors=np.degrees(np.arccos(np.clip(np.sum(analytic[valid]*exported[valid],axis=1),-1,1)))
    return {'id':did,'name':record['name'],'vertices':len(vertices),'triangles':len(triangles),'cachedVertexMatchMaxMm':max_position_error,
        'zeroExportNormals':int((np.linalg.norm(exported,axis=1)<.5).sum()),'nonzeroAnalyticVsExportNormalDegrees':stats(valid_errors.tolist()),
        'cachedTriangleIndicesExactlyMatch':True,'sidecar':None if sidecar is None else {k:v for k,v in sidecar.items() if k not in ['faces','ambiguousPositionExportNormalKeys']},
        'analyticVsExportNormalDegrees':stats(errors),'tangentBoundaryExportNormalMismatchDegrees':stats(seam_angles),'faces':face_records}

def stats(values):
    if not values:return {'count':0}
    a=np.asarray(values)
    return {'count':len(a),'median':float(np.median(a)),'p95':float(np.percentile(a,95)),'max':float(a.max()),'over5Degrees':int((a>5).sum()),'over15Degrees':int((a>15).sum())}

def audit_glb():
    result={};sidecar_checks=[]
    for name in ['zweigesicht.glb','zweigesicht-movement.glb']:
        path=ROOT/'assets/generated'/name;raw=path.read_bytes();size=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+size])
        primitives=[p for m in doc['meshes'] for p in m['primitives']]
        if name=='zweigesicht.glb':
            binary=raw[28+size:]
            def vec3(index):
                a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
                return np.frombuffer(binary,dtype='<f4',count=a['count']*3,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,3)
            for mesh in doc['meshes']:
                sidecar=OUT/'sidecars'/f"{mesh['name']}.bin"
                if sidecar.exists():
                    packed=np.fromfile(sidecar,dtype='<f4').reshape(-1,10);a=mesh['primitives'][0]['attributes']
                    check={'id':mesh['name'],'positionFloat32Exact':bool(np.array_equal(vec3(a['POSITION']),packed[:,:3])),
                        'normalFloat32Exact':bool(np.array_equal(vec3(a['NORMAL']),packed[:,3:6]))}
                    assert check['positionFloat32Exact'] and check['normalFloat32Exact'],check
                    sidecar_checks.append(check)
        result[name]={'sha256':hashlib.sha256(raw).hexdigest(),'meshes':len(doc['meshes']),'materials':len(doc['materials']),
            'primitiveCount':len(primitives),'attributes':dict(collections.Counter(k for p in primitives for k in p['attributes'])),
            'materialValues':dict(collections.Counter(json.dumps(m.get('pbrMetallicRoughness'),sort_keys=True) for m in doc['materials'])),
            'materialExtensions':sorted({k for m in doc['materials'] for k in m.get('extensions',{})}),
            'images':len(doc.get('images',[])),'textures':len(doc.get('textures',[]))}
    (OUT/'sidecar-glb-validation.json').write_text(json.dumps(sidecar_checks,indent=2)+'\n')
    return result

if __name__=='__main__':main()
