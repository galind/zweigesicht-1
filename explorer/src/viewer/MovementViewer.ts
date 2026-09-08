import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export class MovementViewer {
 renderer:THREE.WebGLRenderer; scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(33,1,.1,1000);controls:OrbitControls; root=new THREE.Group(); bounds=new THREE.Box3(); radius=25; center=new THREE.Vector3(); observer:ResizeObserver; frame=0;dead=false; environment:THREE.WebGLRenderTarget;
 constructor(public host:HTMLElement,public status:(s:string)=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setClearColor(0,0);this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.4;host.appendChild(this.renderer.domElement);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.enablePan=false;
  const pmrem=new THREE.PMREMGenerator(this.renderer), room=new RoomEnvironment();this.environment=pmrem.fromScene(room,.04);this.scene.environment=this.environment.texture;room.dispose();pmrem.dispose();this.scene.add(new THREE.HemisphereLight(0xecf4ff,0x2f3338,2));const light=new THREE.DirectionalLight(0xffe4bf,3);light.position.set(30,50,60);this.scene.add(light);this.scene.add(this.root);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
  new GLTFLoader().load('/models/zweigesicht.glb',g=>{if(this.dead)return;const movement=g.scene.getObjectByName('p_0_1_1_1__0_1_1_1_4');if(movement){movement.removeFromParent();this.root.add(movement)}else this.root.add(g.scene);this.root.traverse(o=>{if(o instanceof THREE.Mesh){o.material=new THREE.MeshStandardMaterial({color:0xb9c2c5,metalness:.78,roughness:.32});}});this.bounds.setFromObject(this.root);this.bounds.getCenter(this.center);this.radius=this.bounds.getSize(new THREE.Vector3()).length()/2;this.reset();this.status('');},undefined,e=>this.status('The movement could not load. Reload to retry.'));
  const tick=()=>{if(this.dead)return;this.frame=requestAnimationFrame(tick);this.controls.update();this.renderer.render(this.scene,this.camera)};tick();
 }
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 reset(){this.setSide('back')}
 setSide(side:string){this.controls.target.copy(this.center);const distance=this.radius*2.8/Math.min(1,this.camera.aspect);this.camera.up.set(0,1,0);this.camera.position.copy(this.center).add(new THREE.Vector3(.18,.2,side==='back'?-1:1).normalize().multiplyScalar(distance));this.controls.minDistance=this.radius*.3;this.controls.maxDistance=this.radius*10;this.controls.update()}
 zoom(f:number){this.camera.position.sub(this.controls.target).multiplyScalar(f).add(this.controls.target);this.controls.update()}
 dispose(){this.dead=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.controls.dispose();this.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});this.environment.dispose();this.renderer.dispose();this.renderer.domElement.remove()}
}
