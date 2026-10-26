"""Local diagnostic preview, never an application route or runtime asset."""
from spring import *
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from PIL import Image
from io import BytesIO

def run():
 d=Data();src,arcs=coil_source(d)
 sys.path.insert(0,str(ROOT/'scripts/cad'))
 from export_assembly import tessellate
 fs=items(d.world(116),TopAbs_FACE,TopoDS.Face_s)
 terminal=[]
 for f in fs[61:72]:
  mesh,_,missing,_=tessellate(f,.002,.10);assert missing==0
  terminal.extend(mesh.vertices[mesh.faces][:,:,:2])
 collet=section(d.world(115),-3.25,tol=.00002)
 fig,axs=plt.subplots(1,2,figsize=(11,5.7),dpi=100)
 for ax in axs:
  ax.set_aspect('equal');ax.set_facecolor('#faf9f6');ax.grid(alpha=.15)
  ax.add_collection(PolyCollection(terminal,color='#c69248',linewidth=0,zorder=3))
  ax.plot(src[:,0],src[:,1],color='#b7bdc2',alpha=.5,lw=.55,zorder=1)
  ax.set_xlabel('World X (mm)');ax.set_ylabel('World Y (mm)')
 axs[0].set(xlim=(-4,4),ylim=(-14,-6),title='Hairspring • full sampled amplitude')
 axs[1].set(xlim=(-.85,.85),ylim=(-10.85,-9.15),title='Collet attachment • magnified')
 polys=[ax.fill([],[],color='#226a8a',zorder=2)[0] for ax in axs]
 collars=[ax.fill([],[],color='#7e8588',zorder=3)[0] for ax in axs]
 dots=[ax.plot([],[],'o',color='#e36545',ms=4,zorder=5)[0] for ax in axs]
 title=fig.suptitle('')
 fig.text(.5,.045,'Blue: deforming original-size strip    Gold: unchanged raised terminal    Grey: source coil / rotating collet',ha='center',fontsize=9)
 fig.text(.5,.015,'Offline geometric illustration • slowed 8-second loop • no force, frequency or app integration claim',ha='center',fontsize=9,color='#555')
 fig.tight_layout(rect=[0,.11,1,.94]);frames=[];coeff=None;solved=[];residuals=[]
 # Solve each displayed frame; do not linearly interpolate unrelated vertices.
 for k in range(81):
  angle=CENTER['balance']-180*np.cos(2*np.pi*k/80)
  points,coeff,metrics=deform(src,angle,coeff);solved.append(points);residuals.append(metrics['endpointResidualMm'])
  poly=ribbon(points);coll=rot(collet,'balance',angle)
  for p,c,dot in zip(polys,collars,dots):
   p.set_xy(np.array(poly.exterior.coords));c.set_xy(np.array(coll.exterior.coords));dot.set_data([points[0,0]],[points[0,1]])
  title.set_text(f'Hairspring feasibility study  |  balance {round(angle-CENTER["balance"]):+d}° from candidate centre')
  stream=BytesIO();fig.savefig(stream,format='png');stream.seek(0);frame=Image.open(stream).convert('RGB');frames.append(frame.copy())
  if k==20:frame.save(OUT/'spring-preview.png')
 frames[0].save(OUT/'spring-preview.gif',save_all=True,append_images=frames[1:-1],duration=100,loop=0)
 looperror=float(np.max(np.linalg.norm(solved[0]-solved[-1],axis=1)))
 reverseerror=max(float(np.max(np.linalg.norm(solved[i]-solved[80-i],axis=1))) for i in range(41))
 assert looperror<1e-6 and reverseerror<1e-6
 save('spring-preview-checks.json',{'solvedFramesIncludingRepeatedEnd':81,'displayedFrames':80,
  'loopPositionResidualMm':looperror,'forwardReversePositionResidualMm':reverseerror,'maximumEndpointResidualMm':max(residuals)})
 # Three source-matched, high-resolution static diagnostic states.
 plt.close(fig)
 print('wrote spring-preview.gif and spring-preview.png',flush=True)

if __name__=='__main__':run()
