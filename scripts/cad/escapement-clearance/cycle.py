from passage import *
from scipy.optimize import brentq
def make_cycle():
 q=np.load(HERE/'wheel-map.npz');ps,es,area,gap=q['pallet'],q['escape'],q['area'],q['gap']
 valid=(area<1e-12)&(gap>=.003)
 inds=np.where((ps>=-6.950001)&(ps<=6.950001))[0]
 prev=float(es[np.where(valid[inds[-1]]&(es<1)&(es>-2))[0][-1]])
 start=prev;out=[]
 for direction,indices in [('forward',inds[::-1]),('reverse',inds)]:
  pp=[];ee=[]
  for i in indices:
   okay=np.where(valid[i]&(es<=prev+.200001)&(es>=prev-.300001))[0]
   if not len(okay):raise ValueError(('No continuation',direction,ps[i],prev))
   prev=float(es[okay[-1]]);pp.append(float(ps[i]));ee.append(prev)
  # Retain the complete continuation, including its final banked position.
  out.append({'direction':direction,'pallet':pp,'escape':ee})
 print('escape cycle advance',prev-start,'start',start,'end',prev,flush=True)
 # Build constant-angular-speed diagnostic sweep (no frequency or dynamics claim).
 samples=[]
 for seg in out:
  bs=np.linspace(-180,180,1441)
  if seg['direction']=='reverse':bs=bs[::-1]
  for b in bs:
   p=float(law(b)) if abs(b)<=90 else -float(np.sign(b))*6.95
   order=np.argsort(seg['pallet']);pa=np.array(seg['pallet'])[order];ea=np.array(seg['escape'])[order]
   e=float(np.interp(p,pa,ea));samples.append({'direction':seg['direction'],'balance':float(b),'pallet':p,'escape':e})
 # Check dense section path against original two jewels, including drop transitions.
 bad=[];small=(1e9,None)
 for i,s in enumerate(samples):
  if abs(s['balance'])>30:continue
  w=rot(sec('233-0'),'escape',s['escape']);js=unary_union([rot(sec(f'128-{j}'),'pallet',CENTER['pallet']+s['pallet']) for j in [0,1]])
  overlap=w.intersection(js).area;g=w.distance(js)
  if overlap>1e-12:bad.append((i,overlap))
  if g<small[0]:small=(g,i)
 print('dense wheel section overlaps',len(bad),'min gap',small,flush=True)
 write('cycle.json',{'status':'authored kinematic candidate; no dynamics or maker acceptance','banksRelativeDegrees':6.95,'balanceAmplitudeDegrees':180,'amplitudeBasis':'authored diagnostic range, not inferred operating amplitude','escapeAdvanceDegrees':prev-start,'sectionSearchGapMm':.003,'segments':out,'samples':samples,'wheelSectionOverlapSamples':bad,'minimumWheelSectionGap':small})
 fig,axs=plt.subplots(1,2,figsize=(12,5))
 axs[0].pcolormesh(es,ps,np.where(valid,gap*1000,np.nan),cmap='Blues',shading='nearest',vmin=0,vmax=80)
 for seg in out:axs[0].plot(seg['escape'],seg['pallet'],label=seg['direction'],lw=2)
 axs[0].legend();axs[0].set(xlabel='Escape-wheel angle (°)',ylabel='Pallet angle from center (°)',title='Candidate two-swing path through original wheel/jewel sections')
 arr=np.array([[s['balance'],s['pallet'],s['escape']] for s in samples]);t=np.linspace(0,1,len(arr))
 for col,name in [(1,'pallet'),(2,'escape')]:axs[1].plot(t,arr[:,col],label=name)
 axs[1].set(xlabel='Normalized diagnostic cycle',ylabel='Angle (°)',title='Rigid shaft paths; not physical timing');axs[1].legend();fig.tight_layout();fig.savefig(HERE/'cycle-path.png',dpi=160)
if __name__=='__main__':make_cycle()
