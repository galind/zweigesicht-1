"""Blender diagnostic close-ups from independently audited meshes; no retouching.

Run Blender --background --python scripts/cad/render_component_comparison.py.
Equal camera, source scale, light and neutral material within each comparison.
"""
import bpy
import json
import numpy as np
from mathutils import Vector
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/cad/component-fidelity/visuals'
OUT.mkdir(parents=True, exist_ok=True)
ledger = json.loads((ROOT / 'docs/cad-component-ledger.json').read_text())
byid = {r['definitionId']:r for r in ledger['definitions']}
records = []
for number, detail in [(9,False),(180,False),(55,False),(68,False),(195,False),(195,True)]:
    key = 'd_0_1_1_' + str(number)
    if not byid[key].get('source'): continue
    row = byid[key]
    bounds = [[10.4,-1.6,-2.1],[14.3,1.6,-1.0]] if detail else row['assemblyMetrics']['boundsMm']
    center = Vector(tuple((a+b)/2 for a,b in zip(*bounds)))
    extent = max(b-a for a,b in zip(*bounds))
    for source in ['assembly', 'individual'] + (['individualOnly'] if detail else []):
        bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
        arrays = np.load(ROOT / f'artifacts/cad/component-fidelity/{key}-{source}.npz')
        mesh = bpy.data.meshes.new('verified mesh'); mesh.from_pydata(arrays['vertices'].tolist(), [], arrays['faces'].tolist()); mesh.update()
        obj = bpy.data.objects.new(key, mesh); bpy.context.collection.objects.link(obj)
        material = bpy.data.materials.new('Diagnostic neutral'); material.use_nodes = True
        bsdf = material.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value=(.42,.46,.52,1); bsdf.inputs['Metallic'].default_value=.35; bsdf.inputs['Roughness'].default_value=.3
        obj.data.materials.append(material)
        # Source face boundaries retain split vertices; smoothing cannot create a thread.
        for poly in mesh.polygons: poly.use_smooth = True
        scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32
        scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100
        scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.15,.19,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
        for offset,power in [((1,1,2),160),((-1,.4,-1),100),((.3,-1,.7),70)]:
            data=bpy.data.lights.new('Studio','AREA');data.shape='DISK';data.energy=power*extent*extent;data.size=extent*1.3
            light=bpy.data.objects.new('Studio',data);scene.collection.objects.link(light);light.location=center+Vector(offset)*extent;light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
        data=bpy.data.cameras.new('Diagnostic camera');data.type='ORTHO';data.ortho_scale=extent*1.25;data.clip_start=.0001;data.clip_end=extent*50
        camera=bpy.data.objects.new('Camera',data);scene.collection.objects.link(camera);scene.camera=camera
        camera.location=center+Vector((.1,.3,-1) if detail else (.8,-1,.5)).normalized()*extent*3;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
        scene.render.filepath=str(OUT / f'{key}{"-slot" if detail else ""}-{source}.png');bpy.ops.render.render(write_still=True)
        records.append(dict(definitionId=key,source=source,detail=detail,path=str(Path(scene.render.filepath).relative_to(ROOT)),orthographicScaleMm=data.ortho_scale,cameraSourcePositionMm=list(camera.location),sourceHash=ledger['assemblySha256'] if source=='assembly' else row['source']['sha256']))
(OUT / 'views.json').write_text(json.dumps(records,indent=2)+'\n')
