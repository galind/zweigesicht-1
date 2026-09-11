import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
export function reviewExplosion({v,THREE,initialState,load,ROOT,parts,results}) {
 const {EXPLOSION:e,COMPLETE_SEPARATION:complete,explosionOffsets}=load('explorer/src/experience/explosion.ts');
 const prefix='p_0_1_1_1__0_1_1_1_4__0_1_1_83_';
 const movement=parts.filter(p=>p.id.startsWith(prefix)&&!p.isAssembly);
 assert.equal(complete.parts.length,223);assert.equal(new Set(complete.parts.map(p=>p.id)).size,223);
 assert.deepEqual(complete.parts.map(p=>p.id).sort(),movement.map(p=>p.id).sort());
 const source=JSON.stringify(parts);const layout=new Map(complete.parts.map(p=>[p.id,p]));
 const analytic=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/explode-cad/screw-directions.json')));
 for(const p of e.parts.filter(p=>p.rule==='release')) {
  const evidence=analytic.screws[p.id];assert.ok(evidence.headBeyondShankMm>0);assert.ok(evidence.headFace.radiusMm>evidence.shankFace.radiusMm);
 }
 const samples=Array.from({length:101},(_,i)=>i/100);const snapshots=new Map();
 for(const separation of [...samples,...samples.toReversed()]) {
  const offsets=explosionOffsets(parts,{...initialState,separation});const serialized=JSON.stringify([...offsets]);
  if(snapshots.has(separation))assert.equal(serialized,snapshots.get(separation));snapshots.set(separation,serialized);
  const {displayFace}=load('explorer/src/experience/dials.ts');
  assert.equal(offsets.size,223+parts.filter(p=>!p.isAssembly&&displayFace(p.id)).length);
  for(const p of complete.parts) {
   const offset=offsets.get(p.id);assert.ok(offset.every(Number.isFinite));
   for(let i=0;i<3;i++)assert.ok(Math.abs(offset[i]-p.offsetMm[i]*separation)<1e-12,'Every part uses exactly the same progression');
   if(!separation||p.id===complete.fixedPlate)assert.ok(offset.every(n=>n===0));
   else assert.ok(offset.some(n=>n!==0),'Every non-reference leaf participates');
  }
 }
 assert.equal(JSON.stringify(parts),source);
 results.push({check:'all 223 exact source leaves participate in one simultaneous reversible progression; 101 samples preserve immutable source and exact fixed plate',status:'pass'});
 const axial=complete.parts.filter(p=>!p.radialSeat);let pairs=0;
 for(let i=0;i<axial.length;i++)for(let j=i+1;j<axial.length;j++) {
  const a=axial[i],b=axial[j],A=a.boundsWorldMm,B=b.boundsWorldMm;
  if(![0,1].every(k=>Math.min(A[1][k],B[1][k])>Math.max(A[0][k],B[0][k])))continue;
  pairs++;
  const lower=A[0][2]+a.offsetMm[2]<B[0][2]+b.offsetMm[2]?a:b,upper=lower===a?b:a;
  assert.ok(upper.boundsWorldMm[0][2]+upper.offsetMm[2]-lower.boundsWorldMm[1][2]-lower.offsetMm[2]>=complete.gapMm-1e-9,'Full source extents clear at endpoint');
  assert.ok(upper.offsetMm[2]>=lower.offsetMm[2],'Upper part cannot be overtaken');
  if(A[1][2]<B[0][2]-1e-6)assert.ok(a.offsetMm[2]<=b.offsetMm[2],'Already separate source intervals cannot collapse');
  if(B[1][2]<A[0][2]-1e-6)assert.ok(b.offsetMm[2]<=a.offsetMm[2]);
 }
 assert.equal(pairs,complete.constraintCount);
 for(const [lower,upper]of complete.screwPrecedence)assert.ok(layout.get(lower).boundsWorldMm[1][2]+layout.get(lower).offsetMm[2]+complete.gapMm<=layout.get(upper).boundsWorldMm[0][2]+layout.get(upper).offsetMm[2]+1e-9);
 results.push({check:`${pairs} overlapping footprint pairs retain order and have >=${complete.gapMm} mm full-extent clearance; recessed screws respect reviewed seat polarity`,status:'pass'});
 const radial=complete.parts.filter(p=>p.radialSeat);assert.equal(radial.length,3);
 for(const p of radial) {
  const relative=new THREE.Vector3(...p.offsetMm).sub(new THREE.Vector3(...layout.get(p.radialSeat).offsetMm));
  const axis=new THREE.Vector3(...analytic.screws[p.id].worldOutwardDirection);
  assert.ok(relative.clone().cross(axis).length()<1e-9);assert.ok(relative.dot(axis)>2.8);
 }
 results.push({check:'all three horizontal screws retain reviewed outward motion relative to their exact receiving seat layer',status:'pass'});
 // Independent actual-render-geometry endpoint audit (includes the accepted recovered diamond).
 const boxes=new Map();const point=new THREE.Vector3();
 for(const p of axial) {
  const render=v.renderParts.get(p.id);assert.ok(render);const box=new THREE.Box3();const attr=render.mesh.geometry.attributes.position;
  for(let i=0;i<attr.count;i++)box.expandByPoint(point.fromBufferAttribute(attr,i).applyMatrix4(render.assembled));
  box.translate(new THREE.Vector3(...p.offsetMm));boxes.set(p.id,box);
 }
 let minGap=Infinity;
 for(let i=0;i<axial.length;i++)for(let j=i+1;j<axial.length;j++) {
  const A=boxes.get(axial[i].id),B=boxes.get(axial[j].id);
  if(Math.min(A.max.x,B.max.x)<=Math.max(A.min.x,B.min.x)||Math.min(A.max.y,B.max.y)<=Math.max(A.min.y,B.min.y))continue;
  const gap=Math.max(B.min.z-A.max.z,A.min.z-B.max.z);minGap=Math.min(minGap,gap);assert.ok(gap>=complete.gapMm-0.001,'Actual transformed mesh extents must clear');
 }
 results.push({check:'actual GLB vertices and recovered diamond have complete endpoint depth clearance',status:'pass',minGapMm:minGap});
 v.reduced=true;v.reset();v.applyPose(0);v.reduced=false;v.patch({separation:1});v.applyPose(.1);
 assert.ok(v.renderParts.get(prefix+'60__0_1_1_227_1').offset.length()>0,'No staged waiting: bridges move from the first beat');
 const before=new Map([...v.renderParts].map(([id,p])=>[id,p.mesh.matrix.clone()]));v.scrub({separation:0});v.applyPose(0);
 for(const [id,matrix]of before)assert.ok(v.renderParts.get(id).mesh.matrix.equals(matrix),'Reversal starts at displayed geometry');
 for(let i=0;i<120;i++)v.applyPose(1/60);assert.equal(v.assemblyError(),0);
 results.push({check:'actual controller moves all layers together and reverses from the displayed pose without jumps',status:'pass'});
 v.reduced=true;v.reset();v.applyPose(0);v.reduced=false;
}
