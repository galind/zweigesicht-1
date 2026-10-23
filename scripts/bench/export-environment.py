"""Blender editable source for the authored bench and access fixtures; numeric units mm.
Run: blender --background --python scripts/bench/export-environment.py
Maker geometry is deliberately not imported into this authored scene.
"""
import bpy
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system='METRIC'
bpy.context.scene.unit_settings.scale_length=.001

def box(name, size, location):
 bpy.ops.mesh.primitive_cube_add(size=1, location=location)
 o=bpy.context.object;o.name=name;o.scale=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return o
box('bench',(180,3,140),(0,-2.1,0))
box('mat',(160,1.2,120),(0,-.6,0))
# Blender Z is the exported glTF Y. Model here using (world x, -world z, world y).
for o in list(bpy.context.scene.objects):
 x,y,z=o.location;o.location=(x,-z,y)
 sx,sy,sz=o.dimensions;o.dimensions=(sx,sz,sy)
 bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
for side,height,end in [('bridge',17.6,-14.0),('dial',15.9,-16.2)]:
 # Solid wedge stops outside the maker's 21 mm radius; a thin cantilever
 # crosses the holder rim. The maker geometry is never cut or rescaled.
 stations=[(-56,0.02),(-21.2,height)]
 vertices=[]
 for x,h in stations: vertices += [(x,-1.4,0),(x,1.4,0),(x,-1.4,h),(x,1.4,h)]
 faces=[(0,2,3,1),(2,6,7,3),(0,4,6,2),(1,3,7,5),(0,1,5,4),(4,5,7,6)]
 name=side+'-ramp'
 m=bpy.data.meshes.new(name);m.from_pydata(vertices,[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o)
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
 box(side+'-ramp-deck',(end+21.2,2.8,.2),((end-21.2)/2,0,height-.1))
output=ROOT/'explorer/public/bench-local';output.mkdir(parents=True,exist_ok=True)
source=ROOT/'assets/generated/bench';source.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source/'environment.blend'))
bpy.ops.export_scene.gltf(filepath=str(output/'environment.glb'),export_format='GLB',export_yup=True)
