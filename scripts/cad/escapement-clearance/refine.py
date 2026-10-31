from passage import *
def run():
 d=Data();candidate=TopoDS_Shape();assert BRepTools.Read_s(candidate,str(HERE/'candidate-fork.brep'),BRep_Builder())
 worldbody=moved(candidate,d.occ(126)[0]['worldTransform']);base=np.array(d.occ(126)[0]['worldTransform'])
 refined={}
 for n,i,z in [(112,0,-1.85),(233,0,-1.82),(128,0,-1.82),(128,1,-1.82)]:refined[f'{n}-{i}']=section(d.world(n,i),z,tol=.00002)
 bodysection=section(worldbody,-1.85,tol=.00002);inv=np.linalg.inv(base);localbody=af(bodysection,inv)
 cy=json.loads((HERE/'cycle.json').read_text());minimum={'fork':1e9,'wheel':1e9};bad=[];counts={'fork':0,'wheel':0}
 for direction in ['forward','reverse']:
  seg=next(s for s in cy['segments'] if s['direction']==direction);order=np.argsort(seg['pallet']);pa=np.array(seg['pallet'])[order];ea=np.array(seg['escape'])[order]
  for b in np.arange(-180,180.00001,.125):
   p=float(law(b)) if abs(b)<=90 else -float(np.sign(b))*6.95;e=float(np.interp(p,pa,ea))
   j=af(rot(refined['112-0'],'balance',CENTER['balance']+b),np.linalg.inv(matrix(PIV['pallet'],CENTER['pallet']+p)@base))
   g=localbody.distance(j);a=localbody.intersection(j).area;counts['fork']+=1;minimum['fork']=min(g,minimum['fork'])
   if a>1e-12:bad.append({'direction':direction,'b':float(b),'pair':'fork','area':a})
   if abs(b)>30:continue
   w=rot(refined['233-0'],'escape',e);js=unary_union([rot(refined[f'128-{i}'],'pallet',CENTER['pallet']+p) for i in [0,1]])
   g=w.distance(js);a=w.intersection(js).area;counts['wheel']+=1;minimum['wheel']=min(g,minimum['wheel'])
   if a>1e-12:bad.append({'direction':direction,'b':float(b),'pair':'wheel','area':a})
  print('refined sections',direction,'min',minimum,'overlaps',len(bad),flush=True)
 write('refined-sections.json',{'curveChordSamplingToleranceMm':.00002,'balanceSamplingStepDegrees':.125,'counts':counts,'minimumGapMm':minimum,'overlaps':bad,'scope':'Nominal section checks only; no continuous clearance proof'})
 # Verify both jewels at representative tight/drop/bank configurations for every tooth.
 solid=json.loads((HERE/'solid-samples.json').read_text());ids=set()
 for name in ['wheel-jewel3','wheel-jewel4']:
  for direction in ['forward','reverse']:
   a=[r for r in solid if r['direction']==direction];ids.add(min(a,key=lambda r:r['pairs'][name]['gapMm'])['sample'])
 for seg in cy['segments']:
  for target in [0,len(seg['pallet'])-1]:
   p=seg['pallet'][target];e=seg['escape'][target]
   ids.add(min(range(len(cy['samples'])),key=lambda i:abs(cy['samples'][i]['pallet']-p)+abs(cy['samples'][i]['escape']-e)))
 rows=[]
 for idx in sorted(ids):
  s=cy['samples'][idx];p=CENTER['pallet']+s['pallet'];js=[turn(d.world(128,i),'pallet',p) for i in [0,1]]
  for tooth in range(20):
   w=turn(d.world(233),'escape',s['escape']+18*tooth);gs=[dist(w,j) for j in js]
   rows.append({'sample':idx,'toothOffset':tooth,'gapsMm':gs})
  print('full wheel revolution sample',idx,'done',flush=True)
 write('tooth-repetition.json',{'configurationCount':len(ids),'toothOffsets':20,'originalSolidDistances':rows,'minimumGapMm':min(min(r['gapsMm']) for r in rows)})
 # Only material removal: independently check candidate minus original source.
 op=boolean(candidate,d.shapes[126],BRepAlgoAPI_Cut)
 write('material-change-check.json',{'candidateMinusSourceVolumeMm3':vol(op.Shape()),'candidateMinusSourceSolidCount':len(items(op.Shape(),TopAbs_SOLID)),'candidateIsValid':BRepCheck_Analyzer(candidate).IsValid(),'candidateSolidCount':len(items(candidate,TopAbs_SOLID))})
if __name__=='__main__':run()
