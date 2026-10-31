from search_cycle import *
from scipy.spatial import cKDTree
def law(b,bank=6.95):
 # In the centered fork frame, the jewel center has
 # y = 3.1*sin(p) + .695*sin(b-p). Set y=0, then limit the pallet throw.
 # This constructs an illustrative path; it is not a contact/torque solution.
 r=np.deg2rad(b);return np.clip(-np.rad2deg(np.arctan2(.695*np.sin(r),3.1-.695*np.cos(r))),-bank,bank)
def run():
 d=Data();base=np.array(d.occ(126)[0]['worldTransform']);inv=np.linalg.inv(matrix(PIV['pallet'],CENTER['pallet'])@base)
 body=af(rot(sec('126-0'),'pallet',CENTER['pallet']),inv)
 # During each swing, pallet stays on its outgoing bank after the impulse jewel exits.
 # Return swing mirrors this path; changing bank happens only near central passage.
 bs=np.linspace(-100,100,1601);ps=law(bs)
 path=[]
 for b,p in zip(bs,ps):
  j=af(rot(sec('112-0'),'balance',CENTER['balance']+b),np.linalg.inv(matrix(PIV['pallet'],CENTER['pallet']+p)@base))
  path.append(j)
 sweep=unary_union(path)
 clearance=.002
 cutter=sweep.buffer(clearance,quad_segs=16)
 changed=body.difference(cutter);removed=body.intersection(cutter)
 write('passage.json',{'balance':bs.tolist(),'pallet':ps.tolist(),'law':'p=-atan2(0.695 sin(b),3.1-0.695 cos(b)), clipped at +/-6.95 deg; authored center-following path','clearanceMm':clearance,'sectionZMm':-1.85,'sourceBodyWkt':body.wkt,'sweepWkt':sweep.wkt,'cutterWkt':cutter.wkt,'candidateWkt':changed.wkt,'removedAreaMm2':removed.area})
 print('removed area',removed.area,'body area',body.area,'fraction',removed.area/body.area,flush=True)
 regions=[removed] if removed.geom_type=='Polygon' else list(removed.geoms)
 print('regions',[(p.area,p.bounds) for p in regions],flush=True)
 fig,axs=plt.subplots(1,2,figsize=(12,5))
 for ax in axs:
  ax.fill(*body.exterior.xy,color='#c7d6df')
  for g in regions:ax.fill(*g.exterior.xy,color='#cc3658')
  ax.plot(*changed.exterior.xy,color='#15576d',lw=1)
  ax.set(aspect='equal',xlabel='Body-local X (mm)',ylabel='Body-local Y (mm)')
 axs[0].set(xlim=(2.2,2.9),ylim=(-.45,.45),title='Red: proposed removed material; 2 µm clearance')
 axs[1].set(xlim=(2.29,2.39),ylim=(-.22,.22),title='Fork-floor detail')
 fig.suptitle('Experimental swept-slot correction · original jewel and shaft axes preserved');fig.tight_layout();fig.savefig(HERE/'passage-correction.png',dpi=170)
 # Source rigid contact-context sections, all at valid shared axial levels.
 context={}
 for n,z in [(114,-1.82),(130,-1.82),(114,-1.6),(130,-1.6),(129,-2.0)]:
  try:context[f'{n}:{z}']=section(d.world(n),z).wkt
  except Exception as e: print(n,z,e)
 write('context-sections.json',context)
 rows=[]
 for b,p in zip(bs[::4],ps[::4]):
  vals={}
  for z in [-1.82,-1.6]:
   if f'114:{z}' in context and f'130:{z}' in context:
    a=rot(shapely.from_wkt(context[f'114:{z}']),'balance',CENTER['balance']+b);q=rot(shapely.from_wkt(context[f'130:{z}']),'pallet',CENTER['pallet']+p)
    vals[str(z)]={'area':a.intersection(q).area,'gap':a.distance(q)}
  rows.append({'balance':float(b),'pallet':float(p),'rollerSafetySections':vals})
 write('passage-safety.json',rows)
 print('roller/safety intersecting samples',sum(any(v['area']>1e-10 for v in r['rollerSafetySections'].values()) for r in rows),'/',len(rows),flush=True)
if __name__=='__main__':run()
