"""Blender reference views of exported CAD; run with blender --background --python.
These are diagnostic CAD renders, not photographic/material fidelity evidence.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'artifacts/cad/reference-renders';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/generated/zweigesicht.glb'))
objects=list(bpy.context.scene.objects)
# Blender imports glTF Y-up into Z-up. Restore original source XYZ for diagnostics.
correction=Matrix.Rotation(-math.pi/2,4,'X')
for obj in objects:
    if obj.parent is None:obj.matrix_world=correction@obj.matrix_world
bpy.context.view_layer.update()
meshes=[o for o in objects if o.type=='MESH']
movement='p_0_1_1_1__0_1_1_1_4'
for obj in meshes:
    for mat in obj.data.materials:
        if mat and mat.use_nodes:
            bsdf=mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value=.4
                bsdf.inputs['Roughness'].default_value=.36
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1400;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world.color=(.17,.17,.17)
scene.view_settings.view_transform='AgX'
world=scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.2,.24,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
camdata=bpy.data.cameras.new('ReferenceCamera');camera=bpy.data.objects.new('ReferenceCamera',camdata);scene.collection.objects.link(camera);scene.camera=camera;camdata.type='ORTHO'
lights=[]
for i in range(3):
    data=bpy.data.lights.new('Studio '+str(i),'AREA');data.shape='DISK';obj=bpy.data.objects.new('Studio '+str(i),data);scene.collection.objects.link(obj);lights.append(obj)
manifest=json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text())
byid={x['id']:x for x in manifest['instances']}
records=[]
for mode in ('full-source','movement'):
    selected=[]
    for obj in meshes:
        part=obj.get('partId','')
        visible=mode=='full-source' or part==movement or part.startswith(movement+'__')
        obj.hide_render=not visible
        if visible:selected.append(obj)
    corners=[obj.matrix_world@Vector(p) for obj in selected for p in obj.bound_box]
    low=Vector(tuple(min(p[i] for p in corners) for i in range(3)));high=Vector(tuple(max(p[i] for p in corners) for i in range(3)))
    center=(low+high)/2;extent=max(high-low);camdata.clip_end=extent*50;camdata.clip_start=.001
    for label,direction in [('front',(0,0,1)),('back',(0,0,-1)),('oblique',(.65,-.8,-1.5)),('side',(0,-1,0))]:
        camera.location=center+Vector(direction).normalized()*extent*3
        camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
        camdata.ortho_scale=extent*1.18
        for light,offset,power in zip(lights,[(1,1,2),(-1,.4,-1),(.3,-1,.7)],[180,110,70]):
            light.location=center+Vector(offset)*extent
            light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
            light.data.energy=power*extent*extent;light.data.size=extent*1.3
        scene.render.filepath=str(OUT/f'{mode}-{label}.png');bpy.ops.render.render(write_still=True)
        records.append({'image':str(Path(scene.render.filepath).relative_to(ROOT)), 'mode':mode,'view':label,'visibleMeshes':len(selected),'sourceBoundsMm':[list(low),list(high)],'cameraSourcePositionMm':list(camera.location),'orthographicScaleMm':camdata.ortho_scale})
(OUT/'views.json').write_text(json.dumps(records,indent=2)+'\n')
