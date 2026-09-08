#!/usr/bin/env python3
"""Prune non-movement CAD geometry from the full GLB without altering stable IDs."""
import json, struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def extract(source,target,root_name='p_0_1_1_1__0_1_1_1_4'):
    raw=source.read_bytes();jlen=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+jlen]);blob=raw[28+jlen:]
    start=next(i for i,n in enumerate(doc['nodes']) if n['name']==root_name)
    keep=set()
    def visit(index):
        keep.add(index)
        for child in doc['nodes'][index].get('children',[]):visit(child)
    visit(start)
    # Retain every ancestor so all original local matrices are preserved.
    pending=start
    while True:
        parent=next((i for i,n in enumerate(doc['nodes']) if pending in n.get('children',[])),None)
        if parent is None:break
        keep.add(parent);pending=parent
    nodeids=sorted(keep);nodemap={old:new for new,old in enumerate(nodeids)}
    meshids=sorted({doc['nodes'][i]['mesh'] for i in nodeids if 'mesh' in doc['nodes'][i]});meshmap={old:new for new,old in enumerate(meshids)}
    meshes=[doc['meshes'][i] for i in meshids]
    materialids=sorted({p['material'] for m in meshes for p in m['primitives']});materialmap={old:new for new,old in enumerate(materialids)}
    accessorids=sorted({a for m in meshes for p in m['primitives'] for a in [p['indices'],*p['attributes'].values()]});accessormap={old:new for new,old in enumerate(accessorids)}
    viewids=sorted({doc['accessors'][i]['bufferView'] for i in accessorids});viewmap={old:new for new,old in enumerate(viewids)}
    data=bytearray();views=[]
    for i in viewids:
        old=doc['bufferViews'][i];view=old.copy();offset=old.get('byteOffset',0)
        data.extend(b'\0'*((-len(data))%4));view['byteOffset']=len(data);data.extend(blob[offset:offset+old['byteLength']]);views.append(view)
    for m in meshes:
        for p in m['primitives']:
            p['indices']=accessormap[p['indices']];p['attributes']={k:accessormap[v] for k,v in p['attributes'].items()};p['material']=materialmap[p['material']]
    nodes=[]
    for i in nodeids:
        n=doc['nodes'][i]
        if 'mesh' in n:n['mesh']=meshmap[n['mesh']]
        if 'children' in n:n['children']=[nodemap[c] for c in n['children'] if c in keep]
        nodes.append(n)
    accessors=[doc['accessors'][i] for i in accessorids]
    for a in accessors:a['bufferView']=viewmap[a['bufferView']]
    doc.update(nodes=nodes,meshes=meshes,materials=[doc['materials'][i] for i in materialids],accessors=accessors,bufferViews=views,buffers=[{'byteLength':len(data)}],scenes=[{'nodes':[nodemap[pending]]}])
    doc['asset']['extras']['subset']='movement only, complete selected subtree'
    encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4);data.extend(b'\0'*((-len(data))%4))
    target.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(encoded)+len(data))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(data),b'BIN\0')+data)
    result={'asset':str(target.relative_to(ROOT)),'bytes':target.stat().st_size,'nodes':len(nodes),'leafInstances':sum('mesh' in n for n in nodes),'uniqueGeometries':len(meshes),'triangles':sum(doc['accessors'][m['primitives'][0]['indices']]['count']//3 for m in meshes)}
    print(json.dumps(result,indent=2));return result
if __name__=='__main__':
    result=extract(ROOT/'assets/generated/zweigesicht.glb',ROOT/'assets/generated/zweigesicht-movement.glb')
    (ROOT/'artifacts/cad/movement-asset.json').write_text(json.dumps(result,indent=2)+'\n')
