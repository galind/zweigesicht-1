from passage import *
from matplotlib.patches import Polygon as Patch
from PIL import Image
def run():
 d=Data();p=json.loads((HERE/'passage.json').read_text());c=json.loads((HERE/'candidate-solid.json').read_text());cy=json.loads((HERE/'cycle.json').read_text())
 body=shapely.from_wkt(p['sourceBodyWkt']);cut=shapely.from_wkt(c['cutterWkt']);corrected=body.difference(cut);removed=body.intersection(cut);bm=np.array(d.occ(126)[0]['worldTransform'])
 fig,axs=plt.subplots(1,2,figsize=(10,5),dpi=100);frames=[]
 for k in range(241):
  t=k/240;b=-180*np.cos(2*np.pi*t);pallet=float(law(b)) if abs(b)<=90 else -float(np.sign(b))*6.95
  seg=cy['segments'][0 if t<.5 else 1];order=np.argsort(seg['pallet']);e=float(np.interp(pallet,np.array(seg['pallet'])[order],np.array(seg['escape'])[order]))
  pm=matrix(PIV['pallet'],CENTER['pallet']+pallet)@bm
  shapes=[(rot(sec('233-0'),'escape',e),'#c1ad76'),(af(corrected,pm),'#819dab')]+[(rot(sec(f'128-{i}'),'pallet',CENTER['pallet']+pallet),'#c13859') for i in [0,1]]
  imp=rot(sec('112-0'),'balance',CENTER['balance']+b);shapes.append((imp,'#b51f46'))
  for ax in axs:ax.clear();ax.set_aspect('equal');ax.grid(alpha=.15)
  for poly,color in shapes:
   for g in ([poly] if poly.geom_type=='Polygon' else poly.geoms):
    axs[0].fill(*g.exterior.xy,color=color,edgecolor='#37474f',lw=.6)
    for hole in g.interiors:axs[0].fill(*hole.xy,color='white')
  for own in ['pallet','escape','balance']:axs[0].plot(*PIV[own][:2],'+',color='#172b3a',ms=8)
  axs[0].set(xlim=(-5.8,1.6),ylim=(-11,-.5),title=f'Original wheel and jewels\nEscape advance {e-cy["segments"][0]["escape"][0]:.2f}°',xlabel='World X (mm)',ylabel='World Y (mm)')
  axs[1].fill(*corrected.exterior.xy,color='#819dab',edgecolor='#37474f',lw=.6)
  for g in ([removed] if removed.geom_type=='Polygon' else removed.geoms):axs[1].fill(*g.exterior.xy,color='#e58b94',alpha=.65)
  j=af(imp,np.linalg.inv(pm));axs[1].fill(*j.exterior.xy,color='#b51f46',edgecolor='#37474f',lw=.6)
  axs[1].set(xlim=(2.15,3.4),ylim=(-.65,.65),title='Jewel passage · moving fork frame\nPink: removed source material',xlabel='Fork-local X (mm)',ylabel='Fork-local Y (mm)')
  for ax in axs:ax.title.set_fontsize(10)
  fig.suptitle('Escapement clearance study · one slowed illustrative cycle\nAuthored motion; hairspring and full train not simulated',fontsize=12)
  fig.tight_layout(rect=(0,0,1,.91));fig.canvas.draw();frames.append(Image.fromarray(np.asarray(fig.canvas.buffer_rgba())[:,:,:3].copy()).convert('P',palette=Image.Palette.ADAPTIVE,colors=96))
  if k==60:Image.fromarray(np.asarray(fig.canvas.buffer_rgba())[:,:,:3]).save(HERE/'cycle-preview.png')
 # One pass: the escape shaft advances 18 degrees and must not snap back on GIF replay.
 # A running implementation accumulates that angle across cycles.
 frames[0].save(HERE/'cycle-preview.gif',save_all=True,append_images=frames[1:],duration=50,optimize=False)
 print('saved 241 frames, one 12-second pass without resetting the wheel',flush=True)
if __name__=='__main__':run()
