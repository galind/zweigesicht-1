from study import *
from shapely.affinity import affine_transform
from shapely.geometry import box
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
S=json.loads((HERE/'sections.json').read_text())
def sec(k):return shapely.from_wkt(S[k]['wkt'])
def af(poly,m):return affine_transform(poly,[m[0,0],m[0,1],m[1,0],m[1,1],m[0,3],m[1,3]])
def fork():
 d=Data();bm=matrix(PIV['pallet'],CENTER['pallet'])@np.array(d.occ(126)[0]['worldTransform']);inv=np.linalg.inv(bm)
 body=af(rot(sec('126-0'),'pallet',CENTER['pallet']),inv)
 bs=np.arange(-60,60.0001,.25);ps=np.arange(-6.95,6.95001,.025)
 # All candidates represented in pallet's centered body frame.
 jewels=np.array([af(rot(sec('112-0'),'balance',CENTER['balance']+b),inv) for b in bs],dtype=object)
 bodies=np.array([rotate(body,-p,origin=(0,0)) for p in ps],dtype=object)
 # A 50 um relief is an exploratory ceiling, not an accepted modification.
 cut=body.difference(box(2.30,-.19000001,2.351,.19000001))
 cuts=np.array([rotate(cut,-p,origin=(0,0)) for p in ps],dtype=object)
 needed=np.full((len(bs),len(ps)),np.inf)
 for i,j in enumerate(jewels):
  free=shapely.area(shapely.intersection(cuts,j))<1e-12
  inds=np.where(free)[0]
  for k in inds:
   # Return jewel to the actual pallet body frame for a scalar floor-relief bound.
   jj=rotate(j,ps[k],origin=(0,0));over=jj.intersection(body)
   needed[i,k]=0 if over.is_empty or over.area<1e-12 else max(0,2.35-over.bounds[0])
  if i%100==0:print('fork row',i,'/',len(bs),flush=True)
 np.savez(HERE/'fork-map.npz',balance=bs,pallet=ps,needed=needed)
 # Minimax path across ordered balance positions; no jumps between distant pallet angles.
 # Slope limit 1 pallet degree/balance degree is a search choice, not physics.
 from scipy.ndimage import minimum_filter1d
 cost=np.full(len(ps),np.inf);cost[-3:]=needed[0,-3:];parents=[]
 for row in needed[1:]:
  nxt=np.maximum(row,minimum_filter1d(cost,size=21,mode='constant',cval=np.inf));parents.append(cost.copy());cost=nxt
 k=int(np.argmin(cost[:3]));best=float(cost[k]);path=[k]
 for prev in parents[::-1]:
  lo=max(0,k-10);hi=min(len(ps),k+11);k=lo+int(np.argmin(prev[lo:hi]));path.append(k)
 path=ps[path[::-1]]
 print('fork minimax relief mm',best,flush=True)
 write('fork-path.json',{'searchBalanceStepDegrees':.25,'searchPalletStepDegrees':.025,'banksDegrees':6.95,'slopeBound':1,'minimumSampledReliefMm':best if np.isfinite(best) else None,'balance':bs.tolist(),'pallet':path.tolist() if np.isfinite(best) else None,'conclusion':'sampled path exists' if np.isfinite(best) else 'no sampled floor-only path between the prescribed banked endpoints'})
 fig,ax=plt.subplots(figsize=(10,5));im=ax.pcolormesh(bs,ps,np.where(np.isfinite(needed),needed*1000,np.nan).T,vmin=0,vmax=50,cmap='viridis',shading='nearest');fig.colorbar(im,label='Required slot-floor relief (µm)')
 if np.isfinite(best):ax.plot(bs,path,'r-',lw=1)
 ax.set(xlabel='Balance angle from centered candidate (°)',ylabel='Pallet angle from centered candidate (°)',title='Sampled jewel/fork passage · 50 µm floor-relief search ceiling');fig.tight_layout();fig.savefig(HERE/'fork-map.png',dpi=160)
def wheel():
 ps=np.arange(-7,7.0001,.05);es=np.arange(-18,18.0001,.05)
 wheels=np.array([rot(sec('233-0'),'escape',e) for e in es],dtype=object)
 areas=np.zeros((len(ps),len(es)));gaps=np.zeros_like(areas)
 for i,p in enumerate(ps):
  js=unary_union([rot(sec(f'128-{n}'),'pallet',CENTER['pallet']+p) for n in [0,1]])
  areas[i]=shapely.area(shapely.intersection(wheels,js));gaps[i]=shapely.distance(wheels,js)
  if i%50==0:print('wheel row',i,'/',len(ps),flush=True)
 np.savez(HERE/'wheel-map.npz',pallet=ps,escape=es,area=areas,gap=gaps)
 fig,ax=plt.subplots(figsize=(11,6));im=ax.pcolormesh(es,ps,np.where(areas<1e-11,gaps*1000,np.nan),cmap='viridis',vmin=0,vmax=80,shading='nearest');fig.colorbar(im,label='Nominal section gap (µm)');ax.set(xlabel='Escape-wheel angle from source (°)',ylabel='Pallet angle from centered candidate (°)',title='Original escape wheel / both original pallet jewels · sampled free configurations');fig.tight_layout();fig.savefig(HERE/'wheel-map.png',dpi=160)
if __name__=='__main__':
 if sys.argv[1]=='fork':fork()
 else:wheel()
