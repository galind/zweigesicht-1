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
for name in ['ENV_WALKABLE']:
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

# One solid wooden desk and one thin mat. Original holder bases remain at Y0.
# No cuts, interfaces or geometry above the mat; source openings stay open.
floor = LAYOUT['worktopHeight']
bounds = LAYOUT['deskBounds']
x0,x1,z0,z1 = [bounds[k] for k in ['minX','maxX','minZ','maxZ']]
rect('Wooden desk',x0,x1,z0,z1,floor-.12,floor-4,walnut)
rect('Green mat',x0+1,x1-1,z0+1,z1-1,floor,floor-.12,green)
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
