/** Package reversible CAD surface annotations; original GLBs remain immutable. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const {GLTFLoader}=await import(path.join(root,'explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js'));
const {MeshoptDecoder}=await import(path.join(root,'explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'));
const modelDir=path.join(root,'explorer/public/models');
const paths=JSON.parse(fs.readFileSync(path.join(modelDir,'asset-paths.json')));
const bytes=fs.readFileSync(path.join(root,'explorer/public',paths.overview));
const {scene}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const catalogBytes=fs.readFileSync(path.join(root,'explorer/public',paths.catalog));
const catalog=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(catalogBytes.buffer.slice(catalogBytes.byteOffset,catalogBytes.byteOffset+catalogBytes.byteLength),'');
scene.add(catalog.scene);
const geometries=new Map();
scene.traverse(o=>{if(o.isMesh)geometries.set(o.userData.definitionId??o.geometry.name,o.geometry)});
// Exporter preserves definition identity in the owning node's extras.
scene.traverse(o=>{if(o.isMesh){let p=o;while(p&&!p.userData.definitionId)p=p.parent;if(p)geometries.set(p.userData.definitionId,o.geometry)}});
const sha=b=>createHash('sha256').update(b).digest('hex');
const screwSteelFaces={9:[6,7],107:[6,7],122:[1,13],123:[4,5,6],136:[4,5,6],138:[4,5,6],139:[4,5,6],166:[4,5,6],168:[4,5,6],169:[4,5,6],170:[4,5,6],180:[4,5,6,7,8,9,10,14,15,16],181:[6,7],189:[4,5,6],191:[4,5,6],192:[4,5,14,15,16],201:[1,2,3,4],226:[3,5,8],253:[13,14,15],255:[4,5,14,15,16]};
const bridgeDefinitions=new Set([99,133,147,152,153,156,165,219,222,228,230,240]);
// Conservative, source-face-specific base fields. These are the exposed axial
// planes supported by the macro references, not every surface below local Z0.
// Hidden undersides, hole floors and mounting pads stay neutral unless listed.
const bridgeBaseFaces={
  99:[25],133:[20],147:[21],156:[23],165:[14],219:[37],222:[28],228:[42],230:[36],240:[3],
};
const definitions={},blocks=[],reports=[];let byteOffset=0;
const ids=fs.readdirSync(path.join(root,'artifacts/finishing-cad/sidecars')).filter(f=>/^d_0_1_1_\d+\.json$/.test(f)).map(f=>Number(f.match(/_(\d+)\.json$/)[1])).sort((a,b)=>a-b);
for(const id of ids) {
 const key=`d_0_1_1_${id}`,base=path.join(root,'artifacts/finishing-cad/sidecars',key);
 const meta=JSON.parse(fs.readFileSync(base+'.json')),raw=fs.readFileSync(base+'.bin');
 if(sha(raw)!==meta.sha256||!meta.cachedPositionsAndIndicesExactlyReproduced)throw Error('Unverified source sidecar '+key);
 const input=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),g=geometries.get(key);
 if(!g||g.attributes.position.count!==meta.vertexCount)throw Error('Missing or changed geometry '+key);
 // Project the four source-blue arm fields through the 0.2 mm thickness.
 // A 0.04 mm edge allowance includes their modeled edge rounding. The
 // central steel spine is outside these exact projected source triangles.
 const blueTriangles=[];
 if(id===159)for(let t=0;t<g.index.count;t+=3){
  const indices=[g.index.getX(t),g.index.getX(t+1),g.index.getX(t+2)];
  if(indices.every(i=>input[i*10+9]>=1&&input[i*10+9]<=4))
   blueTriangles.push(indices.map(i=>[input[i*10],input[i*10+1]]));
 }
 const inBlueArm=(x,y)=>blueTriangles.some(([a,b,c])=>{
  const cross=(u,v)=>(v[0]-u[0])*(y-u[1])-(v[1]-u[1])*(x-u[0]);
  const signs=[cross(a,b),cross(b,c),cross(c,a)];
  if(signs.every(v=>v>=0)||signs.every(v=>v<=0))return true;
  return [[a,b],[b,c],[c,a]].some(([u,v])=>{
   const dx=v[0]-u[0],dy=v[1]-u[1],length=dx*dx+dy*dy;
   const f=length?Math.max(0,Math.min(1,((x-u[0])*dx+(y-u[1])*dy)/length)):0;
   return Math.hypot(x-u[0]-f*dx,y-u[1]-f*dy)<=.04;
  });
 });
 const output=new Float32Array(meta.vertexCount*4);let normalFallbacks=0;
 const roles={};
 for(let i=0;i<meta.vertexCount;i++) {
  const p=g.attributes.position,n=g.attributes.normal;
  for(let k=0;k<3;k++)if(p.getComponent(i,k)!==input[i*10+k]||n.getComponent(i,k)!==input[i*10+3+k])throw Error(`Source attribute ordering changed ${key}:${i}:${k}`);
  const f=meta.faces[input[i*10+9]-1],z=f.boundsLocalMm[0][2],plane=f.type==='GeomAbs_Plane',flat=plane&&Math.abs(f.planeNormal[2])>.999;
  // Source topology identifies floors/fields. RGBA categories alone never prove a process.
  let role=0;
  if(id!==195&&flat&&Math.abs(z)<.001)role=1;
  if([99,219,222,228].includes(id)&&flat&&(Math.abs(z+.1)<.001||(id===99&&Math.abs(z+.07)<.001)))role=3;
  const color=f.directColors.surface??f.directColors.generic;
  // Catalog hands/bushings retain source steel seats. Source-dark dial markings
  // are distinct from pale carriers and separately modeled enamel inserts.
  if([8,12,24,28,34,38,41].includes(id)&&color&&Math.abs(color[0]-.36724645)<.001)role=2;
  // Fine seconds: outward counterbalance face, excluding the adjoining stem.
  // d30 face 6 follows the source blade bend; its circular lobe starts at Y=-4.25.
  if(id===30&&f.index===6&&input[i*10+1]<-4.25)role=2;
  // Skeleton minute dots: 48 blind-hole walls and floors, source Z=.55–.7.
  // The upper annulus (face 129) remains silver; applied hour-marker bores stay steel.
  if(id===14&&((f.index>=40&&f.index<=111)||(f.index>=134&&f.index<=157)))role=11;
  // Exact source shank/under-head faces. Origins differ: d9/d107/d122/d180/
  // d181 place the head top near Z=0, unlike the shoulder-origin screws.
  // Never infer a head boundary from a shared zero-plane convention.
  if(screwSteelFaces[id]?.includes(f.index))role=2;
  if([3,17,26,27].includes(id)&&color&&color[0]<.01&&color[1]<.01&&color[2]<.01)role=5;
  if([99,219,222,228].includes(id)&&color&&color[2]>.45&&color[0]<.03&&color[1]===0)role=3;
  if(id===156&&color&&color[0]>.3&&color[1]===0&&color[2]===0)role=7;
  if((id===251&&f.index===22)||(id===159&&f.index>=1&&f.index<=4))role=4;
  if(id===159&&inBlueArm(input[i*10],input[i*10+1]))role=4;
  if(id===195&&flat&&Math.abs(z+1.9)<.001)role=6;
  if(bridgeBaseFaces[id]?.includes(f.index))role=8;
  // BRep cones and oblique planar bands on reviewed bridges are modeled
  // chamfers/countersinks. Keep vertical walls and curved flanks satin.
  if(bridgeDefinitions.has(id)&&(f.type==='GeomAbs_Cone'||(plane&&Math.abs(f.planeNormal[2])>.12&&Math.abs(f.planeNormal[2])<.96))&&role===0)role=9;
  // Broad axial fields and every coplanar island inside the plate lettering
  // share frosting. Letter counters at Z=-2 mm must not depend on area;
  // recessed strokes at Z=-1.9 mm and small functional recesses stay distinct.
  if(id===195&&flat&&(f.areaMm2>.4||Math.abs(z+2)<.001)&&role===0)role=10;
  // User-approved enamel: actual recessed lettering and outlines only.
  if((id===99&&f.index>=129&&f.index<=247&&![219,223,227].includes(f.index))||(id===230&&f.index>=37&&f.index<=66))role=11;
  // Seven user-approved upper mounting pads, not the lower bridge bases.
  if(({99:[28,30],222:[31,33],228:[49,50,52]})[id]?.includes(f.index))role=12;
  const nx=input[i*10+6],ny=input[i*10+7],nz=input[i*10+8];
  const agreement=nx*n.getX(i)+ny*n.getY(i)+nz*n.getZ(i);
  // Exclude individual sliver outliers; retain original shading at >30 degree disagreement.
  const valid=(agreement>Math.cos(Math.PI/6)||Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<1e-6)&&Number.isFinite(agreement);
  if(!valid)normalFallbacks++;
  output.set(valid?[nx,ny,nz,role]:[n.getX(i),n.getY(i),n.getZ(i),role],i*4);
  roles[role]=(roles[role]??0)+1;
 }
 const block=Buffer.from(output.buffer);
 definitions[key]={byteOffset,vertexCount:meta.vertexCount,sourceSidecarSha256:meta.sha256};
 blocks.push(block);byteOffset+=block.length;
 reports.push({definitionId:key,vertexCount:meta.vertexCount,originalPositionAndNormalMatchExactly:true,normalFallbacks,roles});
}
const packed=Buffer.concat(blocks),digest=sha(packed),file=`finish-surfaces-${digest.slice(0,12)}.bin`;
fs.writeFileSync(path.join(modelDir,file),packed);fs.writeFileSync(path.join(modelDir,file+'.gz'),gzipSync(packed,{level:9,mtime:0}));
const manifest={schemaVersion:1,sourceStepSha256:'f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b',overview:paths.overview,file:'/models/'+file,sha256:digest,definitions,roles:{0:'normal-based conservative surface',1:'source main plane',2:'source steel hand seat or screw shank/under-head',3:'source decorative groove and engraving',4:'source blue crown cone or shock spring field',5:'source dark dial marking',6:'source plate inscription floor',7:'source red gauge inlay',8:'reference-supported exposed bridge base field',9:'modeled bridge chamfer or countersink',10:'broad plate frost field',11:'user-approved recessed enamel',12:'user-approved bridge screw mounting pad frosting'}};
fs.writeFileSync(path.join(modelDir,'finish-surfaces.json'),JSON.stringify(manifest));
fs.writeFileSync(path.join(root,'artifacts/finishing-cad/runtime-sidecar-report.json'),JSON.stringify({bytes:packed.length,gzipBytes:gzipSync(packed,{level:9,mtime:0}).length,definitions:reports},null,2)+'\n');
console.log(JSON.stringify({bytes:packed.length,definitions:reports},null,2));
