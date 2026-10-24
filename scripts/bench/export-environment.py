"""Paired atelier; Blender-authored numeric mm, glTF Y up.

Run blender --background --python scripts/bench/export-environment.py [-- --blockout]
Mesh extras: atelierVersion=1, collisionRole=walkable|boundary|decor.
Walkable/boundary triangles ARE their visible colliders. Decor never collides.
No maker CAD is embedded. Materials survive the runtime import unchanged.
"""
import bpy
import json
import math
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
LAYOUT = json.loads((ROOT/'assets/authored/atelier-layout.json').read_text())
BLOCKOUT = '--blockout' in sys.argv
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = .001
collections = {}
for name in ['ENV_WALKABLE', 'ENV_BOUNDARY', 'ENV_DECOR', 'INTERFACE_BRIDGE', 'INTERFACE_DIAL']:
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    collections[name] = c

def material(name, color, roughness, metal=0):
    m = bpy.data.materials.new(name)
    # Authored sRGB palette converted to linear for glTF.
    rgb = [int(color[i:i+2], 16)/255 for i in (0, 2, 4)]
    if BLOCKOUT:
        rgb = [sum(rgb)/3]*3
    rgb = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metal
    return m
walnut = material('Oiled walnut', '684B35', .65)
green = material('Bottle green linoleum', '34584B', .91)
steel = material('Dark steel', '424B4C', .48, .35)

# Small packed albedo maps authored here, with no runtime procedural shader or
# external texture dependency. Graining is subordinate to the source watch.
if not BLOCKOUT:
    from mathutils import Vector, noise
    for mat,kind in [(walnut,'wood'),(green,'linoleum')]:
        image=bpy.data.images.new(kind+' albedo',width=256,height=256)
        base=mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value[:3]
        pixels=[]
        for j in range(256):
            for i in range(256):
                u,v=i/256,j/256
                if kind=='wood':
                    wobble=noise.noise_vector(Vector((u*3,v*2,1)))[0]
                    grain=math.sin(v*190+wobble*4+math.sin(u*9)*.7)
                    value=1+.075*grain+.045*noise.noise(Vector((u*18,v*75,2)))
                else:
                    value=1+.035*noise.noise(Vector((u*100,v*100,3)))
                # Images encode sRGB; material diffuse_color remains linear.
                linear=[min(1,max(0,c*value)) for c in base]
                rgb=[12.92*c if c<=.0031308 else 1.055*c**(1/2.4)-.055 for c in linear]
                pixels.extend((*rgb,1))
        image.pixels.foreach_set(pixels)
        image.pack()
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
        mat.node_tree.links.new(tex.outputs['Color'],mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])

def mesh(name, vertices, faces, mat, role='walkable', group=None):
    # World x,y,z -> Blender x,-z,y; export_yup restores world coordinates.
    data = bpy.data.meshes.new(name)
    data.from_pydata([(x, -z, y) for x,y,z in vertices], [], faces)
    data.update()
    o = bpy.data.objects.new(name, data)
    collections[group or ('ENV_'+role.upper())].objects.link(o)
    o.data.materials.append(mat)
    o['atelierVersion'] = 1
    o['collisionRole'] = role
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    o.select_set(False)
    return o

def prism(name, footprint, top, bottom, mat, role='walkable', group=None):
    n = len(footprint)
    heights = [top(x,z) if callable(top) else top for x,z in footprint]
    v = [(x,bottom,z) for x,z in footprint] + [(x,h,z) for (x,z),h in zip(footprint,heights)]
    f = [tuple(range(n-1,-1,-1)), tuple(range(n,2*n))]
    f += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,v,f,mat,role,group)

def rect(name,x0,x1,z0,z1,top,bottom,mat,role='walkable',group=None):
    return prism(name,[(x0,z0),(x1,z0),(x1,z1),(x0,z1)],top,bottom,mat,role,group)

def terrace(name,x0,x1,z0,z1,top,group=None):
    under = (lambda x,z: top(x,z)-.12) if callable(top) else top-.12
    rect(name+' joinery',x0,x1,z0,z1,under,0,walnut,group=group)
    # Thin visible top, welded to matching support profile without hidden planes.
    footprint=[(x0,z0),(x1,z0),(x1,z1),(x0,z1)]
    heights=[top(x,z) if callable(top) else top for x,z in footprint]
    verts=[(x,h-.12,z) for (x,z),h in zip(footprint,heights)]+[(x,h,z) for (x,z),h in zip(footprint,heights)]
    mesh(name+' linoleum',verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],green,group=group)

# One open worktop replaces the stepped terraces and raised promenade.
# Original holders remain based at Y0 inside actual through-wells.
floor = LAYOUT['worktopHeight']
rect('Desk base',-90,90,-70,70,0,-4,walnut)
worktop = rect('Walnut worktop',-90,90,-70,70,floor-.12,0,walnut)
mat = rect('Green work surface',-89,89,-69,69,floor,floor-.12,green)
for st in LAYOUT['stations']:
    x,z,h=st['x'],st['z'],st['height']
    landing=x-25
    start=landing-(h-floor)*6
    group='INTERFACE_'+st['id'].upper()
    terrace(st['id']+' direct ramp',start,landing,z-3,z+3,
            lambda px,pz,start=start:floor+(px-start)/6,group)
    terrace(st['id']+' landing',landing,x-21.2,z-3,z+3,h,group)
for st in LAYOUT['stations']:
    x,z,h=st['x'],st['z'],st['height']
    end=x+st['end']
    group='INTERFACE_'+st['id'].upper()
    rect(st['id']+' CAD threshold',x-21.2,end-1.2,z-1.4,z+1.4,h,h-.2,steel,group=group)
    # The bridge surface is Y17.3399: a .12mm eased tip permits a return step
    # without lowering the original underside or penetrating reviewed CAD.
    tip=.12 if st['id']=='bridge' else .08
    rect(st['id']+' threshold nose',end-1.2,end,z-1.4,z+1.4,
         lambda px,pz:h-tip*(px-(end-1.2))/1.2,h-.2,steel,group=group)
# Cut the same real holder wells and crown clearances through both layers.
for surface in [worktop, mat]:
    for st in LAYOUT['stations']:
        bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=22.8,depth=40,location=(st['x'],-st['z'],10))
        cutter=bpy.context.object
        bpy.context.view_layer.objects.active=surface
        mod=surface.modifiers.new('Open holder well','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
        cutter=rect('Temporary crown clearance',st['x']+19,st['x']+27,st['z']-5,st['z']+5,30,-1,walnut)
        bpy.context.view_layer.objects.active=surface
        mod=surface.modifiers.new('Crown sector relief','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
    # Boolean cutters must not introduce a second glTF primitive/material.
    original_material = surface.data.materials[0]
    surface.data.materials.clear()
    surface.data.materials.append(original_material)
    for polygon in surface.data.polygons: polygon.material_index = 0
# The ivory background comes from the renderer. No backdrop wall, guards or props.
# Merge within each explicit group/material/role to keep modest draw-call cost.
for collection in collections.values():
    groups={}
    for o in list(collection.objects):
        groups.setdefault((o.data.materials[0].name,o['collisionRole']),[]).append(o)
    for (mat,role),objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        o=bpy.context.object;o.name=collection.name+' '+mat
        o['atelierVersion']=1;o['collisionRole']=role
        o.select_set(False)
# Consistent world projection on horizontal tops and vertical fascia.
for o in bpy.context.scene.objects:
    uv=o.data.uv_layers.new(name='Joinery projection')
    for poly in o.data.polygons:
        normal=poly.normal
        axis=max(range(3),key=lambda k:abs(normal[k]))
        for li in poly.loop_indices:
            co=o.matrix_world @ o.data.vertices[o.data.loops[li].vertex_index].co
            a,b=(co.x,co.y) if axis==2 else ((co.x,co.z) if axis==1 else (co.y,co.z))
            uv.data[li].uv=(a/48,b/24)
output=ROOT/'explorer/public/bench-local';output.mkdir(parents=True,exist_ok=True)
source=ROOT/'assets/generated/bench';source.mkdir(parents=True,exist_ok=True)
bpy.context.scene['atelierLayout']=json.dumps(LAYOUT)
# Editable scale reference only: hidden from render/export, never a runtime avatar.
qa=bpy.data.collections.new('QA_SCALE_REFERENCE_1.65mm')
bpy.context.scene.collection.children.link(qa)
for name,radius,depth,height in [('Body',.17,1.17,.815),('Head',.12,.24,1.53)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=radius,depth=depth,location=(-64,-40,floor+height))
    o=bpy.context.object;o.name='Scale visitor '+name
    for c in list(o.users_collection):c.objects.unlink(o)
    qa.objects.link(o);o.hide_render=True;o.hide_set(True)
    o.data.materials.append(steel)
bpy.ops.wm.save_as_mainfile(filepath=str(source/'environment.blend'))
bpy.ops.export_scene.gltf(filepath=str(output/'environment.glb'),export_format='GLB',export_yup=True,export_extras=True,use_renderable=True)
print('ATELIER', 'blockout' if BLOCKOUT else 'finished', len(bpy.context.scene.objects), 'meshes')
