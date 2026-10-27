"""Read-only source investigation of both display trains; derived evidence stays ignored."""
from interfaces import *
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.GeomAbs import GeomAbs_Cylinder

OUTPUT=ROOT/'artifacts/motion-works'
OUTPUT.mkdir(exist_ok=True)
MEMBERS={'cannon1':[137],'motion1':[210,211],'hour1':[141,142],
         'motion2':[213,214],'motion3':[216,217],'cannon2':[183,184],'hour2':[187,188]}

def save_motion(name,data):
 (OUTPUT/name).write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')

def investigate():
 sys.path.insert(0,str(ROOT/'scripts/cad'))
 from wheel_contact_probe import load_source, label_at
 from OCP.XCAFDoc import XCAFDoc_ShapeTool
 from OCP.TDF import TDF_LabelSequence,TDF_Label
 from OCP.TDF import TDF_Tool
 doc,records,shapes,defs=load_source(all_leaves=True)
 target={93,94,95,172,173}|{n for ns in MEMBERS.values() for n in ns}
 leaves={int(r['definitionId'].split('_')[-1]):r for r in records.values() if int(r['definitionId'].split('_')[-1]) in target}
 result={'sourceSha256':SOURCE_SHA,'phaseSha256':digest(ROOT/'assets/authored/wheel-display-poses.json'),'packets':{},'leaves':{},'interfaces':[]}
 inv=json.loads((ROOT/'explorer/public/models/assembly-manifest.json').read_text())['instances']
 for name,ns in MEMBERS.items():
  rs=[leaves[n] for n in ns]; parent=next(x for x in inv if x['id']==rs[0]['parentId'])
  if len(ns)>1:
   seq=TDF_LabelSequence();XCAFDoc_ShapeTool.GetComponents_s(label_at(doc,parent['definitionId'][2:].replace('_',':')),seq,False)
   children=[]
   for i in range(1,seq.Length()+1):
    label=seq.Value(i);ref=TDF_Label();assert XCAFDoc_ShapeTool.GetReferredShape_s(label,ref)
    children.append(ref.Tag())
   assert sorted(children)==sorted(ns),(name,children)
  result['packets'][name]={'definitions':ns,'members':[r['id'] for r in rs], 'sourcePaths':[r['sourceInstanceId'] for r in rs], 'sourceParent':parent['name'] if len(ns)>1 else 'single leaf, no cannon assembly', 'childDefinitionTags':children if len(ns)>1 else ns}
 for n,r in leaves.items():
  sh=shapes[r['id']];cyl=[]
  for i,f in enumerate(items(sh,TopAbs_FACE,TopoDS.Face_s),1):
   a=BRepAdaptor_Surface(f,True)
   if a.GetType()!=GeomAbs_Cylinder:continue
   c=a.Cylinder();bb=bounds(f)
   cyl.append({'face':i,'radiusMm':c.Radius(),'axisPointMm':xyz(c.Location()).tolist(),'axisDirection':xyz(c.Axis().Direction()).tolist(),'boundsMm':bb.tolist()})
  result['leaves'][n]={**r,'valid':BRepCheck_Analyzer(sh).IsValid(),'boundsMm':bounds(sh).tolist(),'cylinders':cyl}
 for a,b in [(93,137),(94,137),(95,137),(214,216),(214,217),(137,210),(211,141),(210,213),(216,183),(217,187)]:
  aa,bb=[shapes[leaves[n]['id']] for n in [a,b]]
  result['interfaces'].append({'pair':[a,b],'sourceGapMm':dist(aa,bb),'sourceCommonMm3':common(aa,bb)})
 save_motion('source.json',result)
 print(json.dumps(result['interfaces'],indent=2),flush=True)
 for n in [93,95,137,214,216,217]:
  r=result['leaves'][n];p=np.array(r['worldTransform'])[:2,3]
  print('AXIS',n,[(c['face'],round(c['radiusMm'],6),[round(c['boundsMm'][j][2],6) for j in [0,1]]) for c in r['cylinders'] if np.linalg.norm(np.array(c['axisPointMm'])[:2]-p)<1e-6],flush=True)

if __name__=='__main__':investigate()
