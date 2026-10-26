from study import *
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
from itertools import combinations,product
def bounds(sh):
 b=Bnd_Box();BRepBndLib.AddOptimal_s(sh,b,False,True);x0,y0,z0,x1,y1,z1=b.Get();return np.array(list(product([x0,x1],[y0,y1],[z0,z1])))
def run():
 d=Data();cm=json.loads(subprocess.check_output(['git','show',HISTORICAL_REF+':docs/escapement/components.json']))
 modified=TopoDS_Shape();assert BRepTools.Read_s(modified,str(HERE/'candidate-fork.brep'),BRep_Builder())
 members=[];excluded=[]
 for c in cm['components']:
  if c['owner'] not in PIV:continue
  n=int(c['definitionId'].split('_')[-1])
  if not c['brepValid']:excluded.append(c['id']);continue
  sh=moved(modified if n==126 else d.shapes[n],c['worldTransform'])
  members.append({'id':c['id'],'n':n,'owner':c['owner'],'shape':sh,'corners':bounds(sh)})
 core={tuple(sorted(p)) for p in [(112,126),(114,126),(114,130),(112,130),(114,129),(112,129),(233,128)]}
 pairs=[(i,j) for i,j in combinations(range(len(members)),2) if members[i]['owner']!=members[j]['owner'] and tuple(sorted((members[i]['n'],members[j]['n']))) not in core]
 samples=json.loads((HERE/'cycle.json').read_text())['samples'];indices=sorted(set(range(0,len(samples),80))|{len(samples)-1})
 rows=[];summary={};exclusions=0
 for k,idx in enumerate(indices):
  s=samples[idx];posed=[]
  for member in members:
   angle=s[member['owner']]+CENTER[member['owner']];m=matrix(PIV[member['owner']],angle)
   corners=member['corners']@m[:3,:3].T+m[:3,3]
   posed.append({'shape':moved(member['shape'],m),'lo':corners.min(axis=0),'hi':corners.max(axis=0)})
  for i,j in pairs:
   aa,bb=posed[i],posed[j];key=f'{members[i]["n"]}:{members[i]["id"].split("__")[-1]} / {members[j]["n"]}:{members[j]["id"].split("__")[-1]}'
   if np.any(aa['hi']+.0001<bb['lo']) or np.any(bb['hi']+.0001<aa['lo']):exclusions+=1;continue
   gap=dist(aa['shape'],bb['shape']);v=common(aa['shape'],bb['shape']) if gap<1e-6 else 0.
   if key not in summary:summary[key]={'minimumGapMm':gap,'maximumCommonMm3':v,'sample':idx,'exactChecks':0}
   z=summary[key];z['exactChecks']+=1
   if gap<z['minimumGapMm']:z['minimumGapMm']=gap;z['sample']=idx
   z['maximumCommonMm3']=max(v,z['maximumCommonMm3'])
   if v>1e-10:rows.append({'sample':idx,'pair':key,'commonVolumeMm3':v})
  if k%10==0:print('cross sample',k,'/',len(indices),'overlaps',len(rows),flush=True)
 write('cross-summary.json',{'scope':'Remaining cross-shaft pairs of 14 valid rigid leaves; 8 core pairs checked separately at 308 poses; 4 invalid eccentric BReps excluded; static supports not covered','sampleCount':len(indices),'pairsPerSample':len(pairs),'broadPhaseExclusions':exclusions,'excludedInvalidLeafIds':excluded,'pairs':summary,'overlaps':rows})
 print('done exact checks',sum(x['exactChecks'] for x in summary.values()),'overlaps',len(rows),flush=True)
if __name__=='__main__':run()
