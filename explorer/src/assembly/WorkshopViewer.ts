import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { Manifest, Part } from '../experience/catalog';
import { assetRequestUrl } from '../experience/loading';
import {
  configureRenderer,
  addStudioLights,
  createStudioEnvironment,
  disposeObjectResources,
} from '../viewer/GraphicsResources';
import {
  attachSourceSurface,
  loadSourceSurfaces,
} from '../viewer/SourceSurfaces';
import { createMaterial, setFinishEnabled } from '../viewer/materials';
import { SurfaceOcclusion } from '../viewer/SurfaceOcclusion';
import { studioFrame } from '../viewer/StudioFrame';
import { PARTS, LEAF_IDS, componentIds, type PartItem } from './lesson';

import { screwDestination, type Point } from './workshopInput';

/** Static source-frame presentation. No animation, support transfer or lesson mutation. */
export class WorkshopViewer {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(33, 1, 0.05, 2000);
  environment: THREE.WebGLRenderTarget;
  occlusion: SurfaceOcclusion;
  observer: ResizeObserver;
  pieces = new Map<string, THREE.Mesh>();
  owned: THREE.Object3D[] = [];
  assembly = new THREE.Group();
  cursor = 12;
  ready = false;
  dead = false;
  interrupted = false;
  frame = 0;
  constructor(
    public host: HTMLElement,
    public onError: (message: string) => void,
  ) {
    configureRenderer(this.renderer);
    this.environment = createStudioEnvironment(this.renderer);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.9;
    addStudioLights(this.scene);
    this.scene.add(this.assembly);
    this.occlusion = new SurfaceOcclusion(this.scene, this.camera);
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Active assembly in original fitted geometry',
    );
    host.appendChild(this.renderer.domElement);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(host);
    this.renderer.domElement.addEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    this.resize();
  }
  async load() {
    const json = async (path: string) => {
      const response = await fetch(path);
      if (!response.ok) throw Error(`Unable to load ${path}`);
      return response.json();
    };
    const [manifest, paths] = await Promise.all([
      json('/models/assembly-manifest.json') as Promise<Manifest>,
      json('/models/asset-paths.json') as Promise<{
        overview: string;
        catalog: string;
      }>,
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
      for (const result of results)
        if (result.status === 'rejected') throw result.reason;
      if (this.dead || this.interrupted) return {};
      this.owned = loaded;
      const surfaces = (
        results[2] as PromiseFulfilledResult<
          Awaited<ReturnType<typeof loadSourceSurfaces>>
        >
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
          if (
            !record ||
            !LEAF_IDS.includes(record.id) ||
            this.pieces.has(record.id)
          )
            return;
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
          mesh.matrix.set(
            ...(record.worldTransform.flat() as Parameters<
              THREE.Matrix4['set']
            >),
          );
          this.pieces.set(record.id, mesh);
        });
      if (LEAF_IDS.some((id) => !this.pieces.has(id)))
        throw Error('Required chapter geometry is missing.');
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
    const { center, distance } = studioFrame(
      this.camera,
      bounds,
      direction,
      this.camera.up,
    );
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
      result[item] = this.renderer.domElement.toDataURL('image/png');
      group.removeFromParent();
    }
    this.resize();
    return result;
  }
  update(cursor: number) {
    this.cursor = cursor;
    this.layout();
  }
  layout() {
    if (!this.ready || this.dead) return;
    this.assembly.clear();
    this.assembly.add(this.group(componentIds(this.cursor)));
    // The prepared fixture defines the camera throughout all three placements.
    this.fit(
      new THREE.Box3().setFromObject(this.group(componentIds(12))),
      false,
    );
    this.render();
  }
  seatPoint(item: PartItem) {
    return new THREE.Box3()
      .setFromObject(this.group(PARTS[item]))
      .getCenter(new THREE.Vector3());
  }
  project(point: THREE.Vector3): Point {
    const rect = this.host.getBoundingClientRect(),
      p = point.clone().project(this.camera);
    return {
      x: rect.left + ((p.x + 1) * rect.width) / 2,
      y: rect.top + ((1 - p.y) * rect.height) / 2,
    };
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
  placement(point: Point, item: PartItem) {
    if (item === 'bridge-screw-1' || item === 'bridge-screw-2') {
      const destination = screwDestination(
        point,
        this.project(this.seatPoint('bridge-screw-1')),
        this.project(this.seatPoint('bridge-screw-2')),
      );
      if (destination !== item)
        return {
          distanceMm: Infinity,
          message: destination
            ? 'That is the other screw hole. Try this part again from Parts.'
            : 'Between screw holes. Aim clearly at one hole and try again.',
        };
    }
    const seat = this.seatPoint(item);
    const world = this.onPlane(point, seat.z);
    return {
      distanceMm: world ? world.distanceTo(seat) : Infinity,
      message: '',
    };
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
        this.onError('Graphics interrupted. Retry the workshop.');
      }
    });
  }
  contextLost = (event: Event) => {
    event.preventDefault();
    this.interrupted = true;
    this.ready = false;
    this.onError('Graphics interrupted. Retry the workshop.');
  };
  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.renderer.domElement.removeEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    for (const mesh of this.pieces.values())
      (mesh.material as THREE.Material).dispose();
    this.owned.forEach(disposeObjectResources);
    this.environment.dispose();
    this.occlusion.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
