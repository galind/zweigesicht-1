/** Local-only lossless glTF buffer-view compression. Source nodes/attributes stay intact. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'assets/generated/optimized'),AUDIT=path.join(ROOT,'artifacts/assets');
const THREE_DECODER=path.join(ROOT,'explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
const {MeshoptDecoder: ThreeDecoder}=await import(THREE_DECODER);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready,ThreeDecoder.ready]);
await fs.mkdir(OUT,{recursive:true});await fs.mkdir(AUDIT,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
function parse(b){if(b.readUInt32LE(0)!==0x46546c67)throw Error('Not GLB');const n=b.readUInt32LE(12);return{json:JSON.parse(b.subarray(20,20+n)),bin:b.subarray(28+n,28+n+b.readUInt32LE(20+n))}}
function serialize(j,bin){let jb=Buffer.from(JSON.stringify(j));jb=Buffer.concat([jb,Buffer.alloc((4-jb.length%4)%4,32)]);bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);let h=Buffer.alloc(20);h.write('glTF');h.writeUInt32LE(2,4);h.writeUInt32LE(28+jb.length+bin.length,8);h.writeUInt32LE(jb.length,12);h.write('JSON',16);let bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.write('BIN\0',4);return Buffer.concat([h,jb,bh,bin])}
const io=new NodeIO().registerExtensions([EXTMeshoptCompression]).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'assets/generated/assembly-manifest.json'),'utf8'));
if(manifest.source.sha256!=='f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b')throw Error('Unreviewed STEP source hash');
const reports=process.argv.includes('--catalog-only')?[JSON.parse(await fs.readFile(path.join(AUDIT,'movement-optimization.json'),'utf8'))]:[];
for(const [label,input,outname,expectedMeshes] of [['movement','zweigesicht-movement.glb','overview.glb',222],['catalog','zweigesicht.glb','catalog.glb',364]]){
 if(process.argv.includes('--catalog-only')&&label==='movement')continue;
 const started=performance.now(),raw=await fs.readFile(path.join(ROOT,'assets/generated',input));const{json:src,bin:sourceBin}=parse(raw);const j=structuredClone(src),blocks=[];let offset=0;
 for(let vi=0;vi<j.bufferViews.length;vi++){
  const view=j.bufferViews[vi],accs=j.accessors.filter(a=>a.bufferView===vi);
  if(accs.length!==1||view.buffer!==0||view.byteStride||accs[0].byteOffset)throw Error('Exporter view contract changed');
  const a=accs[0],stride=view.byteLength/a.count,mode=view.target===34963?'INDICES':'ATTRIBUTES';
  if(!Number.isInteger(stride))throw Error('Invalid stride');
  const source=sourceBin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
  // INDICES preserves index order exactly, unlike TRIANGLES which may cyclically rotate indices.
  // ATTRIBUTES has NO lossy filter or quantization; pass glTF-compatible version 0 explicitly.
  const data=MeshoptEncoder.encodeGltfBuffer(source,a.count,stride,mode,0);
  const dest=new Uint8Array(source.length);ThreeDecoder.decodeGltfBuffer(dest,a.count,stride,data,mode,'NONE');
  if(!Buffer.from(dest).equals(source))throw Error(`Three.js decoded bytes differ in ${label} view ${vi}`);
  view.buffer=1;view.extensions={EXT_meshopt_compression:{buffer:0,byteOffset:offset,byteLength:data.length,byteStride:stride,count:a.count,mode,filter:'NONE'}};
  blocks.push(Buffer.from(data));offset+=data.length;const pad=(4-offset%4)%4;if(pad){blocks.push(Buffer.alloc(pad));offset+=pad;}
 }
 j.extensionsUsed=[...new Set([...(j.extensionsUsed??[]),'EXT_meshopt_compression'])];j.extensionsRequired=[...new Set([...(j.extensionsRequired??[]),'EXT_meshopt_compression'])];
 j.buffers=[{byteLength:offset},{byteLength:src.buffers[0].byteLength,extensions:{EXT_meshopt_compression:{fallback:true}}}];
 const encoded=serialize(j,Buffer.concat(blocks));await fs.writeFile(path.join(OUT,outname),encoded);
 const decoded=await io.readBinary(encoded),original=await io.readBinary(raw);
 const dn=decoded.getRoot().listNodes(),on=original.getRoot().listNodes();
 if(dn.length!==on.length)throw Error('Node count changed');
 let worldError=0,uniqueTriangles=0,instanceTriangles=0,draws=0;
 for(let i=0;i<dn.length;i++){
  if(dn[i].getName()!==on[i].getName()||JSON.stringify(dn[i].getExtras())!==JSON.stringify(on[i].getExtras()))throw Error('Stable ID/extras changed');
  const aw=on[i].getWorldMatrix(),bw=dn[i].getWorldMatrix();worldError=Math.max(worldError,...aw.map((v,k)=>Math.abs(v-bw[k])));
  if(dn[i].getMesh())for(const p of dn[i].getMesh().listPrimitives()){draws++;instanceTriangles+=p.getIndices().getCount()/3;}
 }
 for(const m of decoded.getRoot().listMeshes())for(const p of m.listPrimitives())uniqueTriangles+=p.getIndices().getCount()/3;
 const renderable=dn.filter(n=>n.getMesh()).length;
 if(renderable!==expectedMeshes)throw Error('Renderable IDs lost');
 for(const key of ['nodes','meshes','accessors','materials','scenes','scene','asset'])if(JSON.stringify(src[key])!==JSON.stringify(j[key]))throw Error(`Source JSON ${key} modified`);
 const rawGzip=gzipSync(raw,{level:9}),compressedGzip=gzipSync(encoded,{level:9});
 const brotli=brotliCompressSync(encoded,{params:{[constants.BROTLI_PARAM_QUALITY]:11}});
 await fs.writeFile(path.join(OUT,outname+'.gz'),compressedGzip);
 const report={label,input,output:outname,sourceStepSha256:manifest.source.sha256,inputGlbSha256:sha(raw),outputGlbSha256:sha(encoded),rawBytes:raw.length,rawGzipBytes:rawGzip.length,meshoptBytes:encoded.length,meshoptGzipBytes:compressedGzip.length,meshoptBrotliBytes:brotli.length,reductionPercent:100*(1-encoded.length/raw.length),gzipReductionVersusRawGzipPercent:100*(1-compressedGzip.length/rawGzip.length),nodes:dn.length,renderableStableIds:renderable,uniqueMeshes:decoded.getRoot().listMeshes().length,uniqueTriangles,instanceTriangles,primitiveDrawCallsBeforeCulling:draws,maxWorldMatrixError:worldError,quantizationErrorMm:0,positionAndNormalDecodedBytesExact:true,indexDecodedBytesExact:true,sourceNodeAndExtrasJsonExact:true,sourceMaterialAndSceneJsonExact:true,threeBundledDecoderCompatible:true,independentNodeIoDecodePass:true,seconds:Math.round((performance.now()-started)/10)/100,method:'Meshopt v0, ATTRIBUTES/INDICES, no filters, no quantization, no reordering, no decimation',gpuGeometryReduction:0};
 reports.push(report);await fs.writeFile(path.join(AUDIT,label+'-optimization.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 if(process.argv.includes('--movement-only'))break;
}
await fs.writeFile(path.join(AUDIT,'optimization-report.json'),JSON.stringify({schemaVersion:1,toolVersions:JSON.parse(await fs.readFile(path.join(ROOT,'scripts/assets/package.json'),'utf8')).dependencies,assets:reports},null,2)+'\n');
