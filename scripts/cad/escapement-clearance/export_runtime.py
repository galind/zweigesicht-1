"""Generate the release-gated runtime sidecar from hash-checked study outputs.
Original GLBs/CAD stay untouched. No experimental BReps are copied to runtime.
"""
from spring import *
from OCP.TopoDS import TopoDS_Compound
sys.path.insert(0,str(ROOT/'scripts/cad'))
from export_assembly import tessellate

def run():
 d=Data()
 inputs={"assets/authored/running-movement.json":digest(ROOT/"assets/authored/running-movement.json")}
 for name in ['escapement-clearance-study','escapement-interfaces-study','train-coupling-study']:
  path=ROOT/f'assets/source-manifest/{name}.json';record=json.loads(path.read_text());inputs[str(path.relative_to(ROOT))]=digest(path)
  for key in ['cycle.json','candidate-fork.brep','spring-curves.npz']:
   if key in record['localEvidenceSha256']:
    p=ROOT/record['localEvidenceRoot']/key
    assert digest(p)==record['localEvidenceSha256'][key]
    inputs[str(p.relative_to(ROOT))]=digest(p)
 inv=d.inv
 def occurrence(n):return next(p for p in inv if p['definitionId']==f'd_0_1_1_{n}')
 hist=json.loads(subprocess.check_output(['git','show',HISTORICAL_REF+':docs/escapement/components.json'],cwd=ROOT))
 train=json.loads((ROOT/'assets/source-manifest/train-coupling-study.json').read_text())
 packets=[dict(name=n,pivot=hist['shafts'][n]['pivotWorldMm'],members=hist['shafts'][n]['members'],ratio=[0,1]) for n in ['balance','pallet']]
 from fractions import Fraction
 for p in train['kinematics']['packets']:
  r=Fraction(p['ratioToEscape']);packets.append(dict(name=p['name'],pivot=p['worldPivotMm'],members=[m['id'] for m in p['members']],ratio=[r.numerator,r.denominator]))
 data=bytearray()
 def add(a,kind='float32'):
  a=np.asarray(a,dtype='<f4' if kind=='float32' else '<u4');entry={'offset':len(data)//4,'count':a.size};data.extend(a.tobytes());return entry
 def mesh(sh):
  m,_,missing,_=tessellate(sh,.0002,.08);assert missing==0
  return dict(position=add(m.vertices),normal=add(m.vertex_normals),index=add(m.faces,'uint32'))
 fork=TopoDS_Shape();assert BRepTools.Read_s(fork,str(HERE/'candidate-fork.brep'),BRep_Builder())
 forkmeta=mesh(fork)
 # Retain original raised terminal and the source's separate staff cylinder.
 faces=items(d.shapes[116],TopAbs_FACE,TopoDS.Face_s)
 terminal=TopoDS_Compound();builder=BRep_Builder();builder.MakeCompound(terminal)
 for i in range(61,72):builder.Add(terminal,faces[i])
 for so in items(d.shapes[116],TopAbs_SOLID):
  if vol(so)<.001:builder.Add(terminal,so)
 terminalmeta=mesh(terminal)
 q=np.load(OUT/'spring-curves.npz');src=q['source'];angles=q['angles'];curves=q['curves'];n=len(src)
 arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(src[:,:2],axis=0),axis=1))]
 weights=1-np.clip((arc-.60)/(arc[-1]-1.10),0,1)
 xy=curves[:,:,:2]-PIV['balance'][:2];a=np.deg2rad(angles)[:,None]*weights
 # De-rotate before interpolation. This preserves the whole inner rigid zone,
 # not merely the endpoint; the outer rigid zone remains exactly fixed.
 residual=np.stack((xy[:,:,0]*np.cos(a)+xy[:,:,1]*np.sin(a),-xy[:,:,0]*np.sin(a)+xy[:,:,1]*np.cos(a)),axis=2)
 springmeta=dict(id=occurrence(116)['id'],sourceMatrix=occurrence(116)['worldTransform'],pointCount=n,angles=angles.tolist(),weights=add(weights),residual=add(residual),z=float(src[0,2]),terminal=terminalmeta)
 cy=json.loads((HERE/'cycle.json').read_text())
 segments=[]
 for s in cy['segments']:
  order=np.argsort(s['pallet']);segments.append([[s['pallet'][i],s['escape'][i]] for i in order])
 config=dict(schemaVersion=1,sourceSha256=SOURCE_SHA,centers=CENTER,packets=packets,segments=segments,fork=dict(id=occurrence(126)['id'],**forkmeta),spring=springmeta)
 h=hashlib.sha256(data).hexdigest();file=f'movement-{h[:12]}.bin'
 target=ROOT/'explorer/public/models'/file;target.write_bytes(data)
 config.update(file='/models/'+file,sha256=h,byteLength=len(data))
 path=ROOT/'explorer/public/models/movement-runtime.json';path.write_text(json.dumps(config,indent=2)+'\n')
 record=dict(schemaVersion=1,source=train['source'],baselineCommit='4785cc2',runtimeInstalled=True,mechanicalCycleAccepted=False,inputs=inputs,generated={str(target.relative_to(ROOT)):h,str(path.relative_to(ROOT)):digest(path)},generator='scripts/cad/escapement-clearance/export_runtime.py',limitations=['Prescribed visual animation; no dynamics or operating-frequency claim','Mainsprings, arbors, ratchets, barrel I, motion works and hands remain static','Redistribution and publication gates remain uncleared'])
 (ROOT/'assets/source-manifest/running-movement.json').write_text(json.dumps(record,indent=2)+'\n')
 print(file,len(data),'bytes',n,'spring points',len(angles),'poses',flush=True)
if __name__=='__main__':run()
