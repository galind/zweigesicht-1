#!/usr/bin/env python3
"""Sample named original-solid pairs; no CAD writes or service certification."""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from OCP.BRepAlgoAPI import BRepAlgoAPI_Common
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.XCAFDoc import XCAFDoc_ShapeTool
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/cad'))
from explode_probe import shape_at, load_xcaf, SHA
source = ROOT / 'assets/source-originals/ml01-zweigesicht.stp'
assert hashlib.sha256(source.read_bytes()).hexdigest() == SHA
parts = {p['id']:p for p in json.loads((ROOT/'explorer/public/models/assembly-manifest.json').read_text())['instances']}
watch = json.loads((ROOT/'assets/authored/watch-configurations.json').read_text())
complete = {p['id']:p['offsetMm'] for p in json.loads((ROOT/'assets/derived/complete-separation.json').read_text())['parts']}
plate = next(p for p in parts.values() if p['definitionId']=='d_0_1_1_195')
ring = next(p for p in watch['leaves'] if p['definitionId']=='d_0_1_1_70')
lug = next(p for p in watch['leaves'] if p['definitionId']=='d_0_1_1_54' and p['packet']=='upper-lugs')
doc,_=load_xcaf(source)
shapes={}
def placed(p,offset,opposite=False):
 did=p['definitionId']
 if did not in shapes:
  label=TDF_Label();TDF_Tool.Label_s(doc.GetData(),did.removeprefix('d_').replace('_',':'),label,False)
  shapes[did]=XCAFDoc_ShapeTool.GetShape_s(label)
 matrix=np.array(p['oppositeWorldTransform'] if opposite else p['worldTransform'])
 matrix[:3,3]+=offset
 return shape_at(shapes[did],matrix)
def volume(a,b):
 common=BRepAlgoAPI_Common(a,b);common.Build()
 props=GProp_GProps();BRepGProp.VolumeProperties_s(common.Shape(),props)
 return {'done':common.IsDone(),'commonVolumeMm3':props.Mass()}
results=[]
for progress in [0,.025,.05,.1,.2,.3,.4,.5,.75,1]:
 base=placed(plate,np.array(complete[plate['id']])*progress)
 for name,p,offset,opposite in [
  ('baseline-middle',ring,[-55*progress,0,0],False),
  ('baseline-back-lug',lug,[0,40*progress,0],True),
  ('corrected-back-lug',lug,[0,-40*progress,0],True),
  ('candidate-axial-middle',ring,[0,0,90*progress],False)]:
  item={'path':name,'progress':progress,'id':p['id'],'otherId':plate['id'],**volume(placed(p,offset,opposite),base)}
  results.append(item);print(json.dumps(item),flush=True)
out=ROOT/'artifacts/disassembly-cad';out.mkdir(exist_ok=True)
(out/'solid-samples.json').write_text(json.dumps({'sourceSha256':SHA,'samples':results,'limitations':['Named pairs and discrete samples only; no continuous or all-part clearance proof.']},indent=2)+'\n')

results=[]
tube=next(p for p in watch['leaves'] if p['definitionId']=='d_0_1_1_73')
stem=next(p for p in parts.values() if p['id'].endswith('0_1_1_83_27'))
for progress in [0,.005,.01,.025,.05,.1,.2]:
 for a,b in [(tube,stem),(ring,stem)]:
  for path,offset in [('baseline',[-55*progress,0,0]),('axial',[0,0,90*progress])]:
   item={'path':path,'progress':progress,'id':a['id'],'otherId':b['id'],**volume(placed(a,offset),placed(b,np.array(complete[b['id']])*progress))}
   results.append(item);print(json.dumps(item),flush=True)
out=ROOT/'artifacts/disassembly-cad';out.mkdir(exist_ok=True)
(out/'ring-candidates.json').write_text(json.dumps({'sourceSha256':SHA,'samples':results,'limitations':['Named pairs and discrete samples only.']},indent=2)+'\n')

# The spacing review reads the actual evaluator samples exported locally, so
# source transformations remain separate from the candidate presentation.
offset_file = ROOT / 'artifacts/disassembly-cad/offsets.json'
if offset_file.exists():
 offsets = {p['id']:p['offset'] for p in json.loads(offset_file.read_text())[0]['parts']}
 selected_pairs=[]
 for face,packet,definition in [('central','front','d_0_1_1_26'),('small','rear','d_0_1_1_14')]:
  dial=next(p for p in parts.values() if p['definitionId']==definition and not p['isAssembly'])
  back=next(p for p in watch['leaves'] if p['packet']==packet+'-back' and p['definitionId']=='d_0_1_1_68')
  seal=next(p for p in watch['leaves'] if p['packet']==packet+'-seal')
  selected_pairs.extend([(back,dial),(seal,dial),(back,seal)])
 results=[]
 for progress in [0,.005,.01,.025,.05,.1,.2,.4,1]:
  for a,b in selected_pairs:
   da=np.array(offsets[a['id']])*progress;db=np.array(offsets[b['id']])*progress
   ba=np.array(a['boundsWorldMm'])+da;bb=np.array(b['boundsWorldMm'])+db
   disjoint=bool(np.any(ba[1]<bb[0]) or np.any(bb[1]<ba[0]))
   common={'done':True,'commonVolumeMm3':0.0} if disjoint else volume(placed(a,da),placed(b,db))
   item={'progress':progress,'id':a['id'],'otherId':b['id'],'boundsDisjoint':disjoint,**common}
   results.append(item);print(json.dumps(item),flush=True)
 baselines={(s['id'],s['otherId']):s['commonVolumeMm3'] for s in results if s['progress']==0}
 assert all(s['done'] and s['commonVolumeMm3']<=baselines[(s['id'],s['otherId'])]+1e-7 for s in results), 'A named pair exceeds its source-fit overlap'
 (out/'case-spacing-samples.json').write_text(json.dumps({'sourceSha256':SHA,'offsetEvidenceSha256':hashlib.sha256(offset_file.read_bytes()).hexdigest(),'samples':results,'limitations':['Named pairs at discrete values only. Disjoint bounds prove those pairs separate; overlapping bounds require the recorded solid Boolean. No all-part or service certification.']},indent=2)+'\n')
