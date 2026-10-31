"""Tooth-count cross-check and rejected static-follower boundaries, not new poses."""
from motion_works_sweep import *
from shapely.geometry import Point

def run():
 rs,by,pivots=train.setup();polys=train.sections(by);teeth=[];boundaries=[]
 for a,b,na,nb,z,oa,ob in PAIRS:
  for n,count,owner in [(a,na,oa),(b,nb,ob)]:
   module=.177 if n in [137,210,213] else .17 if n in [211,141] else .15 if n in [183,216] else .12
   profile=polys[f'{n}@{z}'];pitch=count*module/2
   outer=profile.difference(Point(pivots[owner][:2]).buffer(pitch,quad_segs=4096))
   lobes=[g for g in getattr(outer,'geoms',[outer]) if g.area>1e-8]
   assert len(lobes)==count,(n,len(lobes),count)
   teeth.append({'definition':n,'sourceDeclaredTeeth':count,'measuredLobesBeyondPitchCircle':len(lobes),'pitchRadiusMm':pitch,'sectionZMm':z})
  p,q=[polys[f'{n}@{z}'] for n in [a,b]]
  # Show why freezing the dependent meshed packet does not safely split this graph.
  rows=[]
  for angle in np.linspace(0,360/na,193):
   pp=rotate(p,float(angle),origin=tuple(pivots[oa][:2]));rows.append((float(pp.intersection(q).area),float(angle)))
  area,angle=max(rows)
  aa=moved(by[a]['shape'],matrix(pivots[oa],angle))
  boundaries.append({'moving':a,'heldStatic':b,'sampledPitchConfigurations':len(rows),'maximumSectionCommonMm2':area,'worstAngleDegrees':angle,'selectedWholeSolidCommonMm3':common(aa,by[b]['shape'])})
 # Full-turn envelope inventory against every original source neighbor, no claim of clearance for candidates.
 inventory=[]
 for name,ns in MEMBERS.items():
  for n in ns:
   r=by[n];bb=r['bounds'].copy();p=pivots[name];radius=float(np.linalg.norm(corners(bb)[:,:2]-p[:2],axis=1).max());bb[:,:2]=[p[:2]-radius,p[:2]+radius]
   candidates=[];excluded=0;unqualified=[]
   for f in rs:
    if f['id']==r['id']:continue
    if f['bounds'] is None or not f['valid'] or not items(f['shape'],TopAbs_SOLID):unqualified.append(f['id']);continue
    if np.any(bb[1]+.0001<f['bounds'][0]) or np.any(f['bounds'][1]+.0001<bb[0]):excluded+=1
    else:candidates.append({'id':f['id'],'definition':f['n']})
   inventory.append({'id':r['id'],'definition':n,'fullTurnConservativeBoxMm':bb.tolist(),'boundedDisjointNeighbors':excluded,'unqualifiedSourceNeighbors':unqualified,'candidateNeighborsNotQualified':candidates})
 save_motion('boundaries.json',{'teeth':teeth,'staticFollowerRejections':boundaries,'neighborInventory':inventory,'scope':'Full-turn conservative BRep boxes versus fixed displayed source neighbors, plus selected exact static-follower collisions. Candidate neighbors and moving pairs are not certified; exhaustive sweeps stop at confirmed mesh blockers.'})
 print(json.dumps(boundaries,indent=2),flush=True)
if __name__=='__main__':run()
