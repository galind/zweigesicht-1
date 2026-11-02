import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { Manifest, Part } from "../../experience/catalog";
import { assetRequestUrl } from "../../experience/loading";
import {
  configureRenderer,
  addStudioLights,
  createStudioEnvironment,
  disposeObjectResources,
} from "../../viewer/GraphicsResources";
import { attachSourceSurface, loadSourceSurfaces } from "../../viewer/SourceSurfaces";
import { createMaterial, setFinishEnabled } from "../../viewer/materials";
import { SurfaceOcclusion } from "../../viewer/SurfaceOcclusion";
import { studioFrame } from "../../viewer/StudioFrame";
import { PARTS, LEAF_IDS, componentIds, type PartItem, type Side } from "../lesson";

export type AssemblyView = "movement" | "stem";
type Point = { x: number; y: number };
export type Seat = Point & { width: number; height: number };
const stemIds = new Set([...PARTS.stem, ...PARTS.wheel, ...PARTS.coupling]);

/** Static source-frame presentation. No animation, support transfer or lesson mutation. */
export class PrototypeViewer {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(33, 1, 0.05, 2000);
  environment: THREE.WebGLRenderTarget;
  occlusion: SurfaceOcclusion;
  observer: ResizeObserver;
  pieces = new Map<string, THREE.Mesh>();
  owned: THREE.Object3D[] = [];
  assembly = new THREE.Group();
  preview = new THREE.Group();
  cursor = 7;
  view: AssemblyView = "movement";
  selected?: PartItem;
  side: Side = "movement";
  ready = false;
  dead = false;
  frame = 0;
  dragPoint?: Point;
  constructor(
    public host: HTMLElement,
    public onSeat: (seat: Seat) => void,
    public onError: (message: string) => void,
  ) {
    configureRenderer(this.renderer);
    this.environment = createStudioEnvironment(this.renderer);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.9;
    addStudioLights(this.scene);
    this.scene.add(this.assembly, this.preview);
    this.occlusion = new SurfaceOcclusion(this.scene, this.camera);
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Active assembly in original fitted geometry",
    );
    host.appendChild(this.renderer.domElement);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(host);
    this.renderer.domElement.addEventListener("webglcontextlost", this.contextLost);
    this.resize();
  }
  async load() {
    const json = async (path: string) => {
      const response = await fetch(path);
      if (!response.ok) throw Error(`Unable to load ${path}`);
      return response.json();
    };
    const [manifest, paths] = await Promise.all([
      json("/models/assembly-manifest.json") as Promise<Manifest>,
      json("/models/asset-paths.json") as Promise<{ overview: string; catalog: string }>,
    ]);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const loaded: THREE.Object3D[] = [];
    try {
      const results = await Promise.allSettled([
        ...[paths.overview, paths.catalog].map(async (path) => {
          const gltf = await loader.loadAsync(assetRequestUrl(path));
          loaded.push(gltf.scene);
        }),
        loadSourceSurfaces(paths.overview),
      ]);
      for (const result of results) if (result.status === "rejected") throw result.reason;
      if (this.dead) return {};
      this.owned = loaded;
      const surfaces = (
        results[2] as PromiseFulfilledResult<Awaited<ReturnType<typeof loadSourceSurfaces>>>
      ).value;
      const byId = new Map(manifest.instances.map((part) => [part.id, part]));
      for (const object of loaded)
        object.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          let ancestor: THREE.Object3D | null = node;
          let record: Part | undefined;
          while (ancestor && !record) {
            record = byId.get(ancestor.name);
            ancestor = ancestor.parent;
          }
          if (!record || !LEAF_IDS.includes(record.id) || this.pieces.has(record.id)) return;
          attachSourceSurface(node.geometry, surfaces.get(record.definitionId));
          const material = createMaterial(
            record.name,
            record.definitionId,
            node.geometry,
            record.id,
          );
          setFinishEnabled(material, true);
          const mesh = new THREE.Mesh(node.geometry, material);
          mesh.matrixAutoUpdate = false;
          mesh.matrix.set(...(record.worldTransform.flat() as Parameters<THREE.Matrix4["set"]>));
          this.pieces.set(record.id, mesh);
        });
      if (LEAF_IDS.some((id) => !this.pieces.has(id)))
        throw Error("Required chapter geometry is missing.");
      this.ready = true;
      const thumbnails = this.thumbnails();
      this.layout();
      return thumbnails;
    } finally {
      if (!this.owned.length) loaded.forEach(disposeObjectResources);
    }
  }
  group(ids: readonly string[]) {
    const group = new THREE.Group();
    for (const id of ids) {
      const mesh = this.pieces.get(id);
      if (mesh) group.add(mesh.clone());
    }
    return group;
  }
  fit(bounds: THREE.Box3, front: boolean, oblique = false) {
    const direction = new THREE.Vector3(
      oblique ? 0.62 : 0,
      oblique ? 0.38 : 0,
      front ? 1 : -1,
    ).normalize();
    this.camera.up.set(0, front ? 1 : -1, 0);
    const { center, distance } = studioFrame(this.camera, bounds, direction, this.camera.up);
    this.camera.position.copy(center).addScaledVector(direction, distance);
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld(true);
  }
  thumbnails() {
    const result: Partial<Record<PartItem, string>> = {};
    this.renderer.setSize(120, 100, false);
    this.camera.aspect = 1.2;
    for (const item of Object.keys(PARTS) as PartItem[]) {
      const group = this.group(PARTS[item]);
      this.scene.add(group);
      this.fit(new THREE.Box3().setFromObject(group), false, true);
      this.renderer.render(this.scene, this.camera);
      result[item] = this.renderer.domElement.toDataURL("image/png");
      group.removeFromParent();
    }
    this.resize();
    return result;
  }
  update(cursor: number, view: AssemblyView, selected: PartItem | undefined, side: Side) {
    this.cursor = cursor;
    this.view = view;
    this.selected = selected;
    this.side = side;
    this.layout();
  }
  layout() {
    if (!this.ready || this.dead) return;
    this.assembly.clear();
    this.preview.clear();
    const ids = componentIds(this.cursor).filter(
      (id) => stemIds.has(id) === (this.view === "stem"),
    );
    this.assembly.add(this.group(ids));
    // Keep each work area stable while adding parts; never frame loose inventory.
    const envelope = this.group(this.view === "stem" ? [...stemIds] : componentIds(6));
    this.fit(
      new THREE.Box3().setFromObject(envelope),
      this.view === "movement",
      this.view === "stem",
    );
    if (this.selected) {
      const group = this.group(PARTS[this.selected]);
      // Only a player-selected orientation is previewed. Installed matrices remain exact.
      if (this.side === "dial") {
        const center = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
        group.position.copy(center).multiplyScalar(-1);
        const pivot = new THREE.Group();
        pivot.position.copy(center);
        pivot.rotation.x = Math.PI;
        pivot.add(group);
        this.preview.add(pivot);
      } else this.preview.add(group);
      this.preview.visible = !!this.dragPoint;
      if (this.dragPoint) this.movePreview(this.dragPoint);
    }
    this.publishSeat();
    this.render();
  }
  seatPoint() {
    const ids = this.selected
      ? PARTS[this.selected]
      : this.view === "stem"
        ? PARTS.stem
        : PARTS.mainplate;
    return new THREE.Box3().setFromObject(this.group(ids)).getCenter(new THREE.Vector3());
  }
  project(point: THREE.Vector3): Point {
    const rect = this.host.getBoundingClientRect(),
      p = point.clone().project(this.camera);
    return {
      x: rect.left + ((p.x + 1) * rect.width) / 2,
      y: rect.top + ((1 - p.y) * rect.height) / 2,
    };
  }
  publishSeat() {
    const rect = this.host.getBoundingClientRect();
    const point = this.project(this.seatPoint());
    this.onSeat({
      x: point.x - rect.left,
      y: point.y - rect.top,
      width: rect.width,
      height: rect.height,
    });
  }
  onPlane(point: Point, z: number) {
    const rect = this.host.getBoundingClientRect(),
      ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((point.x - rect.left) / rect.width) * 2 - 1,
        1 - ((point.y - rect.top) / rect.height) * 2,
      ),
      this.camera,
    );
    return ray.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 0, 1), -z),
      new THREE.Vector3(),
    );
  }
  movePreview(point?: Point) {
    this.dragPoint = point;
    this.preview.visible = !!point && !!this.selected;
    if (point && this.selected) {
      const seat = this.seatPoint(),
        world = this.onPlane(point, seat.z);
      if (world) this.preview.position.copy(world.sub(seat));
    } else this.preview.position.set(0, 0, 0);
    this.render();
  }
  distance(point: Point) {
    const seat = this.seatPoint(),
      screen = this.project(seat);
    // Explicit destination target offers 44px precision assistance for the chosen part only.
    if (Math.hypot(point.x - screen.x, point.y - screen.y) <= 22) return 0;
    const world = this.onPlane(point, seat.z);
    return world ? world.distanceTo(seat) : Infinity;
  }
  resize = () => {
    if (this.dead) return;
    const width = Math.max(1, this.host.clientWidth),
      height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    this.renderer.setSize(width, height);
    this.occlusion.resize(width, height);
    this.layout();
  };
  render() {
    if (this.frame || this.dead) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if (!this.ready || this.dead) return;
      try {
        this.renderer.render(this.scene, this.camera);
        this.occlusion.render(this.renderer);
      } catch {
        this.ready = false;
        this.onError("Graphics interrupted. Retry the prototype.");
      }
    });
  }
  contextLost = (event: Event) => {
    event.preventDefault();
    this.ready = false;
    this.onError("Graphics interrupted. Retry the prototype.");
  };
  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.contextLost);
    for (const mesh of this.pieces.values()) (mesh.material as THREE.Material).dispose();
    this.owned.forEach(disposeObjectResources);
    this.environment.dispose();
    this.occlusion.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
