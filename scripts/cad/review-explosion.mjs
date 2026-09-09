import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
export function reviewExplosion({v,THREE,initialState,load,ROOT,parts,results}) {
 const {EXPLOSION:e,explosionOffsets,stageProgress}=load('explorer/src/experience/explosion.ts');
 const prefix='p_0_1_1_1__0_1_1_1_4__0_1_1_83_';
 const movement=parts.filter(p=>p.id.startsWith(prefix)&&!p.isAssembly);
 assert.equal(e.parts.length,223); assert.equal(new Set(e.parts.map(p=>p.id)).size,223);
 assert.deepEqual(e.parts.map(p=>p.id).sort(),movement.map(p=>p.id).sort());
 const byId=new Map(parts.map(p=>[p.id,p]));const hosts=new Map(e.hosts.map(h=>[h.id,h]));
 for(const h of e.hosts){assert.ok(byId.has(h.frameId));assert.ok(Math.abs(Math.hypot(...h.directionLocal)-1)<1e-8);const seen=new Set([h.id]);let parent=h.parent;while(parent){assert.ok(!seen.has(parent));seen.add(parent);parent=hosts.get(parent).parent;}}
 for(const p of e.parts){assert.ok(hosts.has(p.host));assert.ok(p.evidence&&p.confidence);}
 results.push({check:'all 223 source movement leaves have one explicit evidenced host/rule; host graph is acyclic',status:'pass'});
 const analytic=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/explode-cad/screw-directions.json')));
 const screws=e.parts.filter(p=>p.rule==='release');assert.equal(screws.length,49);
 for(const p of screws){const evidence=analytic.screws[p.id];assert.ok(evidence);assert.ok(evidence.headBeyondShankMm>0);assert.ok(evidence.headFace.radiusMm>evidence.shankFace.radiusMm);assert.ok(evidence.coaxialSeatCandidates.length);assert.ok(new THREE.Vector3(...p.directionLocal).distanceTo(new THREE.Vector3(...evidence.localOutwardDirection))<1e-12);}
 results.push({check:'all 49 released screws agree with original STEP head/shank polarity and coaxial seat evidence',status:'pass'});
 const source=JSON.stringify(parts); const snapshots=new Map();
 const samples=[...new Set([...e.hosts.flatMap(h=>h.stage),0,.1,.2,.3,.35,.5,.52,.55,.6,.65,.7,.72,1,...Array.from({length:101},(_,i)=>i/100)])].sort((a,b)=>a-b);
 for(const separation of [...samples,...samples.toReversed()]){
  const offsets=explosionOffsets(parts,{...initialState,separation});
  const serialized=JSON.stringify([...offsets]);
  if(snapshots.has(separation))assert.equal(serialized,snapshots.get(separation));else snapshots.set(separation,serialized);
  for(const p of e.parts){const o=offsets.get(p.id);assert.ok(o.every(Number.isFinite));if(!separation)assert.ok(o.every(n=>n===0));
   if(p.rule==='attached'){
    const peer=e.parts.find(q=>q.host===p.host&&q.rule==='attached');assert.deepEqual(o,offsets.get(peer.id));
   }
  }
 }
 assert.equal(JSON.stringify(parts),source);
 results.push({check:'101 progression samples plus every authored boundary reverse deterministically, preserve attached packets and immutable source matrices',status:'pass'});
 const offset=p=>explosionOffsets(parts,{...initialState,separation:p});
 for(const suffix of ['54__0_1_1_194_11','54__0_1_1_194_12']){
  const id=prefix+suffix; const axis=analytic.screws[id].worldOutwardDirection;
  for(const p of samples){const d=new THREE.Vector3(...offset(p).get(id));assert.ok(Math.abs(d.z)<1e-12);assert.ok(d.clone().cross(new THREE.Vector3(...axis)).length()<1e-10);assert.ok(d.dot(new THREE.Vector3(...axis))>=0);}
 }
 const clamp=prefix+'59__0_1_1_221_7'; const regulator=prefix+'59__0_1_1_221_1';
 const full=offset(1); const relative=new THREE.Vector3(...full.get(clamp)).sub(new THREE.Vector3(...full.get(regulator)));
 assert.ok(relative.distanceTo(new THREE.Vector3(0,-2.8,0))<1e-9);
 const release=offset(.2);assert.equal(release.get(regulator)[2],0);assert.ok(release.get(clamp)[1]<-2.79);
 assert.equal(offset(.52).get(prefix+'1__0_1_1_84_1')[2],0);
 assert.ok(offset(.52).get(prefix+'60__0_1_1_227_1')[2]<-16.99);
 assert.ok(Math.abs(full.get(prefix+'58__0_1_1_218_1')[2]+23)<1e-8);
 for(const h of e.hosts)for(const p of h.stage){assert.ok(Math.abs(stageProgress(p+1e-7,h.stage)-stageProgress(p-1e-7,h.stage))<1e-9);}
 assert.ok(offset(.42).get(prefix+'53')[2]>3.49);assert.equal(offset(.42).get(prefix+'27')[0],0);assert.ok(offset(.7).get(prefix+'27')[0]>7.99);assert.ok(offset(.7).get(prefix+'5').every(n=>n===0));
 results.push({check:'radial screws remain horizontal/outward; clamp releases before intact regulator lifts; barrels wait for bridge clearance; child host adds once; stages are smooth',status:'pass'});
 v.reduced=true;v.reset();v.applyPose(0);v.reduced=false;
 v.patch({separation:1});v.applyPose(.1);
 assert.equal(v.renderParts.get(regulator).offset.z,0,'Endpoint travel must execute screw-release stage before bridge motion');
 const before=new Map([...v.renderParts].map(([id,p])=>[id,p.mesh.matrix.clone()]));v.scrub({separation:0});v.applyPose(0);
 for(const [id,matrix]of before)assert.ok(v.renderParts.get(id).mesh.matrix.equals(matrix),'Reversal starts exactly at displayed matrix');
 for(let i=0;i<120;i++)v.applyPose(1/60);assert.equal(v.assemblyError(),0);
 results.push({check:'actual controller traverses stages during endpoint animation and retargets reversal without a displayed-pose jump',status:'pass'});
 v.reduced=true;v.reset();v.applyPose(0);v.reduced=false;
}
