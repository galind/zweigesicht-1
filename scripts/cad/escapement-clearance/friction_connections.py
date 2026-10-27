"""Source-only comparison of the two display-train friction candidates.
Reads retained original assembly/cache and separately downloaded maker STEP files.
Never changes application assets, placements or geometry.
"""
from interfaces import *
from collections import Counter
from OCP.STEPControl import STEPControl_Reader
from OCP.IFSelect import IFSelect_RetDone
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.GeomAbs import GeomAbs_Cylinder, GeomAbs_Cone
import re

TARGET=ROOT/'artifacts/friction-connections'
FILES={93:'ml01-minutentrieb-z12-m015',137:'ml01-viertelrohr1-z12-m0177',
       214:'ml01-zeigerwerkswelle2',217:'ml01-wechseltrieb3-z8-m012'}

def load_step(path):
 reader=STEPControl_Reader();assert reader.ReadFile(str(path))==IFSelect_RetDone
 assert reader.TransferRoots()>0
 return reader.OneShape()

def surfaces(shape):
 rows=[]
 for i,face in enumerate(items(shape,TopAbs_FACE,TopoDS.Face_s),1):
  a=BRepAdaptor_Surface(face,True);row={'face':i,'type':str(a.GetType()),'boundsMm':bounds(face).tolist()}
  if a.GetType() in [GeomAbs_Cylinder,GeomAbs_Cone]:
   c=a.Cylinder() if a.GetType()==GeomAbs_Cylinder else a.Cone()
   row.update(axisPointMm=xyz(c.Location()).tolist(),axisDirection=xyz(c.Axis().Direction()).tolist())
   if a.GetType()==GeomAbs_Cylinder:row['radiusMm']=c.Radius()
   else:row.update(referenceRadiusMm=c.RefRadius(),semiAngleRadians=c.SemiAngle())
   u=(a.FirstUParameter()+a.LastUParameter())/2
   row['surfaceVEndpointsMm']=[xyz(a.Value(u,v)).tolist() for v in [a.FirstVParameter(),a.LastVParameter()]]
  rows.append(row)
 return rows

def metadata(path):
 text=path.read_text(errors='replace');types=Counter(re.findall(r'#\d+\s*=\s*([A-Z][A-Z0-9_]+)\s*\(',text))
 pattern=r'KINEMATIC|MECHANISM|PAIR|TORQUE|FRICTION|TOLERANCE|DIMENSION|DRAUGHTING|ANNOTATION'
 return {'sha256':digest(path),'header':text[:text.index('DATA;')], 'semanticEntityTypeMatches':{k:v for k,v in types.items() if re.search(pattern,k)},'pmiCountItems':re.findall(r"VALUE_REPRESENTATION_ITEM\('number of (?:annotations|views)'[^;]+;",text),'entityTypes':dict(types)}

def run():
 assembly_path=ROOT/'assets/source-originals/ml01-zweigesicht.stp';assert digest(assembly_path)==SOURCE_SHA
 old=json.loads((ROOT/'artifacts/motion-works/source.json').read_text())
 assert old['sourceSha256']==SOURCE_SHA
 cache=ROOT/'artifacts/escapement-interfaces-20261026'
 cachemeta=json.loads((cache/'source-cache.json').read_text())
 assert cachemeta['sourceSha256']==SOURCE_SHA
 assert cachemeta['ocpVersion']==OCP.__version__
 catalog=ROOT/'explorer/public/models/assembly-manifest.json'
 assert digest(catalog)==cachemeta['catalogSha256']
 instances={x['id']:x for x in json.loads(catalog.read_text())['instances']}
 downloads=json.loads((TARGET/'downloads.json').read_text());download_by_path={r['path']:r for r in downloads if 'path' in r}
 report={'sourceSha256':SOURCE_SHA,'ocpVersion':OCP.__version__,'sourceOccurrenceEvidenceSha256':digest(ROOT/'artifacts/motion-works/source.json'),'scope':'Independent maker component solids compared in definition-local frames; original assembly unchanged','parts':[],'stepMetadata':metadata(assembly_path)}
 for n,slug in FILES.items():
  filename=f'd_0_1_1_{n}.brep';p=cache/'brep'/filename;assert digest(p)==cachemeta['files'][filename]
  source=TopoDS_Shape();assert BRepTools.Read_s(source,str(p),BRep_Builder())
  incoming=TARGET/'originals'/(slug+'.stp');assert digest(incoming)==download_by_path[str(incoming.relative_to(ROOT))]['sha256']
  independent=load_step(incoming)
  assert BRepCheck_Analyzer(source).IsValid() and BRepCheck_Analyzer(independent).IsValid()
  removed=boolean(source,independent,BRepAlgoAPI_Cut).Shape();added=boolean(independent,source,BRepAlgoAPI_Cut).Shape()
  assert BRepCheck_Analyzer(removed).IsValid() and BRepCheck_Analyzer(added).IsValid()
  srcsurfaces=surfaces(source);indsurfaces=surfaces(independent)
  row={'definition':n,'file':str(incoming.relative_to(ROOT)),'sha256':digest(incoming),'sourceCacheSha256':digest(p),'sourceVolumeMm3':vol(source),'independentVolumeMm3':vol(independent),'sourceMinusIndependentMm3':sum(vol(s) for s in items(removed,TopAbs_SOLID)),'independentMinusSourceMm3':sum(vol(s) for s in items(added,TopAbs_SOLID)),'sourceBoundsMm':bounds(source).tolist(),'independentBoundsMm':bounds(independent).tolist(),'sourceFaceCount':len(srcsurfaces),'independentFaceCount':len(indsurfaces),'sourceSurfaceTypes':dict(Counter(s['type'] for s in srcsurfaces)),'sourceSurfaces':srcsurfaces,'independentSurfaces':indsurfaces,'independentStepMetadata':metadata(incoming)}
  # A non-tooth profile of the original interface, in the exact occurrence frame.
  assert np.max(np.abs(np.array(old['leaves'][str(n)]['worldTransform'])-np.array(instances[old['leaves'][str(n)]['id']]['worldTransform'])))<1e-10
  row['worldSurfaces']=surfaces(moved(source,np.array(old['leaves'][str(n)]['worldTransform'])))
  report['parts'].append(row)
  print('definition',n,'faces',row['sourceFaceCount'],row['independentFaceCount'],'differences',row['sourceMinusIndependentMm3'],row['independentMinusSourceMm3'],row['sourceSurfaceTypes'],flush=True)
  (TARGET/'comparison.partial.json').write_text(json.dumps(report,indent=2)+'\n')
 alt=TARGET/'originals/alt-ml01-viertelrohr1.stp'
 if alt.exists():
  assert digest(alt)==download_by_path[str(alt.relative_to(ROOT))]['sha256']
  sh=load_step(alt);report['olderCannonVariant']={'sha256':digest(alt),'boundsMm':bounds(sh).tolist(),'volumeMm3':vol(sh),'faces':surfaces(sh),'status':'Separate alt catalogue variant, not installed or substituted','stepMetadata':metadata(alt)}
 (TARGET/'comparison.json').write_text(json.dumps(report,indent=2)+'\n');(TARGET/'comparison.partial.json').unlink()
if __name__=='__main__':run()
