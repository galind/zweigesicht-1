"""Record exact train ratios and cycle seams without creating runtime assets."""
from train_coupling import *
from math import lcm

def run():
 _,by,pivots=setup();cycle=json.loads((HERE/'cycle.json').read_text())
 first,last=cycle['samples'][0],cycle['samples'][-1]
 assert abs(last['escape']-first['escape']-18)<1e-9
 assert first['balance']==last['balance'] and first['pallet']==last['pallet']
 for a,b,na,nb,z,oa,ob in PAIRS:
  assert RATIOS[ob]==-RATIOS[oa]*Fraction(na,nb)
 repeat=lcm(*(r.denominator for r in RATIOS.values()));packets=[]
 for name,ratio in RATIOS.items():
  seam=float(ratio)*(last['escape']-first['escape']-18)
  assert abs(seam)<1e-9
  packets.append({'name':name,'ratioToEscape':str(ratio),
   'advanceDegreesPerBalanceCycle':str(ratio*18),'worldPivotMm':pivots[name].tolist(),
   'seamResidualDegrees':seam,'turnsPerWholeTrainRepeat':str(ratio*repeat),
   'members':[{'definition':n,'id':by[n]['id'],'name':by[n]['name']} for n in MEMBERS[name]]})
 save_train('kinematics.json',{'phaseSha256':digest(ROOT/'assets/authored/wheel-display-poses.json'),
  'cycleSha256':digest(HERE/'cycle.json'),
  'rule':'E(n,u) = 18*n + localEscape(u); theta(packet) = ratio * E, applied about the world +Z source axis after current display poses',
  'timing':'Prescribed common scalar phase; no frequency, force or smooth time interpolation solved here',
  'cycleEscapeEndpointsDegrees':[first['escape'],last['escape']],
  'wholeTrainRepeatEscapeRevolutions':repeat,'wholeTrainRepeatBalanceCycles':repeat*20,
  'packets':packets,'excludedFromRigidDrive':['Both mainsprings and arbors','Barrel I and ratchets','Motion works, dials and hands']})
 print('ratios and seams verified; whole-train repeat:',repeat,'escape turns',flush=True)

if __name__=='__main__':run()
