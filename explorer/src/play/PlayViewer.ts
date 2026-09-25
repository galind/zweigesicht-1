import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { StudioEnvironment } from '../viewer/StudioEnvironment';
import {
  attachSourceSurface,
  loadSourceSurfaces,
} from '../viewer/SourceSurfaces';
import { loadRecoveredDiamond } from '../viewer/RecoveredDiamond';
import {
  createMaterial,
  FITTED_BLUE_ENAMEL,
  setFinishEnabled,
} from '../viewer/materials';
import { DIALS } from '../experience/dials';
import { assetRequestUrl } from '../experience/loading';
import type { Manifest, Part } from '../experience/catalog';
import type { PlayManifest, PlayStep } from './types';
import { dragCenter, snapDrop } from './state';

type Piece = { mesh: THREE.Mesh; pose: THREE.Matrix4; bounds: THREE.Box3 };
type Point = { x: number; y: number };
export type PlayViewStatus = {
  ready: boolean;
  error: string;
  busy: boolean;
  cutaway: boolean;
};

/** A route-local controller. Source matrices and shared geometry are never mutated. */
export class PlayViewer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(33, 1, 0.01, 2000);
  controls: OrbitControls;
  environment?: THREE.WebGLRenderTarget;
  pieces = new Map<string, Piece>();
  staged = new THREE.Group();
  observer: ResizeObserver;
  frame = 0;
  renderCount = 0;
  dead = false;
  ready = false;
  contextUnavailable = false;
  busy = false;
  error = '';
  cutaway = false;
  current: PlayStep | null = null;
  fitted = new Set<string>();
  active = false;
  target = new THREE.Vector3();
  stepBounds = new THREE.Box3();
  stageScale = 1;
  frameRegion = { top: 80, bottom: 500, left: 0, width: 1000 };
  side: 'front' | 'back' = 'front';
  drag?: {
    pointer: number;
    grab: Point;
    position: Point;
    moved: boolean;
    start: Point;
  };
  animation?: {
    start: number;
    from: Point;
    to: Point;
    fromScale: number;
    toScale: number;
    complete: () => void;
  };
  media = matchMedia('(prefers-reduced-motion: reduce)');
  loadedObjects: THREE.Object3D[] = [];
  generation = 0;
  constructor(
    public host: HTMLElement,
    public stage: HTMLElement,
    public destination: HTMLElement,
    public manifest: PlayManifest,
    public notify: (status: PlayViewStatus) => void,
    public placed: (id: string) => void,
    public selected: () => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    try {
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      this.renderer.setClearColor(0, 0);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      host.appendChild(this.renderer.domElement);
      this.renderer.domElement.tabIndex = 0;
      this.renderer.domElement.setAttribute(
        'aria-label',
        'Watch assembly. Drag empty space to orbit; pinch or scroll to zoom. Arrow keys orbit; plus and minus zoom.',
      );
      this.camera.up.set(0, -1, 0);
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enablePan = false;
      this.controls.minDistance = 0.4;
      this.controls.maxDistance = 1500;
      this.controls.addEventListener('change', this.cameraChanged);
      this.makeEnvironment();
      this.scene.add(new THREE.HemisphereLight(0xc8e0ed, 0x29221b, 0.25));
      const key = new THREE.DirectionalLight(0xffecd6, 0.8);
      key.position.set(-25, 40, -45);
      const rim = new THREE.DirectionalLight(0xc0dff3, 0.6);
      rim.position.set(30, -10, 35);
      this.scene.add(key, rim, this.staged);
      stage.addEventListener('pointerdown', this.pointerDown);
      stage.addEventListener('pointermove', this.pointerMove);
      stage.addEventListener('pointerup', this.pointerUp);
      stage.addEventListener('pointercancel', this.cancel);
      stage.addEventListener('lostpointercapture', this.cancel);
      stage.addEventListener('keydown', this.stageKeyDown);
      this.renderer.domElement.addEventListener(
        'webglcontextlost',
        this.contextLost,
      );
      this.renderer.domElement.addEventListener(
        'webglcontextrestored',
        this.contextRestored,
      );
      this.renderer.domElement.addEventListener('keydown', this.keyDown);
      this.media.addEventListener('change', this.motionChanged);
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(host);
      this.resize();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }
  emit() {
    if (!this.dead)
      this.notify({
        ready: this.ready,
        error: this.error,
        busy: this.busy,
        cutaway: this.cutaway,
      });
  }
  makeEnvironment() {
    this.environment?.dispose();
    const pmrem = new THREE.PMREMGenerator(this.renderer),
      room = new StudioEnvironment();
    try {
      this.environment = pmrem.fromScene(room, 0.015);
      this.scene.environment = this.environment.texture;
      this.scene.environmentIntensity = 0.9;
    } finally {
      room.dispose();
      pmrem.dispose();
    }
  }
  async load() {
    const generation = ++this.generation;
    this.ready = false;
    this.error = '';
    this.emit();
    const loaded: THREE.Object3D[] = [];
    try {
      const get = async (url: string) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`${url} unavailable`);
        return r.json();
      };
      const [source, paths] = await Promise.all([
        get('/models/assembly-manifest.json') as Promise<Manifest>,
        get('/models/asset-paths.json') as Promise<{
          overview: string;
          catalog: string;
        }>,
      ]);
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      // All chosen leaves are required. A partial catalog can never enable completion.
      const results = await Promise.allSettled([
        loader.loadAsync(assetRequestUrl(paths.overview)).then((g) => {
          loaded.push(g.scene);
          return g.scene;
        }),
        loader.loadAsync(assetRequestUrl(paths.catalog)).then((g) => {
          loaded.push(g.scene);
          return g.scene;
        }),
        loadRecoveredDiamond(source.instances).then((g) => {
          loaded.push(g);
          return g;
        }),
        loadSourceSurfaces(paths.overview),
      ]);
      if (this.dead || generation !== this.generation) {
        loaded.forEach((o) => this.disposeObject(o));
        return;
      }
      for (const result of results)
        if (result.status === 'rejected') throw result.reason;
      const surfaces = (
        results[3] as PromiseFulfilledResult<
          Awaited<ReturnType<typeof loadSourceSurfaces>>
        >
      ).value;
      const byId = new Map(source.instances.map((p) => [p.id, p]));
      const found = new Map<string, { mesh: THREE.Mesh; record: Part }>();
      for (const object of loaded)
        object.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          let parent: THREE.Object3D | null = node,
            record: Part | undefined;
          while (parent && !record) {
            record = byId.get(parent.name);
            parent = parent.parent;
          }
          if (
            record &&
            this.manifest.finalLeafIds.includes(record.id) &&
            !found.has(record.id)
          )
            found.set(record.id, { mesh: node, record });
        });
      const missing = this.manifest.finalLeafIds.filter((id) => !found.has(id));
      if (missing.length)
        throw new Error(`Required geometry missing: ${missing.join(', ')}`);
      this.clearPieces();
      for (const [id, { mesh: original, record }] of found) {
        attachSourceSurface(
          original.geometry,
          surfaces.get(record.definitionId),
        );
        const material = createMaterial(
          record.name,
          record.definitionId,
          original.geometry,
          id,
        );
        setFinishEnabled(material, true);
        if (DIALS.presentationOverrides.some((o) => o.leafId === id)) {
          const enamel = material as THREE.MeshPhysicalMaterial;
          Object.assign(enamel, {
            ...FITTED_BLUE_ENAMEL,
            color: new THREE.Color(FITTED_BLUE_ENAMEL.color),
            attenuationColor: new THREE.Color(
              FITTED_BLUE_ENAMEL.attenuationColor,
            ),
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
        }
        const mesh = new THREE.Mesh(original.geometry, material);
        const pose = new THREE.Matrix4().set(
          ...(this.manifest.targetPoses[id].flat() as Parameters<
            THREE.Matrix4['set']
          >),
        );
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(pose);
        mesh.userData.partId = id;
        const bounds = new THREE.Box3()
          .setFromBufferAttribute(
            original.geometry.getAttribute('position') as THREE.BufferAttribute,
          )
          .applyMatrix4(pose);
        this.pieces.set(id, { mesh, pose, bounds });
        this.scene.add(mesh);
      }
      this.loadedObjects = loaded;
      this.ready = !this.contextUnavailable;
      if (this.ready) this.error = '';
      this.update(this.fitted, this.current, this.active);
      this.emit();
    } catch (error) {
      loaded.forEach((o) => this.disposeObject(o));
      if (!this.dead && generation === this.generation) {
        this.error =
          'The watch could not load completely. Retry to restore your assembly.';
        this.ready = false;
        this.emit();
        console.error('Play asset load', error);
      }
    }
  }
  clearPieces() {
    this.staged.clear();
    for (const { mesh } of this.pieces.values()) {
      this.scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    this.pieces.clear();
    this.loadedObjects.forEach((o) => this.disposeObject(o));
    this.loadedObjects = [];
  }
  disposeObject(object: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    object.traverse((n) => {
      if (n instanceof THREE.Mesh) {
        geometries.add(n.geometry);
        for (const m of Array.isArray(n.material) ? n.material : [n.material])
          materials.add(m);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  }
  update(fitted: Set<string>, step: PlayStep | null, active: boolean) {
    this.cancel();
    this.animation = undefined;
    this.busy = false;
    this.fitted = new Set(fitted);
    this.current = step;
    this.active = active;
    if (!this.ready) return;
    this.staged.clear();
    this.stepBounds.makeEmpty();
    for (const id of step?.leafIds ?? [])
      this.stepBounds.union(this.pieces.get(id)!.bounds);
    if (step) {
      this.stepBounds.getCenter(this.target);
      for (const id of step.leafIds) {
        const part = this.pieces.get(id)!;
        const mesh = new THREE.Mesh(part.mesh.geometry, part.mesh.material);
        mesh.matrixAutoUpdate = false;
        mesh.matrix
          .makeTranslation(-this.target.x, -this.target.y, -this.target.z)
          .multiply(part.pose);
        this.staged.add(mesh);
      }
    }
    this.staged.visible = !!step && active;
    this.side = step?.side ?? this.side;
    this.reframe();
    this.emit();
  }
  boundsFor(ids: Iterable<string>) {
    const b = new THREE.Box3();
    for (const id of ids) {
      const p = this.pieces.get(id);
      if (p) b.union(p.bounds);
    }
    return b;
  }
  reframe = () => {
    if (!this.ready || this.drag || this.busy) return;
    const step = this.active ? this.current : null;
    const ids = step
      ? [...step.focusLeafIds, ...step.leafIds]
      : [...this.fitted];
    let bounds = this.boundsFor(ids);
    if (bounds.isEmpty()) bounds = this.boundsFor(this.manifest.initialLeafIds);
    const center = bounds.getCenter(new THREE.Vector3()),
      size = bounds.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z, step ? 3.5 : 25);
    const regionHeight = Math.max(
      80,
      this.frameRegion.bottom - this.frameRegion.top,
    );
    const distance =
      (span / (2 * Math.tan(THREE.MathUtils.degToRad(16.5)))) *
      Math.max(
        (this.host.clientHeight / regionHeight) * 1.18,
        (1.35 * this.host.clientHeight) / this.frameRegion.width,
      );
    const desiredY = (this.frameRegion.top + this.frameRegion.bottom) / 2;
    const worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(16.5));
    // Shift the view upward to leave the stage and controls clear on phones.
    const upSign = this.side === 'front' ? 1 : -1;
    this.camera.up.set(0, upSign, 0);
    const desiredX = this.frameRegion.left + this.frameRegion.width / 2;
    this.controls.target
      .copy(center)
      .add(
        new THREE.Vector3(
          (0.5 - desiredX / this.host.clientWidth) *
            worldHeight *
            this.camera.aspect,
          upSign * (desiredY / this.host.clientHeight - 0.5) * worldHeight,
          0,
        ),
      );
    this.camera.position
      .copy(this.controls.target)
      .add(
        new THREE.Vector3(0, 0, this.side === 'front' ? distance : -distance),
      );
    this.camera.lookAt(this.controls.target);
    this.camera.updateMatrixWorld();
    this.controls.update();
    this.presentContext();
    this.positionStage();
    this.invalidate();
  };
  presentContext() {
    const step = this.active ? this.current : null;
    const context = new Set(step?.contextLeafIds ?? this.fitted);
    for (const [id, p] of this.pieces)
      p.mesh.visible = this.fitted.has(id) && (!step || context.has(id));
    this.cutaway = !!step && [...this.fitted].some((id) => !context.has(id));
    // Remove only fitted surfaces between the viewer and this destination. This
    // presentation cutaway preserves endpoints and avoids invisible drop targets.
    if (step) {
      this.scene.updateMatrixWorld(true);
      const direction = this.target.clone().sub(this.camera.position),
        distance = direction.length();
      const ray = new THREE.Raycaster(
        this.camera.position,
        direction.normalize(),
        0,
        this.occlusionDistance(direction, distance),
      );
      const hits = ray.intersectObjects(
        [...this.pieces.values()]
          .filter((p) => p.mesh.visible)
          .map((p) => p.mesh),
        false,
      );
      for (const hit of hits) {
        hit.object.visible = false;
        this.cutaway = true;
      }
    }
  }
  occlusionDistance(direction: THREE.Vector3, distance: number) {
    const size = this.stepBounds.isEmpty()
      ? new THREE.Vector3()
      : this.stepBounds.getSize(new THREE.Vector3());
    const unit = direction.clone().normalize();
    const extent =
      (Math.abs(unit.x) * size.x +
        Math.abs(unit.y) * size.y +
        Math.abs(unit.z) * size.z) /
      2;
    return Math.max(0, distance - extent - 0.05);
  }
  cameraChanged = () => {
    if (this.dead) return;
    this.camera.updateMatrixWorld();
    if (!this.drag && !this.animation) this.positionStage();
    this.presentContext();
    this.invalidate();
  };
  stagePoint(): Point {
    const a = this.host.getBoundingClientRect(),
      b = this.stage.getBoundingClientRect();
    return {
      x: b.left + b.width / 2 - a.left,
      y: b.top + b.height / 2 - a.top,
    };
  }
  project(point: THREE.Vector3): Point {
    const p = point.clone().project(this.camera);
    return {
      x: ((p.x + 1) * this.host.clientWidth) / 2,
      y: ((1 - p.y) * this.host.clientHeight) / 2,
    };
  }
  planePoint(point: Point) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        (point.x / this.host.clientWidth) * 2 - 1,
        1 - (point.y / this.host.clientHeight) * 2,
      ),
      this.camera,
    );
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      this.camera.getWorldDirection(new THREE.Vector3()),
      this.target,
    );
    return (
      ray.ray.intersectPlane(plane, new THREE.Vector3()) ?? this.target.clone()
    );
  }
  positionStage(point = this.stagePoint(), scale?: number) {
    if (!this.current || !this.ready) return;
    if (scale === undefined) {
      const distance = this.camera.position.distanceTo(this.target);
      const mmPerPixel =
        (2 * distance * Math.tan(THREE.MathUtils.degToRad(16.5))) /
        this.host.clientHeight;
      const size = this.stepBounds.getSize(new THREE.Vector3());
      this.stageScale = THREE.MathUtils.clamp(
        (64 * mmPerPixel) / Math.max(size.x, size.y, size.z, 0.05),
        0.06,
        120,
      );
    }
    this.staged.position.copy(this.planePoint(point));
    this.staged.scale.setScalar(scale ?? this.stageScale);
  }
  point(event: PointerEvent): Point {
    const r = this.host.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  }
  pointerDown = (event: PointerEvent) => {
    if (
      !this.ready ||
      !this.active ||
      !this.current ||
      this.busy ||
      this.drag ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    const p = this.point(event),
      center = this.stagePoint();
    this.drag = {
      pointer: event.pointerId,
      grab: { x: p.x - center.x, y: p.y - center.y },
      position: center,
      start: p,
      moved: false,
    };
    this.controls.enabled = false;
    this.stage.setPointerCapture(event.pointerId);
    this.selected();
  };
  pointerMove = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    const p = this.point(event);
    this.drag.moved ||=
      Math.hypot(p.x - this.drag.start.x, p.y - this.drag.start.y) > 5;
    this.drag.position = dragCenter(p, this.drag.grab);
    const near = this.isNear(this.drag.position);
    this.destination.dataset.near = String(near);
    this.positionStage(
      near ? this.project(this.target) : this.drag.position,
      near ? 1 : this.stageScale,
    );
    this.invalidate();
  };
  isNear(point: Point) {
    return snapDrop({
      pointer: point,
      grabOffset: { x: 0, y: 0 },
      target: this.project(this.target),
    });
  }
  pointerUp = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.pointer) return;
    const drag = this.drag,
      p = this.point(event);
    const center = dragCenter(p, drag.grab);
    const valid = drag.moved && this.isNear(center);
    this.releaseCapture();
    if (valid) this.place();
    else this.animateToStage(drag.position);
  };
  releaseCapture() {
    const pointer = this.drag?.pointer;
    this.drag = undefined;
    if (pointer !== undefined && this.stage.hasPointerCapture(pointer))
      this.stage.releasePointerCapture(pointer);
    if (this.controls) this.controls.enabled = this.ready;
    this.destination.dataset.near = 'false';
  }
  cancel = () => {
    if (!this.drag) return;
    this.releaseCapture();
    this.positionStage();
    this.invalidate();
  };
  animateToStage(from: Point) {
    this.animate(
      from,
      this.stagePoint(),
      this.staged.scale.x,
      this.stageScale,
      () => {},
    );
  }
  animate(
    from: Point,
    to: Point,
    fromScale: number,
    toScale: number,
    complete: () => void,
  ) {
    this.busy = true;
    this.controls.enabled = false;
    this.animation = {
      start: performance.now(),
      from,
      to,
      fromScale,
      toScale,
      complete,
    };
    this.emit();
    this.invalidate();
  }
  place = () => {
    if (!this.ready || !this.active || !this.current || this.busy || this.drag)
      return;
    const id = this.current.id;
    this.animate(
      this.project(this.staged.position),
      this.project(this.target),
      this.staged.scale.x,
      1,
      () => this.placed(id),
    );
  };
  guide = () => {
    if (this.drag || this.busy) return;
    if (this.current) this.side = this.current.side;
    this.reframe();
  };
  flip = () => {
    if (this.drag || this.busy) return;
    this.side = this.side === 'front' ? 'back' : 'front';
    this.reframe();
  };
  stageKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.cancel();
      event.preventDefault();
    }
  };
  keyDown = (event: KeyboardEvent) => {
    if (this.drag || this.busy) {
      if (event.key === 'Escape') this.cancel();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.guide();
      return;
    }
    const delta = this.camera.position.clone().sub(this.controls.target),
      sphere = new THREE.Spherical().setFromVector3(delta);
    if (event.key === 'ArrowLeft') sphere.theta -= 0.12;
    else if (event.key === 'ArrowRight') sphere.theta += 0.12;
    else if (event.key === 'ArrowUp') sphere.phi -= 0.12;
    else if (event.key === 'ArrowDown') sphere.phi += 0.12;
    else if (event.key === '+' || event.key === '=') sphere.radius *= 0.9;
    else if (event.key === '-') sphere.radius *= 1.1;
    else return;
    event.preventDefault();
    sphere.makeSafe();
    this.camera.position
      .copy(this.controls.target)
      .add(new THREE.Vector3().setFromSpherical(sphere));
    this.controls.update();
  };
  layout = () => {
    if (this.dead) return;
    const root = this.host.parentElement,
      rect = this.host.getBoundingClientRect();
    const header = root
      ?.querySelector('.play-heading')
      ?.getBoundingClientRect();
    const dock = root
      ?.querySelector(this.active ? '.play-dock' : '.play-choice')
      ?.getBoundingClientRect();
    const top = (header?.bottom ?? 64) - rect.top + 18;
    const landscape = rect.height <= 550 && rect.width / rect.height >= 1.33;
    const bottom = landscape
      ? rect.height - 20
      : (dock?.top ?? rect.bottom - 160) - rect.top - 20;
    const width = landscape
      ? Math.max(120, (dock?.left ?? rect.right) - rect.left - 16)
      : rect.width;
    const stageHeight =
      this.stage.offsetHeight || (rect.width <= 600 ? 84 : 96);
    const stageY = bottom - stageHeight / 2 - 20;
    this.stage.style.top = `${stageY - stageHeight / 2}px`;
    this.stage.style.left = `${Math.max(stageHeight / 2 + 12, width * 0.22) - stageHeight / 2}px`;
    const region = {
      top,
      bottom:
        this.active && this.current ? stageY - stageHeight / 2 - 36 : bottom,
      left: 0,
      width,
    };
    const changed = Object.entries(region).some(
      ([key, value]) => Math.abs(value - this.frameRegion[key as keyof typeof region]) > 0.5,
    );
    this.frameRegion = region;
    // Observer delivery can follow a user's camera gesture. An unchanged layout
    // must not take camera ownership back from that gesture.
    if (changed) this.reframe();
    this.invalidate();
  };
  resize = () => {
    if (this.dead) return;
    this.cancel();
    const { clientWidth: w, clientHeight: h } = this.host;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.layout();
    this.invalidate();
  };
  motionChanged = () => this.invalidate();
  contextLost = (event: Event) => {
    event.preventDefault();
    this.contextUnavailable = true;
    this.cancel();
    this.animation = undefined;
    this.busy = false;
    this.ready = false;
    this.controls.enabled = false;
    this.error =
      'The 3D view was interrupted. Restoring it will keep your placed parts.';
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.emit();
  };
  contextRestored = () => {
    if (this.dead) return;
    try {
      this.makeEnvironment();
      this.contextUnavailable = false;
      this.ready = this.pieces.size === this.manifest.finalLeafIds.length;
      this.error = this.ready
        ? ''
        : this.error ||
          'The watch assets are incomplete. Retry to restore the assembly.';
      this.controls.enabled = this.ready;
      if (this.ready) this.update(this.fitted, this.current, this.active);
      this.invalidate();
      this.emit();
    } catch {
      this.ready = false;
      this.controls.enabled = false;
      this.error =
        'The 3D view could not be restored. Retry to keep assembling.';
      this.emit();
    }
  };
  invalidate = () => {
    if (!this.dead && !this.frame)
      this.frame = requestAnimationFrame(this.render);
  };
  render = (now: number) => {
    this.frame = 0;
    if (this.dead || this.contextUnavailable) return;
    if (this.animation) {
      const a = this.animation,
        t = this.media.matches ? 1 : Math.min(1, (now - a.start) / 220),
        eased = t * t * (3 - 2 * t);
      this.positionStage(
        {
          x: THREE.MathUtils.lerp(a.from.x, a.to.x, eased),
          y: THREE.MathUtils.lerp(a.from.y, a.to.y, eased),
        },
        THREE.MathUtils.lerp(a.fromScale, a.toScale, eased),
      );
      if (t === 1) {
        this.animation = undefined;
        this.busy = false;
        this.controls.enabled = this.ready;
        a.complete();
        this.emit();
      } else this.invalidate();
    }
    if (this.ready && this.active && this.current) {
      const p = this.project(this.target);
      this.destination.style.left = `${p.x}px`;
      this.destination.style.top = `${p.y}px`;
    }
    // React may have revealed/reflowed staging after the discrete update.
    if (!this.drag && !this.animation && !this.busy) this.positionStage();
    this.renderer.render(this.scene, this.camera);
    this.renderCount++;
  };
  /** Read-only diagnostics; placement tests use the same DOM pointer path as players. */
  inspect() {
    this.scene.updateMatrixWorld(true);
    const direction = this.target.clone().sub(this.camera.position);
    const ray = new THREE.Raycaster(
      this.camera.position,
      direction.clone().normalize(),
      0,
      this.occlusionDistance(direction, direction.length()),
    );
    const occluders = ray
      .intersectObjects(
        [...this.pieces.values()]
          .filter((p) => p.mesh.visible)
          .map((p) => p.mesh),
        false,
      )
      .map((h) => h.object.userData.partId);
    return {
      side: this.side,
      camera: this.camera.position.toArray(),
      occluders,
      ready: this.ready,
      stepId: this.current?.id,
      leafIds: this.current?.leafIds,
      fitted: [...this.fitted],
      visible: [...this.pieces]
        .filter(([, p]) => p.mesh.visible)
        .map(([id]) => id),
      target: this.project(this.target),
      stage: this.stagePoint(),
      stageRendered: this.project(this.staged.position),
      stageCount: this.staged.children.length,
      busy: this.busy,
      dragging: !!this.drag,
      controlsEnabled: this.controls.enabled,
      renderCount: this.renderCount,
      scheduledFrame: !!this.frame,
      geometryCount: this.pieces.size,
      cutaway: this.cutaway,
    };
  }
  dispose() {
    if (this.dead) return;
    this.dead = true;
    ++this.generation;
    this.releaseCapture();
    if (this.frame) cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.controls?.dispose();
    this.clearPieces();
    this.environment?.dispose();
    this.stage.removeEventListener('pointerdown', this.pointerDown);
    this.stage.removeEventListener('pointermove', this.pointerMove);
    this.stage.removeEventListener('pointerup', this.pointerUp);
    this.stage.removeEventListener('pointercancel', this.cancel);
    this.stage.removeEventListener('lostpointercapture', this.cancel);
    this.stage.removeEventListener('keydown', this.stageKeyDown);
    this.renderer.domElement.removeEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    this.renderer.domElement.removeEventListener(
      'webglcontextrestored',
      this.contextRestored,
    );
    this.renderer.domElement.removeEventListener('keydown', this.keyDown);
    this.media.removeEventListener('change', this.motionChanged);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
