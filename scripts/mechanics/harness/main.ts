import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bases } from "./bases";
import { parameters, manifest, dials } from "./parameters";
import { compose, evaluate, fixture, identity, MechanicalClock, type State } from "./foundation";
import { auditPose, auditAngle, auditKeys, auditDuration, thresholdTime, springMismatch, type AuditShaft } from "./audit";
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
let audit = false, recording = false;
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
const auditDefinitions = new Set([110,111,112,113,114,115,116,117,118,126,127,128,129,130,200,233,234,235]);
function currentPose(time: number) {
  return audit && !raw ? auditPose(time, select("auditShaft").value as AuditShaft, parameters)
    : evaluate(time, raw ? { kind: "sourceRest" } : state, parameters);
}
for (const [index, key] of auditKeys.entries()) select("auditKey").add(new Option(key.label, String(index)));
select("auditKey").add(new Option("Escape tip / jewel 4 plane threshold — experiment", "threshold"));
function view() {
  const name = select("camera").value;
  if (name === "regulation") {
    controls.target.set(0, -8, -3);
    camera.up.set(0, 1, 0);
    camera.position.set(1, -12, -27);
  }
  if (["impulse", "bank", "escape-contact"].includes(name)) {
    const target = name === "impulse" ? [-.18,-9.39,-1.86] : name === "bank" ? [.274,-8.834,-1.81] : [-.16,-5.88,-1.83];
    controls.target.set(...target as [number,number,number]);
    camera.up.set(0,1,0);
    camera.position.copy(controls.target).add(new THREE.Vector3(.8,-1, name === "escape-contact" ? 5 : 3));
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
    let time = clock.read(now);
    if (audit && time >= auditDuration) {
      clock.seek(auditDuration, now); clock.pause(now); time = auditDuration;
    }
    const pose = currentPose(time);
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
      if (input("auditFocus").checked && !raw)
        mesh.visible = auditDefinitions.has(Number(parts.get(base.id)!.definitionId.split("_").at(-1)));
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
        audit: audit ? { shaft: select("auditShaft").value, angleRad: raw ? 0 : auditAngle(time, select("auditShaft").value as AuditShaft), phase: "sensitivity excursion; operating events unresolved" } : null,
        undeformedSpringInnerCenterMismatchMm: springMismatch(pose.shafts.find(s => s.id === "balance")!.turns * 2 * Math.PI),
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
      `${raw ? "RAW SOURCE — exact stored bases" : audit ? "M2 SENSITIVITY — NOT AN OPERATING CYCLE" : state.kind === "fixture" ? "INDEPENDENT SHAFT EXPERIMENT" : state.kind === "connected" ? "UNRESOLVED — held at bases" : "SOURCE REST / FITTED 10:10:00"} · ${time.toFixed(3)} s · ${[...meshes.values()].filter((m) => m.visible).length} source meshes present`;
    el("auditAnnotation").textContent = `${select("camera").value === "bank" ? "Body 126 / brass pin 200: intersection detected; local precision inconclusive." : select("camera").value === "escape-contact" ? "Escape 233 / jewel 128 occurrence 4: source gap 0.0009678 mm, ambiguity band." : "Impulse jewel 112 / body 126: source penetration corroborated; interior witness radius 0.04954 mm."} Undeformed source hairspring remains present; inner-center mismatch ${(springMismatch(pose.shafts.find(s => s.id === "balance")!.turns * 2 * Math.PI)).toFixed(6)} mm (terminal-center diagnostic only). ${audit && !raw ? `Inspection phase ${(time / auditDuration).toFixed(3)}; angle ${(auditAngle(time, select("auditShaft").value as AuditShaft) * 180 / Math.PI).toFixed(6)}°.` : ""}`;
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
  if (mode === "audit") { beginAudit(); return; }
  const candidate: State =
    mode === "fixture"
      ? fixture(select("shaft").value, Number(input("rate").value), Number(input("phase").value))
      : { kind: mode as "sourceRest" | "connected" };
  evaluate(clock.read(performance.now()), candidate, parameters);
  audit = false;
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
    if (raw || (!audit && state.kind !== "fixture"))
      throw new Error("Choose an independent shaft experiment and leave raw inspection first.");
    clock.play(performance.now());
  });
el("pause").onclick = () => act(() => clock.pause(performance.now()));
el("seek").onclick = () =>
  act(() => {
    const t = Number(input("time").value);
    if (input("time").value === "") throw new Error("Enter an absolute timestamp");
    currentPose(t);
    clock.seek(t, performance.now());
  });
el("speed").onchange = () =>
  act(() => clock.setSpeed(Number(input("speed").value), performance.now()));
el("raw").onclick = () =>
  act(() => {
    clock.pause(performance.now());
    raw = !raw;
    for (const id of ["mode", "shaft", "rate", "phase", "play", "seek", "time", "speed", "auditStart", "auditShaft", "auditKey", "auditSeek", "record"])
      (el(id) as HTMLInputElement).disabled = raw;
    el("raw").textContent = raw
      ? "Leave raw; restore paused fitted pose"
      : "Enter raw source inspection";
  });
for (const id of ["central", "small", "centralVisible", "smallVisible", "lift", "auditFocus"])
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
      audit: audit ? {shaft: select("auditShaft").value, angleRad: auditAngle(time, select("auditShaft").value as AuditShaft)} : null,
      time,
      userAgent: navigator.userAgent,
      viewport: [innerWidth, innerHeight],
      camera: {preset: select("camera").value, position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), fov: camera.fov, aspect: camera.aspect, stage: [stage.clientWidth,stage.clientHeight]},
      auditFocus: input("auditFocus").checked,
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

function beginAudit() {
  clock.pause(performance.now()); clock.seek(0, performance.now());
  clock.setSpeed(1, performance.now()); input("speed").value = "1";
  audit = true; raw = false; state = {kind:"sourceRest"};
  select("mode").value = "audit";
  input("auditFocus").checked = true;
  input("time").value = "0";
  el("diagnostics").textContent = JSON.stringify({kind:"M2 source sensitivity; no operating cycle", shaft:select("auditShaft").value,
    extentRad:auditAngle(4,select("auditShaft").value as AuditShaft), derivation:"0.005 mm / monitored BRep radius bound; M2_EVIDENCE.json",
    coordinateFrame:"source-relative right-handed world +Z radians", inspectionDurationSeconds:auditDuration,
    timingProvenance:"16 s inspection traversal only; no physical escapement time", parameters},null,2);
}
el("auditStart").onclick = () => act(beginAudit);
el("auditShaft").onchange = () => act(beginAudit);
el("auditSeek").onclick = () => act(() => {
  if (!audit) beginAudit();
  clock.pause(performance.now());
  const threshold = select("auditKey").value === "threshold";
  if (threshold) select("auditShaft").value = "escape";
  const time = threshold ? thresholdTime : auditKeys[Number(select("auditKey").value)].time;
  clock.seek(time, performance.now()); input("time").value = String(time);
});
el("record").onclick = async () => {
  if (recording || raw || !ready) return;
  recording = true;
  const locked = [...document.querySelectorAll<HTMLInputElement>("button,input,select")];
  let recorder: MediaRecorder | undefined, stream: MediaStream | undefined;
  try {
    beginAudit(); render();
    locked.forEach(e => e.disabled = true);
    const output = document.createElement("canvas"); output.width = 1280; output.height = 800;
    const ctx = output.getContext("2d")!;
    stream = output.captureStream(30);
    recorder = new MediaRecorder(stream, {mimeType:"video/webm;codecs=vp9"});
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => {if(e.data.size) chunks.push(e.data);};
    const stopped = new Promise<void>(resolve => {recorder!.onstop = () => resolve();});
    recorder.start();
    for (let frame = 0; frame <= 480; frame++) {
      if (document.hidden) throw new Error("Recording interrupted: keep the harness tab foreground");
      clock.seek(frame / 30, performance.now()); render();
      ctx.fillStyle = "#151a20"; ctx.fillRect(0,0,1280,800);
      const scale = Math.min(1280 / renderer.domElement.width, 680 / renderer.domElement.height);
      const width = renderer.domElement.width * scale, height = renderer.domElement.height * scale;
      ctx.drawImage(renderer.domElement,(1280-width)/2,(680-height)/2,width,height);
      ctx.fillStyle = "#ffce86"; ctx.font = "18px sans-serif";
      ctx.fillText("M2 SOURCE SENSITIVITY — NOT A RUNNING ESCAPEMENT",20,710);
      ctx.fillText(`${select("auditShaft").value} · t=${(frame/30).toFixed(3)} s · source-relative ${(auditAngle(frame/30,select("auditShaft").value as AuditShaft)*180/Math.PI).toFixed(6)}°`,20,740);
      ctx.fillText("Known source jewel/body penetration. Hairspring undeformed; M2 incomplete.",20,770);
      await new Promise(resolve => setTimeout(resolve,1000/30));
    }
    recorder.stop(); await stopped; stream.getTracks().forEach(t => t.stop());
    const response = await fetch(`/__m2-recording?shaft=${select("auditShaft").value}&view=${select("camera").value}`, {method:"POST",headers:{"Content-Type":"video/webm"},body:new Blob(chunks,{type:"video/webm"})});
    if (!response.ok) throw new Error("Local recording save failed");
    el("recordStatus").textContent = await response.text();
  } catch(error) {el("error").textContent = String(error);}
  finally {if (recorder?.state === "recording") recorder.stop(); stream?.getTracks().forEach(t => t.stop()); recording = false; locked.forEach(e => e.disabled = false); request();}
};
