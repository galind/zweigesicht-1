#!/usr/bin/env python3
"""Generate the local-only maker engraving plate; never uploads CAD.
Run: .venv-cad/bin/python scripts/cad/prepare-shock-replacement.py
"""
import hashlib
import json
import numpy as np
from export_assembly import ROOT, Glb, load_xcaf, tessellate, bbox
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.XCAFDoc import XCAFDoc_ShapeTool
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.TopAbs import TopAbs_FACE
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS
from OCP.GeomAbs import GeomAbs_Cylinder
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.BRepAlgoAPI import BRepAlgoAPI_Common
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.gp import gp_Trsf
SHA='0aa8977adcbbcf939e0824699e8e6fe6bda60c0e0d511a9d9fb8aa59c951893a'
SOURCE=ROOT/'assets/source-originals/ml01-gravurplatte.stp'
ASSEMBLY_SHA='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b'
PAGE='https://www.marcolangwatches.com/cad/ml01-gravurplatte/'
URL='https://www.marcolangwatches.com/cad/ml01-gravurplatte/?wpdmdl=2139&ind=1690646949750'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SHA
manifest=json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text())
assert hashlib.sha256((ROOT/'assets/source-originals/ml01-zweigesicht.stp').read_bytes()).hexdigest()==ASSEMBLY_SHA
base=next(i for i in manifest['instances'] if i['definitionId']=='d_0_1_1_147')
root='p_0_1_1_1__0_1_1_1_4'
shock=root+'__0_1_1_83_29'
part_id=root+'__0_1_1_83_replacement'
definition_id='d_external_ml01_gravurplatte'
doc,tool=load_xcaf(SOURCE)
label=TDF_Label();TDF_Tool.Label_s(doc.GetData(),'0:1:1:1',label,False)
shape=XCAFDoc_ShapeTool.GetShape_s(label)
mesh,faces,missing,cylinders=tessellate(shape,.015,.25)
assert missing==0 and len(mesh.faces)>0 and np.isfinite(mesh.vertices).all()
# Same local XY frame is established by all four mounting cylinders, not a visual fit.
assembly_doc,_=load_xcaf(ROOT/'assets/source-originals/ml01-zweigesicht.stp')
base_label=TDF_Label();TDF_Tool.Label_s(assembly_doc.GetData(),'0:1:1:147',base_label,False)
base_shape=XCAFDoc_ShapeTool.GetShape_s(base_label)
_,_,_,base_cylinders=tessellate(base_shape,.015,.25)
mounts=[]
for c in cylinders:
 if not any(abs(c['radiusMm']-r)<1e-8 for r in [.245,.45]): continue
 matches=[b for b in base_cylinders if np.linalg.norm(np.array(b['originLocalMm'][:2])-c['originLocalMm'][:2])<1e-8]
 assert matches
 mounts.append({'replacementRadiusMm':c['radiusMm'],'baseRadiusMm':matches[0]['radiusMm'],'axisXYLocalMm':c['originLocalMm'][:2],'axisMatchErrorMm':float(np.linalg.norm(np.array(matches[0]['originLocalMm'][:2])-c['originLocalMm'][:2]))})
assert len(mounts)==4
world=np.array(base['worldTransform']);world[2,3]-=.05
points=np.column_stack([mesh.vertices,np.ones(len(mesh.vertices))])@world.T
part={'id':part_id,'definitionId':definition_id,'sourceInstanceId':'external:ml01-gravurplatte.stp#0:1:1:1','name':'Engraving plate','parentId':root,'isAssembly':False,'worldTransform':world.tolist(),'boundsWorldMm':[points[:,:3].min(axis=0).tolist(),points[:,:3].max(axis=0).tolist()],'triangles':len(mesh.faces)}
glb=Glb();index=glb.mesh(definition_id,mesh,[.63,.65,.67]);glb.doc['nodes'].append({'name':part_id,'mesh':index,'extras':{'partId':part_id,'definitionId':definition_id,'sourceName':'ml01 Gravurplatte','isAssembly':False}});glb.doc['scenes'][0]['nodes']=[0]
out=ROOT/'explorer/public/models';out.mkdir(parents=True,exist_ok=True)
tmp=ROOT/'artifacts/cad/shock-replacement/plate.glb';tmp.parent.mkdir(parents=True,exist_ok=True);glb.write(tmp)
digest=hashlib.sha256(tmp.read_bytes()).hexdigest();asset='shock-replacement-'+digest[:12]+'.glb';(out/asset).write_bytes(tmp.read_bytes())
uncertainties=['Placement is an authored rigid fit using source mounting axes and the existing support plane; the maker download is not an assembled alternate configuration.', 'Two reused source mounting screws have approximately 0.000434 mm^3 nominal Boolean intersection per screw with the replacement counterbore/chamfer. Exact fastener suitability remains an engineering review gate.', 'Existing tall shock locator pins are omitted because they project beyond the engraved surface. Replacement locating-pin specification is absent from this source. No substitute geometry is fabricated.', 'CAD redistribution and public release remain unapproved.']
def moved(shape, transform):
    trsf=gp_Trsf();trsf.SetValues(*np.array(transform)[:3].ravel().tolist())
    return BRepBuilderAPI_Transform(shape,trsf,True).Shape()
placed=moved(shape,world)
common_volumes={}
for instance in manifest['instances']:
    if instance['definitionId'] not in {'d_0_1_1_195','d_0_1_1_170'}: continue
    target_label=TDF_Label()
    TDF_Tool.Label_s(assembly_doc.GetData(),instance['definitionId'][2:].replace('_',':'),target_label,False)
    target=moved(XCAFDoc_ShapeTool.GetShape_s(target_label),instance['worldTransform'])
    common=BRepAlgoAPI_Common(placed,target);common.Build();assert common.IsDone()
    volume=GProp_GProps();BRepGProp.VolumeProperties_s(common.Shape(),volume)
    common_volumes[instance['id']]=volume.Mass()
mainplate_volume=next(v for k,v in common_volumes.items() if '__0_1_1_83_54__' in k)
screw_volumes=[common_volumes[shock+'__0_1_1_145_'+str(n)] for n in [32,33]]
assert abs(mainplate_volume)<1e-8 and max(screw_volumes)<.0005
# Boolean clearance measures existing source shapes only; it does not certify mechanics.
evidence={'units':'mm','sourceFaces':faces,'missingTessellationFaces':missing,'brepValid':bool(BRepCheck_Analyzer(shape).IsValid()),'mounts':mounts,'baseThicknessMm':.95,'replacementThicknessMm':1.0,'worldZOffsetFromBaseMm':-.05,'supportPlaneWorldZMm':-2.6,'mainplateCommonVolumeMm3':mainplate_volume,'retainedScrewCommonVolumeMm3':screw_volumes,'uncertainties':uncertainties}
authored={'schemaVersion':1,'asset':'/models/'+asset,'sha256':digest,'part':part,'retainedLeafIds':[shock+'__0_1_1_145_32',shock+'__0_1_1_145_33'],'proxyPartId':base['id'],'sourcePage':PAGE,'sourceSha256':SHA,'placementEvidence':evidence}
(ROOT/'assets/authored/shock-replacement.json').write_text(json.dumps(authored,indent=2)+'\n')
(ROOT/'assets/source-manifest/shock-replacement.json').write_text(json.dumps({'schemaVersion':1,'sourcePage':PAGE,'downloadUrl':URL,'originalFile':'assets/source-originals/ml01-gravurplatte.stp','sha256':SHA,'assemblyReferenceSha256':ASSEMBLY_SHA,'sourceLabel':'0:1:1:1','sourceName':'ml01 Gravurplatte','retrievedDate':'2026-09-11','derivedAsset':authored['asset'],'derivedSha256':digest,'generationCommand':'.venv-cad/bin/python scripts/cad/prepare-shock-replacement.py','redistribution':'Not authorized; original and derived CAD remain ignored local files.','placementEvidence':evidence},indent=2)+'\n')
(ROOT/'artifacts/cad/shock-replacement/evidence.json').write_text(json.dumps(evidence,indent=2)+'\n')
print(json.dumps({'asset':asset,'triangles':len(mesh.faces),'mounts':mounts}))
