import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080a0d);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.01, 100);
camera.position.set(2.6, 1.8, 2.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xdde8ff, 0x18120a, 2.1));
const key = new THREE.DirectionalLight(0xffe1a8, 5.5);
key.position.set(3, 4, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x8cb7ff, 4.0);
rim.position.set(-4, 1, -3);
scene.add(rim);

let model;
let rotating = true;
let renderedFrames = 0;
const status = document.querySelector("#status");
const toggle = document.querySelector("#toggle");

window.__smoke = { loaded: false, renderedFrames: 0, rotating: true, interactions: 0 };

new GLTFLoader().load(
  "./public/real-component.glb",
  (gltf) => {
    model = gltf.scene;
    model.traverse((object) => {
      if (object.isMesh) {
        object.material = new THREE.MeshStandardMaterial({ color: 0xb79b67, metalness: 0.92, roughness: 0.24 });
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    model.rotation.x = Math.PI * 0.47;
    scene.add(model);
    const radius = size.length() * 0.5;
    camera.position.set(radius * 2.2, radius * 1.4, radius * 2.4);
    controls.update();
    window.__smoke.loaded = true;
    window.__smoke.triangles = renderer.info.render.triangles;
    status.value = `PASS — GLB loaded; ${size.x.toFixed(3)} × ${size.y.toFixed(3)} × ${size.z.toFixed(3)} mm`;
  },
  undefined,
  (error) => {
    window.__smoke.error = String(error);
    status.value = `FAIL — ${error}`;
  }
);

toggle.addEventListener("click", () => {
  rotating = !rotating;
  toggle.textContent = rotating ? "Pause rotation" : "Resume rotation";
  window.__smoke.rotating = rotating;
  window.__smoke.interactions += 1;
});

renderer.domElement.addEventListener("pointerup", () => { window.__smoke.interactions += 1; });

function animate() {
  requestAnimationFrame(animate);
  if (model && rotating) model.rotation.z += 0.006;
  controls.update();
  renderer.render(scene, camera);
  renderedFrames += 1;
  window.__smoke.renderedFrames = renderedFrames;
  window.__smoke.triangles = renderer.info.render.triangles;
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
