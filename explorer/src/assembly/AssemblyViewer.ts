import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import seating from '../../../assets/authored/atelier-layout.json';
import holders from '../../../assets/source-manifest/holder-runtime.json';
import type { Manifest, Part } from '../experience/catalog';
import { sha256, assetRequestUrl } from '../experience/loading';
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
import { dragCenter } from './drag';
import {
  PARTS,
  LEAF_IDS,
  OPERATIONS,
  arrangement,
  availableItems,
  type Item,
  type PartItem,
  type Side,
  type Destination,
} from './lesson';
import type { Session } from './session';

export type Point = { x: number; y: number };
type Piece = { mesh: THREE.Mesh; bounds: THREE.Box3 };
export type SurfaceItem = Point & { item: Item; width: number; height: number };
export type SurfaceLayout = {
  items: SurfaceItem[];
  zones: { destination: Destination; x: number; y: number }[];
};
export type Drop = { item: Item; destination: Destination; distanceMm: number };
const desktopPositions: Record<PartItem, [number, number]> = {
  mainplate: [-70, -37],
  'setting-screw': [-31, -40],
  'setting-lever': [-31, -24],
  stem: [36, -40],
  wheel: [53, -40],
  coupling: [70, -40],
  bridge: [67, -20],
  'bridge-screw-1': [48, -18],
  'bridge-screw-2': [48, -4],
};
const phonePositions: Record<PartItem, [number, number]> = {
  mainplate: [-33, -24],
  'setting-screw': [3, -39],
  'setting-lever': [22, -39],
  stem: [8, -20],
  wheel: [26, -20],
  coupling: [44, -20],
  bridge: [33, 1],
  'bridge-screw-1': [9, -57],
  'bridge-screw-2': [29, -57],
};

/** One surface, fixed camera, original fitted matrices. No running movement or navigation system. */
export class AssemblyViewer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-80, 80, 55, -55, 0.1, 500);
  environment?: THREE.WebGLRenderTarget;
  observer?: ResizeObserver;
  owned: THREE.Object3D[] = [];
  pieces = new Map<string, Piece>();
  groups = new Map<Item, THREE.Group>();
  support = new Map<Side, THREE.Group>();
  ghost = new THREE.Group();
  seat = new THREE.Mesh(
    new THREE.RingGeometry(4.8, 5, 64),
    new THREE.MeshBasicMaterial({
      color: 0xe9d6a5,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
    }),
  );
  state?: Session;
  selected?: Item;
  side: Side = 'movement';
  showSeat = false;
  radius = 5;
  ready = false;
  dead = false;
  generation = 0;
  enabled = false;
  drag?: {
    item: Item;
    pointer: number;
    element: HTMLElement;
    grab: Point;
    start: Point;
    point: Point;
    moved: boolean;
  };
  onLayout?: (layout: SurfaceLayout) => void;
  onDrag?: (dragging: boolean) => void;
  get portrait() {
    return this.host.clientWidth < 650;
  }
  get workZ() {
    return this.portrait ? 15 : 0;
  }
  rest(destination: Destination): [number, number] {
    return [
      destination === 'movement-rest'
        ? this.portrait
          ? -34
          : -68
        : this.portrait
          ? 34
          : 68,
      this.portrait ? 65 : 0,
    ];
  }
  onPick?: (item: Item, event: PointerEvent) => void;
  onDrop?: (drop: Drop) => void;
  constructor(
    public host: HTMLElement,
    public status: (ready: boolean, error: string) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    try {
      configureRenderer(this.renderer);
      host.appendChild(this.renderer.domElement);
      this.renderer.domElement.setAttribute(
        'aria-label',
        'Watch assembly surface. Select a part, then drag it or use the three placement areas.',
      );
      this.camera.position.set(0, 150, 58);
      this.camera.lookAt(0, 5, 0);
      this.environment = createStudioEnvironment(this.renderer);
      this.scene.environment = this.environment.texture;
      this.scene.environmentIntensity = 0.9;
      addStudioLights(this.scene);
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445b49, 1.5));
      this.seat.rotation.x = -Math.PI / 2;
      this.seat.renderOrder = 10;
      this.seat.visible = false;
      this.scene.add(this.ghost, this.seat);
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(host);
      this.renderer.domElement.addEventListener('pointerdown', this.pick);
      this.renderer.domElement.addEventListener('wheel', this.wheel, {
        passive: false,
      });
      this.renderer.domElement.addEventListener(
        'webglcontextlost',
        this.contextLost,
      );
      this.renderer.domElement.addEventListener(
        'webglcontextrestored',
        this.contextRestored,
      );
      window.addEventListener('pointermove', this.move);
      window.addEventListener('pointerup', this.release);
      window.addEventListener('pointercancel', this.cancel);
      window.addEventListener('keydown', this.key);
      window.addEventListener('blur', this.cancel);
      document.addEventListener('visibilitychange', this.visibility);
      this.resize();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }
  async load() {
    const generation = ++this.generation;
    this.ready = false;
    this.status(false, '');
    const loaded: THREE.Object3D[] = [];
    const materials: THREE.Material[] = [];
    let committed = false;
    try {
      const json = async (path: string) => {
        const response = await fetch(path);
        if (!response.ok) throw Error(path);
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
      const track = (object: THREE.Object3D) => {
        loaded.push(object);
        return object;
      };
      const holder = async (name: string) => {
        const response = await fetch(`/bench-local/${name}.glb`);
        if (!response.ok)
          throw Error(`The existing ${name} support is unavailable.`);
        const buffer = await response.arrayBuffer();
        if (
          (await sha256(buffer)) !==
          holders.files.find((file) => file.name === `${name}.glb`)?.sha256
        )
          throw Error(`The ${name} support does not match its recorded hash.`);
        return track((await loader.parseAsync(buffer, '/bench-local/')).scene);
      };
      const results = await Promise.allSettled([
        loader
          .loadAsync(assetRequestUrl(paths.overview))
          .then((g) => track(g.scene)),
        loader
          .loadAsync(assetRequestUrl(paths.catalog))
          .then((g) => track(g.scene)),
        holder('movement'),
        holder('dial'),
        loadSourceSurfaces(paths.overview),
      ]);
      if (this.dead || generation !== this.generation) return;
      for (const result of results)
        if (result.status === 'rejected') throw result.reason;
      const surfaces = (
        results[4] as PromiseFulfilledResult<
          Awaited<ReturnType<typeof loadSourceSurfaces>>
        >
      ).value;
      const byId = new Map(manifest.instances.map((part) => [part.id, part]));
      const prepared = new Map<string, Piece>();
      for (const object of loaded.slice(0))
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
            prepared.has(record.id)
          )
            return;
          attachSourceSurface(node.geometry, surfaces.get(record.definitionId));
          const material = createMaterial(
            record.name,
            record.definitionId,
            node.geometry,
            record.id,
          );
          materials.push(material);
          setFinishEnabled(material, true);
          const mesh = new THREE.Mesh(node.geometry, material);
          const target = record.worldTransform;
          mesh.matrixAutoUpdate = false;
          mesh.matrix.set(
            ...(target.flat() as Parameters<THREE.Matrix4['set']>),
          );
          node.geometry.computeBoundingBox();
          prepared.set(record.id, {
            mesh,
            bounds: node.geometry
              .boundingBox!.clone()
              .applyMatrix4(mesh.matrix),
          });
        });
      if (LEAF_IDS.some((id) => !prepared.has(id)))
        throw Error('Required chapter geometry is missing.');
      this.clear();
      this.owned = loaded;
      this.pieces = prepared;
      for (const item of Object.keys(PARTS) as PartItem[]) {
        const group = new THREE.Group();
        this.groups.set(item, group);
        this.scene.add(group);
      }
      for (const item of ['movement', 'stem-assembly'] as const) {
        const group = new THREE.Group();
        this.groups.set(item, group);
        this.scene.add(group);
      }
      for (const [index, side] of ['movement', 'dial'].entries()) {
        const object = (
          results[index + 2] as PromiseFulfilledResult<THREE.Object3D>
        ).value;
        const group = new THREE.Group();
        // The holder runtime retains original Z-up mm. These are the recorded Bench rotations.
        object.rotation.x = -Math.PI / 2;
        group.rotation.y = Math.PI / 2;
        group.add(object);
        object.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          for (const material of Array.isArray(node.material)
            ? node.material
            : [node.material])
            material.dispose();
          node.material = new THREE.MeshStandardMaterial({
            color: 0xa82820,
            roughness: 0.78,
          });
          node.userData.item = `support-${side}`;
        });
        this.support.set(side as Side, group);
        this.scene.add(group);
      }
      committed = true;
      this.ready = true;
      this.layout();
      this.status(true, '');
    } catch (error) {
      if (!this.dead && generation === this.generation)
        this.status(
          false,
          error instanceof Error
            ? error.message
            : 'The assembly could not load.',
        );
    } finally {
      if (!committed) {
        materials.forEach((material) => material.dispose());
        loaded.forEach(disposeObjectResources);
      }
    }
  }
  clear() {
    this.cancel();
    for (const { mesh } of this.pieces.values())
      (mesh.material as THREE.Material).dispose();
    for (const group of [...this.groups.values(), ...this.support.values()])
      group.removeFromParent();
    this.owned.forEach(disposeObjectResources);
    this.owned = [];
    this.groups.clear();
    this.support.clear();
    this.pieces.clear();
  }
  update(
    state: Session,
    selected: Item | undefined,
    side: Side,
    enabled: boolean,
    showSeat: boolean,
    radius: number,
  ) {
    if (
      this.state?.revision !== state.revision ||
      this.state?.runId !== state.runId ||
      !enabled
    )
      this.cancel();
    this.state = state;
    this.selected = selected;
    this.side = side;
    this.enabled = enabled;
    this.showSeat = showSeat;
    this.radius = radius;
    this.layout();
  }
  ids(item: Item): readonly string[] {
    const cursor = this.state?.cursor ?? 0;
    if (item === 'movement')
      return OPERATIONS.slice(0, cursor)
        .flatMap((op) => op.adds)
        .filter(
          (id) =>
            cursor >= 12 ||
            ![...PARTS.stem, ...PARTS.wheel, ...PARTS.coupling].includes(id),
        );
    if (item === 'stem-assembly')
      return OPERATIONS.slice(6, Math.min(cursor, 9)).flatMap((op) => op.adds);
    return PARTS[item as PartItem] ?? [];
  }
  bounds(item: Item) {
    const bounds = new THREE.Box3();
    for (const id of this.ids(item)) {
      const piece = this.pieces.get(id);
      if (piece) bounds.union(piece.bounds);
    }
    return bounds;
  }
  frame(side: Side, x = 0, z = 0) {
    const rest = seating.stations.find(
      (station) => station.id === (side === 'movement' ? 'bridge' : 'dial'),
    )!;
    return new THREE.Matrix4()
      .makeRotationX(THREE.MathUtils.degToRad(rest.rotationX))
      .setPosition(x, rest.seat, z);
  }
  stemFrame(x = 0, z = 0) {
    return new THREE.Matrix4()
      .makeRotationX(Math.PI / 2)
      .setPosition(x - 15.5250054869334, 2.2, z);
  }
  setFrame(group: THREE.Group, frame: THREE.Matrix4) {
    group.matrixAutoUpdate = false;
    group.matrix.copy(frame);
  }
  layout() {
    if (!this.ready || !this.state || this.drag) return;
    const cursor = this.state.cursor,
      plan = arrangement(cursor);
    for (const group of this.groups.values()) {
      group.clear();
      group.visible = false;
    }
    const placed = new Set(
      OPERATIONS.slice(0, cursor).flatMap((op) => op.adds),
    );
    const stemIds = new Set([...PARTS.stem, ...PARTS.wheel, ...PARTS.coupling]);
    for (const item of Object.keys(PARTS) as PartItem[]) {
      const ownGroup = this.groups.get(item)!;
      for (const id of PARTS[item]) {
        const installed = placed.has(id);
        const owner: Item = installed
          ? stemIds.has(id) && cursor < 12
            ? 'stem-assembly'
            : 'movement'
          : item;
        const mesh = this.pieces.get(id)!.mesh;
        mesh.userData.item = owner;
        this.groups.get(owner)!.add(mesh);
        this.groups.get(owner)!.visible = true;
      }
      const center = this.bounds(item)
        .getCenter(new THREE.Vector3())
        .applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      const [x, z] = (this.portrait ? phonePositions : desktopPositions)[item];
      this.setFrame(
        ownGroup,
        new THREE.Matrix4()
          .makeRotationX(Math.PI / 2)
          .setPosition(x - center.x, 4 - center.y, z - center.z),
      );
    }
    this.setFrame(
      this.groups.get('movement')!,
      this.frame(
        this.selected === 'movement' ? this.side : plan.side,
        ...(plan.movement === 'aside'
          ? this.rest('movement-rest')
          : ([0, this.workZ] as [number, number])),
      ),
    );
    this.setFrame(
      this.groups.get('stem-assembly')!,
      this.stemFrame(
        ...(plan.stem === 'aside'
          ? this.rest('stem-rest')
          : ([0, this.workZ] as [number, number])),
      ),
    );
    for (const [side, group] of this.support) {
      group.visible = true;
      const active = plan.supportPlaced && plan.side === side;
      const [x, z] = active
        ? plan.movement === 'aside'
          ? this.rest('movement-rest')
          : [0, this.workZ]
        : [
            side === 'movement'
              ? this.portrait
                ? -34
                : -68
              : this.portrait
                ? 34
                : 68,
            this.portrait ? -78 : 44,
          ];
      group.position.set(x, 0, z);
    }
    // A controlled turn is only a preview until the player seats the assembly.
    if (this.selected === 'mainplate') {
      const group = this.groups.get('mainplate')!;
      const [x, z] = (this.portrait ? phonePositions : desktopPositions)
        .mainplate;
      const rotation = new THREE.Matrix4().makeRotationX(
        this.side === 'movement' ? Math.PI / 2 : -Math.PI / 2,
      );
      const center = this.bounds('mainplate')
        .getCenter(new THREE.Vector3())
        .applyMatrix4(rotation);
      this.setFrame(
        group,
        rotation.setPosition(x - center.x, 4 - center.y, z - center.z),
      );
    }

    this.updateSeat();
    this.render();
  }
  target(item: Item, destination: Destination) {
    const [x, z] = destination.endsWith('-rest')
      ? this.rest(destination)
      : [0, this.workZ];
    if (item.startsWith('support-')) return new THREE.Vector3(x, 0, z);
    const center = this.bounds(item).getCenter(new THREE.Vector3());
    const frame =
      destination === 'stem' ||
      (destination === 'work' && item === 'stem') ||
      destination === 'stem-rest'
        ? this.stemFrame(x, z)
        : this.frame(this.side, x, z);
    return center.applyMatrix4(frame);
  }
  centralDestination(item: Item): Destination {
    if (
      ['movement', 'mainplate', 'stem'].includes(item) ||
      item.startsWith('support-')
    )
      return 'work';
    return (this.state?.cursor ?? 0) >= 7 && (this.state?.cursor ?? 0) < 10
      ? 'stem'
      : 'movement';
  }
  destination(item: Item, point: THREE.Vector3): Destination {
    if (this.portrait) {
      if (point.z > 43) return point.x < 0 ? 'movement-rest' : 'stem-rest';
    } else {
      if (point.x < -36) return 'movement-rest';
      if (point.x > 36) return 'stem-rest';
    }
    return this.centralDestination(item);
  }
  updateSeat() {
    this.seat.visible =
      this.ready &&
      this.showSeat &&
      !!this.selected &&
      this.state?.cursor !== 15;
    if (!this.selected || !this.state) return;
    const next = OPERATIONS[this.state.cursor];
    if (!next) return;
    this.seat.position.copy(this.target(this.selected, next.destination));
    this.seat.scale.setScalar(this.radius / 5);
  }
  project(point: THREE.Vector3): Point {
    const rect = this.host.getBoundingClientRect();
    const p = point.clone().project(this.camera);
    return {
      x: rect.left + ((p.x + 1) * rect.width) / 2,
      y: rect.top + ((1 - p.y) * rect.height) / 2,
    };
  }
  onPlane(point: Point, height: number) {
    const rect = this.host.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((point.x - rect.left) / rect.width) * 2 - 1,
        1 - ((point.y - rect.top) / rect.height) * 2,
      ),
      this.camera,
    );
    return ray.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -height),
      new THREE.Vector3(),
    );
  }
  begin(
    item: Item,
    event: { pointerId: number; clientX: number; clientY: number },
    element: HTMLElement,
    fromSurface = false,
  ) {
    if (
      !this.enabled ||
      !this.ready ||
      !this.state ||
      !availableItems(this.state.cursor).includes(item)
    )
      return;
    this.cancel();
    this.selected = item;
    const original = item.startsWith('support-')
      ? this.support.get(item === 'support-movement' ? 'movement' : 'dial')
      : this.groups.get(item);
    if (!original) return;
    this.scene.updateMatrixWorld(true);
    const screen = this.project(
      new THREE.Box3().setFromObject(original).getCenter(new THREE.Vector3()),
    );
    const start = { x: event.clientX, y: event.clientY };
    const grab = fromSurface
      ? { x: start.x - screen.x, y: start.y - screen.y }
      : { x: 0, y: 0 };
    const clone = original.clone(true);
    clone.matrixAutoUpdate = true;
    original.matrixWorld.decompose(
      clone.position,
      clone.quaternion,
      clone.scale,
    );
    this.ghost.add(clone);
    if (item === 'movement') {
      const holder = this.support.get(arrangement(this.state.cursor).side)!;
      const companion = holder.clone(true);
      holder.matrixWorld.decompose(
        companion.position,
        companion.quaternion,
        companion.scale,
      );
      this.ghost.add(companion);
      holder.visible = false;
    }
    original.visible = false;
    this.drag = {
      item,
      pointer: event.pointerId,
      element,
      grab,
      start,
      point: start,
      moved: false,
    };
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      this.cancel();
      return;
    }
    element.addEventListener('lostpointercapture', this.cancel);
    this.onDrag?.(true);
    this.updateSeat();
    this.moveGhost(start);
  }
  moveGhost(point: Point) {
    if (!this.drag) return;
    const bounds = new THREE.Box3().setFromObject(this.ghost.children[0]),
      center = bounds.getCenter(new THREE.Vector3());
    const world = this.onPlane(dragCenter(point, this.drag.grab), center.y);
    if (world) this.ghost.position.add(world.sub(center));
    this.render();
  }
  move = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    this.drag.point = { x: event.clientX, y: event.clientY };
    this.drag.moved ||=
      Math.hypot(
        event.clientX - this.drag.start.x,
        event.clientY - this.drag.start.y,
      ) > 4;
    this.moveGhost(this.drag.point);
  };
  release = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointer) return;
    const rect = this.host.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    let drop: Drop | undefined;
    if (drag.moved && inside && this.enabled) {
      const point = dragCenter(
        { x: event.clientX, y: event.clientY },
        drag.grab,
      );
      const surface = this.onPlane(point, 5)!;
      const destination = this.destination(drag.item, surface);
      const target = this.target(drag.item, destination);
      const actual = this.onPlane(point, target.y)!;
      drop = {
        item: drag.item,
        destination,
        distanceMm: Math.hypot(actual.x - target.x, actual.z - target.z),
      };
    }
    this.cancel();
    if (drop) this.onDrop?.(drop);
  };
  cancel = () => {
    const drag = this.drag;
    this.drag = undefined;
    if (drag) {
      drag.element.removeEventListener('lostpointercapture', this.cancel);
      if (drag.element.hasPointerCapture(drag.pointer))
        drag.element.releasePointerCapture(drag.pointer);
    }
    this.ghost.clear();
    this.ghost.position.set(0, 0, 0);
    if (drag) {
      this.onDrag?.(false);
      this.layout();
    }
  };
  pick = (event: PointerEvent) => {
    if (event.button !== 0 || !this.enabled) return;
    const rect = this.host.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
      ),
      this.camera,
    );
    const hit = ray
      .intersectObjects(
        [...this.groups.values(), ...this.support.values()],
        true,
      )
      .find((hit) => hit.object.userData.item && hit.object.parent?.visible);
    if (hit) this.onPick?.(hit.object.userData.item as Item, event);
  };
  zoom(factor: number) {
    this.cancel();
    this.camera.zoom = THREE.MathUtils.clamp(
      this.camera.zoom * factor,
      0.8,
      3.2,
    );
    this.camera.updateProjectionMatrix();
    this.render();
  }
  resetView() {
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.render();
  }
  wheel = (event: WheelEvent) => {
    event.preventDefault();
    this.zoom(event.deltaY < 0 ? 1.08 : 1 / 1.08);
  };
  key = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.cancel();
  };
  visibility = () => {
    if (document.hidden) this.cancel();
  };
  contextLost = (event: Event) => {
    event.preventDefault();
    this.cancel();
    this.ready = false;
    ++this.generation;
    this.status(
      false,
      'Graphics interrupted. Restore graphics to resume your saved chapter.',
    );
  };
  contextRestored = () => {
    if (this.dead) return;
    try {
      const environment = createStudioEnvironment(this.renderer);
      this.environment?.dispose();
      this.environment = environment;
      this.scene.environment = environment.texture;
      void this.load();
    } catch {
      this.ready = false;
      this.status(
        false,
        'Graphics could not recover. Retry to restore this chapter.',
      );
    }
  };
  resize = () => {
    if (this.dead) return;
    this.cancel();
    const width = Math.max(this.host.clientWidth, 1),
      height = Math.max(this.host.clientHeight, 1);
    const halfWidth = this.portrait
        ? Math.max(70, (102 * width) / height)
        : Math.max(105, (67 * width) / height),
      halfHeight = (halfWidth * height) / width;
    Object.assign(this.camera, {
      left: -halfWidth,
      right: halfWidth,
      top: halfHeight,
      bottom: -halfHeight,
    });
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.layout();
    this.render();
  };
  render() {
    if (this.dead) return;
    this.renderer.render(this.scene, this.camera);
    if (!this.ready || !this.state || this.drag) return;
    const rect = this.host.getBoundingClientRect();
    const items: SurfaceItem[] = [];
    for (const item of availableItems(this.state.cursor)) {
      const object = item.startsWith('support-')
        ? this.support.get(item === 'support-dial' ? 'dial' : 'movement')
        : this.groups.get(item);
      if (!object?.visible) continue;
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) continue;
      const center = box.getCenter(new THREE.Vector3());
      // Keep the seated support selectable at its exposed rim, clear of the movement.
      const installedSupport =
        item === `support-${arrangement(this.state.cursor).side}` &&
        this.state.cursor >= 2;
      if (installedSupport) center.x = box.max.x - 3;
      const point = this.project(center);
      const corners = [box.min, box.max].map((p) => this.project(p));
      items.push({
        item,
        x: point.x - rect.left,
        y: point.y - rect.top,
        width: installedSupport
          ? 44
          : Math.max(44, Math.min(150, Math.abs(corners[1].x - corners[0].x))),
        height: installedSupport
          ? 44
          : Math.max(44, Math.min(150, Math.abs(corners[1].y - corners[0].y))),
      });
    }
    const destinations: Destination[] = [
      'movement-rest',
      this.selected ? this.centralDestination(this.selected) : 'work',
      'stem-rest',
    ];
    const zones = destinations.map((destination) => {
      const [x, z] = destination.endsWith('-rest')
        ? this.rest(destination)
        : [0, this.workZ];
      const p = this.project(new THREE.Vector3(x, 0, z));
      return { destination, x: p.x - rect.left, y: p.y - rect.top };
    });
    this.onLayout?.({ items, zones });
  }
  dispose() {
    this.dead = true;
    ++this.generation;
    this.observer?.disconnect();
    this.clear();
    window.removeEventListener('pointermove', this.move);
    window.removeEventListener('pointerup', this.release);
    window.removeEventListener('pointercancel', this.cancel);
    window.removeEventListener('keydown', this.key);
    window.removeEventListener('blur', this.cancel);
    document.removeEventListener('visibilitychange', this.visibility);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.pick);
    canvas.removeEventListener('wheel', this.wheel);
    canvas.removeEventListener('webglcontextlost', this.contextLost);
    canvas.removeEventListener('webglcontextrestored', this.contextRestored);
    this.seat.geometry.dispose();
    this.seat.material.dispose();
    this.environment?.dispose();
    this.renderer.dispose();
    canvas.remove();
  }
}
