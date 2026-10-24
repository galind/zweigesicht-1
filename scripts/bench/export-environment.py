"""Original workshop D revision 3. Numeric mm, glTF Y up.
Run prepare-workshop-artwork.mjs, then blender --background --python this-file.
Visible walkable triangles are collision triangles; no proxy slabs or hidden ramps.
"""
import bpy
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
oak=material('Oak',pal['oak'],.68)
paint=material('Olive grey joinery',pal['storage'],.78)
plaster=material('Warm plaster',pal['plaster'],.95)
green=material('Matte green',pal['mat'],.92)
steel=material('Brushed tool steel',pal['steel'],.5,.65)
dark=material('Blackened fittings',pal['loupe'],.7,.1)
paper=material('Ivory paper','D6CFB9',.9)
leather=material('Notebook cloth','655D4C',.9)
window=material('Opaque frosted daylight','E5EBE7',.96,0,.35)
lampinner=material('Lamp enamel','E4DBBF',.75,0,.6)
caps=material('Instrument endcaps','FFFFFF',.55,.2)
capcolor=caps.node_tree.nodes.new('ShaderNodeVertexColor');capcolor.layer_name='Cap tint'
caps.node_tree.links.new(capcolor.outputs['Color'],caps.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
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
                plank=int(v*6)
                val=1+.14*grain+.035*noise.noise(Vector((u*10,v*210,3)))+.025*math.sin(plank*6)
                if (v*6)%1 < .007:val*=.88
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
        mod=o.modifiers.new('Small crafted edge','BEVEL');mod.width=bevel;mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if smooth:
        for poly in data.polygons:poly.use_smooth=len(poly.vertices)==4
    uvl=data.uv_layers.new(name='Authored projection')
    for poly in data.polygons:
        axis=max(range(3),key=lambda k:abs(poly.normal[k]))
        for li in poly.loop_indices:
            co=data.vertices[data.loops[li].vertex_index].co
            a,b=(co.x,co.y) if axis==2 else ((co.x,co.z) if axis==1 else (co.y,co.z))
            uvl.data[li].uv=uv(data.loops[li].vertex_index) if uv else (a/(1100 if mat==oak else 12),b/(650 if mat==oak else 12))
    o.select_set(False);objects.append(o)
    mins=[min(v[k] for v in verts) for k in range(3)];maxs=[max(v[k] for v in verts) for k in range(3)]
    semantics.append({'id':name,'role':role,'material':mat.name,'min':mins,'max':maxs})
    return o

def box(name,x0,x1,z0,z1,top,bottom,mat,role='walkable',bevel=0):
    pts=[(x0,z0),(x1,z0),(x1,z1),(x0,z1)]
    return mesh(name,[(x,bottom,z) for x,z in pts]+[(x,top,z) for x,z in pts],[(3,2,1,0),(4,5,6,7)]+[(i,(i+1)%4,(i+1)%4+4,i+4) for i in range(4)],mat,role,bevel)

def lathe(name,center,profile,mat,role='walkable',n=32):
    # Closed profile, including bottom/top caps. Rounded contours use multiple rings.
    x,y,z=center;v=[(x+r*math.cos(i*math.tau/n),y+h,z+r*math.sin(i*math.tau/n)) for h,r in profile for i in range(n)]
    f=[tuple(range(n-1,-1,-1)),tuple(range((len(profile)-1)*n,len(profile)*n))]
    for j in range(len(profile)-1):
        for i in range(n):f.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    return mesh(name,v,f,mat,role,smooth=True)

def rod(name,a,b,r,mat,role='walkable',n=12):
    A=Vector(a);B=Vector(b);direction=(B-A).normalized();u=direction.cross(Vector((0,0,1)))
    if u.length<.01:u=direction.cross(Vector((0,1,0)))
    u.normalize();v=direction.cross(u)
    points=[tuple(p+r*(math.cos(i*math.tau/n)*u+math.sin(i*math.tau/n)*v)) for p in (A,B) for i in range(n)]
    return mesh(name,points,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat,role,smooth=True)

D=SPEC['mainDesk'];M=SPEC['mat']
box('main-oak-top',D['minX'],D['maxX'],D['minZ'],D['maxZ'],D['topY'],D['bottomY'],oak,bevel=.12)
box('green-mat',M['minX'],M['maxX'],M['minZ'],M['maxZ'],M['topY'],M['bottomY'],green)
# Integrated drawer pedestals below a continuous desktop. No second furniture.
for x in [-430,430]:
    box('pedestal',x-104,x+104,-430,155,-33,-910,paint,bevel=3)
    box('plinth',x-108,x+108,-435,160,-883,-921,paint,bevel=2)
    for i,(bottom,top) in enumerate([(-265,-63),(-515,-275),(-877,-525)]):
        box('drawer-front',x-95,x+95,155,164,top,bottom,paint,bevel=2)
        # Original curved cup pulls, closed at the back and lower lip.
        cy=(top+bottom)/2
        verts=[]
        for r,depth in [(1,164),(.82,172),(.4,177)]:
            verts += [(x+24*r*math.cos(a*math.pi/12),cy+12*r*math.sin(a*math.pi/12),depth) for a in range(13)]
        faces=[]
        for j in range(2):
            faces += [(j*13+i,j*13+i+1,(j+1)*13+i+1,(j+1)*13+i) for i in range(12)]
        verts.append((x,cy,178))
        faces += [(26+i,26+i+1,39) for i in range(12)]
        faces += [tuple(range(12,-1,-1)),(0,13,26,39,38,25,12)]
        mesh('drawer-cup-pull',verts,faces,steel,smooth=True)
box('front-apron',-325,325,130,150,-35,-125,paint,bevel=2)
box('back-stretcher',-330,330,-430,-410,-740,-815,paint,bevel=2)
# Five instruments in a single oak stand; no duplicate decoration.
box('screwdriver-stand',-445,-315,-122.5,-57.5,27,-1,oak,bevel=1.5)
for i in range(5):
    x=-430+i*25
    rod(f'screwdriver-{i+1}-shaft',(x,27,-90),(x,79,-90),1.7,steel)
    lathe(f'screwdriver-{i+1}-grip',(x,71,-90),[(0,3),(2,4),(20,4),(22,3.5)],dark,n=16)
    cap=lathe(f'screwdriver-{i+1}-cap',(x,93,-90),[(0,4.5),(2,5),(5,5),(6,4)],caps,n=16)
    color=['9F4437','444A42','A88642','386879','C09B4F'][i]
    attr=cap.data.color_attributes.new(name='Cap tint',type='FLOAT_COLOR',domain='CORNER')
    rgba=tuple(linear(int(color[k:k+2],16)/255) for k in (0,2,4))+(1,)
    for entry in attr.data:entry.color=rgba
# Empty tray: floor and four rounded rims, genuine open interior.
box('tray-floor',-455,-305,20,110,1,-1,steel,bevel=.7)
for name,x0,x1,z0,z1 in [('left',-455,-453,20,110),('right',-307,-305,20,110),('rear',-453,-307,20,22),('front',-453,-307,108,110)]:
    box('tray-'+name,x0,x1,z0,z1,11,0,steel,bevel=.6)
lathe('loupe-body',(210,-1,0),[(0,14),(1,15),(3,14),(5,11),(22,10),(25,14),(28,14),(28,11.5),(26,11.5)],dark)
lathe('loupe-opaque-lens',(210,25.5,0),[(0,11.5),(.25,11.5)],steel)
# Closed tweezers: one solid tapered silhouette, no invisible trapping gap.
mesh('closed-tweezers',[(224.3,-1,12.5),(225.7,-1,12.5),(229,-1,127.5),(221,-1,127.5),(224.3,1,12.5),(225.7,1,12.5),(229,2,127.5),(221,2,127.5)],[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],steel,bevel=.3)
box('notebook-bottom',280,420,-217.5,-122.5,.2,-1,leather,bevel=.5)
box('notebook-pages',282,418,-215.5,-124.5,5.8,.2,paper,bevel=.3)
box('notebook-cover',280,420,-217.5,-122.5,7,5.8,leather,bevel=.5)
box('notebook-spine',280,282,-217.5,-122.5,7,-1,leather,bevel=.4)
# Weighted task lamp, paired slender arms and solid joints, bell shade.
lathe('lamp-base',(-300,-1,-230),[(0,49),(2,52.5),(9,52.5),(13,48),(15,30)],steel)
a=(-300,14,-230);b=(-300,190,-230);c=(-190,375,-135)
for dz in [-5,5]:
    rod('lamp-lower-arm',(a[0],a[1],a[2]+dz),(b[0],b[1],b[2]+dz),3.5,steel)
    rod('lamp-upper-arm',(b[0],b[1],b[2]+dz),(c[0],c[1],c[2]+dz),3.5,steel)
for p in [a,b,c]:rod('lamp-hinge',(p[0],p[1],p[2]-9),(p[0],p[1],p[2]+9),10,steel,n=24)
lathe('lamp-shade',(-190,305,-135),[(0,45),(3,46),(12,43),(29,35),(43,23),(49,13),(63,12),(66,9)],steel)
lathe('lamp-inner-enamel',(-190,304.8,-135),[(0,43),(.2,43)],lampinner)
# Room shell entirely beyond the reachable column. No ceiling or flight cap.
R=SPEC['room'];fy=R['floorY'];ty=R['wallTopY']
box('room-floor',-620,620,-520,1720,fy,fy-20,oak,'decor')
box('back-wall',-620,620,-520,-500,ty,fy,plaster,'decor')
box('left-wall',-620,-600,-500,1720,ty,fy,plaster,'decor')
box('right-wall',600,620,-500,1720,ty,fy,plaster,'decor')
box('front-wall',-600,600,1700,1720,ty,fy,plaster,'decor')
for x0,x1,z0,z1 in [(-600,600,-500,-493),(-600,-593,-500,1700),(593,600,-500,1700)]:box('skirting',x0,x1,z0,z1,fy+65,fy,paint,'decor')
# Single oak frame ahead, at X0 / Y420, full size 260 x 200.
for name,x0,x1,y0,y1 in [('top',-130,130,513,520),('bottom',-130,130,320,327),('left',-130,-123,327,513),('right',123,130,327,513)]:box('map-frame-'+name,x0,x1,-499,-488,y1,y0,oak,'decor',1)
# Opaque frosted panel and thin painted frame. Sill remains outside bounds.
box('frosted-pane',594,599,-390,110,900,100,window,'decor')
for z0,z1,y0,y1 in [(-400,-390,90,910),(110,120,90,910),(-390,110,90,100),(-390,110,900,910),(-390,110,790,801)]:box('window-frame',580,599,z0,z1,y1,y0,paint,'decor',1)
box('window-sill',570,600,-405,125,100,87,paint,'decor',1)

def artwork(name,verts,filename,alpha=False):
    mat=material(name,'FFFFFF',.95)
    img=bpy.data.images.load(str(OUT/filename));img.pack()
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img
    p=mat.node_tree.nodes.get('Principled BSDF');mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
    if alpha:
        clip=mat.node_tree.nodes.new('ShaderNodeMath');clip.operation='GREATER_THAN';clip.inputs[1].default_value=.5
        mat.node_tree.links.new(tex.outputs['Alpha'],clip.inputs[0]);mat.node_tree.links.new(clip.outputs[0],p.inputs['Alpha'])
        # Export a mask, never a transmission/refraction surface.
        mat.surface_render_method='DITHERED'
        mat.alpha_threshold=.5
    return mesh(name,verts,[(0,1,2,3)],mat,'decor',uv=lambda i:[(0,0),(1,0),(1,1),(0,1)][i])
artwork('Dresden schematic',[(-123,327,-490),(123,327,-490),(123,513,-490),(-123,513,-490)],'dresden.png')
name_decal=artwork('Guillem Galindo',[(142,.003,115.2),(167,.003,115.2),(167,.003,113),(142,.003,113)],'wordmark.png',True)
# Printed ink does not cast an ambient-occlusion rectangle onto the mat.
name_decal.visible_shadow=False
# Merge material / collision role. Semantic bounds retained independently for QA.
groups={}
for o in objects:groups.setdefault((o.data.materials[0].name,o['collisionRole']),[]).append(o)
for (mat,role),parts in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join()
    o=bpy.context.object;o.name='ENV '+role+' '+mat;o['atelierVersion']=1;o['collisionRole']=role
    o['semanticIds']=[s['id'] for s in semantics if s['material']==mat and s['role']==role]
    mod=o.modifiers.new('Explicit collision triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=mod.name)
    o.select_set(False)
# Bake restrained contact occlusion into opaque albedo atlases. Original UVs
# remain the procedural wood/noise inputs; a second UV set stores the bake.
# This is static environment shading, never a shadow-map/render pass.
bpy.context.scene.render.engine='CYCLES'
bpy.context.scene.cycles.samples=64
bpy.context.scene.render.bake.margin=3
bpy.context.scene.render.bake.use_clear=True
for mat in [oak,paint,plaster,green,steel,dark,paper,leather,window,lampinner,caps]:
    parts=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials[0]==mat]
    size=1024 if mat==oak else 512 if mat in [plaster,green,paint] else 256
    img=bpy.data.images.new(mat.name+' baked albedo',width=size,height=size)
    nodes=mat.node_tree.nodes;links=mat.node_tree.links
    originalUV=nodes.new('ShaderNodeUVMap');originalUV.uv_map='Authored projection'
    for node in list(nodes):
        if node.type=='TEX_IMAGE':links.new(originalUV.outputs['UV'],node.inputs['Vector'])
    for o in parts:
        o.data.uv_layers.new(name='Baked atlas')
        o.data.uv_layers.active_index=1
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:o.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.008)
    bpy.ops.object.mode_set(mode='OBJECT')
    target=nodes.new('ShaderNodeTexImage');target.image=img;nodes.active=target
    ao=nodes.new('ShaderNodeAmbientOcclusion');ao.inputs['Distance'].default_value=90;ao.samples=64
    soften=nodes.new('ShaderNodeMixRGB');soften.blend_type='MIX';soften.inputs[0].default_value=.72;soften.inputs[1].default_value=(1,1,1,1);links.new(ao.outputs['Color'],soften.inputs[2])
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
bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.17,depth=1.65,location=(-560,-54,.825))
reference=bpy.context.object;reference.name='QA_SCALE_REFERENCE_1.65mm';reference.hide_render=True;reference.hide_set(True)
bpy.context.scene['atelierLayout']=json.dumps(LAYOUT)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'environment.blend'))
runtime=ROOT/'explorer/public/bench-local/environment.glb'
bpy.ops.export_scene.gltf(filepath=str(runtime),export_format='GLB',export_yup=True,export_extras=True,use_renderable=True)
counts['downloadBytes']=runtime.stat().st_size;assert counts['downloadBytes']<=8*1024**2
report={'schemaVersion':1,'generator':'scripts/bench/export-environment.py','blender':bpy.app.version_string,'designRevision':3,'origin':'Original authored geometry, noise textures and vector artwork; no external models, map data, fonts or ImageGen pixels. No maker CAD embedded.','license':'Original project contributions under repository MIT; maker CAD remains separately gated.','budgets':counts,'semantics':semantics,'files':[]}
for p in [ROOT/'assets/authored/workshop-environment.json',ROOT/'assets/authored/atelier-layout.json',ROOT/'assets/authored/workshop-graphics/dresden.svg',ROOT/'assets/authored/workshop-graphics/wordmark.svg',Path(__file__),ROOT/'scripts/bench/prepare-workshop-artwork.mjs',OUT/'environment.blend',runtime]:report['files'].append({'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(ROOT/'assets/source-manifest/workshop-environment.json').write_text(json.dumps(report,indent=2)+'\n')
print('WORKSHOP',json.dumps(counts))
