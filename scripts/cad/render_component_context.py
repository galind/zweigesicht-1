"""Render paired assembled-context diagnostics with immutable source matrices."""
import bpy,json,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/cad/component-fidelity/visuals'
manifest=json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text())
occurrences=[i for i in manifest['instances'] if i['definitionId']=='d_0_1_1_9']
records=[]
for target in [occurrences[3],occurrences[-1]]:
    world=Matrix(target['worldTransform']);center=world@Vector((0,0,-.6));extent=4.
    parts=[]
    for part in manifest['instances']:
        if part['isAssembly'] or not part['id'].startswith(target['parentId']) or not part['boundsWorldMm']:continue
        lo,hi=part['boundsWorldMm']
        if all(lo[a]<=center[a]+extent and hi[a]>=center[a]-extent for a in range(3)):parts.append(part)
    for variant in ['assembly','individual']:
        bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
        material=bpy.data.materials.new('Diagnostic neutral');material.use_nodes=True
        bsdf=material.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.42,.46,.52,1);bsdf.inputs['Metallic'].default_value=.35;bsdf.inputs['Roughness'].default_value=.3
        for part in parts:
            source=variant if part['id']==target['id'] else 'assembly'
            p=ROOT/f"artifacts/cad/component-fidelity/{part['definitionId']}-{source}.npz"
            arrays=np.load(p);mesh=bpy.data.meshes.new('source');mesh.from_pydata(arrays['vertices'].tolist(),[],arrays['faces'].tolist());mesh.update()
            obj=bpy.data.objects.new(part['id'],mesh);bpy.context.collection.objects.link(obj);obj.matrix_world=Matrix(part['worldTransform']);mesh.materials.append(material)
            for poly in mesh.polygons:poly.use_smooth=True
        scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100
        scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.15,.19,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
        for offset,power in [((1,1,2),160),((-1,.4,-1),100),((.3,-1,.7),70)]:
            data=bpy.data.lights.new('Studio','AREA');data.shape='DISK';data.energy=power*extent*extent;data.size=extent*1.3;light=bpy.data.objects.new('Studio',data);scene.collection.objects.link(light);light.location=center+world.to_3x3()@Vector(offset)*extent;light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
        data=bpy.data.cameras.new('Camera');data.type='ORTHO';data.ortho_scale=extent;data.clip_start=.0001;data.clip_end=extent*50;camera=bpy.data.objects.new('Camera',data);scene.collection.objects.link(camera);scene.camera=camera
        camera.location=center+world.to_3x3()@Vector((.8,-1,.5)).normalized()*extent*3;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
        name='d9-context-'+target['id'].split('__')[-1]+'-'+variant;scene.render.filepath=str(OUT/(name+'.png'));scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';bpy.ops.render.render(write_still=True)
        records.append(dict(path=str(Path(scene.render.filepath).relative_to(ROOT)),targetId=target['id'],variant=variant,worldTransform=target['worldTransform'],camera=list(camera.location),orthographicScaleMm=extent,nearbySourceParts=[p['id'] for p in parts],scope='Raw movement source context; display variants untouched. Target alone uses identical independent maker mesh for the comparison.'))
(OUT/'context-views.json').write_text(json.dumps(records,indent=2)+'\n')
