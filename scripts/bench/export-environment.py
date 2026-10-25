"""Reference-inspired closed tabletop and plain mat in an open background.
Numeric mm, glTF Y up. Run blender --background --python this-file.
Visible walkable triangles are collision triangles; no proxy slabs or hidden ramps.
"""
import bpy
import bmesh
import json
import math
import hashlib
from pathlib import Path
from mathutils import Vector, noise
ROOT = Path(__file__).resolve().parents[2]
SPEC = json.loads((ROOT/'assets/authored/workshop-environment.json').read_text())
LAYOUT = json.loads((ROOT/'assets/authored/atelier-layout.json').read_text())
OUT = ROOT/'assets/generated/bench'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = .001
objects=[]
semantics=[]

def linear(c):
    return c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4

def material(name, color, rough=.7, metal=0, emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    rgb=tuple(linear(int(color[i:i+2],16)/255) for i in (0,2,4))
    m.diffuse_color=(*rgb,1)
    p=m.node_tree.nodes.get('Principled BSDF')
    for key,val in [('Base Color',(*rgb,1)),('Roughness',rough),('Metallic',metal),('Emission Color',(*rgb,1)),('Emission Strength',emission)]:p.inputs[key].default_value=val
    return m
pal=SPEC['palette']
finish=SPEC['surfaceFinish']
oak=material('Oak',pal['oak'],finish['oakRoughness'])
green=material('Matte green',pal['mat'],finish['matRoughness'])
# Packed restrained albedo maps. World-scale UVs; never modify CAD materials.
for mat,kind,size in [(oak,'oak',1024),(green,'mat',256)]:
    img=bpy.data.images.new(kind+' original albedo',width=size,height=size)
    base=mat.diffuse_color[:3];pixels=[]
    for j in range(size):
        for i in range(size):
            u,v=i/size,j/size
            if kind=='oak':
                wobble=noise.noise_vector(Vector((u*2,v*3,1)))[0]
                grain=noise.noise(Vector((u*2.5,v*160+wobble*3,7))) + .45*noise.noise(Vector((u*6,v*550,9)))
                val=1+.10*grain+.025*noise.noise(Vector((u*10,v*210,3)))
            else:val=1+.018*noise.noise(Vector((u*80,v*80,3)))
            rgb=[min(1,max(0,c*val)) for c in base]
            pixels.extend((*[12.92*c if c<=.0031308 else 1.055*c**(1/2.4)-.055 for c in rgb],1))
    img.pixels.foreach_set(pixels);img.pack()
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img
    mat.node_tree.links.new(tex.outputs['Color'],mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])

def world(p):return (p[0],-p[2],p[1])
def mesh(name, verts, faces, mat, role='walkable', bevel=0, smooth=False, uv=None):
    data=bpy.data.meshes.new(name);data.from_pydata([world(v) for v in verts],[],faces);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);data.materials.append(mat)
    o['atelierVersion']=1;o['collisionRole']=role
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
    if bevel:
        mod=o.modifiers.new('Small crafted edge','BEVEL');mod.width=bevel;mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if mat == oak:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
    if smooth:
        for poly in data.polygons:poly.use_smooth=len(poly.vertices)==4
    uvl=data.uv_layers.new(name='Authored projection')
    for poly in data.polygons:
        axis=max(range(3),key=lambda k:abs(poly.normal[k]))
        for li in poly.loop_indices:
            co=data.vertices[data.loops[li].vertex_index].co
            a,b=(co.x,co.y) if axis==2 else ((co.x,co.z) if axis==1 else (co.y,co.z))
            uvl.data[li].uv=uv(data.loops[li].vertex_index) if uv else (a/(finish['grainScaleMm'][0] if mat==oak else 12),b/(finish['grainScaleMm'][1] if mat==oak else 12))
    o.select_set(False);objects.append(o)
    mins=[min(v[k] for v in verts) for k in range(3)];maxs=[max(v[k] for v in verts) for k in range(3)]
    semantics.append({'id':name,'role':role,'material':mat.name,'min':mins,'max':maxs})
    return o

def box(name,x0,x1,z0,z1,top,bottom,mat,role='walkable',bevel=0):
    pts=[(x0,z0),(x1,z0),(x1,z1),(x0,z1)]
    return mesh(name,[(x,bottom,z) for x,z in pts]+[(x,top,z) for x,z in pts],[(3,2,1,0),(4,5,6,7)]+[(i,(i+1)%4,(i+1)%4+4,i+4) for i in range(4)],mat,role,bevel)

def slab(name, outline, top, bottom, mat, bevel=0, role='walkable'):
    n=len(outline)
    return mesh(name,[(x,bottom,z) for x,z in outline]+[(x,top,z) for x,z in outline],
                [tuple(reversed(range(n))),tuple(range(n,2*n))]+
                [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat,role=role,bevel=bevel)

D=SPEC['mainDesk'];M=SPEC['mat'];detail=SPEC['tabletopDetail']
top_object=slab('main-oak-top',D['footprint'],D['topY'],D['bottomY'],oak,detail['edgeBevel'])
box('green-mat',M['minX'],M['maxX'],M['minZ'],M['maxZ'],M['topY'],M['bottomY'],green,bevel=M['edgeBevel'])
# One continuous U-shaped rim: no front fence, overlapping boxes or open ends.
width=detail['rimWidth'];front=detail['rimFrontZ']
x0,x1,z0=D['minX'],D['maxX'],D['minZ']
rim=[(x0,front),(x0,z0),(x1,z0),(x1,front),
     (x1-width,front),(x1-width,z0+width),(x0+width,z0+width),(x0+width,front)]
rim_object=slab('low-back-side-rim',rim,D['topY']+detail['rimHeight'],D['topY']-.5,oak,detail['rimBevel'])
# Join the rim into the slab with a concealed half-mm lap. A true union removes
# internal faces and the underside-bevel crevice visible at miniature eye height.
bpy.context.view_layer.objects.active=top_object
mod=top_object.modifiers.new('Continuous rim to slab joint','BOOLEAN')
mod.operation='UNION';mod.solver='EXACT';mod.object=rim_object
bpy.ops.object.modifier_apply(modifier=mod.name)
objects.remove(rim_object);bpy.data.objects.remove(rim_object,do_unlink=True)
top_object.select_set(True)
bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
top_object.select_set(False)
# Low, solid oak display stand. Same visible triangles carry the visitor.
stand=next(p for p in SPEC['props'] if p['id']=='dial-hand-stand')
x0,x1,z0,z1,c=stand['minX'],stand['maxX'],stand['minZ'],stand['maxZ'],stand['cornerCut']
outline=[(x0+c,z0),(x1-c,z0),(x1,z0+c),(x1,z1-c),
         (x1-c,z1),(x0+c,z1),(x0,z1-c),(x0,z0+c)]
stand_object=slab(stand['id'],outline,stand['topY'],stand['bottomY'],oak,stand['edgeBevel'])
seating=json.loads((ROOT/'assets/authored/bench-parts-layout.json').read_text())['standSeating']
# Genuine through-bores, circumscribed so polygon facets preserve radial clearance.
for hole in seating['holes']:
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=hole['radius']/math.cos(math.pi/64),
        depth=stand['topY']-stand['bottomY']+2,
        location=world((hole['x'],(stand['topY']+stand['bottomY'])/2,hole['z'])))
    cutter=bpy.context.object
    cutter.data.materials.append(oak)
    for layer in list(cutter.data.uv_layers):cutter.data.uv_layers.remove(layer)
    bpy.context.view_layer.objects.active=stand_object
    mod=stand_object.modifiers.new(hole['id'],'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
# Ease only sharp bore mouths by removing wood, never narrowing the fitted bore.
# One 25-micron chamfer keeps the contact plane outside r+0.04 unchanged.
bpy.context.view_layer.objects.active=stand_object
mod=stand_object.modifiers.new('Finished bore mouths','BEVEL')
mod.width=stand['boreBevel'];mod.segments=1
mod.limit_method='ANGLE';mod.angle_limit=math.radians(60)
bpy.ops.object.modifier_apply(modifier=mod.name)
stand_object.select_set(True)
bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
stand_object.select_set(False)
# All new bore walls use the same oak material and participate in its bake.
stand_object.data.materials.clear();stand_object.data.materials.append(oak)
for poly in stand_object.data.polygons:poly.material_index=0
# Reproject the newly cut bore walls before baking; all geometry remains editable.
for obj in [stand_object,top_object]:
    for layer in list(obj.data.uv_layers):
        if layer.name!='Authored projection':obj.data.uv_layers.remove(layer)
    uvl=obj.data.uv_layers.get('Authored projection')
    for poly in obj.data.polygons:
        axis=max(range(3),key=lambda k:abs(poly.normal[k]))
        for li in poly.loop_indices:
            co=obj.data.vertices[obj.data.loops[li].vertex_index].co
            a,b=(co.x,co.y) if axis==2 else ((co.x,co.z) if axis==1 else (co.y,co.z))
            uvl.data[li].uv=(a/finish['grainScaleMm'][0],b/finish['grainScaleMm'][1])

# Area-weighted corner normals keep broad machined faces planar while the small
# bevels catch light. In particular, Boolean rim junctions must not shade like dents.
for obj in [top_object,stand_object]:
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Planar faces and eased edge highlights','WEIGHTED_NORMAL')
    mod.keep_sharp=True;mod.weight=50
    bpy.ops.object.modifier_apply(modifier=mod.name)

# Merge material / collision role. Semantic bounds retained independently for QA.
groups={}
for o in objects:
    mat=o.data.materials[0]
    groups.setdefault((mat.name,o['collisionRole']),[]).append(o)
for (mat,role),parts in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join()
    o=bpy.context.object;o.name='ENV '+role+' '+mat;o['atelierVersion']=1;o['collisionRole']=role
    o['semanticIds']=[s['id'] for s in semantics if s['material']==mat and s['role']==role]
    mod=o.modifiers.new('Explicit collision triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=mod.name)
    bm=bmesh.new();bm.from_mesh(o.data)
    assert all(e.is_manifold for e in bm.edges), 'Open or nonmanifold surface: '+o.name
    bm.free()
    o.select_set(False)
# Bake restrained contact occlusion into opaque albedo atlases. Original UVs
# remain the procedural wood/noise inputs; a second UV set stores the bake.
# This is static environment shading, never a shadow-map/render pass.
bpy.context.scene.render.engine='CYCLES'
bpy.context.scene.cycles.samples=64
bpy.context.scene.render.bake.margin=3
bpy.context.scene.render.bake.use_clear=True
for mat in [oak,green]:
    parts=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials[0]==mat]
    size=1024 if mat==oak else 512
    img=bpy.data.images.new(mat.name+' baked albedo',width=size,height=size)
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    originalUV=nodes.new('ShaderNodeUVMap');originalUV.uv_map='Authored projection'
    for node in list(nodes):
        if node.type=='TEX_IMAGE':links.new(originalUV.outputs['UV'],node.inputs['Vector'])
    for o in parts:
        o.data.uv_layers.new(name='Baked atlas')
        o.data.uv_layers.active_index=o.data.uv_layers.find('Baked atlas')
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.008)
    bpy.ops.object.mode_set(mode='OBJECT')
    target=nodes.new('ShaderNodeTexImage');target.image=img;nodes.active=target
    ao=nodes.new('ShaderNodeAmbientOcclusion');ao.inputs['Distance'].default_value=finish['contactBakeDistanceMm'];ao.samples=64
    soften=nodes.new('ShaderNodeMixRGB');soften.blend_type='MIX';soften.inputs[0].default_value=finish['contactBakeStrength'];soften.inputs[1].default_value=(1,1,1,1);links.new(ao.outputs['Color'],soften.inputs[2])
    mul=nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1
    p=nodes.get('Principled BSDF');base=p.inputs['Base Color']
    if base.is_linked:links.new(base.links[0].from_socket,mul.inputs[1])
    else:mul.inputs[1].default_value=base.default_value
    links.new(soften.outputs[0],mul.inputs[2])
    emit=nodes.new('ShaderNodeEmission');links.new(mul.outputs[0],emit.inputs['Color'])
    output=nodes.get('Material Output');links.new(emit.outputs[0],output.inputs['Surface'])
    bpy.ops.object.bake(type='EMIT')
    img.pack()
    links.new(p.outputs['BSDF'],output.inputs['Surface'])
    uv=nodes.new('ShaderNodeUVMap');uv.uv_map='Baked atlas';links.new(uv.outputs['UV'],target.inputs['Vector'])
    links.new(target.outputs['Color'],base)
    for node in [ao,soften,mul,emit]:nodes.remove(node)
    for o in parts:o.data.uv_layers.active_index=0
    print('BAKED',mat.name,size,flush=True)

counts={'visibleTriangles':0,'collisionTriangles':0,'drawsPerPass':0}
for o in bpy.context.scene.objects:
    n=len(o.data.polygons);counts['visibleTriangles']+=n;counts['drawsPerPass']+=1
    if o['collisionRole']!='decor':counts['collisionTriangles']+=n
counts['textureBytesWithMipmaps']=sum(int(i.size[0]*i.size[1]*4*4/3) for i in {n.image for m in bpy.data.materials if m.use_nodes for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and any(link.from_node==n for link in m.node_tree.links)})
assert counts['visibleTriangles']<=40000 and counts['collisionTriangles']<=8000 and counts['drawsPerPass']<=24 and counts['textureBytesWithMipmaps']<=24*1024**2,counts
# Hidden editable scale witness, omitted from runtime.
bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.17,depth=1.65,location=(D['minX']-10,-54,.825))
reference=bpy.context.object;reference.name='QA_SCALE_REFERENCE_1.65mm';reference.hide_render=True;reference.hide_set(True)
bpy.context.scene['atelierLayout']=json.dumps(LAYOUT)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'environment.blend'))
runtime=ROOT/'explorer/public/bench-local/environment.glb'
bpy.ops.export_scene.gltf(filepath=str(runtime),export_format='GLB',export_yup=True,export_extras=True,use_renderable=True)
counts['downloadBytes']=runtime.stat().st_size;assert counts['downloadBytes']<=8*1024**2
report={'schemaVersion':1,'generator':'scripts/bench/export-environment.py','blender':bpy.app.version_string,'designRevision':3,'stage':SPEC['stage'],'origin':'Original procedural tabletop, rim, mat and oak parts stand; no external models, reference photographs or maker CAD buffers embedded.','license':'Original project contributions under repository MIT; maker CAD remains separately gated.','standBores':seating['holes'],'closedSurfaceAudit':'All slab, rim, mat and bored stand meshes are closed manifold after triangulation.','budgets':counts,'semantics':semantics,'files':[]}
for p in [ROOT/'assets/authored/workshop-environment.json',ROOT/'assets/authored/atelier-layout.json',ROOT/'assets/authored/bench-parts-layout.json',Path(__file__),ROOT/'explorer/src/bench/SurfaceFinish.ts',ROOT/'explorer/src/bench/BenchViewer.ts',OUT/'environment.blend',runtime]:report['files'].append({'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(ROOT/'assets/source-manifest/workshop-environment.json').write_text(json.dumps(report,indent=2)+'\n')
print('WORKSHOP',json.dumps(counts))
