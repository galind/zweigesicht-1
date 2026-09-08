#!/usr/bin/env python3
"""Independent binary/accessor/placement audit of exported full and movement GLBs."""
import json,struct,hashlib
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text());byid={i['id']:i for i in manifest['instances']}
results=[]
for filename in ['zweigesicht.glb','zweigesicht-movement.glb']:
    path=ROOT/'assets/generated'/filename;raw=path.read_bytes();magic,version,length=struct.unpack_from('<4sII',raw)
    assert magic==b'glTF' and version==2 and length==len(raw)
    jlen,jtype=struct.unpack_from('<I4s',raw,12);assert jtype==b'JSON'
    doc=json.loads(raw[20:20+jlen]);blen,btype=struct.unpack_from('<I4s',raw,20+jlen);assert btype==b'BIN\0';binary=raw[28+jlen:];assert blen==len(binary)
    assert len(set(n['name'] for n in doc['nodes']))==len(doc['nodes'])
    def array(index):
        a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];dtype={5126:'<f4',5125:'<u4'}[a['componentType']];width={'VEC3':3,'SCALAR':1}[a['type']]
        count=a['count']*width;start=v.get('byteOffset',0)+a.get('byteOffset',0)
        assert start+count*np.dtype(dtype).itemsize<=len(binary)
        return np.frombuffer(binary,dtype=dtype,count=count,offset=start).reshape((-1,width))
    worldbounds=[];max_transform=0.;max_bounds=0.;max_normal=0.;triangles=0;leafids=[]
    def walk(index,parent):
        global max_transform,max_bounds,max_normal,triangles
        node=doc['nodes'][index];local=np.asarray(node['matrix']).reshape(4,4).T;world=parent@local
        expected=byid[node['name']];max_transform=max(max_transform,float(np.max(abs(world-np.asarray(expected['worldTransform'])))))
        assert np.isfinite(world).all() and abs(np.linalg.det(world[:3,:3])-1)<1e-8
        if 'mesh' in node:
            leafids.append(node['name']);prim=doc['meshes'][node['mesh']]['primitives'][0]
            positions=array(prim['attributes']['POSITION']);normals=array(prim['attributes']['NORMAL']);indices=array(prim['indices'])
            assert np.isfinite(positions).all() and np.isfinite(normals).all() and indices.max()<len(positions)
            assert len(indices)%3==0;triangles+=len(indices)//3
            lengths=np.linalg.norm(normals,axis=1);nonzero=lengths>0
            max_normal=max(max_normal,float(np.max(abs(lengths[nonzero]-1))))
            wp=positions@world[:3,:3].T+world[:3,3];bounds=np.array([wp.min(axis=0),wp.max(axis=0)]);worldbounds.extend(bounds.tolist())
            max_bounds=max(max_bounds,float(np.max(abs(bounds-np.asarray(expected['boundsWorldMm'])))))
        for child in node.get('children',[]):walk(child,world)
    for root in doc['scenes'][doc['scene']]['nodes']:walk(root,np.eye(4))
    assert max_transform<1e-8 and max_bounds<1e-3 and max_normal<1e-5
    if filename=='zweigesicht.glb':assert set(leafids)=={i['id'] for i in manifest['instances'] if not i['isAssembly'] and i.get('triangles',0)>0}
    result={'file':filename,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'nodes':len(doc['nodes']),'meshes':len(doc['meshes']),'leafInstances':len(leafids),'instancedTriangles':triangles,'maximumWorldTransformError':max_transform,'maximumWorldBoundsFloat32ErrorMm':max_bounds,'maximumNonzeroNormalLengthError':max_normal,'boundsWorldMm':[np.min(worldbounds,axis=0).tolist(),np.max(worldbounds,axis=0).tolist()],'status':'pass'}
    results.append(result)
(ROOT/'artifacts/cad/asset-validation.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(results,indent=2))
