import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bases } from "./bases";
import { parameters, manifest, dials } from "./parameters";
import { compose, evaluate, fixture, identity, MechanicalClock, type State } from "./foundation";
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const select = (id: string) => el<HTMLSelectElement>(id),
  input = (id: string) => el<HTMLInputElement>(id);
const stage = el("stage"),
  scene = new THREE.Scene();
scene.background = new THREE.Color("#151a20");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
stage.prepend(renderer.domElement);
const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 500),
  controls = new OrbitControls(camera, renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe7efff, 0x777060, 3));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(15, -20, 40);
scene.add(key);
const fill = new THREE.DirectionalLight(0xc3dcff, 2);
fill.position.set(-20, 10, -30);
scene.add(fill);
const root = new THREE.Group();
scene.add(root); // Flat leaves: CAD parent transforms are metadata only.
const clock = new MechanicalClock();
let state: State = { kind: "sourceRest" },
  raw = false,
  ready = false,
  scheduled = false;
const meshes = new Map<string, THREE.Mesh>();
const parts = new Map(manifest.instances.map((p) => [p.id, p]));
const movement = "p_0_1_1_1__0_1_1_1_4";
const coverIndices = [6, 16, 59, 60, 64, 23, 24, 34, 35];
// Presentation-only covers; essential rigid/deformation members override this list.
const essential = new Set([
  ...parameters.shafts.flatMap((s) => s.members),
  ...parameters.deformations.map((d) => d.id),
]);
const liftMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 12, 0, 0, 0, 1];
for (const shaft of parameters.shafts) select("shaft").add(new Option(shaft.id, shaft.id));
for (const face of ["central", "small"] as const)
  for (const style of dials.faces[face].styles) select(face).add(new Option(style.label, style.id));
function view() {
  const name = select("camera").value;
  if (name === "regulation") {
    controls.target.set(0, -8, -3);
    camera.up.set(0, 1, 0);
    camera.position.set(1, -12, -27);
  }
  if (name === "whole") {
    controls.target.set(0, 0, -2);
    camera.up.set(0, 1, 0);
    camera.position.set(18, -24, -80);
  }
  if (name === "central") {
    controls.target.set(0, 0, 0);
    camera.up.set(0, 1, 0);
    camera.position.set(0, 0, 75);
  }
  if (name === "small") {
    controls.target.set(0, 7.4, -5);
    camera.up.set(0, -1, 0);
    camera.position.set(0, 7.4, -53);
  }
  camera.position
    .sub(controls.target)
    .multiplyScalar(1 / Math.min(1, camera.aspect))
    .add(controls.target);
  controls.update();
  request();
}
function request() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(render);
  }
}
function render() {
  const now = performance.now(); // rAF timestamps can precede a UI event in the same frame.
  scheduled = false;
  if (!ready) return;
  try {
    const time = clock.read(now),
      pose = evaluate(time, raw ? { kind: "sourceRest" } : state, parameters);
    const visible = new Set<string>();
    for (const face of ["central", "small"] as const)
      if (input(face + "Visible").checked) {
        const style = dials.faces[face].styles.find((s) => s.id === select(face).value)!;
        style.leafIds.forEach((id) => visible.add(id));
      }
    for (const base of bases) {
      const mesh = meshes.get(base.id);
      if (!mesh) continue;
      mesh.visible = base.id.startsWith(movement + "__") || visible.has(base.id);
      const cover = coverIndices.some(
        (i) =>
          base.id.startsWith(movement + "__0_1_1_83_" + i + "__") ||
          base.id === movement + "__0_1_1_83_" + i,
      );
      const presentation =
        input("lift").checked && cover && !essential.has(base.id) ? liftMatrix : identity;
      mesh.matrix.set(
        ...(compose(base, pose, raw ? "raw" : "fitted", presentation) as Parameters<
          THREE.Matrix4["set"]
        >),
      );
    }
    root.updateMatrixWorld(true);
    renderer.render(scene, camera);
    el("status").textContent = JSON.stringify(
      {
        timeSeconds: time,
        paused: !clock.running,
        raw,
        connectedReady: pose.connectedReady,
        shafts: pose.shafts.map(({ id, turns, phaseTurns, status }) => ({
          id,
          turns,
          phaseTurns,
          status,
        })),
      },
      null,
      2,
    );
    el("caption").textContent =
      `${raw ? "RAW SOURCE — exact stored bases" : state.kind === "fixture" ? "INDEPENDENT SHAFT EXPERIMENT" : state.kind === "connected" ? "UNRESOLVED — held at bases" : "SOURCE REST / FITTED 10:10:00"} · ${time.toFixed(3)} s · ${[...meshes.values()].filter((m) => m.visible).length} source meshes present`;
    if (clock.running) request();
  } catch (error) {
    el("error").textContent = String(error); /* Fail closed; no implicit wrap or fallback pose. */
  }
}
function act(fn: () => void) {
  try {
    fn();
    el("error").textContent = "";
    request();
  } catch (error) {
    el("error").textContent = String(error);
  }
}
function configure() {
  const mode = select("mode").value;
  const candidate: State =
    mode === "fixture"
      ? fixture(select("shaft").value, Number(input("rate").value), Number(input("phase").value))
      : { kind: mode as "sourceRest" | "connected" };
  evaluate(clock.read(performance.now()), candidate, parameters);
  state = candidate;
  el("diagnostics").textContent = JSON.stringify({ state, parameters }, null, 2);
}
for (const id of ["mode", "shaft", "rate", "phase"])
  el(id).addEventListener("change", () =>
    act(() => {
      clock.pause(performance.now());
      configure();
    }),
  );
el("play").onclick = () =>
  act(() => {
    if (raw || state.kind !== "fixture")
      throw new Error("Choose an independent shaft experiment and leave raw inspection first.");
    clock.play(performance.now());
  });
el("pause").onclick = () => act(() => clock.pause(performance.now()));
el("seek").onclick = () =>
  act(() => {
    const t = Number(input("time").value);
    if (input("time").value === "") throw new Error("Enter an absolute timestamp");
    evaluate(t, state, parameters);
    clock.seek(t, performance.now());
  });
el("speed").onchange = () =>
  act(() => clock.setSpeed(Number(input("speed").value), performance.now()));
el("raw").onclick = () =>
  act(() => {
    clock.pause(performance.now());
    raw = !raw;
    for (const id of ["mode", "shaft", "rate", "phase", "play", "seek", "time", "speed"])
      (el(id) as HTMLInputElement).disabled = raw;
    el("raw").textContent = raw
      ? "Leave raw; restore paused fitted pose"
      : "Enter raw source inspection";
  });
for (const id of ["central", "small", "centralVisible", "smallVisible", "lift"])
  el(id).onchange = request;
el("camera").onchange = view;
document.addEventListener("visibilitychange", () =>
  act(() => clock.setHidden(document.hidden, performance.now())),
);
controls.addEventListener("change", request);
new ResizeObserver(() => {
  const { width, height } = stage.getBoundingClientRect();
  renderer.setSize(width, height);
  const oldAspect = camera.aspect;
  camera.aspect = width / height;
  camera.position
    .sub(controls.target)
    .multiplyScalar(Math.min(1, oldAspect) / Math.min(1, camera.aspect))
    .add(controls.target);
  camera.updateProjectionMatrix();
  request();
}).observe(stage);
configure();
view();
try {
  const paths = await fetch("/models/asset-paths.json").then((r) => {
    if (!r.ok) throw new Error("Missing local asset paths");
    return r.json();
  });
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(paths.catalog);
  const found: THREE.Mesh[] = [];
  gltf.scene.traverse((o) => {
    if (o instanceof THREE.Mesh) found.push(o);
  });
  for (const mesh of found) {
    const id = mesh.userData.partId ?? mesh.name;
    if (!parts.has(id)) throw new Error("Unknown source mesh " + id);
    mesh.removeFromParent();
    mesh.matrixAutoUpdate = false;
    root.add(mesh);
    meshes.set(id, mesh);
  }
  for (const id of essential)
    if (!meshes.has(id)) throw new Error("Missing essential source geometry " + id);
  ready = true;
  request();
} catch (error) {
  el("error").textContent = String(error);
  el("caption").textContent = "Local CAD load failed — harness unavailable";
}
// Explicit capture keeps large matrix evidence out of the per-frame UI update.
el("capture").onclick = () =>
  act(() => {
    const now = performance.now();
    clock.pause(now);
    render();
    const time = clock.read(performance.now());
    el("poseEvidence").textContent = JSON.stringify({
      ready,
      raw,
      state,
      time,
      userAgent: navigator.userAgent,
      viewport: [innerWidth, innerHeight],
      lift: input("lift").checked,
      displays: Object.fromEntries(
        ["central", "small"].map((face) => [
          face,
          { style: select(face).value, visible: input(face + "Visible").checked },
        ]),
      ),
      meshes: [...meshes].map(([id, m]) => ({
        id,
        visible: m.visible,
        matrix: m.matrix.clone().transpose().toArray(),
        worldMatrix: m.matrixWorld.clone().transpose().toArray(),
      })),
    });
  });
