#!/usr/bin/env python3
"""Reproduce the complete local-only STEP assembly GLB and geometric audit.

Run with .venv-cad/bin/python scripts/cad/export_assembly.py. Source axes and mm
are intentionally retained; viewer normalization belongs to one scene root.
No source/derived CAD in this pipeline is authorized for redistribution.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, sys, time
from pathlib import Path
import numpy as np
import trimesh
from OCP.Bnd import Bnd_Box
from OCP.BRep import BRep_Tool
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepBndLib import BRepBndLib
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.GeomAbs import GeomAbs_Cylinder
from OCP.Quantity import Quantity_Color
from OCP.TDF import TDF_Label, TDF_LabelSequence
from OCP.TopAbs import TopAbs_FACE, TopAbs_REVERSED
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_ShapeTool, XCAFDoc_ColorTool, XCAFDoc_ColorGen, XCAFDoc_ColorSurf
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'scripts/preflight'))
from cad_probe import load_xcaf, label_entry, label_name, matrix


def stable(path, prefix='p_'):
    return prefix + path.replace(':', '_').replace('/', '__')


BOUND_FALLBACKS=[]

def bbox(shape):
    box = Bnd_Box()
    try:
        BRepBndLib.AddOptimal_s(shape, box, False, False)
    except Exception as error:
        print(f'BOUNDING_FALLBACK: {error}', flush=True)
        BOUND_FALLBACKS.append(str(error))
        box = Bnd_Box()
        BRepBndLib.Add_s(shape, box, False)
    if box.IsVoid():
        return None
    v = box.Get()
    bounds=np.array([v[:3], v[3:]])
    if not np.isfinite(bounds).all() or np.max(np.abs(bounds))>1e6:
        BOUND_FALLBACKS.append('Open Cascade returned an unbounded source box; no valid bounds comparison available.')
        return None
    return bounds


def tessellate(shape, linear, angular):
    mesher = BRepMesh_IncrementalMesh(shape, linear, False, angular, True)
    mesher.Perform()
    if not mesher.IsDone():
        raise RuntimeError('Open Cascade tessellation failed')
    vertices, faces, cylinders = [], [], []
    face_count, missing = 0, 0
    exp = TopExp_Explorer(shape, TopAbs_FACE)
    while exp.More():
        face = TopoDS.Face_s(exp.Current())
        face_count += 1
        loc = TopLoc_Location()
        poly = BRep_Tool.Triangulation_s(face, loc)
        if poly is None:
            missing += 1
        else:
            offset = len(vertices)
            transform = loc.Transformation()
            for i in range(1, poly.NbNodes()+1):
                p = poly.Node(i).Transformed(transform)
                vertices.append([p.X(), p.Y(), p.Z()])
            reverse = face.Orientation() == TopAbs_REVERSED
            for t in poly.Triangles():
                a,b,c = (t.Value(i)+offset-1 for i in (1,2,3))
                faces.append([a,c,b] if reverse else [a,b,c])
        adaptor = BRepAdaptor_Surface(face)
        if adaptor.GetType() == GeomAbs_Cylinder:
            cyl = adaptor.Cylinder()
            p,d = cyl.Location(), cyl.Axis().Direction()
            cylinders.append({'originLocalMm':[p.X(),p.Y(),p.Z()], 'axisLocal':[d.X(),d.Y(),d.Z()], 'radiusMm':cyl.Radius()})
        exp.Next()
    mesh = trimesh.Trimesh(vertices=np.asarray(vertices).reshape((-1,3)), faces=np.asarray(faces,dtype=np.int64).reshape((-1,3)), process=False)
    # Vertices remain separate across CAD faces: smooth curved faces, crisp edges.
    return mesh, face_count, missing, cylinders


class Glb:
    def __init__(self):
        self.data = bytearray()
        self.doc = {'asset':{'version':'2.0','generator':'Zweigesicht XCAF exporter v1', 'extras':{'units':'mm','localOnly':True}}, 'scene':0,'scenes':[{'nodes':[]}], 'nodes':[], 'meshes':[], 'materials':[], 'accessors':[], 'bufferViews':[]}
    def accessor(self, values, component, kind, target):
        arr = np.ascontiguousarray(values)
        while len(self.data)%4: self.data.append(0)
        view = len(self.doc['bufferViews'])
        self.doc['bufferViews'].append({'buffer':0,'byteOffset':len(self.data),'byteLength':arr.nbytes,'target':target})
        self.data.extend(arr.tobytes())
        entry = {'bufferView':view,'componentType':component,'count':len(arr),'type':kind}
        if kind == 'VEC3': entry.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
        self.doc['accessors'].append(entry)
        return len(self.doc['accessors'])-1
    def mesh(self, key, mesh, color):
        mat = len(self.doc['materials'])
        self.doc['materials'].append({'name':key,'pbrMetallicRoughness':{'baseColorFactor':color+[1], 'metallicFactor':0.65, 'roughnessFactor':0.32},'doubleSided':False})
        attributes = {'POSITION':self.accessor(mesh.vertices.astype('<f4'),5126,'VEC3',34962), 'NORMAL':self.accessor(mesh.vertex_normals.astype('<f4'),5126,'VEC3',34962)}
        inds = self.accessor(mesh.faces.astype('<u4').ravel(),5125,'SCALAR',34963)
        self.doc['meshes'].append({'name':key,'primitives':[{'attributes':attributes,'indices':inds,'material':mat}]})
        return len(self.doc['meshes'])-1
    def write(self, path):
        self.doc['buffers']=[{'byteLength':len(self.data)}]
        data = json.dumps(self.doc,separators=(',',':'),allow_nan=False).encode()
        data += b' '*((-len(data))%4)
        self.data.extend(b'\0'*((-len(self.data))%4))
        total=12+8+len(data)+8+len(self.data)
        path.write_bytes(struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(data),b'JSON')+data+struct.pack('<I4s',len(self.data),b'BIN\0')+self.data)


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--source',type=Path,default=ROOT/'assets/source-originals/ml01-zweigesicht.stp')
    ap.add_argument('--output',type=Path,default=ROOT/'assets/generated')
    ap.add_argument('--audit',type=Path,default=ROOT/'artifacts/cad')
    ap.add_argument('--subset',choices=['full','movement'],default='full')
    ap.add_argument('--linear-deflection',type=float,default=0.015)
    ap.add_argument('--angular-deflection',type=float,default=0.25)
    args=ap.parse_args(); started=time.monotonic()
    args.output.mkdir(parents=True,exist_ok=True);args.audit.mkdir(parents=True,exist_ok=True)
    digest=hashlib.sha256(args.source.read_bytes()).hexdigest()
    expected='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
    if digest != expected: raise RuntimeError('Source hash mismatch; explicitly review source before conversion')
    document,tool=load_xcaf(args.source)
    roots=TDF_LabelSequence();tool.GetFreeShapes(roots)
    glb=Glb(); instances=[]; definitions={}; meshes={}; node_indices={}; exceptions=[]
    world_points=[]; max_world_error=0.; reference=json.loads((ROOT/'artifacts/preflight/assembly-inventory.json').read_text())
    previous={i['instance_id']:i for i in reference['instances'] if args.subset=='full' or i['instance_id'].startswith('0:1:1:1/0:1:1:1:4')}
    root_ids=[]
    def walk(label,parent_id,parent_world,path,is_root=False):
        nonlocal max_world_error
        local=np.asarray(matrix(XCAFDoc_ShapeTool.GetLocation_s(label)))
        world=parent_world@local
        ref=TDF_Label();is_ref=XCAFDoc_ShapeTool.GetReferredShape_s(label,ref)
        definition=ref if is_ref else label
        source_id='/'.join(path+[label_entry(label)])
        key=stable(source_id);defid=stable(label_entry(definition),'d_')
        is_assembly=bool(XCAFDoc_ShapeTool.IsAssembly_s(definition))
        name=label_name(label) or label_name(definition) or key
        if source_id in previous:
            max_world_error=max(max_world_error,float(np.max(np.abs(world-np.asarray(previous[source_id]['world_transform'])))))
        record={'id':key,'sourceInstanceId':source_id,'name':name,'parentId':parent_id,'definitionId':defid,'isAssembly':is_assembly,'localTransform':local.tolist(),'worldTransform':world.tolist(),'boundsWorldMm':None}
        node={'name':key,'matrix':local.T.ravel().tolist(),'extras':{'partId':key,'sourceName':name,'definitionId':defid,'isAssembly':is_assembly}}
        if defid not in definitions:
            d={'id':defid,'sourceLabel':label_entry(definition),'name':label_name(definition),'isAssembly':is_assembly}
            definitions[defid]=d
            if not is_assembly:
                cache_dir=args.audit/'definition-cache'/f'{digest[:12]}-{args.linear_deflection}-{args.angular_deflection}'
                cache_dir.mkdir(parents=True,exist_ok=True)
                cache_path=cache_dir/f'{defid}.npz'
                if cache_path.exists():
                    with np.load(cache_path,allow_pickle=False) as cached:
                        mesh=trimesh.Trimesh(vertices=cached['vertices'],faces=cached['faces'],process=False)
                        d.update(json.loads(str(cached['record'])))
                        exceptions.extend(json.loads(str(cached['exceptions'])))
                    if d.get('boundsDifferenceMm') is not None and d['boundsDifferenceMm']>1e6:
                        d['boundsDifferenceMm']=None;d['brepBoundsLocalMm']=None
                        exceptions.append({'definitionId':defid,'name':name,'issue':'unbounded-source-bounds','classification':'unresolved','detail':'Open Cascade fallback returned +/-1e100; excluded from source bounds comparison.'})
                    meshes[defid]=mesh
                    if len(mesh.faces):d['meshIndex']=glb.mesh(defid,mesh,d['sourceColorRgb'] or [.63,.65,.67])
                    print(f'CACHED {defid} {name}',flush=True)
                else:
                    exceptions_before=len(exceptions)
                    shape=XCAFDoc_ShapeTool.GetShape_s(definition)
                    print(f'BEGIN {defid} {name}',flush=True)
                    try:
                        before_bounds=len(BOUND_FALLBACKS)
                        brep_bounds=bbox(shape)
                        if len(BOUND_FALLBACKS)>before_bounds:
                            exceptions.append({'definitionId':defid,'name':name,'issue':'optimal-source-bounds-fallback','classification':'automatically-recoverable','detail':BOUND_FALLBACKS[-1]+'; used conservative BRepBndLib.Add without triangulation.'})
                    except Exception as error:
                        brep_bounds=None
                        exceptions.append({'definitionId':defid,'name':name,'issue':'source-bounds-failed','classification':'unresolved','detail':str(error)})
                    mesh,nfaces,missing,cylinders=tessellate(shape,args.linear_deflection,args.angular_deflection)
                    if not len(mesh.faces):
                        exceptions.append({'definitionId':defid,'name':name,'issue':'empty-source-tessellation','classification':'unresolved','detail':'No renderable triangles recovered; named node retained without substitute geometry.'})
                    try:
                        valid=bool(BRepCheck_Analyzer(shape).IsValid())
                    except Exception as error:
                        valid=False
                        exceptions.append({'definitionId':defid,'name':name,'issue':'source-validity-exception','classification':'unresolved','detail':str(error)})
                    finite=bool(np.isfinite(mesh.vertices).all())
                    if not finite: raise RuntimeError(f'Nonfinite geometry {defid}')
                    degenerates=int(np.count_nonzero(mesh.area_faces<1e-14)) if len(mesh.faces) else 0
                    color=Quantity_Color();has_color=False
                    for color_type in (XCAFDoc_ColorSurf,XCAFDoc_ColorGen):
                        if XCAFDoc_ColorTool.GetColor_s(definition,color_type,color):has_color=True;break
                    rgb=[color.Red(),color.Green(),color.Blue()] if has_color else [.63,.65,.67]
                    d.update(triangles=len(mesh.faces),vertices=len(mesh.vertices),cadFaces=nfaces,missingTriangulatedFaces=missing,brepValid=valid,degenerateTriangles=degenerates,boundsLocalMm=mesh.bounds.tolist() if len(mesh.faces) else None,brepBoundsLocalMm=brep_bounds.tolist() if brep_bounds is not None else None,sourceColorRgb=rgb if has_color else None,cylinders=cylinders,boundsDifferenceMm=float(np.max(np.abs(mesh.bounds-brep_bounds))) if brep_bounds is not None and len(mesh.faces) else None)
                    for issue,condition in [('invalid-source-brep',not valid),('missing-triangulated-faces',missing>0),('degenerate-triangles',degenerates>0)]:
                        if condition:exceptions.append({'definitionId':defid,'name':name,'issue':issue,'classification':'unresolved','detail':d.get('missingTriangulatedFaces') if 'missing' in issue else degenerates if 'degenerate' in issue else 'Open Cascade BRepCheck reports invalid imported source shape; geometry retained without silent repair.'})
                    if d.get('boundsDifferenceMm') is not None and d['boundsDifferenceMm']>1e6:
                        d['boundsDifferenceMm']=None;d['brepBoundsLocalMm']=None
                        exceptions.append({'definitionId':defid,'name':name,'issue':'unbounded-source-bounds','classification':'unresolved','detail':'Open Cascade fallback returned +/-1e100; excluded from source bounds comparison.'})
                    meshes[defid]=mesh
                    if len(mesh.faces):d['meshIndex']=glb.mesh(defid,mesh,rgb)
                    print(f'{len(meshes):03d} {name}: {len(mesh.faces)} triangles',flush=True)
                    np.savez_compressed(cache_path,vertices=mesh.vertices,faces=mesh.faces,record=json.dumps(d),exceptions=json.dumps(exceptions[exceptions_before:]))
        if not is_assembly:
            mesh=meshes[defid]
            record['triangles']=len(mesh.faces)
            if len(mesh.faces):
                transformed=trimesh.transform_points(mesh.vertices,world)
                bounds=np.array([transformed.min(axis=0),transformed.max(axis=0)])
                record['boundsWorldMm']=bounds.tolist()
                world_points.extend(bounds.tolist());node['mesh']=definitions[defid]['meshIndex']
        index=len(glb.doc['nodes']);node_indices[key]=index;glb.doc['nodes'].append(node);instances.append(record)
        if parent_id:glb.doc['nodes'][node_indices[parent_id]].setdefault('children',[]).append(index)
        else:glb.doc['scenes'][0]['nodes'].append(index);root_ids.append(key)
        if len(instances)%25==0:
            glb.write(args.output/'checkpoint.glb')
            (args.output/'checkpoint-manifest.json').write_text(json.dumps({'schemaVersion':1,'partial':True,'instances':instances,'definitions':list(definitions.values()),'exceptions':exceptions},indent=2)+'\n')
        if is_assembly:
            children=TDF_LabelSequence();XCAFDoc_ShapeTool.GetComponents_s(definition,children,False)
            for i in range(1,children.Length()+1):
                child=children.Value(i)
                if args.subset=='movement' and parent_id is None and label_entry(child)!='0:1:1:1:4':continue
                walk(child,key,world,path+[label_entry(label)])
    for i in range(1,roots.Length()+1):walk(roots.Value(i),None,np.eye(4),[] ,True)
    # Aggregate assembly bounds from descendants, preserving own immutable placement.
    byid={i['id']:i for i in instances}
    for i in reversed(instances):
        if i['parentId'] and i['boundsWorldMm'] is not None:
            parent=byid[i['parentId']];b=np.asarray(i['boundsWorldMm'])
            if parent['boundsWorldMm'] is not None:b=np.vstack((b,parent['boundsWorldMm']))
            parent['boundsWorldMm']=[b.min(axis=0).tolist(),b.max(axis=0).tolist()]
    transforms=np.asarray([i['worldTransform'] for i in instances]);det=np.linalg.det(transforms[:,:3,:3])
    bounds=np.array([np.min(world_points,axis=0),np.max(world_points,axis=0)])
    glb.write(args.output/'zweigesicht.glb')
    source_bounds=bbox(tool.GetOneShape()) if args.subset=='full' else bounds.copy()
    leaf_instances=[i for i in instances if not i['isAssembly']]
    summary={'hierarchyInstancesExcludingRoot':len(instances)-roots.Length(),'assemblyInstancesExcludingRoot':sum(i['isAssembly'] for i in instances)-roots.Length(),'leafInstances':len(leaf_instances),'uniqueLeafDefinitions':len(meshes),'renderedLeafInstances':sum(i['triangles']>0 for i in leaf_instances),'renderedLeafDefinitions':sum(len(m.faces)>0 for m in meshes.values()),'uniqueDefinitionsExcludingRoot':len(definitions)-roots.Length(),'uniqueTriangles':sum(len(m.faces) for m in meshes.values()),'instancedTriangles':sum(i['triangles'] for i in leaf_instances),'boundsWorldMm':bounds.tolist(),'extentsMm':(bounds[1]-bounds[0]).tolist(),'sourceBrepBoundsWorldMm':source_bounds.tolist() if source_bounds is not None and args.subset=='full' else None,'sourceBoundsComparisonAvailable':args.subset=='full' and source_bounds is not None,'sourceBoundsDifferenceMm':float(np.max(np.abs(bounds-source_bounds))) if args.subset=='full' and source_bounds is not None else None,'sourceDefinitionBoundsComparisons':sum(d.get('boundsDifferenceMm') is not None for d in definitions.values()),'maximumValidDefinitionBoundsDifferenceMm':max((d['boundsDifferenceMm'] for d in definitions.values() if d.get('boundsDifferenceMm') is not None),default=None),'finiteTransforms':bool(np.isfinite(transforms).all()),'minimumDeterminant':float(det.min()),'maximumDeterminant':float(det.max()),'maxPreflightWorldTransformDifference':max_world_error,'sourceInstanceSetMatchesPreflight':set(previous)=={i['sourceInstanceId'] for i in instances if i['parentId']},'allInstanceIdsUnique':len(byid)==len(instances),'exceptions':len(exceptions)}
    assert summary['finiteTransforms'] and summary['allInstanceIdsUnique'] and summary['sourceInstanceSetMatchesPreflight']
    assert np.max(abs(det-1))<1e-8 and max_world_error<1e-8
    glbpath=args.output/'zweigesicht.glb';glb.write(glbpath)
    summary.update(glbBytes=glbpath.stat().st_size,glbSha256=hashlib.sha256(glbpath.read_bytes()).hexdigest(),conversionSeconds=round(time.monotonic()-started,2))
    manifest={'schemaVersion':1,'subset':args.subset,'source':{'path':str(args.source.relative_to(ROOT)),'sha256':digest},'coordinateSystem':{'units':'mm','axes':'unchanged STEP X/Y/Z, right-handed','matrices':'row-major nested 4x4; column-vector convention; world = parentWorld @ local','normalization':'none; apply once at viewer root'},'rootIds':root_ids,'asset':'zweigesicht.glb','tessellation':{'linearDeflectionMm':args.linear_deflection,'angularDeflectionRadians':args.angular_deflection,'relativeDeflection':False},'summary':summary,'instances':instances,'definitions':list(definitions.values()),'exceptions':exceptions}
    (args.output/'assembly-manifest.json').write_text(json.dumps(manifest,indent=2,allow_nan=False)+'\n')
    (args.audit/'geometry-audit.json').write_text(json.dumps(summary,indent=2,allow_nan=False)+'\n')
    print(json.dumps(summary,indent=2),flush=True)

if __name__=='__main__':main()
