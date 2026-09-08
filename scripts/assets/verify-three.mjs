/** Load raw and optimized assets through the same Three GLTFLoader used by the app. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GLTFLoader} from '../../explorer/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../../explorer/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
import {Box3} from '../../explorer/node_modules/three/build/three.module.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
await MeshoptDecoder.ready;
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),reports=[];
function bytes(a){return Buffer.from(a.buffer,a.byteOffset,a.byteLength)}
async function load(p){const b=await fs.readFile(path.join(root,p)),start=performance.now();const g=await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');g.scene.updateMatrixWorld(true);return{scene:g.scene,milliseconds:performance.now()-start}}
for(const [label,raw,opt] of [['movement','zweigesicht-movement.glb','overview.glb'],['catalog','zweigesicht.glb','catalog.glb']]){
 const a=await load('assets/generated/'+raw),b=await load('assets/generated/optimized/'+opt);
 const an=new Map(),bn=new Map();a.scene.traverse(n=>{if(n.userData.partId)an.set(n.userData.partId,n)});b.scene.traverse(n=>{if(n.userData.partId)bn.set(n.userData.partId,n)});
 if(an.size!==bn.size)throw Error('Three node count changed');
 let renderable=0,maxWorldError=0;
 for(const [id,o]of an){const n=bn.get(id);if(!n)throw Error('Missing stable part '+id);if(JSON.stringify(o.userData)!==JSON.stringify(n.userData))throw Error('Node extras changed');for(let k=0;k<16;k++)maxWorldError=Math.max(maxWorldError,Math.abs(o.matrixWorld.elements[k]-n.matrixWorld.elements[k]));if(o.isMesh){renderable++;for(const key of ['position','normal'])if(!bytes(o.geometry.attributes[key].array).equals(bytes(n.geometry.attributes[key].array)))throw Error('Attribute changed');if(!bytes(o.geometry.index.array).equals(bytes(n.geometry.index.array)))throw Error('Index changed')}}
 const ab=new Box3().setFromObject(a.scene),bb=new Box3().setFromObject(b.scene);if(!ab.equals(bb)||maxWorldError!==0)throw Error('Bounds/matrix mismatch');
 const report={label,threeRevision:186,sourceNodes:an.size,renderableStableIds:renderable,rawParseMs:a.milliseconds,meshoptParseMs:b.milliseconds,maxWorldMatrixError:maxWorldError,boundsMm:[ab.min.toArray(),ab.max.toArray()],boundsMatchExactly:true,positionNormalIndexBytesMatchExactly:true,nodeUserDataMatchesExactly:true,warning:'One Node GLTFLoader parse per asset; CPU compatibility check, not a browser, device, network or GPU performance benchmark.'};reports.push(report);console.log(JSON.stringify(report,null,2));
 if(process.argv.includes('--movement-only'))break;
}
await fs.writeFile(path.join(root,'artifacts/assets/three-loader-verification.json'),JSON.stringify(reports,null,2)+'\n');
